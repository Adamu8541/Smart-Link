/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BillCategory,
  BillCategoryType,
  BillPlan,
  BillProvider,
  BillPaymentRequest,
  BillPaymentResponse,
  CustomerValidationRequest,
  CustomerValidationResponse,
} from "../types/bills";

export class BillPaymentEngine {
  /**
   * Validate Nigerian Phone Number
   */
  public static validatePhoneNumber(phone: string): { valid: boolean; formatted?: string; error?: string } {
    const clean = phone.replace(/[\s\-()]/g, "");
    // Matches 070, 080, 081, 090, 091, +234, 234 followed by 8 digits
    const regex = /^(?:\+?234|0)[789][01]\d{8}$/;
    if (!regex.test(clean)) {
      return { valid: false, error: "Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678)." };
    }
    let formatted = clean;
    if (formatted.startsWith("234")) formatted = "0" + formatted.substring(3);
    if (formatted.startsWith("+234")) formatted = "0" + formatted.substring(4);
    return { valid: true, formatted };
  }

  /**
   * Fetch Bill Categories catalog
   */
  public static async getCategories(): Promise<BillCategory[]> {
    try {
      const res = await fetch("/api/bills/categories");
      const data = await res.json();
      if (res.ok && data.categories) {
        return data.categories;
      }
    } catch (err) {
      console.error("Error fetching bill categories:", err);
    }
    return this.getDefaultCategories();
  }

  /**
   * Fetch Providers for Category
   */
  public static async getProviders(category: BillCategoryType): Promise<BillProvider[]> {
    try {
      const res = await fetch(`/api/bills/providers?category=${category}`);
      const data = await res.json();
      if (res.ok && data.providers) {
        return data.providers;
      }
    } catch (err) {
      console.error(`Error fetching providers for ${category}:`, err);
    }
    return this.getDefaultProviders(category);
  }

  /**
   * Fetch Plans for Data / Cable / Education / Internet
   */
  public static async getPlans(providerCode: string, category: BillCategoryType): Promise<BillPlan[]> {
    try {
      const res = await fetch(`/api/bills/plans?provider=${providerCode}&category=${category}`);
      const data = await res.json();
      if (res.ok && data.plans) {
        return data.plans;
      }
    } catch (err) {
      console.error(`Error fetching plans for ${providerCode}:`, err);
    }
    return [];
  }

  /**
   * Validate Customer Details (Meter lookup, IUC lookup, Student lookup)
   */
  public static async validateCustomer(req: CustomerValidationRequest): Promise<CustomerValidationResponse> {
    try {
      const res = await fetch("/api/bills/validate-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          valid: false,
          errorMessage: data.error || "Customer validation failed. Please check the account number.",
        };
      }
      return data;
    } catch (err: any) {
      return {
        valid: false,
        errorMessage: err.message || "Network error during customer verification.",
      };
    }
  }

  /**
   * Execute Bill Payment Transaction
   */
  public static async executePayment(req: BillPaymentRequest): Promise<BillPaymentResponse> {
    try {
      const res = await fetch("/api/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          transactionId: data.transactionId || `TXN-FAIL-${Date.now()}`,
          smartlinkReference: data.smartlinkReference || `SL-FAIL-${Date.now()}`,
          providerReference: "",
          receiptId: "",
          serviceName: req.category,
          category: req.category,
          providerName: req.providerName,
          customerId: req.customerId,
          amountPaid: req.amount,
          charge: req.charge || 0,
          totalDeducted: req.amount + (req.charge || 0),
          status: "FAILED",
          balanceBefore: data.balanceBefore || 0,
          balanceAfter: data.balanceAfter || 0,
          timestamp: new Date().toISOString(),
          errorMessage: data.error || "Bill payment failed to execute.",
          errorCode: data.errorCode || "PAYMENT_FAILED",
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        transactionId: `TXN-ERR-${Date.now()}`,
        smartlinkReference: `SL-ERR-${Date.now()}`,
        providerReference: "",
        receiptId: "",
        serviceName: req.category,
        category: req.category,
        providerName: req.providerName,
        customerId: req.customerId,
        amountPaid: req.amount,
        charge: req.charge || 0,
        totalDeducted: req.amount + (req.charge || 0),
        status: "FAILED",
        balanceBefore: 0,
        balanceAfter: 0,
        timestamp: new Date().toISOString(),
        errorMessage: err.message || "Network error connecting to payment gateway.",
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  /**
   * Fallback default categories
   */
  private static getDefaultCategories(): BillCategory[] {
    return [
      {
        id: "AIRTIME",
        name: "Airtime Top-Up",
        description: "Instant Virtual Top-Up (VTU) for MTN, Glo, Airtel & 9mobile.",
        icon: "Smartphone",
        estimatedProcessingTime: "Instant (~1.2s)",
        providerStatus: "ONLINE",
        requiresValidation: false,
        fields: [],
      },
      {
        id: "DATA",
        name: "Data Bundles",
        description: "SME, Corporate Gifting & Direct Data bundles with max validity.",
        icon: "Wifi",
        estimatedProcessingTime: "Instant (~1.5s)",
        providerStatus: "ONLINE",
        requiresValidation: false,
        fields: [],
      },
      {
        id: "ELECTRICITY",
        name: "Electricity Bill & Tokens",
        description: "Pay Prepaid & Postpaid electricity bills for all DISCOs with instant tokens.",
        icon: "Zap",
        estimatedProcessingTime: "Instant (~2.0s)",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "CABLE_TV",
        name: "Cable TV Subscription",
        description: "Recharge DStv, GOtv, Startimes & Showmax with customer lookup.",
        icon: "Tv",
        estimatedProcessingTime: "Instant (~1.8s)",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "INTERNET",
        name: "Internet Services",
        description: "Smile, Spectranet, Swift & Broadband Fiber monthly subscriptions.",
        icon: "Globe",
        estimatedProcessingTime: "Instant (~2.5s)",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "EDUCATION",
        name: "Education & Exams",
        description: "WAEC Result Checker PINs, NECO Tokens, JAMB ePINS & NABTEB.",
        icon: "GraduationCap",
        estimatedProcessingTime: "Instant (~1.0s)",
        providerStatus: "ONLINE",
        requiresValidation: false,
        fields: [],
      },
      {
        id: "BETTING",
        name: "Betting Wallet Funding",
        description: "Instant deposit to SportyBet, Bet9ja, 1xBet & MSport accounts.",
        icon: "Dices",
        estimatedProcessingTime: "Instant (~1.5s)",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "INSURANCE",
        name: "Insurance Premiums",
        description: "Third-party motor insurance, health policy & life cover payments.",
        icon: "Shield",
        estimatedProcessingTime: "< 5 Minutes",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "WATER",
        name: "Water Utility Bills",
        description: "Lagos Water Corporation, Abuja Water Board & state water authorities.",
        icon: "Droplets",
        estimatedProcessingTime: "< 5 Minutes",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "WASTE",
        name: "Waste Management (LAWMA)",
        description: "LAWMA & PSP residential or commercial waste billing settlement.",
        icon: "Trash2",
        estimatedProcessingTime: "< 5 Minutes",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "GOVERNMENT",
        name: "Government Levies & Taxes",
        description: "LIRS Tax, FIRS Tax, Land Use Charge & vehicle registration fees.",
        icon: "Landmark",
        estimatedProcessingTime: "< 10 Minutes",
        providerStatus: "ONLINE",
        requiresValidation: true,
        fields: [],
      },
      {
        id: "FUTURE_SERVICES",
        name: "Custom / Future Services",
        description: "Extensible provider gateway for custom vendor bill collections.",
        icon: "Sparkles",
        estimatedProcessingTime: "Variable",
        providerStatus: "ONLINE",
        requiresValidation: false,
        fields: [],
      },
    ];
  }

  private static getDefaultProviders(category: BillCategoryType): BillProvider[] {
    switch (category) {
      case "AIRTIME":
      case "DATA":
        return [
          { id: "mtn", code: "MTN", name: "MTN Nigeria", category, status: "ACTIVE" },
          { id: "glo", code: "GLO", name: "Glo Nigeria", category, status: "ACTIVE" },
          { id: "airtel", code: "AIRTEL", name: "Airtel Nigeria", category, status: "ACTIVE" },
          { id: "9mobile", code: "9MOBILE", name: "9mobile Nigeria", category, status: "ACTIVE" },
        ];
      case "ELECTRICITY":
        return [
          { id: "ikedc", code: "IKEDC", name: "Ikeja Electric (IKEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "ekedc", code: "EKEDC", name: "Eko Electricity (EKEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "aedc", code: "AEDC", name: "Abuja Electricity (AEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "ibedc", code: "IBEDC", name: "Ibadan Electricity (IBEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "kedco", code: "KEDCO", name: "Kano Electricity (KEDCO)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "eedc", code: "EEDC", name: "Enugu Electricity (EEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
          { id: "phed", code: "PHED", name: "Port Harcourt Electricity (PHED)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        ];
      case "CABLE_TV":
        return [
          { id: "dstv", code: "DSTV", name: "DStv Nigeria", category, status: "ACTIVE" },
          { id: "gotv", code: "GOTV", name: "GOtv Nigeria", category, status: "ACTIVE" },
          { id: "startimes", code: "STARTIMES", name: "Startimes Nigeria", category, status: "ACTIVE" },
          { id: "showmax", code: "SHOWMAX", name: "Showmax", category, status: "ACTIVE" },
        ];
      case "BETTING":
        return [
          { id: "sportybet", code: "SPORTYBET", name: "SportyBet Nigeria", category, status: "ACTIVE" },
          { id: "bet9ja", code: "BET9JA", name: "Bet9ja", category, status: "ACTIVE" },
          { id: "1xbet", code: "1XBET", name: "1xBet", category, status: "ACTIVE" },
          { id: "msport", code: "MSPORT", name: "MSport", category, status: "ACTIVE" },
          { id: "bangbet", code: "BANGBET", name: "BangBet", category, status: "ACTIVE" },
        ];
      case "EDUCATION":
        return [
          { id: "waec", code: "WAEC", name: "WAEC Result Checker PIN", category, status: "ACTIVE" },
          { id: "neco", code: "NECO", name: "NECO Result Token", category, status: "ACTIVE" },
          { id: "jamb", code: "JAMB", name: "JAMB UTME / DE ePINS", category, status: "ACTIVE" },
          { id: "nabteb", code: "NABTEB", name: "NABTEB Result Scratch Card", category, status: "ACTIVE" },
        ];
      case "INTERNET":
        return [
          { id: "smile", code: "SMILE", name: "Smile Telecoms", category, status: "ACTIVE" },
          { id: "spectranet", code: "SPECTRANET", name: "Spectranet 4G LTE", category, status: "ACTIVE" },
          { id: "swift", code: "SWIFT", name: "Swift Networks", category, status: "ACTIVE" },
        ];
      default:
        return [
          { id: "generic", code: "GENERIC_PROVIDER", name: "SmartLink Unified Payment Gateway", category, status: "ACTIVE" },
        ];
    }
  }
}
