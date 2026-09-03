/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ShieldCheck, X, Building2, Briefcase, BookOpen, MessageSquare, Calendar, ChevronRight, Clock, Sparkles } from "lucide-react";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;

interface LandingFooterProps {
  onNavigateSection: (sectionId: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onAdminLogin?: () => void;
  onNavigateLegal?: (docId?: string) => void;
  activeInfoTab?: "about" | "contact" | null;
  setActiveInfoTab?: (tab: "about" | "contact" | null) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigateSection,
  onLogin,
  onRegister,
  onAdminLogin,
  onNavigateLegal,
  activeInfoTab: controlledActiveInfoTab,
  setActiveInfoTab: controlledSetActiveInfoTab,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.darkLogoUrl || config.branding?.logoUrl || configuredLogoUrl || logoImg;
  
  const [localActiveInfoTab, setLocalActiveInfoTab] = useState<"about" | "contact" | null>(null);
  const isControlled = controlledActiveInfoTab !== undefined && controlledSetActiveInfoTab !== undefined;
  const activeInfoTab = isControlled ? controlledActiveInfoTab : localActiveInfoTab;
  const setActiveInfoTab = isControlled ? controlledSetActiveInfoTab : setLocalActiveInfoTab;

  const handleLegalClick = (docId?: string) => {
    if (onNavigateLegal) {
      onNavigateLegal(docId);
    } else {
      window.location.href = docId ? `/legal/${docId}` : "/legal";
    }
  };

  return (
    <footer id="landing-footer" className="bg-white text-[#4B5563] pt-16 pb-12 border-t border-[#E5E7EB] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Grid: Logo & 4 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-left">
          
          {/* Column 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <img
                src={activeLogo}
                alt={`${siteName || "SmartLink Nigeria"} - Identity Verification, Utility Bills and Enterprise CAC Filing`}
                width={224}
                height={98}
                loading="lazy"
                decoding="async"
                className="h-14 sm:h-16 w-auto max-w-[224px] object-contain rounded-lg p-1 bg-white"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
            </div>

            <p className="text-xs text-[#4B5563] font-normal leading-relaxed max-w-sm">
              Nigeria's premier digital verification and payment platform. Authorized technology provider for NIN/BVN lookups, corporate CAC filings, utility bill settlements, and educational scratch cards.
            </p>

            <div className="space-y-2 pt-2 text-[#4B5563]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#0F2D5C] shrink-0" />
                <span>Smartlinkcomputerbusiness@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0F2D5C] shrink-0" />
                <span>+234 808 549 0982 | WhatsApp: +234 904 773 8212</span>
              </div>
            </div>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Company
            </h2>
            <ul className="space-y-1 font-normal">
              {[
                { name: "About", tab: "about" },
                { name: "Contact", tab: "contact" }
              ].map((item) => (
                <li key={item.tab}>
                  <button
                    id={`footer-company-${item.tab}`}
                    onClick={() => setActiveInfoTab(item.tab as any)}
                    className="text-[#4B5563] hover:text-[#0F2D5C] hover:translate-x-1 duration-200 transition-all cursor-pointer bg-transparent border-none py-2 px-1 min-h-[44px] text-left font-medium flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-[#4B5563]/40" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Services */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Services
            </h2>
            <ul className="space-y-1 font-normal">
              {[
                "Identity Verification",
                "Bill Payments",
                "Wallet",
                "APIs",
              ].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-services-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => onNavigateSection("services-section")}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none py-2 px-1 min-h-[44px] text-left font-medium flex items-center"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal & Policies */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] flex items-center justify-between">
              <span>Legal & Policies</span>
            </h2>
            <ul className="space-y-1 font-normal">
              {[
                { label: "Legal Center", docId: "legal-center" },
                { label: "Privacy Policy", docId: "privacy-policy" },
                { label: "Terms of Service", docId: "terms-of-service" },
                { label: "Refund Policy", docId: "refund-policy" },
                { label: "Wallet Terms", docId: "wallet-terms" },
                { label: "Payment Terms", docId: "payment-terms" },
                { label: "Cookie Policy", docId: "cookie-policy" },
                { label: "KYC & Verification", docId: "kyc-notice" },
                { label: "Acceptable Use", docId: "acceptable-use" },
                { label: "Data Protection", docId: "data-protection" },
                { label: "Government Disclaimer", docId: "disclaimer" },
              ].map((item) => (
                <li key={item.docId}>
                  <button
                    id={`footer-legal-${item.docId}`}
                    onClick={() => handleLegalClick(item.docId === "legal-center" ? undefined : item.docId)}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none py-1.5 px-1 min-h-[40px] text-left font-medium text-xs flex items-center"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Support */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Support
            </h2>
            <ul className="space-y-1 font-normal">
              {[
                "Help Center",
                "FAQs",
                "Support Tickets",
              ].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-support-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => item === "FAQs" ? onNavigateSection("faq-section") : onNavigateSection("contact-section")}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none py-2 px-1 min-h-[44px] text-left font-medium flex items-center"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Middle Row: Social Media Icons */}
        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280] font-semibold mr-2">Follow Us:</span>
            {[
              { name: "Facebook", icon: Facebook, href: "https://facebook.com/smartlinkng" },
              { name: "X (Twitter)", icon: Twitter, href: "https://twitter.com/smartlinkng" },
              { name: "Instagram", icon: Instagram, href: "https://instagram.com/smartlinkng" },
              { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/smartlinkng" },
              { name: "YouTube", icon: Youtube, href: "https://youtube.com/smartlinkng" },
            ].map((social) => {
              const IconComp = social.icon;
              return (
                <a
                  key={social.name}
                  id={`footer-social-${social.name.toLowerCase().replace(/[^a-z]/g, "")}`}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-[#F5F7FA] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#0F2D5C] hover:text-white transition-colors cursor-pointer"
                  aria-label={social.name}
                >
                  <IconComp className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onLogin}
              className="text-[#111827] hover:text-[#0F2D5C] font-semibold cursor-pointer min-h-[44px] inline-flex items-center py-2 px-1"
            >
              Sign In to Portal
            </button>
            <span className="text-[#9CA3AF]">•</span>
            <button
              onClick={onRegister}
              className="text-[#0F2D5C] hover:underline font-bold cursor-pointer min-h-[44px] inline-flex items-center py-2 px-1"
            >
              Create Free Account
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-[#E5E7EB] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6B7280]">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button
                onClick={() => handleLegalClick("privacy-policy")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none py-2 px-1.5 min-h-[44px] inline-flex items-center text-left font-medium"
              >
                Privacy Policy
              </button>
              <span className="text-[#E5E7EB]">•</span>
              <button
                onClick={() => handleLegalClick("terms-of-service")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Terms of Service
              </button>
              <span className="text-[#E5E7EB]">•</span>
              <button
                onClick={() => handleLegalClick("refund-policy")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Refund Policy
              </button>
              <span className="text-[#E5E7EB]">•</span>
              <button
                onClick={() => handleLegalClick("kyc-notice")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                KYC & Verification Notice
              </button>
              <span className="text-[#E5E7EB]">•</span>
              <button
                onClick={() => handleLegalClick("disclaimer")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Government Disclaimer
              </button>
            </div>
            <div>
              <button
                onClick={() => handleLegalClick()}
                className="text-[#0F2D5C] hover:underline font-bold transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
              >
                View Full Legal Center →
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-[#6B7280]">
            <p>© SmartLink Nigeria. All Rights Reserved.</p>
            <p className="text-center md:text-right">
              Smart Link Computer Business (trading as SmartLink NG / Smart Link Nigeria). Registered with Corporate Affairs Commission (CAC RC 9347502).
            </p>
          </div>
        </div>

      </div>

      {/* Dynamic Company Info Modals */}
      {activeInfoTab && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveInfoTab(null)}
        >
          <div 
            className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F7FA]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#0F2D5C]/10 text-[#0F2D5C]">
                  {activeInfoTab === "about" && <Building2 className="h-5 w-5" />}
                  {activeInfoTab === "contact" && <MessageSquare className="h-5 w-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                    {activeInfoTab === "about" && "Corporate Profile"}
                    {activeInfoTab === "contact" && "Communication Desk"}
                  </span>
                  <h3 className="text-base font-bold text-[#111827]">
                    {activeInfoTab === "about" && "About Smart Link Computer Business"}
                    {activeInfoTab === "contact" && "Contact & Support Desk"}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveInfoTab(null)}
                className="p-1.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-[#6B7280]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#4B5563] leading-relaxed max-h-[60vh]">
              {activeInfoTab === "about" && (
                <div className="space-y-4 text-xs">
                  <p>
                    <strong>Smart Link Computer Business</strong> (CAC Registration Number: <strong>RC 9347502</strong>) is a fully registered Nigerian enterprise established in accordance with the Companies and Allied Matters Act. Our statutory headquarters are focused on high-integrity software engineering, payment services, and real-time electronic identity facilitation.
                  </p>
                  
                  <p>
                    For public interaction, responsive mobile interfaces, email correspondence, and automated domain lookups, we utilize the simplified trade marks <strong>SmartLink NG</strong> and <strong>Smart Link Nigeria</strong>. This streamlined brand framework is specifically established to resolve critical technical challenges:
                  </p>

                  <ul className="space-y-2 pl-4 list-disc text-xs">
                    <li>
                      <strong>Domain Usability:</strong> The full statutory name <em>Smart Link Computer Business</em> is 28 characters long, making any direct web domain (such as smartlinkcomputerbusiness.com.ng) highly complex, error-prone for mobile keyboard inputs, and difficult for users to recall. Shortening to <code>smartlinkng.com.ng</code> provides a clean, user-friendly digital entry point.
                    </li>
                    <li>
                      <strong>Interface Layout Integrity:</strong> Mobile receipt layouts, custom thermal printer slips, SMS confirmations, and transaction dashboards have extremely strict horizontal width boundaries. Truncating the brand name prevents visual wrapping overflows and ensures design clarity.
                    </li>
                    <li>
                      <strong>Modern Technological Focus:</strong> Our historical foundations involved physical computer systems and repairs. The updated brand names better represent our growth into a high-performance cloud gateway that routes thousands of digital transactions and government registry checks.
                    </li>
                  </ul>

                  <p>
                    We act as an independent, high-availability router providing secure, instant access to identity databases (NIN, vNIN, BVN, CAC, and TIN validation) and robust VTU utility settlements. We process all transactions securely and operate in strict compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> to guarantee maximum security.
                  </p>
                  
                  <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl space-y-2">
                    <h4 className="font-bold text-[#111827] flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-[#0F2D5C]" />
                      Core Mission
                    </h4>
                    <p className="text-[11px] text-[#4B5563]">
                      To bridge the digital verification gap for agents, small businesses, and individuals in Nigeria by delivering 99.9% uptime, robust API options, and secure, pre-funded wallet structures for utility disbursements and legal identity compliance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-2">
                    <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-1">
                      <span className="font-bold text-[#0F2D5C]">Statutory Name</span>
                      <p>Smart Link Computer Business</p>
                    </div>
                    <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-1">
                      <span className="font-bold text-[#0F2D5C]">CAC Registration No.</span>
                      <p>RC 9347502</p>
                    </div>
                  </div>
                </div>
              )}

              {activeInfoTab === "contact" && (
                <div className="space-y-4">
                  <p>
                    Need assistance, custom API access, or enterprise volume packages? Reach out to our dedicated support desks. Our team is available to assist you.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#0F2D5C]">
                        <Mail className="h-4 w-4" />
                        <span>Support Email</span>
                      </div>
                      <p className="text-[11px]">Smartlinkcomputerbusiness@gmail.com</p>
                    </div>

                    <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#0F2D5C]">
                        <Phone className="h-4 w-4" />
                        <span>Support Hotlines</span>
                      </div>
                      <p className="text-[11px]">+234 808 549 0982</p>
                      <p className="text-[11px]">+234 904 773 8212 (WhatsApp)</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl space-y-2 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                      <Clock className="h-4 w-4 text-[#0F2D5C]" />
                      <span>Availability Commitments</span>
                    </div>
                    <ul className="space-y-1 list-disc pl-4 text-[#4B5563]">
                      <li>Standard Account and Wallet Funding queries: 2 hours response time.</li>
                      <li>Enterprise and API integration technical desks: 24/7 dedicated monitoring.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F5F7FA] text-[10px] text-[#6B7280] flex justify-between items-center">
              <span>CAC RC 9347502</span>
              <span>Smart Link Computer Business</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default LandingFooter;
