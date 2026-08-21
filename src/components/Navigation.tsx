/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Home,
  ShieldCheck,
  Grid,
  ShoppingBag,
  Cpu,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Database,
  Building2,
  Users,
  Sun,
  Moon,
  Lock,
  UserPlus,
  Key,
  LayoutDashboard,
  Wallet,
  Clock,
  Code,
  Fingerprint,
  CheckSquare,
  FileText,
  Edit3,
  Printer,
  Link as LinkIcon,
  Shield,
  CheckCircle2,
  RefreshCw,
  Search,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { SMART_LINK_SERVICES } from "./ServicesGrid";
import defaultLogoImg from "../assets/images/smartlink_logo_1785934050308.jpg";
import { useSiteConfig } from "../context/SiteConfigContext";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectService?: (service: any) => void;
  onSetAuthStates?: (states: { isRegistering: boolean; isResetPassword: boolean }) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  viewId: string;
  serviceId?: string;
  tabId?: "OVERVIEW" | "ACTIVITY_FEED";
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export default function Navigation({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  onSelectService,
  onSetAuthStates
}: NavigationProps) {
  const { logoUrl, siteName } = useSiteConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTabVal, setActiveTabVal] = useState("OVERVIEW");

  // Keep track of the local dashboard tab state for active highlight sync
  useEffect(() => {
    const syncTab = () => {
      setActiveTabVal(sessionStorage.getItem("dashboard_tab") || "OVERVIEW");
    };
    syncTab();
    window.addEventListener("dashboard_tab_changed", syncTab);
    return () => window.removeEventListener("dashboard_tab_changed", syncTab);
  }, []);

  // Check if current user is an admin
  const isAdminUser = Boolean(
    currentUser && (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUB_ADMIN ||
      currentUser.role === UserRole.STAFF ||
      currentUser.role === UserRole.FINANCE_OFFICER ||
      currentUser.email?.toLowerCase() === "adamuamuhammad8541@gmail.com"
    )
  );

  const isUserBlocked = Boolean(
    currentUser?.status === "SUSPENDED" ||
    currentUser?.status === "INACTIVE" ||
    currentUser?.status === "BLOCKED"
  );

  // Menu Categories matching the screenshot layout precisely
  const rawMenuGroups: NavigationGroup[] = [
    {
      title: "MAIN",
      items: [
        { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard, viewId: "DASHBOARD", tabId: "OVERVIEW" },
        { id: "WALLET_FINANCE", label: "Wallet & Finance", icon: Wallet, viewId: "DASHBOARD", tabId: "OVERVIEW" },
        { id: "SERVICES_HISTORY", label: "Services History", icon: Clock, viewId: "DASHBOARD", tabId: "ACTIVITY_FEED" },
      ]
    },
    {
      title: "IDENTITY VERIFICATION",
      items: [
        { id: "SRV_nin_ver", label: "NIN Verification", icon: Fingerprint, viewId: "DASHBOARD", serviceId: "id_nin_ver" },
        { id: "SRV_nin_val", label: "NIN Validation", icon: CheckSquare, viewId: "DASHBOARD", serviceId: "id_nin_val" },
        { id: "SRV_vnin_slip", label: "VNIN Slip", icon: FileText, viewId: "DASHBOARD", serviceId: "id_vnin_slip" },
        { id: "SRV_nin_pers", label: "NIN Personalization", icon: User, viewId: "DASHBOARD", serviceId: "id_nin_pers" },
        { id: "SRV_nin_mod", label: "NIN Modification", icon: Edit3, viewId: "DASHBOARD", serviceId: "id_nin_mod" },
        { id: "SRV_slip_gen", label: "Slip Generation", icon: Printer, viewId: "DASHBOARD", serviceId: "id_slip_gen" },
        { id: "SRV_ipe_clear", label: "IPE Clearance", icon: CheckCircle2, viewId: "DASHBOARD", serviceId: "id_ipe_clearance" },
      ]
    },
    {
      title: "BANKING & BVN",
      items: [
        { id: "SRV_bvn_ver", label: "BVN Verification", icon: ShieldCheck, viewId: "DASHBOARD", serviceId: "id_bvn_ver" },
        { id: "SRV_vnin_nibss", label: "VNIN to NIBSS", icon: RefreshCw, viewId: "DASHBOARD", serviceId: "id_vnin_to_nibss" },
        { id: "SRV_bvn_user", label: "BVN User", icon: User, viewId: "DASHBOARD", serviceId: "id_bvn_user" },
        { id: "SRV_bvn_mod", label: "BVN Modification", icon: Edit3, viewId: "DASHBOARD", serviceId: "id_bvn_modification" },
        { id: "SRV_premium_slip", label: "Premium Slip", icon: Lock, viewId: "DASHBOARD", serviceId: "id_premium_slip" },
        { id: "SRV_bvn_retrieval", label: "BVN Retrieval", icon: Search, viewId: "DASHBOARD", serviceId: "id_bvn_retrieval" },
      ]
    },
    {
      title: "CORPORATE FILINGS",
      items: [
        { id: "SRV_cac_registration", label: "CAC Registration", icon: Building2, viewId: "DASHBOARD", serviceId: "id_cac_registration" },
        { id: "SRV_tax_id_services", label: "Tax ID Services", icon: FileText, viewId: "DASHBOARD", serviceId: "id_tax_id_search" },
      ]
    },
    {
      title: "EDUCATION",
      items: [
        { id: "SRV_edu_waec", label: "WAEC Result Checker", icon: GraduationCap, viewId: "DASHBOARD", serviceId: "edu_waec" },
        { id: "SRV_edu_neco", label: "NECO Result Token", icon: GraduationCap, viewId: "DASHBOARD", serviceId: "edu_neco" },
        { id: "SRV_edu_jamb", label: "JAMB ePIN Processing", icon: GraduationCap, viewId: "DASHBOARD", serviceId: "edu_jamb" },
      ]
    },
    {
      title: "ADMIN & GOVERNANCE",
      items: [
        { id: "ADMIN_PORTAL", label: "Admin Login (Secured)", icon: ShieldCheck, viewId: "ADMIN_LOGIN" },
      ]
    }
  ];

  // Strictly filter out Admin & Governance for non-admin or blocked/suspended users
  const menuGroups = rawMenuGroups.filter(group => {
    if (group.title === "ADMIN & GOVERNANCE") {
      return isAdminUser && !isUserBlocked;
    }
    return true;
  });

  const handleItemClick = (item: NavigationItem) => {
    if (item.tabId) {
      sessionStorage.setItem("dashboard_tab", item.tabId);
      window.dispatchEvent(new Event("dashboard_tab_changed"));
    }

    onNavigate(item.viewId);

    if (item.serviceId && onSelectService) {
      const serviceObj = SMART_LINK_SERVICES.find(s => s.id === item.serviceId);
      if (serviceObj) {
        onSelectService(serviceObj);
      }
    }

    setMobileMenuOpen(false);
  };

  const isItemActive = (item: NavigationItem) => {
    if (currentView !== item.viewId) return false;
    if (item.viewId === "DASHBOARD") {
      if (item.serviceId) return false; // Service triggers shouldn't highlight as main navigation views
      if (item.tabId) {
        return activeTabVal === item.tabId;
      }
    }
    return true;
  };

  const handleAuthClick = (mode: "login" | "register" | "forgot") => {
    if (mode === "forgot") {
      try {
        window.history.pushState({ view: "FORGOT_PASSWORD" }, "", "/forgot-password");
      } catch (err) {}
      onNavigate("FORGOT_PASSWORD");
      setMobileMenuOpen(false);
      return;
    }
    onNavigate("DASHBOARD");
    if (onSetAuthStates) {
      onSetAuthStates({
        isRegistering: mode === "register",
        isResetPassword: false
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0F2D5C] text-white p-3.5 flex items-center justify-between gap-3 sticky top-0 z-40 border-b border-[#17407E]">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors shrink-0 border border-white/20"
        >
          {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
        </button>

        <div className="flex-1 text-center truncate px-2">
          <span className="font-sans text-xs sm:text-sm font-bold tracking-tight text-white">
            {siteName}
          </span>
        </div>

        <div className="flex items-center shrink-0">
          <img
            src={logoUrl}
            alt={siteName}
            className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-2xl bg-white p-1.5 shadow-lg border border-slate-200"
            referrerPolicy="no-referrer"
            onError={(e: any) => { e.currentTarget.src = defaultLogoImg; }}
          />
        </div>
      </header>

      {/* Slide-out Drawer for Mobile */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden flex justify-start animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F2D5C] text-white w-72 h-full p-5 space-y-4 flex flex-col justify-between overflow-y-auto shadow-2xl border-r border-[#17407E]"
          >
            <div className="space-y-4">
              {/* Logo / Brand */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-14 w-14 object-contain rounded-2xl shadow-lg bg-white p-1.5 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e: any) => { e.currentTarget.src = defaultLogoImg; }}
                />
                <span className="font-sans text-base font-bold tracking-tight text-white">
                  {siteName}
                </span>
              </div>

              {/* Profile Block */}
              {currentUser ? (
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-left space-y-1">
                  <div className="text-[9px] text-slate-400 font-semibold font-mono">AUTHORIZED PARTNER</div>
                  <h3 className="font-bold text-xs truncate text-slate-200">{currentUser.fullName}</h3>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                    <span>₦{currentUser.walletBalance.toLocaleString()}</span>
                    <span className="px-1 py-0.2 rounded bg-slate-800 text-[8px] font-bold text-slate-400 uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-left">
                  <span className="text-[9px] text-slate-400 font-mono">SECURE GATEWAY NODE</span>
                  <p className="text-[10px] text-slate-500 font-light mt-1">Authenticate to begin processing identity logs.</p>
                </div>
              )}

              {/* Categorized Menu Scroll Area */}
              <nav className="flex flex-col gap-4 text-left overflow-y-auto max-h-[calc(100vh-240px)] pr-1 scrollbar-none">
                {menuGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="px-3 py-1 text-[9px] font-extrabold text-slate-500 font-sans tracking-wider uppercase">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                              active
                                ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 pl-2.5"
                                : "text-slate-400 hover:bg-slate-850 hover:text-slate-100"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-slate-500"}`} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Logout and Dark mode */}
            <div className="pt-4 border-t border-slate-800 space-y-2 mt-auto shrink-0">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="w-full py-2 bg-slate-950/50 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded text-[11px] font-bold transition-all flex items-center justify-between px-3 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </span>
                <span className={`h-4 w-7 rounded-full p-0.5 transition-colors duration-200 ${isDarkMode ? "bg-blue-600" : "bg-slate-700"} flex items-center`}>
                  <span className={`h-3 w-3 rounded-full bg-white transition-transform duration-200 transform ${isDarkMode ? "translate-x-3" : "translate-x-0"}`}></span>
                </span>
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-850 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-800 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out / Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col justify-between w-64 h-screen bg-[#0F2D5C] text-white border-r border-[#17407E]/40 p-5 sticky top-0 shrink-0">
        <div className="space-y-5 flex flex-col h-full overflow-hidden">
          {/* Logo Brand matching the Image precisely */}
          <div className="flex items-center gap-3 px-1 py-1 select-none">
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-16 object-contain rounded-2xl shadow-xl bg-white p-1.5 shrink-0 border border-slate-200 hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e: any) => { e.currentTarget.src = defaultLogoImg; }}
            />
            <span className="font-sans text-xl font-black tracking-tight text-white">
              {siteName}
            </span>
          </div>

          {/* Profile Card */}
          {currentUser && (
            <div className="p-3.5 rounded-xl bg-[#17407E]/60 border border-white/10 text-left space-y-2 animate-fadeIn">
              <div className="flex justify-between items-center text-[9px] text-blue-200 font-mono font-bold tracking-wider">
                <span>AUTHORIZED PARTNER</span>
                <span className="inline-block h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-white truncate">{currentUser.fullName}</h3>
                <p className="text-[10px] text-blue-200 font-mono truncate mt-0.5">{currentUser.email}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold font-mono text-emerald-300">₦{currentUser.walletBalance.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-[8px] font-mono font-bold text-blue-100 uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* Categorized Desktop Navigation Links */}
          <nav className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-left scrollbar-thin max-h-[calc(100vh-280px)]">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <div className="px-3 text-[9px] font-bold text-blue-200/70 font-sans tracking-wider uppercase">
                  {group.title}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        id={`btn-nav-desktop-${item.id}`}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                          active
                            ? "bg-[#17407E] text-white border-l-4 border-blue-400 shadow-xs"
                            : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 transition-colors ${active ? "text-white" : "text-blue-200/70 group-hover:text-white"}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Panel Settings */}
        <div className="pt-3 border-t border-white/10 space-y-2 text-left shrink-0">
          {/* Dark Mode Theme */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-blue-100 border border-white/10 rounded-xl text-xs font-semibold transition-all flex items-center justify-between px-3 cursor-pointer"
          >
            <span className="flex items-center gap-2 font-mono text-[11px]">
              {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-blue-300" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
            <span className={`h-4 w-7 rounded-full p-0.5 transition-colors duration-200 ${isDarkMode ? "bg-blue-500" : "bg-white/20"} flex items-center`}>
              <span className={`h-3 w-3 rounded-full bg-white transition-transform duration-200 transform ${isDarkMode ? "translate-x-3" : "translate-x-0"}`}></span>
            </span>
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              id="btn-sign-out"
              className="w-full py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-200 text-blue-200 border border-white/10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out / Exit
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
