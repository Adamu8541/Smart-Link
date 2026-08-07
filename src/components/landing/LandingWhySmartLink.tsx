/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Zap, ShieldCheck, Tag, Headphones, Activity, Lock, CheckCircle2, Check } from "lucide-react";
import { motion } from "motion/react";

export const LandingWhySmartLink: React.FC = () => {
  const whyFeatures = [
    {
      id: "fast-processing",
      name: "Fast Processing",
      description: "Automated direct portal dispatch guarantees average response execution under 0.5 seconds for all identity queries and VTU top-ups.",
      icon: Zap,
      stats: "<0.5s Average Latency",
    },
    {
      id: "secure-transactions",
      name: "Secure Transactions",
      description: "256-Bit SSL encryption, PCI-DSS compliance, and fraud protection algorithms shield your funds and sensitive user details.",
      icon: ShieldCheck,
      stats: "256-Bit SSL Encrypted",
    },
    {
      id: "affordable-pricing",
      name: "Affordable Pricing",
      description: "Enjoy unbeatable wholesale agent rates, transparent pricing models, and zero hidden surcharge fees across all services.",
      icon: Tag,
      stats: "Wholesale Agent Rates",
    },
    {
      id: "professional-support",
      name: "Professional Support",
      description: "Dedicated 24/7 technical support team available via WhatsApp, email, live ticket center, and phone lines.",
      icon: Headphones,
      stats: "24/7 Response Desk",
    },
    {
      id: "real-time-results",
      name: "Real-Time Results",
      description: "Direct real-time connections with NIMC, NIBSS, CAC, and FIRS databases ensure 100% verified accuracy.",
      icon: Activity,
      stats: "100% Verified Accuracy",
    },
    {
      id: "enterprise-security",
      name: "Enterprise Security",
      description: "NDPR compliant data privacy, IP whitelisting restrictions, two-factor authentication, and robust audit trail logging.",
      icon: Lock,
      stats: "NDPR & ISO Certified",
    },
  ];

  return (
    <section id="why-smartlink-section" className="py-20 bg-[#F5F7FA] text-[#111827] border-b border-[#E5E7EB] relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#0F2D5C] border border-blue-200">
            Why Choose SmartLink
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
            Built for Speed, Reliability, & Enterprise Scale
          </h2>
          <p className="text-sm text-[#4B5563] font-normal leading-relaxed max-w-2xl mx-auto">
            Discover why thousands of businesses, developers, agents, and individuals trust SmartLink for daily digital verifications and payments.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyFeatures.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.id}
                id={`why-card-${feature.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-7 hover:border-[#0F2D5C] shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                    {feature.name}
                  </h3>

                  <p className="text-xs text-[#4B5563] leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-[#E5E7EB] flex items-center gap-2 text-xs font-bold text-[#0F2D5C]">
                  <CheckCircle2 className="h-4 w-4 text-[#0F2D5C]" />
                  <span>Verified Platform Feature</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingWhySmartLink;
