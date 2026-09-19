# Technical Specification: Smart Link Wallet Engine Database & Architecture (Phase 2 Specification)

This document contains the updated technical specification for the **Smart Link Wallet Engine (Phase 2)** database schema, security rules, and funding architecture.

---

## 1. Core Design Principles

1. **Separation of Profile & Financial Balance**: Money is strictly stored in the `wallets` / `wallet_summary` tables—never directly in the user's profile record.
2. **Mandatory Transaction Audit**: Every financial movement creates an immutable `wallet_transactions` record.
3. **Ledger Immutability**: Every balance change creates a corresponding `wallet_ledger` entry.
4. **Permanent Record Retention**: Financial records are never deleted from the database.
5. **Reversal-Only Corrections**: Completed transactions are never modified directly; adjustments or corrections must occur through an authorized reversal transaction.
6. **Unified Standard Currency**: All monetary values are strictly denominated in Nigerian Naira (NGN).

---

## 2. Table / Entity Specifications

### 1. `users`
Stores user profile information.
- **Table**: `users`
- **Fields**:
  - `uid` (`String`, Required)
  - `fullName` (`String`, Required)
  - `email` (`String`, Required)
  - `phone` (`String`, Required)
  - `photoURL` (`String`, Optional)
  - `role` (`String`, Required) — e.g. `CUSTOMER`, `AGENT_VENDOR`, `ADMIN`, `SUPER_ADMIN`
  - `accountStatus` (`String`, Required) — `ACTIVE`, `SUSPENDED`, `FROZEN`, `CLOSED`
  - `createdAt` (`Timestamp`, Required)
  - `updatedAt` (`Timestamp`, Required)
  - `lastLogin` (`Timestamp`, Required)

### 2. `wallets`
Each user has exactly one wallet.
- **Table**: `wallets`
- **Fields**:
  - `walletId` (`String`, Required)
  - `uid` (`String`, Required)
  - `walletNumber` (`String`, Required) — Unique 10-digit account identifier
  - `availableBalance` (`Number`, Required)
  - `pendingBalance` (`Number`, Required)
  - `reservedBalance` (`Number`, Required)
  - `totalBalance` (`Number`, Required) — `availableBalance + pendingBalance + reservedBalance`
  - `status` (`String`, Required) — `ACTIVE`, `FROZEN`, `SUSPENDED`
  - `createdAt` (`Timestamp`, Required)
  - `updatedAt` (`Timestamp`, Required)

### 3. `wallet_summary` (Optimized Snapshot Table)
High-performance snapshot table for fast dashboard rendering without re-calculating thousands of ledger entries.
- **Table**: `wallet_summary`
- **Fields**:
  - `uid` (`String`, Required)
  - `walletId` (`String`, Required)
  - `currentBalance` (`Number`, Required)
  - `totalCredits` (`Number`, Required) — Cumulative sum of all successful incoming funds
  - `totalDebits` (`Number`, Required) — Cumulative sum of all outgoing transactions
  - `lastTransactionDate` (`Timestamp`, Optional)
  - `updatedAt` (`Timestamp`, Required)

### 4. `wallet_transactions`
Stores every financial transaction lifecycle.
- **Table**: `wallet_transactions`
- **Fields**:
  - `transactionId` (`String`, Required)
  - `walletId` (`String`, Required)
  - `uid` (`String`, Required)
  - `type` (`String`, Required) — `FUNDING`, `TRANSFER`, `AIRTIME`, `DATA`, `ELECTRICITY`, `TV`, `EDUCATION`, `REFUND`, `REVERSAL`, `WITHDRAWAL`
  - `amount` (`Number`, Required)
  - `fee` (`Number`, Required)
  - `netAmount` (`Number`, Required)
  - `reference` (`String`, Required) — System reference ID
  - `externalReference` (`String`, Optional) — Gateway transaction ID (Squad)
  - `provider` (`String`, Required) — `SQUAD`, `INTERNAL`, etc.
  - `status` (`String`, Required) — `INITIATED`, `PENDING`, `PROCESSING`, `SUCCESSFUL`, `FAILED`, `REVERSED`
  - `description` (`String`, Required)
  - `createdAt` (`Timestamp`, Required)
  - `completedAt` (`Timestamp`, Optional)

### 5. `wallet_ledger`
The immutable financial source of truth.
- **Table**: `wallet_ledger`
- **Fields**:
  - `ledgerId` (`String`, Required)
  - `transactionId` (`String`, Required)
  - `walletId` (`String`, Required)
  - `entryType` (`String`, Required) — `Credit` or `Debit`
  - `amount` (`Number`, Required)
  - `balanceBefore` (`Number`, Required)
  - `balanceAfter` (`Number`, Required)
  - `createdAt` (`Timestamp`, Required)

### 6. `payment_sessions`
Tracks payment funding attempts before completion.
- **Table**: `payment_sessions`
- **Fields**:
  - `sessionId` (`String`, Required)
  - `uid` (`String`, Required)
  - `amount` (`Number`, Required)
  - `provider` (`String`, Required) — Fixed: `Squad`
  - `checkoutUrl` (`String`, Optional)
  - `reference` (`String`, Required)
  - `status` (`String`, Required) — `INITIATED`, `PENDING`, `SUCCESSFUL`, `FAILED`, `EXPIRED`
  - `expiresAt` (`Timestamp`, Required)

### 7. `webhook_events`
Ingests every webhook payload received from Squad / payment gateways for idempotency and auditing.
- **Table**: `webhook_events`
- **Fields**:
  - `eventId` (`String`, Required)
  - `provider` (`String`, Required) — `Squad`
  - `eventType` (`String`, Required)
  - `payload` (`Map/JSON`, Required)
  - `processed` (`Boolean`, Required)
  - `processedAt` (`Timestamp`, Optional)

### 8. `notifications`
In-app messaging for financial activity and wallet state updates.
- **Table**: `notifications`
- **Fields**:
  - `notificationId` (`String`, Required)
  - `uid` (`String`, Required)
  - `title` (`String`, Required)
  - `message` (`String`, Required)
  - `type` (`String`, Required) — `FUNDING`, `TRANSFER`, `BILL_PAYMENT`, `REFUND`, `SECURITY`
  - `read` (`Boolean`, Required)
  - `createdAt` (`Timestamp`, Required)

### 9. `audit_logs`
Security and administrative activity trail.
- **Table**: `audit_logs`
- **Fields**:
  - `logId` (`String`, Required)
  - `actorUid` (`String`, Required)
  - `action` (`String`, Required)
  - `details` (`String`, Required)
  - `ipAddress` (`String`, Optional)
  - `createdAt` (`Timestamp`, Required)

### 10. `app_settings`
Global application configuration singleton.
- **Table**: `app_settings`
- **Fields**:
  - `maintenanceMode` (`Boolean`, Required)
  - `minimumFundingAmount` (`Number`, Required)
  - `maximumFundingAmount` (`Number`, Required)
  - `squadConfig` (`Map/JSON`, Required)
  - `notificationConfig` (`Map/JSON`, Required)
  - `systemVersion` (`String`, Required)
  - `featureFlags` (`Map/JSON`, Required)

---

## 3. Database Security & Access Policy

1. **Wallet Privacy**: Users can read only their own wallet via authenticated `/api/wallet` endpoints.
2. **Balance Integrity**: Direct client balance writes are forbidden; all state changes execute through verified server-side endpoints.
3. **Backend Exclusive Writes**: Balance updates, ledger insertions, and webhook logs are executable strictly by trusted backend services using atomic database transactions.
4. **Transaction Visibility**: Users can view only their own transaction history.
5. **Admin Access Control**: Administrative actions (freezing, reversals, global settings updates) are restricted strictly to verified Admins.
6. **Ledger & Audit Lockdown**: `wallet_ledger`, `audit_logs`, `payment_sessions`, and `webhook_events` records are completely write-protected against unauthorized manipulation.

---

## 4. Wallet Funding Flow

```
User (Front-End)             Backend Proxy             Squad Payment Gateway
      │                            │                           │
      ├─── 1. Enter NGN Amount ───>│                           │
      │                            ├── 2. Create Payment ─────>│
      │                            │      Session              │
      │                            │<── 4. Checkout URL ───────┤
      │<── 5. Redirect Checkout ───┤                           │
      │                                                        │
      ├────────────── 6. Complete Squad Payment ──────────────>│
      │                                                        │
      │                            │<── 7. Squad Webhook ──────┤
      │                            │    (charge.success)       │
      │                            │                           │
      │                            ├── 8. Atomic Verification: │
      │                            │      - Update Transaction │
      │                            │      - Create Ledger      │
      │                            │      - Update Wallet      │
      │                            │      - Update Summary     │
      │                            │      - Send Notification  │
      │                            │                           │
      │<── 9. Live Balance Sync ───┤                           │
```
