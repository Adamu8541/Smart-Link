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

app.post("/api/admin/settings", async (req, res) => {
  const { settings } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN" && !admin.permissions?.includes("manage_theme")) {
    return res.status(403).json({ error: "Unauthorized. Super Admin or theme management permission required." });
  }

  db.siteSettings = { ...db.siteSettings, ...settings };

  // Add Audit Log
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "UPDATE_SITE_SETTINGS",
    details: "Updated website theme, banner, or maintenance mode",
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, settings: db.siteSettings });
});

app.get("/api/site/prices", async (req, res) => {
  const db = readDB();
  res.json({ priceMatrix: db.priceMatrix || {} });
});

app.post("/api/admin/prices", async (req, res) => {
  const { priceMatrix } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN" && !admin.permissions?.includes("manage_prices")) {
    return res.status(403).json({ error: "Unauthorized. Permission 'manage_prices' required." });
  }

  db.priceMatrix = { ...db.priceMatrix, ...priceMatrix };

  if (!db.systemSettings) db.systemSettings = {};
  if (priceMatrix.identityRates?.ninFee !== undefined) {
    db.systemSettings.ninFee = priceMatrix.identityRates.ninFee;
  }
  if (priceMatrix.identityRates?.bvnFee !== undefined) {
    db.systemSettings.bvnFee = priceMatrix.identityRates.bvnFee;
  }
  if (priceMatrix.cacRates?.businessNameFee !== undefined) {
    db.systemSettings.cacBaseFee = priceMatrix.cacRates.businessNameFee;
  }

  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid,
    adminEmail: admin.email,
    action: "UPDATE_PRICES",
    details: "Updated global service pricing matrix for NIN, CAC, VTU, Utility, and Exam Scratch Cards",
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, priceMatrix: db.priceMatrix, systemSettings: db.systemSettings });
});

// --- USER MANAGEMENT ENDPOINTS ---


// --- SERVICES & PRICING CATALOG MANAGEMENT ENDPOINTS ---

// 1. GET /api/admin/services - List Services Catalog
app.get("/api/admin/services", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);
  seedDefaultServicesCatalogIfEmpty(db);

  const allTxns = (db.transactions || []).concat(db.wallet_transactions || []);
  
  // Compute live totalVolume for each service from actual transaction history
  db.servicesCatalog.forEach((s: any) => {
    const liveVolume = allTxns.filter((t: any) => {
      const isSuccess = t.status === "SUCCESS" || t.status === "SUCCESSFUL" || t.status === "COMPLETED";
      if (!isSuccess) return false;
      const matchCode = t.serviceCode && t.serviceCode.toUpperCase() === s.code?.toUpperCase();
      const matchService = t.service && (t.service.toUpperCase() === s.code?.toUpperCase() || t.service.toUpperCase() === s.id?.toUpperCase());
      const matchType = t.type && s.code && t.type.toUpperCase().includes(s.code.toUpperCase());
      return matchCode || matchService || matchType;
    }).reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    s.totalVolume = liveVolume;
  });

  const { search = "", category = "ALL", status = "ALL", provider = "ALL", page = "1", limit = "15" } = req.query;

  let filtered = [...db.servicesCatalog];

  if (category && category !== "ALL") {
    filtered = filtered.filter((s: any) => s.category === category);
  }

  if (status && status !== "ALL") {
    if (status === "ACTIVE") filtered = filtered.filter((s: any) => s.isActive);
    if (status === "INACTIVE" || status === "HIDDEN") filtered = filtered.filter((s: any) => !s.isActive);
  }

  if (provider && provider !== "ALL") {
    filtered = filtered.filter((s: any) => s.provider?.toLowerCase().includes((provider as string).toLowerCase()));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.provider?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a: any, b: any) => (a.displayOrder || 99) - (b.displayOrder || 99));

  const total = filtered.length;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 15;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const activeServices = db.servicesCatalog.filter((s: any) => s.isActive).length;
  const hiddenServices = db.servicesCatalog.filter((s: any) => !s.isActive).length;
  const avgCommission = (
    db.servicesCatalog.reduce((acc: number, curr: any) => acc + (curr.commissionRate || 0), 0) /
    (db.servicesCatalog.length || 1)
  ).toFixed(1);
  const totalVolume = db.servicesCatalog.reduce((acc: number, curr: any) => acc + (curr.totalVolume || 0), 0);

  res.json({
    success: true,
    services: paginated,
    pagination: {
      totalRecords: total,
      pageNum,
      limitNum,
      totalPages,
    },
    metrics: {
      totalServices: db.servicesCatalog.length,
      activeServices,
      hiddenServices,
      avgCommissionRate: parseFloat(avgCommission),
      totalVolume,
    },
    categories: [
      { key: "ALL", label: "All Categories" },
      { key: "IDENTITY_VERIFICATION", label: "Identity Verification" },
      { key: "TELECOM_VTU", label: "Telecom & Airtime VTU" },
      { key: "UTILITY_BILLS", label: "Electricity & Cable TV" },
      { key: "EDUCATION_RESULT_PINS", label: "Education E-Pins" },
    ],
  });
});

// Public GET /api/services — List Active Services & Real-Time Pricing (No Auth Required)
app.get("/api/services", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);
  seedDefaultServicesCatalogIfEmpty(db);
  const activeServices = (db.servicesCatalog || []).filter((s: any) => s.isActive);
  res.json({
    success: true,
    services: activeServices,
    allServices: db.servicesCatalog,
  });
});

// 2. POST /api/admin/services - Add New Service
app.post("/api/admin/services", async (req, res) => {
  const { service } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  if (!service || !service.name || !service.code) {
    return res.status(400).json({ error: "Service Name and Unique Service Code are required." });
  }

  const existingCode = db.servicesCatalog.find((s: any) => s.code.toUpperCase() === service.code.toUpperCase());
  if (existingCode) {
    return res.status(400).json({ error: `Service code '${service.code}' already exists.` });
  }

  const newService = {
    id: "svc_" + service.code.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(Math.random() * 1000),
    code: service.code.toUpperCase(),
    name: service.name,
    category: service.category || "IDENTITY_VERIFICATION",
    description: service.description || "",
    provider: service.provider || "SmartLink Gateway Direct",
    costPrice: parseFloat(service.costPrice) || 0,
    sellingFee: parseFloat(service.sellingFee) || 0,
    serviceCharge: parseFloat(service.serviceCharge) || 0,
    commissionRate: parseFloat(service.commissionRate) || 0,
    isActive: typeof service.isActive === "boolean" ? service.isActive : true,
    displayOrder: parseInt(service.displayOrder, 10) || db.servicesCatalog.length + 1,
    icon: service.icon || "CheckSquare",
    totalVolume: 0,
    updatedAt: new Date().toISOString(),
  };

  db.servicesCatalog.push(newService);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "ADD_NEW_SERVICE",
    details: `Added new service "${newService.name}" (${newService.code}) in category ${newService.category}`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({ success: true, service: newService, message: `Service '${newService.name}' added successfully.` });
});

// 3. PUT /api/admin/services/:id - Edit Existing Service
app.put("/api/admin/services/:id", async (req, res) => {
  const { id } = req.params;
  const { service } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  const idx = db.servicesCatalog.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Service not found in catalog." });
  }

  const existing = db.servicesCatalog[idx];
  const updated = {
    ...existing,
    ...service,
    costPrice: service.costPrice !== undefined ? parseFloat(service.costPrice) : existing.costPrice,
    sellingFee: service.sellingFee !== undefined ? parseFloat(service.sellingFee) : existing.sellingFee,
    serviceCharge: service.serviceCharge !== undefined ? parseFloat(service.serviceCharge) : existing.serviceCharge,
    commissionRate: service.commissionRate !== undefined ? parseFloat(service.commissionRate) : existing.commissionRate,
    displayOrder: service.displayOrder !== undefined ? parseInt(service.displayOrder, 10) : existing.displayOrder,
    updatedAt: new Date().toISOString(),
  };

  db.servicesCatalog[idx] = updated;

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "EDIT_SERVICE",
    details: `Updated service configuration for "${updated.name}" (${updated.code})`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({ success: true, service: updated, message: `Service '${updated.name}' updated successfully.` });
});

// 4. DELETE /api/admin/services/:id - Delete Service
app.delete("/api/admin/services/:id", async (req, res) => {
  const { id } = req.params;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  const idx = db.servicesCatalog.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Service not found." });
  }

  const removed = db.servicesCatalog.splice(idx, 1)[0];

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "DELETE_SERVICE",
    details: `Deleted service "${removed.name}" (${removed.code}) from catalog`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({ success: true, message: `Service '${removed.name}' removed from catalog.` });
});

// 5. POST /api/admin/services/:id/toggle - Toggle Service Status (Active / Hidden)
app.post("/api/admin/services/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  const idx = db.servicesCatalog.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Service not found." });
  }

  const newStatus = typeof isActive === "boolean" ? isActive : !db.servicesCatalog[idx].isActive;
  db.servicesCatalog[idx].isActive = newStatus;
  db.servicesCatalog[idx].updatedAt = new Date().toISOString();

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "TOGGLE_SERVICE_STATUS",
    details: `${newStatus ? "Activated" : "Deactivated/Hidden"} service "${db.servicesCatalog[idx].name}" (${db.servicesCatalog[idx].code})`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({
    success: true,
    isActive: newStatus,
    message: `Service '${db.servicesCatalog[idx].name}' is now ${newStatus ? "ACTIVE" : "HIDDEN / INACTIVE"}.`,
  });
});

// 6. POST /api/admin/services/reorder - Reorder Services
app.post("/api/admin/services/reorder", async (req, res) => {
  const { orders } = req.body; // orders: Array<{ id: string, displayOrder: number }>
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: "Orders array required." });
  }

  orders.forEach((item: any) => {
    const s = db.servicesCatalog.find((x: any) => x.id === item.id);
    if (s) {
      s.displayOrder = item.displayOrder;
      s.updatedAt = new Date().toISOString();
    }
  });

  db.servicesCatalog.sort((a: any, b: any) => (a.displayOrder || 99) - (b.displayOrder || 99));

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "REORDER_SERVICES",
    details: `Reordered ${orders.length} services in the catalog display hierarchy`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({ success: true, message: "Service display order updated successfully.", services: db.servicesCatalog });
});

// 7. POST /api/admin/services/:id/pricing - Update Pricing, Commissions & Service Charges
app.post("/api/admin/services/:id/pricing", async (req, res) => {
  const { id } = req.params;
  const { costPrice, sellingFee, serviceCharge, commissionRate } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string) ;
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const admin = val.session;
  const adminUid = admin.uid;

  seedDefaultServicesCatalogIfEmpty(db);

  const idx = db.servicesCatalog.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Service not found." });
  }

  const s = db.servicesCatalog[idx];
  if (costPrice !== undefined) s.costPrice = parseFloat(costPrice);
  if (sellingFee !== undefined) s.sellingFee = parseFloat(sellingFee);
  if (serviceCharge !== undefined) s.serviceCharge = parseFloat(serviceCharge);
  if (commissionRate !== undefined) s.commissionRate = parseFloat(commissionRate);
  s.updatedAt = new Date().toISOString();

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: adminUid || "SYSTEM",
    adminEmail: admin?.email || "adamuamuhammad8541@gmail.com",
    action: "UPDATE_SERVICE_PRICING",
    details: `Updated pricing & commission rates for "${s.name}": Selling Fee ₦${s.sellingFee}, Service Charge ₦${s.serviceCharge}, Commission ${s.commissionRate}%`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToFirestore(db);
  res.json({ success: true, service: s, message: `Pricing updated for '${s.name}'.` });
});



// Marketplace routes are handled in marketplace.routes.ts with authentication and validation

// 7.5 Contact Admin Form Submission
app.post("/api/contact/submit", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required fields" });
  }

  const db = readDB();
  if (!db.contactInquiries) {
    db.contactInquiries = [];
  }

  const inquiryId = "inq_" + Math.random().toString(36).substring(2, 9);
  const newInquiry = {
    id: inquiryId,
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  db.contactInquiries.push(newInquiry);
  writeDB(db);

  res.json({
    success: true,
    message: "Your message has been received. Thank you for contacting Smart Link!",
    inquiry: newInquiry,
  });
});

// 8. AI ASSISTANT, ADVISOR & AUTOMATION ENGINES
// AI Chatbot


export default router;
