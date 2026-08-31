/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowRight, PhoneCall, ShieldCheck, UserPlus, Zap } from "lucide-react";
import { motion } from "motion/react";

interface LandingCTASectionProps {
  onRegister: () => void;
  onContactSales: () => void;
}

export const LandingCTASection: React.FC<LandingCTASectionProps> = ({
  onRegister,
  onContactSales,
}) => {
  return (
    <section id="cta-section" className="py-20 bg-white relative overflow-hidden text-[#111827] border-b border-[#E5E7EB]">
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs font-bold"
        >
          <Zap className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>Instant Onboarding • Zero Setup Fees</span>
        </motion.div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl font-bold text-[#111827] tracking-tight leading-tight max-w-3xl mx-auto">
          Ready to get started?
        </h2>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-[#4B5563] font-normal max-w-2xl mx-auto leading-relaxed">
          Join over 500,000 agents, developers, and enterprise businesses processing instant identity verifications, corporate filings, and automated payments daily.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            id="cta-btn-create-account"
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <UserPlus className="h-4 w-4 text-white" />
            Create Free Account
            <ArrowRight className="h-4 w-4 text-white" />
          </button>

          <button
            id="cta-btn-contact-sales"
            onClick={onContactSales}
            className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-[#F5F7FA] text-[#111827] border border-[#E5E7EB] font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PhoneCall className="h-4 w-4 text-[#0F2D5C]" />
            Contact Sales
          </button>
        </div>

        {/* Guarantee details */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4B5563]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#0F2D5C]" />
            Instant Activation
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#0F2D5C]" />
            24/7 Live Support
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#0F2D5C]" />
            NDPR Compliant
          </span>
        </div>

      </div>
    </section>
  );
};

export default LandingCTASection;
