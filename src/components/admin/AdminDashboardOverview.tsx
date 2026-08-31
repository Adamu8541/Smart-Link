/**
 * SmartLink Admin Panel — Dashboard Overview Placeholder Component
 * Path: /admin/dashboard
 * Module 1 Implementation
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  User,
  Clock,
  Activity,
  Users,
  Wallet,
  ArrowRight,
  Shield,
  Settings,
  Server,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Loader2,
  BarChart3,
  RefreshCw,
  LogOut
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../services/adminAuthTypes";

interface AdminDashboardOverviewProps {
  session: AdminSession;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export default function AdminDashboardOverview({
  session,
  onNavigate,
  onLogout,
}: AdminDashboardOverviewProps) {
  const [showTestModal, setShowTestModal] = useState(false);

  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    description: "Administrative Role",
    permissions: session.permissions,
  };

  const formattedLastLogin = session.loginTime
    ? new Date(session.loginTime).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  // Protected Admin Routes to test RBAC guards
  const protectedRoutes = [
    { path: "/admin/users", label: "User Directory", icon: Users, desc: "Manage registered users, status & roles", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/wallet", label: "Wallet Management", icon: Wallet, desc: "Review user balances, funding & debits", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/transactions", label: "Transaction Ledger", icon: BarChart3, desc: "Audit live transaction histories & status", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/refunds", label: "Refunds Portal", icon: DollarSign, desc: "Process refund requests & ledger", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/providers", label: "API Gateway Providers", icon: Server, desc: "Paystack, Aspfiy, VTU provider status", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/settings", label: "System Settings", icon: Settings, desc: "Platform rates, fees & configuration", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
    { path: "/admin/reports", label: "Settlement & Audit Reports", icon: FileText, desc: "Export financial & reconciliation reports", color: "bg-white border border-[#E5E7EB] hover:border-[#0F2D5C]" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F2D5C] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white"
      >
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17407E] border border-[#E5E7EB]/20 text-[#E5E7EB] font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Authentication & RBAC Module 1</span>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {session.fullName}!
            </h1>
            <p className="text-xs md:text-sm text-[#E5E7EB] mt-1 leading-relaxed">
              {roleDef.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#E5E7EB]">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#17407E] border border-[#E5E7EB]/20">
              <User className="h-3.5 w-3.5 text-white" />
              <span>Role: <strong className="text-white">{roleDef.displayName}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#17407E] border border-[#E5E7EB]/20">
              <Clock className="h-3.5 w-3.5 text-white" />
              <span>Last Login: <strong className="text-white">{formattedLastLogin}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#17407E] border border-[#E5E7EB]/20 text-white">
              <Activity className="h-3.5 w-3.5 text-white animate-pulse" />
              <span>System Status: <strong className="text-white">Active / RBAC Enforced</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button: Run Automated Module 1 Test Suite */}
        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="w-full md:w-auto py-3 px-5 bg-white hover:bg-[#F5F7FA] text-[#0F2D5C] font-bold rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run Module 1 Self-Test Suite</span>
          </button>
          <p className="text-[10px] text-[#E5E7EB] text-center">
            Verifies Auth, Roles, Route Guards & Loggers
          </p>
        </div>
      </motion.div>

      {/* Module 1 Placeholder Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#4B5563] text-xs">
            <span>Admin Session User</span>
            <User className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <p className="text-lg font-bold text-[#111827] truncate">{session.fullName}</p>
          <p className="text-[11px] text-[#6B7280] truncate">{session.email}</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#4B5563] text-xs">
            <span>Active Role Permissions</span>
            <Shield className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <p className="text-lg font-bold text-[#111827]">
            {session.permissions.includes("*") ? "FULL ACCESS (*)" : `${session.permissions.length} Grants`}
          </p>
          <p className="text-[11px] text-[#4B5563]">Dynamically evaluated via RBAC</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#4B5563] text-xs">
            <span>Inactivity Timeout</span>
            <Clock className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <p className="text-lg font-bold text-[#111827]">30 Minutes</p>
          <p className="text-[11px] text-[#4B5563]">Auto-expires idle session</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#4B5563] text-xs">
            <span>Security Activity Log</span>
            <Activity className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <p className="text-lg font-bold text-[#0F2D5C]">AUDITED</p>
          <p className="text-[11px] text-[#4B5563]">Records login, logout & attempts</p>
        </div>
      </div>

      {/* Protected Route Navigation & Guard Tester */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 space-y-5 text-left">
        <div>
          <div className="flex items-center gap-2 text-[#0F2D5C] text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            Route Guard Verification Portal
          </div>
          <h2 className="text-lg font-bold text-[#111827]">
            Protected Admin Routes (Test Access Control)
          </h2>
          <p className="text-xs text-[#4B5563] mt-0.5">
            Click any route to verify how the RBAC guard enforces or restricts access based on your assigned role (<strong className="text-[#111827]">{roleDef.displayName}</strong>).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {protectedRoutes.map((route) => {
            const IconComp = route.icon;
            return (
              <button
                key={route.path}
                type="button"
                onClick={() => onNavigate(route.path)}
                className={`p-4 rounded-2xl transition-all group cursor-pointer space-y-2 ${route.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C]">
                    <IconComp className="h-4 w-4 text-[#0F2D5C]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#4B5563] group-hover:text-[#0F2D5C] group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#111827]">{route.label}</h3>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{route.desc}</p>
                </div>
                <div className="text-[10px] font-mono text-[#0F2D5C] pt-1">
                  Path: {route.path}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
