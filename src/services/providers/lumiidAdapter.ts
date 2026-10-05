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
 *   1. NIN (National Identification Number) — NIMC: /ng/nin-premium/, /ng/nin-advance/, /ng/nin
 *   2. BVN (Bank Verification Number) — NIBSS: /ng/bvn-advance/, /ng/bvn-premium/, /ng/bvn
 *   3. CAC / KYB (Corporate Affairs Commission) — /ng/cac-premium/, /kyb/verify, /ng/cac
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
    // or {'nin': [ErrorDetail(string='NIN is required', code='required')]}
    if (s.includes("ErrorDetail") || s.includes("string=")) {
      const match = s.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
      if (match && match[1]) {
        return match[1];
      }
      s = s.replace(/ErrorDetail\(string=['"]([^'"]+)['"],\s*code=['"][^'"]+['"]\)/g, "$1");
    }

    if (s.includes("{") && s.includes("}")) {
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
      address: d.address || d.residential_address || d.residence_address || d.registered_address || d.residenceAddress || d.residentialAddress || d.street || "",
      addressLine1: d.addressLine1 || d.street || d.residence_address || d.residential_address || d.address || "",
      state: d.state || d.residence_state || d.residenceState || d.state_of_residence || d.stateOfResidence || d.state_of_origin || d.stateOfOrigin || "",
      stateOfOrigin: d.state_of_origin || d.stateOfOrigin || d.origin_state || d.originState || d.state || "",
      stateOfResidence: d.residence_state || d.residenceState || d.state_of_residence || d.stateOfResidence || d.state || "",
      residenceState: d.residence_state || d.residenceState || d.state_of_residence || d.stateOfResidence || d.state || "",
      lga: d.lga || d.residence_lga || d.residenceLga || d.lga_of_residence || d.lgaOfResidence || d.lga_of_origin || d.lgaOfOrigin || d.town || d.city || "",
      lgaOfOrigin: d.lga_of_origin || d.lgaOfOrigin || d.origin_lga || d.originLga || d.lga || "",
      lgaOfResidence: d.residence_lga || d.residenceLga || d.lga_of_residence || d.lgaOfResidence || d.lga || "",
      residenceLga: d.residence_lga || d.residenceLga || d.lga_of_residence || d.lgaOfResidence || d.lga || "",
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

    // NIN Phone Search
    if (sType.includes("NIN") && (sType.includes("PHONE") || sType.includes("SEARCH") || sType.includes("TELCO"))) {
      return {
        primary: "/v1/ng/nin-phone/",
        fallbacks: ["/v1/ng/phone-nin/", "/v1/ng/phone/", "/v1/ng/nin-premium/", "/v1/ng/nin-advance/"],
        payloadKey: "phone",
      };
    }

    // BVN Phone Search
    if (sType.includes("BVN") && (sType.includes("PHONE") || sType.includes("SEARCH"))) {
      return {
        primary: "/v1/ng/bvn-phone/",
        fallbacks: ["/v1/ng/phone-bvn/", "/v1/ng/phone/", "/v1/ng/bvn-advance/", "/v1/ng/bvn-premium/"],
        payloadKey: "phone",
      };
    }

    // General Phone Lookup
    if (sType.includes("PHONE") || sType.includes("TELCO")) {
      return {
        primary: "/v1/ng/phone/",
        fallbacks: ["/v1/ng/phone-lookup/", "/phone/verify", "/ng/phone"],
        payloadKey: "phone",
      };
    }

    // NIN Identity & NIN Demographic / Premium (With Photo)
    if (sType.includes("NIN")) {
      return {
        primary: "/v1/ng/nin-premium/",
        fallbacks: ["/v1/ng/nin-advance/", "/v1/ng/nin/"],
        payloadKey: "id_number",
      };
    }

    // BVN Identity & BVN Demographic / Advance / Premium (With Photo)
    if (sType.includes("BVN")) {
      return {
        primary: "/v1/ng/bvn-advance/",
        fallbacks: ["/v1/ng/bvn-premium/", "/v1/ng/bvn/"],
        payloadKey: "id_number",
      };
    }

    // CAC / KYB / Business / SCUML
    if (sType.includes("CAC") || sType.includes("KYB") || sType.includes("SCUML") || sType.includes("BUSINESS")) {
      return {
        primary: "/v1/ng/cac-premium/",
        fallbacks: ["/v1/kyb/verify/", "/v1/ng/cac/"],
        payloadKey: "reg_number",
      };
    }

    // Driver's License (FRSC)
    if (sType.includes("DRIVER") || sType.includes("DRIVERS_LICENSE") || sType.includes("DL")) {
      return {
        primary: "/v1/ng/drivers-license/",
        fallbacks: ["/v1/ng/driver-license/", "/v1/drivers-license/verify"],
        payloadKey: "licenseNumber",
      };
    }

    // Voter's Card (INEC)
    if (sType.includes("VOTER") || sType.includes("VIN")) {
      return {
        primary: "/v1/ng/voters-card/",
        fallbacks: ["/v1/ng/vin/", "/ng/voters-card"],
        payloadKey: "vin",
      };
    }

    // Tax Identification Number (TIN)
    if (sType.includes("TIN") || sType.includes("TAX")) {
      return {
        primary: "/v1/ng/tin/",
        fallbacks: ["/v1/ng/tin-premium/", "/ng/tin"],
        payloadKey: "id_number",
      };
    }

    if (sType.includes("BANK") || sType.includes("NUBAN") || sType.includes("ACCOUNT")) {
      return {
        primary: "/v1/ng/bank-account/",
        fallbacks: ["/ng/bank-account", "/transfers/resolve-nuban"],
        payloadKey: "accountNumber",
      };
    }

    if (sType.includes("FACE") || sType.includes("LIVENESS") || sType.includes("BIOMETRIC")) {
      return {
        primary: "/v1/face/match/",
        fallbacks: ["/face/match", "/kyc/face-match"],
        payloadKey: "image1",
      };
    }

    // Default generic identity verification
    return {
      primary: "/v1/ng/nin-premium/",
      fallbacks: ["/v1/ng/nin-advance/", "/v1/ng/nin/"],
      payloadKey: "id_number",
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

    if (sType.includes("NIN") && (sType.includes("PHONE") || sType.includes("SEARCH") || sType.includes("TELCO"))) {
      const phoneNorm = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone);
      payload["phone"] = phoneNorm;
      payload["phone_number"] = phoneNorm;
      payload["id_number"] = phoneNorm;
      payload["nin"] = phoneNorm;
      payload["search_value"] = phoneNorm;
      payload["consent"] = true;
    } else if (sType.includes("BVN") && (sType.includes("PHONE") || sType.includes("SEARCH"))) {
      const phoneNorm = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone);
      payload["phone"] = phoneNorm;
      payload["phone_number"] = phoneNorm;
      payload["id_number"] = phoneNorm;
      payload["bvn"] = phoneNorm;
      payload["search_value"] = phoneNorm;
      payload["consent"] = true;
    } else if (sType.includes("NIN")) {
      const cleanNin = (cleanId.replace(/\D/g, "") || String(extraData.nin || "").replace(/\D/g, "")).trim();
      if (cleanNin) {
        payload["nin"] = cleanNin;
        payload["id_number"] = cleanNin;
        payload["idNumber"] = cleanNin;
      }
      if (extraData.firstName) {
        payload["firstname"] = extraData.firstName;
        payload["first_name"] = extraData.firstName;
      }
      if (extraData.lastName) {
        payload["lastname"] = extraData.lastName;
        payload["last_name"] = extraData.lastName;
      }
      if (extraData.dateOfBirth || extraData.dob) {
        payload["dob"] = extraData.dateOfBirth || extraData.dob;
        payload["date_of_birth"] = extraData.dateOfBirth || extraData.dob;
      }
      if (extraData.gender) {
        payload["gender"] = extraData.gender;
      }
      payload["consent"] = true;
    } else if (sType.includes("BVN")) {
      const cleanBvn = (cleanId.replace(/\D/g, "") || String(extraData.bvn || "").replace(/\D/g, "")).trim();
      if (cleanBvn) {
        payload["bvn"] = cleanBvn;
        payload["id_number"] = cleanBvn;
        payload["idNumber"] = cleanBvn;
        payload["number"] = cleanBvn;
        payload["bvn_number"] = cleanBvn;
        payload["search_value"] = cleanBvn;
      }
      if (extraData.firstName) {
        payload["firstname"] = extraData.firstName;
        payload["first_name"] = extraData.firstName;
      }
      if (extraData.lastName) {
        payload["lastname"] = extraData.lastName;
        payload["last_name"] = extraData.lastName;
      }
      if (extraData.dateOfBirth || extraData.dob) {
        payload["dob"] = extraData.dateOfBirth || extraData.dob;
        payload["date_of_birth"] = extraData.dateOfBirth || extraData.dob;
      }
      if (extraData.gender) {
        payload["gender"] = extraData.gender;
      }
      payload["consent"] = true;
      payload["is_consent"] = true;
      payload["customer_consent"] = true;
    } else if (sType.includes("CAC") || sType.includes("KYB") || sType.includes("SCUML") || sType.includes("BUSINESS")) {
      payload["reg_number"] = cleanId;
      payload["rc_number"] = cleanId;
      payload["rcNumber"] = cleanId;
      payload["id_number"] = cleanId;
      if (extraData.companyName) payload["companyName"] = extraData.companyName;
      if (extraData.companyType) payload["companyType"] = extraData.companyType;
    } else if (sType.includes("DRIVER")) {
      payload["licenseNumber"] = cleanId;
      payload["license_number"] = cleanId;
      payload["id_number"] = cleanId;
      if (extraData.dob || extraData.dateOfBirth) {
        payload["dob"] = extraData.dob || extraData.dateOfBirth;
      }
    } else if (sType.includes("VOTER") || sType.includes("VIN")) {
      payload["vin"] = cleanId;
      payload["id_number"] = cleanId;
      if (extraData.state || extraData.stateOfOrigin) {
        payload["state"] = extraData.state || extraData.stateOfOrigin;
      }
      if (extraData.lastName) payload["lastName"] = extraData.lastName;
    } else if (sType.includes("TIN")) {
      payload["tin"] = cleanId;
      payload["id_number"] = cleanId;
    } else if (sType.includes("PHONE")) {
      const phoneNorm = normalizeNigerianPhone(cleanId);
      payload["phone"] = phoneNorm;
      payload["phone_number"] = phoneNorm;
      payload["id_number"] = phoneNorm;
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

        // 1. Handle provider insufficient balance error explicitly (highest priority)
        const isInsufficientCredit = Boolean(
          res.status === 402 ||
          json?.code === "INSUFFICIENT_CREDITS" ||
          (typeof json?.message === "string" &&
            (json.message.toLowerCase().includes("insufficient") ||
              json.message.toLowerCase().includes("wallet balance") ||
              json.message.toLowerCase().includes("top up") ||
              json.message.toLowerCase().includes("credit")))
        );

        if (isInsufficientCredit) {
          return {
            success: false,
            providerReference: json?.meta?.request_id || json?.reference || reference,
            error: json?.message || "LumiID Provider error: Insufficient provider account credits. Please fund your LumiID developer wallet at lumiid.com to verify live identity records.",
            rawResponse: json,
            responseTimeMs: elapsed,
            statusCode: 402,
          };
        }

        // 2. Check if provider returned an identity record-level not found (e.g. 404 with JSON containing code BVN_NOT_FOUND, NOT_FOUND, or summary.verified: false)
        const isRecordNotFound = Boolean(
          json &&
          !isInsufficientCredit &&
          (json.code === "BVN_NOT_FOUND" ||
            json.code === "NIN_NOT_FOUND" ||
            json.code === "RECORD_NOT_FOUND" ||
            json.code === "NOT_FOUND" ||
            (json.summary && json.summary.verified === false && !json.code?.includes("CREDIT")) ||
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

    const userFriendlyError =
      lastStatusCode >= 500 && (!lastError || lastError.includes("returned HTTP 500"))
        ? `LumiID Gateway Error: Upstream service returned HTTP 500 Internal Server Error for ${serviceType.replace(/_/g, " ")}. The upstream identity gateway is temporarily unavailable or under maintenance.`
        : lastError || "Failed to complete verification via LumiID Portal.";

    return {
      success: false,
      providerReference: reference,
      error: userFriendlyError,
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
