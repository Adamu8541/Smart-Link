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
    <div className="p-4 bg-[#0F2D5C]/80 border border-[#0F2D5C]/80 rounded-2xl text-[#9CA3AF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#9CA3AF] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-xs md:text-sm text-[#9CA3AF]">{title}</p>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="py-1.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#9CA3AF] font-semibold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer border border-[#0F2D5C]/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
}
