/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, ShieldCheck, User, LogIn, UserPlus } from "lucide-react";
const logoImg = "/logo.png";
import { useSiteConfig } from "../../context/SiteConfigContext";

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
    window.addEventListener("scroll", handleScroll);
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
          <div
            id="header-logo-container"
            onClick={() => handleNavClick("hero-section")}
            className="flex items-center cursor-pointer group py-1.5"
          >
            <img
              src={activeLogo}
              alt={siteName || "SmartLink Nigeria"}
              className="h-14 sm:h-16 lg:h-18 w-auto max-w-[240px] sm:max-w-[280px] object-contain group-hover:scale-102 transition-all duration-300"
              referrerPolicy="no-referrer"
              onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
            />
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav id="header-desktop-nav" className="hidden md:flex items-center gap-1 lg:gap-2">
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
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSection === item.id
                    ? "text-[#0F2D5C] bg-[#F5F7FA] font-bold"
                    : "text-[#4B5563] hover:text-[#0F2D5C] hover:bg-[#F5F7FA]"
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
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              Admin Login
            </button>

            <button
              id="header-btn-login"
              onClick={onLogin}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5 text-white" />
              Login
            </button>

            <button
              id="header-btn-register"
              onClick={onRegister}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-[#0F2D5C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-white" />
              Register
            </button>

            <button
              id="header-btn-get-started"
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-[#111827] hover:bg-[#0F2D5C] text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="header-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-[#111827] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer-overlay"
          className="lg:hidden fixed inset-x-0 top-20 bg-white backdrop-blur-xl border-b border-[#E5E7EB] shadow-2xl p-6 transition-all animate-fadeIn z-50 max-h-[calc(100vh-80px)] overflow-y-auto"
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
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-between ${
                      isModalLink
                        ? "text-[#0F2D5C] bg-[#F5F7FA]/70 hover:bg-[#F5F7FA] border-l-2 border-[#0F2D5C] rounded-l-none"
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


          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
