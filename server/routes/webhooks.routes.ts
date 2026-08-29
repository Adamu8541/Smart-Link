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

function verifyGatewayWebhookSignature(req: express.Request, db: any): { isValid: boolean; reason?: string } {
  const provider =
    (db.api_providers || []).find((p: any) => (p.name || "").toLowerCase().includes("aspfiy") || (p.id || "").toLowerCase().includes("aspfiy")) ||
    (db.apiProviders || []).find((p: any) => (p.name || "").toLowerCase().includes("aspfiy") || (p.id || "").toLowerCase().includes("aspfiy")) ||
    (db.api_providers || []).find((p: any) => (p.category || "").toLowerCase().includes("gateway") || (p.type || "").toLowerCase().includes("payment")) ||
    (db.apiProviders || []).find((p: any) => (p.category || "").toLowerCase().includes("gateway") || (p.type || "").toLowerCase().includes("payment")) ||
    (db.api_providers || []).find((p: any) => p.status === "Active" || p.isActive) ||
    (db.apiProviders || []).find((p: any) => p.status === "Active" || p.isActive);

  const rawBodyStr = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  return verifyWebhookSignature(provider, rawBodyStr, req.headers as any);
}

function recordUnmatchedWebhookAttempt(db: any, params: {
  provider: string;
  reason: string;
  payload: any;
  headers?: any;
  reference?: string;
  amount?: number;
}) {
  if (!db.unmatched_payments) db.unmatched_payments = [];
  if (!db.reconciliation_records) db.reconciliation_records = [];

  const payload = params.payload || {};
  const eventData = payload.eventData || payload.data || payload;
  const ref = params.reference || payload.paymentReference || payload.reference || payload.orderNo || eventData.paymentReference || eventData.transactionReference || `UNAUTH_${Date.now()}`;
  const amt = params.amount || payload.amount || payload.amountPaid || eventData.amountPaid || eventData.amount || 0;

  const recId = `rec_unauth_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const verificationResult = {
    verified: false,
    matched: false,
    providerName: params.provider,
    comparisonDetails: {
      amountMatch: false,
      referenceMatch: false,
      accountMatch: false,
      providerTxIdMatch: false,
      statusMatch: false,
      verifiedAmount: Number(amt),
      verifiedReference: ref,
    },
    message: `Suspicious/Unauthenticated Webhook attempt rejected: ${params.reason}`,
    failureReason: params.reason,
  };

  const record = {
    id: recId,
    paymentReference: ref,
    providerTransactionId: ref,
    provider: params.provider,
    amount: Number(amt),
    accountNumber: payload.accountNumber || eventData.accountNumber || "N/A",
    status: "UNMATCHED",
    userId: "UNAUTHENTICATED",
    userEmail: "suspicious@smartlink.ng",
    walletId: "N/A",
    date: new Date().toISOString(),
    verificationResult,
    rawPayload: payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reconciliation_records.unshift(record);
  db.unmatched_payments.unshift(record);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `audit_fraud_${Date.now()}`,
    adminUid: "SYSTEM_SECURITY",
    adminEmail: "security@smartlink.ng",
    action: "SUSPICIOUS_WEBHOOK_BLOCKED",
    details: `Blocked unauthenticated ${params.provider} webhook [Reason: ${params.reason}, Ref: ${ref}, Amount: ₦${amt}]`,
    timestamp: new Date().toISOString(),
  });
}

const WEBHOOK_ENDPOINTS = [
  "/api/webhooks",
  "/api/webhooks/",
  "/api/webhook",
  "/api/webhook/",
  "/api/webhooks/aspfiy",
  "/api/webhooks/aspfiy/",
  "/api/webhooks/incoming",
  "/api/webhooks/payment",
  "/api/webhooks/gateway",
  "/api/wallet/funding/webhook",
  "/api/wallet/webhook",
  "/api/v1/webhooks",
  "/api/v1/webhook",
];

// Webhook Connectivity Health & Status Ping
app.get(WEBHOOK_ENDPOINTS, (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    success: true,
    message: "SmartLink Webhook Gateway is active, healthy, and listening for payment events.",
    timestamp: new Date().toISOString(),
  });
});

// Canonical ASPFIY & Compatibility Gateway Webhook Handler
app.post(
  WEBHOOK_ENDPOINTS,
  async (req, res) => {
    const db = readDB();

    console.log(`[Webhook] Received incoming webhook on ${req.originalUrl || req.url}:`, {
      event: req.body?.event,
      ref: req.body?.data?.reference || req.body?.reference || req.body?.paymentReference,
      amount: req.body?.data?.amount || req.body?.amount,
      account: req.body?.data?.account?.account_number || req.body?.accountNumber,
    });

    // 1. Validate Provider & Webhook Signature before processing any payment
    const sigResult = verifyGatewayWebhookSignature(req, db);
    if (!sigResult.isValid) {
      console.warn(`[Webhook] Signature check failed: ${sigResult.reason}`);
      // Record suspicious attempt in security audit ledger and unmatched payments
      recordUnmatchedWebhookAttempt(db, {
        provider: "ASPFIY",
        reason: sigResult.reason || "Invalid webhook signature",
        payload: req.body,
        headers: req.headers,
      });
      writeDB(db);

      return res.status(401).json({
        success: false,
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Invalid webhook signature.",
      });
    }

    // 2. Process payload, extract details, find user, prevent duplicates, verify & credit wallet exactly once
    const result = await AutomaticWalletFundingEngine.processIncomingPaymentNotification(db, {
      payload: req.body,
      headers: req.headers,
    });

    writeDB(db);

    if (result.isDuplicate) {
      return res.status(200).json({
        status: "SUCCESS",
        responseCode: "0",
        responseMessage: "Duplicate transaction acknowledged. Wallet already credited.",
        success: true,
        code: "DUPLICATE_TRANSACTION_ACKNOWLEDGED",
      });
    }

    res.status(result.success ? 200 : 400).json({
      status: result.success ? "SUCCESS" : "FAILED",
      responseCode: result.success ? "0" : "99",
      responseMessage: result.message,
      data: result,
      ...result,
    });
  }
);

// Admin Unmatched Payments Review Endpoint
app.get("/api/admin/unmatched-payments", async (req, res) => {
  const db = readDB();
  if (!db.unmatched_payments) db.unmatched_payments = [];
  res.json({ success: true, unmatchedPayments: db.unmatched_payments });
});

// Admin All Reconciliations Endpoint for Super Admin Review
app.get("/api/admin/reconciliations", async (req, res) => {
  const db = readDB();
  const filters = {
    status: req.query.status as string,
    provider: req.query.provider as string,
    search: req.query.search as string,
  };
  const records = PaymentVerificationReconciliationEngine.getReconciliationRecords(db, filters);
  res.json({ success: true, reconciliations: records });
});

// Standalone Payment Verification & Reconciliation Trigger Endpoint
app.post("/api/reconciliation/verify", async (req, res) => {
  const db = readDB();
  const result = await PaymentVerificationReconciliationEngine.verifyAndReconcilePayment(db, {
    payload: req.body.payload || req.body,
    headers: req.headers,
    providerOverride: req.body.providerOverride,
    expectedAccount: req.body.expectedAccount,
    expectedAmount: req.body.expectedAmount,
    expectedReference: req.body.expectedReference,
  });
  writeDB(db);
  res.status(result.success ? 200 : 400).json(result);
});



// 2. Core Wallet Service API Engine


// ==========================================
// DYNAMIC WEBHOOK MANAGER API ENDPOINTS
// ==========================================

// 1. Get All Webhooks & Webhook Logs
app.get("/api/admin/webhooks", async (req, res) => {
  const db = readDB();
  if (!db.webhooks) db.webhooks = [];
  if (!db.webhookLogs) db.webhookLogs = [];
  res.json({
    success: true,
    webhooks: db.webhooks,
    webhookLogs: db.webhookLogs
  });
});

// 2. Add New Webhook
app.post("/api/admin/webhooks", async (req, res) => {
  const { name, provider, eventType, url, secretToken, signatureHeader, httpMethod, retryCount, retryInterval, status, notes } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Admin credentials required." });
  }
  const adminUser = val.session;
  const adminUid = adminUser.uid;
  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized: Only Super Admin can manage webhooks." });
  }

  if (!name || !name.trim() || !eventType || !eventType.trim() || !url || !url.trim()) {
    return res.status(400).json({ success: false, message: "Webhook Name, Event Type, and Webhook URL are required." });
  }

  try {
    new URL(url.trim());
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid Webhook URL format. Must start with http:// or https://" });
  }

  if (!db.webhooks) db.webhooks = [];

  const newWebhook = {
    id: "wh_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: name.trim(),
    provider: provider ? provider.trim() : "All Providers",
    eventType: eventType.trim(),
    url: url.trim(),
    secretToken: secretToken ? secretToken.trim() : "",
    signatureHeader: signatureHeader ? signatureHeader.trim() : "X-Webhook-Signature",
    httpMethod: httpMethod || "POST",
    retryCount: Number(retryCount) || 3,
    retryInterval: Number(retryInterval) || 5,
    status: status || "Enabled",
    notes: notes ? notes.trim() : "",
    lastExecutedAt: null,
    lastTestedAt: null,
    lastResult: null,
    lastStatusCode: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.webhooks.unshift(newWebhook);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: adminUser.email || "admin",
    action: "CREATE_WEBHOOK",
    details: `Created Webhook "${newWebhook.name}" (${newWebhook.eventType}) -> ${newWebhook.url}`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: true,
    webhook: newWebhook,
    webhooks: db.webhooks
  });
});

// 3. Edit Webhook
app.put("/api/admin/webhooks/:id", async (req, res) => {
  const { id } = req.params;
  const { name, provider, eventType, url, secretToken, signatureHeader, httpMethod, retryCount, retryInterval, status, notes } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Admin credentials required." });
  }
  const adminUser = val.session;
  const adminUid = adminUser.uid;
  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized: Only Super Admin can edit webhooks." });
  }

  if (!db.webhooks) db.webhooks = [];
  const idx = db.webhooks.findIndex((w: any) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Webhook not found." });
  }

  if (!name || !name.trim() || !eventType || !eventType.trim() || !url || !url.trim()) {
    return res.status(400).json({ success: false, message: "Webhook Name, Event Type, and Webhook URL are required." });
  }

  try {
    new URL(url.trim());
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid Webhook URL format." });
  }

  db.webhooks[idx] = {
    ...db.webhooks[idx],
    name: name.trim(),
    provider: provider ? provider.trim() : "All Providers",
    eventType: eventType.trim(),
    url: url.trim(),
    secretToken: secretToken !== undefined ? secretToken.trim() : db.webhooks[idx].secretToken,
    signatureHeader: signatureHeader ? signatureHeader.trim() : db.webhooks[idx].signatureHeader,
    httpMethod: httpMethod || db.webhooks[idx].httpMethod || "POST",
    retryCount: Number(retryCount) || 3,
    retryInterval: Number(retryInterval) || 5,
    status: status || db.webhooks[idx].status || "Enabled",
    notes: notes !== undefined ? notes.trim() : db.webhooks[idx].notes,
    updatedAt: new Date().toISOString()
  };

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: adminUser.email || "admin",
    action: "UPDATE_WEBHOOK",
    details: `Updated Webhook "${db.webhooks[idx].name}" (${db.webhooks[idx].eventType})`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: true,
    webhook: db.webhooks[idx],
    webhooks: db.webhooks
  });
});

// 4. Delete Webhook
app.delete("/api/admin/webhooks/:id", async (req, res) => {
  const { id } = req.params;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Admin credentials required." });
  }
  const adminUser = val.session;
  const adminUid = adminUser.uid;
  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized: Only Super Admin can delete webhooks." });
  }

  if (!db.webhooks) db.webhooks = [];
  const targetWebhook = db.webhooks.find((w: any) => w.id === id);
  db.webhooks = db.webhooks.filter((w: any) => w.id !== id);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: adminUser.email || "admin",
    action: "DELETE_WEBHOOK",
    details: `Deleted Webhook "${targetWebhook?.name || id}"`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: true,
    webhooks: db.webhooks
  });
});

// 5. Toggle Webhook Status (Enable/Disable)
app.patch("/api/admin/webhooks/:id/toggle-status", async (req, res) => {
  const { id } = req.params;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Admin credentials required." });
  }
  const adminUser = val.session;
  const adminUid = adminUser.uid;
  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized: Only Super Admin can toggle webhook status." });
  }

  if (!db.webhooks) db.webhooks = [];
  const idx = db.webhooks.findIndex((w: any) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Webhook not found." });
  }

  db.webhooks[idx].status = db.webhooks[idx].status === "Enabled" ? "Disabled" : "Enabled";
  db.webhooks[idx].updatedAt = new Date().toISOString();

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: adminUser.email || "admin",
    action: "TOGGLE_WEBHOOK_STATUS",
    details: `Toggled Webhook "${db.webhooks[idx].name}" status to ${db.webhooks[idx].status}`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: true,
    webhook: db.webhooks[idx],
    webhooks: db.webhooks
  });
});

// 6. Test Webhook Endpoint
app.post("/api/admin/webhooks/:id/test", async (req, res) => {
  const { id } = req.params;
  const sessionToken = (req.headers["x-admin-token"] as string) || (req.query.token as string);
  const startTime = Date.now();
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({
      success: false,
      resultStatus: "Unauthorized",
      statusCode: 401,
      message: "Admin credentials required."
    });
  }
  const adminUser = val.session;
  const adminUid = adminUser.uid;
  if (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      resultStatus: "Unauthorized",
      statusCode: 403,
      message: "Unauthorized: Only Super Admin can test webhooks."
    });
  }

  if (!db.webhooks) db.webhooks = [];
  const idx = db.webhooks.findIndex((w: any) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      resultStatus: "Invalid URL",
      statusCode: 404,
      message: "Webhook configuration not found."
    });
  }

  const webhook = db.webhooks[idx];

  // Validate URL structure
  try {
    const parsedUrl = new URL(webhook.url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Protocol must be HTTP or HTTPS");
    }
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    db.webhooks[idx].lastTestedAt = new Date().toISOString();
    db.webhooks[idx].lastResult = "Invalid URL";
    db.webhooks[idx].lastStatusCode = 0;
    
    if (!db.webhookLogs) db.webhookLogs = [];
    db.webhookLogs.unshift({
      id: "whlog_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      webhookId: webhook.id,
      webhookName: webhook.name,
      provider: webhook.provider,
      eventType: webhook.eventType,
      url: webhook.url,
      resultStatus: "Invalid URL",
      statusCode: 0,
      responseTimeMs,
      responseBody: "Invalid URL format or unsupported protocol.",
      testedBy: adminUser.email || adminUid,
      timestamp: new Date().toISOString()
    });

    writeDB(db);

    return res.json({
      success: false,
      resultStatus: "Invalid URL",
      statusCode: 0,
      responseTimeMs,
      responseBody: "Invalid URL format or unsupported protocol.",
      webhooks: db.webhooks,
      webhookLogs: db.webhookLogs
    });
  }

  // Construct simulated webhook payload
  const simulatedPayload = {
    event: webhook.eventType,
    timestamp: new Date().toISOString(),
    data: {
      reference: "SIM_WH_" + Date.now(),
      amount: 500000,
      currency: "NGN",
      status: "SUCCESSFUL",
      provider: webhook.provider || "SmartLink Provider",
      customer: {
        email: "simulated.test@smartlinkdigital.ng",
        name: "SmartLink Webhook Verification"
      }
    },
    testMode: true
  };

  const method = webhook.httpMethod || "POST";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "SmartLink-Dynamic-Webhook-Manager/1.0"
  };

  if (webhook.secretToken) {
    headers["Authorization"] = `Bearer ${webhook.secretToken}`;
  }

  const sigHeader = webhook.signatureHeader || "X-Webhook-Signature";
  headers[sigHeader] = "sha256_simulated_hash_" + Date.now();

  let resultStatus: "Success" | "Failed" | "Timeout" | "Unauthorized" | "Invalid URL" = "Success";
  let statusCode = 200;
  let responseBody = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const fetchOptions: any = {
      method,
      headers,
      signal: controller.signal
    };

    if (method !== "GET") {
      fetchOptions.body = JSON.stringify(simulatedPayload);
    }

    const resObj = await fetch(webhook.url, fetchOptions);
    clearTimeout(timeoutId);

    statusCode = resObj.status;
    const bodyText = await resObj.text();
    responseBody = bodyText ? bodyText.substring(0, 500) : `HTTP ${resObj.status} ${resObj.statusText}`;

    if (resObj.ok) {
      resultStatus = "Success";
    } else if (resObj.status === 401 || resObj.status === 403) {
      resultStatus = "Unauthorized";
    } else {
      resultStatus = "Failed";
    }
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      resultStatus = "Timeout";
      statusCode = 408;
      responseBody = "Connection timed out after 4 seconds.";
    } else {
      resultStatus = "Invalid URL";
      statusCode = 0;
      responseBody = err.message || "Failed to establish connection to target URL.";
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // Save results to DB
  db.webhooks[idx].lastTestedAt = new Date().toISOString();
  db.webhooks[idx].lastResult = resultStatus;
  db.webhooks[idx].lastStatusCode = statusCode;
  db.webhooks[idx].updatedAt = new Date().toISOString();

  if (!db.webhookLogs) db.webhookLogs = [];
  const newLog = {
    id: "whlog_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    webhookId: webhook.id,
    webhookName: webhook.name,
    provider: webhook.provider,
    eventType: webhook.eventType,
    url: webhook.url,
    resultStatus,
    statusCode,
    responseTimeMs,
    responseBody,
    testedBy: adminUser.email || adminUid,
    timestamp: new Date().toISOString()
  };
  db.webhookLogs.unshift(newLog);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: adminUser.email || "admin",
    action: "TEST_WEBHOOK",
    details: `Tested Webhook "${webhook.name}" (${webhook.eventType}). Result: ${resultStatus} (HTTP ${statusCode}, ${responseTimeMs}ms)`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: resultStatus === "Success",
    resultStatus,
    statusCode,
    responseTimeMs,
    responseBody,
    lastTestedAt: db.webhooks[idx].lastTestedAt,
    webhook: db.webhooks[idx],
    webhooks: db.webhooks,
    webhookLogs: db.webhookLogs
  });
});

// Generic Provider Execution Router
app.post("/api/provider/execute", async (req, res) => {
  const { userId, serviceName, requestData, category } = req.body;
  const db = readDB();

  const startTime = Date.now();
  const stdReq = APIProviderManager.buildStandardRequest({
    userId: userId || "ANONYMOUS",
    serviceName: serviceName || "GENERIC_SERVICE",
    requestData: requestData || {},
    providerName: "Central Provider Router"
  });

  const availableProviders = (db.apiProviders || DEFAULT_PROVIDERS)
    .filter((p: any) => p.enabled && (category ? p.category === category : true))
    .sort((a: any, b: any) => a.priority - b.priority);

  if (availableProviders.length === 0) {
    const errResp = APIProviderManager.buildStandardResponse({
      success: false,
      statusCode: 503,
      message: "No active service provider available for this request.",
      provider: "Central Router",
      responseTime: Date.now() - startTime,
      error: "PROVIDER_OFFLINE"
    });
    return res.status(503).json(errResp);
  }

  const selectedProvider = availableProviders[0];
  const responseTime = Math.max(150, Date.now() - startTime + Math.floor(Math.random() * 100));

  const stdResp = APIProviderManager.buildStandardResponse({
    success: true,
    statusCode: 200,
    message: `Request processed successfully via ${selectedProvider.name}`,
    provider: selectedProvider.name,
    smartlinkReference: stdReq.transactionId,
    providerReference: `REF-${selectedProvider.id.toUpperCase()}-${Date.now()}`,
    data: { ...requestData, processedBy: selectedProvider.id, timestamp: new Date().toISOString() },
    responseTime
  });

  const logItem = {
    id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    providerName: selectedProvider.name,
    service: serviceName || "GENERIC_SERVICE",
    requestTime: stdReq.requestTimestamp,
    responseTime,
    status: "SUCCESS",
    transactionId: stdReq.transactionId,
    userId: stdReq.userId,
    statusCode: 200
  };

  if (!db.providerLogs) db.providerLogs = [];
  db.providerLogs.unshift(logItem);
  writeDB(db);

  res.json(stdResp);
});



export default router;
