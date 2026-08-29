# Smart Link Wallet Engine Module 0 & Module 1: Existing Project Audit & Migration Report

**Date**: August 3, 2026  
**Target System**: Smart Link Digital (Version 1.0)  
**Specification Reference**: Phase 1 – 8 Specifications (`/docs/wallet_engine_*.md`)  

---

## 1. Executive Summary & Audit Purpose

Before commencing structural code modifications or module deprecations, a comprehensive project audit (Module 0 / Module 1) was performed across the codebase to map every file, dependency, database construct, API endpoint, and state store tied to wallet operations and financial transactions.

This audit report serves as the official baseline for **Stage 1 (Project Preparation)** through **Stage 7 (Production Readiness)** of the Smart Link Wallet Engine Master Build Plan.

---

## 2. Codebase Map & Directory Structure

```
/
├── docs/
│   ├── wallet_engine_functional_spec.md    # Phase 3 Spec
│   ├── wallet_engine_backend_architecture.md# Phase 4 Spec
│   ├── wallet_engine_phase5_spec.md       # Phase 5 Spec
│   ├── wallet_engine_frontend_ux_spec.md   # Phase 6 Spec
│   └── wallet_engine_phase7_standards.md   # Phase 7 Spec
├── src/
│   ├── components/
│   │   ├── wallet/                        # Existing Wallet UI Components
│   │   │   ├── WalletBalance.tsx
│   │   │   ├── WalletCard.tsx
│   │   │   ├── WalletFundingView.tsx
│   │   │   ├── WalletHistory.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── TransactionStatus.tsx
│   │   │   ├── ConfirmationDialog.tsx
│   │   │   └── WalletValidator.tsx
│   │   ├── bills/                         # Bill Payment Views
│   │   ├── transaction/                   # Receipt & Transaction Detail Components
│   │   ├── admin/                         # Admin Management Panels
│   │   └── history/                       # Audit & History Components
│   ├── services/
│   │   ├── walletService.ts               # Client-side Wallet API Abstraction
│   │   ├── serverWalletEngine.ts          # Server-side Legacy Wallet Logic
│   │   ├── monnifyService.ts              # Deprecated Monnify Gateway Integration
│   │   ├── apiProviderManager.ts          # External Gateway Provider Configuration
│   │   ├── transactionEngine.ts           # Server-side Transaction Logic
│   │   ├── notificationEngine.ts          # In-app & Email Notification Engine
│   │   └── firestoreDbManager.ts          # Firestore Synchronization Layer
│   ├── types/
│   │   └── index.ts                       # Legacy Types Definitions
├── server.ts                              # Express Server & API Handlers (3000)
├── firebase-blueprint.json                # Firestore Blueprint Schema
├── firestore.rules                        # Firestore Security Rules
├── metadata.json                          # App Metadata & Capabilities
├── package.json                           # Dependencies & Build Scripts
└── .env.example                           # Required Environment Variable Declarations
```

---

## 3. Discovered Wallet & Payment Artifacts

### 3.1 Client-Side Components (`/src/components/wallet/`)
- `WalletBalance.tsx`: Displays balance with visibility toggle. (Reusable base, requires Firestore real-time listener binding).
- `WalletCard.tsx`: Card visual container displaying wallet number. (Reusable layout, needs formatting alignment for `SL10...` internal wallet numbers).
- `WalletFundingView.tsx`: UI for entering amounts and triggering funding. (Marked for refactoring to integrate Squad Checkout API exclusively).
- `WalletHistory.tsx`: Transaction history list. (Marked for refactoring to support Firestore paginated queries, filters, and detail overlays).
- `WalletValidator.tsx`: Client-side input validation. (Reusable utility).

### 3.2 Backend Services & Integrations (`/src/services/`)
- `serverWalletEngine.ts`: Legacy wallet engine using local file-based storage or direct mutation. (Marked for replacement with 3-Layer Firestore Repository & Service Architecture).
- `monnifyService.ts`: Monnify payment integration. (Marked for replacement by `squadAdapter.ts` and Squad Payment Gateway APIs).
- `apiProviderManager.ts`: API Provider Manager. (Reusable adapter base for multi-provider routing).
- `transactionEngine.ts`: Transaction record creator. (Marked for refactoring into 3-layer `TransactionService` and `TransactionRepository`).

### 3.3 Server Endpoints (`server.ts`)
- Legacy routes `/api/wallet/balance`, `/api/wallet/fund`, `/api/payments/webhook` currently exist with mixed local file database and initial Firestore hooks.
- **Action Required**: Systematically refactor all `/api/wallet/*`, `/api/payments/*`, `/api/webhooks/squad`, and `/api/admin/*` routes to use standard JSON response envelopes, strict Firebase Auth Bearer token verification, and atomic Firestore transactions.

---

## 4. Firestore Database & Security Assessment

### Collections Schema Mapping
- `users/{uid}`: Holds user profile, email, phone, role (`USER`, `ADMIN`, `SUPER_ADMIN`).
- `wallets/{uid}`: Holds single source of truth for wallet (`availableBalance`, `pendingBalance`, `reservedBalance`, `totalBalance`, `status`, `walletNumber`).
- `wallet_summary/{uid}`: Read-optimized snapshot (`currentBalance`, `totalCredits`, `totalDebits`, `lastTransactionDate`).
- `wallet_transactions/{txId}`: Immutable transaction records (`reference`, `type`, `amount`, `fee`, `netAmount`, `status`, `provider`, `gatewayReference`).
- `wallet_ledger/{ledgerId}`: Double-entry immutable accounting records (`walletId`, `entryType` [DEBIT/CREDIT], `amount`, `balanceBefore`, `balanceAfter`, `txReference`).
- `payment_sessions/{sessionId}`: Gateway initiation tracking (`reference`, `uid`, `amount`, `status`, `checkoutUrl`, `expiresAt`).
- `webhook_events/{eventId}`: Idempotency log for Squad webhooks (`gatewayReference`, `processedAt`, `status`, `rawPayload`).
- `notifications/{notifId}`: In-app notification feed (`uid`, `title`, `message`, `isRead`, `timestamp`).
- `audit_logs/{logId}`: Governance audit trail (`actorUid`, `action`, `targetUid`, `reason`, `timestamp`).

---

## 5. Environment & Security Variables Audit

| Variable Name | Environment | Purpose | Security Level |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-only | AI Studio model calls | Secret (Server only) |
| `SQUAD_SECRET_KEY` | Server-only | Squad Payment API Authentication | Secret (Server only) |
| `SQUAD_MERCHANT_ID` | Server-only | Squad Merchant Identification | Secret (Server only) |
| `SQUAD_WEBHOOK_SECRET` | Server-only | HMAC-SHA512 Webhook Signature Validation | Secret (Server only) |
| `SUPER_ADMIN_EMAIL` | Server-only | Default system super admin email | Config |
| `SUPER_ADMIN_PASSWORD`| Server-only | Default system super admin password | Secret |

---

## 6. Risk Assessment & Migration Strategy

### Key Risks Identified
1. **Downtime / Breaking Imports**: Deleting legacy wallet files before new repositories exist could break imports in `App.tsx` or service components.
   - *Mitigation*: Perform Module 2 (Migration Checklist) to refactor exports systematically without introducing temporary broken imports.
2. **Race Conditions / Double Debits**: Concurrent client requests could cause negative balance or duplicate credits.
   - *Mitigation*: Enforce `db.runTransaction()` for all balance updates and webhook idempotency checks on `webhook_events`.
3. **Exposing Secrets**: Squad secret keys must not be present in `VITE_` variables.
   - *Mitigation*: All Squad calls must be handled server-side via `/api/payments/*` and `/api/webhooks/squad`.

---

## 7. Master Plan Execution Roadmap (Modules 2 to 26)

- **Stage 1: Preparation (Modules 2 - 3)**: Detailed component migration checklist & safe removal of obsolete Monnify code.
- **Stage 2: Foundation (Modules 4 - 6)**: Express 3-layer architecture, Firestore repositories, and Core Models.
- **Stage 3: Core Engine (Modules 7 - 10)**: Automatic `SL10...` wallet provisioning, Wallet Dashboard API, Atomic Ledger & Transaction Engine.
- **Stage 4: Squad Gateway (Modules 11 - 14)**: Squad Payment Adapter, Initiation API, HMAC Webhook verification, Idempotency engine.
- **Stage 5: Features (Modules 15 - 19)**: Atomic P2P Transfers, Transaction History, Notifications, Wallet Settings.
- **Stage 6: Governance (Modules 20 - 22)**: Admin Dashboard, Audit Logging, System Metrics.
- **Stage 7: Production Readiness (Modules 23 - 26)**: Security Review, Latency Optimization, End-to-End Verification, Deployment Checklist.
