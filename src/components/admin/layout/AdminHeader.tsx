/**
 * SmartLink Admin Panel — Top Navigation Header Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Zap,
  Menu,
  UserPlus,
  Wallet,
  BarChart3,
  Megaphone,
  Settings,
  FileText,
  LogOut,
  ChevronDown,
  X,
  ArrowRight,
  Shield,
  RotateCcw
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../../services/adminAuthTypes";
import { adminLayoutService } from "../../../services/adminLayoutService";
import { AdminGlobalSearchItem } from "../../../types/adminLayoutTypes";

interface AdminHeaderProps {
  session: AdminSession;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onToggleMobileDrawer: () => void;
  onToggleNotificationDrawer: () => void;
  unreadNotifCount: number;
  onNavigate: (routePath: string) => void;
  onLogout: () => void;
}

export default function AdminHeader({
  session,
  onToggleMobileDrawer,
  onNavigate,
  onLogout,
}: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminGlobalSearchItem[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    colorBadge: "bg-[#EAF3FF] text-[#0066FF] border-[#E5EAF0]",
  };

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearchModal]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      const res = adminLayoutService.searchAdminData(q);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (path: string) => {
    setShowSearchModal(false);
    setSearchQuery("");
    onNavigate(path);
  };

  const quickActions = [
    { label: "User Directory", icon: UserPlus, path: "/admin/users", desc: "Manage registered users" },
    { label: "Wallet Funding & Debit", icon: Wallet, path: "/admin/wallet", desc: "Ledger adjustments" },
    { label: "Transactions Ledger", icon: BarChart3, path: "/admin/transactions", desc: "Live financial audits" },
    { label: "Refunds Portal", icon: RotateCcw, path: "/admin/refunds", desc: "Manage refund tickets" },
    { label: "System Settings", icon: Settings, path: "/admin/settings", desc: "Configure charges & API keys" },
    { label: "Financial Reports", icon: FileText, path: "/admin/reports", desc: "Export settlement CSV reports" },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF0] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 text-[#101828]">
      {/* Left: Mobile Drawer Trigger & Search Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-2 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] text-[#667085] hover:text-[#101828] transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar Trigger */}
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="py-2 px-3.5 bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-xl text-[#667085] text-xs flex items-center gap-3 transition-all cursor-pointer w-48 md:w-80 group"
        >
          <Search className="h-4 w-4 text-[#667085] group-hover:text-[#0066FF] transition-colors shrink-0" />
          <span className="truncate flex-1 text-left">Search Users, Wallet, Txns...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-[#E5EAF0] text-[10px] font-mono text-[#667085] font-bold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Actions Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowProfileMenu(false);
            }}
            className="py-2 px-3.5 bg-[#0066FF] hover:bg-[#123C73] border border-[#0066FF] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Zap className="h-3.5 w-3.5 text-white" />
            <span className="hidden sm:inline">Quick Actions</span>
            <ChevronDown className="h-3 w-3 text-white" />
          </button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 bg-white border border-[#E5EAF0] rounded-2xl p-3 shadow-2xl z-50 space-y-1"
              >
                <div className="px-3 py-1.5 border-b border-[#E5EAF0] mb-1">
                  <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Administrator Shortcuts</p>
                </div>
                {quickActions.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <button
                      key={act.label}
                      type="button"
                      onClick={() => {
                        setShowQuickActions(false);
                        onNavigate(act.path);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-[#F7F9FC] text-left transition-all flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-[#EAF3FF] border border-[#E5EAF0] text-[#0066FF] group-hover:bg-[#0066FF] group-hover:text-white transition-all shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#101828] group-hover:text-[#0066FF]">{act.label}</p>
                        <p className="text-[10px] text-[#667085] truncate">{act.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowQuickActions(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] transition-all cursor-pointer"
          >
            <div className="h-7 w-7 rounded-lg bg-[#0B1F3A] text-white font-extrabold text-xs flex items-center justify-center">
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0 pr-1">
              <p className="text-xs font-bold text-[#101828] leading-tight truncate max-w-[100px]">{session.fullName}</p>
              <p className="text-[10px] text-[#0066FF] font-semibold">{roleDef.displayName}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#667085]" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-white border border-[#E5EAF0] rounded-2xl p-3 shadow-2xl z-50 space-y-3"
              >
                <div className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl space-y-1">
                  <p className="text-xs font-bold text-[#101828]">{session.fullName}</p>
                  <p className="text-[11px] text-[#667085] truncate">{session.email}</p>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-[#EAF3FF] text-[#0066FF] border border-[#E5EAF0]">
                      {roleDef.displayName}
                    </span>
                    <span className="text-[10px] text-[#12B76A] font-medium">● Active Session</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate("/admin/security");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-[#F7F9FC] text-xs font-medium text-[#667085] hover:text-[#101828] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 text-[#0066FF]" />
                    <span>Security & Session Logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate("/admin/settings");
                    }}
                    className="w-full p-2 rounded-xl hover:bg-[#F7F9FC] text-xs font-medium text-[#667085] hover:text-[#101828] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#0066FF]" />
                    <span>System Settings</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E5EAF0]">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full p-2 rounded-xl bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] text-[#F04438] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-[#F04438]" />
                    <span>Logout Session</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Search Modal Overlay */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#0B1F3A]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-xl bg-white border border-[#E5EAF0] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Search Bar Input */}
              <div className="p-4 border-b border-[#E5EAF0] flex items-center gap-3">
                <Search className="h-5 w-5 text-[#0066FF] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Type to search users, transactions, providers, refunds..."
                  className="w-full bg-transparent text-[#101828] text-sm outline-none placeholder:text-[#667085] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 rounded-lg bg-[#F7F9FC] text-[#667085] hover:text-[#101828] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Results Area */}
              <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                {searchQuery.trim().length < 2 && (
                  <p className="text-xs text-[#667085] text-center py-6">
                    Enter at least 2 characters to search across Users, Transactions, Wallets & Gateway Providers.
                  </p>
                )}

                {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-[#F04438] text-center py-6">
                    No system records found matching "{searchQuery}".
                  </p>
                )}

                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSearchResultClick(item.path)}
                    className="w-full p-3 bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-xl text-left transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-[#EAF3FF] border border-[#E5EAF0] text-[#0066FF] font-mono text-[9px] font-bold">
                          {item.type}
                        </span>
                        <p className="text-xs font-bold text-[#101828] group-hover:text-[#0066FF] truncate">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-[#667085] truncate">{item.subtitle}</p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-[#667085] group-hover:text-[#0066FF] transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              {/* Modal Footer Tip */}
              <div className="p-3 bg-[#F7F9FC] border-t border-[#E5EAF0] text-[10px] text-[#667085] flex items-center justify-between">
                <span>Press <kbd className="px-1 py-0.5 bg-white border border-[#E5EAF0] rounded font-mono">ESC</kbd> to exit search</span>
                <span>Firestore Direct Search</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
