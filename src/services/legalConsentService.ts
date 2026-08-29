/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  auth,
  isFirebaseConfigured,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  handleFirestoreError
} from "../firebase";
import { safeFetchJson } from "../utils/authErrorHandler";
import {
  LegalAcceptanceRecord,
  LegalAcceptanceType,
  LegalWorkflowType,
  LegalPolicyVersion,
  MarketingConsentSettings,
  LegalComplianceStats
} from "../types/legal";
import { LEGAL_DOCUMENTS } from "../components/legal/legalData";

export const DEFAULT_LEGAL_POLICIES: LegalPolicyVersion[] = LEGAL_DOCUMENTS.map((doc) => ({
  id: doc.id,
  documentId: doc.id,
  documentName: doc.title,
  version: doc.version ? doc.version.split(" ")[0] : "2.0.0",
  effectiveDate: doc.effectiveDate,
  lastUpdated: doc.lastUpdated,
  status: "ACTIVE",
  requiresReAcceptance: ["terms-of-service", "privacy-policy", "wallet-terms", "kyc-notice"].includes(doc.id),
  minimumRequiredVersion: doc.version ? doc.version.split(" ")[0] : "2.0.0",
  category: (doc.category as any) || "LEGAL",
  summary: doc.summary
}));

// Local storage key for fast offline/cached acceptance checks
const LOCAL_ACCEPTANCES_KEY_PREFIX = "smartlink_legal_acc_";

export class LegalConsentService {
  /**
   * Records a user acceptance event in Firestore and synchronizes with server backend.
   */
  static async recordLegalAcceptance(params: {
    userId: string;
    userEmail?: string;
    documentId: string;
    documentTitle?: string;
    documentVersion?: string;
    acceptanceType: LegalAcceptanceType;
    workflow: LegalWorkflowType;
    metadata?: Record<string, any>;
  }): Promise<LegalAcceptanceRecord> {
    const {
      userId,
      userEmail,
      documentId,
      documentTitle,
      documentVersion = "2.0.0",
      acceptanceType,
      workflow,
      metadata = {}
    } = params;

    const recordId = `acc_${userId.replace(/[^a-zA-Z0-9]/g, "_")}_${documentId}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const record: LegalAcceptanceRecord = {
      id: recordId,
      userId,
      userEmail: userEmail || auth.currentUser?.email || "",
      documentId,
      documentTitle: documentTitle || documentId,
      documentVersion,
      acceptedAt: nowIso,
      acceptanceType,
      workflow,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "web",
      platform: "web",
      metadata
    };

    // 1. Write to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "legal_acceptances", recordId);
        await setDoc(docRef, record);
      } catch (fsErr) {
        console.warn("[LegalConsentService] Client Firestore write error, syncing to backend:", fsErr);
      }
    }

    // 2. Write to backend API
    try {
      await safeFetchJson("/api/legal/accept", {
        method: "POST",
        body: JSON.stringify(record)
      });
    } catch (apiErr) {
      console.warn("[LegalConsentService] Backend sync warning:", apiErr);
    }

    // 3. Cache in localStorage
    try {
      const cacheKey = `${LOCAL_ACCEPTANCES_KEY_PREFIX}${userId}`;
      const existing = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      existing.unshift(record);
      localStorage.setItem(cacheKey, JSON.stringify(existing.slice(0, 50)));
    } catch {}

    return record;
  }

  /**
   * Records multiple acceptance events at once (e.g. at Registration for Terms + Privacy).
   */
  static async recordBatchAcceptances(params: {
    userId: string;
    userEmail?: string;
    acceptances: Array<{
      documentId: string;
      documentTitle: string;
      documentVersion: string;
      acceptanceType?: LegalAcceptanceType;
      workflow?: LegalWorkflowType;
      metadata?: Record<string, any>;
    }>;
    acceptanceType: LegalAcceptanceType;
    workflow: LegalWorkflowType;
    metadata?: Record<string, any>;
  }): Promise<LegalAcceptanceRecord[]> {
    const { userId, userEmail, acceptances, acceptanceType, workflow, metadata = {} } = params;

    const records: LegalAcceptanceRecord[] = [];

    // Backend bulk sync
    try {
      const res = await safeFetchJson("/api/legal/batch-accept", {
        method: "POST",
        body: JSON.stringify({
          userId,
          userEmail,
          acceptances,
          acceptanceType,
          workflow,
          metadata
        })
      });
      if (res.data?.records) {
        return res.data.records;
      }
    } catch (e) {
      console.warn("[LegalConsentService] Batch accept backend error, falling back to iterative write:", e);
    }

    // Iterative fallback
    for (const acc of acceptances) {
      const rec = await this.recordLegalAcceptance({
        userId,
        userEmail,
        documentId: acc.documentId,
        documentTitle: acc.documentTitle,
        documentVersion: acc.documentVersion,
        acceptanceType: acc.acceptanceType || acceptanceType,
        workflow: acc.workflow || workflow,
        metadata: { ...metadata, ...(acc.metadata || {}) }
      });
      records.push(rec);
    }

    return records;
  }

  /**
   * Fetches all accepted legal agreements for a given user.
   */
  static async getUserLegalAcceptances(userId: string): Promise<LegalAcceptanceRecord[]> {
    if (!userId) return [];

    // Try backend first
    try {
      const res = await safeFetchJson(`/api/legal/user-acceptances/${userId}`);
      if (res.data?.acceptances && Array.isArray(res.data.acceptances)) {
        return res.data.acceptances;
      }
    } catch {}

    // Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, "legal_acceptances"),
          where("userId", "==", userId)
        );
        const snap = await getDocs(q);
        const list: LegalAcceptanceRecord[] = [];
        snap.forEach((d) => list.push(d.data() as LegalAcceptanceRecord));
        return list.sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime());
      } catch (fsErr) {
        console.warn("[LegalConsentService] Firestore read error:", fsErr);
      }
    }

    // LocalStorage fallback
    try {
      const cacheKey = `${LOCAL_ACCEPTANCES_KEY_PREFIX}${userId}`;
      const existing = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      if (Array.isArray(existing)) return existing;
    } catch {}

    return [];
  }

  /**
   * Fetches all active legal policy versions.
   */
  static async getLegalPolicies(): Promise<LegalPolicyVersion[]> {
    try {
      const res = await safeFetchJson("/api/legal/policies");
      if (res.data?.policies && Array.isArray(res.data.policies)) {
        return res.data.policies;
      }
    } catch {}

    return DEFAULT_LEGAL_POLICIES;
  }

  /**
   * Compares the user's acceptance records against active mandatory policy versions
   * and returns any policies that require user re-acceptance.
   */
  static async checkUserPendingPolicyUpdates(userId: string): Promise<LegalPolicyVersion[]> {
    if (!userId) return [];

    try {
      const [policies, userAcceptances] = await Promise.all([
        this.getLegalPolicies(),
        this.getUserLegalAcceptances(userId)
      ]);

      const pending: LegalPolicyVersion[] = [];

      // Map user's latest accepted version for each document
      const userLatestVersions: Record<string, string> = {};
      userAcceptances.forEach((acc) => {
        if (!userLatestVersions[acc.documentId]) {
          userLatestVersions[acc.documentId] = acc.documentVersion;
        }
      });

      // Filter policies requiring re-acceptance
      for (const policy of policies) {
        if (!policy.requiresReAcceptance) continue;

        const userVer = userLatestVersions[policy.documentId];
        if (!userVer) {
          // User hasn't recorded an explicit acceptance yet for this required document
          pending.push(policy);
        } else {
          // Check version comparison
          const minVer = policy.minimumRequiredVersion || policy.version;
          if (this.isVersionLower(userVer, minVer)) {
            pending.push(policy);
          }
        }
      }

      return pending;
    } catch (err) {
      console.warn("[LegalConsentService] Error checking policy updates:", err);
      return [];
    }
  }

  /**
   * Version comparison helper (e.g. "2.0.0" vs "2.4.0")
   */
  private static isVersionLower(currentVer: string, targetVer: string): boolean {
    const curParts = (currentVer || "").replace(/[^0-9.]/g, "").split(".").map(Number);
    const targetParts = (targetVer || "").replace(/[^0-9.]/g, "").split(".").map(Number);

    for (let i = 0; i < Math.max(curParts.length, targetParts.length); i++) {
      const cur = curParts[i] || 0;
      const tgt = targetParts[i] || 0;
      if (cur < tgt) return true;
      if (cur > tgt) return false;
    }
    return false;
  }

  /**
   * Retrieves Admin compliance statistics and acceptance audit records.
   */
  static async getAdminComplianceStats(): Promise<{
    stats: LegalComplianceStats;
    policies: LegalPolicyVersion[];
  } | null> {
    try {
      const res = await safeFetchJson("/api/legal/admin/stats");
      if (res.data?.stats) {
        return res.data;
      }
    } catch (e) {
      console.error("[LegalConsentService] Admin stats fetch error:", e);
    }
    return null;
  }

  /**
   * Admin updates a policy version or re-acceptance flag.
   */
  static async updatePolicyVersion(policy: Partial<LegalPolicyVersion>): Promise<boolean> {
    try {
      const res = await safeFetchJson("/api/legal/admin/update-policy", {
        method: "POST",
        body: JSON.stringify(policy)
      });
      return !!res.data?.success;
    } catch (e) {
      console.error("[LegalConsentService] Update policy error:", e);
      return false;
    }
  }

  /**
   * Get user marketing consent settings.
   */
  static async getMarketingConsent(userId: string): Promise<MarketingConsentSettings> {
    try {
      const res = await safeFetchJson(`/api/legal/marketing-consent/${userId}`);
      if (res.data?.consent) {
        return res.data.consent;
      }
    } catch {}

    return {
      userId,
      email: false,
      sms: false,
      whatsapp: false,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Save user marketing consent settings.
   */
  static async saveMarketingConsent(settings: {
    userId: string;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  }): Promise<boolean> {
    try {
      const res = await safeFetchJson("/api/legal/marketing-consent", {
        method: "POST",
        body: JSON.stringify(settings)
      });
      return !!res.data?.success;
    } catch (e) {
      console.error("[LegalConsentService] Save marketing consent error:", e);
      return false;
    }
  }

  /**
   * Universal alias for recording user consent / legal acceptance
   */
  static async recordAcceptance(params: {
    userId: string;
    userEmail?: string;
    documentId: string;
    documentTitle?: string;
    documentVersion?: string;
    scope?: string;
    agreementType?: string;
    acceptanceType?: LegalAcceptanceType;
    workflow?: LegalWorkflowType;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<LegalAcceptanceRecord> {
    return this.recordLegalAcceptance({
      userId: params.userId,
      userEmail: params.userEmail,
      documentId: params.documentId,
      documentTitle: params.documentTitle,
      documentVersion: params.documentVersion,
      acceptanceType: params.acceptanceType || "POLICY_UPDATE_REACCEPTANCE",
      workflow: params.workflow || "MANUAL_AGREEMENT_REVIEW",
      metadata: {
        ...(params.metadata || {}),
        scope: params.scope,
        agreementType: params.agreementType,
        status: params.status,
      }
    });
  }

  /**
   * Universal alias for checking pending re-acceptances
   */
  static async checkPendingReAcceptances(userId: string): Promise<LegalPolicyVersion[]> {
    return this.checkUserPendingPolicyUpdates(userId);
  }

  /**
   * Universal alias for getting user's accepted agreements
   */
  static async getAcceptedAgreements(userId: string): Promise<LegalAcceptanceRecord[]> {
    return this.getUserLegalAcceptances(userId);
  }
}

export const legalConsentService = LegalConsentService;
export default LegalConsentService;
