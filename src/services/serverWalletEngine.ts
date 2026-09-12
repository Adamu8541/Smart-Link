/**
 * Server Wallet Engine - Core Payment & Wallet Service Module
 * Handles atomic balance updates, wallet validation, hold/release, reversals, and transaction logging.
 */

import { walletsStore, WalletDbRecord } from "./walletsStore";
import * as usersStore from "./usersStore";

export type { WalletDbRecord };

export interface WalletTxRecord {
  id: string;
  transactionId: string;
  reference: string;
  userId: string;
  userEmail?: string;
  serviceName: string;
  amount: number;
  fee?: number;
  walletBalanceBefore: number;
  walletBalanceAfter: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REVERSED";
  provider: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  type?: string;
  recipientDetails?: string;
  idempotencyKey?: string;
  currency?: "NGN";
  providerReference?: string;
  rawResponse?: any;
  token?: string;
  units?: string;
  pins?: string;
}

export interface WalletEngineValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: "INSUFFICIENT_BALANCE" | "WALLET_NOT_FOUND" | "WALLET_SUSPENDED" | "SERVER_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
  wallet?: WalletDbRecord;
  availableBalance?: number;
}

export class ServerWalletEngine {
  /**
   * Gets or initializes user wallet in DB. Syncs currentBalance with user.walletBalance.
   */
  static async getOrCreateWallet(db: any, userId: string): Promise<WalletDbRecord | null> {
    if (!userId) return null;

    let wallet = await walletsStore.getWalletByUserId(userId);
    const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
    const now = new Date().toISOString();

    if (!wallet) {
      if (!user) return null;
      const initialBal = typeof user.walletBalance === "number" && !isNaN(user.walletBalance) ? user.walletBalance : 0.0;
      const newWallet: WalletDbRecord = {
        userId: user.uid || userId,
        walletId: `wal_${userId}`,
        balance: initialBal,
        currentBalance: initialBal,
        heldBalance: 0.0,
        totalCredits: initialBal,
        totalDebits: 0.0,
        status: user.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
        walletStatus: user.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
        currency: "NGN",
        updatedAt: now,
        lastUpdated: now,
        createdAt: user.createdAt || now,
      };
      wallet = await walletsStore.createWallet(newWallet);
    } else {
      if (!wallet.walletId) wallet.walletId = `wal_${userId}`;
      if (typeof wallet.balance !== "number" || isNaN(wallet.balance)) {
        wallet.balance = typeof wallet.currentBalance === "number" && !isNaN(wallet.currentBalance) ? wallet.currentBalance : 0.0;
      }
      wallet.currentBalance = wallet.balance;
      if (typeof wallet.heldBalance !== "number" || isNaN(wallet.heldBalance)) wallet.heldBalance = 0.0;
      if (typeof wallet.totalCredits !== "number") wallet.totalCredits = wallet.balance;
      if (typeof wallet.totalDebits !== "number") wallet.totalDebits = 0.0;
      if (!wallet.status) wallet.status = wallet.walletStatus || "ACTIVE";
      wallet.walletStatus = wallet.status;
      wallet.currency = "NGN";
      if (!wallet.createdAt) wallet.createdAt = now;
      if (!wallet.updatedAt) wallet.updatedAt = wallet.lastUpdated || now;
      wallet.lastUpdated = wallet.updatedAt;

      if (user && user.walletBalance !== wallet.balance) {
        user.walletBalance = wallet.balance;
        await usersStore.updateUser(userId, { walletBalance: wallet.balance }).catch(() => {});
      }
    }

    return wallet;
  }

  /**
   * Validate wallet before performing a debit or purchase operation
   */
  static async validateWalletForPurchase(db: any, userId: string, amountRequired: number): Promise<WalletEngineValidationResult> {
    try {
      if (!userId) {
        return { valid: false, error: "User ID is required for wallet validation.", errorCode: "WALLET_NOT_FOUND" };
      }
      const amt = parseFloat(String(amountRequired));
      if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
        return { valid: false, error: "Invalid purchase amount requested.", errorCode: "SERVER_ERROR" };
      }

      const wallet = await this.getOrCreateWallet(db, userId);
      if (!wallet) {
        return { valid: false, error: "Wallet not found for user.", errorCode: "WALLET_NOT_FOUND" };
      }

      if (wallet.status !== "ACTIVE" && wallet.walletStatus !== "ACTIVE") {
        return { valid: false, error: "Your wallet is currently suspended or locked.", errorCode: "WALLET_SUSPENDED", wallet };
      }

      const balance = wallet.balance || 0;
      const held = wallet.heldBalance || 0;
      const available = balance - held;

      if (available < amt) {
        return {
          valid: false,
          error: `Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Required: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
          errorCode: "INSUFFICIENT_BALANCE",
          wallet,
          availableBalance: available,
        };
      }

      return { valid: true, wallet, availableBalance: available };
    } catch (err: any) {
      return { valid: false, error: err?.message || "Server error during wallet validation.", errorCode: "SERVER_ERROR" };
    }
  }

  /**
   * Atomically credit user wallet and record transaction log.
   */
  static async creditWallet(db: any, params: {
    userId: string;
    amount: number;
    serviceName?: string;
    reference?: string;
    provider?: string;
    description?: string;
    recipientDetails?: string;
    type?: string;
    idempotencyKey?: string;
    fee?: number;
  }) {
    const { userId, amount, serviceName, reference, provider = "SmartLink System", description, recipientDetails, type, idempotencyKey, fee = 0 } = params;
    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      throw new Error("Invalid credit amount. Amount must be a positive number greater than zero.");
    }

    const ref = reference || idempotencyKey || "SML-CRD-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const allTxs = (db?.transactions || []).concat(db?.wallet_transactions || []);
    const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));
    if (existingTx) {
      throw new Error(`Duplicate transaction reference detected (${ref}). Credit operation already processed.`);
    }

    const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found.");
    if (wallet.status !== "ACTIVE") throw new Error("Wallet is suspended or locked.");

    const balanceBefore = wallet.balance;
    const newBal = wallet.balance + amt;

    wallet.balance = newBal;
    wallet.currentBalance = newBal;
    wallet.totalCredits = (wallet.totalCredits || 0) + amt;
    wallet.updatedAt = now;
    await walletsStore.updateWallet(wallet);

    if (user) {
      user.walletBalance = newBal;
      await usersStore.updateUser(userId, { walletBalance: newBal }).catch(() => {});
    }

    const txResult: WalletTxRecord = {
      id: txId,
      transactionId: txId,
      reference: ref,
      userId,
      userEmail: user?.email || "",
      serviceName: serviceName || "Wallet Top-up",
      amount: amt,
      currency: "NGN",
      fee,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: newBal,
      status: "SUCCESS",
      provider,
      description: description || `Wallet Credited ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })} via ${serviceName}`,
      createdAt: now,
      updatedAt: now,
      recipientDetails,
      type: type || "WALLET_FUNDING",
      idempotencyKey,
    };

    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) db.transactions.push(txResult);
      if (!db.wallet_transactions) db.wallet_transactions = [];
      if (!db.wallet_transactions.some((t: any) => t.id === txId)) db.wallet_transactions.push(txResult);

      if (db.wallets) {
        const idx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (idx !== -1) db.wallets[idx] = { ...db.wallets[idx], ...wallet };
        else db.wallets.push(wallet);
      }
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId || u.id === userId);
        if (uIdx !== -1) db.users[uIdx].walletBalance = newBal;
      }
    }

    return {
      success: true,
      wallet: {
        userId: wallet.userId,
        walletId: wallet.walletId,
        balance: wallet.balance,
        currentBalance: wallet.balance,
        heldBalance: wallet.heldBalance || 0.0,
        currency: "NGN",
        status: wallet.status,
        walletStatus: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        lastUpdated: wallet.updatedAt,
      },
      transaction: txResult,
    };
  }

  /**
   * Atomically debit user wallet and record transaction log.
   */
  static async debitWallet(db: any, params: {
    userId: string;
    amount: number;
    serviceName?: string;
    reference?: string;
    provider?: string;
    description?: string;
    recipientDetails?: string;
    type?: string;
    idempotencyKey?: string;
    providerReference?: string;
    rawResponse?: any;
    token?: string;
    units?: string;
    pins?: string;
    fee?: number;
  }) {
    const { userId, amount, serviceName, reference, provider = "SmartLink System", description, recipientDetails, type, idempotencyKey, providerReference, rawResponse, token, units, pins, fee = 0 } = params;
    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      throw new Error("Invalid debit amount. Amount must be a positive number greater than zero.");
    }

    const ref = reference || idempotencyKey || "SML-DBT-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const allTxs = (db?.transactions || []).concat(db?.wallet_transactions || []);
    const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));
    if (existingTx) {
      throw new Error(`Duplicate transaction reference detected (${ref}). Debit operation already processed.`);
    }

    const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet account not found.");
    if (wallet.status !== "ACTIVE") throw new Error("Wallet is suspended or locked.");

    const balanceBefore = wallet.balance;
    const held = wallet.heldBalance || 0;
    const available = balanceBefore - held;

    if (available < amt) {
      throw new Error(`Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Requested Debit: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`);
    }

    const newBal = wallet.balance - amt;
    wallet.balance = newBal;
    wallet.currentBalance = newBal;
    wallet.totalDebits = (wallet.totalDebits || 0) + amt;
    wallet.updatedAt = now;
    await walletsStore.updateWallet(wallet);

    if (user) {
      user.walletBalance = newBal;
      await usersStore.updateUser(userId, { walletBalance: newBal }).catch(() => {});
    }

    const txResult: WalletTxRecord = {
      id: txId,
      transactionId: txId,
      reference: ref,
      userId,
      userEmail: user?.email || "",
      serviceName: serviceName || "Service Payment",
      amount: amt,
      currency: "NGN",
      fee,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: newBal,
      status: "SUCCESS",
      provider,
      description: description || `Payment for ${serviceName}`,
      createdAt: now,
      updatedAt: now,
      recipientDetails,
      type: type || "SERVICE_PAYMENT",
      idempotencyKey,
      providerReference,
      rawResponse,
      token,
      units,
      pins,
    };

    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) db.transactions.push(txResult);
      if (!db.wallet_transactions) db.wallet_transactions = [];
      if (!db.wallet_transactions.some((t: any) => t.id === txId)) db.wallet_transactions.push(txResult);

      if (db.wallets) {
        const idx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (idx !== -1) db.wallets[idx] = { ...db.wallets[idx], ...wallet };
        else db.wallets.push(wallet);
      }
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId || u.id === userId);
        if (uIdx !== -1) db.users[uIdx].walletBalance = newBal;
      }
    }

    return {
      success: true,
      wallet: {
        userId: wallet.userId,
        walletId: wallet.walletId,
        balance: wallet.balance,
        currentBalance: wallet.balance,
        heldBalance: wallet.heldBalance || 0.0,
        currency: "NGN",
        status: wallet.status,
        walletStatus: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        lastUpdated: wallet.updatedAt,
      },
      transaction: txResult,
    };
  }

  /**
   * Place a temporary hold on wallet balance before asynchronous processing.
   */
  static async holdWalletBalance(db: any, params: {
    userId: string;
    amount: number;
    serviceName: string;
    reference?: string;
    provider?: string;
    description?: string;
  }) {
    const { userId, amount, serviceName, reference, provider = "SmartLink Escrow Engine", description } = params;
    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      throw new Error("Invalid hold amount.");
    }

    const ref = reference || "SML-HLD-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = wallet.balance;
    const held = wallet.heldBalance || 0;
    const available = balanceBefore - held;
    if (available < amt) {
      throw new Error(`Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Required Hold: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`);
    }

    wallet.heldBalance = held + amt;
    wallet.updatedAt = now;
    await walletsStore.updateWallet(wallet);

    const txResult: WalletTxRecord = {
      id: txId,
      transactionId: txId,
      reference: ref,
      userId,
      userEmail: user?.email || "",
      serviceName,
      amount: amt,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: balanceBefore,
      status: "PENDING",
      provider,
      description: description || `Held ₦${amt.toLocaleString()} for ${serviceName}`,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) db.transactions.push(txResult);
      if (db.wallets) {
        const wIdx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (wIdx !== -1) db.wallets[wIdx] = { ...db.wallets[wIdx], ...wallet };
      }
    }

    return { wallet, transaction: txResult };
  }

  /**
   * Release held balance (either commit debit on success or unhold on failure).
   */
  static async releaseHeldBalance(db: any, params: {
    userId: string;
    reference?: string;
    transactionId?: string;
    commitDebit: boolean;
  }) {
    const { userId, reference, transactionId, commitDebit } = params;
    const now = new Date().toISOString();

    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found");

    if (!db?.transactions) db.transactions = [];
    const txIndex = db.transactions.findIndex(
      (t: any) => (transactionId && (t.transactionId === transactionId || t.id === transactionId)) ||
                  (reference && t.reference === reference)
    );

    if (txIndex === -1) throw new Error("Held transaction record not found");

    const tx = db.transactions[txIndex];
    const amt = tx.amount;
    const balanceBefore = wallet.balance;
    const newHeld = Math.max(0, (wallet.heldBalance || 0) - amt);

    if (commitDebit) {
      const newBal = wallet.balance - amt;
      wallet.heldBalance = newHeld;
      wallet.balance = newBal;
      wallet.currentBalance = newBal;
      wallet.totalDebits = (wallet.totalDebits || 0) + amt;
      wallet.updatedAt = now;

      const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
      if (user) {
        user.walletBalance = newBal;
        await usersStore.updateUser(userId, { walletBalance: newBal }).catch(() => {});
      }

      tx.status = "SUCCESS";
      tx.walletBalanceBefore = balanceBefore;
      tx.walletBalanceAfter = newBal;
    } else {
      wallet.heldBalance = newHeld;
      tx.status = "FAILED";
    }

    tx.updatedAt = now;
    await walletsStore.updateWallet(wallet);

    return { wallet, transaction: tx };
  }

  /**
   * Reverse a completed transaction safely.
   */
  static async reverseTransaction(db: any, params: {
    userId: string;
    transactionId: string;
    reason?: string;
  }) {
    const { userId, transactionId, reason } = params;
    const now = new Date().toISOString();

    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found");

    if (!db?.transactions) db.transactions = [];
    const txIndex = db.transactions.findIndex(
      (t: any) => (t.transactionId === transactionId || t.id === transactionId) && t.userId === userId
    );

    if (txIndex === -1) throw new Error("Transaction record not found for reversal");

    const origTx = db.transactions[txIndex];
    if (origTx.status === "REVERSED") {
      throw new Error("Transaction has already been reversed");
    }

    const amt = origTx.amount;
    const balanceBefore = wallet.balance;
    const newBal = wallet.balance + amt;

    wallet.balance = newBal;
    wallet.currentBalance = newBal;
    wallet.totalDebits = Math.max(0, (wallet.totalDebits || 0) - amt);
    wallet.updatedAt = now;
    await walletsStore.updateWallet(wallet);

    const user = (await usersStore.getUserByUid(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId || u.id === userId) : null);
    if (user) {
      user.walletBalance = newBal;
      await usersStore.updateUser(userId, { walletBalance: newBal }).catch(() => {});
    }

    origTx.status = "REVERSED";
    origTx.updatedAt = now;

    const revRef = "SML-REV-" + transactionId;
    const revId = "tx_rev_" + Math.random().toString(36).substring(2, 9);

    const revTxResult: WalletTxRecord = {
      id: revId,
      transactionId: revId,
      reference: revRef,
      userId,
      userEmail: user?.email || "",
      serviceName: `Reversal: ${origTx.serviceName || origTx.description}`,
      amount: amt,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: newBal,
      status: "SUCCESS",
      provider: "SmartLink Refund Engine",
      description: `Reversal for Tx #${origTx.reference}. Reason: ${reason || "Service reversal"}`,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      if (!db.transactions) db.transactions = [];
      const idx = db.transactions.findIndex((t: any) => t.id === transactionId || t.transactionId === transactionId);
      if (idx !== -1) db.transactions[idx] = { ...db.transactions[idx], ...origTx };
      if (!db.transactions.some((t: any) => t.id === revTxResult.id)) db.transactions.push(revTxResult);

      if (db.wallets) {
        const wIdx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (wIdx !== -1) db.wallets[wIdx] = { ...db.wallets[wIdx], ...wallet };
      }
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId || u.id === userId);
        if (uIdx !== -1) db.users[uIdx].walletBalance = newBal;
      }
    }

    return {
      wallet,
      originalTransaction: origTx,
      reversalTransaction: revTxResult,
    };
  }

  /**
   * Fetch transaction history for a user.
   */
  static getTransactionHistory(db: any, userId: string, filters?: { limit?: number; offset?: number; type?: string; status?: string }) {
    if (!db?.transactions) return [];

    let txs = db.transactions.filter((tx: any) => tx.userId === userId);

    if (filters?.status) txs = txs.filter((tx: any) => tx.status === filters.status);
    if (filters?.type) txs = txs.filter((tx: any) => tx.type === filters.type || tx.serviceName === filters.type);

    txs.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    if (filters?.limit) {
      const offset = filters.offset || 0;
      txs = txs.slice(offset, offset + filters.limit);
    }

    return txs.map((t: any) => ({
      transactionId: t.transactionId || t.id,
      id: t.id || t.transactionId,
      reference: t.reference,
      userId: t.userId,
      userEmail: t.userEmail,
      serviceName: t.serviceName || t.description || t.type,
      amount: t.amount,
      fee: t.fee || 0,
      walletBalanceBefore: t.walletBalanceBefore ?? t.amount,
      walletBalanceAfter: t.walletBalanceAfter ?? t.amount,
      status: t.status,
      provider: t.provider || "SmartLink",
      description: t.description,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt || t.createdAt,
      type: t.type,
      recipientDetails: t.recipientDetails,
    }));
  }

  /**
   * Get wallet balance for a user.
   */
  static async getWalletBalance(db: any, userId: string) {
    if (!userId) return { error: "User ID required" };
    const wallet = (db.wallets || []).find((w: any) => w.userId === userId || w.uid === userId || w.id === userId);
    if (wallet) {
      return {
        balance: wallet.balance ?? wallet.walletBalance ?? 0,
        currency: wallet.currency || "NGN",
        userId: wallet.userId || userId,
        updatedAt: wallet.updatedAt || new Date().toISOString(),
      };
    }
    const user = (db.users || []).find((u: any) => u.uid === userId || u.id === userId);
    if (user) {
      return {
        balance: user.walletBalance ?? user.balance ?? 0,
        currency: "NGN",
        userId: user.uid || user.id || userId,
        updatedAt: user.updatedAt || new Date().toISOString(),
      };
    }
    return { balance: 0, currency: "NGN", userId };
  }

  /**
   * Validate wallet balance for a purchase amount.
   */
  static async validateWallet(db: any, userId: string, amount: number) {
    const balInfo = await ServerWalletEngine.getWalletBalance(db, userId);
    const balance = balInfo.balance || 0;
    if (balance >= amount) {
      return { valid: true, balance, required: amount };
    }
    return { valid: false, balance, required: amount, message: "Insufficient wallet balance." };
  }
}
