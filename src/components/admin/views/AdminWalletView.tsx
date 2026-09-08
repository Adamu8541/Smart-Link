/**
 * SmartLink Admin Panel — Wallet Management System View (Module 4)
 * Comprehensive administrative interface for monitoring user wallet balances,
 * conducting audited credit/debit adjustments, enforcing security status controls
 * (Freeze/Unfreeze/Lock), generating statements, and tracking ledger movements.
 */

import React, { useState, useEffect } from "react";
import { useModalBackHandler } from "../../../services/navigationManager";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  Search,
  Filter,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  FileText,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Eye,
  PlayCircle,
  Plus,
  Minus
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { WalletDetailDrawer } from "../wallet/WalletDetailDrawer";
import {
  CreditWalletModal,
  DebitWalletModal,
  WalletStatusModal
} from "../wallet/WalletActionModals";
import { WalletStatementModal } from "../wallet/WalletStatementModal";

interface AdminWalletViewProps {
  session: AdminSession;
  onNavigate?: (routePath: string) => void;
}

export function AdminWalletView({ session, onNavigate }: AdminWalletViewProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data
  const [wallets, setWallets] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalSystemFloat: 0,
    totalSystemFunding: 0,
    totalSystemSpending: 0,
    frozenWalletsCount: 0,
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("ALL"); // ALL, POSITIVE, ZERO, HIGH
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, FROZEN, LOCKED
  const [activityFilter, setActivityFilter] = useState("ALL"); // ALL, RECENTLY_FUNDED, NO_TX

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Drawers State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useModalBackHandler(drawerOpen, "admin-wallet-drawer", () => setDrawerOpen(false));

  const [selectedUserForAction, setSelectedUserForAction] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"CREDIT" | "DEBIT" | "STATUS" | "STATEMENT" | null>(null);
  useModalBackHandler(!!activeModal, "admin-wallet-modal", () => setActiveModal(null));
  const [targetStatus, setTargetStatus] = useState<"ACTIVE" | "FROZEN" | "LOCKED">("FROZEN");

  // Test Suite View Toggle
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Auto-hide Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch Wallets Directory from API
  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        balanceFilter,
        statusFilter,
        activityFilter,
      });

      const res = await fetch(`/api/admin/wallets?${queryParams.toString()}`, {
        headers: {
          "x-admin-token": session.sessionToken,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load wallet directory.");
      }

      setWallets(data.wallets || []);
      setMetrics(data.metrics || {});
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page, pageSize, balanceFilter, statusFilter, activityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWallets();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setBalanceFilter("ALL");
    setStatusFilter("ALL");
    setActivityFilter("ALL");
    setPage(1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    fetchWallets();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-[#0F2D5C]/90 border border-[#0F2D5C] rounded-2xl text-[#9CA3AF] text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#9CA3AF] shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#9CA3AF] hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span>Financial Infrastructure</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            Wallet Management System
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]">
              Module 4
            </span>
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Audited ledger float monitoring, manual credit/debit adjustments, status controls, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowTestPanel(!showTestPanel)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
              showTestPanel
                ? "bg-[#0F2D5C] text-white"
                : "bg-[#111827] hover:bg-[#4B5563] text-[#9CA3AF] border border-[#0F2D5C]/60"
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            {showTestPanel ? "Hide Module 4 Self-Test Suite" : "Run Module 4 Self-Test Suite"}
          </button>

          <button
            type="button"
            onClick={fetchWallets}
            className="p-2.5 bg-[#111827] border border-[#111827] hover:bg-[#111827] text-[#E5E7EB] rounded-xl cursor-pointer transition-colors"
            title="Refresh Wallet Balances"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top System Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-[#111827] to-[#111827] border border-[#111827] rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">System Float Balance</span>
            <div className="p-2 bg-[#0F2D5C] border border-[#0F2D5C]/80 rounded-xl text-[#9CA3AF]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₦{(metrics?.totalSystemFloat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B7280]">Cumulative available float across all active wallets</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#111827] to-[#111827] border border-[#111827] rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Total Funding</span>
            <div className="p-2 bg-[#0F2D5C] border border-[#0F2D5C]/80 rounded-xl text-[#9CA3AF]">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#9CA3AF] font-mono">
            ₦{(metrics?.totalSystemFunding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B7280]">Total historical deposits and credits</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#111827] to-[#111827] border border-[#111827] rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Total Spending</span>
            <div className="p-2 bg-[#0F2D5C] border border-[#0F2D5C]/80 rounded-xl text-[#9CA3AF]">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#9CA3AF] font-mono">
            ₦{(metrics?.totalSystemSpending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B7280]">Total service purchases and payouts</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#111827] to-[#111827] border border-[#111827] rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Frozen / Locked Accounts</span>
            <div className="p-2 bg-[#0F2D5C] border border-[#0F2D5C]/80 rounded-xl text-[#9CA3AF]">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#9CA3AF] font-mono">
            {metrics?.frozenWalletsCount || 0}
          </div>
          <p className="text-[10px] text-[#6B7280]">Restricted accounts requiring admin review</p>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl space-y-4 shadow-xs dark:shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Email, Phone, Wallet ID, or User ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl text-xs text-[#111827] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-md w-full md:w-auto"
          >
            Search Directory
          </button>
        </form>

        <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#111827]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Balance State Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280] font-bold text-[11px]">Balance State:</span>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl px-3 py-1.5 text-[#111827] dark:text-[#E5E7EB] text-xs focus:outline-none font-medium"
              >
                <option value="ALL">All Balances</option>
                <option value="POSITIVE">Positive Balance (&gt; ₦0)</option>
                <option value="ZERO">Zero Balance (₦0)</option>
                <option value="HIGH">High Float (&gt; ₦100,000)</option>
              </select>
            </div>

            {/* Wallet Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280] font-bold text-[11px]">Wallet Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl px-3 py-1.5 text-[#111827] dark:text-[#E5E7EB] text-xs focus:outline-none font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Wallets</option>
                <option value="FROZEN">Frozen Wallets</option>
                <option value="LOCKED">Locked Wallets</option>
              </select>
            </div>

            {/* Transaction Activity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280] font-bold text-[11px]">Activity:</span>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl px-3 py-1.5 text-[#111827] dark:text-[#E5E7EB] text-xs focus:outline-none font-medium"
              >
                <option value="ALL">All Activity</option>
                <option value="RECENTLY_FUNDED">Recently Funded</option>
                <option value="NO_TX">No Transactions Yet</option>
              </select>
            </div>
          </div>

          {(searchTerm || balanceFilter !== "ALL" || statusFilter !== "ALL" || activityFilter !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] hover:underline font-bold cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Wallets Directory Table */}
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl overflow-hidden shadow-xs dark:shadow-xl">
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#111827] dark:text-white">Wallet Directory & Ledgers</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#E5E7EB] dark:bg-[#111827] text-[#111827] dark:text-[#E5E7EB] font-bold">
              {totalRecords} Wallets Found
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7280]">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#111827] border border-[#111827] rounded-lg px-2 py-1 text-[#E5E7EB] focus:outline-none font-mono"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#0F2D5C]/60 border-b border-[#0F2D5C] text-[#9CA3AF] text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#9CA3AF] animate-spin mx-auto" />
            <p className="text-xs text-[#9CA3AF]">Querying Wallet Ledger Database...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Wallet className="h-10 w-10 text-[#4B5563] mx-auto" />
            <h3 className="text-sm font-bold text-[#E5E7EB]">No Wallets Found</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              No wallet records matched your search query or filter constraints.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111827]/60 text-[#9CA3AF] uppercase tracking-wider text-[10px] font-bold border-b border-[#111827]">
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Wallet ID</th>
                  <th className="py-3 px-4 text-right">Wallet Balance</th>
                  <th className="py-3 px-4 text-right">Lifetime Funding</th>
                  <th className="py-3 px-4 text-right">Lifetime Spending</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {wallets.map((w) => (
                  <tr key={w.userId} className="hover:bg-[#111827]/40 transition-colors">
                    {/* User Account Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F2D5C] to-[#0F2D5C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {w.fullName?.substring(0, 2)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-[#E5E7EB]">{w.fullName}</div>
                          <div className="text-[11px] text-[#9CA3AF] font-mono">{w.email}</div>
                          <div className="text-[10px] text-[#6B7280] font-mono">{w.phoneNumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Wallet ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[#9CA3AF] font-bold text-[11px]">
                        {w.walletId}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-sm text-white">
                        ₦{(w.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#6B7280]">Avail: ₦{(w.availableBalance || 0).toLocaleString()}</span>
                    </td>

                    {/* Funding */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-[#9CA3AF]">
                        ₦{(w.totalFunding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Spending */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-[#9CA3AF]">
                        ₦{(w.totalSpending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        w.walletStatus === "ACTIVE"
                          ? "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                          : w.walletStatus === "FROZEN"
                          ? "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                          : "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                      }`}>
                        {w.walletStatus || "ACTIVE"}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Drawer */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserId(w.userId);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] rounded-lg cursor-pointer transition-colors"
                          title="View Deep Wallet Audit"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Credit */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForAction(w);
                            setActiveModal("CREDIT");
                          }}
                          className="p-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]/80 rounded-lg cursor-pointer transition-colors"
                          title="Credit Wallet Float"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        {/* Debit */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForAction(w);
                            setActiveModal("DEBIT");
                          }}
                          className="p-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]/80 rounded-lg cursor-pointer transition-colors"
                          title="Debit Wallet Float"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        {/* Freeze / Unfreeze */}
                        {w.walletStatus === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForAction(w);
                              setTargetStatus("FROZEN");
                              setActiveModal("STATUS");
                            }}
                            className="p-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]/80 rounded-lg cursor-pointer transition-colors"
                            title="Freeze Wallet Account"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForAction(w);
                              setTargetStatus("ACTIVE");
                              setActiveModal("STATUS");
                            }}
                            className="p-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]/80 rounded-lg cursor-pointer transition-colors"
                            title="Unfreeze Wallet Account"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}

                        {/* Statement */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForAction(w);
                            setActiveModal("STATEMENT");
                          }}
                          className="p-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] rounded-lg cursor-pointer transition-colors"
                          title="Generate Financial Statement"
                        >
                          <FileText className="h-4 w-4 text-[#9CA3AF]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-[#111827] border-t border-[#111827] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div>
            Page <strong className="text-white font-mono">{page}</strong> of <strong className="text-white font-mono">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 bg-[#111827] border border-[#111827] hover:bg-[#111827] disabled:opacity-40 text-[#E5E7EB] rounded-lg cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 bg-[#111827] border border-[#111827] hover:bg-[#111827] disabled:opacity-40 text-[#E5E7EB] rounded-lg cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Wallet Audit Drawer */}
      {drawerOpen && selectedUserId && (
        <WalletDetailDrawer
          userId={selectedUserId}
          session={session}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedUserId(null);
          }}
          onCredit={() => {
            const u = wallets.find((w) => w.userId === selectedUserId);
            if (u) {
              setSelectedUserForAction(u);
              setActiveModal("CREDIT");
            }
          }}
          onDebit={() => {
            const u = wallets.find((w) => w.userId === selectedUserId);
            if (u) {
              setSelectedUserForAction(u);
              setActiveModal("DEBIT");
            }
          }}
          onStatusChange={(status) => {
            const u = wallets.find((w) => w.userId === selectedUserId);
            if (u) {
              setSelectedUserForAction(u);
              setTargetStatus(status);
              setActiveModal("STATUS");
            }
          }}
          onGenerateStatement={() => {
            const u = wallets.find((w) => w.userId === selectedUserId);
            if (u) {
              setSelectedUserForAction(u);
              setActiveModal("STATEMENT");
            }
          }}
        />
      )}

      {/* Credit Modal */}
      {activeModal === "CREDIT" && selectedUserForAction && (
        <CreditWalletModal
          user={selectedUserForAction}
          session={session}
          onClose={() => {
            setActiveModal(null);
            setSelectedUserForAction(null);
          }}
          onSuccess={showToast}
        />
      )}

      {/* Debit Modal */}
      {activeModal === "DEBIT" && selectedUserForAction && (
        <DebitWalletModal
          user={selectedUserForAction}
          session={session}
          onClose={() => {
            setActiveModal(null);
            setSelectedUserForAction(null);
          }}
          onSuccess={showToast}
        />
      )}

      {/* Status Modal */}
      {activeModal === "STATUS" && selectedUserForAction && (
        <WalletStatusModal
          user={selectedUserForAction}
          targetStatus={targetStatus}
          session={session}
          onClose={() => {
            setActiveModal(null);
            setSelectedUserForAction(null);
          }}
          onSuccess={showToast}
        />
      )}

      {/* Statement Modal */}
      {activeModal === "STATEMENT" && selectedUserForAction && (
        <WalletStatementModal
          user={selectedUserForAction}
          session={session}
          onClose={() => {
            setActiveModal(null);
            setSelectedUserForAction(null);
          }}
        />
      )}
    </div>
  );
}
