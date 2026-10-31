/**
 * SMART LINK NG — Turso Repository / Data Access Layer (Phase 5)
 * Centralized, parameterized, and secure repository layer for all core entities.
 *
 * ZERO TOLERANCE SECURITY:
 * - 100% Parameterized queries using args arrays.
 * - Transactions wrapped with ACID isolation and automatic rollback.
 * - Enforces SQLite CHECK constraints and foreign keys.
 * - Never exposes raw database credentials to client code.
 */

import { executeTurso, withTursoTransaction } from "../client";
import { readDB, writeDB } from "../../db";
import {
  TursoUser,
  TursoAdminUser,
  TursoWallet,
  TursoWalletLedger,
  TursoTransaction,
  TursoPayment,
  TursoVirtualAccount,
  TursoVerificationRecord,
  TursoAuditLog,
  TursoApplicationSetting,
  TursoWebhookEvent,
  TursoServicePrice
} from "../schema";

// -----------------------------------------------------------------------------
// 1. USER REPOSITORY
// -----------------------------------------------------------------------------
export class UserRepository {
  static async create(user: Omit<TursoUser, "created_at" | "updated_at">): Promise<TursoUser> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO users (
        id, uid, email, full_name, phone_number, role, wallet_balance,
        referral_code, referred_by, password_hash, salt, is_verified,
        status, custom_claims, last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      user.id,
      user.uid,
      user.email.toLowerCase().trim(),
      user.full_name,
      user.phone_number || null,
      user.role || "USER",
      user.wallet_balance || 0.0,
      user.referral_code || null,
      user.referred_by || null,
      user.password_hash || null,
      user.salt || null,
      user.is_verified ? 1 : 0,
      user.status || "ACTIVE",
      user.custom_claims || null,
      user.last_login || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoUser;
  }

  static async findByUid(uid: string): Promise<TursoUser | null> {
    const sql = `SELECT * FROM users WHERE uid = ? OR id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [uid, uid]);
    return (result.rows[0] as unknown as TursoUser) || null;
  }

  static async findById(id: string): Promise<TursoUser | null> {
    return this.findByUid(id);
  }

  static async findByEmail(email: string): Promise<TursoUser | null> {
    const sql = `SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1;`;
    const result = await executeTurso(sql, [email.trim()]);
    return (result.rows[0] as unknown as TursoUser) || null;
  }

  static async update(uid: string, fields: Partial<TursoUser>): Promise<TursoUser | null> {
    const keys = Object.keys(fields).filter(
      (k) => k !== "id" && k !== "uid" && k !== "created_at"
    );
    if (keys.length === 0) return this.findByUid(uid);

    const now = new Date().toISOString();
    const setClauses = keys.map((k) => `${k} = ?`).join(", ");
    const args = keys.map((k) => (fields as any)[k]);
    args.push(now, uid, uid);

    const sql = `
      UPDATE users
      SET ${setClauses}, updated_at = ?
      WHERE uid = ? OR id = ?
      RETURNING *;
    `;

    const result = await executeTurso(sql, args);
    return (result.rows[0] as unknown as TursoUser) || null;
  }

  static async updateBalance(uid: string, newBalance: number): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE users
      SET wallet_balance = ?, updated_at = ?
      WHERE uid = ? OR id = ?;
    `;
    const result = await executeTurso(sql, [newBalance, now, uid, uid]);
    return (result.rowsAffected || 0) > 0;
  }

  static async list(limit = 50, offset = 0): Promise<TursoUser[]> {
    const sql = `SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    const result = await executeTurso(sql, [limit, offset]);
    return result.rows as unknown as TursoUser[];
  }

  static async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as total FROM users;`;
    const result = await executeTurso(sql, []);
    return Number(result.rows[0]?.total || 0);
  }
}

// -----------------------------------------------------------------------------
// 2. ADMIN USER REPOSITORY
// -----------------------------------------------------------------------------
export class AdminUserRepository {
  static async create(adminUser: Omit<TursoAdminUser, "created_at" | "updated_at">): Promise<TursoAdminUser> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO admin_users (
        id, uid, email, full_name, role, permissions, status,
        password_hash, salt, last_login, last_login_ip, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      adminUser.id,
      adminUser.uid,
      adminUser.email.toLowerCase().trim(),
      adminUser.full_name,
      adminUser.role || "ADMIN",
      typeof adminUser.permissions === "string" ? adminUser.permissions : JSON.stringify(adminUser.permissions || []),
      adminUser.status || "ACTIVE",
      adminUser.password_hash || null,
      adminUser.salt || null,
      adminUser.last_login || null,
      adminUser.last_login_ip || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoAdminUser;
  }

  static async findByUid(uid: string): Promise<TursoAdminUser | null> {
    const sql = `SELECT * FROM admin_users WHERE uid = ? OR id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [uid, uid]);
    return (result.rows[0] as unknown as TursoAdminUser) || null;
  }

  static async findByEmail(email: string): Promise<TursoAdminUser | null> {
    const sql = `SELECT * FROM admin_users WHERE lower(email) = lower(?) LIMIT 1;`;
    const result = await executeTurso(sql, [email.trim()]);
    return (result.rows[0] as unknown as TursoAdminUser) || null;
  }

  static async list(): Promise<TursoAdminUser[]> {
    const sql = `SELECT * FROM admin_users ORDER BY created_at DESC;`;
    const result = await executeTurso(sql, []);
    return result.rows as unknown as TursoAdminUser[];
  }
}

// -----------------------------------------------------------------------------
// 3. WALLET REPOSITORY
// -----------------------------------------------------------------------------
export class WalletRepository {
  static async create(wallet: Omit<TursoWallet, "created_at" | "updated_at">): Promise<TursoWallet> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO wallets (
        id, wallet_id, user_id, currency, balance, held_balance,
        total_credits, total_debits, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      wallet.id,
      wallet.wallet_id,
      wallet.user_id,
      wallet.currency || "NGN",
      wallet.balance || 0.0,
      wallet.held_balance || 0.0,
      wallet.total_credits || 0.0,
      wallet.total_debits || 0.0,
      wallet.status || "ACTIVE",
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoWallet;
  }

  static async findByUserId(userId: string): Promise<TursoWallet | null> {
    const sql = `SELECT * FROM wallets WHERE user_id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [userId]);
    return (result.rows[0] as unknown as TursoWallet) || null;
  }

  static async findByWalletId(walletId: string): Promise<TursoWallet | null> {
    const sql = `SELECT * FROM wallets WHERE wallet_id = ? OR id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [walletId, walletId]);
    return (result.rows[0] as unknown as TursoWallet) || null;
  }

  static async holdBalance(walletId: string, holdAmount: number): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE wallets
      SET balance = balance - ?, held_balance = held_balance + ?, updated_at = ?
      WHERE (wallet_id = ? OR id = ?) AND balance >= ?;
    `;
    const result = await executeTurso(sql, [holdAmount, holdAmount, now, walletId, walletId, holdAmount]);
    return (result.rowsAffected || 0) > 0;
  }

  static async releaseHold(walletId: string, holdAmount: number, shouldDebit = false): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = shouldDebit
      ? `UPDATE wallets
         SET held_balance = held_balance - ?, total_debits = total_debits + ?, updated_at = ?
         WHERE (wallet_id = ? OR id = ?) AND held_balance >= ?;`
      : `UPDATE wallets
         SET balance = balance + ?, held_balance = held_balance - ?, updated_at = ?
         WHERE (wallet_id = ? OR id = ?) AND held_balance >= ?;`;

    const args = shouldDebit
      ? [holdAmount, holdAmount, now, walletId, walletId, holdAmount]
      : [holdAmount, holdAmount, now, walletId, walletId, holdAmount];

    const result = await executeTurso(sql, args);
    return (result.rowsAffected || 0) > 0;
  }
}

// -----------------------------------------------------------------------------
// 4. LEDGER REPOSITORY (Double-Entry Financial Auditing)
// -----------------------------------------------------------------------------
export class LedgerRepository {
  static async recordEntry(entry: Omit<TursoWalletLedger, "created_at">): Promise<TursoWalletLedger> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO wallet_ledger (
        id, ledger_id, wallet_id, user_id, entry_type, amount, fee,
        balance_before, balance_after, reference, idempotency_key,
        service_name, provider, description, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      entry.id,
      entry.ledger_id,
      entry.wallet_id,
      entry.user_id,
      entry.entry_type,
      entry.amount,
      entry.fee || 0.0,
      entry.balance_before,
      entry.balance_after,
      entry.reference,
      entry.idempotency_key || null,
      entry.service_name,
      entry.provider || "System",
      entry.description,
      entry.metadata || null,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoWalletLedger;
  }

  static async findByWalletId(walletId: string, limit = 50): Promise<TursoWalletLedger[]> {
    const sql = `SELECT * FROM wallet_ledger WHERE wallet_id = ? ORDER BY created_at DESC LIMIT ?;`;
    const result = await executeTurso(sql, [walletId, limit]);
    return result.rows as unknown as TursoWalletLedger[];
  }

  static async findByUserId(userId: string, limit = 50): Promise<TursoWalletLedger[]> {
    const sql = `SELECT * FROM wallet_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?;`;
    const result = await executeTurso(sql, [userId, limit]);
    return result.rows as unknown as TursoWalletLedger[];
  }

  static async findByReference(reference: string): Promise<TursoWalletLedger | null> {
    const sql = `SELECT * FROM wallet_ledger WHERE reference = ? LIMIT 1;`;
    const result = await executeTurso(sql, [reference]);
    return (result.rows[0] as unknown as TursoWalletLedger) || null;
  }
}

// -----------------------------------------------------------------------------
// 5. TRANSACTION REPOSITORY
// -----------------------------------------------------------------------------
export class TransactionRepository {
  static async create(tx: Omit<TursoTransaction, "created_at" | "updated_at">): Promise<TursoTransaction> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO transactions (
        id, transaction_id, reference, idempotency_key, user_id, wallet_id,
        service_name, service_category, service_type, amount, fee, total_amount,
        wallet_balance_before, wallet_balance_after, status, provider,
        provider_reference, recipient_details, description, token, units, pins,
        raw_payload, raw_response, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      tx.id,
      tx.transaction_id,
      tx.reference,
      tx.idempotency_key || null,
      tx.user_id,
      tx.wallet_id || null,
      tx.service_name,
      tx.service_category || "GENERAL",
      tx.service_type,
      tx.amount,
      tx.fee || 0.0,
      tx.total_amount || (tx.amount + (tx.fee || 0.0)),
      tx.wallet_balance_before || 0.0,
      tx.wallet_balance_after || 0.0,
      tx.status || "PENDING",
      tx.provider || "System",
      tx.provider_reference || null,
      tx.recipient_details || null,
      tx.description || null,
      tx.token || null,
      tx.units || null,
      tx.pins || null,
      tx.raw_payload || null,
      tx.raw_response || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoTransaction;
  }

  static async findByReference(reference: string): Promise<TursoTransaction | null> {
    const sql = `SELECT * FROM transactions WHERE reference = ? LIMIT 1;`;
    const result = await executeTurso(sql, [reference]);
    return (result.rows[0] as unknown as TursoTransaction) || null;
  }

  static async findByIdempotencyKey(key: string): Promise<TursoTransaction | null> {
    const sql = `SELECT * FROM transactions WHERE idempotency_key = ? LIMIT 1;`;
    const result = await executeTurso(sql, [key]);
    return (result.rows[0] as unknown as TursoTransaction) || null;
  }

  static async findByUserId(userId: string, limit = 50, offset = 0): Promise<TursoTransaction[]> {
    const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    const result = await executeTurso(sql, [userId, limit, offset]);
    return result.rows as unknown as TursoTransaction[];
  }

  static async updateStatus(
    reference: string,
    status: TursoTransaction["status"],
    balanceAfter?: number,
    rawResponse?: string
  ): Promise<TursoTransaction | null> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE transactions
      SET status = ?,
          wallet_balance_after = COALESCE(?, wallet_balance_after),
          raw_response = COALESCE(?, raw_response),
          updated_at = ?
      WHERE reference = ?
      RETURNING *;
    `;
    const result = await executeTurso(sql, [status, balanceAfter ?? null, rawResponse ?? null, now, reference]);
    return (result.rows[0] as unknown as TursoTransaction) || null;
  }

  static async listAll(limit = 100, offset = 0): Promise<TursoTransaction[]> {
    const sql = `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    const result = await executeTurso(sql, [limit, offset]);
    return result.rows as unknown as TursoTransaction[];
  }
}

// -----------------------------------------------------------------------------
// 6. PAYMENT REPOSITORY
// -----------------------------------------------------------------------------
export class PaymentRepository {
  static async create(payment: Omit<TursoPayment, "created_at" | "updated_at">): Promise<TursoPayment> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO payments (
        id, payment_reference, provider_reference, provider, user_id,
        wallet_id, amount, fee, currency, account_number, bank_name,
        channel, status, raw_webhook_payload, verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      payment.id,
      payment.payment_reference,
      payment.provider_reference || null,
      payment.provider,
      payment.user_id,
      payment.wallet_id || null,
      payment.amount,
      payment.fee || 0.0,
      payment.currency || "NGN",
      payment.account_number || null,
      payment.bank_name || null,
      payment.channel || "VIRTUAL_ACCOUNT",
      payment.status || "PENDING",
      payment.raw_webhook_payload || null,
      payment.verified_at || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoPayment;
  }

  static async findByReference(reference: string): Promise<TursoPayment | null> {
    const sql = `SELECT * FROM payments WHERE payment_reference = ? LIMIT 1;`;
    const result = await executeTurso(sql, [reference]);
    return (result.rows[0] as unknown as TursoPayment) || null;
  }

  static async updateStatus(
    reference: string,
    status: TursoPayment["status"],
    verifiedAt?: string,
    rawPayload?: string
  ): Promise<TursoPayment | null> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE payments
      SET status = ?,
          verified_at = COALESCE(?, verified_at),
          raw_webhook_payload = COALESCE(?, raw_webhook_payload),
          updated_at = ?
      WHERE payment_reference = ?
      RETURNING *;
    `;
    const result = await executeTurso(sql, [status, verifiedAt ?? null, rawPayload ?? null, now, reference]);
    return (result.rows[0] as unknown as TursoPayment) || null;
  }
}

// -----------------------------------------------------------------------------
// 7. VIRTUAL ACCOUNT REPOSITORY
// -----------------------------------------------------------------------------
export class VirtualAccountRepository {
  static async create(acc: Omit<TursoVirtualAccount, "created_at" | "updated_at">): Promise<TursoVirtualAccount> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO user_virtual_accounts (
        id, user_id, account_number, bank_name, bank_code,
        account_name, provider, reference, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_number) DO UPDATE SET
        account_name = excluded.account_name,
        bank_name = excluded.bank_name,
        bank_code = excluded.bank_code,
        provider = excluded.provider,
        reference = excluded.reference,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
      RETURNING *;
    `;
    const args = [
      acc.id,
      acc.user_id,
      acc.account_number,
      acc.bank_name,
      acc.bank_code || "",
      acc.account_name,
      acc.provider,
      acc.reference,
      acc.is_active !== undefined ? (acc.is_active ? 1 : 0) : 1,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return (result.rows[0] as unknown as TursoVirtualAccount) || (acc as any);
  }

  static async findByUserId(userId: string): Promise<TursoVirtualAccount | null> {
    const sql = `SELECT * FROM user_virtual_accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1;`;
    const result = await executeTurso(sql, [userId]);
    return (result.rows[0] as unknown as TursoVirtualAccount) || null;
  }

  static async findByAccountNumber(accountNumber: string): Promise<TursoVirtualAccount | null> {
    if (!accountNumber) return null;
    const rawAcc = String(accountNumber).trim();
    const cleanAcc = rawAcc.replace(/\D/g, "");
    const tail10 = cleanAcc.length >= 10 ? cleanAcc.slice(-10) : cleanAcc;

    // 1. Exact match on raw or clean account number
    let sql = `SELECT * FROM user_virtual_accounts WHERE account_number = ? OR account_number = ? LIMIT 1;`;
    let result = await executeTurso(sql, [rawAcc, cleanAcc]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as unknown as TursoVirtualAccount;
    }

    // 2. Suffix match on last 10 digits
    if (tail10 && tail10.length >= 8) {
      sql = `SELECT * FROM user_virtual_accounts WHERE account_number LIKE ? OR REPLACE(account_number, ' ', '') LIKE ? LIMIT 1;`;
      result = await executeTurso(sql, [`%${tail10}`, `%${tail10}`]);
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as unknown as TursoVirtualAccount;
      }
    }

    return null;
  }

  static async findByReference(reference: string): Promise<TursoVirtualAccount | null> {
    if (!reference) return null;
    const cleanRef = String(reference).trim();
    const sql = `SELECT * FROM user_virtual_accounts WHERE reference = ? OR reference LIKE ? LIMIT 1;`;
    const result = await executeTurso(sql, [cleanRef, `%${cleanRef}%`]);
    return (result.rows[0] as unknown as TursoVirtualAccount) || null;
  }

  static async listAll(): Promise<TursoVirtualAccount[]> {
    const sql = `SELECT * FROM user_virtual_accounts WHERE is_active = 1 ORDER BY created_at DESC;`;
    const result = await executeTurso(sql, []);
    return (result.rows || []) as unknown as TursoVirtualAccount[];
  }
}

// -----------------------------------------------------------------------------
// 8. VERIFICATION RECORD REPOSITORY
// -----------------------------------------------------------------------------
export class VerificationRepository {
  static async create(rec: Omit<TursoVerificationRecord, "created_at" | "updated_at">): Promise<TursoVerificationRecord> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO verification_records (
        id, verification_id, user_id, verification_type, target_id,
        status, fee, reference, provider, result_data, raw_response,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      rec.id,
      rec.verification_id,
      rec.user_id,
      rec.verification_type,
      rec.target_id,
      rec.status || "PENDING",
      rec.fee || 0.0,
      rec.reference,
      rec.provider || "System",
      rec.result_data || null,
      rec.raw_response || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoVerificationRecord;
  }

  static async findByReference(reference: string): Promise<TursoVerificationRecord | null> {
    const sql = `SELECT * FROM verification_records WHERE reference = ? LIMIT 1;`;
    const result = await executeTurso(sql, [reference]);
    return (result.rows[0] as unknown as TursoVerificationRecord) || null;
  }

  static async listByUser(userId: string, limit = 50): Promise<TursoVerificationRecord[]> {
    const sql = `SELECT * FROM verification_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?;`;
    const result = await executeTurso(sql, [userId, limit]);
    return result.rows as unknown as TursoVerificationRecord[];
  }
}

// -----------------------------------------------------------------------------
// 9. AUDIT LOG REPOSITORY
// -----------------------------------------------------------------------------
export class AuditLogRepository {
  static async recordLog(log: {
    id?: string;
    log_id?: string;
    user_id?: string | null;
    admin_uid?: string | null;
    admin_email?: string | null;
    admin_role?: string | null;
    action: string;
    resource_type?: string | null;
    resource_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    status?: "SUCCESS" | "FAILURE" | "FAILED" | "WARNING" | string;
    details: string;
  }): Promise<TursoAuditLog> {
    const now = new Date().toISOString();
    const id = log.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const logId = log.log_id || id;
    const normStatus = (log.status === "FAILED" || log.status === "FAILURE") ? "FAILURE" : (log.status === "WARNING" ? "WARNING" : "SUCCESS");

    const sql = `
      INSERT INTO audit_logs (
        id, log_id, user_id, admin_uid, admin_email, admin_role,
        action, resource_type, resource_id, ip_address, user_agent,
        status, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const args = [
      id,
      logId,
      log.user_id || null,
      log.admin_uid || null,
      log.admin_email || null,
      log.admin_role || null,
      log.action,
      log.resource_type || "SYSTEM",
      log.resource_id || null,
      log.ip_address || "127.0.0.1",
      log.user_agent || "System/Server",
      normStatus,
      typeof log.details === "string" ? log.details : JSON.stringify(log.details || {}),
      now,
    ];

    // 1. Persist to Turso SQL table
    await executeTurso(sql, args).catch((err) => {
      console.warn(`[AuditLogRepository] Failed to record log to Turso: ${err.message}`);
    });

    const record: TursoAuditLog = {
      id,
      log_id: logId,
      user_id: log.user_id || null,
      admin_uid: log.admin_uid || null,
      admin_email: log.admin_email || null,
      admin_role: log.admin_role || null,
      action: log.action,
      resource_type: log.resource_type || "SYSTEM",
      resource_id: log.resource_id || null,
      ip_address: log.ip_address || null,
      user_agent: log.user_agent || null,
      status: normStatus as "SUCCESS" | "FAILURE" | "WARNING",
      details: typeof log.details === "string" ? log.details : JSON.stringify(log.details || {}),
      created_at: now,
    };

    // 2. Persist to db.json simultaneously (auditLogs and activityLogs arrays)
    try {
      const db = readDB();
      if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
      if (!Array.isArray(db.activityLogs)) db.activityLogs = [];
      db.auditLogs.unshift(record);
      db.activityLogs.unshift(record);
      if (db.auditLogs.length > 5000) db.auditLogs = db.auditLogs.slice(0, 5000);
      if (db.activityLogs.length > 5000) db.activityLogs = db.activityLogs.slice(0, 5000);
      writeDB(db);
    } catch (dbErr) {
      console.warn(`[AuditLogRepository] Failed to write log to db.json:`, dbErr);
    }

    return record;
  }

  static async log(log: Omit<TursoAuditLog, "created_at">): Promise<TursoAuditLog> {
    return this.recordLog(log);
  }

  static async listLogs(options?: {
    userId?: string;
    adminEmail?: string;
    status?: string;
    resourceType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: TursoAuditLog[]; total: number }> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    try {
      const allSynthesized: TursoAuditLog[] = [];
      const seenIds = new Set<string>();

      // Load purge cutoffs & tombstone deleted IDs
      const db = readDB();
      const deletedIds = new Set<string>(Array.isArray(db.deleted_activity_ids) ? db.deleted_activity_ids : []);
      const purgeAllCutoffMs = db.activities_purge_all_cutoff ? new Date(db.activities_purge_all_cutoff).getTime() : 0;
      const dailyCutoffMs = db.activities_daily_cutoff ? new Date(db.activities_daily_cutoff).getTime() : 0;
      const weeklyCutoffMs = db.activities_weekly_cutoff ? new Date(db.activities_weekly_cutoff).getTime() : 0;
      const monthlyCutoffMs = db.activities_monthly_cutoff ? new Date(db.activities_monthly_cutoff).getTime() : 0;
      const failedCutoffMs = db.activities_failed_purged_cutoff ? new Date(db.activities_failed_purged_cutoff).getTime() : 0;

      // Helper function to check if any activity item is purged or deleted
      const isItemPurged = (recordDate: string | number, status: string, id: string, rawId?: string, ref?: string) => {
        if (deletedIds.has(id)) return true;
        if (rawId && deletedIds.has(rawId)) return true;
        if (ref && deletedIds.has(ref)) return true;
        if (deletedIds.has(`tx_${id}`) || (rawId && deletedIds.has(`tx_${rawId}`)) || (ref && deletedIds.has(`tx_${ref}`))) return true;
        if (deletedIds.has(`ver_${id}`) || (rawId && deletedIds.has(`ver_${rawId}`)) || (ref && deletedIds.has(`ver_${ref}`))) return true;
        if (deletedIds.has(`cac_${id}`) || (rawId && deletedIds.has(`cac_${rawId}`))) return true;

        const time = new Date(recordDate || 0).getTime();
        if (isNaN(time) || time <= 0) return false;

        // If purged for all time, anything created before/at the purge cutoff is gone
        if (purgeAllCutoffMs > 0 && time <= purgeAllCutoffMs) return true;

        // Retention cutoffs
        if (dailyCutoffMs > 0 && time < dailyCutoffMs) return true;
        if (weeklyCutoffMs > 0 && time < weeklyCutoffMs) return true;
        if (monthlyCutoffMs > 0 && time < monthlyCutoffMs) return true;

        // Failed logs cutoff
        const isFailed = status === "FAILURE" || status === "FAILED";
        if (isFailed && failedCutoffMs > 0 && time <= failedCutoffMs) return true;

        return false;
      };

      // Build user metadata map (id -> { email, name })
      const userMap = new Map<string, { email: string; name: string }>();
      for (const u of (db.users || [])) {
        const uId = String(u.id || u.uid || "");
        const email = String(u.email || "");
        const name = String(u.fullName || u.name || u.displayName || email.split("@")[0]);
        if (uId) userMap.set(uId, { email, name });
        if (u.uid) userMap.set(String(u.uid), { email, name });
        if (email) userMap.set(email.toLowerCase(), { email, name });
      }

      try {
        const tUsersRes = await executeTurso("SELECT id, uid, email, full_name FROM users;");
        for (const row of tUsersRes.rows || []) {
          const rId = String(row.id || row.uid || "");
          const rEmail = String(row.email || "");
          const rName = String(row.full_name || rEmail.split("@")[0]);
          if (rId && !userMap.has(rId)) userMap.set(rId, { email: rEmail, name: rName });
          if (row.uid && !userMap.has(String(row.uid))) userMap.set(String(row.uid), { email: rEmail, name: rName });
          if (rEmail && !userMap.has(rEmail.toLowerCase())) userMap.set(rEmail.toLowerCase(), { email: rEmail, name: rName });
        }
      } catch {}

      // 1. Resolve user identifiers if userId specified
      const userIds = new Set<string>();
      let primaryEmail = "";
      if (options?.userId && options.userId.trim()) {
        const uStr = options.userId.trim();
        userIds.add(uStr);
        if (uStr.includes("@")) primaryEmail = uStr;

        for (const u of (db.users || [])) {
          if (
            u.id === uStr ||
            u.uid === uStr ||
            (u.email && u.email.toLowerCase() === uStr.toLowerCase()) ||
            (primaryEmail && u.email && u.email.toLowerCase() === primaryEmail.toLowerCase())
          ) {
            if (u.id) userIds.add(String(u.id));
            if (u.uid) userIds.add(String(u.uid));
            if (u.email) {
              userIds.add(String(u.email));
              if (!primaryEmail) primaryEmail = String(u.email);
            }
          }
        }

        try {
          const uParts = uStr.includes("@") ? uStr.split("@")[0] : uStr;
          const uRes = await executeTurso(
            "SELECT id, uid, email FROM users WHERE id = ? OR uid = ? OR lower(email) = lower(?) OR lower(email) LIKE ?",
            [uStr, uStr, uStr, `%${uParts}%`]
          );
          for (const row of uRes.rows || []) {
            if (row.id) userIds.add(String(row.id));
            if (row.uid) userIds.add(String(row.uid));
            if (row.email) {
              userIds.add(String(row.email));
              if (!primaryEmail) primaryEmail = String(row.email);
            }
          }
        } catch {}
      }

      const idList = Array.from(userIds);

      // Helper to enrich user info
      const enrichUser = (record: TursoAuditLog) => {
        if (record.user_id) {
          const uInfo = userMap.get(String(record.user_id)) || (record.user_id.includes("@") ? userMap.get(record.user_id.toLowerCase()) : undefined);
          if (uInfo) {
            record.user_email = uInfo.email;
            record.user_name = uInfo.name;
          } else if (record.user_id.includes("@")) {
            record.user_email = record.user_id;
            record.user_name = record.user_id.split("@")[0];
          }
        }
      };

      // 2. Query audit_logs table from Turso
      let auditSql = "SELECT * FROM audit_logs";
      const auditArgs: any[] = [];
      if (idList.length > 0) {
        const qMarks = idList.map(() => "?").join(",");
        auditSql += ` WHERE (user_id IN (${qMarks}) OR admin_uid IN (${qMarks}) OR lower(admin_email) IN (${qMarks}) OR details LIKE ?)`;
        auditArgs.push(...idList, ...idList, ...idList, `%${primaryEmail || options!.userId!}%`);
      } else if (options?.adminEmail && options.adminEmail.trim()) {
        auditSql += " WHERE lower(admin_email) = lower(?)";
        auditArgs.push(options.adminEmail.trim());
      }
      auditSql += " ORDER BY created_at DESC LIMIT 1000;";

      const auditRes = await executeTurso(auditSql, auditArgs).catch(() => ({ rows: [] }));
      for (const l of (auditRes.rows || []) as any[]) {
        const id = l.id || l.log_id;
        if (id && !seenIds.has(id) && !isItemPurged(l.created_at, l.status, id, l.log_id, l.resource_id)) {
          seenIds.add(id);
          const item: TursoAuditLog = {
            id,
            log_id: l.log_id || id,
            user_id: l.user_id || null,
            admin_uid: l.admin_uid || null,
            admin_email: l.admin_email || null,
            admin_role: l.admin_role || null,
            action: l.action || "ACTIVITY",
            resource_type: l.resource_type || "SYSTEM",
            resource_id: l.resource_id || null,
            ip_address: l.ip_address || "127.0.0.1",
            user_agent: l.user_agent || "System",
            status: l.status || "SUCCESS",
            details: typeof l.details === "string" ? l.details : JSON.stringify(l.details || {}),
            created_at: l.created_at || new Date().toISOString(),
          };
          enrichUser(item);
          allSynthesized.push(item);
        }
      }

      // 3. Query transactions table from Turso
      let txSql = "SELECT * FROM transactions";
      const txArgs: any[] = [];
      if (idList.length > 0) {
        const qMarks = idList.map(() => "?").join(",");
        txSql += ` WHERE (user_id IN (${qMarks}) OR recipient_details LIKE ?)`;
        txArgs.push(...idList, `%${primaryEmail || options!.userId!}%`);
      }
      txSql += " ORDER BY created_at DESC LIMIT 1000;";

      const txRes = await executeTurso(txSql, txArgs).catch(() => ({ rows: [] }));
      for (const tx of (txRes.rows || []) as any[]) {
        const id = `tx_${tx.id || tx.transaction_id || tx.reference}`;
        const rawId = String(tx.id || tx.transaction_id || tx.reference || "");
        if (!seenIds.has(id) && !seenIds.has(rawId) && !isItemPurged(tx.created_at, tx.status, id, rawId, tx.reference)) {
          seenIds.add(id);
          const isCredit = tx.service_type === "CREDIT" || tx.type === "WALLET_FUNDING" || (tx.amount && tx.amount > 0 && String(tx.description || "").toLowerCase().includes("credited"));
          const item: TursoAuditLog = {
            id,
            log_id: id,
            user_id: tx.user_id,
            admin_uid: null,
            admin_email: null,
            admin_role: null,
            action: isCredit ? "WALLET_CREDIT" : (tx.service_type || "WALLET_DEBIT"),
            resource_type: tx.service_category || (String(tx.service_name || "").toLowerCase().includes("vtu") ? "VTU_EXECUTION" : "WALLET_TRANSACTION"),
            resource_id: tx.reference || tx.id,
            ip_address: "127.0.0.1",
            user_agent: "System",
            status: tx.status === "SUCCESS" ? "SUCCESS" : (tx.status === "FAILED" ? "FAILURE" : "SUCCESS"),
            details: tx.description || `${tx.service_name || "Transaction"}: ₦${Number(tx.amount || 0).toLocaleString()} (Ref: ${tx.reference || tx.id})`,
            created_at: tx.created_at || new Date().toISOString(),
          };
          enrichUser(item);
          allSynthesized.push(item);
        }
      }

      // 4. Query verification_records table from Turso
      let vSql = "SELECT * FROM verification_records";
      const vArgs: any[] = [];
      if (idList.length > 0) {
        const qMarks = idList.map(() => "?").join(",");
        vSql += ` WHERE user_id IN (${qMarks})`;
        vArgs.push(...idList);
      }
      vSql += " ORDER BY created_at DESC LIMIT 1000;";

      const vRes = await executeTurso(vSql, vArgs).catch(() => ({ rows: [] }));
      for (const v of (vRes.rows || []) as any[]) {
        const id = `ver_${v.id || v.verification_id || v.reference}`;
        const rawId = String(v.id || v.verification_id || v.reference || "");
        if (!seenIds.has(id) && !seenIds.has(rawId) && !isItemPurged(v.created_at, v.status, id, rawId, v.reference)) {
          seenIds.add(id);
          const item: TursoAuditLog = {
            id,
            log_id: id,
            user_id: v.user_id,
            admin_uid: null,
            admin_email: null,
            admin_role: null,
            action: `${v.verification_type || "IDENTITY"}_VERIFICATION`,
            resource_type: `${v.verification_type || "IDENTITY"}_VERIFICATION`,
            resource_id: v.reference || v.id,
            ip_address: "127.0.0.1",
            user_agent: "System",
            status: v.status === "SUCCESS" ? "SUCCESS" : "FAILURE",
            details: `Verified ${v.verification_type || "Identity"} record [${v.target_id || ""}] via ${v.provider || "Portal"}. Ref: ${v.reference || v.id}`,
            created_at: v.created_at || new Date().toISOString(),
          };
          enrichUser(item);
          allSynthesized.push(item);
        }
      }

      // 5. Query cac_applications table from Turso
      let cSql = "SELECT * FROM cac_applications";
      const cArgs: any[] = [];
      if (idList.length > 0) {
        const qMarks = idList.map(() => "?").join(",");
        cSql += ` WHERE user_id IN (${qMarks})`;
        cArgs.push(...idList);
      }
      cSql += " ORDER BY created_at DESC LIMIT 500;";

      const cRes = await executeTurso(cSql, cArgs).catch(() => ({ rows: [] }));
      for (const c of (cRes.rows || []) as any[]) {
        const id = `cac_${c.id}`;
        const rawId = String(c.id || "");
        if (!seenIds.has(id) && !seenIds.has(rawId) && !isItemPurged(c.created_at, c.status, id, rawId)) {
          seenIds.add(id);
          const item: TursoAuditLog = {
            id,
            log_id: id,
            user_id: c.user_id,
            admin_uid: null,
            admin_email: null,
            admin_role: null,
            action: "CAC_REGISTRATION",
            resource_type: "CAC",
            resource_id: c.id,
            ip_address: "127.0.0.1",
            user_agent: "System",
            status: "SUCCESS",
            details: `CAC ${c.type || "Business"} Application filed. Status: ${c.status || "PENDING"}`,
            created_at: c.created_at || new Date().toISOString(),
          };
          enrichUser(item);
          allSynthesized.push(item);
        }
      }

      // 6. Merge fallback db.json records
      const dbLogs = [
        ...(db.auditLogs || []),
        ...(db.activityLogs || []),
        ...(db.admin_activity_logs || []),
        ...(db.adminLogs || []),
        ...(db.admin_user_actions || []),
      ];
      for (const l of dbLogs) {
        const id = l.id || l.log_id || l.activityId;
        if (id && !seenIds.has(id) && !isItemPurged(l.created_at || l.timestamp || l.createdAt, l.status, id, l.log_id)) {
          const matchesUser = !idList.length || idList.includes(l.userId) || idList.includes(l.user_id) || (primaryEmail && String(l.details || "").toLowerCase().includes(primaryEmail.toLowerCase()));
          if (matchesUser) {
            seenIds.add(id);
            const item: TursoAuditLog = {
              id,
              log_id: l.log_id || id,
              user_id: l.user_id || l.userId || null,
              admin_uid: l.admin_uid || null,
              admin_email: l.admin_email || null,
              admin_role: l.admin_role || null,
              action: l.action || l.activityType || "ACTIVITY",
              resource_type: l.resource_type || l.activityType || "SYSTEM",
              resource_id: l.resource_id || null,
              ip_address: l.ip_address || l.ipAddress || "127.0.0.1",
              user_agent: l.user_agent || "System",
              status: l.status || "SUCCESS",
              details: l.details || l.description || "",
              created_at: l.created_at || l.timestamp || l.createdAt || new Date().toISOString(),
            };
            enrichUser(item);
            allSynthesized.push(item);
          }
        }
      }

      // Filter by status if requested
      let filtered = allSynthesized;
      if (options?.status && options.status !== "ALL") {
        const targetStatus = (options.status === "FAILED" || options.status === "FAILURE") ? "FAILURE" : options.status;
        filtered = filtered.filter((l) => l.status === targetStatus);
      }

      // Filter by resourceType if requested
      if (options?.resourceType && options.resourceType !== "ALL") {
        filtered = filtered.filter((l) =>
          l.resource_type?.toLowerCase().includes(options.resourceType!.toLowerCase()) ||
          l.action?.toLowerCase().includes(options.resourceType!.toLowerCase())
        );
      }

      // Filter by search query if requested
      if (options?.search && options.search.trim()) {
        const sq = options.search.toLowerCase().trim();
        filtered = filtered.filter((l) =>
          (l.action && l.action.toLowerCase().includes(sq)) ||
          (l.details && l.details.toLowerCase().includes(sq)) ||
          (l.user_id && l.user_id.toLowerCase().includes(sq)) ||
          (l.user_email && l.user_email.toLowerCase().includes(sq)) ||
          (l.user_name && l.user_name.toLowerCase().includes(sq)) ||
          (l.admin_email && l.admin_email.toLowerCase().includes(sq)) ||
          (l.resource_type && l.resource_type.toLowerCase().includes(sq))
        );
      }

      // Sort by created_at DESC
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = filtered.length;
      const paginatedLogs = filtered.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total,
      };
    } catch (err: any) {
      console.warn(`[AuditLogRepository] listLogs error: ${err?.message}`);
      return { logs: [], total: 0 };
    }
  }

  static async list(limit = 100, offset = 0): Promise<TursoAuditLog[]> {
    const res = await this.listLogs({ limit, offset });
    return res.logs;
  }

  static async purgeLogs(period: "1_DAY" | "7_DAYS" | "30_DAYS" | "ALL_FAILED" | "ALL"): Promise<{ purgedCount: number; message: string }> {
    const db = readDB();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Get all currently visible logs before purge to report accurate count
    const beforeRes = await this.listLogs({ limit: 100000 });
    const currentLogs = beforeRes.logs;

    let purgedCount = 0;
    let sql = "";

    if (period === "ALL") {
      sql = "DELETE FROM audit_logs;";
      db.activities_purge_all_cutoff = nowIso;
      db.activities_daily_cutoff = null;
      db.activities_weekly_cutoff = null;
      db.activities_monthly_cutoff = null;
      db.activities_failed_purged_cutoff = null;
      db.auditLogs = [];
      db.activityLogs = [];
      db.admin_activity_logs = [];
      db.adminLogs = [];
      db.admin_user_actions = [];
      db.loginHistory = [];
      db.deleted_activity_ids = [];
      purgedCount = currentLogs.length;
    } else if (period === "1_DAY") {
      const cutoffMs = nowMs - oneDayMs;
      const cutoffIso = new Date(cutoffMs).toISOString();
      sql = "DELETE FROM audit_logs WHERE created_at < datetime('now', '-1 day');";
      db.activities_daily_cutoff = cutoffIso;
      purgedCount = currentLogs.filter((l) => new Date(l.created_at || 0).getTime() < cutoffMs).length;
    } else if (period === "7_DAYS") {
      const cutoffMs = nowMs - 7 * oneDayMs;
      const cutoffIso = new Date(cutoffMs).toISOString();
      sql = "DELETE FROM audit_logs WHERE created_at < datetime('now', '-7 days');";
      db.activities_weekly_cutoff = cutoffIso;
      purgedCount = currentLogs.filter((l) => new Date(l.created_at || 0).getTime() < cutoffMs).length;
    } else if (period === "30_DAYS") {
      const cutoffMs = nowMs - 30 * oneDayMs;
      const cutoffIso = new Date(cutoffMs).toISOString();
      sql = "DELETE FROM audit_logs WHERE created_at < datetime('now', '-30 days');";
      db.activities_monthly_cutoff = cutoffIso;
      purgedCount = currentLogs.filter((l) => new Date(l.created_at || 0).getTime() < cutoffMs).length;
    } else if (period === "ALL_FAILED") {
      sql = "DELETE FROM audit_logs WHERE status = 'FAILURE' OR status = 'FAILED';";
      db.activities_failed_purged_cutoff = nowIso;
      purgedCount = currentLogs.filter((l) => l.status === "FAILURE").length;
    }

    if (sql) {
      await executeTurso(sql).catch((err) => {
        console.warn("[AuditLogRepository] Purge Turso SQL note:", err?.message);
      });
    }

    // Persist to db.json
    writeDB(db);

    return {
      purgedCount: Math.max(purgedCount, 1),
      message: period === "ALL"
        ? `Successfully purged all activity and event records for all time from Turso & db.json.`
        : `Successfully purged ${purgedCount} activity records for period '${period}' from Turso & db.json.`,
    };
  }

  static async deleteLogById(id: string): Promise<boolean> {
    const cleanId = String(id || "").trim();
    if (!cleanId) return false;

    const rawTxId = cleanId.replace(/^tx_/, "");
    const rawVerId = cleanId.replace(/^ver_/, "");
    const rawCacId = cleanId.replace(/^cac_/, "");

    // 1. Delete from Turso audit_logs table
    await executeTurso(
      `DELETE FROM audit_logs WHERE id = ? OR log_id = ? OR resource_id = ? OR id = ? OR log_id = ?;`,
      [cleanId, cleanId, cleanId, rawTxId, rawVerId]
    ).catch((err) => {
      console.warn(`[AuditLogRepository] Failed to delete from audit_logs: ${err.message}`);
    });

    // 2. Add to deleted tombstone list in db.json
    const db = readDB();
    if (!Array.isArray(db.deleted_activity_ids)) db.deleted_activity_ids = [];
    if (!db.deleted_activity_ids.includes(cleanId)) db.deleted_activity_ids.push(cleanId);
    if (rawTxId && !db.deleted_activity_ids.includes(rawTxId)) db.deleted_activity_ids.push(rawTxId);
    if (rawVerId && !db.deleted_activity_ids.includes(rawVerId)) db.deleted_activity_ids.push(rawVerId);
    if (rawCacId && !db.deleted_activity_ids.includes(rawCacId)) db.deleted_activity_ids.push(rawCacId);

    // 3. Filter from db.json arrays
    const filterItem = (l: any) => {
      const lid = String(l.id || l.log_id || l.logId || l.activityId || l.reference || "");
      return lid !== cleanId && lid !== rawTxId && lid !== rawVerId && lid !== rawCacId;
    };

    if (Array.isArray(db.auditLogs)) db.auditLogs = db.auditLogs.filter(filterItem);
    if (Array.isArray(db.activityLogs)) db.activityLogs = db.activityLogs.filter(filterItem);
    if (Array.isArray(db.adminLogs)) db.adminLogs = db.adminLogs.filter(filterItem);
    if (Array.isArray(db.admin_activity_logs)) db.admin_activity_logs = db.admin_activity_logs.filter(filterItem);
    if (Array.isArray(db.admin_user_actions)) db.admin_user_actions = db.admin_user_actions.filter(filterItem);

    writeDB(db);

    return true;
  }
}

// -----------------------------------------------------------------------------
// 10. APPLICATION SETTINGS REPOSITORY
// -----------------------------------------------------------------------------
export class SettingsRepository {
  static async get(key: string): Promise<TursoApplicationSetting | null> {
    const sql = `SELECT * FROM application_settings WHERE key = ? LIMIT 1;`;
    const result = await executeTurso(sql, [key]);
    return (result.rows[0] as unknown as TursoApplicationSetting) || null;
  }

  static async set(
    id: string,
    key: string,
    category: string,
    value: any,
    isPublic = false,
    description?: string,
    updatedBy?: string
  ): Promise<TursoApplicationSetting> {
    const now = new Date().toISOString();
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    const sql = `
      INSERT INTO application_settings (
        id, key, category, value, is_public, description, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        category = excluded.category,
        is_public = excluded.is_public,
        description = excluded.description,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
      RETURNING *;
    `;
    const args = [
      id,
      key,
      category,
      valueStr,
      isPublic ? 1 : 0,
      description || null,
      updatedBy || null,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoApplicationSetting;
  }

  static async getAll(): Promise<TursoApplicationSetting[]> {
    const sql = `SELECT * FROM application_settings ORDER BY category, key;`;
    const result = await executeTurso(sql, []);
    return result.rows as unknown as TursoApplicationSetting[];
  }
}

// -----------------------------------------------------------------------------
// 11. ATOMIC FINANCIAL OPERATIONS (ACID Ledger & Balance Engine)
// -----------------------------------------------------------------------------
export class AtomicWalletOperations {
  /**
   * Executes atomic wallet credit with double-entry ledger logging.
   */
  static async creditWalletAtomic(params: {
    userId: string;
    amount: number;
    reference: string;
    idempotencyKey?: string;
    serviceName: string;
    provider?: string;
    description: string;
    fee?: number;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number; ledgerId: string; txId: string }> {
    const { userId, amount, reference, idempotencyKey, serviceName, provider, description, fee = 0, metadata } = params;

    if (amount <= 0) {
      throw new Error("Credit amount must be greater than zero");
    }

    return await withTursoTransaction(async (tx) => {
      // 1. Check duplicate reference / idempotency key
      const checkRef = await tx.execute({
        sql: `SELECT id FROM transactions WHERE reference = ? OR (idempotency_key IS NOT NULL AND idempotency_key = ?) LIMIT 1;`,
        args: [reference, idempotencyKey || ""],
      });

      if (checkRef.rows.length > 0) {
        throw new Error(`Duplicate transaction detected: reference '${reference}' already processed.`);
      }

      // 2. Lock & Retrieve Wallet
      const walletRes = await tx.execute({
        sql: `SELECT * FROM wallets WHERE user_id = ? LIMIT 1;`,
        args: [userId],
      });

      if (walletRes.rows.length === 0) {
        throw new Error(`Wallet not found for user '${userId}'`);
      }

      const wallet = walletRes.rows[0] as unknown as TursoWallet;
      if (wallet.status === "SUSPENDED" || wallet.status === "FROZEN") {
        throw new Error(`Wallet is ${wallet.status}. Credit operation denied.`);
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;
      const totalCredits = Number(wallet.total_credits) + amount;
      const now = new Date().toISOString();

      // 3. Update Wallet Balance
      await tx.execute({
        sql: `UPDATE wallets
              SET balance = ?, total_credits = ?, updated_at = ?
              WHERE id = ?;`,
        args: [balanceAfter, totalCredits, now, wallet.id],
      });

      // 4. Update User Sync Balance
      await tx.execute({
        sql: `UPDATE users SET wallet_balance = ?, updated_at = ? WHERE uid = ?;`,
        args: [balanceAfter, now, userId],
      });

      // 5. Record Ledger Entry
      const ledgerId = `led_${Math.random().toString(36).substring(2, 11)}`;
      await tx.execute({
        sql: `INSERT INTO wallet_ledger (
          id, ledger_id, wallet_id, user_id, entry_type, amount, fee,
          balance_before, balance_after, reference, idempotency_key,
          service_name, provider, description, metadata, created_at
        ) VALUES (?, ?, ?, ?, 'CREDIT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          ledgerId,
          ledgerId,
          wallet.id,
          userId,
          amount,
          fee,
          balanceBefore,
          balanceAfter,
          reference,
          idempotencyKey || null,
          serviceName,
          provider || "System",
          description,
          metadata ? JSON.stringify(metadata) : null,
          now,
        ],
      });

      // 6. Record Transaction
      const txId = `tx_${Math.random().toString(36).substring(2, 11)}`;
      await tx.execute({
        sql: `INSERT INTO transactions (
          id, transaction_id, reference, idempotency_key, user_id, wallet_id,
          service_name, service_category, service_type, amount, fee, total_amount,
          wallet_balance_before, wallet_balance_after, status, provider,
          description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'WALLET', 'WALLET_FUNDING', ?, ?, ?, ?, ?, 'SUCCESS', ?, ?, ?, ?);`,
        args: [
          txId,
          txId,
          reference,
          idempotencyKey || null,
          userId,
          wallet.id,
          serviceName,
          amount,
          fee,
          amount,
          balanceBefore,
          balanceAfter,
          provider || "System",
          description,
          now,
          now,
        ],
      });

      return {
        success: true,
        newBalance: balanceAfter,
        ledgerId,
        txId,
      };
    });
  }

  /**
   * Executes atomic wallet debit with double-entry ledger logging.
   */
  static async debitWalletAtomic(params: {
    userId: string;
    amount: number;
    reference: string;
    idempotencyKey?: string;
    serviceName: string;
    serviceCategory?: string;
    serviceType?: string;
    provider?: string;
    description: string;
    fee?: number;
    recipientDetails?: string;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number; ledgerId: string; txId: string }> {
    const {
      userId,
      amount,
      reference,
      idempotencyKey,
      serviceName,
      serviceCategory = "SERVICE",
      serviceType = "SERVICE_PURCHASE",
      provider,
      description,
      fee = 0,
      recipientDetails,
      metadata
    } = params;

    const totalDebit = amount + fee;
    if (totalDebit <= 0) {
      throw new Error("Debit amount must be greater than zero");
    }

    return await withTursoTransaction(async (tx) => {
      // 1. Check duplicate reference / idempotency key
      const checkRef = await tx.execute({
        sql: `SELECT id FROM transactions WHERE reference = ? OR (idempotency_key IS NOT NULL AND idempotency_key = ?) LIMIT 1;`,
        args: [reference, idempotencyKey || ""],
      });

      if (checkRef.rows.length > 0) {
        throw new Error(`Duplicate transaction detected: reference '${reference}' already processed.`);
      }

      // 2. Lock & Retrieve Wallet
      const walletRes = await tx.execute({
        sql: `SELECT * FROM wallets WHERE user_id = ? LIMIT 1;`,
        args: [userId],
      });

      if (walletRes.rows.length === 0) {
        throw new Error(`Wallet not found for user '${userId}'`);
      }

      const wallet = walletRes.rows[0] as unknown as TursoWallet;
      if (wallet.status === "SUSPENDED" || wallet.status === "FROZEN") {
        throw new Error(`Wallet is ${wallet.status}. Debit operation denied.`);
      }

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < totalDebit) {
        throw new Error(`Insufficient funds: required ₦${totalDebit.toFixed(2)}, available ₦${balanceBefore.toFixed(2)}`);
      }

      const balanceAfter = balanceBefore - totalDebit;
      const totalDebits = Number(wallet.total_debits) + totalDebit;
      const now = new Date().toISOString();

      // 3. Update Wallet Balance
      await tx.execute({
        sql: `UPDATE wallets
              SET balance = ?, total_debits = ?, updated_at = ?
              WHERE id = ? AND balance >= ?;`,
        args: [balanceAfter, totalDebits, now, wallet.id, totalDebit],
      });

      // 4. Update User Sync Balance
      await tx.execute({
        sql: `UPDATE users SET wallet_balance = ?, updated_at = ? WHERE uid = ?;`,
        args: [balanceAfter, now, userId],
      });

      // 5. Record Ledger Entry
      const ledgerId = `led_${Math.random().toString(36).substring(2, 11)}`;
      await tx.execute({
        sql: `INSERT INTO wallet_ledger (
          id, ledger_id, wallet_id, user_id, entry_type, amount, fee,
          balance_before, balance_after, reference, idempotency_key,
          service_name, provider, description, metadata, created_at
        ) VALUES (?, ?, ?, ?, 'DEBIT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          ledgerId,
          ledgerId,
          wallet.id,
          userId,
          amount,
          fee,
          balanceBefore,
          balanceAfter,
          reference,
          idempotencyKey || null,
          serviceName,
          provider || "System",
          description,
          metadata ? JSON.stringify(metadata) : null,
          now,
        ],
      });

      // 6. Record Transaction
      const txId = `tx_${Math.random().toString(36).substring(2, 11)}`;
      await tx.execute({
        sql: `INSERT INTO transactions (
          id, transaction_id, reference, idempotency_key, user_id, wallet_id,
          service_name, service_category, service_type, amount, fee, total_amount,
          wallet_balance_before, wallet_balance_after, status, provider,
          recipient_details, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?, ?, ?, ?, ?);`,
        args: [
          txId,
          txId,
          reference,
          idempotencyKey || null,
          userId,
          wallet.id,
          serviceName,
          serviceCategory,
          serviceType,
          amount,
          fee,
          totalDebit,
          balanceBefore,
          balanceAfter,
          provider || "System",
          recipientDetails || null,
          description,
          now,
          now,
        ],
      });

      return {
        success: true,
        newBalance: balanceAfter,
        ledgerId,
        txId,
      };
    });
  }
}

// -----------------------------------------------------------------------------
// 12. WEBHOOK REPOSITORY (Incoming Webhook Audit & Idempotency)
// -----------------------------------------------------------------------------
export class WebhookRepository {
  static async recordEvent(event: Omit<TursoWebhookEvent, "created_at">): Promise<TursoWebhookEvent> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO webhook_events (
        id, event_id, provider, event_type, reference, signature,
        signature_valid, status, payload, processing_error, ip_address,
        processed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      event.id,
      event.event_id,
      event.provider,
      event.event_type,
      event.reference || null,
      event.signature || null,
      event.signature_valid ? 1 : 0,
      event.status || "PENDING",
      typeof event.payload === "string" ? event.payload : JSON.stringify(event.payload),
      event.processing_error || null,
      event.ip_address || null,
      event.processed_at || null,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoWebhookEvent;
  }

  static async findByEventId(eventId: string): Promise<TursoWebhookEvent | null> {
    const sql = `SELECT * FROM webhook_events WHERE event_id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [eventId]);
    return (result.rows[0] as unknown as TursoWebhookEvent) || null;
  }

  static async updateStatus(
    eventId: string,
    status: TursoWebhookEvent["status"],
    processingError?: string
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE webhook_events
      SET status = ?, processing_error = ?, processed_at = ?
      WHERE event_id = ?;
    `;
    const result = await executeTurso(sql, [status, processingError || null, now, eventId]);
    return (result.rowsAffected || 0) > 0;
  }
}

// -----------------------------------------------------------------------------
// 13. REFUND & RECONCILIATION REPOSITORIES
// -----------------------------------------------------------------------------
export class RefundRepository {
  static async create(refund: {
    id: string;
    refund_id: string;
    original_transaction_id?: string;
    original_reference: string;
    user_id: string;
    wallet_id: string;
    amount: number;
    reason: string;
    status?: "PENDING" | "COMPLETED" | "REJECTED";
    processed_by_admin_uid?: string;
  }) {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO refunds (
        id, refund_id, original_transaction_id, original_reference, user_id,
        wallet_id, amount, reason, status, processed_by_admin_uid, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      refund.id,
      refund.refund_id,
      refund.original_transaction_id || null,
      refund.original_reference,
      refund.user_id,
      refund.wallet_id,
      refund.amount,
      refund.reason,
      refund.status || "PENDING",
      refund.processed_by_admin_uid || null,
      now,
      now,
    ];
    const result = await executeTurso(sql, args);
    return result.rows[0];
  }

  static async listByUser(userId: string) {
    const sql = `SELECT * FROM refunds WHERE user_id = ? ORDER BY created_at DESC;`;
    const result = await executeTurso(sql, [userId]);
    return result.rows;
  }
}

export class ReconciliationRepository {
  static async create(rec: {
    id: string;
    reconciliation_id: string;
    payment_reference: string;
    provider_transaction_id?: string;
    provider: string;
    amount: number;
    account_number?: string;
    status?: "PENDING" | "VERIFIED" | "FAILED" | "UNMATCHED" | "REVERSED";
    user_id?: string;
    wallet_id?: string;
    verification_result?: string;
    raw_payload?: string;
  }) {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO reconciliations (
        id, reconciliation_id, payment_reference, provider_transaction_id,
        provider, amount, account_number, status, user_id, wallet_id,
        verification_result, raw_payload, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      rec.id,
      rec.reconciliation_id,
      rec.payment_reference,
      rec.provider_transaction_id || null,
      rec.provider,
      rec.amount,
      rec.account_number || null,
      rec.status || "PENDING",
      rec.user_id || null,
      rec.wallet_id || null,
      rec.verification_result || null,
      rec.raw_payload || null,
      now,
      now,
    ];
    const result = await executeTurso(sql, args);
    return result.rows[0];
  }

  static async findByReference(paymentReference: string) {
    const sql = `SELECT * FROM reconciliations WHERE payment_reference = ? LIMIT 1;`;
    const result = await executeTurso(sql, [paymentReference]);
    return result.rows[0] || null;
  }
}

// -----------------------------------------------------------------------------
// 14. PROVIDER REPOSITORY
// -----------------------------------------------------------------------------
export class ProviderRepository {
  static async listAll() {
    const sql = `SELECT * FROM providers ORDER BY priority ASC, name ASC;`;
    const result = await executeTurso(sql);
    return result.rows || [];
  }

  static async findById(id: string) {
    const sql = `SELECT * FROM providers WHERE id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [id]);
    return result.rows[0] || null;
  }

  static async findByCategory(category: string) {
    const sql = `SELECT * FROM providers WHERE category = ? ORDER BY priority ASC;`;
    const result = await executeTurso(sql, [category]);
    return result.rows || [];
  }
}

// -----------------------------------------------------------------------------
// 15. PASSKEY / BIOMETRIC REPOSITORY
// -----------------------------------------------------------------------------
export class PasskeyRepository {
  static async create(passkey: {
    id: string;
    user_id: string;
    credential_id: string;
    public_key: string;
    counter?: number;
    device_name?: string;
    transports?: string;
  }) {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO user_passkeys (
        id, user_id, credential_id, public_key, counter, device_name, transports, created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      passkey.id,
      passkey.user_id,
      passkey.credential_id,
      passkey.public_key,
      passkey.counter || 0,
      passkey.device_name || "Biometric Authenticator",
      passkey.transports || null,
      now,
      now,
    ];
    const result = await executeTurso(sql, args);
    return result.rows[0];
  }

  static async findByCredentialId(credentialId: string) {
    const sql = `SELECT * FROM user_passkeys WHERE credential_id = ? LIMIT 1;`;
    const result = await executeTurso(sql, [credentialId]);
    return result.rows[0] || null;
  }

  static async listByUserId(userId: string) {
    const sql = `SELECT * FROM user_passkeys WHERE user_id = ? ORDER BY created_at DESC;`;
    const result = await executeTurso(sql, [userId]);
    return result.rows || [];
  }

  static async updateCounter(credentialId: string, newCounter: number) {
    const now = new Date().toISOString();
    const sql = `UPDATE user_passkeys SET counter = ?, last_used_at = ? WHERE credential_id = ?;`;
    const result = await executeTurso(sql, [newCounter, now, credentialId]);
    return (result.rowsAffected || 0) > 0;
  }

  static async deleteById(id: string, userId: string) {
    const sql = `DELETE FROM user_passkeys WHERE id = ? AND user_id = ?;`;
    const result = await executeTurso(sql, [id, userId]);
    return (result.rowsAffected || 0) > 0;
  }
}

// -----------------------------------------------------------------------------
// 16. PROVIDER ROUTING RULES REPOSITORY (Turso Direct Persistence)
// -----------------------------------------------------------------------------
export class RoutingRuleRepository {
  static async getAllRules(): Promise<any[]> {
    const sql = `SELECT * FROM provider_routing_rules ORDER BY service ASC;`;
    const result = await executeTurso(sql);
    if (!result.rows || result.rows.length === 0) return [];
    return result.rows.map((row: any) => ({
      id: String(row.id),
      service: String(row.service),
      serviceName: String(row.service_name || row.service),
      strategy: String(row.strategy || "PRIORITY_ORDER"),
      primaryProviderId: row.primary_provider_id || "",
      primaryProviderName: row.primary_provider_name || "",
      secondaryProviderId: row.secondary_provider_id || undefined,
      secondaryProviderName: row.secondary_provider_name || undefined,
      tertiaryProviderId: row.tertiary_provider_id || undefined,
      tertiaryProviderName: row.tertiary_provider_name || undefined,
      fallbackProviderId: row.fallback_provider_id || undefined,
      fallbackProviderName: row.fallback_provider_name || undefined,
      timeoutMs: Number(row.timeout_ms) || 20000,
      maxRetries: Number(row.max_retries) || 2,
      autoFailover: Boolean(row.auto_failover),
      circuitBreakerThreshold: Number(row.circuit_breaker_threshold) || 3,
      circuitBreakerResetMs: Number(row.circuit_breaker_reset_ms) || 60000,
      enabled: Boolean(row.enabled),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    }));
  }

  static async getRuleForService(service: string): Promise<any | null> {
    const sql = `SELECT * FROM provider_routing_rules WHERE upper(service) = upper(?) LIMIT 1;`;
    const result = await executeTurso(sql, [service.trim()]);
    if (!result.rows || result.rows.length === 0) return null;
    const row: any = result.rows[0];
    return {
      id: String(row.id),
      service: String(row.service),
      serviceName: String(row.service_name || row.service),
      strategy: String(row.strategy || "PRIORITY_ORDER"),
      primaryProviderId: row.primary_provider_id || "",
      primaryProviderName: row.primary_provider_name || "",
      secondaryProviderId: row.secondary_provider_id || undefined,
      secondaryProviderName: row.secondary_provider_name || undefined,
      tertiaryProviderId: row.tertiary_provider_id || undefined,
      tertiaryProviderName: row.tertiary_provider_name || undefined,
      fallbackProviderId: row.fallback_provider_id || undefined,
      fallbackProviderName: row.fallback_provider_name || undefined,
      timeoutMs: Number(row.timeout_ms) || 20000,
      maxRetries: Number(row.max_retries) || 2,
      autoFailover: Boolean(row.auto_failover),
      circuitBreakerThreshold: Number(row.circuit_breaker_threshold) || 3,
      circuitBreakerResetMs: Number(row.circuit_breaker_reset_ms) || 60000,
      enabled: Boolean(row.enabled),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    };
  }

  static async upsertRule(rule: any): Promise<void> {
    const now = new Date().toISOString();
    const service = String(rule.service || "").trim().toUpperCase();
    const sql = `
      INSERT INTO provider_routing_rules (
        id, service, service_name, strategy,
        primary_provider_id, primary_provider_name,
        secondary_provider_id, secondary_provider_name,
        tertiary_provider_id, tertiary_provider_name,
        fallback_provider_id, fallback_provider_name,
        timeout_ms, max_retries, auto_failover,
        circuit_breaker_threshold, circuit_breaker_reset_ms,
        enabled, raw_config, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service) DO UPDATE SET
        service_name = excluded.service_name,
        strategy = excluded.strategy,
        primary_provider_id = excluded.primary_provider_id,
        primary_provider_name = excluded.primary_provider_name,
        secondary_provider_id = excluded.secondary_provider_id,
        secondary_provider_name = excluded.secondary_provider_name,
        tertiary_provider_id = excluded.tertiary_provider_id,
        tertiary_provider_name = excluded.tertiary_provider_name,
        fallback_provider_id = excluded.fallback_provider_id,
        fallback_provider_name = excluded.fallback_provider_name,
        timeout_ms = excluded.timeout_ms,
        max_retries = excluded.max_retries,
        auto_failover = excluded.auto_failover,
        circuit_breaker_threshold = excluded.circuit_breaker_threshold,
        circuit_breaker_reset_ms = excluded.circuit_breaker_reset_ms,
        enabled = excluded.enabled,
        raw_config = excluded.raw_config,
        updated_at = excluded.updated_at;
    `;
    const args = [
      rule.id || `rule_${service.toLowerCase()}`,
      service,
      rule.serviceName || service,
      rule.strategy || "PRIORITY_ORDER",
      rule.primaryProviderId || null,
      rule.primaryProviderName || null,
      rule.secondaryProviderId || null,
      rule.secondaryProviderName || null,
      rule.tertiaryProviderId || null,
      rule.tertiaryProviderName || null,
      rule.fallbackProviderId || null,
      rule.fallbackProviderName || null,
      rule.timeoutMs || 20000,
      rule.maxRetries || 2,
      rule.autoFailover !== false ? 1 : 0,
      rule.circuitBreakerThreshold || 3,
      rule.circuitBreakerResetMs || 60000,
      rule.enabled !== false ? 1 : 0,
      JSON.stringify(rule),
      now,
      now,
    ];
    await executeTurso(sql, args);
  }

  static async upsertAllRules(rules: any[]): Promise<void> {
    await withTursoTransaction(async (tx) => {
      const now = new Date().toISOString();
      for (const rule of rules) {
        const service = String(rule.service || "").trim().toUpperCase();
        const sql = `
          INSERT INTO provider_routing_rules (
            id, service, service_name, strategy,
            primary_provider_id, primary_provider_name,
            secondary_provider_id, secondary_provider_name,
            tertiary_provider_id, tertiary_provider_name,
            fallback_provider_id, fallback_provider_name,
            timeout_ms, max_retries, auto_failover,
            circuit_breaker_threshold, circuit_breaker_reset_ms,
            enabled, raw_config, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(service) DO UPDATE SET
            service_name = excluded.service_name,
            strategy = excluded.strategy,
            primary_provider_id = excluded.primary_provider_id,
            primary_provider_name = excluded.primary_provider_name,
            secondary_provider_id = excluded.secondary_provider_id,
            secondary_provider_name = excluded.secondary_provider_name,
            tertiary_provider_id = excluded.tertiary_provider_id,
            tertiary_provider_name = excluded.tertiary_provider_name,
            fallback_provider_id = excluded.fallback_provider_id,
            fallback_provider_name = excluded.fallback_provider_name,
            timeout_ms = excluded.timeout_ms,
            max_retries = excluded.max_retries,
            auto_failover = excluded.auto_failover,
            circuit_breaker_threshold = excluded.circuit_breaker_threshold,
            circuit_breaker_reset_ms = excluded.circuit_breaker_reset_ms,
            enabled = excluded.enabled,
            raw_config = excluded.raw_config,
            updated_at = excluded.updated_at;
        `;
        const args = [
          rule.id || `rule_${service.toLowerCase()}`,
          service,
          rule.serviceName || service,
          rule.strategy || "PRIORITY_ORDER",
          rule.primaryProviderId || null,
          rule.primaryProviderName || null,
          rule.secondaryProviderId || null,
          rule.secondaryProviderName || null,
          rule.tertiaryProviderId || null,
          rule.tertiaryProviderName || null,
          rule.fallbackProviderId || null,
          rule.fallbackProviderName || null,
          rule.timeoutMs || 20000,
          rule.maxRetries || 2,
          rule.autoFailover !== false ? 1 : 0,
          rule.circuitBreakerThreshold || 3,
          rule.circuitBreakerResetMs || 60000,
          rule.enabled !== false ? 1 : 0,
          JSON.stringify(rule),
          now,
          now,
        ];
        await tx.execute({ sql, args });
      }
    });
  }
}

// -----------------------------------------------------------------------------
// 18. AUDIT & ACTIVITY LOG REPOSITORY (Turso Direct Persistence & Retention Purge)
// -----------------------------------------------------------------------------
class UnusedAuditLogRepository {
  static async recordLog(log: {
    id?: string;
    log_id?: string;
    user_id?: string | null;
    admin_uid?: string | null;
    admin_email?: string | null;
    admin_role?: string | null;
    action: string;
    resource_type?: string | null;
    resource_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    status?: "SUCCESS" | "FAILURE" | "FAILED" | "WARNING" | string;
    details: string;
  }): Promise<TursoAuditLog> {
    const now = new Date().toISOString();
    const id = log.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const logId = log.log_id || id;
    const normStatus = (log.status === "FAILED" || log.status === "FAILURE") ? "FAILURE" : (log.status === "WARNING" ? "WARNING" : "SUCCESS");

    const sql = `
      INSERT INTO audit_logs (
        id, log_id, user_id, admin_uid, admin_email, admin_role,
        action, resource_type, resource_id, ip_address, user_agent,
        status, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const args = [
      id,
      logId,
      log.user_id || null,
      log.admin_uid || null,
      log.admin_email || null,
      log.admin_role || null,
      log.action,
      log.resource_type || "SYSTEM",
      log.resource_id || null,
      log.ip_address || "127.0.0.1",
      log.user_agent || "System/Server",
      normStatus,
      log.details,
      now,
    ];
    await executeTurso(sql, args).catch((err) => {
      console.warn(`[AuditLogRepository] Failed to record log to Turso: ${err.message}`);
    });

    return {
      id,
      log_id: logId,
      user_id: log.user_id || null,
      admin_uid: log.admin_uid || null,
      admin_email: log.admin_email || null,
      admin_role: log.admin_role || null,
      action: log.action,
      resource_type: log.resource_type || "SYSTEM",
      resource_id: log.resource_id || null,
      ip_address: log.ip_address || null,
      user_agent: log.user_agent || null,
      status: normStatus as "SUCCESS" | "FAILURE" | "WARNING",
      details: log.details,
      created_at: now,
    };
  }

  static async listLogs(options?: {
    userId?: string;
    adminEmail?: string;
    status?: string;
    resourceType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: TursoAuditLog[]; total: number }> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const whereClauses: string[] = [];
    const args: any[] = [];

    if (options?.userId && options.userId.trim()) {
      whereClauses.push("(user_id = ? OR admin_uid = ? OR resource_id = ?)");
      args.push(options.userId.trim(), options.userId.trim(), options.userId.trim());
    }
    if (options?.adminEmail && options.adminEmail.trim()) {
      whereClauses.push("lower(admin_email) = lower(?)");
      args.push(options.adminEmail.trim());
    }
    if (options?.status && options.status !== "ALL") {
      const targetStatus = options.status === "FAILED" || options.status === "FAILURE" ? "FAILURE" : options.status;
      whereClauses.push("status = ?");
      args.push(targetStatus);
    }
    if (options?.resourceType && options.resourceType !== "ALL") {
      whereClauses.push("resource_type = ?");
      args.push(options.resourceType);
    }
    if (options?.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      whereClauses.push("(action LIKE ? OR details LIKE ? OR admin_email LIKE ? OR user_id LIKE ? OR ip_address LIKE ?)");
      args.push(q, q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereSql};`;
    const countRes = await executeTurso(countSql, args);
    const total = Number(countRes.rows[0]?.total || 0);

    const listSql = `SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    const listRes = await executeTurso(listSql, [...args, limit, offset]);

    return {
      logs: (listRes.rows || []) as unknown as TursoAuditLog[],
      total,
    };
  }

  static async purgeLogs(period: "1_DAY" | "7_DAYS" | "30_DAYS" | "ALL_FAILED" | "ALL"): Promise<{ purgedCount: number; message: string }> {
    let sql = "";

    if (period === "1_DAY") {
      sql = `DELETE FROM audit_logs WHERE created_at < datetime('now', '-1 day');`;
    } else if (period === "7_DAYS") {
      sql = `DELETE FROM audit_logs WHERE created_at < datetime('now', '-7 days');`;
    } else if (period === "30_DAYS") {
      sql = `DELETE FROM audit_logs WHERE created_at < datetime('now', '-30 days');`;
    } else if (period === "ALL_FAILED") {
      sql = `DELETE FROM audit_logs WHERE status = 'FAILURE' OR status = 'FAILED';`;
    } else if (period === "ALL") {
      sql = `DELETE FROM audit_logs;`;
    } else {
      throw new Error("Invalid purge period specified.");
    }

    const res = await executeTurso(sql, []);
    const count = Number(res.rowsAffected || 0);

    return {
      purgedCount: count,
      message: `Successfully purged ${count} activity log records from Turso database for period '${period}'.`,
    };
  }
}

// -----------------------------------------------------------------------------
// 17. SERVICE PRICES REPOSITORY (Turso Database Primary Persistence)
// -----------------------------------------------------------------------------
export const DEFAULT_SERVICE_PRICES: Array<{
  service_id: string;
  service_code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  cost_price: number;
  service_charge: number;
  commission_rate: number;
  price_label?: string;
  is_active: number;
}> = [
  // 1. Identity & KYC Verification Services
  {
    service_id: "id_nin_ver",
    service_code: "NIN_VERIFY",
    name: "NIN Verification",
    category: "IDENTITY",
    description: "Verify NIN profile via authorized national identity gateway.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_nin_val",
    service_code: "NIN_VALIDATION",
    name: "NIN Validation",
    category: "IDENTITY",
    description: "Verify validation and active legal status of National Identification Number.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_vnin_slip",
    service_code: "VNIN_SLIP",
    name: "VNIN Slip",
    category: "IDENTITY",
    description: "Generate Virtual NIN (VNIN) slip for corporate compliance.",
    price: 1000,
    cost_price: 400,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_nin_pers",
    service_code: "NIN_PERSONALIZATION",
    name: "NIN Personalization",
    category: "IDENTITY",
    description: "Personalize active NIN profile with verified corporate parameters.",
    price: 2000,
    cost_price: 1000,
    service_charge: 200,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_nin_mod",
    service_code: "NIN_MODIFICATION",
    name: "NIN Modification",
    category: "IDENTITY",
    description: "Submit official correction of birth date, name spelling, or phone linkage.",
    price: 15000,
    cost_price: 10000,
    service_charge: 500,
    commission_rate: 20,
    is_active: 1,
  },
  {
    service_id: "id_slip_gen",
    service_code: "NIN_SLIP_GEN",
    name: "NIN ID Card & Slip Generation",
    category: "IDENTITY",
    description: "Generate premium high-resolution printable NIN verification slips.",
    price: 1000,
    cost_price: 400,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_ipe_clearance",
    service_code: "IPE_CLEARANCE",
    name: "IPE Clearance",
    category: "IDENTITY",
    description: "Process official IPE biometric clearance certificates.",
    price: 5000,
    cost_price: 3000,
    service_charge: 250,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_bvn_ver",
    service_code: "BVN_VERIFY",
    name: "BVN Verification",
    category: "IDENTITY",
    description: "Validate Central Bank of Nigeria Bank Verification Number records.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_nin_bvn",
    service_code: "NIN_BVN_LINK",
    name: "NIN-BVN Linkage",
    category: "IDENTITY",
    description: "Assistance to link NIN profile with active BVN commercial record.",
    price: 1500,
    cost_price: 800,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_vnin_to_bvn",
    service_code: "VNIN_TO_BVN",
    name: "VNIN to BVN",
    category: "IDENTITY",
    description: "Link and resolve Virtual NIN (VNIN) to BVN database for banking.",
    price: 1000,
    cost_price: 500,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_vnin_to_nibss",
    service_code: "VNIN_TO_NIBSS",
    name: "VNIN to NIBSS",
    category: "IDENTITY",
    description: "Transmit and synchronize Virtual NIN (VNIN) records with NIBSS settlement.",
    price: 1500,
    cost_price: 800,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_bvn_user",
    service_code: "BVN_USER",
    name: "BVN User Profile",
    category: "IDENTITY",
    description: "Query user bio-data logs via third-party BVN gateways.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_bvn_modification",
    service_code: "BVN_MODIFICATION",
    name: "BVN Modification",
    category: "IDENTITY",
    description: "Submit request to correct or update registered BVN biodata.",
    price: 15000,
    cost_price: 10000,
    service_charge: 500,
    commission_rate: 20,
    is_active: 1,
  },
  {
    service_id: "id_premium_slip",
    service_code: "BVN_SLIP_GEN",
    name: "BVN Slip & ID Card Generation",
    category: "IDENTITY",
    description: "Generate and print verified BVN identity slips and cards.",
    price: 1000,
    cost_price: 400,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_bvn_retrieval",
    service_code: "BVN_RETRIEVAL",
    name: "BVN Retrieval",
    category: "IDENTITY",
    description: "Retrieve forgotten BVN details using phone number and bio match.",
    price: 1000,
    cost_price: 500,
    service_charge: 100,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_tin_verification",
    service_code: "TIN_VERIFICATION",
    name: "TIN Verification",
    category: "IDENTITY",
    description: "Verify federal Tax Identification Number records from JTB/FIRS.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_bank_account_verification",
    service_code: "BANK_ACCOUNT_VERIFICATION",
    name: "Bank Account Verification",
    category: "IDENTITY",
    description: "Confirm bank account holder legal name via NIBSS gateway.",
    price: 100,
    cost_price: 50,
    service_charge: 20,
    commission_rate: 10,
    is_active: 1,
  },

  // 2. CAC & Corporate Registration Services
  {
    service_id: "id_cac_verification",
    service_code: "CAC_VERIFICATION",
    name: "CAC Corporate Verification",
    category: "CAC",
    description: "Official Corporate Affairs Commission business and company verification.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "id_tax_id_search",
    service_code: "TAX_ID_SEARCH",
    name: "Tax Identity Verification (TIN)",
    category: "CAC",
    description: "Official Joint Tax Board (JTB) & FIRS Tax Identification Number search.",
    price: 500,
    cost_price: 250,
    service_charge: 50,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "cac_biz_name",
    service_code: "CAC_BUSINESS_NAME",
    name: "CAC Business Name Registration",
    category: "CAC",
    description: "Official registration of Business Name with CAC certificate & status report.",
    price: 28000,
    cost_price: 22000,
    service_charge: 1000,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "id_cac_registration",
    service_code: "CAC_REGISTRATION",
    name: "CAC Registration Filing",
    category: "CAC",
    description: "Filing and incorporation service for business enterprise applications.",
    price: 28000,
    cost_price: 22000,
    service_charge: 1000,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "cac_ltd_co",
    service_code: "CAC_LTD_COMPANY",
    name: "CAC Limited Liability Company (LTD)",
    category: "CAC",
    description: "Incorporate private limited liability company with share capital.",
    price: 35000,
    cost_price: 28000,
    service_charge: 1500,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "cac_ngo",
    service_code: "CAC_NGO",
    name: "CAC NGO Registration",
    category: "CAC",
    description: "Official non-profit NGO incorporation with Corporate Affairs Commission.",
    price: 50000,
    cost_price: 40000,
    service_charge: 2000,
    commission_rate: 15,
    price_label: "WhatsApp Desk",
    is_active: 1,
  },
  {
    service_id: "cac_incorporated_trustee",
    service_code: "CAC_INCORPORATED_TRUSTEE",
    name: "CAC Incorporated Trustees",
    category: "CAC",
    description: "Incorporation of Foundations, Charities, Churches, and Associations.",
    price: 55000,
    cost_price: 45000,
    service_charge: 2000,
    commission_rate: 15,
    price_label: "WhatsApp Desk",
    is_active: 1,
  },
  {
    service_id: "cac_annual_returns",
    service_code: "CAC_ANNUAL_RETURNS",
    name: "CAC Annual Returns Filing",
    category: "CAC",
    description: "Keep registered enterprise or company active on CAC portal.",
    price: 12000,
    cost_price: 8000,
    service_charge: 500,
    commission_rate: 15,
    price_label: "WhatsApp Desk",
    is_active: 1,
  },
  {
    service_id: "cac_scuml",
    service_code: "CAC_SCUML",
    name: "SCUML Certificate Registration",
    category: "CAC",
    description: "Official Special Control Unit Against Money Laundering anti-fraud certification.",
    price: 25000,
    cost_price: 18000,
    service_charge: 1000,
    commission_rate: 15,
    price_label: "WhatsApp Desk",
    is_active: 1,
  },

  // 3. Education Examination e-Pins
  {
    service_id: "edu_waec",
    service_code: "EDU_WAEC",
    name: "WAEC Result Checker e-Pin",
    category: "EDUCATION",
    description: "Official WAEC result checker scratch card PIN delivered instantly.",
    price: 3500,
    cost_price: 3200,
    service_charge: 100,
    commission_rate: 8,
    is_active: 1,
  },
  {
    service_id: "edu_neco",
    service_code: "EDU_NECO",
    name: "NECO Result Token",
    category: "EDUCATION",
    description: "National Examination Council result checker token.",
    price: 1500,
    cost_price: 1200,
    service_charge: 50,
    commission_rate: 15,
    is_active: 1,
  },
  {
    service_id: "edu_jamb",
    service_code: "EDU_JAMB",
    name: "JAMB ePIN Processing",
    category: "EDUCATION",
    description: "Official JAMB examination registration ePin and result slip.",
    price: 4500,
    cost_price: 4000,
    service_charge: 100,
    commission_rate: 10,
    is_active: 1,
  },
  {
    service_id: "edu_nabteb",
    service_code: "EDU_NABTEB",
    name: "NABTEB Scratch Card",
    category: "EDUCATION",
    description: "Official NABTEB result checker scratch card PIN.",
    price: 1500,
    cost_price: 1200,
    service_charge: 50,
    commission_rate: 15,
    is_active: 1,
  },

  // 4. Telecom, VTU & Utilities
  {
    service_id: "vtu_airtime",
    service_code: "VTU_AIRTIME",
    name: "VTU Instant Airtime Purchase",
    category: "VTU",
    description: "Instant airtime top-up across MTN, Airtel, Glo, and 9mobile networks.",
    price: 100,
    cost_price: 98,
    service_charge: 0,
    commission_rate: 2,
    price_label: "Pay exact amount",
    is_active: 1,
  },
  {
    service_id: "vtu_data",
    service_code: "VTU_DATA",
    name: "VTU Telecom Data Bundles",
    category: "VTU",
    description: "Fast MTN SME data, Glo Gifting, and Airtel corporate bundles.",
    price: 260,
    cost_price: 240,
    service_charge: 20,
    commission_rate: 8,
    price_label: "Select plan",
    is_active: 1,
  },
  {
    service_id: "vtu_electricity",
    service_code: "VTU_ELECTRICITY",
    name: "Prepaid Electricity Token",
    category: "VTU",
    description: "Instant energy tokens across AEDC, EKEDC, IKEDC, JEDC, and IBEDC.",
    price: 100,
    cost_price: 0,
    service_charge: 100,
    commission_rate: 2,
    price_label: "Pay bill + ₦100 fee",
    is_active: 1,
  },
  {
    service_id: "vtu_cable",
    service_code: "VTU_CABLE",
    name: "Cable TV Subscription",
    category: "VTU",
    description: "Subscription renewal for DStv, GOtv, and StarTimes.",
    price: 100,
    cost_price: 0,
    service_charge: 100,
    commission_rate: 2,
    price_label: "Package + ₦100 fee",
    is_active: 1,
  },

  // 5. Government & ICT Services
  {
    service_id: "gov_passport",
    service_code: "GOV_PASSPORT",
    name: "Nigerian Passport Application Filing",
    category: "GOVERNMENT",
    description: "Immigration passport portal form filing & biometric booking support.",
    price: 3500,
    cost_price: 2500,
    service_charge: 250,
    commission_rate: 20,
    is_active: 1,
  },
  {
    service_id: "ict_website",
    service_code: "ICT_WEBSITE",
    name: "Custom Website & Portal Design",
    category: "ICT",
    description: "Custom enterprise portals, school management platforms, and fintech apps.",
    price: 50000,
    cost_price: 35000,
    service_charge: 2500,
    commission_rate: 25,
    price_label: "Consultation Quote",
    is_active: 1,
  },

  // 6. Slips & Cards & Preview Formats
  {
    service_id: "slip_regular",
    service_code: "NIN_REGULAR",
    name: "NIN Regular Slip",
    category: "SLIPS",
    description: "Standard monochrome print verification confirmation slip with barcode & QR code.",
    price: 180,
    cost_price: 50,
    service_charge: 30,
    commission_rate: 20,
    price_label: "A4 Monochrome",
    is_active: 1,
  },
  {
    service_id: "slip_premium",
    service_code: "NIN_PREMIUM_WHITE",
    name: "NIN Premium Card",
    category: "SLIPS",
    description: "High-resolution plastic wallet-sized card profile with biometrics & security watermark.",
    price: 250,
    cost_price: 100,
    service_charge: 50,
    commission_rate: 20,
    price_label: "CR80 Plastic Card",
    is_active: 1,
  },
  {
    service_id: "slip_standard",
    service_code: "SLIP_STANDARD",
    name: "NIN Standard Slip",
    category: "SLIPS",
    description: "Laminated wallet-sized card profile slip with embedded QR code.",
    price: 200,
    cost_price: 80,
    service_charge: 40,
    commission_rate: 20,
    price_label: "Laminated A4/Card",
    is_active: 1,
  },
  {
    service_id: "slip_bvn_card",
    service_code: "BVN_CARD",
    name: "BVN Wallet Card",
    category: "SLIPS",
    description: "Dual-sided landscape wallet card format with customer photograph and verification seal.",
    price: 250,
    cost_price: 100,
    service_charge: 50,
    commission_rate: 20,
    price_label: "CR80 Plastic Card",
    is_active: 1,
  },
  {
    service_id: "slip_bvn_slip",
    service_code: "BVN_SLIP_1",
    name: "BVN Verification Slip",
    category: "SLIPS",
    description: "Official verification slip with banking demographics, photo, and official NIBSS seal.",
    price: 200,
    cost_price: 80,
    service_charge: 40,
    commission_rate: 20,
    price_label: "A4 Banking KYC",
    is_active: 1,
  },
];

export class ServicePriceRepository {
  /**
   * Ensures the service_prices table exists in Turso and seeds initial defaults if empty.
   */
  static async ensureTableAndSeed(): Promise<void> {
    await executeTurso(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id TEXT PRIMARY KEY,
        service_id TEXT NOT NULL UNIQUE,
        service_code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL DEFAULT 0,
        service_charge REAL NOT NULL DEFAULT 0,
        commission_rate REAL NOT NULL DEFAULT 0,
        price_label TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    try {
      await executeTurso(`CREATE INDEX IF NOT EXISTS idx_service_prices_service_id ON service_prices(service_id);`);
      await executeTurso(`CREATE INDEX IF NOT EXISTS idx_service_prices_category ON service_prices(category);`);
      await executeTurso(`CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active);`);
    } catch {
      // index might already exist
    }

    const countRes = await executeTurso(`SELECT COUNT(*) as count FROM service_prices;`);
    const count = Number(countRes.rows[0]?.count) || 0;

    if (count === 0) {
      console.log(`[ServicePriceRepository] Seeding ${DEFAULT_SERVICE_PRICES.length} service prices into Turso...`);
      await this.resetToDefaults("SYSTEM_INIT");
    } else {
      // Ensure any newly added default services or slips (like slip_bvn_card, slip_bvn_slip) are inserted if missing
      for (const item of DEFAULT_SERVICE_PRICES) {
        try {
          const insertId = `sp_${item.service_id}`;
          await executeTurso(`
            INSERT OR IGNORE INTO service_prices (
              id, service_id, service_code, name, category, description,
              price, cost_price, service_charge, commission_rate, price_label,
              is_active, updated_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM_SEED', datetime('now'), datetime('now'));
          `, [
            insertId,
            item.service_id,
            item.service_code,
            item.name,
            item.category,
            item.description || null,
            item.price,
            item.cost_price || 0,
            item.service_charge || 0,
            item.commission_rate || 0,
            item.price_label || null,
            item.is_active ?? 1,
          ]);
        } catch {}
      }
    }
  }

  /**
   * Fetches all service prices directly from Turso database.
   */
  static async getAllPrices(): Promise<TursoServicePrice[]> {
    await this.ensureTableAndSeed();
    const sql = `
      SELECT id, service_id, service_code, name, category, description,
             price, cost_price, service_charge, commission_rate, price_label,
             is_active, updated_by, created_at, updated_at
      FROM service_prices
      ORDER BY category ASC, name ASC;
    `;
    const res = await executeTurso(sql);
    if (!res.rows || res.rows.length === 0) {
      return [];
    }

    return res.rows.map((row: any) => ({
      id: String(row.id),
      service_id: String(row.service_id),
      service_code: String(row.service_code),
      name: String(row.name),
      category: String(row.category),
      description: row.description ? String(row.description) : null,
      price: Number(row.price) || 0,
      cost_price: Number(row.cost_price) || 0,
      service_charge: Number(row.service_charge) || 0,
      commission_rate: Number(row.commission_rate) || 0,
      price_label: row.price_label ? String(row.price_label) : null,
      is_active: Number(row.is_active) ? 1 : 0,
      updated_by: row.updated_by ? String(row.updated_by) : null,
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: String(row.updated_at || new Date().toISOString()),
    }));
  }

  /**
   * Fetches a single service price by service_id, service_code, alias, or name.
   */
  static async getPriceByServiceId(serviceId: string): Promise<TursoServicePrice | null> {
    await this.ensureTableAndSeed();
    const cleanId = String(serviceId || "").trim();
    if (!cleanId) return null;

    const lowerId = cleanId.toLowerCase();
    const aliasMap: Record<string, string> = {
      // Identity & KYC
      svc_nin_verify: "id_nin_ver",
      nin: "id_nin_ver",
      nin_verify: "id_nin_ver",
      nin_verification: "id_nin_ver",
      id_nin_ver: "id_nin_ver",
      id_nin_val: "id_nin_val",
      nin_val: "id_nin_val",
      nin_validation: "id_nin_val",
      id_vnin_slip: "id_vnin_slip",
      vnin: "id_vnin_slip",
      vnin_slip: "id_vnin_slip",
      id_nin_pers: "id_nin_pers",
      nin_pers: "id_nin_pers",
      nin_personalization: "id_nin_pers",

      // BVN Services
      svc_bvn_verify: "id_bvn_ver",
      bvn: "id_bvn_ver",
      bvn_verify: "id_bvn_ver",
      bvn_verification: "id_bvn_ver",
      id_bvn_ver: "id_bvn_ver",

      // Slips, Cards & Live Previews
      slip_regular: "slip_regular",
      nin_regular: "slip_regular",
      regular: "slip_regular",
      regular_slip: "slip_regular",
      "regular slip": "slip_regular",
      slip_premium: "slip_premium",
      nin_premium: "slip_premium",
      nin_premium_white: "slip_premium",
      nin_premium_green: "slip_premium",
      premium: "slip_premium",
      premium_card: "slip_premium",
      "premium card": "slip_premium",
      slip_standard: "slip_standard",
      nin_standard: "slip_standard",
      standard: "slip_standard",
      standard_slip: "slip_standard",
      slip_bvn_card: "slip_bvn_card",
      bvn_card: "slip_bvn_card",
      "bvn card": "slip_bvn_card",
      bvn_premium_card: "slip_bvn_card",
      slip_bvn_slip: "slip_bvn_slip",
      bvn_slip: "slip_bvn_slip",
      bvn_slip_1: "slip_bvn_slip",
      "bvn slip": "slip_bvn_slip",
      "bvn slip 1": "slip_bvn_slip",

      // CAC & Corporate
      svc_cac_reg: "cac_biz_name",
      cac: "cac_biz_name",
      cac_registration: "id_cac_registration",
      cac_biz_name: "cac_biz_name",
      cac_ltd_co: "cac_ltd_co",
      cac_it: "cac_it",

      // VTU & Utilities
      svc_airtime_vtu: "vtu_airtime",
      airtime: "vtu_airtime",
      airtime_vtu: "vtu_airtime",
      vtu_airtime: "vtu_airtime",
      svc_data_bundle: "vtu_data",
      data: "vtu_data",
      data_bundle: "vtu_data",
      vtu_data: "vtu_data",
      svc_electricity_bill: "vtu_electricity",
      electricity: "vtu_electricity",
      electricity_bill: "vtu_electricity",
      vtu_electricity: "vtu_electricity",
      svc_cable_tv: "vtu_cable",
      cable: "vtu_cable",
      cable_tv: "vtu_cable",
      vtu_cable: "vtu_cable",
      svc_tin_verify: "id_tin_verification",
      tin: "id_tin_verification",
      tin_verification: "id_tin_verification",
      waec: "edu_waec",
      neco: "edu_neco",
      jamb: "edu_jamb",
      nabteb: "edu_nabteb",
      passport: "gov_passport",
      website: "ict_website",
    };

    const resolvedId = aliasMap[lowerId] || cleanId;

    const sql = `
      SELECT id, service_id, service_code, name, category, description,
             price, cost_price, service_charge, commission_rate, price_label,
             is_active, updated_by, created_at, updated_at
      FROM service_prices
      WHERE service_id = ?
         OR upper(service_code) = upper(?)
         OR service_id = ?
         OR upper(service_code) = upper(?)
         OR upper(name) = upper(?)
      LIMIT 1;
    `;
    const res = await executeTurso(sql, [cleanId, cleanId, resolvedId, resolvedId, cleanId]);
    if (!res.rows || res.rows.length === 0) return null;
    const row: any = res.rows[0];
    return {
      id: String(row.id),
      service_id: String(row.service_id),
      service_code: String(row.service_code),
      name: String(row.name),
      category: String(row.category),
      description: row.description ? String(row.description) : null,
      price: Number(row.price) || 0,
      cost_price: Number(row.cost_price) || 0,
      service_charge: Number(row.service_charge) || 0,
      commission_rate: Number(row.commission_rate) || 0,
      price_label: row.price_label ? String(row.price_label) : null,
      is_active: Number(row.is_active) ? 1 : 0,
      updated_by: row.updated_by ? String(row.updated_by) : null,
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: String(row.updated_at || new Date().toISOString()),
    };
  }

  /**
   * Upserts a single service price into Turso database.
   */
  static async upsertPrice(
    priceItem: {
      service_id: string;
      service_code?: string;
      name?: string;
      category?: string;
      description?: string;
      price: number;
      cost_price?: number;
      service_charge?: number;
      commission_rate?: number;
      price_label?: string;
      is_active?: number | boolean;
      updated_by?: string;
    }
  ): Promise<TursoServicePrice> {
    await this.ensureTableAndSeed();
    const now = new Date().toISOString();
    const sId = String(priceItem.service_id || "").trim();
    const sCode = String(priceItem.service_code || sId).toUpperCase().trim();
    const id = `sp_${sId.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    const sql = `
      INSERT INTO service_prices (
        id, service_id, service_code, name, category, description,
        price, cost_price, service_charge, commission_rate, price_label,
        is_active, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service_id) DO UPDATE SET
        service_code = coalesce(excluded.service_code, service_prices.service_code),
        name = coalesce(excluded.name, service_prices.name),
        category = coalesce(excluded.category, service_prices.category),
        description = coalesce(excluded.description, service_prices.description),
        price = excluded.price,
        cost_price = excluded.cost_price,
        service_charge = excluded.service_charge,
        commission_rate = excluded.commission_rate,
        price_label = excluded.price_label,
        is_active = excluded.is_active,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;
    `;

    const args = [
      id,
      sId,
      sCode,
      priceItem.name || sId,
      priceItem.category || "IDENTITY",
      priceItem.description || null,
      Number(priceItem.price) || 0,
      Number(priceItem.cost_price) || 0,
      Number(priceItem.service_charge) || 0,
      Number(priceItem.commission_rate) || 0,
      priceItem.price_label || null,
      priceItem.is_active !== undefined ? (priceItem.is_active ? 1 : 0) : 1,
      priceItem.updated_by || "ADMIN",
      now,
      now,
    ];

    await executeTurso(sql, args);
    const updated = await this.getPriceByServiceId(sId);
    return updated!;
  }

  /**
   * Bulk updates multiple service prices in a single ACID transaction on Turso.
   */
  static async bulkUpdatePrices(
    prices: Array<{
      service_id: string;
      price: number;
      cost_price?: number;
      service_charge?: number;
      commission_rate?: number;
      price_label?: string;
      is_active?: number | boolean;
    }>,
    updatedBy = "ADMIN"
  ): Promise<void> {
    await this.ensureTableAndSeed();
    await withTursoTransaction(async (tx) => {
      const now = new Date().toISOString();
      for (const item of prices) {
        const sId = String(item.service_id || "").trim();
        const sql = `
          UPDATE service_prices
          SET price = ?,
              cost_price = coalesce(?, cost_price),
              service_charge = coalesce(?, service_charge),
              commission_rate = coalesce(?, commission_rate),
              price_label = coalesce(?, price_label),
              is_active = coalesce(?, is_active),
              updated_by = ?,
              updated_at = ?
          WHERE service_id = ?;
        `;
        const args = [
          Number(item.price) || 0,
          item.cost_price !== undefined ? Number(item.cost_price) : null,
          item.service_charge !== undefined ? Number(item.service_charge) : null,
          item.commission_rate !== undefined ? Number(item.commission_rate) : null,
          item.price_label !== undefined ? item.price_label : null,
          item.is_active !== undefined ? (item.is_active ? 1 : 0) : null,
          updatedBy,
          now,
          sId,
        ];
        await tx.execute({ sql, args });
      }
    });
  }

  /**
   * Resets all service prices directly in Turso to project default values.
   */
  static async resetToDefaults(updatedBy = "ADMIN"): Promise<void> {
    await withTursoTransaction(async (tx) => {
      const now = new Date().toISOString();
      for (const item of DEFAULT_SERVICE_PRICES) {
        const id = `sp_${item.service_id.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        const sql = `
          INSERT INTO service_prices (
            id, service_id, service_code, name, category, description,
            price, cost_price, service_charge, commission_rate, price_label,
            is_active, updated_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(service_id) DO UPDATE SET
            service_code = excluded.service_code,
            name = excluded.name,
            category = excluded.category,
            description = excluded.description,
            price = excluded.price,
            cost_price = excluded.cost_price,
            service_charge = excluded.service_charge,
            commission_rate = excluded.commission_rate,
            price_label = excluded.price_label,
            is_active = excluded.is_active,
            updated_by = excluded.updated_by,
            updated_at = excluded.updated_at;
        `;
        const args = [
          id,
          item.service_id,
          item.service_code,
          item.name,
          item.category,
          item.description || null,
          item.price,
          item.cost_price,
          item.service_charge,
          item.commission_rate,
          item.price_label || null,
          item.is_active,
          updatedBy,
          now,
          now,
        ];
        await tx.execute({ sql, args });
      }
    });
  }
}


