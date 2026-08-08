# Smart Link Wallet Engine Phase 5 Specification: Core Engine Principles & Safeguards

This document specifies the core operational invariants, unique wallet numbering scheme, fraud detection rules, system failure recovery patterns, and future expansion pathways for the **Smart Link Wallet Engine (Version 1.0)**.

---

## 1. Core Invariant Rules

1. **Zero Unaccounted Balances**: Money cannot be credited to or debited from any wallet without a corresponding `wallet_transactions` record and atomic `wallet_ledger` entries.
2. **Post-Verification Settlement**: Wallets are credited exclusively after Squad payment gateway verification (HMAC signature check & server-to-server transaction status confirmation).
3. **Immutable History**: Completed financial records (`wallet_ledger`, `wallet_transactions`, `audit_logs`) are strictly read-only and immutable. Reversals or adjustments append new records.
4. **Idempotency Safeguard**: Webhook listeners check `webhook_events` for existing gateway references before execution. Re-sent webhooks return HTTP 200 without re-processing balances.

---

## 2. Wallet Numbering Scheme

Every Smart Link user is automatically assigned a unique, formatted 10-digit internal wallet identifier upon registration.

- **Prefix Format**: `SL10` + Sequential / Randomly generated 7-digit numeric string (e.g., `SL100000001`, `SL100000002`).
- **Separation of Concerns**: The internal wallet number is dedicated to peer-to-peer transfers and internal tracking. Squad Dynamic Virtual Accounts (DVAs) are linked as external gateway attributes when enabled.

---

## 3. Atomic Peer-to-Peer Transfer Mechanics

Internal peer-to-peer transfers run inside an isolated **Firestore Transaction (`db.runTransaction`)**:

```
                  ┌─────────────────────────────────────┐
                  │ 1. Read Sender & Recipient Wallets  │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 2. Check Sender State & Balance     │
                  │   (availableBalance >= amount + fee)│
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 3. Compute Net Balance Mutations    │
                  │   - Sender = Sender - TotalDeduction│
                  │   - Recipient = Recipient + Amount  │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 4. Write Dual Ledger Entries        │
                  │   - 1 DEBIT Entry (Sender)          │
                  │   - 1 CREDIT Entry (Recipient)      │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 5. Commit Transaction & Dispatch    │
                  │   Dual In-App Notifications         │
                  └─────────────────────────────────────┘
```

If any condition fails (e.g. sender wallet suspended or insufficient funds), the transaction instantly rolls back with zero state mutation.

---

## 4. System Recovery & Resiliency Patterns

| Risk Scenario | Engine Safeguard & Recovery Action |
| :--- | :--- |
| **Network Timeout during Squad Initiate Payment** | Session marked as `INITIATED`. Expiration job cleans up un-paid sessions after 30 minutes. |
| **Duplicate Webhook Delivery from Squad** | Webhook processor checks `webhook_events` by `gatewayReference`. Returns `200 OK` instantly on duplicate. |
| **Server Restart mid-transaction** | Firestore atomic transactions ensure either all document writes commit or none do. |
| **Temporary Squad API Outage** | Users receive `SERVICE_UNAVAILABLE` error message; pending payments can be verified asynchronously when gateway recovers. |

---

## 5. System Metrics & Telemetry

The engine monitors:
- Total Successful Funding Volume (NGN)
- Daily Peer-to-Peer Transfer Volume (NGN)
- Webhook Ingestion Count & Failure Percentage
- Mean API Latency for Payment Initialization & Verification
- Fraud / Rate-limit Flags
