/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  FileCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  QrCode,
  FileText,
  BadgeAlert,
  Download,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import LandingHeader from "../landing/LandingHeader";
import LandingFooter from "../landing/LandingFooter";

interface VerificationPublicViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onNavigateHome: () => void;
  onNavigateLegal?: (docId?: string) => void;
}

export const VerificationPublicView: React.FC<VerificationPublicViewProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
  onNavigateLegal,
}) => {
  const [activeTab, setActiveTab] = useState<"nin" | "bvn" | "cac" | "scuml">("nin");

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-[#111827] antialiased">
      <SEOHead
        title="National Identity Verification, NIN Slips, BVN & CAC Portal | Smart Link NG"
        description="Verify National Identity Numbers (NIN), print official standard & premium plastic ID slips, validate BVN records via NIBSS, and incorporate CAC Business Names & SCUML certificates in Nigeria."
        canonicalUrl="https://smartlinkng.com.ng/verification"
      />

      {/* Header */}
      <LandingHeader
        onLogin={onLogin}
        onRegister={onRegister}
        onGetStarted={onGetStarted}
        onNavigateSection={() => onNavigateHome()}
      />

      {/* Hero */}
      <header className="bg-gradient-to-b from-[#0F2D5C] to-[#17407E] text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#0F2D5C]/30 shadow-inner">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Secure Enterprise Identity &amp; Corporate Verification Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Instant NIN Verification, BVN Validation &amp; CAC Enterprise Registration
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Generate printable standard and premium plastic NIN slips with secure QR codes, validate Bank Verification Numbers (BVN), and incorporate businesses seamlessly.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>Verify / Print Slip Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("nin")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "nin"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>NIN Slip &amp; Premium Plastic Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bvn")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "bvn"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>BVN Verification &amp; Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cac")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "cac"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Building2 className="h-4 w-4 text-purple-400" />
            <span>CAC Business Registration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scuml")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "scuml"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FileCheck className="h-4 w-4 text-amber-500" />
            <span>SCUML Certificate Assistance</span>
          </button>
        </div>

        {/* Tab 1: NIN Slips */}
        {activeTab === "nin" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>NIMC Official Formatting Standard</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                  Standard NIN Slips &amp; High-Definition Plastic Cards
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Verify National Identity Numbers via 11-digit NIN or 16-character Virtual NIN (vNIN). Instant verification yields high-resolution PDF slips with tamper-evident QR verification codes.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Standard Slip:</strong> Full legal format with biometric photo, personal demography, and scannable QR.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Premium Plastic Layout:</strong> Standard CR80 double-sided card layout formatted for PVC thermal card printers.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Full NDPA Compliance:</strong> Encrypted lookup channels with strict consent compliance.</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Generate NIN Slip</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Visual Card Mock */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4 text-center">
                <div className="max-w-sm mx-auto bg-gradient-to-br from-[#0F2D5C] to-[#1E3A8A] text-white rounded-2xl p-5 shadow-xl text-left relative overflow-hidden border border-white/20">
                  <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-3">
                    <div className="text-[10px] font-black tracking-wider uppercase text-emerald-300">
                      Federal Republic of Nigeria
                    </div>
                    <div className="text-[9px] font-mono text-gray-300">NATIONAL ID</div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">
                      PHOTO
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold">ABUBAKAR MUHAMMAD</div>
                      <div className="text-[10px] text-gray-300">NIN: 7281 •••• 9201</div>
                      <div className="text-[10px] text-gray-300">DOB: 14-MAY-1994</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[9px] text-gray-300">
                    <span>STATUS: VERIFIED</span>
                    <span className="font-mono">QR ENCRYPTED</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 italic">
                  Print-ready in under 15 seconds. Compatible with all standard A4 and PVC ID card printers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: BVN */}
        {activeTab === "bvn" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Bank Verification Number (BVN) Validation</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
              Validate customer BVN details against verified NIBSS interbank records in real-time. Generate downloadable digital BVN identity certificates and plastic ID cards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-black text-[#0F2D5C]">1. Account Match Check</div>
                <p className="text-xs text-gray-600">Cross-match account holder names, phone numbers, and dates of birth with bank records.</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-black text-[#0F2D5C]">2. Formatted ID Slip</div>
                <p className="text-xs text-gray-600">Download formatted digital BVN slips with bank verification stamps and timestamps.</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-black text-[#0F2D5C]">3. API Integration</div>
                <p className="text-xs text-gray-600">RESTful JSON endpoints for onboarding KYC in loan and banking applications.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Validate BVN Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: CAC */}
        {activeTab === "cac" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Corporate Affairs Commission (CAC) Registration</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
              Incorporate your Business Name or Private Limited Liability Company with accredited CAC agents. We handle name reservation, document upload, status reports, and certificate delivery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                <div className="text-base font-black text-purple-950">Business Name Registration (BN)</div>
                <div className="text-xl font-black text-purple-800">₦18,500 - ₦24,000</div>
                <ul className="text-xs text-gray-700 space-y-1.5">
                  <li>• Name availability search &amp; reservation</li>
                  <li>• Official Certificate of Registration</li>
                  <li>• Federal Status Report with QR Code</li>
                  <li>• Turnaround: 48 to 72 Business Hours</li>
                </ul>
              </div>

              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <div className="text-base font-black text-blue-950">Private Limited Company (LTD)</div>
                <div className="text-xl font-black text-[#0F2D5C]">₦48,000 - ₦65,000</div>
                <ul className="text-xs text-gray-700 space-y-1.5">
                  <li>• 1 Million+ Share Capital Incorporation</li>
                  <li>• Memorandum &amp; Articles of Association (MEMART)</li>
                  <li>• Tax Identification Number (TIN) Included</li>
                  <li>• Turnaround: 3 to 5 Business Days</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Register Business With CAC</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: SCUML */}
        {activeTab === "scuml" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-gray-900">SCUML Anti-Money Laundering Certificate Assistance</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
              Assistance for Designated Non-Financial Businesses and Professions (Real Estate, Car Dealerships, Law Firms, Consulting, Hotels, NGOs) to obtain official SCUML AML/CFT compliance certificates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-bold text-gray-900">1. Document Review</div>
                <p className="text-xs text-gray-600">CAC documents, Tax Clearances, and Director IDs audited to ensure zero query rejections.</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-bold text-gray-900">2. Portal Submission</div>
                <p className="text-xs text-gray-600">Application filed on official SCUML portal with tracking reference number.</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="text-sm font-bold text-gray-900">3. Certificate Procurement</div>
                <p className="text-xs text-gray-600">Official certificate delivered, enabling corporate bank account openings nationwide.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Apply for SCUML Certificate</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <LandingFooter
        onNavigateSection={() => onNavigateHome()}
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigateLegal={onNavigateLegal}
        activeInfoTab={null}
        setActiveInfoTab={() => {}}
      />
    </div>
  );
};

export default VerificationPublicView;
