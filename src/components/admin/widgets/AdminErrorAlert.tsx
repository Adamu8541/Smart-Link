/**
 * SmartLink Admin Panel — Reusable Error Alert Component (Module 2)
 */

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AdminErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function AdminErrorAlert({
  title = "System Request Failed",
  message,
  onRetry,
}: AdminErrorAlertProps) {
  return (
    <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-xs md:text-sm text-rose-100">{title}</p>
          <p className="text-xs text-rose-300 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="py-1.5 px-3 bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer border border-rose-700/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
}
