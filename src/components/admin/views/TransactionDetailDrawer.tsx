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
        return "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]";
      case "FAILED":
      case "CANCELLED":
        return "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]";
      case "REFUNDED":
      case "REVERSED":
        return "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]";
      default:
        return "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#111827]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#111827] border-l border-[#111827] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#111827] bg-[#111827]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Transaction Investigation</span>
                <h2 className="text-lg font-bold text-white">SmartLink Reference Audit</h2>
                <p className="text-xs font-mono text-[#9CA3AF]">{tx?.smartLinkRef || transactionId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9CA3AF] hover:text-white bg-[#111827] hover:bg-[#4B5563] rounded-xl cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-[#9CA3AF] animate-spin mx-auto" />
                <p className="text-xs text-[#9CA3AF]">Loading comprehensive ledger sub-documents...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-[#0F2D5C]/50 border border-[#0F2D5C]/80 rounded-2xl text-xs text-[#9CA3AF] flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : tx ? (
              <>
                {/* Status & Readonly Banner */}
                <div className="flex items-center justify-between p-4 bg-[#111827]/80 border border-[#111827] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                    {tx.status === "SUCCESSFUL" && (
                      <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                        <Shield className="h-3.5 w-3.5 text-[#9CA3AF]" /> Read-Only Protection Active
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReceipt(tx, user)}
                    className="py-1.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] border border-[#0F2D5C]/80 text-[#9CA3AF] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" /> View Receipt
                  </button>
                </div>

                {/* Section 1: Transaction Information */}
                <div className="bg-[#111827]/60 border border-[#111827] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Transaction Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">SmartLink Reference</span>
                      <span className="font-mono font-bold text-white">{tx.smartLinkRef}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Provider Reference</span>
                      <span className="font-mono font-bold text-[#E5E7EB]">{tx.providerRef || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Provider Gateway</span>
                      <span className="font-medium text-[#E5E7EB]">{tx.providerName}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Service Requested</span>
                      <span className="font-bold text-[#9CA3AF]">{tx.serviceName || tx.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Amount</span>
                      <span className="font-mono font-bold text-base text-white">₦{(tx.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Charges / Fees</span>
                      <span className="font-mono text-[#E5E7EB]">₦{(tx.charges || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Verification Extra Result payload if available */}
                  {tx.verificationResult && (
                    <div className="mt-3 p-3 bg-[#111827] border border-[#111827] rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Identity Verification Result</span>
                      <pre className="text-[11px] font-mono text-[#E5E7EB] overflow-x-auto p-2 bg-[#111827] rounded-lg">
                        {JSON.stringify(tx.verificationResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Section 2: User Information */}
                <div className="bg-[#111827]/60 border border-[#111827] rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                    <User className="h-4 w-4" /> User Account Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Full Name</span>
                      <span className="font-bold text-white">{user?.fullName || "SmartLink User"}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">User Email</span>
                      <span className="text-[#E5E7EB]">{user?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Phone Number</span>
                      <span className="font-mono text-[#E5E7EB]">{user?.phoneNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">User UID</span>
                      <span className="font-mono text-[11px] text-[#9CA3AF]">{user?.userId || user?.uid}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment Information */}
                <div className="bg-[#111827]/60 border border-[#111827] rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Ledger Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Payment Method</span>
                      <span className="font-bold text-white uppercase">{tx.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Wallet / Source</span>
                      <span className="text-[#E5E7EB]">{tx.walletUsed}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Previous Balance</span>
                      <span className="font-mono text-[#9CA3AF]">₦{(tx.previousBalance || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">New Balance</span>
                      <span className="font-mono text-[#9CA3AF] font-bold">₦{(tx.newBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Audit Timeline */}
                <div className="bg-[#111827]/60 border border-[#111827] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Transaction Audit Timeline
                  </h3>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#111827]">
                    {timeline.map((step: any, idx: number) => (
                      <div key={idx} className="relative flex flex-col text-xs space-y-0.5">
                        <div className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111827] bg-[#0F2D5C]"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#E5E7EB]">{step.title}</span>
                          <span className="text-[10px] font-mono text-[#6B7280]">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF]">{step.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Internal Administrative Notes */}
                <div className="bg-[#111827]/60 border border-[#111827] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Internal Administrative Notes ({notes.length})
                    </h3>
                  </div>

                  {noteSuccess && (
                    <div className="p-2.5 bg-[#0F2D5C]/80 border border-[#0F2D5C] text-xs text-[#9CA3AF] rounded-xl">
                      {noteSuccess}
                    </div>
                  )}

                  {/* Existing Notes List */}
                  {notes.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {notes.map((n: any) => (
                        <div key={n.id} className="p-3 bg-[#111827] border border-[#111827]/80 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-[#9CA3AF] font-mono">
                            <span className="font-bold text-[#E5E7EB]">{n.adminEmail}</span>
                            <span>{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[#E5E7EB] text-[11px]">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic">No internal admin notes attached yet.</p>
                  )}

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-[#111827]">
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note or investigation detail..."
                      className="w-full bg-[#111827] border border-[#111827] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0F2D5C] transition-colors"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote || !newNote.trim()}
                        className="py-2 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                      >
                        <Send className="h-3.5 w-3.5" /> Attach Internal Note
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 6: Administrative Actions Panel */}
                <div className="p-5 bg-[#111827]/80 border border-[#111827] rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">Permitted Admin Actions</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Retry Action for Failed or Pending */}
                    {tx.status !== "SUCCESSFUL" && tx.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => setShowRetryConfirm(true)}
                        className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] border border-[#0F2D5C]/80 text-[#9CA3AF] text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" /> Retry Failed Transaction
                      </button>
                    ) : (
                      <div className="p-2.5 bg-[#111827] border border-[#111827]/80 rounded-xl text-[11px] text-[#9CA3AF] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#9CA3AF] shrink-0" />
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
                      className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] border border-[#0F2D5C]/80 text-[#9CA3AF] text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <ShieldAlert className="h-4 w-4" /> Initiate Refund Workflow
                    </button>
                  </div>

                  {/* Retry Confirmation Modal */}
                  {showRetryConfirm && (
                    <div className="p-4 bg-[#0F2D5C]/80 border border-[#0F2D5C]/80 rounded-xl text-xs space-y-3">
                      <div className="flex items-center gap-2 text-[#9CA3AF] font-bold">
                        <Info className="h-4 w-4" /> Confirm Safe Retry Execution
                      </div>
                      <p className="text-[#E5E7EB] text-[11px]">
                        Re-executing transaction request for <strong>{tx.smartLinkRef}</strong>. Ensure provider status has been audited before re-triggering.
                      </p>
                      <input
                        type="text"
                        value={retryReason}
                        onChange={(e) => setRetryReason(e.target.value)}
                        placeholder="Mandatory administrative reason for retry..."
                        className="w-full bg-[#111827] border border-[#111827] rounded-lg p-2 text-xs text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRetryConfirm(false)}
                          className="py-1.5 px-3 bg-[#111827] text-[#E5E7EB] rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteRetry}
                          disabled={isRetrying}
                          className="py-1.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white rounded-lg font-bold flex items-center gap-1.5"
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
