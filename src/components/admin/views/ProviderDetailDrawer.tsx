import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  Server,
  Zap,
  ShieldCheck,
  Globe,
  ExternalLink,
  Clock,
  RefreshCw,
  Sliders,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  Webhook,
  ArrowRightLeft,
  Terminal,
  Settings,
  Layers,
  FileText,
  Lock,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { getStoredAdminSession } from "../../../services/adminAuthTypes";

interface ProviderDetailDrawerProps {
  providerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProviderUpdated: () => void;
}

export function ProviderDetailDrawer({
  providerId,
  isOpen,
  onClose,
  onProviderUpdated,
}: ProviderDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [failovers, setFailovers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "general" | "api" | "webhook" | "security" | "features" | "test" | "failover" | "logs">("overview");

  // SECTION 1: GENERAL
  const [name, setName] = useState("");
  const [category, setCategory] = useState("PAYMENT_GATEWAY");
  const [providerType, setProviderType] = useState("PAYMENT_GATEWAY");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // SECTION 2: API CREDENTIALS
  const [baseUrl, setBaseUrl] = useState("");
  const [apiVersion, setApiVersion] = useState("v1.0");
  const [authMethod, setAuthMethod] = useState("API_KEY");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [retryLimit, setRetryLimit] = useState(3);

  // SECTION 3: WEBHOOK & URLS
  const [webhookUrl, setWebhookUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [successUrl, setSuccessUrl] = useState("");
  const [failedUrl, setFailedUrl] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookSignatureMethod, setWebhookSignatureMethod] = useState<"HMAC-SHA512" | "HMAC-SHA256" | "MD5_OF_SECRET" | "NONE">("HMAC-SHA512");
  const [webhookSignatureHeaderName, setWebhookSignatureHeaderName] = useState("");
  const [webhookSigningSecret, setWebhookSigningSecret] = useState("");

  // SECTION 4: SECURITY KEYS
  const [encryptionKey, setEncryptionKey] = useState("");
  const [signatureKey, setSignatureKey] = useState("");
  const [rsaPublicKey, setRsaPublicKey] = useState("");
  const [rsaPrivateKey, setRsaPrivateKey] = useState("");
  const [hmacSecret, setHmacSecret] = useState("");

  // SECTION 5: FEATURES (Toggles)
  const [supportsWalletFunding, setSupportsWalletFunding] = useState(true);
  const [supportsBankTransfer, setSupportsBankTransfer] = useState(true);
  const [supportsCardPayment, setSupportsCardPayment] = useState(true);
  const [supportsVirtualAccount, setSupportsVirtualAccount] = useState(true);
  const [supportsPaymentLink, setSupportsPaymentLink] = useState(true);
  const [supportsPayout, setSupportsPayout] = useState(true);
  const [supportsRefund, setSupportsRefund] = useState(true);
  const [supportsTxVerification, setSupportsTxVerification] = useState(true);

  // SECTION 6: STATUS & OPERATIONAL
  const [status, setStatus] = useState("ENABLED");
  const [environment, setEnvironment] = useState("Production");
  const [isDefault, setIsDefault] = useState(false);

  const [savingConfig, setSavingConfig] = useState(false);

  // Test Connection state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Failover state
  const [triggeringFailover, setTriggeringFailover] = useState(false);
  const [failoverReason, setFailoverReason] = useState("");
  const [failoverMsg, setFailoverMsg] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && providerId) {
      fetchProviderDetails();
    } else {
      setProviderData(null);
      setTestResult(null);
      setToast(null);
      setFailoverMsg(null);
    }
  }, [isOpen, providerId]);

  const fetchProviderDetails = async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success && json.provider) {
        const p = json.provider;
        setProviderData(p);
        setLogs(json.logs || []);
        setFailovers(json.failovers || []);

        // Sync state
        setName(p.name || "");
        setCategory(p.category || "PAYMENT_GATEWAY");
        setProviderType(p.providerType || p.category || "PAYMENT_GATEWAY");
        setDescription(p.description || "");
        setLogoUrl(p.logoUrl || "");

        setBaseUrl(p.baseUrl || "");
        setApiVersion(p.apiVersion || "v1.0");
        setAuthMethod(p.authMethod || "API_KEY");
        setApiKey(p.apiKey || "");
        setSecretKey(p.secretKey || "");
        setPublicKey(p.publicKey || "");
        setPrivateKey(p.privateKey || "");
        setMerchantId(p.merchantId || "");
        setClientId(p.clientId || "");
        setClientSecret(p.clientSecret || "");
        setBusinessId(p.businessId || "");
        setTimeoutMs(p.timeoutMs || p.timeout || 5000);
        setRetryLimit(p.retryLimit || p.retryAttempts || 3);

        setWebhookUrl(p.webhookUrl || "");
        setCallbackUrl(p.callbackUrl || "");
        setRedirectUrl(p.redirectUrl || "");
        setSuccessUrl(p.successUrl || "");
        setFailedUrl(p.failedUrl || "");
        setCancelUrl(p.cancelUrl || "");
        setWebhookSecret(p.webhookSecret || "");
        const isAspfiy = (p.name || "").toLowerCase().includes("aspfiy") || p.id === "prov_aspfiy";
        setWebhookSignatureMethod(p.webhookSignatureMethod || (isAspfiy ? "MD5_OF_SECRET" : "HMAC-SHA512"));
        setWebhookSignatureHeaderName(p.webhookSignatureHeaderName || (isAspfiy ? "x-wiaxy-signature" : "x-signature"));
        setWebhookSigningSecret(p.webhookSigningSecret || p.webhookSecret || "");

        setEncryptionKey(p.encryptionKey || "");
        setSignatureKey(p.signatureKey || "");
        setRsaPublicKey(p.rsaPublicKey || "");
        setRsaPrivateKey(p.rsaPrivateKey || "");
        setHmacSecret(p.hmacSecret || "");

        setSupportsWalletFunding(p.supportsWalletFunding !== false);
        setSupportsBankTransfer(p.supportsBankTransfer !== false);
        setSupportsCardPayment(p.supportsCardPayment !== false);
        setSupportsVirtualAccount(p.supportsVirtualAccount !== false);
        setSupportsPaymentLink(p.supportsPaymentLink !== false);
        setSupportsPayout(p.supportsPayout !== false);
        setSupportsRefund(p.supportsRefund !== false);
        setSupportsTxVerification(p.supportsTxVerification !== false);

        setStatus(p.status || (p.enabled || p.isActive ? "ENABLED" : "DISABLED"));
        setEnvironment(p.environment || "Production");
        setIsDefault(!!p.isDefault);
      } else {
        setToast({ type: "error", message: json.message || "Failed to load provider details." });
      }
    } catch (err: any) {
      setToast({ type: "error", message: "Network error fetching provider details." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;
    setSavingConfig(true);
    setToast(null);

    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const adminUid = getStoredAdminSession()?.uid || "admin_master";
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          adminUid,
          name,
          category,
          providerType,
          description,
          logoUrl,
          baseUrl,
          apiVersion,
          authMethod,
          apiKey,
          secretKey,
          publicKey,
          privateKey,
          merchantId,
          clientId,
          appId: clientId,
          clientSecret,
          businessId,
          timeout: timeoutMs,
          timeoutMs,
          retryAttempts: retryLimit,
          retryLimit,
          webhookUrl,
          callbackUrl,
          redirectUrl,
          successUrl,
          failedUrl,
          cancelUrl,
          webhookSecret,
          webhookSignatureMethod,
          webhookSignatureHeaderName,
          webhookSigningSecret,
          encryptionKey,
          signatureKey,
          rsaPublicKey,
          rsaPrivateKey,
          hmacSecret,
          supportsWalletFunding,
          supportsBankTransfer,
          supportsCardPayment,
          supportsVirtualAccount,
          supportsPaymentLink,
          supportsPayout,
          supportsRefund,
          supportsTxVerification,
          status,
          enabled: status === "ENABLED",
          isActive: status === "ENABLED",
          environment,
          isDefault,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: "success", message: json.message || "Provider settings saved successfully." });
        setProviderData(json.provider);
        onProviderUpdated();
      } else {
        setToast({ type: "error", message: json.message || "Failed to update configuration." });
      }
    } catch (err: any) {
      setToast({ type: "error", message: "Network error updating configuration." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!providerId) return;
    setTestingConnection(true);
    setTestResult(null);

    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/providers/${providerId}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
      });

      const json = await res.json();
      if (json.success) {
        setTestResult(json.testResult);
        fetchProviderDetails();
        onProviderUpdated();
      } else {
        setTestResult({
          status: "OFFLINE",
          error: json.message || "Connection ping failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "OFFLINE",
        error: "Network error performing API connection ping.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSetDefault = async () => {
    if (!providerId) return;
    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const res = await fetch(`/api/admin/providers/${providerId}/set-default`, {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success) {
        setIsDefault(true);
        setToast({ type: "success", message: json.message });
        onProviderUpdated();
      }
    } catch (e) {}
  };

  const handleDeleteProvider = async () => {
    if (!providerId) return;
    if (!window.confirm(`Are you sure you want to delete Provider "${name}"? This action cannot be undone.`)) return;

    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const adminUid = getStoredAdminSession()?.uid || "admin_master";
      const res = await fetch(`/api/admin/providers/${providerId}?adminUid=${adminUid}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success) {
        onProviderUpdated();
        onClose();
      } else {
        setToast({ type: "error", message: json.message || "Failed to delete provider." });
      }
    } catch (e) {
      setToast({ type: "error", message: "Network error deleting provider." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#111827]/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl bg-[#111827] border-l border-[#111827] h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 bg-[#111827] border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0F2D5C]/80 border border-[#0F2D5C]/80 rounded-2xl text-[#9CA3AF] font-black text-lg flex items-center justify-center h-12 w-12 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
              ) : (
                (name || providerData?.name || "API").substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">
                  {category || "API PROVIDER"}
                </span>
                {isDefault && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C] flex items-center gap-1">
                    <Check className="h-3 w-3" /> DEFAULT PROVIDER
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    environment === "Production"
                      ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                      : environment === "Sandbox"
                      ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                      : "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                  }`}
                >
                  {environment}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>{name || providerData?.name || "Provider Configuration"}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isDefault && (
              <button
                type="button"
                onClick={handleSetDefault}
                className="py-1.5 px-3 bg-[#0F2D5C]/10 hover:bg-[#0F2D5C]/20 border border-[#0F2D5C]/60 text-[#9CA3AF] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Set Default</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDeleteProvider}
              className="py-1.5 px-3 bg-[#0F2D5C]/40 hover:bg-[#0F2D5C]/60 border border-[#0F2D5C]/60 text-[#9CA3AF] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-[#111827] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-white rounded-xl transition-all cursor-pointer ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#111827]/60 border-b border-[#111827] overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "general", label: "General", icon: FileText },
            { id: "api", label: "API Credentials", icon: Key },
            { id: "webhook", label: "Webhook & URLs", icon: Webhook },
            { id: "security", label: "Security Keys", icon: Lock },
            { id: "features", label: "Features", icon: Sliders },
            { id: "test", label: "Test Connection", icon: Zap },
            { id: "logs", label: "Logs", icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "border-[#0F2D5C] text-[#9CA3AF]"
                    : "border-transparent text-[#9CA3AF] hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {toast && (
            <div
              className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
                toast.type === "success"
                  ? "bg-[#0F2D5C]/80 border-[#0F2D5C] text-[#9CA3AF]"
                  : "bg-[#0F2D5C]/80 border-[#0F2D5C] text-[#9CA3AF]"
              }`}
            >
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-[#9CA3AF] hover:text-white">✕</button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-[#9CA3AF] animate-spin mx-auto" />
              <p className="text-xs text-[#9CA3AF] font-mono">Loading API provider details...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl">
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block">Health Status</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#0F2D5C] animate-pulse"></span>
                        <span className="font-bold text-white text-base">{providerData?.healthStatus || "ONLINE"}</span>
                      </div>
                      <span className="text-[10px] text-[#6B7280] mt-1 block">Status: {status}</span>
                    </div>

                    <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl">
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block">Success Rate</span>
                      <div className="font-black text-[#9CA3AF] text-xl mt-1">{providerData?.successRate || 99.5}%</div>
                      <span className="text-[10px] text-[#6B7280] mt-1 block">Operational SLA</span>
                    </div>

                    <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl">
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block">Avg Latency</span>
                      <div className="font-black text-[#9CA3AF] text-xl mt-1">{providerData?.avgResponseTimeMs || providerData?.avgResponseTime || 180} ms</div>
                      <span className="text-[10px] text-[#6B7280] mt-1 block">Roundtrip Ping</span>
                    </div>
                  </div>

                  <div className="p-5 bg-[#111827]/80 border border-[#111827] rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#9CA3AF]" />
                      <span>General & Base Config</span>
                    </h3>
                    <p className="text-xs text-[#E5E7EB] leading-relaxed">{description || "No description specified."}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#111827]/80 text-xs font-mono">
                      <div>
                        <span className="text-[#6B7280] block text-[10px] font-sans font-bold uppercase">Base URL</span>
                        <span className="text-[#9CA3AF] font-bold">{baseUrl || "Not configured"}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px] font-sans font-bold uppercase">Category</span>
                        <span className="text-[#E5E7EB]">{category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL */}
              {activeTab === "general" && (
                <div className="space-y-4 p-5 bg-[#111827] border border-[#111827] rounded-2xl">
                  <h3 className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#9CA3AF]" />
                    <span>General Information</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Provider Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Provider Category / Type</label>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setProviderType(e.target.value);
                        }}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
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
                    <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
                      placeholder="Brief description of this API integration..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
                      >
                        <option value="ENABLED">ENABLED (Active)</option>
                        <option value="DISABLED">DISABLED (Inactive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Environment</label>
                      <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
                      >
                        <option value="Production">Production</option>
                        <option value="Sandbox">Sandbox</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: API CREDENTIALS */}
              {activeTab === "api" && (
                <div className="space-y-4 p-5 bg-[#111827] border border-[#111827] rounded-2xl">
                  <h3 className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#9CA3AF]" />
                    <span>API Credentials & Endpoints</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Base URL *</label>
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        required
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">API Version</label>
                      <input
                        type="text"
                        value={apiVersion}
                        onChange={(e) => setApiVersion(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Secret Key</label>
                      <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Public Key</label>
                      <input
                        type="text"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Private Key</label>
                      <input
                        type="password"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Merchant ID</label>
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Client ID / App ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g. LumiID App ID"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Client Secret</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Business ID</label>
                      <input
                        type="text"
                        value={businessId}
                        onChange={(e) => setBusinessId(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WEBHOOK & URLS */}
              {activeTab === "webhook" && (
                <div className="space-y-4 p-5 bg-[#111827] border border-[#111827] rounded-2xl">
                  <h3 className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-[#9CA3AF]" />
                    <span>Webhook & Redirect URLs</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Webhook Endpoint URL</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://api.smartlink.com/api/webhooks/..."
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Webhook Secret / General Secret</label>
                      <input
                        type="password"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  {/* Webhook Signature Security Section */}
                  <div className="p-3 bg-[#111827]/80 border border-[#111827] rounded-xl space-y-3">
                    <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                      Webhook Signature Security Configuration
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Signature Method</label>
                        <select
                          value={webhookSignatureMethod}
                          onChange={(e: any) => setWebhookSignatureMethod(e.target.value)}
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0F2D5C]"
                        >
                          <option value="MD5_OF_SECRET">MD5 (Secret Key)</option>
                          <option value="HMAC-SHA512">HMAC-SHA512</option>
                          <option value="HMAC-SHA256">HMAC-SHA256</option>
                          <option value="NONE">None (Disabled)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Signature Header Name</label>
                        <input
                          type="text"
                          value={webhookSignatureHeaderName}
                          onChange={(e) => setWebhookSignatureHeaderName(e.target.value)}
                          placeholder="e.g. x-signature"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Webhook Signing Secret</label>
                        <input
                          type="password"
                          value={webhookSigningSecret}
                          onChange={(e) => setWebhookSigningSecret(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Callback URL</label>
                      <input
                        type="text"
                        value={callbackUrl}
                        onChange={(e) => setCallbackUrl(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Redirect URL</label>
                      <input
                        type="text"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Success URL</label>
                      <input
                        type="text"
                        value={successUrl}
                        onChange={(e) => setSuccessUrl(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Failed URL</label>
                      <input
                        type="text"
                        value={failedUrl}
                        onChange={(e) => setFailedUrl(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Cancel URL</label>
                      <input
                        type="text"
                        value={cancelUrl}
                        onChange={(e) => setCancelUrl(e.target.value)}
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY KEYS */}
              {activeTab === "security" && (
                <div className="space-y-4 p-5 bg-[#111827] border border-[#111827] rounded-2xl">
                  <h3 className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#9CA3AF]" />
                    <span>Encryption & Security Keys</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Encryption Key</label>
                      <input
                        type="password"
                        value={encryptionKey}
                        onChange={(e) => setEncryptionKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Signature Key</label>
                      <input
                        type="password"
                        value={signatureKey}
                        onChange={(e) => setSignatureKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">RSA Public Key</label>
                      <textarea
                        rows={2}
                        value={rsaPublicKey}
                        onChange={(e) => setRsaPublicKey(e.target.value)}
                        placeholder="-----BEGIN PUBLIC KEY-----"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">RSA Private Key</label>
                      <textarea
                        rows={2}
                        value={rsaPrivateKey}
                        onChange={(e) => setRsaPrivateKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">HMAC Secret</label>
                    <input
                      type="password"
                      value={hmacSecret}
                      onChange={(e) => setHmacSecret(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0F2D5C]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: FEATURES */}
              {activeTab === "features" && (
                <div className="space-y-4 p-5 bg-[#111827] border border-[#111827] rounded-2xl">
                  <h3 className="text-xs font-bold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#9CA3AF]" />
                    <span>Feature Enable/Disable Toggles</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { key: "supportsWalletFunding", label: "Wallet Funding", state: supportsWalletFunding, set: setSupportsWalletFunding },
                      { key: "supportsBankTransfer", label: "Bank Transfer", state: supportsBankTransfer, set: setSupportsBankTransfer },
                      { key: "supportsCardPayment", label: "Card Payment", state: supportsCardPayment, set: setSupportsCardPayment },
                      { key: "supportsVirtualAccount", label: "Virtual Account", state: supportsVirtualAccount, set: setSupportsVirtualAccount },
                      { key: "supportsPaymentLink", label: "Payment Link", state: supportsPaymentLink, set: setSupportsPaymentLink },
                      { key: "supportsPayout", label: "Payout / Withdrawal", state: supportsPayout, set: setSupportsPayout },
                      { key: "supportsRefund", label: "Refund Engine", state: supportsRefund, set: setSupportsRefund },
                      { key: "supportsTxVerification", label: "Transaction Verification", state: supportsTxVerification, set: setSupportsTxVerification },
                    ].map((f) => (
                      <div
                        key={f.key}
                        onClick={() => f.set(!f.state)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          f.state
                            ? "bg-[#111827] border-[#0F2D5C]/80 text-white"
                            : "bg-[#111827] border-[#111827]/80 text-[#6B7280] opacity-60"
                        }`}
                      >
                        <span className="text-xs font-bold">{f.label}</span>
                        {f.state ? (
                          <ToggleRight className="h-5 w-5 text-[#9CA3AF]" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-[#4B5563]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: TEST CONNECTION */}
              {activeTab === "test" && (
                <div className="space-y-6">
                  <div className="p-5 bg-[#111827] border border-[#111827] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-[#9CA3AF]">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Live Connection Ping Tester</h3>
                          <p className="text-xs text-[#9CA3AF]">Ping provider API endpoint to verify latency and auth status.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#111827] font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-none"
                      >
                        {testingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        <span>{testingConnection ? "Pinging..." : "Run Connection Test"}</span>
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <div className="p-5 bg-[#111827] border border-[#111827] rounded-2xl space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-[#111827] pb-3">
                        <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Test Execution Result</span>
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            testResult.status === "ONLINE"
                              ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                              : "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                          }`}
                        >
                          {testResult.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                        <div>
                          <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Latency</span>
                          <span className="text-[#9CA3AF] font-bold">{testResult.latencyMs} ms</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Environment</span>
                          <span className="text-white">{testResult.environmentTested}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Tested Endpoint</span>
                          <span className="text-[#E5E7EB]">{testResult.baseUrlTested}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: LOGS */}
              {activeTab === "logs" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Health & Connection Activity Logs</h3>
                    <span className="text-xs text-[#6B7280] font-mono">{logs.length} Log Entries</span>
                  </div>

                  {logs.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[#111827] rounded-2xl text-[#6B7280] text-xs">
                      No logs recorded yet for this provider.
                    </div>
                  ) : (
                    <div className="space-y-2 font-mono text-xs">
                      {logs.map((log: any) => (
                        <div key={log.id} className="p-3 bg-[#111827] border border-[#111827]/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CA3AF] font-bold">{log.action}</span>
                            <span className="text-[#6B7280] text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[#E5E7EB] text-[11px]">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[#111827] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 bg-[#111827] hover:bg-[#111827] text-[#9CA3AF] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="py-2.5 px-6 bg-[#0F2D5C] hover:bg-[#0F2D5C] disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-none"
                >
                  {savingConfig ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{savingConfig ? "Saving..." : "Save All Changes"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
