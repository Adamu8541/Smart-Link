/**
 * Aspfiy Payment Gateway Adapter — REAL implementation.
 * Docs: https://aspfiy.readme.io/reference
 * Base URL: https://api-v1.aspfiy.com/
 * Auth: Authorization: Bearer <secretKey>
 *
 * Credentials come from the provider row saved in Admin → API Gateway
 * Providers → Add Provider (db.payment_providers[]). This class receives
 * that exact row's { secretKey, baseUrl, webhookUrl } — nothing is hardcoded
 * and nothing is read from environment variables.
 */

import crypto from "crypto";

export interface PaymentProviderConfig {
  id: string;
  name: string;
  secretKey: string;
  baseUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
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

  private headers(config: PaymentProviderConfig): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
    };
  }

  async createVirtualAccount(db: any, user: any, config: PaymentProviderConfig) {
    try {
      const reference = `SL-${user?.uid || user?.id || Date.now()}`;
      const [firstName, ...rest] = (user?.fullName || "Customer").split(" ");
      const lastName = rest.join(" ") || "User";

      const res = await fetch(`${this.baseUrl(config)}/reserve-paga/`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({
          email: user?.email || "",
          reference,
          firstName,
          lastName,
          webhookUrl: config.webhookUrl || "",
          phone: user?.phone || user?.phoneNumber || "",
        }),
      });

      const json: any = await res.json().catch(() => ({}));

      if (!res.ok || json?.status === false) {
        return {
          success: false,
          rawResponse: json,
          error: json?.message || `Aspfiy reserve-paga failed (HTTP ${res.status})`,
        };
      }

      const data = json.data || json;
      return {
        success: true,
        providerReference: data.reference || reference,
        accountNumber: data.account_number || data.accountNumber || "",
        accountName: data.account_name || data.accountName || `${firstName} ${lastName}`,
        bankName: data.bank_name || data.bankName || "Paga",
        rawResponse: json,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error calling Aspfiy" };
    }
  }

  async verifyTransaction(db: any, reference: string, config: PaymentProviderConfig) {
    try {
      const res = await fetch(`${this.baseUrl(config)}/transfers/resolve-nuban`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ reference }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === false) {
        return {
          verified: false,
          paymentStatus: "FAILED",
          rawResponse: json,
          error: json?.message || `Verification failed (HTTP ${res.status})`,
        };
      }
      return {
        verified: true,
        amountPaid: json?.data?.amount ?? 0,
        paymentStatus: json?.data?.status || "SUCCESSFUL",
        rawResponse: json,
      };
    } catch (err: any) {
      return { verified: false, paymentStatus: "FAILED", error: err?.message || "Network error calling Aspfiy" };
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
