/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import logoImg from "../../assets/images/logo.png";
import { useSiteConfig } from "../../context/SiteConfigContext";

interface LandingFooterProps {
  onNavigateSection: (sectionId: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onAdminLogin?: () => void;
  onNavigateLegal?: (docId?: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigateSection,
  onLogin,
  onRegister,
  onAdminLogin,
  onNavigateLegal,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.darkLogoUrl || config.branding?.logoUrl || configuredLogoUrl || logoImg;

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
                alt={siteName || "SmartLink Nigeria"}
                className="h-14 sm:h-16 w-auto max-w-[240px] object-contain rounded-lg p-1 bg-white"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
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
                <span>+234 808 549 0982 | WhatsApp: 09047738212</span>
              </div>
            </div>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Company
            </h3>
            <ul className="space-y-2 font-normal">
              {["About", "Careers", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-company-${item.toLowerCase()}`}
                    onClick={() => onNavigateSection(`${item.toLowerCase()}-section`)}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Services
            </h3>
            <ul className="space-y-2 font-normal">
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
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] flex items-center justify-between">
              <span>Legal & Policies</span>
            </h3>
            <ul className="space-y-1.5 font-normal">
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
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium text-[11px] block"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Support
            </h3>
            <ul className="space-y-2 font-normal">
              {[
                "Help Center",
                "FAQs",
                "Support Tickets",
              ].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-support-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => onNavigateSection("contact-section")}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
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
                  className="p-2 rounded-xl bg-[#F5F7FA] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#0F2D5C] hover:text-white transition-colors cursor-pointer"
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
              className="text-[#111827] hover:text-[#0F2D5C] font-semibold cursor-pointer"
            >
              Sign In to Portal
            </button>
            <span className="text-[#9CA3AF]">•</span>
            <button
              onClick={onRegister}
              className="text-[#0F2D5C] hover:underline font-bold cursor-pointer"
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
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Privacy Policy
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => handleLegalClick("terms-of-service")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Terms of Service
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => handleLegalClick("refund-policy")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                Refund Policy
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => handleLegalClick("kyc-notice")}
                className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
              >
                KYC & Verification Notice
              </button>
              <span className="text-slate-300">•</span>
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
              Smart Link Nigeria Computer Business Enterprise. Registered under CAC Nigeria (RC 9347502).
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
