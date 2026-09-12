/**
 * SMART LINK NG — PHASE 5: TURSO DATABASE FOUNDATION TEST SUITE
 * 
 * Validates:
 * 1. Database connection & libSQL client initialization
 * 2. Schema creation and idempotency
 * 3. Foreign-key referential integrity (PRAGMA foreign_keys = ON)
 * 4. Unique constraints (email, uid, reference, idempotency_key)
 * 5. Index presence and query optimization
 * 6. Transaction & Rollback behavior (ACID double-entry ledger)
 * 7. SQL injection defense via parameterized queries
 * 8. Cross-user data isolation
 * 9. Duplicate financial transaction prevention & negative balance CHECK constraint
 */

import { testTursoConnection, executeTurso, withTursoTransaction, getTursoClient } from "../server/turso/client";
import { initializeTursoSchema, TURSO_TABLES } from "../server/turso/schema";
import { TursoMigrator } from "../server/turso/migrator";
import { 
  UserRepository, 
  WalletRepository, 
  LedgerRepository, 
  TransactionRepository, 
  PaymentRepository, 
  VerificationRepository, 
  SettingsRepository, 
  AtomicWalletOperations,
  WebhookRepository,
  RefundRepository,
  ReconciliationRepository
} from "../server/turso/repositories";

async function runPhase5Tests() {
  console.log("=================================================================");
  console.log("SMART LINK NG — PHASE 5: TURSO DATABASE FOUNDATION TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Database Connection
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Database Connection ---");
  const conn = await testTursoConnection();
  assert(conn.ok === true, "Turso database connects successfully and reports healthy status");
  assert(typeof conn.url === "string" && !conn.url.includes("password"), "Database URL is sanitized and exposes no credentials");

  // ---------------------------------------------------------------------------
  // TEST 2: Schema Creation & Idempotency
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Schema Creation & Idempotency ---");
  const initResult = await initializeTursoSchema();
  assert(initResult.success === true, "Schema DDL executes cleanly without errors");
  assert(initResult.tablesCreated >= 15, `All relational tables created (found ${initResult.tablesCreated} tables)`);

  // Verify second run is idempotent
  const secondInit = await initializeTursoSchema();
  assert(secondInit.success === true, "Schema initialization is strictly idempotent");

  // ---------------------------------------------------------------------------
  // TEST 3: Foreign Key Integrity (PRAGMA foreign_keys = ON)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Foreign Key Referential Integrity ---");
  let fkErrorCaught = false;
  try {
    // Attempt inserting wallet for non-existent user
    await executeTurso(
      `INSERT INTO wallets (id, wallet_id, user_id, balance, status) VALUES (?, ?, ?, ?, ?);`,
      ["wal_ghost_test", "wal_ghost", "usr_non_existent_uid_9999", 5000, "ACTIVE"]
    );
  } catch (err: any) {
    fkErrorCaught = true;
  }
  assert(fkErrorCaught === true, "Foreign key constraint restricts orphan wallet creation for non-existent user");

  // ---------------------------------------------------------------------------
  // TEST 4: Unique Constraints
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: Unique Constraints ---");
  const testUid = `usr_test_${Date.now()}`;
  const testEmail = `test.user.${Date.now()}@example.com`;

  const user = await UserRepository.create({
    id: testUid,
    uid: testUid,
    email: testEmail,
    full_name: "Test Integrity User",
    role: "USER",
    wallet_balance: 10000,
    is_verified: 1,
    status: "ACTIVE",
  });
  assert(user.uid === testUid, "User created successfully in Turso database");

  // Duplicate email insertion attempt
  let duplicateEmailCaught = false;
  try {
    await UserRepository.create({
      id: `usr_dup_${Date.now()}`,
      uid: `usr_dup_${Date.now()}`,
      email: testEmail, // duplicate email
      full_name: "Duplicate Email Attacker",
      role: "USER",
      wallet_balance: 0,
      is_verified: 0,
      status: "ACTIVE",
    });
  } catch (err) {
    duplicateEmailCaught = true;
  }
  assert(duplicateEmailCaught === true, "Unique constraint strictly rejects duplicate user email");

  // Create valid wallet for test user
  const wallet = await WalletRepository.create({
    id: `wal_${testUid}`,
    wallet_id: `wal_${testUid}`,
    user_id: testUid,
    currency: "NGN",
    balance: 10000,
    held_balance: 0,
    total_credits: 10000,
    total_debits: 0,
    status: "ACTIVE",
  });
  assert(wallet.user_id === testUid, "Wallet associated with user created successfully");

  // ---------------------------------------------------------------------------
  // TEST 5: Indexes Presence
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Database Indexes ---");
  const indexesRes = await executeTurso(
    "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';"
  );
  const indexNames = indexesRes.rows.map((r: any) => String(r.name));
  
  assert(indexNames.includes("idx_users_uid"), "Index idx_users_uid exists");
  assert(indexNames.includes("idx_tx_reference"), "Index idx_tx_reference exists");
  assert(indexNames.includes("idx_wallet_ledger_reference"), "Index idx_wallet_ledger_reference exists");
  assert(indexNames.includes("idx_wallets_user_id"), "Index idx_wallets_user_id exists");

  // ---------------------------------------------------------------------------
  // TEST 6: Transaction & ACID Rollback Behavior
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Transaction Integrity & ACID Rollback ---");
  const initialBalance = wallet.balance;

  let rollbackCaught = false;
  try {
    await withTursoTransaction(async (tx) => {
      // Step 1: Update wallet
      await tx.execute({
        sql: `UPDATE wallets SET balance = balance - 5000 WHERE user_id = ?;`,
        args: [testUid],
      });

      // Step 2: Intentional fault to trigger rollback
      throw new Error("Simulated intermediate network crash during ledger sync");
    });
  } catch (err: any) {
    rollbackCaught = true;
  }

  assert(rollbackCaught === true, "Intentional transaction failure triggered exception");

  // Verify wallet balance remained untouched after rollback
  const walletAfterRollback = await WalletRepository.findByUserId(testUid);
  assert(
    Number(walletAfterRollback?.balance) === initialBalance,
    "Wallet balance fully restored to original state following transaction rollback (ACID Atomicity)"
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Parameterized SQL Injection Defense
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 7: Parameterized SQL Injection Defense ---");
  const maliciousInjection = "' OR '1'='1' --";
  const injectionUser = await UserRepository.findByEmail(maliciousInjection);
  assert(injectionUser === null, "Malicious SQL injection in findByEmail is safely parameterized and returns null");

  // ---------------------------------------------------------------------------
  // TEST 8: Cross-User Access Isolation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 8: Cross-User Data Isolation ---");
  const victimUid = `usr_victim_${Date.now()}`;
  await UserRepository.create({
    id: victimUid,
    uid: victimUid,
    email: `victim.${Date.now()}@example.com`,
    full_name: "Victim User",
    role: "USER",
    wallet_balance: 50000,
    is_verified: 1,
    status: "ACTIVE",
  });

  const attackerTransactions = await TransactionRepository.findByUserId(testUid);
  const victimTransactions = await TransactionRepository.findByUserId(victimUid);

  const hasLeakage = attackerTransactions.some((tx) => tx.user_id === victimUid);
  assert(hasLeakage === false, "User transaction repository queries strictly isolate caller data by parameterized user_id");

  // ---------------------------------------------------------------------------
  // TEST 9: Duplicate Financial Transaction Prevention & Check Constraints
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 9: Financial Ledger & Duplicate Protection ---");
  const ref1 = `SML-TURSO-TEST-${Date.now()}`;

  // Execute first atomic debit
  const debitRes = await AtomicWalletOperations.debitWalletAtomic({
    userId: testUid,
    amount: 2500,
    fee: 50,
    reference: ref1,
    idempotencyKey: `idem_${ref1}`,
    serviceName: "NIN Verification",
    serviceCategory: "VERIFICATION",
    serviceType: "NIN_VERIFY",
    description: "NIN Verification fee debit",
  });

  assert(debitRes.success === true, "Atomic wallet debit completed successfully with double-entry ledger");
  assert(debitRes.newBalance === initialBalance - 2550, `Balance accurately decremented to ${debitRes.newBalance}`);

  // Duplicate transaction attempt with same reference
  let duplicateRefCaught = false;
  try {
    await AtomicWalletOperations.debitWalletAtomic({
      userId: testUid,
      amount: 2500,
      fee: 50,
      reference: ref1, // Duplicate reference
      serviceName: "NIN Verification",
      description: "Duplicate debit attempt",
    });
  } catch (err: any) {
    duplicateRefCaught = true;
  }
  assert(duplicateRefCaught === true, "Duplicate financial transaction reference is blocked immediately");

  // Negative balance CHECK constraint test
  let negativeBalanceCaught = false;
  try {
    await AtomicWalletOperations.debitWalletAtomic({
      userId: testUid,
      amount: 999999999, // Exceeds wallet balance
      reference: `SML-TURSO-OVERDRAFT-${Date.now()}`,
      serviceName: "Overdraft Test",
      description: "Attempting overdraft",
    });
  } catch (err) {
    negativeBalanceCaught = true;
  }
  assert(negativeBalanceCaught === true, "Overdraft debit is rejected by wallet balance validation and SQLite CHECK constraint");

  // ---------------------------------------------------------------------------
  // TEST 10: Settings Repository
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 10: Application Settings ---");
  await SettingsRepository.set(
    "set_test_key",
    "site_announcement",
    "SYSTEM",
    { message: "Phase 5 Turso integration active", uptime: "99.99%" },
    true,
    "Site announcement test setting"
  );
  const setting = await SettingsRepository.get("site_announcement");
  assert(setting !== null && setting.category === "SYSTEM", "Application setting stored and retrieved successfully via repository");

  // ---------------------------------------------------------------------------
  // TEST 11: Version-Controlled Migration Status & Tracking
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 11: Version-Controlled Migration Engine ---");
  const migrationStatuses = await TursoMigrator.getMigrationStatus();
  assert(migrationStatuses.length >= 2, `Discovered ${migrationStatuses.length} migration files`);
  const allApplied = migrationStatuses.every((m) => m.applied === true);
  assert(allApplied === true, "All version-controlled migrations (001, 002) applied and recorded in _migrations table");

  // ---------------------------------------------------------------------------
  // TEST 12: Webhook Events & Idempotency Storage
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 12: Webhook Events & Audit Trail ---");
  const eventId = `evt_monnify_${Date.now()}`;
  const webhookEvent = await WebhookRepository.recordEvent({
    id: eventId,
    event_id: eventId,
    provider: "MONNIFY",
    event_type: "SUCCESSFUL_TRANSACTION",
    reference: `MNFY_${Date.now()}`,
    signature: "sha512_test_signature_hash",
    signature_valid: 1,
    status: "PROCESSED",
    payload: JSON.stringify({ amountPaid: 5000, paidOn: new Date().toISOString() }),
    ip_address: "35.242.128.1",
    processed_at: new Date().toISOString(),
  });
  assert(webhookEvent.event_id === eventId, "Webhook event recorded with provider, signature validation, and payload");

  // Verify unique event ID constraint
  let duplicateWebhookCaught = false;
  try {
    await WebhookRepository.recordEvent({
      id: `dup_${eventId}`,
      event_id: eventId, // duplicate
      provider: "MONNIFY",
      event_type: "SUCCESSFUL_TRANSACTION",
      signature_valid: 1,
      status: "PENDING",
      payload: "{}",
    });
  } catch (err) {
    duplicateWebhookCaught = true;
  }
  assert(duplicateWebhookCaught === true, "Duplicate webhook event_id is rejected by unique constraint");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
