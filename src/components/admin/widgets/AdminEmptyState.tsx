/**
 * SmartLink Admin Panel — Reusable Empty State Component (Module 2)
 */

import React from "react";
import { FolderOpen, RefreshCw } from "lucide-react";

interface AdminEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export default function AdminEmptyState({
  title = "No Records Found",
  description = "There are currently no items or transaction records matching your query.",
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}: AdminEmptyStateProps) {
  return (
    <div className="py-12 px-6 bg-[#111827]/50 border border-[#111827]/80 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-[#111827]/60 border border-[#4B5563]/50 rounded-2xl text-[#9CA3AF]">
        <Icon className="h-8 w-8 text-[#9CA3AF]" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="py-2 px-4 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
