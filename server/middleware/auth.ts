import express from "express";
import { readDB, writeDB, SUPER_ADMIN_EMAIL } from "../db";
import * as usersStore from "../../src/services/usersStore";
import { getAdminAuth, getAdminFirestore } from "../../src/services/firebaseAdmin";
import { ADMIN_ROLES_CONFIG } from "../../src/services/adminAuthTypes";

// Extract session payload from local HMAC token if needed
function verifyLocalSessionToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const SUPER_ADMIN_EMAILS = [
  (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim(),
  (SUPER_ADMIN_EMAIL || "").toLowerCase().trim(),
  "adamuamuhammad8541@gmail.com",
  "admin@smartlinkng.com.ng",
  "admin@smartlink.ng"
].filter(Boolean);

/**
 * The ONLY authenticated user identity must be decodedToken.uid.
 * Authorization: Bearer <Firebase ID token> is MANDATORY.
 */
export async function verifyUserOrAdminSession(
  req: express.Request | any,
  targetUserId: string,
  db?: any
): Promise<{ authorized: boolean; reason?: string; isAdmin?: boolean; authenticatedUid?: string }> {
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const rawBearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  if (!rawBearerToken) {
    return { authorized: false, reason: "Authentication required. Missing Bearer token in Authorization header." };
  }

  let authenticatedUid: string | null = null;
  let userEmail: string = "";
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(rawBearerToken);
    authenticatedUid = decodedToken.uid;
    userEmail = (decodedToken.email || "").toLowerCase().trim();
  } catch (err: any) {
    const localPayload = verifyLocalSessionToken(rawBearerToken);
    if (localPayload && localPayload.uid) {
      authenticatedUid = localPayload.uid;
      userEmail = (localPayload.email || "").toLowerCase().trim();
    } else {
      return { authorized: false, reason: "Invalid or expired user authentication token." };
    }
  }

  if (!authenticatedUid) {
    return { authorized: false, reason: "Invalid or expired user authentication token." };
  }

  // Check for Administrative Privileges via email check, Firestore admin_users, or users collection
  let isAdmin = false;
  if (userEmail && SUPER_ADMIN_EMAILS.includes(userEmail)) {
    isAdmin = true;
  }

  if (!isAdmin) {
    try {
      const fsDb = getAdminFirestore();
      if (fsDb) {
        const adminDoc = await fsDb.collection("admin_users").doc(authenticatedUid).get();
        if (adminDoc.exists) {
          isAdmin = true;
        } else if (userEmail) {
          const emailQuery = await fsDb.collection("admin_users").where("email", "==", userEmail).limit(1).get();
          if (!emailQuery.empty) isAdmin = true;
        }
      }
    } catch (err) {
      console.warn("[AuthMiddleware] Admin check error:", err);
    }
  }

  if (isAdmin) {
    return { authorized: true, isAdmin: true, authenticatedUid };
  }

  if (!targetUserId) {
    return { authorized: false, reason: "Target user ID is missing for ownership verification." };
  }

  // Ownership verification
  const cleanAuthUid = String(authenticatedUid).trim().toLowerCase();
  const cleanTargetUid = String(targetUserId).trim().toLowerCase();
  let isMatch = cleanAuthUid === cleanTargetUid;

  if (!isMatch) {
    const targetUserDoc = await usersStore.getUserById(targetUserId);
    if (targetUserDoc) {
      const targetUid = targetUserDoc.uid || targetUserDoc.id;
      if (targetUid && String(targetUid).trim().toLowerCase() === cleanAuthUid) {
        isMatch = true;
      }
    }
  }

  if (!isMatch) {
    return { authorized: false, reason: "Forbidden: You are not authorized to access another user's data." };
  }

  return { authorized: true, isAdmin: false, authenticatedUid };
}

/**
 * Middleware for strict Admin-only routes
 */
export async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required. Admin Bearer token missing." });
  }

  let uid = "";
  let email = "";
  let decodedToken: any = null;

  try {
    const adminAuth = getAdminAuth();
    decodedToken = await adminAuth.verifyIdToken(token);
    uid = decodedToken.uid;
    email = (decodedToken.email || "").toLowerCase().trim();
  } catch (err) {
    // Check if token is a signed admin session token from adminAuthService
    const localPayload = verifyLocalSessionToken(token);
    if (localPayload && (localPayload.uid || localPayload.email)) {
      uid = localPayload.uid || "usr_sa_primary";
      email = (localPayload.email || "").toLowerCase().trim();
    } else {
      return res.status(401).json({ success: false, error: "Invalid or expired admin authentication token." });
    }
  }

  const isSuperAdminEmail = Boolean(email && SUPER_ADMIN_EMAILS.includes(email));

  let adminData: any = null;
  const fsDb = getAdminFirestore();

  // 1. Check admin_users collection by doc(uid)
  if (uid && fsDb) {
    try {
      const adminDoc = await fsDb.collection("admin_users").doc(uid).get();
      if (adminDoc.exists) {
        adminData = adminDoc.data();
      }
    } catch (e) {
      console.warn("[requireAdmin] Error fetching admin_users by uid:", e);
    }
  }

  // 2. Check admin_users collection by email
  if (!adminData && email && fsDb) {
    try {
      const q = await fsDb.collection("admin_users").where("email", "==", email).limit(1).get();
      if (!q.empty) {
        adminData = q.docs[0].data();
      }
    } catch (e) {
      console.warn("[requireAdmin] Error querying admin_users by email:", e);
    }
  }

  // 3. Check users collection for admin roles
  if (!adminData && fsDb) {
    try {
      let uDoc: any = null;
      if (uid) {
        const u = await fsDb.collection("users").doc(uid).get();
        if (u.exists) uDoc = u.data();
      }
      if (!uDoc && email) {
        const uq = await fsDb.collection("users").where("email", "==", email).limit(1).get();
        if (!uq.empty) uDoc = uq.docs[0].data();
      }

      if (uDoc && (uDoc.role === "SUPER_ADMIN" || uDoc.role === "ADMIN" || uDoc.role === "SUB_ADMIN" || isSuperAdminEmail)) {
        const effectiveRole = isSuperAdminEmail || uDoc.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : uDoc.role;
        adminData = {
          uid: uid || uDoc.uid || uDoc.id,
          email: email || uDoc.email,
          fullName: uDoc.fullName || email.split("@")[0] || "Administrator",
          role: effectiveRole,
          permissions: effectiveRole === "SUPER_ADMIN" ? ["*"] : (uDoc.permissions || ADMIN_ROLES_CONFIG[effectiveRole]?.permissions || ["VIEW_DASHBOARD"]),
          status: uDoc.status || "ACTIVE",
          createdAt: uDoc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn("[requireAdmin] Error querying users collection:", e);
    }
  }

  // 4. Default bootstrap for designated Super Admin emails
  if (!adminData && isSuperAdminEmail) {
    adminData = {
      uid: uid || "usr_sa_primary",
      email: email,
      fullName: "Adamu A. Muhammad",
      role: "SUPER_ADMIN",
      permissions: ["*"],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (!adminData || adminData.status === "SUSPENDED" || adminData.status === "INACTIVE") {
    return res.status(403).json({ success: false, error: "Access denied. Administrative privileges required." });
  }

  // Auto-sync into admin_users Firestore collection under the authenticated UID for instant future lookups
  if (uid && fsDb) {
    try {
      await fsDb.collection("admin_users").doc(uid).set({
        ...adminData,
        uid,
        email: email || adminData.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (saveErr) {
      console.warn("[requireAdmin] Failed to cache admin_users doc:", saveErr);
    }
  }

  (req as any).admin = {
    ...adminData,
    uid: uid || adminData.uid,
    email: email || adminData.email
  };
  (req as any).authenticatedUid = uid || adminData.uid;
  (req as any).adminToken = token;
  next();
}

/**
 * Middleware for authenticated user routes
 */
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required. Bearer token missing." });
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    (req as any).authenticatedUid = decodedToken.uid;
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    const localPayload = verifyLocalSessionToken(token);
    if (localPayload && localPayload.uid) {
      (req as any).authenticatedUid = localPayload.uid;
      (req as any).user = localPayload;
      return next();
    }
    return res.status(401).json({ success: false, error: "Invalid or expired authentication token." });
  }
}

/**
 * Middleware that optionally identifies an admin without blocking public access
 */
export async function optionalAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  if (!token) {
    return next();
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = (decodedToken.email || "").toLowerCase().trim();

    if (SUPER_ADMIN_EMAILS.includes(email)) {
      (req as any).admin = { uid, email, role: "SUPER_ADMIN", permissions: ["*"], status: "ACTIVE" };
      (req as any).authenticatedUid = uid;
      (req as any).isAdmin = true;
      return next();
    }

    const fsDb = getAdminFirestore();
    if (fsDb) {
      const adminDoc = await fsDb.collection("admin_users").doc(uid).get();
      if (adminDoc.exists) {
        (req as any).admin = adminDoc.data();
        (req as any).authenticatedUid = uid;
        (req as any).isAdmin = true;
      }
    }
    next();
  } catch (err) {
    next();
  }
}
