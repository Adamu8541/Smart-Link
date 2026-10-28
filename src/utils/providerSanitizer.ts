/**
 * SmartLink NG — Provider & Technical Plumbing Sanitizer
 * Ensures no third-party vendor names (Clubkonnect, Bigisub, Aspfiy, VTpass, Prembley, etc.)
 * or internal upstream error messages are ever exposed to end-users across receipts,
 * successful modals, failed messages, history tables, and exports.
 */

// 1. KNOWN PROVIDER & VENDOR REGEX PATTERNS
const PROVIDER_PATTERNS = [
  /clubkonnect(_vtu)?/gi,
  /bigisub(_vtu)?(\.ng)?/gi,
  /aspfiy/gi,
  /vtpass(\.com)?/gi,
  /subandgain/gi,
  /shago/gi,
  /monnify/gi,
  /paystack/gi,
  /flutterwave/gi,
  /vpay/gi,
  /prembley/gi,
  /prembly/gi,
  /verifyng/gi,
  /identro/gi,
  /lumiid/gi,
  /baxi/gi,
  /interswitch/gi,
  /prov_[a-z0-9_-]+/gi,
];

/**
 * Sanitizes service descriptions and labels into standardized, professional customer terminology.
 * e.g., converts internal vendor tags into clean labels: Airtime, Data, NIN, BVN, CAC, TIN, etc.
 */
export function sanitizeUserDescription(text: string | null | undefined): string {
  if (!text) return "Service Transaction";

  let str = String(text);

  // Strip raw provider references and keywords
  PROVIDER_PATTERNS.forEach((p) => {
    str = str.replace(p, "SmartLink Network");
  });

  str = str.replace(/via\s+smartlink\s+network/gi, "");
  str = str.replace(/via\s+[a-z0-9_.-]+/gi, "");
  str = str.replace(/provider:\s*[a-z0-9_.-]+/gi, "");
  str = str.replace(/portal:\s*[a-z0-9_.-]+/gi, "");
  str = str.replace(/\(ref:\s*(asp|ck|bigi|vtp|prv)-[^)]+\)/gi, "");
  str = str.replace(/\[retail:[^\]]+\]/gi, "");

  const lower = str.toLowerCase();

  // Standardized categories
  if (lower.includes("nin") || lower.includes("national identity") || lower.includes("nimc")) {
    return "NIN Verification";
  }
  if (lower.includes("bvn") || lower.includes("bank verification")) {
    return "BVN Verification";
  }
  if (lower.includes("cac") || lower.includes("corporate affairs")) {
    return "CAC Business Registration";
  }
  if (lower.includes("tin") || lower.includes("tax id") || lower.includes("nrs") || lower.includes("firs")) {
    return "TIN Tax Search";
  }
  if (lower.includes("bank") && (lower.includes("enquiry") || lower.includes("account") || lower.includes("nip"))) {
    return "Bank Account Verification";
  }
  if (lower.includes("airtime")) {
    if (lower.includes("mtn")) return "MTN Airtime Topup";
    if (lower.includes("airtel")) return "Airtel Airtime Topup";
    if (lower.includes("glo")) return "Glo Airtime Topup";
    if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile Airtime Topup";
    return "Airtime Topup";
  }
  if (lower.includes("data") || lower.includes("bundle") || lower.includes("sme") || lower.includes("giga")) {
    if (lower.includes("mtn")) return "MTN Data Subscription";
    if (lower.includes("airtel")) return "Airtel Data Subscription";
    if (lower.includes("glo")) return "Glo Data Subscription";
    if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile Data Subscription";
    return "Data Subscription";
  }
  if (lower.includes("electricity") || lower.includes("meter") || lower.includes("disco") || lower.includes("token")) {
    return "Electricity Token Recharge";
  }
  if (lower.includes("cable") || lower.includes("dstv") || lower.includes("gotv") || lower.includes("startimes") || lower.includes("showmax")) {
    return "Cable TV Subscription";
  }
  if (lower.includes("deposit") || lower.includes("wallet funding") || lower.includes("fund") || lower.includes("bank transfer")) {
    return "Wallet Funding";
  }
  if (lower.includes("login") || lower.includes("sign in")) {
    return lower.includes("failed") ? "Failed Login Attempt" : "Account Login Successful";
  }
  if (lower.includes("password") && (lower.includes("reset") || lower.includes("change") || lower.includes("forgot"))) {
    return "Password Credentials Update";
  }
  if (lower.includes("refund")) {
    return "Wallet Balance Refund";
  }

  // Clean trailing punctuation and whitespace
  return str.replace(/\s{2,}/g, " ").trim() || "Service Transaction";
}

/**
 * Sanitizes provider names to prevent leakage of third-party supplier identities.
 */
export function sanitizeProviderDisplay(providerName?: string | null, serviceCategory?: string): string {
  if (!providerName) {
    return getFallbackNetwork(serviceCategory);
  }

  let lower = String(providerName).toLowerCase();

  // If matches any known provider or internal prefix, map cleanly based on service context
  for (const pattern of PROVIDER_PATTERNS) {
    if (pattern.test(lower)) {
      return getFallbackNetwork(serviceCategory);
    }
  }

  if (lower.includes("portal") || lower.includes("prov") || lower.includes("gateway")) {
    return getFallbackNetwork(serviceCategory);
  }

  // Preserve carrier names if it's already a telco (MTN, Airtel, Glo, 9mobile)
  if (lower.includes("mtn")) return "MTN Telecom Network";
  if (lower.includes("airtel")) return "Airtel Telecom Network";
  if (lower.includes("glo")) return "Glo Telecom Network";
  if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile Telecom Network";

  return getFallbackNetwork(serviceCategory);
}

function getFallbackNetwork(category?: string): string {
  const cat = (category || "").toUpperCase();
  if (cat.includes("AIRTIME") || cat.includes("DATA") || cat.includes("VTU")) {
    return "SmartLink Telecom Network";
  }
  if (cat.includes("ELECTRIC") || cat.includes("POWER") || cat.includes("CABLE") || cat.includes("TV") || cat.includes("BILL")) {
    return "SmartLink Utility Network";
  }
  if (cat.includes("NIN") || cat.includes("BVN") || cat.includes("CAC") || cat.includes("TIN") || cat.includes("VERIF")) {
    return "National Identity Clearinghouse";
  }
  if (cat.includes("WALLET") || cat.includes("PAYMENT") || cat.includes("FUND")) {
    return "SmartLink Direct Bank Rails";
  }
  return "SmartLink Core Network";
}

/**
 * Sanitizes external references so provider-specific prefixes are not visible.
 */
export function sanitizeReference(ref?: string | null): string {
  if (!ref) return "SL-NET-VERIFIED";

  let str = String(ref).trim();

  // Replace provider prefixes with standard SmartLink prefix
  str = str.replace(/^(ASP|CK|BIGI|VTP|PREM|MON|PAY|FLW|VPAY|PROV)[-_]/i, "SL-NET-");
  str = str.replace(/^PROV-ACK$/i, "SL-NET-CONFIRMED");
  str = str.replace(/^PROV-PENDING$/i, "SL-PENDING");

  PROVIDER_PATTERNS.forEach((p) => {
    str = str.replace(p, "SL");
  });

  return str || "SL-NET-VERIFIED";
}

/**
 * Sanitizes error messages to hide third-party API details, keys, or provider low balances.
 */
export function sanitizeErrorMessage(errorMsg?: string | null): string {
  if (!errorMsg) {
    return "The transaction could not be processed at this time. Your wallet balance has not been debited. Please try again shortly.";
  }

  const raw = String(errorMsg);
  const lower = raw.toLowerCase();

  // 1. Balance/Merchant Errors
  if (
    lower.includes("low balance") ||
    lower.includes("insufficient balance") ||
    lower.includes("zero balance") ||
    lower.includes("merchant keys") ||
    lower.includes("wallet error") ||
    lower.includes("wallet balance")
  ) {
    if (lower.includes("user") || lower.includes("available balance") || lower.includes("wallet balance. amount required")) {
      return raw; // Preserve legitimate user wallet balance alerts
    }
    return "The service gateway is temporarily undergoing routine liquidity maintenance. Your wallet was not charged. Please try again shortly.";
  }

  // 2. Provider API / Token / Connection Failures
  if (
    PROVIDER_PATTERNS.some((p) => p.test(lower)) ||
    lower.includes("upstream") ||
    lower.includes("provider") ||
    lower.includes("api key") ||
    lower.includes("handshake") ||
    lower.includes("endpoint") ||
    lower.includes("502 bad gateway") ||
    lower.includes("gateway timeout") ||
    lower.includes("connection reset")
  ) {
    return "The service network is temporarily experiencing high congestion. Your wallet was refunded. Please try again in a few moments.";
  }

  // 3. User Input / Parameter Errors (keep clear and helpful)
  if (
    lower.includes("invalid phone") ||
    lower.includes("11 digits") ||
    lower.includes("invalid meter") ||
    lower.includes("smartcard") ||
    lower.includes("meter number")
  ) {
    return raw;
  }

  // Clean any remaining leaked provider names
  let sanitized = raw;
  PROVIDER_PATTERNS.forEach((p) => {
    sanitized = sanitized.replace(p, "service network");
  });

  return sanitized;
}

/**
 * Sanitizes payment channel / portal names.
 */
export function sanitizePaymentMethod(method?: string | null): string {
  if (!method) return "Automated Bank Transfer";

  let str = String(method);
  PROVIDER_PATTERNS.forEach((p) => {
    str = str.replace(p, "Direct");
  });

  const lower = str.toLowerCase();
  if (lower.includes("aspfiy") || lower.includes("virtual") || lower.includes("dynamic")) {
    return "Automated Bank Transfer";
  }
  if (lower.includes("portal") || lower.includes("gateway")) {
    return "SmartLink Direct Bank Rails";
  }

  return str.trim() || "Automated Bank Transfer";
}

export function sanitizeServiceLabel(service?: string | null): string {
  if (!service) return "Service";
  const s = String(service).toUpperCase();
  if (s.includes("AIRTIME")) return "Airtime";
  if (s.includes("DATA")) return "Data";
  if (s.includes("NIN")) return "NIN";
  if (s.includes("BVN")) return "BVN";
  if (s.includes("CAC")) return "CAC";
  if (s.includes("TIN")) return "TIN";
  if (s.includes("ELECTRIC") || s.includes("POWER")) return "Electricity";
  if (s.includes("CABLE") || s.includes("TV")) return "Cable TV";
  if (s.includes("WALLET") || s.includes("FUND")) return "Wallet Funding";
  if (s.includes("TRANSFER") || s.includes("BANK")) return "Bank Transfer";
  return sanitizeUserDescription(service);
}
