-- ============================================================================
-- SMART LINK NG — Turso / libSQL Relational Database Schema (Phase 5)
-- Production Normalized Relational Definition with Strict Constraints & Indexes
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    wallet_balance REAL NOT NULL DEFAULT 0.0 CHECK (wallet_balance >= 0),
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    password_hash TEXT,
    salt TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING_VERIFICATION')),
    custom_claims TEXT,
    last_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    color_badge TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. ADMIN_USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    permissions TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    password_hash TEXT,
    salt TEXT,
    last_login TEXT,
    last_login_ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_users_uid ON admin_users(uid);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 6. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(uid) ON DELETE RESTRICT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    balance REAL NOT NULL DEFAULT 0.0 CHECK (balance >= 0),
    held_balance REAL NOT NULL DEFAULT 0.0 CHECK (held_balance >= 0),
    total_credits REAL NOT NULL DEFAULT 0.0,
    total_debits REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'FROZEN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wallets_wallet_id ON wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- 7. WALLET_LEDGER TABLE (Double-Entry Financial Audit Trail)
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id TEXT PRIMARY KEY,
    ledger_id TEXT NOT NULL UNIQUE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REVERSAL', 'ADJUSTMENT')),
    amount REAL NOT NULL CHECK (amount > 0),
    fee REAL NOT NULL DEFAULT 0.0 CHECK (fee >= 0),
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    reference TEXT NOT NULL,
    idempotency_key TEXT,
    service_name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'System',
    description TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reference ON wallet_ledger(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_idempotency_key ON wallet_ledger(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entry_type ON wallet_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);

-- 8. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE,
    reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    service_category TEXT NOT NULL DEFAULT 'GENERAL',
    service_type TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount >= 0),
    fee REAL NOT NULL DEFAULT 0.0 CHECK (fee >= 0),
    total_amount REAL NOT NULL DEFAULT 0.0,
    wallet_balance_before REAL NOT NULL DEFAULT 0.0,
    wallet_balance_after REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'PROCESSING')),
    provider TEXT NOT NULL DEFAULT 'System',
    provider_reference TEXT,
    recipient_details TEXT,
    description TEXT,
    token TEXT,
    units TEXT,
    pins TEXT,
    raw_payload TEXT,
    raw_response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tx_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_tx_idempotency_key ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_service_category ON transactions(service_category);
CREATE INDEX IF NOT EXISTS idx_tx_service_type ON transactions(service_type);
CREATE INDEX IF NOT EXISTS idx_tx_provider ON transactions(provider);
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON transactions(created_at);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    payment_reference TEXT NOT NULL UNIQUE,
    provider_reference TEXT,
    provider TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    fee REAL NOT NULL DEFAULT 0.0 CHECK (fee >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    account_number TEXT,
    bank_name TEXT,
    channel TEXT NOT NULL DEFAULT 'VIRTUAL_ACCOUNT' CHECK (channel IN ('VIRTUAL_ACCOUNT', 'CARD', 'TRANSFER', 'PORTAL', 'MANUAL_ADMIN')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'UNMATCHED', 'REVERSED')),
    raw_webhook_payload TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_provider_reference ON payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 10. USER_VIRTUAL_ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS user_virtual_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    account_number TEXT NOT NULL UNIQUE,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_virtual_acc_user_id ON user_virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_acc_number ON user_virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_virtual_acc_reference ON user_virtual_accounts(reference);

-- 11. PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    provider_type TEXT,
    base_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 0,
    health_status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (health_status IN ('ONLINE', 'DEGRADED', 'OFFLINE')),
    config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_providers_provider_id ON providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active);

-- 12. VERIFICATION_RECORDS TABLE
CREATE TABLE IF NOT EXISTS verification_records (
    id TEXT PRIMARY KEY,
    verification_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('NIN', 'BVN', 'CAC', 'TIN', 'BANK_ACCOUNT', 'PHONE_NIN', 'IPE', 'CUSTOM')),
    target_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'PROCESSING')),
    fee REAL NOT NULL DEFAULT 0.0,
    reference TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'System',
    result_data TEXT,
    raw_response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_verification_user_id ON verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_type ON verification_records(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_target_id ON verification_records(target_id);
CREATE INDEX IF NOT EXISTS idx_verification_reference ON verification_records(reference);
CREATE INDEX IF NOT EXISTS idx_verification_created_at ON verification_records(created_at);

-- 13. CAC_APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS cac_applications (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    application_type TEXT NOT NULL CHECK (application_type IN ('BUSINESS_NAME', 'COMPANY', 'LTD', 'NGO', 'TRUSTEE')),
    proposed_names TEXT NOT NULL DEFAULT '[]',
    approved_name TEXT,
    business_type TEXT,
    objective TEXT,
    address TEXT,
    proprietors TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    fee REAL NOT NULL DEFAULT 0.0,
    reference TEXT NOT NULL UNIQUE,
    comments TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cac_user_id ON cac_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cac_status ON cac_applications(status);
CREATE INDEX IF NOT EXISTS idx_cac_reference ON cac_applications(reference);

-- 14. SLIP_LOGS TABLE
CREATE TABLE IF NOT EXISTS slip_logs (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    service_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'QUEUED')),
    message_id TEXT,
    error_message TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_slip_logs_user_id ON slip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_slip_logs_service_type ON slip_logs(service_type);

-- 15. REFUNDS TABLE
CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    refund_id TEXT NOT NULL UNIQUE,
    original_transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    original_reference TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    amount REAL NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),
    processed_by_admin_uid TEXT,
    processed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_original_ref ON refunds(original_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- 16. RECONCILIATIONS TABLE
CREATE TABLE IF NOT EXISTS reconciliations (
    id TEXT PRIMARY KEY,
    reconciliation_id TEXT NOT NULL UNIQUE,
    payment_reference TEXT NOT NULL UNIQUE,
    provider_transaction_id TEXT,
    provider TEXT NOT NULL,
    amount REAL NOT NULL,
    account_number TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'UNMATCHED', 'REVERSED')),
    user_id TEXT REFERENCES users(uid) ON DELETE SET NULL,
    wallet_id TEXT,
    verification_result TEXT,
    raw_payload TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rec_payment_ref ON reconciliations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_rec_user_id ON reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_status ON reconciliations(status);

-- 17. UNMATCHED_PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS unmatched_payments (
    id TEXT PRIMARY KEY,
    provider_reference TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount REAL NOT NULL,
    account_number TEXT,
    session_id TEXT,
    raw_payload TEXT,
    resolved INTEGER NOT NULL DEFAULT 0,
    resolved_by_admin_uid TEXT,
    resolved_at TEXT,
    resolution_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_unmatched_provider_ref ON unmatched_payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_unmatched_resolved ON unmatched_payments(resolved);

-- 18. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    admin_uid TEXT,
    admin_email TEXT,
    admin_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING')),
    details TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin_uid ON audit_logs(admin_uid);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- 19. APPLICATION_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS application_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    value TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON application_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON application_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_public ON application_settings(is_public);
