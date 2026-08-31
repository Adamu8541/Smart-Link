/**
 * Server Wallet Engine - Core Payment & Wallet Service Module
 * Handles atomic balance updates, wallet validation, hold/release, reversals, and transaction logging.
 */

import { walletsStore, WalletDbRecord } from "./walletsStore";
import * as usersStore from "./usersStore";
import { saveDocToFirestore } from "./firestoreStore";
import { getAdminFirestore } from "./firebaseAdmin";

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
        await usersStore.updateUser(userId, { walletBalance: wallet.balance }).catch(() => {});
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

    const ref = reference || idempotencyKey || "SML-CRD-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const fsDb = getAdminFirestore();
    let walletResult: WalletDbRecord;
    let txResult: WalletTxRecord;

    if (fsDb) {
      // Execute as one atomic Firestore Transaction
      await fsDb.runTransaction(async (transaction) => {
        // 1. Uniqueness check / Idempotency key lookup
        const idempotencyRef = fsDb.collection("idempotency_keys").doc(ref);
        const idempotencySnap = await transaction.get(idempotencyRef);
        if (idempotencySnap.exists) {
          throw new Error(`Duplicate transaction reference detected (${ref}). Credit operation already processed.`);
        }

        // 2. Fetch user to verify they exist and get email
        const userRef = fsDb.collection("users").doc(userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User account not found.");
        }
        const userData = userSnap.data() || {};
        if (userData.status === "SUSPENDED" || userData.status === "LOCKED") {
          throw new Error("User account is suspended or locked. Transaction denied.");
        }

        // 3. Fetch wallet to modify
        const walletRef = fsDb.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        
        let currentWallet: WalletDbRecord;
        if (!walletSnap.exists) {
          const initialBal = typeof userData.walletBalance === "number" && !isNaN(userData.walletBalance) ? userData.walletBalance : 0.0;
          currentWallet = {
            userId,
            walletId: `wal_${userId}`,
            balance: initialBal,
            currentBalance: initialBal,
            heldBalance: 0.0,
            totalCredits: initialBal,
            totalDebits: 0.0,
            status: "ACTIVE",
            walletStatus: "ACTIVE",
            currency: "NGN",
            updatedAt: now,
            lastUpdated: now,
            createdAt: userData.createdAt || now,
          };
        } else {
          currentWallet = walletSnap.data() as WalletDbRecord;
        }

        // Keep status server-governed only
        if (currentWallet.status !== "ACTIVE" || currentWallet.walletStatus !== "ACTIVE") {
          throw new Error("Wallet is currently suspended or locked. Transaction denied.");
        }

        const balanceBefore = currentWallet.balance || 0;
        const newBalance = balanceBefore + amt;

        // Construct updated wallet object
        const updatedWallet: WalletDbRecord = {
          ...currentWallet,
          balance: newBalance,
          currentBalance: newBalance,
          totalCredits: (currentWallet.totalCredits || 0) + amt,
          updatedAt: now,
          lastUpdated: now,
        };

        // Construct transaction record
        const tx: WalletTxRecord = {
          id: txId,
          transactionId: txId,
          reference: ref,
          userId,
          userEmail: userData.email || "",
          serviceName: serviceName || "Wallet Top-up",
          amount: amt,
          currency: "NGN",
          fee,
          walletBalanceBefore: balanceBefore,
          walletBalanceAfter: newBalance,
          status: "SUCCESS",
          provider,
          description: description || `Wallet Credited ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })} via ${serviceName}`,
          createdAt: now,
          updatedAt: now,
          recipientDetails,
          type: type || "WALLET_FUNDING",
          idempotencyKey,
        };

        // 4. Perform atomic writes
        transaction.set(idempotencyRef, { processedAt: now, userId, amount: amt, txId });
        transaction.set(walletRef, JSON.parse(JSON.stringify(updatedWallet)), { merge: true });
        transaction.set(userRef, { walletBalance: newBalance }, { merge: true });
        
        const txRef = fsDb.collection("transactions").doc(txId);
        transaction.set(txRef, JSON.parse(JSON.stringify(tx)));

        walletResult = updatedWallet;
        txResult = tx;
      });
    } else {
      // Local fallback for memory DB environment (just in case)
      const allTxs = (db.transactions || []).concat(db.wallet_transactions || []);
      const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));
      if (existingTx) {
        throw new Error(`Duplicate transaction reference detected (${ref}). Credit operation already processed.`);
      }

      const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
      const wallet = await this.getOrCreateWallet(db, userId);
      if (!wallet) throw new Error("Wallet not found.");
      if (wallet.status !== "ACTIVE") throw new Error("Wallet is suspended or locked.");

      const balanceBefore = wallet.balance;
      const newBal = wallet.balance + amt;

      wallet.balance = newBal;
      wallet.currentBalance = newBal;
      wallet.totalCredits = (wallet.totalCredits || 0) + amt;
      wallet.updatedAt = now;

      if (user) {
        user.walletBalance = newBal;
      }

      txResult = {
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

      walletResult = wallet;
    }

    // Sync to in-memory/JSON DB to prevent split-brain state
    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) {
        db.transactions.push(txResult);
      }
      if (!db.wallet_transactions) db.wallet_transactions = [];
      if (!db.wallet_transactions.some((t: any) => t.id === txId)) {
        db.wallet_transactions.push(txResult);
      }

      // Sync wallet inside local db
      if (db.wallets) {
        const idx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (idx !== -1) {
          db.wallets[idx] = { ...db.wallets[idx], ...walletResult };
        } else {
          db.wallets.push(walletResult);
        }
      }
      // Sync user inside local db
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId);
        if (uIdx !== -1) {
          db.users[uIdx].walletBalance = walletResult.balance;
        }
      }
    }

    return {
      success: true,
      wallet: {
        userId: walletResult.userId,
        walletId: walletResult.walletId,
        balance: walletResult.balance,
        currentBalance: walletResult.balance,
        heldBalance: walletResult.heldBalance || 0.0,
        currency: "NGN",
        status: walletResult.status,
        walletStatus: walletResult.status,
        createdAt: walletResult.createdAt,
        updatedAt: walletResult.updatedAt,
        lastUpdated: walletResult.updatedAt,
      },
      transaction: txResult,
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

    const ref = reference || idempotencyKey || "SML-DBT-" + Math.floor(100000 + Math.random() * 900000);
    const txId = "tx_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const fsDb = getAdminFirestore();
    let walletResult: WalletDbRecord;
    let txResult: WalletTxRecord;

    if (fsDb) {
      await fsDb.runTransaction(async (transaction) => {
        // 1. Uniqueness check / Idempotency key lookup
        const idempotencyRef = fsDb.collection("idempotency_keys").doc(ref);
        const idempotencySnap = await transaction.get(idempotencyRef);
        if (idempotencySnap.exists) {
          throw new Error(`Duplicate transaction reference detected (${ref}). Debit operation already processed.`);
        }

        // 2. Fetch user to verify status
        const userRef = fsDb.collection("users").doc(userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User account not found.");
        }
        const userData = userSnap.data() || {};
        if (userData.status === "SUSPENDED" || userData.status === "LOCKED") {
          throw new Error("User account is suspended or locked. Transaction denied.");
        }

        // 3. Fetch wallet to verify balance & status
        const walletRef = fsDb.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists) {
          throw new Error("Wallet account not found.");
        }

        const currentWallet = walletSnap.data() as WalletDbRecord;
        if (currentWallet.status !== "ACTIVE" || currentWallet.walletStatus !== "ACTIVE") {
          throw new Error("Wallet is currently suspended or locked. Transaction denied.");
        }

        const balanceBefore = currentWallet.balance || 0;
        const held = currentWallet.heldBalance || 0;
        const available = balanceBefore - held;

        if (available < amt) {
          throw new Error(`Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Requested Debit: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`);
        }

        const newBalance = balanceBefore - amt;

        // Construct updated wallet
        const updatedWallet: WalletDbRecord = {
          ...currentWallet,
          balance: newBalance,
          currentBalance: newBalance,
          totalDebits: (currentWallet.totalDebits || 0) + amt,
          updatedAt: now,
          lastUpdated: now,
        };

        // Construct transaction record
        const tx: WalletTxRecord = {
          id: txId,
          transactionId: txId,
          reference: ref,
          userId,
          userEmail: userData.email || "",
          serviceName: serviceName || "Service Payment",
          amount: amt,
          currency: "NGN",
          fee,
          walletBalanceBefore: balanceBefore,
          walletBalanceAfter: newBalance,
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

        // 4. Write atomically inside transaction
        transaction.set(idempotencyRef, { processedAt: now, userId, amount: amt, txId });
        transaction.set(walletRef, JSON.parse(JSON.stringify(updatedWallet)), { merge: true });
        transaction.set(userRef, { walletBalance: newBalance }, { merge: true });

        const txRef = fsDb.collection("transactions").doc(txId);
        transaction.set(txRef, JSON.parse(JSON.stringify(tx)));

        walletResult = updatedWallet;
        txResult = tx;
      });
    } else {
      // Local fallback for memory DB environment
      const allTxs = (db.transactions || []).concat(db.wallet_transactions || []);
      const existingTx = allTxs.find((t: any) => (t.reference && t.reference === ref) || (idempotencyKey && t.idempotencyKey === idempotencyKey));
      if (existingTx) {
        throw new Error(`Duplicate transaction reference detected (${ref}). Debit operation already processed.`);
      }

      const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
      const wallet = await this.getOrCreateWallet(db, userId);
      if (!wallet) throw new Error("Wallet not found.");
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

      if (user) {
        user.walletBalance = newBal;
      }

      txResult = {
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

      walletResult = wallet;
    }

    // Sync to local memory DB
    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) {
        db.transactions.push(txResult);
      }
      if (!db.wallet_transactions) db.wallet_transactions = [];
      if (!db.wallet_transactions.some((t: any) => t.id === txId)) {
        db.wallet_transactions.push(txResult);
      }

      // Sync wallet
      if (db.wallets) {
        const idx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (idx !== -1) {
          db.wallets[idx] = { ...db.wallets[idx], ...walletResult };
        } else {
          db.wallets.push(walletResult);
        }
      }
      // Sync user
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId);
        if (uIdx !== -1) {
          db.users[uIdx].walletBalance = walletResult.balance;
        }
      }
    }

    return {
      success: true,
      wallet: {
        userId: walletResult.userId,
        walletId: walletResult.walletId,
        balance: walletResult.balance,
        currentBalance: walletResult.balance,
        heldBalance: walletResult.heldBalance || 0.0,
        currency: "NGN",
        status: walletResult.status,
        walletStatus: walletResult.status,
        createdAt: walletResult.createdAt,
        updatedAt: walletResult.updatedAt,
        lastUpdated: walletResult.updatedAt,
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

    const fsDb = getAdminFirestore();
    let walletResult: WalletDbRecord;
    let txResult: WalletTxRecord;

    if (fsDb) {
      await fsDb.runTransaction(async (transaction) => {
        // Uniqueness check / Idempotency
        const idempotencyRef = fsDb.collection("idempotency_keys").doc(ref);
        const idempotencySnap = await transaction.get(idempotencyRef);
        if (idempotencySnap.exists) {
          throw new Error(`Duplicate hold reference detected (${ref}).`);
        }

        const userRef = fsDb.collection("users").doc(userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User account not found.");
        }
        const userData = userSnap.data() || {};
        if (userData.status === "SUSPENDED" || userData.status === "LOCKED") {
          throw new Error("User account is suspended or locked. Hold denied.");
        }

        const walletRef = fsDb.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists) {
          throw new Error("Wallet not found.");
        }

        const currentWallet = walletSnap.data() as WalletDbRecord;
        if (currentWallet.status !== "ACTIVE" || currentWallet.walletStatus !== "ACTIVE") {
          throw new Error("Wallet is suspended or locked. Hold denied.");
        }

        const balanceBefore = currentWallet.balance || 0;
        const held = currentWallet.heldBalance || 0;
        const available = balanceBefore - held;

        if (available < amt) {
          throw new Error(`Insufficient wallet balance. Available: ₦${available.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Required Hold: ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`);
        }

        const updatedWallet: WalletDbRecord = {
          ...currentWallet,
          heldBalance: held + amt,
          updatedAt: now,
          lastUpdated: now,
        };

        const tx: WalletTxRecord = {
          id: txId,
          transactionId: txId,
          reference: ref,
          userId,
          userEmail: userData.email || "",
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

        transaction.set(idempotencyRef, { processedAt: now, userId, amount: amt, txId });
        transaction.set(walletRef, JSON.parse(JSON.stringify(updatedWallet)), { merge: true });
        
        const txRef = fsDb.collection("transactions").doc(txId);
        transaction.set(txRef, JSON.parse(JSON.stringify(tx)));

        walletResult = updatedWallet;
        txResult = tx;
      });
    } else {
      // Local memory fallback
      const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
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

      txResult = {
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

      walletResult = wallet;
    }

    // Sync to in-memory/JSON DB to prevent split-brain state
    if (db) {
      if (!db.transactions) db.transactions = [];
      if (!db.transactions.some((t: any) => t.id === txId)) {
        db.transactions.push(txResult);
      }
      if (db.wallets) {
        const wIdx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (wIdx !== -1) {
          db.wallets[wIdx] = { ...db.wallets[wIdx], ...walletResult };
        }
      }
    }

    return {
      wallet: walletResult,
      transaction: txResult,
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
    const now = new Date().toISOString();

    const fsDb = getAdminFirestore();
    let walletResult: WalletDbRecord;
    let txResult: WalletTxRecord;

    if (fsDb) {
      await fsDb.runTransaction(async (transaction) => {
        // 1. Resolve transaction ID / reference
        let txId = transactionId;
        if (!txId && reference) {
          const localTx = db.transactions?.find((t: any) => t.reference === reference);
          if (localTx) {
            txId = localTx.id || localTx.transactionId;
          }
        }

        if (!txId) {
          throw new Error("Transaction ID or Reference is required to release hold");
        }

        const txRef = fsDb.collection("transactions").doc(txId);
        const txSnap = await transaction.get(txRef);
        if (!txSnap.exists) {
          throw new Error("Held transaction record not found in Firestore");
        }

        const tx = txSnap.data() as WalletTxRecord;
        if (tx.status !== "PENDING") {
          throw new Error("Transaction hold already released or processed");
        }

        const amt = tx.amount;

        const walletRef = fsDb.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists) {
          throw new Error("Wallet not found");
        }

        const currentWallet = walletSnap.data() as WalletDbRecord;
        const balanceBefore = currentWallet.balance || 0;
        const newHeld = Math.max(0, (currentWallet.heldBalance || 0) - amt);

        let updatedWallet: WalletDbRecord;
        const updatedTx: WalletTxRecord = {
          ...tx,
          status: commitDebit ? "SUCCESS" : "FAILED",
          updatedAt: now,
        };

        if (commitDebit) {
          const newBal = balanceBefore - amt;
          updatedWallet = {
            ...currentWallet,
            heldBalance: newHeld,
            balance: newBal,
            currentBalance: newBal,
            totalDebits: (currentWallet.totalDebits || 0) + amt,
            updatedAt: now,
            lastUpdated: now,
          };
          updatedTx.walletBalanceBefore = balanceBefore;
          updatedTx.walletBalanceAfter = newBal;
          
          const userRef = fsDb.collection("users").doc(userId);
          transaction.set(userRef, { walletBalance: newBal }, { merge: true });
        } else {
          updatedWallet = {
            ...currentWallet,
            heldBalance: newHeld,
            updatedAt: now,
            lastUpdated: now,
          };
        }

        transaction.set(walletRef, JSON.parse(JSON.stringify(updatedWallet)), { merge: true });
        transaction.set(txRef, JSON.parse(JSON.stringify(updatedTx)), { merge: true });

        walletResult = updatedWallet;
        txResult = updatedTx;
      });
    } else {
      // Local fallback
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
      const balanceBefore = wallet.balance;
      const newHeld = Math.max(0, (wallet.heldBalance || 0) - amt);

      if (commitDebit) {
        const newBal = wallet.balance - amt;
        wallet.heldBalance = newHeld;
        wallet.balance = newBal;
        wallet.currentBalance = newBal;
        wallet.totalDebits = (wallet.totalDebits || 0) + amt;
        wallet.updatedAt = now;

        const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
        if (user) user.walletBalance = newBal;

        tx.status = "SUCCESS";
        tx.walletBalanceBefore = balanceBefore;
        tx.walletBalanceAfter = newBal;
      } else {
        wallet.heldBalance = newHeld;
        tx.status = "FAILED";
      }

      tx.updatedAt = now;
      walletResult = wallet;
      txResult = tx;
    }

    // Sync to in-memory/JSON DB to prevent split-brain state
    if (db) {
      if (!db.transactions) db.transactions = [];
      const idx = db.transactions.findIndex((t: any) => t.id === txResult.id || t.transactionId === txResult.transactionId);
      if (idx !== -1) {
        db.transactions[idx] = { ...db.transactions[idx], ...txResult };
      }
      if (db.wallets) {
        const wIdx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (wIdx !== -1) {
          db.wallets[wIdx] = { ...db.wallets[wIdx], ...walletResult };
        }
      }
      if (db.users && commitDebit) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId);
        if (uIdx !== -1) {
          db.users[uIdx].walletBalance = walletResult.balance;
        }
      }
    }

    return {
      wallet: walletResult,
      transaction: txResult,
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
    const now = new Date().toISOString();

    const fsDb = getAdminFirestore();
    let walletResult: WalletDbRecord;
    let origTxResult: WalletTxRecord;
    let revTxResult: WalletTxRecord;

    if (fsDb) {
      await fsDb.runTransaction(async (transaction) => {
        // 1. Fetch original transaction document to reverse
        const txRef = fsDb.collection("transactions").doc(transactionId);
        const txSnap = await transaction.get(txRef);
        if (!txSnap.exists) {
          throw new Error("Transaction record not found for reversal");
        }

        const origTx = txSnap.data() as WalletTxRecord;
        if (origTx.userId !== userId) {
          throw new Error("Unauthorized: Transaction does not belong to user.");
        }
        if (origTx.status === "REVERSED") {
          throw new Error("Transaction has already been reversed");
        }

        const amt = origTx.amount;

        // 2. Uniqueness check for the reversal transaction to prevent duplicate reversal execution
        const revRef = "SML-REV-" + transactionId;
        const idempotencyRef = fsDb.collection("idempotency_keys").doc(revRef);
        const idempotencySnap = await transaction.get(idempotencyRef);
        if (idempotencySnap.exists) {
          throw new Error(`Duplicate transaction reversal detected. Reversal already processed.`);
        }

        // 3. Fetch wallet to modify
        const walletRef = fsDb.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists) {
          throw new Error("Wallet not found");
        }

        const currentWallet = walletSnap.data() as WalletDbRecord;
        const balanceBefore = currentWallet.balance || 0;
        const newBalance = balanceBefore + amt;

        // Construct updated wallet
        const updatedWallet: WalletDbRecord = {
          ...currentWallet,
          balance: newBalance,
          currentBalance: newBalance,
          totalDebits: Math.max(0, (currentWallet.totalDebits || 0) - amt),
          updatedAt: now,
          lastUpdated: now,
        };

        // Update original transaction status to REVERSED
        const updatedOrigTx: WalletTxRecord = {
          ...origTx,
          status: "REVERSED",
          updatedAt: now,
        };

        const revId = "tx_rev_" + Math.random().toString(36).substring(2, 9);
        const revTx: WalletTxRecord = {
          id: revId,
          transactionId: revId,
          reference: revRef,
          userId,
          userEmail: origTx.userEmail || "",
          serviceName: `Reversal: ${origTx.serviceName || origTx.description}`,
          amount: amt,
          walletBalanceBefore: balanceBefore,
          walletBalanceAfter: newBalance,
          status: "SUCCESS",
          provider: "SmartLink Refund Engine",
          description: `Reversal for Tx #${origTx.reference}. Reason: ${reason || "Service reversal"}`,
          createdAt: now,
          updatedAt: now,
        };

        // 4. Perform atomic writes
        transaction.set(idempotencyRef, { processedAt: now, userId, amount: amt, txId: revId });
        transaction.set(walletRef, JSON.parse(JSON.stringify(updatedWallet)), { merge: true });
        transaction.set(txRef, JSON.parse(JSON.stringify(updatedOrigTx)), { merge: true });
        
        const userRef = fsDb.collection("users").doc(userId);
        transaction.set(userRef, { walletBalance: newBalance }, { merge: true });

        const revTxRef = fsDb.collection("transactions").doc(revId);
        transaction.set(revTxRef, JSON.parse(JSON.stringify(revTx)));

        walletResult = updatedWallet;
        origTxResult = updatedOrigTx;
        revTxResult = revTx;
      });
    } else {
      // Local fallback for memory DB environment
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
      const balanceBefore = wallet.balance;
      const newBal = wallet.balance + amt;

      wallet.balance = newBal;
      wallet.currentBalance = newBal;
      wallet.totalDebits = Math.max(0, (wallet.totalDebits || 0) - amt);
      wallet.updatedAt = now;

      const user = (await usersStore.getUserById(userId)) || (db?.users ? db.users.find((u: any) => u.uid === userId) : null);
      if (user) user.walletBalance = newBal;

      origTx.status = "REVERSED";
      origTx.updatedAt = now;

      const revRef = "SML-REV-" + transactionId;
      const revId = "tx_rev_" + Math.random().toString(36).substring(2, 9);

      revTxResult = {
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

      walletResult = wallet;
      origTxResult = origTx;
    }

    // Sync to in-memory/JSON DB to prevent split-brain state
    if (db) {
      if (!db.transactions) db.transactions = [];
      
      // Update original transaction in local list
      const idx = db.transactions.findIndex((t: any) => t.id === transactionId || t.transactionId === transactionId);
      if (idx !== -1) {
        db.transactions[idx] = { ...db.transactions[idx], ...origTxResult };
      }

      // Add reversal transaction
      if (!db.transactions.some((t: any) => t.id === revTxResult.id)) {
        db.transactions.push(revTxResult);
      }

      // Sync wallet inside local db
      if (db.wallets) {
        const wIdx = db.wallets.findIndex((w: any) => w.userId === userId);
        if (wIdx !== -1) {
          db.wallets[wIdx] = { ...db.wallets[wIdx], ...walletResult };
        }
      }
      // Sync user inside local db
      if (db.users) {
        const uIdx = db.users.findIndex((u: any) => u.uid === userId);
        if (uIdx !== -1) {
          db.users[uIdx].walletBalance = walletResult.balance;
        }
      }
    }

    return {
      wallet: walletResult,
      originalTransaction: origTxResult,
      reversalTransaction: revTxResult,
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
