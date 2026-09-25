import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { requireAdmin, optionalAdmin, verifyUserOrAdminSession } from "../middleware/auth";
import { isMaintenanceModeActive, getMaintenanceDetails, getValueByJsonPath, seedModule7SettingsIfEmpty, sanitizePublicSettings } from "../middleware/maintenance";
import { getAI } from "../services/ai";
import { sendPlatformEmail } from "../services/email.service";
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
import { getActiveProviderAndAdapter, getAdapterForProvider } from "../../src/services/providerConnector";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { MultiProviderRoutingEngine } from "../../src/services/multiProviderRoutingEngine";
import { syncFromStorage, syncToStorage } from "../../src/services/settingsStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";


const router = express.Router();
const app = router;

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  const { settings } = req.body;
  const db = readDB();
  await syncFromStorage(db);

  db.siteSettings = { ...db.siteSettings, ...settings };

  // Add Audit Log
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminEmail: (req as any).adminEmail || "Admin",
    action: "UPDATE_SITE_SETTINGS",
    details: "Updated website theme, banner, or maintenance mode",
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, settings: db.siteSettings });
});

app.get("/api/site/prices", async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);
  res.json({ priceMatrix: db.priceMatrix || {} });
});

app.post("/api/admin/prices", requireAdmin, async (req, res) => {
  const { priceMatrix } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, priceMatrix: db.priceMatrix, systemSettings: db.systemSettings });
});

// --- USER MANAGEMENT ENDPOINTS ---


// --- SERVICES & PRICING CATALOG MANAGEMENT ENDPOINTS ---

// 1. GET /api/admin/services - List Services Catalog
app.get("/api/admin/services", optionalAdmin, async (req, res) => {
  const db = readDB();
  await syncFromStorage(db);
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
  await syncFromStorage(db);
  seedDefaultServicesCatalogIfEmpty(db);
  const activeServices = (db.servicesCatalog || []).filter((s: any) => s.isActive);
  res.json({
    success: true,
    services: activeServices,
    allServices: db.servicesCatalog,
  });
});

// 2. POST /api/admin/services - Add New Service
app.post("/api/admin/services", requireAdmin, async (req, res) => {
  const { service } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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
    provider: service.provider || "SmartLink Portal Direct",
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
    adminEmail: (req as any).adminEmail || "Admin",
    action: "ADD_NEW_SERVICE",
    details: `Added new service "${newService.name}" (${newService.code}) in category ${newService.category}`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, service: newService, message: `Service '${newService.name}' added successfully.` });
});

// 3. PUT /api/admin/services/:id - Edit Existing Service
app.put("/api/admin/services/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { service } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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
    adminEmail: (req as any).adminEmail || "Admin",
    action: "EDIT_SERVICE",
    details: `Updated service configuration for "${updated.name}" (${updated.code})`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, service: updated, message: `Service '${updated.name}' updated successfully.` });
});

// 4. DELETE /api/admin/services/:id - Delete Service
app.delete("/api/admin/services/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  await syncFromStorage(db);

  seedDefaultServicesCatalogIfEmpty(db);

  const idx = db.servicesCatalog.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Service not found." });
  }

  const removed = db.servicesCatalog.splice(idx, 1)[0];

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminEmail: (req as any).adminEmail || "Admin",
    action: "DELETE_SERVICE",
    details: `Deleted service "${removed.name}" (${removed.code}) from catalog`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, message: `Service '${removed.name}' removed from catalog.` });
});

// 5. POST /api/admin/services/:id/toggle - Toggle Service Status (Active / Hidden)
app.post("/api/admin/services/:id/toggle", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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
    adminEmail: (req as any).adminEmail || "Admin",
    action: "TOGGLE_SERVICE_STATUS",
    details: `${newStatus ? "Activated" : "Deactivated/Hidden"} service "${db.servicesCatalog[idx].name}" (${db.servicesCatalog[idx].code})`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({
    success: true,
    isActive: newStatus,
    message: `Service '${db.servicesCatalog[idx].name}' is now ${newStatus ? "ACTIVE" : "HIDDEN / INACTIVE"}.`,
  });
});

// 6. POST /api/admin/services/reorder - Reorder Services
app.post("/api/admin/services/reorder", requireAdmin, async (req, res) => {
  const { orders } = req.body; // orders: Array<{ id: string, displayOrder: number }>
  const db = readDB();
  await syncFromStorage(db);

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
    adminEmail: (req as any).adminEmail || "Admin",
    action: "REORDER_SERVICES",
    details: `Reordered ${orders.length} services in the catalog display hierarchy`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, message: "Service display order updated successfully.", services: db.servicesCatalog });
});

// 7. POST /api/admin/services/:id/pricing - Update Pricing, Commissions & Service Charges
app.post("/api/admin/services/:id/pricing", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { costPrice, sellingFee, serviceCharge, commissionRate } = req.body;
  const db = readDB();
  await syncFromStorage(db);

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
    adminEmail: (req as any).adminEmail || "Admin",
    action: "UPDATE_SERVICE_PRICING",
    details: `Updated pricing & commission rates for "${s.name}": Selling Fee ₦${s.sellingFee}, Service Charge ₦${s.serviceCharge}, Commission ${s.commissionRate}%`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  await syncToStorage(db);
  res.json({ success: true, service: s, message: `Pricing updated for '${s.name}'.` });
});



// Marketplace routes are handled in marketplace.routes.ts with authentication and validation

// 7.5 Contact Admin Form Submission with CAC-style Email Template Dispatch
app.post("/api/contact/submit", async (req, res) => {
  const { name, email, phone, phoneNumber, subject, department, message } = req.body;
  
  const senderName = (name || "").trim();
  const senderEmail = (email || "").toLowerCase().trim();
  const senderPhone = (phone || phoneNumber || "").trim();
  const inquirySubject = (subject || department || "General Service Inquiry").trim();
  const inquiryMessage = (message || "").trim();

  if (!senderName || !senderEmail || !inquiryMessage) {
    return res.status(400).json({ error: "Name, email, and message are required fields." });
  }

  const db = readDB();
  if (!db.contactInquiries) {
    db.contactInquiries = [];
  }

  const timestamp = new Date().toISOString();
  const formattedDate = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const inquiryRef = `INQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const newInquiry = {
    id: inquiryRef,
    reference: inquiryRef,
    name: senderName,
    email: senderEmail,
    phone: senderPhone || "N/A",
    subject: inquirySubject,
    message: inquiryMessage,
    status: "UNREAD",
    createdAt: timestamp,
  };

  db.contactInquiries.unshift(newInquiry);
  writeDB(db);

  // 1. Build CAC-Style Email Template for Admin/Support Desk
  const adminTargetEmail = 
    process.env.ADMIN_NOTIFY_EMAIL || 
    process.env.SUPPORT_EMAIL || 
    process.env.SUPER_ADMIN_EMAIL ||
    db.system_settings?.email?.replyToAddress || 
    "support@smartlink.ng";

  const adminNotificationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Inquiry - ${inquiryRef}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #F1F5F9; margin: 0; padding: 24px 12px;">
      <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header: Deep Navy Brand Header matching CAC filing emails -->
        <div style="background: linear-gradient(135deg, #0F2D5C 0%, #081B3A 100%); padding: 28px 24px; text-align: left; border-bottom: 3px solid #D4AF37;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px;">
              SmartLink NG • Official Support Portal
            </span>
            <span style="background: rgba(212, 175, 55, 0.2); color: #FDE047; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 1px solid rgba(212, 175, 55, 0.4);">
              ${inquiryRef}
            </span>
          </div>
          <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
            New Customer Inquiry Received
          </h1>
          <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 13px;">
            Category: <strong style="color: #FFFFFF;">${inquirySubject}</strong>
          </p>
        </div>

        <div style="padding: 24px;">

          <!-- Sender Overview Card -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 22px;">
            <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; color: #0F2D5C; font-weight: 800; letter-spacing: 0.8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
              Customer & Contact Information
            </h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748B; width: 35%; font-weight: 600;">Full Name:</td>
                <td style="padding: 6px 0; color: #0F172A; font-weight: 700;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Email Address:</td>
                <td style="padding: 6px 0; color: #0F2D5C; font-weight: 700;">
                  <a href="mailto:${senderEmail}" style="color: #0F2D5C; text-decoration: underline;">${senderEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Phone / WhatsApp:</td>
                <td style="padding: 6px 0; color: #0F172A; font-weight: 600;">${senderPhone || "Not provided"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Inquiry Reference:</td>
                <td style="padding: 6px 0; color: #0F172A; font-family: monospace; font-weight: 700;">${inquiryRef}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Received At:</td>
                <td style="padding: 6px 0; color: #475569;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Message Body Block -->
          <div style="margin-bottom: 22px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0F2D5C; font-weight: 800; border-bottom: 2px solid #0F2D5C; padding-bottom: 6px;">
              Inquiry / Message Details
            </h3>
            <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 18px; font-size: 14px; color: #1E293B; line-height: 1.7; white-space: pre-wrap;">${inquiryMessage}</div>
          </div>

          <!-- Action Notice -->
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 700;">
              ✓ You can reply directly to this email to respond to ${senderName}.
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803D;">
              The sender's email (${senderEmail}) is set as the direct Reply-To address.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; padding: 18px 24px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B;">
          <p style="margin: 0; font-weight: 600; color: #334155;">
            Smart Link Computer Business (RC 9347502) • Automated Communications Desk
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8;">
            Secured under Nigeria Data Protection Act (NDPA) 2023. Delivered to: ${adminTargetEmail}
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  // 2. Build Customer Acknowledgment Email Template
  const customerAckHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>We Received Your Message - ${inquiryRef}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #F1F5F9; margin: 0; padding: 24px 12px;">
      <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0F2D5C 0%, #081B3A 100%); padding: 28px 24px; text-align: left; border-bottom: 3px solid #D4AF37;">
          <span style="font-size: 11px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px;">
            SmartLink NG • Official Confirmation
          </span>
          <h1 style="color: #FFFFFF; margin: 6px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
            Thank you for contacting SmartLink Nigeria
          </h1>
          <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 13px;">
            We have received your message and assigned tracking ticket: <strong style="color: #FDE047;">${inquiryRef}</strong>
          </p>
        </div>

        <div style="padding: 24px;">

          <p style="font-size: 14px; color: #334155; margin-top: 0;">
            Hello <strong>${senderName}</strong>,
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.7;">
            Thank you for reaching out to <strong>Smart Link Nigeria</strong>. Our support team and operations desk have logged your inquiry under reference <strong>${inquiryRef}</strong>.
          </p>

          <!-- Status Card -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #0F2D5C; font-weight: 800; letter-spacing: 0.5px;">
              Summary of Your Submission
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Ticket Reference:</strong> <code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${inquiryRef}</code></p>
            <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Department / Subject:</strong> ${inquirySubject}</p>
            <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Date:</strong> ${formattedDate}</p>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E2E8F0;">
              <strong style="font-size: 12px; color: #64748B;">Message Excerpt:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #1E293B; font-style: italic;">"${inquiryMessage.length > 200 ? inquiryMessage.substring(0, 200) + '...' : inquiryMessage}"</p>
            </div>
          </div>

          <!-- Turnaround Promise -->
          <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1E40AF; font-weight: 600;">
              ⏱ Estimated Response Time: Within 1 - 2 Hours
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #3B82F6;">
              Our specialized officers attend to customer inquiries promptly during active business hours.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            If your request requires urgent live assistance regarding a pending CAC filing, identity verification, or automated wallet funding, you may also connect directly via our official WhatsApp desk:
          </p>

          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="https://wa.me/2349047738212?text=Hello%20SmartLink%20Support,%20I%20have%20an%20inquiry%20regarding%20ticket%20${inquiryRef}" 
               style="display: inline-block; background-color: #0F2D5C; color: #FFFFFF; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px;">
              Chat on WhatsApp (+234 904 773 8212)
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; padding: 18px 24px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B;">
          <p style="margin: 0; font-weight: 600; color: #334155;">
            Smart Link Computer Business (CAC RC 9347502)
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8;">
            Nigeria Data Protection Act (NDPA) 2023 Compliant • Official Communications Desk
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  // 3. Dispatch Live SMTP Emails in background
  try {
    // Dispatch to admin
    sendPlatformEmail({
      to: adminTargetEmail,
      subject: `[INQUIRY - ${inquiryRef}] ${inquirySubject} - from ${senderName}`,
      html: adminNotificationHtml,
      replyTo: senderEmail,
      senderName: "SmartLink Support Desk",
    }).catch((err) => console.warn("[Contact Dispatcher] Admin email dispatch note:", err?.message));

    // Dispatch acknowledgment to sender
    sendPlatformEmail({
      to: senderEmail,
      subject: `[SmartLink NG] Inquiry Received - ${inquiryRef}`,
      html: customerAckHtml,
      senderName: "SmartLink NG Support",
    }).catch((err) => console.warn("[Contact Dispatcher] Customer ack email dispatch note:", err?.message));
  } catch (mailErr: any) {
    console.warn("[Contact Dispatcher] Background mailer note:", mailErr?.message);
  }

  res.json({
    success: true,
    message: "Your message has been received successfully! Our team will get back to you shortly.",
    reference: inquiryRef,
    inquiry: newInquiry,
  });
});

// Admin Inquiries API Endpoints
app.get("/api/admin/contact-inquiries", async (req, res) => {
  const db = readDB();
  const inquiries = db.contactInquiries || [];
  res.json({ success: true, inquiries });
});

app.patch("/api/admin/contact-inquiries/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDB();
  if (!db.contactInquiries) db.contactInquiries = [];

  const index = db.contactInquiries.findIndex((i: any) => i.id === id || i.reference === id);
  if (index === -1) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  if (status) {
    db.contactInquiries[index].status = status;
  }
  writeDB(db);

  res.json({ success: true, inquiry: db.contactInquiries[index] });
});

app.delete("/api/admin/contact-inquiries/:id", async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.contactInquiries) db.contactInquiries = [];

  db.contactInquiries = db.contactInquiries.filter((i: any) => i.id !== id && i.reference !== id);
  writeDB(db);

  res.json({ success: true, message: "Inquiry deleted successfully" });
});

// 8. AI ASSISTANT, ADVISOR & AUTOMATION ENGINES
// AI Chatbot


export default router;
