/**
 * Identro Identity & Business Verification Portal Adapter (identro.ng)
 * Official Documentation: https://identro.ng | https://api.identro.ng/merchant-api
 * Base URL: https://api.identro.ng (prefix: /merchant-api)
 * Authentication:
 *   - x-api-key: <apiKey>
 *   - Authorization: Bearer <apiKey>
 *   - Content-Type: application/json
 *   - Accept: application/json
 *
 * Supported Services:
 *   1. NIN (National Identification Number) — /merchant-api/nin, /merchant-api/v1/nin, /merchant-api/identity/nin
 *   2. BVN (Bank Verification Number) — /merchant-api/bvn, /merchant-api/v1/bvn, /merchant-api/identity/bvn
 *   3. CAC / KYB (Corporate Affairs Commission) — /merchant-api/cac, /merchant-api/business/cac, /merchant-api/v1/cac
 *   4. Phone Identity Lookup — /merchant-api/phone, /merchant-api/identity/phone
 *   5. TIN (Tax Identification Number) — /merchant-api/tin, /merchant-api/identity/tin
 *   6. Driver's License — /merchant-api/drivers-license, /merchant-api/dl
 *   7. Voter's Card (VIN) — /merchant-api/voters-card, /merchant-api/vin
 *   8. Wallet Balance — /merchant-api/wallet, /merchant-api/balance
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";
import { formatNaira } from "../../utils/formatUtils";

export interface IdentroVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  rawResponse?: any;
}

export class IdentroAdapter implements ProviderAdapter {
  id = "identro";
  name = "Identro Portal (identro.ng)";

  /**
   * Resolve Base URL for Identro API (default: https://api.identro.ng)
   */
  private baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://api.identro.ng";
    return String(raw).trim().replace(/\/+$/, "");
  }

  /**
   * Generate clean candidate full URLs avoiding duplicate path prefixes like /merchant-api/merchant-api
   */
  private resolveCandidateUrls(base: string, endpointPaths: string[]): string[] {
    const cleanBase = base.trim().replace(/\/+$/, "");
    const rootBase = cleanBase
      .replace(/\/merchant-api\/?$/i, "")
      .replace(/\/api\/v1\/?$/i, "")
      .replace(/\/api\/?$/i, "")
      .replace(/\/+$/, "");

    const urls: string[] = [];
    const addUrl = (u: string) => {
      if (!urls.includes(u)) urls.push(u);
    };

    for (const path of endpointPaths) {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      // 1. Path directly on rootBase
      addUrl(`${rootBase}${cleanPath}`);
      // 2. If cleanBase was specified with a subpath (e.g. /merchant-api) and cleanPath doesn't already repeat it
      if (cleanBase !== rootBase && !cleanPath.startsWith("/merchant-api") && !cleanPath.startsWith("/api")) {
        addUrl(`${cleanBase}${cleanPath}`);
      }
    }

    return urls;
  }

  /**
   * Resolve live API key, falling back to process.env if stored key is masked
   */
  private getResolvedKey(config: PaymentProviderConfig): string {
    const raw = String(config.secretKey || config.apiKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 10) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(
      process.env.IDENTRO_API_KEY ||
      process.env.IDENTRO_SECRET_KEY ||
      raw ||
      ""
    ).trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Build authentication and request headers according to Identro specification
   */
  private headers(config: PaymentProviderConfig): Record<string, string> {
    const cleanKey = this.getResolvedKey(config);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-Identro-Client/1.0",
    };

    if (cleanKey) {
      headers["x-api-key"] = cleanKey;
    }

    return headers;
  }

  /**
   * Sanitize error message to prevent sensitive leakage
   */
  private sanitizeError(raw: any): string {
    if (!raw) return "Identro portal request failed.";
    let s = typeof raw === "string" ? raw : JSON.stringify(raw);
    s = s.replace(/(?:sk_live_|sk_test_|secp256k1|Bearer\s+|x-api-key['"]?:\s*['"]?)[a-zA-Z0-9_\-\.]{15,}/gi, "[REDACTED_SECRET]");
    s = s.replace(/\{'id_number':\s*\[?'([^']+)'\]?\}/g, "$1");
    s = s.replace(/\{['"]?(\w+)['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1: $2");
    s = s.replace(/[\[\]'"{}]/g, "").trim();
    return s || "Identro portal request failed.";
  }

  /**
   * Extract user-friendly error message from API response body
   */
  private extractErrorMessage(json: any, status: number): string {
    if (!json) return `Identro verification rejected (HTTP ${status}).`;

    if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    if (typeof json.msg === "string" && json.msg.trim()) return json.msg.trim();
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (typeof json.data?.message === "string" && json.data.message.trim()) return json.data.message.trim();

    return `Identro verification rejected (HTTP ${status}).`;
  }

  /**
   * Format photo data from Identro response (Base64 data URI or image URL)
   */
  private formatPhotoUrl(rawPhoto?: string): string {
    if (!rawPhoto || typeof rawPhoto !== "string") return "";
    const clean = rawPhoto.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:image/")) {
      return clean;
    }
    return `data:image/jpeg;base64,${clean}`;
  }

  /**
   * Map raw Identro response to SmartLink unified identity schema
   */
  public mapToStandardFields(raw: any, serviceType?: string): Record<string, any> {
    const d = raw?.data || raw?.result || raw?.response || raw?.payload || raw || {};

    const firstName = d.firstname || d.first_name || d.firstName || "";
    const lastName = d.surname || d.last_name || d.lastName || "";
    const middleName = d.middlename || d.middle_name || d.middleName || "";
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
      dateOfBirth: d.birthdate || d.date_of_birth || d.dateOfBirth || d.dob || d.birth_date || "",
      phoneNumber: normalizeNigerianPhone(
        d.telephoneno || d.phone_number || d.phoneNumber || d.phone || d.mobile || ""
      ),
      email: d.email || d.email_address || "",
      address:
        d.residence_address ||
        d.address ||
        d.residenceAddress ||
        d.residential_address ||
        d.street_address ||
        "",
      stateOfOrigin:
        d.state_of_origin ||
        d.stateOfOrigin ||
        d.origin_state ||
        d.state ||
        "",
      lga:
        d.lga ||
        d.lgaOfOrigin ||
        d.origin_lga ||
        d.local_government ||
        d.residence_lga ||
        "",
      stateOfResidence:
        d.residence_state ||
        d.stateOfResidence ||
        d.resident_state ||
        "",
      religion: d.religion || "",
      profession: d.profession || d.occupation || "",
      height: d.height || "",
      maritalStatus: d.maritalstatus || d.marital_status || d.maritalStatus || "",
      title: d.title || "",
      nin: d.nin || d.nin_number || (serviceType === "NIN" ? d.id_number || d.idNumber : "") || "",
      bvn: d.bvn || d.bvn_number || (serviceType === "BVN" ? d.id_number || d.idNumber : "") || "",
      photoUrl,
      photo: photoUrl,
      signatureUrl: this.formatPhotoUrl(d.signature || d.signature_url || d.signatureUrl),
      trackingId: d.tracking_id || d.trackingId || d.trackingID || "",
      reference: d.reference || d.identro_reference || "",
      // CAC fields
      rcNumber: d.rc_number || d.rcNumber || d.registration_number || "",
      companyName: d.company_name || d.companyName || d.business_name || d.businessName || "",
      companyType: d.company_type || d.companyType || d.classification || "",
      registrationDate: d.registration_date || d.registrationDate || d.incorporation_date || "",
      branchAddress: d.branch_address || d.branchAddress || d.head_office_address || "",
      city: d.city || "",
      // Extra raw container for full PDF generator access
      rawFields: d,
    };

    return standard;
  }

  /**
   * Test connection to Identro Portal
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    const base = this.baseUrl(config);
    const key = this.getResolvedKey(config);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let hostResponded = false;
      let hostLatency = 0;

      // 1. Check reachability via official health endpoint
      try {
        const pingRes = await fetch(`${base}/api/v1/health`, {
          method: "GET",
          headers: { "User-Agent": "SmartLink-Identro/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        hostLatency = Date.now() - startTime;
        if (pingRes.status) {
          hostResponded = true;
        }
      } catch {
        clearTimeout(timeoutId);
        // Fallback root / merchant-api ping
        try {
          const rootRes = await fetch(`${base}/merchant-api`, {
            method: "GET",
            headers: { "User-Agent": "SmartLink-Identro/1.0" },
          });
          if (rootRes.status) {
            hostResponded = true;
            hostLatency = Date.now() - startTime;
          }
        } catch {}
      }

      if (!hostResponded) {
        return {
          ok: false,
          message: "Identro API server unreachable. Please verify base URL and network connectivity.",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // 2. If credentials are empty, inform that the host is online and ready for API key
      if (!key) {
        return {
          ok: true,
          message: `Identro Portal Online & Reachable (${hostLatency}ms). Ready for x-api-key credentials.`,
          responseTimeMs: hostLatency,
        };
      }

      // 3. If credentials provided, validate API key via merchant API endpoint probe
      try {
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 10000);

        const checkRes = await fetch(`${base}/api/v1/merchant-api/nin/verify`, {
          method: "POST",
          headers: this.headers(config),
          body: JSON.stringify({}),
          signal: authController.signal,
        });
        clearTimeout(authTimeout);

        const elapsed = Date.now() - startTime;
        if (checkRes.status === 401 || checkRes.status === 403) {
          return {
            ok: false,
            message: `Identro Authentication Rejected (HTTP ${checkRes.status}). Please verify your x-api-key.`,
            responseTimeMs: elapsed,
          };
        } else {
          return {
            ok: true,
            message: `Identro Portal Connected & API Key Verified (${elapsed}ms). API is healthy.`,
            responseTimeMs: elapsed,
          };
        }
      } catch {
        const elapsed = hostLatency || (Date.now() - startTime);
        return {
          ok: true,
          message: `Identro Portal Online & Connected (${elapsed}ms).`,
          responseTimeMs: elapsed,
        };
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        ok: false,
        message: this.sanitizeError(err?.message || "Identro connection error."),
        responseTimeMs: elapsed,
      };
    }
  }

  /**
   * Execute real identity verification via Identro Merchant API
   */
  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<IdentroVerificationResult> {
    const startTime = Date.now();
    const sType = (serviceType || "").toUpperCase().trim();
    const cleanId = String(targetId || "").trim();
    const reference = extraData.reference || `IDN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const consentRef = extraData.consentReference || `APP-CONSENT-${Date.now()}`;

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        providerReference: reference,
        error: "Identro API Key (x-api-key) is missing. Please configure it in Admin Dashboard > API Providers.",
        responseTimeMs: 0,
      };
    }

    const base = this.baseUrl(config);

    // Strict DTO payloads according to Identro specification
    let candidatePaths: string[] = [];
    let payload: Record<string, any> = {};

    switch (sType) {
      case "NIN":
      case "VNIN":
      case "NIN_PHONE": {
        candidatePaths = [
          "/api/v1/merchant-api/nin/verify",
          "/merchant-api/nin/verify",
        ];
        payload = {
          nin: cleanId,
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "BVN":
      case "BVN_BASIC":
      case "BVN_ADVANCE": {
        candidatePaths = [
          "/api/v1/merchant-api/bvn/verify",
          "/merchant-api/bvn/verify",
        ];
        payload = {
          bvn: cleanId,
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "CAC":
      case "KYB": {
        candidatePaths = [
          "/api/v1/merchant-api/cac/verify",
          "/merchant-api/cac/verify",
        ];
        payload = {
          rcNumber: cleanId,
          serviceType: extraData.serviceType || "CAC_BASIC_VERIFICATION",
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "PHONE": {
        const phone = normalizeNigerianPhone(cleanId);
        candidatePaths = [
          "/api/v1/merchant-api/phone/verify",
          "/merchant-api/phone/verify",
        ];
        payload = {
          phoneNumber: phone,
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "TIN": {
        candidatePaths = [
          "/api/v1/merchant-api/tin/verify",
          "/merchant-api/tin/verify",
        ];
        payload = {
          tin: cleanId,
          serviceType: extraData.serviceType || "TIN_VALIDATION",
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "DRIVERS_LICENSE":
      case "DL": {
        candidatePaths = [
          "/api/v1/merchant-api/drivers-license/verify",
          "/merchant-api/drivers-license/verify",
        ];
        payload = {
          licenseNumber: cleanId,
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      case "VOTERS_CARD":
      case "VIN": {
        candidatePaths = [
          "/api/v1/merchant-api/voters-card/verify",
          "/merchant-api/voters-card/verify",
        ];
        payload = {
          vin: cleanId,
          consentCaptured: true,
          consentReference: consentRef,
        };
        break;
      }
      default: {
        candidatePaths = [
          `/api/v1/merchant-api/${sType.toLowerCase()}/verify`,
          `/merchant-api/${sType.toLowerCase()}/verify`,
          `/api/v1/merchant-api/${sType.toLowerCase()}`,
        ];
        payload = {
          idNumber: cleanId,
          consentCaptured: true,
          consentReference: consentRef,
        };
      }
    }

    const candidateUrls = this.resolveCandidateUrls(base, candidatePaths);
    let lastError = "";
    let lastStatusCode = 500;

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(url, {
          method: "POST",
          headers: this.headers(config),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        lastStatusCode = res.status;
        const json: any = await res.json().catch(() => null);

        // Path not found (404) -> continue to next candidate URL
        if (res.status === 404) {
          lastError = `Identro path ${url.replace(/https?:\/\/[^/]+/, "")} returned 404`;
          continue;
        }

        const isSuccess =
          res.ok &&
          Boolean(json) &&
          (json.success === true ||
            json.status === true ||
            json.status === "success" ||
            json.code === "SUCCESS") &&
          Boolean(json.data && typeof json.data === "object");

        if (isSuccess) {
          const rawData = json.data || json.result || json.payload || json;
          const standardized = this.mapToStandardFields(rawData, sType);

          return {
            success: true,
            providerReference: json?.reference || json?.provider_reference || reference,
            transactionId: json?.transaction_id || json?.id || reference,
            data: standardized,
            rawResponse: json,
            statusCode: res.status,
            responseTimeMs: Date.now() - startTime,
          };
        }

        const extractedMsg = this.extractErrorMessage(json, res.status);
        lastError = this.sanitizeError(extractedMsg);

        // If explicitly unauthorized or validation error, stop trying other paths
        if (res.status === 401 || res.status === 403 || res.status === 422 || res.status === 400) {
          break;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          lastError = "Identro request timed out after 20000ms.";
        } else {
          lastError = this.sanitizeError(err?.message || "Identro network error.");
        }
      }
    }

    let cleanError = lastError || "Failed to complete verification via Identro Portal.";
    if (cleanError.includes("returned 404") || cleanError.includes("404")) {
      cleanError = `Identity record not found for ${sType} number "${cleanId}". Please verify the number and try again.`;
    }

    return {
      success: false,
      providerReference: reference,
      error: cleanError,
      statusCode: lastStatusCode,
      responseTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Retrieve current Identro wallet balance / credits
   */
  async checkBalance(
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    const base = this.baseUrl(config);
    const candidatePaths = ["/merchant-api/wallet", "/merchant-api/balance", "/merchant-api/account"];

    for (const path of candidatePaths) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${base}${path}`, {
          method: "GET",
          headers: this.headers(config),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 404) continue;

        const json: any = await res.json().catch(() => null);
        if (res.ok && (json?.status === true || json?.success === true || json?.data)) {
          const bal = Number(json?.data?.balance ?? json?.balance ?? 0);
          return {
            success: true,
            balance: isNaN(bal) ? 0 : bal,
            currency: json?.data?.currency || json?.currency || "NGN",
          };
        }
      } catch (err: any) {
        return { success: false, error: this.sanitizeError(err?.message || "Identro wallet check error") };
      }
    }

    return { success: false, error: "Unable to query Identro balance endpoint." };
  }
}
