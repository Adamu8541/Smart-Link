/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import logoImg from "../../assets/images/smartlink_logo_1785934050308.jpg";

interface LandingFooterProps {
  onNavigateSection: (sectionId: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigateSection,
  onLogin,
  onRegister,
}) => {
  return (
    <footer id="landing-footer" className="bg-white text-[#4B5563] pt-16 pb-12 border-t border-[#E5E7EB] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Grid: Logo & 4 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-left">
          
          {/* Column 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src={logoImg}
                alt="SmartLink Nigeria Logo"
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl bg-white p-1.5 border-2 border-[#E5E7EB] shadow-md shrink-0"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
              />
              <span className="font-sans text-2xl font-bold text-[#111827] tracking-tight">
                Smart<span className="text-[#0F2D5C]">Link Nigeria</span>
              </span>
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

          {/* Column 5: Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Legal
            </h3>
            <ul className="space-y-2 font-normal">
              {[
                "Privacy Policy",
                "Terms & Conditions",
                "Refund Policy",
                "Cookie Policy",
              ].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-legal-${item.toLowerCase().replace(/[^a-z]/g, "-")}`}
                    onClick={() => alert(`${item}: SmartLink Nigeria complies with all Nigerian regulatory & NDPR guidelines.`)}
                    className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-medium"
                  >
                    {item}
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
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#6B7280]">
          <p>© SmartLink Nigeria. All Rights Reserved.</p>
          <p className="text-center md:text-right">
            Smart Link Nigeria Computer Business Enterprise. Registered under CAC Nigeria (RC 9347502).
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
