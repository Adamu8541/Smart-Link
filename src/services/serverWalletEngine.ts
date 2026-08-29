/**
 * Server Wallet Engine - Core Payment & Wallet Service Module
 * Handles atomic balance updates, wallet validation, hold/release, reversals, and transaction logging.
 */

import { walletsStore, WalletDbRecord } from "./walletsStore";
import * as usersStore from "./usersStore";
import { saveDocToFirestore } from "./firestoreStore";

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
    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
    const now = new Date().toISOString();

    if (!wallet) {
      if (!user) return null;
      const initialBal = typeof user.walletBalance === "number" && !isNaN(user.walletBalance) ? user.walletBalance : 0.0;
      const newWallet: WalletDbRecord = {
        userId: user.uid,
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
      // Ensure fields are present and valid
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

      // Keep user.walletBalance synchronized
      if (user && user.walletBalance !== wallet.balance) {
        user.walletBalance = wallet.balance;
        usersStore.updateUser(userId, { walletBalance: wallet.balance }).catch(() => {});
      }
    }

    return wallet;
  }

  /**
   * Get wallet balance for a user.
   */
  static async getWalletBalance(db: any, userId: string) {
    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) {
      return {
        error: "Wallet not found",
        errorCode: "WALLET_NOT_FOUND",
      };
    }

    const availableBalance = Math.max(0, wallet.balance - (wallet.heldBalance || 0));

    return {
      userId: wallet.userId,
      walletId: wallet.walletId,
      balance: wallet.balance,
      currentBalance: wallet.balance,
      heldBalance: wallet.heldBalance,
      availableBalance,
      status: wallet.status,
      walletStatus: wallet.status,
      currency: "NGN",
      updatedAt: wallet.updatedAt,
      lastUpdated: wallet.updatedAt,
      createdAt: wallet.createdAt,
    };
  }

  /**
   * Validate wallet status and balance sufficiency before running any service.
   */
  static async validateWallet(db: any, userId: string, amount: number): Promise<WalletEngineValidationResult> {
    if (!userId) {
      return {
        valid: false,
        error: "User authentication required to access wallet.",
        errorCode: "WALLET_NOT_FOUND",
      };
    }

    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
    if (!user) {
      return {
        valid: false,
        error: "User account not found.",
        errorCode: "WALLET_NOT_FOUND",
      };
    }

    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) {
      return {
        valid: false,
        error: "Wallet account not found.",
        errorCode: "WALLET_NOT_FOUND",
      };
    }

    if (wallet.status !== "ACTIVE" || wallet.walletStatus !== "ACTIVE" || user.status === "SUSPENDED" || user.status === "LOCKED") {
      return {
        valid: false,
        error: "Wallet is currently suspended or locked. Transaction denied.",
        errorCode: "WALLET_SUSPENDED",
        wallet,
      };
    }

    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt < 0) {
      return {
        valid: false,
        error: "Invalid payment amount specified.",
        errorCode: "UNKNOWN_ERROR",
        wallet,
      };
    }

    const availableBalance = wallet.balance - (wallet.heldBalance || 0);
    if (availableBalance < amt) {
      return {
        valid: false,
        error: `Insufficient wallet balance. Available: ₦${availableBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Required: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Please fund your wallet.`,
        errorCode: "INSUFFICIENT_BALANCE",
        wallet,
        availableBalance,
      };
    }

    return {
      valid: true,
      wallet,
      availableBalance,
    };
  }

  /**
   * Atomically credit user wallet and log transaction.
   */
  static async creditWallet(db: any, params: {
    userId: string;
    amount: number;
    serviceName: string;
    provider?: string;
    description?: string;
    reference?: string;
    fee?: number;
    recipientDetails?: string;
    type?: string;
    idempotencyKey?: string;
  }) {
    const { userId, amount, serviceName, provider = "SmartLink Wallet Engine", description, reference, fee = 0, recipientDetails, type, idempotencyKey } = params;

    // Validate amount
    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      throw new Error("Invalid credit amount. Amount must be a positive number greater than zero.");
    }

    // Check for duplicate transaction processing / double credit
    const ref = reference || idempotencyKey || "SML-CRD-" + Math.floor(100000 + Math.random() * 900000);
    const allTxs = (db.transactions || []).concat(db.wallet_transactions || []);
    const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));

    if (existingTx) {
      throw new Error(`Duplicate transaction reference detected (${ref}). Credit operation already processed.`);
    }

    const validation = await this.validateWallet(db, userId, 0); // Check user & wallet existence
    if (!validation.wallet) {
      throw new Error(validation.error || "Wallet not found for crediting.");
    }

    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);

    let balanceBefore = validation.wallet.balance;
    const updatedWallet = await walletsStore.updateWalletAtomic(userId, (current) => {
      balanceBefore = current.balance;
      const newBal = current.balance + amt;
      return {
        balance: newBal,
        currentBalance: newBal,
        totalCredits: (current.totalCredits || 0) + amt,
      };
    });

    const wallet = updatedWallet || validation.wallet;
    const now = new Date().toISOString();

    // Sync user.walletBalance
    if (user) {
      user.walletBalance = wallet.balance;
    }
    await usersStore.updateUser(userId, { walletBalance: wallet.balance }).catch(() => {});

    const txId = "tx_" + Math.random().toString(36).substring(2, 9);

    const tx: WalletTxRecord = {
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
      walletBalanceAfter: wallet.balance,
      status: "SUCCESS",
      provider,
      description: description || `Wallet Credited ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })} via ${serviceName}`,
      createdAt: now,
      updatedAt: now,
      recipientDetails,
      type: type || "WALLET_FUNDING",
      idempotencyKey,
    };

    if (!db.transactions) db.transactions = [];
    db.transactions.push(tx);

    if (!db.wallet_transactions) db.wallet_transactions = [];
    db.wallet_transactions.push(tx);

    saveDocToFirestore("transactions", tx.id, tx).catch(() => {});

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
      transaction: tx,
    };
  }

  /**
   * Atomically debit user wallet and log transaction.
   */
  static async debitWallet(db: any, params: {
    userId: string;
    amount: number;
    serviceName: string;
    provider?: string;
    description?: string;
    reference?: string;
    fee?: number;
    recipientDetails?: string;
    type?: string;
    idempotencyKey?: string;
    providerReference?: string;
    rawResponse?: any;
    token?: string;
    units?: string;
    pins?: string;
  }) {
    const {
      userId,
      amount,
      serviceName,
      provider = "SmartLink Payment Engine",
      description,
      reference,
      fee = 0,
      recipientDetails,
      type,
      idempotencyKey,
      providerReference,
      rawResponse,
      token,
      units,
      pins,
    } = params;

    // Validate amount
    const amt = parseFloat(String(amount));
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      throw new Error("Invalid debit amount. Amount must be a positive number greater than zero.");
    }

    // Check for duplicate transaction processing / double debit
    const ref = reference || idempotencyKey || "SML-DBT-" + Math.floor(100000 + Math.random() * 900000);
    const allTxs = (db.transactions || []).concat(db.wallet_transactions || []);
    const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));

    if (existingTx) {
      throw new Error(`Duplicate transaction reference detected (${ref}). Debit operation already processed.`);
    }

    const validation = await this.validateWallet(db, userId, amt);
    if (!validation.valid || !validation.wallet) {
      throw new Error(validation.error || "Wallet validation failed for debit.");
    }

    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);

    let balanceBefore = validation.wallet.balance;
    const updatedWallet = await walletsStore.updateWalletAtomic(userId, (current) => {
      const available = current.balance - (current.heldBalance || 0);
      if (available < amt) {
        throw new Error(`Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Requested Debit: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`);
      }
      balanceBefore = current.balance;
      const newBal = current.balance - amt;
      return {
        balance: newBal,
        currentBalance: newBal,
        totalDebits: (current.totalDebits || 0) + amt,
      };
    });

    const wallet = updatedWallet || validation.wallet;
    const now = new Date().toISOString();

    // Sync user.walletBalance
    if (user) {
      user.walletBalance = wallet.balance;
    }
    await usersStore.updateUser(userId, { walletBalance: wallet.balance }).catch(() => {});

    const txId = "tx_" + Math.random().toString(36).substring(2, 9);

    const tx: WalletTxRecord = {
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
      walletBalanceAfter: wallet.balance,
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

    if (!db.transactions) db.transactions = [];
    db.transactions.push(tx);

    if (!db.wallet_transactions) db.wallet_transactions = [];
    db.wallet_transactions.push(tx);

    saveDocToFirestore("transactions", tx.id, tx).catch(() => {});

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
      transaction: tx,
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

    const validation = await this.validateWallet(db, userId, amount);
    if (!validation.valid || !validation.wallet) {
      throw new Error(validation.error || "Wallet validation failed for hold");
    }

    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
    const amt = parseFloat(String(amount));

    let balanceBefore = validation.wallet.currentBalance;
    const updatedWallet = await walletsStore.updateWalletAtomic(userId, (current) => {
      balanceBefore = current.currentBalance;
      return {
        heldBalance: (current.heldBalance || 0) + amt,
      };
    });

    const wallet = updatedWallet || validation.wallet;
    const ref = reference || "SML-HLD-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const tx: WalletTxRecord = {
      id: txId,
      transactionId: txId,
      reference: ref,
      userId,
      userEmail: user?.email || "",
      serviceName,
      amount: amt,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: balanceBefore, // Net balance unchanged until commit
      status: "PENDING",
      provider,
      description: description || `Held ₦${amt.toLocaleString()} for ${serviceName}`,
      createdAt: now,
      updatedAt: now,
    };

    if (!db.transactions) db.transactions = [];
    db.transactions.push(tx);

    return {
      wallet,
      transaction: tx,
    };
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

    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found");

    if (!db.transactions) db.transactions = [];
    const txIndex = db.transactions.findIndex(
      (t: any) => (transactionId && (t.transactionId === transactionId || t.id === transactionId)) ||
                  (reference && t.reference === reference)
    );

    if (txIndex === -1) throw new Error("Held transaction record not found");

    const tx = db.transactions[txIndex];
    const amt = tx.amount;

    let balanceBefore = wallet.balance;
    const updatedWallet = await walletsStore.updateWalletAtomic(userId, (current) => {
      balanceBefore = current.balance;
      const newHeld = Math.max(0, (current.heldBalance || 0) - amt);
      if (commitDebit) {
        const newBal = current.balance - amt;
        return {
          heldBalance: newHeld,
          balance: newBal,
          currentBalance: newBal,
          totalDebits: (current.totalDebits || 0) + amt,
        };
      }
      return {
        heldBalance: newHeld,
      };
    });

    const finalWallet = updatedWallet || wallet;

    if (commitDebit) {
      const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
      if (user) user.walletBalance = finalWallet.balance;
      await usersStore.updateUser(userId, { walletBalance: finalWallet.balance }).catch(() => {});

      tx.status = "SUCCESS";
      tx.walletBalanceBefore = balanceBefore;
      tx.walletBalanceAfter = finalWallet.balance;
    } else {
      tx.status = "FAILED";
    }

    tx.updatedAt = new Date().toISOString();

    return {
      wallet: finalWallet,
      transaction: tx,
    };
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

    const wallet = await this.getOrCreateWallet(db, userId);
    if (!wallet) throw new Error("Wallet not found");

    if (!db.transactions) db.transactions = [];
    const txIndex = db.transactions.findIndex(
      (t: any) => (t.transactionId === transactionId || t.id === transactionId) && t.userId === userId
    );

    if (txIndex === -1) throw new Error("Transaction record not found for reversal");

    const origTx = db.transactions[txIndex];
    if (origTx.status === "REVERSED") {
      throw new Error("Transaction has already been reversed");
    }

    const amt = origTx.amount;
    let balanceBefore = wallet.balance;

    const updatedWallet = await walletsStore.updateWalletAtomic(userId, (current) => {
      balanceBefore = current.balance;
      const newBal = current.balance + amt;
      return {
        balance: newBal,
        currentBalance: newBal,
        totalDebits: Math.max(0, (current.totalDebits || 0) - amt),
      };
    });

    const finalWallet = updatedWallet || wallet;
    const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
    if (user) user.walletBalance = finalWallet.balance;
    await usersStore.updateUser(userId, { walletBalance: finalWallet.balance }).catch(() => {});

    origTx.status = "REVERSED";
    origTx.updatedAt = new Date().toISOString();

    const revRef = "SML-REV-" + Math.floor(100000 + Math.random() * 900000);
    const revId = "tx_rev_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const revTx: WalletTxRecord = {
      id: revId,
      transactionId: revId,
      reference: revRef,
      userId,
      userEmail: user?.email || "",
      serviceName: `Reversal: ${origTx.serviceName || origTx.description}`,
      amount: amt,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: finalWallet.currentBalance,
      status: "SUCCESS",
      provider: "SmartLink Refund Engine",
      description: `Reversal for Tx #${origTx.reference}. Reason: ${reason || "Service reversal"}`,
      createdAt: now,
      updatedAt: now,
    };

    db.transactions.push(revTx);

    return {
      wallet: finalWallet,
      originalTransaction: origTx,
      reversalTransaction: revTx,
    };
  }

  /**
   * Fetch transaction history for a user.
   */
  static getTransactionHistory(db: any, userId: string, filters?: { limit?: number; offset?: number; type?: string; status?: string }) {
    if (!db.transactions) return [];

    let txs = db.transactions.filter((tx: any) => tx.userId === userId);

    if (filters?.status) {
      txs = txs.filter((tx: any) => tx.status === filters.status);
    }
    if (filters?.type) {
      txs = txs.filter((tx: any) => tx.type === filters.type || tx.serviceName === filters.type);
    }

    // Sort descending by date
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
}
