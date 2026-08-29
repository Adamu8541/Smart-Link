/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Fingerprint,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Building2,
  Wallet,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  Grid,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";

interface ServiceCardItem {
  id: string;
  name: string;
  category: "Identity" | "Corporate" | "Payments" | "Education" | "Telecom";
  description: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}

interface LandingServicesPreviewProps {
  onSelectService?: (serviceId: string) => void;
  onExploreAll?: () => void;
}

export const LandingServicesPreview: React.FC<LandingServicesPreviewProps> = ({
  onSelectService,
  onExploreAll,
}) => {
  const services: ServiceCardItem[] = [
    {
      id: "nin-verification",
      name: "NIN Verification",
      category: "Identity",
      description: "Instant National Identity Number lookup, vNIN validation, demographic matching, and printable official slips.",
      icon: Fingerprint,
      badge: "Instant API",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "bvn-verification",
      name: "BVN Verification",
      category: "Identity",
      description: "Secure Bank Verification Number matching, date of birth validation, and photo identity confirmation via NIBSS.",
      icon: ShieldCheck,
      badge: "Bank Grade",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "name-verification",
      name: "Name Verification",
      category: "Identity",
      description: "Real-time bank account name match, NUBAN verification, and identity fraud prevention across 50+ Nigerian banks.",
      icon: UserCheck,
      badge: "NUBAN Lookup",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "tin-verification",
      name: "TIN Verification",
      category: "Corporate",
      description: "Validate Tax Identification Numbers directly with Federal Inland Revenue Service (FIRS) and State tax boards.",
      icon: FileCheck,
      badge: "FIRS Direct",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "cac-verification",
      name: "CAC Verification",
      category: "Corporate",
      description: "Corporate Affairs Commission RC number search, business name status, director verification, and incorporation filings.",
      icon: Building2,
      badge: "CAC Certified",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "wallet-funding",
      name: "Wallet Funding",
      category: "Payments",
      description: "Automated dedicated virtual bank account creation, instant top-ups via debit cards, USSD, and bank transfers.",
      icon: Wallet,
      badge: "Auto-Credit",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "airtime",
      name: "Airtime VTU",
      category: "Telecom",
      description: "Automated Virtual Top-Up airtime recharge across MTN, Airtel, Glo, and 9mobile networks with agent commission discounts.",
      icon: Smartphone,
      badge: "Instant Top-Up",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "data",
      name: "Internet Data",
      category: "Telecom",
      description: "High-speed SME, Direct, and Gift data bundles delivered instantly with unbeatably cheap wholesale prices.",
      icon: Wifi,
      badge: "SME & Direct",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "electricity",
      name: "Electricity Bills",
      category: "Payments",
      description: "Instant prepaid meter token generation and postpaid bill settlement for IKEDC, EKEDC, KEDCO, AEDC, PHED & more.",
      icon: Zap,
      badge: "Instant Token",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "cable-tv",
      name: "Cable TV",
      category: "Payments",
      description: "Fast subscription renewals for DStv, GOtv, and StarTimes with customer name validation prior to payment.",
      icon: Tv,
      badge: "Zero Fee",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "waec-neco",
      name: "WAEC / NECO / JAMB",
      category: "Education",
      description: "Instant PIN and serial number dispatch for WAEC result checkers, NECO tokens, and JAMB UTME registration e-pins.",
      icon: GraduationCap,
      badge: "Direct Dispatch",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
    {
      id: "more-services",
      name: "More Services",
      category: "Corporate",
      description: "Drivers license verification, international passport check, newspaper change of name publications, and ICT solutions.",
      icon: Grid,
      badge: "Expanded Suite",
      color: "bg-blue-50 text-[#0F2D5C] border-blue-100",
    },
  ];

  return (
    <section id="services-section" className="py-20 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#0F2D5C] border border-blue-200">
              Complete Service Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
              Comprehensive Verification & Utility Services
            </h2>
            <p className="text-sm text-[#4B5563] font-normal leading-relaxed">
              Explore our core suite of digital verifications, bill settlements, educational tokens, and enterprise APIs designed for maximum uptime and speed.
            </p>
          </div>

          <div>
            <button
              id="services-preview-explore-all"
              onClick={onExploreAll}
              className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Explore All Portal Services
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 12 Services Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, idx) => {
            const IconComponent = service.icon;
            return (
              <motion.div
                key={service.id}
                id={`service-card-${service.id}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:border-[#0F2D5C] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-2xl border ${service.color} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed mt-2 font-normal line-clamp-3">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E5E7EB]">
                  <button
                    id={`btn-learn-more-${service.id}`}
                    onClick={() => onSelectService && onSelectService(service.id)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-[#0F2D5C] text-[#111827] hover:text-white border border-[#E5E7EB] hover:border-[#0F2D5C] rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-xs"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default LandingServicesPreview;
