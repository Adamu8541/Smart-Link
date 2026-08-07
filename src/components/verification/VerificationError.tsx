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
        return <WifiOff className="h-7 w-7 text-rose-600 dark:text-rose-400" />;
      case "WALLET_ERROR":
        return <Wallet className="h-7 w-7 text-amber-600 dark:text-amber-400" />;
      case "AUTH_ERROR":
        return <ShieldAlert className="h-7 w-7 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertTriangle className="h-7 w-7 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="p-6 text-center space-y-6 max-w-md mx-auto animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shadow-xs">
        {getIcon()}
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          Code: {errorState.code}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {errorState.friendlyMessage}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
          {errorState.details || errorState.message}
        </p>
      </div>

      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 text-left space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">Recommended Resolution:</p>
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
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Query</span>
          </button>
        )}

        {onContactSupport && (
          <button
            type="button"
            onClick={onContactSupport}
            className="w-full sm:w-auto py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Headphones className="h-3.5 w-3.5 text-blue-500" />
            <span>Support</span>
          </button>
        )}
      </div>
    </div>
  );
};
