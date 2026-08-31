/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserPlus, Wallet, MousePointerClick, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

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
    <section id="how-it-works-section" className="py-20 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
            How SmartLink Works
          </h2>
          <p className="text-sm text-[#4B5563] font-normal leading-relaxed max-w-xl mx-auto">
            Get started in minutes. Experience automated processing with direct verification connections and instant wallet settlement.
          </p>
        </div>

        {/* 4 Steps Visual Flow */}
        <div className="relative">
          
          {/* Desktop Connecting Line Visual */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-[#E5E7EB] -translate-y-6 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={step.number}
                  id={`step-card-${idx + 1}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:border-[#0F2D5C] transition-all duration-300 relative z-10 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Step Icon Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[#6B7280]">
                        Step {step.number}
                      </span>
                    </div>

                    {/* Step Details */}
                    <div>
                      <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#4B5563] font-normal leading-relaxed mt-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner under steps */}
        <div className="mt-14 text-center">
          <button
            id="how-it-works-cta-btn"
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            Start Your First Verification Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default LandingHowItWorks;
