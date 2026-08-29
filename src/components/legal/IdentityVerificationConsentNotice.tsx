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
    <div className={`rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-slate-50 p-3.5 text-left transition-all ${compact ? "space-y-2" : "space-y-2.5"}`}>
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>NDPA 2023 & KYC Verification Compliance Notice</span>
        </div>
        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
          Statutory Disclosure
        </span>
      </div>

      {/* Narrative & Legal Explanation */}
      <p className="text-[11px] leading-relaxed text-slate-600">
        SmartLink NG processes this query in strict compliance with the{" "}
        <strong className="text-slate-800">Nigeria Data Protection Act 2023 (NDPA)</strong>. Your search parameter is encrypted and transmitted directly to accredited verification gateways (NIMC, NIBSS, CAC, or FIRS) solely to authenticate identity.
      </p>

      {/* Relevant Policy Links */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-blue-700 pt-0.5">
        <button
          type="button"
          onClick={() => onOpenPolicy("kyc-notice")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 focus:outline-none cursor-pointer"
        >
          <span>KYC Notice</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
        <span className="text-slate-300">•</span>
        <button
          type="button"
          onClick={() => onOpenPolicy("privacy-policy")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 focus:outline-none cursor-pointer"
        >
          <span>Privacy Policy</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
        <span className="text-slate-300">•</span>
        <button
          type="button"
          onClick={() => onOpenPolicy("data-protection")}
          className="font-medium hover:underline inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 focus:outline-none cursor-pointer"
        >
          <span>Data Rights</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Mandatory Acknowledgment Checkbox */}
      <div className="pt-2 border-t border-blue-100/80">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300 cursor-pointer shrink-0"
          />
          <span className="text-[11px] text-slate-700 leading-snug">
            I confirm that I am the data subject or hold explicit, lawful consent from the data subject to verify this record, and agree to the{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenPolicy("kyc-notice");
              }}
              className="text-blue-700 font-semibold hover:underline"
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
