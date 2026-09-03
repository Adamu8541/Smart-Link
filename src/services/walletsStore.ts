import { getAdminFirestore } from "./firebaseAdmin";
import { usersStore } from "./usersStore";
import { readDB, writeDB } from "../../server/db";

export interface WalletDbRecord {
  userId: string;
  walletId: string;
  balance: number;
  currentBalance: number;
  heldBalance: number;
  totalCredits: number;
  totalDebits: number;
  status: "ACTIVE" | "SUSPENDED" | "LOCKED" | "FROZEN";
  walletStatus: "ACTIVE" | "SUSPENDED" | "LOCKED" | "FROZEN";
  currency: "NGN";
  updatedAt: string;
  lastUpdated: string;
  createdAt: string;
  [key: string]: any;
}

const COLLECTION_NAME = "wallets";

function sanitizeWalletRecord(docId: string, data: WalletDbRecord): WalletDbRecord {
  const userId = data.userId || docId;
  const bal = typeof data.balance === "number" && !isNaN(data.balance) ? data.balance : 0;
  return {
    ...data,
    userId,
    walletId: data.walletId || `wal_${userId}`,
    balance: bal,
    currentBalance: typeof data.currentBalance === "number" && !isNaN(data.currentBalance) ? data.currentBalance : bal,
    heldBalance: typeof data.heldBalance === "number" && !isNaN(data.heldBalance) ? data.heldBalance : 0,
    totalCredits: typeof data.totalCredits === "number" && !isNaN(data.totalCredits) ? data.totalCredits : bal,
    totalDebits: typeof data.totalDebits === "number" && !isNaN(data.totalDebits) ? data.totalDebits : 0,
    status: data.status || data.walletStatus || "ACTIVE",
    walletStatus: data.walletStatus || data.status || "ACTIVE",
    currency: "NGN",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || data.lastUpdated || new Date().toISOString(),
    lastUpdated: data.lastUpdated || data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Get all wallets from Firestore "wallets" collection with local fallback.
 */
export async function getAllWallets(): Promise<WalletDbRecord[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const wallets: WalletDbRecord[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as WalletDbRecord;
      wallets.push(sanitizeWalletRecord(doc.id, data));
    });
    return wallets;
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn("[walletsStore] Firestore getAllWallets unavailable, using local database fallback.");
    }
    try {
      const localDb = readDB();
      return Array.isArray(localDb?.wallets)
        ? localDb.wallets.map((w: any) => sanitizeWalletRecord(w.userId || w.id, w))
        : [];
    } catch (dbErr) {
      return [];
    }
  }
}

/**
 * Get a wallet by userId with local fallback.
 */
export async function getWalletByUserId(userId: string): Promise<WalletDbRecord | null> {
  if (!userId) return null;
  try {
    const db = getAdminFirestore();
    // Direct doc lookup with doc ID = userId
    const docRef = db.collection(COLLECTION_NAME).doc(userId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data() as WalletDbRecord;
      return sanitizeWalletRecord(userId, data);
    }

    // Query fallback: userId field or walletId field
    const qUser = await db.collection(COLLECTION_NAME).where("userId", "==", userId).limit(1).get();
    if (!qUser.empty) {
      const doc = qUser.docs[0];
      return sanitizeWalletRecord(doc.id, doc.data() as WalletDbRecord);
    }

    const qWal = await db.collection(COLLECTION_NAME).where("walletId", "==", userId).limit(1).get();
    if (!qWal.empty) {
      const doc = qWal.docs[0];
      return sanitizeWalletRecord(doc.id, doc.data() as WalletDbRecord);
    }
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn(`[walletsStore] Firestore getWalletByUserId error for ${userId}:`, err?.message || err);
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const found = (localDb?.wallets || []).find(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (found) {
      return sanitizeWalletRecord(userId, found);
    }
  } catch (dbErr) {}

  return null;
}

/**
 * Create a new wallet in "wallets" collection with local DB fallback.
 */
export async function createWallet(wallet: WalletDbRecord): Promise<WalletDbRecord> {
  const docId = wallet.userId;
  const now = new Date().toISOString();
  const cleanWallet: WalletDbRecord = sanitizeWalletRecord(docId, {
    ...wallet,
    createdAt: wallet.createdAt || now,
    updatedAt: wallet.updatedAt || now,
    lastUpdated: wallet.lastUpdated || now,
  });

  try {
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(cleanWallet));
    await db.collection(COLLECTION_NAME).doc(docId).set(sanitized, { merge: true });
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn("[walletsStore] Firestore createWallet bypassed, saving to local database fallback.");
    }
  }

  // Persist to local JSON DB
  try {
    const localDb = readDB();
    if (Array.isArray(localDb.wallets)) {
      const idx = localDb.wallets.findIndex((w: any) => w.userId === docId || w.walletId === cleanWallet.walletId);
      if (idx >= 0) {
        localDb.wallets[idx] = { ...localDb.wallets[idx], ...cleanWallet };
      } else {
        localDb.wallets.push(cleanWallet);
      }
      writeDB(localDb);
    }
  } catch (dbErr) {}

  return cleanWallet;
}

/**
 * Update a wallet document in Firestore.
 * Uses Firestore runTransaction() with local database fallback.
 */
export async function updateWallet(
  userId: string,
  updates: Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;

  try {
    const db = getAdminFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(userId);

    const updated = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      let existing: WalletDbRecord | null = null;
      let targetRef = docRef;

      if (docSnap.exists) {
        existing = docSnap.data() as WalletDbRecord;
      } else {
        const qUser = await db.collection(COLLECTION_NAME).where("userId", "==", userId).limit(1).get();
        if (!qUser.empty) {
          const doc = qUser.docs[0];
          existing = doc.data() as WalletDbRecord;
          targetRef = db.collection(COLLECTION_NAME).doc(doc.id);
        }
      }

      if (!existing) {
        return null;
      }

      const now = new Date().toISOString();
      const currentBal = typeof updates.balance === "number" ? updates.balance : (existing.balance || 0);

      const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
        ...existing,
        ...updates,
        balance: currentBal,
        currentBalance: typeof updates.currentBalance === "number" ? updates.currentBalance : currentBal,
        updatedAt: now,
        lastUpdated: now,
      });

      const sanitized = JSON.parse(JSON.stringify(merged));
      transaction.set(targetRef, sanitized, { merge: true });

      return merged;
    });

    if (updated && (updates.balance !== undefined || updates.currentBalance !== undefined)) {
      await usersStore.updateUser(userId, { walletBalance: updated.balance }).catch(() => {});
    }

    if (updated) {
      return updated;
    }
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn("[walletsStore] updateWallet Firestore transaction error:", err?.message || err);
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const existingIdx = (localDb?.wallets || []).findIndex(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (existingIdx >= 0) {
      const existing = localDb.wallets[existingIdx];
      const now = new Date().toISOString();
      const currentBal = typeof updates.balance === "number" ? updates.balance : (existing.balance || 0);
      const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
        ...existing,
        ...updates,
        balance: currentBal,
        currentBalance: typeof updates.currentBalance === "number" ? updates.currentBalance : currentBal,
        updatedAt: now,
        lastUpdated: now,
      });
      localDb.wallets[existingIdx] = merged;
      writeDB(localDb);
      await usersStore.updateUser(userId, { walletBalance: merged.balance }).catch(() => {});
      return merged;
    }
  } catch (fallbackErr) {}

  return null;
}

/**
 * Atomically modify wallet financial parameters using Firestore or local fallback.
 */
export async function updateWalletAtomic(
  userId: string,
  modifier: (current: WalletDbRecord) => Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;

  try {
    const db = getAdminFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(userId);

    const updated = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      let existing: WalletDbRecord | null = null;
      let targetRef = docRef;

      if (docSnap.exists) {
        existing = docSnap.data() as WalletDbRecord;
      } else {
        const qUser = await db.collection(COLLECTION_NAME).where("userId", "==", userId).limit(1).get();
        if (!qUser.empty) {
          const doc = qUser.docs[0];
          existing = doc.data() as WalletDbRecord;
          targetRef = db.collection(COLLECTION_NAME).doc(doc.id);
        }
      }

      if (!existing) {
        return null;
      }

      const sanitizedExisting = sanitizeWalletRecord(userId, existing);
      const changes = modifier(sanitizedExisting);
      const now = new Date().toISOString();

      const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
        ...sanitizedExisting,
        ...changes,
        updatedAt: now,
        lastUpdated: now,
      });

      const sanitized = JSON.parse(JSON.stringify(merged));
      transaction.set(targetRef, sanitized, { merge: true });

      return merged;
    });

    if (updated) {
      await usersStore.updateUser(userId, { walletBalance: updated.balance }).catch(() => {});
      return updated;
    }
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn("[walletsStore] updateWalletAtomic Firestore error:", err?.message || err);
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const existingIdx = (localDb?.wallets || []).findIndex(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (existingIdx >= 0) {
      const existing = localDb.wallets[existingIdx];
      const sanitizedExisting = sanitizeWalletRecord(userId, existing);
      const changes = modifier(sanitizedExisting);
      const now = new Date().toISOString();

      const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
        ...sanitizedExisting,
        ...changes,
        updatedAt: now,
        lastUpdated: now,
      });
      localDb.wallets[existingIdx] = merged;
      writeDB(localDb);
      await usersStore.updateUser(userId, { walletBalance: merged.balance }).catch(() => {});
      return merged;
    }
  } catch (fallbackErr) {}

  return null;
}

/**
 * Delete all wallets from "wallets" collection (for admin reset).
 */
export async function deleteAllWallets(): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.warn("[walletsStore] deleteAllWallets Firestore error:", err?.message || err);
    }
  }

  try {
    const localDb = readDB();
    localDb.wallets = [];
    writeDB(localDb);
  } catch (dbErr) {}

  return true;
}

export const walletsStore = {
  getAllWallets,
  getWalletByUserId,
  createWallet,
  updateWallet,
  updateWalletAtomic,
  deleteAllWallets,
};

export default walletsStore;
