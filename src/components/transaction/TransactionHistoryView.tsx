import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ShieldCheck
} from "lucide-react";
import { TransactionDocument, TransactionStatusType, ReceiptDocument } from "../../types/database";
import { TransactionEngine, TransactionFilterParams } from "../../services/transactionEngine";
import { TransactionReceiptModal } from "../receipt/TransactionReceiptModal";

interface TransactionHistoryViewProps {
  userId?: string;
  isAdmin?: boolean;
  adminUid?: string;
  isDarkMode?: boolean;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  userId,
  isAdmin = false,
  adminUid,
  isDarkMode
}) => {
  const [transactions, setTransactions] = useState<TransactionDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<TransactionStatusType | "ALL">("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [serviceType, setServiceType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Receipt Modal State
  const [selectedTxn, setSelectedTxn] = useState<TransactionDocument | null>(null);
  const [receipt, setReceipt] = useState<ReceiptDocument | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const filter: TransactionFilterParams = {
      userId,
      searchQuery,
      status,
      serviceType: serviceType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize
    };

    const res = await TransactionEngine.getHistory(filter);
    
    // Client-side provider filtering if set
    let filteredList = res.transactions;
    if (providerFilter && providerFilter !== "ALL") {
      filteredList = filteredList.filter((t: any) =>
        (t.provider || t.gateway || "").toUpperCase().includes(providerFilter.toUpperCase())
      );
    }

    setTransactions(filteredList);
    setTotal(res.total);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const queryParams = new URLSearchParams({
      userId: userId || "",
      searchQuery,
      status,
      provider: providerFilter,
      startDate,
      endDate,
      format: "csv"
    });
    window.open(`/api/transactions/history?${queryParams.toString()}`, "_blank");
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, page, status, serviceType, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleOpenReceipt = async (txn: TransactionDocument) => {
    setSelectedTxn(txn);
    if (txn.receiptId) {
      const rec = await TransactionEngine.getReceipt(txn.receiptId);
      setReceipt(rec);
    } else {
      setReceipt(null);
    }
    setIsReceiptOpen(true);
  };

  const handleRefund = async (txn: TransactionDocument) => {
    if (!window.confirm(`Are you sure you want to refund transaction ${txn.smartlinkReference}?`)) return;
    const res = await TransactionEngine.refundTransaction({
      transactionId: txn.transactionId,
      adminUid,
      reason: "Admin triggered manual refund"
    });
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
    fetchHistory();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 text-left">
      {/* Header & Filter Controls */}
      <div className="bg-white  p-6 rounded-2xl border border-[#E5E7EB]  shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]  flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0F2D5C]" />
              Transaction Ledger & History
            </h2>
            <p className="text-xs text-[#6B7280]  mt-0.5">
              Comprehensive real-time ledger of all VTU, Identity, and Wallet transactions.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-[#F5F7FA]  border border-[#E5E7EB]  text-[#111827]  text-xs font-semibold hover:bg-[#F5F7FA]  flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-[#F3F4F6]  border border-[#E5E7EB]  text-[#4B5563]  text-xs font-semibold hover:bg-[#E5E7EB]  flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            <button
              onClick={() => fetchHistory()}
              className="px-3.5 py-2 rounded-xl bg-[#F5F7FA]  border border-[#E5E7EB]  text-[#0F2D5C]  text-xs font-semibold hover:bg-[#F5F7FA]  flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F2D5C]" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 bg-[#F5F7FA]  border border-[#E5E7EB]  text-[#111827]  rounded-xl text-xs font-medium">
            {actionMessage}
          </div>
        )}

        {/* Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search reference, recipient, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA]  border border-[#E5E7EB]  rounded-xl text-xs text-[#111827]  focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
            />
          </div>

          {/* Provider Select */}
          <div>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F5F7FA]  border border-[#E5E7EB]  rounded-xl text-xs text-[#111827]  focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
            >
              <option value="ALL">All Providers</option>
              <option value="GATEWAY">Payment Gateway</option>
              <option value="DYNAMIC">Dynamic Bank</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F5F7FA]  border border-[#E5E7EB]  rounded-xl text-xs text-[#111827]  focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7FA]  border border-[#E5E7EB]  rounded-xl text-xs text-[#111827]  focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
            />
          </div>

          {/* Filter Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white  rounded-2xl border border-[#E5E7EB]  shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA]  border-b border-[#E5E7EB]  text-[11px] font-bold text-[#6B7280]  uppercase tracking-wider">
                <th className="py-3 px-4">Type / Service</th>
                <th className="py-3 px-4">SmartLink Ref</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9CA3AF]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2D5C]" />
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9CA3AF]">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isCredit = txn.service === "WALLET_FUNDING";
                  return (
                    <tr
                      key={txn.transactionId}
                      className="hover:bg-[#F5F7FA]/80 :bg-[#F5F7FA]/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#111827] ">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit
                                ? "bg-[#F5F7FA] text-[#111827]  "
                                : "bg-[#F5F7FA] text-[#0F2D5C]  "
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#111827] ">
                              {txn.service}
                            </div>
                            <div className="text-[11px] text-[#9CA3AF]">
                              {txn.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#4B5563] ">
                        {txn.smartlinkReference}
                      </td>

                      <td className="py-3.5 px-4 text-[#4B5563] ">
                        {txn.recipient || "Self"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#111827] ">
                        ₦{(txn.amount + (txn.charge || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4">
                        {txn.status === "SUCCESSFUL" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Success
                          </span>
                        )}
                        {txn.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Pending
                          </span>
                        )}
                        {txn.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                            Failed
                          </span>
                        )}
                        {txn.status === "REFUNDED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            Refunded
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280]  text-[11px]">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReceipt(txn)}
                            className="px-2.5 py-1 rounded-lg bg-[#F3F4F6]  hover:bg-[#E5E7EB]  text-[#4B5563]  text-[11px] font-medium transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0F2D5C]" />
                            Receipt
                          </button>
                          {isAdmin && txn.status === "FAILED" && (
                            <button
                              onClick={() => handleRefund(txn)}
                              className="px-2.5 py-1 rounded-lg bg-[#F5F7FA]  hover:bg-[#F5F7FA] text-[#111827]  text-[11px] font-medium transition-colors"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#F5F7FA]  border-t border-[#E5E7EB]  flex items-center justify-between text-xs text-[#6B7280]">
          <div>
            Showing <span className="font-semibold text-[#111827] ">{transactions.length}</span> of{" "}
            <span className="font-semibold text-[#111827] ">{total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-[#E5E7EB]  hover:bg-[#F3F4F6] :bg-[#F5F7FA] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#4B5563] ">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-[#E5E7EB]  hover:bg-[#F3F4F6] :bg-[#F5F7FA] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <TransactionReceiptModal
        receipt={receipt}
        transaction={selectedTxn}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
