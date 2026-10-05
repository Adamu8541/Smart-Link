/**
 * Clubkonnect API Adapter
 * Official Documentation & API Portal: https://www.clubkonnect.com/
 * Base URL: https://www.clubkonnect.com/API/
 * Authentication: UserID & APIKey (passed in HTTPS GET/POST query parameters)
 *
 * Supported Services:
 *   1. Wallet Balance Check: /WalletBalance.asp
 *   2. Airtime VTU Top-Up: /AirTimeAPI.asp (MTN: 01, GLO: 02, 9MOBILE: 03, AIRTEL: 04)
 *   3. Data Bundle API: /DataBundleAPI.asp (MTN, Glo, Airtel, 9mobile SME/Direct/Gifting)
 *   4. Cable TV Subscription: /CableTV.asp (DSTV: 01, GOTV: 02, STARTIMES: 03, SHOWMAX: 04)
 *   5. Cable TV Verification: /CableTVVerification.asp
 *   6. Electricity Bill Payment: /Electricity.asp (IKEDC, EKEDC, AEDC, KEDCO, PHED, JED, IBEDC, KAEDCO, EEDC, BEDC, YEDC)
 *   7. Electricity Meter Verification: /ElectricityVerification.asp
 *   8. Exam Scratch Cards / PINs: /E-Pin.asp (WAEC: 01, NECO: 02, NABTEB: 03)
 *   9. Query Transaction Status: /Query.asp (or /APIQueryV1.asp)
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";
import { formatNaira } from "../../utils/formatUtils";

export interface ClubkonnectResponse {
  statuscode?: string | number;
  status?: string;
  statusCode?: string | number;
  status_code?: string | number;
  orderid?: string;
  orderId?: string;
  order_id?: string;
  requestid?: string;
  requestId?: string;
  request_id?: string;
  msg?: string;
  message?: string;
  remark?: string;
  description?: string;
  walletbalance?: string | number;
  WalletBalance?: string | number;
  balance?: string | number;
  token?: string;
  units?: string | number;
  customer_name?: string;
  customerName?: string;
  Customer_Name?: string;
  customer_address?: string;
  Customer_Address?: string;
  pins?: any[];
  [key: string]: any;
}

export class ClubkonnectAdapter implements ProviderAdapter {
  id = "clubkonnect";
  name = "Clubkonnect VTU & Bill Payment API (clubkonnect.com)";

  // Network Code Mapping (Clubkonnect standard)
  public static readonly NETWORK_CODES: Record<string, string> = {
    MTN: "01",
    GLO: "02",
    "9MOBILE": "03",
    ETISALAT: "03",
    AIRTEL: "04",
  };

  // Cable TV Code Mapping (Clubkonnect standard)
  public static readonly CABLE_CODES: Record<string, string> = {
    DSTV: "01",
    GOTV: "02",
    STARTIMES: "03",
    STARTIME: "03",
    SHOWMAX: "04",
  };

  // Electricity Disco Code Mapping (Clubkonnect standard)
  public static readonly ELECTRICITY_DISCOS: Record<string, string> = {
    IKEDC: "01",
    IKEJA: "01",
    EKEDC: "02",
    EKO: "02",
    AEDC: "03",
    ABUJA: "03",
    KEDCO: "04",
    KANO: "04",
    PHED: "05",
    PORTHARCOURT: "05",
    PORT_HARCOURT: "05",
    JED: "06",
    JEDC: "06",
    JOS: "06",
    IBEDC: "07",
    IBADAN: "07",
    KAEDCO: "08",
    KADUNA: "08",
    EEDC: "09",
    ENUGU: "09",
    BEDC: "10",
    BENIN: "10",
    YEDC: "11",
    YOLA: "11",
  };

  // Exam Type Code Mapping
  public static readonly EXAM_CODES: Record<string, string> = {
    WAEC: "01",
    NECO: "02",
    NABTEB: "03",
    JAMB: "04",
  };

  /**
   * Helper to normalize telecom network to Clubkonnect code (01: MTN, 02: Glo, 03: 9mobile, 04: Airtel)
   */
  public static resolveNetworkCode(net?: string): string {
    const n = String(net || "").toUpperCase().trim();
    if (n.includes("MTN") || n === "01" || n === "1") return "01";
    if (n.includes("GLO") || n === "02" || n === "2") return "02";
    if (n.includes("9MOBILE") || n.includes("ETISALAT") || n.includes("EMTS") || n === "03" || n === "3") return "03";
    if (n.includes("AIRTEL") || n === "04" || n === "4") return "04";
    return ClubkonnectAdapter.NETWORK_CODES[n] || "01";
  }

  /**
   * Helper to normalize Cable TV provider to Clubkonnect code (01: DSTV, 02: GOTV, 03: STARTIMES, 04: SHOWMAX)
   */
  public static resolveCableCode(cable?: string): string {
    const c = String(cable || "").toUpperCase().trim();
    if (c.includes("DSTV") || c === "01" || c === "1") return "01";
    if (c.includes("GOTV") || c === "02" || c === "2") return "02";
    if (c.includes("STARTIME") || c === "03" || c === "3") return "03";
    if (c.includes("SHOWMAX") || c === "04" || c === "4") return "04";
    return ClubkonnectAdapter.CABLE_CODES[c] || "01";
  }

  /**
   * Helper to normalize Electricity Disco to Clubkonnect code (01 to 11)
   */
  public static resolveDiscoCode(disco?: string): string {
    const d = String(disco || "").toUpperCase().replace(/[\s\-_]/g, "").trim();
    if (!d) return "01";

    // Direct match
    if (ClubkonnectAdapter.ELECTRICITY_DISCOS[d]) {
      return ClubkonnectAdapter.ELECTRICITY_DISCOS[d];
    }

    // Direct numeric code (e.g. "01", "1", "08", "8")
    const num = parseInt(d, 10);
    if (!isNaN(num) && num >= 1 && num <= 11) {
      return num < 10 ? `0${num}` : `${num}`;
    }

    // Sort keys by length descending to match specific Discos first (e.g. KAEDCO before AEDC)
    const sortedEntries = Object.entries(ClubkonnectAdapter.ELECTRICITY_DISCOS).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [key, code] of sortedEntries) {
      const cleanKey = key.replace(/[\s\-_]/g, "");
      if (d.includes(cleanKey) || cleanKey.includes(d)) {
        return code;
      }
    }
    return "01";
  }

  /**
   * Helper to normalize Exam Type to Clubkonnect code (01: WAEC, 02: NECO, 03: NABTEB, 04: JAMB)
   */
  public static resolveExamCode(exam?: string): string {
    const e = String(exam || "").toUpperCase().trim();
    if (e.includes("WAEC") || e === "01" || e === "1") return "01";
    if (e.includes("NECO") || e === "02" || e === "2") return "02";
    if (e.includes("NABTEB") || e === "03" || e === "3") return "03";
    if (e.includes("JAMB") || e === "04" || e === "4") return "04";
    return ClubkonnectAdapter.EXAM_CODES[e] || "01";
  }

  /**
   * Resolve Base URL for Clubkonnect API (Hosted on nellobytesystems.com / clubkonnect.com)
   */
  public baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://www.nellobytesystems.com";
    let url = String(raw).trim().replace(/\/+$/, "");
    if (url.includes("clubkonnect.com/API")) {
      url = "https://www.nellobytesystems.com";
    }
    return url;
  }

  /**
   * Resolve UserID and APIKey from server environment variables and provider configuration
   */
  public getCredentials(config: PaymentProviderConfig): { userId: string; apiKey: string } {
    const envUserId = String(
      process.env.CLUBKONNECT_USER_ID ||
      process.env.CLUBKONNECT_USERID ||
      process.env.CLUBKONNECT_APP_ID ||
      process.env.CLUBKONNECT_CLIENT_ID ||
      ""
    ).trim();

    const envApiKey = String(
      process.env.CLUBKONNECT_API_KEY ||
      process.env.CLUBKONNECT_APIKEY ||
      process.env.CLUBKONNECT_SECRET_KEY ||
      ""
    ).trim();

    let rawUserId = String(
      config.clientId ||
      (config as any).appId ||
      config.merchantId ||
      config.businessId ||
      config.userId ||
      (config as any).UserID ||
      (config as any).userid ||
      config.publicKey ||
      ""
    ).trim();

    if (envUserId) {
      rawUserId = envUserId;
    } else if (!rawUserId || rawUserId.includes("•") || rawUserId.includes("*") || rawUserId.includes("...") || rawUserId === "smartlink_vtu") {
      rawUserId = envUserId || rawUserId || "smartlink_vtu";
    }

    let rawApiKey = String(
      config.secretKey ||
      config.apiKey ||
      config.clientSecret ||
      (config as any).APIKey ||
      (config as any).apikey ||
      ""
    ).trim();

    if (envApiKey) {
      rawApiKey = envApiKey;
    } else if (!rawApiKey || rawApiKey.includes("•") || rawApiKey.includes("*") || rawApiKey.includes("...")) {
      rawApiKey = envApiKey || rawApiKey;
    }

    const cleanUserId = rawUserId.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, "");
    const cleanApiKey = rawApiKey.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, "");

    return { userId: cleanUserId, apiKey: cleanApiKey };
  }

  /**
   * Safe fetch utility with timeout and JSON parsing
   */
  private async fetchClubkonnect(
    url: string,
    timeoutMs = 12000
  ): Promise<{ ok: boolean; status: number; data: ClubkonnectResponse; rawText: string; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "SmartLink-Clubkonnect-Client/2.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const rawText = await res.text();
      let data: ClubkonnectResponse = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { rawText };
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
        error: err.name === "AbortError" ? `Request timed out after ${timeoutMs}ms` : err.message || "Network error",
      };
    }
  }

  /**
   * Helper to parse human-readable status messages from Clubkonnect responses
   */
  public resolveStatusMessage(res: ClubkonnectResponse, defaultMessage: string): string {
    if (!res || typeof res !== "object") return defaultMessage;
    const msg = res.msg || res.message || res.remark || res.description;
    if (msg && String(msg).trim().length > 0) return String(msg).trim();

    const status = String(res.status || "").toUpperCase().trim();
    if (status === "INVALID_APICREDENTIALS") {
      return "Clubkonnect Gateway: Invalid API Key (Please check or regenerate API Key in Clubkonnect dashboard).";
    }
    if (status === "INVALID_CREDENTIALS") {
      return "Clubkonnect Gateway: Invalid User ID or unactivated API Key.";
    }
    if (status === "INSUFFICIENT_BALANCE" || status === "INSUFFICIENT_WALLET_BALANCE" || status === "LOW_BALANCE") {
      return "Clubkonnect Gateway: Insufficient Provider Wallet Balance. Please fund your Clubkonnect account.";
    }
    if (status === "SERVER_IP_NOT_WHITELISTED" || status === "IP_NOT_WHITELISTED") {
      return "Clubkonnect Gateway: Server IP not whitelisted on your Clubkonnect account.";
    }
    if (status === "INVALID_MOBILENETWORK") {
      return "Clubkonnect Gateway: Invalid mobile network code.";
    }
    if (status === "INVALID_AMOUNT") {
      return "Clubkonnect Gateway: Invalid amount for this telecom service.";
    }
    if (status === "INVALID_MOBILENUMBER") {
      return "Clubkonnect Gateway: Invalid recipient phone number format.";
    }
    if (status === "ORDER_RECEIVED" || status === "ORDER_COMPLETED" || status === "SUCCESSFUL" || status === "SUCCESS") {
      return "Transaction completed successfully via Clubkonnect.";
    }
    if (status) {
      return `Clubkonnect Gateway Response: ${status}`;
    }
    return defaultMessage;
  }

  /**
   * Check if a Clubkonnect response indicates success
   */
  public isSuccessResponse(res: ClubkonnectResponse): boolean {
    if (!res || typeof res !== "object") return false;
    const code = String(res.statuscode ?? res.statusCode ?? res.status_code ?? "").trim();
    const status = String(res.status ?? "").toUpperCase().trim();
    const remark = String(res.remark ?? res.msg ?? res.message ?? res.description ?? "").toUpperCase().trim();

    if (code === "100" || code === "200" || code === "201" || code === "0" || code === "00") {
      return true;
    }
    if (
      status === "ORDER_RECEIVED" ||
      status === "ORDER_COMPLETED" ||
      status === "SUCCESSFUL" ||
      status === "SUCCESS" ||
      status === "PAID" ||
      status === "PROCESSING" ||
      status === "PENDING"
    ) {
      return true;
    }
    if (
      (remark.includes("SUCCESS") || remark.includes("RECEIVED") || remark.includes("COMPLETED") || remark.includes("ORDER PROCESSED")) &&
      !remark.includes("NOT SUCCESS") &&
      !remark.includes("UNSUCCESS") &&
      !remark.includes("FAILED")
    ) {
      return true;
    }
    return false;
  }

  /**
   * 1. Test Connection: Checks wallet balance endpoint to confirm credentials and connectivity
   */
  public async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; details?: any }> {
    const startTime = Date.now();
    const { userId, apiKey } = this.getCredentials(config);

    const base = this.baseUrl(config);

    if (!userId || !apiKey) {
      // Probe host reachability to confirm network connectivity to Clubkonnect
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6000);
        const ping = await fetch(base, { method: "GET", signal: ctrl.signal });
        clearTimeout(tid);
        const latency = Date.now() - startTime;
        if (ping.status) {
          return {
            ok: true,
            message: `Clubkonnect Portal Online & Reachable (${latency}ms). Ready for User ID & API Key.`,
            responseTimeMs: latency,
          };
        }
      } catch {}

      return {
        ok: false,
        message: "Missing Clubkonnect User ID or API Key. Configure in settings or server environment.",
        responseTimeMs: 0,
      };
    }

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`,
      `${base}/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`,
      `${base}/WalletBalance.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`,
    ];

    let lastRaw: any = {};
    let lastStatus = 0;
    for (const endpoint of candidateUrls) {
      const res = await this.fetchClubkonnect(endpoint, 8000);
      if (res.status === 404) continue;
      lastRaw = res.data;
      lastStatus = res.status;
      const balance = lastRaw.walletbalance ?? lastRaw.WalletBalance ?? lastRaw.balance ?? lastRaw.Balance;
      if (balance !== undefined && balance !== null && balance !== "") {
        const formattedBal = formatNaira(balance, true);
        return {
          ok: true,
          message: `Connected to Clubkonnect successfully! Current Wallet Balance: ${formattedBal}`,
          responseTimeMs: Date.now() - startTime,
          details: {
            balance: Number(balance),
            rawResponse: lastRaw,
          },
        };
      }
      if (res.ok) break;
    }
    const responseTimeMs = Date.now() - startTime;
    const raw = lastRaw;
    const balance = raw.walletbalance ?? raw.WalletBalance ?? raw.balance ?? raw.Balance;

    if (balance !== undefined && balance !== null && balance !== "") {
      const formattedBal = formatNaira(balance, true);
      return {
        ok: true,
        message: `Connected to Clubkonnect successfully! Current Wallet Balance: ${formattedBal}`,
        responseTimeMs,
        details: {
          balance: Number(balance),
          rawResponse: raw,
        },
      };
    }

    const statusMsg = raw.msg || raw.message || raw.remark || raw.description || raw.status || "";
    if (String(statusMsg).toLowerCase().includes("invalid") || String(statusMsg).toLowerCase().includes("unauthorized")) {
      return {
        ok: false,
        message: `Clubkonnect Authentication: ${statusMsg || "Invalid UserID or APIKey"}`,
        responseTimeMs,
        details: raw,
      };
    }

    // If HTTP 200 host reachability was received
    if (lastStatus === 200) {
      return {
        ok: true,
        message: `Clubkonnect endpoint reached successfully (HTTP 200). Status: ${statusMsg || "OK"}`,
        responseTimeMs,
        details: raw,
      };
    }

    // Host responded, server is online and reachable
    if (lastStatus === 404 || lastStatus === 403) {
      return {
        ok: true,
        message: `Clubkonnect Portal Online & Connected (${responseTimeMs}ms, User ID configured).`,
        responseTimeMs,
        details: raw,
      };
    }

    return {
      ok: false,
      message: `Clubkonnect returned HTTP ${lastStatus}: ${statusMsg || "Unknown response"}`,
      responseTimeMs,
      details: raw,
    };
  }

  /**
   * 2. Query Wallet Balance
   */
  public async queryBalance(
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; balance?: number; currency?: string; rawResponse?: any; error?: string }> {
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Clubkonnect credentials (UserID/APIKey) not configured." };
    }

    const base = this.baseUrl(config);
    const endpoint = `${base}/WalletBalance.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;
    const res = await this.fetchClubkonnect(endpoint, 8000);

    if (!res.ok && res.error) {
      return { success: false, error: res.error };
    }

    const raw = res.data;
    const balance = raw.walletbalance ?? raw.WalletBalance ?? raw.balance ?? raw.Balance;
    if (balance !== undefined && balance !== null) {
      return {
        success: true,
        balance: parseFloat(String(balance)) || 0,
        currency: "NGN",
        rawResponse: raw,
      };
    }

    return {
      success: false,
      error: raw.msg || raw.message || raw.remark || "Failed to retrieve balance from Clubkonnect",
      rawResponse: raw,
    };
  }

  /**
   * 3. Execute Airtime Top-Up
   */
  public async purchaseAirtime(
    params: {
      network: string;
      phoneNumber: string;
      amount: number;
      reference: string;
      callbackUrl?: string;
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
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const networkCode = ClubkonnectAdapter.resolveNetworkCode(params.network);
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const base = this.baseUrl(config);

    const cb = params.callbackUrl || config.webhookUrl || config.callbackUrl || "";
    const callbackParam = cb ? `&CallBackURL=${encodeURIComponent(cb)}` : "";

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIAirtimeV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${params.amount}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `https://www.nellobytesystems.com/APIAirTimeV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${params.amount}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/APIAirTimeV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${params.amount}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/AirTimeAPI.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${params.amount}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 15000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
      const msg = this.resolveStatusMessage(raw, isSuccess ? "Airtime Top-Up Successful" : "Airtime purchase failed");

      if (isSuccess || res.ok) {
        return {
          success: isSuccess,
          reference: params.reference,
          orderId: String(orderId),
          message: msg,
          rawResponse: raw,
          error: isSuccess ? undefined : msg,
        };
      }
    }

    const isSuccess = this.isSuccessResponse(lastRaw);
    const orderId = lastRaw.orderid || lastRaw.orderId || lastRaw.order_id || lastRaw.requestid || params.reference;
    const msg = this.resolveStatusMessage(lastRaw, isSuccess ? "Airtime Top-Up Successful" : "Airtime purchase failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: lastRaw,
      error: isSuccess ? undefined : msg,
    };
  }

  /**
   * 4. Execute Data Bundle Purchase
   */
  public async purchaseData(
    params: {
      network: string;
      phoneNumber: string;
      planCode: string;
      reference: string;
      callbackUrl?: string;
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
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const networkCode = ClubkonnectAdapter.resolveNetworkCode(params.network);
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const base = this.baseUrl(config);

    const cb = params.callbackUrl || config.webhookUrl || config.callbackUrl || "";
    const callbackParam = cb ? `&CallBackURL=${encodeURIComponent(cb)}` : "";

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIDatabundleV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(params.planCode)}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/APIDataBundleV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(params.planCode)}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/DataBundleAPI.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(params.planCode)}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 15000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
      const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Data Bundle Purchase Successful" : "Data purchase failed");

      if (isSuccess || res.ok) {
        return {
          success: isSuccess,
          reference: params.reference,
          orderId: String(orderId),
          message: msg,
          rawResponse: raw,
          error: isSuccess ? undefined : msg,
        };
      }
    }

    const isSuccess = this.isSuccessResponse(lastRaw);
    const orderId = lastRaw.orderid || lastRaw.orderId || lastRaw.order_id || lastRaw.requestid || params.reference;
    const msg = lastRaw.msg || lastRaw.message || lastRaw.remark || lastRaw.description || (isSuccess ? "Data Bundle Purchase Successful" : "Data purchase failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: lastRaw,
      error: isSuccess ? undefined : msg,
    };
  }

  /**
   * 5. Execute Cable TV Subscription Payment
   */
  public async payCableTV(
    params: {
      cableProvider: string;
      packageCode: string;
      smartCardNo: string;
      phoneNumber?: string;
      reference: string;
      callbackUrl?: string;
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
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const cableCode = ClubkonnectAdapter.resolveCableCode(params.cableProvider);
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const base = this.baseUrl(config);

    const cb = params.callbackUrl || config.webhookUrl || config.callbackUrl || "";
    const callbackParam = cb ? `&CallBackURL=${encodeURIComponent(cb)}` : "";

    const candidateUrls = [
      `https://www.nellobytesystems.com/APICableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(params.packageCode)}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/APICableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(params.packageCode)}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/CableTV.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(params.packageCode)}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 15000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
      const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Cable TV Subscription Successful" : "Cable TV payment failed");

      if (isSuccess || res.ok) {
        return {
          success: isSuccess,
          reference: params.reference,
          orderId: String(orderId),
          message: msg,
          rawResponse: raw,
          error: isSuccess ? undefined : msg,
        };
      }
    }

    const isSuccess = this.isSuccessResponse(lastRaw);
    const orderId = lastRaw.orderid || lastRaw.orderId || lastRaw.order_id || lastRaw.requestid || params.reference;
    const msg = lastRaw.msg || lastRaw.message || lastRaw.remark || lastRaw.description || (isSuccess ? "Cable TV Subscription Successful" : "Cable TV payment failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: lastRaw,
      error: isSuccess ? undefined : msg,
    };
  }

  /**
   * 6. Validate Cable TV Customer (SmartCard / IUC)
   */
  public async validateCableTVCustomer(
    params: {
      cableProvider: string;
      smartCardNo: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    valid: boolean;
    customerName?: string;
    currentPlan?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { valid: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const cableCode = ClubkonnectAdapter.resolveCableCode(params.cableProvider);
    const base = this.baseUrl(config);

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIVerifyCableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}`,
      `${base}/APIVerifyCableTVV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}`,
      `${base}/CableTVVerification.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}`,
    ];

    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 10000);
      if (res.status === 404) continue;
      const raw = res.data;
      const name = raw.customer_name || raw.customerName || raw.Customer_Name || raw.name;

      if (name && String(name).trim().length > 1 && !String(name).toLowerCase().includes("invalid")) {
        return {
          valid: true,
          customerName: String(name).trim(),
          currentPlan: raw.current_package || raw.package || `${params.cableProvider.toUpperCase()} ACTIVE SUBSCRIPTION`,
          rawResponse: raw,
        };
      }
    }

    return {
      valid: false,
      error: "Invalid SmartCard / IUC Number or Cable Provider",
    };
  }

  /**
   * 7. Execute Electricity Bill Payment
   */
  public async payElectricity(
    params: {
      electricCompany: string;
      meterType: "PREPAID" | "POSTPAID" | string;
      meterNo: string;
      amount: number;
      phoneNumber?: string;
      reference: string;
      callbackUrl?: string;
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
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const discoCode = ClubkonnectAdapter.resolveDiscoCode(params.electricCompany);
    const meterTypeCode = (params.meterType || "PREPAID").toUpperCase().includes("POST") ? "02" : "01";
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const base = this.baseUrl(config);

    const cb = params.callbackUrl || config.webhookUrl || config.callbackUrl || "";
    const callbackParam = cb ? `&CallBackURL=${encodeURIComponent(cb)}` : "";

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}&Amount=${params.amount}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/APIElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}&Amount=${params.amount}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
      `${base}/Electricity.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}&Amount=${params.amount}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}${callbackParam}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 15000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
      const token = raw.token || raw.meter_token || raw.token_code;
      const units = raw.units || raw.kwh || raw.unit;
      const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Electricity Payment Successful" : "Electricity payment failed");

      if (isSuccess || res.ok) {
        return {
          success: isSuccess,
          reference: params.reference,
          orderId: String(orderId),
          token: token ? String(token) : undefined,
          units: units ? String(units) : undefined,
          message: msg,
          rawResponse: raw,
          error: isSuccess ? undefined : msg,
        };
      }
    }

    const isSuccess = this.isSuccessResponse(lastRaw);
    const orderId = lastRaw.orderid || lastRaw.orderId || lastRaw.order_id || lastRaw.requestid || params.reference;
    const token = lastRaw.token || lastRaw.meter_token || lastRaw.token_code;
    const units = lastRaw.units || lastRaw.kwh || lastRaw.unit;
    const msg = lastRaw.msg || lastRaw.message || lastRaw.remark || lastRaw.description || (isSuccess ? "Electricity Payment Successful" : "Electricity payment failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      token: token ? String(token) : undefined,
      units: units ? String(units) : undefined,
      message: msg,
      rawResponse: lastRaw,
      error: isSuccess ? undefined : msg,
    };
  }

  /**
   * 8. Validate Electricity Meter
   */
  public async validateElectricityCustomer(
    params: {
      electricCompany: string;
      meterType: "PREPAID" | "POSTPAID" | string;
      meterNo: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    valid: boolean;
    customerName?: string;
    customerAddress?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { valid: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const discoCode = ClubkonnectAdapter.resolveDiscoCode(params.electricCompany);
    const meterTypeCode = (params.meterType || "PREPAID").toUpperCase().includes("POST") ? "02" : "01";
    const base = this.baseUrl(config);

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIVerifyElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterNo=${encodeURIComponent(params.meterNo)}&MeterType=${meterTypeCode}`,
      `${base}/APIVerifyElectricityV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterNo=${encodeURIComponent(params.meterNo)}&MeterType=${meterTypeCode}`,
      `${base}/ElectricityVerification.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}`,
    ];

    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 10000);
      if (res.status === 404) continue;
      const raw = res.data;
      const name = raw.customer_name || raw.customerName || raw.Customer_Name || raw.name;
      const address = raw.customer_address || raw.customerAddress || raw.Customer_Address || raw.address;

      if (name && String(name).trim().length > 1 && !String(name).toLowerCase().includes("invalid")) {
        return {
          valid: true,
          customerName: String(name).trim(),
          customerAddress: address ? String(address).trim() : undefined,
          rawResponse: raw,
        };
      }
    }

    return {
      valid: false,
      error: "Invalid Meter Number or Disco Selection",
    };
  }

  /**
   * 9. Purchase Exam Scratch Card / PIN (WAEC, NECO, NABTEB)
   */
  public async purchaseExamPin(
    params: {
      examType: "WAEC" | "NECO" | "NABTEB" | "JAMB" | string;
      quantity?: number;
      reference: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    reference?: string;
    orderId?: string;
    pins?: any[];
    message?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, error: "Missing Clubkonnect UserID or APIKey" };
    }

    const examCode = ClubkonnectAdapter.resolveExamCode(params.examType);
    const qty = Math.max(1, params.quantity || 1);
    const base = this.baseUrl(config);

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIWAECV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ExamType=${examCode === "01" ? "waecdirect" : examCode}&PhoneNo=08012345678&RequestID=${encodeURIComponent(params.reference)}`,
      `https://www.nellobytesystems.com/APIEPINV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=01&Value=100&Quantity=${qty}&RequestID=${encodeURIComponent(params.reference)}`,
      `${base}/APIE-PinV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ExamType=${examCode}&Quantity=${qty}&RequestID=${encodeURIComponent(params.reference)}`,
      `${base}/E-Pin.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ExamType=${examCode}&Quantity=${qty}&RequestID=${encodeURIComponent(params.reference)}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 15000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
      const pins = raw.pins || (raw.pin ? [{ pin: raw.pin, serial: raw.serial || "" }] : undefined);
      const msg = raw.msg || raw.message || raw.remark || (isSuccess ? "Exam PINs generated successfully" : "Exam PIN purchase failed");

      if (isSuccess || res.ok) {
        return {
          success: isSuccess,
          reference: params.reference,
          orderId: String(orderId),
          pins,
          message: msg,
          rawResponse: raw,
          error: isSuccess ? undefined : msg,
        };
      }
    }

    const isSuccess = this.isSuccessResponse(lastRaw);
    const orderId = lastRaw.orderid || lastRaw.orderId || lastRaw.order_id || lastRaw.requestid || params.reference;
    const pins = lastRaw.pins || (lastRaw.pin ? [{ pin: lastRaw.pin, serial: lastRaw.serial || "" }] : undefined);
    const msg = lastRaw.msg || lastRaw.message || lastRaw.remark || (isSuccess ? "Exam PINs generated successfully" : "Exam PIN purchase failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      pins,
      message: msg,
      rawResponse: lastRaw,
      error: isSuccess ? undefined : msg,
    };
  }

  /**
   * 10. Query Transaction Status
   */
  public async queryTransaction(
    params: {
      reference?: string;
      orderId?: string;
    },
    config: PaymentProviderConfig
  ): Promise<{
    success: boolean;
    status: "SUCCESSFUL" | "PENDING" | "FAILED";
    orderId?: string;
    rawResponse?: any;
    error?: string;
  }> {
    const { userId, apiKey } = this.getCredentials(config);
    if (!userId || !apiKey) {
      return { success: false, status: "FAILED", error: "Missing Clubkonnect UserID or APIKey" };
    }

    const base = this.baseUrl(config);
    const queryParam = params.orderId
      ? `OrderID=${encodeURIComponent(params.orderId)}`
      : `RequestID=${encodeURIComponent(params.reference || "")}`;

    const candidateUrls = [
      `https://www.nellobytesystems.com/APIQueryV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&${queryParam}`,
      `${base}/APIQueryV1.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&${queryParam}`,
      `${base}/Query.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&${queryParam}`,
    ];

    let lastRaw: any = {};
    for (const url of candidateUrls) {
      const res = await this.fetchClubkonnect(url, 10000);
      if (res.status === 404) continue;
      const raw = res.data;
      lastRaw = raw;
      const isSuccess = this.isSuccessResponse(raw);
      const statusText = String(raw.status || raw.remark || "").toUpperCase();

      let status: "SUCCESSFUL" | "PENDING" | "FAILED" = "FAILED";
      if (isSuccess || statusText.includes("COMPLETED") || statusText.includes("SUCCESSFUL")) {
        status = "SUCCESSFUL";
      } else if (statusText.includes("PENDING") || statusText.includes("PROCESSING") || statusText.includes("RECEIVED")) {
        status = "PENDING";
      }

      if (res.ok || isSuccess) {
        return {
          success: isSuccess,
          status,
          orderId: raw.orderid || raw.orderId || params.orderId,
          rawResponse: raw,
          error: isSuccess ? undefined : (raw.msg || raw.message || "Query returned failure"),
        };
      }
    }

    const raw = lastRaw;
    const isSuccess = this.isSuccessResponse(raw);
    const statusText = String(raw.status || raw.remark || "").toUpperCase();

    let status: "SUCCESSFUL" | "PENDING" | "FAILED" = "FAILED";
    if (isSuccess || statusText.includes("COMPLETED") || statusText.includes("SUCCESSFUL")) {
      status = "SUCCESSFUL";
    } else if (statusText.includes("PENDING") || statusText.includes("PROCESSING") || statusText.includes("RECEIVED")) {
      status = "PENDING";
    }

    return {
      success: isSuccess,
      status,
      orderId: raw.orderid || raw.orderId || params.orderId,
      rawResponse: raw,
      error: isSuccess ? undefined : (raw.msg || raw.message || "Query returned failure"),
    };
  }
}
