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
    JED: "06",
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
   * Resolve Base URL for Clubkonnect API
   */
  public baseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || config.apiUrl || "https://www.clubkonnect.com/API";
    let url = String(raw).trim().replace(/\/+$/, "");
    if (!url.toLowerCase().includes("/api")) {
      url += "/API";
    }
    return url;
  }

  /**
   * Resolve UserID and APIKey from provider configuration
   */
  public getCredentials(config: PaymentProviderConfig): { userId: string; apiKey: string } {
    const userId = String(
      config.clientId ||
      config.merchantId ||
      config.businessId ||
      config.userId ||
      (config as any).UserID ||
      (config as any).userid ||
      config.publicKey ||
      ""
    ).trim();

    const apiKey = String(
      config.secretKey ||
      config.apiKey ||
      config.clientSecret ||
      (config as any).APIKey ||
      (config as any).apikey ||
      ""
    ).trim();

    return { userId, apiKey };
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
   * Check if a Clubkonnect response indicates success
   */
  public isSuccessResponse(res: ClubkonnectResponse): boolean {
    const code = String(res.statuscode ?? res.statusCode ?? res.status_code ?? "");
    const status = String(res.status ?? "").toUpperCase();
    const remark = String(res.remark ?? res.msg ?? res.message ?? "").toUpperCase();

    return (
      code === "100" ||
      code === "200" ||
      code === "0" ||
      status === "ORDER_RECEIVED" ||
      status === "ORDER_COMPLETED" ||
      status === "SUCCESSFUL" ||
      status === "SUCCESS" ||
      status === "PAID" ||
      remark.includes("SUCCESS") ||
      remark.includes("RECEIVED")
    );
  }

  /**
   * 1. Test Connection: Checks wallet balance endpoint to confirm credentials and connectivity
   */
  public async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; details?: any }> {
    const startTime = Date.now();
    const { userId, apiKey } = this.getCredentials(config);

    if (!userId) {
      return {
        ok: false,
        message: "Missing Clubkonnect UserID (fill in Client ID / User ID / Merchant ID).",
        responseTimeMs: 0,
      };
    }

    if (!apiKey) {
      return {
        ok: false,
        message: "Missing Clubkonnect APIKey (fill in Secret Key / API Key).",
        responseTimeMs: 0,
      };
    }

    const base = this.baseUrl(config);
    const endpoint = `${base}/WalletBalance.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;

    const res = await this.fetchClubkonnect(endpoint, 8000);
    const responseTimeMs = Date.now() - startTime;

    if (!res.ok && res.error) {
      return {
        ok: false,
        message: `Clubkonnect server unreachable: ${res.error}`,
        responseTimeMs,
      };
    }

    const raw = res.data;
    const balance = raw.walletbalance ?? raw.WalletBalance ?? raw.balance ?? raw.Balance;

    if (balance !== undefined && balance !== null && balance !== "") {
      const formattedBal = Number(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 });
      return {
        ok: true,
        message: `Connected to Clubkonnect successfully! Current Wallet Balance: ₦${formattedBal}`,
        responseTimeMs,
        details: {
          balance: Number(balance),
          rawResponse: raw,
        },
      };
    }

    const statusMsg = raw.msg || raw.message || raw.remark || raw.description || res.rawText;
    if (String(statusMsg).toLowerCase().includes("invalid") || String(statusMsg).toLowerCase().includes("unauthorized")) {
      return {
        ok: false,
        message: `Clubkonnect Authentication Failed: ${statusMsg || "Invalid UserID or APIKey"}`,
        responseTimeMs,
      };
    }

    // If HTTP 200 was received
    if (res.status === 200) {
      return {
        ok: true,
        message: `Clubkonnect endpoint reached successfully (HTTP 200). Status: ${statusMsg || "OK"}`,
        responseTimeMs,
        details: raw,
      };
    }

    return {
      ok: false,
      message: `Clubkonnect returned HTTP ${res.status}: ${statusMsg || "Unknown response"}`,
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

    const netUpper = (params.network || "MTN").toUpperCase().trim();
    const networkCode = ClubkonnectAdapter.NETWORK_CODES[netUpper] || "01";
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const callback = encodeURIComponent(params.callbackUrl || config.webhookUrl || config.callbackUrl || "");
    const base = this.baseUrl(config);

    const url = `${base}/AirTimeAPI.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&Amount=${params.amount}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}&CallBackURL=${callback}`;

    const res = await this.fetchClubkonnect(url, 15000);
    const raw = res.data;
    const isSuccess = this.isSuccessResponse(raw);
    const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
    const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Airtime Top-Up Successful" : "Airtime purchase failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: raw,
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

    const netUpper = (params.network || "MTN").toUpperCase().trim();
    const networkCode = ClubkonnectAdapter.NETWORK_CODES[netUpper] || "01";
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const callback = encodeURIComponent(params.callbackUrl || config.webhookUrl || config.callbackUrl || "");
    const base = this.baseUrl(config);

    const url = `${base}/DataBundleAPI.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&MobileNetwork=${networkCode}&DataPlan=${encodeURIComponent(params.planCode)}&MobileNumber=${phone}&RequestID=${encodeURIComponent(params.reference)}&CallBackURL=${callback}`;

    const res = await this.fetchClubkonnect(url, 15000);
    const raw = res.data;
    const isSuccess = this.isSuccessResponse(raw);
    const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
    const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Data Bundle Purchase Successful" : "Data purchase failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: raw,
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

    const cableUpper = (params.cableProvider || "DSTV").toUpperCase().trim();
    const cableCode = ClubkonnectAdapter.CABLE_CODES[cableUpper] || "01";
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const callback = encodeURIComponent(params.callbackUrl || config.webhookUrl || config.callbackUrl || "");
    const base = this.baseUrl(config);

    const url = `${base}/CableTV.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&Package=${encodeURIComponent(params.packageCode)}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}&CallBackURL=${callback}`;

    const res = await this.fetchClubkonnect(url, 15000);
    const raw = res.data;
    const isSuccess = this.isSuccessResponse(raw);
    const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
    const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Cable TV Subscription Successful" : "Cable TV payment failed");

    return {
      success: isSuccess,
      reference: params.reference,
      orderId: String(orderId),
      message: msg,
      rawResponse: raw,
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

    const cableUpper = (params.cableProvider || "DSTV").toUpperCase().trim();
    const cableCode = ClubkonnectAdapter.CABLE_CODES[cableUpper] || "01";
    const base = this.baseUrl(config);

    const url = `${base}/CableTVVerification.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&CableTV=${cableCode}&SmartCardNo=${encodeURIComponent(params.smartCardNo)}`;

    const res = await this.fetchClubkonnect(url, 10000);
    const raw = res.data;
    const name = raw.customer_name || raw.customerName || raw.Customer_Name || raw.name;

    if (name && String(name).trim().length > 1 && !String(name).toLowerCase().includes("invalid")) {
      return {
        valid: true,
        customerName: String(name).trim(),
        currentPlan: raw.current_package || raw.package || `${cableUpper} ACTIVE SUBSCRIPTION`,
        rawResponse: raw,
      };
    }

    return {
      valid: false,
      error: raw.msg || raw.message || raw.remark || "Invalid SmartCard / IUC Number",
      rawResponse: raw,
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

    const discoUpper = (params.electricCompany || "IKEDC").toUpperCase().trim();
    const discoCode = ClubkonnectAdapter.ELECTRICITY_DISCOS[discoUpper] || "01";
    const meterTypeCode = (params.meterType || "PREPAID").toUpperCase().includes("POST") ? "02" : "01";
    const phone = normalizeNigerianPhone(params.phoneNumber);
    const callback = encodeURIComponent(params.callbackUrl || config.webhookUrl || config.callbackUrl || "");
    const base = this.baseUrl(config);

    const url = `${base}/Electricity.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}&Amount=${params.amount}&PhoneNo=${phone}&RequestID=${encodeURIComponent(params.reference)}&CallBackURL=${callback}`;

    const res = await this.fetchClubkonnect(url, 15000);
    const raw = res.data;
    const isSuccess = this.isSuccessResponse(raw);
    const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
    const token = raw.token || raw.meter_token || raw.token_code;
    const units = raw.units || raw.kwh || raw.unit;
    const msg = raw.msg || raw.message || raw.remark || raw.description || (isSuccess ? "Electricity Payment Successful" : "Electricity payment failed");

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

    const discoUpper = (params.electricCompany || "IKEDC").toUpperCase().trim();
    const discoCode = ClubkonnectAdapter.ELECTRICITY_DISCOS[discoUpper] || "01";
    const meterTypeCode = (params.meterType || "PREPAID").toUpperCase().includes("POST") ? "02" : "01";
    const base = this.baseUrl(config);

    const url = `${base}/ElectricityVerification.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ElectricCompany=${discoCode}&MeterType=${meterTypeCode}&MeterNo=${encodeURIComponent(params.meterNo)}`;

    const res = await this.fetchClubkonnect(url, 10000);
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

    return {
      valid: false,
      error: raw.msg || raw.message || raw.remark || "Invalid Meter Number or Disco Selection",
      rawResponse: raw,
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

    const examUpper = (params.examType || "WAEC").toUpperCase().trim();
    const examCode = ClubkonnectAdapter.EXAM_CODES[examUpper] || "01";
    const qty = Math.max(1, params.quantity || 1);
    const base = this.baseUrl(config);

    const url = `${base}/E-Pin.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&ExamType=${examCode}&Quantity=${qty}&RequestID=${encodeURIComponent(params.reference)}`;

    const res = await this.fetchClubkonnect(url, 15000);
    const raw = res.data;
    const isSuccess = this.isSuccessResponse(raw);
    const orderId = raw.orderid || raw.orderId || raw.order_id || raw.requestid || params.reference;
    const pins = raw.pins || (raw.pin ? [{ pin: raw.pin, serial: raw.serial || "" }] : undefined);
    const msg = raw.msg || raw.message || raw.remark || (isSuccess ? "Exam PINs generated successfully" : "Exam PIN purchase failed");

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

    const url = `${base}/Query.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}&${queryParam}`;

    const res = await this.fetchClubkonnect(url, 10000);
    const raw = res.data;
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
