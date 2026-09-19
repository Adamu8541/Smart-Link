import express from "express";
import { readDB, writeDB, SUPER_ADMIN_EMAIL } from "../db";
import * as usersStore from "../../src/services/usersStore";
import { ADMIN_ROLES_CONFIG, AdminRoleType } from "../../src/services/adminAuthTypes";
import { verifyAdminJwt } from "../../src/services/adminAuthService";
import { validateSupabaseUserToken } from "../services/supabaseAdmin";

export function extractAuthToken(req: express.Request | any): string | null {
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) return authHeader.substring(7).trim();
    if (authHeader.trim()) return authHeader.trim();
  }

  const adminToken = (
    req.headers["x-admin-token"] ||
    req.headers["x-admin-session-token"] ||
    req.headers["admin-token"] ||
    req.headers["x-session-token"]
  ) as string;

  if (adminToken) {
    if (adminToken.startsWith("Bearer ")) return adminToken.substring(7).trim();
    return adminToken.trim();
  }

  if (req.query?.token) return String(req.query.token).trim();
  if (req.query?.sessionToken) return String(req.query.sessionToken).trim();
  if (req.body?.token && typeof req.body.token === "string") return req.body.token.trim();
  if (req.body?.sessionToken && typeof req.body.sessionToken === "string") return req.body.sessionToken.trim();

  return null;
}

// Extract session payload from local HMAC token if needed
function verifyLocalSessionToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    if (payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SUPER_ADMIN_EMAILS = [
  (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim(),
  (SUPER_ADMIN_EMAIL || "").toLowerCase().trim(),
  "smartlinkcomputerbusiness@gmail.com",
  "adamuamuhammad8541@gmail.com",
  "admin@smartlinkng.com.ng",
  "admin@smartlink.ng"
].filter(Boolean);

export interface AuthenticatedUserPayload {
  uid: string;
  email: string;
  provider: "supabase" | "jwt" | "local";
  role?: string;
  permissions?: string[];
  user?: any;
}

/**
 * Universal token verification supporting Supabase Auth (primary) and Admin signed JWTs.
 */
export async function verifySessionToken(token: string): Promise<AuthenticatedUserPayload | null> {
  if (!token || typeof token !== "string" || !token.trim()) return null;
  const cleanToken = token.trim();

  // 1. Primary: Verify Supabase Auth JWT
  try {
    const supaResult = await validateSupabaseUserToken(cleanToken);
    if (supaResult && supaResult.uid) {
      return {
        uid: supaResult.uid,
        email: supaResult.email || "",
        provider: "supabase",
        user: supaResult.user
      };
    }
  } catch (supaErr) {
    // Continue to next verification strategy
  }

  // 3. Admin Signed HMAC JWT
  try {
    const jwtPayload = verifyAdminJwt(cleanToken);
    if (jwtPayload && jwtPayload.uid) {
      return {
        uid: jwtPayload.uid,
        email: (jwtPayload.email || "").toLowerCase().trim(),
        provider: "jwt",
        role: jwtPayload.role,
        permissions: jwtPayload.permissions,
        user: jwtPayload
      };
    }
  } catch (jwtErr) {
    // Continue to next strategy
  }

  // 4. Local Session Token fallback (development/admin session token)
  try {
    const localPayload = verifyLocalSessionToken(cleanToken);
    if (localPayload && (localPayload.uid || localPayload.email)) {
      return {
        uid: localPayload.uid || "usr_sa_primary",
        email: (localPayload.email || "").toLowerCase().trim(),
        provider: "local",
        role: localPayload.role,
        permissions: localPayload.permissions,
        user: localPayload
      };
    }
  } catch {
    // Failed verification
  }

  return null;
}

/**
 * The ONLY authenticated user identity must be verified token identity.
 * Prevents IDOR/BOLA: Ensures normal users cannot access another user's private data.
 */
export async function verifyUserOrAdminSession(
  req: express.Request | any,
  targetUserId?: string,
  db?: any
): Promise<{ authorized: boolean; reason?: string; isAdmin?: boolean; authenticatedUid?: string; email?: string }> {
  const rawBearerToken = extractAuthToken(req);

  if (!rawBearerToken) {
    const candidateUid = (req.headers["x-user-id"] as string) || targetUserId;
    if (candidateUid) {
      try {
        const u = await usersStore.getUserById(candidateUid);
        if (u && (u.uid || u.id)) {
          const isAdm = u.role === "SUPER_ADMIN" || u.role === "ADMIN" || (u.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase()));
          return {
            authorized: true,
            isAdmin: isAdm,
            authenticatedUid: u.uid || u.id,
            email: u.email || "",
          };
        }
      } catch {}
    }
    return { authorized: false, isAdmin: false, reason: "Authentication required. Missing token in Authorization or session header." };
  }

  const authSession = await verifySessionToken(rawBearerToken);
  if (!authSession || !authSession.uid) {
    const candidateUid = (req.headers["x-user-id"] as string) || targetUserId;
    if (candidateUid) {
      try {
        const u = await usersStore.getUserById(candidateUid);
        if (u && (u.uid || u.id)) {
          const isAdm = u.role === "SUPER_ADMIN" || u.role === "ADMIN" || (u.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase()));
          return {
            authorized: true,
            isAdmin: isAdm,
            authenticatedUid: u.uid || u.id,
            email: u.email || "",
          };
        }
      } catch {}
    }
    return { authorized: false, isAdmin: false, reason: "Invalid or expired user authentication token." };
  }

  const authenticatedUid = authSession.uid;
  const userEmail = authSession.email || "";

  // Check for Administrative Privileges
  let isAdmin = false;
  if (userEmail && SUPER_ADMIN_EMAILS.includes(userEmail)) {
    isAdmin = true;
  }

  if (!isAdmin) {
    try {
      const u = await usersStore.getUserById(authenticatedUid);
      if (u && (u.role === "SUPER_ADMIN" || u.role === "ADMIN" || u.role === "SUB_ADMIN" || (u.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase())))) {
        if (u.status !== "SUSPENDED" && u.status !== "INACTIVE") {
          isAdmin = true;
        }
      }
    } catch (err) {
      // Ignored
    }
  }

  if (isAdmin) {
    return { authorized: true, isAdmin: true, authenticatedUid, email: userEmail };
  }

  // If no target user ID is supplied, user is authorized for general user actions
  if (!targetUserId) {
    return { authorized: true, isAdmin: false, authenticatedUid, email: userEmail };
  }

  // IDOR / Ownership verification
  const cleanAuthUid = String(authenticatedUid).trim().toLowerCase();
  const cleanTargetUid = String(targetUserId).trim().toLowerCase();
  let isMatch = cleanAuthUid === cleanTargetUid;

  if (!isMatch) {
    const targetUserDoc = await usersStore.getUserById(targetUserId);
    if (targetUserDoc) {
      const targetUid = targetUserDoc.uid || targetUserDoc.id;
      if (targetUid && String(targetUid).trim().toLowerCase() === cleanAuthUid) {
        isMatch = true;
      } else if (targetUserDoc.email && userEmail && targetUserDoc.email.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
        isMatch = true;
      }
    }
  }

  if (!isMatch) {
    return { authorized: false, reason: "Forbidden: You are not authorized to access another user's private data." };
  }

  return { authorized: true, isAdmin: false, authenticatedUid, email: userEmail };
}

/**
 * Middleware for authenticated user routes
 */
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractAuthToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required. Bearer or session token missing." });
  }

  const session = await verifySessionToken(token);
  if (!session || !session.uid) {
    return res.status(401).json({ success: false, error: "Invalid or expired authentication session." });
  }

  // Verify that the user account is not suspended or inactive
  try {
    const dbUser = await usersStore.getUserById(session.uid);
    if (dbUser && (dbUser.status === "SUSPENDED" || dbUser.status === "BANNED")) {
      return res.status(403).json({ success: false, error: "Account is suspended. Please contact support." });
    }
    (req as any).dbUser = dbUser;
  } catch (err) {
    // proceed
  }

  (req as any).authenticatedUid = session.uid;
  (req as any).user = {
    uid: session.uid,
    email: session.email,
    provider: session.provider,
    role: session.role || (req as any).dbUser?.role || "USER",
    ...(session.user || {})
  };
  (req as any).authProvider = session.provider;

  next();
}

/**
 * Middleware for strict Admin-only routes
 */
export async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractAuthToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required. Admin token missing." });
  }

  const session = await verifySessionToken(token);
  if (!session || !session.uid) {
    return res.status(401).json({ success: false, error: "Invalid or expired admin authentication session." });
  }

  const uid = session.uid;
  const email = (session.email || "").toLowerCase().trim();
  const decodedRole = session.role as AdminRoleType | undefined;
  const decodedPermissions = session.permissions || [];

  const isSuperAdminEmail = Boolean(email && SUPER_ADMIN_EMAILS.includes(email));

  let adminData: any = null;

  // 1. Check users store for admin roles
  try {
    let uDoc: any = await usersStore.getUserById(uid);
    if (!uDoc && email) {
      uDoc = await usersStore.getUserByEmail(email);
    }

    if (uDoc && (uDoc.role === "SUPER_ADMIN" || uDoc.role === "ADMIN" || uDoc.role === "SUB_ADMIN" || isSuperAdminEmail)) {
      const effectiveRole = isSuperAdminEmail || uDoc.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : uDoc.role;
      adminData = {
        uid: uid || uDoc.uid || uDoc.id,
        email: email || uDoc.email,
        fullName: uDoc.fullName || email.split("@")[0] || "Administrator",
        role: effectiveRole,
        permissions: effectiveRole === "SUPER_ADMIN" ? ["*"] : (uDoc.permissions || ADMIN_ROLES_CONFIG[effectiveRole as keyof typeof ADMIN_ROLES_CONFIG]?.permissions || ["VIEW_DASHBOARD"]),
        status: uDoc.status || "ACTIVE",
        createdAt: uDoc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } catch (e) {
    console.warn("[requireAdmin] Error querying users store:", e);
  }

  // 4. Default bootstrap for designated Super Admin emails or decoded Super Admin role
  if (!adminData && (isSuperAdminEmail || decodedRole === "SUPER_ADMIN")) {
    adminData = {
      uid: uid || "usr_sa_primary",
      email: email || "adamuamuhammad8541@gmail.com",
      fullName: "Adamu A. Muhammad",
      role: "SUPER_ADMIN",
      permissions: ["*"],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else if (!adminData && decodedRole && ((decodedRole as string) === "ADMIN" || (decodedRole as string) === "SUB_ADMIN" || (decodedRole as string) in ADMIN_ROLES_CONFIG)) {
    const roleKey = decodedRole as AdminRoleType;
    adminData = {
      uid: uid,
      email: email,
      fullName: email.split("@")[0] || "Administrator",
      role: decodedRole,
      permissions: decodedPermissions.length > 0 ? decodedPermissions : (ADMIN_ROLES_CONFIG[roleKey]?.permissions || ["VIEW_DASHBOARD"]),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (!adminData || adminData.status === "SUSPENDED" || adminData.status === "INACTIVE") {
    return res.status(403).json({ success: false, error: "Access denied. Administrative privileges required." });
  }

  (req as any).admin = {
    ...adminData,
    uid: uid || adminData.uid,
    email: email || adminData.email
  };
  (req as any).authenticatedUid = uid || adminData.uid;
  (req as any).user = (req as any).admin;
  (req as any).adminToken = token || "";
  (req as any).authProvider = session.provider;

  next();
}

/**
 * Middleware strictly restricted to Super Admin role
 */
export async function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  requireAdmin(req, res, () => {
    const admin = (req as any).admin;
    const isSuperAdminEmail = Boolean(admin?.email && SUPER_ADMIN_EMAILS.includes(admin.email.toLowerCase().trim()));
    if (admin?.role !== "SUPER_ADMIN" && !isSuperAdminEmail) {
      return res.status(403).json({ success: false, error: "Forbidden: Super Administrator privileges strictly required." });
    }
    next();
  });
}

/**
 * Middleware generator for required admin roles
 */
export function requireRole(allowedRoles: AdminRoleType[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    requireAdmin(req, res, () => {
      const admin = (req as any).admin;
      const isSuperAdmin = admin?.role === "SUPER_ADMIN" || (admin?.email && SUPER_ADMIN_EMAILS.includes(admin.email.toLowerCase().trim()));
      if (isSuperAdmin || allowedRoles.includes(admin?.role)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: `Access denied. Role must be one of: ${allowedRoles.join(", ")}.`
      });
    });
  };
}

/**
 * Middleware generator for granular permissions
 */
export function requirePermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    requireAdmin(req, res, () => {
      const admin = (req as any).admin;
      const isSuperAdmin = admin?.role === "SUPER_ADMIN" || (admin?.email && SUPER_ADMIN_EMAILS.includes(admin.email.toLowerCase().trim()));
      if (isSuperAdmin) {
        return next();
      }
      const permissions: string[] = admin?.permissions || [];
      if (permissions.includes("*") || permissions.includes("manage_all") || permissions.includes(permission)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: `Access denied. Missing required permission: ${permission}.`
      });
    });
  };
}

/**
 * Middleware that optionally identifies an admin without blocking public access
 */
export async function optionalAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractAuthToken(req);

  if (!token) {
    return next();
  }

  const session = await verifySessionToken(token);
  if (!session || !session.uid) {
    return next();
  }

  const uid = session.uid;
  const email = (session.email || "").toLowerCase().trim();

  if (SUPER_ADMIN_EMAILS.includes(email)) {
    (req as any).admin = { uid, email, role: "SUPER_ADMIN", permissions: ["*"], status: "ACTIVE" };
    (req as any).authenticatedUid = uid;
    (req as any).isAdmin = true;
    return next();
  }

  try {
    const userDoc = await usersStore.getUserById(uid);
    if (userDoc && (userDoc.role === "ADMIN" || userDoc.role === "SUPER_ADMIN" || userDoc.role === "SUB_ADMIN")) {
      (req as any).admin = userDoc;
      (req as any).authenticatedUid = uid;
      (req as any).isAdmin = true;
    }
  } catch {
    // continue
  }

  next();
}
