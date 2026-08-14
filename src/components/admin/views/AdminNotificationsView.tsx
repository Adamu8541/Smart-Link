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
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthService";

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

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

  // Announcement Form Modal State
  const [showAnnModal, setShowAnnModal] = useState(false);
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
  });

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

  useEffect(() => {
    fetchDashboardMetrics();
    fetchNotifications();
    fetchAnnouncements();
    fetchTemplates();
    fetchHistory();
  }, []);

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

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) return;

    try {
      const res = await fetch("/api/admin/announcements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAnnModal(false);
        fetchAnnouncements();
        fetchDashboardMetrics();
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
        });
      }
    } catch (err) {
      console.error("Create announcement error:", err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      fetchAnnouncements();
      fetchDashboardMetrics();
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

  return (
    <div className="space-y-6">
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
            Centralized communication hub for multi-channel broadcasts, scheduled notices, dashboard banners, and automated notification templates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("CREATE")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
          <button
            onClick={() => setShowAnnModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
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
          onClick={() => setActiveTab("CREATE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "CREATE" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Create & Send</span>
        </button>
        <button
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "ANNOUNCEMENTS" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements ({announcements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "TEMPLATES" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Templates ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "HISTORY" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Delivery History</span>
        </button>
        <button
          onClick={() => setActiveTab("TEST_SUITE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === "TEST_SUITE" ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:text-white hover:bg-purple-900/40"
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
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{dashboardData?.metrics?.activeAnnouncements || 0}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Failed Deliveries</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{dashboardData?.metrics?.failedDeliveries || 0}</p>
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
                        <td className="p-3 text-slate-400 font-mono">
                          {new Date(n.sentAt || n.createdAt).toLocaleString()}
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

      {/* TAB 2: CREATE & SEND NOTIFICATION */}
      {activeTab === "CREATE" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-lg">Broadcast / Direct Notification Dispatcher</h3>
              <p className="text-slate-400 text-xs mt-1">Configure multi-channel notification parameters, audience rules, and delivery schedule.</p>
            </div>

            {createSuccessMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            {createErrorMsg && (
              <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Template Quick Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Load from Pre-Configured Template (Optional)</label>
                <select
                  value={createForm.selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled Network Upgrade"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="System Maintenance">System Maintenance</option>
                    <option value="Wallet Alert">Wallet Alert</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Verification">Verification</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type notification text or paste merge tags e.g. {{user_name}}, {{amount}}, {{ref}}..."
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                />
              </div>

              {/* Priority & Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Highlighted Badge)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={createForm.targetAudience}
                    onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Active Users">Active Users Only</option>
                    <option value="Verified Users">Verified Users Only</option>
                    <option value="Unverified Users">Unverified Users Only</option>
                    <option value="Wallet Users">Wallet Funded Users</option>
                    <option value="Individual User">Individual User (Target Email)</option>
                    <option value="Administrators">Administrators & Staff</option>
                  </select>
                </div>
              </div>

              {createForm.targetAudience === "Individual User" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target User Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@example.com"
                    value={createForm.targetEmail}
                    onChange={(e) => setCreateForm({ ...createForm, targetEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Delivery Channels Multi-select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Delivery Channels (Multi-select)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["In-App", "Email", "SMS", "Push Notification"].map((ch) => {
                    const active = createForm.channels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => handleChannelToggle(ch)}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span>{ch}</span>
                        <CheckCircle2 className={`w-4 h-4 ${active ? "text-blue-400" : "text-transparent"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Send Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={createForm.scheduledSendTime}
                    onChange={(e) => setCreateForm({ ...createForm, scheduledSendTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={createForm.expiryDate}
                    onChange={(e) => setCreateForm({ ...createForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{createForm.scheduledSendTime ? "Schedule Notification" : "Dispatch Broadcast Now"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Audience Reach Preview Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Audience Reach Summary</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400">Target Segment</span>
                  <span className="font-semibold text-white">{createForm.targetAudience}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400">Selected Channels</span>
                  <span className="font-semibold text-blue-400">{createForm.channels.join(", ")}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400">Dispatch Mode</span>
                  <span className="font-semibold text-emerald-400">
                    {createForm.scheduledSendTime ? "Scheduled" : "Instant"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-3">Supported Merge Tags</h4>
              <p className="text-xs text-slate-400">Click to copy tag into message template:</p>
              <div className="flex flex-wrap gap-1.5">
                {["{{user_name}}", "{{amount}}", "{{balance}}", "{{ref}}", "{{service_name}}", "{{ticket_id}}", "{{reason}}"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setCreateForm({ ...createForm, message: createForm.message + " " + tag })}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 rounded text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS MANAGER */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Dashboard Announcement Posts</h3>
              <p className="text-xs text-slate-400">Manage high-visibility banner overlays displayed on user dashboards.</p>
            </div>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {ann.type}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{ann.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 hover:bg-rose-500/20 rounded text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Audience: {ann.targetAudience}</span>
                  {ann.actionText && <span className="text-blue-400">CTA: {ann.actionText}</span>}
                </div>
              </div>
            ))}
          </div>
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
              <div key={tpl.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">{tpl.category}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                      v{tpl.version || 1}.0
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">{tpl.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-1">Subject: {tpl.subjectTemplate}</p>
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 line-clamp-3">
                    {tpl.bodyTemplate}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">{tpl.supportedChannels?.join(", ")}</span>
                  <button
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setTemplateForm({
                        id: tpl.id,
                        name: tpl.name,
                        category: tpl.category,
                        subjectTemplate: tpl.subjectTemplate,
                        bodyTemplate: tpl.bodyTemplate,
                        supportedChannels: tpl.supportedChannels || ["In-App"],
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DELIVERY HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Delivery & Audit History Ledger</h3>
              <p className="text-xs text-slate-400">Historical delivery receipts, recipient counts, and administrative audit logs.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Audience</th>
                    <th className="p-3">Channels</th>
                    <th className="p-3">Sent Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Recipients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyLogs.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{h.title}</td>
                      <td className="p-3 font-mono">{h.type}</td>
                      <td className="p-3">{h.audience}</td>
                      <td className="p-3">{h.deliveryChannels?.join(", ")}</td>
                      <td className="p-3 text-slate-400 font-mono">{new Date(h.sentDate).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-emerald-400">{h.deliveryStatus}</td>
                      <td className="p-3 font-mono">{h.recipientCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 relative text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg">Post Dashboard Announcement Banner</h3>
              <button onClick={() => setShowAnnModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Network Upgrade"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type announcement message displayed in user dashboard header banner..."
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={annForm.type}
                    onChange={(e) => setAnnForm({ ...annForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="System Maintenance">System Maintenance</option>
                    <option value="New Service Available">New Service Available</option>
                    <option value="Holiday Notice">Holiday Notice</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Promotional Campaign">Promotional Campaign</option>
                    <option value="Service Downtime">Service Downtime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Style Preset</label>
                  <select
                    value={annForm.bannerStyle}
                    onChange={(e) => setAnnForm({ ...annForm, bannerStyle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="amber">Amber (Warning)</option>
                    <option value="rose">Rose (Critical)</option>
                    <option value="emerald">Emerald (Feature)</option>
                    <option value="blue">Blue (Info)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CTA Action Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Enable 2FA Now"
                    value={annForm.actionText}
                    onChange={(e) => setAnnForm({ ...annForm, actionText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CTA Action URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /settings"
                    value={annForm.actionUrl}
                    onChange={(e) => setAnnForm({ ...annForm, actionUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Publish Banner Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEMPLATE MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 relative text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg">Edit Template ({selectedTemplate.name})</h3>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Template *</label>
                <input
                  type="text"
                  required
                  value={templateForm.subjectTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, subjectTemplate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Body Template *</label>
                <textarea
                  rows={4}
                  required
                  value={templateForm.bodyTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, bodyTemplate: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl"
                >
                  Save & Bump Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
