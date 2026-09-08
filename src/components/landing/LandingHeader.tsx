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
      id="landing-header"
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-[#E5E7EB]"
          : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5.5rem] py-2">
          
          {/* Left: SmartLink Logo */}
          <button
            id="header-logo-container"
            type="button"
            onClick={() => handleNavClick("hero-section")}
            className="flex items-center cursor-pointer group py-1.5 bg-transparent border-none p-0 text-left"
            aria-label="SmartLink NG Home"
          >
            <img
              src={activeLogo}
              alt={`${siteName || "SmartLink Nigeria"} - Official Identity Verification & Fintech Gateway`}
              width={224}
              height={56}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{ aspectRatio: "224 / 56" }}
              className="h-14 sm:h-16 lg:h-18 w-auto max-w-[224px] sm:max-w-[280px] object-contain group-hover:scale-102 transition-transform duration-200"
              referrerPolicy="no-referrer"
              onError={handleLogoError}
            />
          </button>

          {/* Center: Desktop Navigation Links */}
          <nav id="header-desktop-nav" aria-label="Primary Desktop Navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSection === item.id
                    ? "text-[#0F2D5C] bg-[#F5F7FA] font-bold"
                    : "text-[#374151] hover:text-[#0F2D5C] hover:bg-[#F5F7FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Actions (Login, Register, Get Started, Admin Login) */}
          <div id="header-right-actions" className="hidden lg:flex items-center gap-3">
            <button
              id="header-btn-admin-login"
              type="button"
              onClick={() => {
                if (onAdminLogin) {
                  onAdminLogin();
                } else {
                  window.location.href = "/admin/login";
                }
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Secured Admin Portal Login"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              Admin Login
            </button>

            <button
              id="header-btn-login"
              type="button"
              onClick={onLogin}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              Login
            </button>

            <button
              id="header-btn-register"
              type="button"
              onClick={onRegister}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              Register
            </button>

            <button
              id="header-btn-get-started"
              type="button"
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-[#111827] hover:bg-[#0F2D5C] text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-98 cursor-pointer flex items-center gap-2"
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
        <div
          id="mobile-drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="lg:hidden fixed inset-x-0 top-20 bg-white border-b border-[#E5E7EB] shadow-2xl p-6 transition-all z-50 max-h-[calc(100vh-80px)] overflow-y-auto"
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
                    className={`w-full text-left px-4 py-3.5 min-h-[48px] text-sm font-semibold transition-colors rounded-xl cursor-pointer flex items-center justify-between touch-manipulation ${
                      isModalLink
                        ? "text-[#0F2D5C] bg-[#F5F7FA] border-l-2 border-[#0F2D5C] rounded-l-none"
                        : "text-[#111827] hover:bg-[#F5F7FA]"
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
                    <ArrowRight className={`h-4 w-4 ${isModalLink ? "text-[#0F2D5C]" : "text-[#6B7280]"}`} />
                  </button>
                );
              })}
            </div>

            {/* Mobile CTAs with min 48px height */}
            <div className="pt-4 border-t border-[#E5E7EB]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-drawer-btn-login"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="w-full min-h-[48px] px-3 py-2.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] text-[#111827] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </button>
                <button
                  id="mobile-drawer-btn-register"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegister();
                  }}
                  className="w-full min-h-[48px] px-3 py-2.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] text-[#111827] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
