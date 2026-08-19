/**
 * Aspfiy Payment Gateway Adapter — REAL implementation.
 * Docs: https://aspfiy.readme.io/reference
 * Base URL: https://api-v1.aspfiy.com/
 * Auth: Authorization: Bearer <secretKey>
 *
 * Credentials come from the provider row saved in Admin → API Gateway
 * Providers → Add Provider (db.api_providers[]). This class receives
 * that exact row's { secretKey, baseUrl, webhookUrl } — nothing is hardcoded
 * and nothing is read from environment variables.
 */

import crypto from "crypto";

/**
 * Normalizes a phone number to standard 11-digit Nigerian local format (e.g. "08012345678").
 * Strips all non-digit characters, removes leading country code (+234 / 234), and ensures a single leading 0.
 */
export function normalizeNigerianPhone(raw: string): string {
  const digitsOnly = (raw || "").replace(/\D/g, "");
  // Strip a leading country code (234) if present, leaving the local part
  const local = digitsOnly.startsWith("234") ? digitsOnly.slice(3) : digitsOnly;
  // Ensure it starts with a single leading 0 and is exactly 11 digits
  const withLeadingZero = local.startsWith("0") ? local : `0${local}`;
  return withLeadingZero.slice(0, 11);
}

export interface PaymentProviderConfig {
  id: string;
  name: string;
  secretKey: string;
  baseUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  supportsTxVerification?: boolean;
  supportsWalletFunding?: boolean;
  supportsBankTransfer?: boolean;
  supportsVirtualAccount?: boolean;
  [key: string]: any;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  verifyTransaction?: (
    db: any,
    reference: string,
    config: PaymentProviderConfig
  ) => Promise<{
    verified: boolean;
    amountPaid?: number;
    paymentStatus?: string;
    rawResponse?: any;
    error?: string;
  }>;
  createVirtualAccount?: (
    db: any,
    user: any,
    config: PaymentProviderConfig
  ) => Promise<{
    success: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    providerReference?: string;
    rawResponse?: any;
    error?: string;
  }>;
  testConnection?: (
    config: PaymentProviderConfig
  ) => Promise<{ ok: boolean; message: string; responseTimeMs: number }>;
  verifyWebhookSignature?: (
    headers: Record<string, any>,
    rawBody: string,
    config: PaymentProviderConfig
  ) => boolean;
}

export class AspfiyAdapter implements ProviderAdapter {
  id = "aspfiy";
  name = "Aspfiy Payment Gateway";

  private baseUrl(config: PaymentProviderConfig): string {
    return (config.baseUrl || "https://api-v1.aspfiy.com").replace(/\/+$/, "");
  }

  private maskSecretForLogs(secret: string): string {
    if (!secret || typeof secret !== "string") return "[EMPTY]";
    const clean = secret.trim();
    if (clean.length <= 8) return "••••";
    return `${clean.substring(0, 4)}...${clean.substring(clean.length - 4)}`;
  }

  private headers(config: PaymentProviderConfig): Record<string, string> {
    const secretKey = String(config.secretKey || "").trim();

    if (!secretKey || secretKey.includes("••••")) {
      throw new Error(
        "ASPFIY_SECRET_KEY is missing or invalid in the active provider configuration."
      );
    }

    // Safe diagnostic logging before request without exposing the full secret
    console.log(
      `[AspfiyAdapter] Prepared request to Aspfiy Gateway. Key preview: ${this.maskSecretForLogs(secretKey)}`
    );

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
    };
  }

  async createVirtualAccount(db: any, user: any, config: PaymentProviderConfig) {
    try {
      const email = String(user?.email || "").trim();
      const phone = String(user?.phone || user?.phoneNumber || "").trim();
      const fullName = String(user?.fullName || "").trim();

      if (!email) {
        return { success: false, error: "Customer email is required." };
      }

      if (!phone) {
        return { success: false, error: "Customer phone number is required." };
      }

      if (!fullName) {
        return { success: false, error: "Customer full name is required." };
      }

      if (!config.webhookUrl?.trim()) {
        return { success: false, error: "ASPFIY webhook URL is not configured." };
      }

      const [firstName, ...rest] = fullName.split(/\s+/);
      const lastName = rest.join(" ") || firstName;

      const userId = user?.uid || user?.id;
      const userEmail = email.toLowerCase();

      // Check whether the user already has an active ASPFIY virtual account
      const candidateAccounts = [
        ...(Array.isArray(db?.virtualAccounts) ? db.virtualAccounts : []),
        ...(Array.isArray(db?.virtual_accounts) ? db.virtual_accounts : []),
        ...(Array.isArray(db?.walletAccounts) ? db.walletAccounts : []),
        ...(Array.isArray(user?.virtualAccounts) ? user.virtualAccounts : []),
        ...(user?.virtualAccount ? [user.virtualAccount] : []),
      ];

      const existingAccount = candidateAccounts.find(
        (acc: any) =>
          acc &&
          acc.accountNumber &&
          (acc.userId === userId || (userEmail && (acc.userEmail || "").toLowerCase() === userEmail)) &&
          (acc.provider === "aspfiy" ||
            acc.providerId === "prov_aspfiy" ||
            acc.providerId === config.id ||
            (acc.bankName || "").toLowerCase().includes("paga") ||
            (acc.providerName || "").toLowerCase().includes("aspfiy") ||
            (acc.provider || "").toLowerCase().includes("aspfiy")) &&
          acc.status !== "INACTIVE" &&
          acc.status !== "DISABLED" &&
          acc.status !== "FAILED"
      );

      if (existingAccount) {
        return {
          success: true,
          accountNumber: existingAccount.accountNumber,
          accountName: existingAccount.accountName || `${firstName} ${lastName}`,
          bankName: existingAccount.bankName || "Paga",
          providerReference: existingAccount.providerReference || existingAccount.reference || `SL-${userId || Date.now()}`,
          rawResponse: { message: "Existing active virtual account retrieved", existing: true },
        };
      }

      if (user?.virtualAccountNumber && (user.virtualBankName || "").toLowerCase().includes("paga")) {
        return {
          success: true,
          accountNumber: user.virtualAccountNumber,
          accountName: user.virtualAccountName || `${firstName} ${lastName}`,
          bankName: user.virtualBankName || "Paga",
          providerReference: user.virtualAccountReference || `SL-${userId || Date.now()}`,
          rawResponse: { message: "Existing active virtual account retrieved from profile", existing: true },
        };
      }

      const reference = `SL-${userId || Date.now()}`;
      const normalizedPhone = normalizeNigerianPhone(phone) || phone;

      const res = await fetch(`${this.baseUrl(config)}/reserve-paga/`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({
          email,
          reference,
          firstName,
          lastName,
          webhookUrl: config.webhookUrl.trim(),
          phone: normalizedPhone,
        }),
      });

      const json: any = await res.json().catch(() => ({}));

      if (!res.ok || json?.status === false) {
        let errorMessage: string;
        const backendMsg = json?.message || json?.error || "";

        switch (res.status) {
          case 400:
            errorMessage = backendMsg
              ? `Aspfiy validation error: ${backendMsg}`
              : "Invalid virtual account generation request. Please verify customer information.";
            break;
          case 401:
            errorMessage = "Aspfiy authentication failed: Invalid or expired API credentials.";
            break;
          case 403:
            errorMessage = "Aspfiy access forbidden: Account permissions or IP restriction error.";
            break;
          case 404:
            errorMessage = "Aspfiy service endpoint not found (HTTP 404). Please verify baseUrl configuration.";
            break;
          case 429:
            errorMessage = "Aspfiy rate limit exceeded. Please wait a moment and try again.";
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = backendMsg
              ? `Aspfiy service error: ${backendMsg}`
              : `Aspfiy upstream service unavailable (HTTP ${res.status}). Please try again later.`;
            break;
          default:
            errorMessage = backendMsg || `Aspfiy reserve-paga failed (HTTP ${res.status})`;
        }

        return {
          success: false,
          rawResponse: json,
          error: errorMessage,
        };
      }

      const data = json.data || json.result || json;
      const accountNumber = data.account_number || data.accountNumber || data.account_no || data.accountNo || "";

      if (!accountNumber) {
        return {
          success: false,
          rawResponse: json,
          error: json?.message || "Aspfiy did not return a valid virtual account number.",
        };
      }

      return {
        success: true,
        providerReference: data.reference || reference,
        accountNumber,
        accountName: data.account_name || data.accountName || `${firstName} ${lastName}`,
        bankName: data.bank_name || data.bankName || "Paga",
        rawResponse: json,
      };
    } catch (err: any) {
      const rawMsg = String(err?.message || "Network error calling Aspfiy");
      const sanitizedMsg = rawMsg.replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]");
      return { success: false, error: sanitizedMsg };
    }
  }

  async resolveAccount(accountNumber: string, bankCode: string, config: PaymentProviderConfig) {
    try {
      const res = await fetch(`${this.baseUrl(config)}/transfers/resolve-nuban`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === false) {
        return { success: false, error: json?.message || `Resolution failed (HTTP ${res.status})` };
      }
      return { success: true, accountName: json.data?.account_name || "", accountNumber, bankCode };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error calling Aspfiy" };
    }
  }

  async initiateTransfer(
    params: { accountNumber: string; bankCode: string; amount: number; narration?: string; callbackUrl: string },
    config: PaymentProviderConfig
  ) {
    try {
      const res = await fetch(`${this.baseUrl(config)}/Initiate Transfer`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({
          account_number: params.accountNumber,
          bank_code: params.bankCode,
          amount: params.amount,
          narration: params.narration,
          callback_url: params.callbackUrl,
        }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === false) {
        return { success: false, error: json?.message || `Transfer failed (HTTP ${res.status})` };
      }
      return { success: true, providerReference: json.data?.reference || "", status: json.data?.status || "INITIATED" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error calling Aspfiy" };
    }
  }

  async listBanks(config: PaymentProviderConfig) {
    try {
      const res = await fetch(`${this.baseUrl(config)}/transfers/banks/`, { method: "GET", headers: this.headers(config) });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === false) return { success: false, banks: [], error: json?.message || `HTTP ${res.status}` };
      const banks = (json.data || []).map((b: any) => ({ bankCode: b.bank_code, bankName: b.bank_name }));
      return { success: true, banks };
    } catch (err: any) {
      return { success: false, banks: [], error: err?.message || "Network error calling Aspfiy" };
    }
  }

  async testConnection(config: PaymentProviderConfig) {
    const start = Date.now();
    try {
      if (!config.secretKey || !config.secretKey.trim()) {
        return { ok: false, message: "Secret Key is missing.", responseTimeMs: 0 };
      }
      const res = await fetch(`${this.baseUrl(config)}/transfers/banks/`, {
        method: "GET",
        headers: this.headers(config),
      });
      const responseTimeMs = Date.now() - start;
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "Aspfiy rejected the Secret Key (Unauthorized).", responseTimeMs };
      }
      return { ok: res.ok, message: res.ok ? "Connected" : `Aspfiy returned HTTP ${res.status}`, responseTimeMs };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Aspfiy unreachable", responseTimeMs: Date.now() - start };
    }
  }

  /**
   * Server-to-server transaction status verification / reconciliation for ASPFIY payments.
   */
  async verifyTransaction(
    db: any,
    reference: string,
    config: PaymentProviderConfig
  ): Promise<{
    verified: boolean;
    amountPaid?: number;
    paymentStatus?: string;
    rawResponse?: any;
    error?: string;
  }> {
    try {
      if (!reference || !reference.trim()) {
        return { verified: false, error: "Missing transaction reference for verification." };
      }

      // Check if secret key is available for server-to-server query
      const secretKey = String(config.secretKey || "").trim();
      if (!secretKey || secretKey.includes("••••")) {
        return {
          verified: false,
          error: "ASPFIY API credentials missing for server verification.",
        };
      }

      const res = await fetch(`${this.baseUrl(config)}/verify/${encodeURIComponent(reference.trim())}`, {
        method: "GET",
        headers: this.headers(config),
      });

      const json: any = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === false) {
        return {
          verified: false,
          paymentStatus: json?.data?.status || json?.status || "UNVERIFIED",
          rawResponse: json,
          error: json?.message || `Aspfiy verification returned HTTP ${res.status}`,
        };
      }

      const data = json.data || json.result || json;
      const statusStr = String(data.status || data.payment_status || "SUCCESS").toUpperCase();
      const amountPaid = Number(data.amount || data.amountPaid || data.settled_amount || 0);

      const isPaid = statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "PAID" || statusStr === "COMPLETED";

      return {
        verified: isPaid,
        amountPaid: isNaN(amountPaid) ? undefined : amountPaid,
        paymentStatus: statusStr,
        rawResponse: json,
      };
    } catch (err: any) {
      const rawMsg = String(err?.message || "Network error verifying ASPFIY transaction");
      const sanitizedMsg = rawMsg.replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]");
      return {
        verified: false,
        error: sanitizedMsg,
      };
    }
  }

  // Aspfiy signs webhooks with header "x-wiaxy-signature" = MD5(secret key).
  // Verify this against a real sandbox webhook before trusting it in production.
  verifyWebhookSignature(headers: Record<string, any>, rawBody: string, config: PaymentProviderConfig): boolean {
    const sigHeader = headers["x-wiaxy-signature"];
    const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
    if (!sig) return false;
    const expected = crypto.createHash("md5").update(config.secretKey).digest("hex");
    return sig === expected;
  }
}
