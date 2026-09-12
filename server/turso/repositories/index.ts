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
  TursoWebhookEvent 
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
      RETURNING *;
    `;
    const args = [
      acc.id,
      acc.user_id,
      acc.account_number,
      acc.bank_name,
      acc.bank_code,
      acc.account_name,
      acc.provider,
      acc.reference,
      acc.is_active ? 1 : 0,
      now,
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoVirtualAccount;
  }

  static async findByUserId(userId: string): Promise<TursoVirtualAccount | null> {
    const sql = `SELECT * FROM user_virtual_accounts WHERE user_id = ? AND is_active = 1 LIMIT 1;`;
    const result = await executeTurso(sql, [userId]);
    return (result.rows[0] as unknown as TursoVirtualAccount) || null;
  }

  static async findByAccountNumber(accountNumber: string): Promise<TursoVirtualAccount | null> {
    const sql = `SELECT * FROM user_virtual_accounts WHERE account_number = ? LIMIT 1;`;
    const result = await executeTurso(sql, [accountNumber]);
    return (result.rows[0] as unknown as TursoVirtualAccount) || null;
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
  static async log(log: Omit<TursoAuditLog, "created_at">): Promise<TursoAuditLog> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO audit_logs (
        id, log_id, user_id, admin_uid, admin_email, admin_role,
        action, resource_type, resource_id, ip_address, user_agent,
        status, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;
    const args = [
      log.id,
      log.log_id,
      log.user_id || null,
      log.admin_uid || null,
      log.admin_email || null,
      log.admin_role || null,
      log.action,
      log.resource_type,
      log.resource_id || null,
      log.ip_address || null,
      log.user_agent || null,
      log.status || "SUCCESS",
      typeof log.details === "string" ? log.details : JSON.stringify(log.details || {}),
      now,
    ];

    const result = await executeTurso(sql, args);
    return result.rows[0] as unknown as TursoAuditLog;
  }

  static async list(limit = 100, offset = 0): Promise<TursoAuditLog[]> {
    const sql = `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    const result = await executeTurso(sql, [limit, offset]);
    return result.rows as unknown as TursoAuditLog[];
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
