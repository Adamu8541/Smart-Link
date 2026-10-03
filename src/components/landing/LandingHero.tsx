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
    <section id="hero-section" className="relative overflow-hidden bg-white text-[#111827] py-8 sm:py-12 lg:py-16 border-b border-[#E5E7EB]">
      
      {/* Background Subtle Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,45,92,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center w-full">
        <div className="w-full flex flex-col gap-4 sm:gap-6">
          
          {/* Main Semantic H1 Headline */}
          <h1
            id="hero-main-heading"
            className="text-2xl sm:text-3.5xl md:text-4.5xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#111827]"
          >
            Instant Identity Verification, Business Filing &amp;{" "}
            <span className="text-[#0F2D5C]">
              Automated Utility Bills in Nigeria
            </span>
          </h1>

          {/* High-Intent Subheading */}
          <p
            id="hero-subheading"
            className="text-xs sm:text-sm md:text-base text-[#374151] font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Verify NIN and BVN records with slip downloads, register businesses with CAC, and settle electricity, data, and airtime transactions in seconds through one unified portal and developer API.
          </p>

          {/* 3 Focused Benefit Bullets */}
          <div
            id="hero-benefits-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1 text-left max-w-3xl mx-auto w-full"
          >
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <ShieldCheck className="h-4.5 w-4.5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0F2D5C]">Instant Verification &amp; Slips</p>
                <p className="text-[11px] text-[#374151] mt-0.5 leading-snug">Regular/premium NIN slips, BVN cards, and CAC reports with QR codes.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <Zap className="h-4.5 w-4.5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0F2D5C]">Automated Bills &amp; VTU</p>
                <p className="text-[11px] text-[#374151] mt-0.5 leading-snug">Zero-delay Disco tokens, cheap SME data bundles, airtime, and exam pins.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <Lock className="h-4.5 w-4.5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0F2D5C]">Bank-Grade &amp; 99.9% Uptime</p>
                <p className="text-[11px] text-[#374151] mt-0.5 leading-snug">Dedicated virtual account funding, encrypted payouts, and REST APIs.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            id="hero-actions"
            className="flex flex-col items-center justify-center gap-2 pt-1"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 w-full sm:w-auto">
              <button
                id="hero-primary-btn"
                onClick={onGetStarted}
                type="button"
                className="w-full sm:w-auto min-h-[42px] px-6 sm:px-7 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                id="hero-secondary-btn"
                onClick={onExploreServices}
                type="button"
                className="w-full sm:w-auto min-h-[42px] px-6 sm:px-7 py-2.5 bg-white hover:bg-[#F5F7FA] active:bg-[#E5E7EB] text-[#0F2D5C] border border-[#0F2D5C] font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
              >
                <span>Explore Services &amp; Pricing</span>
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-[#4B5563] pt-1 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Instant Automated Processing</span>
              <span aria-hidden="true">•</span>
              <span>Dedicated Virtual Account Funding</span>
              <span aria-hidden="true">•</span>
              <span>No Hidden Setup Fees</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingHero;
