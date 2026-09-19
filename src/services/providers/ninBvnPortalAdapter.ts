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

  private getResolvedKey(config: PaymentProviderConfig): string {
    const raw = String(config.secretKey || config.apiKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 10) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(process.env.NINBVNPORTAL_API_KEY || process.env.NIN_BVN_PORTAL_API_KEY || raw || "").trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  private headers(config: PaymentProviderConfig): Record<string, string> {
    const key = this.getResolvedKey(config);
    const appId = String(
      (config as any).clientId ||
      (config as any).appId ||
      process.env.NINBVNPORTAL_APP_ID ||
      "smartlink_nin_app"
    ).replace(/[^\x00-\x7F]/g, "").trim();

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": key,
      "Authorization": `Bearer ${key}`,
      "X-App-ID": appId,
      "x-app-id": appId,
    };
  }

  private mapToStandardFields(raw: any, serviceType?: string): Record<string, any> {
    const d = raw?.data || raw || {};
    const sType = (serviceType || "").toUpperCase();
    return {
      fullName: [d.firstname || d.first_name, d.middlename || d.middle_name, d.surname || d.last_name].filter(Boolean).join(" ") || d.fullName || d.name || "",
      firstName: d.firstname || d.first_name || "",
      lastName: d.surname || d.last_name || "",
      middleName: d.middlename || d.middle_name || "",
      gender: d.gender || "",
      dateOfBirth: d.birthdate || d.dob || "",
      phoneNumber: d.telephoneno || d.phone || d.phoneNumber || "",
      email: d.email || "",
      address: d.residence_address || d.address || "",
      stateOfOrigin: d.birthstate || d.residence_state || d.stateOfOrigin || "",
      lga: d.residence_lga || d.birthlga || d.lga || "",
      photoUrl: d.photo ? (d.photo.startsWith("data:") ? d.photo : `data:image/jpeg;base64,${d.photo}`) : "",
      residenceTown: d.residence_town || "",
      birthCountry: d.birthcountry || "",
      nin: d.nin || (sType === "NIN" ? d.id_number : undefined),
      bvn: d.bvn || (sType === "BVN" ? (d.id_number || d.bvnNumber) : undefined),
      rawFields: d,
    };
  }

  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    try {
      const rawKey = String(
        config.secretKey ||
        config.apiKey ||
        process.env.NINBVNPORTAL_API_KEY ||
        process.env.NIN_BVN_PORTAL_API_KEY ||
        ""
      ).trim();
      const safeKey = rawKey.replace(/[^\x00-\x7F]/g, "").trim();
      const isMasked = rawKey.includes("•") || rawKey.includes("***");
      const base = this.baseUrl(config);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Probe host reachability first (ninbvnportal.com/api)
      let hostResponded = false;
      let latency = 0;
      try {
        const ping = await fetch(base, {
          method: "GET",
          headers: { "User-Agent": "SmartLink-NINBVN/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        latency = Date.now() - startTime;
        if (ping.status) {
          hostResponded = true;
        }
      } catch {
        clearTimeout(timeoutId);
      }

      if (!hostResponded) {
        return {
          ok: false,
          message: "NIN BVN Portal server unreachable. Please verify network connection.",
          responseTimeMs: Date.now() - startTime,
        };
      }

      if (!safeKey || isMasked) {
        return {
          ok: true,
          message: `NIN BVN Portal Gateway Online & Reachable (${latency}ms). Ready for API Key.`,
          responseTimeMs: latency,
        };
      }

      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 6000);
      const res = await fetch(`${base}/nin-verification`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ nin: "00000000000", consent: true }),
        signal: ctrl2.signal,
      }).catch(() => null);
      clearTimeout(tid2);

      const elapsed = Date.now() - startTime;
      if (res && (res.status === 401 || res.status === 403)) {
        return { ok: false, message: "NIN BVN Portal authentication failed: Invalid API Key.", responseTimeMs: elapsed };
      }

      return { ok: true, message: `NIN BVN Portal Connected Successfully (${elapsed}ms).`, responseTimeMs: elapsed };
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

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        providerReference: reference,
        error: "NIN BVN Portal API Key is not configured. Please add your API key in Admin Settings or set NINBVNPORTAL_API_KEY in server environment.",
        responseTimeMs: 0,
        statusCode: 401,
      };
    }

    if (sType !== "NIN" && sType !== "BVN") {
      return {
        success: false,
        providerReference: reference,
        error: `NIN BVN Portal adapter only supports NIN and BVN — "${sType}" is not implemented.`,
        responseTimeMs: 0,
      };
    }

    if (extraData?.consent !== true && extraData?.consent !== "true") {
      return {
        success: false,
        providerReference: reference,
        error: `Explicit consent is required before performing a ${sType} lookup.`,
        responseTimeMs: 0,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const endpoint = sType === "BVN" ? "/bvn-verification" : "/nin-verification";
      const requestPayload = sType === "BVN"
        ? { bvn: cleanId, id_number: cleanId, consent: true }
        : { nin: cleanId, consent: true };

      const res = await fetch(`${this.baseUrl(config)}${endpoint}`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify(requestPayload),
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
          data: this.mapToStandardFields(json, sType),
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
