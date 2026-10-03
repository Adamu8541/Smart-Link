/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, ShieldCheck, User, LogIn, UserPlus } from "lucide-react";
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
      className={`sticky top-0 z-40 w-full min-h-[60px] sm:min-h-[72px] transition-colors duration-200 border-b mobile-gpu-layer ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-[#E5E7EB]"
          : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18">
          
          {/* Left: SmartLink Logo */}
          <button
            id="header-logo-container"
            type="button"
            onClick={() => handleNavClick("hero-section")}
            className="flex items-center cursor-pointer group bg-transparent border-none p-0 text-left w-[170px] sm:w-[210px] h-10 sm:h-12 shrink-0"
            aria-label="Smart Link NG Home"
          >
            <img
              src={activeLogo}
              alt={`${siteName || "Smart Link NG"} - Official Identity Verification & Fintech Portal`}
              width={190}
              height={46}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{ aspectRatio: "190 / 46" }}
              className="h-9 w-auto sm:h-11 max-w-[190px] sm:max-w-[210px] object-contain shrink-0"
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
          <div id="header-right-actions" className="hidden lg:flex items-center gap-2.5">
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

          {/* Mobile Hamburger Toggle with 48px touch target */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="header-mobile-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center p-2.5 rounded-xl text-[#111827] hover:bg-[#F5F7FA] active:bg-[#E5E7EB] transition-colors cursor-pointer touch-manipulation"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer-overlay"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="lg:hidden fixed inset-0 top-20 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Side Drawer Panel */}
          <div
            id="mobile-drawer-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="lg:hidden fixed top-20 right-0 w-3/4 sm:w-1/2 max-w-xs h-[calc(100vh-80px)] bg-white border-l border-slate-200 shadow-2xl p-5 transition-all z-50 overflow-y-auto"
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
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default LandingHeader;
