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
          <div className="p-2 rounded-xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF]">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] dark:text-white">Transaction History</h3>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              Complete ledger of wallet debits, credits, and service payments
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ref or service..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB]"
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
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
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
              className="h-16 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] animate-pulse"
            />
          ))}
        </div>
      ) : displayedTxs.length === 0 ? (
        <div className="p-8 text-center bg-[#F5F7FA] dark:bg-[#111827]/40 rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#111827] space-y-2">
          <FileText className="h-8 w-8 text-[#9CA3AF] mx-auto" />
          <p className="text-xs font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
            No transactions found
          </p>
          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mx-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">Transaction Receipt</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Official Smart Link Digital Proof of Transaction</p>
            </div>

            <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-3 text-xs border border-[#E5E7EB] dark:border-[#111827]">
              <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB] dark:border-[#4B5563]">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Status</span>
                <TransactionStatusBadge status={selectedTx.status} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Reference No.</span>
                <span className="font-mono font-bold text-[#111827] dark:text-white">#{selectedTx.reference}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Service / Details</span>
                <span className="font-semibold text-[#111827] dark:text-white text-right max-w-[200px] truncate">
                  {selectedTx.serviceName || selectedTx.description}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Amount Paid</span>
                <span className="font-mono font-extrabold text-[#111827] dark:text-white text-sm">
                  ₦{selectedTx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {selectedTx.walletBalanceBefore !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Balance Before</span>
                  <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">
                    ₦{selectedTx.walletBalanceBefore.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {selectedTx.walletBalanceAfter !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Balance After</span>
                  <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">
                    ₦{selectedTx.walletBalanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB] dark:border-[#4B5563] text-[11px]">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Date & Time</span>
                <span className="text-[#4B5563] dark:text-[#E5E7EB] font-mono">
                  {new Date(selectedTx.createdAt).toLocaleString("en-NG")}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
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
