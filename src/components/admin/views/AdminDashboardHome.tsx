/**
 * SmartLink Admin Panel — Dashboard Home Overview
 * Live Cloud Database Telemetry & Homepage Theme Matching
 */

import React, { useState, useEffect } from "react";
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
  Bell,
  CheckCircle2,
  Lock,
  RotateCcw
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG } from "../../../services/adminAuthTypes";
import { getAuthHeaders } from "../../../services/providerService";

interface AdminDashboardHomeProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
  onLogout: () => void;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalWalletBalance: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  todayTransactionsCount: number;
  todayRevenue: number;
  verificationRequests: number;
  billPaymentVolume: number;
  activeProviders: number;
  gatewayStatus: string;
}

export default function AdminDashboardHome({
  session,
  onNavigate,
  onLogout,
}: AdminDashboardHomeProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWalletBalance: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0,
    todayTransactionsCount: 0,
    todayRevenue: 0,
    verificationRequests: 0,
    billPaymentVolume: 0,
    activeProviders: 0,
    gatewayStatus: "OPERATIONAL",
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const roleDef = ADMIN_ROLES_CONFIG[session.role] || {
    displayName: session.role,
    description: "Administrative Governance Role",
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats", { headers }),
        fetch("/api/admin/system/logs", { headers }),
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      if (statsData.success) {
        setStats(statsData);
      }
      if (logsData.success && Array.isArray(logsData.logs)) {
        setRecentLogs(logsData.logs.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      label: "Total Registered Users",
      value: stats.totalUsers.toLocaleString(),
      sub: `${stats.activeUsers.toLocaleString()} active accounts`,
      icon: Users,
      color: "text-[#0F2D5C]",
      path: "/admin/users",
    },
    {
      label: "Active User Accounts",
      value: stats.activeUsers.toLocaleString(),
      sub: `${stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : "100"}% active rate`,
      icon: Activity,
      color: "text-[#0F2D5C]",
      path: "/admin/users",
    },
    {
      label: "Total User Float Balances",
      value: `₦${stats.totalWalletBalance.toLocaleString()}`,
      sub: "User wallet liquidity in system database",
      icon: Wallet,
      color: "text-[#0F2D5C]",
      path: "/admin/wallet",
    },
    {
      label: "Today's Transaction Revenue",
      value: `₦${stats.todayRevenue.toLocaleString()}`,
      sub: `${stats.todayTransactionsCount} orders today`,
      icon: DollarSign,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Total Transactions Processed",
      value: stats.totalTransactions.toLocaleString(),
      sub: `${stats.successfulTransactions.toLocaleString()} successful`,
      icon: BarChart3,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Pending Transactions",
      value: stats.pendingTransactions.toLocaleString(),
      sub: "Awaiting gateway confirmation",
      icon: Clock,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Failed Transactions",
      value: stats.failedTransactions.toLocaleString(),
      sub: "Declined by gateway / network",
      icon: XCircle,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Identity Verification Checks",
      value: stats.verificationRequests.toLocaleString(),
      sub: "NIN, BVN, CAC, TIN inquiries",
      icon: CheckSquare,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Bill Payments Volume",
      value: `₦${stats.billPaymentVolume.toLocaleString()}`,
      sub: "Airtime, Data, Power, Cable",
      icon: Receipt,
      color: "text-[#0F2D5C]",
      path: "/admin/transactions",
    },
    {
      label: "Active API Providers",
      value: `${stats.activeProviders} Online`,
      sub: "Aspfiy, NIN, VTU gateways",
      icon: Server,
      color: "text-[#0F2D5C]",
      path: "/admin/providers",
    },
  ];

  const shortcutButtons = [
    { label: "User Directory", path: "/admin/users", icon: UserPlus, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
    { label: "Wallet Funding", path: "/admin/wallet", icon: Wallet, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
    { label: "Transactions", path: "/admin/transactions", icon: BarChart3, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
    { label: "Refunds Portal", path: "/admin/refunds", icon: RotateCcw, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
    { label: "Financial Reports", path: "/admin/reports", icon: FileText, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
    { label: "System Health", path: "/admin/system", icon: Settings, color: "bg-[#0F2D5C] hover:bg-[#0F2D5C]" },
  ];

  return (
    <div className="space-y-6 text-[#0F2D5C]">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#0F2D5C] rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2D5C] border border-[#0F2D5C] text-[#0F2D5C] font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>SmartLink Executive Administration Console</span>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-[#0F2D5C] tracking-tight">
              Welcome back, {session.fullName}!
            </h1>
            <p className="text-xs md:text-sm text-[#0F2D5C] mt-1 leading-relaxed">
              {roleDef.description} • Role: <strong className="text-[#0F2D5C]">{session.role}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#0F2D5C]">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0F2D5C] border border-[#0F2D5C]">
              <Clock className="h-3.5 w-3.5 text-[#0F2D5C]" />
              <span>Session: <strong className="text-[#0F2D5C] font-mono">Secure Token Active</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0F2D5C] border border-[#0F2D5C] text-[#0F2D5C]">
              <Activity className="h-3.5 w-3.5 text-[#0F2D5C]" />
              <span>Database Sync: <strong className="text-[#0F2D5C]">Live 100% Operational</strong></span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="p-3 rounded-xl border border-[#0F2D5C] bg-white text-[#0F2D5C] hover:bg-[#0F2D5C] transition-colors cursor-pointer text-xs flex items-center gap-2 font-bold"
          >
            <RefreshCw className={`h-4 w-4 text-[#0F2D5C] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </motion.div>

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-white border border-[#0F2D5C] rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F2D5C]">
            <Zap className="h-4 w-4 text-[#0F2D5C]" />
            <span>Administrator Fast Action Panel</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {shortcutButtons.map((btn) => {
            const IconComp = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                onClick={() => onNavigate(btn.path)}
                className={`p-3.5 rounded-xl ${btn.color} text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs`}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span className="truncate">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10 Key Performance Metric Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F2D5C] uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0F2D5C]" />
            <span>Core Performance & Transaction Metrics</span>
          </h2>
          <span className="text-xs text-[#0F2D5C]">Real-time Database Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {metricCards.map((card) => {
            const IconComp = card.icon;
            return (
              <div
                key={card.label}
                onClick={() => onNavigate(card.path)}
                className="bg-white border border-[#0F2D5C] rounded-2xl p-5 space-y-2 hover:border-[#0F2D5C] transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-[#0F2D5C] text-xs">
                  <span className="truncate max-w-[130px] font-medium">{card.label}</span>
                  <IconComp className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-transform`} />
                </div>
                <p className="text-xl font-extrabold text-[#0F2D5C] truncate">
                  {loading ? "..." : card.value}
                </p>
                <p className="text-[11px] text-[#0F2D5C] truncate">{card.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Grid: Announcements & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Announcements */}
        <div className="bg-white border border-[#0F2D5C] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0F2D5C] text-xs font-bold uppercase tracking-wider">
              <Megaphone className="h-4 w-4" />
              <span>Platform Service Bulletins</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0F2D5C] text-[#0F2D5C] border border-[#0F2D5C] text-[10px] font-bold">
              100% Uptime
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#0F2D5C]">Aspfiy Wallet & Payment Webhooks</p>
                <span className="px-2 py-0.5 rounded bg-[#0F2D5C] text-[#0F2D5C] border border-[#0F2D5C] text-[9px] font-bold">ACTIVE</span>
              </div>
              <p className="text-xs text-[#0F2D5C] leading-relaxed">
                Virtual dedicated accounts and automated bank transfer webhooks are connected and operational.
              </p>
            </div>

            <div className="p-4 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#0F2D5C]">NIN, BVN & CAC Verification Engine</p>
                <span className="px-2 py-0.5 rounded bg-[#0F2D5C] text-[#0F2D5C] border border-[#0F2D5C] text-[9px] font-bold">OPERATIONAL</span>
              </div>
              <p className="text-xs text-[#0F2D5C] leading-relaxed">
                Identity lookups, business search, and instant PDF slips generated with official security seals.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="bg-white border border-[#0F2D5C] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0F2D5C] text-xs font-bold uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              <span>Live Administrative Audit Stream</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("/admin/security")}
              className="text-[#0F2D5C] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              Full Logs <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#0F2D5C]">
                No recent admin activity recorded.
              </div>
            ) : (
              recentLogs.map((feed, idx) => (
                <div
                  key={feed.id ? `admin-feed-${feed.id}-${idx}` : `admin-feed-${idx}`}
                  className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-[#0F2D5C] shrink-0" />
                    <p className="text-[#0F2D5C] truncate font-medium">{feed.details || feed.action}</p>
                  </div>
                  <span className="text-[10px] text-[#0F2D5C] font-mono shrink-0 ml-2">
                    {new Date(feed.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
