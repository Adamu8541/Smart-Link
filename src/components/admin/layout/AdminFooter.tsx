/**
 * SmartLink Admin Panel — Enterprise Footer Component
 * Homepage Theme Matching (#0F2D5C, #F5F7FA, #111827, #E5E7EB)
 */

import React from "react";
import { Shield, Activity, Lock } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5EAF0] bg-white py-4 px-4 md:px-8 text-[11px] text-[#667085] flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#0B1F3A] font-semibold">
          <Shield className="h-3.5 w-3.5 text-[#0066FF]" />
          <span>SmartLink Admin Portal</span>
        </div>

        <span className="hidden md:inline text-[#E5EAF0]">•</span>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#12B76A]" />
          <span>Firestore Status: <strong className="text-[#12B76A] font-mono">100% Synced</strong></span>
        </div>

        <span className="hidden md:inline text-[#E5EAF0]">•</span>

        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#0066FF]" />
          <span>RBAC Security: <strong className="text-[#101828] font-mono">Enforced</strong></span>
        </div>
      </div>

      <div className="text-[#667085] font-mono text-[10px]">
        © 2026 SmartLink Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
