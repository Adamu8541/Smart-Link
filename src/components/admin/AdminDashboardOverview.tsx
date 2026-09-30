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
    { path: "/admin/users", label: "User Directory", icon: Users, desc: "Manage registered users, status & roles" },
    { path: "/admin/wallet", label: "Wallet Management", icon: Wallet, desc: "Review user balances, funding & debits" },
    { path: "/admin/transactions", label: "Transaction Ledger", icon: BarChart3, desc: "Audit live transaction histories & status" },
    { path: "/admin/refunds", label: "Refunds Portal", icon: DollarSign, desc: "Process refund requests & ledger" },
    { path: "/admin/providers", label: "API Providers", icon: Server, desc: "Paystack, Aspfiy, VTU provider status" },
    { path: "/admin/settings", label: "System Settings", icon: Settings, desc: "Platform rates, fees & configuration" },
    { path: "/admin/reports", label: "Settlement & Audit Reports", icon: FileText, desc: "Export financial & reconciliation reports" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white"
      >
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/80 text-blue-300 font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Authentication & RBAC Governance</span>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {session.fullName}!
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
              {roleDef.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span>Role: <strong className="text-white">{roleDef.displayName}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Last Login: <strong className="text-white">{formattedLastLogin}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-white">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>System Status: <strong className="text-emerald-400">Active / RBAC Enforced</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button: Run Automated Module 1 Test Suite */}
        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="w-full md:w-auto py-3 px-5 font-bold rounded-2xl text-xs bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4 text-white" />
            <span>Run Module 1 Self-Test Suite</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Verifies Auth, Roles, Route Guards & Loggers
          </p>
        </div>
      </motion.div>

      {/* Module 1 Placeholder Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Admin Session User</span>
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white truncate">{session.fullName}</p>
          <p className="text-[11px] text-slate-400 truncate">{session.email}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Role Permissions</span>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {session.permissions.includes("*") ? "FULL ACCESS (*)" : `${session.permissions.length} Grants`}
          </p>
          <p className="text-[11px] text-slate-400">Dynamically evaluated via RBAC</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inactivity Timeout</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">30 Minutes</p>
          <p className="text-[11px] text-slate-400">Auto-expires idle session</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Activity Log</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">AUDITED</p>
          <p className="text-[11px] text-slate-400">Records login, logout & attempts</p>
        </div>
      </div>

      {/* Protected Route Navigation & Guard Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 text-left shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            Route Guard Verification Portal
          </div>
          <h2 className="text-lg font-bold text-white">
            Protected Admin Routes (Test Access Control)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any route to verify how the RBAC guard enforces or restricts access based on your assigned role (<strong className="text-slate-200">{roleDef.displayName}</strong>).
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
                className="p-4 rounded-2xl border border-slate-800 hover:border-blue-500 bg-slate-950/60 hover:bg-slate-800/80 transition-all group cursor-pointer space-y-2 text-left shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-white">{route.label}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{route.desc}</p>
                </div>
                <div className="text-[10px] font-mono text-blue-400/90 pt-1">
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
