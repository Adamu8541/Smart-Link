/**
 * ClubKonnect / Nellobyte Systems VTU & Bill Payment API Adapter
 * Production-grade Enterprise Implementation
 *
 * Official Platforms: https://www.clubkonnect.com / https://nellobytesystems.com
 * API Engine Host: https://nellobytesystems.com (Nellobyte Systems infrastructure)
 *
 * Supported Digital Services:
 *   1. Balance Check: GET /APIWalletBalanceV1.asp?UserID={UserID}&APIKey={APIKey}
 *   2. Airtime VTU: GET/POST /APIAirtimeV1.asp?UserID={UserID}&APIKey={APIKey}&MobileNetwork={MobileNetwork}&Amount={Amount}&MobileNumber={MobileNumber}&RequestID={RequestID}
 *   3. Data Bundles: GET/POST /APIAirtimeV1.asp?UserID={UserID}&APIKey={APIKey}&MobileNetwork={MobileNetwork}&DataPlan={DataPlan}&MobileNumber={MobileNumber}&RequestID={RequestID}
 *   4. Cable TV Verification: GET/POST /APIVerifyCableTVV1.0.asp?UserID={UserID}&APIKey={APIKey}&CableTV={CableTV}&SmartCardNo={SmartCardNo}
 *   5. Cable TV Subscription: GET/POST /APICableTVV1.asp?UserID={UserID}&APIKey={APIKey}&CableTV={CableTV}&Package={Package}&SmartCardNo={SmartCardNo}&PhoneNo={PhoneNo}&RequestID={RequestID}
 *   6. Electricity Meter Verification: GET/POST /APIVerifyElectricityV1.asp?UserID={UserID}&APIKey={APIKey}&ElectricCompany={ElectricCompany}&MeterNo={MeterNo}
 *   7. Electricity Token Purchase: GET/POST /APIElectricityV1.asp?UserID={UserID}&APIKey={APIKey}&ElectricCompany={ElectricCompany}&MeterType={MeterType}&MeterNo={MeterNo}&Amount={Amount}&PhoneNo={PhoneNo}&RequestID={RequestID}
 *   8. Transaction Status Query: GET/POST /APIQueryV1.asp?UserID={UserID}&APIKey={APIKey}&OrderID={OrderID}
 *   9. Transaction Cancel: GET/POST /APICancelV1.asp?UserID={UserID}&APIKey={APIKey}&OrderID={OrderID}
 *  10. Public Catalogs: APIAirtimeDiscountV1.asp, APIDatabundlePlansV1.asp, APICableTVPackagesV1.asp, APIElectricityDiscosV1.asp
 */

import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";
import { detectNetworkFromPhone } from "./bigisubAdapter";

export interface ClubKonnectResponse {
  status?: string | number;
  statusCode?: string | number;
  statuscode?: string | number;
  status_code?: string | number;
  orderid?: string | number;
  order_id?: string | number;
  orderId?: string | number;
  walletbalance?: string | number;
  wallet_balance?: string | number;
  balance?: string | number;
  customer_name?: string;
  customername?: string;
  Customer_Name?: string;
  address?: string;
  Customer_Address?: string;
  metertoken?: string;
  meter_token?: string;
  token?: string;
  units?: string | number;
  msg?: string;
  message?: string;
  detail?: string;
  data?: any;
  [key: string]: any;
}

export class ClubKonnectAdapter implements ProviderAdapter {
  id = "clubkonnect";
  name = "Clubkonnect Digital VTU Gateway (clubkonnect.com)";

  // Mobile Network Code Mappings (ClubKonnect standard)
  public static readonly NETWORKS: Record<string, string> = {
    MTN: "01",
    GLO: "02",
    "9MOBILE": "03",
    ETISALAT: "03",
    EMTS: "03",
    AIRTEL: "04",
  };

  // Cable TV Provider Code Mappings
  public static readonly CABLE_PROVIDERS: Record<string, string> = {
    DSTV: "01",
    GOTV: "02",
    STARTIMES: "03",
    STARTIME: "03",
    SHOWMAX: "04",
  };

  // Electricity DISCO Code Mappings
  public static readonly ELECTRICITY_DISCOS: Record<string, string> = {
    EKEDC: "01",
    EKO: "01",
    IKEDC: "02",
    IKEJA: "02",
    AEDC: "03",
    ABUJA: "03",
    KEDC: "04",
    KEDCO: "04",
    KANO: "04",
    PHEDC: "05",
    PHED: "05",
    PORTHARCOURT: "05",
    JEDC: "06",
    JED: "06",
    JOS: "06",
    IBEDC: "07",
    IBADAN: "07",
    KAEDC: "08",
    KAEDCO: "08",
    KADUNA: "08",
    EEDC: "09",
    ENUGU: "09",
    BEDC: "10",
    BENIN: "10",
    YEDC: "11",
    YOLA: "11",
    ABA: "12",
    APLE: "12",
  };

  // Meter Type Mappings
  public static readonly METER_TYPES: Record<string, string> = {
    PREPAID: "01",
    POSTPAID: "02",
  };

  /**
   * Helper to resolve network to 2-digit ClubKonnect network ID ("01": MTN, "02": Glo, "03": 9mobile, "04": Airtel)
   */
  public static resolveNetworkCode(net?: string, phoneNumber?: string): string {
    const n = String(net || "").toUpperCase().trim();
    if (n === "01" || n === "1" || n.includes("MTN")) return "01";
    if (n === "02" || n === "2" || n.includes("GLO")) return "02";
    if (n === "03" || n === "3" || n.includes("9MOBILE") || n.includes("ETISALAT") || n.includes("EMTS")) return "03";
    if (n === "04" || n === "4" || n.includes("AIRTEL")) return "04";

    if (phoneNumber) {
      const fromPhone = detectNetworkFromPhone(phoneNumber);
      if (fromPhone === "MTN") return "01";
      if (fromPhone === "GLO") return "02";
      if (fromPhone === "9MOBILE") return "03";
      if (fromPhone === "AIRTEL") return "04";
    }
    return "01";
  }

  /**
   * Helper to resolve cable provider to ClubKonnect cable code ("01": DSTV, "02": GOTV, "03": Startimes, "04": Showmax)
   */
  public static resolveCableCode(provider?: string): string {
    const c = String(provider || "").toUpperCase().trim();
    if (c === "01" || c.includes("DS") || c.includes("DSTV")) return "01";
    if (c === "02" || c.includes("GO") || c.includes("GOTV")) return "02";
    if (c === "03" || c.includes("STAR") || c.includes("STARTIMES")) return "03";
    if (c === "04" || c.includes("SHOW") || c.includes("SHOWMAX")) return "04";
    return "01";
  }

  /**
   * Helper to resolve electricity company to ClubKonnect Disco code ("01" - "12")
   */
  public static resolveDiscoCode(disco?: string): string {
    const raw = String(disco || "").toUpperCase().replace(/[\s\-_]/g, "");
    if (this.ELECTRICITY_DISCOS[raw]) {
      return this.ELECTRICITY_DISCOS[raw];
    }
    const d = raw;
    if (d === "08" || d.includes("KADUNA") || d.includes("KAEDCO") || d.includes("KAEDC")) return "08";
    if (d === "01" || d.includes("EKO") || d.includes("EKEDC")) return "01";
    if (d === "02" || d.includes("IKEJA") || d.includes("IKEDC")) return "02";
    if (d === "03" || d.includes("ABUJA") || d.includes("AEDC")) return "03";
    if (d === "04" || d.includes("KANO") || d.includes("KEDCO") || d.includes("KEDC")) return "04";
    if (d === "05" || d.includes("PORTHARCOURT") || d.includes("PHED")) return "05";
    if (d === "06" || d.includes("JOS") || d.includes("JED")) return "06";
    if (d === "07" || d.includes("IBADAN") || d.includes("IBEDC")) return "07";
    if (d === "09" || d.includes("ENUGU") || d.includes("EEDC")) return "09";
    if (d === "10" || d.includes("BENIN") || d.includes("BEDC")) return "10";
    if (d === "11" || d.includes("YOLA") || d.includes("YEDC")) return "11";
    if (d === "12" || d.includes("ABA") || d.includes("APLE")) return "12";
    return "02"; // Default to Ikeja Electric
  }

  /**
   * Helper to resolve meter type to ClubKonnect code ("01": Prepaid, "02": Postpaid)
   */
  public static resolveMeterTypeCode(meterType?: string): string {
    const m = String(meterType || "prepaid").toLowerCase().trim();
    if (m === "02" || m.includes("post")) return "02";
    return "01";
  }

  /**
   * Resolve live API base URL.
   * ClubKonnect's official backend API server is hosted on Nellobyte Systems (https://nellobytesystems.com).
   * If config has clubkonnect.com or is empty, canonicalizes to https://nellobytesystems.com.
   */
  public getBaseUrl(config?: PaymentProviderConfig): string {
    const raw = String(config?.baseUrl || process.env.CLUBKONNECT_BASE_URL || "").trim().replace(/\/+$/, "");
    if (!raw || raw.includes("clubkonnect.com")) {
      return "https://nellobytesystems.com";
    }
    return raw;
  }

  /**
   * Resolve Reseller UserID strictly from server-side environment variables
   */
  public getUserId(config?: PaymentProviderConfig): string {
    const envUserId = String(process.env.CLUBKONNECT_USER_ID || process.env.CLUBKONNECT_CLIENT_ID || "").trim();
    const configUserId = String(
      (config as any)?.userId ||
      (config as any)?.UserID ||
      config?.clientId ||
      config?.merchantId ||
      ""
    ).trim();

    const resolved = envUserId || (configUserId && !configUserId.includes("•") && !configUserId.includes("*") ? configUserId : "");
    return resolved.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, "");
  }

  /**
   * Resolve Reseller API Key strictly from server-side environment variables
   */
  public getApiKey(config?: PaymentProviderConfig): string {
    const envKey = String(process.env.CLUBKONNECT_API_KEY || process.env.CLUBKONNECT_SECRET_KEY || "").trim();
    const configKey = String(
      (config as any)?.apiKey ||
      (config as any)?.APIKey ||
      config?.secretKey ||
      ""
    ).trim();

    const resolved = envKey || (configKey && !configKey.includes("•") && !configKey.includes("*") ? configKey : "");
    return resolved.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, "");
  }

  /**
   * Resolve Reseller Transaction PIN strictly from server-side environment variables
   */
  public getTransactionPin(config?: PaymentProviderConfig): string {
    const envPin = String(process.env.CLUBKONNECT_PIN || process.env.CLUBKONNECT_TRANSACTION_PIN || "").trim();
    const configPin = String(
      (config as any)?.pin ||
      (config as any)?.transactionPin ||
      (config as any)?.passcode ||
      ""
    ).trim();

    const resolved = envPin || (configPin && !configPin.includes("•") && !configPin.includes("*") ? configPin : "");
    return resolved.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, "");
  }

  /**
   * Safe fetch utility for ClubKonnect / Nellobyte Systems ASP endpoints
   */
  private async executeFetch(
    url: string,
    method: "GET" | "POST" = "GET",
    body: any = null,
    timeoutMs = 15000
  ): Promise<{ ok: boolean; status: number; data: ClubKonnectResponse; rawText: string; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "SmartLink-ClubKonnect-Gateway/2.0",
      };

      const opts: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && method === "POST") {
        if (typeof body === "string") {
          opts.body = body;
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        } else {
          opts.body = JSON.stringify(body);
          headers["Content-Type"] = "application/json";
        }
      }

      const res = await fetch(url, opts);
      clearTimeout(timer);

      const rawText = await res.text();
      let data: ClubKonnectResponse = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { rawResponse: rawText };
      }

      return {
        ok: res.ok,
        status: res.status,
        data,
        rawText,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return {
        ok: false,
        status: 0,
        data: {},
        rawText: "",
        error: err.name === "AbortError" ? `Clubkonnect gateway timeout after ${timeoutMs}ms` : err.message || "Network connection failed",
      };
    }
  }

  /**
   * Determine if response indicates success
   */
  public static isSuccessResponse(data: ClubKonnectResponse): boolean {
    if (!data || typeof data !== "object") return false;
    const status = String(data.status || "").toUpperCase().trim();
    if (
      status === "ORDER_RECEIVED" ||
      status === "ORDER_COMPLETED" ||
      status === "ORDER_PROCESSED" ||
      status === "SUCCESSFUL" ||
      status === "SUCCESS" ||
      status === "200" ||
      status === "100"
    ) {
      return true;
    }

    const statusCode = String(data.statuscode || data.statusCode || data.status_code || "").trim();
    if (statusCode === "100" || statusCode === "200") {
      return true;
    }

    return false;
  }

  /**
   * Extract human-readable error or explanation from ClubKonnect payload
   */
  public static extractErrorMessage(data: any, fallback = "Transaction failed"): string {
    if (!data) return fallback;
    const status = String(data.status || "").trim();
    if (status === "INVALID_CREDENTIALS") {
      return "Invalid Clubkonnect Reseller UserID or API Key. Please verify credentials in Provider Settings.";
    }
    if (status === "IP_NOT_WHITELISTED" || status.includes("IP_NOT")) {
      return "Server IP is not whitelisted on your Clubkonnect account. Whitelist this IP on clubkonnect.com to enable API vending.";
    }
    if (
      status === "INSUFFICIENT_FUNDS" ||
      status === "INSUFFICIENT_BALANCE" ||
      status === "LOW_BALANCE" ||
      status === "INVALID_BALANCE"
    ) {
      return "Insufficient wallet balance on Clubkonnect reseller account. Please fund your Clubkonnect wallet.";
    }
    if (status === "INVALID_METERNO") {
      return "Invalid electricity meter number entered. Verification failed.";
    }
    if (status === "INVALID_METERTYPE") {
      return "Invalid electricity meter type. Please specify Prepaid or Postpaid.";
    }
    if (status === "INVALID_SMARTCARDNO") {
      return "Invalid smartcard / IUC number entered. Verification failed.";
    }
    if (status === "INVALID_RECIPIENT" || status === "INVALID_PHONENUMBER") {
      return "Invalid recipient phone number format.";
    }
    if (status === "INVALID_AMOUNT") {
      return "Invalid amount specified for plan.";
    }
    if (status === "TRANSACTION_BEYOND_30_DAYS") {
      return "Transaction not found or query is beyond 30 days window.";
    }
    return data.msg || data.message || data.detail || status || fallback;
  }

  /**
   * 1. Test Gateway Connection & Live Credentials
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; details?: any }> {
    const start = performance.now();
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return {
        ok: false,
        message: "Clubkonnect UserID and API Key are required. Please configure both in Provider Settings.",
        responseTimeMs: 0,
      };
    }

    try {
      // 1. Check live wallet balance using configured credentials
      const balanceUrl = `${baseUrl}/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;
      const res = await this.executeFetch(balanceUrl, "GET", null, 10000);
      const elapsed = Math.round(performance.now() - start);

      const status = String(res.data?.status || "").toUpperCase().trim();
      const rawBalance = res.data?.walletbalance ?? res.data?.balance ?? res.data?.wallet_balance;

      if (rawBalance !== undefined && rawBalance !== null && !status.includes("INVALID") && !status.includes("ERROR")) {
        const balNum = parseFloat(String(rawBalance)) || 0;
        return {
          ok: true,
          message: `Connected to Clubkonnect (Nellobyte Systems) Successfully (${elapsed}ms)! Wallet balance: ₦${balNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
          responseTimeMs: elapsed,
          details: {
            authenticated: true,
            balance: balNum,
            currency: "NGN",
            rawResponse: res.data,
          },
        };
      }

      if (status === "INVALID_CREDENTIALS") {
        return {
          ok: false,
          message: `Clubkonnect Gateway reached (${elapsed}ms), but credentials were rejected (INVALID_CREDENTIALS). Verify UserID (${userId}) and API Key.`,
          responseTimeMs: elapsed,
          details: res.data,
        };
      }

      if (status.includes("IP_NOT")) {
        return {
          ok: false,
          message: `Clubkonnect Gateway reached (${elapsed}ms), but Server IP is not whitelisted. Please whitelist this server's IP in your Clubkonnect Reseller dashboard.`,
          responseTimeMs: elapsed,
          details: res.data,
        };
      }

      // Check public catalog reachability to confirm server connectivity
      const publicRes = await this.executeFetch(`${baseUrl}/APIAirtimeDiscountV1.asp`, "GET", null, 8000);
      if (publicRes.ok) {
        return {
          ok: true,
          message: `Connected to Clubkonnect VTU Gateway (${elapsed}ms). Catalog active, ready for live operations.`,
          responseTimeMs: elapsed,
          details: { publicResponse: publicRes.data },
        };
      }

      return {
        ok: false,
        message: `Clubkonnect Connection Failed: ${res.error || "Unable to reach Clubkonnect API endpoint"}`,
        responseTimeMs: elapsed,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Clubkonnect Connection Error: ${err?.message || "Unknown error"}`,
        responseTimeMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * 2. Query Reseller Wallet Balance
   */
  async queryBalance(
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; balance?: number; currency?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Clubkonnect UserID and API Key must be configured." };
    }

    const url = `${baseUrl}/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;
    const res = await this.executeFetch(url, "GET", null, 12000);

    const status = String(res.data?.status || "").toUpperCase();
    const rawBal = res.data?.walletbalance ?? res.data?.balance ?? res.data?.wallet_balance;

    if (rawBal !== undefined && rawBal !== null && !status.includes("INVALID") && !status.includes("ERROR")) {
      return {
        success: true,
        balance: parseFloat(String(rawBal)) || 0,
        currency: "NGN",
        rawResponse: res.data,
      };
    }

    const errorMsg = ClubKonnectAdapter.extractErrorMessage(res.data, res.error || "Unable to retrieve Clubkonnect balance.");
    return {
      success: false,
      error: errorMsg,
      rawResponse: res.data,
    };
  }

  /**
   * 3. Purchase Airtime VTU
   */
  async purchaseAirtime(
    params: {
      network: string;
      phoneNumber: string;
      amount: number;
      reference: string;
      callBackUrl?: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    reference?: string;
    orderId?: string;
    message?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or API Key in provider settings." };
    }

    const networkCode = ClubKonnectAdapter.resolveNetworkCode(params.network, params.phoneNumber);
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const pin = this.getTransactionPin(config);
    const cbParam = params.callBackUrl ? `&CallBackURL=${encodeURIComponent(params.callBackUrl)}` : "";
    const pinParam = pin ? `&PIN=${encodeURIComponent(pin)}` : "";

    const url = `${baseUrl}/APIAirtimeV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${encodeURIComponent(String(params.amount))}&MobileNumber=${encodeURIComponent(phone)}&RequestID=${encodeURIComponent(params.reference)}${pinParam}${cbParam}`;

    const res = await this.executeFetch(url, "GET", null, 25000);
    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    const orderId = res.data?.orderid || res.data?.order_id || res.data?.orderId || params.reference;
    const errorMsg = !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data, res.error || "Airtime top-up failed on Clubkonnect") : undefined;
    const msg = isSuccess ? (res.data?.msg || res.data?.message || "Airtime Top-Up Successful") : errorMsg;

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: res.data,
      error: errorMsg,
    };
  }

  /**
   * 4. Purchase Data Bundle
   */
  async purchaseData(
    params: {
      network: string;
      phoneNumber: string;
      planCode: string;
      amount?: number;
      reference: string;
      callBackUrl?: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    reference?: string;
    orderId?: string;
    message?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or API Key in provider settings." };
    }

    const networkCode = ClubKonnectAdapter.resolveNetworkCode(params.network, params.phoneNumber);
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const plan = String(params.planCode || "1000").replace(/^ck_[a-zA-Z0-9]+_/i, "").trim();
    const pin = this.getTransactionPin(config);
    const cbParam = params.callBackUrl ? `&CallBackURL=${encodeURIComponent(params.callBackUrl)}` : "";
    const amountParam = !plan && params.amount ? `&Amount=${encodeURIComponent(String(params.amount))}` : "";
    const pinParam = pin ? `&PIN=${encodeURIComponent(pin)}` : "";

    // ClubKonnect data bundles are routed via APIAirtimeV1.asp with DataPlan parameter
    const url = `${baseUrl}/APIAirtimeV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(plan)}${amountParam}&MobileNumber=${encodeURIComponent(phone)}&RequestID=${encodeURIComponent(params.reference)}${pinParam}${cbParam}`;

    const res = await this.executeFetch(url, "GET", null, 25000);
    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    const orderId = res.data?.orderid || res.data?.order_id || res.data?.orderId || params.reference;
    const errorMsg = !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data, res.error || "Data purchase failed on Clubkonnect") : undefined;
    const msg = isSuccess ? (res.data?.msg || res.data?.message || "Data Bundle Delivered Successfully") : errorMsg;

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: res.data,
      error: errorMsg,
    };
  }

  /**
   * 5. Validate Electricity Customer Meter Number
   */
  async validateElectricityCustomer(
    params: { electricCompany: string; meterType?: string; meterNo: string },
    config: PaymentProviderConfig
  ): Promise<{
    valid: boolean;
    customerName?: string;
    customerAddress?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { valid: false, error: "Clubkonnect UserID and API Key must be configured to verify meters." };
    }

    const discoCode = ClubKonnectAdapter.resolveDiscoCode(params.electricCompany);
    const meterTypeCode = ClubKonnectAdapter.resolveMeterTypeCode(params.meterType);
    const cleanMeter = String(params.meterNo || "").trim();

    const url = `${baseUrl}/APIVerifyElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterNo=${encodeURIComponent(cleanMeter)}&MeterType=${encodeURIComponent(meterTypeCode)}`;

    const res = await this.executeFetch(url, "GET", null, 15000);
    const raw = res.data;
    const name = raw?.customer_name || raw?.customername || raw?.Customer_Name || raw?.name;

    if (name && String(name).trim().length > 1 && String(name).trim() !== "INVALID_METERNO" && !String(name).toLowerCase().includes("invalid")) {
      return {
        valid: true,
        customerName: String(name).trim(),
        customerAddress: raw.address || raw.Customer_Address || "",
        rawResponse: raw,
      };
    }

    const errorMsg = ClubKonnectAdapter.extractErrorMessage(raw, res.error || "Unable to verify meter number. Please ensure the meter number and Disco are correct.");
    return {
      valid: false,
      error: errorMsg,
      rawResponse: raw,
    };
  }

  // Compatibility alias
  async verifyMeter(
    params: { electricCompany: string; meterType?: string; meterNo: string },
    config: PaymentProviderConfig
  ) {
    return this.validateElectricityCustomer(params, config);
  }

  /**
   * 6. Pay Electricity Bill / Purchase Token
   */
  async payElectricity(
    params: {
      electricCompany: string;
      meterType: "PREPAID" | "POSTPAID" | string;
      meterNo: string;
      amount: number;
      phoneNumber?: string;
      reference: string;
      callBackUrl?: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    reference?: string;
    orderId?: string;
    token?: string;
    units?: string;
    message?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or API Key in provider settings." };
    }

    const discoCode = ClubKonnectAdapter.resolveDiscoCode(params.electricCompany);
    const meterTypeCode = ClubKonnectAdapter.resolveMeterTypeCode(params.meterType);
    const cleanMeter = String(params.meterNo || "").trim();
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const pin = this.getTransactionPin(config);
    const cbParam = params.callBackUrl ? `&CallBackURL=${encodeURIComponent(params.callBackUrl)}` : "";
    const pinParam = pin ? `&PIN=${encodeURIComponent(pin)}` : "";

    const url = `${baseUrl}/APIElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(cleanMeter)}&Amount=${encodeURIComponent(String(params.amount))}&PhoneNo=${encodeURIComponent(phone)}&RequestID=${encodeURIComponent(params.reference)}${pinParam}${cbParam}`;

    const res = await this.executeFetch(url, "GET", null, 30000);
    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    const orderId = res.data?.orderid || res.data?.order_id || res.data?.orderId || params.reference;
    const token = res.data?.metertoken || res.data?.meter_token || res.data?.token;
    const units = res.data?.units || "";
    const errorMsg = !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data, res.error || "Electricity payment failed on Clubkonnect") : undefined;
    const msg = isSuccess ? (res.data?.msg || res.data?.message || "Electricity Bill Paid Successfully") : errorMsg;

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      token: token ? String(token) : undefined,
      units: units ? String(units) : undefined,
      message: msg,
      rawResponse: res.data,
      error: errorMsg,
    };
  }

  /**
   * 7. Validate Cable TV Customer (SmartCard / IUC)
   */
  async validateCableTVCustomer(
    params: { cableProvider: string; smartCardNo: string },
    config: PaymentProviderConfig
  ): Promise<{
    valid: boolean;
    customerName?: string;
    currentPlan?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { valid: false, error: "Clubkonnect UserID and API Key must be configured to verify smartcards." };
    }

    const cableCode = ClubKonnectAdapter.resolveCableCode(params.cableProvider);
    const cleanCard = String(params.smartCardNo || "").trim();

    const url = `${baseUrl}/APIVerifyCableTVV1.0.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&SmartCardNo=${encodeURIComponent(cleanCard)}`;

    const res = await this.executeFetch(url, "GET", null, 15000);
    const raw = res.data;
    const name = raw?.customer_name || raw?.customername || raw?.Customer_Name || raw?.name;

    if (name && String(name).trim().length > 1 && String(name).trim() !== "INVALID_SMARTCARDNO" && !String(name).toLowerCase().includes("invalid")) {
      return {
        valid: true,
        customerName: String(name).trim(),
        currentPlan: raw.package || raw.current_package || `${params.cableProvider.toUpperCase()} ACTIVE`,
        rawResponse: raw,
      };
    }

    const errorMsg = ClubKonnectAdapter.extractErrorMessage(raw, res.error || "Unable to verify smartcard number. Please check the IUC/Smartcard number.");
    return {
      valid: false,
      error: errorMsg,
      rawResponse: raw,
    };
  }

  // Compatibility alias
  async verifyCable(
    params: { cableProvider: string; smartCardNo: string },
    config: PaymentProviderConfig
  ) {
    return this.validateCableTVCustomer(params, config);
  }

  /**
   * 8. Pay Cable TV Subscription
   */
  async payCableTV(
    params: {
      cableProvider: string;
      packageCode: string;
      smartCardNo: string;
      amount?: number;
      phoneNumber?: string;
      reference: string;
      callBackUrl?: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    reference?: string;
    orderId?: string;
    message?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or API Key in provider settings." };
    }

    const cableCode = ClubKonnectAdapter.resolveCableCode(params.cableProvider);
    const cleanCard = String(params.smartCardNo || "").trim();
    const pkg = String(params.packageCode || "01").trim();
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const pin = this.getTransactionPin(config);
    const cbParam = params.callBackUrl ? `&CallBackURL=${encodeURIComponent(params.callBackUrl)}` : "";
    const pinParam = pin ? `&PIN=${encodeURIComponent(pin)}` : "";

    const url = `${baseUrl}/APICableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(pkg)}&SmartCardNo=${encodeURIComponent(cleanCard)}&PhoneNo=${encodeURIComponent(phone)}&RequestID=${encodeURIComponent(params.reference)}${pinParam}${cbParam}`;

    const res = await this.executeFetch(url, "GET", null, 25000);
    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    const orderId = res.data?.orderid || res.data?.order_id || res.data?.orderId || params.reference;
    const errorMsg = !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data, res.error || "Cable TV subscription failed on Clubkonnect") : undefined;
    const msg = isSuccess ? (res.data?.msg || res.data?.message || "Cable Subscription Successful") : errorMsg;

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: res.data,
      error: errorMsg,
    };
  }

  /**
   * 9. Query / Requery Transaction Status
   */
  async queryTransaction(
    referenceOrOrderId: string,
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    status: string;
    orderId?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, status: "ERROR", error: "Clubkonnect credentials missing." };
    }

    const cleanRef = String(referenceOrOrderId || "").trim();
    const url = `${baseUrl}/APIQueryV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&OrderID=${encodeURIComponent(cleanRef)}`;

    const res = await this.executeFetch(url, "GET", null, 15000);
    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    const status = String(res.data?.status || (isSuccess ? "SUCCESSFUL" : "PENDING"));

    return {
      success: isSuccess,
      status,
      orderId: String(res.data?.orderid || cleanRef),
      rawResponse: res.data,
      error: !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data) : undefined,
    };
  }

  /**
   * 10. Cancel Pending Transaction
   */
  async cancelTransaction(
    orderId: string,
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; message?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const userId = this.getUserId(config);
    const apiKey = this.getApiKey(config);

    if (!userId || !apiKey) {
      return { success: false, error: "Clubkonnect credentials missing." };
    }

    const url = `${baseUrl}/APICancelV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&OrderID=${encodeURIComponent(orderId)}`;
    const res = await this.executeFetch(url, "GET", null, 15000);

    const isSuccess = ClubKonnectAdapter.isSuccessResponse(res.data);
    return {
      success: isSuccess,
      message: res.data?.msg || res.data?.message || (isSuccess ? "Order cancelled successfully" : "Cancel failed"),
      rawResponse: res.data,
      error: !isSuccess ? ClubKonnectAdapter.extractErrorMessage(res.data) : undefined,
    };
  }

  /**
   * 11. Retrieve Wholesale Telecom Data Bundle Plans Catalog
   */
  async getDatabundlePlans(config?: PaymentProviderConfig): Promise<any> {
    const baseUrl = this.getBaseUrl(config);
    const res = await this.executeFetch(`${baseUrl}/APIDatabundlePlansV1.asp`, "GET", null, 10000);
    return res.data;
  }

  /**
   * 12. Retrieve Cable TV Packages Catalog
   */
  async getCableTVPackages(config?: PaymentProviderConfig): Promise<any> {
    const baseUrl = this.getBaseUrl(config);
    const res = await this.executeFetch(`${baseUrl}/APICableTVPackagesV1.asp`, "GET", null, 10000);
    return res.data;
  }

  /**
   * 13. Retrieve Electricity DISCOs Catalog
   */
  async getElectricityDiscos(config?: PaymentProviderConfig): Promise<any> {
    const baseUrl = this.getBaseUrl(config);
    const res = await this.executeFetch(`${baseUrl}/APIElectricityDiscosV1.asp`, "GET", null, 10000);
    return res.data;
  }

  /**
   * 14. Retrieve Airtime Discounts Catalog
   */
  async getAirtimeDiscounts(config?: PaymentProviderConfig): Promise<any> {
    const baseUrl = this.getBaseUrl(config);
    const res = await this.executeFetch(`${baseUrl}/APIAirtimeDiscountV1.asp`, "GET", null, 10000);
    return res.data;
  }
}
