/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Zap, 
  ShieldCheck, 
  Activity, 
  Lock, 
  CheckCircle2, 
  Server, 
  FileCode2,
  Database,
  ArrowUpRight
} from "lucide-react";
import { motion } from "motion/react";

export const LandingWhySmartLink: React.FC = () => {
  const trustPoints = [
    {
      id: "ndpr-compliance",
      name: "Data Privacy & NDPR Aligned",
      benefit: "Safeguard customer PII with strict tokenization, role-based access, and zero unauthorized data retention or resale.",
      icon: ShieldCheck,
      proofBadge: "NDPA / NDPR Guidelines",
      proofDetail: "Encrypted at Rest & In Transit",
    },
    {
      id: "pci-dss-security",
      name: "Bank-Grade Payment Infrastructure",
      benefit: "Protect financial transactions and wallet settlements through 256-bit TLS encryption and PCI-DSS Level 1 compliant gateways.",
      icon: Lock,
      proofBadge: "256-Bit TLS Encryption",
      proofDetail: "PCI-DSS Level 1 Certified Switches",
    },
    {
      id: "uptime-sla",
      name: "99.9% High-Availability Architecture",
      benefit: "Eliminate downtime for your business operations and POS terminals with clustered cloud hosting and automated failovers.",
      icon: Server,
      proofBadge: "99.9% SLA Guarantee",
      proofDetail: "Automated Gateway Routing",
    },
    {
      id: "low-latency",
      name: "Sub-Second Transaction Execution",
      benefit: "Process customer verification lookups and utility settlements in under 450ms, eliminating checkout bottlenecks.",
      icon: Zap,
      proofBadge: "< 450ms Average Latency",
      proofDetail: "High-Throughput REST APIs",
    },
    {
      id: "multi-source-registry",
      name: "Multi-Source Registry Fallbacks",
      benefit: "Ensure continuous lookup resolution with intelligent multi-vendor failover routing across national identity and utility channels.",
      icon: Database,
      proofBadge: "Smart Multi-Route Routing",
      proofDetail: "Zero Single-Point-of-Failure",
    },
    {
      id: "proactive-telemetry",
      name: "24/7 Automated Health Telemetry",
      benefit: "Stay protected with real-time fraud monitoring, anomaly detection, and automated provider status monitoring.",
      icon: Activity,
      proofBadge: "Continuous Monitoring",
      proofDetail: "Automated Error Mitigation",
    },
  ];

  return (
    <section id="trust-credibility-section" className="py-20 bg-[#F8FAFC] text-[#111827] border-y border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EBF3FC] text-[#0F2D5C] border border-[#D0E2F7]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Infrastructure &amp; Compliance Standards
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
            Security, Compliance &amp; High-Availability Infrastructure
          </h2>
          <p className="text-base text-[#64748B] font-normal leading-relaxed max-w-2xl mx-auto">
            Built for business buyers, POS agents, and developers who require dependable data accuracy, transparent uptime, and strict data privacy standards.
          </p>
        </div>

        {/* Live Proof & Stats Bar */}
        <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#0F2D5C]">99.9%</div>
            <div className="text-xs text-[#64748B] mt-1 font-medium flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Verified Uptime SLA
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#0F2D5C]">&lt; 450ms</div>
            <div className="text-xs text-[#64748B] mt-1 font-medium flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#0F2D5C]" />
              Average API Latency
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#0F2D5C]">256-Bit</div>
            <div className="text-xs text-[#64748B] mt-1 font-medium flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#0F2D5C]" />
              TLS Data Encryption
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#0F2D5C]">100%</div>
            <div className="text-xs text-[#64748B] mt-1 font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              NDPA / NDPR Aligned
            </div>
          </div>
        </div>

        {/* 6 Rewritten Trust Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {trustPoints.map((point, idx) => {
            const IconComponent = point.icon;
            return (
              <motion.div
                key={point.id}
                id={`trust-card-${point.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 hover:border-[#0F2D5C] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#0F2D5C] border border-[#E2E8F0]">
                      {point.proofBadge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                    {point.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                    {point.benefit}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-medium text-[#475569]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-[#64748B]">{point.proofDetail}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Developer & Business Assurance Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-white border border-[#CBD5E1] shadow-xs max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0F2D5C]">
              <FileCode2 className="h-4 w-4" />
              <span>Developer-First Integration</span>
            </div>
            <h3 className="text-lg font-bold text-[#111827]">
              Need programmatic verification and automated webhook dispatches?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
              Access standardized REST API endpoints, sandbox test keys, and real-time transaction webhooks with clear payload specifications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#documentation"
              className="px-5 py-2.5 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>View API Specs</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default LandingWhySmartLink;

