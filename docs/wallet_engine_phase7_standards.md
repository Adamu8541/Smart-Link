# Smart Link Wallet Engine Phase 7 Specification: Development Standards & Engineering Rules

This document outlines the mandatory production standards, security practices, code quality guidelines, and architectural rules for all implementation modules of the **Smart Link Wallet Engine (Version 1.0)**.

---

## 1. Zero-Mock & Production Readiness Rule

The application and all generated backend/frontend code must be **strictly production-ready**.

### Prohibited Artifacts
- **NO** sample/dummy/mock financial data (fake balances, fake transaction records, fake users).
- **NO** hardcoded wallet numbers or simulated gateway responses.
- **NO** placeholder payment providers or stubbed functions.
- **NO** `TODO` comments used as substitutes for missing logic.
- **NO** client-side balance mutations.

Every feature must be fully implemented and connected to verified backend endpoints and Firestore database queries.

---

## 2. Approved Technology Stack

- **Frontend**: React (Vite, TypeScript, Tailwind CSS, Lucide icons)
- **Authentication**: Firebase Authentication (ID Token verification)
- **Database**: Cloud Firestore (`users`, `wallets`, `wallet_summary`, `wallet_transactions`, `wallet_ledger`, `payment_sessions`, `webhook_events`, `notifications`, `audit_logs`, `app_settings`)
- **Backend API**: Node.js Express Server / Firebase Cloud Functions (`server.ts`, 3-Layer Architecture: Controllers, Services, Repositories)
- **Payment Gateway**: Squad Payment APIs (`initiate-payment`, `verify-payment`, HMAC-SHA512 Webhooks)
- **Deployment Target**: Cloud Run / Containerized Express & Vercel-compatible SPA

---

## 3. Modular Code Architecture

```
src/
  ├── components/       # Reusable UI controls (Buttons, Modals, Cards)
  ├── pages/            # View routes (Wallet Dashboard, Transfer, History, Admin)
  ├── hooks/            # Custom React hooks (useWallet, useAuth, useTransactions)
  ├── services/         # Client-side API request wrappers & formatters
  ├── types/            # Strict TypeScript interfaces & enums
  └── utils/            # Shared formatting (Currency, Dates, Input validation)

server.ts / functions/
  ├── controllers/      # Express route handlers & request validators
  ├── services/         # Business logic (Ledger, Squad integration, Transfer engine)
  ├── repositories/     # Firestore data access & atomic transaction runners
  ├── middleware/       # Firebase Auth ID Token verification & RBAC
  ├── integrations/
  │   └── squad/        # Squad Gateway API Adapter & HMAC Signature verifiers
  └── utils/            # Logger, Error Enums, Response Envelopes
```

---

## 4. Security & Cryptographic Invariants

1. **Secret Key Isolation**: Squad API Secret Keys and webhook secrets must **NEVER** be exposed to client-side bundles. They reside exclusively in server environment variables (`process.env.SQUAD_SECRET_KEY`).
2. **Atomic Firestore Balance Updates**: All wallet balance mutations and ledger insertions must execute inside `db.runTransaction()` to eliminate race conditions.
3. **Webhook Verification & Idempotency**: All incoming Squad webhooks must verify the HMAC-SHA512 header signature and check `webhook_events` by `gatewayReference` to prevent duplicate crediting.
4. **Strict RBAC Enforcement**: Administrative routes (`/api/admin/*`) strictly verify `SUPER_ADMIN` or `ADMIN` roles before processing actions.

---

## 5. Standardized Error Handling & Logging

All backend APIs respond with standardized HTTP envelopes:

```json
{
  "success": false,
  "message": "User-friendly, sanitized error description",
  "errorCode": "INSUFFICIENT_BALANCE",
  "timestamp": "2026-08-03T06:10:19.000Z"
}
```

- Raw system stack traces and database errors are logged internally with correlation IDs and are **never** returned to client UI.
- All administrative and security operations (wallet freeze, reversal, status modification) write immutable entries to `audit_logs`.

---

## 6. Definition of Complete (Completion Criteria)

A module is considered complete only when:
1. It compiles with zero TypeScript (`tsc --noEmit`) and linter errors.
2. It operates without mock data, sourcing all state from live backend/Firestore services.
3. It passes all validation constraints, edge cases, and security checks.
4. It seamlessly integrates into the overall Smart Link Wallet Engine architecture.
