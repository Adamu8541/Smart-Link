import React, { useState, useEffect } from "react";
import { useModalBackHandler } from "../../../services/navigationManager";
import {
  BarChart3,
  Search,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Calendar,
  X,
  Printer,
  Share2,
  Terminal,
  Zap,
  Info
} from "lucide-react";
import { AdminSession, getStoredAdminSession } from "../../../services/adminAuthTypes";
import { TransactionDetailDrawer } from "./TransactionDetailDrawer";
import { TransactionReceiptModal } from "./TransactionReceiptModal";

interface AdminTransactionsViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

export function AdminTransactionsView({ session, onNavigate }: AdminTransactionsViewProps) {
  // Main Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    pageNum: 1,
    limitNum: 10,
    totalPages: 1
  });
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    successfulCount: 0,
    failedCount: 0,
    pendingCount: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    totalVolume: 0
  });

  // Filter & Search States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  useModalBackHandler(showFilterDrawer, "admin-tx-filter-drawer", () => setShowFilterDrawer(false));

  // Drawer & Modal States
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  useModalBackHandler(detailDrawerOpen, "admin-tx-detail-drawer", () => setDetailDrawerOpen(false));
  const [receiptTx, setReceiptTx] = useState<any | null>(null);
  const [receiptUser, setReceiptUser] = useState<any | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  useModalBackHandler(receiptModalOpen, "admin-tx-receipt-modal", () => setReceiptModalOpen(false));
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch Transactions Data
  useEffect(() => {
    fetchTransactions(1);
  }, [statusFilter, serviceFilter, providerFilter, paymentMethodFilter, sortBy, sortOrder]);

  const fetchTransactions = async (page = pagination.pageNum, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limitNum.toString(),
        search,
        status: statusFilter,
        serviceType: serviceFilter,
        provider: providerFilter,
        paymentMethod: paymentMethodFilter,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy,
        sortOrder
      });

      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`, {
        headers: { "x-admin-token": token }
      });
      const json = await res.json();

      if (json.success) {
        setTransactions(json.transactions || []);
        setPagination(json.pagination || { totalRecords: 0, pageNum: 1, limitNum: 10, totalPages: 1 });
        if (json.metrics) setMetrics(json.metrics);
      } else {
        setError(json.message || "Failed to load transaction data.");
      }
    } catch (err: any) {
      setError("Network or server error while querying transaction ledger.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setServiceFilter("ALL");
    setProviderFilter("ALL");
    setPaymentMethodFilter("ALL");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setSortBy("timestamp");
    setSortOrder("desc");
    fetchTransactions(1);
  };

  const handleExport = async (scope = "FILTERED_RESULTS", format = "CSV") => {
    setExporting(true);
    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const res = await fetch("/api/admin/transactions/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({
          filters: {
            search,
            status: statusFilter,
            serviceType: serviceFilter,
            provider: providerFilter
          },
          scope,
          format
        })
      });
      const json = await res.json();
      if (json.success && json.fileContent) {
        const element = document.createElement("a");
        const file = new Blob([json.fileContent], { type: "text/csv;charset=utf-8;" });
        element.href = URL.createObjectURL(file);
        element.download = json.filename || `smartlink_transactions_export_${Date.now()}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        alert(json.message || "Failed to export transaction records.");
      }
    } catch (err) {
      alert("Error generating export payload.");
    } finally {
      setExporting(false);
    }
  };

  const handleOpenReceipt = (tx: any, user: any) => {
    setReceiptTx(tx);
    setReceiptUser(user);
    setReceiptModalOpen(true);
  };

  const handleOpenDetail = (txId: string) => {
    setSelectedTxId(txId);
    setDetailDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        return " bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
      case "CANCELLED":
        return " bg-rose-50 text-rose-700 border-rose-200";
      case "REFUNDED":
      case "REVERSED":
        return " bg-blue-50 text-blue-700 border-blue-200";
      default:
        return " bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 pb-12 text-[#111827]">
      {/* View Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2D5C] rounded-2xl text-white shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Financial Governance</span>
                <span className="px-2 py-0.5 bg-[#0F2D5C]/10 text-[#0F2D5C] border border-[#0F2D5C]/20 rounded-full text-[10px] font-mono font-bold">MODULE 5 ACTIVE</span>
              </div>
              <h1 className="text-xl font-bold text-[#111827]">Transaction Management System</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">Centralized audit, search, investigation, receipts and multi-format exports.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowTestPanel(!showTestPanel)}
              className="py-2.5 px-4 bg-[#F5F7FA] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Terminal className="h-4 w-4 text-[#0F2D5C]" />
              <span>{showTestPanel ? "Hide Self-Test Suite" : "Run Module 5 Self-Tests"}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchTransactions(pagination.pageNum, true)}
              disabled={refreshing}
              className="py-2.5 px-3 bg-[#F5F7FA] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#0F2D5C]" : "text-[#6B7280]"}`} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>
        </div>

        {/* Top Summary Widgets / Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total Transactions</span>
            <p className="text-lg font-black text-[#111827] font-mono">{metrics.totalTransactions.toLocaleString()}</p>
            <span className="text-[10px] text-[#6B7280] font-mono">Vol: ₦{(metrics.totalVolume / 1000).toFixed(1)}k</span>
          </div>

          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Successful</span>
            <p className="text-lg font-black text-emerald-600 font-mono">{metrics.successfulCount.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-600 font-mono">100% Settled</span>
          </div>

          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Pending</span>
            <p className="text-lg font-black text-amber-600 font-mono">{metrics.pendingCount.toLocaleString()}</p>
            <span className="text-[10px] text-amber-600 font-mono">Processing Portal</span>
          </div>

          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Failed</span>
            <p className="text-lg font-black text-rose-600 font-mono">{metrics.failedCount.toLocaleString()}</p>
            <span className="text-[10px] text-rose-600 font-mono">Safe Retry Eligible</span>
          </div>

          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Revenue Today</span>
            <p className="text-lg font-black text-[#0F2D5C] font-mono">₦{metrics.revenueToday.toLocaleString()}</p>
            <span className="text-[10px] text-[#0F2D5C] font-mono">24h Volume</span>
          </div>

          <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Revenue Month</span>
            <p className="text-lg font-black text-[#0F2D5C] font-mono">₦{(metrics.revenueThisMonth / 1000).toFixed(1)}k</p>
            <span className="text-[10px] text-[#0F2D5C] font-mono">MTD Ledger</span>
          </div>
        </div>
      </div>

      {/* Main Table & Controls Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs text-left">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SmartLink Ref, Provider Ref, User, Email, Phone, TxID..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F2D5C] focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`py-2.5 px-4 border text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                showFilterDrawer
                  ? "bg-[#0F2D5C] border-[#0F2D5C] text-white"
                  : "bg-[#F5F7FA] border-[#E5E7EB] text-[#111827] hover:bg-[#E5E7EB]"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>

            {/* Export Menu */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => handleExport("FILTERED_RESULTS", "CSV")}
                disabled={exporting}
                className="py-2.5 px-4 bg-[#F5F7FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#111827] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-[#0F2D5C]" />}
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] shrink-0">Quick Views:</span>
          <button
            type="button"
            onClick={() => { setStatusFilter("ALL"); setServiceFilter("ALL"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${statusFilter === "ALL" && serviceFilter === "ALL" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            All Ledger
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter("SUCCESSFUL"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${statusFilter === "SUCCESSFUL" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            Successful
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter("FAILED"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${statusFilter === "FAILED" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            Failed / Errors
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter("PENDING"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${statusFilter === "PENDING" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => { setServiceFilter("WALLET_FUNDING"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${serviceFilter === "WALLET_FUNDING" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            Wallet Funding
          </button>
          <button
            type="button"
            onClick={() => { setServiceFilter("NIN_VERIFICATION"); fetchTransactions(1); }}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${serviceFilter === "NIN_VERIFICATION" ? "bg-[#0F2D5C] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"}`}
          >
            Verifications
          </button>
        </div>

        {/* Expanded Multi-Filter Drawer Panel */}
        {showFilterDrawer && (
          <div className="p-5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <span className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#0F2D5C]" /> Advanced Filter Combinator
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#0F2D5C] hover:underline font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="REVERSED">Reversed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Service Type</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                >
                  <option value="ALL">All Services</option>
                  <option value="AIRTIME">Airtime VTU</option>
                  <option value="DATA">Data Bundles</option>
                  <option value="ELECTRICITY">Electricity Bills</option>
                  <option value="CABLE_TV">Cable TV Subscription</option>
                  <option value="NIN_VERIFICATION">NIN Verification</option>
                  <option value="BVN_VERIFICATION">BVN Verification</option>
                  <option value="WALLET_FUNDING">Wallet Funding</option>
                  <option value="ADMIN_CREDIT">Admin Credit</option>
                  <option value="ADMIN_DEBIT">Admin Debit</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Provider Portal</label>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                >
                  <option value="ALL">All Providers</option>
                  <option value="Aspfiy">Aspfiy</option>
                  <option value="NIMC">NIN API</option>
                  <option value="Prembly">Prembly</option>
                  <option value="VTU Direct">VTU Direct Portal</option>
                  <option value="Admin Ledger">Admin Ledger</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Payment Method</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="WALLET">Wallet Balance</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Debit Card</option>
                  <option value="USSD">USSD</option>
                  <option value="ADMIN_CREDIT">Admin Ledger Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Min Amount (₦)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Max Amount (₦)</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#111827]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => fetchTransactions(1)}
                className="py-2 px-5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                <tr>
                  <th className="p-4">SmartLink Ref</th>
                  <th className="p-4">Provider Ref</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Charges</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-[#6B7280]">
                      <RefreshCw className="h-6 w-6 text-[#0F2D5C] animate-spin mx-auto mb-2" />
                      Loading transactions data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-rose-600 font-sans">
                      {error}
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-[#6B7280] font-sans">
                      No matching transaction records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-4 font-bold text-[#111827]">{tx.smartLinkRef}</td>
                      <td className="p-4 text-[#6B7280] font-mono">{tx.providerRef || "N/A"}</td>
                      <td className="p-4 font-sans">
                        <p className="font-bold text-[#111827] truncate max-w-[140px]">{tx.userName}</p>
                        <p className="text-[10px] text-[#6B7280] font-mono truncate max-w-[140px]">{tx.userEmail}</p>
                      </td>
                      <td className="p-4 font-sans">
                        <span className="px-2 py-0.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded text-[11px] text-[#111827] font-medium">
                          {tx.serviceName || tx.serviceType}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-[#6B7280]">{tx.provider}</td>
                      <td className="p-4 text-right font-bold text-[#111827]">
                        ₦{(tx.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-[#6B7280]">
                        ₦{(tx.charges || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-sans">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 font-sans uppercase text-[11px] text-[#6B7280]">{tx.paymentMethod}</td>
                      <td className="p-4 text-[#6B7280] text-[11px]">
                        <div>{tx.date}</div>
                        <div className="text-[10px] text-[#9CA3AF]">{tx.time}</div>
                      </td>
                      <td className="p-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Investigate Transaction"
                            onClick={() => handleOpenDetail(tx.id)}
                            className="p-1.5 rounded-lg text-[#0F2D5C] hover:bg-[#F5F7FA] border border-[#E5E7EB] transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="View Receipt"
                            onClick={() => handleOpenReceipt(tx, { fullName: tx.userName, email: tx.userEmail, phoneNumber: tx.userPhone })}
                            className="p-1.5 rounded-lg text-[#0F2D5C] hover:bg-[#F5F7FA] border border-[#E5E7EB] transition-colors cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] font-sans">
            <div>
              Showing <span className="font-bold text-[#111827]">{transactions.length > 0 ? (pagination.pageNum - 1) * pagination.limitNum + 1 : 0}</span> to{" "}
              <span className="font-bold text-[#111827]">{Math.min(pagination.pageNum * pagination.limitNum, pagination.totalRecords)}</span> of{" "}
              <span className="font-bold text-[#111827]">{pagination.totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchTransactions(pagination.pageNum - 1)}
                disabled={pagination.pageNum <= 1 || loading}
                className="py-1.5 px-3 bg-white hover:bg-[#F5F7FA] text-[#111827] border border-[#E5E7EB] disabled:opacity-40 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="px-3 py-1 font-mono font-bold text-[#111827] bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
                {pagination.pageNum} / {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => fetchTransactions(pagination.pageNum + 1)}
                disabled={pagination.pageNum >= pagination.totalPages || loading}
                className="py-1.5 px-3 bg-white hover:bg-[#F5F7FA] text-[#111827] border border-[#E5E7EB] disabled:opacity-40 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Transaction Detail Investigation Drawer */}
      <TransactionDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        transactionId={selectedTxId}
        session={session}
        onOpenReceipt={handleOpenReceipt}
        onNavigateToRefunds={(txId) => onNavigate(`/admin/refunds?txId=${txId}`)}
        onRefreshList={() => fetchTransactions(pagination.pageNum)}
      />

      {/* Printable Receipt Modal */}
      <TransactionReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={receiptTx}
        user={receiptUser}
      />
    </div>
  );
}
