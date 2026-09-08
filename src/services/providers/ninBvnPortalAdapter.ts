/**
 * NIN BVN Portal Identity Verification Adapter (ninbvnportal.com)
 * Docs: https://ninbvnportal.com/documentation
 * Endpoint: POST https://ninbvnportal.com/api/nin-verification
 * Auth: x-api-key header
 * Every request MUST include "consent": true — required under Section 26
 * of Nigeria's NIMC Act (2007). Never hardcode this to true regardless of
 * actual user consent — it must reflect a real confirmed consent action
 * upstream (already enforced by verification.routes.ts's consent check).
 */

import { PaymentProviderConfig, ProviderAdapter } from "./aspfiyAdapter";

export interface NinBvnPortalVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
}

export class NinBvnPortalAdapter implements ProviderAdapter {
  id = "ninbvnportal";
  name = "NIN BVN Portal (ninbvnportal.com)";

  private baseUrl(config: PaymentProviderConfig): string {
    return (config.baseUrl || "https://ninbvnportal.com/api").replace(/\/+$/, "");
  }

  private headers(config: PaymentProviderConfig): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": String(config.secretKey || config.apiKey || "").trim(),
    };
  }

  private mapToStandardFields(raw: any): Record<string, any> {
    const d = raw?.data || raw || {};
    return {
      fullName: [d.firstname, d.middlename, d.surname].filter(Boolean).join(" ") || "",
      firstName: d.firstname || "",
      lastName: d.surname || "",
      middleName: d.middlename || "",
      gender: d.gender || "",
      dateOfBirth: d.birthdate || "",
      phoneNumber: d.telephoneno || "",
      email: "",
      address: d.residence_address || "",
      stateOfOrigin: d.birthstate || d.residence_state || "",
      lga: d.residence_lga || d.birthlga || "",
      photoUrl: d.photo ? `data:image/jpeg;base64,${d.photo}` : "",
      residenceTown: d.residence_town || "",
      birthCountry: d.birthcountry || "",
      nin: d.nin || undefined,
      rawFields: d,
    };
  }

  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    try {
      if (!config.secretKey || !String(config.secretKey).trim()) {
        return { ok: false, message: "NIN BVN Portal API key is missing.", responseTimeMs: 0 };
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.baseUrl(config)}/nin-verification`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ nin: "00000000000", consent: true }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "NIN BVN Portal rejected the API key (Unauthorized).", responseTimeMs: elapsed };
      }
      return { ok: true, message: "Connected — API key accepted.", responseTimeMs: elapsed };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.name === "AbortError" ? "NIN BVN Portal request timed out." : err?.message || "NIN BVN Portal unreachable",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<NinBvnPortalVerificationResult> {
    const startTime = Date.now();
    const sType = serviceType.toUpperCase();
    const cleanId = String(targetId).replace(/\D/g, "").trim();
    const reference = `NBP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (sType !== "NIN") {
      return {
        success: false,
        providerReference: reference,
        error: `NIN BVN Portal adapter only supports NIN — "${sType}" is not implemented.`,
        responseTimeMs: 0,
      };
    }

    if (extraData?.consent !== true) {
      return {
        success: false,
        providerReference: reference,
        error: "Explicit consent is required before performing a NIN lookup (NIMC Act Section 26).",
        responseTimeMs: 0,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${this.baseUrl(config)}/nin-verification`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ nin: cleanId, consent: true }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      const json = await res.json().catch(() => null);

      if (res.ok && json && json.status === "success" && json.data) {
        return {
          success: true,
          providerReference: json.reportID || reference,
          transactionId: json.reportID || reference,
          data: this.mapToStandardFields(json),
          responseTimeMs: elapsed,
          statusCode: res.status,
        };
      }

      return {
        success: false,
        providerReference: reference,
        error: json?.message || `NIN BVN Portal query rejected (HTTP ${res.status}).`,
        responseTimeMs: elapsed,
        statusCode: res.status,
      };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        success: false,
        providerReference: reference,
        error: err?.name === "AbortError" ? "NIN BVN Portal request timed out after 10000ms." : (err?.message || "NIN BVN Portal gateway error."),
        responseTimeMs: elapsed,
        statusCode: 504,
      };
    }
  }
}
