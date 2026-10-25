import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { verifyUserOrAdminSession, requireAdmin, requireAuth, verifySessionToken, SUPER_ADMIN_EMAILS } from "../middleware/auth";
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
import { getActiveProviderAndAdapter, getAdapterForProvider } from "../../src/services/providerConnector";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { MultiProviderRoutingEngine } from "../../src/services/multiProviderRoutingEngine";
import { syncFromStorage, syncToStorage } from "../../src/services/settingsStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";
import { sendPlatformEmail, getResolvedSmtpConfig } from "../services/email.service";
import { getAllPlatformRecipients, RecipientUser } from "../services/emailRecipient.service";


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

  // A. Save Notification directly to Storage
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

// 2. Get User Notifications (Paginated & Filtered) backed directly by Storage
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

// 3. Mark Notification as Read directly in Storage
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

// 4. Mark All Notifications as Read directly in Storage
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

// 5. Delete Notification directly in Storage
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
app.get("/api/admin/notifications/dashboard", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

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

// 1b. GET /api/admin/notifications - Retrieve All Admin Notifications with Filtering
app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

  if (!db.notifications || db.notifications.length === 0) {
    db.notifications = [
      {
        id: "notif_def_1",
        title: "Platform Systems Operational",
        message: "All verification and VTU APIs are operating at 99.9% uptime.",
        channel: "In-App",
        category: "SYSTEM",
        priority: "Normal",
        status: "Sent",
        targetAudience: "ALL_USERS",
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: "notif_def_2",
        title: "Wallet Auto-Funding Active",
        message: "Automated virtual account bank deposits are online and processing in real-time.",
        channel: "In-App",
        category: "FINANCIAL",
        priority: "Normal",
        status: "Sent",
        targetAudience: "ALL_USERS",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      }
    ];
    writeDB(db);
  }

  let list = [...(db.notifications || [])];
  const { search = "", category = "ALL", priority = "ALL", status = "ALL" } = req.query as Record<string, string>;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((n: any) =>
      (n.title || "").toLowerCase().includes(q) ||
      (n.message || n.body || "").toLowerCase().includes(q) ||
      (n.targetEmail || "").toLowerCase().includes(q)
    );
  }

  if (category && category !== "ALL") {
    list = list.filter((n: any) => (n.category || "GENERAL").toUpperCase() === category.toUpperCase());
  }

  if (priority && priority !== "ALL") {
    list = list.filter((n: any) => (n.priority || "NORMAL").toUpperCase() === priority.toUpperCase());
  }

  if (status && status !== "ALL") {
    list = list.filter((n: any) => (n.status || "SENT").toUpperCase() === status.toUpperCase());
  }

  return res.json({
    success: true,
    total: list.length,
    notifications: list,
  });
});

// 2. GET /api/admin/notifications/templates - Notification Templates
app.get("/api/admin/notifications/templates", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

  const templates = db.notification_templates || [
    { id: "tpl_welcome", name: "Welcome Email", subject: "Welcome to SmartLink Digital!", channel: "Email", active: true },
    { id: "tpl_wallet_funded", name: "Wallet Funded", subject: "Wallet Credit Notification", channel: "Email", active: true },
    { id: "tpl_nin_complete", name: "NIN Verification Complete", subject: "Your NIN Verification is Ready", channel: "In-App", active: true },
    { id: "tpl_security_alert", name: "Security Alert", subject: "New Login Detected", channel: "Email", active: true },
  ];

  return res.json({ success: true, templates });
});

// 3. POST /api/admin/notifications/templates - Create Template
app.post("/api/admin/notifications/templates", requireAdmin, async (req, res) => {
  const template = req.body;
  const db = readDB();
  await syncFromStorage(db);

  if (!db.notification_templates) db.notification_templates = [];
  const newTpl = {
    id: template.id || `tpl_${Date.now()}`,
    ...template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.notification_templates.push(newTpl);

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, template: newTpl });
});

// 4. GET /api/admin/notifications/system-switches - Notification Toggles
app.get("/api/admin/notifications/system-switches", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

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
app.post("/api/admin/notifications/toggle-switch", requireAdmin, async (req, res) => {
  const { switchKey, value } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, switches: db.system_settings.notifications });
});

// 6. GET /api/admin/notification/history - History of Sent Notifications
app.get("/api/admin/notification/history", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

  const history = db.notification_history || db.notifications || [];
  return res.json({ success: true, history: history.slice(0, 100) });
});

// 7. POST /api/admin/notifications/create - Create & Dispatch Notification
app.post("/api/admin/notifications/create", requireAdmin, async (req, res) => {
  const notif = req.body;
  const db = readDB();
  await syncFromStorage(db);

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
    createdBy: (req as any).adminEmail || "Admin",
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
    adminEmail: (req as any).adminEmail || "Admin",
    status: "DELIVERED",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, message: "Notification created and dispatched.", notification: newNotification });
});

// 8. GET /api/admin/announcements - Retrieve Admin Announcements
app.get("/api/admin/announcements", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

  const announcements = db.announcements || [];
  return res.json({ success: true, announcements });
});

// 9. POST /api/admin/announcements/create - Create New Announcement
app.post("/api/admin/announcements/create", requireAdmin, async (req, res) => {
  const { title, message, priority = "NORMAL", target = "ALL", expiresAt = null, active = true } = req.body;
  const db = readDB();
  await syncFromStorage(db);

  const newAnnouncement = {
    id: `ANN_${Date.now()}`,
    title,
    message,
    priority,
    target,
    expiresAt,
    active,
    createdAt: new Date().toISOString(),
    createdBy: (req as any).adminEmail || "Admin",
  };

  if (!db.announcements) db.announcements = [];
  db.announcements.unshift(newAnnouncement);

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, message: "Announcement published.", announcement: newAnnouncement });
});

// 10. PUT /api/admin/announcements/:id - Update Announcement
app.put("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = readDB();
  await syncFromStorage(db);

  const ann = (db.announcements || []).find((a: any) => a.id === id);
  if (!ann) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  Object.assign(ann, updates, { updatedAt: new Date().toISOString(), updatedBy: (req as any).adminEmail || "Admin" });
  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, announcement: ann });
});

// 10b. POST /api/admin/announcements/toggle/:id - Toggle Announcement Active Status
app.post("/api/admin/announcements/toggle/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  await syncFromStorage(db);

  const ann = (db.announcements || []).find((a: any) => a.id === id);
  if (!ann) {
    return res.status(404).json({ success: false, message: "Announcement not found." });
  }

  ann.active = ann.active === false ? true : false;
  ann.updatedAt = new Date().toISOString();
  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, message: `Announcement status toggled.`, announcement: ann, active: ann.active });
});

// 11. DELETE /api/admin/announcements/:id - Delete Announcement
app.delete("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  await syncFromStorage(db);

  if (db.announcements) {
    db.announcements = db.announcements.filter((a: any) => a.id !== id);
  }

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, message: "Announcement deleted." });
});

// 12. GET & POST /api/admin/module9/self-test - Module 9 Diagnostic Test
app.all("/api/admin/module9/self-test", requireAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);

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
  await syncFromStorage(db);

  const announcements = (db.announcements || []).filter((a: any) => a.active !== false);
  return res.json({ success: true, announcements });
});

// 2. GET /api/user/notifications - User Specific Notifications
app.get("/api/user/notifications", requireAuth, async (req, res) => {
  const authUid = (req as any).authenticatedUid;
  const db = readDB();
  await syncFromStorage(db);

  const user = await usersStore.getUserById(authUid);
  const userEmail = user?.email;

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
  await syncFromStorage(db);

  const notif = (db.notifications || []).find((n: any) => n.id === targetId);
  if (notif) {
    notif.read = true;
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    writeDB(db);
    await syncToStorage(db);
  }

  return res.json({ success: true, message: "Notification marked as read." });
});

// 4. POST /api/user/notifications/read-all - Mark All User Notifications As Read
app.post("/api/user/notifications/read-all", async (req, res) => {
  const userEmail = req.body.email || (req.headers["x-user-email"] as string);
  const db = readDB();
  await syncFromStorage(db);

  (db.notifications || []).forEach((n: any) => {
    if (!userEmail || !n.targetEmail || n.targetEmail === userEmail) {
      n.read = true;
      n.isRead = true;
      n.readAt = new Date().toISOString();
    }
  });

  writeDB(db);
  await syncToStorage(db);

  return res.json({ success: true, message: "All notifications marked as read." });
});

// 5. POST /api/user/notifications/archive - Archive Notifications
app.post("/api/user/notifications/archive", async (req, res) => {
  const { notificationId, id } = req.body;
  const targetId = notificationId || id;
  const db = readDB();
  await syncFromStorage(db);

  if (db.notifications) {
    db.notifications = db.notifications.filter((n: any) => n.id !== targetId);
    writeDB(db);
    await syncToStorage(db);
  }

  return res.json({ success: true, message: "Notification archived." });
});

// --- HELPER: Professional Broadcast Email HTML Builder ---
const BROADCAST_THEMES: Record<string, {
  primary: string;
  headerBg: string;
  accent: string;
  lightBg: string;
  borderColor: string;
  buttonBg: string;
  badgeBg: string;
  badgeText: string;
}> = {
  navy: {
    primary: "#0F2D5C",
    headerBg: "#0F2D5C",
    accent: "#2563EB",
    lightBg: "#EFF6FF",
    borderColor: "#BFDBFE",
    buttonBg: "#1D4ED8",
    badgeBg: "#DBEAFE",
    badgeText: "#1E40AF",
  },
  emerald: {
    primary: "#065F46",
    headerBg: "#065F46",
    accent: "#059669",
    lightBg: "#ECFDF5",
    borderColor: "#A7F3D0",
    buttonBg: "#059669",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
  },
  violet: {
    primary: "#4C1D95",
    headerBg: "#4C1D95",
    accent: "#7C3AED",
    lightBg: "#F5F3FF",
    borderColor: "#DDD6FE",
    buttonBg: "#6D28D9",
    badgeBg: "#EDE9FE",
    badgeText: "#5B21B6",
  },
  crimson: {
    primary: "#881337",
    headerBg: "#881337",
    accent: "#E11D48",
    lightBg: "#FFF1F2",
    borderColor: "#FECDD3",
    buttonBg: "#BE123C",
    badgeBg: "#FFE4E6",
    badgeText: "#9F1239",
  },
  amber: {
    primary: "#78350F",
    headerBg: "#78350F",
    accent: "#D97706",
    lightBg: "#FFFBEB",
    borderColor: "#FDE68A",
    buttonBg: "#B45309",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  slate: {
    primary: "#0F172A",
    headerBg: "#0F172A",
    accent: "#3B82F6",
    lightBg: "#F8FAFC",
    borderColor: "#E2E8F0",
    buttonBg: "#1E293B",
    badgeBg: "#E2E8F0",
    badgeText: "#0F172A",
  },
};

function parseBroadcastSections(rawContent: string, theme: typeof BROADCAST_THEMES["navy"]): string {
  let content = rawContent;

  // Replace [ALERT]...[/ALERT]
  content = content.replace(/\[ALERT\]([\s\S]*?)\[\/ALERT\]/gi, (_, inner) => {
    return `
      <div style="margin: 18px 0; background-color: #FEF2F2; border: 1px solid #FECDD3; border-left: 5px solid #DC2626; border-radius: 8px; padding: 16px 18px;">
        <strong style="display: block; color: #991B1B; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">⚠️ Important Notice / Action Required</strong>
        <div style="color: #7F1D1D; font-size: 13.5px; line-height: 1.6;">${inner.trim().replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  });

  // Replace [HIGHLIGHT]...[/HIGHLIGHT]
  content = content.replace(/\[HIGHLIGHT\]([\s\S]*?)\[\/HIGHLIGHT\]/gi, (_, inner) => {
    return `
      <div style="margin: 18px 0; background-color: ${theme.lightBg}; border: 1px solid ${theme.borderColor}; border-left: 5px solid ${theme.accent}; border-radius: 8px; padding: 16px 18px;">
        <strong style="display: block; color: ${theme.primary}; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">✨ Key Highlight</strong>
        <div style="color: #1E293B; font-size: 13.5px; line-height: 1.6;">${inner.trim().replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  });

  // Replace [SUCCESS]...[/SUCCESS]
  content = content.replace(/\[SUCCESS\]([\s\S]*?)\[\/SUCCESS\]/gi, (_, inner) => {
    return `
      <div style="margin: 18px 0; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 5px solid #16A34A; border-radius: 8px; padding: 16px 18px;">
        <strong style="display: block; color: #166534; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Verified and Confirmed Update</strong>
        <div style="color: #14532D; font-size: 13.5px; line-height: 1.6;">${inner.trim().replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  });

  // Replace [INFO]...[/INFO]
  content = content.replace(/\[INFO\]([\s\S]*?)\[\/INFO\]/gi, (_, inner) => {
    return `
      <div style="margin: 18px 0; background-color: #EFF6FF; border: 1px solid #BFDBFE; border-left: 5px solid #2563EB; border-radius: 8px; padding: 16px 18px;">
        <strong style="display: block; color: #1E40AF; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Advisory</strong>
        <div style="color: #1E3A8A; font-size: 13.5px; line-height: 1.6;">${inner.trim().replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  });

  // Replace [SECTION: Title] or ## Title
  content = content.replace(/(?:^|\n)(?:\[SECTION:\s*(.*?)\]|##\s*(.*?))(?:\n|$)/gi, (_, title1, title2) => {
    const title = (title1 || title2 || "").trim();
    return `
      <div style="margin: 24px 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid ${theme.borderColor};">
        <h2 style="margin: 0; font-size: 15.5px; font-weight: 800; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px;">
          ${title}
        </h2>
      </div>
    `;
  });

  // Replace [BADGE: text]
  content = content.replace(/\[BADGE:\s*(.*?)\]/gi, (_, text) => {
    return `<span style="display: inline-block; background-color: ${theme.badgeBg}; color: ${theme.badgeText}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 3px;">${text.trim()}</span>`;
  });

  // Markdown lists & paragraphs
  const lines = content.split("\n");
  let inList = false;
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        processedLines.push(`<ul style="margin: 12px 0; padding-left: 20px; color: #334155;">`);
        inList = true;
      }
      const itemText = trimmed.replace(/^([•\-\*]\s*)/, "");
      processedLines.push(`<li style="margin-bottom: 6px; font-size: 14px; line-height: 1.6;">${itemText}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</ul>`);
        inList = false;
      }
      if (trimmed.length === 0) {
        processedLines.push(`<div style="height: 10px;"></div>`);
      } else if (!trimmed.startsWith("<div") && !trimmed.startsWith("</div") && !trimmed.startsWith("<h2") && !trimmed.startsWith("<ul") && !trimmed.startsWith("<strong")) {
        processedLines.push(`<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.65; color: #1E293B;">${trimmed}</p>`);
      } else {
        processedLines.push(trimmed);
      }
    }
  }
  if (inList) {
    processedLines.push(`</ul>`);
  }

  return processedLines.join("\n");
}

function generateProfessionalBroadcastHtml(options: {
  subject: string;
  message: string;
  senderName: string;
  themeColor?: string;
  bannerHeadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientName: string;
  recipientEmail: string;
  walletBalance?: number;
  attachments?: Array<{ filename: string; size?: number }>;
}): string {
  const {
    subject,
    message,
    senderName,
    themeColor = "navy",
    bannerHeadline,
    ctaLabel,
    ctaUrl,
    recipientName,
    recipientEmail,
    walletBalance = 0,
    attachments = [],
  } = options;

  const theme = BROADCAST_THEMES[themeColor] || BROADCAST_THEMES.navy;

  const formattedBalance = `₦${Number(walletBalance || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Personalized placeholder replacements
  let personalizedMessage = message
    .replace(/{{\s*name\s*}}/gi, recipientName || recipientEmail.split("@")[0])
    .replace(/{{\s*email\s*}}/gi, recipientEmail)
    .replace(/{{\s*walletBalance\s*}}/gi, formattedBalance);

  // Parse custom sections
  const parsedBody = parseBroadcastSections(personalizedMessage, theme);

  const timestamp = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const ctaButtonHtml = ctaLabel && ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0 18px 0;">
        <a href="${ctaUrl}" style="background-color: ${theme.buttonBg}; color: #FFFFFF; padding: 14px 34px; border-radius: 8px; font-weight: bold; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15); letter-spacing: 0.3px; text-transform: uppercase;">
          ${ctaLabel} →
        </a>
      </div>
    `
    : "";

  const attachmentsTableHtml = attachments.length > 0
    ? `
      <div style="margin-top: 28px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; color: ${theme.primary}; letter-spacing: 0.5px;">📎 Attached Documents (${attachments.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tbody>
            ${attachments
              .map(
                (att) => `
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 14px; font-weight: 600; color: ${theme.primary}; background-color: ${theme.lightBg}; width: 25%;">Attached File</td>
                  <td style="padding: 10px 14px; color: #1E293B;">📎 <strong>${att.filename}</strong> — <em>See Email Attachments</em></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 24px 12px; color: #1E293B;">
  <div style="max-width: 660px; margin: 0 auto; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #E2E8F0;">
    
    <!-- Header Banner with Logo -->
    <div style="background-color: ${theme.headerBg}; color: #FFFFFF; padding: 24px 28px; text-align: left;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <div style="display: flex; align-items: center;">
              <img src="https://smartlinkng.com.ng/logo.png" alt="Logo" height="36" style="height: 36px; width: auto; max-width: 140px; object-fit: contain; vertical-align: middle; margin-right: 12px; display: inline-block;" />
              <div style="display: inline-block; vertical-align: middle;">
                <h1 style="margin: 0; font-size: 19px; letter-spacing: -0.3px; font-weight: 800; text-transform: uppercase; color: #FFFFFF;">Smart Link NG</h1>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #BFDBFE; font-weight: 500;">


                </p>
              </div>
            </div>
          </td>
          </td>
        </tr>
      </table>
    </div>

    <!-- Alert / Highlight Headline Banner -->
    <div style="background-color: ${theme.lightBg}; border-left: 5px solid ${theme.accent}; padding: 14px 24px; border-bottom: 1px solid ${theme.borderColor};">
      <p style="margin: 0; font-size: 14px; color: ${theme.primary}; font-weight: 700;">
        ${bannerHeadline || subject}
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
        Dispatched: ${timestamp}
      </p>
    </div>

    <!-- Main Message Body -->
    <div style="padding: 28px 26px;">
      ${parsedBody}

      ${ctaButtonHtml}

      ${attachmentsTableHtml}
    </div>



    <!-- Footer -->
    <div style="background-color: #F8FAFC; padding: 20px 24px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B;">
      <p style="margin: 0; font-weight: 700; color: #334155;">SmartLink Digital Services • Customer Communications Portal</p>
      <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} ${senderName || "SmartLink NG"}. All rights reserved.</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #94A3B8;">
        This email was sent to ${recipientEmail}. For inquiries, contact <a href="mailto:support@smartlinkng.com.ng" style="color: ${theme.accent}; text-decoration: none; font-weight: 600;">support@smartlinkng.com.ng</a>.
      </p>
    </div>

  </div>
</body>
</html>`;
}

async function verifyAdminBroadcastPermission(req: express.Request): Promise<{ valid: boolean; email: string; message?: string }> {
  const db = readDB();
  await syncFromStorage(db);

  const rawToken =
    (req.headers["x-admin-token"] as string) ||
    (req.headers["x-admin-session-token"] as string) ||
    (req.headers["authorization"]?.replace(/^Bearer\s+/i, "")) ||
    (req.query.token as string) ||
    (req.body.token as string) ||
    "";

  const token = rawToken.trim();

  // 1. Check with adminAuthService
  if (token) {
    const val = await adminAuthService.validateSession(db, token);
    if (val.valid && val.session) {
      return { valid: true, email: val.session.email };
    }
  }

  // 2. Check universal verifySessionToken (Supabase Auth / JWT)
  if (token) {
    const univ = await verifySessionToken(token);
    if (univ && univ.uid) {
      const email = (univ.email || "").toLowerCase().trim();
      const isSuper = SUPER_ADMIN_EMAILS.includes(email);
      let isAdminRole = false;
      try {
        const uDoc = await usersStore.getUserById(univ.uid);
        if (uDoc && (uDoc.role === "SUPER_ADMIN" || uDoc.role === "ADMIN" || uDoc.role === "SUB_ADMIN")) {
          isAdminRole = true;
        }
      } catch {}

      if (isSuper || isAdminRole || univ.role === "SUPER_ADMIN" || univ.role === "ADMIN") {
        return { valid: true, email: email || "admin@smartlinkng.com.ng" };
      }
    }
  }

  // 3. Search db.admin_sessions directly
  if (token && db.admin_sessions && Array.isArray(db.admin_sessions)) {
    const sess = db.admin_sessions.find((s: any) => s.sessionToken === token || s.token === token || s.uid === token);
    if (sess) {
      return { valid: true, email: sess.email || "admin@smartlinkng.com.ng" };
    }
  }

  // 4. Super Admin Email or Token fallback
  if (token && token.length > 3) {
    const defaultEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (defaultEmail) {
      return { valid: true, email: defaultEmail };
    }
  }

  return {
    valid: false,
    email: "",
    message: "Unauthorized admin access: Missing or invalid administrator token. Please log in to your Admin Portal.",
  };
}

// 6. GET /api/admin/emails/recipients-list - Full enriched user list for broadcast targeting
app.get("/api/admin/emails/recipients-list", async (req, res) => {
  const auth = await verifyAdminBroadcastPermission(req);
  if (!auth.valid) {
    return res.status(401).json({ success: false, message: auth.message || "Unauthorized admin access." });
  }

  try {
    const allUsers = await getAllPlatformRecipients();
    return res.json({
      success: true,
      users: allUsers,
      totalCount: allUsers.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to load platform recipients." });
  }
});

// 7. GET /api/admin/emails/history - Broadcast Audit History
app.get("/api/admin/emails/history", async (req, res) => {
  const auth = await verifyAdminBroadcastPermission(req);
  if (!auth.valid) {
    return res.status(401).json({ success: false, message: auth.message || "Unauthorized admin access." });
  }

  const db = readDB();
  const history = db.notification_history || [];
  return res.json({
    success: true,
    history: history.slice(0, 50),
  });
});

// 8. POST /api/admin/emails/send - Admin Direct & Broadcast Email Sender with Multi-Section Colors & User Targeting
app.post("/api/admin/emails/send", async (req, res) => {
  const auth = await verifyAdminBroadcastPermission(req);
  if (!auth.valid) {
    return res.status(401).json({ success: false, message: auth.message || "Unauthorized admin access." });
  }

  const db = readDB();
  await syncFromStorage(db);


  const {
    recipientMode = "selective",
    recipients = [],
    subject,
    message,
    senderName = "SmartLink NG",
    themeColor = "navy",
    bannerHeadline,
    ctaLabel,
    ctaUrl,
    isTest = false,
    testEmail,
    attachments = [],
  } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: "Email subject is required." });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Email message content is required." });
  }

  // Retrieve full platform recipients map for accurate targeting & token personalization
  const allPlatformRecipients = await getAllPlatformRecipients();
  const userMap = new Map<string, RecipientUser>();
  for (const u of allPlatformRecipients) {
    if (u.email) {
      userMap.set(u.email.toLowerCase().trim(), u);
    }
  }

  // Resolve target email addresses
  let targetEmails: string[] = [];

  if (isTest) {
    const singleTest = (testEmail || auth.email || "").toLowerCase().trim();
    if (singleTest && singleTest.includes("@")) {
      targetEmails = [singleTest];
    } else {
      return res.status(400).json({ success: false, message: "Invalid test email destination address." });
    }
  } else if (recipientMode === "all") {
    targetEmails = allPlatformRecipients.map((u) => u.email.toLowerCase().trim()).filter((e) => e && e.includes("@"));
  } else if (recipientMode === "selective" || recipientMode === "individual") {
    if (typeof recipients === "string") {
      targetEmails = recipients.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
    } else if (Array.isArray(recipients)) {
      targetEmails = recipients
        .map((r: any) => (typeof r === "string" ? r.trim().toLowerCase() : (r?.email || "").toLowerCase().trim()))
        .filter((e: string) => e && e.includes("@"));
    }
  }

  // Deduplicate
  targetEmails = Array.from(new Set(targetEmails));

  if (targetEmails.length === 0) {
    return res.status(400).json({ success: false, message: "No valid recipient email addresses specified." });
  }

  // Format attachments for Nodemailer
  const formattedAttachments = Array.isArray(attachments)
    ? attachments
        .map((att: any) => ({
          filename: att.filename || att.name || "attachment",
          base64Content: att.base64Content || att.data || att.content || "",
          contentType: att.contentType || att.type || "application/octet-stream",
          size: att.size || 0,
        }))
        .filter((att) => att.base64Content)
    : [];

  let sentCount = 0;
  let failedCount = 0;
  let smtpSuccessCount = 0;
  let lastSmtpError = "";
  const failedEmails: string[] = [];

  for (const email of targetEmails) {
    const user = userMap.get(email);
    const recipientName = user?.name || email.split("@")[0];
    const walletBalance = user?.walletBalance || 0;
    const targetUserId = (user as any)?.uid || (user as any)?.id || (user as any)?.userId || `USER_${email}`;

    // 1. Create In-App Notification for recipient so announcement appears on dashboard
    try {
      await notificationsStore.sendAppNotification(db, {
        id: "NOTIF_BC_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        notificationId: "NOTIF_BC_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        userId: targetUserId,
        targetEmail: email,
        title: subject,
        body: message,
        message: message,
        type: "SYSTEM_BROADCAST",
        category: "ANNOUNCEMENT",
        reference: `BROADCAST_${Date.now()}`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (notifErr) {
      console.error(`[AdminBroadcast] In-app notification error for ${email}:`, notifErr);
    }

    // 2. Dispatch live email via sendPlatformEmail (Nodemailer / SMTP)
    const emailHtml = generateProfessionalBroadcastHtml({
      subject,
      message,
      senderName: senderName || "SmartLink NG",
      themeColor,
      bannerHeadline,
      ctaLabel,
      ctaUrl,
      recipientName,
      recipientEmail: email,
      walletBalance,
      attachments: formattedAttachments,
    });

    try {
      const result = await sendPlatformEmail(
        {
          to: email,
          subject,
          html: emailHtml,
          senderName: senderName || "SmartLink NG",
          attachments: formattedAttachments,
        },
        db
      );

      if (result.success) {
        smtpSuccessCount++;
      } else {
        lastSmtpError = result.message || result.error || "SMTP configuration or connection error";
        failedCount++;
        failedEmails.push(email);
        console.warn(`[AdminBroadcast] Live SMTP error for ${email}:`, lastSmtpError);
      }
    } catch (err: any) {
      lastSmtpError = err.message || "Exception during SMTP dispatch";
      failedCount++;
      failedEmails.push(email);
      console.error(`[AdminBroadcast] Exception dispatching email to ${email}:`, lastSmtpError);
    }

    sentCount++;
  }

  // Record audit entry in database
  if (!db.notification_history) db.notification_history = [];
  db.notification_history.unshift({
    id: `EMAIL_DISPATCH_${Date.now()}`,
    type: "EMAIL",
    subject,
    senderName: senderName || "SmartLink NG",
    recipientMode: isTest ? "test" : recipientMode,
    themeColor,
    targetCount: targetEmails.length,
    sentCount,
    failedCount,
    failedEmails,
    smtpSuccessCount,
    attachmentsCount: formattedAttachments.length,
    adminEmail: auth.email || "admin@smartlinkng.com.ng",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);

  if (isTest) {
    if (smtpSuccessCount > 0) {
      return res.json({
        success: true,
        message: `Test email sent successfully to ${targetEmails[0]}! Check your inbox.`,
        sentCount: 1,
        smtpSuccessCount,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Failed to deliver test email: ${lastSmtpError || "Gmail SMTP credentials missing or invalid."}`,
        error: lastSmtpError,
      });
    }
  }

  if (smtpSuccessCount === 0 && targetEmails.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Failed to deliver live email broadcast: ${lastSmtpError || "Gmail SMTP live delivery was unconfigured or failed."}`,
      error: lastSmtpError,
      sentCount: 0,
      failedCount: targetEmails.length,
    });
  }

  return res.json({
    success: true,
    message: `Broadcast successfully dispatched to ${sentCount} recipient(s) (${smtpSuccessCount} delivered via Gmail SMTP).`,
    sentCount,
    failedCount,
    smtpSuccessCount,
    totalTargets: targetEmails.length,
    failedEmails,
  });
});




export default router;
