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
            ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-200"
            : allRequiredChecked
            ? "bg-emerald-50/40 border-emerald-200"
            : "bg-slate-50/90 border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${allRequiredChecked ? "text-emerald-600" : "text-blue-600"}`} />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Legal Agreements & Compliance
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleToggleAllRequired}
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {allRequiredChecked ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer shrink-0"
              required
            />
            <label htmlFor="reg-agree-terms" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenDocument("terms-of-service");
                }}
                className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
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
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer shrink-0"
              required
            />
            <label htmlFor="reg-ack-privacy" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
              I acknowledge that I have read and understood the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenDocument("privacy-policy");
                }}
                className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
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
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer shrink-0"
                required
              />
              <label htmlFor="reg-agree-kyc" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                I consent to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenDocument("kyc-notice");
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
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
          <div className="mt-3 pt-2 border-t border-rose-200 text-rose-700 text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>Please accept all required legal agreements above to create your account.</span>
          </div>
        )}
      </div>

      {/* Optional Marketing & Communication Preferences (Separated) */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Communication & Offers (Optional)
              </div>
              <div className="text-[11px] text-slate-500">
                Receive important updates, discounts, and service announcements.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMarketingOptions(!showMarketingOptions)}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-blue-50 focus:outline-none"
          >
            {showMarketingOptions ? "Hide Channels" : hasAnyMarketingSelected ? "Channels (Active)" : "Customize"}
            {showMarketingOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showMarketingOptions && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-fadeIn">
            {onMarketingEmailChange && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-email"
                  checked={marketingEmail}
                  onChange={(e) => onMarketingEmailChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Email updates (newsletters, monthly offers & security digests)</span>
              </label>
            )}

            {onMarketingSmsChange && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-sms"
                  checked={marketingSms}
                  onChange={(e) => onMarketingSmsChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <Smartphone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>SMS alerts (critical service alerts & discount flash promos)</span>
              </label>
            )}

            {onMarketingWhatsappChange && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="marketing-whatsapp"
                  checked={marketingWhatsapp}
                  onChange={(e) => onMarketingWhatsappChange(e.target.checked)}
                  className="h-3.5 w-3.5 text-emerald-600 rounded border-slate-300 cursor-pointer"
                />
                <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>WhatsApp broadcasts (fastest response channel & instant vouchers)</span>
              </label>
            )}

            <div className="text-[10px] text-slate-400 italic pt-1">
              * Marketing consent is strictly optional and can be toggled on or off at any time from your Account Settings.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
