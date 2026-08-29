/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  History,
  Mail,
  Smartphone,
  MessageSquare,
  Lock,
  X,
  RefreshCw,
  Info,
  Download
} from "lucide-react";
import { LegalAcceptanceRecord, LegalPolicyVersion, MarketingConsentSettings } from "../../types/legal";
import { LegalConsentService } from "../../services/legalConsentService";
import { LEGAL_DOCUMENTS } from "./legalData";

export interface UserLegalAgreementsModalProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenDocument: (docId: string) => void;
}

export function UserLegalAgreementsModal({
  userId,
  userEmail,
  isOpen,
  onClose,
  onOpenDocument
}: UserLegalAgreementsModalProps) {
  const [activeTab, setActiveTab] = useState<"DOCUMENTS" | "HISTORY" | "MARKETING" | "DATA_RIGHTS">("DOCUMENTS");
  const [userAcceptances, setUserAcceptances] = useState<LegalAcceptanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [marketingConsent, setMarketingConsent] = useState<MarketingConsentSettings>({
    userId,
    email: false,
    sms: false,
    whatsapp: false,
    updatedAt: new Date().toISOString()
  });
  const [savingMarketing, setSavingMarketing] = useState<boolean>(false);
  const [marketingSavedToast, setMarketingSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadHistory();
      loadMarketingConsent();
    }
  }, [isOpen, userId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const records = await LegalConsentService.getUserLegalAcceptances(userId);
      setUserAcceptances(records);
    } catch (e) {
      console.warn("Error loading acceptance records:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMarketingConsent = async () => {
    try {
      const consent = await LegalConsentService.getMarketingConsent(userId);
      setMarketingConsent(consent);
    } catch (e) {
      console.warn("Error loading marketing preferences:", e);
    }
  };

  const handleSaveMarketing = async (updated: Partial<MarketingConsentSettings>) => {
    const nextState = { ...marketingConsent, ...updated, userId };
    setMarketingConsent(nextState);
    setSavingMarketing(true);
    try {
      await LegalConsentService.saveMarketingConsent(nextState);
      setMarketingSavedToast(true);
      setTimeout(() => setMarketingSavedToast(false), 3000);
    } catch (e) {
      console.error("Save marketing error:", e);
    } finally {
      setSavingMarketing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-left overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Your Legal & Consent Center</h2>
              <p className="text-xs text-slate-400">Manage your agreements, NDPA privacy rights, and communications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "DOCUMENTS"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Platform Policies ({LEGAL_DOCUMENTS.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Acceptance Records ({userAcceptances.length})
          </button>
          <button
            onClick={() => setActiveTab("MARKETING")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "MARKETING"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Communication Channels
          </button>
          <button
            onClick={() => setActiveTab("DATA_RIGHTS")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "DATA_RIGHTS"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            NDPA 2023 Data Rights
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ALL DOCUMENTS */}
          {activeTab === "DOCUMENTS" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Browse current legal documents in effect for SmartLink NG.</span>
                <span className="font-semibold text-slate-700">All 10 Documents Active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LEGAL_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {doc.version.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Updated: {doc.lastUpdated}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDocument(doc.id);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>View Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACCEPTANCE HISTORY */}
          {activeTab === "HISTORY" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Your Legal Agreement Audit Trail</h3>
                  <p className="text-[11px] text-slate-500">
                    Timestamped audit records of the legal terms and policies you agreed to on SmartLink NG.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-slate-600 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                  <span>Retrieving legal audit records...</span>
                </div>
              ) : userAcceptances.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-700">No Acceptance Records Found</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your consent events will automatically be recorded here as you utilize platform services.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3.5">Document Name</th>
                        <th className="py-2.5 px-3">Version</th>
                        <th className="py-2.5 px-3">Workflow Context</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {userAcceptances.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3.5 font-medium text-slate-900">
                            {rec.documentTitle || rec.documentId}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            v{rec.documentVersion}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {rec.workflow.replace(/_/g, " ")}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {new Date(rec.acceptedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              Recorded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MARKETING PREFERENCES */}
          {activeTab === "MARKETING" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Communication & Notification Preferences</h3>
                <p className="text-[11px] text-slate-500">
                  Control how you receive non-mandatory announcements, special offers, and platform notifications.
                </p>
              </div>

              {marketingSavedToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Your communication preferences have been saved successfully.</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Email Channel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Email Newsletters & Promotions</div>
                      <p className="text-[11px] text-slate-500">
                        Monthly discount vouchers, feature guides, and platform updates sent to {userEmail}.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={marketingConsent.email}
                      onChange={(e) => handleSaveMarketing({ email: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* SMS Channel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">SMS Alerts & Flash Deals</div>
                      <p className="text-[11px] text-slate-500">
                        Direct SMS notifications for limited-time service discounts and portal notices.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={marketingConsent.sms}
                      onChange={(e) => handleSaveMarketing({ sms: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* WhatsApp Channel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">WhatsApp Broadcasts</div>
                      <p className="text-[11px] text-slate-500">
                        Instant support advisories, maintenance updates, and verified promo codes via WhatsApp.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={marketingConsent.whatsapp}
                      onChange={(e) => handleSaveMarketing({ whatsapp: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Note: Essential operational notices (transaction receipts, security reset tokens, and balance confirmations) will always be delivered regardless of these marketing preferences.
              </p>
            </div>
          )}

          {/* TAB 4: DATA PROTECTION & NDPA 2023 RIGHTS */}
          {activeTab === "DATA_RIGHTS" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Nigeria Data Protection Act 2023 (NDPA) Compliance</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  As a SmartLink NG user, you are entitled to statutory data subject rights under the NDPA 2023. We ensure full transparency, secure data processing, and prompt resolution of data subject requests.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <strong className="text-slate-800">1. Right to Access & Portability</strong>
                  <p className="text-[11px] text-slate-500">
                    You can request a copy of your personal data and transactional ledger at any time.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <strong className="text-slate-800">2. Right to Rectification</strong>
                  <p className="text-[11px] text-slate-500">
                    Request corrections to inaccurate profile or contact records.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <strong className="text-slate-800">3. Right to Erasure / Deletion</strong>
                  <p className="text-[11px] text-slate-500">
                    Request removal of non-statutory data once financial record-keeping obligations expire.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                <strong className="text-blue-400 font-bold">Contact our Data Protection Officer (DPO)</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  To file a formal data subject request, contact:
                  <br />
                  Email: <a href="mailto:Smartlinkcomputerbusiness@gmail.com" className="text-blue-300 underline">Smartlinkcomputerbusiness@gmail.com</a>
                  <br />
                  Phone: +234 808 549 0982 | WhatsApp: +234 904 773 8212
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Smart Link Nigeria Computer Business Enterprise (RC 9347502)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
}
