import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Key,
  Search,
  RefreshCw,
  FileText,
  Copy,
  Check,
  Zap,
  Sliders,
  X,
  Server,
  Layers,
  ShieldCheck,
  CheckSquare
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { ApiRequestConfig, ApiRequestTestLog, ApiHeaderItem, ApiParamItem } from "../../../types";

interface ApiRequestBuilderViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

const PROVIDER_OPTIONS = [
  "Aspfiy",
  "Paystack",
  "Flutterwave",
  "VFD Bank",
  "Squad",
  "Interswitch",
  "Palmpay",
  "Prembly",
  "VerifyMe",
  "Custom Provider"
];

const AUTH_TYPES = [
  "None",
  "API Key",
  "Bearer Token",
  "Basic Authentication",
  "HMAC Signature",
  "Custom Header Authentication",
  "Custom Auth Method"
];

const CONTENT_TYPES = [
  "application/json",
  "multipart/form-data",
  "application/x-www-form-urlencoded",
  "application/xml",
  "text/plain",
  "Custom"
];

const BODY_FORMATS = [
  "JSON",
  "Form Data",
  "URL Encoded",
  "XML",
  "Plain Text",
  "Custom Format"
];

export default function ApiRequestBuilderView({ session, onNavigate }: ApiRequestBuilderViewProps) {
  const [requests, setRequests] = useState<ApiRequestConfig[]>([]);
  const [logs, setLogs] = useState<ApiRequestTestLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [activeRequest, setActiveRequest] = useState<Partial<ApiRequestConfig> | null>(null);

  // Test Runner State
  const [testResultData, setTestResultData] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch API Requests from Server
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/api-builder/requests", {
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        showToast(data.message || "Failed to load API requests.", "error");
      }
    } catch (err: any) {
      showToast("Error connecting to server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Test Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/api-builder/logs", {
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchLogs();
  }, []);

  // Open Editor for New Request
  const handleCreateNew = () => {
    setActiveRequest({
      provider: "Aspfiy",
      requestName: "",
      endpoint: "",
      httpMethod: "POST",
      authType: "Bearer Token",
      contentType: "application/json",
      acceptHeader: "application/json",
      authorizationHeader: "",
      customHeaders: [
        { key: "Content-Type", value: "application/json", enabled: true }
      ],
      bodyFormat: "JSON",
      bodyContent: '{\n  "accountNumber": "1234567890",\n  "bankCode": "058"\n}',
      queryParams: [],
      urlParams: [],
      timeout: 10000,
      retryCount: 0,
      status: "ENABLED",
      notes: ""
    });
    setIsEditorOpen(true);
  };

  // Open Editor for Editing Request
  const handleEdit = (req: ApiRequestConfig) => {
    setActiveRequest({ ...req });
    setIsEditorOpen(true);
  };

  // Save Request (Create or Update)
  const handleSaveRequest = async () => {
    if (!activeRequest) return;
    if (!activeRequest.requestName || !activeRequest.requestName.trim()) {
      showToast("Request Name is required.", "error");
      return;
    }
    if (!activeRequest.endpoint || !activeRequest.endpoint.trim()) {
      showToast("Endpoint URL is required.", "error");
      return;
    }

    try {
      const isEdit = !!activeRequest.id;
      const url = isEdit
        ? `/api/admin/api-builder/requests/${activeRequest.id}`
        : "/api/admin/api-builder/requests";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken
        },
        body: JSON.stringify(activeRequest)
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Request saved successfully!");
        setIsEditorOpen(false);
        setActiveRequest(null);
        fetchRequests();
      } else {
        showToast(data.message || "Failed to save request.", "error");
      }
    } catch (err: any) {
      showToast("Server error while saving request.", "error");
    }
  };

  // Toggle Request Enabled/Disabled
  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/api-builder/requests/${id}/toggle`, {
        method: "POST",
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: data.status } : r))
        );
      } else {
        showToast(data.message || "Failed to toggle status", "error");
      }
    } catch (err) {
      showToast("Error updating request status.", "error");
    }
  };

  // Delete Request
  const handleDeleteRequest = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/api-builder/requests/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast(data.message || "Failed to delete request.", "error");
      }
    } catch (err) {
      showToast("Error deleting request.", "error");
    }
  };

  // Run Test Request
  const handleRunTest = async (reqToTest?: Partial<ApiRequestConfig>) => {
    const target = reqToTest || activeRequest;
    if (!target || !target.endpoint) {
      showToast("Cannot test without an endpoint URL.", "error");
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResultData(null);
    setIsTestRunnerOpen(true);

    try {
      const res = await fetch("/api/admin/api-builder/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken
        },
        body: JSON.stringify(target)
      });

      const data = await res.json();
      setTestResultData(data);
      fetchLogs();
    } catch (err: any) {
      setTestError(err.message || "Failed to execute request test.");
    } finally {
      setIsTesting(false);
    }
  };

  // Header Handlers for Form
  const handleAddHeader = () => {
    if (!activeRequest) return;
    const current = activeRequest.customHeaders || [];
    setActiveRequest({
      ...activeRequest,
      customHeaders: [...current, { key: "", value: "", enabled: true }]
    });
  };

  const handleUpdateHeader = (index: number, field: keyof ApiHeaderItem, val: any) => {
    if (!activeRequest) return;
    const current = [...(activeRequest.customHeaders || [])];
    current[index] = { ...current[index], [field]: val };
    setActiveRequest({ ...activeRequest, customHeaders: current });
  };

  const handleRemoveHeader = (index: number) => {
    if (!activeRequest) return;
    const current = [...(activeRequest.customHeaders || [])];
    current.splice(index, 1);
    setActiveRequest({ ...activeRequest, customHeaders: current });
  };

  // Query Param Handlers for Form
  const handleAddQueryParam = () => {
    if (!activeRequest) return;
    const current = activeRequest.queryParams || [];
    setActiveRequest({
      ...activeRequest,
      queryParams: [...current, { key: "", value: "", enabled: true }]
    });
  };

  const handleUpdateQueryParam = (index: number, field: keyof ApiParamItem, val: any) => {
    if (!activeRequest) return;
    const current = [...(activeRequest.queryParams || [])];
    current[index] = { ...current[index], [field]: val };
    setActiveRequest({ ...activeRequest, queryParams: current });
  };

  const handleRemoveQueryParam = (index: number) => {
    if (!activeRequest) return;
    const current = [...(activeRequest.queryParams || [])];
    current.splice(index, 1);
    setActiveRequest({ ...activeRequest, queryParams: current });
  };

  // Copy to clipboard
  const handleCopyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter Requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.endpoint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = selectedProvider === "ALL" || r.provider === selectedProvider;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div id="api-request-builder-page" className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
                : "bg-rose-950/90 text-rose-300 border-rose-800"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">API Request Builder</h1>
              <p className="text-xs text-slate-400">
                Dynamically create, modify, and test payment provider request templates stored directly in the database.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => { fetchRequests(); fetchLogs(); }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsLogsOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <FileText className="h-4 w-4 text-purple-400" />
            Execution Logs ({logs.length})
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Request Config
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="grid md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search request name, provider, or endpoint URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">All Providers ({requests.length})</option>
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="ENABLED">Enabled Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading API request configurations...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Database className="h-12 w-12 text-slate-700 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No API Requests Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || selectedProvider !== "ALL" || statusFilter !== "ALL"
                  ? "No request templates match your filter parameters."
                  : "Start by creating your first dynamic API request template for payment providers."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Request Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Provider / Name</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">HTTP Method & Endpoint</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Auth & Content Type</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition">
                    {/* Provider / Name */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 font-mono text-[10px] font-semibold">
                            {req.provider}
                          </span>
                        </div>
                        <p className="font-bold text-white text-sm">{req.requestName}</p>
                        {req.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs">{req.notes}</p>}
                      </div>
                    </td>

                    {/* Method & Endpoint */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold ${
                              req.httpMethod === "POST"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : req.httpMethod === "GET"
                                ? "bg-blue-950 text-blue-400 border border-blue-800"
                                : req.httpMethod === "PUT"
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-rose-950 text-rose-400 border border-rose-800"
                            }`}
                          >
                            {req.httpMethod}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-300 truncate max-w-md select-all" title={req.endpoint}>
                          {req.endpoint}
                        </p>
                      </div>
                    </td>

                    {/* Auth & Content Type */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Key className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium text-xs">{req.authType}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">{req.contentType}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(req.id, e)}
                        className={`px-3 py-1 rounded-full font-semibold text-[10px] border transition cursor-pointer inline-flex items-center gap-1.5 ${
                          req.status === "ENABLED"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${req.status === "ENABLED" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                        {req.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunTest(req)}
                          className="p-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 text-blue-300 hover:text-white transition cursor-pointer"
                          title="Test Request"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(req)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Configuration"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id, req.requestName)}
                          className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-900/80 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REQUEST EDITOR MODAL */}
      <AnimatePresence>
        {isEditorOpen && activeRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {activeRequest.id ? "Edit API Request Configuration" : "New Dynamic API Request"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure endpoints, authentication schemas, custom headers, and payload structures.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Payment Provider *</label>
                  <input
                    type="text"
                    list="provider-suggestions"
                    value={activeRequest.provider || ""}
                    onChange={(e) => setActiveRequest({ ...activeRequest, provider: e.target.value })}
                    placeholder="e.g. Aspfiy, Paystack, Squad"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="provider-suggestions">
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* Request Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Request Name *</label>
                  <input
                    type="text"
                    value={activeRequest.requestName || ""}
                    onChange={(e) => setActiveRequest({ ...activeRequest, requestName: e.target.value })}
                    placeholder="e.g. Resolve Account Name, Initialize Payment"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* HTTP Method */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">HTTP Method *</label>
                  <select
                    value={activeRequest.httpMethod || "POST"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, httpMethod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                {/* Endpoint */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-300">Endpoint URL *</label>
                  <input
                    type="text"
                    value={activeRequest.endpoint || ""}
                    onChange={(e) => setActiveRequest({ ...activeRequest, endpoint: e.target.value })}
                    placeholder="e.g. https://api.paystack.co/bank/resolve or https://api.aspfiy.com/v1/auth/login"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Authentication Type */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Authentication Type</label>
                  <select
                    value={activeRequest.authType || "None"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, authType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {AUTH_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Content Type */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Content Type</label>
                  <select
                    value={activeRequest.contentType || "application/json"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, contentType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {CONTENT_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Accept Header */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Accept Header</label>
                  <input
                    type="text"
                    value={activeRequest.acceptHeader || "application/json"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, acceptHeader: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Authorization Header Override */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Authorization Header (Override)</label>
                  <input
                    type="text"
                    value={activeRequest.authorizationHeader || ""}
                    onChange={(e) => setActiveRequest({ ...activeRequest, authorizationHeader: e.target.value })}
                    placeholder="e.g. Bearer sk_live_xxxxxxxx or Basic dXNlcjpwYXNz"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Body Format */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Request Body Format</label>
                  <select
                    value={activeRequest.bodyFormat || "JSON"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, bodyFormat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {BODY_FORMATS.map((bf) => (
                      <option key={bf} value={bf}>{bf}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Status</label>
                  <select
                    value={activeRequest.status || "ENABLED"}
                    onChange={(e) => setActiveRequest({ ...activeRequest, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ENABLED">ENABLED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              {/* CUSTOM HEADERS SECTION (Unlimited) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-400" />
                    Custom Headers (Unlimited)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 hover:text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Header
                  </button>
                </div>

                {(!activeRequest.customHeaders || activeRequest.customHeaders.length === 0) ? (
                  <p className="text-[11px] text-slate-500 italic">No custom headers added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeRequest.customHeaders.map((hdr, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hdr.enabled !== false}
                          onChange={(e) => handleUpdateHeader(idx, "enabled", e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Header Name (e.g. x-api-key)"
                          value={hdr.key}
                          onChange={(e) => handleUpdateHeader(idx, "key", e.target.value)}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Header Value"
                          value={hdr.value}
                          onChange={(e) => handleUpdateHeader(idx, "value", e.target.value)}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 cursor-pointer transition shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QUERY PARAMS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-purple-400" />
                    Query Parameters
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQueryParam}
                    className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 hover:text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Query Param
                  </button>
                </div>

                {(!activeRequest.queryParams || activeRequest.queryParams.length === 0) ? (
                  <p className="text-[11px] text-slate-500 italic">No query parameters defined.</p>
                ) : (
                  <div className="space-y-2">
                    {activeRequest.queryParams.map((qp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={qp.enabled !== false}
                          onChange={(e) => handleUpdateQueryParam(idx, "enabled", e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Param Key (e.g. page)"
                          value={qp.key}
                          onChange={(e) => handleUpdateQueryParam(idx, "key", e.target.value)}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="text"
                          placeholder="Param Value"
                          value={qp.value}
                          onChange={(e) => handleUpdateQueryParam(idx, "value", e.target.value)}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQueryParam(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 cursor-pointer transition shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REQUEST BODY SCHEMA / PAYLOAD */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="font-bold text-xs text-white flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-400" />
                  Request Body Payload / Schema Template
                </label>
                <textarea
                  rows={6}
                  value={activeRequest.bodyContent || ""}
                  onChange={(e) => setActiveRequest({ ...activeRequest, bodyContent: e.target.value })}
                  placeholder={`{\n  "account_number": "0123456789",\n  "bank_code": "058"\n}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* NOTES */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="font-semibold text-xs text-slate-300">Administrator Notes</label>
                <textarea
                  rows={2}
                  value={activeRequest.notes || ""}
                  onChange={(e) => setActiveRequest({ ...activeRequest, notes: e.target.value })}
                  placeholder="Optional documentation notes or description for this request format..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRunTest()}
                  className="px-4 py-2.5 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-300 hover:text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Test Request Now
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRequest}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEST RUNNER MODAL */}
      <AnimatePresence>
        {isTestRunnerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Live API Request Tester</h2>
                    <p className="text-xs text-slate-400">Executes HTTP call with configured headers and formats.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTestRunnerOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isTesting ? (
                <div className="p-12 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 text-purple-500 animate-spin mx-auto" />
                  <p className="text-sm font-medium text-slate-300">Sending HTTP request to endpoint...</p>
                </div>
              ) : testError ? (
                <div className="p-6 bg-rose-950/50 border border-rose-900/80 rounded-2xl space-y-2 text-rose-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Execution Error</span>
                  </div>
                  <p className="text-xs font-mono">{testError}</p>
                </div>
              ) : testResultData ? (
                <div className="space-y-6">
                  {/* Result Header Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                          testResultData.testResult === "Success"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : testResultData.testResult === "Unauthorized"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : testResultData.testResult === "Timeout"
                            ? "bg-orange-950 text-orange-300 border-orange-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {testResultData.testResult}
                      </span>
                      <span className="font-mono text-xs text-slate-300">
                        Status: <strong className="text-white">{testResultData.httpStatus} {testResultData.statusText}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span>Response Time: <strong className="text-emerald-400">{testResultData.responseTime} ms</strong></span>
                    </div>
                  </div>

                  {/* Response Headers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-300">Response Headers</label>
                      <button
                        type="button"
                        onClick={() => handleCopyText(JSON.stringify(testResultData.responseHeaders, null, 2), "resHeaders")}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "resHeaders" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-36">
                      {JSON.stringify(testResultData.responseHeaders || {}, null, 2)}
                    </pre>
                  </div>

                  {/* Response Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-300">Response Body</label>
                      <button
                        type="button"
                        onClick={() => handleCopyText(testResultData.responseBody || "", "resBody")}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "resBody" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto max-h-64 whitespace-pre-wrap">
                      {testResultData.responseBody || "Empty Response"}
                    </pre>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTestRunnerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXECUTION LOGS DRAWER / MODAL */}
      <AnimatePresence>
        {isLogsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">API Request Execution Audit Logs</h2>
                    <p className="text-xs text-slate-400">Audit trail of tested endpoints, latencies, and HTTP status codes.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogsOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Clock className="h-10 w-10 mx-auto text-slate-700" />
                  <p className="text-sm">No test logs recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Request / Provider</th>
                        <th className="px-4 py-3 font-semibold">Result</th>
                        <th className="px-4 py-3 font-semibold">HTTP Status</th>
                        <th className="px-4 py-3 font-semibold">Response Time</th>
                        <th className="px-4 py-3 font-semibold">Tested By</th>
                        <th className="px-4 py-3 font-semibold">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-sans">
                            <p className="font-bold text-white">{log.requestName}</p>
                            <span className="text-[10px] text-blue-400">{log.provider}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.testResult === "Success"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : log.testResult === "Unauthorized"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-rose-950 text-rose-400 border border-rose-800"
                              }`}
                            >
                              {log.testResult}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-200">{log.httpStatus}</td>
                          <td className="px-4 py-3 text-emerald-400">{log.responseTime} ms</td>
                          <td className="px-4 py-3 font-sans text-slate-400">{log.testedBy}</td>
                          <td className="px-4 py-3 text-[10px] text-slate-400">{new Date(log.date).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogsOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
