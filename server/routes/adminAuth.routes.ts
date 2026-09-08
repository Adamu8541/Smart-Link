import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { requireAdmin, requireAuth, verifyUserOrAdminSession } from "../middleware/auth";
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

app.get("/api/admin/subadmins", requireAdmin, async (req, res) => {
  const allUsers = await usersStore.getAllUsers();
  const subAdmins = allUsers
    .filter((u: any) => u.role === "SUB_ADMIN" || u.role === "ADMIN" || u.role === "SUPER_ADMIN")
    .map(({ passwordHash, salt, ...u }: any) => u);

  res.json({ subAdmins });
});

app.post("/api/admin/subadmins/create", requireAdmin, async (req, res) => {
  const { fullName, email, password, phoneNumber, permissions } = req.body;
  const db = readDB();
  const admin = (req as any).admin;
  const adminUid = (req as any).authenticatedUid;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create Sub-Admins and assign permissions." });
  }

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full Name, Email, and Password are required." });
  }

  const existing = await usersStore.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "User already exists with this email address." });
  }

  const userHash = hashPassword(password);
  const userSalt = "";
  const uid = "usr_sub_" + Math.random().toString(36).substring(2, 9);

  const newSubAdmin = {
    uid,
    email: email.toLowerCase(),
    fullName,
    phoneNumber: phoneNumber || "",
    role: "SUB_ADMIN",
    walletBalance: 0.0,
    referralCode: "SUB" + Math.floor(1000 + Math.random() * 9000),
    passwordHash: userHash,
    salt: userSalt,
    isVerified: true,
    status: "ACTIVE",
    permissions: Array.isArray(permissions) ? permissions : [],
    createdAt: new Date().toISOString()
  };

  await usersStore.createUser(newSubAdmin);

  if (!db.admin_users) db.admin_users = [];
  db.admin_users.push({
    uid: newSubAdmin.uid,
    email: newSubAdmin.email,
    fullName: newSubAdmin.fullName,
    role: newSubAdmin.role,
    permissions: newSubAdmin.permissions,
    status: "ACTIVE",
    passwordHash: password,
    createdAt: newSubAdmin.createdAt,
    updatedAt: newSubAdmin.createdAt
  });

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "CREATE_SUB_ADMIN",
    details: `Created Sub-Admin ${email} with permissions: [${(newSubAdmin.permissions || []).join(", ")}]`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  const { passwordHash: ph, salt: s, ...safeUser } = newSubAdmin;
  res.json({ success: true, subAdmin: safeUser });
});

app.post("/api/admin/subadmins/update-permissions", requireAdmin, async (req, res) => {
  const { targetUid, permissions } = req.body;
  const db = readDB();
  const admin = (req as any).admin;
  const adminUid = (req as any).authenticatedUid;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can modify Sub-Admin permissions." });
  }

  const targetUser = await usersStore.getUserById(targetUid);
  if (!targetUser) return res.status(404).json({ error: "Sub-Admin user not found" });

  const updatedTarget = await usersStore.updateUser(targetUid, {
    permissions: Array.isArray(permissions) ? permissions : []
  });

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "UPDATE_SUBADMIN_PERMISSIONS",
    details: `Updated permissions for ${targetUser.email}: [${permissions.join(", ")}]`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  const { passwordHash, salt, ...safeUser } = updatedTarget || targetUser;
  res.json({ success: true, subAdmin: safeUser });
});

app.post("/api/admin/subadmins/batch-update-permissions", requireAdmin, async (req, res) => {
  const { updates } = req.body; // updates: Array<{ targetUid: string, permissions: string[] }>
  const db = readDB();
  const admin = (req as any).admin;
  const adminUid = (req as any).authenticatedUid;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can batch update Sub-Admin permissions." });
  }

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Updates array required" });
  }

  const updatedSubAdmins: any[] = [];
  for (const item of updates) {
    const { targetUid, permissions } = item;
    const targetUser = await usersStore.getUserById(targetUid);
    if (targetUser) {
      const updated = await usersStore.updateUser(targetUid, {
        permissions: Array.isArray(permissions) ? permissions : []
      });
      if (updated) {
        const { passwordHash, salt, ...safeUser } = updated;
        updatedSubAdmins.push(safeUser);
      }
    }
  }

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "BATCH_UPDATE_SUBADMIN_PERMISSIONS",
    details: `Batch updated permissions for ${updatedSubAdmins.length} sub-admins in Permissions Manager.`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  res.json({ success: true, updatedSubAdmins });
});

app.post("/api/admin/subadmins/revoke", requireAdmin, async (req, res) => {
  const { targetUid } = req.body;
  const db = readDB();
  const admin = (req as any).admin;
  const adminUid = (req as any).authenticatedUid;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can revoke Sub-Admin access." });
  }

  const targetUser = await usersStore.getUserById(targetUid);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  await usersStore.updateUser(targetUid, {
    role: "CUSTOMER",
    permissions: []
  });

  if (db.admin_users) {
    db.admin_users = db.admin_users.filter((a: any) => a.email.toLowerCase() !== targetUser.email?.toLowerCase());
  }

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "REVOKE_SUB_ADMIN",
    details: `Revoked Sub-Admin status for ${targetUser.email}`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true });
});

// --- TRANSACTION OVERRIDES & REFUNDS ---


// ==========================================
// SMARTLINK ADMIN PANEL — MODULE 1: AUTH & RBAC ENDPOINTS
// ==========================================

// Direct Admin Login Endpoint (Email + Password fallback for Super Admins and Staff)
app.post("/api/admin/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const db = readDB();
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  const result = await adminAuthService.loginAdmin(db, cleanEmail, password, ipAddress);

  if (!result.success || !result.session) {
    return res.status(401).json({
      success: false,
      message: result.message || "Invalid administrator email or password.",
    });
  }

  writeDB(db);

  res.json({
    success: true,
    session: result.session,
    user: result.adminUser,
    message: "Administrative login successful.",
  });
});

// Admin Session Validation Endpoint
app.get("/api/admin/auth/session", requireAdmin, async (req, res) => {
  const admin = (req as any).admin;
  const uid = (req as any).authenticatedUid;
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const token = (req as any).adminToken || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "");

  const session = {
    uid,
    email: admin.email,
    fullName: admin.fullName || "Administrator",
    role: admin.role,
    permissions: admin.permissions || (admin.role === "SUPER_ADMIN" ? ["*"] : ["VIEW_DASHBOARD"]),
    sessionToken: token,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    lastActive: new Date().toISOString(),
    status: "ACTIVE",
  };

  res.json({
    success: true,
    session,
  });
});

// Admin Roles & Permission Matrix Reference Endpoint
app.get("/api/admin/auth/roles", requireAdmin, async (req, res) => {
  res.json({
    success: true,
    roles: ADMIN_ROLES_CONFIG,
  });
});

// Admin Users Directory Endpoint (Protected by RBAC)
app.get(["/api/admin/auth/admin-users", "/api/admin/admins"], requireAdmin, async (req, res) => {
  const db = readDB();
  const admin = (req as any).admin;

  const check = adminAuthService.checkRoutePermission(admin, "/admin/users");
  if (!check.allowed) {
    return res.status(403).json({ success: false, message: check.reason });
  }

  const users = await adminAuthService.getAdminUsers(db, admin);
  res.json({
    success: true,
    users,
  });
});

// Admin Activity Logs Endpoint
app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
  const db = readDB();

  res.json({
    success: true,
    logs: db.admin_activity_logs || [],
  });
});

// Automated Module 1 Self-Test Endpoint (Protected: SUPER_ADMIN only)
app.all(["/api/admin/module1/test", "/api/admin/auth/test"], requireAdmin, async (req, res) => {
  const db = readDB();

  const admin = (req as any).admin;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Active SUPER_ADMIN session token required to trigger self-tests.",
    });
  }

  try {
    const testResults = await adminAuthService.runModule1SelfTests(db);
    writeDB(db);
    res.json({
      success: testResults.allPassed,
      module: "SmartLink Admin Panel — Module 1: Admin Authentication & RBAC",
      summary: testResults.allPassed
        ? "🎉 ALL MODULE 1 ADMIN AUTHENTICATION, RBAC & SESSION GUARD TESTS PASSED SUCCESSFULLY!"
        : "Some Module 1 tests reported failures.",
      testResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Virtual Account for a user (Supports Active Provider via Gateway)
app.get("/api/wallet/virtual-account", async (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter: userId" });
  }

  const db = readDB();
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const result = await getOrCreateUserVirtualAccount(userId);
  if (!result.success) {
    return res.status(result.code === "NO_ACTIVE_PROVIDER" ? 400 : 502).json(result);
  }

  return res.json({
    success: true,
    virtualAccount: result.virtualAccount,
    account: result.account
  });
});

// Generate Virtual Account Explicitly
app.post("/api/wallet/virtual-account/generate", async (req, res) => {
  const { userId, userEmail, userName, amount } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  const result = await getOrCreateUserVirtualAccount(userId, { email: userEmail, fullName: userName }, amount);
  if (!result.success) {
    return res.status(result.code === "NO_ACTIVE_PROVIDER" ? 400 : 502).json(result);
  }

  return res.json({
    success: true,
    isDuplicatePrevented: !!result.isExisting,
    virtualAccount: result.virtualAccount,
    account: result.account
  });
});

// Card Funding Execution Endpoint
app.post("/api/wallet/fund/card", async (req, res) => {
  const { userId, amount, cardNumberMasked, cardName, otpCode, userEmail } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment parameters." });
  }

  if (!otpCode) {
    return res.status(400).json({ error: "3D Secure OTP verification required." });
  }

  const db = readDB();
  const reference = `CARD-FUND-${Math.floor(100000 + Math.random() * 900000)}`;
  const receiptNumber = `REC-${reference}`;
  const gatewayName = "Debit Card Gateway (3D Secure)";

  let creditRes;
  try {
    creditRes = await ServerWalletEngine.creditWallet(db, {
      userId,
      amount: parseFloat(amount),
      serviceName: "Wallet Funding via Card",
      provider: gatewayName,
      description: `Card deposit (${cardNumberMasked}) authorized by OTP`,
      reference,
      fee: 0,
      recipientDetails: `Cardholder: ${cardName || "Customer"}`,
      type: "WALLET_FUNDING",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to process card funding." });
  }

  if (!db.receipts) db.receipts = [];
  db.receipts.unshift({
    id: `rcp_${Date.now()}`,
    receiptId: receiptNumber,
    reference,
    smartlinkReference: reference,
    providerReference: `PAYSTACK-${Math.floor(100000 + Math.random() * 900000)}`,
    userId,
    service: "WALLET_FUNDING",
    serviceTitle: "Wallet Deposit (Debit Card)",
    amount: parseFloat(amount),
    amountPaid: parseFloat(amount),
    status: "SUCCESSFUL",
    gateway: gatewayName,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: "NOTIF_" + Date.now(),
    notificationId: "NOTIF_" + Date.now(),
    userId,
    title: "Wallet Credit Successful",
    body: `Your wallet was credited with ₦${parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })} via Debit Card.`,
    reference,
    read: false,
    type: "WALLET_FUNDING",
    createdAt: new Date().toISOString(),
  });

  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift({
    id: "ACT_" + Date.now(),
    activityId: "ACT_" + Date.now(),
    userId,
    userEmail: userEmail || creditRes.wallet.userEmail || "",
    activityType: "WALLET_FUNDING",
    action: "CARD_FUNDING_SUCCESS",
    description: `Funded ₦${parseFloat(amount).toLocaleString()} via Card (${cardNumberMasked})`,
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);

  res.json({
    success: true,
    message: "Card payment authorized and credited.",
    balance: creditRes.wallet.currentBalance,
    reference,
    receiptNumber,
  });
});

// Admin Manual Wallet Credit / Debit
app.post("/api/admin/wallet/manual-credit", requireAdmin, async (req, res) => {
  const { adminEmail, targetEmailOrUid, action = "CREDIT", amount, reason } = req.body;
  const db = readDB();

  const adminUser = (req as any).admin;
  const adminUid = (req as any).authenticatedUid;

  if (!targetEmailOrUid || !amount || amount <= 0 || !reason) {
    return res.status(400).json({ error: "All admin ledger fields (target, action, amount, reason) are mandatory." });
  }

  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin privileges required for manual ledger entry." });
  }

  const targetUser = (await usersStore.getUserById(targetEmailOrUid)) || (await usersStore.getUserByEmail(targetEmailOrUid));

  if (!targetUser) {
    return res.status(404).json({ error: `Target user '${targetEmailOrUid}' not found in registry.` });
  }

  const reference = `ADM-${action}-${Math.floor(100000 + Math.random() * 900000)}`;
  const receiptNumber = `REC-${reference}`;
  const amt = parseFloat(amount);

  let walletRes;
  try {
    if (action === "CREDIT") {
      walletRes = await ServerWalletEngine.creditWallet(db, {
        userId: targetUser.uid,
        amount: amt,
        serviceName: "Admin Manual Wallet Credit",
        provider: `Staff Admin (${adminEmail || adminUser.email})`,
        description: `Manual ledger credit: ${reason}`,
        reference,
        fee: 0,
        recipientDetails: targetUser.email,
        type: "WALLET_FUNDING",
      });
    } else {
      walletRes = await ServerWalletEngine.debitWallet(db, {
        userId: targetUser.uid,
        amount: amt,
        serviceName: "Admin Manual Wallet Debit",
        provider: `Staff Admin (${adminEmail || adminUser.email})`,
        description: `Manual ledger debit: ${reason}`,
        reference,
        fee: 0,
        recipientDetails: targetUser.email,
        type: "ADMIN_DEBIT",
      });
    }
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Manual ledger adjustment failed." });
  }

  if (!db.receipts) db.receipts = [];
  db.receipts.unshift({
    id: `rcp_${Date.now()}`,
    receiptId: receiptNumber,
    reference,
    smartlinkReference: reference,
    providerReference: `ADMIN-AUTH-${adminUid.substring(0, 6)}`,
    userId: targetUser.uid,
    service: "WALLET_FUNDING",
    serviceTitle: `Admin Ledger ${action}`,
    amount: amt,
    amountPaid: amt,
    status: "SUCCESSFUL",
    gateway: `Admin Audit (${adminEmail || adminUser.email})`,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: "NOTIF_" + Date.now(),
    notificationId: "NOTIF_" + Date.now(),
    userId: targetUser.uid,
    title: `Wallet Ledger ${action === "CREDIT" ? "Credited" : "Debited"}`,
    body: `Your wallet was ${action === "CREDIT" ? "credited with" : "debited by"} ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Note: ${reason}`,
    reference,
    read: false,
    type: "WALLET_FUNDING",
    createdAt: new Date().toISOString(),
  });

  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift({
    id: "ACT_" + Date.now(),
    activityId: "ACT_" + Date.now(),
    userId: adminUid,
    userEmail: adminEmail || adminUser.email,
    activityType: "ADMIN_LEDGER",
    action: `MANUAL_${action}_SUCCESS`,
    description: `Admin executed manual ${action} of ₦${amt.toLocaleString()} for user ${targetUser.email} [Reason: ${reason}]`,
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);

  res.json({
    success: true,
    message: `Wallet ${action === "CREDIT" ? "credited" : "debited"} successfully.`,
    targetUser: {
      uid: targetUser.uid,
      fullName: targetUser.fullName,
      email: targetUser.email,
      newBalance: walletRes.wallet.currentBalance,
    },
    reference,
    receiptNumber,
  });
});

// Wallet Funding History Endpoint
app.get("/api/wallet/funding-history", requireAuth, async (req, res) => {
  const userId = (req as any).authenticatedUid;
  const db = readDB();

  const txs = (db.transactions || []).filter(
    (t: any) => t.userId === userId && (t.type === "WALLET_FUNDING" || t.service === "WALLET_FUNDING" || t.amount > 0)
  );

  res.json({ success: true, history: txs });
});



export default router;
