import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Wallet, ArrowRight, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { UserProfile } from "../../types";
import { formatNaira } from "../../utils/formatUtils";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin?: string) => void;
  serviceName: string;
  recipientDetails?: string;
  amount: number;
  currentBalance: number;
  isLoading?: boolean;
  currentUser?: UserProfile | null;
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
  currentUser,
}) => {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<UserProfile | null>(currentUser || null);

  useEffect(() => {
    if (currentUser) {
      setResolvedUser(currentUser);
    } else {
      try {
        const stored = localStorage.getItem("smartlink_user");
        if (stored) setResolvedUser(JSON.parse(stored));
      } catch {}
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setPinError(null);
      setIsVerifyingPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const safeAmount = Number(amount) || 0;
  const safeCurrentBalance = Number(currentBalance) || 0;
  const balanceAfter = Math.max(0, safeCurrentBalance - safeAmount);
  const isPinRequired = (resolvedUser?.pinRequiredForTransactions !== false) && Boolean(resolvedUser?.hasTransactionPin);

  const handleAuthorize = async () => {
    if (isPinRequired) {
      if (!pin || pin.length !== 4) {
        setPinError("Please enter your 4-digit transaction PIN.");
        return;
      }

      setIsVerifyingPin(true);
      setPinError(null);

      try {
        const res = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: resolvedUser?.uid || (resolvedUser as any)?.id,
            pin: pin.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setPinError(data.error || "Incorrect 4-digit transaction PIN. Please try again.");
          setIsVerifyingPin(false);
          return;
        }
      } catch (err: any) {
        setPinError("Failed to verify transaction PIN. Check connection.");
        setIsVerifyingPin(false);
        return;
      }
      setIsVerifyingPin(false);
    }

    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading || isVerifyingPin}
          className="absolute top-4 right-4 p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-1 pt-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center shadow-xs">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827] dark:text-white">Confirm Payment</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Review your order breakdown before wallet deduction
          </p>
        </div>

        <div className="p-3.5 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-2.5 text-xs border border-[#E5E7EB] dark:border-[#111827]">
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
              {formatNaira(safeAmount)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB]/60 dark:border-[#4B5563]/60 space-y-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF]">Balance Before:</span>
              <span className="font-mono text-[#4B5563] dark:text-[#9CA3AF]">
                {formatNaira(safeCurrentBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF]">Balance After:</span>
              <span className="font-mono font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
                {formatNaira(balanceAfter)}
              </span>
            </div>
          </div>
        </div>

        {/* PIN Section - Only shown when user has PIN requirement ON */}
        {isPinRequired ? (
          <div className="p-3 bg-slate-50 dark:bg-[#0A1A33] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#0F2D5C] dark:text-sky-400" />
                <span>Enter 4-Digit Transaction PIN</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">PIN Required</span>
            </div>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setPinError(null);
                }}
                placeholder="••••"
                className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pinError && (
              <p className="text-[11px] text-rose-500 font-medium text-center">{pinError}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium rounded-lg border border-emerald-200/80 dark:border-emerald-800/50">
            <Zap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Fast Checkout • Transaction PIN Bypassed</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 justify-center text-[10px] text-[#9CA3AF] dark:text-[#6B7280] font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
          <span>Secured by SmartLink Central Wallet Engine</span>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || isVerifyingPin}
            className="flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAuthorize}
            disabled={isLoading || isVerifyingPin || (isPinRequired && pin.length !== 4)}
            className="flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading || isVerifyingPin ? (
              <>
                <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                <span>{isVerifyingPin ? "Verifying PIN..." : "Processing..."}</span>
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
