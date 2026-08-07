import React, { useState } from "react";
import { Eye, EyeOff, Wallet as WalletIcon, ShieldCheck, RefreshCw } from "lucide-react";

interface WalletBalanceProps {
  balance: number;
  heldBalance?: number;
  currency?: string;
  status?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  showToggle?: boolean;
  size?: "sm" | "md" | "lg";
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  heldBalance = 0,
  currency = "NGN",
  status = "ACTIVE",
  isLoading = false,
  onRefresh,
  showToggle = true,
  size = "md",
}) => {
  const [hidden, setHidden] = useState(false);

  const availableBalance = Math.max(0, balance - heldBalance);
  const symbol = currency === "NGN" ? "₦" : "$";

  const sizeClasses = {
    sm: "text-lg font-bold",
    md: "text-2xl font-extrabold",
    lg: "text-3xl sm:text-4xl font-black",
  }[size];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <WalletIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>Available Wallet Balance</span>

        {showToggle && (
          <button
            type="button"
            onClick={() => setHidden(!hidden)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title={hidden ? "Show Balance" : "Hide Balance"}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer ${
              isLoading ? "animate-spin text-blue-500" : ""
            }`}
            title="Refresh balance"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`${sizeClasses} text-slate-900 dark:text-white font-mono tracking-tight`}>
          {hidden
            ? "••••••••"
            : `${symbol}${availableBalance.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
        </span>

        {status === "ACTIVE" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
            {status}
          </span>
        )}
      </div>

      {heldBalance > 0 && !hidden && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          Held in escrow: {symbol}
          {heldBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};
