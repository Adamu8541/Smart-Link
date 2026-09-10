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
  CreditCard,
  FileText,
  Building2,
  Tv,
  GraduationCap,
  ChevronRight,
  PhoneCall,
  Smartphone,
  Layers,
  Lock,
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import LandingHeader from "../landing/LandingHeader";
import LandingFooter from "../landing/LandingFooter";

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
    id: "nin-standard-slip",
    name: "Standard NIN Slip Print (vNIN & Direct)",
    category: "identity",
    description: "Instant National Identity Number verification and printable official PDF slip with high-resolution QR verification code.",
    price: "₦350 - ₦600",
    turnaround: "Instant (< 10s)",
    features: ["Official NIMC Format", "Scannable QR Code", "Watermark Validation", "Instant PDF Download"],
    popular: true,
  },
  {
    id: "nin-premium-card",
    name: "Premium NIN Plastic Card Layout",
    category: "identity",
    description: "HD print-ready front and back National ID Card formatting, standard CR80 dimensions with embedded holographic security patterns.",
    price: "₦800 - ₦1,200",
    turnaround: "Instant (< 15s)",
    features: ["Double-Sided CR80 Layout", "Standard 300 DPI High-Res", "Print-Ready PDF", "Official Security Pattern"],
    popular: true,
  },
  {
    id: "bvn-verification-slip",
    name: "BVN Verification & Digital ID Slip",
    category: "identity",
    description: "Real-time Bank Verification Number validation against central NIBSS banking rails, generating an official identity verification certificate.",
    price: "₦400 - ₦750",
    turnaround: "Instant (< 10s)",
    features: ["Bank-Grade Verification", "Account Match Validation", "Formatted ID Card & Slip", "Official Verification Stamp"],
  },
  {
    id: "cac-business-registration",
    name: "CAC Business Name Registration (BN)",
    category: "corporate",
    description: "End-to-end Corporate Affairs Commission (CAC) filing: Name Reservation, Enterprise Registration, Status Report & Certificate of Incorporation.",
    price: "₦28,000",
    turnaround: "48 - 72 Hours",
    features: ["Accredited Agent Filing", "Name Availability Search", "Official CAC Certificate", "Federal Status Report Included"],
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
    turnaround: "Sub-450ms p95 Latency",
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
    { id: "all", label: "All Services", icon: Layers },
    { id: "identity", label: "Identity & KYC (NIN / BVN)", icon: ShieldCheck },
    { id: "corporate", label: "Corporate (CAC & SCUML)", icon: Building2 },
    { id: "bills", label: "Electricity & Cable TV", icon: Zap },
    { id: "telecom", label: "Airtime & SME Data VTU", icon: Smartphone },
    { id: "education", label: "Exam Pins (WAEC / NECO)", icon: GraduationCap },
    { id: "government", label: "Developer APIs & Government", icon: FileText },
  ];

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
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Complete Enterprise Services Catalog &amp; Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Explore Over 25+ Digital Services &amp; Verification Solutions
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            From official National Identity slips and CAC enterprise filings to automated utility tokens and high-throughput developer APIs—access Nigeria's premier digital infrastructure.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services, NIN, BVN, CAC, Discos, SME Data, WAEC, APIs..."
                aria-label="Search all services and verification solutions"
                className="w-full pl-12 pr-4 py-3.5 bg-white text-gray-900 rounded-2xl shadow-lg border border-transparent focus:border-[#0F2D5C] focus:ring-4 focus:ring-white/20 text-sm placeholder-gray-400 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search query"
                  className="absolute right-3.5 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md shadow-[#0F2D5C]/15"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-gray-500"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Showing <span className="text-gray-900 font-extrabold">{filteredServices.length}</span> Services
          </p>
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
            <span className="hidden sm:inline">Transparent Direct Pricing</span>
            <span className="h-1 w-1 rounded-full bg-gray-300 hidden sm:inline" />
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Automated Instant Processing
            </span>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                service.popular
                  ? "border-[#0F2D5C]/40 ring-1 ring-[#0F2D5C]/10 shadow-sm relative overflow-hidden"
                  : "border-gray-200 shadow-xs hover:border-gray-300"
              }`}
            >
              {service.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#0F2D5C] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                    Popular
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Title & Badge */}
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-snug pr-8">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#0F2D5C] border border-blue-100">
                      {service.turnaround}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {service.price}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {service.description}
                </p>

                {/* Features list */}
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  <span>Access Service</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No matching services found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search terms or select "All Services" above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 bg-[#0F2D5C] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        )}

        {/* Informational Trust Banner */}
        <div className="mt-16 bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0F2D5C] mx-auto sm:mx-0">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-gray-900">Dedicated Virtual Accounts</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Automated wallet funding via dedicated Providus, Moniepoint, Wema, and Sterling virtual bank accounts with zero deposit wait times.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mx-auto sm:mx-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-gray-900">Bank-Grade Security &amp; NDPA</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                TLS 1.3 encryption, AES-256 data protection at rest, and full compliance with Nigeria Data Protection Act 2023 regulations.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mx-auto sm:mx-0">
                <PhoneCall className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-gray-900">24/7 Priority Agent Support</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dedicated WhatsApp (+234 808 549 0982) and email support desks to assist with filing, ticket resolutions, and API queries.
              </p>
            </div>
          </div>
        </div>

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
