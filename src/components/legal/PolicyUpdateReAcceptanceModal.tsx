/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldAlert,
  FileText,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowRight,
  Clock,
  Check
} from "lucide-react";
import { LegalPolicyVersion } from "../../types/legal";
import { LegalConsentService } from "../../services/legalConsentService";

export interface PolicyUpdateReAcceptanceModalProps {
  pendingPolicies: LegalPolicyVersion[];
  userId: string;
  userEmail: string;
  onAccepted: () => void;
  onOpenDocumentView: (docId: string) => void;
}

export function PolicyUpdateReAcceptanceModal({
  pendingPolicies,
  userId,
  userEmail,
  onAccepted,
  onOpenDocumentView
}: PolicyUpdateReAcceptanceModalProps) {
  const [acceptedPolicyIds, setAcceptedPolicyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const togglePolicyAcceptance = (docId: string) => {
    if (acceptedPolicyIds.includes(docId)) {
      setAcceptedPolicyIds(acceptedPolicyIds.filter((id) => id !== docId));
    } else {
      setAcceptedPolicyIds([...acceptedPolicyIds, docId]);
    }
  };

  const handleSelectAll = () => {
    if (acceptedPolicyIds.length === pendingPolicies.length) {
      setAcceptedPolicyIds([]);
    } else {
      setAcceptedPolicyIds(pendingPolicies.map((p) => p.documentId));
    }
  };

  const handleConfirmReAcceptance = async () => {
    if (acceptedPolicyIds.length < pendingPolicies.length) {
      setError("Please review and agree to all updated policies to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const batchItems = pendingPolicies.map((policy) => ({
        documentId: policy.documentId,
        documentTitle: policy.documentName,
        documentVersion: policy.version,
        acceptanceType: "POLICY_UPDATE_REACCEPTANCE" as const,
        workflow: "POLICY_UPDATE_GATE" as const,
        metadata: {
          previousVersionAcknowledged: true,
          reacceptanceTimestamp: new Date().toISOString()
        }
      }));

      await LegalConsentService.recordBatchAcceptances({
        userId,
        userEmail,
        acceptances: batchItems,
        acceptanceType: "POLICY_UPDATE_REACCEPTANCE",
        workflow: "POLICY_UPDATE_GATE"
      });

      onAccepted();
    } catch (err: any) {
      setError(err?.message || "Failed to record your agreement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!pendingPolicies || pendingPolicies.length === 0) return null;

  const allSelected = acceptedPolicyIds.length === pendingPolicies.length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] text-left space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#111827]">Important Policy Updates</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E5E7EB] text-[#0F2D5C] px-2 py-0.5 rounded-full">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              We have updated our platform terms to maintain regulatory compliance with NDPA 2023 and enhanced consumer protections. Please review and acknowledge the updated policies below.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Policy Items List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {pendingPolicies.map((policy) => {
            const isChecked = acceptedPolicyIds.includes(policy.documentId);
            return (
              <div
                key={policy.documentId}
                className={`p-3.5 rounded-xl border transition-all ${
                  isChecked ? "bg-[#F5F7FA]/50 border-[#E5E7EB]" : "bg-[#F5F7FA] border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePolicyAcceptance(policy.documentId)}
                      className="mt-1 h-4 w-4 text-[#0F2D5C] focus:ring-[#0F2D5C] rounded border-[#E5E7EB] cursor-pointer shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111827] flex items-center gap-2">
                        <span>{policy.documentName}</span>
                        <span className="text-[10px] font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded">
                          v{policy.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">
                        {policy.summary}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => onOpenDocumentView(policy.documentId)}
                    className="text-[11px] font-semibold text-[#0F2D5C] hover:text-[#0F2D5C] flex items-center gap-1 shrink-0 p-1 rounded hover:bg-[#E5E7EB]/50 focus:outline-none cursor-pointer"
                    title="Read full document"
                  >
                    <span>Read</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Select all bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[#0F2D5C] font-semibold hover:underline cursor-pointer"
          >
            {allSelected ? "Deselect All" : "Select All Policies"}
          </button>
          <span className="text-[#9CA3AF] text-[11px]">
            {acceptedPolicyIds.length} of {pendingPolicies.length} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!allSelected || loading}
            onClick={handleConfirmReAcceptance}
            className="w-full py-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Recording Agreement...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Agree & Continue to SmartLink</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
