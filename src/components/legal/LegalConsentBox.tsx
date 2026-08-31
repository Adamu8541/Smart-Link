/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square
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
  showError = false
}: LegalConsentBoxProps) {
  const [showMarketingOptions, setShowMarketingOptions] = useState<boolean>(false);

  const hasKycProp = typeof onAgreeKycChange === "function";
  const allRequiredChecked = agreeTerms && ackPrivacy && (!hasKycProp || agreeKyc);
  const hasAnyMarketingSelected = marketingEmail || marketingSms || marketingWhatsapp;

  const handleToggleAllRequired = () => {
    const nextVal = !allRequiredChecked;
    onAgreeTermsChange(nextVal);
    onAckPrivacyChange(nextVal);
    if (onAgreeKycChange) {
      onAgreeKycChange(nextVal);
    }
  };

  return (
    <div className="space-y-3.5 text-left">
      {/* Required Legal Consent Section */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          showError && !allRequiredChecked
            ? "bg-[#F5F7FA]/70 border-[#E5E7EB] ring-2 ring-[#E5E7EB]"
            : allRequiredChecked
            ? "bg-[#F5F7FA]/40 border-[#E5E7EB]"
            : "bg-[#F5F7FA]/90 border-[#E5E7EB]/80"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E5E7EB]/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${allRequiredChecked ? "text-[#0F2D5C]" : "text-[#0F2D5C]"}`} />
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Legal Agreements & Compliance
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleToggleAllRequired}
            className="text-[11px] font-semibold text-[#0F2D5C] hover:text-[#0F2D5C] bg-[#F5F7FA]/80 hover:bg-[#E5E7EB]/80 px-2.5 py-1 rounded-lg border border-[#E5E7EB] transition-colors flex items-center gap-1 cursor-pointer"
          >
            {allRequiredChecked ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C]" />
                <span>All Accepted</span>
              </>
            ) : (
              <span>Agree to All</span>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {/* Terms of Service Checkbox */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="reg-agree-terms"
              checked={agreeTerms}
              onChange={(e) => onAgreeTermsChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-[#0F2D5C] focus:ring-[#0F2D5C] border-[#E5E7EB] rounded cursor-pointer shrink-0"
              required
            />
            <label htmlFor="reg-agree-terms" className="text-xs text-[#4B5563] leading-relaxed cursor-pointer select-none">
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenDocument("terms-of-service");
                }}
                className="font-semibold text-[#0F2D5C] hover:text-[#0F2D5C] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] rounded"
              >
                Terms of Service / Terms of Use
                <ExternalLink className="h-3 w-3 inline" />
              </button>
              .
            </label>
          </div>

          {/* Privacy Policy Checkbox */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="reg-ack-privacy"
              checked={ackPrivacy}
              onChange={(e) => onAckPrivacyChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-[#0F2D5C] focus:ring-[#0F2D5C] border-[#E5E7EB] rounded cursor-pointer shrink-0"
              required
            />
            <label htmlFor="reg-ack-privacy" className="text-xs text-[#4B5563] leading-relaxed cursor-pointer select-none">
              I acknowledge that I have read and understood the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenDocument("privacy-policy");
                }}
                className="font-semibold text-[#0F2D5C] hover:text-[#0F2D5C] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] rounded"
              >
                Privacy Policy (NDPA 2023)
                <ExternalLink className="h-3 w-3 inline" />
              </button>
              .
            </label>
          </div>

          {/* KYC & Identity Verification Checkbox */}
          {onAgreeKycChange && (
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="reg-agree-kyc"
                checked={agreeKyc}
                onChange={(e) => onAgreeKycChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-[#0F2D5C] focus:ring-[#0F2D5C] border-[#E5E7EB] rounded cursor-pointer shrink-0"
                required
              />
              <label htmlFor="reg-agree-kyc" className="text-xs text-[#4B5563] leading-relaxed cursor-pointer select-none">
                I consent to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenDocument("kyc-notice");
                  }}
                  className="font-semibold text-[#0F2D5C] hover:text-[#0F2D5C] underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] rounded"
                >
                  Identity Verification & KYC Notice
                  <ExternalLink className="h-3 w-3 inline" />
                </button>{" "}
                for identity & anti-fraud checks.
              </label>
            </div>
          )}
        </div>

        {showError && !allRequiredChecked && (
          <div className="mt-3 pt-2 border-t border-[#E5E7EB] text-[#0F2D5C] text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#0F2D5C]" />
            <span>Please accept all required legal agreements above to create your account.</span>
          </div>
        )}
      </div>

      {/* Optional Marketing & Communication Preferences (Separated) */}
      <div className="p-3.5 bg-white rounded-xl border border-[#E5E7EB]/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#6B7280]" />
            <div>
              <div className="text-xs font-semibold text-[#111827]">
                Communication & Offers (Optional)
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Receive important updates, discounts, and service announcements.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMarketingOptions(!showMarketingOptions)}
            className="text-xs text-[#0F2D5C] font-semibold hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-[#F5F7FA] focus:outline-none"
          >
            {showMarketingOptions ? "Hide Channels" : hasAnyMarketingSelected ? "Channels (Active)" : "Customize"}
            {showMarketingOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showMarketingOptions && (
          <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2.5 animate-fadeIn">
            {onMarketingEmailChange && (
              <label className="flex items-center gap-2.5 text-xs text-[#4B5563] cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-email"
                  checked={marketingEmail}
                  onChange={(e) => onMarketingEmailChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-[#0F2D5C] rounded border-[#E5E7EB] cursor-pointer"
                />
                <Mail className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                <span>Email updates (newsletters, monthly offers & security digests)</span>
              </label>
            )}

            {onMarketingSmsChange && (
              <label className="flex items-center gap-2.5 text-xs text-[#4B5563] cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-sms"
                  checked={marketingSms}
                  onChange={(e) => onMarketingSmsChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-[#0F2D5C] rounded border-[#E5E7EB] cursor-pointer"
                />
                <Smartphone className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                <span>SMS alerts (critical service alerts & discount flash promos)</span>
              </label>
            )}

            {onMarketingWhatsappChange && (
              <label className="flex items-center gap-2.5 text-xs text-[#4B5563] cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-whatsapp"
                  checked={marketingWhatsapp}
                  onChange={(e) => onMarketingWhatsappChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-[#0F2D5C] rounded border-[#E5E7EB] cursor-pointer"
                />
                <MessageSquare className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
                <span>WhatsApp broadcasts (fastest response channel & instant vouchers)</span>
              </label>
            )}

            <div className="text-[10px] text-[#9CA3AF] italic pt-1">
              * Marketing consent is strictly optional and can be toggled on or off at any time from your Account Settings.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
