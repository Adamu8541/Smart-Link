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

    if (name.includes("AIRTIME")) return <Smartphone className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("DATA")) return <Wifi className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("NIN") || name.includes("BVN") || name.includes("IDENTITY"))
      return <FileCheck className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("CAC")) return <Building2 className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("WAEC") || name.includes("NECO") || name.includes("JAMB") || name.includes("EDUCATION"))
      return <GraduationCap className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("ELECTRICITY") || name.includes("POWER") || name.includes("UTILITY"))
      return <Zap className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    if (name.includes("TV") || name.includes("CABLE") || name.includes("DSTV") || name.includes("GOTV"))
      return <Tv className="h-4 w-4 text-[#0F2D5C] dark:text-[#6B7280]" />;
    if (name.includes("REVERSAL")) return <RefreshCw className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />;

    return isCredit ? (
      <ArrowDownLeft className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF]" />
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
      className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#111827] bg-[#FFFFFF] dark:bg-[#111827] hover:bg-[#F5F7FA] dark:hover:bg-[#111827] transition-all ${
        onSelect ? "cursor-pointer hover:border-[#E5E7EB] dark:hover:border-[#4B5563] shadow-2xs" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] flex items-center justify-center shrink-0 border border-[#E5E7EB] dark:border-[#4B5563] group-hover:scale-105 transition-transform">
          {getServiceIcon()}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#111827] dark:text-[#FFFFFF] truncate">
              {transaction.serviceName || transaction.description || "SmartLink Transaction"}
            </h4>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="font-mono text-[10px] text-[#9CA3AF] dark:text-[#6B7280]">
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
              isCredit ? "text-[#0F2D5C] dark:text-[#9CA3AF]" : "text-[#111827] dark:text-[#FFFFFF]"
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
          <ChevronRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#4B5563] dark:group-hover:text-[#E5E7EB] transition-colors shrink-0" />
        )}
      </div>
    </div>
  );
};
