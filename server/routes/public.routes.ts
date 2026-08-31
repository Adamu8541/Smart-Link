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

app.get("/api/health", async (req, res) => {
  try {
    const db = readDB();
    const users = await usersStore.getAllUsers();
    res.json({
      status: "ok",
      platform: "SmartLink Digital Core Services",
      version: "2.1.0",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        userCount: users?.length || 0,
        transactionCount: db.transactions?.length || 0,
      },
      services: {
        identityVerification: "OPERATIONAL",
        cacBusinessRegistration: "OPERATIONAL",
        vtuBillPayments: "OPERATIONAL",
        providerGatewayWebhooks: "OPERATIONAL",
        paystackWebhooks: "OPERATIONAL",
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Health check failed" });
  }
});

// 1. Auth & Profiles


// =========================================================================
// PUBLIC & CLIENT CONFIGURATION SYNC
// =========================================================================

app.get("/api/public/settings", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);
  const mDetails = getMaintenanceDetails(db);
  const sanitized = sanitizePublicSettings(db, mDetails);
  return res.json(sanitized);
});

app.get("/api/site/settings", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);
  const mDetails = getMaintenanceDetails(db);
  const sanitized = sanitizePublicSettings(db, mDetails);
  return res.json(sanitized);
});

app.get("/api/maintenance/status", async (req, res) => {
  const db = readDB();
  await syncFromFirestore(db);
  const mDetails = getMaintenanceDetails(db);
  return res.json({
    success: true,
    maintenanceMode: mDetails.maintenanceMode,
    maintenanceMessage: mDetails.maintenanceMessage,
    details: mDetails,
  });
});

app.post("/api/admin/maintenance/toggle", async (req, res) => {
  const { enabled, message, scheduledEndTime } = req.body;
  const sessionToken = (req.headers["x-admin-token"] as string);
  const db = readDB();
  await syncFromFirestore(db);

  const val = await adminAuthService.validateSession(db, sessionToken || "");
  if (!val.valid || !val.session) {
    return res.status(401).json({ success: false, message: "Unauthorized admin access." });
  }

  if (!adminAuthService.hasPermission(val.session, "MANAGE_SYSTEM_SETTINGS")) {
    return res.status(403).json({ success: false, message: "Permission Denied: MANAGE_SYSTEM_SETTINGS required." });
  }

  if (!db.maintenance_settings) db.maintenance_settings = {};
  db.maintenance_settings.maintenanceMode = Boolean(enabled);
  if (message) db.maintenance_settings.maintenanceMessage = message;
  if (scheduledEndTime !== undefined) db.maintenance_settings.scheduledEndTime = scheduledEndTime;
  db.maintenance_settings.updatedAt = new Date().toISOString();
  db.maintenance_settings.updatedBy = val.session.email;

  if (db.site_settings) {
    db.site_settings.maintenanceMode = Boolean(enabled);
    if (message) db.site_settings.maintenanceMessage = message;
  }

  writeDB(db);
  await syncToFirestore(db);

  return res.json({
    success: true,
    message: `Maintenance mode ${enabled ? "enabled" : "disabled"}.`,
    maintenance: getMaintenanceDetails(db),
  });
});



export default router;
