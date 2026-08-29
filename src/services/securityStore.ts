import { getAdminFirestore } from "./firebaseAdmin";

export interface ActiveSessionDoc {
  id: string;
  sessionId: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  location?: string;
  status: "Active" | "Terminated" | "Expired";
  lastActive: string;
  createdAt: string;
  expiresAt?: string;
  [key: string]: any;
}

export interface BlockedIpDoc {
  id: string;
  ipAddress: string;
  reason?: string;
  blockedBy?: string;
  blockedByEmail?: string;
  createdAt: string;
  expiresAt?: string;
  status?: string;
  [key: string]: any;
}

export interface BlockedDeviceDoc {
  id: string;
  deviceId: string;
  userId?: string;
  userEmail?: string;
  reason?: string;
  blockedBy?: string;
  createdAt: string;
  status?: string;
  [key: string]: any;
}

export interface AccountLockDoc {
  id: string;
  userId: string;
  userEmail?: string;
  reason?: string;
  lockedBy?: string;
  lockedAt: string;
  unlockAt?: string;
  status: "Locked" | "Unlocked";
  [key: string]: any;
}

export interface SuspiciousActivityDoc {
  id: string;
  userId?: string;
  userEmail?: string;
  activityType: string;
  ipAddress?: string;
  details?: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  timestamp: string;
  status?: string;
  [key: string]: any;
}

export interface SecurityAlertDoc {
  id: string;
  title: string;
  description?: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  userEmail?: string;
  userId?: string;
  status: "Open" | "Resolved" | "Investigating";
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

const SESSIONS_COLL = "active_sessions";
const BLOCKED_IPS_COLL = "blocked_ips";
const BLOCKED_DEVICES_COLL = "blocked_devices";
const ACCOUNT_LOCKS_COLL = "account_locks";
const SUSPICIOUS_COLL = "suspicious_activities";
const ALERTS_COLL = "security_alerts";

// --- Active Sessions ---
export async function getActiveSessions(filters?: { userId?: string; status?: string }): Promise<ActiveSessionDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(SESSIONS_COLL);
    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    const snapshot = await query.get();
    const list: ActiveSessionDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as ActiveSessionDoc);
    });
    return list;
  } catch (err) {
    console.error("[securityStore] getActiveSessions error:", err);
    return [];
  }
}

export async function saveSession(session: ActiveSessionDoc): Promise<ActiveSessionDoc> {
  const db = getAdminFirestore();
  const docId = session.sessionId || session.id || `SESS_${Date.now()}`;
  const clean: ActiveSessionDoc = { ...session, id: docId, sessionId: session.sessionId || docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(SESSIONS_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

export async function updateSession(sessionId: string, updates: Partial<ActiveSessionDoc>): Promise<ActiveSessionDoc | null> {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(SESSIONS_COLL).doc(sessionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;

    const merged = { ...docSnap.data(), ...updates, lastActive: new Date().toISOString() };
    const sanitized = JSON.parse(JSON.stringify(merged));
    await docRef.set(sanitized, { merge: true });
    return merged as ActiveSessionDoc;
  } catch (err) {
    console.error("[securityStore] updateSession error:", err);
    return null;
  }
}

export async function terminateAllUserSessions(userId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const active = await getActiveSessions({ userId, status: "Active" });
    for (const s of active) {
      await updateSession(s.id, { status: "Terminated" });
    }
    return true;
  } catch (err) {
    console.error("[securityStore] terminateAllUserSessions error:", err);
    return false;
  }
}

// --- Blocked IPs ---
export async function getBlockedIps(): Promise<BlockedIpDoc[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(BLOCKED_IPS_COLL).get();
    const list: BlockedIpDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as BlockedIpDoc);
    });
    return list;
  } catch (err) {
    console.error("[securityStore] getBlockedIps error:", err);
    return [];
  }
}

export async function addBlockedIp(doc: BlockedIpDoc): Promise<BlockedIpDoc> {
  const db = getAdminFirestore();
  const docId = doc.id || doc.ipAddress.replace(/[^a-zA-Z0-9]/g, "_");
  const clean: BlockedIpDoc = { ...doc, id: docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(BLOCKED_IPS_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

export async function removeBlockedIp(ipAddressOrId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const all = await getBlockedIps();
    const target = all.find((i) => i.ipAddress === ipAddressOrId || i.id === ipAddressOrId);
    if (!target) return false;
    await db.collection(BLOCKED_IPS_COLL).doc(target.id).delete();
    return true;
  } catch (err) {
    console.error("[securityStore] removeBlockedIp error:", err);
    return false;
  }
}

// --- Blocked Devices ---
export async function getBlockedDevices(): Promise<BlockedDeviceDoc[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(BLOCKED_DEVICES_COLL).get();
    const list: BlockedDeviceDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as BlockedDeviceDoc);
    });
    return list;
  } catch (err) {
    console.error("[securityStore] getBlockedDevices error:", err);
    return [];
  }
}

export async function addBlockedDevice(doc: BlockedDeviceDoc): Promise<BlockedDeviceDoc> {
  const db = getAdminFirestore();
  const docId = doc.id || doc.deviceId;
  const clean: BlockedDeviceDoc = { ...doc, id: docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(BLOCKED_DEVICES_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

export async function removeBlockedDevice(deviceIdOrId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const all = await getBlockedDevices();
    const target = all.find((d) => d.deviceId === deviceIdOrId || d.id === deviceIdOrId);
    if (!target) return false;
    await db.collection(BLOCKED_DEVICES_COLL).doc(target.id).delete();
    return true;
  } catch (err) {
    console.error("[securityStore] removeBlockedDevice error:", err);
    return false;
  }
}

// --- Account Locks ---
export async function getAccountLocks(filters?: { userId?: string; status?: string }): Promise<AccountLockDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(ACCOUNT_LOCKS_COLL);
    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    const snapshot = await query.get();
    const list: AccountLockDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as AccountLockDoc);
    });
    return list;
  } catch (err) {
    console.error("[securityStore] getAccountLocks error:", err);
    return [];
  }
}

export async function addAccountLock(doc: AccountLockDoc): Promise<AccountLockDoc> {
  const db = getAdminFirestore();
  const docId = doc.id || `LOCK_${Date.now()}`;
  const clean: AccountLockDoc = { ...doc, id: docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(ACCOUNT_LOCKS_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

export async function unlockAccount(lockIdOrEmailOrUserId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const locks = await getAccountLocks({ status: "Locked" });
    const lock = locks.find((l) => l.id === lockIdOrEmailOrUserId || l.userEmail === lockIdOrEmailOrUserId || l.userId === lockIdOrEmailOrUserId);
    if (!lock) return false;

    const sanitized = JSON.parse(JSON.stringify({ ...lock, status: "Unlocked", unlockAt: new Date().toISOString() }));
    await db.collection(ACCOUNT_LOCKS_COLL).doc(lock.id).set(sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error("[securityStore] unlockAccount error:", err);
    return false;
  }
}

// --- Suspicious Activities ---
export async function getSuspiciousActivities(filters?: { userId?: string; limit?: number }): Promise<SuspiciousActivityDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(SUSPICIOUS_COLL);
    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    const snapshot = await query.get();
    const list: SuspiciousActivityDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as SuspiciousActivityDoc);
    });
    list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return list;
  } catch (err) {
    console.error("[securityStore] getSuspiciousActivities error:", err);
    return [];
  }
}

export async function addSuspiciousActivity(doc: SuspiciousActivityDoc): Promise<SuspiciousActivityDoc> {
  const db = getAdminFirestore();
  const docId = doc.id || `ACT_${Date.now()}`;
  const clean: SuspiciousActivityDoc = { ...doc, id: docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(SUSPICIOUS_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

// --- Security Alerts ---
export async function getSecurityAlerts(filters?: { status?: string; limit?: number }): Promise<SecurityAlertDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(ALERTS_COLL);
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    const snapshot = await query.get();
    const list: SecurityAlertDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as SecurityAlertDoc);
    });
    return list;
  } catch (err) {
    console.error("[securityStore] getSecurityAlerts error:", err);
    return [];
  }
}

export async function addSecurityAlert(doc: SecurityAlertDoc): Promise<SecurityAlertDoc> {
  const db = getAdminFirestore();
  const docId = doc.id || `ALT_${Date.now()}`;
  const clean: SecurityAlertDoc = { ...doc, id: docId };
  const sanitized = JSON.parse(JSON.stringify(clean));
  await db.collection(ALERTS_COLL).doc(docId).set(sanitized, { merge: true });
  return clean;
}

export async function seedSecurityIfEmpty(initialData: {
  sessions?: ActiveSessionDoc[];
  blockedIps?: BlockedIpDoc[];
  blockedDevices?: BlockedDeviceDoc[];
  accountLocks?: AccountLockDoc[];
  suspiciousActivities?: SuspiciousActivityDoc[];
  securityAlerts?: SecurityAlertDoc[];
}): Promise<void> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(SESSIONS_COLL).limit(1).get();
    if (snap.empty) {
      if (initialData.sessions) {
        for (const s of initialData.sessions) await saveSession(s);
      }
      if (initialData.blockedIps) {
        for (const i of initialData.blockedIps) await addBlockedIp(i);
      }
      if (initialData.blockedDevices) {
        for (const d of initialData.blockedDevices) await addBlockedDevice(d);
      }
      if (initialData.accountLocks) {
        for (const l of initialData.accountLocks) await addAccountLock(l);
      }
      if (initialData.suspiciousActivities) {
        for (const a of initialData.suspiciousActivities) await addSuspiciousActivity(a);
      }
      if (initialData.securityAlerts) {
        for (const al of initialData.securityAlerts) await addSecurityAlert(al);
      }
    }
  } catch (err) {
    console.error("[securityStore] seedSecurityIfEmpty error:", err);
  }
}

export const securityStore = {
  getActiveSessions,
  saveSession,
  updateSession,
  terminateAllUserSessions,
  getBlockedIps,
  addBlockedIp,
  removeBlockedIp,
  getBlockedDevices,
  addBlockedDevice,
  removeBlockedDevice,
  getAccountLocks,
  addAccountLock,
  unlockAccount,
  getSuspiciousActivities,
  addSuspiciousActivity,
  getSecurityAlerts,
  addSecurityAlert,
  seedSecurityIfEmpty,
};

export default securityStore;
