/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Printer,
  Share2,
  Check,
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
  ChevronRight,
  Info,
  ExternalLink,
  BookOpen,
  ArrowUp,
  Mail,
  Phone,
  Shield
} from "lucide-react";
import { LEGAL_DOCUMENTS, LegalDocument, getLegalDocumentById } from "./legalData";
import { useSiteConfig } from "../../context/SiteConfigContext";
import logoImg from "../../assets/images/logo.png";

interface LegalDocumentViewProps {
  docId?: string;
  documentId?: string;
  onNavigateCenter?: () => void;
  onBack?: () => void;
  onSelectDocument?: (docId: string) => void;
  onNavigateHome?: () => void;
  onLogin?: () => void;
}

export const LegalDocumentView: React.FC<LegalDocumentViewProps> = ({
  docId,
  documentId,
  onNavigateCenter,
  onBack,
  onSelectDocument,
  onNavigateHome,
  onLogin,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.logoUrl || configuredLogoUrl || logoImg;

  const targetDocId = docId || documentId || "privacy-policy";
  const doc = getLegalDocumentById(targetDocId) || LEGAL_DOCUMENTS[0];
  const handleBackToCenter = onNavigateCenter || onBack || onNavigateHome || (() => {});
  const handleSelectDoc = onSelectDocument || ((id: string) => {
    window.location.href = `/legal/${id}`;
  });
  const handleGoHome = onNavigateHome || (() => { window.location.href = "/"; });
  const [activeSectionId, setActiveSectionId] = useState<string>(
    doc.sections[0]?.id || ""
  );
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll listener for TOC active section and scroll to top button
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (doc.sections[0]) {
      setActiveSectionId(doc.sections[0].id);
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const sectionElements = doc.sections.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }));

      const scrollPosition = window.scrollY + 180;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const item = sectionElements[i];
        if (item.el && item.el.offsetTop <= scrollPosition) {
          setActiveSectionId(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [doc.id]);

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
      setActiveSectionId(sectionId);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getDocIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "FileText":
        return <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case "RefreshCw":
        return <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "Wallet":
        return <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "CreditCard":
        return <CreditCard className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
      case "Cookie":
        return <Cookie className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case "Fingerprint":
        return <Fingerprint className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
      case "ShieldAlert":
        return <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      case "Lock":
        return <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      case "AlertTriangle":
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const relatedDocs = doc.relatedDocIds
    .map((id) => getLegalDocumentById(id))
    .filter(Boolean) as LegalDocument[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToCenter}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border-none bg-transparent"
              title="Return to Legal Center"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Legal Center</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div
              onClick={handleGoHome}
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none"
              title="Copy policy URL"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Share</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none"
              title="Print Document"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Print / PDF</span>
            </button>

            {onLogin && (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-xs font-bold text-white bg-[#071C35] hover:bg-[#0A264A] rounded-xl transition-all shadow-sm cursor-pointer border-none"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 print:hidden">
          <button
            onClick={handleGoHome}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <button
            onClick={handleBackToCenter}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Legal & Policies
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white truncate">
            {doc.shortTitle}
          </span>
        </nav>

        {/* Document Header Hero */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs mb-8 text-left space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
              {getDocIcon(doc.iconName)}
              <span>{doc.categoryLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-medium">
                Version {doc.version}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {doc.readTime}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {doc.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {doc.summary}
            </p>
          </div>

          {/* Dates & Entity Badge */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Effective Date: <strong>{doc.effectiveDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>Last Updated: <strong>{doc.lastUpdated}</strong></span>
              </div>
            </div>

            <div className="text-[11px] font-medium">
              Registered Entity: Smart Link Nigeria Computer Business Enterprise (CAC RC 9347502)
            </div>
          </div>

          {/* Key Principles Checklist */}
          {doc.highlights && doc.highlights.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Key Policy Highlights</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {doc.highlights.map((hl, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Sticky TOC on Left/Desktop, Full Content on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
          
          {/* Left Column: Table of Contents (Sticky) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Table of Contents</span>
              </h2>

              <nav className="space-y-1">
                {doc.sections.map((section, idx) => {
                  const isActive = activeSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleScrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer border-none ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">{section.title}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isActive
                            ? "text-blue-600 translate-x-0.5"
                            : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Switch to Other Legal Documents */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>All Policies & Documents</span>
              </h2>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {LEGAL_DOCUMENTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDoc(d.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors truncate block cursor-pointer border-none ${
                      d.id === doc.id
                        ? "bg-[#071C35] text-white font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {d.shortTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Need Legal Support? */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-4 text-xs space-y-2">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Need Clarification?</span>
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Contact our compliance & legal desk at <a href="mailto:Smartlinkcomputerbusiness@gmail.com" className="text-blue-600 underline font-medium">Smartlinkcomputerbusiness@gmail.com</a>
              </p>
            </div>
          </aside>

          {/* Right Column: Full Document Body */}
          <main className="lg:col-span-8 space-y-8">
            {doc.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs space-y-5 scroll-mt-24 text-left"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight pb-3 border-b border-slate-100 dark:border-slate-800">
                  {section.title}
                </h2>

                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {section.content.map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Subsections if any */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-6 pt-3">
                    {section.subsections.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {sub.subtitle}
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-4 list-disc marker:text-blue-500">
                          {sub.points.map((pt, ptIdx) => (
                            <li key={ptIdx} className="leading-relaxed">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Callout Notice if any */}
                {section.callout && (
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${
                      section.callout.type === "warning"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : section.callout.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                        : section.callout.type === "notice"
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                        : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                    }`}
                  >
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>{section.callout.text}</div>
                  </div>
                )}
              </section>
            ))}

            {/* Related Policies Cross-Navigation */}
            {relatedDocs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 print:hidden">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Related Legal Documents</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedDocs.map((relDoc) => (
                    <div
                      key={relDoc.id}
                      onClick={() => handleSelectDoc(relDoc.id)}
                      className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1 pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {relDoc.categoryLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                          {relDoc.title}
                        </h4>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Legal Center Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs print:hidden">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Smart Link Nigeria Computer Business Enterprise (CAC RC 9347502)</span>
              </div>
              <button
                onClick={handleBackToCenter}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Back to All Legal Documents
              </button>
            </div>

          </main>
        </div>

      </div>

      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[#071C35] text-white shadow-lg hover:bg-blue-900 transition-all z-30 cursor-pointer border-none print:hidden"
          title="Scroll to Top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

    </div>
  );
};
