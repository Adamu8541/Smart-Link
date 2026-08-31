import express from "express";
import { readDB } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { getOrCreateUserVirtualAccount } from "../services/sharedHelpers";

const router = express.Router();
const app = router;

// In-Memory Rate Limiter for Virtual Account operations
const virtualAccountRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkVirtualAccountRateLimit(key: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = virtualAccountRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    virtualAccountRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

/**
 * Sanitize virtual account response to ensure no sensitive provider keys are exposed.
 */
function sanitizeVirtualAccountResponse(accountData: any) {
  if (!accountData) return null;
  return {
    accountNumber: accountData.accountNumber || accountData.virtualAccountNumber || "",
    accountName: accountData.accountName || accountData.virtualAccountName || "",
    bankName: accountData.bankName || accountData.virtualBankName || "",
    reference: accountData.reference || accountData.virtualAccountReference || "",
    provider: accountData.provider || accountData.providerName || "SmartLink Reserved Account",
    createdAt: accountData.createdAt || new Date().toISOString(),
  };
}

/**
 * 1. POST /api/virtual-account/create
 * Generate or retrieve reserved virtual account for a user.
 * Secured with session auth, forged userId rejection, and rate limits.
 */
app.post("/api/virtual-account/create", async (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  if (!checkVirtualAccountRateLimit(`va_create_${clientIp}`, 10, 60000)) {
    return res.status(429).json({ error: "Virtual account request rate limit exceeded. Please wait a minute." });
  }

  const { userId, userEmail, userName } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter: userId" });
  }

  const db = readDB();

  // Verify authentication and reject forged userId
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged userId or access denied." });
  }

  const effectiveUserId = authCheck.isAdmin ? userId : authCheck.authenticatedUid!;

  const result = await getOrCreateUserVirtualAccount(effectiveUserId, { email: userEmail, fullName: userName });
  if (!result.success) {
    return res.status(result.code === "NO_ACTIVE_PROVIDER" ? 400 : 502).json({
      success: false,
      error: result.error || "Failed to generate virtual account from provider.",
      code: result.code || "VIRTUAL_ACCOUNT_FAILED",
    });
  }

  const cleanAccount = sanitizeVirtualAccountResponse(result.account || result.virtualAccount);

  return res.json({
    success: true,
    isDuplicatePrevented: !!result.isExisting,
    message: result.isExisting ? "Existing reserved virtual account retrieved." : "Reserved virtual account created successfully.",
    virtualAccount: cleanAccount,
    account: cleanAccount,
  });
});

/**
 * 2. GET /api/virtual-account/:userId
 * Get existing reserved virtual account for target userId.
 * Secured with session auth & forged userId check.
 */
app.get("/api/virtual-account/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "Missing required userId parameter." });
  }

  const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  if (!checkVirtualAccountRateLimit(`va_read_${clientIp}`, 15, 60000)) {
    return res.status(429).json({ error: "Rate limit exceeded. Please try again shortly." });
  }

  const db = readDB();

  // Verify authentication & reject forged userId
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged userId or access denied." });
  }

  const effectiveUserId = authCheck.isAdmin ? userId : authCheck.authenticatedUid!;

  const result = await getOrCreateUserVirtualAccount(effectiveUserId);
  if (!result.success) {
    return res.status(404).json({
      success: false,
      message: result.error || "No virtual account found for user.",
      code: result.code || "NOT_FOUND",
    });
  }

  const cleanAccount = sanitizeVirtualAccountResponse(result.account || result.virtualAccount);

  return res.json({
    success: true,
    virtualAccount: cleanAccount,
    account: cleanAccount,
  });
});

/**
 * 3. GET /api/wallet/virtual-account/:userId
 * Secondary endpoint alias for wallet reserved virtual accounts.
 * Secured with session auth & forged userId check.
 */
app.get("/api/wallet/virtual-account/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "Missing required userId parameter." });
  }

  const db = readDB();

  // Verify authentication & reject forged userId
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged userId or access denied." });
  }

  const effectiveUserId = authCheck.isAdmin ? userId : authCheck.authenticatedUid!;

  const result = await getOrCreateUserVirtualAccount(effectiveUserId);
  if (!result.success) {
    return res.status(result.code === "NO_ACTIVE_PROVIDER" ? 400 : 502).json({
      success: false,
      error: result.error || "No virtual account available.",
      code: result.code || "FAILED",
    });
  }

  const cleanAccount = sanitizeVirtualAccountResponse(result.account || result.virtualAccount);

  return res.json({
    success: true,
    virtualAccount: cleanAccount,
    account: cleanAccount,
  });
});

/**
 * 4. POST /api/wallet/virtual-account/generate
 * Dedicated route for instant generation/regeneration of virtual accounts.
 * Secured with session auth & forged userId check.
 */
app.post("/api/wallet/virtual-account/generate", async (req, res) => {
  const { userId, bvn, nin } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter: userId" });
  }

  const db = readDB();

  // Verify authentication & reject forged userId
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged userId or access denied." });
  }

  const effectiveUserId = authCheck.isAdmin ? userId : authCheck.authenticatedUid!;

  const result = await getOrCreateUserVirtualAccount(effectiveUserId, { bvn, nin });
  if (!result.success) {
    return res.status(result.code === "NO_ACTIVE_PROVIDER" ? 400 : 502).json({
      success: false,
      error: result.error || "Failed to generate virtual account.",
      code: result.code || "GENERATE_FAILED",
    });
  }

  const cleanAccount = sanitizeVirtualAccountResponse(result.account || result.virtualAccount);

  return res.json({
    success: true,
    message: "Reserved virtual account generated successfully.",
    virtualAccount: cleanAccount,
    account: cleanAccount,
  });
});

export default router;
