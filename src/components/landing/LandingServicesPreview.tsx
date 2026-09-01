/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Fingerprint,
  Users,
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
  ExternalLink,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

interface ServiceCardItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}

interface ServiceCategory {
  title: string;
  benefit: string;
  services: ServiceCardItem[];
}

interface LandingServicesPreviewProps {
  onSelectService?: (serviceId: string) => void;
  onExploreAll?: () => void;
}

export const LandingServicesPreview: React.FC<LandingServicesPreviewProps> = ({
  onSelectService,
  onExploreAll,
}) => {
  const categories: ServiceCategory[] = [
    {
      title: "Identity Verification",
      benefit: "Verify identities instantly with high-velocity NIN, BVN, and name lookups.",
      services: [
        {
          id: "nin-demography",
          name: "NIN Demography",
          description: "Match demographic details and generate authentic NIMC slips.",
          icon: Users,
          badge: "NIMC Registry",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "nin-verification",
          name: "NIN Verification",
          description: "Instant NIN lookup, vNIN validation, and demographic matching.",
          icon: Fingerprint,
          badge: "Instant API",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "bvn-verification",
          name: "BVN Verification",
          description: "Secure NIBSS matching for banking verification and photo confirmation.",
          icon: ShieldCheck,
          badge: "Bank Grade",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "drivers-license",
          name: "Driver's License",
          description: "Instant validation of FRSC driver license details.",
          icon: FileCheck,
          badge: "FRSC Direct",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "passport",
          name: "Intl. Passport",
          description: "Real-time verification of International Passport details.",
          icon: UserCheck,
          badge: "NIS Direct",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Business Verification",
      benefit: "Confirm corporate status and tax compliance with direct FIRS and CAC data.",
      services: [
        {
          id: "tin-verification",
          name: "TIN Verification",
          description: "Validate FIRS Tax Identification Numbers instantly.",
          icon: FileCheck,
          badge: "FIRS Direct",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "cac-verification",
          name: "CAC Verification",
          description: "RC number search and business status verification.",
          icon: Building2,
          badge: "CAC Certified",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Payments and Wallet",
      benefit: "Securely manage funds with automated virtual accounts and instant top-ups.",
      services: [
        {
          id: "wallet-funding",
          name: "Wallet Funding",
          description: "Automated virtual bank accounts for instant business funding.",
          icon: Wallet,
          badge: "Auto-Credit",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Airtime and Data",
      benefit: "Recharge networks instantly with unbeatably cheap wholesale prices.",
      services: [
        {
          id: "airtime",
          name: "Airtime VTU",
          description: "Automated recharge across all major networks.",
          icon: Smartphone,
          badge: "Instant",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "data",
          name: "Internet Data",
          description: "High-speed SME and Direct data bundles.",
          icon: Wifi,
          badge: "Wholesale",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Utility Bills",
      benefit: "Settle electricity and cable TV bills effortlessly with immediate validation.",
      services: [
        {
          id: "electricity",
          name: "Electricity Bills",
          description: "Prepaid token generation and postpaid settlement.",
          icon: Zap,
          badge: "Instant Token",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "cable-tv",
          name: "Cable TV",
          description: "Instant subscription renewals with name validation.",
          icon: Tv,
          badge: "Zero Fee",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Education and Exam Tokens",
      benefit: "Get instant access to WAEC, NECO, and JAMB registration tokens.",
      services: [
        {
          id: "waec-neco",
          name: "WAEC / NECO / JAMB",
          description: "Instant PIN and serial number dispatch.",
          icon: GraduationCap,
          badge: "Direct Dispatch",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Additional Services",
      benefit: "Specialized tools and publications for your business needs.",
      services: [
        {
          id: "change-of-name",
          name: "Change of Name",
          description: "Newspaper change of name publications.",
          icon: FileText,
          badge: "Published",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "ict-solutions",
          name: "ICT Solutions",
          description: "Custom enterprise technology solutions.",
          icon: Grid,
          badge: "Enterprise",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
  ];

  return (
    <section id="services-section" className="py-12 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
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

        {/* Categories Grouping */}
        <div className="space-y-16">
          {categories.map((category) => (
            <section key={category.title} className="space-y-8">
              <div className="border-l-4 border-[#0F2D5C] pl-4">
                <h3 className="text-2xl font-bold text-[#111827] tracking-tight">
                  {category.title}
                </h3>
                <p className="text-sm text-[#4B5563] mt-1">
                  {category.benefit}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.services.map((service, idx) => {
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
                          <span className="text-[10px] font-bold text-[#4B5563] bg-[#F5F7FA] px-2 py-1 rounded-md uppercase tracking-wide">
                            {service.badge}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                            {service.name}
                          </h4>
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
            </section>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingServicesPreview;
