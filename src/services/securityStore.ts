import { readDB, writeDB } from "../../server/db";

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

// --- Active Sessions ---
export async function getActiveSessions(filters?: { userId?: string; status?: string }): Promise<ActiveSessionDoc[]> {
  try {
    const db = readDB();
    let list: ActiveSessionDoc[] = Array.isArray(db?.activeSessions) ? db.activeSessions : [];
    if (filters?.userId) {
      list = list.filter((s) => s.userId === filters.userId);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }
    return list;
  } catch (err) {
    console.error("[securityStore] getActiveSessions error:", err);
    return [];
  }
}

export async function saveSession(session: ActiveSessionDoc): Promise<ActiveSessionDoc> {
  const db = readDB();
  const docId = session.sessionId || session.id || `SESS_${Date.now()}`;
  const clean: ActiveSessionDoc = { ...session, id: docId, sessionId: session.sessionId || docId };
  if (!Array.isArray(db.activeSessions)) db.activeSessions = [];
  const idx = db.activeSessions.findIndex((s: any) => s.id === docId || s.sessionId === docId);
  if (idx >= 0) db.activeSessions[idx] = clean;
  else db.activeSessions.push(clean);
  writeDB(db);
  return clean;
}

export async function updateSession(sessionId: string, updates: Partial<ActiveSessionDoc>): Promise<ActiveSessionDoc | null> {
  try {
    const db = readDB();
    if (!Array.isArray(db.activeSessions)) return null;
    const idx = db.activeSessions.findIndex((s: any) => s.id === sessionId || s.sessionId === sessionId);
    if (idx < 0) return null;
    const merged = { ...db.activeSessions[idx], ...updates, lastActive: new Date().toISOString() };
    db.activeSessions[idx] = merged;
    writeDB(db);
    return merged as ActiveSessionDoc;
  } catch (err) {
    console.error("[securityStore] updateSession error:", err);
    return null;
  }
}

export async function terminateAllUserSessions(userId: string): Promise<boolean> {
  try {
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
    const db = readDB();
    return Array.isArray(db?.blockedIps) ? db.blockedIps : [];
  } catch (err) {
    console.error("[securityStore] getBlockedIps error:", err);
    return [];
  }
}

export async function addBlockedIp(doc: BlockedIpDoc): Promise<BlockedIpDoc> {
  const db = readDB();
  const docId = doc.id || doc.ipAddress.replace(/[^a-zA-Z0-9]/g, "_");
  const clean: BlockedIpDoc = { ...doc, id: docId };
  if (!Array.isArray(db.blockedIps)) db.blockedIps = [];
  const idx = db.blockedIps.findIndex((i: any) => i.id === docId || i.ipAddress === doc.ipAddress);
  if (idx >= 0) db.blockedIps[idx] = clean;
  else db.blockedIps.push(clean);
  writeDB(db);
  return clean;
}

export async function removeBlockedIp(ipAddressOrId: string): Promise<boolean> {
  try {
    const db = readDB();
    if (!Array.isArray(db.blockedIps)) return false;
    db.blockedIps = db.blockedIps.filter((i: any) => i.ipAddress !== ipAddressOrId && i.id !== ipAddressOrId);
    writeDB(db);
    return true;
  } catch (err) {
    console.error("[securityStore] removeBlockedIp error:", err);
    return false;
  }
}

// --- Blocked Devices ---
export async function getBlockedDevices(): Promise<BlockedDeviceDoc[]> {
  try {
    const db = readDB();
    return Array.isArray(db?.blockedDevices) ? db.blockedDevices : [];
  } catch (err) {
    console.error("[securityStore] getBlockedDevices error:", err);
    return [];
  }
}

export async function addBlockedDevice(doc: BlockedDeviceDoc): Promise<BlockedDeviceDoc> {
  const db = readDB();
  const docId = doc.id || doc.deviceId;
  const clean: BlockedDeviceDoc = { ...doc, id: docId };
  if (!Array.isArray(db.blockedDevices)) db.blockedDevices = [];
  const idx = db.blockedDevices.findIndex((d: any) => d.id === docId || d.deviceId === doc.deviceId);
  if (idx >= 0) db.blockedDevices[idx] = clean;
  else db.blockedDevices.push(clean);
  writeDB(db);
  return clean;
}

export async function removeBlockedDevice(deviceIdOrId: string): Promise<boolean> {
  try {
    const db = readDB();
    if (!Array.isArray(db.blockedDevices)) return false;
    db.blockedDevices = db.blockedDevices.filter((d: any) => d.deviceId !== deviceIdOrId && d.id !== deviceIdOrId);
    writeDB(db);
    return true;
  } catch (err) {
    console.error("[securityStore] removeBlockedDevice error:", err);
    return false;
  }
}

// --- Account Locks ---
export async function getAccountLocks(filters?: { userId?: string; status?: string }): Promise<AccountLockDoc[]> {
  try {
    const db = readDB();
    let list: AccountLockDoc[] = Array.isArray(db?.accountLocks) ? db.accountLocks : [];
    if (filters?.userId) {
      list = list.filter((l) => l.userId === filters.userId);
    }
    if (filters?.status) {
      list = list.filter((l) => l.status === filters.status);
    }
    return list;
  } catch (err) {
    console.error("[securityStore] getAccountLocks error:", err);
    return [];
  }
}

export async function addAccountLock(doc: AccountLockDoc): Promise<AccountLockDoc> {
  const db = readDB();
  const docId = doc.id || `LOCK_${Date.now()}`;
  const clean: AccountLockDoc = { ...doc, id: docId };
  if (!Array.isArray(db.accountLocks)) db.accountLocks = [];
  const idx = db.accountLocks.findIndex((l: any) => l.id === docId);
  if (idx >= 0) db.accountLocks[idx] = clean;
  else db.accountLocks.push(clean);
  writeDB(db);
  return clean;
}

export async function unlockAccount(lockIdOrEmailOrUserId: string): Promise<boolean> {
  try {
    const db = readDB();
    if (!Array.isArray(db.accountLocks)) return false;
    const idx = db.accountLocks.findIndex((l: any) => l.id === lockIdOrEmailOrUserId || l.userEmail === lockIdOrEmailOrUserId || l.userId === lockIdOrEmailOrUserId);
    if (idx < 0) return false;
    db.accountLocks[idx] = { ...db.accountLocks[idx], status: "Unlocked", unlockAt: new Date().toISOString() };
    writeDB(db);
    return true;
  } catch (err) {
    console.error("[securityStore] unlockAccount error:", err);
    return false;
  }
}

// --- Suspicious Activities ---
export async function getSuspiciousActivities(filters?: { userId?: string; limit?: number }): Promise<SuspiciousActivityDoc[]> {
  try {
    const db = readDB();
    let list: SuspiciousActivityDoc[] = Array.isArray(db?.suspiciousActivities) ? db.suspiciousActivities : [];
    if (filters?.userId) {
      list = list.filter((a) => a.userId === filters.userId);
    }
    list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  } catch (err) {
    console.error("[securityStore] getSuspiciousActivities error:", err);
    return [];
  }
}

export async function addSuspiciousActivity(doc: SuspiciousActivityDoc): Promise<SuspiciousActivityDoc> {
  const db = readDB();
  const docId = doc.id || `ACT_${Date.now()}`;
  const clean: SuspiciousActivityDoc = { ...doc, id: docId };
  if (!Array.isArray(db.suspiciousActivities)) db.suspiciousActivities = [];
  db.suspiciousActivities.unshift(clean);
  writeDB(db);
  return clean;
}

// --- Security Alerts ---
export async function getSecurityAlerts(filters?: { status?: string; limit?: number }): Promise<SecurityAlertDoc[]> {
  try {
    const db = readDB();
    let list: SecurityAlertDoc[] = Array.isArray(db?.securityAlerts) ? db.securityAlerts : [];
    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  } catch (err) {
    console.error("[securityStore] getSecurityAlerts error:", err);
    return [];
  }
}

export async function addSecurityAlert(doc: SecurityAlertDoc): Promise<SecurityAlertDoc> {
  const db = readDB();
  const docId = doc.id || `ALT_${Date.now()}`;
  const clean: SecurityAlertDoc = { ...doc, id: docId };
  if (!Array.isArray(db.securityAlerts)) db.securityAlerts = [];
  db.securityAlerts.unshift(clean);
  writeDB(db);
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
    const db = readDB();
    if (!db.activeSessions || db.activeSessions.length === 0) {
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
