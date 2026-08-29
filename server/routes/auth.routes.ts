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

app.post("/api/auth/sync-firebase-user", async (req, res) => {
  const { uid, email, fullName, phoneNumber, role, referralCode, isVerified } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const lowerEmail = email.toLowerCase().trim();
  let existingUser = await usersStore.getUserByEmail(lowerEmail);

  const superAdminEmails = [SUPER_ADMIN_EMAIL, "adamuamuhammad8541@gmail.com"];
  const isSuperAdminEmail = superAdminEmails.includes(lowerEmail);

  if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== "") {
    if (typeof phoneNumber !== "string" || !/^0\d{10}$/.test(phoneNumber.trim())) {
      return res.status(400).json({ error: "Phone number must be exactly 11 digits and must start with 0." });
    }
    const cleanPhone = phoneNumber.trim();
    const existingPhone = await usersStore.getUserByPhone(cleanPhone);
    if (
      existingPhone &&
      existingPhone.email?.toLowerCase().trim() !== lowerEmail &&
      existingPhone.uid !== (existingUser?.uid || uid) &&
      existingPhone.id !== (existingUser?.id || uid)
    ) {
      return res.status(400).json({ error: '"phone number already linked to another account" change phone number' });
    }
  }

  if (existingUser) {
    const updates: any = {};
    if (isSuperAdminEmail) updates.role = "SUPER_ADMIN";
    if (uid) updates.uid = uid;
    if (fullName) updates.fullName = fullName;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    updates.isVerified = isVerified !== undefined ? !!isVerified : true;
    
    const updated = await usersStore.updateUser(existingUser.id || existingUser.uid || uid, updates);
    const { passwordHash, salt, ...safeUser } = updated || existingUser;
    return res.json({ user: safeUser });
  }

  // Create user entry - default to CUSTOMER unless designated Super Admin
  const targetRole = isSuperAdminEmail ? "SUPER_ADMIN" : "CUSTOMER";
  const refCode = (fullName || "USER").replace(/\s+/g, "").substring(0, 8).toUpperCase() + Math.floor(100 + Math.random() * 900);
  const newUser = {
    uid: uid || "usr_" + Math.random().toString(36).substring(2, 9),
    email: lowerEmail,
    fullName: fullName || lowerEmail.split("@")[0],
    phoneNumber: phoneNumber || "",
    role: targetRole,
    walletBalance: 0.0,
    referralCode: refCode,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  const created = await usersStore.createUser(newUser);
  res.json({ user: created });
});

app.post("/api/auth/check-email-exists", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const user = await usersStore.getUserByEmail(email.toLowerCase().trim());
  if (user) {
    return res.json({ exists: true, error: "email exist sign in instead" });
  }
  res.json({ exists: false });
});

app.post("/api/auth/check-phone-exists", async (req, res) => {
  const { phoneNumber, email, excludeUid } = req.body;
  if (!phoneNumber || typeof phoneNumber !== "string" || !/^0\d{10}$/.test(phoneNumber.trim())) {
    return res.status(400).json({ error: "Phone number must be exactly 11 digits and must start with 0." });
  }
  const cleanPhone = phoneNumber.trim();
  const user = await usersStore.getUserByPhone(cleanPhone);
  if (user) {
    if (email && user.email?.toLowerCase().trim() === email.toLowerCase().trim()) {
      return res.json({ exists: false });
    }
    if (excludeUid && (user.uid === excludeUid || user.id === excludeUid)) {
      return res.json({ exists: false });
    }
    return res.json({ exists: true, error: '"phone number already linked to another account" change phone number' });
  }
  res.json({ exists: false });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const lowerEmail = email.toLowerCase().trim();
  let user = await usersStore.getUserByEmail(lowerEmail);

  const superAdminEmails = [
    SUPER_ADMIN_EMAIL,
    "adamuamuhammad8541@gmail.com"
  ];

  const isSuperAdminEmail = superAdminEmails.includes(lowerEmail);

  if (isSuperAdminEmail) {
    if (!user) {
      if (password !== SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({ error: "incorrect password, try forgot password instead" });
      }
      const saSalt = generateSalt();
      const saHash = hashPassword(password, saSalt);
      user = await usersStore.createUser({
        uid: "usr_sa_primary",
        email: lowerEmail,
        fullName: "Adamu A. Muhammad",
        phoneNumber: "+2348030008541",
        role: "SUPER_ADMIN",
        walletBalance: 0.0,
        referralCode: "SUPER1",
        passwordHash: saHash,
        salt: saSalt,
        isVerified: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });
    } else {
      const isMatch = !!(user.salt && user.passwordHash && safeCompareHash(hashPassword(password, user.salt), user.passwordHash));
      if (!isMatch) {
        return res.status(401).json({ error: "incorrect password, try forgot password instead" });
      }
      user = await usersStore.updateUser(user.id || user.uid || "usr_sa_primary", {
        role: "SUPER_ADMIN",
        isVerified: true,
        status: "ACTIVE",
      });
    }

    if (!user) {
      return res.status(500).json({ error: "Failed to login Super Admin account." });
    }

    const { passwordHash, salt, ...safeUser } = user;
    return res.json({ user: safeUser });
  }

  if (!user) {
    return res.status(404).json({ error: "check email and try again or sign up if not register before." });
  }

  // Validate hashed password safely against timing side-channel attacks
  const isMatch = !!(user.salt && user.passwordHash && safeCompareHash(hashPassword(password, user.salt), user.passwordHash));
  if (!isMatch) {
    return res.status(401).json({ error: "incorrect password, try forgot password instead" });
  }

  // Auto verify if needed
  if (!user.isVerified) {
    user = await usersStore.updateUser(user.id || user.uid || "", { isVerified: true }) || user;
  }

  // Return user profile with their assigned role
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, fullName, phoneNumber, role, referralCode, password } = req.body;

  if (!email || !fullName || !password) {
    return res.status(400).json({ error: "Email, Full Name, and Password are required fields" });
  }

  const lowerEmail = email.toLowerCase().trim();
  const superAdminEmails = [SUPER_ADMIN_EMAIL, "adamuamuhammad8541@gmail.com"];
  const isSuperAdminEmail = superAdminEmails.includes(lowerEmail);

  // Block admin self-registration
  const adminRoles = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "STAFF", "FINANCE_MANAGER", "SUPPORT_OFFICER", "VERIFICATION_OFFICER", "READ_ONLY_AUDITOR"];
  if (role && adminRoles.includes(role.toUpperCase()) && !isSuperAdminEmail) {
    return res.status(400).json({
      error: "Admin self-registration is strictly blocked. Administrative access can only be assigned by the Super Admin (adamuamuhammad8541@gmail.com)."
    });
  }

  const targetRole = isSuperAdminEmail ? "SUPER_ADMIN" : "CUSTOMER";

  const existing = await usersStore.getUserByEmail(lowerEmail);
  if (existing) {
    return res.status(400).json({ error: "email exist sign in instead" });
  }

  if (!phoneNumber || typeof phoneNumber !== "string" || !/^0\d{10}$/.test(phoneNumber.trim())) {
    return res.status(400).json({ error: "Phone number must be exactly 11 digits and must start with 0." });
  }
  const cleanPhone = phoneNumber.trim();

  const existingPhone = await usersStore.getUserByPhone(cleanPhone);
  if (existingPhone) {
    return res.status(400).json({ error: '"phone number already linked to another account" change phone number' });
  }

  // Create real Firebase Authentication account
  let firebaseUid: string;
  try {
    getAdminFirestore(); // Ensure Firebase Admin app is initialized

    try {
      const createOptions: any = {
        email: lowerEmail,
        password: password,
        displayName: fullName,
      };
      const fbUser = await getAuth().createUser(createOptions);
      firebaseUid = fbUser.uid;
    } catch (createErr: any) {
      if (
        createErr?.code === "auth/email-already-exists" ||
        createErr?.code === "auth/email-already-in-use" ||
        createErr?.message?.includes("email-already-exists") ||
        createErr?.message?.includes("email-already-in-use")
      ) {
        return res.status(400).json({ error: "email exist sign in instead" });
      } else {
        throw createErr;
      }
    }
  } catch (fbErr: any) {
    console.error("[register] Firebase Auth account creation failed:", fbErr);
    if (
      fbErr?.code === "auth/email-already-exists" ||
      fbErr?.code === "auth/email-already-in-use" ||
      fbErr?.message?.includes("email-already-exists") ||
      fbErr?.message?.includes("email-already-in-use")
    ) {
      return res.status(400).json({ error: "email exist sign in instead" });
    }
    return res.status(400).json({ error: fbErr.message || "Could not create authentication account." });
  }

  const uid = firebaseUid;
  const refCode = fullName.replace(/\s+/g, "").substring(0, 8).toUpperCase() + Math.floor(100 + Math.random() * 900);

  // Check if referred by someone
  let referredBy = "";
  if (referralCode) {
    const allUsers = await usersStore.getAllUsers();
    const referrer = allUsers.find((u: any) => u.referralCode?.toUpperCase() === referralCode.toUpperCase());
    if (referrer) {
      referredBy = referrer.uid || referrer.id || "";
    }
  }

  // Hash password securely
  const userSalt = generateSalt();
  const userHash = hashPassword(password, userSalt);

  const newUser = {
    id: firebaseUid,
    uid: firebaseUid,
    email: lowerEmail,
    fullName,
    phoneNumber,
    role: targetRole,
    walletBalance: 0.0,
    referralCode: refCode,
    referredBy,
    passwordHash: userHash,
    salt: userSalt,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  const created = await usersStore.createUser(newUser);

  const { passwordHash: ph, salt: s, ...safeUser } = created;
  res.json({
    success: true,
    user: safeUser,
  });
});

app.get("/api/auth/check-verification-status", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await usersStore.getUserByEmail((email as string).toLowerCase().trim());

  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }

  if (user.isVerified === true) {
    const { passwordHash, salt, ...safeUser } = user;
    return res.json({ isVerified: true, user: safeUser });
  }

  res.json({ isVerified: false });
});

app.post("/api/auth/verify-account-now", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const user = await usersStore.getUserByEmail((email as string).toLowerCase().trim());

  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }

  const updated = await usersStore.updateUser(user.id || user.uid || "", { isVerified: true });

  const { passwordHash, salt, ...safeUser } = updated || user;
  res.json({ success: true, isVerified: true, user: safeUser });
});

app.post("/api/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const user = await usersStore.getUserByEmail(email.toLowerCase().trim());

  if (!user) {
    return res.status(404).json({ error: "No registered account found with this email." });
  }

  if (user.isVerified === true) {
    return res.status(400).json({ error: "This email address is already verified. Please sign in." });
  }

  res.json({
    success: true,
    message: "Verification is managed by Firebase Authentication.",
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await usersStore.getUserByEmail(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: "email not found or not registered, register instead" });
  }

  // Generate a secure, high-entropy token
  const token = crypto.randomBytes(20).toString("hex");
  const expires = Date.now() + 3600000; // 1 hour validity

  await usersStore.updateUser(user.id || user.uid || "", {
    resetToken: token,
    resetTokenExpires: expires,
  });

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  // Attempt email delivery via Nodemailer if SMTP configuration exists
  let emailSent = false;
  try {
    const db = readDB();
    const smtpConfig = db.system_settings?.email || {};
    const smtpHost = process.env.SMTP_HOST || smtpConfig.smtpHost;
    const smtpPort = Number(process.env.SMTP_PORT || smtpConfig.smtpPort || 587);
    const smtpUser = process.env.SMTP_USER || smtpConfig.smtpUsername;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${smtpConfig.senderName || 'SmartLink Support'}" <${smtpConfig.replyToAddress || 'no-reply@smartlinkng.com.ng'}>`,
        to: cleanEmail,
        subject: "SmartLink Account Password Reset Instructions",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>SmartLink Password Reset Request</h2>
            <p>Hello,</p>
            <p>A password reset was requested for your account (${cleanEmail}). Please click the link below to reset your password:</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>This password reset link expires in 1 hour.</p>
            <p>If you did not request a password reset, please disregard this email.</p>
          </div>
        `,
      });
      emailSent = true;
    }
  } catch (mailErr) {
    console.error("[ForgotPassword] SMTP dispatch warning/error:", mailErr);
    emailSent = false;
  }

  // Create in-app notification record for audit and user alert feed
  try {
    const notifMsg = `A password reset link was generated for your account. Reset link: ${resetLink} (Expires in 1 hour).`;
    await notificationsStore.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id || user.uid || "",
      userEmail: cleanEmail,
      title: "Password Reset Requested",
      message: notifMsg,
      category: "SECURITY",
      priority: "High",
      status: "Sent",
      body: notifMsg,
      createdAt: new Date().toISOString(),
    });
  } catch (notifErr) {
    console.error("[ForgotPassword] Notification dispatch error:", notifErr);
  }

  // CRITICAL: Token is NEVER returned in HTTP JSON response under any circumstances
  res.json({
    success: true,
    message: "Password reset instructions have been sent to your email address. Please check your inbox and spam folder.",
    email: cleanEmail,
    emailDispatched: emailSent,
  });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Reset token and new password are required fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long for security compliance" });
  }

  const allUsers = await usersStore.getAllUsers();
  const user = allUsers.find(
    (u: any) => u.resetToken && safeCompareHash(u.resetToken, token) && u.resetTokenExpires && u.resetTokenExpires > Date.now()
  );

  if (!user) {
    return res.status(400).json({ error: "The reset token is invalid, used, or has expired. Please request a new reset link." });
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(password, newSalt);

  await usersStore.updateUser(user.id || user.uid || "", {
    passwordHash: newHash,
    salt: newSalt,
    resetToken: "",
    resetTokenExpires: 0,
  });

  res.json({ success: true, message: "Your password has been successfully updated. You can now log in with your new password." });
});

app.get("/api/auth/profile", async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const authCheck = await verifyUserOrAdminSession(req, uid as string);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const user = await usersStore.getUserById(uid as string);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Get User Profile
app.get("/api/users/:uid", async (req, res) => {
  const { uid } = req.params;
  const authCheck = await verifyUserOrAdminSession(req, uid);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const user = await usersStore.getUserById(uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update Profile
app.put("/api/users/:uid", async (req, res) => {
  const { uid } = req.params;
  const authCheck = await verifyUserOrAdminSession(req, uid);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const { fullName, phoneNumber } = req.body;

  const existing = await usersStore.getUserById(uid);
  if (!existing) return res.status(404).json({ error: "User not found" });

  if (phoneNumber && typeof phoneNumber === "string" && phoneNumber.trim()) {
    if (!/^0\d{10}$/.test(phoneNumber.trim())) {
      return res.status(400).json({ error: "Phone number must be exactly 11 digits and must start with 0." });
    }
    const cleanPhone = phoneNumber.trim();
    if (cleanPhone !== (existing.phoneNumber || "").trim()) {
      const existingPhone = await usersStore.getUserByPhone(cleanPhone);
      if (existingPhone && existingPhone.uid !== uid && existingPhone.id !== uid) {
        return res.status(400).json({ error: "This phone number is already registered to another account." });
      }
    }
  }

  const updated = await usersStore.updateUser(uid, {
    fullName: fullName || existing.fullName,
    phoneNumber: phoneNumber || existing.phoneNumber,
  });

  res.json({ user: updated });
});

// --- GATEWAY SIGNATURE & SECURE DIGITAL WALLET HELPER FUNCTIONS ---


// --- USER MANAGEMENT & RBAC AUTH ENDPOINTS ---



// Update user role and assign Firebase Custom Claims
app.put("/api/admin/users/:uid/role", async (req, res) => {
  const { uid } = req.params;
  const { role, customClaims } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
  }

  // Super Admin protection for assigning Admin roles
  if ((role === "ADMIN" || role === "SUPER_ADMIN") && admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Administrators can assign Admin or Super Admin roles." });
  }

  const targetUser = await usersStore.getUserById(uid);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const oldRole = targetUser.role;
  const newClaims = customClaims ? { ...(targetUser.customClaims || {}), ...customClaims } : targetUser.customClaims;

  const updatedUser = await usersStore.updateUser(uid, {
    role,
    customClaims: newClaims
  });

  // Synchronize admin_users collection
  if (!db.admin_users) db.admin_users = [];
  const adminRoles = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "STAFF", "FINANCE_MANAGER", "SUPPORT_OFFICER", "VERIFICATION_OFFICER", "READ_ONLY_AUDITOR"];

  if (targetUser.email && adminRoles.includes(role)) {
    const adminIdx = db.admin_users.findIndex((a: any) => a.email.toLowerCase() === targetUser.email?.toLowerCase());
    if (adminIdx !== -1) {
      db.admin_users[adminIdx].role = role;
      db.admin_users[adminIdx].status = "ACTIVE";
    } else {
      db.admin_users.push({
        uid: targetUser.uid || `adm_${Date.now()}`,
        email: targetUser.email.toLowerCase(),
        fullName: targetUser.fullName,
        role: role,
        permissions: ["*"],
        status: "ACTIVE",
        passwordHash: targetUser.passwordHash || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } else if (targetUser.email && role === "CUSTOMER") {
    db.admin_users = db.admin_users.filter((a: any) => a.email.toLowerCase() !== targetUser.email?.toLowerCase());
  }

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "UPDATE_USER_ROLE_AND_CLAIMS",
    details: `Changed role for user "${targetUser.email}" from ${oldRole} to ${role} (Claims: ${JSON.stringify(customClaims || {})})`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, role, customClaims: updatedUser?.customClaims });
});



// Record user login audit history
app.post("/api/auth/record-login", async (req, res) => {
  const { userId, email, ipAddress, browser, os, deviceType, status, failureReason } = req.body;
  const db = readDB();

  const historyItem = {
    id: "login_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    userId: userId || "ANONYMOUS",
    email: email || "unknown",
    loginTime: new Date().toLocaleString(),
    ipAddress: ipAddress || req.ip || "127.0.0.1",
    browser: browser || "Web Browser",
    os: os || "Web OS",
    deviceType: deviceType || "DESKTOP",
    status: status || "SUCCESS",
    failureReason: failureReason || undefined
  };

  if (!db.loginHistory) db.loginHistory = [];
  db.loginHistory.unshift(historyItem);

  // Update user lastLogin timestamp if user exists
  if (userId) {
    await usersStore.updateUser(userId, { lastLogin: historyItem.loginTime });
  }

  writeDB(db);
  res.json({ success: true, historyRecord: historyItem });
});

// Get user login history
app.get("/api/admin/users/:uid/login-history", async (req, res) => {
  const { uid } = req.params;
  const db = readDB();
  const history = (db.loginHistory || []).filter((h: any) => h.userId === uid);
  res.json({ history });
});

// Set Custom Claims for user (Super Admin Endpoint)
app.post("/api/auth/set-custom-claims", async (req, res) => {
  const { targetUid, claims } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;
  if (admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Administrators can assign Custom Claims." });
  }

  const targetUser = await usersStore.getUserById(targetUid);
  if (!targetUser) return res.status(404).json({ error: "Target user not found" });

  const updatedUser = await usersStore.updateUser(targetUid, {
    customClaims: { ...(targetUser.customClaims || {}), ...claims }
  });

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "ASSIGN_CUSTOM_CLAIMS",
    details: `Assigned Custom Claims to user "${targetUser.email}": ${JSON.stringify(claims)}`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, customClaims: updatedUser?.customClaims });
});

// Get User Claims
app.get("/api/auth/user-claims/:uid", async (req, res) => {
  const { uid } = req.params;

  const authCheck = await verifyUserOrAdminSession(req, uid);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const user = await usersStore.getUserById(uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ claims: user.customClaims || {} });
});



export default router;
