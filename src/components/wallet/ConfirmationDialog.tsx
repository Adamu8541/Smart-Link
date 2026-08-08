import React from "react";
import { X, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
  recipientDetails?: string;
  amount: number;
  currentBalance: number;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  recipientDetails,
  amount,
  currentBalance,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const balanceAfter = Math.max(0, currentBalance - amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Payment</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review your order breakdown before wallet deduction
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 text-xs border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Service</span>
            <span className="font-bold text-slate-900 dark:text-white text-right max-w-[180px] truncate">
              {serviceName}
            </span>
          </div>

          {recipientDetails && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Recipient / Details</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                {recipientDetails}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Amount</span>
            <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
              ₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Balance Before:</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">
                ₦{currentBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Balance After:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ₦{balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Secured by SmartLink Central Wallet Engine</span>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Confirm Pay</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
