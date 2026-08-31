/**
 * SmartLink Payment Provider Management Foundation UI
 * Database-backed Administration Panel for Payment Providers (api_providers)
 * Full CRUD, single active provider constraint, validation, permanent storage.
 */

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ShieldCheck,
  Key,
  Globe,
  Database,
  Search,
  Check,
  Power,
  FileText,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Lock,
  Layers,
  Save,
  AlertCircle
} from "lucide-react";
import {
  PaymentProvider,
  PaymentProviderStatus,
  APIProviderConfig,
  ProviderAuditLog,
  ProviderHealthStatus
} from "../../types/provider";

interface ProviderManagerAdminProps {
  adminUid: string;
  isDarkMode?: boolean;
}

export default function ProviderManagerAdmin({ adminUid, isDarkMode = false }: ProviderManagerAdminProps) {
  // State for Payment Providers (Database Table: api_providers)
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(true);

  // State for API Providers & Logs
  const [apiProviders, setApiProviders] = useState<APIProviderConfig[]>([]);
  const [logs, setLogs] = useState<ProviderAuditLog[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Sub-Tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<"PAYMENT_PROVIDERS" | "API_PROVIDERS" | "LOGS">("PAYMENT_PROVIDERS");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Payment Provider Modal & Form State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [editingPaymentProvider, setEditingPaymentProvider] = useState<PaymentProvider | null>(null);
  const [deletingPaymentProvider, setDeletingPaymentProvider] = useState<PaymentProvider | null>(null);
  const [showKeyMap, setShowKeyMap] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form Fields State
  const initialPaymentForm = {
    name: "",
    secretKey: "",
    webhookUrl: "",
    baseUrl: "",
    publicKey: "",
    merchantId: "",
    clientId: "",
    clientSecret: "",
    encryptionKey: "",
    webhookSecret: "",
    callbackUrl: "",
    status: "Draft" as PaymentProviderStatus,
    notes: ""
  };

  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const showFeedback = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // Toggle Secret Key Visibility
  const toggleKeyVisibility = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mask string for sensitive display
  const maskSecret = (val?: string) => {
    if (!val) return "—";
    if (val.length <= 6) return "••••••••";
    return val.substring(0, 4) + "••••••••" + val.substring(val.length - 2);
  };

  // Fetch Payment Providers from Database Table
  const fetchPaymentProviders = async () => {
    try {
      setLoadingPayment(true);
      const res = await fetch(`/api/admin/payment-providers?adminUid=${adminUid}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentProviders(data.paymentProviders || []);
      }
    } catch (err) {
      console.error("Error fetching payment providers:", err);
    } finally {
      setLoadingPayment(false);
    }
  };

  // Fetch API Providers & Logs
  const fetchApiProvidersAndLogs = async () => {
    setRefreshing(true);
    try {
      const [provRes, logsRes] = await Promise.all([
        fetch(`/api/admin/providers?adminUid=${adminUid}`),
        fetch(`/api/admin/provider-logs?adminUid=${adminUid}`)
      ]);

      if (provRes.ok) {
        const provData = await provRes.json();
        setApiProviders(provData.providers || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err: any) {
      console.error("Failed to load providers:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchPaymentProviders(), fetchApiProvidersAndLogs()]);
  };

  useEffect(() => {
    fetchAllData();
  }, [adminUid]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingPaymentProvider(null);
    setPaymentForm(initialPaymentForm);
    setFormErrors({});
    setShowPaymentModal(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (provider: PaymentProvider) => {
    setEditingPaymentProvider(provider);
    setPaymentForm({
      name: provider.name || "",
      secretKey: provider.secretKey || "",
      webhookUrl: provider.webhookUrl || "",
      baseUrl: provider.baseUrl || "",
      publicKey: provider.publicKey || "",
      merchantId: provider.merchantId || "",
      clientId: provider.clientId || "",
      clientSecret: provider.clientSecret || "",
      encryptionKey: provider.encryptionKey || "",
      webhookSecret: provider.webhookSecret || "",
      callbackUrl: provider.callbackUrl || "",
      status: provider.status || "Draft",
      notes: provider.notes || ""
    });
    setFormErrors({});
    setShowPaymentModal(true);
  };

  // Client-Side Validation Rules: Provider Name, Secret Key, Webhook URL
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!paymentForm.name || !paymentForm.name.trim()) {
      errors.name = "Provider Name is required.";
    }

    if (!paymentForm.secretKey || !paymentForm.secretKey.trim()) {
      errors.secretKey = "Secret Key is required.";
    }

    if (!paymentForm.webhookUrl || !paymentForm.webhookUrl.trim()) {
      errors.webhookUrl = "Webhook URL is required.";
    }

    // Duplicate Name Validation (case-insensitive)
    const trimmedName = paymentForm.name.trim().toLowerCase();
    const isDuplicate = paymentProviders.some((p) => {
      if (editingPaymentProvider && p.id === editingPaymentProvider.id) return false;
      return p.name.trim().toLowerCase() === trimmedName;
    });

    if (isDuplicate) {
      errors.name = `A payment provider with the name "${paymentForm.name.trim()}" already exists.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Provider (Add / Edit)
  const handleSavePaymentProvider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showFeedback("error", "Please resolve required field errors before saving.");
      return;
    }

    try {
      const isEditing = !!editingPaymentProvider;
      const url = isEditing
        ? `/api/admin/payment-providers/${editingPaymentProvider.id}`
        : "/api/admin/payment-providers";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid,
          ...paymentForm
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save payment provider.");
      }

      showFeedback(
        "success",
        isEditing
          ? `Provider "${paymentForm.name}" updated successfully.`
          : `New Provider "${paymentForm.name}" added successfully.`
      );

      setPaymentProviders(data.paymentProviders || []);
      setShowPaymentModal(false);
      setEditingPaymentProvider(null);
      setPaymentForm(initialPaymentForm);
    } catch (err: any) {
      showFeedback("error", err.message || "An error occurred while saving.");
    }
  };

  // Delete Payment Provider
  const handleDeletePaymentProvider = async () => {
    if (!deletingPaymentProvider) return;

    try {
      const res = await fetch(
        `/api/admin/payment-providers/${deletingPaymentProvider.id}?adminUid=${adminUid}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete payment provider.");
      }

      showFeedback("success", `Provider "${deletingPaymentProvider.name}" deleted successfully.`);
      setPaymentProviders(data.paymentProviders || []);
      setDeletingPaymentProvider(null);
    } catch (err: any) {
      showFeedback("error", err.message || "Error deleting payment provider.");
    }
  };

  // Activate Provider (Deactivates all other providers)
  const handleActivateProvider = async (provider: PaymentProvider) => {
    try {
      const res = await fetch(`/api/admin/payment-providers/${provider.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to activate payment provider.");
      }

      showFeedback("success", `"${provider.name}" is now ACTIVE. All other providers deactivated.`);
      setPaymentProviders(data.paymentProviders || []);
    } catch (err: any) {
      showFeedback("error", err.message || "Error activating provider.");
    }
  };

  // Deactivate Provider
  const handleDeactivateProvider = async (provider: PaymentProvider) => {
    try {
      const res = await fetch(`/api/admin/payment-providers/${provider.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to deactivate payment provider.");
      }

      showFeedback("success", `"${provider.name}" set to INACTIVE.`);
      setPaymentProviders(data.paymentProviders || []);
    } catch (err: any) {
      showFeedback("error", err.message || "Error deactivating provider.");
    }
  };

  // Provider Connection Tester Handler
  const [testingPaymentId, setTestingPaymentId] = useState<string | null>(null);

  const handleTestConnection = async (provider: PaymentProvider) => {
    setTestingPaymentId(provider.id);
    try {
      const res = await fetch(`/api/admin/payment-providers/${provider.id}/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid })
      });
      const data = await res.json();

      if (!res.ok && !data.result) {
        showFeedback("error", data.errorMessage || data.error || "Connection test failed.");
      } else {
        if (data.result === "Connected") {
          showFeedback("success", `Connection Test Passed! Provider "${provider.name}" is Connected.`);
        } else {
          showFeedback("error", `Connection Test: ${data.result}. ${data.errorMessage || ""}`);
        }
      }

      if (data.paymentProviders) {
        setPaymentProviders(data.paymentProviders);
      } else {
        fetchAllData();
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error while testing connection.");
    } finally {
      setTestingPaymentId(null);
    }
  };

  // Helper for Connection Status Badge
  const getConnectionBadge = (status?: string, lastResult?: string) => {
    if (status === "Connected" || lastResult === "Connected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F2D5C] animate-pulse"></span>
          Connected
        </span>
      );
    }
    if (status === "Warning" || lastResult === "Invalid Base URL" || lastResult === "Timeout") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F2D5C]"></span>
          Warning
        </span>
      );
    }
    if (status === "Disconnected" || (lastResult && lastResult !== "Untested")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F2D5C]"></span>
          Disconnected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5E7EB] text-[#4B5563] dark:bg-[#111827] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#4B5563]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]"></span>
        Untested
      </span>
    );
  };

  // Helper for Status Badge
  const getStatusBadge = (status: PaymentProviderStatus) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
            <span className="w-2 h-2 rounded-full bg-[#0F2D5C] animate-pulse"></span>
            Active
          </span>
        );
      case "Inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
            <span className="w-2 h-2 rounded-full bg-[#0F2D5C]"></span>
            Inactive
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/80 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
            <span className="w-2 h-2 rounded-full bg-[#0F2D5C]"></span>
            Draft
          </span>
        );
    }
  };

  // Active provider count & current active provider name
  const activeProvider = paymentProviders.find((p) => p.status === "Active");
  const draftCount = paymentProviders.filter((p) => p.status === "Draft").length;
  const inactiveCount = paymentProviders.filter((p) => p.status === "Inactive").length;

  // Filtered payment providers for display
  const filteredPaymentProviders = paymentProviders.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.baseUrl && p.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.merchantId && p.merchantId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold text-white transition-all animate-bounce ${
            toast.type === "success" ? "bg-[#0F2D5C]" : "bg-[#0F2D5C]"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-[#111827] via-[#111827] to-[#0F2D5C] rounded-3xl p-6 text-white shadow-xl border border-[#111827] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#0F2D5C]/20 text-[#9CA3AF] border border-[#E5E7EB]/30 font-mono">
                DATABASE TABLE: api_providers
              </span>
              <span className="text-xs text-[#9CA3AF] font-mono">PERMANENT STORAGE</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CreditCard className="h-6 w-6 text-[#9CA3AF]" />
              Payment Provider Management
            </h2>
            <p className="text-xs text-[#E5E7EB] max-w-2xl mt-1 leading-relaxed">
              Configure and manage payment gateway credentials stored permanently in the database.
              <strong className="text-[#9CA3AF] font-bold ml-1">Only one provider can be Active at any time.</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#111827] hover:bg-[#111827] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg border border-[#4B5563]"
            >
              <Plus className="h-4 w-4 text-[#9CA3AF]" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Total Providers</div>
            <div className="text-xl font-black text-white mt-0.5">{paymentProviders.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Active Provider</div>
            <div className="text-sm font-extrabold text-[#9CA3AF] mt-1 truncate">
              {activeProvider ? activeProvider.name : "None Active"}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Inactive Providers</div>
            <div className="text-xl font-black text-[#9CA3AF] mt-0.5">{inactiveCount}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Draft Providers</div>
            <div className="text-xl font-black text-[#9CA3AF] mt-0.5">{draftCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#111827] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab("PAYMENT_PROVIDERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "PAYMENT_PROVIDERS"
                ? "bg-[#111827] text-white shadow-md border border-[#111827]"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB]"
            }`}
          >
            <CreditCard className="h-4 w-4 text-[#9CA3AF]" />
            Payment Providers ({paymentProviders.length})
          </button>
          <button
            onClick={() => setActiveSubTab("API_PROVIDERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "API_PROVIDERS"
                ? "bg-[#111827] text-white shadow-md border border-[#111827]"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB]"
            }`}
          >
            <Server className="h-4 w-4 text-[#9CA3AF]" />
            General API Providers ({apiProviders.length})
          </button>
          <button
            onClick={() => setActiveSubTab("LOGS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "LOGS"
                ? "bg-[#111827] text-white shadow-md border border-[#111827]"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB]"
            }`}
          >
            <FileText className="h-4 w-4 text-[#9CA3AF]" />
            Audit Ledger ({logs.length})
          </button>
        </div>

        {activeSubTab === "PAYMENT_PROVIDERS" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search payment provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#111827] text-[#111827] dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs font-medium text-[#4B5563] dark:text-[#E5E7EB]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="Draft">Draft Only</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PAYMENT PROVIDERS (api_providers) */}
      {activeSubTab === "PAYMENT_PROVIDERS" && (
        <div className="space-y-4">
          {filteredPaymentProviders.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-12 text-center border border-[#E5E7EB] dark:border-[#111827] shadow-sm">
              <CreditCard className="h-12 w-12 text-[#E5E7EB] dark:text-[#4B5563] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#111827] dark:text-white">No Payment Providers Found</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto mt-1 mb-4">
                No payment providers match your criteria or none have been added to the database table yet.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#111827] hover:bg-[#111827] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4 text-[#9CA3AF]" />
                Add First Payment Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPaymentProviders.map((prov) => {
                const isKeyVisible = showKeyMap[prov.id];
                return (
                  <div
                    key={prov.id}
                    className={`bg-white dark:bg-[#111827] rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md relative ${
                      prov.status === "Active"
                        ? "border-[#0F2D5C]/50 dark:border-[#0F2D5C]/30 ring-1 ring-[#0F2D5C]/20"
                        : "border-[#E5E7EB] dark:border-[#111827]"
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">
                            ID: {prov.id}
                          </span>
                          <h3 className="text-base font-extrabold text-[#111827] dark:text-white leading-tight">
                            {prov.name}
                          </h3>
                        </div>
                        <div>{getStatusBadge(prov.status)}</div>
                      </div>

                      {/* Provider Key Specs */}
                      <div className="space-y-2 my-4 text-xs bg-[#F5F7FA] dark:bg-[#111827]/60 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#111827] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9CA3AF] font-sans font-medium">Secret Key:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#111827] dark:text-[#E5E7EB] font-bold">
                              {isKeyVisible ? prov.secretKey : maskSecret(prov.secretKey)}
                            </span>
                            <button
                              onClick={() => toggleKeyVisibility(prov.id)}
                              className="text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] p-0.5 cursor-pointer"
                              title={isKeyVisible ? "Hide Secret" : "Show Secret"}
                            >
                              {isKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#9CA3AF] font-sans font-medium">Webhook URL:</span>
                          <span className="text-[#4B5563] dark:text-[#E5E7EB] truncate max-w-[170px]" title={prov.webhookUrl}>
                            {prov.webhookUrl || "—"}
                          </span>
                        </div>

                        {prov.baseUrl && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CA3AF] font-sans font-medium">Base API URL:</span>
                            <span className="text-[#4B5563] dark:text-[#E5E7EB] truncate max-w-[170px]" title={prov.baseUrl}>
                              {prov.baseUrl}
                            </span>
                          </div>
                        )}

                        {prov.merchantId && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CA3AF] font-sans font-medium">Merchant ID:</span>
                            <span className="text-[#0F2D5C] dark:text-[#9CA3AF] font-bold">{prov.merchantId}</span>
                          </div>
                        )}

                        {prov.publicKey && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CA3AF] font-sans font-medium">Public Key:</span>
                            <span className="text-[#4B5563] dark:text-[#E5E7EB] truncate max-w-[170px]">
                              {maskSecret(prov.publicKey)}
                            </span>
                          </div>
                        )}
                      </div>

                      {prov.notes && (
                        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] italic mb-3 line-clamp-2 px-1">
                          "{prov.notes}"
                        </p>
                      )}

                      {/* Connection Health & Tester Results Panel */}
                      <div className="mb-4 p-3 bg-[#F5F7FA] dark:bg-[#111827]/80 rounded-xl border border-[#E5E7EB]/80 dark:border-[#111827] space-y-2 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-sans font-bold text-[#6B7280] dark:text-[#9CA3AF]">Connection Status:</span>
                          <div>{getConnectionBadge(prov.connectionStatus, prov.lastTestResult)}</div>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#9CA3AF] font-sans font-medium">Last Tested:</span>
                          <span className="text-[#4B5563] dark:text-[#E5E7EB] font-medium">
                            {prov.lastTestedAt ? new Date(prov.lastTestedAt).toLocaleString() : "Never"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#9CA3AF] font-sans font-medium">Last Test Result:</span>
                          <span
                            className={`font-bold ${
                              prov.lastTestResult === "Connected"
                                ? "text-[#0F2D5C] dark:text-[#9CA3AF]"
                                : prov.lastTestResult
                                ? "text-[#0F2D5C] dark:text-[#9CA3AF]"
                                : "text-[#9CA3AF]"
                            }`}
                          >
                            {prov.lastTestResult || "Untested"}
                          </span>
                        </div>

                        {prov.lastTestError && (
                          <div className="mt-1 p-2 bg-[#F5F7FA] dark:bg-[#0F2D5C]/50 border border-[#E5E7EB] dark:border-[#0F2D5C]/80 rounded-lg text-[10px] text-[#0F2D5C] dark:text-[#9CA3AF] leading-tight">
                            <strong className="font-bold block mb-0.5 font-sans">Error Message:</strong>
                            <span className="break-words">{prov.lastTestError}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#111827] flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => handleTestConnection(prov)}
                        disabled={testingPaymentId === prov.id}
                        className="px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:bg-[#0F2D5C] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        title="Test provider credentials & server reachability"
                      >
                        {testingPaymentId === prov.id ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Activity className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            Test Connection
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {prov.status === "Active" ? (
                          <button
                            onClick={() => handleDeactivateProvider(prov)}
                            className="px-2.5 py-1.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/50 dark:hover:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Power className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateProvider(prov)}
                            className="px-2.5 py-1.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/50 dark:hover:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Power className="h-3.5 w-3.5" />
                            Activate
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditModal(prov)}
                          className="px-2.5 py-1.5 bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingPaymentProvider(prov)}
                          className="p-1.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/40 dark:hover:bg-[#0F2D5C]/50 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-xl transition-all cursor-pointer"
                          title="Delete Provider"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: API PROVIDERS VIEW */}
      {activeSubTab === "API_PROVIDERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiProviders.map((prov) => (
            <div
              key={prov.id}
              className={`bg-white dark:bg-[#111827] rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                prov.enabled
                  ? "border-[#E5E7EB] dark:border-[#111827]"
                  : "border-[#E5E7EB] dark:border-[#111827]/60 opacity-60 bg-[#F5F7FA]/50 dark:bg-[#111827]/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] border border-[#E5E7EB] dark:border-[#4B5563] font-mono">
                        PRIORITY #{prov.priority}
                      </span>
                      <span className="text-[10px] font-bold text-[#0F2D5C] dark:text-[#9CA3AF] uppercase">
                        {prov.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#111827] dark:text-white mt-1 leading-tight">
                      {prov.name}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/60 dark:text-[#9CA3AF]">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-2 my-4 text-xs text-[#4B5563] dark:text-[#9CA3AF] bg-[#F5F7FA] dark:bg-[#111827]/40 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#111827]/80 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Base URL:</span>
                    <span className="text-[#111827] dark:text-[#E5E7EB] truncate max-w-[180px]">{prov.baseUrl}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Auth Method:</span>
                    <span className="text-[#0F2D5C] dark:text-[#9CA3AF] font-bold">{prov.authMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Timeout & Retries:</span>
                    <span className="text-[#111827] dark:text-[#E5E7EB]">
                      {prov.timeout}ms ({prov.retryAttempts} retries)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOGS LEDGER */}
      {activeSubTab === "LOGS" && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#111827] overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#E5E7EB] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0F2D5C]" />
              Provider Interactions Ledger
            </h3>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Total Recorded: {logs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#4B5563] dark:text-[#E5E7EB] font-mono">
              <thead className="bg-[#E5E7EB] dark:bg-[#111827]/60 text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B7280] dark:divide-[#6B7280]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#9CA3AF] font-sans text-xs">
                      No logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F7FA] dark:hover:bg-[#111827]/40">
                      <td className="p-3 text-[#9CA3AF] whitespace-nowrap">
                        {new Date(log.requestTime).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-bold text-[#0F2D5C] dark:text-[#9CA3AF] whitespace-nowrap">
                        {log.providerName}
                      </td>
                      <td className="p-3 text-[#111827] dark:text-[#E5E7EB] whitespace-nowrap">{log.service}</td>
                      <td className="p-3 text-[#6B7280] font-mono text-[11px] whitespace-nowrap">{log.transactionId}</td>
                      <td className="p-3 text-[#9CA3AF] text-[11px] whitespace-nowrap">{log.userId}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C] dark:text-[#9CA3AF]">
                          200 SUCCESS
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#4B5563] dark:text-[#E5E7EB] whitespace-nowrap">
                        {log.responseTime}ms
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PAYMENT PROVIDER */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] dark:border-[#111827] shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#111827] mb-6">
              <h3 className="text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-[#0F2D5C]" />
                {editingPaymentProvider ? `Edit Provider: ${editingPaymentProvider.name}` : "Add New Payment Provider"}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#9CA3AF] hover:text-[#4B5563] text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentProvider} className="space-y-4 text-xs">
              {/* Mandatory Fields Section */}
              <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-2xl border border-[#E5E7EB] dark:border-[#111827] space-y-4">
                <div className="text-[11px] font-bold text-[#111827] dark:text-[#E5E7EB] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#0F2D5C]" />
                  Mandatory Configuration Fields
                </div>

                {/* Provider Name */}
                <div>
                  <label className="block text-[#4B5563] dark:text-[#E5E7EB] font-bold mb-1">
                    Provider Name <span className="text-[#0F2D5C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aspfiy Payment Gateway, Generic Gateway, Paystack"
                    value={paymentForm.name}
                    onChange={(e) => {
                      setPaymentForm({ ...paymentForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                    }}
                    className={`w-full p-3 bg-white dark:bg-[#111827] border ${
                      formErrors.name ? "border-[#0F2D5C] ring-1 ring-[#0F2D5C]" : "border-[#E5E7EB] dark:border-[#4B5563]"
                    } rounded-xl text-[#111827] dark:text-white font-bold text-sm focus:outline-hidden`}
                  />
                  {formErrors.name && <p className="text-[#0F2D5C] text-[11px] font-bold mt-1">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Secret Key */}
                  <div>
                    <label className="block text-[#4B5563] dark:text-[#E5E7EB] font-bold mb-1">
                      Secret Key <span className="text-[#0F2D5C]">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. SK_LIVE_9823749823"
                      value={paymentForm.secretKey}
                      onChange={(e) => {
                        setPaymentForm({ ...paymentForm, secretKey: e.target.value });
                        if (formErrors.secretKey) setFormErrors({ ...formErrors, secretKey: "" });
                      }}
                      className={`w-full p-2.5 bg-white dark:bg-[#111827] border ${
                        formErrors.secretKey ? "border-[#0F2D5C] ring-1 ring-[#0F2D5C]" : "border-[#E5E7EB] dark:border-[#4B5563]"
                      } rounded-xl font-mono text-[#111827] dark:text-white focus:outline-hidden`}
                    />
                    {formErrors.secretKey && <p className="text-[#0F2D5C] text-[11px] font-bold mt-1">{formErrors.secretKey}</p>}
                  </div>

                  {/* Webhook URL */}
                  <div>
                    <label className="block text-[#4B5563] dark:text-[#E5E7EB] font-bold mb-1">
                      Webhook URL <span className="text-[#0F2D5C]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://smartlinkng.com.ng/api/webhook"
                      value={paymentForm.webhookUrl}
                      onChange={(e) => {
                        setPaymentForm({ ...paymentForm, webhookUrl: e.target.value });
                        if (formErrors.webhookUrl) setFormErrors({ ...formErrors, webhookUrl: "" });
                      }}
                      className={`w-full p-2.5 bg-white dark:bg-[#111827] border ${
                        formErrors.webhookUrl ? "border-[#0F2D5C] ring-1 ring-[#0F2D5C]" : "border-[#E5E7EB] dark:border-[#4B5563]"
                      } rounded-xl font-mono text-[#111827] dark:text-white focus:outline-hidden`}
                    />
                    {formErrors.webhookUrl && <p className="text-[#0F2D5C] text-[11px] font-bold mt-1">{formErrors.webhookUrl}</p>}
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-[#4B5563] dark:text-[#E5E7EB] font-bold mb-1">
                    Status <span className="text-[#0F2D5C]">*</span>
                  </label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as PaymentProviderStatus })}
                    className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-bold text-[#111827] dark:text-white"
                  >
                    <option value="Draft">Draft (Being configured, cannot be used)</option>
                    <option value="Active">Active (Live system provider - Deactivates all others)</option>
                    <option value="Inactive">Inactive (Saved but temporarily disabled)</option>
                  </select>
                  {paymentForm.status === "Active" && (
                    <div className="mt-2 p-2.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 rounded-xl border border-[#E5E7EB] dark:border-[#0F2D5C]/80 text-[11px] text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#0F2D5C]" />
                      <span>Note: Setting status to <strong>Active</strong> will automatically deactivate any currently active provider.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/30 rounded-2xl border border-[#E5E7EB] dark:border-[#111827] space-y-3">
                <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Optional Provider Credentials & Endpoints
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Base API URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://api.aspfiy.com"
                      value={paymentForm.baseUrl}
                      onChange={(e) => setPaymentForm({ ...paymentForm, baseUrl: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Public Key</label>
                    <input
                      type="text"
                      placeholder="e.g. PK_LIVE_..."
                      value={paymentForm.publicKey}
                      onChange={(e) => setPaymentForm({ ...paymentForm, publicKey: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Merchant ID</label>
                    <input
                      type="text"
                      placeholder="Merchant ID"
                      value={paymentForm.merchantId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, merchantId: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-[#111827] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Client ID</label>
                    <input
                      type="text"
                      placeholder="Client ID"
                      value={paymentForm.clientId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, clientId: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-[#111827] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Client Secret</label>
                    <input
                      type="password"
                      placeholder="Client Secret"
                      value={paymentForm.clientSecret}
                      onChange={(e) => setPaymentForm({ ...paymentForm, clientSecret: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Encryption Key</label>
                    <input
                      type="password"
                      placeholder="Encryption Key"
                      value={paymentForm.encryptionKey}
                      onChange={(e) => setPaymentForm({ ...paymentForm, encryptionKey: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Webhook Secret</label>
                    <input
                      type="password"
                      placeholder="Webhook Secret"
                      value={paymentForm.webhookSecret}
                      onChange={(e) => setPaymentForm({ ...paymentForm, webhookSecret: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1">Callback URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={paymentForm.callbackUrl}
                      onChange={(e) => setPaymentForm({ ...paymentForm, callbackUrl: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#6B7280] font-bold mb-1">Administrative Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Optional details, sandbox instructions, or internal team notes..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E7EB] dark:border-[#111827]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] rounded-xl font-bold cursor-pointer hover:bg-[#E5E7EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111827] hover:bg-[#111827] text-white rounded-xl font-bold cursor-pointer shadow-lg inline-flex items-center gap-2 border border-[#4B5563]"
                >
                  <Save className="h-4 w-4 text-[#9CA3AF]" />
                  {editingPaymentProvider ? "Save Changes" : "Save Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {deletingPaymentProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl p-6 border border-[#E5E7EB] dark:border-[#111827] shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">
                Delete Payment Provider
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-2 mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-[#111827] dark:text-white">"{deletingPaymentProvider.name}"</strong> from the database? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingPaymentProvider(null)}
                  className="px-4 py-2.5 bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] rounded-xl font-bold text-xs cursor-pointer hover:bg-[#E5E7EB]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePaymentProvider}
                  className="px-5 py-2.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
