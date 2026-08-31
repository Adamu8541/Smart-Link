/**
 * LumiID Identity Verification Adapter (docs.lumiid.com)
 * Base URL: https://api.lumiid.com/v1
 * Auth: Authorization: Bearer <secretKey>  +  X-App-ID: <appId>
 *
 * IMPORTANT: LumiID's own documentation shows inconsistent endpoint path
 * examples across pages (some show /nin/verify, others /ng/nin-basic/).
 * This adapter uses the /ng/{service}-basic/ convention, matching their
 * BVN and CAC docs pages, which appears to be the current, consistent
 * style. Confirm the exact live path via Test Connection once a real
 * secret key is added — adjust NIN_ENDPOINT_PATH below if it 404s.
 */

import { PaymentProviderConfig, ProviderAdapter } from "./aspfiyAdapter";

const NIN_ENDPOINT_PATH = "/ng/nin-basic/";
const BVN_ENDPOINT_PATH = "/ng/bvn-basic/";

export interface LumiIDVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
}

export class LumiIDAdapter implements ProviderAdapter {
  id = "lumiid";
  name = "LumiID Identity Gateway (lumiid.com)";

  private baseUrl(config: PaymentProviderConfig): string {
    return (config.baseUrl || "https://api.lumiid.com/v1").replace(/\/+$/, "");
  }

  private headers(config: PaymentProviderConfig): Record<string, string> {
    const key = String(config.secretKey || config.apiKey || "").trim();
    const appId = String((config as any).clientId || (config as any).appId || "").trim();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      "X-App-ID": appId,
    };
  }

  private mapToStandardFields(raw: any): Record<string, any> {
    const d = raw?.data || raw || {};
    return {
      fullName: [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ") || d.full_name || "",
      firstName: d.first_name || "",
      lastName: d.last_name || "",
      middleName: d.middle_name || "",
      gender: d.gender || d.sex || "",
      dateOfBirth: d.date_of_birth || d.dob || "",
      phoneNumber: d.phone || d.phone_number || d.telephone || "",
      email: d.email || "",
      address: d.address || d.residential_address || "",
      stateOfOrigin: d.state_of_origin || d.state || "",
      lga: d.lga_of_origin || d.lga || "",
      photoUrl: d.photo_url || d.photo || d.image || "",
      bvn: d.bvn || undefined,
      rawFields: d,
    };
  }

  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    try {
      if (!config.secretKey || !String(config.secretKey).trim()) {
        return { ok: false, message: "LumiID Secret Key is missing.", responseTimeMs: 0 };
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.baseUrl(config)}/wallet/balance`, {
        method: "GET",
        headers: this.headers(config),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "LumiID rejected the Secret Key / App ID (Unauthorized).", responseTimeMs: elapsed };
      }
      return { ok: res.ok, message: res.ok ? "Connected" : `LumiID returned HTTP ${res.status}`, responseTimeMs: elapsed };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.name === "AbortError" ? "LumiID request timed out." : err?.message || "LumiID unreachable",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<LumiIDVerificationResult> {
    const startTime = Date.now();
    const sType = serviceType.toUpperCase();
    const cleanId = String(targetId).replace(/\D/g, "").trim();
    const reference = `LMD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (sType !== "NIN" && sType !== "BVN") {
      return {
        success: false,
        providerReference: reference,
        error: `LumiID adapter does not support service type "${sType}" — only NIN and BVN are implemented.`,
        responseTimeMs: 0,
      };
    }

    const endpoint = `${this.baseUrl(config)}${sType === "NIN" ? NIN_ENDPOINT_PATH : BVN_ENDPOINT_PATH}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({
          [sType.toLowerCase()]: cleanId,
          reference,
          ...extraData,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      const json = await res.json().catch(() => null);

      if (res.ok && json && (json.status === true || json.status === "success" || json.success === true) && json.data) {
        return {
          success: true,
          providerReference: json.meta?.request_id || json.reference || reference,
          transactionId: reference,
          data: this.mapToStandardFields(json),
          responseTimeMs: elapsed,
          statusCode: res.status,
        };
      }

      return {
        success: false,
        providerReference: reference,
        error: json?.message || json?.error || `LumiID query rejected (HTTP ${res.status}).`,
        responseTimeMs: elapsed,
        statusCode: res.status,
      };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        success: false,
        providerReference: reference,
        error: err?.name === "AbortError" ? "LumiID request timed out after 10000ms." : (err?.message || "LumiID gateway error."),
        responseTimeMs: elapsed,
        statusCode: 504,
      };
    }
  }
}
