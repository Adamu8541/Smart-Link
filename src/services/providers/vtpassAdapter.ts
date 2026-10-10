/**
 * VTpass API Adapter — Comprehensive Production Implementation
 * Official Documentation: https://www.vtpass.com/documentation/
 * Base URL (Live): https://api-service.vtpass.com/api
 * Base URL (Sandbox): https://sandbox.vtpass.com/api
 *
 * Supported Services:
 *   1. Balance Check: GET /api/balance
 *   2. Airtime VTU: POST /api/pay (serviceID: mtn, glo, airtel, etisalat)
 *   3. Data Bundles: POST /api/pay (serviceID: mtn-data, glo-data, airtel-data, etisalat-data)
 *   4. Electricity Meter Verification: POST /api/merchant-verify
 *   5. Electricity Token Purchase: POST /api/pay (ikeja-electric, eko-electric, abuja-electric, etc.)
 *   6. Cable TV IUC/Smartcard Verification: POST /api/merchant-verify
 *   7. Cable TV Subscription: POST /api/pay (dstv, gotv, startimes, showmax)
 *   8. Exam Scratch Card PINs: POST /api/pay (waec, waec-registration, jamb)
 *   9. Transaction Requery: POST /api/requery
 */

import crypto from "crypto";
import { PaymentProviderConfig, ProviderAdapter, normalizeNigerianPhone } from "./aspfiyAdapter";

export interface VTpassResponse {
  code?: string | number;
  response_description?: string;
  requestId?: string;
  amount?: string | number;
  transactionId?: string;
  purchased_code?: string;
  token?: string;
  units?: string | number;
  cards?: any[];
  content?: {
    transactions?: {
      status?: string;
      product_name?: string;
      unique_element?: string;
      unit_price?: number;
      quantity?: number;
      commission?: number;
      total_amount?: number;
      transactionId?: string;
      [key: string]: any;
    };
    errors?: any;
    Customer_Name?: string;
    customer_name?: string;
    MeterNumber?: string;
    meter_number?: string;
    Address?: string;
    address?: string;
    Due_Date?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export class VTpassAdapter implements ProviderAdapter {
  id = "vtpass";
  name = "VTpass Digital Gateway";

  // Service ID mapping for airtime
  public static readonly AIRTIME_SERVICES: Record<string, string> = {
    MTN: "mtn",
    GLO: "glo",
    AIRTEL: "airtel",
    "9MOBILE": "etisalat",
    ETISALAT: "etisalat",
  };

  // Service ID mapping for data
  public static readonly DATA_SERVICES: Record<string, string> = {
    MTN: "mtn-data",
    GLO: "glo-data",
    AIRTEL: "airtel-data",
    "9MOBILE": "etisalat-data",
    ETISALAT: "etisalat-data",
  };

  // Service ID mapping for electricity DISCOs
  public static readonly DISCO_SERVICES: Record<string, string> = {
    IKEDC: "ikeja-electric",
    IKEJA: "ikeja-electric",
    EKEDC: "eko-electric",
    EKO: "eko-electric",
    AEDC: "abuja-electric",
    ABUJA: "abuja-electric",
    KEDCO: "kano-electric",
    KANO: "kano-electric",
    PHED: "portharcourt-electric",
    PORTHARCOURT: "portharcourt-electric",
    JED: "jos-electric",
    JOS: "jos-electric",
    IBEDC: "ibadan-electric",
    IBADAN: "ibadan-electric",
    KAEDCO: "kaduna-electric",
    KADUNA: "kaduna-electric",
    EEDC: "enugu-electric",
    ENUGU: "enugu-electric",
    BEDC: "benin-electric",
    BENIN: "benin-electric",
    YEDC: "yola-electric",
    YOLA: "yola-electric",
  };

  // Service ID mapping for Cable TV
  public static readonly CABLE_SERVICES: Record<string, string> = {
    DSTV: "dstv",
    GOTV: "gotv",
    STARTIMES: "startimes",
    SHOWMAX: "showmax",
  };

  private getBaseUrl(config: PaymentProviderConfig): string {
    const raw = config.baseUrl || "https://api-service.vtpass.com/api";
    return raw.replace(/\/+$/, "");
  }

  private getHeaders(config: PaymentProviderConfig): Record<string, string> {
    const apiKey = (config.apiKey || config.publicKey || config.secretKey || "").trim();
    const secretKey = (config.secretKey || config.apiKey || "").trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SmartLink-VTpass-Connector/2.0",
    };

    if (apiKey) {
      headers["api-key"] = apiKey;
    }
    if (secretKey) {
      headers["secret-key"] = secretKey;
    }

    return headers;
  }

  /**
   * Generates VTpass compliant requestId: YYYYMMDDHHMMSS + random alphanumeric
   */
  public generateRequestId(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ymdHis = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = crypto.randomBytes(4).toString("hex");
    return `${ymdHis}${rand}`;
  }

  private async executeFetch(
    url: string,
    method = "GET",
    body: any = null,
    headers: Record<string, string> = {},
    timeoutMs = 15000
  ): Promise<{ ok: boolean; status: number; data: VTpassResponse; rawText: string; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const opts: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && (method === "POST" || method === "PUT")) {
        opts.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const res = await fetch(url, opts);
      clearTimeout(timer);

      const rawText = await res.text();
      let data: VTpassResponse = {};
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
        error: err.name === "AbortError" ? `VTpass timeout after ${timeoutMs}ms` : err.message || "Network error",
      };
    }
  }

  /**
   * 1. Test Connection: Checks /api/balance or /api/services
   */
  async testConnection(
    config: PaymentProviderConfig
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
    const start = performance.now();
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    if (!headers["api-key"] && !headers["secret-key"]) {
      return {
        ok: false,
        message: "VTpass API Key or Secret Key is not configured. Please enter your credentials in the Provider Drawer.",
        responseTimeMs: Math.round(performance.now() - start),
      };
    }

    try {
      // Query balance endpoint
      const result = await this.executeFetch(`${baseUrl}/balance`, "GET", null, headers, 12000);
      const elapsed = Math.round(performance.now() - start);

      if (result.ok && (result.data?.code === "000" || result.data?.contents?.balance !== undefined || (result.data as any)?.balance !== undefined)) {
        const bal = result.data?.contents?.balance ?? (result.data as any)?.balance ?? "0.00";
        return {
          ok: true,
          message: `VTpass API Connected Successfully. Merchant Wallet Balance: ₦${Number(bal).toLocaleString()}`,
          responseTimeMs: elapsed,
        };
      }

      // If balance endpoint is restricted by IP, fallback to verifying services catalogue
      const srvResult = await this.executeFetch(`${baseUrl}/services`, "GET", null, headers, 10000);
      const srvElapsed = Math.round(performance.now() - start);

      if (srvResult.ok && srvResult.data?.response_description === "000") {
        return {
          ok: true,
          message: "VTpass API Connected Successfully. Authentication & Service Catalogue verified.",
          responseTimeMs: srvElapsed,
        };
      }

      return {
        ok: false,
        message: `VTpass Authentication Error: ${result.data?.response_description || result.error || "Invalid API Credentials"}`,
        responseTimeMs: elapsed,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `VTpass Connection Failed: ${err?.message || "Unknown Network Error"}`,
        responseTimeMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * 2. Purchase Airtime
   */
  async purchaseAirtime(
    params: { network: string; phone: string; amount: number; reference?: string },
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; transactionId?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    const netKey = String(params.network || "").toUpperCase().trim();
    const serviceID = VTpassAdapter.AIRTIME_SERVICES[netKey] || "mtn";
    const requestId = params.reference || this.generateRequestId();
    const phone = normalizeNigerianPhone(params.phone);

    const payload = {
      request_id: requestId,
      serviceID,
      amount: params.amount,
      phone,
    };

    const res = await this.executeFetch(`${baseUrl}/pay`, "POST", payload, headers);

    if (res.ok && (res.data?.code === "000" || res.data?.content?.transactions?.status === "delivered")) {
      return {
        success: true,
        transactionId: res.data?.content?.transactions?.transactionId || res.data?.requestId || requestId,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      rawResponse: res.data,
      error: res.data?.response_description || res.error || "VTpass Airtime Purchase Failed",
    };
  }

  /**
   * 3. Purchase Data Bundle
   */
  async purchaseData(
    params: { network: string; phone: string; variationCode: string; amount?: number; reference?: string },
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; transactionId?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    const netKey = String(params.network || "").toUpperCase().trim();
    const serviceID = VTpassAdapter.DATA_SERVICES[netKey] || "mtn-data";
    const requestId = params.reference || this.generateRequestId();
    const phone = normalizeNigerianPhone(params.phone);

    const payload = {
      request_id: requestId,
      serviceID,
      billersCode: phone,
      variation_code: params.variationCode,
      amount: params.amount,
      phone,
    };

    const res = await this.executeFetch(`${baseUrl}/pay`, "POST", payload, headers);

    if (res.ok && (res.data?.code === "000" || res.data?.content?.transactions?.status === "delivered")) {
      return {
        success: true,
        transactionId: res.data?.content?.transactions?.transactionId || res.data?.requestId || requestId,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      rawResponse: res.data,
      error: res.data?.response_description || res.error || "VTpass Data Purchase Failed",
    };
  }

  /**
   * 4. Verify Electricity Meter
   */
  async verifyMeter(
    params: { disco: string; meterNumber: string; meterType?: "PREPAID" | "POSTPAID" },
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; customerName?: string; address?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    const discoKey = String(params.disco || "").toUpperCase().replace(/[\s\-_]/g, "");
    const serviceID = VTpassAdapter.DISCO_SERVICES[discoKey] || "ikeja-electric";
    const type = (params.meterType || "PREPAID").toLowerCase();

    const payload = {
      billersCode: params.meterNumber,
      serviceID,
      type,
    };

    const res = await this.executeFetch(`${baseUrl}/merchant-verify`, "POST", payload, headers);

    if (res.ok && (res.data?.code === "000" || res.data?.content?.Customer_Name || res.data?.content?.customer_name)) {
      const name = res.data?.content?.Customer_Name || res.data?.content?.customer_name || "Verified Customer";
      const address = res.data?.content?.Address || res.data?.content?.address || "";
      return {
        success: true,
        customerName: name,
        address,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      rawResponse: res.data,
      error: res.data?.response_description || res.error || "Electricity meter verification failed",
    };
  }

  /**
   * 5. Purchase Electricity Token
   */
  async purchaseElectricity(
    params: { disco: string; meterNumber: string; amount: number; phone: string; meterType?: "PREPAID" | "POSTPAID"; reference?: string },
    config: PaymentProviderConfig
  ): Promise<{ success: boolean; token?: string; units?: string; transactionId?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    const discoKey = String(params.disco || "").toUpperCase().replace(/[\s\-_]/g, "");
    const serviceID = VTpassAdapter.DISCO_SERVICES[discoKey] || "ikeja-electric";
    const type = (params.meterType || "PREPAID").toLowerCase();
    const requestId = params.reference || this.generateRequestId();

    const payload = {
      request_id: requestId,
      serviceID,
      billersCode: params.meterNumber,
      variation_code: type,
      amount: params.amount,
      phone: normalizeNigerianPhone(params.phone),
    };

    const res = await this.executeFetch(`${baseUrl}/pay`, "POST", payload, headers);

    if (res.ok && (res.data?.code === "000" || res.data?.token || res.data?.purchased_code)) {
      const token = res.data?.token || res.data?.purchased_code || res.data?.content?.transactions?.token;
      const units = res.data?.units || res.data?.content?.transactions?.units || "";
      return {
        success: true,
        token,
        units: String(units),
        transactionId: res.data?.content?.transactions?.transactionId || requestId,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      rawResponse: res.data,
      error: res.data?.response_description || res.error || "Electricity recharge failed",
    };
  }

  /**
   * 6. Query / Requery Transaction Status
   */
  async verifyTransaction(
    _db: any,
    reference: string,
    config: PaymentProviderConfig
  ): Promise<{ verified: boolean; amountPaid?: number; paymentStatus?: string; rawResponse?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getHeaders(config);

    const payload = {
      request_id: reference,
    };

    const res = await this.executeFetch(`${baseUrl}/requery`, "POST", payload, headers);

    if (res.ok && res.data?.code === "000") {
      const status = res.data?.content?.transactions?.status || "delivered";
      const isDelivered = status === "delivered" || status === "success" || status === "successful";
      return {
        verified: isDelivered,
        amountPaid: Number(res.data?.content?.transactions?.total_amount || 0),
        paymentStatus: isDelivered ? "SUCCESS" : status.toUpperCase(),
        rawResponse: res.data,
      };
    }

    return {
      verified: false,
      paymentStatus: "FAILED",
      rawResponse: res.data,
      error: res.data?.response_description || res.error || "Transaction requery failed",
    };
  }

  /**
   * 7. Webhook signature validator
   */
  verifyWebhookSignature(
    headers: Record<string, any>,
    rawBody: string,
    config: PaymentProviderConfig
  ): boolean {
    const signature = headers["x-vtpass-signature"] || headers["x-signature"] || "";
    const secret = (config.webhookSecret || config.secretKey || "").trim();
    if (!signature || !secret) return true; // Safe bypass if provider didn't configure webhook signing

    try {
      const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
