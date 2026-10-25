/**
 * SmartLink Admin Panel — Live Turso Activity & Audit Logs View
 * Displays real-time user & admin activities, transaction logs, failed attempts, and high-risk events.
 * Supports parameterized retention purges (Daily, Weekly, Monthly, All Failed, All) directly on Turso DB.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  ShieldAlert,
  Clock,
  User,
  Shield,
  Layers,
  Calendar,
  AlertCircle,
  Database,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { AdminSession, getStoredAdminSession } from "../../../services/adminAuthTypes";

interface TursoAuditLog {
  id: string;
  log_id: string;
  user_id?: string | null;
  admin_uid?: string | null;
  admin_email?: string | null;
  admin_role?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: "SUCCESS" | "FAILURE" | "WARNING";
  details: string;
  created_at: string;
}

interface AdminActivityLogsViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

function formatLogTimestamp(dateVal?: any): string {
  if (!dateVal) return "N/A";
  try {
    let d: Date;
    if (typeof dateVal === "number") {
      d = new Date(dateVal);
    } else {
      let str = String(dateVal).trim();
      if (!isNaN(Number(str))) {
        d = new Date(Number(str));
      } else {
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(str)) {
          str = str.replace(" ", "T") + "Z";
        }
        d = new Date(str);
      }
    }
    if (isNaN(d.getTime())) {
      return String(dateVal);
    }
    return d.toLocaleString("en-NG", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return String(dateVal);
  }
}

export function AdminActivityLogsView({ session, onNavigate }: AdminActivityLogsViewProps) {
  const [logs, setLogs] = useState<TursoAuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  // Single Delete Modal State
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<TursoAuditLog | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Purge Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgePeriod, setPurgePeriod] = useState<"1_DAY" | "7_DAYS" | "30_DAYS" | "ALL_FAILED" | "ALL">("7_DAYS");
  const [purging, setPurging] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        status: statusFilter,
        resourceType: resourceFilter,
        search: search.trim(),
      });

      const res = await fetch(`/api/admin/activity-logs?${queryParams.toString()}`, {
        headers: {
          "x-admin-token": token,
        },
      });

      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err: any) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!singleDeleteTarget) return;
    const targetId = singleDeleteTarget.id || singleDeleteTarget.log_id;
    setDeletingSingle(true);

    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";

      // Send request to DELETE endpoint
      let res = await fetch(`/api/admin/activity-logs/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token,
        },
      });

      let data = await res.json();

      // Fallback to POST delete if needed
      if (!res.ok || !data.success) {
        res = await fetch("/api/admin/activity-logs/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ id: targetId }),
        });
        data = await res.json();
      }

      if (data.success) {
        setLogs((prev) => prev.filter((l) => l.id !== targetId && l.log_id !== targetId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setActionFeedback({
          type: "success",
          msg: `Activity log record '${targetId}' was successfully deleted from Turso SQL & db.json.`,
        });
        setTimeout(() => setActionFeedback(null), 4000);
        setSingleDeleteTarget(null);
      } else {
        setActionFeedback({
          type: "error",
          msg: data.error || "Failed to delete activity log record.",
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        msg: err.message || "Network request failed while deleting activity log.",
      });
    } finally {
      setDeletingSingle(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, resourceFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleExecutePurge = async () => {
    setPurging(true);
    setPurgeFeedback(null);

    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const res = await fetch("/api/admin/activity-logs/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ period: purgePeriod }),
      });

      const data = await res.json();
      if (data.success) {
        setPurgeFeedback({
          type: "success",
          msg: `${data.message} (${data.purgedCount} entries removed from Turso SQL).`,
        });
        setTimeout(() => {
          setShowPurgeModal(false);
          setPurgeFeedback(null);
          setPage(0);
          fetchLogs(true);
        }, 1800);
      } else {
        setPurgeFeedback({ type: "error", msg: data.error || "Failed to purge activity logs." });
      }
    } catch (err: any) {
      setPurgeFeedback({ type: "error", msg: err.message || "Network request failed." });
    } finally {
      setPurging(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0F2D5C] to-[#17407E] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-blue-200">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Turso Database Live Ledger & Audit Trail</span>
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
            Activity & Event Audit Logs
          </h1>
          <p className="text-xs md:text-sm text-blue-100">
            Real-time tracking for user logins, service requests, failed transactions, and administrative governance.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all border border-white/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPurgeFeedback(null);
              setShowPurgeModal(true);
            }}
            className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md border border-white/30"
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
            <span className="text-white font-extrabold">Purge / Clean Turso Records</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{actionFeedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, email, user ID, or IP address..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] cursor-pointer focus:outline-none focus:border-[#0F2D5C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILURE">Failures & Errors Only</option>
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] cursor-pointer focus:outline-none focus:border-[#0F2D5C]"
            >
              <option value="ALL">All Resources</option>
              <option value="SYSTEM">System Events</option>
              <option value="ADMIN">Admin Governance</option>
              <option value="AUTH">Authentication</option>
              <option value="SERVICES">VTU / Bill Purchases</option>
              <option value="WALLETS">Wallet Ledger</option>
              <option value="SECURITY">Security Flags</option>
            </select>

            <button
              type="submit"
              className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#0F2D5C]" />
            <span className="text-xs font-bold text-[#111827]">
              Live Records ({totalCount.toLocaleString()} total logged in Turso)
            </span>
          </div>
          <span className="text-[11px] text-[#6B7280]">
            Page {page + 1} of {totalPages || 1}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#6B7280] space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0F2D5C]" />
            <p className="text-xs font-medium">Fetching live activity log stream from Turso SQL...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#6B7280] space-y-2">
            <Database className="h-8 w-8 mx-auto text-[#9CA3AF]" />
            <p className="text-sm font-bold text-[#111827]">No Activity Log Records Found</p>
            <p className="text-xs">No entries match your query filters or the log repository was cleaned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Action & Event</th>
                  <th className="p-3.5">User / Actor ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Details & Message</th>
                  <th className="p-3.5">IP / Device</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {logs.map((log) => {
                  const isFail = log.status === "FAILURE" || log.status === "FAILED";
                  const isWarn = log.status === "WARNING";
                  const logDateStr = log.created_at || (log as any).timestamp || (log as any).createdAt;

                  return (
                    <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isFail
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isWarn
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isFail ? (
                            <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
                          ) : isWarn ? (
                            <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-[#111827] whitespace-nowrap">
                        {log.action}
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#4B5563]">
                        {log.admin_email || log.user_id || log.admin_uid || "System"}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] font-semibold text-[10px] uppercase">
                          {log.resource_type || "SYSTEM"}
                        </span>
                      </td>

                      <td className="p-3.5 text-[#374151] max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>

                      <td className="p-3.5 font-mono text-[10px] text-[#6B7280] whitespace-nowrap">
                        {log.ip_address || "127.0.0.1"}
                      </td>

                      <td className="p-3.5 text-[#6B7280] whitespace-nowrap text-[11px]">
                        {formatLogTimestamp(logDateStr)}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSingleDeleteTarget(log)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          title="Delete this record from Turso & db.json"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[#374151] font-bold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-[#6B7280] font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[#374151] font-bold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Purge Confirmation Modal */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[90vh] bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">
                      Purge Turso Activity Records
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Permanently delete selected activity logs from Turso database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {purgeFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      purgeFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {purgeFeedback.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span>{purgeFeedback.msg}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[#111827] mb-2">
                    Select Retention Purge Window:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "1_DAY", label: "Purge Logs Older Than 24 Hours (Daily)", desc: "Cleans logs created before yesterday" },
                      { id: "7_DAYS", label: "Purge Logs Older Than 7 Days (Weekly)", desc: "Cleans activity older than 1 week" },
                      { id: "30_DAYS", label: "Purge Logs Older Than 30 Days (Monthly)", desc: "Cleans activity older than 1 month" },
                      { id: "ALL_FAILED", label: "Purge All Failed Activity Logs", desc: "Deletes all error/failed attempts only" },
                      { id: "ALL", label: "Purge Entire Activity Log History", desc: "Completely wipes all audit records" },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          purgePeriod === opt.id
                            ? "border-[#0F2D5C] bg-[#F5F7FA]"
                            : "border-[#E5E7EB] hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="purgePeriod"
                          value={opt.id}
                          checked={purgePeriod === opt.id}
                          onChange={() => setPurgePeriod(opt.id as any)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-[#111827]">{opt.label}</div>
                          <div className="text-[11px] text-[#6B7280]">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5" /> Permanent Database Deletion:
                  </div>
                  <p>This action executes direct SQL DELETE commands on Turso. This cannot be undone.</p>
                </div>
              </div>

              {/* Fixed Footer with Always-Visible Confirm Button */}
              <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="py-2.5 px-4 font-bold rounded-xl text-xs text-[#374151] hover:bg-slate-200 cursor-pointer border border-[#D1D5DB] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={purging}
                  onClick={handleExecutePurge}
                  className="py-3 px-6 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50 shrink-0 border border-[#0F2D5C]"
                >
                  {purging ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-white" />
                  )}
                  <span className="text-white font-extrabold tracking-wide">Confirm & Execute Purge</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Single Log Record Delete Modal */}
        {singleDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSingleDeleteTarget(null)}
                className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Delete Activity Log Record
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Permanently remove this event entry from Turso SQL & db.json.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs mb-6 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="font-bold text-[#111827]">Event Action: </span>
                  <span className="font-mono text-[#0F2D5C] font-extrabold">{singleDeleteTarget.action}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">User / Actor: </span>
                  <span>{singleDeleteTarget.admin_email || singleDeleteTarget.user_id || "System"}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">Category: </span>
                  <span className="uppercase font-semibold text-slate-600">{singleDeleteTarget.resource_type || "SYSTEM"}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">Details: </span>
                  <span className="text-slate-600">{singleDeleteTarget.details}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">Timestamp: </span>
                  <span>{formatLogTimestamp(singleDeleteTarget.created_at || (singleDeleteTarget as any).timestamp)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setSingleDeleteTarget(null)}
                  className="py-2.5 px-4 font-bold rounded-xl text-xs text-[#374151] hover:bg-slate-100 border border-[#D1D5DB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingSingle}
                  onClick={handleConfirmDeleteSingle}
                  className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all disabled:opacity-50 shrink-0 border border-[#0F2D5C]"
                >
                  {deletingSingle ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-white" />
                  )}
                  <span className="text-white font-extrabold">Confirm & Delete Record</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
