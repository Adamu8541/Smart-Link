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
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../services/adminAuthService";

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
    { path: "/admin/users", label: "User Directory", icon: Users, desc: "Manage registered users, status & roles", color: "from-blue-600/20 to-blue-900/10 border-blue-800/40" },
    { path: "/admin/wallet", label: "Wallet Management", icon: Wallet, desc: "Review user balances, funding & debits", color: "from-emerald-600/20 to-emerald-900/10 border-emerald-800/40" },
    { path: "/admin/transactions", label: "Transaction Ledger", icon: BarChart3, desc: "Audit live transaction histories & status", color: "from-purple-600/20 to-purple-900/10 border-purple-800/40" },
    { path: "/admin/refunds", label: "Refunds Portal", icon: DollarSign, desc: "Process refund requests & ledger", color: "from-amber-600/20 to-amber-900/10 border-amber-800/40" },
    { path: "/admin/providers", label: "API Gateway Providers", icon: Server, desc: "Paystack, Aspfiy, VTU provider status", color: "from-teal-600/20 to-teal-900/10 border-teal-800/40" },
    { path: "/admin/settings", label: "System Settings", icon: Settings, desc: "Platform rates, fees & configuration", color: "from-indigo-600/20 to-indigo-900/10 border-indigo-800/40" },
    { path: "/admin/reports", label: "Settlement & Audit Reports", icon: FileText, desc: "Export financial & reconciliation reports", color: "from-rose-600/20 to-rose-900/10 border-rose-800/40" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400 font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Authentication & RBAC Module 1</span>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {session.fullName}!
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
              {roleDef.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span>Role: <strong className="text-white">{roleDef.displayName}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Last Login: <strong className="text-white">{formattedLastLogin}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>System Status: <strong className="text-emerald-200">Active / RBAC Enforced</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button: Run Automated Module 1 Test Suite */}
        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="w-full md:w-auto py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run Module 1 Self-Test Suite</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Verifies Auth, Roles, Route Guards & Loggers
          </p>
        </div>
      </motion.div>

      {/* Module 1 Placeholder Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Admin Session User</span>
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white truncate">{session.fullName}</p>
          <p className="text-[11px] text-slate-400 truncate">{session.email}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Role Permissions</span>
            <Shield className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {session.permissions.includes("*") ? "FULL ACCESS (*)" : `${session.permissions.length} Grants`}
          </p>
          <p className="text-[11px] text-slate-400">Dynamically evaluated via RBAC</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inactivity Timeout</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-white">30 Minutes</p>
          <p className="text-[11px] text-slate-400">Auto-expires idle session</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Activity Log</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">AUDITED</p>
          <p className="text-[11px] text-slate-400">Records login, logout & attempts</p>
        </div>
      </div>

      {/* Protected Route Navigation & Guard Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
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
                className={`p-4 rounded-2xl border text-left bg-gradient-to-br ${route.color} hover:border-blue-500/60 transition-all group cursor-pointer space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white">
                    <IconComp className="h-4 w-4 text-blue-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{route.label}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{route.desc}</p>
                </div>
                <div className="text-[10px] font-mono text-blue-400 pt-1">
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
