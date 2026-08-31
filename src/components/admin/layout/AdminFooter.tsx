/**
 * SmartLink Admin Panel — Enterprise Footer Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React from "react";
import { Shield, Activity, Lock } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-[#0F2D5C] bg-white py-4 px-4 md:px-8 text-[11px] text-[#0F2D5C] flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#0F2D5C] font-semibold">
          <Shield className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>SmartLink Admin Portal</span>
        </div>

        <span className="hidden md:inline text-[#0F2D5C]">•</span>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>Sync Status: <strong className="text-[#0F2D5C] font-mono">100% Operational</strong></span>
        </div>

        <span className="hidden md:inline text-[#0F2D5C]">•</span>

        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#0F2D5C]" />
          <span>RBAC Security: <strong className="text-[#0F2D5C] font-mono">Enforced</strong></span>
        </div>
      </div>

      <div className="text-[#0F2D5C] font-mono text-[10px]">
        © 2026 SmartLink Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
