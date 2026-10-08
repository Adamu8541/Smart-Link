/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Tv,
  GraduationCap,
  ChevronRight,
  Smartphone,
  Layers,
  SlidersHorizontal,
  Flame,
  X,
  Fingerprint,
  Landmark,
  FileText
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import LandingHeader from "../landing/LandingHeader";
import LandingFooter from "../landing/LandingFooter";
import {
  NimcOfficialCardLogo,
  NibssOfficialCardLogo,
  CacOfficialCardLogo,
  NrsOfficialCardLogo,
  JambOfficialCardLogo,
  WaecOfficialCardLogo,
  NecoOfficialCardLogo,
  ElectricityOfficialCardLogo,
  AirtimeOfficialCardLogo,
  DataBundlesOfficialCardLogo
} from "../common/ScreenshotServiceLogos";

interface ExploreServicesPublicViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onNavigateHome: () => void;
  onNavigateLegal?: (docId?: string) => void;
  onSelectServiceItem?: (serviceId: string) => void;
}

interface ServiceCard {
  id: string;
  name: string;
  category: "identity" | "corporate" | "bills" | "education" | "government" | "telecom";
  description: string;
  price: string;
  turnaround: string;
  features: string[];
  popular?: boolean;
}

const PUBLIC_SERVICES: ServiceCard[] = [
  {
    id: "nin-regular-slip",
    name: "Regular NIN Slip Print (vNIN & Direct)",
    category: "identity",
    description: "Instant National Identity Number verification and printable PDF slip with high-resolution QR verification code.",
    price: "₦350 - ₦600",
    turnaround: "Instant (< 10s)",
    features: ["Standard NIN Format", "Scannable QR Code", "Watermark Validation", "Instant PDF Download"],
    popular: true,
  },
  {
    id: "nin-premium-card",
    name: "Premium NIN Plastic Card Layout",
    category: "identity",
    description: "HD print-ready front and back National ID Card formatting, standard CR80 dimensions with embedded holographic security patterns.",
    price: "₦800 - ₦1,200",
    turnaround: "Instant (< 15s)",
    features: ["Double-Sided CR80 Layout", "Standard 300 DPI High-Res", "Print-Ready PDF", "Security Pattern"],
    popular: true,
  },
  {
    id: "bvn-verification-slip",
    name: "BVN Verification & Digital ID Slip",
    category: "identity",
    description: "Real-time Bank Verification Number validation across central banking rails, generating a verified identity certificate.",
    price: "₦400 - ₦750",
    turnaround: "Instant (< 10s)",
    features: ["Bank-Grade Verification", "Account Match Validation", "Formatted ID Card & Slip", "Digital Verification Stamp"],
  },
  {
    id: "cac-business-registration",
    name: "CAC Business Name Registration (BN)",
    category: "corporate",
    description: "End-to-end Corporate Affairs Commission (CAC) filing: Name Reservation, Enterprise Registration, Status Report & Certificate of Incorporation.",
    price: "₦28,000",
    turnaround: "48 - 72 Hours",
    features: ["Accredited Agent Filing", "Name Availability Search", "Certified CAC Certificate", "Federal Status Report Included"],
    popular: true,
  },
  {
    id: "cac-limited-company",
    name: "CAC Private Limited Company (LTD)",
    category: "corporate",
    description: "Full incorporation of Private Limited Liability Companies (1M+ Share Capital), Memorandum & Articles of Association (MEMART).",
    price: "₦35,000",
    turnaround: "3 - 5 Days",
    features: ["Full MEMART Drafting", "TIN Generation Included", "Director Status Reports", "Fast-Track Processing"],
  },
  {
    id: "scuml-certificate-filing",
    name: "SCUML AML/CFT Certificate Assistance",
    category: "corporate",
    description: "Special Control Unit Against Money Laundering (SCUML) application, compliance documentation, and certificate procurement for Designated Non-Financial Businesses (DNFBPs).",
    price: "₦25,000 - ₦35,000",
    turnaround: "5 - 10 Days",
    features: ["AML / NFIU Compliance", "Document Review & Drafting", "Submission & Follow-up", "Official Certificate Delivery"],
  },
  {
    id: "disco-electricity-token",
    name: "Electricity Disco Token Recharge",
    category: "bills",
    description: "Instant prepaid meter token generation and postpaid bill settlement across all Nigerian Discos (IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, EEDC, PHED, etc.).",
    price: "Zero Convenience Fee",
    turnaround: "Instant (< 15s)",
    features: ["All 11 Discos Supported", "Instant 20-Digit Token SMS", "Meter Validation Check", "Downloadable VAT Receipt"],
    popular: true,
  },
  {
    id: "sme-data-vtu",
    name: "Cheap SME & Corporate Data Bundles",
    category: "telecom",
    description: "High-speed internet data bundles with 30-day validity on MTN SME, Airtel Gifting, Glo Data, and 9mobile at direct wholesale prices.",
    price: "From ₦240 / GB",
    turnaround: "Instant (< 5s)",
    features: ["MTN, Airtel, Glo, 9mobile", "30 Days Full Validity", "Direct API Dispatch", "Balance Check USSD Included"],
    popular: true,
  },
  {
    id: "airtime-vtu-discount",
    name: "Airtime VTU with Direct Cash Rebates",
    category: "telecom",
    description: "Automated airtime top-up for all Nigerian mobile networks with up to 3% instant cashback rebate on every transaction.",
    price: "1% - 3% Cashback",
    turnaround: "Instant (< 3s)",
    features: ["All Telecom Networks", "24/7 Automated Delivery", "Airtime to Wallet Conversion", "Multi-Number Bulk Top-up"],
  },
  {
    id: "cable-tv-renewal",
    name: "Cable TV Subscription Renewal",
    category: "bills",
    description: "Seamless activation and bouquet renewal for DSTV, GOtv, and StarTimes with zero downtime and automatic signal refreshing.",
    price: "Zero Surcharge",
    turnaround: "Instant (< 20s)",
    features: ["DSTV, GOtv, StarTimes", "Bouquet Upgrade/Downgrade", "Automatic Signal Reset", "Instant Account Validation"],
  },
  {
    id: "waec-scratch-card",
    name: "WAEC Result Checker PINs & Tokens",
    category: "education",
    description: "Direct official WAEC result checker electronic scratch cards with serial numbers and PINs for secondary school exam validation.",
    price: "₦3,400 - ₦3,800",
    turnaround: "Instant (< 5s)",
    features: ["Official WAEC Direct PIN", "Immediate Screen Display", "SMS & Email Delivery", "Valid for 5 Checks"],
  },
  {
    id: "neco-token-cards",
    name: "NECO Result Checking Electronic Tokens",
    category: "education",
    description: "Official National Examinations Council (NECO) result checker tokens for SSCE (Internal & External) and BECE examination result checking.",
    price: "₦1,100 - ₦1,300",
    turnaround: "Instant (< 5s)",
    features: ["Official NECO Portal Token", "Instant PIN Delivery", "Single & Bulk Purchases", "Permanent History Storage"],
  },
  {
    id: "developer-verification-api",
    name: "Developer Identity & VTU REST APIs",
    category: "government",
    description: "Integrate high-speed NIN verification, BVN lookup, automated wallet funding, and VTU dispatch directly into your apps and fintech portals.",
    price: "Pay-As-You-Go API Rates",
    turnaround: "Sub-450ms Latency",
    features: ["RESTful JSON Endpoints", "Live & Sandbox Environments", "Webhook Callbacks", "Postman Collections & SDKs"],
    popular: true,
  },
  {
    id: "court-affidavit-filing",
    name: "High Court Affidavit & Police Loss Report",
    category: "government",
    description: "Official e-Affidavit generation for loss of SIM, lost documents, change of name, and age declaration verified with court registry seals.",
    price: "₦2,500 - ₦4,500",
    turnaround: "24 - 48 Hours",
    features: ["Valid Court Seal & Stamp", "Recognized Nationwide", "Digital Verification QR", "Direct Courier or PDF"],
  },
];

export const ExploreServicesPublicView: React.FC<ExploreServicesPublicViewProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
  onNavigateLegal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Solutions", icon: Layers },
    { id: "identity", label: "NIN & Identity", icon: Fingerprint },
    { id: "corporate", label: "CAC & Corporate", icon: Building2 },
    { id: "bills", label: "Electricity & Cable TV", icon: Zap },
    { id: "telecom", label: "Airtime & SME Data", icon: Smartphone },
    { id: "education", label: "Exam PINs & Cards", icon: GraduationCap },
    { id: "government", label: "Developer APIs & Gov", icon: Landmark },
  ];

  // Quick Action Top Dock for Public Explore
  const quickPills = [
    { name: "MTN VTU", desc: "Airtime Top-up", badge: "2% Disc" },
    { name: "SME Data", desc: "From ₦220/GB", badge: "Instant" },
    { name: "Ikeja Electric", desc: "Prepaid Tokens", badge: "20-Digit" },
    { name: "NIN Slip Print", desc: "Official PDF", badge: "Live" },
    { name: "WAEC Result", desc: "Electronic PIN", badge: "Instant" },
  ];

  const renderServiceLogo = (id: string) => {
    if (id.includes("nin")) return <NimcOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("bvn")) return <NibssOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("cac") || id.includes("scuml")) return <CacOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("disco") || id.includes("electricity")) return <ElectricityOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("data")) return <DataBundlesOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("airtime")) return <AirtimeOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("waec")) return <WaecOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("neco")) return <NecoOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("api") || id.includes("court")) return <NrsOfficialCardLogo className="w-full h-full object-contain" />;
    return <Sparkles className="w-5 h-5 text-[#0F2D5C]" />;
  };

  const filteredServices = useMemo(() => {
    return PUBLIC_SERVICES.filter((service) => {
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === "" ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.features.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-[#111827] antialiased">
      <SEOHead
        title="Explore All Digital Services & Verification Solutions | Smart Link NG"
        description="Browse the complete catalog of SmartLink Nigeria digital services: Instant NIN & BVN Slips, CAC Business Registrations, SCUML AML Certificates, Electricity Tokens, Cheap SME Data, WAEC/NECO Scratch Cards, and Developer APIs."
        canonicalUrl="https://smartlinkng.com.ng/explore-services"
      />

      {/* Header */}
      <LandingHeader
        onLogin={onLogin}
        onRegister={onRegister}
        onGetStarted={onGetStarted}
        onNavigateSection={() => onNavigateHome()}
      />

      {/* Hero Banner */}
      <header className="bg-gradient-to-b from-[#0F2D5C] to-[#17407E] text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#0F2D5C]/30 shadow-inner">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Complete Fintech &amp; Digital Services Catalog</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Explore 25+ Instant Digital Solutions
          </h1>

          <p className="text-xs sm:text-sm text-gray-200 max-w-2xl mx-auto leading-relaxed">
            From official National Identity slips and CAC enterprise filings to automated electricity tokens and high-throughput developer APIs.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services, NIN, BVN, CAC, Discos, SME Data, WAEC, APIs..."
                aria-label="Search all services and verification solutions"
                className="w-full pl-11 pr-10 py-3 bg-white text-gray-900 rounded-xl shadow-lg border border-transparent focus:border-[#0F2D5C] focus:ring-4 focus:ring-white/20 text-xs sm:text-sm placeholder-gray-400 outline-none transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search query"
                  className="absolute right-3.5 p-1 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
        
        {/* Popular Quick Recharges Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider shrink-0 mr-1">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>Popular:</span>
          </div>
          {quickPills.map((pill) => (
            <button
              key={pill.name}
              onClick={onGetStarted}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 hover:border-[#0F2D5C] rounded-full text-xs transition-all shrink-0 hover:shadow-xs active:scale-95 cursor-pointer group"
            >
              <span className="font-bold text-[#1E293B] group-hover:text-[#0F2D5C]">{pill.name}</span>
              <span className="text-[10px] text-[#64748B] font-medium">{pill.desc}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#0F2D5C]/10 text-[#0F2D5C] rounded-full">
                {pill.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#0F2D5C]"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Showing <strong className="text-gray-900 font-extrabold">{filteredServices.length}</strong> Digital Services
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline font-bold">100% Automated Instant Processing</span>
          </div>
        </div>

        {/* Service Cards in Exact Instant Quick Actions Squircle Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={onGetStarted}
              className="flex flex-col items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-[#0F2D5C]/30 hover:bg-[#F8FAFC] transition-all group active:scale-95 cursor-pointer text-center bg-white shadow-xs hover:shadow-md min-h-[125px] relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-2 mb-1.5 transition-transform duration-200 group-hover:scale-105 shrink-0">
                {renderServiceLogo(service.id)}
              </div>

              <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight line-clamp-2 group-hover:text-[#0F2D5C] text-center">
                {service.name}
              </span>

              <span className="text-[10px] text-[#64748B] font-mono font-semibold mt-1 line-clamp-1 bg-[#0F2D5C]/5 px-2 py-0.5 rounded-md border border-[#0F2D5C]/10 text-[#0F2D5C]">
                {service.price}
              </span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 space-y-3">
            <SlidersHorizontal className="h-8 w-8 text-gray-400 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No matching services found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your search terms or select "All Solutions" above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-2 px-4 py-2 bg-[#0F2D5C] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#17407E] transition-all"
            >
              Reset Search Filter
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <LandingFooter
        onNavigateSection={() => onNavigateHome()}
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigateLegal={onNavigateLegal}
        activeInfoTab={null}
        setActiveInfoTab={() => {}}
      />
    </div>
  );
};

export default ExploreServicesPublicView;
