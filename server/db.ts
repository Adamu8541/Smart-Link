/**
 * Core Database & Storage Module
 * Manages local JSON persistence and Firestore synchronization.
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { loadFirestoreDb, syncDbToFirestore, saveDocToFirestore } from "../src/services/firestoreStore";
import { adminAuthService } from "../src/services/adminAuthService";

dotenv.config();

// Database directories and file paths
export const IS_VERCEL = Boolean(process.env.VERCEL);
export const DB_DIR = IS_VERCEL ? "/tmp" : path.join(process.cwd(), "src", "data");
export const DB_FILE = IS_VERCEL ? path.join("/tmp", "db.json") : path.join(DB_DIR, "db.json");
export const UPLOADS_DIR = path.join(DB_DIR, "uploads");

// Admin credentials from environment variables
if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_EMAIL.trim()) {
  throw new Error("SUPER_ADMIN_EMAIL environment variable is not set");
}
if (!process.env.SUPER_ADMIN_PASSWORD || !process.env.SUPER_ADMIN_PASSWORD.trim()) {
  throw new Error("SUPER_ADMIN_PASSWORD environment variable is not set");
}
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL.toLowerCase().trim();
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD.trim();

export function hashPassword(password: string, salt?: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, storedHash: string, salt?: string): { match: boolean; needsUpgrade: boolean } {
  if (!password || !storedHash) return { match: false, needsUpgrade: false };
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    try {
      const match = bcrypt.compareSync(password, storedHash);
      return { match, needsUpgrade: false };
    } catch {
      return { match: false, needsUpgrade: false };
    }
  }
  if (salt) {
    try {
      const legacyHash = crypto.createHash("sha256").update(password + salt).digest("hex");
      if (safeCompareHash(legacyHash, storedHash)) {
        return { match: true, needsUpgrade: true };
      }
    } catch {}
  }
  if (storedHash === password) {
    return { match: true, needsUpgrade: true };
  }
  return { match: false, needsUpgrade: false };
}

export function safeCompareHash(providedHash: string, storedHash: string): boolean {
  if (!providedHash || !storedHash) return false;
  try {
    const bufferA = Buffer.from(providedHash, "utf8");
    const bufferB = Buffer.from(storedHash, "utf8");
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Robust regex helper to detect UI masking place-markers
 * (e.g. pure asterisks '********', bullets '••••••••', fragments like 'sk_live_****', 'pk_test_••••••••', '****1234')
 */
export function isMaskedValue(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/^[\*•·●▪■\s\-]+$/.test(trimmed)) {
    return true;
  }
  if (/(\*{3,}|•{3,}|·{3,}|●{3,})/.test(trimmed)) {
    return true;
  }
  if (/^[a-zA-Z0-9_\-]+[\*•·●▪■]{2,}/.test(trimmed) || /[\*•·●▪■]{2,}[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

export function initializeDB() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Notice: Storage directory initialization handled:", e);
  }

  const superAdminHash = hashPassword(SUPER_ADMIN_PASSWORD);
  const superAdminSalt = "";

  const defaultSiteSettings = {
    siteName: "Smart Link Digital",
    primaryColor: "#2563eb",
    secondaryColor: "#0f172a",
    themePreset: "indigo",
    announcementText: "⚡ Welcome to Smart Link Digital! All Identity, CAC & VTU Services operating at 100% Uptime.",
    showAnnouncement: true,
    maintenanceMode: false,
    supportEmail: "support@smartlink.com",
    supportPhone: "+2348031234567"
  };

  const defaultPriceMatrix = {
    identityRates: {
      ninFee: 500,
      bvnFee: 500,
      ipeFee: 1500,
      phoneToNinFee: 1000
    },
    cacRates: {
      businessNameFee: 15000,
      companyFee: 25000,
      ngoFee: 35000,
      reservationFee: 2000
    },
    dataPlans: [
      { id: "mtn_sme_1gb", network: "MTN", type: "SME", planName: "MTN SME 1GB (30 Days)", validity: "30 Days", customerPrice: 260, agentPrice: 240, isActive: true },
      { id: "mtn_sme_2gb", network: "MTN", type: "SME", planName: "MTN SME 2GB (30 Days)", validity: "30 Days", customerPrice: 520, agentPrice: 480, isActive: true },
      { id: "mtn_sme_5gb", network: "MTN", type: "SME", planName: "MTN SME 5GB (30 Days)", validity: "30 Days", customerPrice: 1300, agentPrice: 1200, isActive: true },
      { id: "glo_data_1gb", network: "GLO", type: "GIFTING", planName: "GLO Direct 1GB (30 Days)", validity: "30 Days", customerPrice: 280, agentPrice: 250, isActive: true },
      { id: "airtel_corp_1gb", network: "AIRTEL", type: "CORPORATE", planName: "Airtel Corp 1GB (30 Days)", validity: "30 Days", customerPrice: 270, agentPrice: 245, isActive: true },
      { id: "9mobile_data_1gb", network: "9MOBILE", type: "GIFTING", planName: "9mobile 1GB (30 Days)", validity: "30 Days", customerPrice: 290, agentPrice: 260, isActive: true },
    ],
    airtimeDiscountPercent: {
      MTN: 2,
      GLO: 3,
      AIRTEL: 2,
      "9MOBILE": 4
    },
    examPrices: {
      WAEC: 3800,
      NECO: 1200,
      JAMB: 4700
    },
    utilityProcessingFee: 50,
    cableCharges: {
      DSTV: 100,
      GOTV: 100,
      STARTIMES: 100
    }
  };

  const defaultData = {
    users: [
      {
        uid: "usr_superadmin",
        email: SUPER_ADMIN_EMAIL,
        fullName: "Adamu A. Muhammad",
        phoneNumber: "+2348000000000",
        role: "SUPER_ADMIN",
        walletBalance: 0,
        referralCode: "SUPER1",
        passwordHash: superAdminHash,
        salt: superAdminSalt,
        isVerified: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
    ],
    transactions: [],
    cacApplications: [],
    vendorServices: [],
    auditLogs: [],
    siteSettings: defaultSiteSettings,
    priceMatrix: defaultPriceMatrix,
    systemSettings: {
      ninFee: 500,
      bvnFee: 500,
      cacBaseFee: 10000,
      referralBonusPercent: 2,
    },
  };

  try {
    if (!fs.existsSync(DB_FILE)) {
      const seedFile = path.join(process.cwd(), "src", "data", "db.json");
      if (fs.existsSync(seedFile)) {
        try {
          fs.copyFileSync(seedFile, DB_FILE);
        } catch (copyErr) {
          fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
        }
      } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
      }
      console.log("Database initialized successfully at", DB_FILE);
    }
  } catch (err) {
    console.warn("Notice: Initializing DB file fallback:", err);
  }
}

initializeDB();

let currentDbMemory: any = null;

// Initial background load from Firestore
loadFirestoreDb(true)
  .then((loaded) => {
    currentDbMemory = loaded;
    console.log("[server] Loaded full dataset from Firestore into memory cache.");
    adminAuthService.seedAdminUsers(currentDbMemory).catch((err) => {
      console.warn("[server] Super Admin Firestore seed failed:", err);
    });
  })
  .catch((e) => {
    console.warn("[server] Initial Firestore load failed:", e);
  });

export function readDB(): any {
  if (currentDbMemory) {
    return currentDbMemory;
  }
  if (process.env.NODE_ENV === "development") {
    try {
      let data = "";
      if (fs.existsSync(DB_FILE)) {
        data = fs.readFileSync(DB_FILE, "utf8");
      } else {
        const seedFile = path.join(process.cwd(), "src", "data", "db.json");
        if (fs.existsSync(seedFile)) {
          data = fs.readFileSync(seedFile, "utf8");
        }
      }
      if (data && data.trim()) {
        currentDbMemory = JSON.parse(data);
      }
    } catch (e) {
      console.warn("[server] Notice reading local DB:", e);
    }
  }

  if (!currentDbMemory) {
    currentDbMemory = {
      users: [],
      transactions: [],
      cacApplications: [],
      vendorServices: [],
      auditLogs: [],
      siteSettings: {
        siteName: "Smart Link Digital",
        primaryColor: "#2563eb",
        secondaryColor: "#0f172a",
        themePreset: "indigo",
        announcementText: "⚡ Welcome to Smart Link Digital! All Identity, CAC & VTU Services operating at 100% Uptime.",
        showAnnouncement: true,
        maintenanceMode: false,
      },
    };
  }

  if (!currentDbMemory.priceMatrix) {
    currentDbMemory.priceMatrix = {
      identityRates: { ninFee: 500, bvnFee: 500, ipeFee: 1500, phoneToNinFee: 1000 },
      cacRates: { businessNameFee: 15000, companyFee: 25000, ngoFee: 35000, reservationFee: 2000 },
      dataPlans: [
        { id: "mtn_sme_1gb", network: "MTN", type: "SME", planName: "MTN SME 1GB (30 Days)", validity: "30 Days", customerPrice: 260, agentPrice: 240, isActive: true },
        { id: "mtn_sme_2gb", network: "MTN", type: "SME", planName: "MTN SME 2GB (30 Days)", validity: "30 Days", customerPrice: 520, agentPrice: 480, isActive: true },
        { id: "mtn_sme_5gb", network: "MTN", type: "SME", planName: "MTN SME 5GB (30 Days)", validity: "30 Days", customerPrice: 1300, agentPrice: 1200, isActive: true },
        { id: "glo_data_1gb", network: "GLO", type: "GIFTING", planName: "GLO Direct 1GB (30 Days)", validity: "30 Days", customerPrice: 280, agentPrice: 250, isActive: true },
        { id: "airtel_corp_1gb", network: "AIRTEL", type: "CORPORATE", planName: "Airtel Corp 1GB (30 Days)", validity: "30 Days", customerPrice: 270, agentPrice: 245, isActive: true },
        { id: "9mobile_data_1gb", network: "9MOBILE", type: "GIFTING", planName: "9mobile 1GB (30 Days)", validity: "30 Days", customerPrice: 290, agentPrice: 260, isActive: true },
      ],
      airtimeDiscountPercent: { MTN: 2, GLO: 3, AIRTEL: 2, "9MOBILE": 4 },
      examPrices: { WAEC: 3800, NECO: 1200, JAMB: 4700 },
      utilityProcessingFee: 50,
      cableCharges: { DSTV: 100, GOTV: 100, STARTIMES: 100 },
    };
  }

  const arrayFields = [
    "users",
    "transactions",
    "cacApplications",
    "vendorServices",
    "auditLogs",
    "apiProviders",
    "providerLogs",
    "loginHistory",
    "receipts",
    "notifications",
    "walletLogs",
    "activityLogs",
    "notificationSettings",
    "adminLogs",
    "webhooks",
    "webhookLogs",
    "admin_sessions",
    "admin_users",
    "admin_activity_logs",
    "virtualAccounts",
  ];
  for (const f of arrayFields) {
    if (!currentDbMemory[f]) currentDbMemory[f] = [];
  }
  return currentDbMemory;
}

export function writeDB(data: any, collectionsToSync?: string[]) {
  currentDbMemory = data;
  syncDbToFirestore(data, collectionsToSync).catch((err) => {
    console.warn("[server] Background syncDbToFirestore warning:", err);
  });
  if (process.env.NODE_ENV === "development") {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      // Ignore local dev filesystem write failure
    }
  }
}
