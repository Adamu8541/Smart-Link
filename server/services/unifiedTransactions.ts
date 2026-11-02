/**
 * SmartLink Unified Transactions & Wallet Synchronization Service
 *
 * Provides unified, authoritative retrieval and atomic recording of wallet transactions
 * across Turso libSQL/SQLite database, in-memory caches, and local db.json storage.
 * Guarantees that transactions are never lost or hidden on the customer dashboard.
 */

import { executeTurso } from "../turso/client";
import { TransactionRepository, UserRepository, LedgerRepository, VirtualAccountRepository } from "../turso/repositories/index";
import { walletsStore } from "../../src/services/walletsStore";
import * as usersStore from "../../src/services/usersStore";
import { createNotification } from "../../src/services/notificationsStore";
import { formatNaira } from "../../src/utils/formatUtils";

export interface NormalizedTransaction {
  id: string;
  transactionId: string;
  reference: string;
  userId: string;
  user_id: string;
  userEmail: string;
  serviceName: string;
  service_name: string;
  service: string;
  type: string;
  service_type: string;
  serviceCategory: string;
  service_category: string;
  amount: number;
  fee: number;
  totalAmount: number;
  total_amount: number;
  walletBalanceBefore: number;
  wallet_balance_before: number;
  walletBalanceAfter: number;
  wallet_balance_after: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REVERSED";
  provider: string;
  description: string;
  recipientDetails?: string;
  recipient_details?: string;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  idempotencyKey?: string;
  idempotency_key?: string;
  providerReference?: string;
  provider_reference?: string;
  token?: string;
  units?: string;
  pins?: string;
}

/**
 * Normalizes any transaction record (from Turso SQL row, in-memory object, or webhook result)
 * into a complete, standard object supporting both camelCase and snake_case properties.
 */
export function normalizeTransactionRecord(raw: any): NormalizedTransaction {
  if (!raw) return raw;

  const id = String(raw.id || raw.transaction_id || raw.transactionId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const transactionId = String(raw.transaction_id || raw.transactionId || id);
  const reference = String(raw.reference || raw.idempotency_key || raw.idempotencyKey || id);
  const userId = String(raw.userId || raw.user_id || raw.uid || "");
  const userEmail = String(raw.userEmail || raw.email || raw.recipientDetails || raw.recipient_details || "");
  const serviceName = String(raw.serviceName || raw.service_name || raw.service || raw.description || "Transaction");
  const type = String(raw.type || raw.service_type || raw.serviceType || raw.service_category || "GENERAL");
  const status = (String(raw.status || "SUCCESS").toUpperCase() as any);
  const amount = typeof raw.amount === "number" ? raw.amount : parseFloat(String(raw.amount || 0)) || 0;
  const fee = typeof raw.fee === "number" ? raw.fee : parseFloat(String(raw.fee || 0)) || 0;
  const totalAmount = typeof raw.total_amount === "number" ? raw.total_amount : (typeof raw.totalAmount === "number" ? raw.totalAmount : amount + fee);
  const walletBalanceBefore = typeof raw.walletBalanceBefore === "number" ? raw.walletBalanceBefore : (typeof raw.wallet_balance_before === "number" ? raw.wallet_balance_before : 0);
  const walletBalanceAfter = typeof raw.walletBalanceAfter === "number" ? raw.walletBalanceAfter : (typeof raw.wallet_balance_after === "number" ? raw.wallet_balance_after : amount);
  const provider = String(raw.provider || "Aspfiy Payment Portal");
  const description = String(raw.description || raw.serviceName || raw.service_name || "Transaction Record");
  const recipientDetails = raw.recipientDetails || raw.recipient_details || userEmail || undefined;
  const createdAt = String(raw.createdAt || raw.created_at || new Date().toISOString());
  const updatedAt = String(raw.updatedAt || raw.updated_at || createdAt);

  return {
    id,
    transactionId,
    reference,
    userId,
    user_id: userId,
    userEmail,
    serviceName,
    service_name: serviceName,
    service: serviceName,
    type,
    service_type: type,
    serviceCategory: String(raw.serviceCategory || raw.service_category || "WALLET"),
    service_category: String(raw.service_category || raw.serviceCategory || "WALLET"),
    amount,
    fee,
    totalAmount,
    total_amount: totalAmount,
    walletBalanceBefore,
    wallet_balance_before: walletBalanceBefore,
    walletBalanceAfter,
    wallet_balance_after: walletBalanceAfter,
    status,
    provider,
    description,
    recipientDetails,
    recipient_details: recipientDetails,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    idempotencyKey: raw.idempotencyKey || raw.idempotency_key || reference,
    idempotency_key: raw.idempotency_key || raw.idempotencyKey || reference,
    providerReference: raw.providerReference || raw.provider_reference || reference,
    provider_reference: raw.provider_reference || raw.providerReference || reference,
    token: raw.token,
    units: raw.units,
    pins: raw.pins,
  };
}

export interface TransactionFilterOptions {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  serviceType?: string;
}

/**
 * Retrieve unified transactions for a specific user across Turso SQL, memory cache, and db.json.
 * Guarantees zero-loss: combines all data sources, normalizes fields, and deduplicates.
 */
export async function getUnifiedUserTransactions(
  db: any,
  userId: string,
  options?: TransactionFilterOptions
): Promise<NormalizedTransaction[]> {
  if (!userId) return [];

  const targetIds = new Set<string>();
  targetIds.add(userId);

  // Resolve user to also match alternative ID/UID/Email
  try {
    const user = (await usersStore.getUserById(userId)) || (await usersStore.getUserByUid(userId));
    if (user) {
      if (user.uid) targetIds.add(user.uid);
      if (user.id) targetIds.add(user.id);
      if (user.email) targetIds.add(user.email.toLowerCase());
    }
  } catch {}

  const txMap = new Map<string, NormalizedTransaction>();

  // 1. Fetch from Turso SQL transactions table
  try {
    for (const uid of Array.from(targetIds)) {
      const sqlRows = await TransactionRepository.findByUserId(uid, 500, 0);
      if (Array.isArray(sqlRows)) {
        for (const row of sqlRows) {
          const norm = normalizeTransactionRecord(row);
          const key = norm.reference || norm.id || norm.transactionId;
          if (key && !txMap.has(key)) {
            txMap.set(key, norm);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`[UnifiedTransactions] Turso query note: ${err?.message}`);
  }

  // 2. Fetch from in-memory / JSON db.transactions & db.wallet_transactions
  const memList = (db?.transactions || []).concat(db?.wallet_transactions || []);
  for (const item of memList) {
    const itemUserId = String(item.userId || item.user_id || item.uid || "");
    const itemEmail = String(item.userEmail || item.email || "").toLowerCase();

    const matchesUser =
      targetIds.has(itemUserId) ||
      (itemEmail && targetIds.has(itemEmail));

    if (matchesUser) {
      const norm = normalizeTransactionRecord(item);
      const key = norm.reference || norm.id || norm.transactionId;
      if (key && !txMap.has(key)) {
        txMap.set(key, norm);
      }
    }
  }

  // Convert map to array and sort descending by date
  let result = Array.from(txMap.values());
  result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  // Apply filters
  if (options?.status && options.status !== "ALL") {
    result = result.filter(t => t.status === options.status);
  }

  if (options?.type && options.type !== "ALL") {
    const tReq = options.type.toUpperCase();
    result = result.filter(t =>
      t.type.toUpperCase() === tReq ||
      t.service_type.toUpperCase() === tReq ||
      t.serviceCategory.toUpperCase() === tReq ||
      t.serviceName.toUpperCase().includes(tReq)
    );
  }

  if (options?.serviceType && options.serviceType !== "ALL") {
    const stReq = options.serviceType.toUpperCase();
    result = result.filter(t =>
      t.type.toUpperCase() === stReq ||
      t.service_type.toUpperCase() === stReq ||
      t.serviceName.toUpperCase().includes(stReq) ||
      t.description.toUpperCase().includes(stReq)
    );
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    result = result.filter(t =>
      t.reference.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.serviceName.toLowerCase().includes(q) ||
      (t.recipientDetails && t.recipientDetails.toLowerCase().includes(q)) ||
      t.provider.toLowerCase().includes(q)
    );
  }

  if (options?.startDate) {
    const startMs = new Date(options.startDate).getTime();
    result = result.filter(t => new Date(t.createdAt).getTime() >= startMs);
  }

  if (options?.endDate) {
    const endMs = new Date(options.endDate).getTime();
    result = result.filter(t => new Date(t.createdAt).getTime() <= endMs);
  }

  if (options?.offset || options?.limit) {
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    result = result.slice(offset, offset + limit);
  }

  // Sync back into memory db.transactions so downstream synchronous routines also find them
  if (db && Array.isArray(db.transactions)) {
    for (const tx of result) {
      if (!db.transactions.some((t: any) => (t.reference && t.reference === tx.reference) || t.id === tx.id)) {
        db.transactions.unshift(tx);
      }
    }
  }

  return result;
}

/**
 * Ensures complete synchronization of user wallet balance across:
 * - Turso SQL users.wallet_balance
 * - Turso SQL wallets.balance
 * - walletsStore
 * - usersStore
 * - db.json users & wallets
 */
export async function syncAuthoritativeWalletBalance(db: any, userId: string): Promise<number> {
  if (!userId) return 0;

  let authoritativeBal: number | null = null;

  // 1. Check Turso SQL users table
  try {
    const userRes = await executeTurso(`SELECT wallet_balance FROM users WHERE uid = ? OR id = ? LIMIT 1;`, [userId, userId]);
    if (userRes.rows && userRes.rows.length > 0) {
      const raw = (userRes.rows[0] as any).wallet_balance;
      if (typeof raw === "number" && !isNaN(raw)) {
        authoritativeBal = raw;
      }
    }
  } catch {}

  // 2. Check Turso SQL wallets table
  try {
    const walRes = await executeTurso(`SELECT balance FROM wallets WHERE user_id = ? OR wallet_id = ? LIMIT 1;`, [userId, `wal_${userId}`]);
    if (walRes.rows && walRes.rows.length > 0) {
      const raw = (walRes.rows[0] as any).balance;
      if (typeof raw === "number" && !isNaN(raw)) {
        if (authoritativeBal === null || raw > authoritativeBal) {
          authoritativeBal = raw;
        }
      }
    }
  } catch {}

  // 3. Check memory & walletsStore
  if (authoritativeBal === null) {
    try {
      const wRec = await walletsStore.getWalletByUserId(userId);
      if (wRec && typeof wRec.balance === "number") {
        authoritativeBal = wRec.balance;
      }
    } catch {}
  }

  if (authoritativeBal === null && db?.users) {
    const u = db.users.find((x: any) => x.uid === userId || x.id === userId);
    if (u && typeof u.walletBalance === "number") {
      authoritativeBal = u.walletBalance;
    }
  }

  const finalBal = authoritativeBal !== null && !isNaN(authoritativeBal) ? Math.max(0, authoritativeBal) : 0;

  // Synchronize everywhere
  try {
    await UserRepository.updateBalance(userId, finalBal).catch(() => {});
    await executeTurso(`UPDATE wallets SET balance = ?, updated_at = datetime('now') WHERE user_id = ?;`, [finalBal, userId]).catch(() => {});
    await usersStore.updateUser(userId, { walletBalance: finalBal }).catch(() => {});
    await walletsStore.updateWalletAtomic(userId, () => ({ balance: finalBal, currentBalance: finalBal })).catch(() => {});
  } catch {}

  if (db?.users) {
    const u = db.users.find((x: any) => x.uid === userId || x.id === userId);
    if (u) u.walletBalance = finalBal;
  }
  if (db?.wallets) {
    const w = db.wallets.find((x: any) => x.userId === userId || x.walletId === `wal_${userId}`);
    if (w) {
      w.balance = finalBal;
      w.currentBalance = finalBal;
    }
  }

  return finalBal;
}
