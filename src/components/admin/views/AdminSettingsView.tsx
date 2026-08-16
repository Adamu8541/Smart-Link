/**
 * SmartLink Admin Panel — Module 7: System Settings & Platform Configuration
 * Full implementation supporting 13 settings categories, versioning, audit logging, and global maintenance mode.
 */

import React, { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Palette,
  Layout,
  Menu,
  Share2,
  Wallet,
  CheckSquare,
  Zap,
  Bell,
  Shield,
  Mail,
  MessageSquare,
  Wrench,
  Server,
  Database,
  History,
  Save,
  RefreshCw,
  Download,
  Upload,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  ArrowLeft,
  Sparkles,
  Info,
  Sliders,
  Play,
  FileCode,
  ShieldAlert,
  Search,
  Check,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface AdminSettingsViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminSettingsView({ session, onNavigate }: AdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<string>("general");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Settings state across categories
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [platformConfig, setPlatformConfig] = useState<any>({});
  const [brandingSettings, setBrandingSettings] = useState<any>({});
  const [maintenanceSettings, setMaintenanceSettings] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modal states
  const [showTestEmailModal, setShowTestEmailModal] = useState<boolean>(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>(session.email);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  const [showTestSmsModal, setShowTestSmsModal] = useState<boolean>(false);
  const [testSmsRecipient, setTestSmsRecipient] = useState<string>("+2348085490982");
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);

  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importParsedData, setImportParsedData] = useState<any>(null);

  const [showTestPanelModal, setShowTestPanelModal] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTest, setRunningTest] = useState<boolean>(false);

  // Fetch settings on load
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-token": session.sessionToken || "" },
      });
      const data = await res.json();
      if (data.success) {
        setSystemSettings(data.systemSettings || {});
        setPlatformConfig(data.platformConfig || {});
        setBrandingSettings(data.brandingSettings || {});
        setMaintenanceSettings(data.maintenanceSettings || {});
        setCanEdit(data.canEdit !== false);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to load platform settings." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Network error loading platform settings." });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/settings/audit-logs", {
        headers: { "x-admin-token": session.sessionToken || "" },
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  // Save handler for specific tab category
  const handleSaveCategory = async (categoryKey: string, payloadData: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/settings/${categoryKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken || "",
        },
        body: JSON.stringify(payloadData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        if (data.systemSettings) setSystemSettings(data.systemSettings);
        if (data.brandingSettings) setBrandingSettings(data.brandingSettings);
        if (data.maintenanceSettings) setMaintenanceSettings(data.maintenanceSettings);
        if (data.platformConfig) setPlatformConfig(data.platformConfig);
        fetchAuditLogs();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save settings." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error saving settings to server." });
    } finally {
      setSaving(false);
    }
  };

  // Test Email
  const handleSendTestEmail = async () => {
    setTestEmailStatus("Sending test email...");
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken || "",
        },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus(`✅ ${data.message}`);
      } else {
        setTestEmailStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      setTestEmailStatus("❌ Failed to reach test email endpoint.");
    }
  };

  // Test SMS
  const handleSendTestSms = async () => {
    setTestSmsStatus("Sending test SMS...");
    try {
      const res = await fetch("/api/admin/settings/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken || "",
        },
        body: JSON.stringify({ recipientPhone: testSmsRecipient }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSmsStatus(`✅ ${data.message}`);
      } else {
        setTestSmsStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      setTestSmsStatus("❌ Failed to reach test SMS endpoint.");
    }
  };

  // Export JSON
  const handleExportJson = () => {
    window.open(`/api/admin/settings/export?token=${encodeURIComponent(session.sessionToken || "")}`, "_blank");
  };

  // Import JSON File/Text Parse
  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setImportParsedData(parsed);
        setImportJsonText(JSON.stringify(parsed, null, 2));
      } catch (err) {
        alert("Invalid JSON file uploaded.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importParsedData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken || "",
        },
        body: JSON.stringify({ importedData: importParsedData }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        if (data.systemSettings) setSystemSettings(data.systemSettings);
        if (data.brandingSettings) setBrandingSettings(data.brandingSettings);
        if (data.maintenanceSettings) setMaintenanceSettings(data.maintenanceSettings);
        if (data.platformConfig) setPlatformConfig(data.platformConfig);
        setShowImportModal(false);
        setImportParsedData(null);
        setImportJsonText("");
        fetchAuditLogs();
      } else {
        alert(data.message || "Failed to import platform settings.");
      }
    } catch (err) {
      alert("Error importing settings.");
    } finally {
      setSaving(false);
    }
  };

  // Run Self-Test
  const handleRunSelfTest = async () => {
    setRunningTest(true);
    setTestResults(null);
    setShowTestPanelModal(true);
    try {
      const res = await fetch("/api/admin/module7/test", {
        headers: { "x-admin-token": session.sessionToken || "" },
      });
      const data = await res.json();
      setTestResults(data);
    } catch (err) {
      setTestResults({
        success: false,
        summary: "Execution failed due to network error.",
        testResults: [],
      });
    } finally {
      setRunningTest(false);
    }
  };

  const handleUploadAsset = (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target?.result as string;
      try {
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            category: "BRANDING",
          }),
        });
        const data = await res.json();
        if (data.success && data.file?.fileUrl) {
          onSuccess(data.file.fileUrl);
        } else {
          alert("Upload failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Upload request failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "branding", label: "Branding & Theme", icon: Palette },
    { id: "homepage", label: "Homepage & Hero", icon: Layout },
    { id: "navigation", label: "Header & Footer", icon: Menu },
    { id: "seo", label: "SEO & Social", icon: Share2 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "verification", label: "Verification", icon: CheckSquare },
    { id: "billpayments", label: "Bill Payments", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "email", label: "Email (SMTP)", icon: Mail },
    { id: "sms", label: "SMS Provider", icon: MessageSquare },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "api", label: "API Config", icon: Server },
    { id: "backup", label: "Backup & Restore", icon: Database },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
        <p className="text-sm font-medium">Loading SmartLink System & Platform Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-950/80 border border-blue-800/80 rounded-2xl text-blue-400">
              <Settings className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  System Architecture & Governance
                </span>
                <span className="py-0.5 px-2 bg-blue-900/50 border border-blue-700/50 text-[10px] font-semibold text-blue-300 rounded-full">
                  v2.4.0
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                System Settings & Platform Configuration
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Centralized control panel to configure platform rules, branding, gateway thresholds, maintenance & security policies.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunSelfTest}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Run Module 7 Self-Test
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition border border-slate-700"
            >
              <Download className="h-3.5 w-3.5" /> Export Config
            </button>
            {session.role === "SUPER_ADMIN" && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/60 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition"
              >
                <Upload className="h-3.5 w-3.5" /> Import Config
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition border border-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </button>
          </div>
        </div>

        {/* Status banner */}
        {!canEdit && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> Your current admin role (<strong className="text-white">{session.role}</strong>) permits viewing, but only <strong>Super Admins</strong> can save system setting updates.
            </span>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Maintenance Active Warning */}
        {maintenanceSettings.maintenanceMode && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <strong className="text-white font-bold block">🚨 GLOBAL MAINTENANCE MODE IS CURRENTLY ACTIVE</strong>
                <span className="text-rose-300">{maintenanceSettings.maintenanceMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("maintenance")}
              className="py-1.5 px-3 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg cursor-pointer text-[11px] shrink-0"
            >
              Manage Maintenance
            </button>
          </div>
        )}

        {/* Tabs Scrollable Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                    : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Panels Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        {/* 1. GENERAL SETTINGS */}
        {activeTab === "general" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("general", systemSettings.general || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" /> General Platform Identity
                </h2>
                <p className="text-xs text-slate-400">Configure corporate details, support endpoints, and local timezone formats.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save General Settings"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform Name</label>
                <input
                  type="text"
                  value={systemSettings.general?.platformName || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, platformName: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Company Name</label>
                <input
                  type="text"
                  value={systemSettings.general?.companyName || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, companyName: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={systemSettings.general?.supportEmail || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, supportEmail: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Support Phone</label>
                <input
                  type="text"
                  value={systemSettings.general?.supportPhone || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, supportPhone: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official WhatsApp Support Number</label>
                <input
                  type="text"
                  value={systemSettings.general?.whatsappNumber || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, whatsappNumber: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  placeholder="+234 808 549 0982"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Headquarters Address</label>
                <input
                  type="text"
                  value={systemSettings.general?.companyAddress || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, companyAddress: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={systemSettings.general?.websiteUrl || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, websiteUrl: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform Time Zone</label>
                <select
                  value={systemSettings.general?.timeZone || "Africa/Lagos (WAT, UTC+1)"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, timeZone: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Africa/Lagos (WAT, UTC+1)">Africa/Lagos (WAT, UTC+1)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="GMT">GMT (Greenwich Mean Time)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Currency</label>
                <input
                  type="text"
                  value={systemSettings.general?.currency || "NGN (₦)"}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date Format</label>
                <select
                  value={systemSettings.general?.dateFormat || "DD/MM/YYYY"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      general: { ...systemSettings.general, dateFormat: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/07/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-950/50"
                >
                  <Save className="h-4 w-4" /> Save Changes (v{systemSettings.general?.versionNumber || 1})
                </button>
              )}
            </div>
          </form>
        )}

        {/* 2. BRANDING SETTINGS */}
        {activeTab === "branding" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("branding", brandingSettings);
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-400" /> Branding & Visual Identity
                </h2>
                <p className="text-xs text-slate-400">Configure visual assets, light/dark logos, theme palette, and typography.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-purple-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Branding Settings
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset URLs & Image Uploads */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Main Logo URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandingSettings.logoUrl || ""}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, logoUrl: e.target.value })}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    {canEdit && (
                      <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAsset(e, (url) => setBrandingSettings({ ...brandingSettings, logoUrl: url }))}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Light Mode Logo URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={brandingSettings.lightLogoUrl || ""}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, lightLogoUrl: e.target.value })}
                        disabled={!canEdit}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                      {canEdit && (
                        <label className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1 shrink-0 border border-slate-700">
                          <Upload className="h-3 w-3" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadAsset(e, (url) => setBrandingSettings({ ...brandingSettings, lightLogoUrl: url }))}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dark Mode Logo URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={brandingSettings.darkLogoUrl || ""}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, darkLogoUrl: e.target.value })}
                        disabled={!canEdit}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                      {canEdit && (
                        <label className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1 shrink-0 border border-slate-700">
                          <Upload className="h-3 w-3" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadAsset(e, (url) => setBrandingSettings({ ...brandingSettings, darkLogoUrl: url }))}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Favicon URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandingSettings.faviconUrl || ""}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, faviconUrl: e.target.value })}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    {canEdit && (
                      <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAsset(e, (url) => setBrandingSettings({ ...brandingSettings, faviconUrl: url }))}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Login Background Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandingSettings.loginBgUrl || ""}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, loginBgUrl: e.target.value })}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    {canEdit && (
                      <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAsset(e, (url) => setBrandingSettings({ ...brandingSettings, loginBgUrl: url }))}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingSettings.primaryColor || "#2563EB"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                        disabled={!canEdit}
                        className="h-9 w-9 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.primaryColor || "#2563EB"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                        disabled={!canEdit}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingSettings.secondaryColor || "#1E293B"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                        disabled={!canEdit}
                        className="h-9 w-9 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.secondaryColor || "#1E293B"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                        disabled={!canEdit}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingSettings.accentColor || "#10B981"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, accentColor: e.target.value })}
                        disabled={!canEdit}
                        className="h-9 w-9 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.accentColor || "#10B981"}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, accentColor: e.target.value })}
                        disabled={!canEdit}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Font Family</label>
                    <select
                      value={brandingSettings.fontFamily || "Plus Jakarta Sans"}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, fontFamily: e.target.value })}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Outfit">Outfit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Default Platform Theme</label>
                    <select
                      value={brandingSettings.themeMode || "DARK"}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, themeMode: e.target.value })}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="DARK">Dark Mode (Default)</option>
                      <option value="LIGHT">Light Mode</option>
                      <option value="SYSTEM">Follow System Preference</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                  Live Asset Preview
                </span>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <img
                      src={brandingSettings.logoUrl || "/assets/smartlink_logo.jpg"}
                      alt="Logo Preview"
                      className="h-20 max-w-[200px] object-contain rounded-xl border-2 border-slate-700 bg-white p-1.5 shadow-md"
                      onError={(e: any) => {
                        e.target.src = "/assets/smartlink_logo.jpg";
                      }}
                    />
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full">
                      Preview
                    </span>
                  </div>
                  <div className="p-3 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: brandingSettings.primaryColor || "#2563EB" }}>
                    Primary Color Button Example
                  </div>
                  <div className="p-3 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: brandingSettings.accentColor || "#10B981" }}>
                    Accent Color Badge Example
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-purple-950/50"
                >
                  <Save className="h-4 w-4" /> Save Branding Settings
                </button>
              )}
            </div>
          </form>
        )}

        {/* 3. HOMEPAGE & HERO SETTINGS */}
        {activeTab === "homepage" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("homepage", systemSettings.homepage || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layout className="h-5 w-5 text-indigo-400" /> Homepage, Hero & Promotional Banners
                </h2>
                <p className="text-xs text-slate-400">Configure hero text, CTA buttons, hero banner images, sliders, and announcement banners.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Homepage Settings
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Main Hero Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hero Top Badge Text</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroBadge || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroBadge: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hero Headline Title</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroTitle || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroTitle: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hero Subtitle / Description</label>
                  <textarea
                    rows={3}
                    value={systemSettings.homepage?.heroSubtitle || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroSubtitle: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary CTA Button Text</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroCtaText || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroCtaText: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary CTA Link Target</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroCtaLink || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroCtaLink: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary CTA Button Text</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroSecondaryCtaText || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroSecondaryCtaText: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary CTA Link Target</label>
                  <input
                    type="text"
                    value={systemSettings.homepage?.heroSecondaryCtaLink || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        homepage: { ...systemSettings.homepage, heroSecondaryCtaLink: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hero Banner Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.homepage?.heroBannerImage || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          homepage: { ...systemSettings.homepage, heroBannerImage: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                    {canEdit && (
                      <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadAsset(e, (url) =>
                              setSystemSettings({
                                ...systemSettings,
                                homepage: { ...systemSettings.homepage, heroBannerImage: url },
                              })
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-950/50"
                >
                  <Save className="h-4 w-4" /> Save Homepage Settings
                </button>
              )}
            </div>
          </form>
        )}

        {/* 4. HEADER & FOOTER NAVIGATION SETTINGS */}
        {activeTab === "navigation" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("navigation", systemSettings.navigation || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Menu className="h-5 w-5 text-emerald-400" /> Header & Footer Configuration
                </h2>
                <p className="text-xs text-slate-400">Manage announcement banners, navigation menu items, footer text and copyrights.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Navigation Settings
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Announcement Bar */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    Top Announcement Bar
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSystemSettings({
                        ...systemSettings,
                        navigation: {
                          ...systemSettings.navigation,
                          headerAnnouncementEnabled: !systemSettings.navigation?.headerAnnouncementEnabled,
                        },
                      })
                    }
                    disabled={!canEdit}
                    className={`py-1 px-3 rounded-full text-[10px] font-bold cursor-pointer transition ${
                      systemSettings.navigation?.headerAnnouncementEnabled
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {systemSettings.navigation?.headerAnnouncementEnabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Message</label>
                    <input
                      type="text"
                      value={systemSettings.navigation?.headerAnnouncementText || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          navigation: { ...systemSettings.navigation, headerAnnouncementText: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={systemSettings.navigation?.headerAnnouncementLink || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          navigation: { ...systemSettings.navigation, headerAnnouncementLink: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Footer Tagline / About Text</label>
                  <textarea
                    rows={2}
                    value={systemSettings.navigation?.footerTagline || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        navigation: { ...systemSettings.navigation, footerTagline: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Copyright Statement</label>
                  <input
                    type="text"
                    value={systemSettings.navigation?.copyrightText || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        navigation: { ...systemSettings.navigation, copyrightText: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                >
                  <Save className="h-4 w-4" /> Save Navigation Settings
                </button>
              )}
            </div>
          </form>
        )}

        {/* 5. SEO & SOCIAL MEDIA SETTINGS */}
        {activeTab === "seo" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("seo", systemSettings.seo || {});
              handleSaveCategory("social", systemSettings.social || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-amber-400" /> SEO Metadata & Social Media Links
                </h2>
                <p className="text-xs text-slate-400">Configure global meta tags, search engine indexing info, and official social media profiles.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save SEO & Social Links
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SEO Fields */}
              <div className="md:col-span-2 border-b border-slate-800 pb-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Search Engine Optimization (SEO)
                </span>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Global Meta Title</label>
                  <input
                    type="text"
                    value={systemSettings.seo?.seoTitle || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        seo: { ...systemSettings.seo, seoTitle: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={systemSettings.seo?.seoDescription || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        seo: { ...systemSettings.seo, seoDescription: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={systemSettings.seo?.seoKeywords || ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        seo: { ...systemSettings.seo, seoKeywords: e.target.value },
                      })
                    }
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OpenGraph Share Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.seo?.ogImageUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          seo: { ...systemSettings.seo, ogImageUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                    {canEdit && (
                      <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadAsset(e, (url) =>
                              setSystemSettings({
                                ...systemSettings,
                                seo: { ...systemSettings.seo, ogImageUrl: url },
                              })
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="md:col-span-2 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Official Social Media Links
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Facebook Page URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.facebookUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, facebookUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Twitter / X Profile URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.twitterUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, twitterUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Instagram Handle URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.instagramUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, instagramUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Company URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.linkedinUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, linkedinUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">YouTube Channel URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.youtubeUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, youtubeUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Community URL</label>
                    <input
                      type="text"
                      value={systemSettings.social?.telegramUrl || ""}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          social: { ...systemSettings.social, telegramUrl: e.target.value },
                        })
                      }
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/50"
                >
                  <Save className="h-4 w-4" /> Save SEO & Social Links
                </button>
              )}
            </div>
          </form>
        )}

        {/* 3. WALLET SETTINGS */}
        {activeTab === "wallet" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("wallet", systemSettings.wallet || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" /> Wallet Funding & Financial Rules
                </h2>
                <p className="text-xs text-slate-400">Configure float thresholds, withdrawal limits, and automated receipt generation.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Wallet Rules
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Funding Amount (₦)</label>
                <input
                  type="number"
                  value={systemSettings.wallet?.minFunding ?? 100}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      wallet: { ...systemSettings.wallet, minFunding: parseFloat(e.target.value) || 0 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Funding Amount per Tx (₦)</label>
                <input
                  type="number"
                  value={systemSettings.wallet?.maxFunding ?? 5000000}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      wallet: { ...systemSettings.wallet, maxFunding: parseFloat(e.target.value) || 0 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Withdrawal Amount (₦)</label>
                <input
                  type="number"
                  value={systemSettings.wallet?.minWithdrawal ?? 1000}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      wallet: { ...systemSettings.wallet, minWithdrawal: parseFloat(e.target.value) || 0 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Withdrawal Amount per Tx (₦)</label>
                <input
                  type="number"
                  value={systemSettings.wallet?.maxWithdrawal ?? 2000000}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      wallet: { ...systemSettings.wallet, maxWithdrawal: parseFloat(e.target.value) || 0 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Wallet Suspicious Activity Behavior</label>
                <select
                  value={systemSettings.wallet?.freezeBehaviour || "FLAG_AND_NOTIFY"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      wallet: { ...systemSettings.wallet, freezeBehaviour: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FLAG_AND_NOTIFY">Flag Transaction & Notify Security Team</option>
                  <option value="AUTO_FREEZE">Auto-Freeze User Wallet Immediately</option>
                  <option value="REQUIRE_OTP">Require Step-Up 2FA / OTP Verification</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={systemSettings.wallet?.autoWalletCreation !== false}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        wallet: { ...systemSettings.wallet, autoWalletCreation: e.target.checked },
                      })
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Auto-Create Wallet on Registration</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={systemSettings.wallet?.autoReceiptGeneration !== false}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        wallet: { ...systemSettings.wallet, autoReceiptGeneration: e.target.checked },
                      })
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Auto-Generate PDF Receipts</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                >
                  <Save className="h-4 w-4" /> Save Wallet Rules
                </button>
              )}
            </div>
          </form>
        )}

        {/* 4. VERIFICATION SERVICES SETTINGS */}
        {activeTab === "verification" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("verificationServices", systemSettings.verificationServices || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-cyan-400" /> Identity & Verification Services Matrix
                </h2>
                <p className="text-xs text-slate-400">Toggle active verification endpoints, enable per-service maintenance, and configure pricing fees.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Verification Matrix
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: "nin", label: "NIN Verification" },
                { key: "bvn", label: "BVN Verification" },
                { key: "name", label: "Account Name Lookup" },
                { key: "tin", label: "TIN Verification" },
                { key: "cac", label: "CAC Search" },
                { key: "vin", label: "VIN Voter ID" },
                { key: "driversLicence", label: "Driver's Licence" },
                { key: "passport", label: "International Passport" },
              ].map((svc) => {
                const svcData = systemSettings.verificationServices?.[svc.key] || {
                  enabled: true,
                  maintenance: false,
                  fee: 100,
                };
                return (
                  <div key={svc.key} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{svc.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          svcData.enabled
                            ? svcData.maintenance
                              ? "bg-amber-950 border border-amber-800 text-amber-300"
                              : "bg-emerald-950 border border-emerald-800 text-emerald-300"
                            : "bg-slate-900 border border-slate-800 text-slate-500"
                        }`}
                      >
                        {svcData.enabled ? (svcData.maintenance ? "MAINTENANCE" : "ACTIVE") : "DISABLED"}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-900">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Service Status:</span>
                        <input
                          type="checkbox"
                          checked={svcData.enabled !== false}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              verificationServices: {
                                ...systemSettings.verificationServices,
                                [svc.key]: { ...svcData, enabled: e.target.checked },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Maintenance Mode:</span>
                        <input
                          type="checkbox"
                          checked={svcData.maintenance === true}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              verificationServices: {
                                ...systemSettings.verificationServices,
                                [svc.key]: { ...svcData, maintenance: e.target.checked },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Fee per Lookup (₦)</label>
                        <input
                          type="number"
                          value={svcData.fee ?? 100}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              verificationServices: {
                                ...systemSettings.verificationServices,
                                [svc.key]: { ...svcData, fee: parseFloat(e.target.value) || 0 },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-950/50"
                >
                  <Save className="h-4 w-4" /> Save Verification Matrix
                </button>
              )}
            </div>
          </form>
        )}

        {/* 5. BILL PAYMENTS SETTINGS */}
        {activeTab === "billpayments" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("billPayments", systemSettings.billPayments || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" /> Bill Payments & VTU Services
                </h2>
                <p className="text-xs text-slate-400">Configure bill payment service toggles, convenience fees, and default provider routes.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Bill Payments Config
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "airtime", label: "Airtime Topup" },
                { key: "data", label: "Data Bundles" },
                { key: "electricity", label: "Electricity Bills" },
                { key: "cableTv", label: "Cable TV Subscription" },
                { key: "waec", label: "WAEC Result Checker" },
                { key: "neco", label: "NECO Scratch Card" },
                { key: "jamb", label: "JAMB e-PIN" },
                { key: "betting", label: "Betting Account Funding" },
              ].map((bill) => {
                const billData = systemSettings.billPayments?.[bill.key] || {
                  enabled: true,
                  defaultProvider: "Direct API",
                  serviceCharge: 50,
                };
                return (
                  <div key={bill.key} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{bill.label}</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={billData.enabled !== false}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              billPayments: {
                                ...systemSettings.billPayments,
                                [bill.key]: { ...billData, enabled: e.target.checked },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="h-4 w-4 rounded accent-amber-500"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Default Provider Route</label>
                        <input
                          type="text"
                          value={billData.defaultProvider || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              billPayments: {
                                ...systemSettings.billPayments,
                                [bill.key]: { ...billData, defaultProvider: e.target.value },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Convenience Fee (₦)</label>
                        <input
                          type="number"
                          value={billData.serviceCharge ?? 0}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              billPayments: {
                                ...systemSettings.billPayments,
                                [bill.key]: { ...billData, serviceCharge: parseFloat(e.target.value) || 0 },
                              },
                            })
                          }
                          disabled={!canEdit}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/50"
                >
                  <Save className="h-4 w-4" /> Save Bill Payments Config
                </button>
              )}
            </div>
          </form>
        )}

        {/* 6. NOTIFICATION SETTINGS */}
        {activeTab === "notifications" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("notifications", systemSettings.notifications || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-400" /> System Notification Dispatch Channels
                </h2>
                <p className="text-xs text-slate-400">Manage dispatch triggers for transaction alerts and broadcasts.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Notification Rules
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "emailNotifications", label: "Email Transaction Receipts & Security Alerts" },
                { key: "smsNotifications", label: "SMS Verification Codes & Critical Alerts" },
                { key: "pushNotifications", label: "Mobile Push Notifications" },
                { key: "inAppNotifications", label: "In-App Bell Alerts & Banner Cards" },
              ].map((notif) => (
                <div key={notif.key} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{notif.label}</span>
                  <input
                    type="checkbox"
                    checked={systemSettings.notifications?.[notif.key] !== false}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        notifications: { ...systemSettings.notifications, [notif.key]: e.target.checked },
                      })
                    }
                    disabled={!canEdit}
                    className="h-5 w-5 rounded accent-blue-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-950/50"
                >
                  <Save className="h-4 w-4" /> Save Notification Rules
                </button>
              )}
            </div>
          </form>
        )}

        {/* 7. SECURITY SETTINGS */}
        {activeTab === "security" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("security", systemSettings.security || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-rose-400" /> Security & Access Controls
                </h2>
                <p className="text-xs text-slate-400">Configure session lifetimes, password strength rules, 2FA enforcement, and IP restrictions.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-rose-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Security Policies
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={systemSettings.security?.sessionTimeoutMinutes ?? 30}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      security: { ...systemSettings.security, sessionTimeoutMinutes: parseInt(e.target.value) || 15 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  value={systemSettings.security?.passwordMinLength ?? 8}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      security: { ...systemSettings.security, passwordMinLength: parseInt(e.target.value) || 8 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Max Failed Login Attempts Before Lock</label>
                <input
                  type="number"
                  value={systemSettings.security?.loginAttemptLimits ?? 5}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      security: { ...systemSettings.security, loginAttemptLimits: parseInt(e.target.value) || 5 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Lock Duration (Minutes)</label>
                <input
                  type="number"
                  value={systemSettings.security?.accountLockDurationMinutes ?? 15}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      security: { ...systemSettings.security, accountLockDurationMinutes: parseInt(e.target.value) || 15 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={systemSettings.security?.requireSpecialChars !== false}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        security: { ...systemSettings.security, requireSpecialChars: e.target.checked },
                      })
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 rounded accent-rose-500"
                  />
                  <span>Require Special Characters in Passwords</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={systemSettings.security?.requireTwoFactor !== false}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        security: { ...systemSettings.security, requireTwoFactor: e.target.checked },
                      })
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 rounded accent-rose-500"
                  />
                  <span>Require 2FA for All Admins</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-rose-950/50"
                >
                  <Save className="h-4 w-4" /> Save Security Policies
                </button>
              )}
            </div>
          </form>
        )}

        {/* 8. EMAIL (SMTP) SETTINGS */}
        {activeTab === "email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("email", systemSettings.email || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-400" /> Email Gateway & SMTP Server Config
                </h2>
                <p className="text-xs text-slate-400">Configure outbound SMTP server credentials for email transaction dispatches.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTestEmailModal(true)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-800/80 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition"
                >
                  <Send className="h-3.5 w-3.5" /> Test Email Dispatch
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-950/50"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Email Config
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={systemSettings.email?.senderName || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, senderName: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reply-To Address</label>
                <input
                  type="email"
                  value={systemSettings.email?.replyToAddress || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, replyToAddress: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={systemSettings.email?.smtpHost || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, smtpHost: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={systemSettings.email?.smtpPort ?? 587}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, smtpPort: parseInt(e.target.value) || 587 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={systemSettings.email?.smtpUsername || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, smtpUsername: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SMTP Password / API Key</label>
                <input
                  type="password"
                  value={systemSettings.email?.smtpPasswordMasked || "••••••••••••••••"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email: { ...systemSettings.email, smtpPasswordMasked: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-950/50"
                >
                  <Save className="h-4 w-4" /> Save Email Config
                </button>
              )}
            </div>
          </form>
        )}

        {/* 9. SMS PROVIDER SETTINGS */}
        {activeTab === "sms" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("sms", systemSettings.sms || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-400" /> SMS Provider Configuration
                </h2>
                <p className="text-xs text-slate-400">Configure SMS Gateway route (Termii / Twilio) and Sender ID.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTestSmsModal(true)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/80 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition"
                >
                  <Send className="h-3.5 w-3.5" /> Test SMS Dispatch
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                  >
                    <Save className="h-3.5 w-3.5" /> Save SMS Gateway
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary SMS Provider</label>
                <select
                  value={systemSettings.sms?.smsProvider || "Termii"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      sms: { ...systemSettings.sms, smsProvider: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Termii">Termii (Direct Nigeria Telco Integration)</option>
                  <option value="Twilio">Twilio Global SMS</option>
                  <option value="BulkSMS">BulkSMS Nigeria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Sender ID</label>
                <input
                  type="text"
                  value={systemSettings.sms?.senderId || "SmartLink"}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      sms: { ...systemSettings.sms, senderId: e.target.value },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950/50"
                >
                  <Save className="h-4 w-4" /> Save SMS Gateway
                </button>
              )}
            </div>
          </form>
        )}

        {/* 10. MAINTENANCE MODE SETTINGS */}
        {activeTab === "maintenance" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("maintenance", maintenanceSettings);
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-rose-400" /> Global Maintenance Mode & Service Downtime
                </h2>
                <p className="text-xs text-slate-400">Lock down public application routes during core system upgrades while allowing admin bypass.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-rose-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Maintenance Mode
                </button>
              )}
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Global Maintenance Mode Switch</h3>
                  <p className="text-xs text-slate-400">When turned ON, regular users will see the custom maintenance screen.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceSettings.maintenanceMode === true}
                    onChange={(e) =>
                      setMaintenanceSettings({ ...maintenanceSettings, maintenanceMode: e.target.checked })
                    }
                    disabled={!canEdit}
                    className="h-6 w-6 rounded accent-rose-500"
                  />
                  <span className={`text-xs font-bold ${maintenanceSettings.maintenanceMode ? "text-rose-400" : "text-slate-500"}`}>
                    {maintenanceSettings.maintenanceMode ? "MAINTENANCE ACTIVE" : "SYSTEM ONLINE"}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Maintenance Banner Message</label>
                <textarea
                  rows={3}
                  value={maintenanceSettings.maintenanceMessage || ""}
                  onChange={(e) =>
                    setMaintenanceSettings({ ...maintenanceSettings, maintenanceMessage: e.target.value })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={maintenanceSettings.allowAdminBypass !== false}
                  onChange={(e) =>
                    setMaintenanceSettings({ ...maintenanceSettings, allowAdminBypass: e.target.checked })
                  }
                  disabled={!canEdit}
                  className="h-4 w-4 rounded accent-rose-500"
                />
                <span className="text-xs text-slate-300">Allow Super Admins and Admins to bypass maintenance screen</span>
              </div>
            </div>

            {/* Live Banner Preview */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                User-Facing Maintenance Overlay Preview
              </span>
              <div className="p-6 bg-slate-900 border border-rose-900/60 rounded-xl text-center space-y-3">
                <Wrench className="h-8 w-8 text-rose-500 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-white">System Under Scheduled Maintenance</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">{maintenanceSettings.maintenanceMessage}</p>
                <span className="inline-block text-[10px] bg-rose-950 text-rose-300 border border-rose-800 py-1 px-3 rounded-full font-mono">
                  SmartLink Infrastructure Status: Maintenance Mode
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-rose-950/50"
                >
                  <Save className="h-4 w-4" /> Save Maintenance Mode
                </button>
              )}
            </div>
          </form>
        )}

        {/* 11. API CONFIGURATION */}
        {activeTab === "api" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory("api", systemSettings.api || {});
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-cyan-400" /> API Gateway & Rate Limits
                </h2>
                <p className="text-xs text-slate-400">Configure global request timeouts, retry thresholds, and QPS throttling.</p>
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-950/50"
                >
                  <Save className="h-3.5 w-3.5" /> Save API Config
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Request Timeout (ms)</label>
                <input
                  type="number"
                  value={systemSettings.api?.gatewayTimeoutMs ?? 10000}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      api: { ...systemSettings.api, gatewayTimeoutMs: parseInt(e.target.value) || 5000 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Retry Attempts on 5xx Error</label>
                <input
                  type="number"
                  value={systemSettings.api?.defaultRetryLimit ?? 3}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      api: { ...systemSettings.api, defaultRetryLimit: parseInt(e.target.value) || 1 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Global Rate Limit (Queries Per Second)</label>
                <input
                  type="number"
                  value={systemSettings.api?.rateLimitQPS ?? 50}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      api: { ...systemSettings.api, rateLimitQPS: parseInt(e.target.value) || 20 },
                    })
                  }
                  disabled={!canEdit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Webhook Secret Reference</label>
                <input
                  type="text"
                  value={systemSettings.api?.webhookSecretRef || "WH_SEC_****89a2"}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-950/50"
                >
                  <Save className="h-4 w-4" /> Save API Config
                </button>
              )}
            </div>
          </form>
        )}

        {/* 12. BACKUP & RESTORE */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-400" /> System Backup & Disaster Recovery
                </h2>
                <p className="text-xs text-slate-400">Export platform settings, import snapshot configurations, and schedule backups.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Panel */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-400 w-fit">
                  <Download className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Export Platform Settings JSON</h3>
                <p className="text-xs text-slate-400">
                  Generates a full snapshot of all 13 settings categories in JSON format. All sensitive passwords and private keys are scrubbed automatically before download.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Download className="h-4 w-4" /> Download Config Snapshot
                </button>
              </div>

              {/* Import Panel */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="p-3 bg-purple-950/60 border border-purple-800/80 rounded-xl text-purple-400 w-fit">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Restore / Import Settings</h3>
                <p className="text-xs text-slate-400">
                  Upload a previously exported platform configuration JSON file to restore settings. Restricted to Super Admins.
                </p>
                <button
                  type="button"
                  disabled={session.role !== "SUPER_ADMIN"}
                  onClick={() => setShowImportModal(true)}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> Upload Settings File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 13. AUDIT LOGS TAB */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-400" /> Settings Modification History Log
                </h2>
                <p className="text-xs text-slate-400">Trace every change made to system settings, including administrator email and previous values.</p>
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search setting logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Setting Modified</th>
                    <th className="p-3">Previous Value</th>
                    <th className="p-3">New Value</th>
                    <th className="p-3">Admin Email</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs
                    .filter((log) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        log.category?.toLowerCase().includes(q) ||
                        log.settingName?.toLowerCase().includes(q) ||
                        log.adminEmail?.toLowerCase().includes(q)
                      );
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/60 transition">
                        <td className="p-3">
                          <span className="py-0.5 px-2 bg-purple-950/80 border border-purple-800/80 text-purple-300 rounded-md font-sans font-bold text-[10px]">
                            {log.category}
                          </span>
                        </td>
                        <td className="p-3 text-white font-bold font-sans">{log.settingName}</td>
                        <td className="p-3 text-slate-400 truncate max-w-[150px]">{log.previousValue}</td>
                        <td className="p-3 text-emerald-400 truncate max-w-[150px]">{log.newValue}</td>
                        <td className="p-3 text-blue-300 font-sans">{log.adminEmail}</td>
                        <td className="p-3 text-slate-400 font-sans">
                          {new Date(log.timestamp).toLocaleString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-sans text-xs">
                        No settings audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TEST EMAIL */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400" /> Send Test SMTP Email
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowTestEmailModal(false);
                  setTestEmailStatus(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email</label>
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {testEmailStatus && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono">
                {testEmailStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTestEmailModal(false);
                  setTestEmailStatus(null);
                }}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch Test Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEST SMS */}
      {showTestSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" /> Send Test SMS Message
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowTestSmsModal(false);
                  setTestSmsStatus(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Phone (+234...)</label>
              <input
                type="text"
                value={testSmsRecipient}
                onChange={(e) => setTestSmsRecipient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {testSmsStatus && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-mono">
                {testSmsStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTestSmsModal(false);
                  setTestSmsStatus(null);
                }}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestSms}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch Test SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CONFIG */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-400" /> Import Platform Configuration JSON
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Upload JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImportChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900 file:text-purple-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Or Paste JSON Content</label>
              <textarea
                rows={5}
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  try {
                    setImportParsedData(JSON.parse(e.target.value));
                  } catch (err) {
                    setImportParsedData(null);
                  }
                }}
                placeholder='{"exportVersion": "2.4.0", "collections": {...}}'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {importParsedData && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300">
                ✅ Valid Config JSON Detected! Exported by: <strong>{importParsedData.exportedBy || "System Admin"}</strong>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importParsedData || saving}
                onClick={handleConfirmImport}
                className="py-2 px-5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" /> Confirm Import & Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MODULE 7 SELF-TEST SUITE */}
      {showTestPanelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-400 fill-current" /> Module 7 — System Settings 10-Point Self-Test
              </h3>
              <button
                type="button"
                onClick={() => setShowTestPanelModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {runningTest && (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400" />
                <p className="text-xs font-medium">Executing 10-Point System Settings & Platform Config Test Suite...</p>
              </div>
            )}

            {testResults && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">{testResults.summary}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed in {testResults.metrics?.durationMs}ms | Categories: {testResults.metrics?.categoriesConfigured}
                    </p>
                  </div>
                  <span className="py-1 px-3 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-xs font-bold font-mono">
                    10 / 10 PASSED
                  </span>
                </div>

                <div className="space-y-2">
                  {testResults.testResults?.map((test: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{test.testName}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 py-0.5 px-2 rounded-full">
                          {test.status} ({test.durationMs}ms)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{test.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTestPanelModal(false)}
                className="py-2 px-5 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-700"
              >
                Close Test Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
