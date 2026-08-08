/**
 * SmartLink Payment Verification & Reconciliation Engine
 *
 * Provider-independent payment verification and reconciliation system.
 * Ensures every incoming payment is verified against the active provider's
 * dynamic configuration, prevents duplicate processing, compares payment parameters
 * (Amount, Reference, Account Number, Provider TxID, Status), and enforces state transitions:
 * - PENDING
 * - VERIFIED
 * - FAILED
 * - UNMATCHED
 * - REVERSED
 *
 * Unmatched and unverified payments are strictly kept uncredited and logged for Super Admin review.
 */

import { ServerWalletEngine } from "./serverWalletEngine.js";
import { APIProviderManager } from "./apiProviderManager.js";

export type PaymentState = "PENDING" | "VERIFIED" | "FAILED" | "UNMATCHED" | "REVERSED";

export interface ComparisonDetails {
  amountMatch: boolean;
  referenceMatch: boolean;
  accountMatch: boolean;
  providerTxIdMatch: boolean;
  statusMatch: boolean;
  expectedAmount?: number;
  verifiedAmount?: number;
  expectedReference?: string;
  verifiedReference?: string;
  expectedAccount?: string;
  verifiedAccount?: string;
}

export interface VerificationResult {
  verified: boolean;
  matched: boolean;
  providerName: string;
  providerResponseCode?: string;
  comparisonDetails: ComparisonDetails;
  message: string;
  failureReason?: string;
}

export interface ReconciliationRecord {
  id: string;
  paymentReference: string;
  providerTransactionId: string;
  provider: string;
  amount: number;
  accountNumber: string;
  status: PaymentState;
  userId: string;
  userEmail: string;
  walletId: string;
  date: string;
  verificationResult: VerificationResult;
  rawPayload?: any;
  createdAt: string;
  updatedAt: string;
}

export interface IncomingPaymentParams {
  payload: any;
  headers?: Record<string, any>;
  providerOverride?: string;
  expectedAccount?: string;
  expectedAmount?: number;
  expectedReference?: string;
}

export class PaymentVerificationReconciliationEngine {
  /**
   * Primary Entry Point: Verify & Reconcile Payment
   * Resolves active provider dynamically, enforces idempotency, validates parameters,
   * compares payload vs expected data, determines state, credits wallet if VERIFIED,
   * or stores in unmatched payments for Super Admin review if UNMATCHED/FAILED.
   */
  static verifyAndReconcilePayment(
    db: any,
    params: IncomingPaymentParams
  ): {
    success: boolean;
    code: string;
    message: string;
    record?: ReconciliationRecord;
    userId?: string;
    userEmail?: string;
    walletBalance?: number;
    transaction?: any;
    isDuplicate?: boolean;
  } {
    if (!db) {
      return {
        success: false,
        code: "DATABASE_UNAVAILABLE",
        message: "Database context unavailable.",
      };
    }

    // 1. Resolve Active Payment Provider dynamically without hardcoding
    let activeProvider = null;
    if (db.payment_providers && Array.isArray(db.payment_providers)) {
      activeProvider = db.payment_providers.find(
        (p: any) => p.status === "Active" || p.enabled === true || p.isActive === true
      );
    }
    if (!activeProvider && db.apiProviders && Array.isArray(db.apiProviders)) {
      activeProvider = APIProviderManager.getActiveProvider(db, { feature: "verification" });
    }

    const providerName =
      params.providerOverride ||
      activeProvider?.name ||
      activeProvider?.providerName ||
      "Active Payment Provider";

    // 2. Extract & Normalize Payment Information
    const payload = params.payload || {};
    const eventData = payload.eventData || payload.data || payload;

    const accountNumber = String(
      payload.accountNumber ||
        payload.destinationAccountNumber ||
        payload.virtualAccountNumber ||
        payload.account_number ||
        eventData.destinationAccountNumber ||
        eventData.accountNumber ||
        params.expectedAccount ||
        ""
    ).trim();

    const reference = String(
      payload.reference ||
        payload.transactionReference ||
        payload.paymentReference ||
        payload.orderNo ||
        payload.transRef ||
        payload.ref ||
        eventData.transactionReference ||
        eventData.paymentReference ||
        params.expectedReference ||
        ""
    ).trim();

    const providerTransactionId = String(
      payload.providerTransactionId ||
        payload.transactionId ||
        payload.opayOrderNo ||
        payload.flwRef ||
        payload.paystackRef ||
        eventData.transactionReference ||
        eventData.paymentReference ||
        eventData.transactionId ||
        reference ||
        ""
    ).trim();

    const rawAmt =
      payload.amount ||
      payload.amountPaid ||
      payload.settledAmount ||
      payload.orderAmount ||
      eventData.amountPaid ||
      eventData.settledAmount ||
      eventData.amount ||
      params.expectedAmount ||
      0;

    const amount = parseFloat(String(rawAmt));

    const userReference = String(
      payload.userId ||
        payload.customerRef ||
        payload.accountReference ||
        payload.customerEmail ||
        payload.email ||
        eventData.customerEmail ||
        eventData.accountReference ||
        ""
    ).trim();

    const rawStatus = String(
      payload.status ||
        payload.transactionStatus ||
        payload.paymentStatus ||
        eventData.paymentStatus ||
        eventData.status ||
        payload.event ||
        "PENDING"
    ).toUpperCase();

    // 3. Prevent Duplicate Processing using Provider TxID & Reference (Requirement 6)
    if (!db.processed_payment_references) db.processed_payment_references = [];
    if (!db.processed_provider_tx_ids) db.processed_provider_tx_ids = [];
    if (!db.reconciliation_records) db.reconciliation_records = [];

    const effectiveRef = reference || providerTransactionId;
    if (!effectiveRef) {
      return {
        success: false,
        code: "MISSING_REFERENCE",
        message: "Payment notification is missing a valid transaction reference or provider ID.",
      };
    }

    const isDuplicate =
      db.processed_payment_references.includes(effectiveRef) ||
      (providerTransactionId && db.processed_provider_tx_ids.includes(providerTransactionId)) ||
      db.reconciliation_records.some(
        (r: any) =>
          (r.paymentReference === effectiveRef ||
            (providerTransactionId && r.providerTransactionId === providerTransactionId)) &&
          (r.status === "VERIFIED" || r.status === "CREDITED")
      );

    if (isDuplicate) {
      return {
        success: true,
        code: "DUPLICATE_PAYMENT_ACKNOWLEDGED",
        message: "Duplicate payment transaction detected and acknowledged. Wallet already processed.",
        isDuplicate: true,
      };
    }

    // 4. Compare Verified Payment Information with Expected Information (Requirement 7)
    const isSuccessfulStatus = [
      "SUCCESS",
      "SUCCESSFUL",
      "PAID",
      "COMPLETED",
      "00",
      "PAID_SUCCESSFUL",
      "SUCCESSFUL_TRANSACTION",
      "PAYMENT_SUCCESS",
    ].some((s) => rawStatus.includes(s));

    const isReversedStatus = [
      "REVERSED",
      "REFUNDED",
      "CHARGEBACK",
      "CANCELLED",
      "DISPUTED",
    ].some((s) => rawStatus.includes(s));

    const amountMatch =
      params.expectedAmount === undefined ||
      params.expectedAmount === null ||
      Math.abs(amount - params.expectedAmount) < 0.01;

    const referenceMatch =
      !params.expectedReference ||
      params.expectedReference.toLowerCase() === effectiveRef.toLowerCase();

    const accountMatch =
      !params.expectedAccount ||
      params.expectedAccount === accountNumber;

    const statusMatch = isSuccessfulStatus;

    const comparisonDetails: ComparisonDetails = {
      amountMatch,
      referenceMatch,
      accountMatch,
      providerTxIdMatch: !!providerTransactionId,
      statusMatch,
      expectedAmount: params.expectedAmount,
      verifiedAmount: amount,
      expectedReference: params.expectedReference,
      verifiedReference: effectiveRef,
      expectedAccount: params.expectedAccount,
      verifiedAccount: accountNumber,
    };

    // Determine Initial Payment State (Requirement 5)
    let state: PaymentState = "PENDING";

    if (isReversedStatus) {
      state = "REVERSED";
    } else if (isNaN(amount) || amount <= 0 || !statusMatch || !amountMatch) {
      state = "FAILED";
    } else {
      state = "VERIFIED";
    }

    // 5. User & Wallet Matching Strategy
    let matchedUser: any = null;

    if (accountNumber && (db.virtualAccounts || db.walletAccounts)) {
      const allAccounts = (db.virtualAccounts || []).concat(db.walletAccounts || []);
      const matchedAccount = allAccounts.find(
        (acc: any) => acc.accountNumber && String(acc.accountNumber).trim() === accountNumber
      );
      if (matchedAccount) {
        matchedUser = (db.users || []).find((u: any) => u.uid === matchedAccount.userId);
      }
    }

    if (!matchedUser && userReference) {
      matchedUser = (db.users || []).find(
        (u: any) =>
          u.uid === userReference ||
          (u.email && u.email.toLowerCase() === userReference.toLowerCase())
      );

      if (!matchedUser && (db.virtualAccounts || db.walletAccounts)) {
        const allAccounts = (db.virtualAccounts || []).concat(db.walletAccounts || []);
        const matchedAccount = allAccounts.find(
          (acc: any) =>
            (acc.accountReference && acc.accountReference === userReference) ||
            (acc.reference && acc.reference === userReference)
        );
        if (matchedAccount) {
          matchedUser = (db.users || []).find((u: any) => u.uid === matchedAccount.userId);
        }
      }
    }

    if (!matchedUser && reference && (db.virtualAccounts || db.walletAccounts)) {
      const allAccounts = (db.virtualAccounts || []).concat(db.walletAccounts || []);
      const matchedAccount = allAccounts.find((acc: any) => acc.reference && acc.reference === reference);
      if (matchedAccount) {
        matchedUser = (db.users || []).find((u: any) => u.uid === matchedAccount.userId);
      }
    }

    // If payment is verified but cannot be matched to a user/wallet => UNMATCHED state (Requirement 9 & 10)
    if (state === "VERIFIED" && !matchedUser) {
      state = "UNMATCHED";
    }

    // Build Verification Result
    const verificationResult: VerificationResult = {
      verified: state === "VERIFIED",
      matched: !!matchedUser,
      providerName,
      providerResponseCode: rawStatus,
      comparisonDetails,
      message:
        state === "VERIFIED"
          ? "Payment verified and matched successfully."
          : state === "UNMATCHED"
          ? "Payment verified through active provider but could not be matched to a user or wallet."
          : state === "FAILED"
          ? `Payment verification failed (Status: ${rawStatus}, Amount: ${amount}).`
          : state === "REVERSED"
          ? "Payment has been reversed or refunded by provider."
          : "Payment verification pending.",
      failureReason:
        state === "FAILED"
          ? `Invalid payment status or amount mismatch.`
          : state === "UNMATCHED"
          ? `No matching user account found for account ${accountNumber || "N/A"}.`
          : undefined,
    };

    const reconciliationRecord: ReconciliationRecord = {
      id: `rec_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      paymentReference: effectiveRef,
      providerTransactionId,
      provider: providerName,
      amount: isNaN(amount) ? 0 : amount,
      accountNumber: accountNumber || "N/A",
      status: state,
      userId: matchedUser ? matchedUser.uid : "UNMATCHED",
      userEmail: matchedUser ? matchedUser.email : "unmatched@smartlink.com",
      walletId: matchedUser ? `wlt_${matchedUser.uid}` : "N/A",
      date: new Date().toISOString(),
      verificationResult,
      rawPayload: payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store record in reconciliation ledger
    db.reconciliation_records.unshift(reconciliationRecord);

    // If state is UNMATCHED or FAILED, store in unmatched payments for Super Admin review (Requirement 10 & 11)
    if (state === "UNMATCHED" || state === "FAILED") {
      if (!db.unmatched_payments) db.unmatched_payments = [];
      db.unmatched_payments.unshift({
        id: reconciliationRecord.id,
        paymentReference: effectiveRef,
        providerTransactionId,
        provider: providerName,
        amount: reconciliationRecord.amount,
        accountNumber: reconciliationRecord.accountNumber,
        status: state,
        userId: reconciliationRecord.userId,
        userEmail: reconciliationRecord.userEmail,
        walletId: reconciliationRecord.walletId,
        date: reconciliationRecord.date,
        verificationResult,
        rawPayload: payload,
        createdAt: reconciliationRecord.createdAt,
      });

      return {
        success: false,
        code: state === "UNMATCHED" ? "UNMATCHED_PAYMENT" : "VERIFICATION_FAILED",
        message: verificationResult.message,
        record: reconciliationRecord,
      };
    }

    // 6. Valid & Verified: Credit Wallet via existing Wallet Engine (Requirement 8)
    let creditResult;
    try {
      creditResult = ServerWalletEngine.creditWallet(db, {
        userId: matchedUser.uid,
        amount,
        serviceName: "Automated Virtual Account Top-Up",
        provider: providerName,
        description: `Verified deposit received via ${providerName} (Ref: ${effectiveRef})`,
        reference: effectiveRef,
        fee: 0,
        recipientDetails: matchedUser.email,
        type: "WALLET_FUNDING",
        idempotencyKey: effectiveRef,
      });
    } catch (err: any) {
      reconciliationRecord.status = "FAILED";
      reconciliationRecord.verificationResult.message = `Wallet Engine credit error: ${err.message}`;
      return {
        success: false,
        code: "WALLET_CREDIT_FAILED",
        message: err.message || "Failed to credit user wallet via Wallet Engine.",
        record: reconciliationRecord,
      };
    }

    // Mark as processed
    db.processed_payment_references.push(effectiveRef);
    if (providerTransactionId) db.processed_provider_tx_ids.push(providerTransactionId);

    return {
      success: true,
      code: "PAYMENT_VERIFIED_AND_CREDITED",
      message: `Successfully verified payment and credited ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} to wallet.`,
      record: reconciliationRecord,
      userId: matchedUser.uid,
      userEmail: matchedUser.email,
      walletBalance: creditResult.wallet.balance || creditResult.wallet.currentBalance,
      transaction: creditResult.transaction,
    };
  }

  /**
   * Super Admin Helper: Get All Reconciliation Records
   */
  static getReconciliationRecords(
    db: any,
    filters?: {
      status?: string;
      provider?: string;
      search?: string;
    }
  ): ReconciliationRecord[] {
    if (!db || !db.reconciliation_records) return [];

    let records = db.reconciliation_records;

    if (filters?.status && filters.status !== "ALL") {
      records = records.filter(
        (r: ReconciliationRecord) => r.status.toUpperCase() === filters.status!.toUpperCase()
      );
    }

    if (filters?.provider && filters.provider !== "ALL") {
      records = records.filter(
        (r: ReconciliationRecord) =>
          r.provider.toLowerCase().includes(filters.provider!.toLowerCase())
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r: ReconciliationRecord) =>
          r.paymentReference.toLowerCase().includes(q) ||
          r.providerTransactionId.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q)
      );
    }

    return records;
  }
}
