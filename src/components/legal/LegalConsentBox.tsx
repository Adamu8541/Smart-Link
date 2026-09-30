/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  Mail,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronUp
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
  marketingEmail = false,
  onMarketingEmailChange,
  marketingSms = false,
  onMarketingSmsChange,
  marketingWhatsapp = false,
  onMarketingWhatsappChange,
  showError = false,
}: LegalConsentBoxProps) {
  const [showMarketingOptions, setShowMarketingOptions] = useState<boolean>(false);

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
    <div className="space-y-2 text-left">
      {/* Unified Single Legal Consent Ticket Box */}
      <div
        className={`p-3.5 rounded-2xl border bg-white transition-all ${
          showError && !isUnifiedChecked
            ? "border-red-300 ring-2 ring-red-200"
            : isUnifiedChecked
            ? "border-blue-200 shadow-2xs"
            : "border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="reg-agree-unified-legal"
            checked={isUnifiedChecked}
            onChange={(e) => handleUnifiedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-[#0F2D5C] accent-[#0F2D5C] focus:ring-[#0F2D5C] border-slate-300 rounded cursor-pointer shrink-0"
            required
          />
          <div className="text-xs text-slate-600 leading-relaxed select-none">
            <label htmlFor="reg-agree-unified-legal" className="cursor-pointer font-normal">
              I have read and agree to the{" "}
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
              Terms of Service
              <ExternalLink className="h-2.5 w-2.5 inline" />
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
              Privacy Policy (NDPA 2023)
              <ExternalLink className="h-2.5 w-2.5 inline" />
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
              Identity & KYC Verification Notice
              <ExternalLink className="h-2.5 w-2.5 inline" />
            </button>
            <span className="text-slate-600">.</span>
          </div>
        </div>

        {showError && !isUnifiedChecked && (
          <div className="mt-2.5 pt-2 border-t border-red-200 text-red-700 text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
            <span>Please check the box to accept the terms, privacy policy, and KYC notice.</span>
          </div>
        )}
      </div>

      {/* Optional communication preferences */}
      {(onMarketingEmailChange || onMarketingSmsChange || onMarketingWhatsappChange) && (
        <div className="px-1">
          <button
            type="button"
            onClick={() => setShowMarketingOptions(!showMarketingOptions)}
            className="text-[11px] text-slate-500 hover:text-[#0F2D5C] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
          >
            <span>Communication & updates (Optional)</span>
            {showMarketingOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showMarketingOptions && (
            <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-fadeIn text-xs text-slate-600">
              {onMarketingEmailChange && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingEmail}
                    onChange={(e) => onMarketingEmailChange(e.target.checked)}
                    className="h-3.5 w-3.5 text-[#0F2D5C] accent-[#0F2D5C] rounded border-slate-300 cursor-pointer"
                  />
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Email product updates & receipts</span>
                </label>
              )}

              {onMarketingSmsChange && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingSms}
                    onChange={(e) => onMarketingSmsChange(e.target.checked)}
                    className="h-3.5 w-3.5 text-[#0F2D5C] accent-[#0F2D5C] rounded border-slate-300 cursor-pointer"
                  />
                  <Smartphone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>SMS service alerts & announcements</span>
                </label>
              )}

              {onMarketingWhatsappChange && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingWhatsapp}
                    onChange={(e) => onMarketingWhatsappChange(e.target.checked)}
                    className="h-3.5 w-3.5 text-[#0F2D5C] accent-[#0F2D5C] rounded border-slate-300 cursor-pointer"
                  />
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>WhatsApp alerts & notifications</span>
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
