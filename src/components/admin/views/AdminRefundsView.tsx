/**
 * SmartLink Admin Panel — Refunds Management View
 * Live Cloud Database Integration & Homepage Theme Matching
 */

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Plus,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { getAuthHeaders } from "../../../services/providerService";

interface RefundRecord {
  id: string;
  userId: string;
  userEmail?: string;
  transactionId: string;
  reason: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

interface AdminRefundsViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminRefundsView({ session, onNavigate }: AdminRefundsViewProps) {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Manual refund creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRefund, setNewRefund] = useState({
    userId: "",
    userEmail: "",
    transactionId: "",
    amount: "",
    reason: "",
  });

  // Action modals
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/refunds", {
        headers,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.refunds)) {
        setRefunds(data.refunds);
      }
    } catch (err: any) {
      console.error("Failed to fetch refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefund.amount || !newRefund.reason) return;
    setActionLoading("create");
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/refunds/request", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRefund),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Refund request initiated successfully.", type: "success" });
        setShowCreateModal(false);
        setNewRefund({ userId: "", userEmail: "", transactionId: "", amount: "", reason: "" });
        fetchRefunds();
      } else {
        setMsg({ text: data.error || "Failed to create refund.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Network error.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    setActionLoading(selectedRefund.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/refunds/${selectedRefund.id}/approve`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Refund approved and credited.", type: "success" });
        setSelectedRefund(null);
        setActionType(null);
        setAdminNotes("");
        fetchRefunds();
      } else {
        setMsg({ text: data.error || "Approval failed.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Network error.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    setActionLoading(selectedRefund.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/refunds/${selectedRefund.id}/reject`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: adminNotes, adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Refund rejected.", type: "success" });
        setSelectedRefund(null);
        setActionType(null);
        setAdminNotes("");
        fetchRefunds();
      } else {
        setMsg({ text: data.error || "Rejection failed.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Network error.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = refunds.filter((r) => r.status === "PENDING").length;
  const approvedCount = refunds.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = refunds.filter((r) => r.status === "REJECTED").length;
  const totalRefundAmount = refunds
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-blue-400">
            <RotateCcw className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-950/70 border border-blue-800/80 text-blue-300 text-xs font-semibold mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Finance & Ledger Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Refunds & Reversals Management
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-0.5">
              Review transaction refund requests, authorize wallet credits, and manage settlement disputes directly on our secure database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRefunds}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : "text-slate-400"}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Refund Ticket</span>
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            msg.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-red-950/80 border-red-800 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Approved Refunds</span>
          <p className="text-2xl font-bold text-white font-mono">₦{totalRefundAmount.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Credited to customer wallets</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">Pending Authorization</span>
          <p className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</p>
          <span className="text-[11px] text-slate-400">Awaiting administrative review</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">Processed / Approved</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{approvedCount}</p>
          <span className="text-[11px] text-slate-400">Successfully refunded</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">Declined / Rejected</span>
          <p className="text-2xl font-bold text-rose-400 font-mono">{rejectedCount}</p>
          <span className="text-[11px] text-slate-400">Failed verification checks</span>
        </div>
      </div>

      {/* Main Table & Filters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Filters Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60">
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, transaction, email, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setStatusFilter(filterKey)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filterKey
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Refund Ticket</th>
                <th className="py-3.5 px-5">Transaction Ref</th>
                <th className="py-3.5 px-5">Customer / User</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Reason</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400 mb-2" />
                    <span>Loading refund records from database...</span>
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-200">No refund requests found</p>
                    <p className="text-xs text-slate-400">All refund records will appear here in real-time.</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-blue-400">
                      {refund.id}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300">
                      {refund.transactionId}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-white">{refund.userEmail || refund.userId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{refund.userId}</div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white font-mono">
                      ₦{(Number(refund.amount) || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 max-w-[200px] truncate text-slate-300">
                      {refund.reason}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          refund.status === "APPROVED"
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
                            : refund.status === "REJECTED"
                            ? "bg-rose-950/70 text-rose-300 border-rose-800"
                            : "bg-amber-950/70 text-amber-300 border-amber-800"
                        }`}
                      >
                        {refund.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {refund.status === "REJECTED" && <XCircle className="h-3 w-3 text-rose-400" />}
                        {refund.status === "PENDING" && <Clock className="h-3 w-3 text-amber-400" />}
                        <span>{refund.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(refund.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {refund.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setActionType("APPROVE");
                              setAdminNotes(`Approved refund credit of ₦${refund.amount}`);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setActionType("REJECT");
                              setAdminNotes("Disputed transaction confirmed as valid");
                            }}
                            className="py-1 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-rose-400" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium italic">
                          {refund.status === "APPROVED" ? "Settled" : "Closed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Issue Refund Ticket</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">User ID / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. usr_178291..."
                  value={newRefund.userId}
                  onChange={(e) => setNewRefund({ ...newRefund, userId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">User Email (Optional)</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newRefund.userEmail}
                  onChange={(e) => setNewRefund({ ...newRefund, userEmail: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Original Transaction ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN_991823"
                  value={newRefund.transactionId}
                  onChange={(e) => setNewRefund({ ...newRefund, transactionId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Refund Amount (₦)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={newRefund.amount}
                  onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Administrative Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for reversal / compensation..."
                  value={newRefund.reason}
                  onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  {actionLoading === "create" && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirmation Modal */}
      {selectedRefund && actionType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">
                {actionType === "APPROVE" ? "Confirm Refund Approval" : "Confirm Refund Rejection"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedRefund(null);
                  setActionType(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <p>
                  <strong className="text-slate-300">Ticket:</strong> <span className="font-mono text-blue-400">{selectedRefund.id}</span>
                </p>
                <p>
                  <strong className="text-slate-300">Transaction Ref:</strong> <span className="font-mono text-slate-200">{selectedRefund.transactionId}</span>
                </p>
                <p>
                  <strong className="text-slate-300">Amount:</strong> <span className="font-mono font-bold text-white">₦{Number(selectedRefund.amount).toLocaleString()}</span>
                </p>
                <p>
                  <strong className="text-slate-300">Customer:</strong> <span className="text-slate-200">{selectedRefund.userEmail || selectedRefund.userId}</span>
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {actionType === "APPROVE" ? "Administrative Note (Optional)" : "Rejection Reason"}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder={
                    actionType === "APPROVE"
                      ? "Add optional audit notes..."
                      : "Provide exact reason for declining refund..."
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRefund(null);
                    setActionType(null);
                  }}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                {actionType === "APPROVE" ? (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={Boolean(actionLoading)}
                    className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>Authorize & Credit Wallet</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={Boolean(actionLoading)}
                    className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>Confirm Rejection</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
