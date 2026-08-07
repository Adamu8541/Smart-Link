/**
 * SmartLink Admin Panel — Sub-Route Placeholder Views (Module 2)
 */

import React from "react";
import {
  Users,
  Wallet,
  CheckSquare,
  Server,
  BarChart3,
  DollarSign,
  FileText,
  HelpCircle,
  Bell,
  Shield,
  Settings,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthService";

interface PlaceholderViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminUsersView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-2xl text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">User Governance Module</span>
            <h1 className="text-xl font-bold text-white">Users Directory & Management</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage registered accounts, roles, statuses, and custom claims.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-blue-400 shrink-0" />
        <span>Module 2 Shell Active — Full User Directory management will be added in Module 3. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminWalletView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Finance & Accounting</span>
            <h1 className="text-xl font-bold text-white">Wallet Management & Adjustments</h1>
            <p className="text-xs text-slate-400 mt-0.5">Review user float balances, funding histories, and manual debits/credits.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Module 2 Shell Active — Wallet funding & manual ledger adjustments module placeholder. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminProvidersView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-950 border border-teal-800 rounded-2xl text-teal-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">API Gateway Integration</span>
            <h1 className="text-xl font-bold text-white">API Providers & Health Gateways</h1>
            <p className="text-xs text-slate-400 mt-0.5">Monitor Monnify, OPay, NIMC, Prembly & VTU gateway uptime & keys.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-teal-400 shrink-0" />
        <span>Module 2 Shell Active — Provider routing & fallback rules. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminTransactionsView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Ledger & Audits</span>
            <h1 className="text-xl font-bold text-white">Transaction Ledger & Receipts</h1>
            <p className="text-xs text-slate-400 mt-0.5">Filter, audit and review live system transaction logs.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-purple-400 shrink-0" />
        <span>Module 2 Shell Active — Complete transaction table & audit receipts. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminRefundsView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-950 border border-amber-800 rounded-2xl text-amber-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Finance Operations</span>
            <h1 className="text-xl font-bold text-white">Refund Requests & Ledger Processing</h1>
            <p className="text-xs text-slate-400 mt-0.5">Review, approve, or decline user wallet refund claims.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-amber-400 shrink-0" />
        <span>Module 2 Shell Active — Refund ledger & dual-approval workflow. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminReportsView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-950 border border-rose-800 rounded-2xl text-rose-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Audit & Accounting</span>
            <h1 className="text-xl font-bold text-white">Settlement & Reconciliation Reports</h1>
            <p className="text-xs text-slate-400 mt-0.5">Export financial CSV/PDF reports for tax & audit compliance.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-rose-400 shrink-0" />
        <span>Module 2 Shell Active — Automated settlement reports generator. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminSupportView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950 border border-indigo-800 rounded-2xl text-indigo-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Customer Desk</span>
            <h1 className="text-xl font-bold text-white">Customer Support Tickets</h1>
            <p className="text-xs text-slate-400 mt-0.5">Respond to customer inquiries, complaints, and ticket escalations.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>Module 2 Shell Active — Support desk portal & ticket resolution engine. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminSecurityView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Security & Governance</span>
            <h1 className="text-xl font-bold text-white">Security & Audit Activity Logs</h1>
            <p className="text-xs text-slate-400 mt-0.5">Audit logins, session timeouts, unauthorized attempts, and admin actions.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-purple-400 shrink-0" />
        <span>Module 2 Shell Active — Complete activity audit logs viewer. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminSettingsView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-200">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Admin</span>
            <h1 className="text-xl font-bold text-white">Platform Configuration & Rates</h1>
            <p className="text-xs text-slate-400 mt-0.5">Configure system service charges, referral commission rates & API parameters.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-slate-300 shrink-0" />
        <span>Module 2 Shell Active — Platform charges & fee structure settings portal. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminSystemView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Infrastructure Health</span>
            <h1 className="text-xl font-bold text-white">System Health & Server Logs</h1>
            <p className="text-xs text-slate-400 mt-0.5">Monitor server CPU, memory, database latency, and API error spikes.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Module 2 Shell Active — Server telemetry & Cloud Run metrics monitor. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}

export function AdminNotificationsView({ session, onNavigate }: PlaceholderViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-2xl text-blue-400">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Operations</span>
            <h1 className="text-xl font-bold text-white">System Alerts & Notifications Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Review, dispatch, and broadcast administrative notifications.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/admin/dashboard")} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-blue-400 shrink-0" />
        <span>Module 2 Shell Active — System alert dispatch & notifications management. RBAC Route Guard: <strong className="text-emerald-400 font-mono">ENFORCED</strong>.</span>
      </div>
    </div>
  );
}
