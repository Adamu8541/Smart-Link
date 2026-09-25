/**
 * SMART LINK NG — Turso Schema & Types Module (Phase 5)
 * Defines TypeScript interfaces, table constants, and programmatic initialization.
 */

import { executeTurso, batchTurso, getTursoClient } from "./client";
import fs from "fs";
import path from "path";

export const TURSO_TABLES = {
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  ROLE_PERMISSIONS: "role_permissions",
  ADMIN_USERS: "admin_users",
  WALLETS: "wallets",
  WALLET_LEDGER: "wallet_ledger",
  TRANSACTIONS: "transactions",
  PAYMENTS: "payments",
  USER_VIRTUAL_ACCOUNTS: "user_virtual_accounts",
  PROVIDERS: "providers",
  VERIFICATION_RECORDS: "verification_records",
  CAC_APPLICATIONS: "cac_applications",
  SLIP_LOGS: "slip_logs",
  REFUNDS: "refunds",
  RECONCILIATIONS: "reconciliations",
  UNMATCHED_PAYMENTS: "unmatched_payments",
  AUDIT_LOGS: "audit_logs",
  APPLICATION_SETTINGS: "application_settings",
  WEBHOOK_EVENTS: "webhook_events",
  MIGRATIONS: "_migrations",
} as const;

// Types mirroring relational records
export interface TursoUser {
  id: string;
  uid: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: string;
  wallet_balance: number;
  referral_code?: string | null;
  referred_by?: string | null;
  password_hash?: string | null;
  salt?: string | null;
  is_verified: number;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "PENDING_VERIFICATION";
  custom_claims?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoAdminUser {
  id: string;
  uid: string;
  email: string;
  full_name: string;
  role: string;
  permissions: string; // JSON Array string
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  password_hash?: string | null;
  salt?: string | null;
  last_login?: string | null;
  last_login_ip?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoWallet {
  id: string;
  wallet_id: string;
  user_id: string;
  currency: string;
  balance: number;
  held_balance: number;
  total_credits: number;
  total_debits: number;
  status: "ACTIVE" | "SUSPENDED" | "FROZEN";
  created_at: string;
  updated_at: string;
}

export interface TursoWalletLedger {
  id: string;
  ledger_id: string;
  wallet_id: string;
  user_id: string;
  entry_type: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE" | "REVERSAL" | "ADJUSTMENT";
  amount: number;
  fee: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  idempotency_key?: string | null;
  service_name: string;
  provider: string;
  description: string;
  metadata?: string | null;
  created_at: string;
}

export interface TursoTransaction {
  id: string;
  transaction_id: string;
  reference: string;
  idempotency_key?: string | null;
  user_id: string;
  wallet_id?: string | null;
  service_name: string;
  service_category: string;
  service_type: string;
  amount: number;
  fee: number;
  total_amount: number;
  wallet_balance_before: number;
  wallet_balance_after: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED" | "PROCESSING";
  provider: string;
  provider_reference?: string | null;
  recipient_details?: string | null;
  description?: string | null;
  token?: string | null;
  units?: string | null;
  pins?: string | null;
  raw_payload?: string | null;
  raw_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoPayment {
  id: string;
  payment_reference: string;
  provider_reference?: string | null;
  provider: string;
  user_id: string;
  wallet_id?: string | null;
  amount: number;
  fee: number;
  currency: string;
  account_number?: string | null;
  bank_name?: string | null;
  channel: "VIRTUAL_ACCOUNT" | "CARD" | "TRANSFER" | "PORTAL" | "MANUAL_ADMIN";
  status: "PENDING" | "VERIFIED" | "FAILED" | "UNMATCHED" | "REVERSED";
  raw_webhook_payload?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoVirtualAccount {
  id: string;
  user_id: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  provider: string;
  reference: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface TursoVerificationRecord {
  id: string;
  verification_id: string;
  user_id: string;
  verification_type: "NIN" | "BVN" | "CAC" | "TIN" | "BANK_ACCOUNT" | "PHONE_NIN" | "IPE" | "CUSTOM";
  target_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  fee: number;
  reference: string;
  provider: string;
  result_data?: string | null;
  raw_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoAuditLog {
  id: string;
  log_id: string;
  user_id?: string | null;
  admin_uid?: string | null;
  admin_email?: string | null;
  admin_role?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: "SUCCESS" | "FAILURE" | "WARNING";
  details: string;
  created_at: string;
}

export interface TursoApplicationSetting {
  id: string;
  key: string;
  category: string;
  value: string;
  is_public: number;
  description?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TursoWebhookEvent {
  id: string;
  event_id: string;
  provider: string;
  event_type: string;
  reference?: string | null;
  signature?: string | null;
  signature_valid: number;
  status: "PENDING" | "PROCESSED" | "FAILED" | "IGNORED" | "DUPLICATE";
  payload: string;
  processing_error?: string | null;
  ip_address?: string | null;
  processed_at?: string | null;
  created_at: string;
}

import { TursoMigrator } from "./migrator";

/**
 * Initializes all database tables, constraints, and indexes on the Turso/libSQL database
 * via the version-controlled migration runner.
 */
export async function initializeTursoSchema(): Promise<{ success: boolean; tablesCreated: number; migrationsApplied?: number; error?: string }> {
  try {
    const migrationRes = await TursoMigrator.runPendingMigrations();
    if (migrationRes.errors) {
      throw new Error(migrationRes.errors);
    }

    const client = getTursoClient();
    // Verify created tables
    const checkRes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    const tables = checkRes.rows.map((r: any) => String(r.name));

    return {
      success: true,
      tablesCreated: tables.length,
      migrationsApplied: migrationRes.appliedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      tablesCreated: 0,
      error: err.message || "Failed to initialize Turso schema",
    };
  }
}
