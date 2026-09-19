/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowRight, 
  ShieldCheck, 
  UserPlus, 
  Zap, 
  Building2, 
  Store, 
  Code2, 
  User, 
  FileText, 
  CreditCard,
  Headphones,
  CheckCircle2
} from "lucide-react";

interface LandingCTASectionProps {
  onRegister: () => void;
  onContactSales: () => void;
}

type UserCategory = "individuals" | "agents" | "businesses" | "developers";

export const LandingCTASection: React.FC<LandingCTASectionProps> = ({
  onRegister,
  onContactSales,
}) => {
  const [activeTab, setActiveTab] = useState<UserCategory>("individuals");

  const ctaSegments = {
    individuals: {
      title: "For Individuals",
      icon: User,
      heading: "Verify Your Documents & Pay Bills Without the Queues",
      description: "Get verified NIN and BVN slips, buy instant electricity tokens, and top up SME data bundles in seconds.",
      primaryCTA: "Print Your NIN / BVN Slip",
      secondaryCTA: "Pay Electricity or Data",
      supportLine: "Instant PDF downloads • Zero registration fees • Settle via card or bank transfer",
      features: [
        "Instant standard & premium NIN slip generator",
        "Fast electricity tokens for all Nigerian Discos",
        "Affordable SME data bundles for MTN, Airtel, Glo & 9mobile",
      ],
    },
    agents: {
      title: "For POS & Cyber Cafe Agents",
      icon: Store,
      heading: "Grow Your Agency Business with High-Margin Services",
      description: "Offer full NIN printing, CAC filing assistance, BVN validation, and bulk VTU airtime to walk-in customers.",
      primaryCTA: "Open Agent Portal Account",
      secondaryCTA: "View Wholesale Agent Rates",
      supportLine: "Dedicated virtual funding accounts • Fast thermal & card slip printing • 24/7 WhatsApp agent desk",
      features: [
        "Wholesale discounts on data bundles and utility tokens",
        "Print-ready thermal and PVC card slip layouts",
        "Automated wallet funding with zero credit delays",
      ],
    },
    businesses: {
      title: "For Businesses & Enterprises",
      icon: Building2,
      heading: "Automate KYC Onboarding, CAC Filing & SCUML Compliance",
      description: "Verify identity credentials, confirm corporate RC numbers, and file business documentation with end-to-end security.",
      primaryCTA: "Register Your Business Account",
      secondaryCTA: "Request Enterprise Pricing",
      supportLine: "NDPA / NDPR compliant • Bulk verification spreadsheets • Dedicated enterprise account manager",
      features: [
        "Automated customer KYC & corporate RC verification",
        "Business name registration & SCUML status assistance",
        "Audit-ready logs and downloadable compliance receipts",
      ],
    },
    developers: {
      title: "For Developers & Tech Teams",
      icon: Code2,
      heading: "Integrate Reliable Verification & Billing APIs in Minutes",
      description: "Access high-availability REST endpoints with 99.9% uptime, sandbox testing keys, and real-time transaction webhooks.",
      primaryCTA: "Get Developer API Keys",
      secondaryCTA: "Explore API Documentation",
      supportLine: "Average <450ms latency • Standardized JSON webhooks • Multi-language code snippets",
      features: [
        "High-throughput NIN, BVN, and CAC REST endpoints",
        "Instant sandbox credentials and mock test data",
        "Automated balance threshold webhooks and alerting",
      ],
    },
  };

  const current = ctaSegments[activeTab];
  const CurrentIcon = current.icon;

  return (
    <section id="cta-section" className="py-16 sm:py-24 bg-white relative overflow-hidden text-[#111827] border-b border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs font-bold">
            <Zap className="h-3.5 w-3.5 text-[#0F2D5C]" aria-hidden="true" />
            <span>Tailored Solutions For Every Use Case</span>
          </div>

          <h2 id="cta-heading" className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight leading-tight">
            Start Verifying and Transacting in Seconds
          </h2>

          <p className="text-base text-[#374151] font-normal max-w-2xl mx-auto leading-relaxed">
            Choose your user profile below to access dedicated tools, pricing tiers, and direct onboarding workflows.
          </p>
        </div>

        {/* Audience Segment Tabs */}
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] w-full max-w-3xl" role="tablist" aria-label="Target audience profiles">
            {(Object.keys(ctaSegments) as UserCategory[]).map((tabKey) => {
              const seg = ctaSegments[tabKey];
              const TabIcon = seg.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  role="tab"
                  id={`cta-tab-${tabKey}`}
                  aria-selected={isActive}
                  aria-controls={`cta-panel-${tabKey}`}
                  onClick={() => setActiveTab(tabKey)}
                  className={`min-h-[48px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer touch-manipulation ${
                    isActive
                      ? "bg-[#0F2D5C] text-white shadow-xs"
                      : "text-[#1E293B] hover:text-[#0F2D5C] hover:bg-white/60"
                  }`}
                >
                  <TabIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#0F2D5C]"}`} aria-hidden="true" />
                  <span className="truncate">{seg.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic CTA Card */}
        <div
          key={activeTab}
          id={`cta-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`cta-tab-${activeTab}`}
          className="p-6 sm:p-10 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">
                  <CurrentIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{current.title}</span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827]">
                  {current.heading}
                </h3>
                <p className="text-sm sm:text-base text-[#374151] max-w-2xl leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons & Targeted Support Line */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <button
                  id={`cta-primary-${activeTab}`}
                  type="button"
                  onClick={onRegister}
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5 touch-manipulation"
                >
                  <UserPlus className="h-4 w-4 text-white" aria-hidden="true" />
                  <span>{current.primaryCTA}</span>
                  <ArrowRight className="h-4 w-4 text-white" aria-hidden="true" />
                </button>

                <button
                  id={`cta-secondary-${activeTab}`}
                  type="button"
                  onClick={activeTab === "businesses" ? onContactSales : onRegister}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#0F2D5C] border border-[#CBD5E1] font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
                >
                  {activeTab === "developers" ? (
                    <Code2 className="h-4 w-4 text-[#0F2D5C]" aria-hidden="true" />
                  ) : activeTab === "businesses" ? (
                    <Headphones className="h-4 w-4 text-[#0F2D5C]" aria-hidden="true" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#0F2D5C]" aria-hidden="true" />
                  )}
                  <span>{current.secondaryCTA}</span>
                </button>
              </div>

              {/* Specific Support Line */}
              <p className="text-xs text-[#374151] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-4 w-4 text-[#0F2D5C] shrink-0" aria-hidden="true" />
                <span>{current.supportLine}</span>
              </p>
            </div>

        </div>

        {/* Global Bottom Reassurance */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#374151]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Instant Automated Dispatch
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Dedicated Virtual Account Funding
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            24/7 Nigerian Support Desk
          </span>
        </div>

      </div>
    </section>
  );
};

export default LandingCTASection;

