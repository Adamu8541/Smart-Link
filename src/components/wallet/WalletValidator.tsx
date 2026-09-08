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
      <div className={`p-4 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl border border-[#E5E7EB] dark:border-[#4B5563] flex items-center justify-center gap-2.5 text-xs text-[#4B5563] dark:text-[#E5E7EB] ${className}`}>
        <SmartLinkLogoMark size="xs" animating={true} />
        <span className="font-semibold">Validating Smart Link wallet balance...</span>
      </div>
    );
  }

  if (!validationResult) return null;

  const { valid, error, errorCode, availableBalance } = validationResult;

  if (valid) {
    return (
      <div className={`p-3.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 rounded-xl space-y-2 text-xs text-[#0F2D5C] dark:text-[#9CA3AF] ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#0F2D5C] dark:text-[#9CA3AF] shrink-0" />
            <span className="font-bold">Wallet Validated & Ready</span>
          </div>
          <span className="font-mono text-[11px] font-semibold bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 px-2 py-0.5 rounded-md">
            Available: ₦{(availableBalance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-[11px] text-[#0F2D5C] dark:text-[#9CA3AF]/90 leading-relaxed">
          Your wallet has sufficient funds (₦{itemPrice.toLocaleString()}) to complete this transaction securely.
        </p>
      </div>
    );
  }

  // Handle Insufficient Balance
  if (errorCode === "INSUFFICIENT_BALANCE") {
    const shortage = itemPrice - (availableBalance ?? 0);

    return (
      <div className={`p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 rounded-xl space-y-3 text-xs text-[#0F2D5C] dark:text-[#9CA3AF] ${className}`}>
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">Insufficient Wallet Balance</h4>
            <p className="text-[11px] leading-relaxed text-[#0F2D5C] dark:text-[#9CA3AF]">
              {error || "Your available wallet balance is insufficient for this purchase."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-white/80 dark:bg-[#111827]/60 rounded-lg border border-[#E5E7EB]/60 dark:border-[#0F2D5C]/40 text-[11px]">
          <div>
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Shortage Amount:</span>{" "}
            <strong className="font-mono text-[#0F2D5C] dark:text-[#9CA3AF] font-bold">
              ₦{shortage > 0 ? shortage.toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}
            </strong>
          </div>

          {onFundWallet && (
            <button
              type="button"
              onClick={onFundWallet}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:scale-98 text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
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
      <div className={`p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 rounded-xl flex items-start gap-2.5 text-xs text-[#0F2D5C] dark:text-[#9CA3AF] ${className}`}>
        <ShieldAlert className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">Wallet Account Suspended</h4>
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
      <div className={`p-4 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 rounded-xl flex items-start gap-2.5 text-xs text-[#0F2D5C] dark:text-[#9CA3AF] ${className}`}>
        <Wallet className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">Sign In Required</h4>
          <p className="mt-1 leading-relaxed text-[11px]">
            {error || "Please sign in to your Smart Link account to validate your wallet."}
          </p>
        </div>
      </div>
    );
  }

  // Generic / Network error fallback
  return (
    <div className={`p-4 bg-[#E5E7EB] dark:bg-[#111827]/80 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl flex items-start gap-2.5 text-xs text-[#4B5563] dark:text-[#E5E7EB] ${className}`}>
      <AlertCircle className="h-5 w-5 text-[#6B7280] shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-[#111827] dark:text-white">Validation Error</h4>
        <p className="mt-1 leading-relaxed text-[11px]">
          {error || "Unable to validate wallet balance. Please check your network connection."}
        </p>
      </div>
    </div>
  );
};
