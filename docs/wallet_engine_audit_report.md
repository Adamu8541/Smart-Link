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
│   │   └── supabaseAuth.ts                # Supabase Auth Client Integration
│   ├── types/
│   │   └── index.ts                       # Types Definitions
│   ├── context/
│   │   └── AuthContext.tsx                # Supabase & Application Auth Provider
├── server.ts                              # Express Server & API Handlers (3000)
├── metadata.json                          # App Metadata & Capabilities
├── package.json                           # Dependencies & Build Scripts
└── .env.example                           # Required Environment Variable Declarations
```

---

## 3. Discovered Wallet & Payment Artifacts

### 3.1 Client-Side Components (`/src/components/wallet/`)
- `WalletBalance.tsx`: Displays balance with visibility toggle.
- `WalletCard.tsx`: Card visual container displaying wallet number.
- `WalletFundingView.tsx`: UI for entering amounts and triggering funding via Squad / Monnify / OPay gateways.
- `WalletHistory.tsx`: Transaction history list with paginated queries, filters, and detail overlays.
- `WalletValidator.tsx`: Client-side input validation.

### 3.2 Backend Services & Integrations (`/src/services/` & `server.ts`)
- `walletService.ts`: Client-side wallet API abstraction.
- `apiProviderManager.ts`: API Provider Manager for multi-provider routing.
- `transactionEngine.ts`: Transaction record creator.

### 3.3 Server Endpoints (`server.ts`)
- Routes `/api/wallet/*`, `/api/payments/*`, `/api/webhooks/*`, and `/api/admin/*` use standard JSON response envelopes, Supabase / Session token verification, and atomic database transactions.

---

## 4. Database & Security Assessment

### Database Tables Schema Mapping (Turso LibSQL / Cloud SQL)
- `users`: Holds user profile, email, phone, role (`CUSTOMER`, `AGENT_VENDOR`, `ADMIN`, `SUPER_ADMIN`).
- `wallets`: Holds single source of truth for wallet (`availableBalance`, `pendingBalance`, `reservedBalance`, `totalBalance`, `status`, `walletNumber`).
- `wallet_summary`: Read-optimized snapshot (`currentBalance`, `totalCredits`, `totalDebits`, `lastTransactionDate`).
- `wallet_transactions`: Immutable transaction records (`reference`, `type`, `amount`, `fee`, `netAmount`, `status`, `provider`, `gatewayReference`).
- `wallet_ledger`: Double-entry immutable accounting records (`walletId`, `entryType` [DEBIT/CREDIT], `amount`, `balanceBefore`, `balanceAfter`, `txReference`).
- `payment_sessions`: Gateway initiation tracking (`reference`, `uid`, `amount`, `status`, `checkoutUrl`, `expiresAt`).
- `webhook_events`: Idempotency log for Squad / gateway webhooks (`gatewayReference`, `processedAt`, `status`, `rawPayload`).
- `notifications`: In-app notification feed (`uid`, `title`, `message`, `isRead`, `timestamp`).
- `audit_logs`: Governance audit trail (`actorUid`, `action`, `targetUid`, `reason`, `timestamp`).

---

## 5. Environment & Security Variables Audit

| Variable Name | Environment | Purpose | Security Level |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-only | AI Studio model calls | Secret (Server only) |
| `TURSO_DATABASE_URL` | Server-only | Turso LibSQL Database Endpoint | Secret (Server only) |
| `TURSO_AUTH_TOKEN` | Server-only | Turso LibSQL Authentication Token | Secret (Server only) |
| `VITE_SUPABASE_URL` | Client & Server | Supabase Project URL | Public |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Supabase Anonymous Client Key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase Server Management Key | Secret (Server only) |
| `SQUAD_SECRET_KEY` | Server-only | Squad Payment API Authentication | Secret (Server only) |
| `SQUAD_MERCHANT_ID` | Server-only | Squad Merchant Identification | Secret (Server only) |
| `SQUAD_WEBHOOK_SECRET` | Server-only | HMAC-SHA512 Webhook Signature Validation | Secret (Server only) |
| `SUPER_ADMIN_EMAIL` | Server-only | Default system super admin email | Config |
| `SUPER_ADMIN_PASSWORD`| Server-only | Default system super admin password | Secret |

---

## 6. Risk Assessment & Migration Strategy

### Key Risks Identified
1. **Downtime / Breaking Imports**: Refactored exports systematically to maintain stability across `App.tsx` and all service components.
2. **Race Conditions / Double Debits**: Concurrent client requests are prevented with atomic database transactions and webhook idempotency checks on `webhook_events`.
3. **Exposing Secrets**: Squad and payment gateway secret keys must not be present in client variables.
   - *Mitigation*: All payment calls are handled server-side via `/api/payments/*` and `/api/webhooks/*`.

---

## 7. Master Plan Execution Roadmap

- **Stage 1: Preparation**: Component structure verification & API abstraction.
- **Stage 2: Foundation**: Express 3-layer architecture, Turso LibSQL repositories, and Core Models.
- **Stage 3: Core Engine**: Automatic wallet provisioning, Wallet Dashboard API, Atomic Ledger & Transaction Engine.
- **Stage 4: Gateway Integration**: Squad, Monnify, and Paystack Payment Adapters, Initiation APIs, HMAC Webhook verification, Idempotency engine.
- **Stage 5: Features**: Atomic P2P Transfers, Transaction History, Notifications, Wallet Settings.
- **Stage 6: Governance**: Admin Dashboard, Audit Logging, System Metrics.
- **Stage 7: Production Readiness**: Security Review, Latency Optimization, End-to-End Verification, Deployment Checklist.
