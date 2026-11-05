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
  FileText,
  Clock,
  ArrowUpDown,
  LayoutGrid,
  ListFilter,
  Check,
  BadgePercent
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

export type ServiceCategory = "identity" | "corporate" | "bills" | "education" | "government" | "telecom";

export interface ServiceCard {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: string;
  numericPrice?: number;
  turnaround: string;
  features: string[];
  popular?: boolean;
  instant?: boolean;
  tag?: string;
  badge?: string;
}

export const PUBLIC_SERVICES: ServiceCard[] = [
  // 1. Identity & Verification Services
  {
    id: "nin-regular-slip",
    name: "Regular NIN Slip Print (vNIN & Direct)",
    category: "identity",
    description: "Instant National Identity Number verification and printable official PDF slip with high-resolution scannable QR verification code.",
    price: "₦350 - ₦600",
    numericPrice: 350,
    turnaround: "Instant (< 10s)",
    features: ["Standard NIMC Format", "Scannable QR Verification", "Watermark Security", "Instant PDF Download"],
    popular: true,
    instant: true,
    badge: "Official NIMC",
  },
  {
    id: "nin-premium-card",
    name: "Premium NIN Plastic Card Layout (CR80)",
    category: "identity",
    description: "High-definition print-ready front and back National ID Card formatting, standard CR80 wallet dimensions with embedded security patterns.",
    price: "₦800 - ₦1,200",
    numericPrice: 800,
    turnaround: "Instant (< 15s)",
    features: ["Double-Sided CR80 Dimensions", "300 DPI Ultra High-Res", "Print-Ready Front & Back", "Guilloche Hologram Overlay"],
    popular: true,
    instant: true,
    badge: "Plastic ID Ready",
  },
  {
    id: "nin-improved-standard",
    name: "Improved NIN Standard Digital Slip",
    category: "identity",
    description: "Modernized NIMC National Identity slip layout with extended demographic details, photo extraction, and government cryptographic seal.",
    price: "₦500 - ₦800",
    numericPrice: 500,
    turnaround: "Instant (< 10s)",
    features: ["Full Demographics Extraction", "High-Resolution Passport Photo", "Official NIMC Digital Seal", "Valid Nationwide"],
    instant: true,
    badge: "New NIMC Format",
  },
  {
    id: "bvn-verification-slip",
    name: "BVN Verification & Digital ID Slip",
    category: "identity",
    description: "Real-time Bank Verification Number validation directly across central banking rails, generating a verified digital identity slip.",
    price: "₦400 - ₦750",
    numericPrice: 400,
    turnaround: "Instant (< 10s)",
    features: ["Bank-Grade NIBSS Verification", "Account Match Validation", "Formatted ID Card & Slip", "Digital Verification Stamp"],
    popular: true,
    instant: true,
    badge: "NIBSS Verified",
  },
  {
    id: "frsc-drivers-license",
    name: "FRSC Driver's License Online Verification",
    category: "identity",
    description: "Federal Road Safety Corps driver's license status lookup, class validation, expiry check, and printable verification certificate.",
    price: "₦650 - ₦1,000",
    numericPrice: 650,
    turnaround: "Instant (< 20s)",
    features: ["FRSC Database Match", "License Class & Validity", "Expiry Date Confirmation", "Printable Status Report"],
    instant: true,
  },
  {
    id: "inec-voters-card",
    name: "INEC Voter's Card (VIN) Verification",
    category: "identity",
    description: "National Independent Electoral Commission voter identity verification using VIN or polling unit demographics.",
    price: "₦500 - ₦900",
    numericPrice: 500,
    turnaround: "Instant (< 15s)",
    features: ["VIN Number Lookup", "Polling Unit & Ward Data", "Electoral State Validation", "Instant Official PDF"],
    instant: true,
  },
  {
    id: "face-biometric-match",
    name: "Biometric Face Match & Liveness Verification",
    category: "identity",
    description: "AI-powered biometric selfie match against NIN or BVN database photos with 99.4% anti-spoofing accuracy.",
    price: "₦300 / check",
    numericPrice: 300,
    turnaround: "Sub-second (< 2s)",
    features: ["Passive Liveness Detection", "Photo Confidence Score", "Anti-Spoofing ISO Compliant", "Audit Trail Recorded"],
    instant: true,
  },
  {
    id: "address-meter-verification",
    name: "Physical & Meter Address Verification",
    category: "identity",
    description: "Validation of residential and business premises addresses using disco electricity meter numbers and GIS coordinates.",
    price: "₦450 - ₦800",
    numericPrice: 450,
    turnaround: "Instant (< 10s)",
    features: ["Disco Account Matching", "Premises Address Extraction", "Utility Provider Confirmation", "PDF Proof of Address"],
    instant: true,
  },

  // 2. CAC & Corporate Registration (KYB)
  {
    id: "cac-business-registration",
    name: "CAC Business Name Registration (BN)",
    category: "corporate",
    description: "End-to-end Corporate Affairs Commission (CAC) filing: Name Reservation, Enterprise Registration, Status Report & Certificate of Incorporation.",
    price: "₦28,000",
    numericPrice: 28000,
    turnaround: "48 - 72 Hours",
    features: ["Accredited Agent Filing", "Name Availability Search", "Certified CAC Certificate", "Federal Status Report Included"],
    popular: true,
    badge: "Most Popular KYB",
  },
  {
    id: "cac-limited-company",
    name: "CAC Private Limited Company (LTD)",
    category: "corporate",
    description: "Full incorporation of Private Limited Liability Companies (1M+ Share Capital), Memorandum & Articles of Association (MEMART).",
    price: "₦35,000",
    numericPrice: 35000,
    turnaround: "3 - 5 Days",
    features: ["Full MEMART Drafting", "TIN Generation Included", "Director Status Reports", "Fast-Track Processing"],
    popular: true,
    badge: "Full Incorporation",
  },
  {
    id: "cac-incorporated-trustees",
    name: "CAC Incorporated Trustees (NGO / Church / Club)",
    category: "corporate",
    description: "Filing and legal setup for Churches, Mosques, Non-Governmental Organizations, Foundations, and Associations.",
    price: "₦65,000 - ₦85,000",
    numericPrice: 65000,
    turnaround: "10 - 15 Days",
    features: ["Constitution Drafting", "Newspaper Publication Support", "Trustee Vetting", "Certified Certificate"],
  },
  {
    id: "scuml-certificate-filing",
    name: "SCUML AML/CFT Certificate Assistance",
    category: "corporate",
    description: "Special Control Unit Against Money Laundering (SCUML) application, compliance documentation, and certificate procurement for Designated Non-Financial Businesses (DNFBPs).",
    price: "₦25,000 - ₦35,000",
    numericPrice: 25000,
    turnaround: "5 - 10 Days",
    features: ["AML / NFIU Compliance", "Document Review & Drafting", "Submission & Follow-up", "Official Certificate Delivery"],
    popular: true,
    badge: "EFCC Compliant",
  },
  {
    id: "tin-tax-verification",
    name: "Tax Identification Number (TIN) Verification & Filing",
    category: "corporate",
    description: "Corporate and individual FIRS/JTB Tax Identification Number generation, validation, and official tax status confirmation.",
    price: "₦1,500 - ₦5,000",
    numericPrice: 1500,
    turnaround: "Instant - 24h",
    features: ["FIRS & JTB Registry Query", "Instant Tax Office Resolution", "Corporate & Personal TIN", "Printable Tax Slip"],
    instant: true,
  },
  {
    id: "cac-annual-returns",
    name: "CAC Annual Returns Filing & Status Report",
    category: "corporate",
    description: "Keep your registered business name or company active on the CAC portal with timely annual return submission and certified status reports.",
    price: "From ₦8,500",
    numericPrice: 8500,
    turnaround: "24 - 48 Hours",
    features: ["Penalties Avoidance", "Active Status Maintenance", "Certified Status Report", "Filing Receipt"],
  },

  // 3. Digital Utility & Bills
  {
    id: "disco-electricity-token",
    name: "Electricity Disco Prepaid Token Recharge",
    category: "bills",
    description: "Instant 20-digit prepaid meter token generation across all 11 Nigerian Discos (IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, EEDC, PHED, JED, etc.).",
    price: "Zero Convenience Fee",
    numericPrice: 0,
    turnaround: "Instant (< 15s)",
    features: ["All 11 Discos Supported", "Instant 20-Digit Token SMS", "Meter Validation Check", "Downloadable VAT Receipt"],
    popular: true,
    instant: true,
    badge: "Zero Surcharge",
  },
  {
    id: "disco-postpaid-bills",
    name: "Postpaid Electricity Bill Settlement",
    category: "bills",
    description: "Direct account settlement for all commercial and residential postpaid electricity utility meters nationwide with instant payment receipt.",
    price: "Zero Surcharge",
    numericPrice: 0,
    turnaround: "Instant (< 15s)",
    features: ["Customer Name Validation", "Outstanding Balance Retrieval", "Instant Ledger Update", "Official Utility Receipt"],
    instant: true,
  },
  {
    id: "cable-tv-renewal",
    name: "Cable TV Subscription Renewal (DStv, GOtv, StarTimes)",
    category: "bills",
    description: "Seamless activation and bouquet renewal for DStv, GOtv, and StarTimes with zero downtime and automated signal refreshing.",
    price: "Zero Surcharge",
    numericPrice: 0,
    turnaround: "Instant (< 20s)",
    features: ["DStv, GOtv, StarTimes", "Bouquet Upgrade/Downgrade", "Automatic Signal Reset", "Instant Account Validation"],
    popular: true,
    instant: true,
    badge: "Auto Signal Reset",
  },
  {
    id: "showmax-entertainment",
    name: "Showmax Entertainment Vouchers",
    category: "bills",
    description: "Showmax Mobile and All-Devices subscription vouchers for live Premier League football streaming and movies.",
    price: "From ₦1,200",
    numericPrice: 1200,
    turnaround: "Instant (< 5s)",
    features: ["Showmax Mobile EPL", "Showmax Entertainment", "Direct Voucher PIN", "Instant SMS Delivery"],
    instant: true,
  },
  {
    id: "water-utility-bills",
    name: "State Water Board Utility Payments",
    category: "bills",
    description: "Pay state water corporation utility bills (Lagos Water Corporation, FCT Water Board, etc.) seamlessly online.",
    price: "Zero Fee",
    numericPrice: 0,
    turnaround: "Instant (< 30s)",
    features: ["Major Water Boards", "Customer Ref Validation", "Electronic Receipts", "Instant Confirmation"],
    instant: true,
  },

  // 4. Telecom & VTU Data
  {
    id: "sme-data-vtu",
    name: "Cheap SME & Corporate Data Bundles",
    category: "telecom",
    description: "High-speed internet data bundles with 30-day validity on MTN SME, Airtel Gifting, Glo Data, and 9mobile at direct wholesale prices.",
    price: "From ₦240 / GB",
    numericPrice: 240,
    turnaround: "Instant (< 5s)",
    features: ["MTN, Airtel, Glo, 9mobile", "30 Days Full Validity", "Direct API Dispatch", "Balance Check USSD Included"],
    popular: true,
    instant: true,
    badge: "Wholesale Rate",
  },
  {
    id: "airtime-vtu-discount",
    name: "Airtime VTU with Direct Cash Rebates",
    category: "telecom",
    description: "Automated airtime top-up for all Nigerian mobile networks with up to 3% instant cashback rebate on every transaction.",
    price: "1% - 3% Cashback",
    numericPrice: 0,
    turnaround: "Instant (< 3s)",
    features: ["All Telecom Networks", "24/7 Automated Delivery", "Airtime to Wallet Conversion", "Multi-Number Bulk Top-up"],
    popular: true,
    instant: true,
    badge: "Up to 3% Cashback",
  },
  {
    id: "airtime-to-cash",
    name: "Airtime to Cash Wallet Converter",
    category: "telecom",
    description: "Convert excess airtime (MTN, Airtel, Glo, 9mobile) directly to real cash credited to your bank account or SmartLink wallet in minutes.",
    price: "Best Market Rates",
    numericPrice: 0,
    turnaround: "2 - 5 Minutes",
    features: ["Instant Wallet Credit", "Direct Bank Payout", "High Daily Limits", "Automated Transfer Codes"],
    badge: "High Liquidity",
  },
  {
    id: "bulk-sms-gateway",
    name: "Corporate Bulk SMS Messaging Gateway",
    category: "telecom",
    description: "High-deliverability DND-bypassing bulk SMS messaging with custom branded sender ID for churches, businesses, and campaigns.",
    price: "₦2.80 / SMS",
    numericPrice: 2.8,
    turnaround: "Instant (< 5s)",
    features: ["Custom Sender ID", "DND Route Bypass", "Delivery Reports", "Phonebook Upload"],
    instant: true,
  },

  // 5. Education & Examination Services
  {
    id: "waec-scratch-card",
    name: "WAEC Result Checker PINs & Tokens",
    category: "education",
    description: "Direct official WAEC result checker electronic scratch cards with serial numbers and PINs for secondary school exam validation.",
    price: "₦3,400 - ₦3,800",
    numericPrice: 3400,
    turnaround: "Instant (< 5s)",
    features: ["Official WAEC Direct PIN", "Immediate Screen Display", "SMS & Email Delivery", "Valid for 5 Checks"],
    popular: true,
    instant: true,
    badge: "Official WAEC",
  },
  {
    id: "neco-token-cards",
    name: "NECO Result Checking Electronic Tokens",
    category: "education",
    description: "Official National Examinations Council (NECO) result checker tokens for SSCE (Internal & External) and BECE examination result checking.",
    price: "₦1,100 - ₦1,300",
    numericPrice: 1100,
    turnaround: "Instant (< 5s)",
    features: ["Official NECO Portal Token", "Instant PIN Delivery", "Single & Bulk Purchases", "Permanent History Storage"],
    popular: true,
    instant: true,
    badge: "Official NECO",
  },
  {
    id: "jamb-profile-epins",
    name: "JAMB UTME Registration e-PINs & Result",
    category: "education",
    description: "Official Joint Admissions and Matriculation Board (JAMB) UTME / Direct Entry registration e-PINs and printable result slips.",
    price: "₦6,200 - ₦7,700",
    numericPrice: 6200,
    turnaround: "Instant (< 10s)",
    features: ["Official JAMB Registration e-PIN", "Instant SMS to Profile Code", "JAMB Original Result Slip", "Admission Letter Print"],
    popular: true,
    instant: true,
    badge: "Official JAMB",
  },
  {
    id: "nabteb-scratch-card",
    name: "NABTEB Exam Result Checking Scratch Cards",
    category: "education",
    description: "National Business and Technical Examinations Board (NABTEB) May/June & Nov/Dec result checking electronic PINs.",
    price: "₦1,400 - ₦1,800",
    numericPrice: 1400,
    turnaround: "Instant (< 5s)",
    features: ["Official NABTEB Direct PIN", "Instant Display & Receipt", "Bulk Purchase Available", "Zero Delivery Delay"],
    instant: true,
  },
  {
    id: "nysc-callup-processing",
    name: "NYSC Call-Up Letter & Relocation Processing",
    category: "education",
    description: "National Youth Service Corps green card printing, call-up letter retrieval, relocation application support, and Senate list verification.",
    price: "₦2,000 - ₦3,500",
    numericPrice: 2000,
    turnaround: "Instant - 24h",
    features: ["Official NYSC Portal PDF", "Green Card Printing", "Senate List Lookup", "Relocation Guidance"],
  },

  // 6. Government, Legal & Developer APIs
  {
    id: "court-affidavit-filing",
    name: "High Court Affidavit & Police Loss Report",
    category: "government",
    description: "Official e-Affidavit generation for loss of SIM, lost documents, change of name, and age declaration verified with court registry seals.",
    price: "₦2,500 - ₦4,500",
    numericPrice: 2500,
    turnaround: "24 - 48 Hours",
    features: ["Valid Court Seal & Stamp", "Recognized Nationwide", "Digital Verification QR", "Direct Courier or PDF"],
    popular: true,
    badge: "Court Verified",
  },
  {
    id: "developer-verification-api",
    name: "Developer Identity & VTU REST APIs",
    category: "government",
    description: "Integrate high-speed NIN verification, BVN lookup, automated wallet funding, and VTU dispatch directly into your apps and fintech portals.",
    price: "Pay-As-You-Go API Rates",
    numericPrice: 0,
    turnaround: "Sub-450ms Latency",
    features: ["RESTful JSON Endpoints", "Live & Sandbox Environments", "Webhook Callbacks", "Postman Collections & SDKs"],
    popular: true,
    instant: true,
    badge: "Developer API",
  },
  {
    id: "corporate-aml-sanctions",
    name: "Corporate AML, PEP & Sanctions Screening",
    category: "government",
    description: "Screen individuals and corporations against international sanctions watchlists (OFAC, UN, EU, UK HMT, NFIU) and Politically Exposed Persons (PEP) lists.",
    price: "₦850 / query",
    numericPrice: 850,
    turnaround: "Sub-second (< 1s)",
    features: ["Global Sanctions Lists", "PEP Database Matching", "Adverse Media Detection", "Compliance Audit PDF"],
    instant: true,
  },
];

export const ExploreServicesPublicView: React.FC<ExploreServicesPublicViewProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
  onNavigateLegal,
  onSelectServiceItem,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "name" | "price-low" | "price-high">("default");
  const [viewMode, setViewMode] = useState<"grid" | "detailed">("grid");

  const categories = [
    { id: "all", label: "All Solutions", icon: Layers, count: PUBLIC_SERVICES.length },
    { id: "identity", label: "NIN & Identity", icon: Fingerprint, count: PUBLIC_SERVICES.filter(s => s.category === "identity").length },
    { id: "corporate", label: "CAC & Corporate", icon: Building2, count: PUBLIC_SERVICES.filter(s => s.category === "corporate").length },
    { id: "bills", label: "Electricity & Cable TV", icon: Zap, count: PUBLIC_SERVICES.filter(s => s.category === "bills").length },
    { id: "telecom", label: "Airtime & SME Data", icon: Smartphone, count: PUBLIC_SERVICES.filter(s => s.category === "telecom").length },
    { id: "education", label: "Exam PINs & Cards", icon: GraduationCap, count: PUBLIC_SERVICES.filter(s => s.category === "education").length },
    { id: "government", label: "Developer APIs & Gov", icon: Landmark, count: PUBLIC_SERVICES.filter(s => s.category === "government").length },
  ];

  const quickFilterOptions = [
    { id: "all", label: "All Types" },
    { id: "popular", label: "Popular", icon: Flame },
    { id: "instant", label: "Instant (< 15s)", icon: Zap },
    { id: "official", label: "Official Slips", icon: ShieldCheck },
  ];

  // Quick Action Top Ribbon
  const quickPills = [
    { name: "MTN VTU", desc: "Airtime Top-up", badge: "2% Disc", query: "airtime" },
    { name: "SME Data", desc: "From ₦240/GB", badge: "Instant", query: "sme data" },
    { name: "Electricity", desc: "Prepaid Tokens", badge: "20-Digit", query: "electricity" },
    { name: "NIN Slip", desc: "Official PDF", badge: "Live", query: "nin" },
    { name: "CAC Filing", desc: "Enterprise BN", badge: "Certified", query: "cac" },
    { name: "WAEC Result", desc: "Electronic PIN", badge: "Instant", query: "waec" },
  ];

  const suggestedQueries = ["NIN Slip", "SME Data", "Ikeja Electric", "CAC Business", "WAEC PIN", "BVN Verification", "Developer API"];

  const renderServiceLogo = (id: string) => {
    if (id.includes("nin")) return <NimcOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("bvn")) return <NibssOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("cac") || id.includes("scuml") || id.includes("tin")) return <CacOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("disco") || id.includes("electricity") || id.includes("water")) return <ElectricityOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("data")) return <DataBundlesOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("airtime") || id.includes("sms")) return <AirtimeOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("waec")) return <WaecOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("neco")) return <NecoOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("jamb")) return <JambOfficialCardLogo className="w-full h-full object-contain" />;
    if (id.includes("api") || id.includes("court") || id.includes("aml") || id.includes("frsc") || id.includes("inec")) return <NrsOfficialCardLogo className="w-full h-full object-contain" />;
    return <Sparkles className="w-5 h-5 text-[#0F2D5C]" />;
  };

  const handleCardClick = (serviceId: string) => {
    if (onSelectServiceItem) {
      onSelectServiceItem(serviceId);
    } else {
      onGetStarted();
    }
  };

  const filteredServices = useMemo(() => {
    let result = PUBLIC_SERVICES.filter((service) => {
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;

      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower) ||
        (service.badge && service.badge.toLowerCase().includes(searchLower)) ||
        service.features.some((f) => f.toLowerCase().includes(searchLower));

      let matchesQuickFilter = true;
      if (selectedQuickFilter === "popular") {
        matchesQuickFilter = Boolean(service.popular);
      } else if (selectedQuickFilter === "instant") {
        matchesQuickFilter = Boolean(service.instant);
      } else if (selectedQuickFilter === "official") {
        matchesQuickFilter = Boolean(
          service.badge?.toLowerCase().includes("official") ||
          service.name.toLowerCase().includes("slip") ||
          service.name.toLowerCase().includes("verified") ||
          service.name.toLowerCase().includes("cac")
        );
      }

      return matchesCategory && matchesSearch && matchesQuickFilter;
    });

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price-low") {
      result = [...result].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0));
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => (b.numericPrice ?? 0) - (a.numericPrice ?? 0));
    } else {
      // Default: Popular first
      result = [...result].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return result;
  }, [selectedCategory, searchTerm, selectedQuickFilter, sortBy]);

  const hasActiveFilters = searchTerm.trim() !== "" || selectedCategory !== "all" || selectedQuickFilter !== "all" || sortBy !== "default";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedQuickFilter("all");
    setSortBy("default");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-[#111827] antialiased">
      <SEOHead
        title="Explore All Digital Services & Verification Solutions | Smart Link NG"
        description="Browse the complete catalog of 26+ SmartLink Nigeria digital services: Instant NIN & BVN Slips, CAC Business Registrations, SCUML AML Certificates, Electricity Tokens, Cheap SME Data, WAEC/NECO Scratch Cards, and Developer APIs."
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
            <span>Complete Fintech, Identity &amp; Digital Services Catalog</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Explore 25+ Instant Digital Solutions
          </h1>

          <p className="text-xs sm:text-sm text-gray-200 max-w-2xl mx-auto leading-relaxed">
            From official National Identity slips and CAC enterprise filings to automated electricity tokens, cheap SME data bundles, and developer APIs.
          </p>

          {/* Hero Quick Search Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services, NIN, BVN, CAC, Discos, SME Data, WAEC, APIs..."
                aria-label="Search all services and verification solutions"
                className="w-full pl-11 pr-24 py-3 bg-white text-gray-900 rounded-xl shadow-lg border border-transparent focus:border-[#0F2D5C] focus:ring-4 focus:ring-white/20 text-xs sm:text-sm placeholder-gray-400 outline-none transition-all font-medium"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search query"
                    className="p-1 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
                  {filteredServices.length} found
                </span>
              </div>
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
              onClick={() => {
                setSearchTerm(pill.query);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full text-xs transition-all shrink-0 hover:shadow-xs active:scale-95 cursor-pointer group ${
                searchTerm.toLowerCase() === pill.query.toLowerCase()
                  ? "border-[#0F2D5C] bg-[#0F2D5C]/5"
                  : "border-slate-200/90 hover:border-[#0F2D5C]"
              }`}
            >
              <span className="font-bold text-[#1E293B] group-hover:text-[#0F2D5C]">{pill.name}</span>
              <span className="text-[10px] text-[#64748B] font-medium">{pill.desc}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#0F2D5C]/10 text-[#0F2D5C] rounded-full">
                {pill.badge}
              </span>
            </button>
          ))}
        </div>

        {/* COMPREHENSIVE SEARCH & FILTER BAR */}
        <section
          aria-label="Filter and Search Controls"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4"
        >
          {/* Top row: Search input + View switcher + Sort dropdown */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Embedded Live Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter services by name, keyword, or disco (e.g. 'NIN', 'SME', 'CAC', 'WAEC')..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 text-xs sm:text-sm placeholder-slate-400 outline-none transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-md cursor-pointer border border-slate-200"
                  title="Clear search query"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick Filter Tags (Popular, Instant, Official Slips) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {quickFilterOptions.map((qf) => {
                const Icon = qf.icon;
                const isSelected = selectedQuickFilter === qf.id;
                return (
                  <button
                    key={qf.id}
                    type="button"
                    onClick={() => setSelectedQuickFilter(qf.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0F2D5C] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                  >
                    {Icon && <Icon className={`h-3 w-3 ${isSelected ? "text-amber-300" : "text-slate-500"}`} />}
                    <span>{qf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2 justify-between md:justify-end">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 cursor-pointer pr-1"
                  aria-label="Sort services by"
                >
                  <option value="default">Most Popular</option>
                  <option value="name">Name (A - Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* View layout toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-[#0F2D5C] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Squircle Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("detailed")}
                  aria-label="Detailed list view"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "detailed" ? "bg-white text-[#0F2D5C] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Detailed Cards View"
                >
                  <ListFilter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs with dynamic badge counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-slate-100">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0F2D5C] text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#0F2D5C]"}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicators & Reset Link */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 font-medium">Active filters:</span>
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0F2D5C]/10 text-[#0F2D5C] font-semibold text-[11px]">
                    Category: {categories.find((c) => c.id === selectedCategory)?.label}
                    <button type="button" onClick={() => setSelectedCategory("all")} className="hover:text-red-600 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
                    Query: "{searchTerm}"
                    <button type="button" onClick={() => setSearchTerm("")} className="hover:text-red-600 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {selectedQuickFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
                    Type: {quickFilterOptions.find((qf) => qf.id === selectedQuickFilter)?.label}
                    <button type="button" onClick={() => setSelectedQuickFilter("all")} className="hover:text-red-600 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {sortBy !== "default" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                    Sort: {sortBy}
                    <button type="button" onClick={() => setSortBy("default")} className="hover:text-red-600 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[#0F2D5C] hover:text-[#17407E] font-bold text-xs underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Showing <strong className="text-gray-900 font-extrabold">{filteredServices.length}</strong> of {PUBLIC_SERVICES.length} Digital Services
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline font-bold">100% Automated Instant Processing</span>
          </div>
        </div>

        {/* VIEW 1: COMPACT SQUIRCLE GRID VIEW */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleCardClick(service.id)}
                className="flex flex-col items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#0F2D5C]/40 hover:bg-[#F8FAFC] transition-all group active:scale-95 cursor-pointer text-center bg-white shadow-xs hover:shadow-md min-h-[145px] relative"
              >
                {/* Badge if present */}
                {service.badge && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#0F2D5C]/10 text-[#0F2D5C] border border-[#0F2D5C]/15">
                    {service.badge}
                  </span>
                )}

                <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-2 mb-1.5 transition-transform duration-200 group-hover:scale-105 shrink-0">
                  {renderServiceLogo(service.id)}
                </div>

                <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight line-clamp-2 group-hover:text-[#0F2D5C] text-center">
                  {service.name}
                </span>

                <div className="mt-1 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-[#0F2D5C] font-mono font-bold bg-[#0F2D5C]/5 px-2 py-0.5 rounded-md border border-[#0F2D5C]/10">
                    {service.price}
                  </span>
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {service.turnaround}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: DETAILED CARDS VIEW */}
        {viewMode === "detailed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-[#0F2D5C]/30 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                      {renderServiceLogo(service.id)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {service.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0F2D5C]/10 text-[#0F2D5C] border border-[#0F2D5C]/15">
                          {service.badge}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {service.turnaround}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F2D5C] transition-colors leading-snug">
                    {service.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                    {service.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate</span>
                    <span className="text-xs font-extrabold text-[#0F2D5C] font-mono">
                      {service.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCardClick(service.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Search / Filter State */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-lg mx-auto my-8 space-y-4">
            <SlidersHorizontal className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No matching services found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We couldn't find any digital solution matching{" "}
              {searchTerm ? <span className="font-semibold text-slate-900">"{searchTerm}"</span> : "your active filters"}.
            </p>

            {/* Suggested Searches */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">Try quick search for:</span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => {
                      setSearchTerm(query);
                      setSelectedCategory("all");
                      setSelectedQuickFilter("all");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-[#0F2D5C]/10 hover:text-[#0F2D5C] text-slate-700 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-[#0F2D5C] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#17407E] transition-all shadow-xs"
              >
                Reset All Filters ({PUBLIC_SERVICES.length} Services)
              </button>
            </div>
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
