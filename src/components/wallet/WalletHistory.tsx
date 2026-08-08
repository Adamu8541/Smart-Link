import React, { useState } from "react";
import { Search, Filter, History, X, Download, CheckCircle2, AlertCircle, Clock, RefreshCw, FileText } from "lucide-react";
import { WalletTransaction } from "../../types";
import { TransactionItem } from "./TransactionItem";
import { TransactionStatusBadge } from "./TransactionStatus";

interface WalletHistoryProps {
  transactions: WalletTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  limit?: number;
}

export const WalletHistory: React.FC<WalletHistoryProps> = ({
  transactions = [],
  isLoading = false,
  onRefresh,
  limit,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesQuery =
      !searchQuery ||
      (tx.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.serviceName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.provider || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "ALL" || (tx.status || "").toUpperCase() === selectedStatusFilter;

    return matchesQuery && matchesStatus;
  });

  const displayedTxs = limit ? filteredTxs.slice(0, limit) : filteredTxs;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transaction History</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Complete ledger of wallet debits, credits, and service payments
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ref or service..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {["ALL", "SUCCESS", "PENDING", "FAILED", "REVERSED"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatusFilter === status
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {status === "ALL" ? "All Statuses" : status}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : displayedTxs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <FileText className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No transactions found
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery || selectedStatusFilter !== "ALL"
              ? "Try adjusting your search query or filter settings."
              : "Your wallet transaction activity will appear here once you perform service transactions or fund your wallet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedTxs.map((tx) => (
            <TransactionItem
              key={tx.transactionId || tx.reference || Math.random()}
              transaction={tx}
              onSelect={(selected) => setSelectedTx(selected)}
            />
          ))}
        </div>
      )}

      {/* Digital Receipt Modal Dialog */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction Receipt</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official Smart Link Digital Proof of Transaction</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 text-xs border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <TransactionStatusBadge status={selectedTx.status} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Reference No.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{selectedTx.reference}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Service / Details</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                  {selectedTx.serviceName || selectedTx.description}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                  ₦{selectedTx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {selectedTx.walletBalanceBefore !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Balance Before</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    ₦{selectedTx.walletBalanceBefore.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {selectedTx.walletBalanceAfter !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Balance After</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    ₦{selectedTx.walletBalanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">
                  {new Date(selectedTx.createdAt).toLocaleString("en-NG")}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
