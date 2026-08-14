/**
 * SmartLink Admin Panel — Enterprise Footer Component (Module 2)
 */

import React from "react";
import { Shield, Activity, Globe, Lock } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-4 px-4 md:px-8 text-[11px] text-slate-600 dark:text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          <span>SmartLink Admin Portal v2.4.0</span>
        </div>

        <span className="hidden md:inline text-slate-800">•</span>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>System Health: <strong className="text-emerald-400 font-mono">99.98% Operational</strong></span>
        </div>

        <span className="hidden md:inline text-slate-800">•</span>

        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-purple-400" />
          <span>RBAC Session: <strong className="text-slate-300 font-mono">AES-256 Encrypted</strong></span>
        </div>
      </div>

      <div className="text-slate-500 font-mono text-[10px]">
        © 2026 SmartLink Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
