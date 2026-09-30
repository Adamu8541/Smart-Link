import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Headphones, ShieldAlert, Wallet, WifiOff } from "lucide-react";
import { VerificationErrorState } from "../../types/verification";

interface VerificationErrorProps {
  errorState?: VerificationErrorState;
  error?: VerificationErrorState;
  onRetry?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  onContactSupport?: () => void;
}

export const VerificationError: React.FC<VerificationErrorProps> = ({
  errorState,
  error,
  onRetry,
  onBack,
  onCancel,
  onContactSupport,
}) => {
  const activeError: VerificationErrorState = errorState || error || {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred during verification.",
    friendlyMessage: "Verification Error",
  };

  const handleBack = onBack || onCancel;

  const getIcon = () => {
    switch (activeError.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT":
        return <WifiOff className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "WALLET_ERROR":
        return <Wallet className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "PROVIDER_MERCHANT_LOW_BALANCE":
        return <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />;
      case "AUTH_ERROR":
        return <ShieldAlert className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      default:
        return <AlertTriangle className="h-7 w-7 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    }
  };

  const isMerchantLowBal = activeError.code === "PROVIDER_MERCHANT_LOW_BALANCE" || (activeError.details || "").includes("Prembley Gateway") || (activeError.message || "").includes("Merchant Account Low Balance");

  return (
    <div className="p-6 text-center space-y-6 max-w-md mx-auto animate-fade-in">
      <div className={`w-14 h-14 mx-auto rounded-2xl ${isMerchantLowBal ? "bg-amber-50 border-amber-200" : "bg-[#F5F7FA] border-[#E5E7EB]"} border flex items-center justify-center shadow-xs`}>
        {getIcon()}
      </div>

      <div className="space-y-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${isMerchantLowBal ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[#E5E7EB] text-[#0F2D5C]"}`}>
          {isMerchantLowBal ? "GATEWAY NOTICE" : `Code: ${activeError.code || "ERROR"}`}
        </div>
        <h3 className="text-base font-bold text-[#111827] dark:text-white">
          {activeError.friendlyMessage || activeError.message || "Verification Failed"}
        </h3>
        <p className="text-xs text-[#4B5563] dark:text-[#E5E7EB] max-w-sm mx-auto leading-relaxed">
          {activeError.details || activeError.message || "Please check your inputs and try again."}
        </p>
      </div>

      {isMerchantLowBal && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-[11px] text-emerald-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <span>🛡️</span> Your User Wallet Was Not Charged
          </p>
          <p className="text-emerald-700">
            Your personal SmartLink wallet balance is 100% safe. This notification refers to the external provider API account (Prembley) having zero balance.
          </p>
        </div>
      )}

      <div className="p-3.5 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl border border-[#E5E7EB]/80 dark:border-[#4B5563]/80 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] text-left space-y-1">
        <p className="font-semibold text-[#4B5563] dark:text-[#E5E7EB]">Recommended Resolution:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {activeError.code === "PROVIDER_MERCHANT_LOW_BALANCE" || isMerchantLowBal ? (
            <>
              <li>Your SmartLink account balance is safe and was not debited.</li>
              <li>Switch the Gateway Provider dropdown or configure an alternate provider in Admin Multi-Provider Matrix.</li>
              <li>Administrators can top up the upstream Prembley balance at prembly.com.</li>
            </>
          ) : activeError.code === "WALLET_ERROR" ? (
            <li>Fund your SmartLink wallet or reduce requested quantity.</li>
          ) : activeError.code === "SERVER_WARMING_UP" ? (
            <li>The server was briefly restarting. Click "Retry Query" to proceed immediately.</li>
          ) : activeError.code === "INVALID_INPUT" ? (
            <li>Check input parameters (e.g. 11 digits for NIN/BVN).</li>
          ) : activeError.code === "PORTAL_CONFIG_REQUIRED" ? (
            <li>Admin: Go to Admin Dashboard &rarr; API Providers to configure your LumiID, Identro, or VerifyNG portal API keys.</li>
          ) : (
            <li>Check network connection or try repeating the request.</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
        {handleBack && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-white" />
            <span>Go Back</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-[#0F2D5C]/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-white" />
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
