import React, { useState, useEffect } from "react";
import {
  History,
  Activity,
  Wallet,
  ShieldCheck,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Lock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Laptop,
  Globe,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  LogIn,
  Smartphone,
  Layers,
  CheckCircle2,
  XCircle,
  CreditCard,
  X,
  Eye
} from "lucide-react";
import { NotificationEngine } from "../../services/notificationEngine";
import { formatNaira, formatSafeDateTime } from "../../utils/formatUtils";
import { ActivityLogDocument, AdminActivityLogDocument } from "../../types/database";

interface UserActivityHistoryViewProps {
  userId?: string;
  isAdmin?: boolean;
  adminUid?: string;
  isDarkMode?: boolean;
}

/**
 * Sanitizes service descriptions and labels to ensure third-party vendor names
 * (e.g. clubkonnect, bigisub, aspfiy, etc.) are never exposed to end-users.
 */
export function sanitizeUserDescription(text: string | null | undefined): string {
  if (!text) return "Service Transaction";

  let str = String(text);

  // 1. Remove third-party vendor names & replace with clean platform terminology
  str = str.replace(/clubkonnect(_vtu)?/gi, "SmartLink Network");
  str = str.replace(/bigisub(_vtu)?/gi, "SmartLink Network");
  str = str.replace(/aspfiy/gi, "SmartLink System");
  str = str.replace(/monnify/gi, "SmartLink Gateway");
  str = str.replace(/paystack/gi, "SmartLink Pay");
  str = str.replace(/flutterwave/gi, "SmartLink Pay");
  str = str.replace(/vpay/gi, "SmartLink Account");
  str = str.replace(/subandgain/gi, "SmartLink Telecom");
  str = str.replace(/vtpass/gi, "SmartLink Bills");
  str = str.replace(/shago/gi, "SmartLink Utility");

  const lower = str.toLowerCase();

  // 2. Format to clean standardized service labels (Airtime, Data, NIN, BVN, CAC, TIN)
  if (lower.includes("nin") || lower.includes("national identity") || lower.includes("nimc")) {
    return "NIN Verification";
  }
  if (lower.includes("bvn") || lower.includes("bank verification")) {
    return "BVN Verification";
  }
  if (lower.includes("cac") || lower.includes("corporate affairs")) {
    return "CAC Business Registration";
  }
  if (lower.includes("tin") || lower.includes("tax id") || lower.includes("nrs") || lower.includes("firs")) {
    return "TIN Tax Search";
  }
  if (lower.includes("airtime")) {
    if (lower.includes("mtn")) return "MTN Airtime";
    if (lower.includes("airtel")) return "Airtel Airtime";
    if (lower.includes("glo")) return "Glo Airtime";
    if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile Airtime";
    return "Airtime Topup";
  }
  if (lower.includes("data") || lower.includes("gig") || lower.includes("mb") || lower.includes("bundle")) {
    if (lower.includes("mtn")) return "MTN Data Bundle";
    if (lower.includes("airtel")) return "Airtel Data Bundle";
    if (lower.includes("glo")) return "Glo Data Bundle";
    if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile Data Bundle";
    return "Data Subscription";
  }
  if (lower.includes("electricity") || lower.includes("meter") || lower.includes("disco")) {
    return "Electricity Token Recharge";
  }
  if (lower.includes("cable") || lower.includes("dstv") || lower.includes("gotv") || lower.includes("startimes")) {
    return "Cable TV Subscription";
  }
  if (lower.includes("login") || lower.includes("sign in")) {
    return lower.includes("failed") ? "Failed Login Attempt" : "Account Login Successful";
  }

  // Strip remaining provider hints
  str = str.replace(/via\s+[a-z0-9_-]+/gi, "");
  str = str.replace(/provider:\s*[a-z0-9_-]+/gi, "");
  return str.trim() || "Service Transaction";
}

export const UserActivityHistoryView: React.FC<UserActivityHistoryViewProps> = ({
  userId,
  isAdmin = false,
  adminUid,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<"CONSOLIDATED_HISTORY" | "ADMIN_AUDIT">(
    "CONSOLIDATED_HISTORY"
  );

  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "TRANSACTIONS" | "WALLET" | "VERIFICATIONS" | "SERVICES" | "LOGINS"
  >("ALL");

  const [loading, setLoading] = useState<boolean>(true);
  const [adminLogs, setAdminLogs] = useState<AdminActivityLogDocument[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<{
    walletLogs: any[];
    verifications: any[];
    transactions: any[];
    vtuServices?: any[];
    notifications: any[];
    logins: any[];
    activityLogs: any[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAllModal, setShowAllModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    setLoading(true);
    if (activeTab === "ADMIN_AUDIT" && adminUid) {
      const res = await NotificationEngine.getAdminActivityLogs(adminUid, page, pageSize);
      setAdminLogs(res.logs);
    } else if (userId) {
      const res = await NotificationEngine.getUserHistory(userId);
      setConsolidatedData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [userId, activeTab, adminUid]);

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    if (activeTab === "ADMIN_AUDIT") {
      dataToExport = adminLogs;
    } else if (consolidatedData) {
      if (selectedCategory === "TRANSACTIONS") dataToExport = consolidatedData.transactions || [];
      else if (selectedCategory === "WALLET") dataToExport = consolidatedData.walletLogs || [];
      else if (selectedCategory === "VERIFICATIONS") dataToExport = consolidatedData.verifications || [];
      else if (selectedCategory === "SERVICES") dataToExport = consolidatedData.vtuServices || [];
      else if (selectedCategory === "LOGINS") dataToExport = consolidatedData.logins || [];
      else {
        dataToExport = [
          ...(consolidatedData.transactions || []),
          ...(consolidatedData.walletLogs || []),
          ...(consolidatedData.verifications || []),
          ...(consolidatedData.vtuServices || []),
          ...(consolidatedData.logins || []),
          ...(consolidatedData.activityLogs || [])
        ];
      }
    }

    const sanitizedData = dataToExport.map((item) => ({
      ...item,
      description: sanitizeUserDescription(item.description || item.details || item.serviceName || item.service_name),
      serviceName: sanitizeUserDescription(item.serviceName || item.service_name || item.description)
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(sanitizedData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `smartlink_history_${selectedCategory.toLowerCase()}_export.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculations for real figures/totals
  const transactionsList = consolidatedData?.transactions || [];
  const walletLogsList = consolidatedData?.walletLogs || [];
  const verificationsList = consolidatedData?.verifications || [];
  const vtuServicesList = consolidatedData?.vtuServices || [];
  const loginsList = consolidatedData?.logins || [];
  const activityLogsList = consolidatedData?.activityLogs || [];

  const transactionsTotalVolume = transactionsList.reduce(
    (sum, t) => sum + Number(t.amount || t.fee || 0),
    0
  );
  const totalRecordsCount =
    transactionsList.length +
    walletLogsList.length +
    verificationsList.length +
    vtuServicesList.length +
    loginsList.length;

  // Filter records based on selected Category and Search query
  const getDisplayRecords = () => {
    let rawList: any[] = [];
    if (selectedCategory === "TRANSACTIONS") rawList = transactionsList;
    else if (selectedCategory === "WALLET") rawList = walletLogsList;
    else if (selectedCategory === "VERIFICATIONS") rawList = verificationsList;
    else if (selectedCategory === "SERVICES") rawList = vtuServicesList;
    else if (selectedCategory === "LOGINS") rawList = loginsList;
    else rawList = activityLogsList.length > 0 ? activityLogsList : [...transactionsList, ...loginsList, ...verificationsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rawList = rawList.filter((item) => {
        const textStr = JSON.stringify(item).toLowerCase();
        return textStr.includes(q);
      });
    }

    return rawList;
  };

  const currentRecords = getDisplayRecords();
  const recentThreeRecords = currentRecords.slice(0, 3);
  const totalPages = Math.ceil(currentRecords.length / pageSize) || 1;
  const paginatedRecords = currentRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 text-left">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#111827] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-[#0F2D5C]" />
              Activity History / Events
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Click any category card below to view recent activity records, transaction volume, and login sessions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Records
            </button>
            <button
              onClick={() => fetchLogs()}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
              Refresh
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab(activeTab === "ADMIN_AUDIT" ? "CONSOLIDATED_HISTORY" : "ADMIN_AUDIT");
                }}
                className="px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {activeTab === "ADMIN_AUDIT" ? "Back to History" : "Admin Audit"}
              </button>
            )}
          </div>
        </div>

        {/* CONSOLIDATED CATEGORY SUMMARY CARDS WITH REAL FIGURES & TOTALS */}
        {activeTab === "CONSOLIDATED_HISTORY" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {/* 1. All Records */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("ALL");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "ALL" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  All Activity
                </span>
                <Layers className={`w-4 h-4 ${selectedCategory === "ALL" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-xl font-black mt-1 ${selectedCategory === "ALL" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {totalRecordsCount}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "ALL" ? "text-blue-100" : "text-slate-500"}`}>
                Total Records
              </div>
            </button>

            {/* 2. Financial Transactions */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("TRANSACTIONS");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "TRANSACTIONS"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "TRANSACTIONS" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  Financial Txs
                </span>
                <CreditCard className={`w-4 h-4 ${selectedCategory === "TRANSACTIONS" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-lg font-black mt-1 truncate ${selectedCategory === "TRANSACTIONS" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {formatNaira(transactionsTotalVolume)}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "TRANSACTIONS" ? "text-blue-100" : "text-slate-500"}`}>
                {transactionsList.length} Transactions
              </div>
            </button>

            {/* 3. Log In History */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("LOGINS");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "LOGINS"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "LOGINS" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  Log In History
                </span>
                <LogIn className={`w-4 h-4 ${selectedCategory === "LOGINS" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-xl font-black mt-1 ${selectedCategory === "LOGINS" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {loginsList.length}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "LOGINS" ? "text-blue-100" : "text-slate-500"}`}>
                Auth Sessions
              </div>
            </button>

            {/* 4. Wallet Operations */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("WALLET");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "WALLET"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "WALLET" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  Wallet Ops
                </span>
                <Wallet className={`w-4 h-4 ${selectedCategory === "WALLET" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-xl font-black mt-1 ${selectedCategory === "WALLET" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {walletLogsList.length}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "WALLET" ? "text-blue-100" : "text-slate-500"}`}>
                Funding & Debits
              </div>
            </button>

            {/* 5. Identity Verifications */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("VERIFICATIONS");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "VERIFICATIONS"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "VERIFICATIONS" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  Verifications
                </span>
                <ShieldCheck className={`w-4 h-4 ${selectedCategory === "VERIFICATIONS" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-xl font-black mt-1 ${selectedCategory === "VERIFICATIONS" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {verificationsList.length}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "VERIFICATIONS" ? "text-blue-100" : "text-slate-500"}`}>
                NIN / BVN / CAC
              </div>
            </button>

            {/* 6. VTU & Services */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("SERVICES");
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedCategory === "SERVICES"
                  ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/30"
                  : "bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === "SERVICES" ? "text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                  VTU Services
                </span>
                <Smartphone className={`w-4 h-4 ${selectedCategory === "SERVICES" ? "text-white" : "text-[#0F2D5C]"}`} />
              </div>
              <div className={`text-xl font-black mt-1 ${selectedCategory === "SERVICES" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {vtuServicesList.length}
              </div>
              <div className={`text-[10px] mt-0.5 ${selectedCategory === "SERVICES" ? "text-blue-100" : "text-slate-500"}`}>
                Airtime &amp; Data
              </div>
            </button>
          </div>
        )}

        {/* Search & Category Filter Ribbon */}
        {activeTab === "CONSOLIDATED_HISTORY" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search reference, description or action..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs text-[#111827] dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 hidden lg:inline">Active View:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({totalRecordsCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("TRANSACTIONS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "TRANSACTIONS"
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Financial Txs ({transactionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("LOGINS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "LOGINS"
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Log Ins ({loginsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("WALLET")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "WALLET"
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Wallet ({walletLogsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("VERIFICATIONS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "VERIFICATIONS"
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Verifications ({verificationsList.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED CONSOLIDATED RECORD TABLES & LISTS (SHOWS 3 RECENT WITH 'CLICK TO SEE MORE') */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#111827] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[#9CA3AF] space-y-2">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#0F2D5C]" />
            <p className="text-xs font-semibold">Loading consolidated records from Turso...</p>
          </div>
        ) : activeTab === "ADMIN_AUDIT" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Action Performed</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {adminLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                      No administrative audit entries found.
                    </td>
                  </tr>
                ) : (
                  adminLogs.slice(0, 3).map((log, idx) => (
                    <tr key={log.logId ? `adm-${log.logId}-${idx}` : `adm-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-[#0F2D5C]">{log.adminEmail}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{log.action}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{sanitizeUserDescription(log.details)}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{log.targetUserId || "System Wide"}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatSafeDateTime(log.timestamp, "Recently")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : currentRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto opacity-40 text-[#0F2D5C]" />
            <p className="text-xs font-semibold text-slate-600">No records found for selected category "{selectedCategory}".</p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-[#0F2D5C] font-bold underline cursor-pointer"
            >
              View all consolidated activity
            </button>
          </div>
        ) : selectedCategory === "TRANSACTIONS" ? (
          /* FINANCIAL TRANSACTIONS TABLE (3 RECENT) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Service / Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentThreeRecords.map((t: any, idx: number) => (
                  <tr key={t.reference ? `tx-${t.reference}-${idx}` : `tx-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-[#0F2D5C]">{t.reference || t.id || "REF_N/A"}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {sanitizeUserDescription(t.service_name || t.serviceName || t.description)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#0F2D5C]">
                      {formatNaira(t.amount || t.fee || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "SUCCESS" || t.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {t.status || "SUCCESS"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatSafeDateTime(t.created_at || t.createdAt, "Recently")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedCategory === "WALLET" ? (
          /* WALLET MOVEMENT LIST (3 RECENT) */
          <div className="p-4 space-y-2.5">
            {recentThreeRecords.map((w: any, idx: number) => (
              <div key={w.id ? `w-${w.id}-${idx}` : `w-${idx}`} className="p-3.5 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-xl border border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${w.changeType === "CREDIT" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#0F2D5C]"}`}>
                    {w.changeType === "CREDIT" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {w.changeType || "WALLET"} {formatNaira(w.amount)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Ref: {w.reference || w.id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    {formatNaira(w.previousBalance)} ➔ {formatNaira(w.newBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatSafeDateTime(w.createdAt, "Recently")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory === "VERIFICATIONS" ? (
          /* IDENTITY VERIFICATIONS TABLE (3 RECENT) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Verification Type</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentThreeRecords.map((v: any, idx: number) => (
                  <tr key={v.id ? `v-${v.id}-${idx}` : `v-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0F2D5C] font-mono text-[11px]">
                        {v.verificationType || v.verification_type || "IDENTITY"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {sanitizeUserDescription(v.verificationType || v.verification_type || v.target_id)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {v.reference || v.id || "VERIFIED_REF"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.status || "VERIFIED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatSafeDateTime(v.verifiedAt || v.createdAt || v.created_at, "Recently")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedCategory === "SERVICES" ? (
          /* VTU & TELECOM SERVICES TABLE (3 RECENT) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Recipient / Phone</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reference &amp; Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentThreeRecords.map((s: any, idx: number) => (
                  <tr key={s.id ? `srv-${s.id}-${idx}` : `srv-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {sanitizeUserDescription(s.service_name || s.serviceName || s.description)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {s.recipient || s.phone || s.account_number || "Direct Recharge"}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#0F2D5C]">
                      {formatNaira(s.amount || s.fee || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status || "SUCCESS"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <div className="font-mono text-[10px] text-slate-400">{s.reference || s.id}</div>
                      <div>{formatSafeDateTime(s.created_at || s.createdAt, "Recently")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedCategory === "LOGINS" ? (
          /* LOG IN & AUTH SESSIONS TABLE (3 RECENT) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Device &amp; IP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentThreeRecords.map((l: any, idx: number) => (
                  <tr key={l.id ? `l-${l.id}-${idx}` : `l-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-[#0F2D5C]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0F2D5C] font-mono text-[11px]">
                        {l.action || l.activityType || "USER_LOGIN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs font-semibold">
                      {sanitizeUserDescription(l.details || l.description)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">{l.ip_address || l.ipAddress || "127.0.0.1"}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === "FAILED" || l.status === "FAILURE"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {l.status || "SUCCESS"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatSafeDateTime(l.created_at || l.createdAt || l.timestamp, "Recently")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CONSOLIDATED ALL ACTIVITIES TABLE (3 RECENT) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Reference / ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentThreeRecords.map((item: any, idx: number) => {
                  const actionName = item.action || item.activityType || item.verificationType || item.service_name || "ACTIVITY";
                  const ref = item.reference || item.resource_id || item.id || item.log_id || "REF";
                  const rawDesc = item.details || item.description || item.serviceName || item.service_name || `${actionName} operation`;
                  const desc = sanitizeUserDescription(rawDesc);
                  const status = item.status || "SUCCESS";

                  return (
                    <tr key={item.id ? `all-${item.id}-${idx}` : `all-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0F2D5C] font-mono text-[10.5px] font-bold">
                          {item.resource_type || item.verificationType || (item.changeType ? "WALLET" : "AUTH")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">
                        {desc}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {ref}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status === "FAILED" || status === "FAILURE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatSafeDateTime(item.created_at || item.createdAt || item.timestamp, "Recently")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Click To See More Button */}
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/40 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs text-[#6B7280]">
          <div>
            Showing recent <span className="font-bold text-[#111827] dark:text-[#E5E7EB]">{recentThreeRecords.length}</span> of <span className="font-bold text-[#111827] dark:text-[#E5E7EB]">{currentRecords.length}</span> records
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Click to see more ({currentRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL ACTIVITY HISTORY MODAL (SHOWS ALL RECORDS UPON CLICK) */}
      {showAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-scaleIn text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                    All Activity Records — {selectedCategory.toLowerCase()}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing all {currentRecords.length} recorded items in this category
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Table with Pagination */}
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Type / Ref</th>
                      <th className="py-3 px-4">Service Description</th>
                      <th className="py-3 px-4">Amount / Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {paginatedRecords.map((item: any, idx: number) => {
                      const actionName = item.action || item.activityType || item.verificationType || item.service_name || "ACTIVITY";
                      const ref = item.reference || item.resource_id || item.id || item.log_id || "REF";
                      const rawDesc = item.details || item.description || item.serviceName || item.service_name || `${actionName} operation`;
                      const desc = sanitizeUserDescription(rawDesc);
                      const status = item.status || "SUCCESS";
                      const amt = item.amount || item.fee || 0;

                      return (
                        <tr key={item.id ? `modal-${item.id}-${idx}` : `modal-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#0F2D5C]">
                            {ref}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">
                            {desc}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-[#0F2D5C]">
                            {amt > 0 ? formatNaira(amt) : (item.ip_address || item.ipAddress || "Standard Session")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === "FAILED" || status === "FAILURE"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {formatSafeDateTime(item.created_at || item.createdAt || item.timestamp, "Recently")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Pagination */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({currentRecords.length} total records)
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityHistoryView;
