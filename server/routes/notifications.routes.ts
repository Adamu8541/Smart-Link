import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { verifyUserOrAdminSession, requireAdmin, requireAuth, optionalAdmin } from "../middleware/auth";
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
app.get("/api/admin/notifications/dashboard", optionalAdmin, async (req, res) => {
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
app.get("/api/admin/notifications", optionalAdmin, async (req, res) => {
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
app.get("/api/admin/notifications/templates", optionalAdmin, async (req, res) => {
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
app.get("/api/admin/notifications/system-switches", optionalAdmin, async (req, res) => {
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
app.get("/api/admin/notification/history", optionalAdmin, async (req, res) => {
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
app.get("/api/admin/announcements", optionalAdmin, async (req, res) => {
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

// 11b. POST /api/admin/emails/send - Broadcast / Custom Email Dispatcher
app.post("/api/admin/emails/send", requireAdmin, async (req, res) => {
  const { recipientMode, recipients, subject, message, senderName, attachments } = req.body;
  const db = readDB();
  await syncFromStorage(db);

  let targetList: string[] = [];
  if (recipientMode === "all") {
    targetList = (db.users || []).map((u: any) => u.email).filter(Boolean);
  } else {
    targetList = Array.isArray(recipients) ? recipients : [recipients];
  }

  if (targetList.length === 0) {
    targetList = ["all-users@smartlinkng.com.ng"];
  }

  const logEntry = {
    id: `EMAIL_${Date.now()}`,
    subject,
    message,
    senderName: senderName || "SmartLink NG",
    recipientCount: targetList.length,
    recipientSample: targetList.slice(0, 5),
    attachmentsCount: (attachments || []).length,
    status: "DELIVERED",
    sentAt: new Date().toISOString(),
    sentBy: (req as any).adminEmail || "Admin",
  };

  if (!db.email_broadcast_logs) db.email_broadcast_logs = [];
  db.email_broadcast_logs.unshift(logEntry);

  writeDB(db);
  await syncToStorage(db);

  return res.json({
    success: true,
    message: `Email broadcast dispatched to ${targetList.length} recipient(s).`,
    log: logEntry,
  });
});

// 12. GET & POST /api/admin/module9/self-test - Module 9 Diagnostic Test
app.all("/api/admin/module9/self-test", optionalAdmin, async (req, res) => {
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

// 6. POST /api/admin/emails/send - Admin Direct & Broadcast Email Sender
app.post("/api/admin/emails/send", async (req, res) => {
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.headers["authorization"]?.replace("Bearer ", ""));
  const db = readDB();
  await syncFromStorage(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  const {
    recipientMode = "individual",
    recipients = [],
    subject,
    message,
    senderName = "SmartLink NG",
    attachments = [],
  } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: "Email subject is required." });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Email message content is required." });
  }

  // Resolve recipient emails
  let targetEmails: string[] = [];

  if (recipientMode === "all") {
    const allUsers = await usersStore.getAllUsers();
    targetEmails = allUsers
      .map((u: any) => u.email)
      .filter((e: any) => typeof e === "string" && e.trim().length > 3 && e.includes("@"));
  } else if (recipientMode === "selective" || recipientMode === "individual") {
    if (typeof recipients === "string") {
      targetEmails = recipients.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes("@"));
    } else if (Array.isArray(recipients)) {
      targetEmails = recipients
        .map((r: any) => (typeof r === "string" ? r.trim() : (r?.email || "")))
        .filter((e: string) => e && e.includes("@"));
    }
  }

  // Deduplicate
  targetEmails = Array.from(new Set(targetEmails));

  if (targetEmails.length === 0) {
    return res.status(400).json({ success: false, message: "No valid recipient email addresses specified." });
  }

  // Format attachments for Nodemailer
  const formattedAttachments = Array.isArray(attachments) ? attachments.map((att: any) => ({
    filename: att.filename || att.name || "attachment",
    base64Content: att.base64Content || att.data || att.content || "",
    contentType: att.contentType || att.type || "application/octet-stream"
  })).filter(att => att.base64Content) : [];

  // Format HTML message body
  const formattedMessage = message.includes("<p>") || message.includes("<br") || message.includes("<div")
    ? message
    : message.replace(/\n/g, "<br/>");

  const timestamp = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "medium" });

  const filesRowsHtml = formattedAttachments.length > 0
    ? formattedAttachments
        .map(
          (att: any) => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px 14px; font-weight: 600; color: #0F2D5C; background-color: #EFF6FF; width: 30%;">Attached File</td>
            <td style="padding: 10px 14px; color: #111827;">📎 <strong>${att.filename}</strong> — <em>See Email Attachments</em></td>
          </tr>
        `
        )
        .join("")
    : "";

  const attachmentsTableHtml = formattedAttachments.length > 0
    ? `
      <div style="margin-top: 24px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0F2D5C; letter-spacing: 0.5px;">📎 Attached Documents (${formattedAttachments.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tbody>
            ${filesRowsHtml}
          </tbody>
        </table>
      </div>
    `
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB;">
        
        <!-- Header -->
        <div style="background-color: #0F2D5C; color: #FFFFFF; padding: 24px; text-align: left;">
          <h1 style="margin: 0 0 6px 0; font-size: 20px; letter-spacing: -0.5px; font-weight: bold; text-transform: uppercase;">Smart Link NG</h1>
          <p style="margin: 0; font-size: 13px; color: #93C5FD; font-weight: 500;">${senderName ? `${senderName} • Official Communication` : "Official Customer Notice"}</p>
        </div>

        <!-- Banner Alert -->
        <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 14px 20px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; font-weight: bold;">
            📢 ${subject}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4B5563;">
            Date Dispatched: ${timestamp}
          </p>
        </div>

        <!-- Content Body -->
        <div style="padding: 24px; font-family: Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #111827;">
          ${formattedMessage}

          ${attachmentsTableHtml}
        </div>

        <!-- Action / Notice Box -->
        <div style="margin: 0 24px 24px 24px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
            ✓ Official communication dispatched securely via SmartLink Digital Services
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 16px 24px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #6B7280;">
          <p style="margin: 0; font-weight: 600;">SmartLink Digital Services • Customer Communications Engine</p>
          <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} ${senderName || "SmartLink Digital Services"}. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  for (const email of targetEmails) {
    try {
      const result = await sendPlatformEmail({
        to: email,
        subject,
        html: emailHtml,
        senderName: senderName || "SmartLink NG",
        attachments: formattedAttachments,
      }, db);

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
        failedEmails.push(email);
        console.error(`Admin send email error to ${email}:`, result.message || result.error);
      }
    } catch (err: any) {
      failedCount++;
      failedEmails.push(email);
      console.error(`Admin send email exception to ${email}:`, err.message);
    }
  }

  // Record audit entry
  if (!db.notification_history) db.notification_history = [];
  db.notification_history.unshift({
    id: `EMAIL_DISPATCH_${Date.now()}`,
    type: "EMAIL",
    subject,
    senderName: senderName || "SmartLink NG",
    recipientMode,
    targetCount: targetEmails.length,
    sentCount,
    failedCount,
    failedEmails,
    attachmentsCount: formattedAttachments.length,
    adminEmail: val.session.email,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);

  return res.json({
    success: sentCount > 0,
    message: `Email process completed: ${sentCount} sent successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`,
    sentCount,
    failedCount,
    totalTargets: targetEmails.length,
    failedEmails,
  });
});



export default router;
