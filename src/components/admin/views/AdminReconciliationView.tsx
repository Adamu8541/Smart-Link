import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  FileText,
  User,
  Wallet,
  Calendar,
  X,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { AdminSession, getStoredAdminSession } from "../../../services/adminAuthTypes";

interface AdminReconciliationViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

export function AdminReconciliationView({ session, onNavigate }: AdminReconciliationViewProps) {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    fetchReconciliations();
  }, [statusFilter]);

  const fetchReconciliations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = session?.sessionToken || getStoredAdminSession()?.sessionToken || "";
      const query = new URLSearchParams({
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/admin/reconciliations?${query.toString()}`, {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.success) {
        setReconciliations(data.reconciliations || []);
      }
    } catch (err) {
      console.error("Failed to load reconciliations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReconciliations();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]/80";
      case "UNMATCHED":
        return "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]/80";
      case "FAILED":
        return "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]/80";
      case "REVERSED":
        return "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]/80";
      case "PENDING":
      default:
        return "bg-[#111827] text-[#E5E7EB] border-[#4B5563]";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-[#111827] border border-[#111827] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#111827] pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF] shadow-lg shadow-none">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Financial Audit</span>
                <span className="px-2 py-0.5 bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C] rounded-full text-[10px] font-mono font-bold">PROVIDER-INDEPENDENT</span>
              </div>
              <h1 className="text-xl font-bold text-white">Payment Verification & Reconciliation</h1>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Audit verified payments, unmatched deposits, state transitions & provider comparison results.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchReconciliations(true)}
              disabled={refreshing}
              className="py-2.5 px-3 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#9CA3AF]" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {["ALL", "VERIFIED", "UNMATCHED", "FAILED", "PENDING", "REVERSED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shrink-0 ${
                statusFilter === st ? "bg-[#0F2D5C] text-white" : "bg-[#111827] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#111827] border border-[#111827] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Payment Ref, Provider TxID, User, Email..."
              className="w-full bg-[#111827] border border-[#111827] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#0F2D5C] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>

        <div className="border border-[#111827] rounded-2xl overflow-hidden bg-[#111827]/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E5E7EB]">
              <thead className="bg-[#111827] border-b border-[#111827] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                <tr>
                  <th className="p-4">Payment Reference</th>
                  <th className="p-4">Provider TxID</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Wallet ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B7280] font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-[#6B7280]">
                      <RefreshCw className="h-6 w-6 text-[#9CA3AF] animate-spin mx-auto mb-2" />
                      Loading payment reconciliation records...
                    </td>
                  </tr>
                ) : reconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-[#6B7280]">
                      No payment reconciliation records found.
                    </td>
                  </tr>
                ) : (
                  reconciliations.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-[#111827]/40 transition-colors">
                      <td className="p-4 font-bold text-white">{rec.paymentReference}</td>
                      <td className="p-4 text-[#9CA3AF]">{rec.providerTransactionId || "N/A"}</td>
                      <td className="p-4 text-[#9CA3AF] font-sans font-medium">{rec.provider}</td>
                      <td className="p-4 text-right font-bold text-white">
                        ₦{(rec.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-sans">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-[#E5E7EB]">{rec.userEmail}</td>
                      <td className="p-4 text-[#9CA3AF]">{rec.walletId}</td>
                      <td className="p-4 text-[#9CA3AF] text-[11px]">
                        {new Date(rec.date).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 hover:bg-[#111827] text-[#E5E7EB] hover:text-[#9CA3AF] rounded-lg transition-colors cursor-pointer"
                          title="View Verification Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verification Result Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#111827] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#111827] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#9CA3AF]" />
                <h3 className="text-lg font-bold text-white">Verification & Comparison Result</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-[#111827] text-[#9CA3AF] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Payment Reference</span>
                <p className="text-white font-bold">{selectedRecord.paymentReference}</p>
              </div>

              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Provider TxID</span>
                <p className="text-white font-bold">{selectedRecord.providerTransactionId || "N/A"}</p>
              </div>

              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Provider</span>
                <p className="text-[#9CA3AF] font-bold">{selectedRecord.provider}</p>
              </div>

              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Amount</span>
                <p className="text-white font-bold">₦{(selectedRecord.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(selectedRecord.status)}`}>
                  {selectedRecord.status}
                </span>
              </div>

              <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">User / Wallet</span>
                <p className="text-[#E5E7EB] truncate">{selectedRecord.userEmail}</p>
                <p className="text-[10px] text-[#6B7280]">{selectedRecord.walletId}</p>
              </div>
            </div>

            {/* Comparison Details Section */}
            {selectedRecord.verificationResult && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Parameter Comparison Audit</h4>
                <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Amount Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.amountMatch ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.amountMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Reference Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.referenceMatch ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.referenceMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Account Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.accountMatch ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.accountMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Status Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.statusMatch ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.statusMatch ? "MATCHED" : "UNVERIFIED"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#111827] text-[#E5E7EB]">
                    <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Verification Summary</span>
                    <p className="mt-1 text-[#E5E7EB]">{selectedRecord.verificationResult.message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="py-2 px-5 bg-[#111827] hover:bg-[#4B5563] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
