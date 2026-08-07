import React, { useState, useEffect } from "react";
import {
  Webhook,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Power,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Shield,
  FileText,
  Activity,
  Server,
  Key,
  Layers
} from "lucide-react";
import { WebhookItem, WebhookLogItem, WebhookStatus } from "../../types/provider";

interface WebhookManagerAdminProps {
  adminUid: string;
  isDarkMode?: boolean;
}

const DEFAULT_EVENT_TYPES = [
  "Payment Successful",
  "Payment Failed",
  "Wallet Funding",
  "Wallet Debit",
  "Wallet Credit",
  "Transfer Successful",
  "Transfer Failed",
  "Virtual Account Created",
  "Virtual Account Funded",
  "Refund Successful",
  "Refund Failed",
  "Custom Event"
];

const DEFAULT_PROVIDERS = [
  "All Providers",
  "Monnify",
  "OPay",
  "PayVessel",
  "Paystack",
  "Flutterwave",
  "Nomba",
  "Palmpay",
  "Custom Provider"
];

export const WebhookManagerAdmin: React.FC<WebhookManagerAdminProps> = ({ adminUid }) => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [registeredProviders, setRegisteredProviders] = useState<string[]>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"CONFIGURATIONS" | "TEST_LOGS">("CONFIGURATIONS");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);

  // Testing State
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [lastTestResultData, setLastTestResultData] = useState<any | null>(null);
  const [showTestResultModal, setShowTestResultModal] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    provider: "All Providers",
    eventType: "Payment Successful",
    customEventType: "",
    url: "",
    secretToken: "",
    signatureHeader: "X-Webhook-Signature",
    httpMethod: "POST" as "POST" | "PUT" | "GET",
    retryCount: 3,
    retryInterval: 5,
    status: "Enabled" as WebhookStatus,
    notes: ""
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Webhooks & Providers from backend
  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const [whRes, provRes] = await Promise.all([
        fetch("/api/admin/webhooks"),
        fetch("/api/admin/payment-providers")
      ]);

      if (whRes.ok) {
        const whData = await whRes.json();
        if (whData.webhooks) setWebhooks(whData.webhooks);
        if (whData.webhookLogs) setWebhookLogs(whData.webhookLogs);
      }

      if (provRes.ok) {
        const provData = await provRes.json();
        if (provData.paymentProviders && Array.isArray(provData.paymentProviders)) {
          const names = provData.paymentProviders.map((p: any) => p.name);
          const combined = Array.from(new Set(["All Providers", ...names, "Monnify", "OPay", "PayVessel", "Paystack", "Flutterwave"]));
          setRegisteredProviders(combined);
        }
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
      showFeedback("error", "Failed to load webhook configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      provider: "All Providers",
      eventType: "Payment Successful",
      customEventType: "",
      url: "",
      secretToken: "",
      signatureHeader: "X-Webhook-Signature",
      httpMethod: "POST",
      retryCount: 3,
      retryInterval: 5,
      status: "Enabled",
      notes: ""
    });
    setEditingWebhook(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (wh: WebhookItem) => {
    setEditingWebhook(wh);
    const isCustomEvent = !DEFAULT_EVENT_TYPES.includes(wh.eventType);
    setFormData({
      name: wh.name,
      provider: wh.provider || "All Providers",
      eventType: isCustomEvent ? "Custom Event" : wh.eventType,
      customEventType: isCustomEvent ? wh.eventType : "",
      url: wh.url,
      secretToken: wh.secretToken || "",
      signatureHeader: wh.signatureHeader || "X-Webhook-Signature",
      httpMethod: wh.httpMethod || "POST",
      retryCount: wh.retryCount ?? 3,
      retryInterval: wh.retryInterval ?? 5,
      status: wh.status || "Enabled",
      notes: wh.notes || ""
    });
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Webhook
  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      showFeedback("error", "Webhook Name and URL are required.");
      return;
    }

    const finalEventType =
      formData.eventType === "Custom Event"
        ? formData.customEventType.trim() || "Custom Event"
        : formData.eventType;

    const payload = {
      adminUid,
      name: formData.name,
      provider: formData.provider,
      eventType: finalEventType,
      url: formData.url,
      secretToken: formData.secretToken,
      signatureHeader: formData.signatureHeader,
      httpMethod: formData.httpMethod,
      retryCount: formData.retryCount,
      retryInterval: formData.retryInterval,
      status: formData.status,
      notes: formData.notes
    };

    try {
      let res;
      if (editingWebhook) {
        res = await fetch(`/api/admin/webhooks/${editingWebhook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/admin/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showFeedback("error", data.message || "Failed to save webhook configuration.");
      } else {
        showFeedback("success", `Webhook "${formData.name}" saved successfully! URL updated dynamically.`);
        if (data.webhooks) setWebhooks(data.webhooks);
        setIsAddModalOpen(false);
        resetForm();
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error while saving webhook.");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (wh: WebhookItem) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${wh.id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showFeedback("error", data.message || "Failed to toggle status.");
      } else {
        showFeedback("success", `Webhook "${wh.name}" is now ${data.webhook.status}.`);
        if (data.webhooks) setWebhooks(data.webhooks);
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error toggling webhook status.");
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (wh: WebhookItem) => {
    if (!window.confirm(`Are you sure you want to delete webhook "${wh.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/webhooks/${wh.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showFeedback("error", data.message || "Failed to delete webhook.");
      } else {
        showFeedback("success", `Webhook "${wh.name}" deleted.`);
        if (data.webhooks) setWebhooks(data.webhooks);
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error deleting webhook.");
    }
  };

  // Test Webhook
  const handleTestWebhook = async (wh: WebhookItem) => {
    setTestingWebhookId(wh.id);
    try {
      const res = await fetch(`/api/admin/webhooks/${wh.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();

      setLastTestResultData({
        webhookName: wh.name,
        eventType: wh.eventType,
        url: wh.url,
        resultStatus: data.resultStatus,
        statusCode: data.statusCode,
        responseTimeMs: data.responseTimeMs,
        responseBody: data.responseBody
      });
      setShowTestResultModal(true);

      if (data.webhooks) setWebhooks(data.webhooks);
      if (data.webhookLogs) setWebhookLogs(data.webhookLogs);

      if (data.resultStatus === "Success") {
        showFeedback("success", `Test Succeeded! Webhook "${wh.name}" returned HTTP ${data.statusCode}.`);
      } else {
        showFeedback("error", `Test Failed: ${data.resultStatus} (HTTP ${data.statusCode || "N/A"}).`);
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error testing webhook.");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Webhooks
  const filteredWebhooks = webhooks.filter(wh => {
    const matchesSearch =
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.url.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || wh.status === statusFilter;
    const matchesProvider = providerFilter === "ALL" || wh.provider === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  const getResultBadge = (resultStatus?: string, statusCode?: number) => {
    if (resultStatus === "Success") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          Success {statusCode ? `(${statusCode})` : ""}
        </span>
      );
    }
    if (resultStatus === "Unauthorized") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          Unauthorized {statusCode ? `(${statusCode})` : ""}
        </span>
      );
    }
    if (resultStatus === "Timeout") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          Timeout
        </span>
      );
    }
    if (resultStatus === "Invalid URL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          Invalid URL
        </span>
      );
    }
    if (resultStatus === "Failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
          Failed {statusCode ? `(${statusCode})` : ""}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Untested
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl border border-indigo-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Webhook className="h-48 w-48 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-mono font-bold">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              DYNAMIC WEBHOOK MANAGEMENT SYSTEM
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Webhook Manager</h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Configure, enable, and test dynamic webhook endpoints permanently stored in the database.
              Edits apply instantly across the entire system without restart or code deployment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Add Webhook
            </button>
            <button
              onClick={fetchWebhooks}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/10"
              title="Refresh Webhooks"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("CONFIGURATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "CONFIGURATIONS"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Server className="h-4 w-4" />
            Configured Webhooks ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab("TEST_LOGS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "TEST_LOGS"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Activity className="h-4 w-4" />
            Test & Execution Logs ({webhookLogs.length})
          </button>
        </div>

        {activeTab === "CONFIGURATIONS" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search webhooks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Enabled">Enabled Only</option>
              <option value="Disabled">Disabled Only</option>
            </select>

            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">All Providers</option>
              {registeredProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: WEBHOOK CONFIGURATIONS GRID */}
      {activeTab === "CONFIGURATIONS" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading webhook configurations...</p>
            </div>
          ) : filteredWebhooks.length === 0 ? (
            <div className="py-16 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <Webhook className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Webhooks Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No webhooks match your search criteria. Click "Add Webhook" above to create a new dynamic webhook endpoint.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Create Webhook
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWebhooks.map(wh => (
                <div
                  key={wh.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Name, Status & Provider */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{wh.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              wh.status === "Enabled"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {wh.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <Server className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{wh.provider || "All Providers"}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 font-mono border border-indigo-200 dark:border-indigo-800">
                        {wh.httpMethod || "POST"}
                      </span>
                    </div>

                    {/* Event Type Badge */}
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-bold">Event Type</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{wh.eventType}</span>
                    </div>

                    {/* Webhook URL Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Endpoint URL</span>
                      <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between gap-2 border border-slate-800">
                        <span className="truncate text-[11px] text-emerald-400" title={wh.url}>{wh.url}</span>
                        <button
                          onClick={() => copyToClipboard(wh.url, wh.id)}
                          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Copy URL"
                        >
                          {copiedId === wh.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 font-sans block text-[10px]">Signature Header:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{wh.signatureHeader || "X-Webhook-Signature"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block text-[10px]">Retry Policy:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{wh.retryCount ?? 3} retries / {wh.retryInterval ?? 5}s</span>
                      </div>
                    </div>

                    {/* Last Tested & Status Panel */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-sans">Last Result:</span>
                        <div>{getResultBadge(wh.lastResult, wh.lastStatusCode)}</div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-sans text-slate-400 text-[10px]">Last Tested:</span>
                        <span>{wh.lastTestedAt ? new Date(wh.lastTestedAt).toLocaleString() : "Never"}</span>
                      </div>
                    </div>

                    {wh.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                        "{wh.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTestWebhook(wh)}
                      disabled={testingWebhookId === wh.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Send simulated webhook payload"
                    >
                      {testingWebhookId === wh.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Test Webhook
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(wh)}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          wh.status === "Enabled"
                            ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        }`}
                        title={wh.status === "Enabled" ? "Disable Webhook" : "Enable Webhook"}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(wh)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                        title="Edit Webhook"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteWebhook(wh)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
                        title="Delete Webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEST & EXECUTION AUDIT LOGS */}
      {activeTab === "TEST_LOGS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Webhook Execution & Audit Logs</h3>
              <p className="text-xs text-slate-500">Detailed records of simulated tests and dynamic webhook deliveries</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-mono font-bold">
              Total Logs: {webhookLogs.length}
            </span>
          </div>

          {webhookLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No webhook test or execution logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Webhook Name</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Result Status</th>
                    <th className="p-3">HTTP Code</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Tested By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {webhookLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-slate-500 font-sans whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white font-sans">{log.webhookName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{log.provider}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{log.eventType}</td>
                      <td className="p-3">{getResultBadge(log.resultStatus, log.statusCode)}</td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{log.statusCode || "N/A"}</td>
                      <td className="p-3 text-slate-500">{log.responseTimeMs} ms</td>
                      <td className="p-3 text-slate-400 font-sans">{log.testedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT WEBHOOK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-left space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingWebhook ? "Edit Webhook Endpoint" : "Add New Dynamic Webhook"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure URL, headers, and event hooks permanently in DB</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Webhook Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Webhook Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Primary PayVessel Funding Webhook"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Provider Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {registeredProviders.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Event Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Event Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={e => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {DEFAULT_EVENT_TYPES.map(evt => (
                      <option key={evt} value={evt}>{evt}</option>
                    ))}
                  </select>
                </div>

                {formData.eventType === "Custom Event" && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Custom Event Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., user.subscription.renewed"
                      value={formData.customEventType}
                      onChange={e => setFormData({ ...formData, customEventType: e.target.value })}
                      className="w-full px-3.5 py-2 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                {/* Webhook URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Webhook URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourdomain.com/api/webhooks/listener"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Saving changes here immediately updates the target destination across all services.</p>
                </div>

                {/* Secret Token */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Secret Token (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="whsec_..."
                    value={formData.secretToken}
                    onChange={e => setFormData({ ...formData, secretToken: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Signature Header */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Signature Header
                  </label>
                  <input
                    type="text"
                    placeholder="X-Webhook-Signature"
                    value={formData.signatureHeader}
                    onChange={e => setFormData({ ...formData, signatureHeader: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* HTTP Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    HTTP Method
                  </label>
                  <select
                    value={formData.httpMethod}
                    onChange={e => setFormData({ ...formData, httpMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="GET">GET</option>
                  </select>
                </div>

                {/* Retry Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Retry Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.retryCount}
                    onChange={e => setFormData({ ...formData, retryCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Retry Interval */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Retry Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3600}
                    value={formData.retryInterval}
                    onChange={e => setFormData({ ...formData, retryInterval: parseInt(e.target.value) || 5 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Status Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as WebhookStatus })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal reference notes..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {editingWebhook ? "Save Changes" : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST RESULT DRAWER / MODAL */}
      {showTestResultModal && lastTestResultData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-sans">
                  Webhook Test Results
                </h3>
              </div>
              <button
                onClick={() => setShowTestResultModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-sans font-bold">Webhook:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{lastTestResultData.webhookName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-sans font-bold">Event Type:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{lastTestResultData.eventType}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-sans font-bold">Result Status:</span>
                <div>{getResultBadge(lastTestResultData.resultStatus, lastTestResultData.statusCode)}</div>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-sans font-bold">HTTP Code:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{lastTestResultData.statusCode || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-sans font-bold">Response Latency:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{lastTestResultData.responseTimeMs} ms</span>
              </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="font-sans font-bold text-slate-500 text-[11px]">Endpoint URL:</span>
              <div className="p-2 bg-slate-950 text-emerald-400 rounded-xl text-[11px] truncate">
                {lastTestResultData.url}
              </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="font-sans font-bold text-slate-500 text-[11px]">Response Body:</span>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 whitespace-pre-wrap border border-slate-800">
                {lastTestResultData.responseBody || "No response body returned."}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTestResultModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer font-sans"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagerAdmin;
