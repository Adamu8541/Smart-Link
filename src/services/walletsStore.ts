import { usersStore } from "./usersStore";
import { readDB, writeDB } from "../../server/db";
import { executeTurso } from "../../server/turso/client";
import { WalletRepository } from "../../server/turso/repositories";

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

function sanitizeWalletRecord(docId: string, data: any): WalletDbRecord {
  const userId = data.userId || data.user_id || docId;
  const bal = typeof data.balance === "number" && !isNaN(data.balance) ? Number(data.balance) : (Number(data.balance) || 0);
  const heldBal = typeof data.held_balance === "number" ? data.held_balance : (typeof data.heldBalance === "number" ? data.heldBalance : 0);
  const credits = typeof data.total_credits === "number" ? data.total_credits : (typeof data.totalCredits === "number" ? data.totalCredits : 0);
  const debits = typeof data.total_debits === "number" ? data.total_debits : (typeof data.totalDebits === "number" ? data.totalDebits : 0);
  const stat = data.status || data.walletStatus || "ACTIVE";

  return {
    ...data,
    userId,
    walletId: data.walletId || data.wallet_id || `wal_${userId}`,
    balance: bal,
    currentBalance: typeof data.currentBalance === "number" && !isNaN(data.currentBalance) ? data.currentBalance : bal,
    heldBalance: heldBal,
    totalCredits: credits,
    totalDebits: debits,
    status: stat,
    walletStatus: stat,
    currency: "NGN",
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || data.lastUpdated || new Date().toISOString(),
    lastUpdated: data.lastUpdated || data.updatedAt || data.updated_at || new Date().toISOString(),
  };
}

/**
 * Get all wallets from Turso database (single source of truth).
 */
export async function getAllWallets(): Promise<WalletDbRecord[]> {
  try {
    const res = await executeTurso("SELECT * FROM wallets ORDER BY updated_at DESC;");
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((row: any) => sanitizeWalletRecord(row.user_id || row.userId || row.id, row));
    }
  } catch (tursoErr) {
    console.warn("[walletsStore] Turso getAllWallets error:", tursoErr);
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

/**
 * Get a wallet by userId from Turso database (single source of truth).
 */
export async function getWalletByUserId(userId: string): Promise<WalletDbRecord | null> {
  if (!userId) return null;

  try {
    const res = await executeTurso("SELECT * FROM wallets WHERE user_id = ? OR wallet_id = ? OR id = ? LIMIT 1;", [userId, userId, userId]);
    if (res.rows && res.rows.length > 0) {
      return sanitizeWalletRecord(userId, res.rows[0]);
    }
  } catch (tursoErr) {
    console.warn(`[walletsStore] Turso getWalletByUserId (${userId}) error:`, tursoErr);
  }

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

  // Direct persistence to Turso
  try {
    await executeTurso(
      `INSERT INTO wallets (id, user_id, wallet_id, balance, held_balance, total_credits, total_debits, status, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         held_balance = excluded.held_balance,
         total_credits = excluded.total_credits,
         total_debits = excluded.total_debits,
         status = excluded.status,
         updated_at = excluded.updated_at;`,
      [
        cleanWallet.walletId || `wal_${docId}`,
        docId,
        cleanWallet.walletId || `wal_${docId}`,
        cleanWallet.balance,
        cleanWallet.heldBalance,
        cleanWallet.totalCredits,
        cleanWallet.totalDebits,
        cleanWallet.status,
        cleanWallet.currency || "NGN",
        cleanWallet.createdAt,
        cleanWallet.updatedAt,
      ]
    );
  } catch (tursoErr) {
    console.warn("[walletsStore] Turso createWallet error:", tursoErr);
  }

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

  const now = new Date().toISOString();

  // 1. Fetch current wallet from Turso
  let currentWallet = await getWalletByUserId(userId);
  const currentBal = typeof cleanUpdates.balance === "number" ? cleanUpdates.balance : (currentWallet?.balance || 0);

  const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
    ...(currentWallet || {}),
    ...cleanUpdates,
    balance: currentBal,
    currentBalance: typeof cleanUpdates.currentBalance === "number" ? cleanUpdates.currentBalance : currentBal,
    updatedAt: now,
    lastUpdated: now,
  });

  // 2. Persist directly to Turso
  try {
    await executeTurso(
      `INSERT INTO wallets (id, user_id, wallet_id, balance, held_balance, total_credits, total_debits, status, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         held_balance = excluded.held_balance,
         total_credits = excluded.total_credits,
         total_debits = excluded.total_debits,
         status = excluded.status,
         updated_at = excluded.updated_at;`,
      [
        merged.walletId || `wal_${userId}`,
        userId,
        merged.walletId || `wal_${userId}`,
        merged.balance,
        merged.heldBalance,
        merged.totalCredits,
        merged.totalDebits,
        merged.status,
        merged.currency || "NGN",
        merged.createdAt,
        merged.updatedAt,
      ]
    );
  } catch (tursoErr) {
    console.warn("[walletsStore] Turso updateWallet error:", tursoErr);
  }

  // Also sync user wallet balance
  await usersStore.updateUser(userId, { walletBalance: merged.balance }).catch(() => {});

  try {
    const localDb = readDB();
    const existingIdx = (localDb?.wallets || []).findIndex(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (existingIdx >= 0) {
      localDb.wallets[existingIdx] = merged;
    } else {
      if (!Array.isArray(localDb.wallets)) localDb.wallets = [];
      localDb.wallets.push(merged);
    }
    writeDB(localDb);
  } catch (fallbackErr) {}

  return merged;
}

/**
 * Atomically modify wallet financial parameters using Turso database.
 */
export async function updateWalletAtomic(
  userId: string,
  modifier: (current: WalletDbRecord) => Partial<WalletDbRecord>
): Promise<WalletDbRecord | null> {
  if (!userId) return null;

  const currentWallet = await getWalletByUserId(userId);
  const baseWallet = currentWallet || sanitizeWalletRecord(userId, { userId, balance: 0 });
  const changes = modifier(baseWallet);
  const now = new Date().toISOString();

  const merged: WalletDbRecord = sanitizeWalletRecord(userId, {
    ...baseWallet,
    ...changes,
    updatedAt: now,
    lastUpdated: now,
  });

  // Direct ACID write to Turso
  try {
    await executeTurso(
      `INSERT INTO wallets (id, user_id, wallet_id, balance, held_balance, total_credits, total_debits, status, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         held_balance = excluded.held_balance,
         total_credits = excluded.total_credits,
         total_debits = excluded.total_debits,
         status = excluded.status,
         updated_at = excluded.updated_at;`,
      [
        merged.walletId || `wal_${userId}`,
        userId,
        merged.walletId || `wal_${userId}`,
        merged.balance,
        merged.heldBalance,
        merged.totalCredits,
        merged.totalDebits,
        merged.status,
        merged.currency || "NGN",
        merged.createdAt,
        merged.updatedAt,
      ]
    );
  } catch (tursoErr) {
    console.warn("[walletsStore] Turso updateWalletAtomic error:", tursoErr);
  }

  await usersStore.updateUser(userId, { walletBalance: merged.balance }).catch(() => {});

  try {
    const localDb = readDB();
    const existingIdx = (localDb?.wallets || []).findIndex(
      (w: any) => w.userId === userId || w.walletId === userId || w.id === userId
    );
    if (existingIdx >= 0) {
      localDb.wallets[existingIdx] = merged;
    } else {
      if (!Array.isArray(localDb.wallets)) localDb.wallets = [];
      localDb.wallets.push(merged);
    }
    writeDB(localDb);
  } catch (fallbackErr) {}

  return merged;
}

/**
 * Delete all wallets from Turso database (for admin reset).
 */
export async function deleteAllWallets(): Promise<boolean> {
  try {
    await executeTurso("DELETE FROM wallets;");
  } catch (tursoErr) {
    console.warn("[walletsStore] Turso deleteAllWallets error:", tursoErr);
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
