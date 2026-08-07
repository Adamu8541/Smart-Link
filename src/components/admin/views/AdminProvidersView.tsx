import React, { useState, useEffect } from "react";
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  ArrowRightLeft,
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Layers,
  Database,
  Terminal,
  Cpu,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  Webhook,
  Key,
  FileText,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { ProviderDetailDrawer } from "./ProviderDetailDrawer";
import { AdminModule6TestPanel } from "./AdminModule6TestPanel";

export function AdminProvidersView() {
  const [providers, setProviders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    pageNum: 1,
    limitNum: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [environment, setEnvironment] = useState("ALL");
  const [healthStatus, setHealthStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selected Provider for Drawer
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add Provider Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormTab, setAddFormTab] = useState<"general" | "api" | "webhook" | "security" | "features" | "status">("general");
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Add Provider Form Fields
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState("PAYMENT_GATEWAY");
  const [addDescription, setAddDescription] = useState("");
  const [addLogoUrl, setAddLogoUrl] = useState("");
  const [addBaseUrl, setAddBaseUrl] = useState("");
  const [addApiVersion, setAddApiVersion] = useState("v1.0");
  const [addAuthMethod, setAddAuthMethod] = useState("API_KEY");
  const [addApiKey, setAddApiKey] = useState("");
  const [addSecretKey, setAddSecretKey] = useState("");
  const [addPublicKey, setAddPublicKey] = useState("");
  const [addPrivateKey, setAddPrivateKey] = useState("");
  const [addMerchantId, setAddMerchantId] = useState("");
  const [addClientId, setAddClientId] = useState("");
  const [addClientSecret, setAddClientSecret] = useState("");
  const [addBusinessId, setAddBusinessId] = useState("");

  const [addWebhookUrl, setAddWebhookUrl] = useState("");
  const [addCallbackUrl, setAddCallbackUrl] = useState("");
  const [addRedirectUrl, setAddRedirectUrl] = useState("");
  const [addSuccessUrl, setAddSuccessUrl] = useState("");
  const [addFailedUrl, setAddFailedUrl] = useState("");
  const [addCancelUrl, setAddCancelUrl] = useState("");
  const [addWebhookSecret, setAddWebhookSecret] = useState("");

  const [addEncryptionKey, setAddEncryptionKey] = useState("");
  const [addSignatureKey, setAddSignatureKey] = useState("");
  const [addRsaPublicKey, setAddRsaPublicKey] = useState("");
  const [addRsaPrivateKey, setAddRsaPrivateKey] = useState("");
  const [addHmacSecret, setAddHmacSecret] = useState("");

  const [addSupportsWalletFunding, setAddSupportsWalletFunding] = useState(true);
  const [addSupportsBankTransfer, setAddSupportsBankTransfer] = useState(true);
  const [addSupportsCardPayment, setAddSupportsCardPayment] = useState(true);
  const [addSupportsVirtualAccount, setAddSupportsVirtualAccount] = useState(true);
  const [addSupportsPaymentLink, setAddSupportsPaymentLink] = useState(true);
  const [addSupportsPayout, setAddSupportsPayout] = useState(true);
  const [addSupportsRefund, setAddSupportsRefund] = useState(true);
  const [addSupportsTxVerification, setAddSupportsTxVerification] = useState(true);

  const [addStatus, setAddStatus] = useState("ENABLED");
  const [addEnvironment, setAddEnvironment] = useState("Production");
  const [addIsDefault, setAddIsDefault] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [search, category, status, environment, healthStatus, pagination.pageNum, sortBy, sortOrder]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const queryParams = new URLSearchParams({
        search,
        category,
        status,
        environment,
        healthStatus,
        page: pagination.pageNum.toString(),
        limit: pagination.limitNum.toString(),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/providers?${queryParams.toString()}`, {
        headers: { "x-admin-token": token },
      });

      const json = await res.json();
      if (json.success) {
        setProviders(json.providers || []);
        setPagination(json.pagination || pagination);
        setMetrics(json.metrics || null);
      } else {
        setToast("Failed to fetch API providers list.");
      }
    } catch (err: any) {
      setToast("Network error communicating with API Providers Engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (providerId: string) => {
    setSelectedProviderId(providerId);
    setIsDrawerOpen(true);
  };

  const handleToggleStatus = async (provider: any) => {
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const adminUid = localStorage.getItem("smartlink_admin_uid") || "admin_master";
      const newEnabled = !(provider.enabled || provider.isActive || provider.status === "ENABLED");

      const res = await fetch(`/api/admin/providers/${provider.id}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          adminUid,
          enabled: newEnabled,
        }),
      });

      const json = await res.json();
      if (json.success || json.enabled !== undefined) {
        setToast(`Provider "${provider.name}" ${newEnabled ? "Activated" : "Deactivated"}.`);
        fetchProviders();
      } else {
        setToast(json.message || "Failed to toggle provider status.");
      }
    } catch (err) {
      setToast("Network error toggling status.");
    }
  };

  const handleSetDefault = async (provider: any) => {
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch(`/api/admin/providers/${provider.id}/set-default`, {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success) {
        setToast(json.message);
        fetchProviders();
      }
    } catch (err) {
      setToast("Error setting default provider.");
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch(`/api/admin/providers/${providerId}/test-connection`, {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success) {
        setToast(`Connection test successful! Latency: ${json.testResult?.latencyMs || 120}ms`);
        fetchProviders();
      } else {
        setToast(`Connection test failed: ${json.message}`);
      }
    } catch (err) {
      setToast("Error pinging provider.");
    }
  };

  const handleDeleteProvider = async (provider: any) => {
    if (!window.confirm(`Are you sure you want to delete "${provider.name}"?`)) return;
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const adminUid = localStorage.getItem("smartlink_admin_uid") || "admin_master";
      const res = await fetch(`/api/admin/providers/${provider.id}?adminUid=${adminUid}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success) {
        setToast(`Provider "${provider.name}" deleted successfully.`);
        fetchProviders();
      }
    } catch (err) {
      setToast("Error deleting provider.");
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addBaseUrl) {
      setToast("Provider Name and Base URL are required.");
      return;
    }

    setSubmittingAdd(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const adminUid = localStorage.getItem("smartlink_admin_uid") || "admin_master";

      const payload = {
        adminUid,
        provider: {
          name: addName,
          category: addCategory,
          providerType: addCategory,
          description: addDescription,
          logoUrl: addLogoUrl,
          baseUrl: addBaseUrl,
          apiVersion: addApiVersion,
          authMethod: addAuthMethod,
          apiKey: addApiKey,
          secretKey: addSecretKey,
          publicKey: addPublicKey,
          privateKey: addPrivateKey,
          merchantId: addMerchantId,
          clientId: addClientId,
          clientSecret: addClientSecret,
          businessId: addBusinessId,
          webhookUrl: addWebhookUrl,
          callbackUrl: addCallbackUrl,
          redirectUrl: addRedirectUrl,
          successUrl: addSuccessUrl,
          failedUrl: addFailedUrl,
          cancelUrl: addCancelUrl,
          webhookSecret: addWebhookSecret,
          encryptionKey: addEncryptionKey,
          signatureKey: addSignatureKey,
          rsaPublicKey: addRsaPublicKey,
          rsaPrivateKey: addRsaPrivateKey,
          hmacSecret: addHmacSecret,
          supportsWalletFunding: addSupportsWalletFunding,
          supportsBankTransfer: addSupportsBankTransfer,
          supportsCardPayment: addSupportsCardPayment,
          supportsVirtualAccount: addSupportsVirtualAccount,
          supportsPaymentLink: addSupportsPaymentLink,
          supportsPayout: addSupportsPayout,
          supportsRefund: addSupportsRefund,
          supportsTxVerification: addSupportsTxVerification,
          status: addStatus,
          enabled: addStatus === "ENABLED",
          isActive: addStatus === "ENABLED",
          environment: addEnvironment,
          isDefault: addIsDefault,
        },
      };

      const res = await fetch("/api/admin/providers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToast(`Provider "${addName}" added successfully.`);
        setIsAddModalOpen(false);
        // Reset fields
        setAddName("");
        setAddBaseUrl("");
        setAddApiKey("");
        setAddSecretKey("");
        fetchProviders();
      } else {
        setToast(json.error || json.message || "Failed to add provider.");
      }
    } catch (err) {
      setToast("Network error creating provider.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const categoriesList = [
    "ALL",
    "WALLET_ENGINE",
    "PAYMENT_GATEWAY",
    "IDENTITY_API",
    "TELECOM_VTU",
    "UTILITY_BILL",
    "EDUCATION_PIN",
    "SMS",
    "EMAIL",
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 mb-1">
            <span>ADMINISTRATIVE CONTROL</span>
            <span>/</span>
            <span className="text-slate-400">MODULE 6</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Server className="h-8 w-8 text-blue-500" />
            <span>API Provider Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic provider manager for Payment Gateways, Wallet Engines, Identity APIs, VTU & Utilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Provider</span>
          </button>

          <button
            onClick={fetchProviders}
            disabled={loading}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-slate-900 border border-blue-800/80 text-blue-300 text-xs font-medium rounded-2xl flex items-center justify-between shadow-lg">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Dashboard KPI Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Providers</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics?.activeProviders ?? "--"}</div>
          <span className="text-[10px] text-emerald-400 font-medium">Online & Enabled</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Offline / Degraded</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{metrics?.offlineProviders ?? "--"}</div>
          <span className="text-[10px] text-slate-500 font-medium font-mono">Requires Attention</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Avg Response Time</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {metrics?.avgResponseTimeMs ? `${metrics.avgResponseTimeMs} ms` : "--"}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Roundtrip Latency</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Success Rate</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {metrics?.overallSuccessRate ? `${metrics.overallSuccessRate}%` : "--"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Systemwide SLA</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Failovers Today</span>
            <ArrowRightLeft className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">{metrics?.failoversToday ?? 0}</div>
          <span className="text-[10px] text-slate-400 font-medium">Auto-Switch Triggers</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Registered Providers</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-200">{metrics?.totalProviders ?? "--"}</div>
          <span className="text-[10px] text-slate-500 font-medium">Total Integrations</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search provider name, base URL, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageNum: 1 }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={environment}
              onChange={(e) => {
                setEnvironment(e.target.value);
                setPagination((p) => ({ ...p, pageNum: 1 }));
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Environments</option>
              <option value="Production">Production</option>
              <option value="Sandbox">Sandbox</option>
              <option value="Development">Development</option>
            </select>

            <select
              value={healthStatus}
              onChange={(e) => {
                setHealthStatus(e.target.value);
                setPagination((p) => ({ ...p, pageNum: 1 }));
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Health Statuses</option>
              <option value="ONLINE">ONLINE</option>
              <option value="SLOW_RESPONSE">SLOW_RESPONSE</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, pageNum: 1 }));
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ENABLED">ENABLED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Categories:</span>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPagination((p) => ({ ...p, pageNum: 1 }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                category === cat
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Providers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-4 px-6">Provider Name</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Environment</th>
                <th className="py-4 px-4">Health & Status</th>
                <th className="py-4 px-4">Default</th>
                <th className="py-4 px-4">Latency</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
                    <span>Loading API providers directory...</span>
                  </td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No providers matched your filter criteria.
                  </td>
                </tr>
              ) : (
                providers.map((p) => {
                  const isEnabled = p.enabled || p.isActive || p.status === "ENABLED";
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-black text-xs shrink-0 flex items-center justify-center h-9 w-9 overflow-hidden">
                            {p.logoUrl ? (
                              <img src={p.logoUrl} alt={p.name} className="h-full w-full object-contain" />
                            ) : (
                              p.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.isDefault && (
                                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-bold rounded">DEFAULT</span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono line-clamp-1">{p.baseUrl}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-300">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px] font-semibold">
                          {p.category || p.providerType}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            p.environment === "Production"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : p.environment === "Sandbox"
                              ? "bg-amber-950 text-amber-400 border-amber-800"
                              : "bg-purple-950 text-purple-400 border-purple-800"
                          }`}
                        >
                          {p.environment || "Production"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            title={isEnabled ? "Disable Provider" : "Enable Provider"}
                            className="cursor-pointer"
                          >
                            {isEnabled ? (
                              <ToggleRight className="h-6 w-6 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-600" />
                            )}
                          </button>
                          <span className={`font-bold text-xs ${isEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                            {isEnabled ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {p.isDefault ? (
                          <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                            <Check className="h-4 w-4" /> Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(p)}
                            className="py-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-blue-400">
                        {p.avgResponseTimeMs || p.avgResponseTime || 180} ms
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTestConnection(p.id)}
                            title="Test Connection Ping"
                            className="p-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-400 rounded-lg cursor-pointer transition-all"
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(p.id)}
                            className="py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600 border border-blue-800 text-blue-400 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            <span>Manage</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProvider(p)}
                            title="Delete Provider"
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-400 rounded-lg cursor-pointer transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            Showing <span className="font-bold text-white">{providers.length}</span> of{" "}
            <span className="font-bold text-white">{pagination.totalRecords}</span> providers
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.pageNum <= 1}
              onClick={() => setPagination((p) => ({ ...p, pageNum: p.pageNum - 1 }))}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white">
              Page {pagination.pageNum} of {pagination.totalPages}
            </span>

            <button
              disabled={pagination.pageNum >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, pageNum: p.pageNum + 1 }))}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Module 6 Automated Test Panel */}
      <AdminModule6TestPanel />

      {/* Provider Details Drawer */}
      <ProviderDetailDrawer
        providerId={selectedProviderId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onProviderUpdated={fetchProviders}
      />

      {/* ADD PROVIDER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-950 border border-blue-800 rounded-2xl text-blue-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Add New Dynamic Provider</h2>
                  <p className="text-xs text-slate-400">Configure credentials, webhooks, security keys & features for a custom provider.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto">
              {[
                { id: "general", label: "General", icon: FileText },
                { id: "api", label: "API Credentials", icon: Key },
                { id: "webhook", label: "Webhook & URLs", icon: Webhook },
                { id: "security", label: "Security Keys", icon: Lock },
                { id: "features", label: "Features", icon: Sliders },
                { id: "status", label: "Status & Default", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddFormTab(tab.id as any)}
                    className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                      addFormTab === tab.id
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateProvider} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* TAB 1: GENERAL */}
              {addFormTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Provider Name *</label>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="e.g. OPay Merchant Services"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Provider Type / Category</label>
                      <select
                        value={addCategory}
                        onChange={(e) => setAddCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="PAYMENT_GATEWAY">PAYMENT_GATEWAY</option>
                        <option value="WALLET_ENGINE">WALLET_ENGINE</option>
                        <option value="IDENTITY_API">IDENTITY_API</option>
                        <option value="TELECOM_VTU">TELECOM_VTU</option>
                        <option value="UTILITY_BILL">UTILITY_BILL</option>
                        <option value="EDUCATION_PIN">EDUCATION_PIN</option>
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">EMAIL</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder="Brief provider description..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={addLogoUrl}
                      onChange={(e) => setAddLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: API CREDENTIALS */}
              {addFormTab === "api" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Base URL *</label>
                      <input
                        type="text"
                        value={addBaseUrl}
                        onChange={(e) => setAddBaseUrl(e.target.value)}
                        placeholder="https://api.provider.com/v1"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">API Version</label>
                      <input
                        type="text"
                        value={addApiVersion}
                        onChange={(e) => setAddApiVersion(e.target.value)}
                        placeholder="v1.0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">API Key</label>
                      <input
                        type="password"
                        value={addApiKey}
                        onChange={(e) => setAddApiKey(e.target.value)}
                        placeholder="API Key"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Secret Key</label>
                      <input
                        type="password"
                        value={addSecretKey}
                        onChange={(e) => setAddSecretKey(e.target.value)}
                        placeholder="Secret Key"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Public Key</label>
                      <input
                        type="text"
                        value={addPublicKey}
                        onChange={(e) => setAddPublicKey(e.target.value)}
                        placeholder="Public Key"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Private Key</label>
                      <input
                        type="password"
                        value={addPrivateKey}
                        onChange={(e) => setAddPrivateKey(e.target.value)}
                        placeholder="Private Key"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Merchant ID</label>
                      <input
                        type="text"
                        value={addMerchantId}
                        onChange={(e) => setAddMerchantId(e.target.value)}
                        placeholder="Merchant ID"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Client ID</label>
                      <input
                        type="text"
                        value={addClientId}
                        onChange={(e) => setAddClientId(e.target.value)}
                        placeholder="Client ID"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Client Secret</label>
                      <input
                        type="password"
                        value={addClientSecret}
                        onChange={(e) => setAddClientSecret(e.target.value)}
                        placeholder="Client Secret"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Business ID</label>
                      <input
                        type="text"
                        value={addBusinessId}
                        onChange={(e) => setAddBusinessId(e.target.value)}
                        placeholder="Business ID"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WEBHOOK & URLS */}
              {addFormTab === "webhook" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Webhook URL</label>
                      <input
                        type="text"
                        value={addWebhookUrl}
                        onChange={(e) => setAddWebhookUrl(e.target.value)}
                        placeholder="https://example.com/api/webhooks/..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Webhook Secret</label>
                      <input
                        type="password"
                        value={addWebhookSecret}
                        onChange={(e) => setAddWebhookSecret(e.target.value)}
                        placeholder="Webhook Signing Secret"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Callback URL</label>
                      <input
                        type="text"
                        value={addCallbackUrl}
                        onChange={(e) => setAddCallbackUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Redirect URL</label>
                      <input
                        type="text"
                        value={addRedirectUrl}
                        onChange={(e) => setAddRedirectUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Success URL</label>
                      <input
                        type="text"
                        value={addSuccessUrl}
                        onChange={(e) => setAddSuccessUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Failed URL</label>
                      <input
                        type="text"
                        value={addFailedUrl}
                        onChange={(e) => setAddFailedUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cancel URL</label>
                      <input
                        type="text"
                        value={addCancelUrl}
                        onChange={(e) => setAddCancelUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SECURITY KEYS */}
              {addFormTab === "security" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Encryption Key</label>
                      <input
                        type="password"
                        value={addEncryptionKey}
                        onChange={(e) => setAddEncryptionKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Signature Key</label>
                      <input
                        type="password"
                        value={addSignatureKey}
                        onChange={(e) => setAddSignatureKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">RSA Public Key</label>
                      <textarea
                        rows={2}
                        value={addRsaPublicKey}
                        onChange={(e) => setAddRsaPublicKey(e.target.value)}
                        placeholder="-----BEGIN PUBLIC KEY-----"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">RSA Private Key</label>
                      <textarea
                        rows={2}
                        value={addRsaPrivateKey}
                        onChange={(e) => setAddRsaPrivateKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">HMAC Secret</label>
                    <input
                      type="password"
                      value={addHmacSecret}
                      onChange={(e) => setAddHmacSecret(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: FEATURES */}
              {addFormTab === "features" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Supported Methods & Feature Toggles</span>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Wallet Funding", state: addSupportsWalletFunding, set: setAddSupportsWalletFunding },
                      { label: "Bank Transfer", state: addSupportsBankTransfer, set: setAddSupportsBankTransfer },
                      { label: "Card Payment", state: addSupportsCardPayment, set: setAddSupportsCardPayment },
                      { label: "Virtual Account", state: addSupportsVirtualAccount, set: setAddSupportsVirtualAccount },
                      { label: "Payment Link", state: addSupportsPaymentLink, set: setAddSupportsPaymentLink },
                      { label: "Payout / Withdrawal", state: addSupportsPayout, set: setAddSupportsPayout },
                      { label: "Refund Engine", state: addSupportsRefund, set: setAddSupportsRefund },
                      { label: "Tx Verification", state: addSupportsTxVerification, set: setAddSupportsTxVerification },
                    ].map((f, i) => (
                      <div
                        key={i}
                        onClick={() => f.set(!f.state)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          f.state ? "bg-slate-950 border-blue-800 text-white" : "bg-slate-950 border-slate-800 text-slate-500 opacity-60"
                        }`}
                      >
                        <span className="text-xs font-bold">{f.label}</span>
                        {f.state ? <ToggleRight className="h-5 w-5 text-blue-400" /> : <ToggleLeft className="h-5 w-5 text-slate-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: STATUS & DEFAULT */}
              {addFormTab === "status" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Initial Status</label>
                      <select
                        value={addStatus}
                        onChange={(e) => setAddStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="ENABLED">ENABLED (Active)</option>
                        <option value="DISABLED">DISABLED (Inactive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Environment</label>
                      <select
                        value={addEnvironment}
                        onChange={(e) => setAddEnvironment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Production">Production</option>
                        <option value="Sandbox">Sandbox</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Set as Default Provider</span>
                      <span className="text-[11px] text-slate-400 block">Make this provider the active default for {addCategory}.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddIsDefault(!addIsDefault)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        addIsDefault ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {addIsDefault ? "YES (Default)" : "NO"}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {submittingAdd ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{submittingAdd ? "Creating Provider..." : "Save & Register Provider"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
