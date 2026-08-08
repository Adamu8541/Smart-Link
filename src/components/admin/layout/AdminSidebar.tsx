/**
 * SmartLink Admin Panel — Left Sidebar Navigation Component (Module 2)
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  Receipt,
  Server,
  BarChart3,
  DollarSign,
  FileText,
  HelpCircle,
  Bell,
  Shield,
  Settings,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Zap,
  Globe,
  Code,
  ArrowRightLeft
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../../services/adminAuthService";
import logoImg from "../../../assets/images/smartlink_logo_1785934050308.jpg";

interface AdminSidebarProps {
  currentRoute: string;
  session: AdminSession;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (routePath: string) => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
}

export interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    path: string;
    icon: React.ElementType;
    requiredPermissions: string[];
    badge?: string;
  }[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "OVERVIEW & ANALYTICS",
    items: [
      { id: "NAV_DASHBOARD", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, requiredPermissions: ["VIEW_DASHBOARD"] },
    ],
  },
  {
    title: "USER & ACCOUNT GOVERNANCE",
    items: [
      { id: "NAV_USERS", label: "Users Directory", path: "/admin/users", icon: Users, requiredPermissions: ["MANAGE_USERS", "VIEW_USERS"] },
      { id: "NAV_WALLET", label: "Wallet Management", path: "/admin/wallet", icon: Wallet, requiredPermissions: ["MANAGE_WALLET", "VIEW_FINANCE"] },
    ],
  },
  {
    title: "SERVICES & GATEWAYS",
    items: [
      { id: "NAV_SERVICES", label: "Verification Services", path: "/admin/services", icon: CheckSquare, requiredPermissions: ["MANAGE_SERVICES", "VIEW_SERVICES"] },
      { id: "NAV_PROVIDERS", label: "API Gateway Providers", path: "/admin/providers", icon: Server, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
      { id: "NAV_API_BUILDER", label: "API Request Builder", path: "/admin/api-builder", icon: Code, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
      { id: "NAV_RESPONSE_MAPPER", label: "API Response Mapper", path: "/admin/response-mapper", icon: ArrowRightLeft, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
    ],
  },
  {
    title: "FINANCIALS & LEDGER",
    items: [
      { id: "NAV_TRANSACTIONS", label: "Transactions Ledger", path: "/admin/transactions", icon: BarChart3, requiredPermissions: ["MANAGE_TRANSACTIONS", "VIEW_TRANSACTIONS"] },
      { id: "NAV_REFUNDS", label: "Refunds Portal", path: "/admin/refunds", icon: DollarSign, requiredPermissions: ["MANAGE_REFUNDS", "VIEW_FINANCE"] },
      { id: "NAV_REPORTS", label: "Audit & Settlement Reports", path: "/admin/reports", icon: FileText, requiredPermissions: ["MANAGE_REPORTS", "VIEW_REPORTS"] },
    ],
  },
  {
    title: "OPERATIONS & SYSTEM",
    items: [
      { id: "NAV_SUPPORT", label: "Customer Support", path: "/admin/support", icon: HelpCircle, requiredPermissions: ["MANAGE_TICKETS", "VIEW_SUPPORT"] },
      { id: "NAV_SECURITY", label: "Security & Audit Logs", path: "/admin/security", icon: Shield, requiredPermissions: ["MANAGE_SECURITY", "VIEW_AUDIT_LOGS"] },
      { id: "NAV_SETTINGS", label: "System Settings", path: "/admin/settings", icon: Settings, requiredPermissions: ["MANAGE_SETTINGS", "VIEW_SETTINGS"] },
      { id: "NAV_SYSTEM", label: "System Logs & Health", path: "/admin/system", icon: Activity, requiredPermissions: ["MANAGE_SYSTEM", "VIEW_AUDIT_LOGS"] },
    ],
  },
];

export default function AdminSidebar({
  currentRoute,
  session,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onLogout,
  isMobileDrawer = false,
}: AdminSidebarProps) {
  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    colorBadge: "bg-blue-950 text-blue-400 border-blue-800",
  };

  const checkHasAccess = (requiredPerms: string[]) => {
    if (session.permissions.includes("*")) return true;
    return requiredPerms.some((p) => session.permissions.includes(p));
  };

  return (
    <aside
      className={`h-full bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 relative select-none ${
        collapsed && !isMobileDrawer ? "w-20" : "w-72"
      }`}
    >
      {/* Top Header Logo */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onNavigate("/admin/dashboard")}>
          <div className="relative shrink-0">
            <img src={logoImg} alt="SmartLink Logo" className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-contain bg-white border-2 border-slate-700 p-1.5 shadow-lg" onError={(e: any) => { e.currentTarget.src = "/logo.png"; }} />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight">SmartLink</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 font-mono text-[9px] font-bold">ADMIN</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Enterprise Portal v2.4</p>
            </div>
          )}
        </div>

        {!isMobileDrawer && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Admin User Card (Snapshot) */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-lg shadow-blue-600/20">
            {session.fullName.charAt(0).toUpperCase()}
          </div>

          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{session.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${roleDef.colorBadge}`}>
                  {roleDef.displayName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {(!collapsed || isMobileDrawer) && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComp = item.icon;
                const isActive = currentRoute === item.path;
                const hasAccess = checkHasAccess(item.requiredPermissions);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!hasAccess}
                    onClick={() => onNavigate(item.path)}
                    title={collapsed ? `${item.label} ${!hasAccess ? '(Restricted)' : ''}` : undefined}
                    className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/20"
                        : hasAccess
                        ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                        : "text-slate-600 opacity-60 cursor-not-allowed hover:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconComp
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? "text-white" : hasAccess ? "text-slate-400 group-hover:text-blue-400" : "text-slate-600"
                        }`}
                      />
                      {(!collapsed || isMobileDrawer) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {(!collapsed || isMobileDrawer) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!hasAccess && (
                          <Lock className="h-3 w-3 text-slate-600" title="Permission Denied by RBAC" />
                        )}
                        {item.badge && hasAccess && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                              isActive ? "bg-white text-blue-600" : "bg-blue-950 text-blue-400 border border-blue-800"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2">
        {(!collapsed || isMobileDrawer) && (
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gateway Region: <strong className="text-slate-200">WAT / NG</strong></span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
          {(!collapsed || isMobileDrawer) && <span>Logout Session</span>}
        </button>
      </div>
    </aside>
  );
}
