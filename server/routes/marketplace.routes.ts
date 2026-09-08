import express from "express";
import { readDB, writeDB } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { ServerWalletEngine } from "../../src/services/serverWalletEngine";
import * as usersStore from "../../src/services/usersStore";
import { syncToFirestore } from "../../src/services/settingsStore";

const router = express.Router();
const app = router;

// In-Memory Rate Limiter for Marketplace operations
const marketplaceRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkMarketplaceRateLimit(key: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = marketplaceRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    marketplaceRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

/**
 * 1. GET /api/marketplace/services
 * List active multi-vendor marketplace services.
 */
app.get("/api/marketplace/services", async (req, res) => {
  const db = readDB();
  const services = (db.vendorServices || []).filter((s: any) => s.isActive);
  
  // Clean sensitive internal attributes if any
  const sanitizedServices = services.map((s: any) => ({
    id: s.id,
    vendorId: s.vendorId,
    vendorName: s.vendorName,
    title: s.title,
    description: s.description,
    category: s.category,
    price: s.price,
    commissionPercent: s.commissionPercent,
    deliveryTime: s.deliveryTime,
    isActive: s.isActive,
    createdAt: s.createdAt,
  }));

  return res.json({ services: sanitizedServices });
});

/**
 * 2. POST /api/marketplace/services
 * Create/publish a new vendor service.
 * Secured with session auth, forged vendorId check, input validation, and rate limits.
 */
app.post("/api/marketplace/services", async (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  if (!checkMarketplaceRateLimit(`mkt_create_${clientIp}`, 15, 60000)) {
    return res.status(429).json({ error: "Marketplace creation rate limit exceeded. Please try again shortly." });
  }

  const { vendorId, vendorName, title, description, category, price, commissionPercent, deliveryTime } = req.body;

  if (!vendorId || !title || price === undefined || price === null) {
    return res.status(400).json({ error: "Missing required fields: vendorId, title, price." });
  }

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ error: "Invalid service price. Price must be a positive number." });
  }

  const db = readDB();

  // Verify authorization & reject forged vendorId
  const authCheck = await verifyUserOrAdminSession(req, vendorId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged vendorId or access denied." });
  }

  const effectiveVendorId = authCheck.isAdmin ? vendorId : authCheck.authenticatedUid!;

  // Retrieve vendor name if not provided
  let effectiveVendorName = vendorName;
  if (!effectiveVendorName) {
    const vendorUser = await usersStore.getUserById(effectiveVendorId);
    effectiveVendorName = vendorUser ? (vendorUser.fullName || vendorUser.email) : "Verified Vendor";
  }

  const serviceId = "srv_" + Math.random().toString(36).substring(2, 9);
  const newService = {
    id: serviceId,
    vendorId: effectiveVendorId,
    vendorName: effectiveVendorName,
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    category: category ? String(category).trim() : "GENERAL",
    price: numPrice,
    commissionPercent: Math.min(50, Math.max(0, parseInt(commissionPercent) || 10)),
    deliveryTime: deliveryTime || "24 Hours",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  if (!db.vendorServices) db.vendorServices = [];
  db.vendorServices.push(newService);
  writeDB(db);
  await syncToFirestore(db);

  return res.json({ success: true, service: newService });
});

/**
 * 3. POST /api/marketplace/buy
 * Purchase a service from another vendor.
 * Secured with session auth, forged userId check, self-purchase check, and atomic wallet transaction.
 */
app.post("/api/marketplace/buy", async (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  if (!checkMarketplaceRateLimit(`mkt_buy_${clientIp}`, 10, 60000)) {
    return res.status(429).json({ error: "Marketplace purchase rate limit exceeded. Please try again in a minute." });
  }

  const { userId, serviceId } = req.body;
  if (!userId || !serviceId) {
    return res.status(400).json({ error: "Missing required parameters: userId and serviceId." });
  }

  const db = readDB();

  // Verify session authentication & reject forged userId
  const authCheck = await verifyUserOrAdminSession(req, userId, db);
  if (!authCheck.authorized) {
    return res.status(403).json({ error: authCheck.reason || "Forbidden: Forged userId or access denied." });
  }

  const buyerUserId = authCheck.isAdmin ? userId : authCheck.authenticatedUid!;

  const service = (db.vendorServices || []).find((s: any) => s.id === serviceId);
  if (!service || !service.isActive) {
    return res.status(404).json({ error: "Marketplace service not found or no longer active." });
  }

  // Prevent self-purchases
  if (service.vendorId === buyerUserId) {
    return res.status(400).json({ error: "You cannot purchase your own vendor service." });
  }

  const price = service.price;
  const reference = "SML-MKT-" + Math.floor(100000 + Math.random() * 900000);

  try {
    // 1. Debit Buyer Wallet
    const debitRes = await ServerWalletEngine.debitWallet(db, {
      userId: buyerUserId,
      amount: price,
      serviceName: `Vendor Service: ${service.title}`,
      provider: service.vendorName,
      description: `Purchased Vendor Service: "${service.title}"`,
      reference,
      recipientDetails: service.vendorName,
      type: "VENDOR_PAYOUT",
    });

    // 2. Calculate platform commission & vendor payout
    const commissionPercent = service.commissionPercent || 10;
    const commission = Math.round((price * (commissionPercent / 100)) * 100) / 100;
    const vendorPayout = Math.max(0, price - commission);

    // 3. Credit Vendor Wallet
    await ServerWalletEngine.creditWallet(db, {
      userId: service.vendorId,
      amount: vendorPayout,
      serviceName: "Vendor Sale Payout",
      provider: "SmartLink Marketplace Engine",
      description: `Payout for service sale: "${service.title}" (Less ${commissionPercent}% platform commission)`,
      reference: "PAY-" + reference,
      type: "VENDOR_PAYOUT",
    });

    writeDB(db);
    return res.json({
      success: true,
      status: "SUCCESS",
      reference,
      service: {
        id: service.id,
        title: service.title,
        price: service.price,
        vendorName: service.vendorName,
      },
      balance: debitRes.wallet.currentBalance,
      transaction: debitRes.transaction,
    });
  } catch (err: any) {
    console.error("[Marketplace] Purchase failed:", err);
    return res.status(400).json({
      success: false,
      error: err.message || "Marketplace service purchase failed.",
      code: "MARKETPLACE_PURCHASE_FAILED",
    });
  }
});

export default router;
