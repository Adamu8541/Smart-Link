/**
 * LumiID Sovereign Identity Verification Gateway Adapter
 * Official Documentation: https://lumiid.com | https://docs.lumiid.com
 * Base URL: https://api.lumiid.com/v1 (or custom baseUrl / sandbox)
 * Authentication:
 *   - Authorization: Bearer <secretKey>
 *   - X-App-ID: <appId>
 *   - Content-Type: application/json
 *   - Accept: application/json
 *
 * Supported Services:
 *   1. NIN (National Identification Number) — NIMC: /ng/nin-basic/, /ng/nin, /ng/nin-advance
 *   2. BVN (Bank Verification Number) — NIBSS: /ng/bvn-basic/, /ng/bvn, /ng/bvn-advance
 *   3. CAC / KYB (Corporate Affairs Commission) — /kyb/verify, /ng/cac
 *   4. Driver's License — FRSC: /ng/driver-license, /ng/drivers-license
 *   5. Voter's Card (VIN) — INEC: /ng/voters-card, /ng/vin
 *   6. TIN (Tax Identification Number) — FIRS: /ng/tin, /tin/verify
 *   7. Phone Identity Lookup — /ng/phone, /phone/verify
 *   8. Bank Account Resolution (NUBAN) — /ng/bank-account, /transfers/resolve-nuban
 *   9. Biometric Face Match — /face/match, /kyc/face-match
 *   10. Wallet Balance Check — /wallet/balance
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";

export interface LumiIDVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  rawResponse?: any;
}

export class LumiIDAdapter implements ProviderAdapter {
  id = "lumiid";
  name = "LumiID Sovereign Identity Gateway (lumiid.com)";

  /**
   * Resolve Base URL for LumiID API
   */
  private baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://api.lumiid.com/v1";
    return String(raw).trim().replace(/\/+$/, "");
  }

  /**
   * Build authentication and request headers according to LumiID specification
   */
  private headers(config: PaymentProviderConfig): Record<string, string> {
    const key = String(config.secretKey || config.apiKey || "").trim();
    const appId = String(
      (config as any).clientId ||
      (config as any).appId ||
      (config as any).app_id ||
      config.apiKey ||
      ""
    ).trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-LumiID-Client/2.0",
    };

    if (key) {
      headers["Authorization"] = key.startsWith("Bearer ") ? key : `Bearer ${key}`;
    }

    if (appId) {
      headers["X-App-ID"] = appId;
      headers["x-app-id"] = appId;
    }

    return headers;
  }

  /**
   * Sanitize error strings to ensure credentials are never leaked
   */
  private sanitizeError(msg: string): string {
    return String(msg || "")
      .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]")
      .replace(/X-App-ID:\s*[A-Za-z0-9_.-]+/gi, "X-App-ID: [REDACTED]");
  }

  /**
   * Format photo data from LumiID response (Base64 data URI or image URL)
   */
  private formatPhotoUrl(rawPhoto?: string): string {
    if (!rawPhoto || typeof rawPhoto !== "string") return "";
    const clean = rawPhoto.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:image/")) {
      return clean;
    }
    // Assume raw base64 string
    return `data:image/jpeg;base64,${clean}`;
  }

  /**
   * Map raw LumiID response to SmartLink unified identity schema
   */
  public mapToStandardFields(raw: any, serviceType?: string): Record<string, any> {
    const d = raw?.data || raw?.result || raw?.response || raw || {};
    const meta = raw?.meta || {};

    const firstName = d.first_name || d.firstName || d.firstname || "";
    const lastName = d.last_name || d.lastName || d.surname || "";
    const middleName = d.middle_name || d.middleName || d.middlename || "";
    const fullName =
      [firstName, middleName, lastName].filter(Boolean).join(" ") ||
      d.full_name ||
      d.fullName ||
      d.name ||
      d.company_name ||
      d.companyName ||
      "";

    const photoUrl = this.formatPhotoUrl(
      d.photo_url ||
      d.photoUrl ||
      d.photo ||
      d.image ||
      d.base64Image ||
      d.base64_image ||
      d.avatar
    );

    const standard: Record<string, any> = {
      fullName,
      firstName,
      lastName,
      middleName,
      gender: d.gender || d.sex || "",
      dateOfBirth: d.date_of_birth || d.dateOfBirth || d.dob || d.birth_date || "",
      phoneNumber: normalizeNigerianPhone(d.phone || d.phone_number || d.phoneNumber || d.telephone || ""),
      email: d.email || d.email_address || "",
      address: d.address || d.residential_address || d.residence_address || d.registered_address || "",
      stateOfOrigin: d.state_of_origin || d.stateOfOrigin || d.state || "",
      lga: d.lga_of_origin || d.lgaOfOrigin || d.lga || "",
      photoUrl,
      rawPhoto: photoUrl,

      // Specific Identity Numbers
      nin: d.nin || d.national_identity_number || d.vNin || d.vnin || undefined,
      bvn: d.bvn || d.bank_verification_number || undefined,
      tin: d.tin || d.tax_identification_number || d.taxId || undefined,
      driverLicenseNumber: d.license_number || d.driver_license_number || d.licenseNumber || undefined,
      vin: d.vin || d.voter_identification_number || d.voterId || undefined,

      // Corporate / KYB fields
      rcNumber: d.rc_number || d.rcNumber || d.registration_number || d.registrationNumber || undefined,
      companyName: d.company_name || d.companyName || d.name || undefined,
      companyType: d.company_type || d.companyType || d.type || undefined,
      registrationDate: d.registration_date || d.registrationDate || d.incorporation_date || undefined,
      companyStatus: d.status || d.company_status || undefined,
      directors: d.directors || d.beneficial_owners || d.officers || undefined,
      registeredAddress: d.registered_address || d.head_office_address || d.address || undefined,

      // Banking fields
      accountNumber: d.account_number || d.accountNumber || undefined,
      accountName: d.account_name || d.accountName || fullName || undefined,
      bankName: d.bank_name || d.bankName || undefined,
      bankCode: d.bank_code || d.bankCode || undefined,

      // Biometric / Face Match fields
      confidence: d.confidence || d.match_score || d.similarity || undefined,
      isMatch: d.is_match !== undefined ? d.is_match : d.match,

      // Verification metadata
      verificationType: serviceType || d.type || "IDENTITY",
      sourceProvider: "LumiID",
      providerRequestId: meta.request_id || raw.reference || d.reference || undefined,
      rawFields: d,
    };

    return standard;
  }

  /**
   * Determine primary and fallback endpoint paths for a requested service
   */
  private resolveEndpoints(serviceType: string): { primary: string; fallbacks: string[]; payloadKey: string } {
    const sType = serviceType.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    if (sType.includes("NIN")) {
      return {
        primary: "/ng/nin-basic/",
        fallbacks: ["/ng/nin", "/nin/verify", "/nin", "/ng/nin-advance"],
        payloadKey: "nin",
      };
    }

    if (sType.includes("BVN")) {
      return {
        primary: "/ng/bvn-basic/",
        fallbacks: ["/ng/bvn", "/bvn/verify", "/bvn", "/ng/bvn-advance/"],
        payloadKey: "bvn",
      };
    }

    if (sType.includes("CAC") || sType.includes("KYB") || sType.includes("BUSINESS")) {
      return {
        primary: "/kyb/verify",
        fallbacks: ["/ng/cac", "/cac/verify", "/ng/kyb", "/kyb/lookup"],
        payloadKey: "rcNumber",
      };
    }

    if (sType.includes("DRIVER") || sType.includes("DRIVERS_LICENSE") || sType.includes("DL")) {
      return {
        primary: "/ng/driver-license",
        fallbacks: ["/ng/drivers-license", "/drivers-license/verify", "/dl/verify"],
        payloadKey: "licenseNumber",
      };
    }

    if (sType.includes("VOTER") || sType.includes("VIN")) {
      return {
        primary: "/ng/voters-card",
        fallbacks: ["/ng/vin", "/voters-card/verify", "/vin/verify"],
        payloadKey: "vin",
      };
    }

    if (sType.includes("TIN") || sType.includes("TAX")) {
      return {
        primary: "/ng/tin",
        fallbacks: ["/tin/verify", "/ng/tax", "/tax/verify"],
        payloadKey: "tin",
      };
    }

    if (sType.includes("PHONE") || sType.includes("TELCO")) {
      return {
        primary: "/ng/phone",
        fallbacks: ["/phone/verify", "/phone/lookup", "/ng/phone-lookup"],
        payloadKey: "phone",
      };
    }

    if (sType.includes("BANK") || sType.includes("NUBAN") || sType.includes("ACCOUNT")) {
      return {
        primary: "/ng/bank-account",
        fallbacks: ["/transfers/resolve-nuban", "/bank/resolve", "/nuban/verify"],
        payloadKey: "accountNumber",
      };
    }

    if (sType.includes("FACE") || sType.includes("LIVENESS") || sType.includes("BIOMETRIC")) {
      return {
        primary: "/face/match",
        fallbacks: ["/kyc/face-match", "/biometric/verify"],
        payloadKey: "image1",
      };
    }

    // Default generic identity verification
    return {
      primary: "/ng/nin-basic/",
      fallbacks: ["/ng/nin", "/identity/verify"],
      payloadKey: "idNumber",
    };
  }

  /**
   * Build request payload according to service type and documentation specs
   */
  private buildPayload(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any>,
    reference: string,
    payloadKey: string
  ): Record<string, any> {
    const sType = serviceType.toUpperCase();
    const cleanId = String(targetId || "").trim();

    const payload: Record<string, any> = {
      reference,
      search_value: cleanId,
      [payloadKey]: cleanId,
      ...extraData,
    };

    if (sType.includes("NIN")) {
      payload["nin"] = cleanId.replace(/\D/g, "");
      payload["idNumber"] = payload["nin"];
    } else if (sType.includes("BVN")) {
      payload["bvn"] = cleanId.replace(/\D/g, "");
      payload["idNumber"] = payload["bvn"];
    } else if (sType.includes("CAC") || sType.includes("KYB")) {
      payload["rcNumber"] = cleanId;
      payload["rc_number"] = cleanId;
      if (extraData.companyName) payload["companyName"] = extraData.companyName;
      if (extraData.companyType) payload["companyType"] = extraData.companyType;
    } else if (sType.includes("DRIVER")) {
      payload["licenseNumber"] = cleanId;
      payload["license_number"] = cleanId;
      if (extraData.dob || extraData.dateOfBirth) {
        payload["dob"] = extraData.dob || extraData.dateOfBirth;
      }
    } else if (sType.includes("VOTER") || sType.includes("VIN")) {
      payload["vin"] = cleanId;
      if (extraData.state || extraData.stateOfOrigin) {
        payload["state"] = extraData.state || extraData.stateOfOrigin;
      }
      if (extraData.lastName) payload["lastName"] = extraData.lastName;
    } else if (sType.includes("TIN")) {
      payload["tin"] = cleanId;
    } else if (sType.includes("PHONE")) {
      payload["phone"] = normalizeNigerianPhone(cleanId);
    } else if (sType.includes("BANK") || sType.includes("NUBAN")) {
      payload["accountNumber"] = cleanId;
      payload["account_number"] = cleanId;
      if (extraData.bankCode) {
        payload["bankCode"] = extraData.bankCode;
        payload["bank_code"] = extraData.bankCode;
      }
    } else if (sType.includes("FACE")) {
      payload["image1"] = extraData.image1 || extraData.faceImage || "";
      payload["image2"] = extraData.image2 || "";
      if (cleanId) payload["nin"] = cleanId;
    }

    return payload;
  }

  /**
   * Test Connection to LumiID API
   * Queries /wallet/balance with fallback health checks
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; balance?: number }> {
    const startTime = Date.now();
    try {
      const secretKey = String(config.secretKey || config.apiKey || "").trim();
      if (!secretKey) {
        return {
          ok: false,
          message: "LumiID Secret Key is missing. Please provide your Secret Key in API Provider settings.",
          responseTimeMs: 0,
        };
      }

      const endpointsToTry = [
        `${this.baseUrl(config)}/wallet/balance`,
        `${this.baseUrl(config)}/wallet`,
        `${this.baseUrl(config)}/balance`,
        `${this.baseUrl(config)}/ping`,
        `${this.baseUrl(config)}/health`,
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(endpoint, {
            method: "GET",
            headers: this.headers(config),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const elapsed = Date.now() - startTime;
          const json: any = await res.json().catch(() => ({}));

          if (res.status === 401 || res.status === 403) {
            return {
              ok: false,
              message: "LumiID authentication failed: Invalid or expired Secret Key / App ID (HTTP 401/403).",
              responseTimeMs: elapsed,
            };
          }

          if (res.ok) {
            const rawBalance = json?.data?.balance ?? json?.balance ?? json?.data?.wallet_balance ?? json?.credits;
            const balanceNum = typeof rawBalance === "number" ? rawBalance : parseFloat(rawBalance) || undefined;
            const balStr = balanceNum !== undefined ? ` (Wallet Balance: ₦${balanceNum.toLocaleString()})` : "";
            return {
              ok: true,
              message: `LumiID Gateway Connected Successfully${balStr}`,
              responseTimeMs: elapsed,
              balance: balanceNum,
            };
          }
        } catch {
          // Continue to next test endpoint
        }
      }

      // If balance endpoints returned 404, check with a lightweight dry-run
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const pingRes = await fetch(`${this.baseUrl(config)}/ng/nin-basic/`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({ ping: true }),
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      if (pingRes) {
        if (pingRes.status === 401 || pingRes.status === 403) {
          return {
            ok: false,
            message: "LumiID authentication failed: Invalid Secret Key / App ID (Unauthorized).",
            responseTimeMs: elapsed,
          };
        }
        if (pingRes.status === 400 || pingRes.status === 422 || pingRes.ok) {
          return {
            ok: true,
            message: "LumiID Identity Gateway Connected (Authenticated & Ready)",
            responseTimeMs: elapsed,
          };
        }
      }

      return {
        ok: false,
        message: `LumiID unreachable at ${this.baseUrl(config)}. Please verify your Base URL and internet connection.`,
        responseTimeMs: elapsed,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.name === "AbortError" ? "LumiID request timed out." : this.sanitizeError(err?.message || "LumiID unreachable"),
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Main Identity Verification Execution Engine
   * Supports NIN, BVN, CAC, Driver's License, Voter's Card, TIN, Phone, Bank Account, Face Match
   */
  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<LumiIDVerificationResult> {
    const startTime = Date.now();
    const reference = `LMD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { primary, fallbacks, payloadKey } = this.resolveEndpoints(serviceType);
    const candidateEndpoints = [primary, ...fallbacks];

    const payload = this.buildPayload(serviceType, targetId, extraData, reference, payloadKey);
    let lastError = "";
    let lastStatusCode = 500;
    let lastRawResponse: any = null;

    for (const endpointPath of candidateEndpoints) {
      const fullUrl = `${this.baseUrl(config)}${endpointPath}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(fullUrl, {
          method: "POST",
          headers: this.headers(config),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const elapsed = Date.now() - startTime;
        lastStatusCode = res.status;
        const json: any = await res.json().catch(() => null);
        lastRawResponse = json;

        // If 404 endpoint not found, try fallback candidate endpoint
        if (res.status === 404) {
          lastError = `Endpoint ${endpointPath} not found (HTTP 404)`;
          continue;
        }

        // Handle success response envelope
        const isSuccessStatus =
          res.ok &&
          json &&
          (json.status === true ||
            json.status === "success" ||
            json.success === true ||
            json.code === "00" ||
            json.code === 200 ||
            (json.data && !json.error));

        if (isSuccessStatus) {
          const standardizedData = this.mapToStandardFields(json, serviceType);
          const providerRef = json.meta?.request_id || json.reference || json.data?.reference || reference;

          return {
            success: true,
            providerReference: providerRef,
            transactionId: reference,
            data: standardizedData,
            rawResponse: json,
            responseTimeMs: elapsed,
            statusCode: res.status,
          };
        }

        // Handle provider rejection / validation error
        const backendMessage =
          json?.message ||
          json?.error ||
          json?.msg ||
          json?.data?.message ||
          json?.details ||
          `LumiID verification rejected (HTTP ${res.status}).`;

        return {
          success: false,
          providerReference: reference,
          error: this.sanitizeError(backendMessage),
          rawResponse: json,
          responseTimeMs: elapsed,
          statusCode: res.status,
        };
      } catch (err: any) {
        if (err?.name === "AbortError") {
          lastError = "LumiID request timed out after 12000ms.";
          lastStatusCode = 504;
        } else {
          lastError = this.sanitizeError(err?.message || "LumiID network error.");
        }
      }
    }

    return {
      success: false,
      providerReference: reference,
      error: lastError || "Failed to complete verification via LumiID Gateway.",
      rawResponse: lastRawResponse,
      responseTimeMs: Date.now() - startTime,
      statusCode: lastStatusCode,
    };
  }

  /**
   * Retrieve current LumiID wallet credits / balance
   */
  async getBalance(config: PaymentProviderConfig): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl(config)}/wallet/balance`, {
        method: "GET",
        headers: this.headers(config),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok) {
        const bal = json?.data?.balance ?? json?.balance ?? json?.data?.wallet_balance ?? json?.credits;
        return {
          success: true,
          balance: typeof bal === "number" ? bal : parseFloat(bal) || 0,
          currency: json?.data?.currency || json?.currency || "NGN",
        };
      }
      return { success: false, error: json?.message || `HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, error: this.sanitizeError(err?.message || "Balance lookup failed") };
    }
  }

  /**
   * Bank Account Resolution (NUBAN)
   */
  async resolveAccount(
    accountNumber: string,
    bankCode: string,
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; accountName?: string; accountNumber?: string; bankCode?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl(config)}/ng/bank-account`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify({
          accountNumber,
          bankCode,
          reference: `LMD-RESOLVE-${Date.now()}`,
        }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && (json.status === true || json.status === "success" || json.data)) {
        const d = json.data || json;
        return {
          success: true,
          accountName: d.account_name || d.accountName || d.name || "",
          accountNumber: d.account_number || d.accountNumber || accountNumber,
          bankCode,
        };
      }
      return {
        success: false,
        error: json?.message || `Account resolution failed (HTTP ${res.status})`,
      };
    } catch (err: any) {
      return { success: false, error: this.sanitizeError(err?.message || "LumiID account resolution error") };
    }
  }

  /**
   * Webhook Signature Verification
   */
  verifyWebhookSignature(headers: Record<string, any>, rawBody: string, config: PaymentProviderConfig): boolean {
    const signature =
      headers["x-lumiid-signature"] ||
      headers["x-signature"] ||
      headers["signature"] ||
      headers["x-lumi-signature"];

    const secret = config.webhookSecret || config.secretKey || "";
    if (!signature || !secret) return true; // Accept if no signing secret configured

    try {
      const hmac = crypto.createHmac("sha256", secret.trim());
      const expected = hmac.update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}
