import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, verifyPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
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
import { sendPlatformEmail } from "../services/email.service";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { MultiGatewayRoutingEngine } from "../../src/services/multiGatewayRoutingEngine";
import { syncFromStorage, syncToStorage } from "../../src/services/settingsStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";
import { EmailOtpService, SensitiveOtpPurpose } from "../services/emailOtp.service";
import { getSupabaseAdmin, createSupabaseUser, updateSupabaseUserPassword, updateSupabaseUserEmail, updateSupabaseUserMetadata, sanitizeSupabaseUrl, confirmSupabaseUser } from "../services/supabaseAdmin";


const router = express.Router();
const app = router;

// Supabase Status & Connection Diagnostic Endpoint
app.get("/api/auth/supabase-status", async (req, res) => {
  const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const sanitizedUrl = sanitizeSupabaseUrl(rawUrl);
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  const isConfigured = Boolean(sanitizedUrl && anonKey && sanitizedUrl.startsWith("https://"));
  let connectionStatus = "NOT_CONFIGURED";
  let userCount = 0;
  let connectionError: string | null = null;

  if (isConfigured) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) {
          connectionStatus = "ERROR";
          connectionError = error.message;
        } else {
          connectionStatus = "CONNECTED";
          userCount = data?.users?.length || 0;
        }
      } catch (err: any) {
        connectionStatus = "ERROR";
        connectionError = err.message || "Connection failed";
      }
    } else {
      connectionStatus = "CONNECTED_ANON_ONLY";
    }
  }

  return res.json({
    success: true,
    isConfigured,
    sanitizedUrl: sanitizedUrl ? `${sanitizedUrl.slice(0, 18)}...supabase.co` : null,
    hasAnonKey: Boolean(anonKey),
    hasServiceKey: Boolean(serviceKey),
    connectionStatus,
    connectionError,
  });
});

// Centralized Supabase User Synchronization Endpoint
app.post("/api/auth/sync-supabase-user", async (req, res) => {
  const { id, uid, email, fullName, phoneNumber, referralCode, isVerified } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const resolvedUid = id || uid;
  if (!resolvedUid) {
    return res.status(400).json({ error: "Supabase User ID is required" });
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
      existingPhone.uid !== (existingUser?.uid || resolvedUid) &&
      existingPhone.id !== (existingUser?.id || resolvedUid)
    ) {
      return res.status(400).json({ error: '"phone number already linked to another account" change phone number' });
    }
  }

  if (existingUser) {
    const updates: any = {};
    if (isSuperAdminEmail) updates.role = "SUPER_ADMIN";
    if (resolvedUid) updates.uid = resolvedUid;
    if (fullName) updates.fullName = fullName;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    updates.isVerified = true;

    // Auto-confirm in Supabase Auth to bypass verification link requirements
    if (resolvedUid) {
      confirmSupabaseUser(resolvedUid).catch(() => {});
    }

    const updated = await usersStore.updateUser(existingUser.id || existingUser.uid || resolvedUid, updates);
    const targetUser = updated || existingUser;
    const { passwordHash, salt, transactionPinHash, ...safeUser } = targetUser;

    return res.json({
      user: {
        ...safeUser,
        hasTransactionPin: Boolean(targetUser.transactionPinHash || targetUser.hasTransactionPin),
        pinRequiredForTransactions: targetUser.pinRequiredForTransactions !== false,
      },
    });
  }

  // Create new user entry - strictly prevent privilege escalation
  const targetRole = isSuperAdminEmail ? "SUPER_ADMIN" : "CUSTOMER";
  const refCode = (fullName || "USER").replace(/\s+/g, "").substring(0, 8).toUpperCase() + Math.floor(100 + Math.random() * 900);

  // Auto-confirm in Supabase Auth to bypass verification link requirements
  if (resolvedUid) {
    confirmSupabaseUser(resolvedUid).catch(() => {});
  }

  const newUser = {
    id: resolvedUid,
    uid: resolvedUid,
    email: lowerEmail,
    fullName: fullName || lowerEmail.split("@")[0],
    phoneNumber: phoneNumber || "",
    role: targetRole,
    walletBalance: 0.0,
    referralCode: refCode,
    isVerified: true,
    authProvider: "supabase",
    createdAt: new Date().toISOString(),
  };

  const created = await usersStore.createUser(newUser);
  const { passwordHash, salt, ...safeUser } = created;
  res.json({ user: safeUser });
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

  // Maintenance Mode check for Website Login
  const db = readDB();
  const mDetails = getMaintenanceDetails(db);
  if (mDetails.maintenanceMode || mDetails.loginMaintenanceMode) {
    const isUserAdmin = isSuperAdminEmail || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "SUB_ADMIN";
    if (!isUserAdmin) {
      return res.status(503).json({
        success: false,
        error: "Website login is currently under scheduled maintenance.",
        loginMaintenance: true,
        maintenance: mDetails,
        message: mDetails.maintenanceMessage || "Website login is currently undergoing scheduled maintenance. Administrators may log in via the Admin Portal."
      });
    }
  }

  if (isSuperAdminEmail) {
    if (!user) {
      if (password !== SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({ error: "incorrect password, try forgot password instead" });
      }
      const saHash = hashPassword(password);
      const saSalt = "";
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
      const vResult = verifyPassword(password, user.passwordHash || "", user.salt);
      if (!vResult.match) {
        return res.status(401).json({ error: "incorrect password, try forgot password instead" });
      }
      const updateData: any = {
        role: "SUPER_ADMIN",
        isVerified: true,
        status: "ACTIVE",
      };
      if (vResult.needsUpgrade) {
        updateData.passwordHash = hashPassword(password);
      }
      user = await usersStore.updateUser(user.id || user.uid || "usr_sa_primary", updateData);
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

  // Validate hashed password securely with auto-upgrade support
  const vResult = verifyPassword(password, user.passwordHash || "", user.salt);
  if (!vResult.match) {
    return res.status(401).json({ error: "incorrect password, try forgot password instead" });
  }

  if (vResult.needsUpgrade) {
    const newHash = hashPassword(password);
    await usersStore.updateUser(user.id || user.uid || "", { passwordHash: newHash });
  }

  // Ensure user is verified automatically without email verification link block
  if (!user.isVerified) {
    user.isVerified = true;
    await usersStore.updateUser(user.id || user.uid || "", { isVerified: true });
    if (user.uid || user.id) {
      confirmSupabaseUser(user.uid || user.id || lowerEmail).catch(() => {});
    }
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

  // Maintenance Mode check for Registration / Signup
  const db = readDB();
  const mDetails = getMaintenanceDetails(db);
  if (mDetails.maintenanceMode || mDetails.signupMaintenanceMode) {
    if (!isSuperAdminEmail) {
      return res.status(503).json({
        success: false,
        error: "User registration is currently under scheduled maintenance.",
        signupMaintenance: true,
        maintenance: mDetails,
        message: mDetails.maintenanceMessage || "New account registrations are temporarily suspended due to scheduled system maintenance."
      });
    }
  }

  // Block admin self-registration
  const adminRoles = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "STAFF", "FINANCE_MANAGER", "SUPPORT_OFFICER", "VERIFICATION_OFFICER", "READ_ONLY_AUDITOR"];
  if (role && adminRoles.includes(role.toUpperCase()) && !isSuperAdminEmail) {
    return res.status(400).json({
      error: "Admin self-registration is strictly blocked. Administrative access can only be assigned by the Super Admin (adamuamuhammad8541@gmail.com)."
    });
  }

  const targetRole = isSuperAdminEmail ? "SUPER_ADMIN" : "CUSTOMER";
  const initialVerified = true;

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

  // Create Supabase Auth user or fallback ID
  let userId: string;
  try {
    const supaUser = await createSupabaseUser({
      email: lowerEmail,
      password: password,
      user_metadata: { full_name: fullName, phone: cleanPhone },
    });
    if (supaUser?.id) {
      userId = supaUser.id;
    } else {
      userId = `usr_sb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  } catch (sbErr: any) {
    userId = `usr_sb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  const uid = userId;
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

  // Hash password securely with bcrypt
  const userHash = hashPassword(password);
  const userSalt = "";

  const newUser = {
    id: uid,
    uid: uid,
    email: lowerEmail,
    fullName,
    phoneNumber: cleanPhone,
    role: targetRole,
    walletBalance: 0.0,
    referralCode: refCode,
    referredBy,
    passwordHash: userHash,
    salt: userSalt,
    isVerified: initialVerified,
    authProvider: "supabase",
    createdAt: new Date().toISOString(),
  };

  const created = await usersStore.createUser(newUser);

  const { passwordHash: ph, salt: s, ...safeUser } = created;
  res.json({
    success: true,
    user: safeUser,
    needsEmailConfirmation: false,
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

  res.json({ isVerified: true });
});

app.post("/api/auth/verify-account-now", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const cleanEmail = (email as string).toLowerCase().trim();
  const user = await usersStore.getUserByEmail(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }

  const updated = await usersStore.updateUser(user.id || user.uid || "", { isVerified: true });

  if (user.uid || user.id || cleanEmail) {
    confirmSupabaseUser(user.uid || user.id || cleanEmail).catch(() => {});
  }

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
    message: "Verification is managed by Supabase Authentication.",
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
    const emailResult = await sendPlatformEmail({
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
    emailSent = emailResult.success;
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

  const newHash = hashPassword(password);
  const newSalt = "";

  await usersStore.updateUser(user.id || user.uid || "", {
    passwordHash: newHash,
    salt: newSalt,
    resetToken: "",
    resetTokenExpires: 0,
  });

  res.json({ success: true, message: "Your password has been successfully updated. You can now log in with your new password." });
});

// =========================================================================
// SENSITIVE ACCOUNT CHANGES — EMAIL OTP VERIFICATION ENDPOINTS
// =========================================================================

/**
 * Request 6-Digit Email OTP for Sensitive Account Actions
 * Requires authenticated session; never trusts client-controlled identity.
 */
app.post("/api/auth/otp/request", async (req, res) => {
  const { purpose, targetValue } = req.body;

  const validPurposes: SensitiveOtpPurpose[] = [
    "CHANGE_PASSWORD",
    "CHANGE_EMAIL",
    "CHANGE_PHONE",
    "CHANGE_PIN",
    "TOGGLE_PIN_REQUIREMENT",
    "CHANGE_SECURITY_SETTINGS",
    "CHANGE_ACCOUNT_INFO",
    "CHANGE_USER_PRIVILEGES",
    "CRITICAL_ADMIN_OPERATION",
  ];

  if (!purpose || !validPurposes.includes(purpose)) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing purpose. Must be a valid SensitiveActionPurpose.",
    });
  }

  // Authorize session strictly
  const authCheck = await verifyUserOrAdminSession(req, req.body?.userId);
  if (!authCheck.authorized || !authCheck.authenticatedUid) {
    return res.status(401).json({
      success: false,
      error: authCheck.reason || "Authentication required to perform sensitive operations.",
    });
  }

  const userId = authCheck.authenticatedUid;
  const user = await usersStore.getUserById(userId);
  if (!user || !user.email) {
    return res.status(404).json({
      success: false,
      error: "User record or registered email address not found.",
    });
  }

  // Pre-validation for target values
  if (purpose === "CHANGE_EMAIL") {
    if (!targetValue || typeof targetValue !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetValue.trim())) {
      return res.status(400).json({ success: false, error: "A valid new email address is required." });
    }
    const cleanTargetEmail = targetValue.trim().toLowerCase();
    if (cleanTargetEmail === user.email.toLowerCase().trim()) {
      return res.status(400).json({ success: false, error: "New email cannot be identical to your current email address." });
    }
    const existing = await usersStore.getUserByEmail(cleanTargetEmail);
    if (existing && existing.uid !== userId && existing.id !== userId) {
      return res.status(400).json({ success: false, error: "This email address is already registered to another account." });
    }
  }

  if (purpose === "CHANGE_PHONE") {
    if (!targetValue || typeof targetValue !== "string" || !/^0\d{10}$/.test(targetValue.trim())) {
      return res.status(400).json({ success: false, error: "Phone number must be exactly 11 digits and begin with 0 (e.g., 08012345678)." });
    }
    const cleanPhone = targetValue.trim();
    if (cleanPhone === (user.phoneNumber || "").trim()) {
      return res.status(400).json({ success: false, error: "New phone number cannot be identical to your current phone number." });
    }
    const existingPhone = await usersStore.getUserByPhone(cleanPhone);
    if (existingPhone && existingPhone.uid !== userId && existingPhone.id !== userId) {
      return res.status(400).json({ success: false, error: "This phone number is already registered to another account." });
    }
  }

  if (purpose === "CHANGE_PIN") {
    if (targetValue && (typeof targetValue !== "string" || !/^\d{4}$/.test(targetValue.trim()))) {
      return res.status(400).json({ success: false, error: "Transaction PIN must be exactly 4 digits." });
    }
  }

  const result = await EmailOtpService.requestOtp({
    userId,
    userEmail: user.email,
    purpose,
    targetValue,
    ipAddress: req.ip || req.socket?.remoteAddress,
  });

  if (!result.success) {
    return res.status(result.status || 400).json(result);
  }

  res.json(result);
});

/**
 * Verify 6-Digit Email OTP and Complete Sensitive Account Action
 * Enforces one-time use, attempt counters, and timing-safe comparisons.
 */
app.post("/api/auth/otp/verify-and-change", async (req, res) => {
  const { purpose, otp, payload, reauthenticatedViaSupabase } = req.body;

  if (!purpose || !otp || !payload) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: purpose, otp, and payload are required.",
    });
  }

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
    return res.status(400).json({
      success: false,
      error: "Verification code must be exactly 6 digits.",
    });
  }

  // Authorize session strictly
  const authCheck = await verifyUserOrAdminSession(req, req.body?.userId);
  if (!authCheck.authorized || !authCheck.authenticatedUid) {
    return res.status(401).json({
      success: false,
      error: authCheck.reason || "Authentication session expired. Please sign in again.",
    });
  }

  const userId = authCheck.authenticatedUid;
  const user = await usersStore.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User account not found." });
  }

  // Validate payload before consuming OTP
  if (purpose === "CHANGE_PASSWORD") {
    const { newPassword } = payload;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long.",
      });
    }

    // Verify OTP if not already verified via Supabase native reauthentication
    if (!reauthenticatedViaSupabase) {
      const verifyRes = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp,
      });

      if (!verifyRes.success) {
        return res.status(verifyRes.status || 400).json({
          success: false,
          error: verifyRes.error || "Invalid verification code.",
        });
      }
    }

    // Update password hash locally
    const newHash = hashPassword(newPassword);
    const updated = await usersStore.updateUser(userId, {
      passwordHash: newHash,
      salt: "",
      updatedAt: new Date().toISOString(),
    });

    // Update in Supabase Auth if applicable
    await updateSupabaseUserPassword(userId, newPassword);

    // Audit notification
    try {
      await notificationsStore.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        userEmail: user.email,
        title: "Account Password Changed",
        message: "Your account password was successfully updated after email OTP verification.",
        category: "SECURITY",
        priority: "High",
        status: "Sent",
        body: "Your account password was successfully changed. If this wasn't you, contact support immediately.",
        createdAt: new Date().toISOString(),
      });
    } catch {}

    const { passwordHash: ph, salt: s, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: "Password has been successfully updated.",
      user: safeUser,
    });
  }

  if (purpose === "CHANGE_EMAIL") {
    const { newEmail } = payload;
    if (!newEmail || typeof newEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      return res.status(400).json({ success: false, error: "Valid new email address is required." });
    }
    const cleanNewEmail = newEmail.trim().toLowerCase();

    // Verify OTP with targetValue binding if not already verified via Supabase native reauthentication
    if (!reauthenticatedViaSupabase) {
      const verifyRes = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp,
        targetValue: cleanNewEmail,
      });

      if (!verifyRes.success) {
        return res.status(verifyRes.status || 400).json({
          success: false,
          error: verifyRes.error || "Invalid verification code.",
        });
      }
    }

    // Re-verify uniqueness
    const existing = await usersStore.getUserByEmail(cleanNewEmail);
    if (existing && existing.uid !== userId && existing.id !== userId) {
      return res.status(400).json({ success: false, error: "This email address is already linked to another account." });
    }

    const updated = await usersStore.updateUser(userId, {
      email: cleanNewEmail,
      updatedAt: new Date().toISOString(),
    });

    // Update in Supabase Auth if applicable
    await updateSupabaseUserEmail(userId, cleanNewEmail);

    // Audit notification
    try {
      await notificationsStore.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        userEmail: cleanNewEmail,
        title: "Registered Email Changed",
        message: `Your account email address was changed to ${cleanNewEmail} via email OTP verification.`,
        category: "SECURITY",
        priority: "High",
        status: "Sent",
        body: `Your registered email has been updated to ${cleanNewEmail}.`,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    const { passwordHash: ph, salt: s, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: `Your email address has been successfully updated to ${cleanNewEmail}.`,
      user: safeUser,
    });
  }

  if (purpose === "CHANGE_PHONE") {
    const { newPhoneNumber } = payload;
    if (!newPhoneNumber || typeof newPhoneNumber !== "string" || !/^0\d{10}$/.test(newPhoneNumber.trim())) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be exactly 11 digits and start with 0.",
      });
    }
    const cleanPhone = newPhoneNumber.trim();

    // Verify OTP with targetValue binding if not already verified via Supabase native reauthentication
    if (!reauthenticatedViaSupabase) {
      const verifyRes = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp,
        targetValue: cleanPhone,
      });

      if (!verifyRes.success) {
        return res.status(verifyRes.status || 400).json({
          success: false,
          error: verifyRes.error || "Invalid verification code.",
        });
      }
    }

    // Re-verify uniqueness
    const existingPhone = await usersStore.getUserByPhone(cleanPhone);
    if (existingPhone && existingPhone.uid !== userId && existingPhone.id !== userId) {
      return res.status(400).json({ success: false, error: "This phone number is already registered to another account." });
    }

    const updated = await usersStore.updateUser(userId, {
      phoneNumber: cleanPhone,
      updatedAt: new Date().toISOString(),
    });

    // Update in Supabase Auth user_metadata
    await updateSupabaseUserMetadata(userId, { phoneNumber: cleanPhone });

    // Audit notification
    try {
      await notificationsStore.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        userEmail: user.email,
        title: "Phone Number Updated",
        message: `Your account phone number was successfully updated to ${cleanPhone}.`,
        category: "SECURITY",
        priority: "High",
        status: "Sent",
        body: `Phone number updated to ${cleanPhone}.`,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    const { passwordHash: ph, salt: s, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: `Phone number successfully updated to ${cleanPhone}.`,
      user: safeUser,
    });
  }

  if (purpose === "CHANGE_PIN") {
    const { newPin } = payload;
    if (!newPin || typeof newPin !== "string" || !/^\d{4}$/.test(newPin.trim())) {
      return res.status(400).json({
        success: false,
        error: "Transaction PIN must be exactly 4 digits.",
      });
    }
    const cleanPin = newPin.trim();

    // Verify OTP if not already verified via Supabase native reauthentication
    if (!reauthenticatedViaSupabase) {
      const verifyRes = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp,
      });

      if (!verifyRes.success) {
        return res.status(verifyRes.status || 400).json({
          success: false,
          error: verifyRes.error || "Invalid verification code.",
        });
      }
    }

    // Hash the 4-digit PIN securely
    const pinHash = hashPassword(cleanPin);
    const updated = await usersStore.updateUser(userId, {
      transactionPinHash: pinHash,
      hasTransactionPin: true,
      pinRequiredForTransactions: true,
      updatedAt: new Date().toISOString(),
    });

    // Audit notification
    try {
      await notificationsStore.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        userEmail: user.email,
        title: "Transaction PIN Configured",
        message: "Your 4-digit Transaction Authorization PIN was successfully configured/updated.",
        category: "SECURITY",
        priority: "High",
        status: "Sent",
        body: "Your 4-digit Transaction Authorization PIN was updated. Keep your PIN private.",
        createdAt: new Date().toISOString(),
      });
    } catch {}

    const { passwordHash: ph, salt: s, transactionPinHash: tph, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: "Transaction PIN successfully updated and secured.",
      user: {
        ...safeUser,
        hasTransactionPin: true,
        pinRequiredForTransactions: true,
      },
    });
  }

  if (purpose === "TOGGLE_PIN_REQUIREMENT") {
    const pinRequired = typeof payload.pinRequiredForTransactions === "boolean" ? payload.pinRequiredForTransactions : true;
    const { newPin } = payload;

    // Verify OTP if not already verified via Supabase native reauthentication
    if (!reauthenticatedViaSupabase) {
      const verifyRes = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp,
      });

      if (!verifyRes.success) {
        return res.status(verifyRes.status || 400).json({
          success: false,
          error: verifyRes.error || "Invalid verification code.",
        });
      }
    }

    let extraUpdates: any = {};
    if (newPin && typeof newPin === "string" && /^\d{4}$/.test(newPin.trim())) {
      extraUpdates = {
        transactionPinHash: hashPassword(newPin.trim()),
        hasTransactionPin: true,
      };
    }

    const updated = await usersStore.updateUser(userId, {
      pinRequiredForTransactions: pinRequired,
      ...extraUpdates,
      updatedAt: new Date().toISOString(),
    });

    // Audit notification
    try {
      await notificationsStore.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        userEmail: user.email,
        title: `Transaction PIN Requirement ${pinRequired ? "Enabled" : "Disabled"}`,
        message: `Your account security was updated: Transaction PIN is now ${pinRequired ? "required" : "optional"} for debit transactions and transfers.`,
        category: "SECURITY",
        priority: "High",
        status: "Sent",
        body: `Transaction authorization PIN requirement was toggled to ${pinRequired ? "ON" : "OFF"}.`,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    const { passwordHash: ph, salt: s, transactionPinHash: tph, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: `Transaction PIN requirement successfully turned ${pinRequired ? "ON" : "OFF"}.`,
      user: {
        ...safeUser,
        hasTransactionPin: Boolean((updated || user).transactionPinHash || (updated || user).hasTransactionPin),
        pinRequiredForTransactions: pinRequired,
      },
    });
  }

  if (purpose === "CHANGE_ACCOUNT_INFO") {
    const { fullName } = payload;
    const verifyRes = EmailOtpService.verifyOtp({
      userId,
      purpose,
      otp,
    });

    if (!verifyRes.success) {
      return res.status(verifyRes.status || 400).json({
        success: false,
        error: verifyRes.error || "Invalid verification code.",
      });
    }

    const updated = await usersStore.updateUser(userId, {
      fullName: fullName || user.fullName,
      updatedAt: new Date().toISOString(),
    });

    const ticketResult = EmailOtpService.createHighRiskTicket({
      userId,
      userEmail: user.email,
      purpose: "CHANGE_ACCOUNT_INFO",
      ipAddress: req.ip || req.socket?.remoteAddress,
    });

    const { passwordHash: ph, salt: s, ...safeUser } = updated || user;
    return res.json({
      success: true,
      message: "Account information updated successfully.",
      user: safeUser,
      highRiskTicket: ticketResult.ticket,
      expiresInSeconds: ticketResult.expiresInSeconds,
    });
  }

  if (purpose === "CHANGE_SECURITY_SETTINGS" || purpose === "CHANGE_USER_PRIVILEGES" || purpose === "CRITICAL_ADMIN_OPERATION") {
    const verifyRes = EmailOtpService.verifyOtp({
      userId,
      purpose,
      otp,
    });

    if (!verifyRes.success) {
      return res.status(verifyRes.status || 400).json({
        success: false,
        error: verifyRes.error || "Invalid verification code.",
      });
    }

    const ticketResult = EmailOtpService.createHighRiskTicket({
      userId,
      userEmail: user.email,
      purpose,
      ipAddress: req.ip || req.socket?.remoteAddress,
    });

    return res.json({
      success: true,
      message: "Security authorization confirmed.",
      highRiskTicket: ticketResult.ticket,
      expiresInSeconds: ticketResult.expiresInSeconds,
    });
  }

  return res.status(400).json({ success: false, error: "Unhandled sensitive action purpose." });
});

/**
 * Step-Up Security Verification Endpoint
 * Allows users/administrators to obtain a short-lived high-risk authorization ticket
 * by either verifying an email OTP or re-authenticating with their current password.
 */
app.post("/api/auth/step-up/verify", async (req, res) => {
  const { purpose, otp, password, targetValue } = req.body;

  if (!purpose) {
    return res.status(400).json({
      success: false,
      error: "Purpose is required for step-up verification.",
    });
  }

  const authCheck = await verifyUserOrAdminSession(req, req.body?.userId);
  if (!authCheck.authorized || !authCheck.authenticatedUid) {
    return res.status(401).json({
      success: false,
      error: authCheck.reason || "Active session required for step-up authorization.",
    });
  }

  const userId = authCheck.authenticatedUid;
  const user = await usersStore.getUserById(userId);
  if (!user || !user.email) {
    return res.status(404).json({ success: false, error: "Authenticated user record not found." });
  }

  // 1. Verify via OTP if provided
  if (otp && typeof otp === "string" && otp.trim()) {
    const verifyRes = EmailOtpService.verifyOtp({
      userId,
      purpose,
      otp: otp.trim(),
      targetValue,
    });

    if (!verifyRes.success) {
      return res.status(verifyRes.status || 400).json({
        success: false,
        error: verifyRes.error || "Invalid verification code.",
      });
    }

    const ticketResult = EmailOtpService.createHighRiskTicket({
      userId,
      userEmail: user.email,
      purpose,
      ipAddress: req.ip || req.socket?.remoteAddress,
    });

    return res.json({
      success: true,
      message: "Step-up authorization confirmed via OTP.",
      highRiskTicket: ticketResult.ticket,
      expiresInSeconds: ticketResult.expiresInSeconds,
    });
  }

  // 2. Verify via Password re-authentication if provided
  if (password && typeof password === "string" && password.trim()) {
    let passwordValid = false;

    // Check local bcrypt hash first
    if (user.passwordHash) {
      const vResult = verifyPassword(password, user.passwordHash, user.salt || "");
      if (vResult.match) {
        passwordValid = true;
      }
    }

    // Check super admin default password if applicable
    if (!passwordValid && [SUPER_ADMIN_EMAIL, "adamuamuhammad8541@gmail.com"].includes(user.email.toLowerCase().trim())) {
      if (password === SUPER_ADMIN_PASSWORD) {
        passwordValid = true;
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Re-authentication failed.",
      });
    }

    const ticketResult = EmailOtpService.createHighRiskTicket({
      userId,
      userEmail: user.email,
      purpose,
      ipAddress: req.ip || req.socket?.remoteAddress,
    });

    return res.json({
      success: true,
      message: "Step-up authorization confirmed via re-authentication.",
      highRiskTicket: ticketResult.ticket,
      expiresInSeconds: ticketResult.expiresInSeconds,
    });
  }

  return res.status(400).json({
    success: false,
    error: "Either a 6-digit email OTP or current password is required for security verification.",
  });
});

app.get("/api/auth/profile", async (req, res) => {
  let uid = (req.query.uid as string) || (req.query.userId as string) || "";
  const authCheck = await verifyUserOrAdminSession(req, uid);
  
  if (!uid && authCheck.authorized && authCheck.authenticatedUid) {
    uid = authCheck.authenticatedUid;
  }

  if (!uid) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const user = await usersStore.getUserById(uid as string);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { passwordHash, salt, transactionPinHash, ...safeUser } = user;
  res.json({
    user: {
      ...safeUser,
      hasTransactionPin: Boolean(user.transactionPinHash || user.hasTransactionPin),
      pinRequiredForTransactions: user.pinRequiredForTransactions !== false,
    },
  });
});

// Verify 4-Digit Transaction PIN
app.post("/api/auth/verify-pin", async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "User ID is required." });
  }

  const user = await usersStore.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }

  // Check if PIN requirement is disabled by user
  if (user.pinRequiredForTransactions === false) {
    return res.json({
      success: true,
      pinRequired: false,
      message: "Transaction PIN is not required for this account.",
    });
  }

  // If PIN requirement is ON, check if user has set a PIN
  if (!user.transactionPinHash) {
    return res.status(400).json({
      success: false,
      error: "Please configure your 4-digit transaction PIN first in Account & Security Settings.",
      code: "NO_PIN_CONFIGURED",
    });
  }

  if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin.trim())) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid 4-digit transaction PIN.",
      code: "INVALID_FORMAT",
    });
  }

  const { match } = verifyPassword(pin.trim(), user.transactionPinHash);
  if (!match) {
    return res.status(400).json({
      success: false,
      error: "Incorrect 4-digit transaction PIN. Please try again.",
      code: "INCORRECT_PIN",
    });
  }

  return res.json({
    success: true,
    pinRequired: true,
    message: "Transaction PIN successfully verified.",
  });
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
  const { passwordHash, salt, transactionPinHash, ...safeUser } = user;
  res.json({
    user: {
      ...safeUser,
      hasTransactionPin: Boolean(user.transactionPinHash || user.hasTransactionPin),
      pinRequiredForTransactions: user.pinRequiredForTransactions !== false,
    },
  });
});

// Update Profile
app.put("/api/users/:uid", async (req, res) => {
  const { uid } = req.params;
  const authCheck = await verifyUserOrAdminSession(req, uid);
  if (!authCheck.authorized || !authCheck.authenticatedUid) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const { fullName, phoneNumber } = req.body;

  const existing = await usersStore.getUserById(uid);
  if (!existing) return res.status(404).json({ error: "User not found" });

  // If changing phone number: require security verification
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

      // Zero-trust backend enforcement for phone change
      const phoneAuth = EmailOtpService.validateHighRiskAction({
        req,
        userId: authCheck.authenticatedUid,
        purpose: "CHANGE_PHONE",
        targetValue: cleanPhone,
      });
      if (!phoneAuth.valid) {
        return res.status(phoneAuth.status || 403).json({
          error: phoneAuth.reason,
          requiresVerification: true,
          purpose: "CHANGE_PHONE",
        });
      }
    }
  }

  // If changing full name: require security verification
  if (fullName && typeof fullName === "string" && fullName.trim() && fullName.trim() !== (existing.fullName || "").trim()) {
    const nameAuth = EmailOtpService.validateHighRiskAction({
      req,
      userId: authCheck.authenticatedUid,
      purpose: "CHANGE_ACCOUNT_INFO",
    });
    if (!nameAuth.valid) {
      return res.status(nameAuth.status || 403).json({
        error: nameAuth.reason,
        requiresVerification: true,
        purpose: "CHANGE_ACCOUNT_INFO",
      });
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



// Update user role and assign Custom Claims
app.put("/api/admin/users/:uid/role", async (req, res) => {
  const { uid } = req.params;
  const { role, customClaims } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
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
  const sessionToken = (req.headers["x-admin-token"] as string) ;
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
