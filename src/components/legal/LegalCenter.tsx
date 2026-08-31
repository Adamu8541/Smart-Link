/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  Wallet,
  CreditCard,
  Cookie,
  Fingerprint,
  ShieldAlert,
  Lock,
  AlertTriangle,
  Search,
  ArrowRight,
  Printer,
  ExternalLink,
  HelpCircle,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronRight,
  Shield,
  Megaphone
} from "lucide-react";
import { LEGAL_CATEGORIES, LEGAL_DOCUMENTS, LegalDocument } from "./legalData";
import { useSiteConfig } from "../../context/SiteConfigContext";
const logoImg = "/logo.png";

interface LegalCenterProps {
  onSelectDocument: (docId: string) => void;
  onNavigateHome: () => void;
  onLogin?: () => void;
}

export const LegalCenter: React.FC<LegalCenterProps> = ({
  onSelectDocument,
  onNavigateHome,
  onLogin,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.logoUrl || configuredLogoUrl || logoImg;
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getDocIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "FileText":
        return <FileText className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "RefreshCw":
        return <RefreshCw className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Wallet":
        return <Wallet className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "CreditCard":
        return <CreditCard className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Cookie":
        return <Cookie className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Fingerprint":
        return <Fingerprint className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "ShieldAlert":
        return <ShieldAlert className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Lock":
        return <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      case "AlertTriangle":
        return <AlertTriangle className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Megaphone":
        return <Megaphone className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      default:
        return <FileText className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    }
  };

  const filteredDocuments = useMemo(() => {
    return LEGAL_DOCUMENTS.filter((doc) => {
      const matchesCategory =
        selectedCategory === "ALL" || doc.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        doc.title.toLowerCase().includes(query) ||
        doc.shortTitle.toLowerCase().includes(query) ||
        doc.summary.toLowerCase().includes(query) ||
        doc.highlights.some((h) => h.toLowerCase().includes(query)) ||
        doc.sections.some(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.content.some((c) => c.toLowerCase().includes(query))
        );
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#111827] text-[#111827] dark:text-[#E5E7EB] font-sans">
      
      {/* Top Header */}
      <header className="bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#111827] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border-none bg-transparent"
              title="Return to Homepage"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <div className="h-5 w-px bg-[#E5E7EB] dark:bg-[#111827]" />
            <div
              onClick={onNavigateHome}
              className="flex items-center cursor-pointer"
            >
              <img
                src={activeLogo}
                alt={siteName || "SmartLink Nigeria"}
                className="h-10 sm:h-12 w-auto max-w-[200px] object-contain"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4B5563] dark:text-[#E5E7EB] bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-colors cursor-pointer border-none"
              title="Print Summary"
            >
              <Printer className="h-4 w-4" />
              <span>Print Center</span>
            </button>
            {onLogin && (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-xs font-bold text-white bg-[#071C35] hover:bg-[#0A264A] rounded-xl transition-all shadow-sm cursor-pointer border-none"
              >
                Sign In to Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-white to-[#F5F7FA] dark:from-[#111827] dark:to-[#111827] border-b border-[#E5E7EB] dark:border-[#111827] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 border border-[#E5E7EB] dark:border-[#0F2D5C]/80 text-[#0F2D5C] dark:text-[#9CA3AF] text-xs font-semibold">
            <Shield className="h-3.5 w-3.5" />
            <span>Compliance & Legal Repository</span>
            <span className="h-1 w-1 rounded-full bg-[#0F2D5C]" />
            <span>RC 9347502</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] dark:text-white tracking-tight">
            Legal & Policies Center
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4B5563] dark:text-[#9CA3AF] font-normal leading-relaxed">
            Review the terms, policies, disclosures, and privacy commitments governing your access to SmartLink Nigeria's digital verification, wallet settlement, and e-government services.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 10 legal policies (e.g., refunds, NIN, wallet, cookies)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] shadow-sm text-sm text-[#111827] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-[#F5F7FA] dark:focus:ring-[#0F2D5C]/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] bg-transparent border-none cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {LEGAL_CATEGORIES.map((cat) => {
            const count =
              cat.id === "ALL"
                ? LEGAL_DOCUMENTS.length
                : LEGAL_DOCUMENTS.filter((d) => d.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border-none ${
                  isSelected
                    ? "bg-[#071C35] text-white shadow-sm"
                    : "bg-white dark:bg-[#111827] text-[#4B5563] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#111827]"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-[#0F2D5C]/30 text-white"
                      : "bg-[#E5E7EB] dark:bg-[#111827] text-[#6B7280]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter if Search */}
        {searchQuery && (
          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-medium">
            Showing <strong className="text-[#111827] dark:text-white">{filteredDocuments.length}</strong> {filteredDocuments.length === 1 ? "document" : "documents"} matching "{searchQuery}"
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="group bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] hover:border-[#0F2D5C] dark:hover:border-[#0F2D5C] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Row: Icon & Version Badge */}
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] group-hover:bg-[#F5F7FA] dark:group-hover:bg-[#0F2D5C]/60 transition-colors">
                      {getDocIcon(doc.iconName)}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wider">
                      {doc.categoryLabel}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h2 className="text-base font-bold text-[#111827] dark:text-white group-hover:text-[#0F2D5C] dark:group-hover:text-[#9CA3AF] transition-colors flex items-center gap-1.5">
                      <span>{doc.title}</span>
                    </h2>
                    <p className="mt-2 text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed line-clamp-3">
                      {doc.summary}
                    </p>
                  </div>

                  {/* Key Highlights Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#111827]/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">Key Principles</span>
                    {doc.highlights.slice(0, 2).map((hl, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#4B5563] dark:text-[#E5E7EB]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Metadata & Action */}
                <div className="pt-5 mt-4 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{doc.lastUpdated}</span>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-[#0F2D5C] dark:text-[#9CA3AF] group-hover:translate-x-1 transition-transform">
                    <span>Read Policy</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-8 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#111827] flex items-center justify-center text-[#9CA3AF]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827] dark:text-white">
              No matching legal policies found
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              We couldn't find any policies matching your search query "{searchQuery}". Try selecting a different category or clearing your filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer border-none"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Legal Contact & Help Desk Banner */}
        <div className="bg-gradient-to-br from-[#071C35] to-[#0D3B66] text-white rounded-3xl p-8 md:p-10 shadow-lg text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#9CA3AF] text-xs font-semibold">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Legal & Data Protection Desk</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Have questions about our terms, privacy, or KYC policies?
              </h2>
              <p className="text-xs sm:text-sm text-[#E5E7EB] leading-relaxed">
                Our compliance officers and legal counsel are available to assist with data subject access requests, regulatory verification inquiries, or enterprise SLA clarifications.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="mailto:Smartlinkcomputerbusiness@gmail.com"
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-xs font-semibold text-white no-underline"
              >
                <Mail className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                <span className="truncate">Smartlinkcomputerbusiness@gmail.com</span>
              </a>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 text-xs font-semibold text-white">
                <Phone className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                <span>+234 808 549 0982 | WhatsApp: +234 904 773 8212</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#111827] py-10 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={activeLogo}
                alt="SmartLink Nigeria"
                className="h-9 w-auto object-contain"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
              />
              <span className="font-bold text-[#111827] dark:text-white">SmartLink Nigeria</span>
            </div>
            <p className="text-[11px]">
              © {new Date().getFullYear()} Smart Link Computer Business (CAC RC 9347502), operating as SmartLink NG & Smart Link Nigeria. All rights reserved.
            </p>
          </div>
          <div className="border-t border-[#E5E7EB] dark:border-[#111827] pt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
            {LEGAL_DOCUMENTS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="text-[#6B7280] hover:text-[#0F2D5C] dark:hover:text-[#9CA3AF] transition-colors bg-transparent border-none p-0 cursor-pointer text-left"
              >
                {doc.shortTitle}
              </button>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};
