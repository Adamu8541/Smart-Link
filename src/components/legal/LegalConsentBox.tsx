/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ExternalLink,
  AlertCircle
} from "lucide-react";

export interface LegalConsentBoxProps {
  agreeTerms: boolean;
  onAgreeTermsChange: (checked: boolean) => void;
  ackPrivacy: boolean;
  onAckPrivacyChange: (checked: boolean) => void;
  agreeKyc?: boolean;
  onAgreeKycChange?: (checked: boolean) => void;
  onOpenDocument: (docId: string) => void;
  // Optional marketing state
  marketingEmail?: boolean;
  onMarketingEmailChange?: (checked: boolean) => void;
  marketingSms?: boolean;
  onMarketingSmsChange?: (checked: boolean) => void;
  marketingWhatsapp?: boolean;
  onMarketingWhatsappChange?: (checked: boolean) => void;
  showError?: boolean;
}

export function LegalConsentBox({
  agreeTerms,
  onAgreeTermsChange,
  ackPrivacy,
  onAckPrivacyChange,
  agreeKyc = false,
  onAgreeKycChange,
  onOpenDocument,
  showError = false,
}: LegalConsentBoxProps) {
  const hasKycProp = typeof onAgreeKycChange === "function";
  const isUnifiedChecked = agreeTerms && ackPrivacy && (!hasKycProp || agreeKyc);

  const handleUnifiedChange = (checked: boolean) => {
    onAgreeTermsChange(checked);
    onAckPrivacyChange(checked);
    if (onAgreeKycChange) {
      onAgreeKycChange(checked);
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      {/* Unified Single Legal Consent Ticket Box */}
      <div
        className={`p-2.5 sm:p-3 rounded-xl border bg-white transition-all ${
          showError && !isUnifiedChecked
            ? "border-red-300 ring-1 ring-red-200"
            : isUnifiedChecked
            ? "border-blue-200 shadow-2xs"
            : "border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="reg-agree-unified-legal"
            checked={isUnifiedChecked}
            onChange={(e) => handleUnifiedChange(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 text-[#0F2D5C] accent-[#0F2D5C] focus:ring-[#0F2D5C] border-slate-300 rounded cursor-pointer shrink-0"
            required
          />
          <div className="text-[10px] sm:text-[11px] text-slate-600 leading-normal select-none">
            <label htmlFor="reg-agree-unified-legal" className="cursor-pointer font-normal">
              I agree to the{" "}
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDocument("terms-of-service");
              }}
              className="font-semibold text-[#0F2D5C] hover:text-[#17407E] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none"
            >
              Terms
              <ExternalLink className="h-2 w-2 inline" />
            </button>
            <span className="text-slate-600">, </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDocument("privacy-policy");
              }}
              className="font-semibold text-[#0F2D5C] hover:text-[#17407E] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none"
            >
              Privacy Policy
              <ExternalLink className="h-2 w-2 inline" />
            </button>
            <span className="text-slate-600">, and </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDocument("kyc-notice");
              }}
              className="font-semibold text-[#0F2D5C] hover:text-[#17407E] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none"
            >
              KYC Notice
              <ExternalLink className="h-2 w-2 inline" />
            </button>
            <span className="text-slate-600">.</span>
          </div>
        </div>

        {showError && !isUnifiedChecked && (
          <div className="mt-1.5 pt-1.5 border-t border-red-200 text-red-700 text-[10px] font-medium flex items-center gap-1 animate-fadeIn">
            <AlertCircle className="h-3 w-3 shrink-0 text-red-600" />
            <span>Please accept terms, privacy policy, and KYC notice.</span>
          </div>
        )}
      </div>
    </div>
  );
}
