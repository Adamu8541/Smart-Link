/**
 * BestVerify Identity & National Verification Gateway Adapter (submit-bestverify.com.ng)
 * Base URL: https://submit-bestverify.com.ng
 *
 * Supported Services:
 *   - bvn-verification: Instant BVN verification
 *   - nin-verification: Instant NIN verification
 *   - nin-verify-by-phone-number: Instant NIN phone lookup
 *   - nin-verify-by-demographic-data: Demographic data verification
 *   - bvn-retrieval: BVN retrieval
 *
 * Authentication:
 *   - Authorization: Bearer <apiKey>
 *   - x-api-key: <apiKey>
 */

import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";

export interface BestVerifyResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  rawResponse?: any;
}

export class BestVerifyAdapter implements ProviderAdapter {
  id = "bestverify";
  name = "BestVerify Identity Gateway (submit-bestverify.com.ng)";

  public baseUrl(config?: PaymentProviderConfig): string {
    const raw = config?.baseUrl || config?.apiUrl || process.env.BESTVERIFY_BASE_URL || "https://submit-bestverify.com.ng";
    return String(raw).trim().replace(/\/+$/, "");
  }

  public getResolvedKey(config?: PaymentProviderConfig): string {
    const raw = String(config?.apiKey || config?.secretKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 10) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(
      process.env.BESTVERIFY_API_KEY ||
      process.env.BESTVERIFY_SECRET_KEY ||
      process.env.SUBMIT_BESTVERIFY_API_KEY ||
      process.env.BEST_VERIFY_API_KEY ||
      "bv_live_3e56d38ad2d1449c106c891ba2c5e3b7be365173750ce408"
    ).trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  private headers(config?: PaymentProviderConfig): Record<string, string> {
    const key = this.getResolvedKey(config);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "SmartLink-BestVerify-Client/1.0",
    };
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
      headers["x-api-key"] = key;
    }
    return headers;
  }

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
   * Map BestVerify raw response to unified SmartLink identity schema
   */
  public mapToStandardFields(raw: any, serviceType?: string): Record<string, any> {
    const d = raw?.data || raw?.result || raw?.response || raw || {};

    const firstName = d.first_name || d.firstName || d.firstname || "";
    const lastName = d.surname || d.last_name || d.lastName || d.lastname || "";
    const middleName = d.middle_name || d.middleName || d.middlename || "";
    const fullName =
      d.full_name ||
      d.fullName ||
      d.name ||
      [firstName, middleName, lastName].filter(Boolean).join(" ") ||
      "";

    const photoUrl = this.formatPhotoUrl(
      d.photo || d.photo_url || d.photoUrl || d.image || d.base64_image || d.base64Image || d.passport
    );

    return {
      fullName,
      firstName,
      lastName,
      middleName,
      gender: d.gender || d.sex || "",
      dateOfBirth: d.date_of_birth || d.dateOfBirth || d.dob || d.birth_date || d.birthdate || "",
      phoneNumber: normalizeNigerianPhone(d.phone || d.phone_number || d.phoneNumber || d.mobile || ""),
      email: d.email || d.email_address || "",
      address: d.address || d.residential_address || d.residence_address || "",
      addressLine1: d.address || d.street || "",
      state: d.state || d.state_of_origin || d.origin_state || "",
      stateOfOrigin: d.state_of_origin || d.origin_state || d.state || "",
      lga: d.lga || d.lga_of_origin || d.origin_lga || "",
      nin: d.nin || d.nin_number || (serviceType?.includes("NIN") ? (d.id_number || d.idNumber) : "") || "",
      bvn: d.bvn || d.bvn_number || (serviceType?.includes("BVN") ? (d.id_number || d.idNumber) : "") || "",
      photoUrl,
      photo: photoUrl,
      rawFields: d,
    };
  }

  /**
   * Non-billable health check: Queries /api/v1/balance
   */
  async testConnection(
    config?: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; balance?: number }> {
    const startTime = Date.now();
    const base = this.baseUrl(config);
    const key = this.getResolvedKey(config);

    if (!key) {
      return {
        ok: false,
        message: "BestVerify API Key is missing. Configure BESTVERIFY_API_KEY in server environment.",
        responseTimeMs: 0,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/api/v1/balance`, {
        method: "GET",
        headers: this.headers(config),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      if (res.status === 200) {
        const json: any = await res.json().catch(() => ({}));
        const balance = Number(json?.data?.balance ?? json?.balance ?? 0);
        return {
          ok: true,
          message: `BestVerify Connected. Upstream Balance: ₦${balance.toLocaleString()} (${elapsed}ms).`,
          balance,
          responseTimeMs: elapsed,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          message: `BestVerify Authentication Rejected (HTTP ${res.status}). Please check API key.`,
          responseTimeMs: elapsed,
        };
      } else {
        return {
          ok: false,
          message: `BestVerify returned HTTP ${res.status} (${elapsed}ms).`,
          responseTimeMs: elapsed,
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        message: `BestVerify connection failed: ${err?.message || "Network error"}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute real identity verification via BestVerify
   */
  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config?: PaymentProviderConfig
  ): Promise<BestVerifyResult> {
    const startTime = Date.now();
    const sType = (serviceType || "").toUpperCase().trim();
    const cleanId = String(targetId || "").trim();
    const reference = extraData.reference || `BV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        providerReference: reference,
        error: "BestVerify API Key is missing. Configure BESTVERIFY_API_KEY in server environment.",
        responseTimeMs: 0,
      };
    }

    const base = this.baseUrl(config);

    // Resolve BestVerify service slug and payload
    let serviceSlug = "bvn-verification";
    const payload: Record<string, any> = {};

    if (sType === "BVN" || sType === "BVN_BASIC" || sType === "BVN_ADVANCE" || sType === "BVN_SLIP") {
      serviceSlug = "bvn-verification";
      payload.bvn = cleanId;
    } else if (sType === "NIN" || sType === "NIN_BASIC" || sType === "NIN_ADVANCE" || sType === "NIN_SLIP") {
      serviceSlug = "nin-verification";
      payload.nin = cleanId;
    } else if (sType.includes("NIN") && sType.includes("PHONE")) {
      serviceSlug = "nin-verify-by-phone-number";
      payload.phone_number = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
    } else if (sType.includes("NIN") && (sType.includes("DEMOGRAPHY") || sType.includes("DEMOGRAPHICS"))) {
      serviceSlug = "nin-verify-by-demographic-data";
      payload.surname = extraData.lastName || extraData.surname || "";
      payload.first_name = extraData.firstName || "";
      payload.birth_date = extraData.dateOfBirth || extraData.dob || "";
      payload.gender = extraData.gender || "MALE";
    } else if (sType.includes("BVN") && (sType.includes("RETRIEVAL") || sType.includes("DEMO"))) {
      serviceSlug = "bvn-retrieval";
      payload.first_name = extraData.firstName || "";
      payload.last_name = extraData.lastName || "";
      payload.phone_number = normalizeNigerianPhone(extraData.phoneNumber || cleanId);
      payload.dob = extraData.dateOfBirth || extraData.dob || "";
    } else {
      serviceSlug = "bvn-verification";
      payload.bvn = cleanId;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // BestVerify order/create endpoint
      const res = await fetch(`${base}/api/v1/order/create`, {
        method: "POST",
        headers: {
          ...this.headers(config),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: serviceSlug,
          ...payload,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json: any = await res.json().catch(() => null);
      const elapsed = Date.now() - startTime;

      if (res.ok && json?.success && json?.data) {
        const standardized = this.mapToStandardFields(json.data, sType);
        return {
          success: true,
          providerReference: json.order_id || json.reference || reference,
          transactionId: json.transaction_id || json.id || reference,
          data: standardized,
          rawResponse: json,
          statusCode: res.status,
          responseTimeMs: elapsed,
        };
      }

      const errMsg =
        json?.message ||
        json?.error ||
        (json?.data?.message) ||
        `BestVerify returned status ${res.status}`;

      return {
        success: false,
        providerReference: reference,
        error: errMsg,
        statusCode: res.status,
        responseTimeMs: elapsed,
        rawResponse: json,
      };
    } catch (err: any) {
      return {
        success: false,
        providerReference: reference,
        error: err?.message || "BestVerify request failed",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
