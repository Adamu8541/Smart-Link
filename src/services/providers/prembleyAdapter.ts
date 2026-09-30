/**
 * Prembley (formerly Identitypass) Identity, KYB & Verification Portal Adapter
 * Official Documentation: https://prembley.com | https://myidentitypass.com | https://api.myidentitypay.com
 * Base URLs:
 *   - Primary: https://api.myidentitypay.com
 *   - Alternates: https://api.identitypass.com | https://api.prembley.com
 * Authentication (Two Variables Only):
 *   - Public Key: PREMBLEY_PUBLIC_KEY (sent as x-api-key / x-public-key)
 *   - Secret Key: PREMBLEY_SECRET_KEY (sent as x-secret-key / Authorization Bearer)
 *   - Content-Type: application/json
 *   - Accept: application/json
 *
 * Supported Services:
 *   1. Identity & National Verification:
 *      - NIN (Standard NIN, Virtual NIN / VNIN, NIN Phone, NIN Demography, NIN Slip/Image, NIN Face)
 *      - BVN (BVN 2.0, BVN Advance/Demography, BVN Phone, BVN Face, BVN Slip)
 *      - Driver's License (FRSC)
 *      - Voter's Card (INEC VIN)
 *      - International Passport (Immigration)
 *      - Biometric Face Match & Liveness
 *      - Address & Meter Number Verification
 *   2. Corporate & Business Verification (KYB):
 *      - CAC Company Search, Basic CAC (RC/BN/IT/LLP) & Advance CAC (Directors/Shareholders)
 *      - Tax Identification Number (TIN) Verification
 *   3. Banking & Account Resolution:
 *      - NUBAN Bank Account Name Resolution
 *   4. Merchant Account & Health:
 *      - Wallet Balance & API Probing (/api/v1/biometrics/merchant/data/verification/wallet_balance)
 */

import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";

export interface PrembleyVerificationResult {
  success: boolean;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  rawResponse?: any;
}

export class PrembleyAdapter implements ProviderAdapter {
  id = "prembley";
  name = "Prembley Portal (Identitypass)";

  /**
   * List of all verified services supported by Prembley / Identitypass
   */
  public static readonly SUPPORTED_SERVICES = [
    // 1. Identity Verification (NIN & BVN)
    { id: "NIN", name: "NIN Standard Verification", category: "IDENTITY" },
    { id: "VNIN", name: "Virtual NIN (VNIN) Resolution", category: "IDENTITY" },
    { id: "NIN_PHONE", name: "NIN Lookup via Phone Number", category: "IDENTITY" },
    { id: "NIN_DEMOGRAPHY", name: "NIN Verification with Name & DOB", category: "IDENTITY" },
    { id: "NIN_SLIP", name: "NIN Slip / Card Data Generation", category: "IDENTITY" },
    { id: "BVN", name: "BVN 2.0 Standard Verification", category: "IDENTITY" },
    { id: "BVN_DEMOGRAPHY", name: "BVN Verification with Name & DOB", category: "IDENTITY" },
    { id: "BVN_PHONE", name: "BVN Verification with Phone Number", category: "IDENTITY" },
    { id: "BVN_SLIP", name: "BVN Slip & Card Generation", category: "IDENTITY" },
    { id: "DRIVERS_LICENSE", name: "FRSC Driver's License Verification", category: "IDENTITY" },
    { id: "VOTERS_CARD", name: "INEC Voter's Card (VIN) Verification", category: "IDENTITY" },
    { id: "PASSPORT", name: "International Passport Verification", category: "IDENTITY" },
    { id: "FACE_VERIFY", name: "Biometric Face Match & Liveness", category: "IDENTITY" },
    { id: "ADDRESS", name: "Physical & Meter Address Verification", category: "IDENTITY" },
    { id: "PHONE", name: "Phone Number Telecom Verification", category: "IDENTITY" },

    // 2. Corporate & Business Verification (KYB)
    { id: "CAC", name: "CAC Basic Corporate Verification", category: "KYB" },
    { id: "CAC_ADVANCE", name: "CAC Advance & Director/Affiliate Verification", category: "KYB" },
    { id: "CAC_NAME_SEARCH", name: "CAC Company & Business Name Search", category: "KYB" },
    { id: "TIN", name: "Tax Identification Number (TIN) Verification", category: "KYB" },

    // 3. Banking & Account Resolution
    { id: "BANK_ACCOUNT", name: "NUBAN Bank Account Name Verification", category: "BANKING" },

    // 4. Merchant Account & Health
    { id: "WALLET", name: "Merchant Balance & Wallet Check", category: "ACCOUNT" },
  ];

  /**
   * Resolve Base URL for Prembley API (default: https://api.prembly.com)
   */
  private baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://api.prembly.com";
    return String(raw).trim().replace(/\/+$/, "");
  }

  /**
   * Generate clean candidate full URLs avoiding duplicate path prefixes
   */
  private resolveCandidateUrls(base: string, endpointPaths: string[]): string[] {
    const cleanBase = base.trim().replace(/\/+$/, "");
    const rootBase = cleanBase
      .replace(/\/api\/v2\/?$/i, "")
      .replace(/\/api\/v1\/?$/i, "")
      .replace(/\/api\/?$/i, "")
      .replace(/\/+$/, "");

    const urls: string[] = [];
    const addUrl = (u: string) => {
      if (!urls.includes(u)) urls.push(u);
    };

    for (const path of endpointPaths) {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      addUrl(`${rootBase}${cleanPath}`);
      if (cleanBase !== rootBase && !cleanPath.startsWith("/api")) {
        addUrl(`${cleanBase}${cleanPath}`);
      }
    }

    return urls;
  }

  /**
   * Resolve live Public Key from PREMBLEY_PUBLIC_KEY env var or config
   */
  public getResolvedPublicKey(config: PaymentProviderConfig): string {
    const raw = String(config.publicKey || config.apiKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 8) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(
      process.env.PREMBLEY_PUBLIC_KEY ||
      process.env.PREMBLEY_API_KEY ||
      process.env.IDENTITYPASS_PUBLIC_KEY ||
      process.env.IDENTITYPASS_API_KEY ||
      raw ||
      ""
    ).trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Resolve live Secret Key from PREMBLEY_SECRET_KEY env var or config
   */
  public getResolvedSecretKey(config: PaymentProviderConfig): string {
    const raw = String(config.secretKey || "").trim();
    if (raw && !raw.includes("•") && !raw.includes("*") && !raw.includes("...") && raw.length > 8) {
      return raw.replace(/[^\x00-\x7F]/g, "").trim();
    }
    const envKey = String(
      process.env.PREMBLEY_SECRET_KEY ||
      process.env.IDENTITYPASS_SECRET_KEY ||
      raw ||
      ""
    ).trim();
    return envKey.replace(/[^\x00-\x7F]/g, "").trim();
  }

  /**
   * Build authentication and request headers according to Prembley specification using Public Key and Secret Key only
   */
  private headers(config: PaymentProviderConfig): Record<string, string> {
    const pubKey = this.getResolvedPublicKey(config);
    const secKey = this.getResolvedSecretKey(config);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-Prembley-Client/1.0",
    };

    if (secKey) {
      headers["x-api-key"] = secKey;
      headers["x-secret-key"] = secKey;
    } else if (pubKey) {
      headers["x-api-key"] = pubKey;
    }
    if (pubKey) {
      headers["x-public-key"] = pubKey;
    }

    return headers;
  }

  /**
   * Sanitize error message to prevent sensitive leakage
   */
  private sanitizeError(raw: any): string {
    if (!raw) return "Prembley portal request failed.";
    let s = typeof raw === "string" ? raw : JSON.stringify(raw);
    s = s.replace(/(?:sk_live_|sk_test_|sec_live_|sec_test_|secp256k1|Bearer\s+|x-api-key['"]?:\s*['"]?)[a-zA-Z0-9_\-\.]{15,}/gi, "[REDACTED_SECRET]");
    s = s.replace(/\{'id_number':\s*\[?'([^']+)'\]?\}/g, "$1");
    s = s.replace(/\{['"]?(\w+)['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1: $2");
    s = s.replace(/[\[\]'"{}]/g, "").trim();
    return s || "Prembley portal request failed.";
  }

  /**
   * Extract user-friendly error message from API response body
   */
  private extractErrorMessage(json: any, status: number): string {
    if (!json) return `Prembley verification rejected (HTTP ${status}).`;

    // 1. Specifically detect upstream Prembley API merchant wallet balance exhaustion (response_code "04")
    if (
      json.response_code === "04" ||
      (typeof json.message === "string" && json.message.toLowerCase().includes("insufficient wallet balance")) ||
      (typeof json.detail === "string" && json.detail.toLowerCase().includes("insufficient wallet balance"))
    ) {
      const curBal = json.billing_info?.current_balance !== undefined ? ` (Current Prembley Balance: ₦${json.billing_info.current_balance})` : "";
      return `Prembley Gateway Merchant Account Low Balance: Upstream Prembley provider API account has insufficient funds${curBal}. Note: Your SmartLink user wallet was NOT charged. Please top up the Prembley merchant account on prembly.com or switch identity provider in the Admin Multi-Provider Matrix.`;
    }

    if (json.response_code === "01") {
      return "Prembley Authentication Error: Invalid or expired API credentials. Please check your PREMBLEY_PUBLIC_KEY and PREMBLEY_SECRET_KEY in Admin Portal.";
    }

    if (json.response_code === "02") {
      return "Prembley Service Unavailable: This identity query service is temporarily unavailable on the Prembley gateway.";
    }

    if (json.response_code === "05") {
      const rawErrors = json.errors && typeof json.errors === "object" ? JSON.stringify(json.errors) : "";
      if (rawErrors.includes("number_nin") && (rawErrors.includes("required") || rawErrors.includes("11 digits"))) {
        return "Prembley Gateway Demographic Query Notice: The upstream Prembley gateway requires an 11-digit NIN or VNIN to confirm demographic records. Please provide a valid 11-digit NIN or use NIN Phone / VNIN verification.";
      }
      if (rawErrors.includes("number_bvn") || rawErrors.includes("bvn") || (rawErrors.includes("number") && !rawErrors.includes("number_nin"))) {
        return "Prembley Gateway BVN Query Notice: The upstream Prembley gateway requires an 11-digit BVN or registered phone number to confirm financial identity records. Please use BVN Verification or BVN Phone Lookup.";
      }
      const errDetails = json.errors && typeof json.errors === "object"
        ? Object.entries(json.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join("; ")
        : "";
      return `Prembley Invalid Request: ${json.message || "Invalid input parameters"}${errDetails ? ` (${errDetails})` : ""}`;
    }

    if (typeof json.message === "string" && json.message.trim()) {
      if (json.errors && typeof json.errors === "object") {
        const errDetails = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
          .join("; ");
        if (errDetails) return `${json.message.trim()} (${errDetails})`;
      }
      return json.message.trim();
    }
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    if (typeof json.msg === "string" && json.msg.trim()) return json.msg.trim();
    if (typeof json.data?.message === "string" && json.data.message.trim()) return json.data.message.trim();
    if (typeof json.data?.detail === "string" && json.data.detail.trim()) return json.data.detail.trim();

    return `Prembley verification rejected (HTTP ${status}).`;
  }

  /**
   * Format photo data from Prembley response (Base64 data URI or image URL)
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
   * Map raw Prembley response to SmartLink unified identity schema
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
        d.telephoneno || d.phone_number || d.phone_number1 || d.phone_number2 || d.phoneNumber || d.phone || d.mobile || ""
      ),
      email: d.email || d.email_address || d.company_email || "",
      address:
        d.head_office ||
        d.head_office_address ||
        d.residence_address ||
        d.residential_address ||
        d.address ||
        d.residenceAddress ||
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
        d.lga_of_origin ||
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
      nin: d.nin || d.nin_number || d.national_identity_number || d.vnin || (serviceType?.includes("NIN") || serviceType?.includes("PHONE") ? d.id_number || d.idNumber || d.number : "") || "",
      bvn: d.bvn || d.bvn_number || d.bank_verification_number || (serviceType?.includes("BVN") && (!String(d.id_number || d.idNumber || d.number || "").startsWith("0")) ? d.id_number || d.idNumber || d.number : "") || "",
      photoUrl,
      photo: photoUrl,
      signatureUrl: this.formatPhotoUrl(d.signature || d.signature_url || d.signatureUrl),
      trackingId: d.tracking_id || d.trackingId || d.trackingID || "",
      reference: d.reference || d.prembley_reference || d.verification_id || "",

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

      // FRSC Driver's License
      licenseNumber: d.license_number || d.frsc_number || d.licenseNumber || "",
      expiryDate: d.expiry_date || d.expiryDate || d.expired_date || "",
      issuedDate: d.issued_date || d.issuedDate || d.issue_date || "",

      // Voter's Card (VIN)
      vin: d.vin || d.voter_identification_number || "",
      pollingUnit: d.polling_unit || d.pollingUnit || d.pu || "",
      delimitation: d.delimitation || "",

      // Passport
      passportNumber: d.passport_number || d.passportNumber || "",

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
   * Test connection to Prembley Portal
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now();
    const base = this.baseUrl(config);
    const pubKey = this.getResolvedPublicKey(config);
    const secKey = this.getResolvedSecretKey(config);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let hostResponded = false;
      let hostLatency = 0;

      // 1. Check reachability via standard endpoint
      try {
        const pingRes = await fetch(`${base}/api/v1/biometrics/merchant/data/verification/wallet_balance`, {
          method: "GET",
          headers: this.headers(config),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        hostLatency = Date.now() - startTime;
        if (pingRes.status) {
          hostResponded = true;
          if (pingRes.status === 200 || pingRes.status === 201) {
            const json = await pingRes.json().catch(() => ({}));
            const bal = json?.data?.wallet_balance ?? json?.wallet_balance ?? json?.data?.balance;
            const balStr = bal !== undefined ? ` (Wallet Balance: ₦${bal})` : "";
            return {
              ok: true,
              message: `Prembley / Identitypass Connected & Authenticated (${hostLatency}ms)${balStr}. API is healthy.`,
              responseTimeMs: hostLatency,
            };
          }
          if (pingRes.status === 401 || pingRes.status === 403) {
            return {
              ok: false,
              message: `Prembley Authentication Rejected (HTTP ${pingRes.status}). Please verify your PREMBLEY_PUBLIC_KEY and PREMBLEY_SECRET_KEY.`,
              responseTimeMs: hostLatency,
            };
          }
        }
      } catch {
        clearTimeout(timeoutId);
        // Fallback root health check
        try {
          const rootRes = await fetch(`${base}/api/v1/health`, {
            method: "GET",
            headers: { "User-Agent": "SmartLink-Prembley/1.0" },
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
          message: "Prembley API server unreachable. Please verify base URL and network connectivity.",
          responseTimeMs: Date.now() - startTime,
        };
      }

      if (!pubKey && !secKey) {
        return {
          ok: true,
          message: `Prembley Portal Online & Reachable (${hostLatency}ms). Ready for PREMBLEY_PUBLIC_KEY and PREMBLEY_SECRET_KEY.`,
          responseTimeMs: hostLatency,
        };
      }

      return {
        ok: true,
        message: `Prembley Portal Online & Connected (${hostLatency}ms).`,
        responseTimeMs: hostLatency,
      };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      return {
        ok: false,
        message: this.sanitizeError(err?.message || "Prembley connection error."),
        responseTimeMs: elapsed,
      };
    }
  }

  /**
   * Execute real identity verification via Prembley / Identitypass API
   */
  async verifyIdentity(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any> = {},
    config: PaymentProviderConfig
  ): Promise<PrembleyVerificationResult> {
    const startTime = Date.now();
    const sType = (serviceType || "").toUpperCase().trim();
    const cleanId = String(targetId || "").trim();
    const reference = extraData.reference || `PMB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pubKey = this.getResolvedPublicKey(config);
    const secKey = this.getResolvedSecretKey(config);
    if (!pubKey && !secKey) {
      return {
        success: false,
        providerReference: reference,
        error: "Prembley credentials missing. Please configure PREMBLEY_PUBLIC_KEY and PREMBLEY_SECRET_KEY in server environment.",
        responseTimeMs: 0,
      };
    }

    const base = this.baseUrl(config);

    // Build endpoint paths and request bodies according to Prembley specification
    let candidatePaths: string[] = [];
    let payload: Record<string, any> = {};

    switch (sType) {
      case "NIN": {
        const isDemographics = extraData.searchMethod === "BY_DEMOGRAPHICS" || extraData.firstName || extraData.dateOfBirth;
        if (isDemographics) {
          const ninVal = (cleanId && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.nin && /^\d{11}$/.test(extraData.nin)) ? extraData.nin : "";
          candidatePaths = [
            "/identitypass/verification/nin",
            "/identitypass/verification/nin_wo_face",
            "/api/v1/biometrics/merchant/data/verification/nin_wo_face",
            "/api/v2/biometrics/merchant/data/verification/nin/demographics",
          ];
          const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
          const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
          const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
          payload = {
            firstname: fName,
            first_name: fName,
            surname: lName,
            last_name: lName,
            dob: birthDate,
            date_of_birth: birthDate,
            gender: extraData.gender ? String(extraData.gender).toLowerCase() : undefined,
          };
          if (ninVal) {
            payload.number_nin = ninVal;
            payload.nin = ninVal;
            payload.number = ninVal;
          }
          break;
        }

        candidatePaths = [
          "/identitypass/verification/nin",
          "/api/v1/biometrics/merchant/data/verification/nin_wo_face",
          "/api/v2/biometrics/merchant/data/verification/nin",
          "/api/v1/biometrics/merchant/data/verification/nin",
        ];
        payload = {
          number_nin: cleanId,
          nin: cleanId,
          number: cleanId,
        };
        break;
      }
      case "NIN_DEMOGRAPHY":
      case "NIN_DEMOGRAPHICS":
      case "NIN_DOB": {
        const ninVal = (cleanId && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.nin && /^\d{11}$/.test(extraData.nin)) ? extraData.nin : "";
        candidatePaths = [
          "/identitypass/verification/nin",
          "/identitypass/verification/nin_wo_face",
          "/api/v1/biometrics/merchant/data/verification/nin_wo_face",
          "/api/v2/biometrics/merchant/data/verification/nin/demographics",
        ];
        const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
        const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
        const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
        payload = {
          firstname: fName,
          first_name: fName,
          surname: lName,
          last_name: lName,
          dob: birthDate,
          date_of_birth: birthDate,
          gender: extraData.gender ? String(extraData.gender).toLowerCase() : undefined,
        };
        if (ninVal) {
          payload.number_nin = ninVal;
          payload.nin = ninVal;
          payload.number = ninVal;
        }
        break;
      }
      case "VNIN": {
        candidatePaths = [
          "/identitypass/verification/vnin",
          "/identitypass/verification/nin",
          "/api/v2/biometrics/merchant/data/verification/vnin",
          "/api/v1/biometrics/merchant/data/verification/vnin",
        ];
        payload = {
          virtual_nin: cleanId,
          number_nin: cleanId,
          vnin: cleanId,
          number: cleanId,
        };
        break;
      }
      case "NIN_PHONE":
      case "PHONE_NIN":
      case "PHONE": {
        const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
        candidatePaths = [
          "/identitypass/verification/phone_number",
          "/identitypass/verification/phone_number/advance",
          "/identitypass/verification/phone",
          "/api/v2/biometrics/merchant/data/verification/phone_number",
          "/api/v1/biometrics/merchant/data/verification/phone_number/basic",
          "/api/v2/biometrics/merchant/data/verification/phone_number/advance",
        ];
        payload = {
          number: phone,
          phone_number: phone,
          phone: phone,
        };
        break;
      }
      case "NIN_SLIP":
      case "NIN_IMAGE": {
        candidatePaths = [
          "/identitypass/verification/nin",
          "/api/v2/biometrics/merchant/data/verification/nin/image",
          "/api/v1/biometrics/merchant/data/verification/nin_wo_face",
        ];
        payload = {
          number_nin: cleanId,
          nin: cleanId,
          number: cleanId,
        };
        break;
      }
      case "BVN":
      case "BVN_BASIC":
      case "BVN_ADVANCE":
      case "BVN_SLIP": {
        const isDemographics = extraData.searchMethod === "BY_BVN_DEMOGRAPHICS" || extraData.searchMethod === "BY_DEMOGRAPHICS" || (!/^\d{11}$/.test(cleanId) && (extraData.firstName || extraData.dateOfBirth));
        if (isDemographics) {
          candidatePaths = [
            "/identitypass/verification/bvn",
            "/api/v2/biometrics/merchant/data/verification/bvn_advance",
            "/api/v1/biometrics/merchant/data/verification/bvn_advance",
            "/api/v2/biometrics/merchant/data/verification/bvn",
          ];
          const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
          const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
          const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
          payload = {
            bvn: cleanId,
            number: cleanId,
            number_bvn: cleanId,
            firstname: fName,
            first_name: fName,
            surname: lName,
            last_name: lName,
            dob: birthDate,
            date_of_birth: birthDate,
          };
          if (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) {
            payload.bvn = extraData.bvn;
            payload.number = extraData.bvn;
            payload.number_bvn = extraData.bvn;
          }
          break;
        }

        const isPhoneSearch = extraData.searchMethod === "BY_PHONE" || extraData.searchMethod === "BY_PHONE_NUMBER" || (cleanId && cleanId.startsWith("0"));
        if (isPhoneSearch) {
          const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
          candidatePaths = [
            "/identitypass/verification/bvn",
            "/identitypass/verification/phone_number",
            "/api/v2/biometrics/merchant/data/verification/phone_number",
            "/api/v1/biometrics/merchant/data/verification/phone_number/basic",
          ];
          payload = {
            phone_number: phone,
            number: phone,
            number_bvn: phone,
          };
          if (extraData.bvn && !extraData.bvn.startsWith("0")) {
            payload.bvn = extraData.bvn;
            payload.number = extraData.bvn;
            payload.number_bvn = extraData.bvn;
          }
          break;
        }

        candidatePaths = [
          "/identitypass/verification/bvn",
          "/api/v2/biometrics/merchant/data/verification/bvn",
          "/api/v1/biometrics/merchant/data/verification/bvn_wo_face",
          "/api/v1/biometrics/merchant/data/verification/bvn",
        ];
        payload = {
          bvn: cleanId,
          number: cleanId,
          number_bvn: cleanId,
        };
        break;
      }
      case "BVN_DEMOGRAPHY":
      case "BVN_DEMOGRAPHICS":
      case "BVN_DOB": {
        const bvnVal = (cleanId && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) ? extraData.bvn : "";
        candidatePaths = [
          "/identitypass/verification/bvn",
          "/api/v2/biometrics/merchant/data/verification/bvn_advance",
          "/api/v1/biometrics/merchant/data/verification/bvn_advance",
          "/api/v2/biometrics/merchant/data/verification/bvn",
        ];
        const fName = extraData.firstName || (extraData.fullName ? extraData.fullName.split(" ")[0] : undefined);
        const lName = extraData.lastName || (extraData.fullName ? extraData.fullName.split(" ").slice(-1)[0] : undefined);
        const birthDate = extraData.dateOfBirth || extraData.dob || undefined;
        payload = {
          firstname: fName,
          first_name: fName,
          surname: lName,
          last_name: lName,
          dob: birthDate,
          date_of_birth: birthDate,
        };
        if (bvnVal) {
          payload.bvn = bvnVal;
          payload.number = bvnVal;
          payload.number_bvn = bvnVal;
        }
        break;
      }
      case "BVN_PHONE": {
        const phone = normalizeNigerianPhone(cleanId || extraData.phoneNumber || extraData.phone || "");
        const bvnVal = (cleanId && !cleanId.startsWith("0") && /^\d{11}$/.test(cleanId)) ? cleanId : (extraData.bvn && /^\d{11}$/.test(extraData.bvn)) ? extraData.bvn : "";
        candidatePaths = [
          "/identitypass/verification/bvn",
          "/identitypass/verification/phone_number",
          "/api/v2/biometrics/merchant/data/verification/phone_number",
          "/api/v1/biometrics/merchant/data/verification/phone_number/basic",
        ];
        payload = {
          phone_number: phone,
          number: phone,
          number_bvn: phone,
        };
        if (bvnVal) {
          payload.bvn = bvnVal;
          payload.number = bvnVal;
          payload.number_bvn = bvnVal;
        }
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
        } else if (regUpper.startsWith("LLP") || vType.includes("LLP")) {
          companyType = "LLP";
          if (!regUpper.startsWith("LLP") && regUpper) formattedReg = `LLP${regUpper}`;
        } else {
          companyType = "RC";
          if (!regUpper.startsWith("RC") && !regUpper.startsWith("BN") && !regUpper.startsWith("IT") && !regUpper.startsWith("LLP") && regUpper) {
            formattedReg = `RC${regUpper}`;
          }
        }

        if (vType === "CAC_NAME_SEARCH" || vType === "CAC_COMPANY_SEARCH" || vType.includes("NAME_SEARCH") || vType.includes("SEARCH")) {
          candidatePaths = [
            "/api/v2/biometrics/merchant/data/verification/cac/name",
            "/api/v2/biometrics/merchant/data/verification/cac_with_name",
            "/api/v2/biometrics/merchant/data/verification/cac_name",
            "/api/v2/biometrics/merchant/data/verification/cac",
          ];
          payload = {
            company_name: cleanId || extraData.companyName || extraData.businessName || formattedReg,
            search_term: cleanId || extraData.companyName || extraData.businessName || formattedReg,
          };
        } else if (vType === "CAC_ADVANCE" || vType === "CAC_ADVANCED" || vType.includes("ADVANCE")) {
          candidatePaths = [
            "/api/v2/biometrics/merchant/data/verification/cac_advance",
            "/api/v1/biometrics/merchant/data/verification/cac_advance",
            "/api/v2/biometrics/merchant/data/verification/cac",
          ];
          payload = {
            rc_number: formattedReg.replace(/^(RC|BN|IT|LLP)/i, ""),
            company_type: companyType,
          };
        } else {
          // Default Basic CAC
          candidatePaths = [
            "/api/v2/biometrics/merchant/data/verification/cac",
            "/api/v1/biometrics/merchant/data/verification/cac",
          ];
          payload = {
            rc_number: formattedReg.replace(/^(RC|BN|IT|LLP)/i, ""),
            company_type: companyType,
          };
        }
        break;
      }
      case "TIN": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/tin",
          "/api/v1/biometrics/merchant/data/verification/tin",
        ];
        payload = {
          tin: cleanId,
          number: cleanId,
          channel: "TIN",
        };
        break;
      }
      case "DRIVERS_LICENSE":
      case "DRIVER_LICENSE":
      case "DL": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/drivers_license",
          "/api/v1/biometrics/merchant/data/verification/drivers_license",
        ];
        payload = {
          frsc_number: cleanId,
          number: cleanId,
          dob: extraData.dateOfBirth || extraData.dob || undefined,
        };
        break;
      }
      case "VOTERS_CARD":
      case "VOTER_CARD":
      case "VIN": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/voters_card",
          "/api/v1/biometrics/merchant/data/verification/voters_card",
        ];
        payload = {
          vin: cleanId,
          number: cleanId,
          state: extraData.state || undefined,
          last_name: extraData.lastName || undefined,
        };
        break;
      }
      case "PASSPORT":
      case "INTERNATIONAL_PASSPORT": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/passport",
          "/api/v1/biometrics/merchant/data/verification/passport",
        ];
        payload = {
          passport_number: cleanId,
          number: cleanId,
          last_name: extraData.lastName || undefined,
          dob: extraData.dateOfBirth || extraData.dob || undefined,
        };
        break;
      }
      case "BANK_ACCOUNT":
      case "ACCOUNT_LOOKUP": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/bank_account",
          "/api/v1/biometrics/merchant/data/verification/bank_account",
        ];
        payload = {
          account_number: cleanId,
          number: cleanId,
          bank_code: extraData.bankCode || extraData.bank_code || "058",
        };
        break;
      }
      case "ADDRESS":
      case "ADDRESS_VERIFICATION": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/address",
          "/api/v2/biometrics/merchant/data/verification/meter_number",
        ];
        payload = {
          meter_number: cleanId,
          address: extraData.address || "",
          state: extraData.state || "",
        };
        break;
      }
      case "FACE_VERIFY":
      case "FACE":
      case "LIVENESS": {
        candidatePaths = [
          "/api/v2/biometrics/merchant/data/verification/face",
          "/api/v2/biometrics/merchant/data/verification/face_liveness",
        ];
        payload = {
          image: extraData.image || extraData.photo || "",
          id_number: cleanId,
        };
        break;
      }
      default: {
        candidatePaths = [
          `/api/v2/biometrics/merchant/data/verification/${sType.toLowerCase()}`,
          `/api/v1/biometrics/merchant/data/verification/${sType.toLowerCase()}`,
        ];
        payload = {
          number: cleanId,
          id_number: cleanId,
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

        if (res.status === 404) {
          lastError = `Prembley path ${url.replace(/https?:\/\/[^/]+/, "")} returned 404`;
          continue;
        }

        const isApiSuccess =
          (res.ok || res.status === 200 || res.status === 201) &&
          Boolean(json) &&
          (json.status === true ||
            json.status === "success" ||
            json.response_code === "00" ||
            json.response_code === "0" ||
            json.code === "SUCCESS" ||
            (json.data && !json.error && res.ok));

        if (isApiSuccess && (json.data || json.response)) {
          const rawData = json.data || json.response || json;
          const outcome = String(rawData.verificationOutcome || rawData.status || json.status || "").toUpperCase();

          if (outcome === "NOT_FOUND" || outcome === "NO_RECORD" || json.detail === "No record found") {
            const subjectLabel = sType.includes("DEMOGRAPHY") || !/^\d+$/.test(cleanId) ? `demographics for "${cleanId}"` : `${sType} number "${cleanId}"`;
            return {
              success: false,
              providerReference: json?.reference || reference,
              error: `Record not found in identity database for ${subjectLabel}. Please verify the details and try again.`,
              statusCode: 404,
              responseTimeMs: Date.now() - startTime,
            };
          }

          const standardized = this.mapToStandardFields(rawData, sType);

          return {
            success: true,
            providerReference: json?.reference || rawData?.reference || json?.verification_id || reference,
            transactionId: json?.transaction_id || rawData?.transaction_id || reference,
            data: standardized,
            rawResponse: json,
            statusCode: res.status,
            responseTimeMs: Date.now() - startTime,
          };
        }

        const extractedMsg = this.extractErrorMessage(json, res.status);
        lastError = this.sanitizeError(extractedMsg);

        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 422) {
          break;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          lastError = "Prembley request timed out after 20000ms.";
        } else {
          lastError = this.sanitizeError(err?.message || "Prembley network error.");
        }
      }
    }

    return {
      success: false,
      providerReference: reference,
      error: lastError || "Prembley portal was unable to verify this record.",
      statusCode: lastStatusCode,
      responseTimeMs: Date.now() - startTime,
    };
  }
}
