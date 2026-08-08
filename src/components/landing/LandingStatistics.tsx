/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, TrendingUp, Wallet, Layers, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const LandingStatistics: React.FC = () => {
  const statsList = [
    {
      id: "registered-users",
      label: "Registered Users",
      value: "500,000+",
      subtext: "Active agents, individuals, and businesses across Nigeria",
      icon: Users,
    },
    {
      id: "successful-verifications",
      label: "Successful Verifications",
      value: "10,000,000+",
      subtext: "NIN, BVN, CAC, & Tax queries processed seamlessly",
      icon: CheckCircle2,
    },
    {
      id: "transactions-processed",
      label: "Transactions Processed",
      value: "₦5,000,000,000+",
      subtext: "Total volume settled with 99.99% transaction success rate",
      icon: TrendingUp,
    },
    {
      id: "wallet-funding",
      label: "Wallet Funding",
      value: "₦2,500,000,000+",
      subtext: "Automated virtual bank deposits and card top-ups",
      icon: Wallet,
    },
    {
      id: "services-available",
      label: "Services Available",
      value: "50+",
      subtext: "Comprehensive verification APIs, VTU, and government filings",
      icon: Layers,
    },
  ];

  return (
    <section id="statistics-section" className="py-20 bg-[#F5F7FA] text-[#111827] relative overflow-hidden border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#0F2D5C] border border-blue-200">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>Platform Scale & Reach</span>
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
            Proven Performance & National Scale
          </h2>
          <p className="text-sm text-[#4B5563] font-normal leading-relaxed max-w-xl mx-auto">
            Our infrastructure powers millions of high-concurrency transactions every month with zero downtime.
          </p>
        </div>

        {/* 5 Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {statsList.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.id}
                id={`stat-card-${stat.id}`}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center hover:border-[#0F2D5C] transition-all duration-300 flex flex-col justify-between group shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-200 shadow-xs">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight group-hover:text-[#0F2D5C] transition-colors">
                      {stat.value}
                    </h3>
                    <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mt-1">
                      {stat.label}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[#E5E7EB]">
                  <p className="text-[11px] text-[#4B5563] font-normal leading-tight">
                    {stat.subtext}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default LandingStatistics;
