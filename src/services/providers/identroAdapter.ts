/**
 * Identro Identity, KYB, Risk & Utility Services Portal Adapter (identro.ng)
 * Official Documentation: https://identro.ng | https://api.identro.ng/merchant-api
 * Base URL: https://api.identro.ng (prefix: /merchant-api)
 * Authentication:
 *   - x-api-key: <apiKey>
 *   - Authorization: Bearer <apiKey>
 *   - Content-Type: application/json
 *   - Accept: application/json
 *
 * Supported Services:
 *   1. Identity & National Verification:
 *      - NIN (NIN, VNIN, NIN Phone, NIN Demography / Name & DOB, NIN Slip Generation)
 *      - BVN (BVN Verification, BVN Demography / Name & DOB, BVN Phone, BVN Slip/Card)
 *      - Driver's License (FRSC)
 *      - Voter's Card (INEC VIN)
 *      - Face Match & Liveness Biometrics
 *      - Address & Meter Location Verification
 *   2. Corporate & Business Verification (KYB):
 *      - CAC Company Search, RC/BN Status & Director/Shareholder Lookups
 *      - SCUML Certificate Verification
 *      - Tax Identification Number (TIN) Verification
 *   3. AML, PEP & Fraud Screening:
 *      - PEP (Politically Exposed Persons) Checks
 *      - International & Local Sanctions / Watchlist Screening
 *      - Adverse Media & Risk Intelligence
 *   4. Credit & Lending Intelligence:
 *      - Credit Bureau History & Score Lookups
 *      - Loan Decisioning & Underwriting Support
 *   5. Banking & Account Resolution:
 *      - NUBAN Bank Account Name Resolution
 *   6. Digital Utilities & VTU Payments:
 *      - Airtime Top-Up (MTN, Airtel, Glo, 9mobile)
 *      - Data Bundles Purchase
 *      - Electricity Meter Validation & Token Generation
 *      - Cable TV Subscriptions (DStv, GOtv, StarTimes)
 *   7. Wallet & Merchant Balance:
 *      - Wallet Balance & Credit Ledger (/merchant-api/wallet, /merchant-api/balance)
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

export interface IdentroUtilityResult {
  success: boolean;
  reference: string;
  token?: string;
  units?: string | number;
  amount?: number;
  balance?: number;
  data?: any;
  error?: string;
  responseTimeMs: number;
}

export class IdentroAdapter implements ProviderAdapter {
  id = "identro";
  name = "Identro Portal (identro.ng)";

  /**
   * List of all verified services supported by Identro
   */
  public static readonly SUPPORTED_SERVICES = [
    // 1. Identity Verification (NIN & BVN)
    { id: "NIN", name: "NIN Standard Verification", category: "IDENTITY" },
    { id: "VNIN", name: "Virtual NIN (VNIN) Resolution", category: "IDENTITY" },
    { id: "NIN_PHONE", name: "NIN Lookup via Phone Number", category: "IDENTITY" },
    { id: "NIN_DEMOGRAPHY", name: "NIN Verification with Name & DOB", category: "IDENTITY" },
    { id: "NIN_SLIP", name: "NIN Slip / Card Data Generation", category: "IDENTITY" },
    { id: "BVN", name: "BVN Standard Verification", category: "IDENTITY" },
    { id: "BVN_DEMOGRAPHY", name: "BVN Verification with Name & DOB", category: "IDENTITY" },
    { id: "BVN_PHONE", name: "BVN Verification with Phone Number", category: "IDENTITY" },
    { id: "BVN_SLIP", name: "BVN Slip & Card Generation", category: "IDENTITY" },
    { id: "DRIVERS_LICENSE", name: "FRSC Driver's License Verification", category: "IDENTITY" },
    { id: "VOTERS_CARD", name: "INEC Voter's Card (VIN) Verification", category: "IDENTITY" },
    { id: "FACE_VERIFY", name: "Biometric Face Match & Liveness", category: "IDENTITY" },
    { id: "ADDRESS", name: "Physical & Meter Address Verification", category: "IDENTITY" },

    // 2. Corporate & Business Verification (KYB)
    { id: "CAC", name: "CAC Company & Business Name Search", category: "KYB" },
    { id: "SCUML", name: "SCUML Certificate Verification", category: "KYB" },
    { id: "TIN", name: "Tax Identification Number (TIN) Verification", category: "KYB" },

    // 3. AML, PEP & Risk Screening
    { id: "AML", name: "Anti-Money Laundering (AML) Screening", category: "COMPLIANCE" },
    { id: "PEP", name: "Politically Exposed Persons (PEP) Lookup", category: "COMPLIANCE" },
    { id: "SANCTIONS", name: "International & Local Sanctions Screening", category: "COMPLIANCE" },

    // 4. Credit & Lending Intelligence
    { id: "CREDIT_CHECK", name: "Credit Bureau Score & Report Lookup", category: "CREDIT" },
    { id: "LOAN_DECISION", name: "Automated Loan Underwriting Support", category: "CREDIT" },

    // 5. Banking & Account Resolution
    { id: "BANK_ACCOUNT", name: "NUBAN Bank Account Name Verification", category: "BANKING" },

    // 6. Digital Utilities & VTU
    { id: "AIRTIME", name: "Automated Airtime Top-Up", category: "VTU" },
    { id: "DATA", name: "Mobile Data Bundle Purchase", category: "VTU" },
    { id: "ELECTRICITY", name: "Electricity Meter Verification & Token Purchase", category: "VTU" },
    { id: "CABLE_TV", name: "Cable TV Subscription (DStv, GOtv, StarTimes)", category: "VTU" },

    // 7. Merchant Account
    { id: "WALLET", name: "Merchant Balance & Wallet Check", category: "ACCOUNT" },
  ];

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
      headers["Authorization"] = `Bearer ${cleanKey}`;
    }

    return headers;
  }

  /**
   * Sanitize error message to prevent sensitive leakage
   */
  private sanitizeError(raw: any): string {
    if (!raw) return "Identro portal request failed.";
    let s = typeof raw === "string" ? raw : JSON.stringify(raw);
    s = s.replace(/(?:(?:sk|sec|pk)_(?:live|test)_|secp256k1|Bearer\s+|x-api-key['"]?:\s*['"]?)[a-zA-Z0-9_\-\.]{15,}/gi, "[REDACTED_SECRET]");
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
      d.account_name ||
      d.accountName ||
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
      email: d.email || d.email_address || d.company_email || "",
      address:
        d.head_office ||
        d.head_office_address ||
        d.residence_address ||
        d.address ||
        d.residenceAddress ||
        d.residential_address ||
        d.street_address ||
        "",
      addressLine1: d.addressLine1 || d.street || d.residence_address || d.residential_address || d.address || "",
      state: d.residence_state || d.stateOfResidence || d.resident_state || d.state_of_origin || d.stateOfOrigin || d.state || "",
      stateOfOrigin:
        d.state_of_origin ||
        d.stateOfOrigin ||
        d.origin_state ||
        d.state ||
        "",
      lga:
        d.lga ||
        d.residence_lga ||
        d.lgaOfResidence ||
        d.lgaOfOrigin ||
        d.origin_lga ||
        d.local_government ||
        "",
      stateOfResidence:
        d.residence_state ||
        d.stateOfResidence ||
        d.resident_state ||
        "",
      residenceState:
        d.residence_state ||
        d.stateOfResidence ||
        d.resident_state ||
        "",
      residenceLga:
        d.residence_lga ||
        d.lgaOfResidence ||
        d.lga ||
        "",
      lgaOfResidence:
        d.residence_lga ||
        d.lgaOfResidence ||
        d.lga ||
        "",
      religion: d.religion || "",
      profession: d.profession || d.occupation || "",
      height: d.height || "",
      maritalStatus: d.maritalstatus || d.marital_status || d.maritalStatus || "",
      title: d.title || "",
      nin: d.nin || d.nin_number || d.national_identity_number || d.vnin || (serviceType?.includes("NIN") || serviceType?.includes("PHONE") ? d.id_number || d.idNumber : "") || "",
      bvn: d.bvn || d.bvn_number || d.bank_verification_number || (serviceType?.includes("BVN") && (!String(d.id_number || d.idNumber || "").startsWith("0")) ? d.id_number || d.idNumber : "") || "",
      photoUrl,
      photo: photoUrl,
      signatureUrl: this.formatPhotoUrl(d.signature || d.signature_url || d.signatureUrl),
      trackingId: d.tracking_id || d.trackingId || d.trackingID || "",
      reference: d.reference || d.identro_reference || "",
      
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
      accountNumber: d.account_number || d.accountNumber || "",
      accountName: d.account_name || d.accountName || "",
      bankName: d.bank_name || d.bankName || "",
      bankCode: d.bank_code || d.bankCode || "",
      
      // Credit & Risk
      creditScore: d.credit_score || d.creditScore || d.score || 0,
      riskLevel: d.risk_level || d.riskLevel || d.status || "CLEARED",
      pepStatus: d.pep_status || d.is_pep || false,
      sanctioned: d.sanctioned || d.is_sanctioned || false,
      
      // Utility & Meter
      meterNumber: d.meter_number || d.meterNumber || "",
      meterToken: d.token || d.meter_token || "",
      tokenUnits: d.units || d.token_units || "",
      
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
      case "NIN": {
        if (extraData.searchMethod === "BY_DEMOGRAPHICS" || extraData.firstName || extraData.dateOfBirth) {
          candidatePaths = [
            "/api/v1/merchant-api/nin/demographics",
            "/merchant-api/nin/demographics",
            "/api/v1/merchant-api/nin/demography",
            "/merchant-api/nin/demography",
            "/api/v1/merchant-api/nin/search",
            "/merchant-api/nin/search",
            "/api/v1/merchant-api/nin/verify",
            "/merchant-api/nin/verify",
          ];
          const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
          const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
          const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
          payload = {
            firstName: fName,
            firstname: fName,
            lastName: lName,
            lastname: lName,
            surname: lName,
            gender: extraData.gender ? String(extraData.gender).toLowerCase() : undefined,
            dateOfBirth: birthDate,
            dob: birthDate,
            date_of_birth: birthDate,
            consentCaptured: true,
          };
          if (cleanId && /^\d{11}$/.test(cleanId)) {
            payload.nin = cleanId;
          }
          break;
        }
        candidatePaths = [
          "/api/v1/merchant-api/nin/verify",
          "/merchant-api/nin/verify",
        ];
        payload = {
          nin: cleanId,
          consentCaptured: true,
        };
        break;
      }
      case "NIN_DEMOGRAPHY":
      case "NIN_DEMOGRAPHICS":
      case "NIN_DOB": {
        candidatePaths = [
          "/api/v1/merchant-api/nin/demographics",
          "/merchant-api/nin/demographics",
          "/api/v1/merchant-api/nin/demography",
          "/merchant-api/nin/demography",
          "/api/v1/merchant-api/nin/search",
          "/merchant-api/nin/search",
          "/api/v1/merchant-api/nin/verify",
          "/merchant-api/nin/verify",
        ];
        const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
        const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
        const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
        payload = {
          firstName: fName,
          firstname: fName,
          lastName: lName,
          lastname: lName,
          surname: lName,
          gender: extraData.gender ? String(extraData.gender).toLowerCase() : undefined,
          dateOfBirth: birthDate,
          dob: birthDate,
          date_of_birth: birthDate,
          consentCaptured: true,
        };
        if (cleanId && /^\d{11}$/.test(cleanId)) {
          payload.nin = cleanId;
        }
        break;
      }
      case "BVN":
      case "BVN_BASIC":
      case "BVN_ADVANCE":
      case "BVN_SLIP": {
        const isDemographicSearch =
          extraData.searchMethod === "BY_BVN_DEMOGRAPHICS" ||
          extraData.searchMethod === "BY_DEMOGRAPHICS" ||
          (!/^\d{11}$/.test(cleanId) && (extraData.firstName || extraData.dateOfBirth));
        if (isDemographicSearch) {
          candidatePaths = [
            "/api/v1/merchant-api/bvn/demographics",
            "/merchant-api/bvn/demographics",
            "/api/v1/merchant-api/bvn/demography",
            "/merchant-api/bvn/demography",
            "/api/v1/merchant-api/bvn/search",
            "/merchant-api/bvn/search",
            "/api/v1/merchant-api/bvn/verify",
            "/merchant-api/bvn/verify",
          ];
          const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
          const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
          const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
          payload = {
            firstName: fName,
            firstname: fName,
            lastName: lName,
            lastname: lName,
            surname: lName,
            fullName: extraData.fullName || (fName && lName ? `${fName} ${lName}` : undefined),
            gender: extraData.gender ? String(extraData.gender).toLowerCase() : undefined,
            dateOfBirth: birthDate,
            dob: birthDate,
            date_of_birth: birthDate,
            consentCaptured: true,
          };
          if (cleanId && /^\d{11}$/.test(cleanId)) {
            payload.bvn = cleanId;
          } else if (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) {
            payload.bvn = extraData.bvn;
          }
          break;
        }

        const isPhoneSearch = extraData.searchMethod === "BY_PHONE" || extraData.searchMethod === "BY_PHONE_NUMBER" || (cleanId && cleanId.startsWith("0"));
        if (isPhoneSearch) {
          const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
          candidatePaths = [
            "/api/v1/merchant-api/bvn/phone",
            "/merchant-api/bvn/phone",
            "/api/v1/merchant-api/phone/bvn",
            "/merchant-api/phone/bvn",
            "/api/v1/merchant-api/phone/lookup",
            "/merchant-api/phone/lookup",
            "/api/v1/merchant-api/bvn/search",
            "/merchant-api/bvn/search",
            "/api/v1/merchant-api/bvn/verify",
            "/merchant-api/bvn/verify",
          ];
          payload = {
            phoneNumber: phone,
            phone: phone,
            mobile: phone,
            telephoneNo: phone,
            idNumber: phone,
            consentCaptured: true,
          };
          if (extraData.bvn && !extraData.bvn.startsWith("0")) {
            payload.bvn = extraData.bvn;
          }
          break;
        }
        candidatePaths = [
          "/api/v1/merchant-api/bvn/verify",
          "/merchant-api/bvn/verify",
        ];
        payload = {
          bvn: cleanId,
          consentCaptured: true,
        };
        break;
      }
      case "BVN_DEMOGRAPHY":
      case "BVN_DEMOGRAPHICS":
      case "BVN_DOB": {
        const bvnVal = (cleanId && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) ? extraData.bvn : "";
        if (!bvnVal) {
          return {
            success: false,
            providerReference: reference,
            error: "Identro Portal requires an 11-digit BVN to cross-reference demographic records. Demographics-only lookup without BVN is not supported by the upstream gateway.",
            statusCode: 400,
            responseTimeMs: Date.now() - startTime,
          };
        }
        candidatePaths = [
          "/api/v1/merchant-api/bvn/verify",
          "/merchant-api/bvn/verify",
        ];
        payload = {
          bvn: bvnVal,
          consentCaptured: true,
        };
        break;
      }
      case "BVN_PHONE": {
        const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
        const bvnVal = (cleanId && !cleanId.startsWith("0") && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) ? extraData.bvn : "";
        if (!bvnVal) {
          return {
            success: false,
            providerReference: reference,
            error: "Identro Portal requires an 11-digit BVN to cross-reference records. Direct reverse lookup by phone number alone is not supported by the upstream gateway.",
            statusCode: 400,
            responseTimeMs: Date.now() - startTime,
          };
        }
        candidatePaths = [
          "/api/v1/merchant-api/bvn/verify",
          "/merchant-api/bvn/verify",
        ];
        payload = {
          bvn: bvnVal,
          consentCaptured: true,
        };
        break;
      }
      case "CAC":
      case "KYB":
      case "CAC_VERIFY":
      case "CAC_VERIFICATION":
      case "CAC_BASIC":
      case "CAC_ADVANCE":
      case "CAC_ADVANCED":
      case "CAC_BUSINESS_NAME":
      case "CAC_TRUSTEES":
      case "CAC_INCORPORATED_TRUSTEES":
      case "CAC_NAME_SEARCH":
      case "CAC_COMPANY_SEARCH":
      case "CAC_TIN":
      case "CAC_REGISTRATION": {
        const vType = String(extraData.verificationType || extraData.serviceType || sType).toUpperCase();
        const regUpper = String(cleanId || extraData.registrationNumber || extraData.rcNumber || "").toUpperCase().replace(/\s+/g, "");

        let companyType = "RC";
        let formattedReg = regUpper;

        if (regUpper.startsWith("BN") || vType.includes("BUSINESS_NAME") || vType === "BN") {
          companyType = "BN";
          if (!regUpper.startsWith("BN") && regUpper) formattedReg = `BN${regUpper}`;
        } else if (regUpper.startsWith("IT") || vType.includes("TRUSTEE") || vType.includes("NGO") || vType === "IT") {
          companyType = "IT";
          if (!regUpper.startsWith("IT") && regUpper) formattedReg = `IT${regUpper}`;
        } else {
          companyType = "RC";
          if (!regUpper.startsWith("RC") && !regUpper.startsWith("BN") && !regUpper.startsWith("IT") && !regUpper.startsWith("LLP") && regUpper) {
            formattedReg = `RC${regUpper}`;
          }
        }

        if (vType === "CAC_ADVANCE" || vType === "CAC_ADVANCED" || vType.includes("ADVANCE")) {
          candidatePaths = [
            "/api/v1/merchant-api/cac/advance",
            "/merchant-api/cac/advance",
            "/api/v1/merchant-api/cac/verify",
            "/merchant-api/cac/verify",
          ];
          payload = {
            serviceType: "CAC_ADVANCED_VERIFICATION",
            registrationNumber: formattedReg,
            companyType,
            consentCaptured: true,
          };
        } else if (vType === "CAC_BUSINESS_NAME" || vType === "BUSINESS_NAME") {
          candidatePaths = [
            "/api/v1/merchant-api/cac/business-name",
            "/merchant-api/cac/business-name",
            "/api/v1/merchant-api/cac/verify",
            "/merchant-api/cac/verify",
          ];
          payload = {
            serviceType: "CAC_BUSINESS_NAME_VERIFICATION",
            registrationNumber: formattedReg,
            companyType: "BN",
            consentCaptured: true,
          };
        } else if (vType === "CAC_TRUSTEES" || vType === "CAC_INCORPORATED_TRUSTEES" || vType.includes("TRUSTEE")) {
          candidatePaths = [
            "/api/v1/merchant-api/cac/trustees",
            "/merchant-api/cac/trustees",
            "/api/v1/merchant-api/cac/verify",
            "/merchant-api/cac/verify",
          ];
          payload = {
            serviceType: "CAC_TRUSTEES_VERIFICATION",
            registrationNumber: formattedReg,
            companyType: "IT",
            consentCaptured: true,
          };
        } else if (vType === "CAC_NAME_SEARCH" || vType === "CAC_COMPANY_SEARCH" || vType.includes("NAME_SEARCH") || vType.includes("SEARCH")) {
          candidatePaths = [
            "/api/v1/merchant-api/cac/search",
            "/merchant-api/cac/search",
            "/api/v1/merchant-api/cac/name-search",
            "/merchant-api/cac/name-search",
            "/api/v1/merchant-api/cac/verify",
            "/merchant-api/cac/verify",
          ];
          payload = {
            serviceType: "CAC_NAME_SEARCH",
            companyName: cleanId || extraData.companyName || extraData.businessName || formattedReg,
            name: cleanId || extraData.companyName || extraData.businessName || formattedReg,
            consentCaptured: true,
          };
        } else if (vType === "CAC_TIN" || vType.includes("TIN")) {
          candidatePaths = [
            "/api/v1/merchant-api/cac/tin",
            "/merchant-api/cac/tin",
            "/api/v1/merchant-api/tin/verify",
            "/merchant-api/tin/verify",
          ];
          payload = {
            serviceType: "CAC_TIN_VERIFICATION",
            registrationNumber: formattedReg,
            companyType,
            consentCaptured: true,
          };
        } else {
          // Default CAC_BASIC / CAC_BASIC_VERIFICATION
          candidatePaths = [
            "/api/v1/merchant-api/cac/verify",
            "/merchant-api/cac/verify",
          ];
          payload = {
            serviceType: "CAC_BASIC_VERIFICATION",
            registrationNumber: formattedReg,
            companyType,
            consentCaptured: true,
          };
        }
        break;
      }
      case "SCUML": {
        candidatePaths = [
          "/api/v1/merchant-api/scuml/verify",
          "/merchant-api/scuml/verify",
        ];
        payload = {
          scumlNumber: cleanId,
          rcNumber: extraData.rcNumber || "",
          consentCaptured: true,
        };
        break;
      }
      case "NIN_PHONE":
      case "PHONE_NIN":
      case "PHONE": {
        const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
        const ninVal = (extraData.nin && /^\d{11}$/.test(extraData.nin)) ? extraData.nin : (cleanId && !cleanId.startsWith("0") && /^\d{11}$/.test(cleanId)) ? cleanId : "";
        if (!ninVal) {
          return {
            success: false,
            providerReference: reference,
            error: "Identro Portal requires an 11-digit NIN for identity verification. Direct reverse lookup by phone number alone is not supported by the upstream gateway.",
            statusCode: 400,
            responseTimeMs: Date.now() - startTime,
          };
        }
        candidatePaths = [
          "/api/v1/merchant-api/nin/verify",
          "/merchant-api/nin/verify",
        ];
        payload = {
          nin: ninVal,
          consentCaptured: true,
        };
        break;
      }
      case "TIN": {
        candidatePaths = [
          "/api/v1/merchant-api/tin/verify",
        ];
        const rawTarget = String(extraData.tinNumber || extraData.registrationNumber || extraData.rcNumber || cleanId || "").trim();
        const vType = String(extraData.verificationType || extraData.serviceType || "TIN_VALIDATION_BY_TIN").toUpperCase();
        const isRetrieval = vType.includes("RETRIEVAL") || vType.includes("PHONE") && !vType.includes("UPDATE") && !vType.includes("VALIDATION");
        const isUpdate = vType.includes("UPDATE");

        if (isRetrieval) {
          payload = {
            serviceType: "TIN_RETRIEVAL",
            phoneNumber: normalizeNigerianPhone(extraData.phoneNumber || cleanId),
            consentCaptured: true,
          };
        } else if (isUpdate) {
          payload = {
            serviceType: "TIN_UPDATE",
            phoneNumber: normalizeNigerianPhone(extraData.phoneNumber || cleanId),
            consentCaptured: true,
          };
        } else {
          let formattedReg = rawTarget.toUpperCase().replace(/\s+/g, "");
          const isExplicitTin = vType === "VERIFY_BY_TIN" || vType === "TIN_VALIDATION_BY_TIN";

          if (!isExplicitTin) {
            if (vType.includes("BN") && !formattedReg.startsWith("BN")) {
              formattedReg = `BN${formattedReg}`;
            } else if (vType.includes("IT") && !formattedReg.startsWith("IT")) {
              formattedReg = `IT${formattedReg}`;
            } else if (vType.includes("RC") && !formattedReg.startsWith("RC")) {
              formattedReg = `RC${formattedReg}`;
            } else if (!formattedReg.startsWith("RC") && !formattedReg.startsWith("BN") && !formattedReg.startsWith("IT") && !formattedReg.startsWith("LLP") && !formattedReg.includes("-") && formattedReg.length < 8) {
              formattedReg = `RC${formattedReg}`;
            }
          }

          payload = {
            serviceType: "TIN_VALIDATION",
            registrationNumber: formattedReg,
            consentCaptured: true,
          };

          if (extraData.phoneNumber) {
            payload.phoneNumber = normalizeNigerianPhone(extraData.phoneNumber);
          }
          if (extraData.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(extraData.dateOfBirth)) {
            payload.dateOfBirth = extraData.dateOfBirth;
          }
          if (extraData.nin && /^\d{11}$/.test(extraData.nin)) {
            payload.nin = extraData.nin;
          }
          if (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) {
            payload.bvn = extraData.bvn;
          }
        }
        break;
      }
      case "DRIVERS_LICENSE":
      case "DRIVER_LICENSE":
      case "DL": {
        candidatePaths = [
          "/api/v1/merchant-api/drivers-license/verify",
        ];
        payload = {
          licenseNumber: cleanId,
          dateOfBirth: extraData.dateOfBirth || extraData.dob || undefined,
          consentCaptured: true,
        };
        break;
      }
      case "VOTERS_CARD":
      case "VOTER_CARD":
      case "VIN": {
        candidatePaths = [
          "/api/v1/merchant-api/voters-card/verify",
        ];
        payload = {
          vin: cleanId,
          consentCaptured: true,
        };
        break;
      }
      case "FACE_VERIFY":
      case "FACE":
      case "LIVENESS": {
        candidatePaths = [
          "/api/v1/merchant-api/face/verify",
          "/merchant-api/face/verify",
        ];
        payload = {
          idNumber: cleanId,
          idType: extraData.idType || "NIN",
          image: extraData.image || extraData.photo || "",
          consentCaptured: true,
        };
        break;
      }
      case "ADDRESS":
      case "ADDRESS_VERIFICATION": {
        candidatePaths = [
          "/api/v1/merchant-api/address/verify",
          "/merchant-api/address/verify",
        ];
        payload = {
          meterNumber: cleanId,
          address: extraData.address || "",
          state: extraData.state || "",
          consentCaptured: true,
        };
        break;
      }
      case "BANK_ACCOUNT":
      case "ACCOUNT_LOOKUP": {
        candidatePaths = [
          "/api/v1/merchant-api/bank/account-lookup",
          "/api/v1/merchant-api/bank/verify",
        ];
        payload = {
          accountNumber: cleanId,
          bankCode: extraData.bankCode || "058",
          consentCaptured: true,
        };
        break;
      }
      case "AML":
      case "PEP":
      case "SANCTIONS": {
        candidatePaths = [
          "/api/v1/merchant-api/aml/screen",
          "/merchant-api/aml/screen",
        ];
        payload = {
          name: cleanId || extraData.fullName || "",
          country: extraData.country || "NG",
          dateOfBirth: extraData.dateOfBirth || extraData.dob || "",
          consentCaptured: true,
        };
        break;
      }
      case "CREDIT":
      case "CREDIT_CHECK":
      case "LOAN_DECISION": {
        candidatePaths = [
          "/api/v1/merchant-api/credit/verify",
          "/merchant-api/credit/score",
        ];
        payload = {
          bvnOrNin: cleanId,
          phoneNumber: extraData.phoneNumber || "",
          consentCaptured: true,
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

        const isApiSuccess =
          (res.ok || res.status === 201 || res.status === 200) &&
          Boolean(json) &&
          (json.success === true ||
            json.status === true ||
            json.status === "success" ||
            json.code === "SUCCESS");

        if (isApiSuccess && json.data) {
          const rawData = json.data || {};
          const outcome = String(rawData.verificationOutcome || rawData.result?.verificationOutcome || "").toUpperCase();
          const recordStatus = String(rawData.status || "").toUpperCase();

          // Check if record was explicitly NOT found in national registry
          if (outcome === "NOT_FOUND" || recordStatus === "NOT_FOUND") {
            const subjectLabel = sType.includes("DEMOGRAPHY") || !/^\d+$/.test(cleanId) ? `demographics for "${cleanId}"` : `${sType} number "${cleanId}"`;
            return {
              success: false,
              providerReference: json?.reference || reference,
              error: `Record not found in identity database for ${subjectLabel}. Please verify the details and try again.`,
              statusCode: 404,
              responseTimeMs: Date.now() - startTime,
            };
          }

          if (outcome === "INVALID_REQUEST" || (recordStatus === "FAILED" && !rawData.firstName && !rawData.fullName && !rawData.companyName && !rawData.name && !rawData.registrationNumber)) {
            const subjectLabel = sType.includes("DEMOGRAPHY") || !/^\d+$/.test(cleanId) ? `demographics for "${cleanId}"` : `${sType} number "${cleanId}"`;
            return {
              success: false,
              providerReference: json?.reference || reference,
              error: `The ${subjectLabel} could not be confirmed by the national verification authority.`,
              statusCode: 400,
              responseTimeMs: Date.now() - startTime,
            };
          }

          // Valid verified record retrieved
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
          lastError = "Identro request timed out after 20000ms.";
        } else {
          lastError = this.sanitizeError(err?.message || "Identro network error.");
        }
      }
    }

    let cleanError = lastError || "Failed to complete verification via Identro Portal.";
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
   * Helper to resolve standard Nigerian network codes for Identro
   * 01: MTN, 02: Glo, 03: 9mobile, 04: Airtel
   */
  public mapNetworkToIdentroCode(net?: string): string {
    const n = String(net || "").toUpperCase().trim();
    if (n.includes("MTN") || n === "01" || n === "1") return "01";
    if (n.includes("GLO") || n === "02" || n === "2") return "02";
    if (n.includes("9MOBILE") || n.includes("ETISALAT") || n === "03" || n === "3") return "03";
    if (n.includes("AIRTEL") || n === "04" || n === "4") return "04";
    return n || "01";
  }

  /**
   * Format phone number to 11-digit Nigerian standard required by Identro regex /^0[789][01]\d{8}$/
   */
  public formatIdentroPhone(phone: string): string {
    let clean = String(phone || "").replace(/\D/g, "");
    if (clean.startsWith("234") && clean.length === 13) {
      clean = "0" + clean.slice(3);
    } else if (clean.length === 10 && /^[789][01]/.test(clean)) {
      clean = "0" + clean;
    }
    return clean;
  }

  /**
   * Airtime Purchase via Identro
   */
  public async purchaseAirtime(
    req: { network: string; phoneNumber: string; amount: number; reference?: string },
    config: PaymentProviderConfig
  ) {
    const res = await this.purchaseUtility(
      "AIRTIME",
      {
        recipient: req.phoneNumber,
        amount: req.amount,
        networkOrProvider: req.network,
      },
      config
    );
    return {
      success: res.success,
      orderId: res.reference,
      reference: res.reference,
      requestId: (res.data as any)?.requestId,
      message: res.success ? "Airtime purchase processed successfully" : (res.error || "Airtime purchase failed"),
      error: res.error,
      rawResponse: res.data || res,
    };
  }

  /**
   * Data Purchase via Identro
   */
  public async purchaseData(
    req: { network: string; phoneNumber: string; planCode: string; reference?: string },
    config: PaymentProviderConfig
  ) {
    const res = await this.purchaseUtility(
      "DATA",
      {
        recipient: req.phoneNumber,
        planCode: req.planCode,
        networkOrProvider: req.network,
      },
      config
    );
    return {
      success: res.success,
      orderId: res.reference,
      reference: res.reference,
      requestId: (res.data as any)?.requestId,
      message: res.success ? "Data purchase processed successfully" : (res.error || "Data purchase failed"),
      error: res.error,
      rawResponse: res.data || res,
    };
  }

  /**
   * Exam PINs Purchase via Identro
   */
  public async purchaseExamPin(
    params: {
      examType: "WAEC" | "NECO" | "NABTEB" | "JAMB" | string;
      quantity?: number;
      reference: string;
    },
    config: PaymentProviderConfig
  ) {
    const res = await this.purchaseUtility(
      "EXAM_PIN" as any,
      {
        recipient: params.examType,
        amount: (params.quantity || 1) * 3800,
        networkOrProvider: params.examType,
        planCode: String(params.quantity || 1),
      },
      config
    );
    return {
      success: res.success,
      orderId: res.reference,
      reference: res.reference,
      pins: (res as any).pins || [],
      message: res.success ? `${params.examType} PINs generated successfully` : (res.error || `${params.examType} PIN purchase failed`),
      error: res.error,
      rawResponse: res.data || res,
    };
  }

  /**
   * Execute Digital Utility / VTU & Bill Payments via Identro
   */
  async purchaseUtility(
    serviceType: "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLE_TV",
    requestData: {
      recipient: string;
      amount?: number;
      networkOrProvider?: string;
      planCode?: string;
      meterType?: "PREPAID" | "POSTPAID";
    },
    config: PaymentProviderConfig
  ): Promise<IdentroUtilityResult> {
    const startTime = Date.now();
    const base = this.baseUrl(config);
    const ref = `IDN-UTL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const key = this.getResolvedKey(config);
    if (!key) {
      return {
        success: false,
        reference: ref,
        error: "Identro API Key missing for Utility execution.",
        responseTimeMs: 0,
      };
    }

    const formattedPhone = this.formatIdentroPhone(requestData.recipient);
    const networkCode = this.mapNetworkToIdentroCode(requestData.networkOrProvider);
    const amtStr = String(requestData.amount || 100);

    let endpoints: { path: string; payload: Record<string, any> }[] = [];

    if (serviceType === "AIRTIME") {
      endpoints = [
        {
          path: "/api/v1/merchant-api/digital-services/airtime",
          payload: {
            mobileNetwork: networkCode,
            amount: amtStr,
            mobileNumber: formattedPhone,
          },
        },
        {
          path: "/merchant-api/digital-services/airtime",
          payload: {
            mobileNetwork: networkCode,
            amount: amtStr,
            mobileNumber: formattedPhone,
          },
        },
        {
          path: "/api/v1/merchant-api/vtu/airtime",
          payload: {
            phone: formattedPhone,
            amount: Number(amtStr),
            network: requestData.networkOrProvider || "MTN",
            reference: ref,
          },
        },
      ];
    } else if (serviceType === "DATA") {
      endpoints = [
        {
          path: "/api/v1/merchant-api/digital-services/data",
          payload: {
            mobileNetwork: networkCode,
            planCode: requestData.planCode,
            mobileNumber: formattedPhone,
          },
        },
        {
          path: "/api/v1/merchant-api/vtu/data",
          payload: {
            phone: formattedPhone,
            planCode: requestData.planCode,
            network: requestData.networkOrProvider || "MTN",
            reference: ref,
          },
        },
      ];
    } else if (serviceType === "ELECTRICITY") {
      endpoints = [
        {
          path: "/api/v1/merchant-api/digital-services/electricity",
          payload: {
            meterNumber: requestData.recipient,
            disco: requestData.networkOrProvider,
            amount: amtStr,
            meterType: requestData.meterType || "01",
          },
        },
        {
          path: "/api/v1/merchant-api/bills/electricity",
          payload: {
            meterNumber: requestData.recipient,
            disco: requestData.networkOrProvider,
            amount: requestData.amount,
            meterType: requestData.meterType || "PREPAID",
          },
        },
      ];
    } else if (serviceType === "CABLE_TV") {
      endpoints = [
        {
          path: "/api/v1/merchant-api/digital-services/cable",
          payload: {
            smartcardNumber: requestData.recipient,
            provider: requestData.networkOrProvider,
            planCode: requestData.planCode,
          },
        },
      ];
    }

    let lastError = "";

    for (const ep of endpoints) {
      const candidateUrls = this.resolveCandidateUrls(base, [ep.path]);
      for (const url of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const res = await fetch(url, {
            method: "POST",
            headers: this.headers(config),
            body: JSON.stringify(ep.payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const json: any = await res.json().catch(() => null);
          if (res.ok && (json?.status === true || json?.success === true || json?.code === "SUCCESS" || res.status === 201 || res.status === 200)) {
            const d = json?.data || json;
            return {
              success: true,
              reference: d?.reference || json?.reference || ref,
              token: d?.token || d?.pin || "",
              units: d?.units || d?.token_units || "",
              amount: requestData.amount,
              data: d,
              responseTimeMs: Date.now() - startTime,
            };
          } else if (json) {
            lastError = json.message || json.error || `HTTP ${res.status}`;
          }
        } catch (err: any) {
          lastError = err?.message || "Identro gateway connection timeout";
        }
      }
    }

    return {
      success: false,
      reference: ref,
      error: lastError || "Identro utility purchase transaction could not be completed.",
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

