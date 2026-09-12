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
    totalCredits: typeof data.totalCredits === "number" && !isNaN(data.totalCredits) ? data.totalCredits : 0,
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
 * Get all wallets from Turso database.
 */
export async function getAllWallets(): Promise<WalletDbRecord[]> {
  try {
    const localDb = readDB();
    return Array.isArray(localDb?.wallets)
      ? localDb.wallets.map((w: any) => sanitizeWalletRecord(w.userId || w.id, w))
      : [];
  } catch (dbErr) {
    return [];
  }
}

/**
 * Get a wallet by userId from Turso database.
 */
export async function getWalletByUserId(userId: string): Promise<WalletDbRecord | null> {
  if (!userId) return null;
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
 * Create a new wallet in Turso database.
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
    const localDb = readDB();
    if (!Array.isArray(localDb.wallets)) {
      localDb.wallets = [];
    }
    const idx = localDb.wallets.findIndex((w: any) => w.userId === docId || w.walletId === cleanWallet.walletId);
    if (idx >= 0) {
      localDb.wallets[idx] = { ...localDb.wallets[idx], ...cleanWallet };
    } else {
      localDb.wallets.push(cleanWallet);
    }
    writeDB(localDb);
  } catch (dbErr) {}

  return cleanWallet;
}

/**
 * Update a wallet document in Turso database.
 */
export async function updateWallet(
  userIdOrWallet: string | Partial<WalletDbRecord>,
  updates?: Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  const userId = typeof userIdOrWallet === "string" ? userIdOrWallet : (userIdOrWallet.userId || userIdOrWallet.id || userIdOrWallet.walletId || "");
  const cleanUpdates = typeof userIdOrWallet === "string" ? (updates || {}) : userIdOrWallet;
  if (!userId) return null;

  try {
    const localDb = readDB();
    const existingIdx = (localDb?.wallets || []).findIndex(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (existingIdx >= 0) {
      const existing = localDb.wallets[existingIdx];
      const now = new Date().toISOString();
      const currentBal = typeof cleanUpdates.balance === "number" ? cleanUpdates.balance : (existing.balance || 0);
      const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
        ...existing,
        ...cleanUpdates,
        balance: currentBal,
        currentBalance: typeof cleanUpdates.currentBalance === "number" ? cleanUpdates.currentBalance : currentBal,
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
 * Atomically modify wallet financial parameters using Turso database.
 */
export async function updateWalletAtomic(
  userId: string,
  modifier: (current: WalletDbRecord) => Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;

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
 * Delete all wallets from Turso database (for admin reset).
 */
export async function deleteAllWallets(): Promise<boolean> {
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
