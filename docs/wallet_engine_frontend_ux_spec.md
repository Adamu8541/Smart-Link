# Smart Link Wallet Engine Phase 6 Specification: Frontend & User Experience (UX) Architecture (Production Version)

This document specifies the complete user experience architecture, component layout, interaction flows, responsive design constraints, and visual design guidelines for the **Smart Link Wallet Engine (Version 1.0)** client application.

---

## CRITICAL GLOBAL PRODUCTION MANDATE

> **Strict Non-Mocking Policy**: The application must **NEVER** display hardcoded, dummy, or sample financial data (fake balances, fake transactions, placeholder users, or simulated payment successes). Every balance, transaction, notification, and wallet parameter **MUST** be fetched dynamically from verified live backend services / Firestore responses. When no records exist, the UI **MUST** display an explicit empty state instead of generating fictional records.

---

## 1. Core Principles & General Guidelines

1. **Live Backend Synchronization**: Every monetary value, balance snapshot, transaction history item, and notification must originate from live backend/Firestore query responses.
2. **Zero-Mock Empty States**: If a user has zero transaction records or unread notifications, clean empty states (e.g. *"No transaction history available"*, *"No notifications"*) must be rendered without artificial placeholders.
3. **Verified Payment Status**: The frontend must never assume payment success prior to server-side webhook/verification confirmation from Squad.
4. **Validated Error Feedback**: Display only clean, validated backend error messages without exposing raw internal server stack traces.
5. **Disable Repeated Submissions**: Buttons and forms must disable immediately upon submission to prevent double debits or duplicate payment initiation.

---

## 2. Wallet Screens Catalog & Component Requirements

### 1. Wallet Dashboard View (`/wallet`)
- **Live Data Binding**: Fetches live wallet document and summary from `/api/wallet` or Firestore `wallets/{uid}`.
- **Hero Balance Card**:
  - Displays **Available Balance** in NGN (`₦XX,XXX.XX`) with eye-icon visibility toggle.
  - Sub-balances: **Pending Balance** & **Reserved Balance**.
  - Unique **Wallet Number** (e.g., `SL100000001`) with one-touch clipboard copy.
  - Action Controls: `[+ Fund Wallet]`, `[ Send Money]`, `[ Pay Bills]`, `[ Transactions]`.
- **Live Activity Feed**: Lists real-time recent transactions; renders clean empty state when `transactions.length === 0`.

### 2. Fund Wallet Experience (`/wallet/fund`)
- **Flow**:
  1. User enters desired NGN funding amount.
  2. Input validation confirms amount meets system limits (`min: ₦100.00`).
  3. POST request sent to `/api/payments/initiate`.
  4. Backend creates `payment_sessions` record and returns Squad checkout URL.
  5. User is redirected to Squad Gateway.
  6. Upon completion and Squad webhook verification, backend updates wallet and triggers UI refresh.

### 3. Transfer Money (P2P Transfer) View (`/wallet/transfer`)
- **Flow**:
  1. User inputs recipient email, phone, or Wallet Number (`SL100000001`).
  2. Live recipient lookup verifies existence and fetches verified recipient name.
  3. User enters amount and description.
  4. User confirms transaction in confirmation overlay.
  5. POST request sent to `/api/wallet/transfer` (executing server-side atomic Firestore transaction).
  6. Result displayed; receipt view made available.

### 4. Transaction History View (`/wallet/transactions`)
- Live paginated data fetching with support for:
  - Date filtering
  - Transaction type filter (`Funding`, `Transfer`, `Airtime`, `Data`, `Electricity`, `Cable TV`, `Refunds`)
  - Status filter (`Successful`, `Pending`, `Failed`, `Reversed`)
  - Search by reference ID or description.
- Detail Modal: Shows full backend transaction payload including references, provider, balance before/after, and net amounts.

### 5. Notifications Drawer (`/notifications`)
- Retrieves live notifications from `/api/notifications`.
- Displays real-time title, message, timestamp, and read status.
- Renders empty state when user has no notifications.

### 6. Wallet Settings & Support (`/wallet/settings`)
- Displays live linked user information, wallet number, wallet state (`ACTIVE`, `FROZEN`, `SUSPENDED`), and support options for payment dispute submission.

---

## 3. UI State Matrix

| State | UI Representation |
| :--- | :--- |
| **Loading State** | Shimmer skeleton cards for balances and transaction rows during data fetches. |
| **Empty State** | Explicit, friendly empty illustrations/messages (e.g., *"No transactions yet. Fund your wallet to get started"*). No fake rows. |
| **Error State** | Contextual alert toast / banner with retry button. |
| **Success State** | Transaction receipt modal with shareable reference ID and immediate wallet balance refresh. |

