/**
 * SmartLink Fintech Core Transaction Engine Service
 * Phase 1 Part 6 Unified Architecture
 */

import {
  TransactionDocument,
  ReceiptDocument,
  TransactionStatusType,
  WalletDocument,
  NotificationDocument
} from "../types/database.js";

export interface InitiateTransactionParams {
  userId: string;
  service: string;
  amount: number;
  charge?: number;
  recipient?: string;
  provider?: string;
  description?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface ExecuteTransactionResult {
  success: boolean;
  transaction: TransactionDocument;
  receipt?: ReceiptDocument;
  error?: string;
}

export interface TransactionFilterParams {
  userId?: string;
  searchQuery?: string;
  status?: TransactionStatusType | "ALL";
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Generates a unique, searchable SmartLink Reference.
 * Format: SL-YYYYMMDD-XXXXXXXX
 */
export function generateSmartLinkReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SL-${dateStr}-${randomChars}`;
}

/**
 * Transaction Engine Service Object
 */
export const TransactionEngine = {
  /**
   * Generates a new unique reference
   */
  generateReference(): string {
    return generateSmartLinkReference();
  },

  /**
   * Initiates a financial transaction following strict lifecycle rules.
   * Checks balance, validates input, holds funds via backend.
   */
  async initiateTransaction(params: InitiateTransactionParams): Promise<{
    success: boolean;
    reference: string;
    holdId?: string;
    error?: string;
    totalDeduction: number;
  }> {
    if (params.amount <= 0) {
      return { success: false, reference: "", totalDeduction: 0, error: "Transaction amount must be greater than zero." };
    }

    const totalDeduction = params.amount + (params.charge || 0);
    const reference = generateSmartLinkReference();

    try {
      const res = await fetch("/api/transaction/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: params.userId,
          service: params.service,
          amount: params.amount,
          charge: params.charge || 0,
          totalDeduction,
          recipient: params.recipient,
          provider: params.provider || "SMARTLINK_CORE",
          smartlinkReference: reference,
          description: params.description || `${params.service} operation`,
          paymentMethod: params.paymentMethod || "WALLET"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          reference,
          totalDeduction,
          error: data.error || "Failed to initiate transaction and hold balance."
        };
      }

      return {
        success: true,
        reference,
        holdId: data.holdId,
        totalDeduction
      };
    } catch (err: any) {
      return {
        success: false,
        reference,
        totalDeduction,
        error: err.message || "Network error while initiating transaction."
      };
    }
  },

  /**
   * Complete / Execute Transaction following provider response.
   * Debits wallet, writes transaction, generates receipt, releases hold, notifies user.
   */
  async executeTransaction(params: {
    userId: string;
    reference: string;
    providerReference?: string;
    service: string;
    amount: number;
    charge?: number;
    recipient?: string;
    userName?: string;
    userEmail?: string;
    provider?: string;
    description?: string;
    status: "SUCCESSFUL" | "FAILED";
    failureReason?: string;
    metadata?: Record<string, any>;
  }): Promise<ExecuteTransactionResult> {
    try {
      const res = await fetch("/api/transaction/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: params.userId,
          smartlinkReference: params.reference,
          providerReference: params.providerReference || `PROV-${Date.now()}`,
          service: params.service,
          amount: params.amount,
          charge: params.charge || 0,
          recipient: params.recipient || "N/A",
          userName: params.userName || "Customer",
          userEmail: params.userEmail || "",
          provider: params.provider || "SMARTLINK_CORE",
          description: params.description || `${params.service} Execution`,
          status: params.status,
          failureReason: params.failureReason,
          metadata: params.metadata || {}
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          transaction: data.transaction,
          error: data.error || "Transaction execution failed."
        };
      }

      return {
        success: true,
        transaction: data.transaction,
        receipt: data.receipt
      };
    } catch (err: any) {
      return {
        success: false,
        transaction: null as any,
        error: err.message || "Network error during transaction execution."
      };
    }
  },

  /**
   * Reverses or Refunds a failed / timed-out transaction.
   */
  async refundTransaction(params: {
    transactionId: string;
    adminUid?: string;
    reason: string;
  }): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    try {
      const res = await fetch("/api/transaction/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || "Refund execution failed." };
      }
      return { success: true, message: data.message, refundAmount: data.refundAmount };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to process refund." };
    }
  },

  /**
   * Fetches full transaction history with search, pagination and multi-field filters.
   */
  async getHistory(filter: TransactionFilterParams): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filter.userId) queryParams.append("userId", filter.userId);
      if (filter.searchQuery) queryParams.append("searchQuery", filter.searchQuery);
      if (filter.status && filter.status !== "ALL") queryParams.append("status", filter.status);
      if (filter.serviceType) queryParams.append("serviceType", filter.serviceType);
      if (filter.startDate) queryParams.append("startDate", filter.startDate);
      if (filter.endDate) queryParams.append("endDate", filter.endDate);
      if (filter.minAmount !== undefined) queryParams.append("minAmount", filter.minAmount.toString());
      if (filter.maxAmount !== undefined) queryParams.append("maxAmount", filter.maxAmount.toString());
      if (filter.page) queryParams.append("page", filter.page.toString());
      if (filter.pageSize) queryParams.append("pageSize", filter.pageSize.toString());

      const res = await fetch(`/api/transaction/history?${queryParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch transaction history");
      return data;
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      return { transactions: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  /**
   * Fetches single transaction receipt details.
   */
  async getReceipt(receiptId: string): Promise<ReceiptDocument | null> {
    try {
      const res = await fetch(`/api/transaction/receipt/${receiptId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.receipt;
    } catch (err) {
      console.error("Error fetching receipt:", err);
      return null;
    }
  },

  /**
   * Fetches Admin Dashboard Transaction Metrics
   */
  async getAdminStats(adminUid: string): Promise<any> {
    try {
      const res = await fetch(`/api/admin/transactions/stats?adminUid=${adminUid}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Error fetching admin transaction stats:", err);
      return null;
    }
  }
};
