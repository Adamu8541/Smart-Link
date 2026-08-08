import { ServerWalletEngine } from "./serverWalletEngine.js";
import { PaymentVerificationReconciliationEngine } from "./paymentVerificationReconciliationEngine.js";

export interface IncomingPaymentNotification {
  accountNumber?: string;
  reference?: string;
  providerTransactionId?: string;
  amount?: number;
  userReference?: string;
  customerEmail?: string;
  status?: string;
  rawPayload?: any;
  signature?: string;
  providerName?: string;
}

export interface AutomaticFundingResult {
  success: boolean;
  code: string;
  message: string;
  userId?: string;
  userEmail?: string;
  walletBalance?: number;
  transaction?: any;
  unmatchedPaymentId?: string;
  isDuplicate?: boolean;
}

export class AutomaticWalletFundingEngine {
  /**
   * Primary Provider-Independent Automatic Wallet Funding Engine.
   * Delegates incoming payment verification and reconciliation to PaymentVerificationReconciliationEngine.
   */
  static processIncomingPaymentNotification(
    db: any,
    params: {
      payload: any;
      headers?: Record<string, any>;
      providerOverride?: string;
    }
  ): AutomaticFundingResult {
    const res = PaymentVerificationReconciliationEngine.verifyAndReconcilePayment(db, params);

    return {
      success: res.success,
      code: res.code,
      message: res.message,
      userId: res.userId,
      userEmail: res.userEmail,
      walletBalance: res.walletBalance,
      transaction: res.transaction,
      unmatchedPaymentId: res.record?.id,
      isDuplicate: res.isDuplicate,
    };
  }
}

