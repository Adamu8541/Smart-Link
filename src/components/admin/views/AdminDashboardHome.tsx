/**
 * SmartLink Admin Panel — Dashboard Home View (Module 2)
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Wallet,
  DollarSign,
  BarChart3,
  Clock,
  XCircle,
  CheckSquare,
  Receipt,
  Server,
  PlayCircle,
  ShieldCheck,
  Zap,
  UserPlus,
  Megaphone,
  Settings,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Bell
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../../services/adminAuthService";
import { AdminStatSkeletonCard } from "../widgets/AdminSkeletonLoader";

interface AdminDashboardHomeProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
  onLogout: () => void;
}

export default function AdminDashboardHome({
  session,
  onNavigate,
  onLogout,
}: AdminDashboardHomeProps) {
  const [loading, setLoading] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    description: "Administrative Access Role",
  };

  const simulateRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  // 10 Metric Placeholder Widgets
  const metricCards = [
    { label: "Total Registered Users", value: "14,280", sub: "+124 new today", icon: Users, color: "text-blue-400", border: "border-blue-800/40" },
    { label: "Active User Accounts", value: "12,940", sub: "90.6% active rate", icon: Activity, color: "text-emerald-400", border: "border-emerald-800/40" },
    { label: "Total Wallet Balances", value: "₦48,250,000", sub: "User float liquidity", icon: Wallet, color: "text-purple-400", border: "border-purple-800/40" },
    { label: "Revenue Today", value: "₦1,850,400", sub: "+14.2% vs yesterday", icon: DollarSign, color: "text-teal-400", border: "border-teal-800/40" },
    { label: "Total Transactions", value: "248,910", sub: "Lifetime count", icon: BarChart3, color: "text-indigo-400", border: "border-indigo-800/40" },
    { label: "Pending Transactions", value: "18", sub: "Awaiting gateway confirm", icon: Clock, color: "text-amber-400", border: "border-amber-800/40" },
    { label: "Failed Transactions", value: "42", sub: "0.016% failure rate", icon: XCircle, color: "text-rose-400", border: "border-rose-800/40" },
    { label: "Verification Requests", value: "8,420", sub: "NIN / BVN / CAC checks", icon: CheckSquare, color: "text-cyan-400", border: "border-cyan-800/40" },
    { label: "Bill Payments Today", value: "₦3,120,500", sub: "Airtime, Data, Power, TV", icon: Receipt, color: "text-sky-400", border: "border-sky-800/40" },
    { label: "API Gateway Status", value: "OPERATIONAL", sub: "Aspfiy, VTU Direct", icon: Server, color: "text-emerald-400", border: "border-emerald-800/40" },
  ];

  // Quick Shortcut Actions
  const shortcutButtons = [
    { label: "Add User", path: "/admin/users", icon: UserPlus, color: "bg-blue-600 hover:bg-blue-500" },
    { label: "Credit Wallet", path: "/admin/wallet", icon: Wallet, color: "bg-emerald-600 hover:bg-emerald-500" },
    { label: "View Transactions", path: "/admin/transactions", icon: BarChart3, color: "bg-purple-600 hover:bg-purple-500" },
    { label: "Create Announcement", path: "/admin/dashboard", icon: Megaphone, color: "bg-amber-600 hover:bg-amber-500" },
    { label: "System Settings", path: "/admin/settings", icon: Settings, color: "bg-indigo-600 hover:bg-indigo-500" },
    { label: "View Reports", path: "/admin/reports", icon: FileText, color: "bg-teal-600 hover:bg-teal-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Panel Shell & Layout — Module 2 Active</span>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {session.fullName}!
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {roleDef.description} • Role: <strong className="text-slate-900 dark:text-white">{session.role}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Session Expiry: <strong className="text-slate-900 dark:text-white font-mono">30 Min Timeout</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>Gateway Status: <strong className="text-emerald-900 dark:text-emerald-200">100% Operational</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button: Run Module 2 Self-Test */}
        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="w-full md:w-auto py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run Module 2 Self-Test Suite</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Verifies Navigation, Theme, Breadcrumbs & Layout
          </p>
        </div>
      </motion.div>

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Zap className="h-4 w-4" />
            Quick Administrator Shortcuts
          </div>
          <button
            type="button"
            onClick={simulateRefresh}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Widgets</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {shortcutButtons.map((btn) => {
            const IconComp = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                onClick={() => onNavigate(btn.path)}
                className={`p-3 rounded-2xl ${btn.color} text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102`}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span className="truncate">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10 Metric Placeholder Widgets Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Executive Key Performance Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, idx) => (
                <AdminStatSkeletonCard key={idx} />
              ))
            : metricCards.map((card) => {
                const IconComp = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-xs`}
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                      <span className="truncate max-w-[120px]">{card.label}</span>
                      <IconComp className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white truncate">{card.value}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{card.sub}</p>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Bottom Info Grid: Announcements & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Announcements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Megaphone className="h-4 w-4" />
              System Announcements & Notices
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
              2 Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Scheduled Maintenance Window — Aspfiy & Payment Gateway</p>
                <span className="px-2 py-0.2 rounded bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-mono text-[9px] font-bold">HIGH</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Scheduled API maintenance will occur on Sunday, 02:00 AM - 03:30 AM WAT. Automated failovers enabled.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-white">NIMC Identity Verification Rate Adjustment</p>
                <span className="px-2 py-0.2 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-mono text-[9px] font-bold">MEDIUM</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Revised per-request verification billing rates take effect on 1st of next month for enterprise tiers.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              Live Security & Administrative Feed
            </div>
            <button
              type="button"
              onClick={() => onNavigate("/admin/security")}
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              Audit Logs <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { text: `Admin session authenticated for ${session.fullName}`, time: "Just now", type: "LOGIN" },
              { text: "Gateway Auto-Funding webhook processed ₦50,000 credit", time: "4 mins ago", type: "WEBHOOK" },
              { text: "NIN Verification API check executed for user #1082", time: "12 mins ago", type: "VERIFY" },
              { text: "System Rate Limit configured by Super Admin", time: "45 mins ago", type: "CONFIG" },
            ].map((feed, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-slate-800 dark:text-slate-300 truncate">{feed.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{feed.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
