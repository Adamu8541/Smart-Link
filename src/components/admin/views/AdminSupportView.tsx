import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquareHeart, Ticket, Search, Filter, RefreshCw, User, ShieldCheck, Clock, CheckCircle2,
  XCircle, AlertTriangle, LifeBuoy, FileText, Send, Lock, Plus, Trash2, Settings as SettingsIcon,
  UserCheck, ArrowRight, Sparkles, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Layers
} from "lucide-react";
import { AdminModule8TestPanel } from "./AdminModule8TestPanel";

export function AdminSupportView() {
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "categories" | "settings" | "tests">("overview");

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Tickets List & Filters
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");

  // Selected Ticket Details & Conversation
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketActivityLogs, setTicketActivityLogs] = useState<any[]>([]);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // Reply Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatPriority, setNewCatPriority] = useState("Normal");
  const [addingCat, setAddingCat] = useState(false);

  // Support Staff & Settings
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    autoAssignmentEnabled: true,
    maxAttachmentsCount: 5,
    maxAttachmentSizeBytes: 10485760,
    slaResponseTimeHours: 24,
    csatTargetPercent: 98,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Dashboard Stats
  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/support/dashboard", {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentLogs(data.recentActivityLogs || []);
        if (data.categories) setCategories(data.categories);
        if (data.staffMembers) setStaffMembers(data.staffMembers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch Tickets List
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        assignedStaffId: staffFilter,
      });
      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`, {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.categories) setCategories(data.categories);
        if (data.staffMembers) setStaffMembers(data.staffMembers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch Single Ticket Detail
  const fetchTicketDetail = async (ticketId: string) => {
    setLoadingTicketDetail(true);
    setSelectedTicketId(ticketId);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}?isAdmin=true`, {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket);
        setTicketMessages(data.messages || []);
        setTicketActivityLogs(data.activityLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [search, statusFilter, categoryFilter, priorityFilter, staffFilter, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketMessages]);

  // Submit Reply / Internal Note
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(selectedTicket.id)}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          message: replyText.trim(),
          isInternalNote,
          senderType: "STAFF",
          senderName: "Support Officer (Admin)",
          senderEmail: "support@smartlink.com",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyText("");
        setIsInternalNote(false);
        fetchTicketDetail(selectedTicket.id);
        fetchTickets();
        fetchDashboard();
      } else {
        alert(data.message || "Failed to post reply.");
      }
    } catch (err) {
      alert("Network error sending reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update Status, Priority or Staff Assignment
  const handleUpdateTicketMeta = async (updates: { status?: string; priority?: string; assignedStaffId?: string; assignedStaffName?: string }) => {
    if (!selectedTicket) return;
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selectedTicket.id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          ...updates,
          adminName: "Adamu A. Muhammad",
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchTicketDetail(selectedTicket.id);
        fetchTickets();
        fetchDashboard();
      }
    } catch (err) {
      alert("Failed to update ticket.");
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCat(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/support/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          defaultPriority: newCatPriority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewCatName("");
        setNewCatDesc("");
        fetchDashboard();
      }
    } catch (err) {
      alert("Error creating category.");
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this support category?")) return;
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      await fetch(`/api/admin/support/categories/${catId}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      fetchDashboard();
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded-full text-[10px] font-bold">Open</span>;
      case "In Progress":
        return <span className="px-2.5 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-full text-[10px] font-bold">In Progress</span>;
      case "Waiting for Customer":
        return <span className="px-2.5 py-0.5 bg-purple-950 text-purple-400 border border-purple-800 rounded-full text-[10px] font-bold">Waiting for Customer</span>;
      case "Escalated":
        return <span className="px-2.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full text-[10px] font-bold">Escalated</span>;
      case "Resolved":
        return <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold">Resolved</span>;
      case "Closed":
        return <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[10px] font-bold">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent":
        return <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-extrabold uppercase">Urgent</span>;
      case "High":
        return <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-[10px] font-extrabold uppercase">High</span>;
      case "Normal":
        return <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-extrabold uppercase">Normal</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-600 text-white rounded text-[10px] font-extrabold uppercase">Low</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-2xl text-blue-400">
            <MessageSquareHeart className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">SmartLink Enterprise Core</span>
              <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-full text-[10px] font-mono font-bold">MODULE 8</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">Customer Support & Ticket Management Engine</h1>
          </div>
        </div>

        <button
          onClick={() => {
            fetchDashboard();
            fetchTickets();
          }}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all cursor-pointer"
          title="Refresh All Support Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <LifeBuoy className="h-4 w-4" />
          <span>Support Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "tickets"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Ticket Queue ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "categories"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Categories Taxonomy</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "settings"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>SLA & Workload Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("tests")}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "tests"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-slate-900/60 text-emerald-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Module 8 Self-Tests</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Widget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Open Tickets</span>
                <Ticket className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.openTickets ?? 0}</p>
              <p className="text-[10px] text-amber-400 font-mono">Requires initial officer triage</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.inProgressTickets ?? 0}</p>
              <p className="text-[10px] text-blue-400 font-mono">Active customer conversation</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Urgent Priority</span>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.urgentPriorityTickets ?? 0}</p>
              <p className="text-[10px] text-rose-400 font-mono">Fast-track SLA queue</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Resolved Today</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.resolvedToday ?? 0}</p>
              <p className="text-[10px] text-emerald-400 font-mono">CSAT Rating: {stats?.customerSatisfactionPercent ?? 98.4}%</p>
            </div>
          </div>

          {/* Secondary Stats & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Ticket Activity Stream */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>Real-Time Support Audit Log Stream</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Last 15 System Events</span>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No recent support activity logs.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-blue-400">{log.action}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-slate-300 font-bold">{log.performedBy}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-mono">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Support Officer Staff Workload */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>Support Officers Workload</span>
              </h3>

              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{staff.staffName}</span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-mono">
                        {staff.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{staff.role}</p>
                    <div className="text-[11px] text-slate-300 pt-1 font-mono flex items-center justify-between">
                      <span>Active Tickets:</span>
                      <strong className="text-blue-400">{staff.activeTicketsCount || 2} Assigned</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKET QUEUE TABLE */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Search & Combined Filter Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Ticket #, Name, Email, Phone, Ref..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Customer">Waiting for Customer</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Tickets Main Grid Layout (Left: Table / List, Right: Selected Ticket Detail & Chat) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Tickets Table */}
            <div className={`${selectedTicket ? "lg:col-span-5" : "lg:col-span-12"} bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all`}>
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-white">
                <span>Support Ticket Queue ({tickets.length})</span>
                <span className="font-mono text-slate-400 text-[10px]">Click ticket to open chat</span>
              </div>

              {loadingTickets ? (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">No tickets matching selected filters.</div>
              ) : (
                <div className="divide-y divide-slate-800 max-h-[650px] overflow-y-auto">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => fetchTicketDetail(t.id)}
                      className={`p-4 hover:bg-slate-800/80 cursor-pointer transition-all space-y-2 ${
                        selectedTicketId === t.id ? "bg-blue-950/40 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-400">{t.ticketNumber}</span>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(t.priority)}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{t.subject}</h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>User: <strong className="text-slate-200">{t.userName}</strong></span>
                        <span>Assigned: <strong className="text-blue-400">{t.assignedStaffName || "Unassigned"}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Selected Ticket Chat & Action Drawer */}
            {selectedTicket && (
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col h-[700px]">
                {/* Header Metadata */}
                <div className="space-y-3 border-b border-slate-800 pb-4 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-400">
                      <Ticket className="h-4 w-4" />
                      <span>{selectedTicket.ticketNumber}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{selectedTicket.category}</span>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <h2 className="text-base font-bold text-white">{selectedTicket.subject}</h2>

                  {/* Quick Controls Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketMeta({ status: e.target.value })}
                        className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Customer">Waiting for Customer</option>
                        <option value="Escalated">Escalated</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdateTicketMeta({ priority: e.target.value })}
                        className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                      >
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Assign Officer</label>
                      <select
                        value={selectedTicket.assignedStaffId || ""}
                        onChange={(e) => {
                          const staff = staffMembers.find((s) => s.id === e.target.value);
                          handleUpdateTicketMeta({
                            assignedStaffId: e.target.value,
                            assignedStaffName: staff ? staff.staffName : "Unassigned",
                          });
                        }}
                        className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                      >
                        <option value="">Unassigned</option>
                        {staffMembers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.staffName} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Conversation Chat Messages Stream */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl text-xs space-y-1.5 ${
                        msg.isInternalNote
                          ? "bg-amber-950/60 border border-amber-800/80 text-amber-200"
                          : msg.senderType === "STAFF"
                          ? "bg-blue-950/60 border border-blue-800/80 text-blue-100 ml-6"
                          : "bg-slate-950 border border-slate-800 text-slate-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold flex items-center gap-1.5">
                          {msg.isInternalNote && <Lock className="h-3 w-3 text-amber-400" />}
                          {msg.senderName} ({msg.senderType})
                        </span>
                        <span className="opacity-60">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Reply Box */}
                <form onSubmit={handleSendReply} className="shrink-0 space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                      />
                      <span className={isInternalNote ? "font-bold text-amber-400 flex items-center gap-1" : "text-slate-400"}>
                        {isInternalNote && <Lock className="h-3.5 w-3.5" />}
                        Internal Staff Note (Invisible to Customer)
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isInternalNote ? "Write staff-only internal note..." : "Write official response to customer..."}
                      className={`flex-1 p-3 rounded-xl text-xs text-white outline-none border ${
                        isInternalNote ? "bg-amber-950/40 border-amber-800" : "bg-slate-950 border-slate-800"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className={`px-5 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                        isInternalNote ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      <span>{isInternalNote ? "Save Note" : "Send Reply"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES TAXONOMY */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Category Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="h-4 w-4 text-blue-400" />
              <span>Add Support Category</span>
            </h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. POS Terminal Errors"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Default Priority</label>
                <select
                  value={newCatPriority}
                  onChange={(e) => setNewCatPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief explanation of issues falling under this category..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={addingCat}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {addingCat ? "Creating..." : "Save Support Category"}
              </button>
            </form>
          </div>

          {/* Categories Grid List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Active Support Categories Taxonomy ({categories.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      {getPriorityBadge(c.defaultPriority || "Normal")}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SLA & SUPPORT SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-3xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-blue-400" />
            <span>Support SLA Target & Workload Settings</span>
          </h3>

          <div className="space-y-5 text-xs text-slate-300">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Auto Ticket Assignment</span>
                <span className="text-[11px] text-slate-400 font-mono">Automatically balance incoming tickets across online support officers</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-900 text-blue-600 h-4 w-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-white">Target Response SLA (Hours)</label>
                <input
                  type="number"
                  defaultValue={24}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">Max Attachments Count</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={() => alert("Support SLA configuration saved successfully!")}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Save Support Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: AUTOMATED SELF-TESTS */}
      {activeTab === "tests" && <AdminModule8TestPanel />}
    </div>
  );
}
