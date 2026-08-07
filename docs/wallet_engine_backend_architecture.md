# Smart Link Wallet Engine Backend API & Service Architecture (Phase 4)

This document specifies the 3-Layer Backend Service Architecture, API specifications, Squad Payment Provider Adapter pattern, Error Handling standards, and Endpoint definitions for the **Smart Link Wallet Engine (Version 1.0)**.

---

## 1. 3-Layer Architecture Overview

To ensure maintainability, high testability, and clean separation of concerns, the backend is organized into three distinct layers:

```
                  ┌─────────────────────────────────────────┐
                  │           Express Controllers           │
                  │   (HTTP Request Parsing & Responses)   │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            Business Services            │
                  │   (Wallet Ledger, Squad Integration,    │
                  │    Internal Transfers, Audit Engine)    │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Database Repositories          │
                  │  (Firestore Reads, Atomic Transactions, │
                  │     Query Filters, Real-Time Sync)      │
                  └─────────────────────────────────────────┘
```

1. **Controllers Layer**: Handles HTTP requests, extracts parameters, validates inputs, extracts Firebase Auth ID Tokens, and formats standardized HTTP JSON responses.
2. **Services Layer**: Encapsulates core financial business logic, atomic balance calculations, ledger entry generations, payment provider delegation, and notification dispatches.
3. **Repositories Layer**: Direct abstraction over Firestore (`users`, `wallets`, `wallet_summary`, `wallet_transactions`, `wallet_ledger`, `payment_sessions`, `webhook_events`, `notifications`, `audit_logs`, `app_settings`).

---

## 2. Standardized API Response Schema

Every backend API route returns a consistent JSON envelope:

### Success Response (`HTTP 200 / 201`)
```json
{
  "success": true,
  "message": "Wallet funded successfully.",
  "data": {
    "reference": "SL_FUND_20260803_9918",
    "amount": 5000.0,
    "newBalance": 5000.0
  },
  "timestamp": "2026-08-03T05:38:28.000Z"
}
```

### Error Response (`HTTP 400 / 401 / 403 / 404 / 409 / 500`)
```json
{
  "success": false,
  "message": "Insufficient wallet balance to perform this operation.",
  "errorCode": "INSUFFICIENT_BALANCE",
  "timestamp": "2026-08-03T05:38:28.000Z"
}
```

---

## 3. Standard System Error Codes

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid Firebase Auth Bearer token. |
| `FORBIDDEN` | 403 | Authenticated user lacks required role or ownership. |
| `INVALID_AMOUNT` | 400 | Transaction amount is non-positive or exceeds tier limits. |
| `INVALID_USER` | 400 | Recipient user or target account does not exist. |
| `WALLET_NOT_FOUND` | 404 | User wallet record missing or un-provisioned. |
| `WALLET_FROZEN` | 403 | Target wallet is FROZEN or SUSPENDED. |
| `INSUFFICIENT_BALANCE` | 400 | Debit requested exceeds `availableBalance`. |
| `PAYMENT_INITIATION_FAILED` | 502 | Squad Gateway returned an error during session init. |
| `PAYMENT_VERIFICATION_FAILED`| 400 / 502 | Payment signature check or Squad verify API failed. |
| `DUPLICATE_TRANSACTION` | 409 | Reference has already been processed successfully. |
| `DUPLICATE_WEBHOOK` | 200 / 409 | Webhook event ID has already been ingested. |
| `MAINTENANCE_MODE` | 503 | Platform wallet engine is under temporary maintenance. |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server exception. |

---

## 4. Payment Provider Adapter Architecture

The system uses an abstract provider interface allowing Squad (and future gateways like Paystack or Flutterwave) to be swapped or multi-homed seamlessly:

```
                       ┌─────────────────────────┐
                       │  IPaymentProvider (Interface) │
                       └────────────┬────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│       SquadAdapter        │                   │     Future Gateway        │
│  (Initiate, Verify, WH)   │                   │ (Paystack/Flutterwave)    │
└───────────────────────────┘                   └───────────────────────────┘
```

### Interface Methods (`IPaymentProvider`)
- `initiatePayment(params: PaymentInitParams): Promise<PaymentInitResult>`
- `verifyPayment(reference: string): Promise<PaymentVerifyResult>`
- `verifyWebhookSignature(payload: any, signature: string): boolean`

---

## 5. Comprehensive API Endpoint Catalog

### 1. Wallet Management APIs
- **POST `/api/wallet/create`**: Provisions a new `0.00` balance wallet and snapshot for a registered user.
- **GET `/api/wallet`**: Fetches the authenticated user's wallet details (`availableBalance`, `totalBalance`, `status`, `walletNumber`).
- **GET `/api/wallet/summary`**: Returns snapshot statistics (`currentBalance`, `totalCredits`, `totalDebits`, `lastTransactionDate`).
- **GET `/api/wallet/transactions`**: Fetches paginated, filterable transaction history (`type`, `status`, `dateRange`).
- **POST `/api/wallet/transfer`**: Performs an atomic internal peer-to-peer transfer between Smart Link users.

### 2. Squad Payment & Webhook APIs
- **POST `/api/payments/initiate`**: Validates input, creates a `payment_sessions` record, and returns Squad checkout URL.
- **POST `/api/payments/verify`**: Verifies Squad transaction reference, executes atomic wallet credit, creates ledger entries, and dispatches notification.
- **POST `/api/webhooks/squad`**: Webhook endpoint with HMAC-SHA512 verification, idempotency checks against `webhook_events`, and atomic wallet crediting.

### 3. In-App Notification APIs
- **GET `/api/notifications`**: Retrieves user notifications.
- **PATCH `/api/notifications/read`**: Marks notifications as read.

### 4. Admin Governance APIs
- **GET `/api/admin/users`**: Lists all users with role and status filters.
- **GET `/api/admin/wallets`**: Searches user wallets and balances.
- **GET `/api/admin/transactions`**: Global transaction audit log with filter capabilities.
- **PATCH `/api/admin/wallet/status`**: Updates wallet status (`ACTIVE`, `FROZEN`, `SUSPENDED`) with mandatory reason logging in `audit_logs`.
- **GET `/api/admin/webhooks`**: Ingested raw webhook logs and execution attempts.
- **GET `/api/admin/audit-logs`**: Immutable security and administrative audit trail.

---

## 6. Authentication & Security Middleware

Every protected endpoint validates incoming requests through server middleware:
1. Extract `Authorization: Bearer <token>` header.
2. Verify Firebase ID Token via Admin SDK or server auth layer.
3. Attach `req.user` (`uid`, `email`, `role`) to execution context.
4. Verify Role-Based Access Control (RBAC) permissions (e.g. `SUPER_ADMIN` or `ADMIN` required for `/api/admin/*`).
