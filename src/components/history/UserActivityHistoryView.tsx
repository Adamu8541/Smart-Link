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
  ArrowDownLeft
} from "lucide-react";
import { NotificationEngine } from "../../services/notificationEngine";
import { ActivityLogDocument, AdminActivityLogDocument } from "../../types/database";

interface UserActivityHistoryViewProps {
  userId?: string;
  isAdmin?: boolean;
  adminUid?: string;
  isDarkMode?: boolean;
}

export const UserActivityHistoryView: React.FC<UserActivityHistoryViewProps> = ({
  userId,
  isAdmin = false,
  adminUid,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<
    "ACTIVITY_LOGS" | "CONSOLIDATED_HISTORY" | "ADMIN_AUDIT"
  >("ACTIVITY_LOGS");

  const [loading, setLoading] = useState<boolean>(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDocument[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminActivityLogDocument[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<{
    walletLogs: any[];
    verifications: any[];
    transactions: any[];
    notifications: any[];
    logins: any[];
    activityLogs: any[];
  } | null>(null);

  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    if (activeTab === "ACTIVITY_LOGS") {
      const res = await NotificationEngine.getActivityLogs({
        userId,
        activityType: typeFilter !== "ALL" ? typeFilter : undefined,
        searchQuery: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize
      });
      setActivityLogs(res.logs);
      setTotal(res.total);
    } else if (activeTab === "ADMIN_AUDIT" && adminUid) {
      const res = await NotificationEngine.getAdminActivityLogs(adminUid, page, pageSize);
      setAdminLogs(res.logs);
      setTotal(res.total);
    } else if (activeTab === "CONSOLIDATED_HISTORY" && userId) {
      const res = await NotificationEngine.getUserHistory(userId);
      setConsolidatedData(res);
      setTotal(
        (res.walletLogs?.length || 0) +
          (res.verifications?.length || 0) +
          (res.transactions?.length || 0)
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [userId, activeTab, page, typeFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    if (activeTab === "ACTIVITY_LOGS") dataToExport = activityLogs;
    if (activeTab === "ADMIN_AUDIT") dataToExport = adminLogs;
    if (activeTab === "CONSOLIDATED_HISTORY" && consolidatedData) {
      dataToExport = [
        ...(consolidatedData.walletLogs || []),
        ...(consolidatedData.verifications || []),
        ...(consolidatedData.transactions || [])
      ];
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `smartlink_${activeTab.toLowerCase()}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Activity Logs & Consolidated User History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive audit trail for security events, logins, wallet activities, and system actions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export Records
            </button>
            <button
              onClick={() => fetchLogs()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab("ACTIVITY_LOGS");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "ACTIVITY_LOGS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Security & Activity Logs
          </button>

          <button
            onClick={() => {
              setActiveTab("CONSOLIDATED_HISTORY");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "CONSOLIDATED_HISTORY"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Consolidated User History
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab("ADMIN_AUDIT");
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "ADMIN_AUDIT"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Audit Trail
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        {activeTab === "ACTIVITY_LOGS" && (
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search action, IP, browser or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="LOGIN">Login & Session</option>
                <option value="LOGOUT">Logout Event</option>
                <option value="SERVICE_USED">Service Transaction</option>
                <option value="WALLET_ACTIVITY">Wallet Operations</option>
                <option value="VERIFICATION_REQUEST">Identity Verification</option>
                <option value="PROFILE_UPDATE">Profile / Account Changes</option>
                <option value="SECURITY_EVENT">Security Alert</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Content Table / Lists */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeTab === "ACTIVITY_LOGS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Device & Browser</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading activity logs...
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No activity logs recorded.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log, idx) => (
                    <tr
                      key={log.activityId ? `act-${log.activityId}-${idx}` : log.id ? `act-${log.id}-${idx}` : `act-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px]">
                          {log.activityType || log.action || "SECURITY_EVENT"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs">
                        {log.description}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {log.device || "Desktop"} • {log.browser || "Chrome"} ({log.os || "Web"})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {log.ipAddress || "127.0.0.1"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "FAILED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                          }`}
                        >
                          {log.status || "SUCCESS"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(log.createdAt || Date.now()).toLocaleString("en-NG", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "ADMIN_AUDIT" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Action Performed</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading admin logs...
                    </td>
                  </tr>
                ) : adminLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No administrative audit entries found.
                    </td>
                  </tr>
                ) : (
                  adminLogs.map((log, idx) => (
                    <tr
                      key={log.logId ? `adm-${log.logId}-${idx}` : log.id ? `adm-${log.id}-${idx}` : `adm-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-purple-700 dark:text-purple-300">
                        {log.adminEmail}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {log.targetUserId || "System Wide"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "CONSOLIDATED_HISTORY" && consolidatedData && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Total Wallet Operations
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {consolidatedData.walletLogs?.length || 0}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Identity Verifications
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {consolidatedData.verifications?.length || 0}
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Financial Transactions
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {consolidatedData.transactions?.length || 0}
                </div>
              </div>
            </div>

            {/* Wallet Logs Section */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Wallet Movement History
              </h4>
              <div className="space-y-2">
                {consolidatedData.walletLogs?.length === 0 ? (
                  <p className="text-xs text-slate-400">No wallet records found.</p>
                ) : (
                  consolidatedData.walletLogs.map((log: any, idx: number) => (
                    <div
                      key={log.id ? `wlog-${log.id}-${idx}` : `wlog-${idx}`}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {log.changeType === "CREDIT" ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.changeType} ₦{log.amount?.toLocaleString()}
                          </span>
                          <div className="text-[11px] text-slate-400">Ref: {log.reference}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          ₦{log.previousBalance?.toLocaleString()} ➔ ₦{log.newBalance?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Identity Verifications Section */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Identity Verification History
              </h4>
              <div className="space-y-2">
                {consolidatedData.verifications?.length === 0 ? (
                  <p className="text-xs text-slate-400">No verification history found.</p>
                ) : (
                  consolidatedData.verifications.map((v: any, idx: number) => (
                    <div
                      key={v.id ? `ver-${v.id}-${idx}` : v.historyId ? `ver-${v.historyId}-${idx}` : `ver-${idx}`}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {v.verificationType} Verification
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Input: {v.referenceInput} • Provider: {v.providerUsed}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          VERIFIED
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(v.verifiedAt || v.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Pagination */}
        {activeTab !== "CONSOLIDATED_HISTORY" && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Total <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> log records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
