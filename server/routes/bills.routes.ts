import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { isMaintenanceModeActive, getMaintenanceDetails, getValueByJsonPath, seedModule7SettingsIfEmpty, sanitizePublicSettings } from "../middleware/maintenance";
import { getAI } from "../services/ai";
import { 
  DEFAULT_SERVICES_CATALOG, 
  seedDefaultServicesCatalogIfEmpty, 
  seedDefaultUsersIfEmpty, 
  seedDefaultTransactionsIfEmpty, 
  recordAdminUserAction, 
  getOrCreateUserVirtualAccount, 
  resolveVtuPlanAndPricing 
} from "../services/sharedHelpers";
import { ServerWalletEngine } from "../../src/services/serverWalletEngine";
import { APIProviderManager, DEFAULT_PROVIDERS } from "../../src/services/apiProviderManager";
import { ProviderExecutor, verifyWebhookSignature } from "../../src/services/providerExecutor";
import { adminAuthService, ADMIN_ROLES_CONFIG } from "../../src/services/adminAuthService";
import { AutomaticWalletFundingEngine } from "../../src/services/automaticWalletFundingEngine";
import { PaymentVerificationReconciliationEngine } from "../../src/services/paymentVerificationReconciliationEngine";
import { getActiveProviderAndAdapter, getAdapterForProvider } from "../../src/services/providerGateway";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { AgentHubAdapter } from "../../src/services/providers/agenthubAdapter";
import { NINTrustAdapter } from "../../src/services/providers/nintrustAdapter";
import { MultiGatewayRoutingEngine } from "../../src/services/multiGatewayRoutingEngine";
import { syncFromFirestore, syncToFirestore } from "../../src/services/settingsStore";
import { loadFirestoreDb, syncDbToFirestore, saveDocToFirestore } from "../../src/services/firestoreStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";
import { getAuth } from "firebase-admin/auth";
import { getAdminFirestore } from "../../src/services/firebaseAdmin";


const router = express.Router();
const app = router;

app.post("/api/services/vtu", async (req, res) => {
  const { userId, type, provider, phoneNumber, amount, extra } = req.body;
  const db = readDB();

  // Strict Aspfiy isolation guard: run original untouched Aspfiy telecom execution code blocks
  const isAspfiy =
    req.body.provider === "Aspfiy" ||
    req.body.providerName === "Aspfiy" ||
    req.body.provider === "prov_aspfiy" ||
    (typeof req.body.provider === "string" && req.body.provider.toLowerCase().includes("aspfiy")) ||
    (typeof req.body.providerName === "string" && req.body.providerName.toLowerCase().includes("aspfiy"));

  if (isAspfiy) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const reference = "SML-VTU-" + Math.floor(100000 + Math.random() * 900000);
    const txType = type === "AIRTIME" ? "VTU_AIRTIME" : "VTU_DATA";
    const desc = `${provider} ${type === "AIRTIME" ? "Airtime Top-up" : "Data Bundle (" + extra + ")"} sent to ${phoneNumber}`;

    // Execute real provider call BEFORE debiting
    const providerResult = await ProviderExecutor.executeProviderCall(db, {
      category: "TELECOM_VTU",
      providerName: provider,
      userId,
      customerId: phoneNumber,
      phoneNumber,
      amount: amt,
      smartlinkReference: reference,
      extraData: { planId: extra },
    });

    if (!providerResult.success) {
      return res.status(502).json({
        error: providerResult.error || `${provider} did not confirm this ${type === "AIRTIME" ? "airtime" : "data"} purchase.`,
        errorCode: "PROVIDER_FAILED",
        rawResponse: providerResult.rawResponse,
      });
    }

    try {
      const debitRes = await ServerWalletEngine.debitWallet(db, {
        userId,
        amount: amt,
        serviceName: `${provider} ${type === "AIRTIME" ? "Airtime" : "Data Bundle"}`,
        provider,
        description: desc,
        reference,
        recipientDetails: `${provider} | ${phoneNumber}`,
        type: txType,
        providerReference: providerResult.providerReference || providerResult.transactionId,
        rawResponse: providerResult.rawResponse,
      });

      const user = await usersStore.getUserById(userId);
      if (user && user.referredBy) {
        const referrer = await usersStore.getUserById(user.referredBy);
        if (referrer) {
          const comm = Math.round(amt * 0.02 * 100) / 100;
          await ServerWalletEngine.creditWallet(db, {
            userId: referrer.uid,
            amount: comm,
            serviceName: "Referral Commission",
            provider: "SmartLink Referral Engine",
            description: `2% Referral commission from ${user.fullName}'s VTU purchase`,
            reference: "COMM-" + reference,
            type: "COMMISSION_EARNING",
          });
        }
      }

      writeDB(db);
      return res.json({
        balance: debitRes.wallet.currentBalance,
        transaction: debitRes.transaction,
        providerReference: providerResult.providerReference || providerResult.transactionId,
        rawResponse: providerResult.rawResponse,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "VTU service payment failed" });
    }
  }

  // --- SECONDARY / FALLBACK NON-ASPFIY VTU EXECUTION ENGINE WITH SECURE SERVER-SIDE MARKUP ---
  if (!userId) {
    return res.status(401).json({ error: "User authentication required.", errorCode: "AUTH_ERROR" });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: "Recipient phone number is required.", errorCode: "INVALID_INPUT" });
  }

  const secondaryProvider = provider || "Telecom Gateway";
  const reference = "SML-VTU-" + Math.floor(100000 + Math.random() * 900000);
  const txType = type === "AIRTIME" ? "VTU_AIRTIME" : "VTU_DATA";

  // Calculate wholesale baseline cost and administrative markup fee on server side (ignoring req.body.amount)
  const {
    baseCost,
    markupFee,
    finalCustomerPrice,
    profitMargin,
    providerPlanId,
    planName,
    network,
  } = await resolveVtuPlanAndPricing(db, { type, provider, extra, amount });

  const desc = `${secondaryProvider} ${type === "AIRTIME" ? "Airtime Top-up" : "Data Bundle (" + planName + ")"} to ${phoneNumber}`;

  // 1. Check if user's available wallet balance can cover the finalCustomerPrice (baseCost + markupFee)
  const userWallet = await walletsStore.getWalletByUserId(userId);
  const currentBalance = userWallet ? Number(userWallet.balance) || 0 : 0;
  if (currentBalance < finalCustomerPrice) {
    return res.status(400).json({
      error: `Insufficient wallet balance. Total required: ₦${finalCustomerPrice.toFixed(2)} (Base: ₦${baseCost.toFixed(2)} + Processing/Markup: ₦${markupFee.toFixed(2)}). Current balance: ₦${currentBalance.toFixed(2)}.`,
      errorCode: "INSUFFICIENT_BALANCE",
      requiredAmount: finalCustomerPrice,
      currentBalance,
    });
  }

  // 2. Atomically debit user's wallet the full marked-up retail price
  let debitRes;
  try {
    debitRes = await ServerWalletEngine.debitWallet(db, {
      userId,
      amount: finalCustomerPrice,
      serviceName: `${secondaryProvider} ${type === "AIRTIME" ? "Airtime" : "Data Bundle"}`,
      provider: secondaryProvider,
      description: `${desc} [Retail: ₦${finalCustomerPrice.toFixed(2)}]`,
      reference,
      recipientDetails: `${secondaryProvider} | ${phoneNumber}`,
      type: txType,
      providerReference: `PENDING_${reference}`,
    });
  } catch (err: any) {
    return res.status(400).json({
      error: err.message || "Failed to debit wallet for VTU service.",
      errorCode: "WALLET_DEBIT_FAILED",
    });
  }

  // 3. Send API purchase handshake request to active fallback provider using ONLY expected wholesale providerPlanId and raw baseCost
  const providerResult = await ProviderExecutor.executeProviderCall(db, {
    category: "TELECOM_VTU",
    providerName: secondaryProvider,
    userId,
    customerId: phoneNumber,
    phoneNumber,
    amount: baseCost,
    smartlinkReference: reference,
    extraData: {
      planId: providerPlanId,
      providerPlanId,
      wholesaleCost: baseCost,
      network,
    },
  });

  if (!providerResult.success) {
    // Atomically refund wallet if fallback provider call fails
    try {
      await ServerWalletEngine.creditWallet(db, {
        userId,
        amount: finalCustomerPrice,
        serviceName: `${secondaryProvider} VTU Refund`,
        provider: secondaryProvider,
        description: `Automatic refund for failed ${type} purchase to ${phoneNumber} (${providerResult.error || "Provider unreachable"})`,
        reference: `REF-${reference}`,
        type: "WALLET_REFUND",
      });
      writeDB(db);
    } catch (refundErr) {
      console.error("[VTU Engine] Error issuing refund for failed provider call:", refundErr);
    }

    return res.status(502).json({
      error: providerResult.error || `${secondaryProvider} did not confirm this purchase. Your wallet has been refunded.`,
      errorCode: "PROVIDER_FAILED",
      refunded: true,
      rawResponse: providerResult.rawResponse,
    });
  }

  // 4. Log generated profit margins and audit states cleanly into providerLogs database collection
  const providerLogEntry = {
    id: `plog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    providerName: secondaryProvider,
    service: "TELECOM_VTU",
    transactionId: reference,
    userId,
    phoneNumber,
    type: txType,
    planId: providerPlanId,
    planName,
    baseCost,
    markupFee,
    retailPrice: finalCustomerPrice,
    profitMargin,
    requestTime: new Date().toISOString(),
    responseTime: providerResult.responseTimeMs || 120,
    status: "SUCCESS",
    providerReference: providerResult.providerReference || providerResult.transactionId || reference,
    details: `VTU Purchase: ${type} ${planName} to ${phoneNumber}. Base: ₦${baseCost}, Markup: ₦${markupFee}, Retail: ₦${finalCustomerPrice}, Profit: ₦${profitMargin}`,
    createdAt: new Date().toISOString(),
  };

  if (!db.providerLogs) db.providerLogs = [];
  db.providerLogs.unshift(providerLogEntry);

  try {
    const fsDb = getAdminFirestore();
    await fsDb.collection("provider_logs").doc(providerLogEntry.id).set(providerLogEntry);
  } catch (fsErr) {
    console.warn("[VTU Engine] Failed to write providerLog to Firestore:", fsErr);
  }

  // Process referral bonus if applicable
  const user = await usersStore.getUserById(userId);
  if (user && user.referredBy) {
    const referrer = await usersStore.getUserById(user.referredBy);
    if (referrer) {
      const comm = Math.round(finalCustomerPrice * 0.02 * 100) / 100;
      await ServerWalletEngine.creditWallet(db, {
        userId: referrer.uid,
        amount: comm,
        serviceName: "Referral Commission",
        provider: "SmartLink Referral Engine",
        description: `2% Referral commission from ${user.fullName}'s VTU purchase`,
        reference: "COMM-" + reference,
        type: "COMMISSION_EARNING",
      });
    }
  }

  writeDB(db);

  return res.json({
    success: true,
    status: "SUCCESS",
    balance: debitRes.wallet.currentBalance,
    transaction: debitRes.transaction,
    providerReference: providerResult.providerReference || providerResult.transactionId,
    rawResponse: providerResult.rawResponse,
    retailPrice: finalCustomerPrice,
    baseCost,
    markupFee,
    profitMargin,
  });
});

// Bill payments (Electricity, Cable TV)
app.post("/api/services/bill", async (req, res) => {
  const { userId, category, provider, customerId, amount, plan } = req.body;
  const db = readDB();

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

  const reference = "SML-BILL-" + Math.floor(100000 + Math.random() * 900000);
  const txType = category === "ELECTRICITY" ? "UTILITY_ELECTRICITY" : "CABLE_TV";
  const desc = `${provider} Bill Payment ${plan ? "(" + plan + ")" : ""} for Meter/ID: ${customerId}`;

  // Execute real provider call BEFORE debiting
  const providerResult = await ProviderExecutor.executeProviderCall(db, {
    category: "UTILITY_BILL",
    providerName: provider,
    userId,
    customerId,
    phoneNumber: customerId,
    amount: amt,
    smartlinkReference: reference,
    extraData: { plan, category },
  });

  if (!providerResult.success) {
    return res.status(502).json({
      error: providerResult.error || `${provider} bill payment provider did not confirm this transaction.`,
      errorCode: "PROVIDER_FAILED",
      rawResponse: providerResult.rawResponse,
    });
  }

  try {
    const debitRes = await ServerWalletEngine.debitWallet(db, {
      userId,
      amount: amt,
      serviceName: `${provider} Bill Payment`,
      provider,
      description: desc,
      reference,
      fee: 50.0,
      recipientDetails: `${provider} | ID: ${customerId}`,
      type: txType,
      providerReference: providerResult.providerReference || providerResult.transactionId,
      token: providerResult.token,
      units: providerResult.units,
      rawResponse: providerResult.rawResponse,
    });

    writeDB(db);
    res.json({
      balance: debitRes.wallet.currentBalance,
      transaction: debitRes.transaction,
      token: providerResult.token,
      units: providerResult.units,
      providerReference: providerResult.providerReference || providerResult.transactionId,
      rawResponse: providerResult.rawResponse,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bill payment failed" });
  }
});

// Education Cards & Tokens (WAEC scratch card, JAMB ePIN, NECO token, NABTEB)
app.post("/api/services/education", async (req, res) => {
  const { userId, cardType, quantity, amount } = req.body;
  const db = readDB();

  const qty = parseInt(quantity) || 1;
  const totalCost = parseFloat(amount) * qty;

  const pinData: string[] = [];
  for (let i = 0; i < qty; i++) {
    const serial = "S/N-" + Math.floor(10000000 + Math.random() * 90000000);
    const pin = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    pinData.push(`Serial: ${serial}, PIN: ${pin}`);
  }

  const reference = "SML-EDU-" + Math.floor(100000 + Math.random() * 900000);
  const txType =
    cardType === "WAEC"
      ? "WAEC_SCRATCH_CARD"
      : cardType === "JAMB"
      ? "JAMB_EPIN"
      : "NECO_TOKEN";

  try {
    const debitRes = await ServerWalletEngine.debitWallet(db, {
      userId,
      amount: totalCost,
      serviceName: `${cardType} Scratch Card`,
      provider: "Exam Portal Engine",
      description: `Purchased ${qty}x ${cardType} Scratch Cards/PIN tokens`,
      reference,
      recipientDetails: pinData.join(" | "),
      type: txType,
    });

    writeDB(db);
    res.json({ balance: debitRes.wallet.currentBalance, transaction: debitRes.transaction, pins: pinData });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Education token purchase failed" });
  }
});

// 4. CAC Business Applications


// ==========================================
// MODULE 7: BILL PAYMENT SERVICES API ENDPOINTS
// ==========================================

// Get Available Bill Categories
app.get("/api/bills/categories", async (req, res) => {
  const categories = [
    {
      id: "AIRTIME",
      name: "Airtime Top-Up",
      description: "Instant Virtual Top-Up (VTU) for MTN, Glo, Airtel & 9mobile.",
      icon: "Smartphone",
      estimatedProcessingTime: "Instant (~1.2s)",
      providerStatus: "ONLINE",
      requiresValidation: false,
    },
    {
      id: "DATA",
      name: "Data Bundles",
      description: "SME, Corporate Gifting & Direct Data bundles with max validity.",
      icon: "Wifi",
      estimatedProcessingTime: "Instant (~1.5s)",
      providerStatus: "ONLINE",
      requiresValidation: false,
    },
    {
      id: "ELECTRICITY",
      name: "Electricity Bill & Tokens",
      description: "Pay Prepaid & Postpaid electricity bills for all DISCOs with instant tokens.",
      icon: "Zap",
      estimatedProcessingTime: "Instant (~2.0s)",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "CABLE_TV",
      name: "Cable TV Subscription",
      description: "Recharge DStv, GOtv, Startimes & Showmax with customer lookup.",
      icon: "Tv",
      estimatedProcessingTime: "Instant (~1.8s)",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "INTERNET",
      name: "Internet Services",
      description: "Smile, Spectranet, Swift & Broadband Fiber monthly subscriptions.",
      icon: "Globe",
      estimatedProcessingTime: "Instant (~2.5s)",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "EDUCATION",
      name: "Education & Exams",
      description: "WAEC Result Checker PINs, NECO Tokens, JAMB ePINS & NABTEB.",
      icon: "GraduationCap",
      estimatedProcessingTime: "Instant (~1.0s)",
      providerStatus: "ONLINE",
      requiresValidation: false,
    },
    {
      id: "BETTING",
      name: "Betting Wallet Funding",
      description: "Instant deposit to SportyBet, Bet9ja, 1xBet & MSport accounts.",
      icon: "Dices",
      estimatedProcessingTime: "Instant (~1.5s)",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "INSURANCE",
      name: "Insurance Premiums",
      description: "Third-party motor insurance, health policy & life cover payments.",
      icon: "Shield",
      estimatedProcessingTime: "< 5 Minutes",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "WATER",
      name: "Water Utility Bills",
      description: "Lagos Water Corporation, Abuja Water Board & state water authorities.",
      icon: "Droplets",
      estimatedProcessingTime: "< 5 Minutes",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "WASTE",
      name: "Waste Management (LAWMA)",
      description: "LAWMA & PSP residential or commercial waste billing settlement.",
      icon: "Trash2",
      estimatedProcessingTime: "< 5 Minutes",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "GOVERNMENT",
      name: "Government Levies & Taxes",
      description: "LIRS Tax, FIRS Tax, Land Use Charge & vehicle registration fees.",
      icon: "Landmark",
      estimatedProcessingTime: "< 10 Minutes",
      providerStatus: "ONLINE",
      requiresValidation: true,
    },
    {
      id: "FUTURE_SERVICES",
      name: "Custom / Future Services",
      description: "Extensible provider gateway for custom vendor bill collections.",
      icon: "Sparkles",
      estimatedProcessingTime: "Variable",
      providerStatus: "ONLINE",
      requiresValidation: false,
    },
  ];

  res.json({ success: true, categories });
});

// Get Providers for Category
app.get("/api/bills/providers", async (req, res) => {
  const category = (req.query.category as string) || "AIRTIME";

  let providers = [];
  switch (category) {
    case "AIRTIME":
    case "DATA":
      providers = [
        { id: "mtn", code: "MTN", name: "MTN Nigeria", category, status: "ACTIVE" },
        { id: "glo", code: "GLO", name: "Glo Nigeria", category, status: "ACTIVE" },
        { id: "airtel", code: "AIRTEL", name: "Airtel Nigeria", category, status: "ACTIVE" },
        { id: "9mobile", code: "9MOBILE", name: "9mobile Nigeria", category, status: "ACTIVE" },
      ];
      break;
    case "ELECTRICITY":
      providers = [
        { id: "ikedc", code: "IKEDC", name: "Ikeja Electric (IKEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "ekedc", code: "EKEDC", name: "Eko Electricity (EKEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "aedc", code: "AEDC", name: "Abuja Electricity (AEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "ibedc", code: "IBEDC", name: "Ibadan Electricity (IBEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "kedco", code: "KEDCO", name: "Kano Electricity (KEDCO)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "eedc", code: "EEDC", name: "Enugu Electricity (EEDC)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
        { id: "phed", code: "PHED", name: "Port Harcourt Electricity (PHED)", category, status: "ACTIVE", supportedMeterTypes: ["PREPAID", "POSTPAID"] },
      ];
      break;
    case "CABLE_TV":
      providers = [
        { id: "dstv", code: "DSTV", name: "DStv Nigeria", category, status: "ACTIVE" },
        { id: "gotv", code: "GOTV", name: "GOtv Nigeria", category, status: "ACTIVE" },
        { id: "startimes", code: "STARTIMES", name: "Startimes Nigeria", category, status: "ACTIVE" },
        { id: "showmax", code: "SHOWMAX", name: "Showmax", category, status: "ACTIVE" },
      ];
      break;
    case "BETTING":
      providers = [
        { id: "sportybet", code: "SPORTYBET", name: "SportyBet Nigeria", category, status: "ACTIVE" },
        { id: "bet9ja", code: "BET9JA", name: "Bet9ja", category, status: "ACTIVE" },
        { id: "1xbet", code: "1XBET", name: "1xBet", category, status: "ACTIVE" },
        { id: "msport", code: "MSPORT", name: "MSport", category, status: "ACTIVE" },
        { id: "bangbet", code: "BANGBET", name: "BangBet", category, status: "ACTIVE" },
      ];
      break;
    case "EDUCATION":
      providers = [
        { id: "waec", code: "WAEC", name: "WAEC Result Checker PIN", category, status: "ACTIVE" },
        { id: "neco", code: "NECO", name: "NECO Result Token", category, status: "ACTIVE" },
        { id: "jamb", code: "JAMB", name: "JAMB UTME / DE ePINS", category, status: "ACTIVE" },
        { id: "nabteb", code: "NABTEB", name: "NABTEB Result Scratch Card", category, status: "ACTIVE" },
      ];
      break;
    case "INTERNET":
      providers = [
        { id: "smile", code: "SMILE", name: "Smile Telecoms", category, status: "ACTIVE" },
        { id: "spectranet", code: "SPECTRANET", name: "Spectranet 4G LTE", category, status: "ACTIVE" },
        { id: "swift", code: "SWIFT", name: "Swift Networks", category, status: "ACTIVE" },
      ];
      break;
    default:
      providers = [
        { id: "generic", code: "GENERIC_PROVIDER", name: "SmartLink Unified Payment Gateway", category, status: "ACTIVE" },
      ];
      break;
  }

  res.json({ success: true, providers });
});

// Get Plans for Provider
app.get("/api/bills/plans", async (req, res) => {
  const provider = (req.query.provider as string) || "MTN";
  const category = (req.query.category as string) || "DATA";

  let plans = [];
  if (category === "DATA") {
    if (provider === "MTN") {
      plans = [
        { id: "mtn_500mb", providerCode: "MTN", planName: "MTN SME 500MB", dataVolume: "500MB", validity: "30 Days", amount: 140, category },
        { id: "mtn_1gb", providerCode: "MTN", planName: "MTN SME 1.0GB", dataVolume: "1.0GB", validity: "30 Days", amount: 260, category },
        { id: "mtn_2gb", providerCode: "MTN", planName: "MTN SME 2.0GB", dataVolume: "2.0GB", validity: "30 Days", amount: 520, category },
        { id: "mtn_5gb", providerCode: "MTN", planName: "MTN SME 5.0GB", dataVolume: "5.0GB", validity: "30 Days", amount: 1300, category },
        { id: "mtn_10gb", providerCode: "MTN", planName: "MTN SME 10.0GB", dataVolume: "10.0GB", validity: "30 Days", amount: 2600, category },
      ];
    } else if (provider === "GLO") {
      plans = [
        { id: "glo_1gb", providerCode: "GLO", planName: "Glo Direct 1.0GB", dataVolume: "1.0GB", validity: "30 Days", amount: 250, category },
        { id: "glo_2gb", providerCode: "GLO", planName: "Glo Direct 2.0GB", dataVolume: "2.0GB", validity: "30 Days", amount: 500, category },
        { id: "glo_5gb", providerCode: "GLO", planName: "Glo Direct 5.0GB", dataVolume: "5.0GB", validity: "30 Days", amount: 1250, category },
      ];
    } else {
      plans = [
        { id: "gen_1gb", providerCode: provider, planName: `${provider} Direct 1.0GB`, dataVolume: "1.0GB", validity: "30 Days", amount: 270, category },
        { id: "gen_2gb", providerCode: provider, planName: `${provider} Direct 2.0GB`, dataVolume: "2.0GB", validity: "30 Days", amount: 540, category },
        { id: "gen_5gb", providerCode: provider, planName: `${provider} Direct 5.0GB`, dataVolume: "5.0GB", validity: "30 Days", amount: 1350, category },
      ];
    }
  } else if (category === "CABLE_TV") {
    if (provider === "DSTV") {
      plans = [
        { id: "dstv_padi", providerCode: "DSTV", planName: "DStv Yanga / Padi", amount: 4200, category },
        { id: "dstv_confam", providerCode: "DSTV", planName: "DStv Confam", amount: 7400, category },
        { id: "dstv_compact", providerCode: "DSTV", planName: "DStv Compact", amount: 15700, category },
        { id: "dstv_premium", providerCode: "DSTV", planName: "DStv Premium", amount: 37000, category },
      ];
    } else if (provider === "GOTV") {
      plans = [
        { id: "gotv_smallie", providerCode: "GOTV", planName: "GOtv Smallie", amount: 1570, category },
        { id: "gotv_jinja", providerCode: "GOTV", planName: "GOtv Jinja", amount: 3300, category },
        { id: "gotv_jolli", providerCode: "GOTV", planName: "GOtv Jolli", amount: 4850, category },
        { id: "gotv_max", providerCode: "GOTV", planName: "GOtv Max", amount: 7200, category },
        { id: "gotv_supa", providerCode: "GOTV", planName: "GOtv Supa+", amount: 15700, category },
      ];
    } else {
      plans = [
        { id: "st_basic", providerCode: provider, planName: "Startimes Nova / Basic", amount: 2600, category },
        { id: "st_smart", providerCode: provider, planName: "Startimes Smart", amount: 4700, category },
        { id: "st_super", providerCode: provider, planName: "Startimes Super", amount: 8200, category },
      ];
    }
  } else if (category === "EDUCATION") {
    plans = [
      { id: "waec_pin", providerCode: "WAEC", planName: "WAEC Result Checker ePIN", amount: 3800, category },
      { id: "neco_token", providerCode: "NECO", planName: "NECO Result Token", amount: 1200, category },
      { id: "jamb_epin", providerCode: "JAMB", planName: "JAMB UTME Registration ePIN", amount: 6200, category },
      { id: "nabteb_card", providerCode: "NABTEB", planName: "NABTEB Result Scratch Card", amount: 1500, category },
    ];
  }

  res.json({ success: true, plans });
});

// Validate Customer Details (Meter, IUC, Phone, Student ID)
app.post("/api/bills/validate-customer", async (req, res) => {
  const { category, providerCode, customerId } = req.body;
  if (!customerId || customerId.trim().length < 5) {
    return res.status(400).json({ valid: false, error: "Please provide a valid Account / Meter / Customer ID (at least 5 digits)." });
  }

  // Simulated live customer validation response
  let customerName = "ALHAJI BABATUNDE KOLAWOLE";
  let customerAddress = "NO 14 ADEMOLA ADETOKUNBO CRESCENT, VICTORIA ISLAND, LAGOS";
  let currentPlan = "PREPAID STANDARD RESIDENTIAL";

  if (category === "CABLE_TV") {
    customerName = "CHIEF EMMANUEL OKONKWO";
    customerAddress = "";
    currentPlan = `${providerCode} COMPACT MONTHLY`;
  } else if (category === "BETTING") {
    customerName = "DANJUMA ABUBAKAR (BET-USER)";
    customerAddress = "";
    currentPlan = "VERIFIED PLAYER ACCOUNT";
  }

  res.json({
    valid: true,
    customerName,
    customerAddress,
    accountStatus: "ACTIVE",
    currentPlan,
    minimumAmount: 1000,
  });
});

// Execute Bill Payment Transaction (Atomic Debit, Real Provider Call via ProviderExecutor, Receipt, Notification & History)
app.post("/api/bills/pay", async (req, res) => {
  const {
    userId,
    category,
    providerCode,
    providerName,
    customerId,
    customerName,
    amount,
    charge = 0,
    meterType,
    planId,
    planName,
    phoneNumber,
  } = req.body;

  if (!userId || !category || !amount || amount <= 0) {
    return res.status(400).json({ error: "Missing required payment parameter (userId, category, amount)." });
  }

  const db = readDB();

  // 1. Check if there is an active provider configured for this service category (Requirement 5)
  const activeProvider = ProviderExecutor.getActiveProviderForCategory(db, category, providerCode, providerName);
  if (!activeProvider) {
    return res.status(400).json({
      success: false,
      error: "No active provider configured for this service",
    });
  }

  const totalDeduction = parseFloat(amount) + parseFloat(charge);
  const smartlinkReference = `SL-BILL-${category}-${Math.floor(100000 + Math.random() * 900000)}`;
  const receiptId = `REC-${smartlinkReference}`;

  // 2. Debit user wallet
  let debitRes;
  try {
    debitRes = await ServerWalletEngine.debitWallet(db, {
      userId,
      amount: totalDeduction,
      serviceName: `Bill Payment - ${category} (${activeProvider.name || providerName || providerCode})`,
      provider: activeProvider.name || providerName || providerCode,
      description: `Payment for ${category} [Target: ${customerId || phoneNumber}]`,
      reference: smartlinkReference,
      fee: charge,
      recipientDetails: customerId || phoneNumber,
      type: "BILL_PAYMENT",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Wallet debit failed due to insufficient balance or wallet error." });
  }

  // 3. Execute real HTTP call to the active provider via providerExecutor (Requirements 1 & 2)
  const execRes = await ProviderExecutor.executeProviderCall(db, {
    category,
    customerId,
    customerName,
    phoneNumber,
    amount: parseFloat(amount),
    charge: parseFloat(charge),
    meterType,
    planId,
    planName,
    smartlinkReference,
    providerCode: activeProvider.id || providerCode,
    providerName: activeProvider.name || providerName,
    userId,
  });

  // 4. Handle Failure: Refund debit immediately and do not fabricate token/PIN (Requirement 3)
  if (!execRes.success) {
    try {
      await ServerWalletEngine.creditWallet(db, {
        userId,
        amount: totalDeduction,
        serviceName: `Bill Payment Refund - ${category}`,
        provider: activeProvider.name || providerName || providerCode,
        description: `Refund for failed ${category} payment: ${execRes.error || execRes.message || "Provider call failed"}`,
        reference: `REFUND-${smartlinkReference}`,
        type: "REFUND",
      });
    } catch (refundErr) {
      console.error("Wallet refund error during failed provider call:", refundErr);
    }

    // Store failed receipt record
    if (!db.receipts) db.receipts = [];
    const failedReceipt = {
      id: `rcp_${Date.now()}`,
      receiptId,
      reference: smartlinkReference,
      smartlinkReference,
      providerReference: execRes.providerReference || `PROV-${activeProvider.id || providerCode}-FAILED`,
      userId,
      service: category,
      serviceTitle: `Bill Payment (${activeProvider.name || providerName || providerCode}) - FAILED`,
      amount: parseFloat(amount),
      charge: parseFloat(charge),
      amountPaid: parseFloat(amount),
      totalDeducted: totalDeduction,
      status: "FAILED",
      gateway: activeProvider.name || providerName || providerCode,
      customerId: customerId || phoneNumber,
      customerName: customerName || "Customer",
      errorReason: execRes.error || execRes.message || "Provider execution failed",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.receipts.unshift(failedReceipt);

    // Store failure notification
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: "NOTIF_" + Date.now(),
      notificationId: "NOTIF_" + Date.now(),
      userId,
      title: `${category} Bill Payment Failed`,
      body: `Your payment of ₦${totalDeduction.toLocaleString("en-NG", { minimumFractionDigits: 2 })} for ${activeProvider.name || providerName || providerCode} failed (${execRes.error || execRes.message || "Provider error"}). Your wallet was refunded.`,
      reference: smartlinkReference,
      read: false,
      type: "BILL_PAYMENT",
      createdAt: new Date().toISOString(),
    });

    // Store activity log
    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: "ACT_" + Date.now(),
      activityId: "ACT_" + Date.now(),
      userId,
      userEmail: debitRes.wallet?.userEmail || "",
      activityType: "BILL_PAYMENT",
      action: "BILL_PAYMENT_FAILED",
      description: `Failed payment of ₦${totalDeduction.toLocaleString()} for ${category}. Reason: ${execRes.error || execRes.message}. Refunded to wallet.`,
      status: "FAILED",
      ipAddress: "127.0.0.1",
      timestamp: new Date().toISOString(),
    });

    writeDB(db);

    return res.status(400).json({
      success: false,
      error: execRes.error || execRes.message || "Payment execution failed on provider network. Wallet refunded.",
      refundStatus: "REFUNDED",
      smartlinkReference,
    });
  }

  // 5. Handle Success: Use real tokens, units, pins, and reference returned by provider
  const realProviderReference = execRes.providerReference || `PROV-${activeProvider.id || providerCode}-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const realToken = execRes.token;
  const realUnits = execRes.units;
  const realPins = execRes.pins;

  // Store receipt record
  if (!db.receipts) db.receipts = [];
  const receiptRecord = {
    id: `rcp_${Date.now()}`,
    receiptId,
    reference: smartlinkReference,
    smartlinkReference,
    providerReference: realProviderReference,
    userId,
    service: category,
    serviceTitle: `Bill Payment (${activeProvider.name || providerName || providerCode})`,
    amount: parseFloat(amount),
    charge: parseFloat(charge),
    amountPaid: parseFloat(amount),
    totalDeducted: totalDeduction,
    status: "SUCCESSFUL",
    gateway: activeProvider.name || providerName || providerCode,
    customerId: customerId || phoneNumber,
    customerName: customerName || "Customer",
    token: realToken,
    units: realUnits,
    pins: realPins,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.receipts.unshift(receiptRecord);

  // Store notification record
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: "NOTIF_" + Date.now(),
    notificationId: "NOTIF_" + Date.now(),
    userId,
    title: `${category} Bill Payment Successful`,
    body: `Your payment of ₦${totalDeduction.toLocaleString("en-NG", { minimumFractionDigits: 2 })} for ${activeProvider.name || providerName || providerCode} [Ref: ${smartlinkReference}] was completed successfully.`,
    reference: smartlinkReference,
    read: false,
    type: "BILL_PAYMENT",
    createdAt: new Date().toISOString(),
  });

  // Store activity log
  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift({
    id: "ACT_" + Date.now(),
    activityId: "ACT_" + Date.now(),
    userId,
    userEmail: debitRes.wallet?.userEmail || "",
    activityType: "BILL_PAYMENT",
    action: "BILL_PAYMENT_SUCCESS",
    description: `Paid ₦${totalDeduction.toLocaleString()} for ${category} (${activeProvider.name || providerCode}) Target: ${customerId || phoneNumber}`,
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString(),
  });

  writeDB(db);

  res.json({
    success: true,
    transactionId: debitRes.transaction.transactionId,
    smartlinkReference,
    providerReference: realProviderReference,
    receiptId,
    serviceName: category,
    category,
    providerName: activeProvider.name || providerName || providerCode,
    customerId: customerId || phoneNumber,
    customerName: customerName || "Customer",
    amountPaid: parseFloat(amount),
    charge: parseFloat(charge),
    totalDeducted: totalDeduction,
    status: "SUCCESSFUL",
    token: realToken,
    units: realUnits,
    pins: realPins,
    balanceBefore: debitRes.wallet.currentBalance + totalDeduction,
    balanceAfter: debitRes.wallet.currentBalance,
    timestamp: new Date().toISOString(),
  });
});

// Bill Payment History Endpoint
app.get("/api/bills/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  const db = readDB();

  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden" });
  }

  const txs = (db.transactions || []).filter(
    (t: any) =>
      t.userId === userId &&
      (t.type === "BILL_PAYMENT" ||
        t.service === "BILL_PAYMENT" ||
        t.service === "VTU_AIRTIME" ||
        t.service === "VTU_DATA" ||
        t.service === "UTILITY_ELECTRICITY" ||
        t.service === "CABLE_TV" ||
        t.description?.toLowerCase().includes("bill"))
  );

  res.json({ success: true, history: txs });
});

// Admin Bill Payment Performance Stats
app.get("/api/admin/bills/stats", async (req, res) => {
  const db = readDB();
  const allTxns = (db.transactions || []).filter(
    (t: any) => t.type === "BILL_PAYMENT" || t.service === "BILL_PAYMENT" || t.description?.toLowerCase().includes("bill")
  );

  const totalPayments = allTxns.length;
  const totalVolume = allTxns.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const successCount = allTxns.filter((t: any) => t.status === "SUCCESSFUL" || t.status === "SUCCESS" || t.status === "COMPLETED").length;
  const successRate = totalPayments > 0 ? parseFloat(((successCount / totalPayments) * 100).toFixed(1)) : 100;
  const failureRate = totalPayments > 0 ? parseFloat((100 - successRate).toFixed(1)) : 0;

  const revenueByCategory: Record<string, number> = {};
  const revenueByProvider: Record<string, number> = {};
  const providerStatsMap: Record<string, { total: number; success: number; failed: number; totalTimeMs: number }> = {};

  allTxns.forEach((t: any) => {
    const amt = Number(t.amount) || 0;
    const cat = t.category || t.service || "UNCATEGORIZED";
    const prov = t.provider || t.providerName || "DEFAULT_PROVIDER";
    const isSuccess = t.status === "SUCCESSFUL" || t.status === "SUCCESS" || t.status === "COMPLETED";

    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + amt;
    revenueByProvider[prov] = (revenueByProvider[prov] || 0) + amt;

    if (!providerStatsMap[prov]) {
      providerStatsMap[prov] = { total: 0, success: 0, failed: 0, totalTimeMs: 0 };
    }
    providerStatsMap[prov].total += 1;
    if (isSuccess) providerStatsMap[prov].success += 1;
    else providerStatsMap[prov].failed += 1;
    providerStatsMap[prov].totalTimeMs += Number(t.responseTime) || 1200;
  });

  const providerPerformance = Object.keys(providerStatsMap).map((prov) => {
    const p = providerStatsMap[prov];
    return {
      provider: prov,
      total: p.total,
      success: p.success,
      failed: p.failed,
      avgTime: Math.round(p.totalTimeMs / (p.total || 1)),
    };
  });

  const stats = {
    totalPayments,
    totalVolume,
    successRate,
    failureRate,
    avgProcessingTimeMs: 1200,
    revenueByCategory,
    revenueByProvider,
    providerPerformance,
  };

  res.json({ success: true, stats });
});



export default router;
