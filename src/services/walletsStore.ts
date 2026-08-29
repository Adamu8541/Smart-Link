import { getAdminFirestore } from "./firebaseAdmin";
import { usersStore } from "./usersStore";

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
 * Get all wallets from Firestore "wallets" collection.
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
  } catch (err) {
    console.error("[walletsStore] getAllWallets error:", err);
    return [];
  }
}

/**
 * Get a wallet by userId.
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
  } catch (err) {
    console.error("[walletsStore] getWalletByUserId error:", err);
  }
  return null;
}

/**
 * Create a new wallet in "wallets" collection.
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
  } catch (err) {
    console.error("[walletsStore] createWallet error:", err);
  }
  return cleanWallet;
}

/**
 * Update a wallet document in Firestore.
 * Uses Firestore runTransaction() to ensure atomic reads and writes.
 */
export async function updateWallet(
  userId: string,
  updates: Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;
  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTION_NAME).doc(userId);

  try {
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

    return updated;
  } catch (err) {
    console.error("[walletsStore] updateWallet transaction error:", err);
    return null;
  }
}

/**
 * Atomically modify wallet financial parameters using Firestore runTransaction().
 * Ensures read-modify-write happens inside a single transaction.
 */
export async function updateWalletAtomic(
  userId: string,
  modifier: (current: WalletDbRecord) => Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;
  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTION_NAME).doc(userId);

  try {
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
    }

    return updated;
  } catch (err) {
    console.error("[walletsStore] updateWalletAtomic error:", err);
    return null;
  }
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
    return true;
  } catch (err) {
    console.error("[walletsStore] deleteAllWallets error:", err);
    return false;
  }
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
