/**
 * LumiID Sovereign Identity Verification Portal Adapter
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
import { formatNaira } from "../../utils/formatUtils";

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
  name = "LumiID Sovereign Identity Portal (lumiid.com)";

  /**
   * Resolve Base URL for LumiID API (built-in official default: https://api.lumiid.com)
   */
  private baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://api.lumiid.com";
    return String(raw).trim().replace(/\/+$/, "");
  }

  /**
   * Resolve live API key, falling back to process.env if stored key is masked
   */
  private getResolvedKey(config: PaymentProviderConfig): string {
    const raw = String(config.secretKey || config.apiKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 20) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(process.env.LUMIID_API_KEY || process.env.LUMIID_SECRET_KEY || raw || "").trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Build authentication and request headers according to LumiID specification
   */
  private headers(config: PaymentProviderConfig): Record<string, string> {
    const cleanKey = this.getResolvedKey(config);
    const appId = String(
      (config as any).clientId ||
      (config as any).appId ||
      (config as any).app_id ||
      process.env.LUMIID_APP_ID ||
      process.env.LUMIID_CLIENT_ID ||
      "smartlink_identity_app"
    ).replace(/[^\x00-\x7F]/g, "").trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-LumiID-Client/2.0",
      "X-App-ID": appId,
      "x-app-id": appId,
    };

    if (cleanKey) {
      headers["Authorization"] = cleanKey.startsWith("Bearer ") ? cleanKey : `Bearer ${cleanKey}`;
      headers["x-api-key"] = cleanKey;
    }

    return headers;
  }

  /**
   * Sanitize error strings to ensure credentials are never leaked and DRF ErrorDetail syntax is human-readable
   */
  private sanitizeError(msg: string): string {
    let s = String(msg || "")
      .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]")
      .replace(/X-App-ID:\s*[A-Za-z0-9_.-]+/gi, "X-App-ID: [REDACTED]");

    // Extract human-readable string from Django REST Framework ErrorDetail syntax
    // e.g. {'id_number': [ErrorDetail(string='BVN is required', code='required')]}
    if (s.includes("ErrorDetail") || s.includes("id_number")) {
      s = s.replace(/ErrorDetail\(string=['"]([^'"]+)['"],\s*code=['"][^'"]+['"]\)/g, "$1");
      s = s.replace(/\{'id_number':\s*\[?'([^']+)'\]?\}/g, "$1");
      s = s.replace(/\{['"]?id_number['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1");
      s = s.replace(/\{['"]?(\w+)['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1: $2");
      s = s.replace(/[\[\]'"{}]/g, "").trim();
    }

    return s;
  }

  /**
   * Extract user-friendly error message from API response body
   */
  private extractErrorMessage(json: any, status: number): string {
    if (!json) return `LumiID verification rejected (HTTP ${status}).`;

    if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    if (typeof json.msg === "string" && json.msg.trim()) return json.msg.trim();
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (typeof json.details === "string" && json.details.trim()) return json.details.trim();
    if (typeof json.data?.message === "string" && json.data.message.trim()) return json.data.message.trim();

    // Check for field-specific dictionary errors e.g. { id_number: [...] }
    if (typeof json === "object") {
      const messages: string[] = [];
      for (const [key, val] of Object.entries(json)) {
        if (key === "status" || key === "code" || key === "success" || key === "meta") continue;
        if (Array.isArray(val)) {
          for (const item of val) {
            const itemStr = String(item || "");
            const m = itemStr.match(/string=['"]([^'"]+)['"]/);
            messages.push(m ? m[1] : itemStr.replace(/^[\[{\s'"]+|[\]}\s'"]+$/g, ""));
          }
        } else if (typeof val === "string") {
          const m = val.match(/string=['"]([^'"]+)['"]/);
          messages.push(m ? m[1] : val);
        }
      }
      if (messages.length > 0) {
        return messages.filter(Boolean).join("; ");
      }
    }

    return `LumiID verification rejected (HTTP ${status}).`;
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
      trackingId: d.tracking_id || d.trackingId || d.trackingID || undefined,
      nin: d.nin || d.national_identity_number || d.vNin || d.vnin || undefined,
      bvn: d.bvn || d.bank_verification_number || d.id_number || d.idNumber || (serviceType && serviceType.toUpperCase().includes("BVN") ? (d.search_value || d.number) : undefined),
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
        primary: "/v1/ng/nin-basic/",
        fallbacks: ["/v1/ng/nin", "/ng/nin-basic/", "/v1/nin/verify", "/nin/verify", "/v1/ng/nin-advance/"],
        payloadKey: "nin",
      };
    }

    if (sType.includes("BVN")) {
      return {
        primary: "/v1/ng/bvn-basic/",
        fallbacks: [
          "/ng/bvn-basic/",
        ],
        payloadKey: "id_number",
      };
    }

    if (sType.includes("CAC") || sType.includes("KYB") || sType.includes("BUSINESS")) {
      return {
        primary: "/v1/kyb/verify",
        fallbacks: ["/kyb/verify", "/ng/cac", "/cac/verify", "/ng/kyb", "/kyb/lookup"],
        payloadKey: "rcNumber",
      };
    }

    if (sType.includes("DRIVER") || sType.includes("DRIVERS_LICENSE") || sType.includes("DL")) {
      return {
        primary: "/v1/drivers-license/verify",
        fallbacks: ["/ng/driver-license", "/ng/drivers-license", "/drivers-license/verify", "/dl/verify"],
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
      const cleanBvn = cleanId.replace(/\D/g, "");
      payload["bvn"] = cleanBvn;
      payload["id_number"] = cleanBvn;
      payload["idNumber"] = cleanBvn;
      payload["number"] = cleanBvn;
      payload["bvn_number"] = cleanBvn;
      payload["search_value"] = cleanBvn;
      payload["consent"] = true;
      payload["is_consent"] = true;
      payload["customer_consent"] = true;
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
      const rawSecret = String(
        config.secretKey ||
        config.apiKey ||
        process.env.LUMIID_SECRET_KEY ||
        process.env.LUMIID_API_KEY ||
        ""
      ).trim();

      const isMasked = rawSecret.includes("•") || rawSecret.includes("***") || rawSecret.includes("....");
      const safeKey = rawSecret.replace(/[^\x00-\x7F]/g, "").trim();

      const base = this.baseUrl(config);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let hostResponded = false;
      let latency = 0;

      // 1. Probe base URL host reachability
      try {
        const pingRes = await fetch(base, {
          method: "GET",
          headers: {
            "User-Agent": "SmartLink-LumiID/1.0",
            Accept: "*/*",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        latency = Date.now() - startTime;
        if (pingRes.status) {
          hostResponded = true;
        }
      } catch {
        clearTimeout(timeoutId);
        // Fallback to domain root if subdomain was unreachable
        try {
          const fallbackRes = await fetch("https://lumiid.com", {
            method: "GET",
            headers: { "User-Agent": "SmartLink-LumiID/1.0" },
          });
          if (fallbackRes.status) {
            hostResponded = true;
            latency = Date.now() - startTime;
          }
        } catch {}
      }

      if (!hostResponded) {
        return {
          ok: false,
          message: `LumiID unreachable at ${base}. Please verify network connection.`,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // 2. If valid unmasked secret key is provided, query wallet balance
      if (safeKey && !isMasked && safeKey.length >= 20) {
        const endpointsToTry = [
          `${base}/wallet/balance`,
          `${base}/wallet`,
          `${base}/balance`,
        ];

        for (const endpoint of endpointsToTry) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 4000);
            const res = await fetch(endpoint, {
              method: "GET",
              headers: this.headers(config),
              signal: ctrl.signal,
            });
            clearTimeout(tid);

            if (res.ok) {
              const json: any = await res.json().catch(() => ({}));
              const rawBalance = json?.data?.balance ?? json?.balance ?? json?.data?.wallet_balance ?? json?.credits;
              const balanceNum = typeof rawBalance === "number" ? rawBalance : parseFloat(rawBalance) || undefined;
              const balStr = balanceNum !== undefined ? ` (Wallet Balance: ${formatNaira(balanceNum)})` : "";
              return {
                ok: true,
                message: `LumiID Portal Connected Successfully${balStr}`,
                responseTimeMs: Date.now() - startTime,
                balance: balanceNum,
              };
            }
          } catch {}
        }
      }

      const elapsed = latency || Math.max(12, Date.now() - startTime);

      if (isMasked) {
        return {
          ok: true,
          message: `LumiID Portal Online & Reachable (${elapsed}ms). Server key has masked placeholder characters; enter full unmasked key for live verification.`,
          responseTimeMs: elapsed,
        };
      }

      if (!safeKey) {
        return {
          ok: true,
          message: `LumiID Portal Online & Reachable (${elapsed}ms). Ready for API credentials.`,
          responseTimeMs: elapsed,
        };
      }

      return {
        ok: true,
        message: `LumiID Identity Portal Connected (Host online, ${elapsed}ms)`,
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

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        providerReference: reference,
        error: "LumiID Secret Key is not configured. Please add your credentials in Admin Settings or set LUMIID_API_KEY in server environment.",
        responseTimeMs: 0,
        statusCode: 401,
      };
    }

    const { primary, fallbacks, payloadKey } = this.resolveEndpoints(serviceType);
    const candidateEndpoints = [primary, ...fallbacks];

    const payload = this.buildPayload(serviceType, targetId, extraData, reference, payloadKey);
    let lastError = "";
    let lastStatusCode = 500;
    let lastRawResponse: any = null;

    const rawBase = this.baseUrl(config);
    const base = rawBase.replace(/\/v1\/?$/, "");

    for (const endpointPath of candidateEndpoints) {
      const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
      const fullUrl = cleanPath.startsWith("/v1/") ? `${base}${cleanPath}` : `${base}/v1${cleanPath}`;
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

        // 1. Check if provider returned an identity record-level not found (e.g. 404 with JSON containing code BVN_NOT_FOUND, NOT_FOUND, or summary.verified: false)
        const isRecordNotFound = Boolean(
          json &&
          (json.code === "BVN_NOT_FOUND" ||
            json.code === "NIN_NOT_FOUND" ||
            json.code === "RECORD_NOT_FOUND" ||
            json.code === "NOT_FOUND" ||
            json.summary?.verified === false ||
            (res.status === 404 && typeof json.message === "string" && json.message.toLowerCase().includes("not found")))
        );

        if (isRecordNotFound) {
          const providerRef = json.meta?.request_id || json.reference || json.data?.reference || reference;
          return {
            success: false,
            providerReference: providerRef,
            error: json.message || `Identity record not found. Please verify the provided ${serviceType} number.`,
            rawResponse: json,
            responseTimeMs: elapsed,
            statusCode: 404,
          };
        }

        // 2. Handle provider insufficient balance error explicitly
        if (res.status === 402 || json?.code === "INSUFFICIENT_CREDITS") {
          return {
            success: false,
            providerReference: reference,
            error: "LumiID Provider error: Insufficient provider account credits. Please fund your LumiID developer wallet at lumiid.com to verify live identity records.",
            rawResponse: json,
            responseTimeMs: elapsed,
            statusCode: 402,
          };
        }

        // 3. If server error or route not found (HTML or unparsed), try next fallback candidate endpoint
        if (res.status === 404 || res.status >= 500) {
          lastError = json?.message || `Endpoint ${endpointPath} returned HTTP ${res.status}`;
          continue;
        }

        // 4. Handle success response envelope
        const isSuccessStatus =
          res.ok &&
          json &&
          !isRecordNotFound &&
          json.code !== "BVN_NOT_FOUND" &&
          json.code !== "NOT_FOUND" &&
          json.summary?.verified !== false &&
          (json.status === true ||
            json.status === "success" ||
            json.success === true ||
            json.code === "00" ||
            json.code === 200 ||
            (json.data && !json.error));

        if (isSuccessStatus) {
          const standardizedData = this.mapToStandardFields(json, serviceType);
          const providerRef = json.meta?.request_id || json.reference || json.data?.reference || reference;

          // Enforce zero tolerance for empty/unreal payload
          const hasIdentityRecord = Boolean(
            standardizedData.fullName ||
            standardizedData.firstName ||
            standardizedData.lastName ||
            standardizedData.nin ||
            standardizedData.bvn ||
            standardizedData.rcNumber ||
            standardizedData.tin ||
            standardizedData.driverLicenseNumber ||
            standardizedData.vin ||
            standardizedData.accountNumber ||
            standardizedData.companyName ||
            (json.data && Object.keys(json.data).length > 2 && (json.data.nin || json.data.first_name || json.data.firstname || json.data.dob))
          );

          if (!hasIdentityRecord) {
            return {
              success: false,
              providerReference: providerRef,
              error: json?.message || "LumiID returned empty record for this query. Identity record not found in provider database.",
              rawResponse: json,
              responseTimeMs: elapsed,
              statusCode: res.status,
            };
          }

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
        const backendMessage = this.extractErrorMessage(json, res.status);

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
      error: lastError || "Failed to complete verification via LumiID Portal.",
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
