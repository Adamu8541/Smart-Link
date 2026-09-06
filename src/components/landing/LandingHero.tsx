/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

interface LandingHeroProps {
  onGetStarted: () => void;
  onExploreServices: () => void;
  onLogin?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onGetStarted,
  onExploreServices,
}) => {
  return (
    <section id="hero-section" className="relative overflow-hidden bg-white text-[#111827] py-10 sm:py-16 lg:pt-20 lg:pb-28 border-b border-[#E5E7EB]">
      
      {/* Background Subtle Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,45,92,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="space-y-6 sm:space-y-8">
          
          {/* Main Semantic H1 Headline - Pre-rendered instantly for fastest mobile LCP */}
          <h1
            id="hero-main-heading"
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-[#111827]"
          >
            Instant Identity Verification, Business Filing &amp;{" "}
            <span className="text-[#0F2D5C]">
              Automated Utility Bills in Nigeria
            </span>
          </h1>

          {/* High-Intent Subheading */}
          <p
            id="hero-subheading"
            className="text-sm sm:text-base md:text-lg text-[#4B5563] font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Verify NIN and BVN records with slip downloads, register businesses with CAC, and settle electricity, data, and airtime transactions in seconds through one unified portal and developer API.
          </p>

          {/* 3 Focused Benefit Bullets - Immediately visible, zero animation delay */}
          <div
            id="hero-benefits-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-2 text-left max-w-3xl mx-auto"
          >
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <ShieldCheck className="h-5 w-5 text-[#0F2D5C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0F2D5C]">Instant Verification &amp; Slips</p>
                <p className="text-xs text-[#64748B] mt-0.5">Standard/premium NIN slips, BVN cards, and CAC reports with QR codes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <Zap className="h-5 w-5 text-[#0F2D5C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0F2D5C]">Automated Bills &amp; VTU</p>
                <p className="text-xs text-[#64748B] mt-0.5">Zero-delay Disco tokens, cheap SME data bundles, airtime, and exam pins.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <Lock className="h-5 w-5 text-[#0F2D5C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0F2D5C]">Bank-Grade &amp; 99.9% Uptime</p>
                <p className="text-xs text-[#64748B] mt-0.5">Dedicated virtual account funding, encrypted payouts, and REST APIs.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons with optimal mobile tap targets (>= 48px) */}
          <div
            id="hero-actions"
            className="flex flex-col items-center justify-center gap-3 pt-2"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                id="hero-primary-btn"
                onClick={onGetStarted}
                type="button"
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5 touch-manipulation"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                id="hero-secondary-btn"
                onClick={onExploreServices}
                type="button"
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-white hover:bg-[#F5F7FA] active:bg-[#E5E7EB] text-[#0F2D5C] border border-[#0F2D5C] font-bold rounded-xl text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5 touch-manipulation"
              >
                <span>Explore Services &amp; Pricing</span>
              </button>
            </div>
            <p className="text-xs text-[#6B7280] pt-2 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Instant Automated Processing</span>
              <span>•</span>
              <span>Dedicated Virtual Account Funding</span>
              <span>•</span>
              <span>No Hidden Setup Fees</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingHero;
