/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserPlus, Wallet, MousePointerClick, CheckCircle2, ArrowRight } from "lucide-react";

interface LandingHowItWorksProps {
  onGetStarted: () => void;
}

export const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ onGetStarted }) => {
  const steps = [
    {
      number: "01",
      title: "Create Account",
      description: "Sign up for a free SmartLink account in under 60 seconds with your basic contact information.",
      icon: UserPlus,
    },
    {
      number: "02",
      title: "Fund Wallet",
      description: "Top up your wallet using instant dedicated virtual bank accounts, debit cards, or bank transfers.",
      icon: Wallet,
    },
    {
      number: "03",
      title: "Select Service",
      description: "Choose from NIN/BVN verification, CAC business lookup, utility bill settlement, or scratch cards.",
      icon: MousePointerClick,
    },
    {
      number: "04",
      title: "Receive Instant Results",
      description: "Get real-time verification slips, token numbers, airtime credits, or official PDF receipts in milliseconds.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works-section" aria-labelledby="how-it-works-heading" className="py-6 sm:py-10 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-1.5 max-w-3xl mx-auto mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-bold bg-white text-[#0F2D5C] border border-[#E5E7EB] shadow-2xs">
            Simple 4-Step Process
          </span>
          <h2 id="how-it-works-heading" className="text-lg sm:text-2.5xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            How SmartLink Works
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] font-normal leading-relaxed max-w-xl mx-auto">
            Get started in minutes. Experience automated processing with direct verification connections and instant wallet settlement.
          </p>
        </div>

        {/* 4 Steps Visual Flow */}
        <div className="relative">
          
          {/* Desktop Connecting Line Visual */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-[#E5E7EB] -translate-y-6 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.number}
                  id={`step-card-${idx + 1}`}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-5 shadow-xs hover:border-[#0F2D5C] transition-all duration-200 relative z-10 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Step Icon Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#374151] bg-[#F5F7FA] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                        Step {step.number}
                      </span>
                    </div>

                    {/* Step Details */}
                    <div>
                      <h3 className="text-xs sm:text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#4B5563] font-normal leading-relaxed mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner under steps */}
        <div className="mt-6 sm:mt-8 text-center">
          <button
            id="how-it-works-cta-btn"
            type="button"
            onClick={onGetStarted}
            className="min-h-[38px] sm:min-h-[42px] px-5 sm:px-7 py-2 sm:py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2 touch-manipulation"
          >
            <span>Start Your First Verification Now</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default LandingHowItWorks;
