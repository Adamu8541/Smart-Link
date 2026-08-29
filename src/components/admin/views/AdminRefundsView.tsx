/**
 * SmartLink Admin Panel — Refunds Management View
 * Live Firestore Database Integration & Homepage Theme Matching
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
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#0F2D5C]">
            <RotateCcw className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0F2D5C] text-xs font-semibold mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Finance & Ledger Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Refunds & Reversals Management
            </h1>
            <p className="text-xs md:text-sm text-[#4B5563] mt-0.5">
              Review transaction refund requests, authorize wallet credits, and manage settlement disputes directly on Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRefunds}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F5F7FA] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Total Approved Refunds</span>
          <p className="text-2xl font-bold text-[#111827]">₦{totalRefundAmount.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Credited to customer wallets</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Pending Authorization</span>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <span className="text-[11px] text-[#4B5563]">Awaiting administrative review</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Processed / Approved</span>
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <span className="text-[11px] text-[#4B5563]">Successfully refunded</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Declined / Rejected</span>
          <p className="text-2xl font-bold text-rose-600">{rejectedCount}</p>
          <span className="text-[11px] text-[#4B5563]">Failed verification checks</span>
        </div>
      </div>

      {/* Main Table & Filters Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Filters Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F5F7FA]">
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by ID, transaction, email, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F2D5C] transition-colors"
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
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-slate-100"
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F5F7FA] text-[#4B5563] font-bold uppercase tracking-wider text-[11px] border-b border-[#E5E7EB]">
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
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#4B5563]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0F2D5C] mb-2" />
                    <span>Loading refund records from Firestore...</span>
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#4B5563]">
                    <FileText className="h-8 w-8 text-[#9CA3AF] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#111827]">No refund requests found</p>
                    <p className="text-xs text-[#6B7280]">All refund records will appear here in real-time.</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F2D5C]">
                      {refund.id}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#4B5563]">
                      {refund.transactionId}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#111827]">{refund.userEmail || refund.userId}</div>
                      <div className="text-[10px] text-[#6B7280] font-mono">{refund.userId}</div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#111827]">
                      ₦{(Number(refund.amount) || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 max-w-[200px] truncate text-[#4B5563]">
                      {refund.reason}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          refund.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : refund.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {refund.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {refund.status === "REJECTED" && <XCircle className="h-3 w-3 text-rose-600" />}
                        {refund.status === "PENDING" && <Clock className="h-3 w-3 text-amber-600" />}
                        <span>{refund.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#6B7280] text-[11px] whitespace-nowrap">
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
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setActionType("REJECT");
                              setAdminNotes("Disputed transaction confirmed as valid");
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF] font-medium italic">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-base font-bold text-[#111827]">Issue Refund Ticket</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">User ID / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. usr_178291..."
                  value={newRefund.userId}
                  onChange={(e) => setNewRefund({ ...newRefund, userId: e.target.value })}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">User Email (Optional)</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newRefund.userEmail}
                  onChange={(e) => setNewRefund({ ...newRefund, userEmail: e.target.value })}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">Original Transaction ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN_991823"
                  value={newRefund.transactionId}
                  onChange={(e) => setNewRefund({ ...newRefund, transactionId: e.target.value })}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">Refund Amount (₦)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={newRefund.amount}
                  onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">Administrative Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for reversal / compensation..."
                  value={newRefund.reason}
                  onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-[#4B5563] font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="py-2 px-5 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-base font-bold text-[#111827]">
                {actionType === "APPROVE" ? "Confirm Refund Approval" : "Confirm Refund Rejection"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedRefund(null);
                  setActionType(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1">
                <p>
                  <strong className="text-[#111827]">Ticket:</strong> {selectedRefund.id}
                </p>
                <p>
                  <strong className="text-[#111827]">Transaction Ref:</strong> {selectedRefund.transactionId}
                </p>
                <p>
                  <strong className="text-[#111827]">Amount:</strong> ₦
                  {Number(selectedRefund.amount).toLocaleString()}
                </p>
                <p>
                  <strong className="text-[#111827]">Customer:</strong>{" "}
                  {selectedRefund.userEmail || selectedRefund.userId}
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#4B5563] block mb-1">
                  {actionType === "APPROVE" ? "Administrative Note (Optional)" : "Rejection Reason"}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
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
                  className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-[#4B5563] font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                {actionType === "APPROVE" ? (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={Boolean(actionLoading)}
                    className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>Authorize & Credit Wallet</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={Boolean(actionLoading)}
                    className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
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
