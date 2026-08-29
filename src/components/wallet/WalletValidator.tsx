import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Wallet, Plus, ShieldAlert } from "lucide-react";
import { WalletValidationResult, WalletErrorCode } from "../../types";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

interface WalletValidatorProps {
  validationResult: WalletValidationResult | null;
  itemPrice: number;
  isValidating?: boolean;
  onFundWallet?: () => void;
  className?: string;
}

export const WalletValidator: React.FC<WalletValidatorProps> = ({
  validationResult,
  itemPrice,
  isValidating = false,
  onFundWallet,
  className = "",
}) => {
  if (isValidating) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 ${className}`}>
        <SmartLinkLogoMark size="xs" animating={true} />
        <span className="font-semibold">Validating Smart Link wallet balance...</span>
      </div>
    );
  }

  if (!validationResult) return null;

  const { valid, error, errorCode, availableBalance } = validationResult;

  if (valid) {
    return (
      <div className={`p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-xs text-emerald-800 dark:text-emerald-300 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">Wallet Validated & Ready</span>
          </div>
          <span className="font-mono text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
            Available: ₦{(availableBalance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
          Your wallet has sufficient funds (₦{itemPrice.toLocaleString()}) to complete this transaction securely.
        </p>
      </div>
    );
  }

  // Handle Insufficient Balance
  if (errorCode === "INSUFFICIENT_BALANCE") {
    const shortage = itemPrice - (availableBalance ?? 0);

    return (
      <div className={`p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-3 text-xs text-rose-800 dark:text-rose-300 ${className}`}>
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 dark:text-rose-200">Insufficient Wallet Balance</h4>
            <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              {error || "Your available wallet balance is insufficient for this purchase."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-rose-200/60 dark:border-rose-800/40 text-[11px]">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Shortage Amount:</span>{" "}
            <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">
              ₦{shortage > 0 ? shortage.toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}
            </strong>
          </div>

          {onFundWallet && (
            <button
              type="button"
              onClick={onFundWallet}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Fund Wallet</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Handle Wallet Suspended / Frozen
  if (errorCode === "WALLET_SUSPENDED") {
    return (
      <div className={`p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 ${className}`}>
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-200">Wallet Account Suspended</h4>
          <p className="mt-1 leading-relaxed text-[11px]">
            {error || "Your wallet status is not active. Please contact customer support for assistance."}
          </p>
        </div>
      </div>
    );
  }

  // Handle Wallet Not Found / Auth Required
  if (errorCode === "WALLET_NOT_FOUND") {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 ${className}`}>
        <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-200">Sign In Required</h4>
          <p className="mt-1 leading-relaxed text-[11px]">
            {error || "Please sign in to your Smart Link account to validate your wallet."}
          </p>
        </div>
      </div>
    );
  }

  // Generic / Network error fallback
  return (
    <div className={`p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 ${className}`}>
      <AlertCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white">Validation Error</h4>
        <p className="mt-1 leading-relaxed text-[11px]">
          {error || "Unable to validate wallet balance. Please check your network connection."}
        </p>
      </div>
    </div>
  );
};
