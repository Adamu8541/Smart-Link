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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center shadow-xs">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827] dark:text-white">Confirm Payment</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Review your order breakdown before wallet deduction
          </p>
        </div>

        <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-3 text-xs border border-[#E5E7EB] dark:border-[#111827]">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Service</span>
            <span className="font-bold text-[#111827] dark:text-white text-right max-w-[180px] truncate">
              {serviceName}
            </span>
          </div>

          {recipientDetails && (
            <div className="flex justify-between items-center">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Recipient / Details</span>
              <span className="font-medium text-[#111827] dark:text-[#E5E7EB] text-right max-w-[180px] truncate">
                {recipientDetails}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB] dark:border-[#4B5563]">
            <span className="text-[#6B7280] dark:text-[#9CA3AF] font-semibold">Total Amount</span>
            <span className="font-mono text-sm font-extrabold text-[#0F2D5C] dark:text-[#9CA3AF]">
              ₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB]/60 dark:border-[#4B5563]/60 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF]">Balance Before:</span>
              <span className="font-mono text-[#4B5563] dark:text-[#9CA3AF]">
                ₦{currentBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF]">Balance After:</span>
              <span className="font-mono font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
                ₦{balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-center text-[10px] text-[#9CA3AF] dark:text-[#6B7280] font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
          <span>Secured by SmartLink Central Wallet Engine</span>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
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
