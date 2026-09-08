import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Headphones, ShieldAlert, Wallet, WifiOff } from "lucide-react";
import { VerificationErrorState } from "../../types/verification";

interface VerificationErrorProps {
  errorState: VerificationErrorState;
  onRetry?: () => void;
  onBack?: () => void;
  onContactSupport?: () => void;
}

export const VerificationError: React.FC<VerificationErrorProps> = ({
  errorState,
  onRetry,
  onBack,
  onContactSupport,
}) => {
  const getIcon = () => {
    switch (errorState.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT":
        return <WifiOff className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "WALLET_ERROR":
        return <Wallet className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "AUTH_ERROR":
        return <ShieldAlert className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      default:
        return <AlertTriangle className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    }
  };

  return (
    <div className="p-6 text-center space-y-6 max-w-md mx-auto animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/50 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 flex items-center justify-center shadow-xs">
        {getIcon()}
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/40 dark:text-[#9CA3AF]">
          Code: {errorState.code}
        </div>
        <h3 className="text-base font-bold text-[#111827] dark:text-white">
          {errorState.friendlyMessage}
        </h3>
        <p className="text-xs text-[#4B5563] dark:text-[#E5E7EB] max-w-sm mx-auto leading-relaxed">
          {errorState.details || errorState.message}
        </p>
      </div>

      <div className="p-3.5 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl border border-[#E5E7EB]/80 dark:border-[#4B5563]/80 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] text-left space-y-1">
        <p className="font-semibold text-[#4B5563] dark:text-[#E5E7EB]">Recommended Resolution:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {errorState.code === "WALLET_ERROR" ? (
            <li>Fund your SmartLink wallet or reduce requested quantity.</li>
          ) : errorState.code === "INVALID_INPUT" ? (
            <li>Check input parameters (e.g. 11 digits for NIN/BVN).</li>
          ) : (
            <li>Check network connection or try repeating the request.</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Query</span>
          </button>
        )}

        {onContactSupport && (
          <button
            type="button"
            onClick={onContactSupport}
            className="w-full sm:w-auto py-2.5 px-3 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Headphones className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>Support</span>
          </button>
        )}
      </div>
    </div>
  );
};
