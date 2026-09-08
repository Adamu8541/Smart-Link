# Smart Link Wallet Engine Functional Specification (Phase 3)

This document outlines the operational lifecycle, transfer mechanics, transaction lifecycle, security constraints, and administrative capabilities of the **Smart Link Wallet Engine (Version 1.0)**.

---

## 1. User & Wallet Lifecycle

Every user account on Smart Link adheres to an automated onboarding and wallet provisioning flow:

```
User Registers
      ↓
Firebase Authentication
      ↓
User Profile Created in Firestore (`users/{uid}`)
      ↓
Wallet Automatically Provisioned (`wallets/{uid}` & `wallet_summary/{uid}`)
      ↓
Wallet Activated (`status: "ACTIVE"`)
      ↓
User Can Fund Wallet & Perform Transactions
```

- **Automatic Provisioning**: Upon successful registration (or first-time login via Firebase Auth), a dedicated wallet document and snapshot are created automatically with `0.00` starting balance and a unique 10-digit wallet number (e.g., `8012345678`).
- **One Wallet per User**: Each verified user profile maintains exactly one wallet.

---

## 2. Supported Core Capabilities

Every active Smart Link wallet supports:
1. **Wallet Funding**: Direct NGN card, transfer, or USSD funding via Squad Payment Gateway.
2. **Peer-to-Peer Transfer**: Zero-latency internal transfers to any registered Smart Link user via phone number, email, or wallet number.
3. **Airtime Purchase**: Instant top-up for MTN, Airtel, Glo, and 9mobile networks.
4. **Data Bundle Top-up**: SME, Direct, and Corporate Data plans for all Nigerian telecommunication networks.
5. **Electricity Utility Payments**: Prepaid & Postpaid meter token purchases for Ikeja, Eko, Central, Kano, and other DISCOs.
6. **Cable TV Subscriptions**: DSTV, GOTV, and StarTimes subscription renewals.
7. **Educational Services**: WAEC, NECO, and JAMB PIN purchases.
8. **Refunds & Reversals**: System and Admin refund processing for failed third-party utility deliveries.
9. **Transaction Statements & Audit Trails**: Real-time accessible transaction history with immutable ledger records.

---

## 3. Enforced Wallet States

| Wallet State | Definition | Permitted Actions |
| :--- | :--- | :--- |
| **Pending** | Newly created or awaiting identity verification. | Account view only; funding/transfers blocked. |
| **Active** | Fully verified operational wallet. | Full credit, debit, funding, and utility capabilities. |
| **Suspended** | Temporarily restricted due to suspicious activity or flag. | Credit allowed (incoming funds); debits & spending blocked. |
| **Frozen** | Hard administrative lock by Admin / Risk system. | **Zero** credits or debits permitted until manually un-frozen. |

---

## 4. Wallet Funding Flow (Squad Integration)

```
User Enters Amount (NGN)
      ↓
Backend Creates `payment_sessions` Record
      ↓
Backend Invokes Squad Initiate Payment API
      ↓
Squad Returns Checkout URL & Reference
      ↓
User Completes Payment on Squad Gateway
      ↓
Squad Dispatches Verified HMAC-Signed Webhook
      ↓
Backend Validates Signature & Idempotency (`webhook_events`)
      ↓
Atomic Firestore Transaction Executes:
  - Credit Wallet Balance (`wallets/{uid}`)
  - Append Immutable Debit/Credit Entry (`wallet_ledger`)
  - Update Snapshot (`wallet_summary/{uid}`)
  - Mark `wallet_transactions` as SUCCESSFUL
  - Dispatch In-App Notification (`notifications`)
      ↓
User Sees Immediate Real-Time Balance Update
```

---

## 5. Atomic Peer-to-Peer Internal Transfer

When User A sends funds to User B:
1. **Validation**: Check recipient existence, sender wallet state (`ACTIVE`), and sender balance (`availableBalance >= amount + fee`).
2. **Atomic Ledger Execution (`db.runTransaction`)**:
   - Debit Sender: `Sender Balance = Sender Balance - (Amount + Fee)`
   - Credit Recipient: `Recipient Balance = Recipient Balance + Amount`
   - Create 2 Ledger Records: 1 `DEBIT` entry for sender, 1 `CREDIT` entry for recipient.
   - Record Transaction: `type: "INTERNAL_TRANSFER"`, `status: "SUCCESSFUL"`.
   - Dispatch Dual Notifications: "Money Sent" to Sender, "Money Received" to Recipient.
3. **Failure Protection**: If either operation fails, the entire transaction aborts with zero balance mutation.

---

## 6. Financial & Security Rules

1. **Non-Negative Balance Requirement**: The backend enforces `availableBalance - debitAmount >= 0` on every debit request.
2. **Failed Transaction Integrity**: Failed or cancelled transactions strictly preserve original wallet balances.
3. **Strict Webhook Idempotency**: Duplicate Squad notifications checking the same gateway reference are safely ignored without double-crediting.
4. **Source of Truth Enforcement**: Wallet balances on client UI are strictly derived from verified server responses and real-time Firestore listeners. Direct client balance writes are blocked by Firestore Security Rules.

---

## 7. Administrative Controls & Governance

Admins and Super Admins have access to governance features:
- **User & Wallet Search**: Query users by email, phone, name, or wallet number.
- **State Controls**: Freeze, unfreeze, suspend, or activate user wallets with mandatory audit reason logging (`audit_logs`).
- **Webhook & Exception Auditing**: Review raw gateway webhooks and retry unprocessed events safely.
- **Dedicated Adjustment Transactions**: Admins cannot directly overwrite wallet balance numbers. Any manual balance adjustment must occur via an authorized, audited `REVERSAL` or `SYSTEM_ADJUSTMENT` transaction.

---

## 8. Performance & Scalability Benchmarks

1. **Dashboard Latency**: Wallet snapshot queries via `wallet_summary` target `< 2.0s` response time.
2. **Real-Time Sync**: Balance changes reflect instantaneously on the UI upon webhook receipt via Firestore real-time snapshots.
3. **Structured API Envelope**: All backend API responses adhere to a unified JSON schema:
   ```json
   {
     "success": true,
     "message": "Operation completed successfully",
     "data": { ... },
     "code": "OK"
   }
   ```
