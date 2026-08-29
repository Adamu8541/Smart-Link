/**
 * SmartLink Admin Panel — Module 10: Security Center & Audit Management View
 * Full-featured Security Dashboard, Audit Ledger, Login History, Account Governance,
 * Blocked Devices & IPs, Threat Detection, Session Management, Alerts & Test Suite.
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Globe,
  Laptop,
  Key,
  AlertTriangle,
  Activity,
  FileText,
  Download,
  Search,
  RefreshCw,
  UserX,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  ArrowLeft,
  Play,
  Send,
  Eye,
  Sliders,
  Filter,
  Check,
  Zap,
  Radio,
  Trash2
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface AdminSecurityViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
  subRoute?: string;
}

export function AdminSecurityView({ session, onNavigate, subRoute = "" }: AdminSecurityViewProps) {
  // Determine active sub-tab from subRoute or prop
  const getInitialTab = () => {
    if (subRoute.includes("audit-logs")) return "AUDIT_LOGS";
    if (subRoute.includes("login-history")) return "LOGIN_HISTORY";
    if (subRoute.includes("blocked-users")) return "ACCOUNT_LOCKS";
    if (subRoute.includes("blocked-devices")) return "BLOCKED_DEVICES";
    if (subRoute.includes("blocked-ip")) return "BLOCKED_IPS";
    if (subRoute.includes("suspicious-activity")) return "SUSPICIOUS";
    if (subRoute.includes("session-management")) return "SESSIONS";
    if (subRoute.includes("alerts")) return "ALERTS";
    return "OVERVIEW";
  };

  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "AUDIT_LOGS" | "LOGIN_HISTORY" | "ACCOUNT_LOCKS" | "BLOCKED_DEVICES" | "BLOCKED_IPS" | "SUSPICIOUS" | "SESSIONS" | "ALERTS" | "TEST_SUITE"
  >(getInitialTab());

  // Data State
  const [loading, setLoading] = useState(false);
  const [dashMetrics, setDashMetrics] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [accountLocks, setAccountLocks] = useState<any[]>([]);
  const [blockedDevices, setBlockedDevices] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any>(null);

  // Filters & Inputs
  const [auditSearch, setAuditSearch] = useState("");
  const [auditModuleFilter, setAuditModuleFilter] = useState("ALL");
  const [auditSeverityFilter, setAuditSeverityFilter] = useState("ALL");

  const [loginSearch, setLoginSearch] = useState("");
  const [loginStatusFilter, setLoginStatusFilter] = useState("ALL");

  // Modals / Actions
  const [showBlockIpModal, setShowBlockIpModal] = useState(false);
  const [blockIpForm, setBlockIpForm] = useState({ ipAddress: "", country: "Nigeria", reason: "" });

  const [showBlockDeviceModal, setShowBlockDeviceModal] = useState(false);
  const [blockDeviceForm, setBlockDeviceForm] = useState({ deviceId: "", userEmail: "", deviceName: "", reason: "" });

  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [alertNoteText, setAlertNoteText] = useState("");

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Synchronize subRoute updates
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [subRoute]);

  // Load all security data
  const fetchAllData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [dashRes, lhRes, sessRes, locksRes, bdevRes, bipRes, suspRes, alertRes, audRes] = await Promise.all([
        fetch("/api/admin/security/dashboard"),
        fetch("/api/admin/security/login-history"),
        fetch("/api/admin/security/active-sessions"),
        fetch("/api/admin/security/account-locks"),
        fetch("/api/admin/security/blocked-devices"),
        fetch("/api/admin/security/blocked-ips"),
        fetch("/api/admin/security/suspicious-activity"),
        fetch("/api/admin/security/alerts"),
        fetch("/api/admin/security/audit-logs"),
      ]);

      const dashData = await dashRes.json();
      const lhData = await lhRes.json();
      const sessData = await sessRes.json();
      const locksData = await locksRes.json();
      const bdevData = await bdevRes.json();
      const bipData = await bipRes.json();
      const suspData = await suspRes.json();
      const alertData = await alertRes.json();
      const audData = await audRes.json();

      if (dashData.success) setDashMetrics(dashData);
      if (lhData.success) setLoginHistory(lhData.history || []);
      if (sessData.success) setActiveSessions(sessData.sessions || []);
      if (locksData.success) setAccountLocks(locksData.locks || []);
      if (bdevData.success) setBlockedDevices(bdevData.blockedDevices || []);
      if (bipData.success) setBlockedIps(bipData.blockedIps || []);
      if (suspData.success) setSuspiciousActivities(suspData.activities || []);
      if (alertData.success) setSecurityAlerts(alertData.alerts || []);
      if (audData.success) setAuditLogs(audData.logs || []);
    } catch (err: any) {
      console.error("Failed to load security data:", err);
      setActionError("Failed to fetch Security Center records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helper for flash feedback
  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
    fetchAllData();
  };

  // Actions
  const handleTerminateSession = async (sessionId: string, userEmail?: string, terminateAll: boolean = false) => {
    try {
      const res = await fetch("/api/admin/security/sessions/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userEmail,
          terminateAll,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to terminate session.");
    }
  };

  const handleAccountLockAction = async (lockId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/security/account-locks/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lockId,
          action,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to execute account lock governance action.");
    }
  };

  const handleBlockIpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIpForm.ipAddress || !blockIpForm.reason) return;
    try {
      const res = await fetch("/api/admin/security/blocked-ips/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blockIpForm,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowBlockIpModal(false);
        setBlockIpForm({ ipAddress: "", country: "Nigeria", reason: "" });
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to block IP Address.");
    }
  };

  const handleUnblockIp = async (ipAddress: string) => {
    try {
      const res = await fetch("/api/admin/security/blocked-ips/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress, adminEmail: session.email }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to unblock IP.");
    }
  };

  const handleBlockDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDeviceForm.deviceId || !blockDeviceForm.reason) return;
    try {
      const res = await fetch("/api/admin/security/blocked-devices/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blockDeviceForm,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowBlockDeviceModal(false);
        setBlockDeviceForm({ deviceId: "", userEmail: "", deviceName: "", reason: "" });
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to block device.");
    }
  };

  const handleUnblockDevice = async (deviceId: string) => {
    try {
      const res = await fetch("/api/admin/security/blocked-devices/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, adminEmail: session.email }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to unblock device.");
    }
  };

  const handleResolveSuspicious = async (activityId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/security/suspicious-activity/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          status,
          resolutionNotes: `Resolved by ${session.email}`,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to update suspicious activity status.");
    }
  };

  const handleAlertAction = async (alertId: string, action: string, noteText: string = "") => {
    try {
      const res = await fetch("/api/admin/security/alerts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          action,
          note: noteText,
          adminEmail: session.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertNoteText("");
        if (selectedAlert && selectedAlert.id === alertId) {
          setSelectedAlert(data.alert);
        }
        triggerSuccess(data.message);
      } else {
        setActionError(data.message);
      }
    } catch (err) {
      setActionError("Failed to update security alert.");
    }
  };

  const handleRunSelfTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/module10/self-test");
      const data = await res.json();
      setTestResults(data);
      triggerSuccess("Module 10 Self-Test Suite completed successfully!");
    } catch (err) {
      setActionError("Failed to execute Module 10 self-tests.");
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) return;
    const headers = ["Log ID", "Action", "User Email", "Admin", "Module", "Timestamp", "IP Address", "Device", "Severity", "Details"];
    const rows = auditLogs.map((l: any) => [
      l.id,
      l.action,
      l.user || "N/A",
      l.administrator || "N/A",
      l.module || "General",
      new Date(l.timestamp).toLocaleString(),
      l.ipAddress || "N/A",
      l.device || "N/A",
      l.severity || "Low",
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartlink_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((l: any) => {
    const q = auditSearch.toLowerCase();
    const matchesSearch =
      !q ||
      l.action.toLowerCase().includes(q) ||
      (l.user && l.user.toLowerCase().includes(q)) ||
      (l.administrator && l.administrator.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q));

    const matchesModule = auditModuleFilter === "ALL" || l.module === auditModuleFilter;
    const matchesSeverity = auditSeverityFilter === "ALL" || l.severity === auditSeverityFilter;

    return matchesSearch && matchesModule && matchesSeverity;
  });

  // Filter login history
  const filteredLoginHistory = loginHistory.filter((lh: any) => {
    const q = loginSearch.toLowerCase();
    const matchesSearch =
      !q ||
      lh.userEmail.toLowerCase().includes(q) ||
      lh.ipAddress.includes(q) ||
      lh.device.toLowerCase().includes(q) ||
      (lh.location && lh.location.toLowerCase().includes(q));

    const matchesStatus = loginStatusFilter === "ALL" || lh.status === loginStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const metrics = dashMetrics?.metrics || {};

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950/80 border border-purple-800 rounded-2xl text-purple-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/60">
                Module 10 • Security Architecture
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> RBAC Enforced
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">Security Center & System Logs</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time security telemetry, login history audit, session termination, threat mitigation & tamper-proof audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAllData}
            disabled={loading}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 cursor-pointer transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Telemetry
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/admin/dashboard")}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition border border-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </button>
        </div>
      </div>

      {/* Notifications / Flash Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center gap-3 text-xs text-rose-300 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar">
        {[
          { id: "OVERVIEW", label: "Security Dashboard", icon: Activity, badge: null, path: "/admin/security" },
          { id: "AUDIT_LOGS", label: "Audit Logs", icon: FileText, badge: auditLogs.length, path: "/admin/security/audit-logs" },
          { id: "LOGIN_HISTORY", label: "Login History", icon: Clock, badge: loginHistory.length, path: "/admin/security/login-history" },
          { id: "ACCOUNT_LOCKS", label: "Account Governance", icon: Lock, badge: accountLocks.filter((l) => l.isLocked).length, path: "/admin/security/blocked-users" },
          { id: "BLOCKED_DEVICES", label: "Blocked Devices", icon: Laptop, badge: blockedDevices.length, path: "/admin/security/blocked-devices" },
          { id: "BLOCKED_IPS", label: "Blocked IPs", icon: Globe, badge: blockedIps.length, path: "/admin/security/blocked-ip" },
          { id: "SUSPICIOUS", label: "Suspicious Activity", icon: AlertTriangle, badge: suspiciousActivities.filter((a) => a.status !== "Resolved").length, path: "/admin/security/suspicious-activity" },
          { id: "SESSIONS", label: "Active Sessions", icon: Key, badge: activeSessions.length, path: "/admin/security/session-management" },
          { id: "ALERTS", label: "Security Alerts", icon: ShieldAlert, badge: securityAlerts.filter((a) => a.severity === "Critical" && a.status !== "Resolved").length, path: "/admin/security/alerts" },
          { id: "TEST_SUITE", label: "Module 10 Self-Test", icon: Play, badge: "TEST", path: "/admin/security/test" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                onNavigate(tab.path);
              }}
              className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-950/50"
                  : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-purple-400 border border-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: SECURITY DASHBOARD OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Failed Logins Today</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.failedLoginsToday ?? 0}</div>
              <div className="text-[10px] text-slate-500">Recorded authentication failures</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Successful Logins Today</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.successfulLoginsToday ?? 0}</div>
              <div className="text-[10px] text-emerald-400">Verified identity sessions</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Locked Accounts</span>
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{metrics.lockedAccounts ?? 0}</div>
              <div className="text-[10px] text-slate-500">Governance locks triggered</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Blocked IPs & Devices</span>
                <Globe className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {(metrics.blockedIps ?? 0) + (metrics.blockedDevices ?? 0)}
              </div>
              <div className="text-[10px] text-purple-400">
                {metrics.blockedIps ?? 0} IPs • {metrics.blockedDevices ?? 0} Devices
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Sessions</span>
                <Key className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.activeSessions ?? 0}</div>
              <div className="text-[10px] text-slate-500">Live tokens monitored</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Suspicious Activities</span>
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400">{metrics.suspiciousActivities ?? 0}</div>
              <div className="text-[10px] text-slate-500">Anomaly engine flags</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Critical Security Alerts</span>
                <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-rose-400">{metrics.criticalSecurityAlerts ?? 0}</div>
              <div className="text-[10px] text-rose-400 font-bold">Action Required</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Audit Logs Ledger</span>
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{auditLogs.length}</div>
              <div className="text-[10px] text-emerald-400 font-mono">Immutable Log Integrity</div>
            </div>
          </div>

          {/* Graphical Analytics & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Login Attempt Trends Bar Visual */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" /> Login Activity Telemetry (24-Hour)
                  </h3>
                  <p className="text-[11px] text-slate-400">Hourly breakdown of successful vs failed authentication attempts</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { hour: "00:00 - 04:00", success: 20, failed: 1, percent: 15 },
                  { hour: "04:00 - 08:00", success: 15, failed: 0, percent: 10 },
                  { hour: "08:00 - 12:00", success: 95, failed: 4, percent: 80 },
                  { hour: "12:00 - 16:00", success: 120, failed: 6, percent: 95 },
                  { hour: "16:00 - 20:00", success: 85, failed: 2, percent: 70 },
                  { hour: "20:00 - 24:00", success: 42, failed: 1, percent: 35 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="font-mono text-slate-400">{item.hour}</span>
                      <span className="text-[11px]">
                        <span className="text-emerald-400 font-bold">{item.success} success</span> •{" "}
                        <span className="text-rose-400 font-bold">{item.failed} failed</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${item.percent}%` }} />
                      <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${item.failed * 4}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Distribution */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-cyan-400" /> Authenticated Device Distribution
                  </h3>
                  <p className="text-[11px] text-slate-400">Device fingerprints & client environments accessing SmartLink</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { name: "Desktop Chrome (macOS / Windows)", percent: 48, count: 142, color: "bg-blue-500" },
                  { name: "Mobile Safari (iPhone / iPad)", percent: 32, count: 95, color: "bg-purple-500" },
                  { name: "Mobile Chrome (Android)", percent: 15, count: 44, color: "bg-emerald-500" },
                  { name: "Other Browsers & Tor Proxies", percent: 5, count: 14, color: "bg-rose-500" },
                ].map((dev, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{dev.name}</span>
                      <span className="font-mono text-slate-400">{dev.percent}% ({dev.count} sessions)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div className={`${dev.color} h-full transition-all duration-500`} style={{ width: `${dev.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Critical Alerts Table in Overview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" /> Recent Security Alerts & Intrusion Telemetry
                </h3>
                <p className="text-[11px] text-slate-400">Most recent security incidents flagged by IDS Shield</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("ALERTS")}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                View All Alerts ({securityAlerts.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Alert Title</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {securityAlerts.slice(0, 4).map((alert, idx) => (
                    <tr key={alert.id ? `sec-alert-${alert.id}-${idx}` : `sec-alert-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            alert.severity === "Critical"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : alert.severity === "High"
                              ? "bg-orange-950 text-orange-400 border border-orange-800"
                              : alert.severity === "Medium"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-blue-950 text-blue-400 border border-blue-800"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{alert.title}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{alert.description}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            alert.status === "Resolved"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : alert.status === "Acknowledged"
                              ? "bg-blue-950 text-blue-400 border border-blue-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setActiveTab("ALERTS");
                          }}
                          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: IMMUTABLE AUDIT LOGS */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search action, user, admin, details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Modules</option>
                <option value="Authentication">Authentication</option>
                <option value="Account Governance">Account Governance</option>
                <option value="Network IDS">Network IDS</option>
                <option value="Wallet & Finance">Wallet & Finance</option>
                <option value="Refund Engine">Refund Engine</option>
                <option value="Provider API">Provider API</option>
                <option value="Platform Config">Platform Config</option>
              </select>

              <select
                value={auditSeverityFilter}
                onChange={(e) => setAuditSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportAuditCSV}
              className="py-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950/40 transition"
            >
              <Download className="h-3.5 w-3.5" /> Export Audit CSV
            </button>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Immutable Audit Safeguard Active:</strong> Audit logs are cryptographically indexed and cannot be edited or deleted by any administrative role.
            </span>
          </div>

          {/* Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">IP & Device</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredAuditLogs.map((log, idx) => (
                    <tr key={log.id ? `audit-row-${log.id}-${idx}` : `audit-row-${idx}`} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-purple-400 font-bold">{log.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                      <td className="py-3 px-4 text-slate-400">{log.module || "General"}</td>
                      <td className="py-3 px-4 text-slate-300">{log.user || "N/A"}</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">{log.administrator || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div>{log.ipAddress || "N/A"}</div>
                        <div className="text-[10px] text-slate-500">{log.device || "N/A"}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.severity === "Critical"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : log.severity === "High"
                              ? "bg-orange-950 text-orange-400 border border-orange-800"
                              : log.severity === "Medium"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-blue-950 text-blue-400 border border-blue-800"
                          }`}
                        >
                          {log.severity || "Low"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">{log.details}</td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No audit logs matched your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: LOGIN HISTORY */}
      {activeTab === "LOGIN_HISTORY" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search email, IP address, device, location..."
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={loginStatusFilter}
                onChange={(e) => setLoginStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Device & OS</th>
                    <th className="py-3 px-4">Browser</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Login Time</th>
                    <th className="py-3 px-4">Failure Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredLoginHistory.map((lh, idx) => (
                    <tr key={lh.id ? `login-hist-${lh.id}-${idx}` : `login-hist-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-bold text-white">{lh.userEmail}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            lh.status === "Success"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : lh.status === "Failed"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {lh.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{lh.ipAddress}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{lh.device}</div>
                        <div className="text-[10px] text-slate-500">{lh.os}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{lh.browser}</td>
                      <td className="py-3 px-4 text-slate-300 flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-purple-400" />
                        <span>{lh.location || "Unknown"}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(lh.loginTime).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-rose-400 max-w-xs">{lh.failureReason || "—"}</td>
                    </tr>
                  ))}
                  {filteredLoginHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No login history records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: ACCOUNT GOVERNANCE & LOCKS */}
      {activeTab === "ACCOUNT_LOCKS" && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400" /> Account Governance & Lock Management
                </h3>
                <p className="text-[11px] text-slate-400">
                  Accounts automatically locked due to excessive login failures or administrative flags
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">User Account</th>
                    <th className="py-3 px-4">Lock Status</th>
                    <th className="py-3 px-4">Failed Attempts</th>
                    <th className="py-3 px-4">Locked Time</th>
                    <th className="py-3 px-4">Lock Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {accountLocks.map((lock, idx) => (
                    <tr key={lock.id ? `lock-row-${lock.id}-${idx}` : `lock-row-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>{lock.userName || "User Account"}</div>
                        <div className="text-[11px] font-normal text-slate-400">{lock.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {lock.isLocked ? (
                          <span className="px-2.5 py-1 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg font-bold text-[10px] flex items-center gap-1 w-max">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg font-bold text-[10px] flex items-center gap-1 w-max">
                            <Unlock className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{lock.failedAttempts}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(lock.lockedAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">{lock.reason}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {lock.isLocked && (
                          <button
                            type="button"
                            onClick={() => handleAccountLockAction(lock.id, "UNLOCK")}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                          >
                            Unlock Account
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAccountLockAction(lock.id, "RESET_ATTEMPTS")}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg cursor-pointer transition border border-slate-700"
                        >
                          Reset Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccountLockAction(lock.id, "FORCE_PASSWORD_RESET")}
                          className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                        >
                          Force Password Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accountLocks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No locked user accounts present.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: BLOCKED DEVICES */}
      {activeTab === "BLOCKED_DEVICES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-purple-400" /> Blocked Hardware & Device Signatures
              </h3>
              <p className="text-[11px] text-slate-400">Blacklisted device signatures prevented from accessing SmartLink</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBlockDeviceModal(true)}
              className="py-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition"
            >
              + Block New Device
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">Device ID</th>
                    <th className="py-3 px-4">Device Name</th>
                    <th className="py-3 px-4">Associated User</th>
                    <th className="py-3 px-4">Date Blocked</th>
                    <th className="py-3 px-4">Blocked By</th>
                    <th className="py-3 px-4">Block Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {blockedDevices.map((dev, idx) => (
                    <tr key={dev.id ? `dev-row-${dev.id}-${idx}` : `dev-row-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{dev.deviceId}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{dev.deviceName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{dev.userEmail}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(dev.dateBlocked).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400">{dev.blockedBy}</td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">{dev.reason}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleUnblockDevice(dev.deviceId)}
                          className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Unblock Device
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blockedDevices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No hardware device signatures blacklisted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: BLOCKED IP ADDRESSES */}
      {activeTab === "BLOCKED_IPS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-400" /> Blocked IP Address Firewall Table
              </h3>
              <p className="text-[11px] text-slate-400">Blacklisted IP subnets & Tor exit nodes denied gateway access</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBlockIpModal(true)}
              className="py-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition"
            >
              + Block New IP
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Country / Subnet</th>
                    <th className="py-3 px-4">Date Blocked</th>
                    <th className="py-3 px-4">Blocked By</th>
                    <th className="py-3 px-4">Block Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {blockedIps.map((ip, idx) => (
                    <tr key={ip.id ? `ip-row-${ip.id}-${idx}` : `ip-row-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{ip.ipAddress}</td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-purple-400" />
                        <span>{ip.country}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(ip.dateBlocked).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400">{ip.blockedBy}</td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">{ip.reason}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleUnblockIp(ip.ipAddress)}
                          className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Unblock IP
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blockedIps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No IP addresses blacklisted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: SUSPICIOUS ACTIVITY DETECTOR */}
      {activeTab === "SUSPICIOUS" && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" /> Intrusion Detection & Suspicious Activities
                </h3>
                <p className="text-[11px] text-slate-400">
                  Automated threat classification based on credential stuffing, rapid API requests & location shifts
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Anomaly Description</th>
                    <th className="py-3 px-4">Detector</th>
                    <th className="py-3 px-4">Detected Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Resolution Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {suspiciousActivities.map((act, idx) => (
                    <tr key={act.id ? `susp-act-${act.id}-${idx}` : `susp-act-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            act.severity === "Critical"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : act.severity === "High"
                              ? "bg-orange-950 text-orange-400 border border-orange-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {act.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{act.userEmail}</td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium max-w-sm">{act.description}</td>
                      <td className="py-3.5 px-4 text-purple-400">{act.detectedBy}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            act.status === "Resolved"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : act.status === "Investigating"
                              ? "bg-blue-950 text-blue-400 border border-blue-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {act.status !== "Resolved" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveSuspicious(act.id, "Resolved")}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveSuspicious(act.id, "Flagged")}
                              className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Flag Account
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">Resolved by {act.resolvedBy}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {suspiciousActivities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No suspicious security activity detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 8: ACTIVE SESSIONS */}
      {activeTab === "SESSIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-cyan-400" /> Active User Sessions Monitor
              </h3>
              <p className="text-[11px] text-slate-400">Live active tokens with immediate force-logout and session termination control</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/60">
                    <th className="py-3 px-4">Token / Session ID</th>
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Device & Browser</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activeSessions.map((sess, idx) => (
                    <tr key={sess.id ? `sess-row-${sess.id}-${idx}` : `sess-row-${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{sess.sessionId}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{sess.userEmail}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{sess.device}</div>
                        <div className="text-[10px] text-slate-500">{sess.browser}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{sess.ipAddress}</td>
                      <td className="py-3.5 px-4 text-slate-300 flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-purple-400" />
                        <span>{sess.location}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(sess.lastActivity).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(sess.sessionId)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                        >
                          Terminate Session
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(sess.sessionId, sess.userEmail, true)}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-lg cursor-pointer transition"
                        >
                          Force Logout User All
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No active live sessions tracked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 9: SECURITY ALERTS */}
      {activeTab === "ALERTS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* List */}
            <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" /> System Security Alerts Center
              </h3>

              <div className="space-y-3">
                {securityAlerts.map((alert, idx) => (
                  <div
                    key={alert.id ? `alert-card-${alert.id}-${idx}` : `alert-card-${idx}`}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      selectedAlert?.id === alert.id
                        ? "bg-purple-950/40 border-purple-600"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              alert.severity === "Critical"
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : alert.severity === "High"
                                ? "bg-orange-950 text-orange-400 border border-orange-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-xs font-bold text-white">{alert.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          alert.status === "Resolved"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : alert.status === "Acknowledged"
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                      <span>Timestamp: {new Date(alert.timestamp).toLocaleString()}</span>
                      <span>Notes: {(alert.internalNotes || []).length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Inspection & Notes Sidebar */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-400" /> Alert Details & Action Ledger
              </h3>

              {selectedAlert ? (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-sm font-bold text-white">{selectedAlert.title}</div>
                    <div className="text-slate-400">{selectedAlert.description}</div>
                    <div className="text-[11px] text-purple-400 font-mono">ID: {selectedAlert.id}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status Actions</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAlertAction(selectedAlert.id, "ACKNOWLEDGE")}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer flex-1"
                      >
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlertAction(selectedAlert.id, "RESOLVE")}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer flex-1"
                      >
                        Resolve Alert
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Internal Security Notes</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(selectedAlert.internalNotes || []).map((noteRec: any) => (
                        <div key={noteRec.id} className="p-2 bg-slate-900 rounded-lg text-[11px]">
                          <div className="text-purple-400 font-bold">{noteRec.author}</div>
                          <div className="text-slate-300">{noteRec.note}</div>
                          <div className="text-[9px] text-slate-500">{new Date(noteRec.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                      {(selectedAlert.internalNotes || []).length === 0 && (
                        <div className="text-[11px] text-slate-500 italic">No notes added yet.</div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add internal investigation note..."
                        value={alertNoteText}
                        onChange={(e) => setAlertNoteText(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAlertAction(selectedAlert.id, "ADD_NOTE", alertNoteText)}
                        className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Select a security alert from the list to view investigation details and action controls.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 10: MODULE 10 SELF-TEST SUITE */}
      {activeTab === "TEST_SUITE" && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="h-4 w-4 text-purple-400" /> Module 10 Automated Security Verification Suite
                </h3>
                <p className="text-[11px] text-slate-400">
                  Executes 10 comprehensive self-test verification routines covering Audit Logs, Login Recording, Session Force-Logout, IP/Device Blocklists & RBAC Guards
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunSelfTest}
                disabled={loading}
                className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer transition"
              >
                <Play className="h-4 w-4 fill-current" /> Execute Module 10 Self-Tests
              </button>
            </div>

            {testResults && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-2xl space-y-2">
                  <div className="text-sm font-bold text-purple-300">{testResults.summary}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 pt-1">
                    <div>Login Records: {testResults.metrics?.loginHistoryCount}</div>
                    <div>Active Sessions: {testResults.metrics?.activeSessionsCount}</div>
                    <div>Blocked IPs: {testResults.metrics?.blockedIpsCount}</div>
                    <div>Audit Entries: {testResults.metrics?.auditLogsCount}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {(testResults.testResults || []).map((tr: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">{tr.testName}</div>
                          <div className="text-[11px] text-slate-400">{tr.details}</div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md font-mono text-[10px] font-bold">
                        {tr.status} ({tr.durationMs}ms)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: BLOCK IP ADDRESS */}
      {showBlockIpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-rose-400" /> Block IP Address
              </h3>
              <button
                type="button"
                onClick={() => setShowBlockIpModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockIpSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">IP Address *</label>
                <input
                  type="text"
                  placeholder="e.g. 185.220.101.5"
                  value={blockIpForm.ipAddress}
                  onChange={(e) => setBlockIpForm({ ...blockIpForm, ipAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Country / Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Germany (Tor Proxy)"
                  value={blockIpForm.country}
                  onChange={(e) => setBlockIpForm({ ...blockIpForm, country: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Block Reason *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this IP address is being blacklisted..."
                  value={blockIpForm.reason}
                  onChange={(e) => setBlockIpForm({ ...blockIpForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBlockIpModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Block IP Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BLOCK HARDWARE DEVICE */}
      {showBlockDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Laptop className="h-5 w-5 text-rose-400" /> Block Hardware Device Fingerprint
              </h3>
              <button
                type="button"
                onClick={() => setShowBlockDeviceModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockDeviceSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Device ID / Fingerprint *</label>
                <input
                  type="text"
                  placeholder="e.g. DEV_MAC_88419"
                  value={blockDeviceForm.deviceId}
                  onChange={(e) => setBlockDeviceForm({ ...blockDeviceForm, deviceId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Device Name</label>
                <input
                  type="text"
                  placeholder="e.g. Linux Workstation (Tor Proxy)"
                  value={blockDeviceForm.deviceName}
                  onChange={(e) => setBlockDeviceForm({ ...blockDeviceForm, deviceName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Associated User Email</label>
                <input
                  type="email"
                  placeholder="e.g. bad_actor@gmail.com"
                  value={blockDeviceForm.userEmail}
                  onChange={(e) => setBlockDeviceForm({ ...blockDeviceForm, userEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Reason for Device Block *</label>
                <textarea
                  rows={3}
                  placeholder="Detail the credential stuffing or security violation..."
                  value={blockDeviceForm.reason}
                  onChange={(e) => setBlockDeviceForm({ ...blockDeviceForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBlockDeviceModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Block Device Signature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
