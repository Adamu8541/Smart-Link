import React from "react";
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { TransactionStatus as TxStatus } from "../../types";

interface TransactionStatusProps {
  status: TxStatus | "SUCCESS" | "PENDING" | "FAILED" | "REVERSED" | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const TransactionStatusBadge: React.FC<TransactionStatusProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const normalizedStatus = (status || "").toUpperCase();

  let colorClasses = "bg-[#E5E7EB] text-[#4B5563] dark:bg-[#111827] dark:text-[#E5E7EB] border-[#E5E7EB] dark:border-[#4B5563]";
  let label = normalizedStatus;
  let IconComponent = Clock;

  switch (normalizedStatus) {
    case "SUCCESS":
      colorClasses = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      label = "Successful";
      IconComponent = CheckCircle2;
      break;
    case "PENDING":
      colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      label = "Pending";
      IconComponent = Clock;
      break;
    case "FAILED":
      colorClasses = "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800";
      label = "Failed";
      IconComponent = AlertCircle;
      break;
    case "REVERSED":
      colorClasses = "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      label = "Reversed";
      IconComponent = RefreshCw;
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1 font-semibold"
      : size === "lg"
      ? "px-3 py-1.5 text-xs gap-2 font-bold"
      : "px-2.5 py-1 text-xs gap-1.5 font-semibold";

  const iconSizes = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses} transition-colors shrink-0`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};
