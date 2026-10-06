/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, ShieldCheck, User, LogIn, UserPlus, Download, Smartphone } from "lucide-react";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;

interface LandingHeaderProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onAdminLogin?: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onAdminLogin,
  onNavigateSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.logoUrl || config.branding?.lightLogoUrl || configuredLogoUrl || logoImg;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    onNavigateSection(sectionId);
  };

  return (
    <header
      id="site-header"
      className={`sticky top-0 z-40 w-full min-h-[44px] sm:min-h-[52px] transition-colors duration-200 border-b mobile-gpu-layer ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-[#E5E7EB]"
          : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 sm:h-13">
          
          {/* Left: SmartLink Logo */}
          <button
            id="header-logo-container"
            type="button"
            onClick={() => handleNavClick("hero-section")}
            className="flex items-center cursor-pointer group bg-transparent border-none p-0 text-left w-[115px] sm:w-[155px] h-7 sm:h-8 shrink-0"
            aria-label="Smart Link NG Home"
          >
            <img
              src={activeLogo}
              alt={`${siteName || "Smart Link NG"} - Official Identity Verification & Fintech Portal`}
              width={140}
              height={32}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{ aspectRatio: "140 / 32" }}
              className="h-6 w-auto sm:h-7.5 max-w-[115px] sm:max-w-[155px] object-contain shrink-0"
              referrerPolicy="no-referrer"
              onError={handleLogoError}
            />
          </button>

          {/* Center: Desktop Navigation Links */}
          <nav id="header-desktop-nav" aria-label="Primary Desktop Navigation" className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {[
              { id: "hero-section", label: "Home" },
              { id: "services-section", label: "Services" },
              { id: "pricing-section", label: "Pricing" },
              { id: "api-section", label: "API" },
              { id: "about-section", label: "About" },
              { id: "contact-section", label: "Contact" },
            ].map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === item.id
                    ? "text-[#0F2D5C] bg-[#F5F7FA] font-bold"
                    : "text-[#374151] hover:text-[#0F2D5C] hover:bg-[#F5F7FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Actions (Login, Register, Get Started) */}
          <div id="header-right-actions" className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open_pwa_install_modal"))}
              className="px-3 py-1.5 text-xs font-bold text-[#0F2D5C] bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Install SmartLink App on your Phone/PC"
            >
              <Smartphone className="h-3.5 w-3.5 text-amber-700" />
              <span>Install App</span>
            </button>

            <button
              id="header-btn-login"
              type="button"
              onClick={onLogin}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] focus:ring-2 focus:ring-offset-2 focus:ring-[#0F2D5C] rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              Login
            </button>

            <button
              id="header-btn-register"
              type="button"
              onClick={onRegister}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] focus:ring-2 focus:ring-offset-2 focus:ring-[#0F2D5C] rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              Register
            </button>

            <button
              id="header-btn-get-started"
              type="button"
              onClick={onGetStarted}
              className="px-4 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-lg text-xs shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-[#0F2D5C] transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle with compact touch target */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              id="header-mobile-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center p-1.5 rounded-lg text-[#111827] hover:bg-[#F5F7FA] active:bg-[#E5E7EB] transition-colors cursor-pointer touch-manipulation"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer-overlay"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" aria-hidden="true" /> : <Menu className="h-4.5 w-4.5" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="lg:hidden fixed inset-0 top-11 sm:top-13 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Side Drawer Panel */}
          <div
            id="mobile-drawer-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="lg:hidden fixed top-11 sm:top-13 right-0 w-3/4 sm:w-1/2 max-w-xs h-[calc(100vh-44px)] sm:h-[calc(100vh-52px)] bg-white border-l border-slate-200 shadow-2xl p-4 transition-all z-50 overflow-y-auto"
          >
            <div className="space-y-4">
              <div className="space-y-1">
                {[
                  { id: "hero-section", label: "Home" },
                  { id: "services-section", label: "Services" },
                  { id: "pricing-section", label: "Pricing" },
                  { id: "api-section", label: "API" },
                  { id: "about-section", label: "About" },
                  { id: "contact-section", label: "Contact" },
                ].map((item) => {
                  const isModalLink = item.id === "about-section" || item.id === "contact-section";
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-link-${item.id}`}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full text-left px-3.5 py-3 min-h-[44px] text-sm font-semibold transition-colors rounded-xl cursor-pointer flex items-center justify-between touch-manipulation ${
                        isModalLink
                          ? "text-[#0F2D5C] bg-blue-50/80 border-l-2 border-[#0F2D5C] rounded-l-none"
                          : "text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.label}</span>
                        {isModalLink && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#0F2D5C] bg-[#0F2D5C]/10 px-2 py-0.5 rounded-full">
                            Info
                          </span>
                        )}
                      </span>
                      <ArrowRight className={`h-4 w-4 ${isModalLink ? "text-[#0F2D5C]" : "text-slate-400"}`} />
                    </button>
                  );
                })}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.dispatchEvent(new CustomEvent("open_pwa_install_modal"));
                    }}
                    className="w-full text-left px-3.5 py-3 min-h-[44px] text-sm font-bold transition-colors rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 cursor-pointer flex items-center justify-between touch-manipulation"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-700" />
                      <span>Install SmartLink App</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      Install
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default LandingHeader;
