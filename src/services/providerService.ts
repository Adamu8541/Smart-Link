/**
 * SmartLink Centralized Provider Service & Dynamic Payment Engine
 *
 * Ensures all payment features dynamically load and use whichever provider
 * is currently marked "Active" in the database (api_providers).
 *
 * Direct database access by payment modules is forbidden; all modules
 * route requests through this central Provider Service.
 */

import { auth } from "../firebase";

export async function getAuthHeaders(userId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {}
  }
  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers["Authorization"] = `Bearer ${idToken}`;
      return headers;
    } catch {
      // ignore
    }
  }

  // Check admin session token
  try {
    const adminSessionRaw = sessionStorage.getItem("smart_link_admin_session");
    if (adminSessionRaw) {
      const adminSession = JSON.parse(adminSessionRaw);
      if (adminSession?.sessionToken) {
        headers["Authorization"] = `Bearer ${adminSession.sessionToken}`;
        headers["x-admin-token"] = adminSession.sessionToken;
        return headers;
      }
    }
  } catch {}

  // Check user session
  try {
    const userRaw = localStorage.getItem("smart_link_user");
    if (userRaw) {
      const u = JSON.parse(userRaw);
      if (u?.sessionToken || u?.token || u?.idToken) {
        headers["Authorization"] = `Bearer ${u.sessionToken || u.token || u.idToken}`;
        return headers;
      }
    }
  } catch {}

  return headers;
}

export interface ActiveProviderConfig {
  id: string;
  name: string;
  status: "Active" | "Inactive" | "Draft";
  baseUrl?: string;
  publicKey?: string;
  merchantId?: string;
  clientId?: string;
  webhookUrl?: string;
  callbackUrl?: string;
  notes?: string;
  updatedAt?: string;
  // Full credentials ONLY provided on server-side or to Super Admin
  secretKey?: string;
  clientSecret?: string;
  encryptionKey?: string;
  webhookSecret?: string;
}

export interface ProviderResponse<T = any> {
  success: boolean;
  provider?: ActiveProviderConfig;
  data?: T;
  account?: any;
  virtualAccount?: any;
  fundingMethods?: any[];
  reference?: string;
  verified?: boolean;
  amount?: number;
  transactions?: any[];
  deposits?: any[];
  withdrawals?: any[];
  transaction?: any;
  error?: string;
  code?: string;
  message?: string;
}

export class ProviderService {
  private fontCachedProvider: ActiveProviderConfig | null = null;
  private lastFetchTime: number = 0;
  private static CACHE_TTL_MS = 2000; // 2 seconds TTL to ensure instant switching

  /**
   * Fetch the currently Active payment provider from the centralized Provider Engine.
   */
  static async getActiveProvider(adminUid?: string): Promise<ProviderResponse<ActiveProviderConfig>> {
    try {
      const headers = await getAuthHeaders();
      const url = adminUid
        ? `/api/provider-engine/active-provider?adminUid=${encodeURIComponent(adminUid)}`
        : `/api/provider-engine/active-provider`;

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success || !data.provider) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }

      return {
        success: true,
        provider: data.provider,
      };
    } catch (err: any) {
      console.error("Error fetching active provider from ProviderService:", err);
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Get Active Provider status & engine state.
   */
  static async getEngineStatus(): Promise<{
    active: boolean;
    providerName?: string;
    statusMsg: string;
  }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/provider-engine/status", { headers });
      const data = await res.json();
      if (res.ok && data.active && data.provider) {
        return {
          active: true,
          providerName: data.provider.name,
          statusMsg: `Active Engine Provider: ${data.provider.name}`,
        };
      }
      return {
        active: false,
        statusMsg: data.error || "No active payment provider configured.",
      };
    } catch (err) {
      return {
        active: false,
        statusMsg: "No active payment provider configured.",
      };
    }
  }

  /**
   * Wallet Funding Module - Load active provider funding configuration.
   */
  static async getFundingConfig(userId: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/funding-info?userId=${encodeURIComponent(userId)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Virtual Accounts Module - Generate or retrieve reserved virtual account using Active provider.
   */
  static async getVirtualAccount(userId: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders(userId);
      let res = await fetch(`/api/wallet/virtual-account/${encodeURIComponent(userId)}`, { headers });
      let data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data.success || !data.account) {
        // Fallback endpoint 1: /api/virtual-account/:userId
        const fallbackRes = await fetch(`/api/virtual-account/${encodeURIComponent(userId)}`, { headers });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok && fallbackData.success && (fallbackData.account || fallbackData.virtualAccount)) {
          return {
            success: true,
            account: fallbackData.account || fallbackData.virtualAccount,
            virtualAccount: fallbackData.virtualAccount || fallbackData.account,
            provider: fallbackData.provider,
          };
        }

        // Fallback endpoint 2: /api/virtual-account/create
        const createRes = await fetch(`/api/virtual-account/create`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (createRes.ok && createData.success && (createData.account || createData.virtualAccount)) {
          return {
            success: true,
            account: createData.account || createData.virtualAccount,
            virtualAccount: createData.virtualAccount || createData.account,
            provider: createData.provider,
          };
        }

        return {
          success: false,
          error: data.error || data.message || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Payment Verification Module - Verify transaction via Active provider.
   */
  static async verifyPayment(paymentReference: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/verify-payment?reference=${encodeURIComponent(paymentReference)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Transaction History Module - Retrieve user transaction history filtered by Active provider records.
   */
  static async getTransactionHistory(userId: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/history/${encodeURIComponent(userId)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Deposit Records Module - Retrieve user deposit logs via Active provider.
   */
  static async getDepositRecords(userId: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/deposits/${encodeURIComponent(userId)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Withdrawal Records Module - Retrieve withdrawal records via Active provider.
   */
  static async getWithdrawalRecords(userId: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/withdrawals/${encodeURIComponent(userId)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }

  /**
   * Payment Status Module - Check transaction status via Active provider.
   */
  static async getPaymentStatus(reference: string): Promise<ProviderResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/wallet/payment-status/${encodeURIComponent(reference)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "No active payment provider configured.",
          code: data.code || "NO_ACTIVE_PROVIDER",
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: "No active payment provider configured.",
        code: "NO_ACTIVE_PROVIDER",
      };
    }
  }
}
