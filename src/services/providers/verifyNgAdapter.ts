/**
 * VerifyNG Identity Verification Adapter (kyc.edirect.ng / api.verifyn.ng)
 * Docs: https://kyc.edirect.ng/docs
 * Base URL: https://api.verifyn.ng/api/v1 (sandbox: https://sandbox.verifyn.ng/api/v1)
 *
 * Auth is two-step:
 *   1. HMAC-SHA256 sign every request: client_key|unix_timestamp|METHOD|/api/v1/path|sha256(body)
 *      signed with api_secret, sent as X-Client-Key / X-Timestamp / X-Signature headers.
 *   2. Exchange one signed request for a JWT via POST /auth/token (valid 60 min — cache it,
 *      do not fetch a new one on every call; rate limit is 10/min on this endpoint).
 *   3. Every other call needs BOTH the HMAC headers AND "Authorization: Bearer <jwt>".
 *
 * config.secretKey holds api_secret. config.clientId (or config.apiKey, whichever the
 * admin form uses) holds client_key — this adapter checks both, use whichever field
 * the provider form actually exposes.
 *
 * IMPORTANT: this API does not return address or LGA fields for NIN — only name, DOB,
 * gender, phone, state of origin, and photo. Slip templates needing address/LGA will
 * show those blank when this provider is the source; only LumiID / NIN BVN Portal
 * currently supply address+LGA.
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter } from "./aspfiyAdapter";

export interface VerifyNGVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export class VerifyNGAdapter implements ProviderAdapter {
  id = "verifyng";
  name = "VerifyNG (kyc.edirect.ng)";

  private baseUrl(config: PaymentProviderConfig): string {
    return (config.baseUrl || "https://api.verifyn.ng/api/v1").replace(/\/+$/, "");
  }

  private clientKey(config: PaymentProviderConfig): string {
    return String((config as any).clientId || (config as any).apiKey || "").trim();
  }

  private apiSecret(config: PaymentProviderConfig): string {
    return String(config.secretKey || "").trim();
  }

  private buildHmacHeaders(config: PaymentProviderConfig, method: string, path: string, body: string): Record<string, string> {
    const clientKey = this.clientKey(config);
    const apiSecret = this.apiSecret(config);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
    const signingString = [clientKey, timestamp, method.toUpperCase(), `/api/v1${path}`, bodyHash].join("|");
    const signature = crypto.createHmac("sha256", apiSecret).update(signingString).digest("hex");

    return {
      "X-Client-Key": clientKey,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async getJwt(config: PaymentProviderConfig): Promise<string> {
    const clientKey = this.clientKey(config);
    const cached = tokenCache.get(clientKey);
    if (cached && cached.expiresAt > Date.now() + 5000) {
      return cached.token;
    }

    const body = "{}";
    const headers = this.buildHmacHeaders(config, "POST", "/auth/token", body);
    const res = await fetch(`${this.baseUrl(config)}/auth/token`, {
      method: "POST",
      headers,
      body,
    });
    const json: any = await res.json().catch(() => null);

    if (!res.ok || !json?.success || !json?.data?.access_token) {
      throw new Error(json?.error?.message || `VerifyNG token exchange failed (HTTP ${res.status}).`);
    }

    const expiresInMs = (json.data.expires_in || 3600) * 1000;
    tokenCache.set(clientKey, { token: json.data.access_token, expiresAt: Date.now() + expiresInMs });
    return json.data.access_token;
  }

  private mapToStandardFields(checkResult: any): Record<string, any> {
    const d = checkResult || {};
    return {
      fullName: d.matched_name || [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ") || "",
      firstName: d.first_name || "",
      lastName: d.last_name || "",
      middleName: d.middle_name || "",
      gender: d.gender || "",
      dateOfBirth: d.date_of_birth || "",
      phoneNumber: d.phone_number || "",
      email: "",
      address: "",
      stateOfOrigin: d.state_of_origin || "",
      lga: "",
      photoUrl: d.photo ? `data:image/jpeg;base64,${d.photo}` : "",
      confidence: d.confidence,
      rawFields: d,
    };
  }

  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    try {
      if (!this.clientKey(config) || !this.apiSecret(config)) {
        return { ok: false, message: "VerifyNG Client Key and/or API Secret is missing.", responseTimeMs: 0 };
      }
      await this.getJwt(config);
      const elapsed = Date.now() - startTime;
      return { ok: true, message: "Connected — HMAC signature and token exchange succeeded.", responseTimeMs: elapsed };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        ok: false,
        message: err?.message || "VerifyNG authentication failed.",
        responseTimeMs: elapsed,
      };
    }
  }

  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<VerifyNGVerificationResult> {
    const startTime = Date.now();
    const sType = serviceType.toUpperCase();
    const cleanId = String(targetId).replace(/\D/g, "").trim();
    const reference = extraData.reference || `VNG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (sType !== "NIN" && sType !== "BVN") {
      return {
        success: false,
        providerReference: reference,
        error: `VerifyNG adapter does not support service type "${sType}" — only NIN and BVN are wired up here (the API also supports drivers_license, voters_card, passport, cac if needed later).`,
        responseTimeMs: 0,
      };
    }

    const checkKey = sType.toLowerCase();

    try {
      const jwt = await this.getJwt(config);

      const bodyObj: Record<string, any> = {
        checks: [checkKey],
        [checkKey]: cleanId,
        reference,
      };
      if (extraData.firstName) bodyObj.first_name = extraData.firstName;
      if (extraData.lastName) bodyObj.last_name = extraData.lastName;

      const body = JSON.stringify(bodyObj);
      const headers = {
        ...this.buildHmacHeaders(config, "POST", "/verify", body),
        Authorization: `Bearer ${jwt}`,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${this.baseUrl(config)}/verify`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      const json: any = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.data?.checks?.[checkKey]?.status === "passed") {
        const checkResult = json.data.checks[checkKey];
        return {
          success: true,
          providerReference: json.data.session_id || reference,
          transactionId: json.data.session_id || reference,
          data: this.mapToStandardFields(checkResult),
          responseTimeMs: elapsed,
          statusCode: res.status,
        };
      }

      return {
        success: false,
        providerReference: reference,
        error: json?.error?.message || `VerifyNG check did not pass (outcome: ${json?.data?.outcome || "unknown"}).`,
        responseTimeMs: elapsed,
        statusCode: res.status,
      };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        success: false,
        providerReference: reference,
        error: err?.name === "AbortError" ? "VerifyNG request timed out after 12000ms." : (err?.message || "VerifyNG gateway error."),
        responseTimeMs: elapsed,
        statusCode: 504,
      };
    }
  }
}
