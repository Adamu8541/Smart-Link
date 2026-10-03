/**
 * SmartLink Admin Panel — Left Sidebar Navigation Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  Server,
  BarChart3,
  DollarSign,
  FileText,
  Shield,
  Settings,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Globe,
  Code,
  ArrowRightLeft,
  KeyRound,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../../services/adminAuthTypes";
const logoImg = "/logo.webp";
import { useSiteConfig } from "../../../context/SiteConfigContext";

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
      { id: "NAV_PERMISSIONS", label: "Permission Matrix", path: "/admin/permissions", icon: KeyRound, requiredPermissions: ["MANAGE_SUBADMINS", "MANAGE_SECURITY"] },
    ],
  },
  {
    title: "SERVICES & PORTALS",
    items: [
      { id: "NAV_SERVICES", label: "Verification Services", path: "/admin/services", icon: CheckSquare, requiredPermissions: ["MANAGE_SERVICES", "VIEW_SERVICES"] },
      { id: "NAV_PROVIDERS", label: "API Providers", path: "/admin/providers", icon: Server, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
      { id: "NAV_PORTAL_ROUTING", label: "Multi-Provider Routing", path: "/admin/routing", icon: ArrowRightLeft, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"], badge: "Failover" },
      { id: "NAV_API_BUILDER", label: "API Request Builder", path: "/admin/api-builder", icon: Code, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
      { id: "NAV_RESPONSE_MAPPER", label: "API Response Mapper", path: "/admin/response-mapper", icon: ArrowRightLeft, requiredPermissions: ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"] },
    ],
  },
  {
    title: "FINANCIALS & LEDGER",
    items: [
      { id: "NAV_TRANSACTIONS", label: "Transactions Ledger", path: "/admin/transactions", icon: BarChart3, requiredPermissions: ["MANAGE_TRANSACTIONS", "VIEW_TRANSACTIONS"] },
      { id: "NAV_REFUNDS", label: "Refunds Portal", path: "/admin/refunds", icon: RotateCcw, requiredPermissions: ["MANAGE_REFUNDS", "VIEW_FINANCE"] },
      { id: "NAV_REPORTS", label: "Financial Reports", path: "/admin/reports", icon: FileText, requiredPermissions: ["MANAGE_REPORTS", "VIEW_REPORTS"] },
    ],
  },
  {
    title: "OPERATIONS & SYSTEM",
    items: [
      { id: "NAV_LEGAL", label: "Legal & Compliance", path: "/admin/legal", icon: ShieldCheck, requiredPermissions: ["VIEW_DASHBOARD", "MANAGE_SETTINGS"] },
      { id: "NAV_SECURITY", label: "Security & Audit Logs", path: "/admin/security", icon: Shield, requiredPermissions: ["MANAGE_SECURITY", "VIEW_AUDIT_LOGS"] },
      { id: "NAV_SETTINGS", label: "System Settings", path: "/admin/settings", icon: Settings, requiredPermissions: ["MANAGE_SETTINGS", "VIEW_SETTINGS"] },
      { id: "NAV_SYSTEM", label: "System Health & Logs", path: "/admin/system", icon: Activity, requiredPermissions: ["MANAGE_SYSTEM", "VIEW_AUDIT_LOGS"] },
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
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.dashboardLogoUrl || config.branding?.darkLogoUrl || config.branding?.logoUrl || configuredLogoUrl || logoImg;

  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    colorBadge: "bg-blue-50 text-[#0F2D5C] dark:bg-blue-950/50 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  };

  const checkHasAccess = (requiredPerms: string[]) => {
    if (session.permissions.includes("*")) return true;
    return requiredPerms.some((p) => session.permissions.includes(p));
  };

  return (
    <aside className={`h-full bg-[#0F2D5C] text-white border-r border-[#17407E]/40 flex flex-col justify-between transition-all duration-300 relative select-none shadow-[2px_0_12px_rgba(11,31,58,0.15)] ${
        collapsed && !isMobileDrawer ? "w-20" : "w-72"
      }`}
    >
      {/* Top Header Logo */}
      <div className="p-4 border-b border-[#17407E]/50 flex items-center justify-between bg-[#0B2144] text-white">
        <div
          className="flex items-center gap-3 overflow-hidden cursor-pointer"
          onClick={() => onNavigate("/admin/dashboard")}
        >
          <div className="relative shrink-0">
            <img
              src={activeLogo}
              alt={siteName || "SmartLink Logo"}
              className="h-10 w-auto max-w-[130px] rounded-lg object-contain bg-white border border-[#17407E] p-1 shadow-sm"
              onError={(e: any) => {
                e.currentTarget.src = "/logo.webp";
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-[#0B2144]" />
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight">SmartLink</span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[9px] font-bold">ADMIN</span>
              </div>
              <p className="text-[10px] text-blue-200 truncate">Enterprise Control</p>
            </div>
          )}
        </div>

        {!isMobileDrawer && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/10 transition-colors cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Admin User Card (Snapshot) */}
      <div className="p-3.5 border-b border-[#17407E]/40 bg-[#17407E]/25">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white text-[#0F2D5C] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm">
            {session.fullName.charAt(0).toUpperCase()}
          </div>

          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{session.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-white/20 text-white border border-white/20">
                  {roleDef.displayName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {(!collapsed || isMobileDrawer) && (
              <p className="px-3 text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-1.5 font-mono">
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
                    title={item.label + (!hasAccess ? " (Restricted)" : "")}
                    className={`w-full py-2 px-3 rounded-xl flex items-center justify-between text-xs font-semibold whitespace-nowrap overflow-hidden transition-all group ${
                      !hasAccess
                        ? "text-white/30 cursor-not-allowed opacity-40"
                        : isActive
                        ? "bg-[#17407E] text-white border-l-4 border-white shadow-xs pl-2.5 font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <IconComp
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? "text-white" : "text-blue-200"
                        }`}
                      />
                      {(!collapsed || isMobileDrawer) && (
                        <span className="truncate whitespace-nowrap text-left">{item.label}</span>
                      )}
                    </div>

                    {(!collapsed || isMobileDrawer) && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {!hasAccess && (
                          <span title="Permission Denied by RBAC">
                            <Lock className="h-3 w-3 text-blue-200" />
                          </span>
                        )}
                        {item.badge && hasAccess && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                              isActive
                                ? "bg-white text-[#0F2D5C]"
                                : "bg-white/15 text-white"
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
      <div className="p-3 border-t border-[#17407E]/50 bg-[#0A1E3F]/60 space-y-2">
        {(!collapsed || isMobileDrawer) && (
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[10px] text-blue-100">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Region: <strong className="text-white">Nigeria (WAT)</strong></span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-200 border border-rose-400/20 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobileDrawer) && <span>Logout Session</span>}
        </button>
      </div>
    </aside>
  );
}
