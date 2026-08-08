/**
 * Client Wallet Service - SmartLink Reusable Frontend Wallet API Client
 *
 * Enforces Wallet Rules:
 * The frontend NEVER directly mutates wallet balance or transaction records.
 * All wallet operations pass through secure backend API endpoints.
 */

import { Wallet, WalletTransaction, WalletValidationResult, WalletErrorCode } from "../types.js";

export interface ServiceExecutionOptions {
  userId: string;
  amount: number;
  serviceName: string;
  provider?: string;
  description?: string;
  reference?: string;
  executeBackendCall: () => Promise<any>;
}

export class WalletService {
  /**
   * Get wallet balance & status for a user.
   */
  static async getWalletBalance(userId: string): Promise<{
    success: boolean;
    wallet?: Wallet;
    error?: string;
    errorCode?: WalletErrorCode;
  }> {
    try {
      if (!userId) {
        return {
          success: false,
          error: "User is not signed in",
          errorCode: "WALLET_NOT_FOUND",
        };
      }

      const response = await fetch(`/api/wallet/balance/${userId}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Failed to retrieve wallet balance",
          errorCode: data.errorCode || "SERVER_ERROR",
        };
      }

      return {
        success: true,
        wallet: data.wallet || data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error connecting to Smart Link Wallet service",
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  /**
   * Validate wallet balance & status before executing any service.
   */
  static async validateWallet(userId: string, amount: number): Promise<WalletValidationResult> {
    try {
      if (!userId) {
        return {
          valid: false,
          error: "Please sign in to your Smart Link account to continue.",
          errorCode: "WALLET_NOT_FOUND",
        };
      }

      const response = await fetch("/api/wallet/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        return {
          valid: false,
          error: data.error || "Wallet validation failed",
          errorCode: data.errorCode || "UNKNOWN_ERROR",
          availableBalance: data.availableBalance,
          wallet: data.wallet,
        };
      }

      return {
        valid: true,
        wallet: data.wallet,
        availableBalance: data.availableBalance,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: "Network failure while validating wallet. Please check connection.",
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  /**
   * Securely credit user wallet via backend API.
   */
  static async creditWallet(params: {
    userId: string;
    amount: number;
    serviceName: string;
    provider?: string;
    description?: string;
    reference?: string;
    fee?: number;
    recipientDetails?: string;
  }): Promise<{
    success: boolean;
    wallet?: Wallet;
    transaction?: WalletTransaction;
    error?: string;
  }> {
    try {
      const response = await fetch("/api/wallet/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Credit transaction failed",
        };
      }

      return {
        success: true,
        wallet: data.wallet,
        transaction: data.transaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error during wallet credit",
      };
    }
  }

  /**
   * Securely debit user wallet via backend API.
   */
  static async debitWallet(params: {
    userId: string;
    amount: number;
    serviceName: string;
    provider?: string;
    description?: string;
    reference?: string;
    fee?: number;
    recipientDetails?: string;
  }): Promise<{
    success: boolean;
    wallet?: Wallet;
    transaction?: WalletTransaction;
    error?: string;
  }> {
    try {
      const response = await fetch("/api/wallet/debit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Debit transaction failed",
        };
      }

      return {
        success: true,
        wallet: data.wallet,
        transaction: data.transaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error during wallet debit",
      };
    }
  }

  /**
   * Hold balance in escrow for processing.
   */
  static async holdWalletBalance(params: {
    userId: string;
    amount: number;
    serviceName: string;
    provider?: string;
    description?: string;
    reference?: string;
  }): Promise<{
    success: boolean;
    wallet?: Wallet;
    transaction?: WalletTransaction;
    error?: string;
  }> {
    try {
      const response = await fetch("/api/wallet/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Failed to hold wallet balance",
        };
      }

      return {
        success: true,
        wallet: data.wallet,
        transaction: data.transaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error during wallet hold",
      };
    }
  }

  /**
   * Release held wallet balance (commit or refund).
   */
  static async releaseHeldBalance(params: {
    userId: string;
    reference?: string;
    transactionId?: string;
    commitDebit: boolean;
  }): Promise<{
    success: boolean;
    wallet?: Wallet;
    transaction?: WalletTransaction;
    error?: string;
  }> {
    try {
      const response = await fetch("/api/wallet/release-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Failed to release held balance",
        };
      }

      return {
        success: true,
        wallet: data.wallet,
        transaction: data.transaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error during hold release",
      };
    }
  }

  /**
   * Reverse transaction.
   */
  static async reverseTransaction(params: {
    userId: string;
    transactionId: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    wallet?: Wallet;
    reversalTransaction?: WalletTransaction;
    error?: string;
  }> {
    try {
      const response = await fetch("/api/wallet/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || "Failed to reverse transaction",
        };
      }

      return {
        success: true,
        wallet: data.wallet,
        reversalTransaction: data.reversalTransaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error during transaction reversal",
      };
    }
  }

  /**
   * Get transaction history for user.
   */
  static async getTransactionHistory(
    userId: string,
    filters?: { limit?: number; offset?: number; type?: string; status?: string }
  ): Promise<{
    success: boolean;
    transactions: WalletTransaction[];
    error?: string;
  }> {
    try {
      if (!userId) {
        return { success: false, transactions: [], error: "User ID required" };
      }

      const queryParams = new URLSearchParams();
      if (filters?.limit) queryParams.set("limit", String(filters.limit));
      if (filters?.offset) queryParams.set("offset", String(filters.offset));
      if (filters?.type) queryParams.set("type", filters.type);
      if (filters?.status) queryParams.set("status", filters.status);

      const url = `/api/wallet/history/${userId}?${queryParams.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          transactions: [],
          error: data.error || "Failed to fetch transaction history",
        };
      }

      return {
        success: true,
        transactions: data.transactions || [],
      };
    } catch (err: any) {
      return {
        success: false,
        transactions: [],
        error: "Network error fetching transactions",
      };
    }
  }

  /**
   * Standardized SmartLink Service Workflow Engine:
   * 1. Check Auth
   * 2. Check Wallet
   * 3. Validate Balance
   * 4. Call Backend API
   * 5. If Success -> Return Result & Receipt
   * 6. If Failure -> Do not deduct wallet, return Error
   */
  static async executeServiceWorkflow(options: ServiceExecutionOptions): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    errorCode?: WalletErrorCode;
    wallet?: Wallet;
    transaction?: WalletTransaction;
  }> {
    const { userId, amount, serviceName, executeBackendCall } = options;

    // Step 1 & 2 & 3: Validate Auth & Wallet & Balance
    const validation = await this.validateWallet(userId, amount);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "Wallet validation failed.",
        errorCode: validation.errorCode || "INSUFFICIENT_BALANCE",
        wallet: validation.wallet,
      };
    }

    // Step 4 & 5 & 6: Execute backend operation
    try {
      const result = await executeBackendCall();

      if (!result || result.error || (result.success === false)) {
        return {
          success: false,
          error: result?.error || `Failed to process ${serviceName}. No funds were deducted.`,
          errorCode: "SERVER_ERROR",
        };
      }

      return {
        success: true,
        data: result,
        wallet: result.wallet || result.user?.walletBalance !== undefined ? result.wallet : undefined,
        transaction: result.transaction,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || `An error occurred while processing ${serviceName}. Your wallet was not charged.`,
        errorCode: "SERVER_ERROR",
      };
    }
  }
}
