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
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#111827] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-[#0F2D5C]" />
              Activity Logs & Consolidated User History
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Comprehensive audit trail for security events, logins, wallet activities, and system actions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export Records
            </button>
            <button
              onClick={() => fetchLogs()}
              className="px-3.5 py-2 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F2D5C]" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#111827]">
          <button
            onClick={() => {
              setActiveTab("ACTIVITY_LOGS");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "ACTIVITY_LOGS"
                ? "bg-[#0F2D5C] text-white shadow-sm"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB]"
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
                ? "bg-[#0F2D5C] text-white shadow-sm"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB]"
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
                  ? "bg-[#0F2D5C] text-white shadow-sm"
                  : "bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] hover:bg-[#E5E7EB]"
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search action, IP, browser or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs text-[#111827] dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs text-[#111827] dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
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
                className="w-full py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Content Table / Lists */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#111827] shadow-sm overflow-hidden">
        {activeTab === "ACTIVITY_LOGS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
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
                    <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2D5C]" />
                      Loading activity logs...
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                      No activity logs recorded.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log, idx) => (
                    <tr
                      key={log.activityId ? `act-${log.activityId}-${idx}` : log.id ? `act-${log.id}-${idx}` : `act-${idx}`}
                      className="hover:bg-[#F5F7FA]/80 dark:hover:bg-[#111827]/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#111827] dark:text-[#E5E7EB]">
                        <span className="px-2 py-0.5 rounded bg-[#E5E7EB] dark:bg-[#111827] text-[#0F2D5C] dark:text-[#9CA3AF] font-mono text-[11px]">
                          {log.activityType || log.action || "SECURITY_EVENT"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#4B5563] dark:text-[#E5E7EB] max-w-xs">
                        {log.description}
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280] dark:text-[#9CA3AF] text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span>
                            {log.device || "Desktop"} • {log.browser || "Chrome"} ({log.os || "Web"})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#9CA3AF]" />
                          {log.ipAddress || "127.0.0.1"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "FAILED"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {log.status || "SUCCESS"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280] dark:text-[#9CA3AF] text-[11px]">
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
                <tr className="bg-[#F5F7FA] dark:bg-[#111827]/60 border-b border-[#E5E7EB] dark:border-[#111827] text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
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
                    <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                      Loading admin logs...
                    </td>
                  </tr>
                ) : adminLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                      No administrative audit entries found.
                    </td>
                  </tr>
                ) : (
                  adminLogs.map((log, idx) => (
                    <tr
                      key={log.logId ? `adm-${log.logId}-${idx}` : log.id ? `adm-${log.id}-${idx}` : `adm-${idx}`}
                      className="hover:bg-[#F5F7FA]/80 dark:hover:bg-[#111827]/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#0F2D5C] dark:text-[#9CA3AF]">
                        {log.adminEmail}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#111827] dark:text-[#E5E7EB]">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-[#4B5563] dark:text-[#E5E7EB]">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7280]">
                        {log.targetUserId || "System Wide"}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280] text-[11px]">
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
              <div className="p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 rounded-xl border border-[#E5E7EB] dark:border-[#0F2D5C]">
                <div className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] font-semibold">
                  Total Wallet Operations
                </div>
                <div className="text-2xl font-black text-[#111827] dark:text-white mt-1">
                  {consolidatedData.walletLogs?.length || 0}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 rounded-xl border border-[#E5E7EB] dark:border-[#0F2D5C]">
                <div className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] font-semibold">
                  Identity Verifications
                </div>
                <div className="text-2xl font-black text-[#111827] dark:text-white mt-1">
                  {consolidatedData.verifications?.length || 0}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 rounded-xl border border-[#E5E7EB] dark:border-[#0F2D5C]">
                <div className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] font-semibold">
                  Financial Transactions
                </div>
                <div className="text-2xl font-black text-[#111827] dark:text-white mt-1">
                  {consolidatedData.transactions?.length || 0}
                </div>
              </div>
            </div>

            {/* Wallet Logs Section */}
            <div>
              <h4 className="font-bold text-sm text-[#111827] dark:text-white mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0F2D5C]" />
                Wallet Movement History
              </h4>
              <div className="space-y-2">
                {consolidatedData.walletLogs?.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No wallet records found.</p>
                ) : (
                  consolidatedData.walletLogs.map((log: any, idx: number) => (
                    <div
                      key={log.id ? `wlog-${log.id}-${idx}` : `wlog-${idx}`}
                      className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-xl border border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {log.changeType === "CREDIT" ? (
                          <ArrowDownLeft className="w-4 h-4 text-[#0F2D5C]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-[#0F2D5C]" />
                        )}
                        <div>
                          <span className="font-semibold text-[#111827] dark:text-[#E5E7EB]">
                            {log.changeType} ₦{log.amount?.toLocaleString()}
                          </span>
                          <div className="text-[11px] text-[#9CA3AF]">Ref: {log.reference}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#4B5563] dark:text-[#E5E7EB]">
                          ₦{log.previousBalance?.toLocaleString()} ➔ ₦{log.newBalance?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF]">
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
              <h4 className="font-bold text-sm text-[#111827] dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F2D5C]" />
                Identity Verification History
              </h4>
              <div className="space-y-2">
                {consolidatedData.verifications?.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No verification history found.</p>
                ) : (
                  consolidatedData.verifications.map((v: any, idx: number) => (
                    <div
                      key={v.id ? `ver-${v.id}-${idx}` : v.historyId ? `ver-${v.historyId}-${idx}` : `ver-${idx}`}
                      className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-xl border border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#111827] dark:text-[#E5E7EB]">
                          {v.verificationType} Verification
                        </span>
                        <div className="text-[11px] text-[#9CA3AF]">
                          Input: {v.referenceInput} • Provider: {v.providerUsed}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C] dark:text-[#9CA3AF]">
                          VERIFIED
                        </span>
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">
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
          <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/40 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs text-[#6B7280]">
            <div>
              Total <span className="font-bold text-[#111827] dark:text-[#E5E7EB]">{total}</span> log records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] disabled:opacity-40 transition-colors"
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
