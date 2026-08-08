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
    <div className="py-12 px-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-slate-400">
        <Icon className="h-8 w-8 text-blue-400" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
