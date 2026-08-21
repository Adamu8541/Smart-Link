/**
 * SmartLink Admin Panel — Dynamic Breadcrumbs Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { AdminBreadcrumb } from "../../../types/adminLayoutTypes";

interface AdminBreadcrumbsProps {
  breadcrumbs: AdminBreadcrumb[];
  onNavigate: (path: string) => void;
}

export default function AdminBreadcrumbs({ breadcrumbs, onNavigate }: AdminBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-xs text-[#667085] font-medium py-1 px-1 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        type="button"
        onClick={() => onNavigate("/admin/dashboard")}
        className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors cursor-pointer text-[#667085] shrink-0 font-semibold"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#0066FF]" />
        <span>SmartLink Admin</span>
      </button>

      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.label + idx}>
          <ChevronRight className="h-3 w-3 text-[#667085] shrink-0" />
          {crumb.isCurrentPage ? (
            <span className="font-bold text-[#0066FF] bg-[#EAF3FF] border border-[#E5EAF0] px-2.5 py-0.5 rounded-lg shrink-0">
              {crumb.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(crumb.path)}
              className="hover:text-[#0066FF] transition-colors cursor-pointer shrink-0 font-medium"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
