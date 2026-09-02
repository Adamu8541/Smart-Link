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
      benefit: "Confirm customer identity in seconds and generate print-ready slips.",
      services: [
        {
          id: "nin-verification",
          name: "NIN Verification",
          description: "Confirm National Identity details and download printable PDF slips.",
          icon: Fingerprint,
          badge: "Instant Slip",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "bvn-verification",
          name: "BVN Verification",
          description: "Validate bank account holder records and generate formatted BVN ID cards.",
          icon: ShieldCheck,
          badge: "NIBSS Direct",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "name-verification",
          name: "Name Verification",
          description: "Cross-check full names across official identity databases to prevent fraud.",
          icon: Users,
          badge: "Cross-Match",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Business Verification",
      benefit: "Validate company registration and tax status before doing business.",
      services: [
        {
          id: "cac-verification",
          name: "CAC Verification",
          description: "Search corporate RC numbers, view company status, and retrieve filings.",
          icon: Building2,
          badge: "CAC Registry",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "tin-verification",
          name: "TIN Verification",
          description: "Confirm Joint Tax Board and FIRS Tax Identification Numbers.",
          icon: FileCheck,
          badge: "Tax Verified",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Payments and Wallet",
      benefit: "Fund your account automatically and manage balance across all transactions.",
      services: [
        {
          id: "wallet-funding",
          name: "Wallet Funding",
          description: "Get dedicated virtual account numbers for automatic, zero-delay deposits.",
          icon: Wallet,
          badge: "Auto-Credit",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Airtime and Data",
      benefit: "Keep lines connected with instant mobile top-ups across all Nigerian networks.",
      services: [
        {
          id: "airtime",
          name: "Airtime VTU",
          description: "Automated airtime top-ups for MTN, Airtel, Glo, and 9mobile in seconds.",
          icon: Smartphone,
          badge: "Instant Top-Up",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "data",
          name: "Internet Data",
          description: "Direct and SME data bundle subscriptions with instant network delivery.",
          icon: Wifi,
          badge: "All Networks",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Utility Bills",
      benefit: "Pay power and entertainment bills with immediate token generation.",
      services: [
        {
          id: "electricity",
          name: "Electricity Bills",
          description: "Buy prepaid meter tokens or pay postpaid bills across all Nigerian Discos.",
          icon: Zap,
          badge: "Instant Token",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "cable-tv",
          name: "Cable TV",
          description: "Renew DSTV, GOtv, and StarTimes subscriptions with smartcard name validation.",
          icon: Tv,
          badge: "Auto-Reconnect",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Education and Exam Tokens",
      benefit: "Retrieve examination result checker pins and registration tokens instantly.",
      services: [
        {
          id: "waec-neco",
          name: "WAEC / NECO / JAMB",
          description: "Instant scratch card PINs and serial numbers for result checking and registration.",
          icon: GraduationCap,
          badge: "Instant PIN",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
      ],
    },
    {
      title: "Additional Services",
      benefit: "Access specialized identity lookups, publications, and technology solutions.",
      services: [
        {
          id: "drivers-license",
          name: "Driver's License Check",
          description: "Verify FRSC driver's license numbers and validity dates.",
          icon: FileCheck,
          badge: "FRSC Lookup",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "passport",
          name: "International Passport",
          description: "Confirm standard immigration passport details and document status.",
          icon: UserCheck,
          badge: "Immigration Check",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "change-of-name",
          name: "Newspaper Name Change",
          description: "Submit and process official national newspaper publications for change of name.",
          icon: FileText,
          badge: "National Daily",
          color: "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]",
        },
        {
          id: "ict-solutions",
          name: "ICT Solutions",
          description: "Integrate custom developer APIs, billing webhooks, and portal software.",
          icon: Grid,
          badge: "Developer API",
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
