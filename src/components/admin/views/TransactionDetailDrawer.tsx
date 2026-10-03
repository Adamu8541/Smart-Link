import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  User,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Shield,
  ExternalLink,
  MessageSquare,
  Activity,
  Printer,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Info
} from "lucide-react";
import { AdminSession, getStoredAdminSession } from "../../../services/adminAuthTypes";

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
  session: AdminSession;
  onOpenReceipt: (tx: any, user: any) => void;
  onNavigateToRefunds?: (txId: string) => void;
  onRefreshList?: () => void;
}

export function TransactionDetailDrawer({
  isOpen,
  onClose,
  transactionId,
  session,
  onOpenReceipt,
  onNavigateToRefunds,
  onRefreshList
}: TransactionDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [retryReason, setRetryReason] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransactionDetails(transactionId);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, transactionId]);

  const fetchTransactionDetails = async (txId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/transactions/${txId}`, {
        headers: { "x-admin-token": token }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || "Failed to load transaction details.");
      }
    } catch (err: any) {
      setError("Network or server error while fetching transaction.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !data?.transaction) return;

    setSubmittingNote(true);
    setNoteSuccess(null);
    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/transactions/${data.transaction.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ note: newNote.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setNewNote("");
        setNoteSuccess("Internal note added successfully.");
        setData((prev: any) => ({
          ...prev,
          notes: json.notes
        }));
        setTimeout(() => setNoteSuccess(null), 3000);
      } else {
        alert(json.message || "Failed to add note.");
      }
    } catch (err) {
      alert("Error attaching administrative note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleExecuteRetry = async () => {
    if (!data?.transaction) return;
    setIsRetrying(true);
    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/transactions/${data.transaction.id}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ reason: retryReason || "Manual administrative retry" })
      });
      const json = await res.json();
      if (json.success) {
        setShowRetryConfirm(false);
        setRetryReason("");
        fetchTransactionDetails(data.transaction.id);
        if (onRefreshList) onRefreshList();
      } else {
        alert(json.message || "Failed to retry transaction.");
      }
    } catch (err) {
      alert("Error triggering transaction retry.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOpen) return null;

  const tx = data?.transaction;
  const user = data?.user;
  const timeline = data?.timeline || [];
  const notes = data?.notes || [];
  const auditLogs = data?.auditLogs || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "REFUNDED":
      case "REVERSED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#F5F7FA] border-l border-[#E5E7EB] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#E5E7EB] bg-[#0F2D5C] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 border border-white/20 rounded-2xl text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Transaction Investigation</span>
                <h2 className="text-lg font-bold text-white">SmartLink Reference Audit</h2>
                <p className="text-xs font-mono text-blue-100">{tx?.smartLinkRef || transactionId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-[#0F2D5C] animate-spin mx-auto" />
                <p className="text-xs text-[#6B7280]">Loading comprehensive ledger sub-documents...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            ) : tx ? (
              <>
                {/* Status & Readonly Banner */}
                <div className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                    {tx.status === "SUCCESSFUL" && (
                      <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono font-medium">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" /> Read-Only Protection Active
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReceipt(tx, user)}
                    className="py-1.5 px-3.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" /> View Receipt
                  </button>
                </div>

                {/* Section 1: Transaction Information */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-xs text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#0F2D5C]" /> Transaction Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">SmartLink Reference</span>
                      <span className="font-mono font-bold text-[#111827]">{tx.smartLinkRef}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Provider Reference</span>
                      <span className="font-mono font-bold text-[#111827]">{tx.providerRef || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Provider Portal</span>
                      <span className="font-medium text-[#111827]">{tx.providerName}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Service Requested</span>
                      <span className="font-bold text-[#0F2D5C]">{tx.serviceName || tx.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Amount</span>
                      <span className="font-mono font-bold text-base text-[#111827]">₦{(tx.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Charges / Fees</span>
                      <span className="font-mono text-[#111827]">₦{(tx.charges || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Verification Extra Result payload if available */}
                  {tx.verificationResult && (
                    <div className="mt-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Identity Verification Result</span>
                      <pre className="text-[11px] font-mono text-[#111827] overflow-x-auto p-2 bg-white border border-[#E5E7EB] rounded-lg">
                        {JSON.stringify(tx.verificationResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Section 2: User Information */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3 shadow-xs text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0F2D5C]" /> User Account Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Full Name</span>
                      <span className="font-bold text-[#111827]">{user?.fullName || "SmartLink User"}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">User Email</span>
                      <span className="text-[#111827]">{user?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Phone Number</span>
                      <span className="font-mono text-[#111827]">{user?.phoneNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">User UID</span>
                      <span className="font-mono text-[11px] text-[#6B7280]">{user?.userId || user?.uid}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment Information */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3 shadow-xs text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#0F2D5C]" /> Payment Ledger Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Payment Method</span>
                      <span className="font-bold text-[#111827] uppercase">{tx.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Wallet / Source</span>
                      <span className="text-[#111827]">{tx.walletUsed}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Previous Balance</span>
                      <span className="font-mono text-[#6B7280]">₦{(tx.previousBalance || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px] uppercase font-bold">New Balance</span>
                      <span className="font-mono text-[#111827] font-bold">₦{(tx.newBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Audit Timeline */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-xs text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0F2D5C]" /> Transaction Audit Timeline
                  </h3>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                    {timeline.map((step: any, idx: number) => (
                      <div key={idx} className="relative flex flex-col text-xs space-y-0.5">
                        <div className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#0F2D5C] shadow-xs"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111827]">{step.title}</span>
                          <span className="text-[10px] font-mono text-[#6B7280]">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280]">{step.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Internal Administrative Notes */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-xs text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#0F2D5C]" /> Internal Administrative Notes ({notes.length})
                    </h3>
                  </div>

                  {noteSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl">
                      {noteSuccess}
                    </div>
                  )}

                  {/* Existing Notes List */}
                  {notes.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {notes.map((n: any) => (
                        <div key={n.id} className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-[#6B7280] font-mono">
                            <span className="font-bold text-[#111827]">{n.adminEmail}</span>
                            <span>{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[#111827] text-[11px]">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic">No internal admin notes attached yet.</p>
                  )}

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note or investigation detail..."
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F2D5C] focus:bg-white transition-colors"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote || !newNote.trim()}
                        className="py-2 px-4 bg-[#0F2D5C] hover:bg-[#17407E] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5" /> Attach Internal Note
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 6: Administrative Actions Panel */}
                <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-3 shadow-xs text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">Permitted Admin Actions</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Retry Action for Failed or Pending */}
                    {tx.status !== "SUCCESSFUL" && tx.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => setShowRetryConfirm(true)}
                        className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <RotateCcw className="h-4 w-4" /> Retry Failed Transaction
                      </button>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Completed (Read-Only)</span>
                      </div>
                    )}

                    {/* Initiate Refund Link */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToRefunds) {
                          onNavigateToRefunds(tx.id);
                        } else {
                          alert(`Initiate refund workflow for transaction ${tx.smartLinkRef}`);
                        }
                      }}
                      className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <ShieldAlert className="h-4 w-4" /> Initiate Refund Workflow
                    </button>
                  </div>

                  {/* Retry Confirmation Modal */}
                  {showRetryConfirm && (
                    <div className="p-4 bg-[#F9FAFB] border border-amber-200 rounded-xl text-xs space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-bold">
                        <Info className="h-4 w-4" /> Confirm Safe Retry Execution
                      </div>
                      <p className="text-[#111827] text-[11px]">
                        Re-executing transaction request for <strong>{tx.smartLinkRef}</strong>. Ensure provider status has been audited before re-triggering.
                      </p>
                      <input
                        type="text"
                        value={retryReason}
                        onChange={(e) => setRetryReason(e.target.value)}
                        placeholder="Mandatory administrative reason for retry..."
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg p-2.5 text-xs text-[#111827] placeholder-[#9CA3AF]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRetryConfirm(false)}
                          className="py-1.5 px-3 bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#111827] rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteRetry}
                          disabled={isRetrying}
                          className="py-1.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          {isRetrying && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                          Confirm & Retry Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
