/**
 * SmartLink Admin Panel — Dynamic Breadcrumbs Component (Module 2)
 */

import React from "react";
import { ChevronRight, Home, ShieldCheck } from "lucide-react";
import { AdminBreadcrumb } from "../../../types/adminLayoutTypes";

interface AdminBreadcrumbsProps {
  breadcrumbs: AdminBreadcrumb[];
  onNavigate: (path: string) => void;
}

export default function AdminBreadcrumbs({ breadcrumbs, onNavigate }: AdminBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium py-2 px-1 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        type="button"
        onClick={() => onNavigate("/admin/dashboard")}
        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-slate-400 shrink-0"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
        <span>SmartLink Admin</span>
      </button>

      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.label + idx}>
          <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
          {crumb.isCurrentPage ? (
            <span className="font-bold text-white bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg shrink-0">
              {crumb.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(crumb.path)}
              className="hover:text-blue-400 transition-colors cursor-pointer shrink-0"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
