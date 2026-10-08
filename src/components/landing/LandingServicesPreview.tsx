/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Fingerprint,
  ShieldCheck,
  Building2,
  Wallet,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle2
} from "lucide-react";
import {
  NimcOfficialCardLogo,
  NibssOfficialCardLogo,
  CacOfficialCardLogo,
  NrsOfficialCardLogo,
  WaecOfficialCardLogo,
  ElectricityOfficialCardLogo,
  AirtimeOfficialCardLogo,
  DataBundlesOfficialCardLogo
} from "../common/ScreenshotServiceLogos";

interface LandingServicesPreviewProps {
  onSelectService?: (serviceId: string) => void;
  onExploreAll?: () => void;
}

export const LandingServicesPreview: React.FC<LandingServicesPreviewProps> = ({
  onSelectService,
  onExploreAll,
}) => {
  const topCategories = [
    {
      title: "Telecom & High-Speed Data",
      benefit: "Sub-3s airtime top-up and SME data bundles on MTN, Airtel, Glo, & 9mobile.",
      services: [
        {
          id: "vtu_airtime",
          name: "Airtime VTU Top-Up",
          description: "Automated instant airtime with 2% discount.",
          logo: <AirtimeOfficialCardLogo className="w-full h-full object-contain" />,
          price: "2% Rebate",
          tag: "Instant"
        },
        {
          id: "vtu_data",
          name: "Internet Data Bundles",
          description: "MTN, Glo, Airtel 30-day SME & Direct data.",
          logo: <DataBundlesOfficialCardLogo className="w-full h-full object-contain" />,
          price: "From ₦220/GB",
          tag: "30-Day"
        },
        {
          id: "vtu_electricity",
          name: "Electricity Discos",
          description: "Instant 20-digit prepaid meter token generation.",
          logo: <ElectricityOfficialCardLogo className="w-full h-full object-contain" />,
          price: "₦0 Fee",
          tag: "All Discos"
        },
        {
          id: "vtu_cable",
          name: "Cable TV Bouquet",
          description: "Renew DSTV, GOtv, and StarTimes with instant reconnect.",
          logo: <Tv className="w-5 h-5 text-[#0F2D5C]" />,
          price: "Zero Surcharge",
          tag: "Auto-Signal"
        },
      ]
    },
    {
      title: "Identity & Corporate Verification",
      benefit: "Automated NIN, BVN, CAC, and tax compliance validation rails.",
      services: [
        {
          id: "id_nin_ver",
          name: "NIN Verification & Slip",
          description: "National Identity lookup with verifiable PDF slip download.",
          logo: <NimcOfficialCardLogo className="w-full h-full object-contain" />,
          price: "₦500",
          tag: "Digital PDF"
        },
        {
          id: "id_bvn_ver",
          name: "BVN Bank Validation",
          description: "Direct NIBSS interbank account verification certificate.",
          logo: <NibssOfficialCardLogo className="w-full h-full object-contain" />,
          price: "₦250",
          tag: "NIBSS Rails"
        },
        {
          id: "id_cac_registration",
          name: "CAC Business Filing",
          description: "Full Business Name and LTD incorporation with certificate.",
          logo: <CacOfficialCardLogo className="w-full h-full object-contain" />,
          price: "From ₦28,000",
          tag: "Accredited"
        },
        {
          id: "edu_waec",
          name: "WAEC & JAMB PINs",
          description: "Instant electronic result checker scratch card PINs.",
          logo: <WaecOfficialCardLogo className="w-full h-full object-contain" />,
          price: "₦3,800",
          tag: "Instant PIN"
        },
      ]
    }
  ];

  return (
    <section id="services-section" className="py-12 bg-[#F5F7FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0F2D5C]/10 text-[#0F2D5C] border border-[#0F2D5C]/15">
              <Sparkles className="h-3.5 w-3.5 text-[#0F2D5C]" />
              Enterprise Service Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              Instant Verification &amp; Telecom Solutions
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Explore our core suite of digital verifications, bill settlements, educational tokens, and enterprise APIs designed for maximum uptime and speed.
            </p>
          </div>

          <div>
            <button
              id="services-preview-explore-all"
              type="button"
              onClick={onExploreAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              <span>Explore All 25+ Solutions</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Categories Preview in Fintech Grid */}
        <div className="space-y-8">
          {topCategories.map((category) => (
            <div key={category.title} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                    {category.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {category.benefit}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                {category.services.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => onSelectService && onSelectService(srv.id)}
                    className="flex flex-col items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-[#0F2D5C]/30 hover:bg-[#F8FAFC] transition-all group active:scale-95 cursor-pointer text-center bg-white shadow-xs hover:shadow-md min-h-[125px] relative"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-2 mb-1.5 transition-transform duration-200 group-hover:scale-105 shrink-0">
                      {srv.logo}
                    </div>

                    <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight line-clamp-2 group-hover:text-[#0F2D5C] text-center">
                      {srv.name}
                    </span>

                    <span className="text-[10px] text-[#64748B] font-mono font-semibold mt-1 line-clamp-1 bg-[#0F2D5C]/5 px-2 py-0.5 rounded-md border border-[#0F2D5C]/10 text-[#0F2D5C]">
                      {srv.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LandingServicesPreview;
