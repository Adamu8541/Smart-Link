/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  FileText,
  GraduationCap,
  Wifi,
  Building,
  Sparkles,
  Search,
  CheckCircle,
  Tag,
  X,
  Zap,
  Smartphone,
  Lightbulb,
  Tv,
  Building2,
  Landmark,
  ChevronRight,
  Layers,
  Flame,
  SlidersHorizontal,
  ShieldCheck
} from "lucide-react";
import { formatNaira } from "../utils/formatUtils";
import { useSiteConfig } from "../context/SiteConfigContext";
import { SMART_LINK_SERVICES, ServiceItem } from "../data/servicesData";
import {
  NimcOfficialCardLogo,
  NibssOfficialCardLogo,
  CacOfficialCardLogo,
  NrsOfficialCardLogo,
  JambOfficialCardLogo,
  WaecOfficialCardLogo,
  NecoOfficialCardLogo,
  NabtebOfficialCardLogo,
  ScumlOfficialCardLogo,
  ElectricityOfficialCardLogo,
  PassportOfficialCardLogo,
  CbnOfficialCardLogo,
  ExamPinsOfficialCardLogo,
  AirtimeOfficialCardLogo,
  DataBundlesOfficialCardLogo
} from "./common/ScreenshotServiceLogos";

export type { ServiceItem };
export { SMART_LINK_SERVICES };

interface ServicesGridProps {
  onSelectService: (service: ServiceItem) => void;
}

export default function ServicesGrid({ onSelectService }: ServicesGridProps) {
  const { getServicePrice } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // Proactively load ServiceModal so clicking any service tile opens instantly with 0ms delay
    import("./ServiceModal").catch(() => {});
  }, []);

  const categories = [
    { id: "ALL", label: "All Solutions", icon: Layers },
    { id: "IDENTITY", label: "NIN & Identity", icon: Fingerprint },
    { id: "BANKING", label: "BVN & Banking", icon: Landmark },
    { id: "CAC", label: "CAC & Corporate", icon: Building2 },
    { id: "VTU", label: "Airtime & Utilities", icon: Wifi },
    { id: "EDUCATION", label: "Exam PINs & Cards", icon: GraduationCap },
    { id: "GOVERNMENT", label: "E-Gov & Passports", icon: FileText },
    { id: "ICT", label: "ICT & Portals", icon: Sparkles }
  ];

  // Quick-action top dock (Identities first, followed by Telecom, Utilities, Education & CAC)
  const quickDockServices = [
    { id: "id_nin_ver", label: "NIN Identity", sub: "National ID Lookup", icon: Fingerprint, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { id: "id_bvn_ver", label: "BVN Identity", sub: "Bank BVN Lookup", icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { id: "id_slip_gen", label: "NIN Slip & Card", sub: "Standard Printout", icon: FileText, color: "bg-teal-500/10 text-teal-600 border-teal-200" },
    { id: "id_premium_slip", label: "BVN Slip & Card", sub: "Verified BVN ID", icon: ShieldCheck, color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
    { id: "vtu_airtime", label: "Airtime VTU", sub: "Instant Top-up", icon: Smartphone, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { id: "vtu_data", label: "Data Bundles", sub: "SME & Direct", icon: Wifi, color: "bg-sky-500/10 text-sky-600 border-sky-200" },
    { id: "vtu_electricity", label: "Electricity", sub: "Prepaid Tokens", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
    { id: "edu_waec", label: "WAEC / JAMB", sub: "Instant ePINs", icon: GraduationCap, color: "bg-rose-500/10 text-rose-600 border-rose-200" },
  ];

  // Popular Quick Recharge capsules (Identities first)
  const quickRechargePills = [
    { id: "id_nin_ver", name: "NIN Verification", desc: "National ID Lookup", badge: "Instant" },
    { id: "id_bvn_ver", name: "BVN Verification", desc: "Bank BVN Direct", badge: "Instant" },
    { id: "id_slip_gen", name: "NIN Standard Slip", desc: "Color PDF Card", badge: "Printable" },
    { id: "id_premium_slip", name: "BVN Card / Slip", desc: "Digital ID", badge: "Verified" },
    { id: "vtu_data", name: "Glo / MTN Data", desc: "SME Data", badge: "Hot" },
    { id: "vtu_airtime", name: "Airtime Top-up", desc: "Instant Top-up", badge: "Fast" },
    { id: "vtu_electricity", name: "Ikeja Electric", desc: "Prepaid Tokens", badge: "24/7" },
    { id: "edu_waec", name: "WAEC Result PIN", desc: "Scratch Card", badge: "Direct" },
  ];

  // Render high-fidelity service logo
  const renderServiceItemLogo = (srvId: string) => {
    if (srvId === "cac_scuml") return <ScumlOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId.includes("cac")) return <CacOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId.includes("tax") || srvId.includes("tin") || srvId.includes("nrs")) return <NrsOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId.includes("bvn") || srvId.includes("nibss")) return <NibssOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId.includes("nin") || srvId.includes("nimc") || srvId.includes("slip")) return <NimcOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "vtu_airtime") return <AirtimeOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "vtu_data") return <DataBundlesOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "vtu_electricity") return <ElectricityOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "gov_passport") return <PassportOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "id_bank_account_verification") return <CbnOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "edu_jamb") return <JambOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "edu_waec") return <WaecOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "edu_neco") return <NecoOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId === "edu_nabteb") return <NabtebOfficialCardLogo className="w-full h-full object-contain" />;
    if (srvId.startsWith("edu_")) return <ExamPinsOfficialCardLogo className="w-full h-full object-contain" />;
    return <Sparkles className="w-5 h-5 text-[#0F2D5C]" />;
  };

  const handleTriggerService = (serviceId: string) => {
    let base = SMART_LINK_SERVICES.find(s => s.id === serviceId);
    if (!base && serviceId === "id_vnin_to_nibss") {
      base = SMART_LINK_SERVICES.find(s => s.id === "id_vnin_to_bvn");
    }
    if (!base && serviceId.startsWith("edu_")) {
      const examKeyword = serviceId.replace("edu_", "");
      base = SMART_LINK_SERVICES.find(s => s.id.includes(examKeyword) || s.name.toLowerCase().includes(examKeyword));
    }
    if (base) {
      const livePrice = base.price !== undefined ? getServicePrice(base.id, base.price) : undefined;
      onSelectService({
        ...base,
        price: livePrice !== undefined ? livePrice : base.price,
      });
    }
  };

  const filteredServices = SMART_LINK_SERVICES.filter((srv) => {
    const isBanking = srv.id.includes("bvn") || srv.id.includes("bank");
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "BANKING" ? isBanking : 
       activeTab === "IDENTITY" ? (srv.category === "IDENTITY" && !isBanking) :
       srv.category === activeTab);

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      srv.name.toLowerCase().includes(query) ||
      srv.description.toLowerCase().includes(query) ||
      srv.id.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    const getRank = (item: typeof a) => {
      if (item.id === "id_nin_ver") return 1;
      if (item.id === "id_bvn_ver") return 2;
      if (item.id.includes("nin") || item.id.includes("nimc") || item.id.includes("slip")) return 3;
      if (item.id.includes("bvn") || item.id.includes("nibss")) return 4;
      if (item.category === "IDENTITY") return 5;
      if (item.category === "VTU") return 6;
      if (item.category === "EDUCATION") return 7;
      if (item.category === "CAC") return 8;
      if (item.category === "GOVERNMENT") return 9;
      return 10;
    };
    return getRank(a) - getRank(b);
  });

  return (
    <div className="py-10 bg-[#F5F7FA] min-h-screen" id="services-grid-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        
        {/* Header Title & Trust Bar */}
        <div className="bg-[#0F2D5C] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-[#0F2D5C]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold tracking-wider uppercase border border-white/15">
                FINTECH & TELECOM PORTAL
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> 99.9% Automated Uptime
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Instant Digital Services & Bill Payments
            </h1>
            <p className="text-xs sm:text-sm text-[#E5E7EB] leading-relaxed">
              Disburse mobile airtime, fast SME data bundles, electricity meter tokens, exam scratch PINs, corporate CAC filings, and biometric identity verification in seconds.
            </p>
          </div>
        </div>

        {/* 1. FINTECH QUICK-ACTION DOCK */}
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0F2D5C]/10 flex items-center justify-center text-[#0F2D5C]">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-sans">
                Quick Top Services
              </h2>
            </div>
            <span className="text-[11px] text-[#6B7280] font-medium hidden sm:inline">
              Instant 1-Click Launch
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {quickDockServices.map((dock) => {
              const IconComp = dock.icon;
              return (
                <button
                  key={dock.id}
                  onClick={() => handleTriggerService(dock.id)}
                  className="flex flex-col items-center justify-start p-2 sm:p-2.5 rounded-2xl hover:bg-white/80 transition-all group active:scale-95 cursor-pointer text-center select-none"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-110 shadow-xs border ${dock.color}`}>
                    <IconComp className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1E293B] leading-tight line-clamp-1 group-hover:text-[#0F2D5C]">
                    {dock.label}
                  </span>
                  <span className="text-[9px] text-[#64748B] font-medium mt-0.5 line-clamp-1">
                    {dock.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. POPULAR RECHARGES RIBBON */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider shrink-0 mr-1">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>Popular:</span>
          </div>
          {quickRechargePills.map((pill) => (
            <button
              key={pill.id + pill.name}
              onClick={() => handleTriggerService(pill.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white border border-slate-200/70 rounded-full text-xs transition-all shrink-0 hover:shadow-xs active:scale-95 cursor-pointer group"
            >
              <span className="font-semibold text-[#1E293B] group-hover:text-[#0F2D5C] text-[11px]">{pill.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#0F2D5C]/10 text-[#0F2D5C] rounded-full">
                {pill.badge}
              </span>
            </button>
          ))}
        </div>

        {/* 3. ALL SOLUTIONS EXPLORER CONSOLE */}
        <div className="space-y-4">
          
          {/* Search Bar & Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#0F2D5C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any service, NIN, BVN, Airtime, JAMB, Discos..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 text-xs font-medium text-[#0F172A] transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="text-[11px] font-medium text-[#64748B] shrink-0 pl-1">
              Showing <strong className="text-[#0F172A] font-bold">{filteredServices.length}</strong> active solutions
            </div>
          </div>

          {/* Segmented Category Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  id={`tab-service-${cat.id}`}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#0F2D5C] text-white shadow-xs"
                      : "bg-white/80 text-[#475569] border border-slate-200/80 hover:border-slate-300 hover:text-[#0F172A]"
                  }`}
                >
                  <CatIcon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-[#0F2D5C]"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Service Tiles in Pure App Icon Grid (No cards) */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <SlidersHorizontal className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-[#1E293B]">No solutions found</h3>
              <p className="text-xs text-[#64748B]">No service matches "{searchQuery}". Try clearing search or selecting another category.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("ALL");
                }}
                className="px-4 py-2 bg-[#0F2D5C] text-white text-xs font-bold rounded-xl hover:bg-[#17407E] transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5 pt-2">
              {filteredServices.map((srv) => {
                const livePrice = srv.price !== undefined ? getServicePrice(srv.id, srv.price) : undefined;
                return (
                  <button
                    key={srv.id}
                    onClick={() => onSelectService({ ...srv, price: livePrice ?? srv.price })}
                    id={`btn-order-${srv.id}`}
                    className="flex flex-col items-center justify-start p-2 sm:p-2.5 rounded-2xl hover:bg-white/80 transition-all group active:scale-95 cursor-pointer text-center select-none"
                  >
                    {/* Pure Icon Container without surrounding card */}
                    <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white shadow-xs border border-slate-200/70 flex items-center justify-center p-2 mb-1.5 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md shrink-0">
                      {renderServiceItemLogo(srv.id)}
                    </div>

                    {/* Title */}
                    <span className="text-[11px] sm:text-xs font-semibold text-[#1E293B] leading-tight line-clamp-2 group-hover:text-[#0F2D5C] text-center max-w-[105px]">
                      {srv.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
