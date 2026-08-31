/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { readDB, writeDB } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { getAdminFirestore } from "../../src/services/firebaseAdmin";
import { LegalAcceptanceRecord, LegalPolicyVersion, MarketingConsentSettings } from "../../src/types/legal";

const router = express.Router();

export const DEFAULT_LEGAL_POLICY_VERSIONS: LegalPolicyVersion[] = [
  {
    id: "privacy-policy",
    documentId: "privacy-policy",
    documentName: "Privacy Policy",
    version: "2.4.0",
    effectiveDate: "June 12, 2024",
    lastUpdated: "April 18, 2026",
    status: "ACTIVE",
    requiresReAcceptance: true,
    minimumRequiredVersion: "2.4.0",
    category: "LEGAL",
    summary: "NDPA 2023 compliant data processing, storage, and privacy rights framework."
  },
  {
    id: "terms-of-service",
    documentId: "terms-of-service",
    documentName: "Terms of Service",
    version: "3.1.2",
    effectiveDate: "September 10, 2025",
    lastUpdated: "July 05, 2026",
    status: "ACTIVE",
    requiresReAcceptance: true,
    minimumRequiredVersion: "3.1.2",
    category: "LEGAL",
    summary: "Core binding user agreement, liability, arbitration, and service utilization terms."
  },
  {
    id: "refund-policy",
    documentId: "refund-policy",
    documentName: "Refund & Cancellation Policy",
    version: "2.0.1",
    effectiveDate: "February 15, 2024",
    lastUpdated: "March 22, 2025",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "2.0.1",
    category: "PAYMENTS_WALLET",
    summary: "Conditions for automated reversal, wallet credit, and failed transaction refunds."
  },
  {
    id: "wallet-terms",
    documentId: "wallet-terms",
    documentName: "Wallet Terms & Conditions",
    version: "1.8.5",
    effectiveDate: "November 01, 2024",
    lastUpdated: "January 20, 2026",
    status: "ACTIVE",
    requiresReAcceptance: true,
    minimumRequiredVersion: "1.8.5",
    category: "PAYMENTS_WALLET",
    summary: "Stored-value digital wallet management, automated funding, and settlement rules."
  },
  {
    id: "payment-terms",
    documentId: "payment-terms",
    documentName: "Payment Terms",
    version: "2.1.0",
    effectiveDate: "May 20, 2024",
    lastUpdated: "October 14, 2025",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "2.1.0",
    category: "PAYMENTS_WALLET",
    summary: "Gateway processing terms, statutory stamp duties, and dispute settlement."
  },
  {
    id: "cookie-policy",
    documentId: "cookie-policy",
    documentName: "Cookie Policy",
    version: "1.2.0",
    effectiveDate: "January 15, 2024",
    lastUpdated: "January 15, 2024",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "1.2.0",
    category: "SECURITY_USE",
    summary: "Details of essential session cookies and performance telemetry."
  },
  {
    id: "kyc-notice",
    documentId: "kyc-notice",
    documentName: "Identity Verification & KYC Notice",
    version: "2.3.4",
    effectiveDate: "January 10, 2025",
    lastUpdated: "May 12, 2026",
    status: "ACTIVE",
    requiresReAcceptance: true,
    minimumRequiredVersion: "2.3.4",
    category: "DATA_VERIFICATION",
    summary: "Explicit consent warranties for authorized NIMC, NIBSS, CAC, and TIN lookups."
  },
  {
    id: "acceptable-use",
    documentId: "acceptable-use",
    documentName: "Acceptable Use & Fraud Prevention Policy",
    version: "1.9.0",
    effectiveDate: "August 15, 2024",
    lastUpdated: "September 01, 2025",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "1.9.0",
    category: "SECURITY_USE",
    summary: "Zero-tolerance rules against identity theft, AML/CFT non-compliance, and botting."
  },
  {
    id: "data-protection",
    documentId: "data-protection",
    documentName: "Data Protection & User Rights",
    version: "2.0.0",
    effectiveDate: "June 12, 2024",
    lastUpdated: "November 10, 2024",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "2.0.0",
    category: "DATA_VERIFICATION",
    summary: "Comprehensive guide to NDPA 2023 data subject rights and DPO contact channels."
  },
  {
    id: "disclaimer",
    documentId: "disclaimer",
    documentName: "Third-Party & Government Disclaimer",
    version: "1.5.0",
    effectiveDate: "January 15, 2024",
    lastUpdated: "February 18, 2024",
    status: "ACTIVE",
    requiresReAcceptance: false,
    minimumRequiredVersion: "1.5.0",
    category: "LEGAL",
    summary: "Independent enterprise declaration regarding NIMC, NIBSS, CAC, and CBN."
  }
];

// Helper to seed policies if empty
function getPolicies(): LegalPolicyVersion[] {
  const db = readDB();
  if (!db.legalPolicies || !Array.isArray(db.legalPolicies) || db.legalPolicies.length === 0) {
    db.legalPolicies = DEFAULT_LEGAL_POLICY_VERSIONS;
    writeDB(db);
  } else {
    // Sync pre-existing DB cache with new independent metadata
    let updated = false;
    db.legalPolicies = db.legalPolicies.map((existing: any) => {
      const match = DEFAULT_LEGAL_POLICY_VERSIONS.find(
        (d) => d.id === existing.id || d.documentId === existing.documentId
      );
      if (match) {
        if (
          existing.version !== match.version ||
          existing.effectiveDate !== match.effectiveDate ||
          existing.lastUpdated !== match.lastUpdated
        ) {
          updated = true;
          return {
            ...existing,
            version: match.version,
            effectiveDate: match.effectiveDate,
            lastUpdated: match.lastUpdated,
            minimumRequiredVersion: match.minimumRequiredVersion,
            requiresReAcceptance: match.requiresReAcceptance
          };
        }
      }
      return existing;
    });
    if (updated) {
      writeDB(db);
    }
  }
  return db.legalPolicies;
}

// 1. Record single legal acceptance
router.post("/api/legal/accept", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      documentId,
      documentTitle,
      documentVersion,
      acceptanceType,
      workflow,
      metadata = {}
    } = req.body;

    if (!userId || !documentId || !acceptanceType || !workflow) {
      return res.status(400).json({ error: "Missing required legal acceptance parameters." });
    }

    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "SmartLink Web Client";
    const nowIso = new Date().toISOString();

    const recordId = `acc_${userId.replace(/[^a-zA-Z0-9]/g, "_")}_${documentId}_${Date.now()}`;
    const newRecord: LegalAcceptanceRecord = {
      id: recordId,
      userId,
      userEmail: userEmail || "",
      documentId,
      documentTitle: documentTitle || documentId,
      documentVersion: documentVersion || "2.0.0",
      acceptedAt: nowIso,
      acceptanceType,
      workflow,
      ipAddress,
      userAgent,
      platform: "web",
      metadata
    };

    // Save to local DB
    const db = readDB();
    if (!db.legalAcceptances) {
      db.legalAcceptances = [];
    }
    db.legalAcceptances.push(newRecord);
    writeDB(db);

    // Save to Firestore admin collection if configured
    try {
      const fsAdmin = getAdminFirestore();
      if (fsAdmin) {
        await fsAdmin.collection("legal_acceptances").doc(recordId).set(newRecord);
      }
    } catch (fsErr) {
      console.warn("[LegalRoutes] Firestore acceptance sync warning (local fallback succeeded):", fsErr);
    }

    res.json({ success: true, record: newRecord });
  } catch (error: any) {
    console.error("[LegalRoutes] Error recording acceptance:", error);
    res.status(500).json({ error: "Failed to record legal acceptance audit log." });
  }
});

// 2. Batch record multiple legal acceptances (e.g. at Registration)
router.post("/api/legal/batch-accept", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      acceptances,
      acceptanceType,
      workflow,
      metadata = {}
    } = req.body;

    if (!userId || !Array.isArray(acceptances) || acceptances.length === 0) {
      return res.status(400).json({ error: "Invalid batch acceptance payload." });
    }

    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "SmartLink Web Client";
    const nowIso = new Date().toISOString();

    const createdRecords: LegalAcceptanceRecord[] = [];
    const db = readDB();
    if (!db.legalAcceptances) {
      db.legalAcceptances = [];
    }

    let fsAdmin: any = null;
    try {
      fsAdmin = getAdminFirestore();
    } catch {}

    for (let i = 0; i < acceptances.length; i++) {
      const item = acceptances[i];
      const recordId = `acc_${userId.replace(/[^a-zA-Z0-9]/g, "_")}_${item.documentId}_${Date.now()}_${i}`;
      const rec: LegalAcceptanceRecord = {
        id: recordId,
        userId,
        userEmail: userEmail || "",
        documentId: item.documentId,
        documentTitle: item.documentTitle || item.documentId,
        documentVersion: item.documentVersion || "2.0.0",
        acceptedAt: nowIso,
        acceptanceType: item.acceptanceType || acceptanceType || "REGISTRATION_SIGNUP",
        workflow: item.workflow || workflow || "NEW_USER_REGISTRATION",
        ipAddress,
        userAgent,
        platform: "web",
        metadata: { ...metadata, ...(item.metadata || {}) }
      };

      db.legalAcceptances.push(rec);
      createdRecords.push(rec);

      if (fsAdmin) {
        try {
          await fsAdmin.collection("legal_acceptances").doc(recordId).set(rec);
        } catch (err) {
          console.warn("[LegalRoutes] Firestore single doc write error:", err);
        }
      }
    }

    writeDB(db);

    res.json({ success: true, count: createdRecords.length, records: createdRecords });
  } catch (error: any) {
    console.error("[LegalRoutes] Error in batch acceptance:", error);
    res.status(500).json({ error: "Failed to record batch legal acceptances." });
  }
});

// 3. Get legal acceptances for a specific user
router.get("/api/legal/user-acceptances/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const db = readDB();
    const all = db.legalAcceptances || [];
    const userRecords = all
      .filter((r: LegalAcceptanceRecord) => r.userId === userId || r.userEmail?.toLowerCase() === userId.toLowerCase())
      .sort((a: LegalAcceptanceRecord, b: LegalAcceptanceRecord) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime());

    res.json({ success: true, acceptances: userRecords });
  } catch (error: any) {
    console.error("[LegalRoutes] Error getting user acceptances:", error);
    res.status(500).json({ error: "Failed to retrieve user legal acceptances." });
  }
});

// 4. Get all policy versions
router.get("/api/legal/policies", async (req, res) => {
  try {
    const policies = getPolicies();
    res.json({ success: true, policies });
  } catch (error: any) {
    console.error("[LegalRoutes] Error getting policies:", error);
    res.status(500).json({ error: "Failed to retrieve policies." });
  }
});

// 5. Admin statistics & compliance audit trails
router.get("/api/legal/admin/stats", async (req, res) => {
  try {
    const db = readDB();
    const allRecords: LegalAcceptanceRecord[] = db.legalAcceptances || [];
    const policies = getPolicies();

    const uniqueUserIds = new Set<string>();
    const acceptancesByDoc: Record<string, number> = {};
    const acceptancesByVersion: Record<string, Record<string, number>> = {};
    const acceptancesByWorkflow: Record<string, number> = {};

    allRecords.forEach((r) => {
      if (r.userId) uniqueUserIds.add(r.userId);

      const docKey = r.documentId || "unknown";
      acceptancesByDoc[docKey] = (acceptancesByDoc[docKey] || 0) + 1;

      if (!acceptancesByVersion[docKey]) {
        acceptancesByVersion[docKey] = {};
      }
      const vKey = r.documentVersion || "1.0.0";
      acceptancesByVersion[docKey][vKey] = (acceptancesByVersion[docKey][vKey] || 0) + 1;

      const wfKey = r.workflow || "GENERAL";
      acceptancesByWorkflow[wfKey] = (acceptancesByWorkflow[wfKey] || 0) + 1;
    });

    const recent = [...allRecords]
      .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())
      .slice(0, 200);

    res.json({
      success: true,
      stats: {
        totalAcceptances: allRecords.length,
        uniqueUsersAccepted: uniqueUserIds.size,
        acceptancesByDocument: acceptancesByDoc,
        acceptancesByVersion,
        acceptancesByWorkflow,
        recentAcceptances: recent
      },
      policies
    });
  } catch (error: any) {
    console.error("[LegalRoutes] Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to generate legal compliance statistics." });
  }
});

// 6. Admin update policy version / re-acceptance rules
router.post("/api/legal/admin/update-policy", async (req, res) => {
  try {
    const { documentId, version, effectiveDate, lastUpdated, requiresReAcceptance, minimumRequiredVersion, summary } = req.body;
    if (!documentId || !version) {
      return res.status(400).json({ error: "documentId and version are required." });
    }

    const db = readDB();
    const policies = getPolicies();
    const index = policies.findIndex((p) => p.documentId === documentId);

    const nowIso = new Date().toISOString();
    const updatedPolicy: LegalPolicyVersion = {
      id: documentId,
      documentId,
      documentName: index !== -1 ? policies[index].documentName : documentId,
      version,
      effectiveDate: effectiveDate || (index !== -1 ? policies[index].effectiveDate : "January 15, 2024"),
      lastUpdated: lastUpdated || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      status: "ACTIVE",
      requiresReAcceptance: requiresReAcceptance !== undefined ? !!requiresReAcceptance : (index !== -1 ? policies[index].requiresReAcceptance : true),
      minimumRequiredVersion: minimumRequiredVersion || version,
      category: index !== -1 ? policies[index].category : "LEGAL",
      summary: summary || (index !== -1 ? policies[index].summary : "")
    };

    if (index !== -1) {
      policies[index] = updatedPolicy;
    } else {
      policies.push(updatedPolicy);
    }

    db.legalPolicies = policies;
    writeDB(db);

    // Sync to Firestore
    try {
      const fsAdmin = getAdminFirestore();
      if (fsAdmin) {
        await fsAdmin.collection("legal_policies").doc(documentId).set(updatedPolicy);
      }
    } catch (fsErr) {
      console.warn("[LegalRoutes] Firestore policy sync error:", fsErr);
    }

    res.json({ success: true, policy: updatedPolicy });
  } catch (error: any) {
    console.error("[LegalRoutes] Error updating policy:", error);
    res.status(500).json({ error: "Failed to update legal policy configuration." });
  }
});

// 7. Get user marketing consent
router.get("/api/legal/marketing-consent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = readDB();
    const consents = db.marketingConsents || {};
    const userConsent = consents[userId] || {
      userId,
      email: false,
      sms: false,
      whatsapp: false,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, consent: userConsent });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve marketing consent." });
  }
});

// 8. Save user marketing consent
router.post("/api/legal/marketing-consent", async (req, res) => {
  try {
    const { userId, email, sms, whatsapp } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const db = readDB();
    if (!db.marketingConsents) {
      db.marketingConsents = {};
    }

    const consentData: MarketingConsentSettings = {
      userId,
      email: !!email,
      sms: !!sms,
      whatsapp: !!whatsapp,
      updatedAt: new Date().toISOString()
    };

    db.marketingConsents[userId] = consentData;
    writeDB(db);

    // Sync to Firestore if available
    try {
      const fsAdmin = getAdminFirestore();
      if (fsAdmin) {
        await fsAdmin.collection("marketing_consents").doc(userId).set(consentData);
      }
    } catch {}

    res.json({ success: true, consent: consentData });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update marketing consent." });
  }
});

export default router;
