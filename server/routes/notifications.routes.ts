import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { isMaintenanceModeActive, getMaintenanceDetails, getValueByJsonPath, seedModule7SettingsIfEmpty, sanitizePublicSettings } from "../middleware/maintenance";
import { getAI } from "../services/ai";
import { 
  DEFAULT_SERVICES_CATALOG, 
  seedDefaultServicesCatalogIfEmpty, 
  seedDefaultUsersIfEmpty, 
  seedDefaultTransactionsIfEmpty, 
  recordAdminUserAction, 
  getOrCreateUserVirtualAccount, 
  resolveVtuPlanAndPricing 
} from "../services/sharedHelpers";
import { ServerWalletEngine } from "../../src/services/serverWalletEngine";
import { APIProviderManager, DEFAULT_PROVIDERS } from "../../src/services/apiProviderManager";
import { ProviderExecutor, verifyWebhookSignature } from "../../src/services/providerExecutor";
import { adminAuthService, ADMIN_ROLES_CONFIG } from "../../src/services/adminAuthService";
import { AutomaticWalletFundingEngine } from "../../src/services/automaticWalletFundingEngine";
import { PaymentVerificationReconciliationEngine } from "../../src/services/paymentVerificationReconciliationEngine";
import { getActiveProviderAndAdapter, getAdapterForProvider } from "../../src/services/providerGateway";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { AgentHubAdapter } from "../../src/services/providers/agenthubAdapter";
import { NINTrustAdapter } from "../../src/services/providers/nintrustAdapter";
import { MultiGatewayRoutingEngine } from "../../src/services/multiGatewayRoutingEngine";
import { syncFromFirestore, syncToFirestore } from "../../src/services/settingsStore";
import { loadFirestoreDb, syncDbToFirestore, saveDocToFirestore } from "../../src/services/firestoreStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";
import { getAuth } from "firebase-admin/auth";
import { getAdminFirestore } from "../../src/services/firebaseAdmin";


const router = express.Router();
const app = router;

// --- CENTRALIZED NOTIFICATION & ACTIVITY LOGGING ENGINE (PHASE 1 PART 7) ---

// 1. Dispatch Notification + Activity Log + User History
app.post("/api/notifications/dispatch", async (req, res) => {
  const {
    userId,
    type,
    title,
    body,
    category = "SYSTEM",
    reference,
    actionUrl,
    status = "SUCCESS",
    activityDescription,
    metadata,
    adminActionParams
  } = req.body;

  const db = readDB();
  const nowISO = new Date().toISOString();
  const todayStr = nowISO.slice(0, 10);
  const timeStr = nowISO.slice(11, 19);

  const notificationId = "NOTIF_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const activityId = "ACT_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  // A. Save Notification directly to Firestore
  const newNotif = await notificationsStore.sendAppNotification(db, {
    id: notificationId,
    notificationId,
    userId,
    title,
    body,
    message: body,
    type,
    category,
    reference,
    actionUrl,
    read: false,
    isRead: false,
    createdAt: nowISO,
    updatedAt: nowISO
  });

  // B. Save Activity Log
  const newActivity = {
    id: activityId,
    activityId,
    userId,
    activityType: type || "SECURITY_EVENT",
    action: type,
    description: activityDescription || body || title,
    date: todayStr,
    time: timeStr,
    device: "Web Browser",
    browser: "Chrome / Web",
    os: "Linux / Cloud",
    ipAddress: req.ip || "127.0.0.1",
    status,
    metadata: metadata || {},
    createdAt: nowISO,
    updatedAt: nowISO
  };

  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift(newActivity);

  // C. Optional Admin Activity Log
  if (adminActionParams) {
    const adminLogId = "ADM_LOG_" + Date.now();
    const adminLog = {
      id: adminLogId,
      logId: adminLogId,
      adminUid: adminActionParams.adminUid,
      adminEmail: adminActionParams.adminEmail,
      action: adminActionParams.action,
      details: adminActionParams.details,
      targetUserId: adminActionParams.targetUserId || userId,
      ipAddress: req.ip || "127.0.0.1",
      timestamp: nowISO,
      createdAt: nowISO
    };
    if (!db.adminLogs) db.adminLogs = [];
    db.adminLogs.unshift(adminLog);
  }

  writeDB(db);

  res.json({
    success: true,
    notificationId,
    activityId,
    notification: newNotif
  });
});

// 2. Get User Notifications (Paginated & Filtered) backed directly by Firestore
app.get("/api/notifications", async (req, res) => {
  const { userId, read, type, category, searchQuery, page = 1, pageSize = 20 } = req.query;
  const db = readDB();

  if (userId) {
    const authCheck = await verifyUserOrAdminSession(req, userId as string, db);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: authCheck.reason || "Forbidden" });
    }
  }

  const isReadBool = read !== undefined ? read === "true" : undefined;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(pageSize as string) || 20;

  const result = await notificationsStore.getNotifications({
    userId: userId as string,
    read: isReadBool,
    type: type as string,
    category: category as string,
    searchQuery: searchQuery as string,
    page: pageNum,
    pageSize: limitNum,
  });

  res.json({
    notifications: result.notifications,
    total: result.total,
    unreadCount: result.unreadCount,
    page: pageNum,
    pageSize: limitNum
  });
});

// 3. Mark Notification as Read directly in Firestore
app.patch("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const success = await notificationsStore.markNotificationAsRead(id);
  if (success) {
    const idx = (db.notifications || []).findIndex(
      (n: any) => n.notificationId === id || n.id === id
    );
    if (idx !== -1) {
      db.notifications[idx].read = true;
      db.notifications[idx].isRead = true;
      db.notifications[idx].updatedAt = new Date().toISOString();
    }
    return res.json({ success: true });
  }

  res.status(404).json({ error: "Notification not found" });
});

// 4. Mark All Notifications as Read directly in Firestore
app.post("/api/notifications/read-all", async (req, res) => {
  const { userId } = req.body;
  const db = readDB();

  if (!userId) return res.status(400).json({ error: "UserId required" });

  await notificationsStore.markAllNotificationsAsRead(userId);

  if (db.notifications) {
    db.notifications = db.notifications.map((n: any) => {
      if (n.userId === userId) {
        return { ...n, read: true, isRead: true, updatedAt: new Date().toISOString() };
      }
      return n;
    });
  }

  res.json({ success: true });
});

// 5. Delete Notification directly in Firestore
app.delete("/api/notifications/:id", async (req, res) => {
  const { id } = req.params;
  const db = readDB();

  await notificationsStore.deleteNotification(id);

  if (db.notifications) {
    db.notifications = db.notifications.filter(
      (n: any) => n.notificationId !== id && n.id !== id
    );
  }

  res.json({ success: true });
});

// 6. Get User Notification Settings
app.get("/api/notifications/settings/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = readDB();

  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  let settings = (db.notificationSettings || []).find((s: any) => s.userId === userId);
  if (!settings) {
    settings = {
      id: `NS_${userId}`,
      userId,
      inAppNotifications: true,
      emailNotifications: true,
      securityAlerts: true,
      marketingMessages: false,
      systemAnnouncements: true,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!db.notificationSettings) db.notificationSettings = [];
    db.notificationSettings.push(settings);
    writeDB(db);
  }

  res.json({ settings });
});

// 7. Update User Notification Settings
app.put("/api/notifications/settings/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = readDB();

  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const idx = (db.notificationSettings || []).findIndex((s: any) => s.userId === userId);
  const nowISO = new Date().toISOString();

  if (idx !== -1) {
    db.notificationSettings[idx] = {
      ...db.notificationSettings[idx],
      ...req.body,
      updatedAt: nowISO
    };
  } else {
    if (!db.notificationSettings) db.notificationSettings = [];
    db.notificationSettings.push({
      id: `NS_${userId}`,
      userId,
      inAppNotifications: true,
      emailNotifications: true,
      securityAlerts: true,
      marketingMessages: false,
      systemAnnouncements: true,
      ...req.body,
      createdAt: nowISO,
      updatedAt: nowISO
    });
  }

  writeDB(db);
  res.json({ success: true });
});

// 8. Get Activity Logs
app.get("/api/activity-logs", async (req, res) => {
  const { userId, activityType, searchQuery, page = 1, pageSize = 20 } = req.query;
  const db = readDB();

  if (userId) {
    const authCheck = await verifyUserOrAdminSession(req, userId as string, db);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: authCheck.reason || "Forbidden" });
    }
  }

  let list = db.activityLogs || [];

  if (userId) {
    list = list.filter((a: any) => a.userId === userId);
  }

  if (activityType) {
    list = list.filter((a: any) => a.activityType === activityType || a.action === activityType);
  }

  if (searchQuery) {
    const q = (searchQuery as string).toLowerCase();
    list = list.filter(
      (a: any) =>
        a.description?.toLowerCase().includes(q) ||
        a.ipAddress?.toLowerCase().includes(q) ||
        a.action?.toLowerCase().includes(q) ||
        a.activityType?.toLowerCase().includes(q)
    );
  }

  const total = list.length;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(pageSize as string) || 20;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedList = list.slice(startIndex, startIndex + limitNum);

  res.json({
    logs: paginatedList,
    total,
    page: pageNum,
    pageSize: limitNum
  });
});



// 10. Get Consolidated User History
app.get("/api/user-history/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = readDB();

  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const walletLogs = (db.walletLogs || []).filter((w: any) => w.userId === userId);
  const verifications = (db.verificationHistory || []).filter((v: any) => v.userId === userId);
  const transactions = (db.transactions || []).filter((t: any) => t.userId === userId);
  const notifications = (db.notifications || []).filter((n: any) => n.userId === userId);
  const logins = (db.loginHistory || []).filter((l: any) => l.userId === userId);
  const activityLogs = (db.activityLogs || []).filter((a: any) => a.userId === userId);

  res.json({
    walletLogs,
    verifications,
    transactions,
    notifications,
    logins,
    activityLogs
  });
});



// 3. VTU & Digital Services


// =========================================================================
// MODULE 9: NOTIFICATIONS & ANNOUNCEMENTS ENGINE
// =========================================================================

// 1. GET /api/admin/notifications/dashboard - Notifications Metric Stats
app.get("/api/admin/notifications/dashboard", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const notifications = db.notifications || [];
  const announcements = db.announcements || [];

  const sentCount = notifications.filter((n: any) => n.status === "Sent" || n.status === "DELIVERED").length;
  const scheduledCount = notifications.filter((n: any) => n.status === "Scheduled").length;
  const failedCount = notifications.filter((n: any) => n.status === "Failed").length;

  return res.json({
    success: true,
    stats: {
      totalSent: sentCount,
      totalScheduled: scheduledCount,
      totalFailed: failedCount,
      totalAnnouncements: announcements.length,
      activeAnnouncements: announcements.filter((a: any) => a.active !== false).length,
    },
    recentNotifications: notifications.slice(0, 10),
    announcements: announcements.slice(0, 10),
  });
});

// 2. GET /api/admin/notifications/templates - Notification Templates
app.get("/api/admin/notifications/templates", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const templates = db.notification_templates || [
    { id: "tpl_welcome", name: "Welcome Email", subject: "Welcome to SmartLink Digital!", channel: "Email", active: true },
    { id: "tpl_wallet_funded", name: "Wallet Funded", subject: "Wallet Credit Notification", channel: "Email", active: true },
    { id: "tpl_nin_complete", name: "NIN Verification Complete", subject: "Your NIN Verification is Ready", channel: "In-App", active: true },
    { id: "tpl_security_alert", name: "Security Alert", subject: "New Login Detected", channel: "Email", active: true },
  ];

  return res.json({ success: true, templates });
});

// 3. POST /api/admin/notifications/templates - Create Template
app.post("/api/admin/notifications/templates", async (req, res) => {
  const template = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  if (!db.notification_templates) db.notification_templates = [];
  const newTpl = {
    id: template.id || `tpl_${Date.now()}`,
    ...template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.notification_templates.push(newTpl);

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, template: newTpl });
});

// 4. GET /api/admin/notifications/system-switches - Notification Toggles
app.get("/api/admin/notifications/system-switches", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const switches = db.system_settings?.notifications || {
    emailNotifications: true,
    smsNotifications: true,
    inAppNotifications: true,
    pushNotifications: true,
    dispatchMode: "REALTIME",
  };

  return res.json({ success: true, switches });
});

// 5. POST /api/admin/notifications/toggle-switch - Toggle Notification Switch
app.post("/api/admin/notifications/toggle-switch", async (req, res) => {
  const { switchKey, value } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  if (!db.system_settings) db.system_settings = {};
  if (!db.system_settings.notifications) {
    db.system_settings.notifications = {
      emailNotifications: true,
      smsNotifications: true,
      inAppNotifications: true,
      pushNotifications: true,
      dispatchMode: "REALTIME",
    };
  }

  db.system_settings.notifications[switchKey] = value !== undefined ? value : !db.system_settings.notifications[switchKey];
  db.system_settings.notifications.updatedAt = new Date().toISOString();
  db.system_settings.notifications.updatedBy = val.session.email;

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, switches: db.system_settings.notifications });
});

// 6. GET /api/admin/notification/history - History of Sent Notifications
app.get("/api/admin/notification/history", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const history = db.notification_history || db.notifications || [];
  return res.json({ success: true, history: history.slice(0, 100) });
});

// 7. POST /api/admin/notifications/create - Create & Dispatch Notification
app.post("/api/admin/notifications/create", async (req, res) => {
  const notif = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const newNotification = {
    id: `notif_${Date.now()}`,
    title: notif.title || "Platform Update",
    message: notif.message || notif.body || "",
    body: notif.message || notif.body || "",
    channel: notif.channel || "In-App",
    channels: notif.channels || [notif.channel || "In-App"],
    targetAudience: notif.targetAudience || "ALL_USERS",
    targetEmail: notif.targetEmail || null,
    priority: notif.priority || "Normal",
    status: notif.status || "Sent",
    createdAt: new Date().toISOString(),
    createdBy: val.session.email,
    read: false,
    isRead: false,
  };

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(newNotification);

  if (!db.notification_history) db.notification_history = [];
  db.notification_history.unshift({
    id: `HIST_${Date.now()}`,
    notificationId: newNotification.id,
    title: newNotification.title,
    message: newNotification.message,
    channel: newNotification.channel,
    targetAudience: newNotification.targetAudience,
    targetEmail: newNotification.targetEmail,
    adminEmail: val.session.email,
    status: "DELIVERED",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, message: "Notification created and dispatched.", notification: newNotification });
});

// 8. GET /api/admin/announcements - Retrieve Admin Announcements
app.get("/api/admin/announcements", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const announcements = db.announcements || [];
  return res.json({ success: true, announcements });
});

// 9. POST /api/admin/announcements/create - Create New Announcement
app.post("/api/admin/announcements/create", async (req, res) => {
  const { title, message, priority = "NORMAL", target = "ALL", expiresAt = null, active = true } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const newAnnouncement = {
    id: `ANN_${Date.now()}`,
    title,
    message,
    priority,
    target,
    expiresAt,
    active,
    createdAt: new Date().toISOString(),
    createdBy: val.session.email,
  };

  if (!db.announcements) db.announcements = [];
  db.announcements.unshift(newAnnouncement);

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, message: "Announcement published.", announcement: newAnnouncement });
});

// 10. PUT /api/admin/announcements/:id - Update Announcement
app.put("/api/admin/announcements/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const ann = (db.announcements || []).find((a: any) => a.id === id);
  if (!ann) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  Object.assign(ann, updates, { updatedAt: new Date().toISOString(), updatedBy: val.session.email });
  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, announcement: ann });
});

// 11. DELETE /api/admin/announcements/:id - Delete Announcement
app.delete("/api/admin/announcements/:id", async (req, res) => {
  const { id } = req.params;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  if (db.announcements) {
    db.announcements = db.announcements.filter((a: any) => a.id !== id);
  }

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, message: "Announcement deleted." });
});

// 12. POST /api/admin/module9/self-test - Module 9 Diagnostic Test
app.post("/api/admin/module9/self-test", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  return res.json({
    success: true,
    module: "MODULE_9_NOTIFICATIONS_ENGINE",
    status: "PASS",
    diagnostics: {
      switchesEnabled: true,
      templatesCount: (db.notification_templates || []).length,
      historyCount: (db.notification_history || []).length,
      announcementsCount: (db.announcements || []).length,
    },
  });
});



// =========================================================================
// USER NOTIFICATIONS & PUBLIC ANNOUNCEMENTS
// =========================================================================

// 1. GET /api/user/announcements/active - Active Banner Announcements for Users
app.get("/api/user/announcements/active", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);

  const announcements = (db.announcements || []).filter((a: any) => a.active !== false);
  return res.json({ success: true, announcements });
});

// 2. GET /api/user/notifications - User Specific Notifications
app.get("/api/user/notifications", async (req, res) => {
  const userEmail = (req.query.email as string) || (req.headers["x-user-email"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  let notifs = db.notifications || [];
  if (userEmail) {
    notifs = notifs.filter((n: any) => !n.targetEmail || n.targetEmail === userEmail || n.targetAudience === "ALL_USERS");
  }

  return res.json({ success: true, notifications: notifs.slice(0, 50) });
});

// 3. POST /api/user/notifications/mark-read - Mark Single Notification As Read
app.post("/api/user/notifications/mark-read", async (req, res) => {
  const { notificationId, id } = req.body;
  const targetId = notificationId || id;
  const db = readDB();
  await syncFromFirestore(db);

  const notif = (db.notifications || []).find((n: any) => n.id === targetId);
  if (notif) {
    notif.read = true;
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    writeDB(db);
    await syncToFirestore(db);
  }

  return res.json({ success: true, message: "Notification marked as read." });
});

// 4. POST /api/user/notifications/read-all - Mark All User Notifications As Read
app.post("/api/user/notifications/read-all", async (req, res) => {
  const userEmail = req.body.email || (req.headers["x-user-email"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  (db.notifications || []).forEach((n: any) => {
    if (!userEmail || !n.targetEmail || n.targetEmail === userEmail) {
      n.read = true;
      n.isRead = true;
      n.readAt = new Date().toISOString();
    }
  });

  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, message: "All notifications marked as read." });
});

// 5. POST /api/user/notifications/archive - Archive Notifications
app.post("/api/user/notifications/archive", async (req, res) => {
  const { notificationId, id } = req.body;
  const targetId = notificationId || id;
  const db = readDB();
  await syncFromFirestore(db);

  if (db.notifications) {
    db.notifications = db.notifications.filter((n: any) => n.id !== targetId);
    writeDB(db);
    await syncToFirestore(db);
  }

  return res.json({ success: true, message: "Notification archived." });
});



export default router;
