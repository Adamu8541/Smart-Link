import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  History,
  Sparkles,
  Users,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ShieldCheck,
  Megaphone,
  Layers,
  Calendar,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Edit,
  SlidersHorizontal,
  Power,
  Radio,
  Check,
  AlertCircle,
  X,
  Mail,
  Smartphone,
  Info,
  ShieldAlert,
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface AdminNotificationsViewProps {
  session: AdminSession;
  onNavigate?: (routePath: string) => void;
}

export function AdminNotificationsView({ session, onNavigate }: AdminNotificationsViewProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "CREATE" | "ANNOUNCEMENTS" | "TEMPLATES" | "HISTORY" | "TEST_SUITE">("OVERVIEW");
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // System Master Switches state
  const [systemSwitches, setSystemSwitches] = useState<{
    announcementsEnabled: boolean;
    notificationsEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    showAnnouncement: boolean;
    announcementText: string;
  }>({
    announcementsEnabled: true,
    notificationsEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    showAnnouncement: true,
    announcementText: "",
  });
  const [toggleLoadingKey, setToggleLoadingKey] = useState<string | null>(null);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Announcement filter state
  const [annFilterStatus, setAnnFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: "",
    message: "",
    category: "General",
    priority: "Normal",
    channels: ["In-App", "Email"],
    targetAudience: "All Users",
    targetEmail: "",
    scheduledSendTime: "",
    expiryDate: "",
    selectedTemplateId: "",
  });
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  // Announcement Form Modal State (Create & Edit)
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({
    title: "",
    content: "",
    type: "System Maintenance",
    priority: "Normal",
    bannerStyle: "amber",
    targetAudience: "All Users",
    actionUrl: "",
    actionText: "",
    expiresAt: "",
    isActive: true,
  });

  // Preview Modal
  const [previewAnnouncement, setPreviewAnnouncement] = useState<any | null>(null);

  // Template Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    category: "General",
    subjectTemplate: "",
    bodyTemplate: "",
    supportedChannels: ["In-App", "Email"],
  });

  // Module 9 Automated Self-Test state
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [testSummary, setTestSummary] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchSystemSwitches();
    fetchNotifications();
    fetchAnnouncements();
    fetchTemplates();
    fetchHistory();
  }, []);

  const fetchSystemSwitches = async () => {
    try {
      const res = await fetch("/api/admin/notifications/system-switches");
      const data = await res.json();
      if (data.success && data.switches) {
        setSystemSwitches(data.switches);
      }
    } catch (err) {
      console.error("System switches fetch error:", err);
    }
  };

  const handleToggleSystemSwitch = async (switchKey: "announcements" | "notifications" | "email" | "sms", currentVal: boolean) => {
    setToggleLoadingKey(switchKey);
    setSwitchFeedback(null);
    const nextVal = !currentVal;

    try {
      const res = await fetch("/api/admin/notifications/toggle-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ switchKey, enabled: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.switches) {
          setSystemSwitches(data.switches);
        }
        setSwitchFeedback(data.message || `Switched ${switchKey} to ${nextVal ? "ON" : "OFF"}`);
        fetchDashboardMetrics();
        fetchAnnouncements();
        
        // Notify other windows/components
        window.dispatchEvent(new Event("announcements_updated"));

        setTimeout(() => {
          setSwitchFeedback(null);
        }, 4000);
      }
    } catch (err) {
      console.error("Toggle switch error:", err);
      setSwitchFeedback("Error updating system switch.");
    } finally {
      setToggleLoadingKey(null);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const res = await fetch("/api/admin/notifications/dashboard");
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Dashboard metrics error:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?search=${searchQuery}&category=${filterCategory}&priority=${filterPriority}&status=${filterStatus}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Fetch announcements error:", err);
    }
  };

  const handleToggleAnnouncement = async (id: string, currentState: boolean) => {
    setToggleLoadingKey(`ann_${id}`);
    try {
      const res = await fetch(`/api/admin/announcements/toggle/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.announcements) {
          setAnnouncements(data.announcements);
        } else {
          fetchAnnouncements();
        }
        setSwitchFeedback(data.message || `Announcement status updated.`);
        fetchDashboardMetrics();
        window.dispatchEvent(new Event("announcements_updated"));

        setTimeout(() => {
          setSwitchFeedback(null);
        }, 4000);
      }
    } catch (err) {
      console.error("Toggle announcement error:", err);
      setSwitchFeedback("Failed to toggle announcement status.");
    } finally {
      setToggleLoadingKey(null);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/notifications/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Fetch templates error:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/notification/history");
      const data = await res.json();
      if (data.success) {
        setHistoryLogs(data.history || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  const handleChannelToggle = (channel: string) => {
    setCreateForm((prev) => {
      const exists = prev.channels.includes(channel);
      if (exists) {
        if (prev.channels.length === 1) return prev; // Keep at least one
        return { ...prev, channels: prev.channels.filter((c) => c !== channel) };
      }
      return { ...prev, channels: [...prev.channels, channel] };
    });
  };

  const handleTemplateSelect = (tplId: string) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setCreateForm((prev) => ({
        ...prev,
        selectedTemplateId: tplId,
        title: tpl.subjectTemplate,
        message: tpl.bodyTemplate,
        category: tpl.category || "General",
        channels: tpl.supportedChannels || ["In-App"],
      }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccessMsg(null);
    setCreateErrorMsg(null);

    if (!createForm.title || !createForm.message) {
      setCreateErrorMsg("Please provide both Title and Message content.");
      return;
    }

    try {
      const res = await fetch("/api/admin/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          createdBy: session.fullName || session.email || "Administrator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateSuccessMsg(data.message);
        fetchDashboardMetrics();
        fetchNotifications();
        fetchHistory();
        setCreateForm({
          title: "",
          message: "",
          category: "General",
          priority: "Normal",
          channels: ["In-App", "Email"],
          targetAudience: "All Users",
          targetEmail: "",
          scheduledSendTime: "",
          expiryDate: "",
          selectedTemplateId: "",
        });
      } else {
        setCreateErrorMsg(data.message || "Failed to create notification.");
      }
    } catch (err: any) {
      setCreateErrorMsg(err.message || "Network error submitting notification.");
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) return;

    try {
      let res;
      if (editingAnnId) {
        res = await fetch(`/api/admin/announcements/${editingAnnId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(annForm),
        });
      } else {
        res = await fetch("/api/admin/announcements/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(annForm),
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowAnnModal(false);
        setEditingAnnId(null);
        fetchAnnouncements();
        fetchDashboardMetrics();
        window.dispatchEvent(new Event("announcements_updated"));
        setSwitchFeedback(editingAnnId ? "Announcement updated successfully." : "Announcement created and broadcasted.");
        setAnnForm({
          title: "",
          content: "",
          type: "System Maintenance",
          priority: "Normal",
          bannerStyle: "amber",
          targetAudience: "All Users",
          actionUrl: "",
          actionText: "",
          expiresAt: "",
          isActive: true,
        });
        setTimeout(() => setSwitchFeedback(null), 4000);
      }
    } catch (err) {
      console.error("Save announcement error:", err);
    }
  };

  const handleOpenEditAnn = (ann: any) => {
    setEditingAnnId(ann.id);
    setAnnForm({
      title: ann.title || "",
      content: ann.content || "",
      type: ann.type || "System Maintenance",
      priority: ann.priority || "Normal",
      bannerStyle: ann.bannerStyle || "amber",
      targetAudience: ann.targetAudience || "All Users",
      actionUrl: ann.actionUrl || "",
      actionText: ann.actionText || "",
      expiresAt: ann.expiresAt ? ann.expiresAt.substring(0, 10) : "",
      isActive: ann.isActive !== false,
    });
    setShowAnnModal(true);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      fetchAnnouncements();
      fetchDashboardMetrics();
      window.dispatchEvent(new Event("announcements_updated"));
      setSwitchFeedback("Announcement deleted.");
      setTimeout(() => setSwitchFeedback(null), 3000);
    } catch (err) {
      console.error("Delete announcement error:", err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTemplate(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error("Save template error:", err);
    }
  };

  const handleRunSelfTest = async () => {
    setTestRunning(true);
    try {
      const res = await fetch("/api/admin/module9/self-test");
      const data = await res.json();
      if (data.success) {
        setTestResults(data.testResults || []);
        setTestSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Self test error:", err);
    } finally {
      setTestRunning(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Title,Type,Audience,Channels,Sent Date,Status,Recipients"].join(",") +
      "\n" +
      historyLogs
        .map((h) => `"${h.title}","${h.type}","${h.audience}","${h.deliveryChannels?.join(";") || ""}","${h.sentDate}","${h.deliveryStatus}",${h.recipientCount}`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `notification_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered announcements based on status tab
  const filteredAnnouncements = announcements.filter((a) => {
    if (annFilterStatus === "ACTIVE") return a.isActive === true;
    if (annFilterStatus === "INACTIVE") return a.isActive === false;
    return true;
  });

  const activeAnnCount = announcements.filter((a) => a.isActive).length;
  const inactiveAnnCount = announcements.filter((a) => !a.isActive).length;

  return (
    <div className="space-y-6" id="admin-notifications-module">
      
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight">Notification & Announcement System</h1>
            <span className="px-2.5 py-0.5 bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold rounded-full">
              Module 9
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Centralized communication hub with master switches for homepage banners, user dashboard alerts, and multi-channel broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab("CREATE")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Notification</span>
          </button>
          <button
            onClick={() => {
              setEditingAnnId(null);
              setAnnForm({
                title: "",
                content: "",
                type: "System Maintenance",
                priority: "Normal",
                bannerStyle: "amber",
                targetAudience: "All Users",
                actionUrl: "",
                actionText: "",
                expiresAt: "",
                isActive: true,
              });
              setShowAnnModal(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        </div>
      </div>

      {/* Global Real-time Switchboard & Broadcast Controller */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Live Broadcast Switchboard</h3>
              <p className="text-[11px] text-slate-400">Instantly switch system-wide announcements and notification pipelines ON/OFF.</p>
            </div>
          </div>
          {switchFeedback && (
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{switchFeedback}</span>
            </div>
          )}
        </div>

        {/* Master Switches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Switch 1: Homepage & Dashboard Announcements */}
          <div className={`p-4 rounded-xl border transition-all ${
            systemSwitches.announcementsEnabled 
              ? "bg-amber-950/20 border-amber-500/40 text-amber-100" 
              : "bg-slate-950/60 border-slate-800 text-slate-400"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Megaphone className={`w-4 h-4 ${systemSwitches.announcementsEnabled ? "text-amber-400" : "text-slate-500"}`} />
                <span>Homepage Announcements</span>
              </div>
              <button
                id="btn-toggle-announcements-master"
                onClick={() => handleToggleSystemSwitch("announcements", systemSwitches.announcementsEnabled)}
                disabled={toggleLoadingKey === "announcements"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSwitches.announcementsEnabled ? "bg-amber-500" : "bg-slate-700"
                }`}
                title="Toggle Homepage Announcements"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    systemSwitches.announcementsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="font-mono">
                {systemSwitches.announcementsEnabled ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    LIVE ON HOMEPAGE ({activeAnnCount} active)
                  </span>
                ) : (
                  <span className="text-slate-500 font-semibold">MUTED (Disabled)</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500">Public & Dashboard</span>
            </div>
          </div>

          {/* Switch 2: In-App Notification Center */}
          <div className={`p-4 rounded-xl border transition-all ${
            systemSwitches.notificationsEnabled 
              ? "bg-blue-950/20 border-blue-500/40 text-blue-100" 
              : "bg-slate-950/60 border-slate-800 text-slate-400"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Bell className={`w-4 h-4 ${systemSwitches.notificationsEnabled ? "text-blue-400" : "text-slate-500"}`} />
                <span>In-App Notifications</span>
              </div>
              <button
                id="btn-toggle-notifications-master"
                onClick={() => handleToggleSystemSwitch("notifications", systemSwitches.notificationsEnabled)}
                disabled={toggleLoadingKey === "notifications"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSwitches.notificationsEnabled ? "bg-blue-600" : "bg-slate-700"
                }`}
                title="Toggle In-App Notifications"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    systemSwitches.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="font-mono">
                {systemSwitches.notificationsEnabled ? (
                  <span className="text-blue-400 font-bold">ACTIVE & DISPATCHING</span>
                ) : (
                  <span className="text-slate-500 font-semibold">PAUSED</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500">User Bell Inbox</span>
            </div>
          </div>

          {/* Switch 3: Email Dispatch Pipeline */}
          <div className={`p-4 rounded-xl border transition-all ${
            systemSwitches.emailEnabled 
              ? "bg-purple-950/20 border-purple-500/40 text-purple-100" 
              : "bg-slate-950/60 border-slate-800 text-slate-400"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Mail className={`w-4 h-4 ${systemSwitches.emailEnabled ? "text-purple-400" : "text-slate-500"}`} />
                <span>Email Gateway</span>
              </div>
              <button
                id="btn-toggle-email-master"
                onClick={() => handleToggleSystemSwitch("email", systemSwitches.emailEnabled)}
                disabled={toggleLoadingKey === "email"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSwitches.emailEnabled ? "bg-purple-600" : "bg-slate-700"
                }`}
                title="Toggle Email Dispatch"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    systemSwitches.emailEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="font-mono">
                {systemSwitches.emailEnabled ? (
                  <span className="text-purple-400 font-bold">ONLINE</span>
                ) : (
                  <span className="text-slate-500 font-semibold">OFFLINE</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500">SMTP Server</span>
            </div>
          </div>

          {/* Switch 4: SMS Gateway Gateway */}
          <div className={`p-4 rounded-xl border transition-all ${
            systemSwitches.smsEnabled 
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-100" 
              : "bg-slate-950/60 border-slate-800 text-slate-400"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Smartphone className={`w-4 h-4 ${systemSwitches.smsEnabled ? "text-emerald-400" : "text-slate-500"}`} />
                <span>SMS Gateway</span>
              </div>
              <button
                id="btn-toggle-sms-master"
                onClick={() => handleToggleSystemSwitch("sms", systemSwitches.smsEnabled)}
                disabled={toggleLoadingKey === "sms"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSwitches.smsEnabled ? "bg-emerald-600" : "bg-slate-700"
                }`}
                title="Toggle SMS Gateway"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    systemSwitches.smsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="font-mono">
                {systemSwitches.smsEnabled ? (
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                ) : (
                  <span className="text-slate-500 font-semibold">OFFLINE</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500">Telecom API</span>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "OVERVIEW" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "ANNOUNCEMENTS" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements & Homepage Banners</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
            {activeAnnCount}/{announcements.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("CREATE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "CREATE" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Create & Dispatch</span>
        </button>
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "TEMPLATES" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Templates</span>
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "HISTORY" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit & History</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("TEST_SUITE");
            handleRunSelfTest();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "TEST_SUITE" ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Module 9 Tests</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* KPI Widget Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sent Today</span>
              <p className="text-2xl font-extrabold text-white mt-1">{dashboardData?.metrics?.notificationsSentToday || 0}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Unread Total</span>
              <p className="text-2xl font-extrabold text-blue-400 mt-1">{dashboardData?.metrics?.unreadNotifications || 0}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Scheduled</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{dashboardData?.metrics?.scheduledNotifications || 0}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Banners</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{activeAnnCount}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total Dispatches</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{notifications.length}</p>
            </div>
          </div>

          {/* Quick Announcement Switch List in Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Homepage & Dashboard Announcements Switchboard</span>
                </h3>
                <p className="text-xs text-slate-400">Toggle active announcements directly from the overview.</p>
              </div>
              <button
                onClick={() => setActiveTab("ANNOUNCEMENTS")}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Manage All ({announcements.length})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {announcements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    ann.isActive
                      ? "bg-slate-950/80 border-amber-500/30"
                      : "bg-slate-950/40 border-slate-800 opacity-70"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                        ann.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
                      }`}>
                        {ann.isActive ? "ACTIVE ON HOMEPAGE" : "OFF / MUTED"}
                      </span>
                      <span className="text-[10px] text-slate-400">{ann.type}</span>
                    </div>
                    <h4 className="font-bold text-white text-xs mt-1 truncate">{ann.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ann.content}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAnnouncement(ann.id, ann.isActive)}
                      disabled={toggleLoadingKey === `ann_${ann.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        ann.isActive
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{ann.isActive ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filter & Notification Records Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <span>All Notification Dispatches</span>
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search title, content, sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={fetchNotifications}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    fetchNotifications();
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="System Maintenance">System Maintenance</option>
                  <option value="Wallet Alert">Wallet Alert</option>
                  <option value="Security Alert">Security Alert</option>
                  <option value="Verification">Verification</option>
                  <option value="Billing">Billing</option>
                  <option value="General">General</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value);
                    fetchNotifications();
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading notification dispatches...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No notifications found matching filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Title & Summary</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Channels</th>
                      <th className="p-3">Audience</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created / Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {notifications.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-semibold text-white">
                          <div>{n.title}</div>
                          <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">{n.message}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                            {n.category}
                          </span>
                        </td>
                        <td className="p-3">
                          {n.priority === "Critical" ? (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold">
                              CRITICAL
                            </span>
                          ) : n.priority === "High" ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">
                              HIGH
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">NORMAL</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {n.channels?.map((c: string) => (
                              <span key={c} className="px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[10px]">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-300">{n.targetAudience}</td>
                        <td className="p-3">
                          {n.status === "Sent" ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
                              Sent ({n.deliveredCount})
                            </span>
                          ) : n.status === "Scheduled" ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-semibold">
                              Scheduled
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-semibold">
                              {n.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS & HOMEPAGE BANNERS MANAGER */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>Homepage & Dashboard Announcement Posts</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage high-visibility banner overlays displayed directly on the public homepage and user dashboards.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingAnnId(null);
                  setAnnForm({
                    title: "",
                    content: "",
                    type: "System Maintenance",
                    priority: "Normal",
                    bannerStyle: "amber",
                    targetAudience: "All Users",
                    actionUrl: "",
                    actionText: "",
                    expiresAt: "",
                    isActive: true,
                  });
                  setShowAnnModal(true);
                }}
                id="btn-create-announcement-modal"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Announcement</span>
              </button>
            </div>
          </div>

          {/* Announcement Filters Bar */}
          <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">Filter Status:</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAnnFilterStatus("ALL")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    annFilterStatus === "ALL" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({announcements.length})
                </button>
                <button
                  onClick={() => setAnnFilterStatus("ACTIVE")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    annFilterStatus === "ACTIVE" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Active & Live ({activeAnnCount})
                </button>
                <button
                  onClick={() => setAnnFilterStatus("INACTIVE")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    annFilterStatus === "INACTIVE" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Muted / Off ({inactiveAnnCount})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono hidden md:block">
              {systemSwitches.announcementsEnabled ? (
                <span className="text-emerald-400 font-bold">● System Broadcast is ON</span>
              ) : (
                <span className="text-rose-400 font-bold">○ System Broadcast is MUTED</span>
              )}
            </div>
          </div>

          {/* Announcements Grid Cards */}
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Announcements Found</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No announcement records match the selected filter. Create a new announcement or toggle the filter above.
              </p>
              <button
                onClick={() => {
                  setEditingAnnId(null);
                  setShowAnnModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl cursor-pointer mt-2"
              >
                Create First Announcement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  id={`admin-ann-card-${ann.id}`}
                  className={`bg-slate-900 border rounded-2xl p-5 relative space-y-4 transition-all duration-200 ${
                    ann.isActive
                      ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
                      : "border-slate-800 opacity-75"
                  }`}
                >
                  {/* Top Bar with Status and ON/OFF Switch */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-extrabold ${
                          ann.bannerStyle === "rose" || ann.priority === "Critical"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : ann.bannerStyle === "emerald"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : ann.bannerStyle === "blue"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          {ann.type}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          ann.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ann.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                          {ann.isActive ? "LIVE ON HOMEPAGE" : "OFF / HIDDEN"}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base mt-1.5">{ann.title}</h4>
                    </div>

                    {/* Prominent ON / OFF Switch Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`btn-toggle-ann-${ann.id}`}
                        onClick={() => handleToggleAnnouncement(ann.id, ann.isActive)}
                        disabled={toggleLoadingKey === `ann_${ann.id}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          ann.isActive
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        }`}
                        title={ann.isActive ? "Click to Turn OFF (Hide from Homepage)" : "Click to Turn ON (Show on Homepage)"}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{ann.isActive ? "SWITCH OFF" : "SWITCH ON"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                    {ann.content}
                  </div>

                  {/* Meta / Details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TARGET AUDIENCE</span>
                      <span className="font-medium text-slate-300">{ann.targetAudience || "All Users"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PRIORITY</span>
                      <span className={`font-semibold ${ann.priority === "Critical" ? "text-rose-400" : ann.priority === "High" ? "text-amber-400" : "text-slate-300"}`}>
                        {ann.priority || "Normal"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewAnnouncement(ann)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Live Preview</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditAnn(ann)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE & DISPATCH NOTIFICATION */}
      {activeTab === "CREATE" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 max-w-4xl">
          <div>
            <h3 className="text-lg font-bold">Create and Dispatch Notification</h3>
            <p className="text-xs text-slate-400">Broadcast targeted messages to user notifications inbox, email, and SMS channels.</p>
          </div>

          {createSuccessMsg && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{createSuccessMsg}</span>
            </div>
          )}
          {createErrorMsg && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{createErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Quick Template Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pre-filled Template (Optional)</label>
              <select
                value={createForm.selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select a predefined template --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wallet Credited: ₦50,000"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Wallet Alert">Wallet Alert</option>
                  <option value="Security Alert">Security Alert</option>
                  <option value="System Maintenance">System Maintenance</option>
                  <option value="Verification">Verification</option>
                  <option value="Billing">Billing</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Message Body *</label>
              <textarea
                rows={4}
                required
                placeholder="Enter notification text. Supports merge tags: {{user_name}}, {{amount}}, {{balance}}, {{ref}}"
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Channels & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Delivery Channels</label>
                <div className="flex gap-2 flex-wrap">
                  {["In-App", "Email", "SMS", "Push Notification"].map((ch) => {
                    const active = createForm.channels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => handleChannelToggle(ch)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          active ? "bg-blue-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Target Audience & Direct Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Audience</label>
                <select
                  value={createForm.targetAudience}
                  onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All Users">All Users</option>
                  <option value="Active Users">Active Users</option>
                  <option value="Agents">Agents & Partners</option>
                  <option value="Specific User">Specific User (Email Target)</option>
                </select>
              </div>

              {createForm.targetAudience === "Specific User" && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Recipient User Email</label>
                  <input
                    type="email"
                    placeholder="user@smartlink.ng"
                    value={createForm.targetEmail}
                    onChange={(e) => setCreateForm({ ...createForm, targetEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setCreateForm({
                    title: "",
                    message: "",
                    category: "General",
                    priority: "Normal",
                    channels: ["In-App", "Email"],
                    targetAudience: "All Users",
                    targetEmail: "",
                    scheduledSendTime: "",
                    expiryDate: "",
                    selectedTemplateId: "",
                  })
                }
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Dispatch Immediately</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: TEMPLATES MANAGER */}
      {activeTab === "TEMPLATES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">System Notification Templates</h3>
              <p className="text-xs text-slate-400">Pre-configured message formats with versioning and merge tags.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono uppercase font-bold rounded">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">v{tpl.version || 1}.0</span>
                </div>

                <h4 className="font-bold text-white text-sm">{tpl.name}</h4>
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="font-semibold text-slate-300">{tpl.subjectTemplate}</div>
                  <div className="text-slate-400 font-mono text-[10px] line-clamp-2">{tpl.bodyTemplate}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex gap-1">
                    {tpl.supportedChannels?.map((ch: string) => (
                      <span key={ch} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px]">
                        {ch}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setTemplateForm({
                        id: tpl.id,
                        name: tpl.name,
                        category: tpl.category,
                        subjectTemplate: tpl.subjectTemplate,
                        bodyTemplate: tpl.bodyTemplate,
                        supportedChannels: tpl.supportedChannels || ["In-App"],
                      });
                      setSelectedTemplate(tpl);
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT & HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Notification History & Compliance Logs</h3>
              <p className="text-xs text-slate-400">Complete audit trail of system broadcasts, deliveries, and administrator actions.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>Broadcast Dispatch Records ({historyLogs.length})</span>
              </h4>
              <div className="overflow-y-auto max-h-96 space-y-2 pr-1">
                {historyLogs.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{h.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        {h.deliveryStatus}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Audience: {h.audience} | Recipients: {h.recipientCount}</p>
                    <span className="text-slate-500 text-[10px] font-mono block">
                      {h.sentDate ? new Date(h.sentDate).toLocaleString() : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Audit Trail */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Audit Trail ({auditLogs.length})</span>
              </h4>
              <div className="overflow-y-auto max-h-96 space-y-2 pr-1">
                {auditLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] text-blue-400 font-bold">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{log.details}</p>
                    <span className="text-slate-500 text-[10px]">Actor: {log.adminEmail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MODULE 9 AUTOMATED SELF-TEST SUITE */}
      {activeTab === "TEST_SUITE" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Module 9 Automated Verification Suite</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive end-to-end testing of notification storage, homepage announcements, broadcast switches, and template rendering.
                </p>
              </div>

              <button
                onClick={handleRunSelfTest}
                disabled={testRunning}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {testRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{testRunning ? "Running Diagnostics..." : "Execute Test Suite"}</span>
              </button>
            </div>

            {testSummary && (
              <div className="p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    <strong>{testSummary.passed}/{testSummary.total}</strong> Test Assertions Passed ({testSummary.passRate}%)
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">Latency: {testSummary.executionTimeMs}ms</span>
              </div>
            )}

            <div className="space-y-2">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-white block">{test.name}</span>
                      <span className="text-[11px] text-slate-400">{test.details}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    test.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {test.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT ANNOUNCEMENT MODAL */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white w-full max-w-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>{editingAnnId ? "Edit Announcement" : "Post Live Announcement"}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAnnModal(false);
                  setEditingAnnId(null);
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ⚡ Scheduled System Maintenance"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Banner Content Text *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter high-visibility announcement text visible on homepage and user dashboard..."
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Announcement Type</label>
                  <select
                    value={annForm.type}
                    onChange={(e) => setAnnForm({ ...annForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="System Maintenance">System Maintenance</option>
                    <option value="Service Downtime">Service Downtime</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="New Service Available">New Service Available</option>
                    <option value="Promotional Campaign">Promotional Campaign</option>
                    <option value="General Notice">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Color Theme</label>
                  <select
                    value={annForm.bannerStyle}
                    onChange={(e) => setAnnForm({ ...annForm, bannerStyle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="amber">Amber / Warning</option>
                    <option value="rose">Rose / Critical Alert</option>
                    <option value="emerald">Emerald / Promo & New Feature</option>
                    <option value="blue">Blue / Information</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Button CTA Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Learn More"
                    value={annForm.actionText}
                    onChange={(e) => setAnnForm({ ...annForm, actionText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Button Action URL</label>
                  <input
                    type="text"
                    placeholder="e.g. #services-section or /dashboard"
                    value={annForm.actionUrl}
                    onChange={(e) => setAnnForm({ ...annForm, actionUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Active Switch in Form */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Active on Homepage & Dashboard</span>
                  <span className="text-[10px] text-slate-400">Broadcast immediately upon saving</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAnnForm({ ...annForm, isActive: !annForm.isActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    annForm.isActive ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      annForm.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnModal(false);
                    setEditingAnnId(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>{editingAnnId ? "Update Announcement" : "Publish Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white w-full max-w-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Homepage Preview Mode</h3>
              </div>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">How it appears to visitors on the Homepage & Dashboard:</span>
              
              {/* Render Preview Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
                previewAnnouncement.bannerStyle === "rose" || previewAnnouncement.priority === "Critical"
                  ? "bg-rose-950/80 border-rose-800 text-rose-200"
                  : previewAnnouncement.bannerStyle === "emerald"
                  ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                  : previewAnnouncement.bannerStyle === "blue"
                  ? "bg-blue-950/80 border-blue-800 text-blue-200"
                  : "bg-amber-950/80 border-amber-800 text-amber-200"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {previewAnnouncement.priority === "Critical" ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : previewAnnouncement.bannerStyle === "emerald" ? (
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        {previewAnnouncement.type}
                      </span>
                      <h4 className="font-bold text-sm text-white">{previewAnnouncement.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{previewAnnouncement.content}</p>
                  </div>
                </div>

                {previewAnnouncement.actionText && (
                  <button className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-semibold text-white flex items-center gap-1 shrink-0">
                    <span>{previewAnnouncement.actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE EDIT MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Edit Notification Template</h3>
              <button onClick={() => setSelectedTemplate(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Template</label>
                <input
                  type="text"
                  required
                  value={templateForm.subjectTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, subjectTemplate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Body Template</label>
                <textarea
                  rows={3}
                  required
                  value={templateForm.bodyTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, bodyTemplate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
export default AdminNotificationsView;
