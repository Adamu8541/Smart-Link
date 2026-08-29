import { readDB, writeDB } from "../db";
import { getAdminFirestore } from "../../src/services/firebaseAdmin";
import { adminAuthService } from "../../src/services/adminAuthService";
import { getActiveProviderAndAdapter } from "../../src/services/providerGateway";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";

export const DEFAULT_SERVICES_CATALOG = [
  {
    id: "svc_nin_verify",
    code: "NIN_VERIFY",
    name: "NIN Verification",
    category: "IDENTITY_VERIFICATION",
    description: "Instant National Identification Number lookup and validation against NIMC database.",
    provider: "NIMC / Prembly API",
    costPrice: 100,
    sellingFee: 150,
    serviceCharge: 50,
    commissionRate: 10.0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "svc_bvn_verify",
    code: "BVN_VERIFY",
    name: "BVN Validation",
    category: "IDENTITY_VERIFICATION",
    description: "Central Bank of Nigeria Bank Verification Number identity confirmation.",
    provider: "NIBSS / IdentityPass",
    costPrice: 100,
    sellingFee: 150,
    serviceCharge: 50,
    commissionRate: 10.0,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "svc_cac_reg",
    code: "CAC_REGISTRATION",
    name: "CAC Business Name Registration",
    category: "BUSINESS_REGISTRATION",
    description: "Corporate Affairs Commission certified company and enterprise incorporation.",
    provider: "Corporate Affairs Commission",
    costPrice: 15000,
    sellingFee: 19500,
    serviceCharge: 1500,
    commissionRate: 8.0,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "svc_airtime_vtu",
    code: "AIRTIME_VTU",
    name: "Airtime Recharge",
    category: "TELECOM_DATA",
    description: "Instant airtime top-up across MTN, Airtel, Glo, and 9mobile networks.",
    provider: "Aspfiy VTU API",
    costPrice: 97,
    sellingFee: 100,
    serviceCharge: 0,
    commissionRate: 3.0,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "svc_data_bundle",
    code: "DATA_BUNDLE",
    name: "SME & Corporate Data",
    category: "TELECOM_DATA",
    description: "High-speed internet data bundles with instant provisioning.",
    provider: "Aspfiy Data Gateway",
    costPrice: 240,
    sellingFee: 260,
    serviceCharge: 0,
    commissionRate: 7.7,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "svc_electricity_bill",
    code: "ELECTRICITY_BILL",
    name: "Electricity Bill Payment",
    category: "UTILITY_BILLS",
    description: "Prepaid token generation and postpaid bill settlement across all DisCos.",
    provider: "Baxi / BuyPower",
    costPrice: 1000,
    sellingFee: 1000,
    serviceCharge: 100,
    commissionRate: 2.0,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "svc_cable_tv",
    code: "CABLE_TV",
    name: "Cable TV Subscription",
    category: "UTILITY_BILLS",
    description: "Instant subscription renewal for DStv, GOtv, and StarTimes.",
    provider: "VTpass / Baxi",
    costPrice: 3500,
    sellingFee: 3500,
    serviceCharge: 100,
    commissionRate: 1.5,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "svc_tin_verify",
    code: "TIN_VERIFICATION",
    name: "Tax Identification Number (JTB / FIRS)",
    category: "IDENTITY_VERIFICATION",
    description: "Verify Corporate & Individual Tax Identification Numbers directly with JTB.",
    provider: "Joint Tax Board API",
    costPrice: 250,
    sellingFee: 400,
    serviceCharge: 50,
    commissionRate: 15.0,
    isActive: true,
    sortOrder: 8,
  },
];

export function seedDefaultServicesCatalogIfEmpty(db: any) {
  if (!db.servicesCatalog || db.servicesCatalog.length === 0) {
    db.servicesCatalog = [...DEFAULT_SERVICES_CATALOG];
  }
}

export function seedDefaultUsersIfEmpty(db: any) {
  // No-op: users are stored in Firestore via usersStore
}

export function seedDefaultTransactionsIfEmpty(db: any) {
  if (!db.transactions) db.transactions = [];
}

export function recordAdminUserAction(
  db: any,
  params: {
    adminUid: string;
    adminEmail: string;
    targetUserId: string;
    action: string;
    details: string;
    ipAddress?: string;
    oldValues?: any;
    newValues?: any;
  }
) {
  if (!db.admin_user_actions) db.admin_user_actions = [];
  const record = {
    id: `ACT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    adminUid: params.adminUid,
    adminEmail: params.adminEmail,
    targetUserId: params.targetUserId,
    action: params.action,
    details: params.details,
    ipAddress: params.ipAddress || "127.0.0.1",
    oldValues: params.oldValues || null,
    newValues: params.newValues || null,
    timestamp: new Date().toISOString(),
  };
  db.admin_user_actions.unshift(record);

  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift({
    id: record.id,
    userId: params.adminUid,
    targetUserId: params.targetUserId,
    activityType: `ADMIN_${params.action}`,
    description: params.details,
    timestamp: record.timestamp,
  });

  return record;
}

export async function getOrCreateUserVirtualAccount(userId: string, userFallback?: any, amount?: number) {
  const db = readDB();
  if (!db.virtualAccounts) db.virtualAccounts = [];
  if (!db.walletAccounts) db.walletAccounts = [];

  // 1. Check in-memory / JSON database
  let existingAccount =
    (db.virtualAccounts || []).find(
      (acc: any) => acc && acc.userId === userId && (acc.accountNumber || acc.account_number)
    ) ||
    (db.walletAccounts || []).find(
      (acc: any) => acc && acc.userId === userId && (acc.accountNumber || acc.account_number)
    );

  if (existingAccount) {
    return {
      success: true,
      account: existingAccount,
      virtualAccount: existingAccount,
      provider: {
        name: existingAccount.providerName || existingAccount.bankName,
        id: existingAccount.providerId || existingAccount.provider,
      },
      isExisting: true,
    };
  }

  // 2. Check Firestore wallets collection
  try {
    const userWallet: any = await walletsStore.getWalletByUserId(userId);
    if (userWallet && (userWallet.virtualAccountNumber || userWallet.accountNumber)) {
      const accNum = userWallet.virtualAccountNumber || userWallet.accountNumber;
      existingAccount = {
        id: `va_${userWallet.provider || "aspfiy"}_${userId}`,
        userId,
        userEmail: userWallet.email || userFallback?.email || "",
        userName: userWallet.virtualAccountName || userFallback?.fullName || "",
        provider: userWallet.provider || "prov_aspfiy",
        providerName: userWallet.providerName || "Aspfiy Payment Gateway",
        bankName: userWallet.virtualBankName || userWallet.bankName || "PalmPay",
        accountNumber: accNum,
        accountName:
          userWallet.virtualAccountName ||
          userWallet.accountName ||
          `SMARTLINK / ${(userFallback?.fullName || "CUSTOMER").toUpperCase()}`,
        reference: userWallet.virtualAccountReference || userWallet.reference || `SL-${userId}`,
        providerReference: userWallet.virtualAccountReference || userWallet.reference || `SL-${userId}`,
        status: "ACTIVE",
        createdAt: userWallet.createdAt || new Date().toISOString(),
      };
      db.virtualAccounts.push(existingAccount);
      db.walletAccounts.push(existingAccount);
      writeDB(db);
      return {
        success: true,
        account: existingAccount,
        virtualAccount: existingAccount,
        provider: {
          name: existingAccount.providerName || existingAccount.bankName,
          id: existingAccount.providerId || existingAccount.provider,
        },
        isExisting: true,
      };
    }
  } catch (err: any) {
    console.warn(`[VirtualAccount] Firestore wallet lookup note: ${err?.message}`);
  }

  // 3. Check Firestore users collection
  const user =
    (await usersStore.getUserById(userId)) ||
    userFallback || {
      id: userId,
      uid: userId,
      email: "customer@smartlink.ng",
      fullName: "SMARTLINK CUSTOMER",
    };

  if (user && (user.virtualAccountNumber || user.accountNumber)) {
    const accNum = user.virtualAccountNumber || user.accountNumber;
    existingAccount = {
      id: `va_${user.provider || "aspfiy"}_${userId}`,
      userId,
      userEmail: user.email || "",
      userName: user.fullName || "",
      provider: user.provider || "prov_aspfiy",
      providerName: "Aspfiy Payment Gateway",
      bankName: user.virtualBankName || user.bankName || "PalmPay",
      accountNumber: accNum,
      accountName:
        user.virtualAccountName || user.accountName || `SMARTLINK / ${(user.fullName || "CUSTOMER").toUpperCase()}`,
      reference: user.virtualAccountReference || user.reference || `SL-${userId}`,
      providerReference: user.virtualAccountReference || user.reference || `SL-${userId}`,
      status: "ACTIVE",
      createdAt: user.createdAt || new Date().toISOString(),
    };
    db.virtualAccounts.push(existingAccount);
    db.walletAccounts.push(existingAccount);
    writeDB(db);
    return {
      success: true,
      account: existingAccount,
      virtualAccount: existingAccount,
      provider: {
        name: existingAccount.providerName || existingAccount.bankName,
        id: existingAccount.providerId || existingAccount.provider,
      },
      isExisting: true,
    };
  }

  // 4. Resolve Active Provider and Adapter
  const resolved = getActiveProviderAndAdapter(db);
  if (!resolved) {
    return {
      success: false,
      error: "No active payment provider configured.",
      code: "NO_ACTIVE_PROVIDER",
    };
  }

  const { provider, adapter } = resolved;
  if (!adapter.createVirtualAccount) {
    return {
      success: false,
      error: `Active provider "${provider.name}" does not support virtual account creation.`,
      code: "NOT_SUPPORTED",
    };
  }

  const result = await adapter.createVirtualAccount(db, user, provider);
  if (!result.success || !result.accountNumber) {
    return {
      success: false,
      error: result.error || "Failed to create virtual account with active provider.",
      code: "PROVIDER_ACCOUNT_CREATION_FAILED",
      rawResponse: result.rawResponse,
    };
  }

  const virtualAccount = {
    id: `va_${provider.id || "prov"}_${Date.now()}`,
    userId,
    userEmail: user.email || userFallback?.email,
    userName: user.fullName || userFallback?.fullName,
    provider: provider.id || "GATEWAY",
    providerId: provider.id,
    providerName: provider.name,
    bankName: result.bankName || "PalmPay",
    accountNumber: result.accountNumber,
    accountName: result.accountName || `SMARTLINK / ${(user.fullName || "CUSTOMER").toUpperCase()}`,
    providerReference: result.providerReference || `SL-${userId}`,
    reference: result.providerReference || `SL-${userId}`,
    accounts: [{ bankName: result.bankName || "PalmPay", accountNumber: result.accountNumber }],
    amountExpected: amount || null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  db.virtualAccounts.push(virtualAccount);
  db.walletAccounts.push(virtualAccount);

  try {
    await walletsStore.updateWalletAtomic(userId, () => ({
      virtualAccountNumber: result.accountNumber,
      virtualBankName: result.bankName || "PalmPay",
      virtualAccountName: result.accountName || `SMARTLINK / ${(user.fullName || "CUSTOMER").toUpperCase()}`,
      virtualAccountReference: result.providerReference || `SL-${userId}`,
      provider: provider.id || provider.name,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err: any) {
    console.warn(`[Wallet] Non-fatal: unable to update wallet with virtual account details: ${err?.message}`);
  }

  try {
    await usersStore.updateUser(userId, {
      virtualAccountNumber: result.accountNumber,
      virtualBankName: result.bankName || "PalmPay",
      virtualAccountName: result.accountName || `SMARTLINK / ${(user.fullName || "CUSTOMER").toUpperCase()}`,
      virtualAccountReference: result.providerReference || `SL-${userId}`,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn(`[User] Non-fatal: unable to update user with virtual account details: ${err?.message}`);
  }

  writeDB(db);

  return {
    success: true,
    provider,
    account: virtualAccount,
    virtualAccount,
  };
}

export async function resolveVtuPlanAndPricing(
  db: any,
  options: {
    type: string;
    provider?: string;
    extra?: string;
    amount?: any;
  }
) {
  const { type, provider = "", extra = "", amount } = options;
  const isAirtime = type === "AIRTIME" || type === "VTU_AIRTIME";
  let priceMatrix = db.priceMatrix || {};
  let globalSettings: any = {};

  try {
    const fsDb = getAdminFirestore();
    const globalSnap = await fsDb.collection("app_settings").doc("global").get();
    if (globalSnap.exists) {
      globalSettings = globalSnap.data() || {};
      if (globalSettings.priceMatrix) {
        priceMatrix = { ...priceMatrix, ...globalSettings.priceMatrix };
      }
    }
  } catch (err) {
    console.warn("[VTU Pricing] Error fetching /app_settings/global from Firestore:", err);
  }

  let markupFee = 20.0;
  if (typeof globalSettings?.vtuMarkupMargin === "number") {
    markupFee = globalSettings.vtuMarkupMargin;
  } else if (typeof globalSettings?.vtuMarkup === "number") {
    markupFee = globalSettings.vtuMarkup;
  } else if (typeof globalSettings?.utilityProcessingFee === "number") {
    markupFee = globalSettings.utilityProcessingFee;
  } else if (typeof priceMatrix?.utilityProcessingFee === "number") {
    markupFee = Number(priceMatrix.utilityProcessingFee) || 20.0;
  } else if (typeof priceMatrix?.telecomMarkup === "number") {
    markupFee = priceMatrix.telecomMarkup;
  }

  let baseCost = 0;
  let providerPlanId = extra;
  let planName = extra;
  let network = provider || "";

  if (isAirtime) {
    const faceValue = Math.max(10, parseFloat(amount) || parseFloat(extra) || 100);
    const netUpper = (provider || "").toUpperCase().trim();
    const discount = priceMatrix.airtimeDiscountPercent?.[netUpper] ?? 2;
    baseCost = Math.round(faceValue * (1 - discount / 100) * 100) / 100;
    providerPlanId = `AIRTIME_${netUpper || "TELCO"}_${faceValue}`;
    planName = `${provider || "Telecom"} ₦${faceValue} Airtime`;
    network = netUpper;
  } else {
    const plans: any[] = Array.isArray(priceMatrix.dataPlans) ? priceMatrix.dataPlans : [];
    const matchedPlan = plans.find((p: any) => {
      if (!p) return false;
      const cleanExtra = String(extra).toLowerCase().trim();
      const pId = String(p.id || "").toLowerCase().trim();
      const pPlanId = String(p.planId || "").toLowerCase().trim();
      const pProvId = String(p.providerPlanId || "").toLowerCase().trim();
      const pName = String(p.planName || p.name || "").toLowerCase().trim();
      return pId === cleanExtra || pPlanId === cleanExtra || pProvId === cleanExtra || pName === cleanExtra;
    });

    if (matchedPlan) {
      baseCost = Number(
        matchedPlan.agentPrice ??
          matchedPlan.wholesalePrice ??
          matchedPlan.costPrice ??
          matchedPlan.baseCost ??
          (matchedPlan.customerPrice ? matchedPlan.customerPrice - markupFee : 240)
      );
      providerPlanId = matchedPlan.providerPlanId || matchedPlan.planId || matchedPlan.id || extra;
      planName = matchedPlan.planName || matchedPlan.name || extra;
      network = matchedPlan.network || provider || "";
    } else {
      baseCost = 240;
      providerPlanId = extra;
      planName = extra || "Data Bundle";
    }
  }

  const finalCustomerPrice = Math.round((baseCost + markupFee) * 100) / 100;
  const profitMargin = Math.round((finalCustomerPrice - baseCost) * 100) / 100;

  return {
    baseCost,
    markupFee,
    finalCustomerPrice,
    profitMargin,
    providerPlanId,
    planName,
    network,
  };
}

/**
 * Normalizes identity photos and signatures from external KYC Gateways:
 * - Prepend data URL image headers to raw base64 payloads
 * - Keep existing HTTP(S), storage paths, and valid data URIs unchanged
 * - Return empty string for null, undefined, none, or broken data
 */
export function normalizePhotoUrl(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "none" ||
    trimmed === "false" ||
    trimmed === "{}" ||
    trimmed === "[]"
  ) {
    return "";
  }

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/api/storage/") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Base64 without standard data URI header
  const cleanBase64 = trimmed.replace(/\s+/g, "");
  if (cleanBase64.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("R0lGOD")) {
    return `data:image/gif;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("UklGR")) {
    return `data:image/webp;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("PHN2Zy") || cleanBase64.startsWith("PD94bWw")) {
    return `data:image/svg+xml;base64,${cleanBase64}`;
  }

  // Fallback for valid generic base64 strings
  if (cleanBase64.length > 30 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    return `data:image/jpeg;base64,${cleanBase64}`;
  }

  return trimmed;
}
