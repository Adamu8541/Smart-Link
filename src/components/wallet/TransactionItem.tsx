import React from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Wifi,
  FileCheck,
  Building2,
  GraduationCap,
  Zap,
  Tv,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { WalletTransaction } from "../../types";
import { TransactionStatusBadge } from "./TransactionStatus";

interface TransactionItemProps {
  transaction: WalletTransaction;
  onSelect?: (transaction: WalletTransaction) => void;
  compact?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onSelect,
  compact = false,
}) => {
  const isCredit =
    transaction.type === "WALLET_FUNDING" ||
    transaction.type === "COMMISSION_EARNING" ||
    (transaction.description || "").toLowerCase().includes("credit") ||
    (transaction.serviceName || "").toLowerCase().includes("credit") ||
    (transaction.serviceName || "").toLowerCase().includes("reversal") ||
    transaction.status === "REVERSED";

  // Pick service icon
  const getServiceIcon = () => {
    const name = (transaction.serviceName || transaction.description || transaction.type || "").toUpperCase();

    if (name.includes("AIRTIME")) return <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    if (name.includes("DATA")) return <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    if (name.includes("NIN") || name.includes("BVN") || name.includes("IDENTITY"))
      return <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    if (name.includes("CAC")) return <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    if (name.includes("WAEC") || name.includes("NECO") || name.includes("JAMB") || name.includes("EDUCATION"))
      return <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    if (name.includes("ELECTRICITY") || name.includes("POWER") || name.includes("UTILITY"))
      return <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    if (name.includes("TV") || name.includes("CABLE") || name.includes("DSTV") || name.includes("GOTV"))
      return <Tv className="h-4 w-4 text-pink-600 dark:text-pink-400" />;
    if (name.includes("REVERSAL")) return <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;

    return isCredit ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
    );
  };

  const formattedDate = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent";

  return (
    <div
      onClick={() => onSelect && onSelect(transaction)}
      className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all ${
        onSelect ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50 group-hover:scale-105 transition-transform">
          {getServiceIcon()}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {transaction.serviceName || transaction.description || "SmartLink Transaction"}
            </h4>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              #{transaction.reference || transaction.transactionId}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-right">
        <div>
          <div
            className={`text-xs font-bold font-mono ${
              isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
            }`}
          >
            {isCredit ? "+" : "-"}₦{transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </div>
          {!compact && (
            <div className="mt-0.5 flex justify-end">
              <TransactionStatusBadge status={transaction.status} size="sm" />
            </div>
          )}
        </div>

        {onSelect && (
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
        )}
      </div>
    </div>
  );
};
