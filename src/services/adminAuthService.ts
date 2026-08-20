/**
 * SmartLink Admin Authentication & Role-Based Access Control (RBAC) Engine
 * Firestore-Backed Sessions & Credentials Management
 */

import crypto from "crypto";
import { getAdminFirestore } from "./firebaseAdmin";
export * from "./adminAuthTypes";
import {
  AdminSession,
  AdminRoleType,
  AdminUserDocument,
  AdminActivityLog,
  AdminTestResult,
  ADMIN_ROLES_CONFIG,
  ADMIN_ROUTE_PERMISSIONS,
} from "./adminAuthTypes";

function getFsDb() {
  try {
    return getAdminFirestore();
  } catch {
    return null;
  }
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

export function safeCompareHash(providedHash: string, storedHash: string): boolean {
  if (!providedHash || !storedHash) return false;
  try {
    const bufferA = Buffer.from(providedHash, "hex");
    const bufferB = Buffer.from(storedHash, "hex");
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

const getJwtSecret = (): string => {
  const secret = String(process.env.ADMIN_JWT_SECRET || "").trim();

  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not configured.");
  }

  return secret;
};

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signAdminJwt(payload: {
  uid: string;
  email: string;
  role: AdminRoleType;
  permissions: string[];
  expiresAt: string;
}): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(signatureInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signatureInput}.${signature}`;
}

export function verifyAdminJwt(token: string): {
  uid: string;
  email: string;
  role: AdminRoleType;
  permissions: string[];
  expiresAt: string;
} | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(signatureInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedSigBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) return null;

  try {
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr);
    if (!payload.expiresAt) return null;
    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export class AdminAuthService {
  private static instance: AdminAuthService;
  private readonly SESSION_TIMEOUT_MINUTES = 30;
  private revokedSessions = new Set<string>();

  private constructor() {}

  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Seed Super Admin Account directly into Firestore on startup using server environment secrets.
   * Never stores real passwords or credentials in committed files.
   */
  public async seedAdminUsers(db?: any): Promise<void> {
    const email = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
    const password = (process.env.SUPER_ADMIN_PASSWORD || "").trim();

    if (!email || !password) {
      return;
    }

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        const existingQuery = await fsDb.collection("admin_users").where("email", "==", email).get();

        if (existingQuery.empty) {
          const salt = generateSalt();
          const passwordHash = hashPassword(password, salt);
          const now = new Date().toISOString();
          const uid = `adm_sa_${Date.now()}`;

          const superAdminDoc: AdminUserDocument = {
            uid,
            email,
            fullName: "Super Admin",
            role: "SUPER_ADMIN",
            permissions: ADMIN_ROLES_CONFIG["SUPER_ADMIN"].permissions,
            status: "ACTIVE",
            passwordHash,
            salt,
            createdAt: now,
            updatedAt: now,
          };

          await fsDb.collection("admin_users").doc(uid).set(superAdminDoc);
          await fsDb.collection("users").doc(uid).set(
            {
              ...superAdminDoc,
              isVerified: true,
              walletBalance: 0,
            },
            { merge: true }
          );

          if (db) {
            if (!db.admin_users) db.admin_users = [];
            const idx = db.admin_users.findIndex((u: any) => u.email === email);
            if (idx >= 0) db.admin_users[idx] = superAdminDoc;
            else db.admin_users.push(superAdminDoc);
          }
        }
      }
    } catch (err) {
      console.warn("[AdminAuthService] seedAdminUsers Firestore error:", err);
    }
  }

  /**
   * Record Admin Activity Log in Firestore
   */
  public async recordLog(
    db: any,
    params: {
      adminUid?: string;
      adminEmail?: string;
      adminRole?: string;
      action: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "SESSION_EXPIRED" | "UNAUTHORIZED_ACCESS_ATTEMPT" | "PASSWORD_RESET_REQUEST" | "PERMISSION_DENIED";
      route?: string;
      ipAddress?: string;
      details: string;
      status: "SUCCESS" | "FAILURE" | "WARNING";
    }
  ): Promise<AdminActivityLog> {
    const logId = `ADM_LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const log: AdminActivityLog = {
      id: logId,
      logId,
      adminUid: params.adminUid,
      adminEmail: params.adminEmail,
      adminRole: params.adminRole,
      action: params.action,
      route: params.route,
      ipAddress: params.ipAddress || "127.0.0.1",
      details: params.details,
      status: params.status,
      timestamp: new Date().toISOString(),
    };

    if (db) {
      if (!db.admin_activity_logs) db.admin_activity_logs = [];
      db.admin_activity_logs.unshift(log);
    }

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_activity_logs").doc(logId).set(log);
        await fsDb.collection("activity_logs").doc(logId).set({
          id: log.id,
          activityId: log.logId,
          userId: params.adminUid || "GUEST_ADMIN",
          userEmail: params.adminEmail || "unauthenticated@admin.ng",
          activityType: `ADMIN_${params.action}`,
          action: params.action,
          description: params.details,
          status: params.status,
          timestamp: log.timestamp,
        });
      }
    } catch (err) {
      console.warn("[AdminAuthService] recordLog Firestore error:", err);
    }

    return log;
  }

  /**
   * Create an admin login session directly in Firestore collection `admin_sessions`
   */
  public async createSession(
    adminUser: AdminUserDocument,
    ipAddress?: string
  ): Promise<AdminSession> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT_MINUTES * 60000);
    const permissions = ADMIN_ROLES_CONFIG[adminUser.role]?.permissions || ["*"];

    const token = signAdminJwt({
      uid: adminUser.uid,
      email: adminUser.email,
      role: adminUser.role,
      permissions,
      expiresAt: expiresAt.toISOString(),
    });

    const session: AdminSession = {
      sessionToken: token,
      uid: adminUser.uid,
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
      permissions,
      loginTime: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActive: now.toISOString(),
      status: "ACTIVE",
    };

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_sessions").doc(token).set(session);
        await fsDb.collection("admin_users").doc(adminUser.uid).set(
          {
            lastLogin: now.toISOString(),
            lastLoginIp: ipAddress || "127.0.0.1",
            updatedAt: now.toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("[AdminAuthService] createSession Firestore write error:", err);
    }

    return session;
  }

  /**
   * Admin Authentication Handler
   */
  public async loginAdmin(
    db: any,
    emailInput: string,
    passwordInput: string,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    message: string;
    session?: AdminSession;
    adminUser?: AdminUserDocument;
    errorType?: "INVALID_CREDENTIALS" | "DISABLED_ACCOUNT" | "MISSING_ROLE" | "SYSTEM_ERROR";
  }> {
    const email = (emailInput || "").toLowerCase().trim();
    const password = (passwordInput || "").trim();

    if (!email || !password) {
      await this.recordLog(db, {
        adminEmail: email,
        action: "FAILED_LOGIN",
        ipAddress,
        details: "Login failed: Email and password fields are required.",
        status: "FAILURE",
      });
      return {
        success: false,
        message: "Email address and password are required.",
        errorType: "INVALID_CREDENTIALS",
      };
    }

    let adminUser: AdminUserDocument | undefined;

    // Fetch from Firestore collection admin_users
    try {
      const fsDb = getFsDb();
      if (fsDb) {
        const querySnap = await fsDb.collection("admin_users").where("email", "==", email).get();
        if (!querySnap.empty) {
          adminUser = querySnap.docs[0].data() as AdminUserDocument;
        }
      }
    } catch (err) {
      console.warn("[AdminAuthService] loginAdmin Firestore admin_users fetch error:", err);
    }

    // Check memory DB fallback if not found in Firestore
    if (!adminUser && db && db.admin_users) {
      adminUser = db.admin_users.find((u: any) => u.email && u.email.toLowerCase() === email);
    }

    // Check users collection fallback
    if (!adminUser && db && db.users) {
      const uData = db.users.find((u: any) => u.email && u.email.toLowerCase() === email);
      if (uData) {
        const saEnvEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
        const isSuperAdminEmail = Boolean(saEnvEmail && email === saEnvEmail);
        const adminRoles = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "STAFF", "FINANCE_MANAGER", "VERIFICATION_OFFICER", "READ_ONLY_AUDITOR"];

        if (adminRoles.includes(uData.role) || isSuperAdminEmail) {
          const assignedRole: AdminRoleType = isSuperAdminEmail || uData.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : (uData.role as AdminRoleType) || "ADMIN";

          adminUser = {
            uid: uData.uid || uData.id,
            email: email,
            fullName: uData.fullName || email.split("@")[0],
            role: assignedRole,
            permissions: uData.permissions?.length ? uData.permissions : ADMIN_ROLES_CONFIG[assignedRole]?.permissions || ["*"],
            status: uData.status || "ACTIVE",
            passwordHash: uData.passwordHash || "",
            salt: uData.salt || "",
            createdAt: uData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }

    // Super Admin ENV fallback
    const saEnvEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
    const saEnvPass = (process.env.SUPER_ADMIN_PASSWORD || "").trim();
    if (!adminUser && saEnvEmail && email === saEnvEmail) {
      const salt = generateSalt();
      const passwordHash = hashPassword(saEnvPass, salt);
      adminUser = {
        uid: `adm_sa_${Date.now()}`,
        email: saEnvEmail,
        fullName: "Super Admin",
        role: "SUPER_ADMIN",
        permissions: ADMIN_ROLES_CONFIG["SUPER_ADMIN"].permissions,
        status: "ACTIVE",
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!adminUser) {
      await this.recordLog(db, {
        adminEmail: email,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        ipAddress,
        details: `Admin access denied for ${email}: Account is not assigned administrative privileges.`,
        status: "FAILURE",
      });
      return {
        success: false,
        message: "Access Denied: Admin self-registration and unauthorized login are strictly blocked. Administrative access can only be assigned by the Super Admin.",
        errorType: "INVALID_CREDENTIALS",
      };
    }

    // Verify status
    if (adminUser.status !== "ACTIVE") {
      await this.recordLog(db, {
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "FAILED_LOGIN",
        ipAddress,
        details: `Login blocked: Administrator account ${email} is currently ${adminUser.status}.`,
        status: "WARNING",
      });
      return {
        success: false,
        message: `Your administrator account is currently ${adminUser.status}. Please contact the Super Admin.`,
        errorType: "DISABLED_ACCOUNT",
      };
    }

    // Check Password
    if (!adminUser.passwordHash || !adminUser.passwordHash.trim()) {
      await this.recordLog(db, {
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "FAILED_LOGIN",
        ipAddress,
        details: `Login failed: Account ${email} has no password set.`,
        status: "FAILURE",
      });
      return {
        success: false,
        message: "No password has been configured for this account. Please set a password via secure reset.",
        errorType: "INVALID_CREDENTIALS",
      };
    }

    const userSalt = (adminUser as any).salt || "";
    let isValidPass = safeCompareHash(
      hashPassword(password, userSalt),
      adminUser.passwordHash
    );

    if (!isValidPass && saEnvEmail && email === saEnvEmail && saEnvPass && password === saEnvPass) {
      isValidPass = true;
    }

    if (!isValidPass) {
      await this.recordLog(db, {
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "FAILED_LOGIN",
        ipAddress,
        details: `Login failed: Invalid password entered for administrator ${email}.`,
        status: "FAILURE",
      });
      return {
        success: false,
        message: "Invalid administrator email address or password.",
        errorType: "INVALID_CREDENTIALS",
      };
    }

    // Verify role assignment
    if (!adminUser.role || !ADMIN_ROLES_CONFIG[adminUser.role]) {
      await this.recordLog(db, {
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        action: "FAILED_LOGIN",
        ipAddress,
        details: `Login failed: No valid RBAC role assigned to ${email}.`,
        status: "FAILURE",
      });
      return {
        success: false,
        message: "Your account lacks a valid administrator role. Access denied.",
        errorType: "MISSING_ROLE",
      };
    }

    // Create session in Firestore
    const session = await this.createSession(adminUser, ipAddress);

    if (db) {
      if (!db.admin_sessions) db.admin_sessions = [];
      db.admin_sessions.unshift(session);
    }

    await this.recordLog(db, {
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: "LOGIN",
      ipAddress,
      details: `Admin user ${adminUser.fullName} (${adminUser.role}) logged in successfully.`,
      status: "SUCCESS",
    });

    return {
      success: true,
      message: `Welcome back, ${adminUser.fullName}! Logged in as ${ADMIN_ROLES_CONFIG[adminUser.role].displayName}.`,
      session,
      adminUser,
    };
  }

  /**
   * Validate Admin Session directly against Firestore collection `admin_sessions` and JWT validity.
   * Supports both validateSession(db, sessionToken) and validateSession(sessionToken).
   */
  public async validateSession(
    dbOrToken: any,
    sessionTokenParam?: string
  ): Promise<{
    valid: boolean;
    session?: AdminSession;
    message?: string;
  }> {
    const sessionToken = typeof dbOrToken === "string" ? dbOrToken : sessionTokenParam || "";

    if (!sessionToken) {
      return { valid: false, message: "No active session token provided." };
    }

    // First check JWT signature & expiration
    const jwtPayload = verifyAdminJwt(sessionToken);
    if (!jwtPayload) {
      return { valid: false, message: "Session expired or invalid token." };
    }

    if (this.revokedSessions.has(sessionToken)) {
      return { valid: false, message: "Session has been revoked or logged out." };
    }

    // Query Firestore collection `admin_sessions` for cross-instance validity
    try {
      const fsDb = getFsDb();
      if (fsDb) {
        const docSnap = await fsDb.collection("admin_sessions").doc(sessionToken).get();
        if (!docSnap.exists) {
          return { valid: false, message: "Session record not found in database." };
        }
        const sessionData = docSnap.data() as AdminSession;
        if (sessionData.status !== "ACTIVE") {
          this.revokedSessions.add(sessionToken);
          return { valid: false, message: `Session status is ${sessionData.status}.` };
        }
        if (sessionData.expiresAt && new Date(sessionData.expiresAt).getTime() <= Date.now()) {
          return { valid: false, message: "Session expired." };
        }

        // Update lastActive in Firestore
        fsDb.collection("admin_sessions").doc(sessionToken).update({
          lastActive: new Date().toISOString(),
        }).catch(() => {});

        return { valid: true, session: sessionData };
      }
    } catch (err) {
      console.warn("[AdminAuthService] validateSession Firestore check error:", err);
    }

    // Fallback using valid JWT payload
    const session: AdminSession = {
      sessionToken,
      uid: jwtPayload.uid,
      email: jwtPayload.email,
      fullName: jwtPayload.email ? jwtPayload.email.split("@")[0] : "Admin",
      role: jwtPayload.role,
      permissions: jwtPayload.permissions || ADMIN_ROLES_CONFIG[jwtPayload.role]?.permissions || [],
      loginTime: new Date().toISOString(),
      expiresAt: jwtPayload.expiresAt,
      lastActive: new Date().toISOString(),
      status: "ACTIVE",
    };

    return { valid: true, session };
  }

  /**
   * Revoke Admin Session and mark status as LOGGED_OUT in Firestore `admin_sessions`
   */
  public async logout(sessionToken: string, db?: any): Promise<{ success: boolean; message: string }> {
    return this.logoutAdmin(db, sessionToken);
  }

  /**
   * Admin Logout Handler
   */
  public async logoutAdmin(db: any, sessionToken: string): Promise<{ success: boolean; message: string }> {
    const token = typeof db === "string" ? db : sessionToken || "";
    if (token) {
      this.revokedSessions.add(token);
    }

    let sessionEmail: string | undefined;
    let sessionUid: string | undefined;
    let sessionRole: string | undefined;

    try {
      const fsDb = getFsDb();
      if (fsDb && token) {
        const docSnap = await fsDb.collection("admin_sessions").doc(token).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          sessionEmail = data?.email;
          sessionUid = data?.uid;
          sessionRole = data?.role;
        }
        await fsDb.collection("admin_sessions").doc(token).set(
          {
            sessionToken: token,
            status: "LOGGED_OUT",
            logoutTime: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("[AdminAuthService] logoutAdmin Firestore update error:", err);
    }

    await this.recordLog(db, {
      adminUid: sessionUid,
      adminEmail: sessionEmail,
      adminRole: sessionRole,
      action: "LOGOUT",
      details: `Admin user (${sessionEmail || "authenticated"}) logged out securely.`,
      status: "SUCCESS",
    });

    return { success: true, message: "You have been logged out of the Admin Panel securely." };
  }

  /**
   * Admin Forgot Password Request
   */
  public async forgotPassword(db: any, emailInput: string): Promise<{ success: boolean; message: string }> {
    const email = (emailInput || "").toLowerCase().trim();

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        const querySnap = await fsDb.collection("admin_users").where("email", "==", email).get();
        if (!querySnap.empty) {
          const adminUser = querySnap.docs[0].data();
          const token = `adm_rst_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          await this.recordLog(db, {
            adminUid: adminUser.uid,
            adminEmail: adminUser.email,
            adminRole: adminUser.role,
            action: "PASSWORD_RESET_REQUEST",
            details: `Password reset instructions requested for admin account ${email}. Token: ${token}`,
            status: "SUCCESS",
          });
        }
      }
    } catch (err) {
      console.warn("[AdminAuthService] forgotPassword Firestore error:", err);
    }

    return {
      success: true,
      message: `If an active admin account matches that email address, password recovery instructions have been dispatched.`,
    };
  }

  /**
   * Route Guard & Role Permission Evaluator
   */
  public checkRoutePermission(session: AdminSession, route: string): {
    allowed: boolean;
    reason?: string;
  } {
    if (!session || session.status !== "ACTIVE") {
      return { allowed: false, reason: "Unauthorized: Active admin session required." };
    }

    if (session.role === "SUPER_ADMIN" || session.permissions.includes("*")) {
      return { allowed: true };
    }

    const requiredPermissions = ADMIN_ROUTE_PERMISSIONS[route];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return { allowed: true };
    }

    const hasRequired = requiredPermissions.some((perm) => session.permissions.includes(perm));

    if (!hasRequired) {
      return {
        allowed: false,
        reason: `Access Denied: Your role (${ADMIN_ROLES_CONFIG[session.role]?.displayName || session.role}) lacks permissions for ${route}.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if Admin Session has specific permission
   */
  public hasPermission(session: AdminSession | null, permission: string): boolean {
    if (!session || session.status !== "ACTIVE") return false;
    if (session.role === "SUPER_ADMIN" || session.permissions.includes("*")) return true;
    return session.permissions.includes(permission);
  }

  /**
   * Retrieve Admin Users List from Firestore
   */
  public async getAdminUsers(db: any, requestingSession: AdminSession): Promise<AdminUserDocument[]> {
    try {
      const fsDb = getFsDb();
      if (fsDb) {
        const querySnap = await fsDb.collection("admin_users").get();
        if (!querySnap.empty) {
          return querySnap.docs.map((doc) => {
            const u = doc.data() as AdminUserDocument;
            return {
              uid: u.uid,
              email: u.email,
              fullName: u.fullName,
              role: u.role,
              permissions: u.permissions || ADMIN_ROLES_CONFIG[u.role as AdminRoleType]?.permissions || [],
              status: u.status,
              lastLogin: u.lastLogin,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt,
            };
          });
        }
      }
    } catch (err) {
      console.warn("[AdminAuthService] getAdminUsers Firestore error:", err);
    }

    return (db?.admin_users || []).map((u: any) => ({
      uid: u.uid,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      permissions: u.permissions || ADMIN_ROLES_CONFIG[u.role as AdminRoleType]?.permissions || [],
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  /**
   * Automated Self-Test Suite for Module 1 — Admin Authentication & RBAC
   */
  public async runModule1SelfTests(db: any): Promise<{
    allPassed: boolean;
    results: AdminTestResult[];
    metrics: any;
  }> {
    const results: AdminTestResult[] = [];

    const saEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
    const saPass = (process.env.SUPER_ADMIN_PASSWORD || "").trim();

    // Test 1: Super Admin Login
    const t1Start = Date.now();
    try {
      if (!saEmail || !saPass) {
        throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required for testing.");
      }
      const res = await this.loginAdmin(db, saEmail, saPass, "127.0.0.1");
      if (res.success && res.session && res.session.role === "SUPER_ADMIN") {
        results.push({
          testName: "1. Super Admin Authentication & Token Generation",
          status: "PASSED",
          durationMs: Date.now() - t1Start,
          details: `Super Admin logged in. Session Token: ${res.session.sessionToken.slice(0, 15)}...`,
        });
      } else {
        throw new Error(res.message || "Super Admin login failed.");
      }
    } catch (err: any) {
      results.push({
        testName: "1. Super Admin Authentication & Token Generation",
        status: "FAILED",
        durationMs: Date.now() - t1Start,
        details: err.message,
      });
    }

    // Test 2: Standard Admin & Finance Manager Role Validation
    const t2Start = Date.now();
    const tempFinUid = `adm_test_fin_${Date.now()}`;
    const tempFinEmail = `test_fin_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.local`;
    const tempFinPass = `TestFinPass_${Date.now()}!`;
    const tempFinSalt = generateSalt();
    const tempFinHash = hashPassword(tempFinPass, tempFinSalt);

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempFinUid).set({
          uid: tempFinUid,
          email: tempFinEmail,
          fullName: "Test Finance Admin",
          role: "FINANCE_MANAGER",
          permissions: ADMIN_ROLES_CONFIG.FINANCE_MANAGER.permissions,
          status: "ACTIVE",
          passwordHash: tempFinHash,
          salt: tempFinSalt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const financeRes = await this.loginAdmin(db, tempFinEmail, tempFinPass, "127.0.0.1");
      if (financeRes.success && financeRes.session && financeRes.session.role === "FINANCE_MANAGER") {
        const canAccessWallet = this.hasPermission(financeRes.session, "MANAGE_WALLET");
        const canAccessSuperSetting = this.hasPermission(financeRes.session, "MANAGE_SUBADMINS");
        if (canAccessWallet && !canAccessSuperSetting) {
          results.push({
            testName: "2. Role-Based Permission Matrix (Finance Manager)",
            status: "PASSED",
            durationMs: Date.now() - t2Start,
            details: "Finance Manager permissions verified (Wallet allowed, SubAdmin management denied).",
          });
        } else {
          throw new Error("Permission matrix check returned invalid permission allowance.");
        }
      } else {
        throw new Error(financeRes.message || "Finance Manager login failed.");
      }
    } catch (err: any) {
      results.push({
        testName: "2. Role-Based Permission Matrix (Finance Manager)",
        status: "FAILED",
        durationMs: Date.now() - t2Start,
        details: err.message,
      });
    } finally {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempFinUid).delete().catch(() => {});
      }
    }

    // Test 3: Disabled Account & Wrong Password Failure Handling
    const t3Start = Date.now();
    const tempAudUid = `adm_test_aud_${Date.now()}`;
    const tempAudEmail = `test_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.local`;
    const tempAudPass = `TestAudPass_${Date.now()}!`;
    const tempAudSalt = generateSalt();
    const tempAudHash = hashPassword(tempAudPass, tempAudSalt);

    try {
      const wrongPassRes = await this.loginAdmin(db, saEmail, "WrongPassword123!");

      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempAudUid).set({
          uid: tempAudUid,
          email: tempAudEmail,
          fullName: "Test Suspended Auditor",
          role: "READ_ONLY_AUDITOR",
          permissions: [],
          status: "SUSPENDED",
          passwordHash: tempAudHash,
          salt: tempAudSalt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      let disabledCaught = false;
      const disabledRes = await this.loginAdmin(db, tempAudEmail, tempAudPass);
      if (!disabledRes.success && disabledRes.errorType === "DISABLED_ACCOUNT") {
        disabledCaught = true;
      }

      if (!wrongPassRes.success && wrongPassRes.errorType === "INVALID_CREDENTIALS" && disabledCaught) {
        results.push({
          testName: "3. Invalid Credentials & Account Suspension Guard",
          status: "PASSED",
          durationMs: Date.now() - t3Start,
          details: "Successfully rejected wrong password and blocked suspended administrator account.",
        });
      } else {
        throw new Error("Failed to properly reject invalid credentials or disabled accounts.");
      }
    } catch (err: any) {
      results.push({
        testName: "3. Invalid Credentials & Account Suspension Guard",
        status: "FAILED",
        durationMs: Date.now() - t3Start,
        details: err.message,
      });
    } finally {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempAudUid).delete().catch(() => {});
      }
    }

    // Test 4: Session Inactivity & Timeout Verification
    const t4Start = Date.now();
    try {
      const loginRes = await this.loginAdmin(db, saEmail, saPass);
      if (loginRes.session) {
        const expiredToken = signAdminJwt({
          uid: loginRes.session.uid,
          email: loginRes.session.email,
          role: loginRes.session.role,
          permissions: loginRes.session.permissions,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const valRes = await this.validateSession(db, expiredToken);

        if (!valRes.valid) {
          results.push({
            testName: "4. Session Inactivity Timeout Guard",
            status: "PASSED",
            durationMs: Date.now() - t4Start,
            details: "Expired session correctly invalidated upon session check.",
          });
        } else {
          throw new Error("Expired session was incorrectly validated as active.");
        }
      } else {
        throw new Error("Session creation failed for timeout test.");
      }
    } catch (err: any) {
      results.push({
        testName: "4. Session Inactivity Timeout Guard",
        status: "FAILED",
        durationMs: Date.now() - t4Start,
        details: err.message,
      });
    }

    // Test 5: Route Guard Enforcement & Access Control
    const t5Start = Date.now();
    const tempSuppUid = `adm_test_vo_${Date.now()}`;
    const tempSuppEmail = `test_vo_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.local`;
    const tempSuppPass = `TestVoPass_${Date.now()}!`;
    const tempSuppSalt = generateSalt();
    const tempSuppHash = hashPassword(tempSuppPass, tempSuppSalt);

    try {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempSuppUid).set({
          uid: tempSuppUid,
          email: tempSuppEmail,
          fullName: "Test Verification Officer",
          role: "VERIFICATION_OFFICER",
          permissions: ADMIN_ROLES_CONFIG.VERIFICATION_OFFICER.permissions,
          status: "ACTIVE",
          passwordHash: tempSuppHash,
          salt: tempSuppSalt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const supportRes = await this.loginAdmin(db, tempSuppEmail, tempSuppPass);
      if (supportRes.session) {
        const checkWalletRoute = this.checkRoutePermission(supportRes.session, "/admin/wallet");
        const checkReportsRoute = this.checkRoutePermission(supportRes.session, "/admin/dashboard");

        if (!checkWalletRoute.allowed && checkReportsRoute.allowed) {
          results.push({
            testName: "5. Route Guard & Path Access Restriction",
            status: "PASSED",
            durationMs: Date.now() - t5Start,
            details: "Route guard restricted Verification Officer from /admin/wallet while allowing /admin/dashboard.",
          });
        } else {
          throw new Error("Route guard failed to enforce path permissions.");
        }
      } else {
        throw new Error("Verification Officer login failed for route guard test.");
      }
    } catch (err: any) {
      results.push({
        testName: "5. Route Guard & Path Access Restriction",
        status: "FAILED",
        durationMs: Date.now() - t5Start,
        details: err.message,
      });
    } finally {
      const fsDb = getFsDb();
      if (fsDb) {
        await fsDb.collection("admin_users").doc(tempSuppUid).delete().catch(() => {});
      }
    }

    const allPassed = results.every((r) => r.status === "PASSED");

    return {
      allPassed,
      results,
      metrics: {
        totalAdminUsers: (db?.admin_users || []).length,
        activeSessions: 1,
        totalActivityLogs: (db?.admin_activity_logs || []).length,
      },
    };
  }
}

export const adminAuthService = AdminAuthService.getInstance();
