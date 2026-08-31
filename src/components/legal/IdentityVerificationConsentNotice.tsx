/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  ExternalLink,
  Info,
  AlertTriangle
} from "lucide-react";

export interface IdentityVerificationConsentNoticeProps {
  serviceName: string; // e.g. "NIN Verification", "BVN Verification", "CAC Search"
  hasConsented: boolean;
  onConsentChange: (consented: boolean) => void;
  onOpenPolicy: (docId: string) => void;
  compact?: boolean;
}

export function IdentityVerificationConsentNotice({
  serviceName,
  hasConsented,
  onConsentChange,
  onOpenPolicy,
  compact = false
}: IdentityVerificationConsentNoticeProps) {
  return (
    <div className={`rounded-xl border border-[#E5E7EB]/80 bg-gradient-to-br from-[#F5F7FA]/80 to-[#F5F7FA] p-3.5 text-left transition-all ${compact ? "space-y-2" : "space-y-2.5"}`}>
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#0F2D5C] font-bold text-xs">
          <ShieldCheck className="h-4 w-4 text-[#0F2D5C] shrink-0" />
          <span>NDPA 2023 & KYC Verification Compliance Notice</span>
        </div>
        <span className="text-[10px] font-semibold text-[#0F2D5C] bg-[#E5E7EB]/70 border border-[#E5E7EB] px-2 py-0.5 rounded-full shrink-0">
          Statutory Disclosure
        </span>
      </div>

      {/* Narrative & Legal Explanation */}
      <p className="text-[11px] leading-relaxed text-[#4B5563]">
        SmartLink NG processes this query in strict compliance with the{" "}
        <strong className="text-[#111827]">Nigeria Data Protection Act 2023 (NDPA)</strong>. Your search parameter is encrypted and transmitted directly to accredited verification gateways (third-party verification APIs) solely to authenticate identity.
      </p>

      {/* Relevant Policy Links */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#0F2D5C] pt-0.5">
        <button
          type="button"
          onClick={() => onOpenPolicy("kyc-notice")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-[#0F2D5C] hover:text-[#0F2D5C] focus:outline-none cursor-pointer"
        >
          <span>KYC Notice</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
        <span className="text-[#E5E7EB]">•</span>
        <button
          type="button"
          onClick={() => onOpenPolicy("privacy-policy")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-[#0F2D5C] hover:text-[#0F2D5C] focus:outline-none cursor-pointer"
        >
          <span>Privacy Policy</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
        <span className="text-[#E5E7EB]">•</span>
        <button
          type="button"
          onClick={() => onOpenPolicy("data-protection")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-[#0F2D5C] hover:text-[#0F2D5C] focus:outline-none cursor-pointer"
        >
          <span>Data Rights</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Mandatory Acknowledgment Checkbox */}
      <div className="pt-2 border-t border-[#E5E7EB]/80">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 text-[#0F2D5C] focus:ring-[#0F2D5C] rounded border-[#E5E7EB] cursor-pointer shrink-0"
          />
          <span className="text-[11px] text-[#4B5563] leading-snug">
            I confirm that I am the data subject or hold explicit, lawful consent from the data subject to verify this record, and agree to the{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenPolicy("kyc-notice");
              }}
              className="text-[#0F2D5C] font-semibold hover:underline"
            >
              KYC & Verification Terms
            </button>
            .
          </span>
        </label>
      </div>
    </div>
  );
}
