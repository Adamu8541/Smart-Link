/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Zap, Code, Clock, Lock, CheckCircle2, Award, Building2, Shield, Check } from "lucide-react";
import { motion } from "motion/react";

export const LandingTrustSection: React.FC = () => {
  const trustBadges = [
    {
      id: "secure-payments",
      title: "Secure Payments",
      description: "Encrypted transactions via PCI-DSS compliant payment gateways and automated virtual accounts.",
      icon: ShieldCheck,
      badgeText: "PCI-DSS Level 1",
    },
    {
      id: "fast-verification",
      title: "Fast Verification",
      description: "Third-party API connections for NIN, BVN, CAC, and FIRS lookups for sub-second responses.",
      icon: Zap,
      badgeText: "Sub-Second Latency",
    },
    {
      id: "reliable-apis",
      title: "Reliable APIs",
      description: "Developer-first JSON APIs with extensive webhooks, sandbox environments, and zero setup fee.",
      icon: Code,
      badgeText: "99.99% SLA Uptime",
    },
    {
      id: "247-availability",
      title: "24/7 Availability",
      description: "Round-the-clock service execution for identity lookups, utility bills, and scratch card tokens.",
      icon: Clock,
      badgeText: "24/7/365 Monitor",
    },
    {
      id: "enterprise-security",
      title: "Enterprise Security",
      description: "NDPR compliant data handling, IP whitelist restriction, and strict role-based access control.",
      icon: Lock,
      badgeText: "NDPR Compliant",
    },
  ];

  return (
    <section id="trust-section" className="py-16 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
            <Award className="h-3.5 w-3.5" />
            <span>Trusted Digital Platform</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Trusted by Nigerians for secure digital services
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] font-normal max-w-2xl mx-auto leading-relaxed">
            Powering identity compliance, automated bill settlements, and corporate verification for individuals, financial institutions, tech startups, and government agencies nationwide.
          </p>
        </div>

        {/* 5 Badges Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {trustBadges.map((badge, idx) => {
            const IconComponent = badge.icon;
            return (
              <motion.div
                key={badge.id}
                id={`trust-badge-${badge.id}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:border-[#0F2D5C] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
                      {badge.badgeText}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#111827] pt-1">
                    {badge.title}
                  </h3>

                  <p className="text-xs text-[#4B5563] font-normal leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[11px] font-bold text-[#0F2D5C]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C]" />
                  <span>Guaranteed Service</span>
                </div>
              </motion.div>
            );
          })}
        </div>



      </div>
    </section>
  );
};

export default LandingTrustSection;
