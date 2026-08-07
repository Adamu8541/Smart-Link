/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, ShieldCheck, User, LogIn, UserPlus } from "lucide-react";
import logoImg from "../../assets/images/smartlink_logo_1785934050308.jpg";

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
            className="flex items-center gap-4 cursor-pointer group py-1.5"
          >
            <div className="relative shrink-0">
              <img
                src={logoImg}
                alt="SmartLink Nigeria Logo"
                className="h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36 object-contain rounded-3xl shadow-xl border-2 border-[#E5E7EB] bg-white p-2 group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
              />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827]">
                Smart <span className="text-[#0F2D5C]">Link</span> <span className="text-[#0F2D5C]">Nigeria</span>
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                Unified Nigeria Digital Platform
              </span>
            </div>
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
                    ? "text-[#0F2D5C] bg-blue-50 font-bold"
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
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Secured Admin Portal Login"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              Admin Login
            </button>

            <button
              id="header-btn-login"
              onClick={onLogin}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5 text-white" />
              Login
            </button>

            <button
              id="header-btn-register"
              onClick={onRegister}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111827] hover:bg-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-white" />
              Register
            </button>

            <button
              id="header-btn-get-started"
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-black hover:bg-[#111827] text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-98 cursor-pointer flex items-center gap-2"
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
              ].map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-[#111827] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-[#6B7280]" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-btn-login"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="w-full py-3 bg-[#F5F7FA] text-[#111827] font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#0F2D5C]" />
                  Login
                </button>

                <button
                  id="mobile-btn-register"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegister();
                  }}
                  className="w-full py-3 bg-blue-50 text-[#0F2D5C] border border-blue-200 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register
                </button>
              </div>

              <button
                id="mobile-btn-get-started"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-3.5 bg-[#0F2D5C] text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                id="mobile-btn-admin-login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onAdminLogin) {
                    onAdminLogin();
                  } else {
                    window.location.href = "/admin/login";
                  }
                }}
                className="w-full py-3 bg-[#111827] text-white font-bold rounded-xl text-xs hover:bg-[#0F2D5C] transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#E5E7EB]"
              >
                <ShieldCheck className="h-4 w-4 text-blue-200" />
                Secured Admin Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
