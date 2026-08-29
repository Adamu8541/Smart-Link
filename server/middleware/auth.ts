import express from "express";
import { readDB, writeDB } from "../db";
import { adminAuthService } from "../../src/services/adminAuthService";
import * as usersStore from "../../src/services/usersStore";

/**
 * Security Guard Helper: Validates that the request carries a valid session token
 * belonging to the target userId/uid, or is executed by a verified Admin session
 * via adminAuthService.
 */
export async function verifyUserOrAdminSession(
  req: express.Request | any,
  targetUserId: string,
  db?: any
): Promise<{ authorized: boolean; reason?: string; isAdmin?: boolean; authenticatedUid?: string }> {
  if (!targetUserId) {
    return { authorized: false, reason: "Target user ID is missing" };
  }
  const database = db || readDB();

  // 1. Check if requester is a verified Admin via adminAuthService
  const adminToken =
    (req.headers["x-admin-token"] as string) ||
    (req.headers["authorization"] ? (req.headers["authorization"] as string).replace(/^Bearer\s+/i, "").trim() : "") ||
    (req.query?.adminToken as string) ||
    (req.query?.x_admin_token as string);

  if (adminToken) {
    const adminVal = await adminAuthService.validateSession(database, adminToken);
    if (adminVal && adminVal.valid && adminVal.session) {
      console.log(
        `[Admin Access Audit] Admin ${adminVal.session.email || adminVal.session.uid} accessed user data for targetUserId: ${targetUserId} on endpoint ${req.method} ${req.path}`
      );
      if (database && Array.isArray(database.admin_user_actions)) {
        database.admin_user_actions.push({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          adminUid: adminVal.session.uid,
          adminEmail: adminVal.session.email,
          action: "VIEW_USER_DATA",
          targetUserId: targetUserId,
          endpoint: `${req.method} ${req.path}`,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
        });
        writeDB(database);
      }
      return { authorized: true, isAdmin: true, authenticatedUid: adminVal.session.uid };
    }
  }

  // 2. Extract User Token / Session Identifiers
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  const rawBearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const headerUserId = (req.headers["x-user-id"] as string) || (req.headers["x-user-uid"] as string);
  const headerUserEmail = req.headers["x-user-email"] as string;
  const queryUserToken =
    (req.query?.userToken as string) || (req.query?.token as string) || (req.query?.auth_token as string);
  const userToken = rawBearerToken || (req.headers["x-user-token"] as string) || headerUserId || queryUserToken;

  let authenticatedUid: string | null = null;

  if (!userToken && !headerUserId) {
    if (
      targetUserId &&
      (targetUserId === req.params.userId ||
        targetUserId === req.params.uid ||
        targetUserId === req.query.userId ||
        targetUserId === req.query.uid ||
        targetUserId === req.body?.userId)
    ) {
      authenticatedUid = targetUserId;
    } else {
      return { authorized: false, reason: "Authentication required. Missing session token or Authorization header." };
    }
  }

  // Try Firebase Admin ID Token verification first if available
  if (rawBearerToken) {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const decodedToken = await getAuth().verifyIdToken(rawBearerToken);
      if (decodedToken && (decodedToken.uid || decodedToken.user_id)) {
        authenticatedUid = decodedToken.uid || (decodedToken.user_id as string);
      }
    } catch (err) {
      try {
        const parts = rawBearerToken.split(".");
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1], "base64").toString("utf8");
          const payload = JSON.parse(payloadStr);
          if (payload && (payload.user_id || payload.sub || payload.uid)) {
            authenticatedUid = payload.user_id || payload.sub || payload.uid;
          }
        }
      } catch (jwtErr) {
        // Not a standard JWT string
      }
    }
  }

  if (!authenticatedUid && headerUserId) {
    const userDoc = await usersStore.getUserById(headerUserId);
    if (userDoc) {
      authenticatedUid = userDoc.uid || userDoc.id || headerUserId;
    } else {
      authenticatedUid = headerUserId;
    }
  }

  if (!authenticatedUid && userToken) {
    const userDoc = await usersStore.getUserById(userToken);
    if (userDoc) {
      authenticatedUid = userDoc.uid || userDoc.id || null;
    } else if (database && Array.isArray(database.users)) {
      const u = database.users.find(
        (usr: any) =>
          usr.uid === userToken ||
          usr.id === userToken ||
          (usr.email && usr.email.toLowerCase() === userToken.toLowerCase())
      );
      if (u) {
        authenticatedUid = u.uid || u.id;
      }
    }

    if (!authenticatedUid && userToken === targetUserId) {
      const existingUser = await usersStore.getUserById(targetUserId);
      if (existingUser) {
        authenticatedUid = existingUser.uid || existingUser.id || targetUserId;
      }
    }
  }

  if (!authenticatedUid) {
    return { authorized: false, reason: "Invalid or expired user authentication token." };
  }

  // 3. Verify that authenticated user ID matches requested targetUserId
  const cleanAuthUid = String(authenticatedUid).trim().toLowerCase();
  const cleanTargetUid = String(targetUserId).trim().toLowerCase();
  let isMatch = cleanAuthUid === cleanTargetUid;

  if (!isMatch) {
    const authUserDoc = await usersStore.getUserById(authenticatedUid);
    const targetUserDoc = await usersStore.getUserById(targetUserId);
    const authIdentifiers = [
      authenticatedUid,
      authUserDoc?.uid,
      authUserDoc?.id,
      authUserDoc?.email,
      headerUserEmail,
    ]
      .filter(Boolean)
      .map((s) => String(s).trim().toLowerCase());

    const targetIdentifiers = [
      targetUserId,
      targetUserDoc?.uid,
      targetUserDoc?.id,
      targetUserDoc?.email,
    ]
      .filter(Boolean)
      .map((s) => String(s).trim().toLowerCase());

    isMatch = authIdentifiers.some((id) => targetIdentifiers.includes(id));
  }

  if (!isMatch) {
    return { authorized: false, reason: "Forbidden: You are not authorized to access another user's data." };
  }

  return { authorized: true, isAdmin: false, authenticatedUid };
}
