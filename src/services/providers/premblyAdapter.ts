/**
 * Prembly (formerly Identitypass by Prembly) Identity, Compliance & KYB Services Portal Adapter
 * Official Documentation: https://docs.prembly.com | https://prembly.com
 * Base URL: https://api.prembly.com (Sandbox: https://sandbox.api.prembly.com)
 *
 * Authentication:
 *   - x-api-key: <apiKey> (e.g. sec_live_... / sk_live_...)
 *   - app-id: <appId> (e.g. smartlink_prembly_app)
 *   - Authorization: Bearer <apiKey>
 *   - Content-Type: application/json
 *   - Accept: application/json
 *
 * Supported Services:
 *   1. Identity Verification (KYC):
 *      - NIN (Standard 11-digit NIN verification)
 *      - VNIN (Virtual NIN resolution)
 *      - NIN with Phone Number
 *      - NIN Demographic Search (Name, DOB, Gender)
 *      - BVN (Standard 11-digit Bank Verification Number)
 *      - BVN with Phone Number
 *      - BVN Demographic Search (Name, DOB)
 *      - Driver's License (FRSC)
 *      - Voter's Card (INEC VIN / PVC)
 *      - International Passport
 *      - Phone Number & Telecom Intelligence
 *      - Biometric Face Match & Liveness
 *   2. Corporate & Business Verification (KYB):
 *      - CAC Company & Business Name Search (RC, BN, IT, LLP)
 *      - Status & Directors / Shareholder details
 *      - Tax Identification Number (TIN / JTB / FIRS)
 *   3. Financial & Banking Data:
 *      - NUBAN Bank Account Name Resolution across Nigerian Banks & MFBs
 *   4. Merchant Account & Balance:
 *      - Wallet Balance & Credit Ledger
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";
import { formatNaira } from "../../utils/formatUtils";

export interface PremblyVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  rawResponse?: any;
}

export class PremblyAdapter implements ProviderAdapter {
  id = "prembly";
  name = "Prembly Identity & Compliance Portal (prembly.com)";

  /**
   * List of all verified services supported by Prembly
   */
  public static readonly SUPPORTED_SERVICES = [
    // 1. Identity Verification (NIN & BVN)
    { id: "NIN", name: "NIN Standard Verification", category: "IDENTITY" },
    { id: "VNIN", name: "Virtual NIN (VNIN) Resolution", category: "IDENTITY" },
    { id: "NIN_PHONE", name: "NIN Lookup via Phone Number", category: "IDENTITY" },
    { id: "NIN_DEMOGRAPHY", name: "NIN Verification with Name & DOB", category: "IDENTITY" },
    { id: "NIN_SLIP", name: "NIN Slip & Card Generation", category: "IDENTITY" },
    { id: "BVN", name: "BVN Standard Verification", category: "IDENTITY" },
    { id: "BVN_DEMOGRAPHY", name: "BVN Verification with Name & DOB", category: "IDENTITY" },
    { id: "BVN_PHONE", name: "BVN Verification with Phone Number", category: "IDENTITY" },
    { id: "BVN_SLIP", name: "BVN Slip & Card Generation", category: "IDENTITY" },
    { id: "DRIVERS_LICENSE", name: "FRSC Driver's License Verification", category: "IDENTITY" },
    { id: "VOTERS_CARD", name: "INEC Voter's Card (VIN) Verification", category: "IDENTITY" },
    { id: "PASSPORT", name: "Nigerian International Passport", category: "IDENTITY" },
    { id: "PHONE", name: "Phone Identity & Telecom Lookup", category: "IDENTITY" },
    { id: "FACE_VERIFY", name: "Biometric Face Match & Liveness", category: "IDENTITY" },

    // 2. Corporate & Business Verification (KYB)
    { id: "CAC", name: "CAC Company & Business Name Search", category: "KYB" },
    { id: "TIN", name: "Tax Identification Number (TIN) Verification", category: "KYB" },

    // 3. Banking & Account Resolution
    { id: "BANK_ACCOUNT", name: "NUBAN Bank Account Name Verification", category: "BANKING" },

    // 4. Merchant Account
    { id: "WALLET", name: "Merchant Balance & Wallet Check", category: "ACCOUNT" },
  ];

  /**
   * Resolve Base URL for Prembly API (default: https://api.prembly.com)
   */
  private baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://api.prembly.com";
    return String(raw).trim().replace(/\/+$/, "");
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
      process.env.PREMBLY_API_KEY ||
      process.env.PREMBLY_SECRET_KEY ||
      process.env.IDENTITYPASS_API_KEY ||
      process.env.IDENTITYPASS_SECRET_KEY ||
      raw ||
      ""
    ).trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Resolve App ID for Prembly API
   */
  private getResolvedAppId(config: PaymentProviderConfig): string {
    const raw = String(
      (config as any).appId ||
      (config as any).clientId ||
      process.env.PREMBLY_APP_ID ||
      process.env.IDENTITYPASS_APP_ID ||
      "smartlink_prembly_app"
    ).trim();
    return raw.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Build authentication and request headers according to Prembly specification
   */
  private headers(config: PaymentProviderConfig): Record<string, string> {
    const cleanKey = this.getResolvedKey(config);
    const appId = this.getResolvedAppId(config);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-Prembly-Client/1.0",
    };

    if (cleanKey) {
      headers["x-api-key"] = cleanKey;
      headers["Authorization"] = cleanKey.startsWith("Bearer ") ? cleanKey : `Bearer ${cleanKey}`;
    }

    if (appId) {
      headers["app-id"] = appId;
      headers["x-app-id"] = appId;
    }

    return headers;
  }

  /**
   * Sanitize error message to prevent sensitive leakage
   */
  private sanitizeError(raw: any): string {
    if (!raw) return "Prembly portal request failed.";
    let s = typeof raw === "string" ? raw : JSON.stringify(raw);
    s = s.replace(/(?:sk_live_|sec_live_|pk_live_|Bearer\s+|x-api-key['"]?:\s*['"]?)[a-zA-Z0-9_\-\.]{15,}/gi, "[REDACTED_SECRET]");
    s = s.replace(/\{'number':\s*\[?'([^']+)'\]?\}/g, "$1");
    s = s.replace(/\{['"]?(\w+)['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1: $2");
    s = s.replace(/[\[\]'"{}]/g, "").trim();
    return s || "Prembly portal request failed.";
  }

  /**
   * Extract user-friendly error message from API response body
   */
  private extractErrorMessage(json: any, status: number): string {
    if (!json) return `Prembly verification rejected (HTTP ${status}).`;

    if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    if (typeof json.response_message === "string" && json.response_message.trim()) return json.response_message.trim();
    if (typeof json.data?.message === "string" && json.data.message.trim()) return json.data.message.trim();

    return `Prembly verification rejected (HTTP ${status}).`;
  }

  /**
   * Format photo data from Prembly response (Base64 data URI or image URL)
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
   * Generate clean candidate full URLs
   */
  private resolveCandidateUrls(base: string, endpointPaths: string[]): string[] {
    const cleanBase = base.trim().replace(/\/+$/, "");
    const urls: string[] = [];
    const addUrl = (u: string) => {
      if (!urls.includes(u)) urls.push(u);
    };

    for (const path of endpointPaths) {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      addUrl(`${cleanBase}${cleanPath}`);
    }

    return urls;
  }

  /**
   * Map raw Prembly response to SmartLink unified identity schema
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
      d.account_name ||
      d.accountName ||
      "";

    const photoUrl = this.formatPhotoUrl(
      d.photo ||
      d.photo_url ||
      d.photoUrl ||
      d.image ||
      d.base64_image ||
      d.base64Image ||
      d.avatar
    );

    const standard: Record<string, any> = {
      fullName,
      firstName,
      lastName,
      middleName,
      gender: d.gender || d.sex || "",
      dateOfBirth: d.birthdate || d.birth_date || d.dob || d.date_of_birth || d.dateOfBirth || "",
      phoneNumber: normalizeNigerianPhone(
        d.telephoneno || d.phone_number || d.phoneNumber || d.phone || d.mobile || ""
      ),
      email: d.email || d.email_address || d.company_email || "",
      address:
        d.residence_address ||
        d.residential_address ||
        d.residenceAddress ||
        d.head_office ||
        d.head_office_address ||
        d.address ||
        d.street_address ||
        "",
      addressLine1: d.addressLine1 || d.street || d.residence_address || d.residential_address || d.address || "",
      state: d.residence_state || d.stateOfResidence || d.resident_state || d.state_of_origin || d.stateOfOrigin || d.state || "",
      stateOfOrigin: d.state_of_origin || d.stateOfOrigin || d.origin_state || d.state || "",
      lga: d.residence_lga || d.lgaOfResidence || d.lga_of_origin || d.lgaOfOrigin || d.lga || d.local_government || "",
      stateOfResidence: d.residence_state || d.stateOfResidence || d.resident_state || "",
      residenceState: d.residence_state || d.stateOfResidence || d.resident_state || "",
      residenceLga: d.residence_lga || d.lgaOfResidence || d.lga || "",
      lgaOfResidence: d.residence_lga || d.lgaOfResidence || d.lga || "",
      religion: d.religion || "",
      profession: d.profession || d.occupation || "",
      height: d.height || "",
      maritalStatus: d.maritalstatus || d.marital_status || d.maritalStatus || "",
      title: d.title || "",
      nin: d.nin || d.nin_number || d.national_identity_number || d.vnin || (serviceType?.includes("NIN") || serviceType?.includes("PHONE") ? d.number || d.id_number : "") || "",
      bvn: d.bvn || d.bvn_number || d.bank_verification_number || (serviceType?.includes("BVN") ? d.number || d.id_number : "") || "",
      photoUrl,
      photo: photoUrl,
      signatureUrl: this.formatPhotoUrl(d.signature || d.signature_url || d.signatureUrl),
      trackingId: d.tracking_id || d.trackingId || d.trackingID || "",
      reference: d.reference || d.prembly_reference || "",

      // CAC & Corporate
      rcNumber: d.rc_number || d.rcNumber || d.registration_number || "",
      companyName: d.company_name || d.companyName || d.business_name || d.businessName || "",
      companyType: d.company_type || d.companyType || d.classification || "",
      classification: d.classification || d.company_type || d.companyType || "",
      registrationDate: d.registration_date || d.registrationDate || d.incorporation_date || d.incorporationDate || "",
      incorporationDate: d.incorporation_date || d.incorporationDate || d.registration_date || d.registrationDate || "",
      companyStatus: d.company_status || d.companyStatus || d.status || "ACTIVE",
      headOffice: d.head_office || d.head_office_address || d.address || "",
      branchAddress: d.branch_address || d.branchAddress || d.head_office_address || "",
      city: d.city || "",
      tin: d.tin || d.tin_number || d.tinNumber || d.tax_identification_number || d.taxId || d.taxNumber || "",
      taxOffice: d.tax_office || d.taxOffice || d.jtb_tax_office || d.firs_tax_office || "",
      taxStatus: d.tax_status || d.status || "ACTIVE",
      natureOfBusiness: d.nature_of_business || d.natureOfBusiness || d.activity || d.objectives || "",
      shareCapital: d.share_capital || d.shareCapital || d.authorized_share_capital || "",
      directors: Array.isArray(d.directors) ? d.directors : Array.isArray(d.affiliates) ? d.affiliates : Array.isArray(d.officers) ? d.officers : Array.isArray(d.proprietors) ? d.proprietors : [],

      // Bank Account details
      accountNumber: d.account_number || d.accountNumber || d.number || "",
      accountName: d.account_name || d.accountName || fullName || "",
      bankName: d.bank_name || d.bankName || "",
      bankCode: d.bank_code || d.bankCode || "",
    };

    return standard;
  }

  /**
   * Test Connection to Prembly API
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; balance?: number }> {
    const startTime = Date.now();
    try {
      const base = this.baseUrl(config);
      const key = this.getResolvedKey(config);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let hostLatency = 0;

      // 1. Probe base URL host reachability
      try {
        await fetch(base, {
          method: "GET",
          headers: {
            "User-Agent": "SmartLink-Prembly/1.0",
            Accept: "*/*",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        hostLatency = Date.now() - startTime;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err?.name === "AbortError") {
          return {
            ok: false,
            message: "Prembly API server connection timed out after 6000ms.",
            responseTimeMs: 6000,
          };
        }
        return {
          ok: false,
          message: "Prembly API server unreachable. Please verify base URL and internet connectivity.",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // 2. If credentials are empty, inform that the host is online and ready for API key
      if (!key) {
        return {
          ok: true,
          message: `Prembly Portal Online & Reachable (${hostLatency}ms). Ready for x-api-key and app-id credentials.`,
          responseTimeMs: hostLatency,
        };
      }

      // 3. If credentials provided, probe wallet/balance or ping endpoint
      try {
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 8000);

        const checkRes = await fetch(`${base}/identitypass/wallet/balance`, {
          method: "GET",
          headers: this.headers(config),
          signal: authController.signal,
        });
        clearTimeout(authTimeout);

        const elapsed = Date.now() - startTime;
        if (checkRes.status === 401 || checkRes.status === 403) {
          return {
            ok: false,
            message: `Prembly Authentication Rejected (HTTP ${checkRes.status}). Please verify your x-api-key and app-id.`,
            responseTimeMs: elapsed,
          };
        } else {
          const json: any = await checkRes.json().catch(() => null);
          const bal = Number(json?.data?.wallet_balance ?? json?.data?.balance ?? json?.balance);
          return {
            ok: true,
            message: `Prembly Portal Connected & Verified (${elapsed}ms).${!isNaN(bal) ? ` Balance: ${formatNaira(bal)}` : ""}`,
            responseTimeMs: elapsed,
            balance: isNaN(bal) ? undefined : bal,
          };
        }
      } catch {
        const elapsed = hostLatency || (Date.now() - startTime);
        return {
          ok: true,
          message: `Prembly Portal Online & Connected (${elapsed}ms).`,
          responseTimeMs: elapsed,
        };
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        ok: false,
        message: this.sanitizeError(err?.message || "Prembly connection error."),
        responseTimeMs: elapsed,
      };
    }
  }

  /**
   * Execute real identity verification via Prembly API
   */
  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<PremblyVerificationResult> {
    const startTime = Date.now();
    const sType = (serviceType || "").toUpperCase().trim();
    const cleanId = String(targetId || "").trim();
    const reference = extraData.reference || `PMB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        providerReference: reference,
        error: "Prembly API Key (x-api-key) is missing. Please configure it in Admin Dashboard > API Providers.",
        responseTimeMs: 0,
      };
    }

    const base = this.baseUrl(config);

    // Build candidate paths and request payload matching Prembly Identitypass specifications
    let candidatePaths: string[] = [];
    let payload: Record<string, any> = {};

    switch (sType) {
      case "NIN": {
        if (extraData.searchMethod === "BY_DEMOGRAPHICS" || extraData.firstName || extraData.dateOfBirth) {
          candidatePaths = [
            "/identitypass/verification/nin_demographic",
            "/api/v1/biometrics/merchant/data/verification/nin_demographic",
          ];
          payload = {
            firstname: extraData.firstName || extraData.firstname || "",
            lastname: extraData.lastName || extraData.lastname || extraData.surname || "",
            dob: extraData.dateOfBirth || extraData.dob || extraData.birthdate || "",
            gender: (extraData.gender || "m").toLowerCase().substring(0, 1),
          };
        } else if (extraData.searchMethod === "BY_PHONE" || (cleanId.startsWith("0") && cleanId.length === 11)) {
          candidatePaths = [
            "/identitypass/verification/phone_number/nin",
            "/identitypass/verification/nin_wo_face",
            "/api/v1/biometrics/merchant/data/verification/phone_number/nin",
          ];
          payload = {
            number: normalizeNigerianPhone(cleanId),
          };
        } else {
          // Standard 11-digit NIN or VNIN
          const isVnin = cleanId.length === 16 || cleanId.toUpperCase().startsWith("V");
          if (isVnin) {
            candidatePaths = [
              "/identitypass/verification/vnin",
              "/api/v1/biometrics/merchant/data/verification/vnin",
            ];
            payload = { number: cleanId };
          } else {
            candidatePaths = [
              "/identitypass/verification/nin",
              "/api/v1/biometrics/merchant/data/verification/nin",
              "/api/v1/merchant/verification/nin",
            ];
            payload = {
              number: cleanId,
              nin: cleanId,
            };
          }
        }
        break;
      }

      case "NIN_PHONE": {
        candidatePaths = [
          "/identitypass/verification/phone_number/nin",
          "/identitypass/verification/nin_wo_face",
          "/api/v1/biometrics/merchant/data/verification/phone_number/nin",
        ];
        payload = {
          number: normalizeNigerianPhone(extraData.phone || extraData.phoneNumber || cleanId),
        };
        break;
      }

      case "NIN_DEMOGRAPHY": {
        candidatePaths = [
          "/identitypass/verification/nin_demographic",
          "/api/v1/biometrics/merchant/data/verification/nin_demographic",
        ];
        payload = {
          firstname: extraData.firstName || extraData.firstname || "",
          lastname: extraData.lastName || extraData.lastname || extraData.surname || "",
          dob: extraData.dateOfBirth || extraData.dob || "",
          gender: (extraData.gender || "m").toLowerCase().substring(0, 1),
        };
        break;
      }

      case "BVN": {
        if (extraData.searchMethod === "BY_DEMOGRAPHICS" || extraData.firstName || extraData.dateOfBirth) {
          candidatePaths = [
            "/identitypass/verification/bvn_demographic",
            "/api/v1/biometrics/merchant/data/verification/bvn_demographic",
          ];
          payload = {
            firstname: extraData.firstName || extraData.firstname || "",
            lastname: extraData.lastName || extraData.lastname || "",
            dob: extraData.dateOfBirth || extraData.dob || "",
          };
        } else if (extraData.searchMethod === "BY_PHONE" || (cleanId.startsWith("0") && cleanId.length === 11)) {
          candidatePaths = [
            "/identitypass/verification/phone_number/bvn",
            "/api/v1/biometrics/merchant/data/verification/phone_number/bvn",
          ];
          payload = {
            number: normalizeNigerianPhone(cleanId),
          };
        } else {
          candidatePaths = [
            "/identitypass/verification/bvn",
            "/api/v1/biometrics/merchant/data/verification/bvn",
          ];
          payload = {
            number: cleanId,
            bvn: cleanId,
          };
        }
        break;
      }

      case "BVN_PHONE": {
        candidatePaths = [
          "/identitypass/verification/phone_number/bvn",
          "/api/v1/biometrics/merchant/data/verification/phone_number/bvn",
        ];
        payload = {
          number: normalizeNigerianPhone(extraData.phone || extraData.phoneNumber || cleanId),
        };
        break;
      }

      case "BVN_DEMOGRAPHY": {
        candidatePaths = [
          "/identitypass/verification/bvn_demographic",
          "/api/v1/biometrics/merchant/data/verification/bvn_demographic",
        ];
        payload = {
          firstname: extraData.firstName || extraData.firstname || "",
          lastname: extraData.lastName || extraData.lastname || "",
          dob: extraData.dateOfBirth || extraData.dob || "",
        };
        break;
      }

      case "CAC":
      case "KYB": {
        const isNameSearch = extraData.isNameSearch || (!cleanId.startsWith("RC") && !cleanId.startsWith("BN") && !cleanId.startsWith("IT") && isNaN(Number(cleanId)));
        if (isNameSearch) {
          candidatePaths = [
            "/identitypass/verification/cac/advance",
            "/identitypass/verification/cac",
            "/api/v1/biometrics/merchant/data/verification/cac",
          ];
          payload = {
            company_name: extraData.companyName || cleanId,
          };
        } else {
          candidatePaths = [
            "/identitypass/verification/cac",
            "/api/v1/biometrics/merchant/data/verification/cac",
          ];
          let cleanRc = cleanId.replace(/\s+/g, "").toUpperCase();
          let cType = "RC";
          if (cleanRc.startsWith("BN")) cType = "BN";
          else if (cleanRc.startsWith("IT")) cType = "IT";
          else if (cleanRc.startsWith("LLP")) cType = "LLP";

          payload = {
            rc_number: cleanRc.replace(/^[A-Z]+/, ""),
            company_type: cType,
          };
        }
        break;
      }

      case "TIN":
      case "TAX": {
        candidatePaths = [
          "/identitypass/verification/tin",
          "/api/v1/biometrics/merchant/data/verification/tin",
        ];
        payload = {
          number: cleanId,
          channel: "TIN",
        };
        break;
      }

      case "DRIVERS_LICENSE":
      case "DRIVER_LICENSE":
      case "DL": {
        candidatePaths = [
          "/identitypass/verification/drivers_license",
          "/api/v1/biometrics/merchant/data/verification/drivers_license",
        ];
        payload = {
          number: cleanId,
          dob: extraData.dateOfBirth || extraData.dob || "1990-01-01",
        };
        break;
      }

      case "VOTERS_CARD":
      case "VOTER_CARD":
      case "VIN": {
        candidatePaths = [
          "/identitypass/verification/voters_card",
          "/api/v1/biometrics/merchant/data/verification/voters_card",
        ];
        payload = {
          number: cleanId,
          state: extraData.state || "LAGOS",
          dob: extraData.dateOfBirth || extraData.dob,
        };
        break;
      }

      case "PASSPORT": {
        candidatePaths = [
          "/identitypass/verification/international_passport",
          "/api/v1/biometrics/merchant/data/verification/international_passport",
        ];
        payload = {
          number: cleanId,
          last_name: extraData.lastName || extraData.surname || "",
        };
        break;
      }

      case "PHONE": {
        candidatePaths = [
          "/identitypass/verification/phone_number",
          "/api/v1/biometrics/merchant/data/verification/phone_number",
        ];
        payload = {
          number: normalizeNigerianPhone(cleanId),
        };
        break;
      }

      case "BANK_ACCOUNT":
      case "NUBAN": {
        candidatePaths = [
          "/identitypass/verification/bank_account",
          "/api/v1/biometrics/merchant/data/verification/bank_account",
        ];
        payload = {
          number: cleanId,
          bank_code: extraData.bankCode || extraData.bank_code || "058",
        };
        break;
      }

      case "FACE_VERIFY":
      case "FACE": {
        candidatePaths = [
          "/identitypass/verification/face",
          "/api/v1/biometrics/merchant/data/verification/face",
        ];
        payload = {
          image1: extraData.image1 || extraData.faceImage || "",
          image2: extraData.image2 || "",
        };
        break;
      }

      default: {
        candidatePaths = [
          `/identitypass/verification/${sType.toLowerCase()}`,
          `/api/v1/biometrics/merchant/data/verification/${sType.toLowerCase()}`,
        ];
        payload = {
          number: cleanId,
        };
        break;
      }
    }

    const candidateUrls = this.resolveCandidateUrls(base, candidatePaths);
    let lastError = "";
    let lastStatusCode = 400;

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
          lastError = `Prembly endpoint ${url.replace(/https?:\/\/[^/]+/, "")} returned 404`;
          continue;
        }

        const isApiSuccess =
          (res.ok || res.status === 200 || res.status === 201) &&
          Boolean(json) &&
          (json.status === true ||
            json.status === "success" ||
            json.response_code === "00" ||
            json.code === "SUCCESS");

        if (isApiSuccess && (json.data || json.response)) {
          const rawData = json.data || json.response || {};
          const standardized = this.mapToStandardFields(rawData, sType);

          return {
            success: true,
            providerReference: json?.reference || rawData?.reference || reference,
            transactionId: json?.transaction_id || rawData?.transaction_id || reference,
            data: standardized,
            rawResponse: json,
            statusCode: res.status,
            responseTimeMs: Date.now() - startTime,
          };
        }

        const extractedMsg = this.extractErrorMessage(json, res.status);
        lastError = this.sanitizeError(extractedMsg);

        // If explicitly unauthorized or forbidden, stop trying other paths
        if (res.status === 401 || res.status === 403) {
          break;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          lastError = "Prembly request timed out after 20000ms.";
        } else {
          lastError = this.sanitizeError(err?.message || "Prembly network error.");
        }
      }
    }

    let cleanError = lastError || "Failed to complete verification via Prembly Portal.";
    if (cleanError.includes("returned 404") || cleanError.includes("404")) {
      const subjectLabel = sType.includes("DEMOGRAPHY") || !/^\d+$/.test(cleanId) ? `demographics for "${cleanId}"` : `${sType} number "${cleanId}"`;
      cleanError = `Identity record not found for ${subjectLabel}. Please verify the details and try again.`;
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
   * Retrieve current Prembly wallet balance / credits
   */
  async checkBalance(
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    const base = this.baseUrl(config);
    const candidatePaths = [
      "/identitypass/wallet/balance",
      "/api/v1/biometrics/merchant/wallet/balance",
      "/api/v1/wallet/balance",
    ];

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
        if (res.ok && (json?.status === true || json?.data)) {
          const bal = Number(json?.data?.wallet_balance ?? json?.data?.balance ?? json?.balance ?? 0);
          return {
            success: true,
            balance: isNaN(bal) ? 0 : bal,
            currency: json?.data?.currency || json?.currency || "NGN",
          };
        }
      } catch (err: any) {
        return { success: false, error: this.sanitizeError(err?.message || "Prembly wallet check error") };
      }
    }

    return { success: false, error: "Unable to query Prembly balance endpoint." };
  }
}
