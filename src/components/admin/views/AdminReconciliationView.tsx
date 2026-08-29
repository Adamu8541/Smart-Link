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
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800/80";
      case "UNMATCHED":
        return "bg-amber-950/80 text-amber-400 border-amber-800/80";
      case "FAILED":
        return "bg-rose-950/80 text-rose-400 border-rose-800/80";
      case "REVERSED":
        return "bg-blue-950/80 text-blue-400 border-blue-800/80";
      case "PENDING":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Financial Audit</span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-mono font-bold">PROVIDER-INDEPENDENT</span>
              </div>
              <h1 className="text-xl font-bold text-white">Payment Verification & Reconciliation</h1>
              <p className="text-xs text-slate-400 mt-0.5">Audit verified payments, unmatched deposits, state transitions & provider comparison results.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchReconciliations(true)}
              disabled={refreshing}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
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
                statusFilter === st ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Payment Ref, Provider TxID, User, Email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin mx-auto mb-2" />
                      Loading payment reconciliation records...
                    </td>
                  </tr>
                ) : reconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      No payment reconciliation records found.
                    </td>
                  </tr>
                ) : (
                  reconciliations.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{rec.paymentReference}</td>
                      <td className="p-4 text-slate-400">{rec.providerTransactionId || "N/A"}</td>
                      <td className="p-4 text-emerald-400 font-sans font-medium">{rec.provider}</td>
                      <td className="p-4 text-right font-bold text-white">
                        ₦{(rec.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-sans">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-slate-300">{rec.userEmail}</td>
                      <td className="p-4 text-slate-400">{rec.walletId}</td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(rec.date).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Verification & Comparison Result</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Payment Reference</span>
                <p className="text-white font-bold">{selectedRecord.paymentReference}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Provider TxID</span>
                <p className="text-white font-bold">{selectedRecord.providerTransactionId || "N/A"}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Provider</span>
                <p className="text-emerald-400 font-bold">{selectedRecord.provider}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Amount</span>
                <p className="text-white font-bold">₦{(selectedRecord.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(selectedRecord.status)}`}>
                  {selectedRecord.status}
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">User / Wallet</span>
                <p className="text-slate-300 truncate">{selectedRecord.userEmail}</p>
                <p className="text-[10px] text-slate-500">{selectedRecord.walletId}</p>
              </div>
            </div>

            {/* Comparison Details Section */}
            {selectedRecord.verificationResult && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parameter Comparison Audit</h4>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Amount Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.amountMatch ? "text-emerald-400" : "text-rose-400"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.amountMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Reference Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.referenceMatch ? "text-emerald-400" : "text-rose-400"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.referenceMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.accountMatch ? "text-emerald-400" : "text-rose-400"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.accountMatch ? "MATCHED" : "MISMATCH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status Match:</span>
                    <span className={`font-bold font-mono ${selectedRecord.verificationResult.comparisonDetails?.statusMatch ? "text-emerald-400" : "text-rose-400"}`}>
                      {selectedRecord.verificationResult.comparisonDetails?.statusMatch ? "MATCHED" : "UNVERIFIED"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Verification Summary</span>
                    <p className="mt-1 text-slate-200">{selectedRecord.verificationResult.message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
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
