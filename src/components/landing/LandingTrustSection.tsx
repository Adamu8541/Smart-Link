/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Zap, Code, Clock, Lock, CheckCircle2, Award } from "lucide-react";

export const LandingTrustSection: React.FC = () => {
  const trustBadges = [
    {
      id: "secure-payments",
      title: "Secure Payment Environment",
      description: "PCI-DSS Level 1 certified systems ensuring customer payment data is handled according to strict global security standards.",
      icon: ShieldCheck,
      badgeText: "PCI-DSS Level 1",
    },
    {
      id: "data-privacy",
      title: "Data Privacy Focused",
      description: "NDPR compliant processing, ensuring sensitive identity information is managed in strict accordance with Nigeria’s privacy regulations.",
      icon: Lock,
      badgeText: "NDPR Compliant",
    },
    {
      id: "uninterrupted-service",
      title: "Uninterrupted Service",
      description: "Infrastructure designed for 99.99% availability, ensuring your operations remain online during peak demand.",
      icon: Clock,
      badgeText: "99.99% Uptime",
    },
    {
      id: "rapid-api",
      title: "Rapid API Performance",
      description: "Optimized for efficiency, our sub-second API latency ensures your applications deliver fast, real-time results.",
      icon: Zap,
      badgeText: "Sub-second Latency",
    },
    {
      id: "proactive-oversight",
      title: "Proactive Oversight",
      description: "Round-the-clock monitoring 24/7/365 to proactively detect and resolve potential issues before they impact your business flow.",
      icon: Code,
      badgeText: "24/7/365 Monitor",
    },
  ];

  return (
    <section id="trust-section" aria-labelledby="trust-heading" className="py-8 sm:py-10 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2 max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white text-[#0F2D5C] border border-[#E5E7EB] shadow-2xs">
            <Award className="h-3 w-3" aria-hidden="true" />
            <span>Trusted Digital Platform</span>
          </div>
          <h2 id="trust-heading" className="text-xl sm:text-2.5xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            Built for Enterprise Reliability
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] font-normal max-w-2xl mx-auto leading-relaxed">
            Your business operations require infrastructure that is both stable and secure. SmartLink provides the enterprise-grade foundation to scale verifications and payments with absolute confidence.
          </p>
        </div>

        {/* 5 Badges Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-3.5">
          {trustBadges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={badge.id}
                id={`trust-badge-${badge.id}`}
                className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 shadow-xs hover:border-[#0F2D5C] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
                      {badge.badgeText}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#111827] pt-0.5">
                    {badge.title}
                  </h3>

                  <p className="text-[11px] text-[#4B5563] font-normal leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[10px] font-bold text-[#0F2D5C]">
                  <CheckCircle2 className="h-3 w-3 text-[#0F2D5C]" aria-hidden="true" />
                  <span>Guaranteed Service</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default LandingTrustSection;
