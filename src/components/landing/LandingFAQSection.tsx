/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight, ShieldCheck, Wallet, Code2, Building2, Fingerprint, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  id: string;
  category: "Wallet Funding" | "Developer API" | "CAC Registration" | "Identity Verification" | "Utility & VTU";
  icon: React.ElementType;
  question: string;
  answer: string;
  keywords: string;
}

export const LandingFAQSection: React.FC<{ onContactSupport?: () => void; onGetStarted?: () => void }> = ({
  onContactSupport,
  onGetStarted,
}) => {
  const [openId, setOpenId] = useState<string | null>("faq-wallet-funding");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const faqs: FAQItem[] = [
    {
      id: "faq-wallet-funding",
      category: "Wallet Funding",
      icon: Wallet,
      question: "How does wallet funding work on SmartLink NG?",
      answer:
        "Every registered user and agent automatically receives dedicated virtual bank account numbers (Wema Bank, Moniepoint, Sterling, or Providus). Any bank transfer made to your dedicated account is credited to your SmartLink wallet instantly with zero manual confirmation. You can also top up securely using debit cards or Paystack checkout.",
      keywords: "wallet funding virtual account transfer deposit instant credit",
    },
    {
      id: "faq-api-integration",
      category: "Developer API",
      icon: Code2,
      question: "How do developers integrate SmartLink's verification and VTU APIs?",
      answer:
        "Developers can generate live and sandbox API keys directly from their dashboard. We offer high-performance RESTful JSON endpoints with sub-450ms response latency, complete Postman collections, standardized response codes, and automated webhook alerts for wallet debits, meter tokens, and verification lookups.",
      keywords: "API integration developer rest endpoint webhooks latency sandbox",
    },
    {
      id: "faq-cac-requirements",
      category: "CAC Registration",
      icon: Building2,
      question: "What are the requirements for CAC Business Name & Company Registration?",
      answer:
        "To register a Business Name or Company with CAC, you need: 1) Two proposed business names for reservation, 2) Nature and description of business activities, 3) Valid government-issued ID (NIN, Driver's License, or Intl Passport), 4) Passport photograph and signature image, and 5) Official business address and contact phone/email. Our accredited agents process your filing end-to-end within 48 to 72 hours.",
      keywords: "CAC registration business name requirements filing documents",
    },
    {
      id: "faq-nin-slip",
      category: "Identity Verification",
      icon: Fingerprint,
      question: "How do I verify and download my NIN Slip in Nigeria?",
      answer:
        "Simply enter the 11-digit National Identity Number (NIN) or registered phone number in our verification portal. The system validates the record directly against national databases and instantly generates downloadable, high-resolution Standard, Premium, or Digital Green PDF slips complete with verifiable QR barcodes.",
      keywords: "NIN slip download print PDF premium QR code NIMC",
    },
    {
      id: "faq-bvn-validation",
      category: "Identity Verification",
      icon: ShieldCheck,
      question: "How long does BVN verification and ID card layout generation take?",
      answer:
        "BVN verification on SmartLink NG is instantaneous. The system matches bank-grade records, validates account holder demography, and allows you to print or download a formatted BVN identity card and slip within seconds.",
      keywords: "BVN verification plastic card NIBSS validation bank ID",
    },
    {
      id: "faq-utility-meter",
      category: "Utility & VTU",
      icon: Zap,
      question: "How fast are electricity tokens and SME data bundles delivered?",
      answer:
        "All utility payments, electricity meter tokens (for all Nigerian Discos including IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, etc.), and VTU airtime/data bundles (MTN, Airtel, Glo, 9mobile) are dispatched via automated direct telecom switches within 1 to 3 seconds.",
      keywords: "electricity token disco prepaid meter SME data airtime VTU instant",
    },
  ];

  const categories = ["All", "Wallet Funding", "Developer API", "CAC Registration", "Identity Verification", "Utility & VTU"];

  const filteredFaqs = activeCategory === "All" ? faqs : faqs.filter((f) => f.category === activeCategory);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq-section" className="py-16 sm:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3FC] text-[#0F2D5C] text-xs font-bold border border-[#D0E2F7]">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Everything You Need to Know About SmartLink NG
          </h2>

          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions on wallet funding, developer API integration, CAC business registration requirements, and instant identity validation.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#0F2D5C] text-white shadow-xs"
                  : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F2D5C]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen ? "bg-white border-[#0F2D5C] shadow-sm" : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <button
                  id={`faq-btn-${faq.id}`}
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isOpen ? "bg-[#0F2D5C] text-white" : "bg-[#F1F5F9] text-[#0F2D5C]"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#0F2D5C] uppercase tracking-wider block mb-1">
                        {faq.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-full shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 bg-[#F1F5F9] text-[#0F2D5C]" : "text-[#64748B]"}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] ml-12">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom Support CTA */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs sm:text-sm font-medium text-[#475569]">
            Have a specific question not covered here? Our support team is active 24/7.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onContactSupport}
              className="px-5 py-2.5 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>Chat with Support</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {onGetStarted && (
              <button
                onClick={onGetStarted}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0F2D5C] text-xs font-bold transition-all cursor-pointer"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default LandingFAQSection;
