/**
 * SmartLink Admin Panel — Enterprise Footer Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React from "react";
import { Shield, Activity, Lock } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-4 px-4 md:px-8 text-[11px] text-[#4B5563] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#111827] font-semibold">
          <Shield className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>SmartLink Admin Portal</span>
        </div>

        <span className="hidden md:inline text-[#D1D5DB]">•</span>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>Sync Status: <strong className="text-emerald-700 font-mono font-bold">100% Operational</strong></span>
        </div>

        <span className="hidden md:inline text-[#D1D5DB]">•</span>

        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>RBAC Security: <strong className="text-[#0F2D5C] font-mono font-bold">Enforced</strong></span>
        </div>
      </div>

      <div className="text-[#6B7280] font-mono text-[10px]">
        © 2026 SmartLink Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
