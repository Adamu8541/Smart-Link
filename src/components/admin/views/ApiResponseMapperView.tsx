import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCompare,
  Plus,
  Trash2,
  Edit3,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Search,
  RefreshCw,
  FileText,
  Copy,
  Check,
  X,
  CopyPlus,
  Layers,
  Sparkles,
  ArrowRightLeft,
  CheckSquare,
  ShieldCheck,
  Code
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { ApiResponseMappingConfig, ApiResponseMappingTestLog } from "../../../types";

interface ApiResponseMapperViewProps {
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

const SAMPLE_JSON_TEMPLATES: Record<string, string> = {
  "Paystack Verification": JSON.stringify(
    {
      status: true,
      message: "Account number resolved",
      data: {
        account_number: "0123456789",
        account_name: "JOHN DOE",
        bank_id: 9,
        bank_name: "GTBank",
        session_id: "SESS_992182012"
      }
    },
    null,
    2
  ),
  "Aspfiy Payment": JSON.stringify(
    {
      requestSuccessful: true,
      responseMessage: "Transaction Successful",
      responseCode: "0",
      responseBody: {
        amountPaid: "5000.00",
        totalPayable: "5075.00",
        fee: "75.00",
        paymentReference: "ASP|00|20260807|102030",
        transactionReference: "TRX_991823101",
        paymentStatus: "PAID",
        currencyCode: "NGN",
        customer: {
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "08012345678"
        },
        accountDetails: {
          accountNumber: "9912003311",
          accountName: "SmartLink Digital / Jane Smith",
          bankName: "Wema Bank"
        }
      }
    },
    null,
    2
  ),
  "Flutterwave Transfer": JSON.stringify(
    {
      status: "success",
      message: "Transfer Queued Successfully",
      data: {
        id: 1029381,
        account_number: "0690000031",
        bank_code: "044",
        full_name: "Ahmad Abubakar",
        created_at: "2026-08-07T12:00:00.000Z",
        currency: "NGN",
        amount: 25000,
        fee: 10,
        reference: "FLW_TRX_8830112",
        status: "SUCCESSFUL"
      }
    },
    null,
    2
  )
};

export default function ApiResponseMapperView({ session, onNavigate }: ApiResponseMapperViewProps) {
  const [mappings, setMappings] = useState<ApiResponseMappingConfig[]>([]);
  const [logs, setLogs] = useState<ApiResponseMappingTestLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [activeMapping, setActiveMapping] = useState<Partial<ApiResponseMappingConfig>>({});

  // Test Runner State
  const [sampleInputJson, setSampleInputJson] = useState<string>(SAMPLE_JSON_TEMPLATES["Paystack Verification"]);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Mappings
  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/response-mapper/mappings", {
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        setMappings(data.mappings || []);
      } else {
        showToast(data.message || "Failed to fetch response mappings.", "error");
      }
    } catch (err) {
      showToast("Server error loading response mappings.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/response-mapper/logs", {
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
    fetchMappings();
    fetchLogs();
  }, []);

  // Open Create New Modal
  const handleCreateNew = () => {
    setActiveMapping({
      provider: "Aspfiy",
      endpoint: "https://api.aspfiy.com/v1/disbursements/single",
      mappingName: "",
      responseStatusPath: "requestSuccessful",
      successValue: "true",
      transactionIdPath: "responseBody.paymentReference",
      transactionRefPath: "responseBody.transactionReference",
      amountPath: "responseBody.amountPaid",
      currencyPath: "responseBody.currencyCode",
      chargesPath: "responseBody.fee",
      walletBalancePath: "responseBody.balance",
      customerNamePath: "responseBody.customer.name",
      customerEmailPath: "responseBody.customer.email",
      customerPhonePath: "responseBody.customer.phone",
      accountNumberPath: "responseBody.accountDetails.accountNumber",
      accountNamePath: "responseBody.accountDetails.accountName",
      bankNamePath: "responseBody.accountDetails.bankName",
      sessionIdPath: "responseBody.sessionId",
      messagePath: "responseMessage",
      errorCodePath: "responseCode",
      errorMessagePath: "responseMessage",
      rawJsonPath: "responseBody",
      status: "ENABLED",
      notes: "Default mapping template for Aspfiy payment responses."
    });
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (m: ApiResponseMappingConfig) => {
    setActiveMapping({ ...m });
    setIsEditorOpen(true);
  };

  // Save Mapping (Create or Update)
  const handleSaveMapping = async () => {
    if (!activeMapping.mappingName || !activeMapping.mappingName.trim()) {
      showToast("Mapping Name is required.", "error");
      return;
    }

    try {
      const isEdit = !!activeMapping.id;
      const url = isEdit
        ? `/api/admin/response-mapper/mappings/${activeMapping.id}`
        : "/api/admin/response-mapper/mappings";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken
        },
        body: JSON.stringify(activeMapping)
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Mapping saved successfully!");
        setIsEditorOpen(false);
        fetchMappings();
      } else {
        showToast(data.message || "Failed to save response mapping.", "error");
      }
    } catch (err) {
      showToast("Error saving response mapping.", "error");
    }
  };

  // Duplicate Mapping
  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/admin/response-mapper/mappings/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchMappings();
      } else {
        showToast(data.message || "Failed to duplicate mapping.", "error");
      }
    } catch (err) {
      showToast("Error duplicating mapping.", "error");
    }
  };

  // Toggle Enable / Disable
  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/response-mapper/mappings/${id}/toggle`, {
        method: "POST",
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setMappings((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: data.status } : m))
        );
      } else {
        showToast(data.message || "Failed to toggle status", "error");
      }
    } catch (err) {
      showToast("Error toggling mapping status.", "error");
    }
  };

  // Delete Mapping
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete response mapping "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/response-mapper/mappings/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": session.sessionToken }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setMappings((prev) => prev.filter((m) => m.id !== id));
      } else {
        showToast(data.message || "Failed to delete mapping.", "error");
      }
    } catch (err) {
      showToast("Error deleting mapping.", "error");
    }
  };

  // Run Test Mapping
  const handleRunTest = async (configToTest?: Partial<ApiResponseMappingConfig>) => {
    const targetConfig = configToTest || activeMapping;
    if (!targetConfig || !targetConfig.mappingName) {
      showToast("Please select or specify a valid mapping configuration to test.", "error");
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResult(null);
    setIsTestRunnerOpen(true);

    try {
      const res = await fetch("/api/admin/response-mapper/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken
        },
        body: JSON.stringify({
          mappingConfig: targetConfig,
          sampleJson: sampleInputJson
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult(data);
      } else {
        setTestError(data.message || "Test execution returned an error.");
      }
      fetchLogs();
    } catch (err: any) {
      setTestError(err.message || "Failed to execute mapping test.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter Mappings
  const filteredMappings = mappings.filter((m) => {
    const matchesSearch =
      m.mappingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.endpoint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = selectedProvider === "ALL" || m.provider === selectedProvider;
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div id="api-response-mapper-page" className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto text-[#E5E7EB]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-700"
                : "bg-red-950/90 text-red-200 border-red-700"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 rounded-2xl text-[#9CA3AF]">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">API Response Mapper</h1>
              <p className="text-xs text-[#9CA3AF]">
                Map provider-specific JSON API responses into Smart Link's standardized internal response structure without source code modifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => { fetchMappings(); fetchLogs(); }}
            className="px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#4B5563] border border-[#4B5563] text-[#E5E7EB] hover:text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsLogsOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#4B5563] border border-[#4B5563] text-[#E5E7EB] hover:text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#9CA3AF]" />
            Test Logs ({logs.length})
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F2D5C] to-[#0F2D5C] hover:from-[#0F2D5C] hover:to-[#0F2D5C] text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-none transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Response Mapping
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search mapping name, provider, or endpoint URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#111827] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0F2D5C] transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-[#111827] border border-[#111827] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F2D5C] transition"
          >
            <option value="ALL">All Providers ({mappings.length})</option>
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#111827] border border-[#111827] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F2D5C] transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="ENABLED">Enabled Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-[#111827] border border-[#111827] rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#0F2D5C] animate-spin mx-auto" />
            <p className="text-sm text-[#9CA3AF]">Loading API response mappings...</p>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <GitCompare className="h-12 w-12 text-[#4B5563] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No Response Mappings Found</h3>
              <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
                {searchQuery || selectedProvider !== "ALL" || statusFilter !== "ALL"
                  ? "No response mappings match your filter parameters."
                  : "Create your first API response mapping to automatically parse payment provider responses."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Mapping Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827]/60 text-[#9CA3AF] border-b border-[#111827]">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Provider / Mapping Name</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Key Status & Ref Paths</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Amount & Customer Paths</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B7280] text-[#E5E7EB]">
                {filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-[#111827]/30 transition">
                    {/* Provider & Mapping Name */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#0F2D5C]/80 border border-[#0F2D5C]/60 text-[#9CA3AF] font-mono text-[10px] font-semibold">
                          {m.provider}
                        </span>
                        <p className="font-bold text-white text-sm">{m.mappingName}</p>
                        {m.endpoint && <p className="text-[10px] font-mono text-[#6B7280] truncate max-w-xs">{m.endpoint}</p>}
                      </div>
                    </td>

                    {/* Key Status & Ref Paths */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-[11px] font-mono text-[#E5E7EB]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6B7280]">Status Path:</span>
                          <span className="text-[#9CA3AF] font-bold">{m.responseStatusPath || "(not set)"}</span>
                          {m.successValue && <span className="text-[#6B7280]">={`"${m.successValue}"`}</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6B7280]">Ref Path:</span>
                          <span className="text-[#9CA3AF]">{m.transactionRefPath || "(not set)"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Amount & Customer Paths */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-[11px] font-mono text-[#E5E7EB]">
                        <div>
                          <span className="text-[#6B7280]">Amount:</span>{" "}
                          <span className="text-[#9CA3AF]">{m.amountPath || "(not set)"}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Customer:</span>{" "}
                          <span className="text-[#9CA3AF]">{m.customerNamePath || "(not set)"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(m.id, e)}
                        className={`px-3 py-1 rounded-full font-semibold text-[10px] border transition cursor-pointer inline-flex items-center gap-1.5 ${
                          m.status === "ENABLED"
                            ? "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C] hover:bg-[#0F2D5C]"
                            : "bg-[#111827] text-[#9CA3AF] border-[#4B5563] hover:bg-[#4B5563]"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.status === "ENABLED" ? "bg-[#0F2D5C] animate-pulse" : "bg-[#6B7280]"}`} />
                        {m.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunTest(m)}
                          className="p-2 rounded-xl bg-[#0F2D5C]/80 hover:bg-[#0F2D5C] border border-[#0F2D5C]/80 text-[#9CA3AF] hover:text-white transition cursor-pointer"
                          title="Test Mapping with JSON"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(m.id, e)}
                          className="p-2 rounded-xl bg-[#111827] hover:bg-[#4B5563] border border-[#4B5563] text-[#E5E7EB] hover:text-white transition cursor-pointer"
                          title="Duplicate Mapping"
                        >
                          <CopyPlus className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(m)}
                          className="p-2 rounded-xl bg-[#111827] hover:bg-[#4B5563] border border-[#4B5563] text-[#E5E7EB] hover:text-white transition cursor-pointer"
                          title="Edit Configuration"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.mappingName)}
                          className="p-2 rounded-xl bg-[#0F2D5C]/50 hover:bg-[#0F2D5C]/80 border border-[#0F2D5C]/80 text-[#9CA3AF] hover:text-[#9CA3AF] transition cursor-pointer"
                          title="Delete Mapping"
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

      {/* MAPPING EDITOR MODAL */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-[#111827] border border-[#111827] rounded-3xl p-6 md:p-8 shadow-2xl my-8 space-y-6 max-h-[92vh] overflow-y-auto text-xs"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#111827] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 rounded-xl text-[#9CA3AF]">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {activeMapping.id ? "Edit API Response Mapping" : "Create New API Response Mapping"}
                    </h2>
                    <p className="text-xs text-[#9CA3AF]">
                      Configure dynamic JSON paths to map external provider fields to Smart Link standard outputs.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* General Metadata */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="font-semibold text-[#E5E7EB]">Payment Provider</label>
                  <input
                    type="text"
                    list="provider-suggestions"
                    value={activeMapping.provider || ""}
                    onChange={(e) => setActiveMapping({ ...activeMapping, provider: e.target.value })}
                    placeholder="e.g. Aspfiy, Paystack"
                    className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0F2D5C]"
                  />
                  <datalist id="provider-suggestions">
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="font-semibold text-[#E5E7EB]">Mapping Name *</label>
                  <input
                    type="text"
                    value={activeMapping.mappingName || ""}
                    onChange={(e) => setActiveMapping({ ...activeMapping, mappingName: e.target.value })}
                    placeholder="e.g. Paystack Account Resolve Mapping"
                    className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0F2D5C]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="font-semibold text-[#E5E7EB]">Status</label>
                  <select
                    value={activeMapping.status || "ENABLED"}
                    onChange={(e) => setActiveMapping({ ...activeMapping, status: e.target.value as any })}
                    className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0F2D5C]"
                  >
                    <option value="ENABLED">ENABLED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="font-semibold text-[#E5E7EB]">Endpoint URL (Optional Reference)</label>
                  <input
                    type="text"
                    value={activeMapping.endpoint || ""}
                    onChange={(e) => setActiveMapping({ ...activeMapping, endpoint: e.target.value })}
                    placeholder="e.g. https://api.paystack.co/bank/resolve"
                    className="w-full bg-[#111827] border border-[#111827] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                  />
                </div>
              </div>

              {/* JSON Path Configurations */}
              <div className="space-y-4 pt-4 border-t border-[#111827]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code className="h-4 w-4 text-[#9CA3AF]" />
                    Internal Smart Link Response Mapping Paths (Dot Notation)
                  </h3>
                  <span className="text-[11px] text-[#6B7280] italic">Example: data.reference or responseBody.fee</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Status & Validation */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">1. Transaction Status Mapping</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Response Status Path</label>
                        <input
                          type="text"
                          value={activeMapping.responseStatusPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, responseStatusPath: e.target.value })}
                          placeholder="e.g. status or requestSuccessful"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-[#9CA3AF] font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Success Match Value (Expected for Success)</label>
                        <input
                          type="text"
                          value={activeMapping.successValue || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, successValue: e.target.value })}
                          placeholder="e.g. true or 0 or success or SUCCESSFUL"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Identifiers */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">2. Transaction Identifiers</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Transaction ID Path</label>
                        <input
                          type="text"
                          value={activeMapping.transactionIdPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, transactionIdPath: e.target.value })}
                          placeholder="e.g. data.id or responseBody.paymentReference"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Transaction Reference Path</label>
                        <input
                          type="text"
                          value={activeMapping.transactionRefPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, transactionRefPath: e.target.value })}
                          placeholder="e.g. data.reference or responseBody.transactionReference"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Fields */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">3. Financial Values</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Amount Path</label>
                        <input
                          type="text"
                          value={activeMapping.amountPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, amountPath: e.target.value })}
                          placeholder="e.g. data.amount"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-[#9CA3AF] font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Currency Path</label>
                        <input
                          type="text"
                          value={activeMapping.currencyPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, currencyPath: e.target.value })}
                          placeholder="e.g. data.currency"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Charges / Fee Path</label>
                        <input
                          type="text"
                          value={activeMapping.chargesPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, chargesPath: e.target.value })}
                          placeholder="e.g. responseBody.fee"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Wallet Balance Path</label>
                        <input
                          type="text"
                          value={activeMapping.walletBalancePath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, walletBalancePath: e.target.value })}
                          placeholder="e.g. data.balance"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">4. Customer Details</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Customer Name Path</label>
                        <input
                          type="text"
                          value={activeMapping.customerNamePath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, customerNamePath: e.target.value })}
                          placeholder="e.g. data.customer.name"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Email Path</label>
                          <input
                            type="text"
                            value={activeMapping.customerEmailPath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, customerEmailPath: e.target.value })}
                            placeholder="e.g. data.customer.email"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Phone Path</label>
                          <input
                            type="text"
                            value={activeMapping.customerPhonePath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, customerPhonePath: e.target.value })}
                            placeholder="e.g. data.customer.phone"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Account Details */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">5. Bank & Account Information</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Account Number Path</label>
                          <input
                            type="text"
                            value={activeMapping.accountNumberPath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, accountNumberPath: e.target.value })}
                            placeholder="e.g. data.account_number"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Account Name Path</label>
                          <input
                            type="text"
                            value={activeMapping.accountNamePath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, accountNamePath: e.target.value })}
                            placeholder="e.g. data.account_name"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Bank Name Path</label>
                          <input
                            type="text"
                            value={activeMapping.bankNamePath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, bankNamePath: e.target.value })}
                            placeholder="e.g. data.bank_name"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Session ID Path</label>
                          <input
                            type="text"
                            value={activeMapping.sessionIdPath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, sessionIdPath: e.target.value })}
                            placeholder="e.g. data.session_id"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages & Error Codes */}
                  <div className="p-4 bg-[#111827]/60 rounded-2xl border border-[#111827]/80 space-y-3">
                    <h4 className="font-bold text-[#E5E7EB] text-[11px] uppercase tracking-wider text-[#9CA3AF]">6. Messages, Errors & Raw JSON</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Message Path</label>
                        <input
                          type="text"
                          value={activeMapping.messagePath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, messagePath: e.target.value })}
                          placeholder="e.g. message or responseMessage"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Error Code Path</label>
                          <input
                            type="text"
                            value={activeMapping.errorCodePath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, errorCodePath: e.target.value })}
                            placeholder="e.g. error.code"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#9CA3AF]">Error Message Path</label>
                          <input
                            type="text"
                            value={activeMapping.errorMessagePath || ""}
                            onChange={(e) => setActiveMapping({ ...activeMapping, errorMessagePath: e.target.value })}
                            placeholder="e.g. error.message"
                            className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9CA3AF]">Raw JSON Subset Path (Optional)</label>
                        <input
                          type="text"
                          value={activeMapping.rawJsonPath || ""}
                          onChange={(e) => setActiveMapping({ ...activeMapping, rawJsonPath: e.target.value })}
                          placeholder="e.g. data (leave blank for entire JSON)"
                          className="w-full bg-[#111827] border border-[#111827] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#0F2D5C]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 pt-2 border-t border-[#111827]">
                <label className="font-semibold text-[#E5E7EB]">Administrator Notes</label>
                <textarea
                  rows={2}
                  value={activeMapping.notes || ""}
                  onChange={(e) => setActiveMapping({ ...activeMapping, notes: e.target.value })}
                  placeholder="Optional documentation notes regarding this provider response structure..."
                  className="w-full bg-[#111827] border border-[#111827] rounded-xl p-3 text-xs text-[#E5E7EB] focus:outline-none focus:border-[#0F2D5C]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#111827]">
                <button
                  type="button"
                  onClick={() => handleRunTest()}
                  className="px-4 py-2.5 rounded-xl bg-[#0F2D5C]/80 border border-[#0F2D5C] text-[#9CA3AF] hover:text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Test Mapping
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-medium text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMapping}
                    className="px-6 py-2.5 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-semibold text-xs shadow-lg shadow-none cursor-pointer transition"
                  >
                    Save Mapping
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEST MAPPING MODAL */}
      <AnimatePresence>
        {isTestRunnerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-[#111827] border border-[#111827] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#111827] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 rounded-xl text-[#9CA3AF]">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Test API Response Mapping</h2>
                    <p className="text-xs text-[#9CA3AF]">
                      Paste sample provider JSON to preview mapped internal standard outputs, missing fields, and invalid JSON paths.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTestRunnerOpen(false)}
                  className="p-2 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sample Templates Quick Load */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-[#E5E7EB]">Paste Sample Provider JSON Payload</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#6B7280]">Load Template:</span>
                    {Object.keys(SAMPLE_JSON_TEMPLATES).map((tplKey) => (
                      <button
                        key={tplKey}
                        type="button"
                        onClick={() => setSampleInputJson(SAMPLE_JSON_TEMPLATES[tplKey])}
                        className="px-2 py-1 rounded bg-[#111827] hover:bg-[#4B5563] text-[10px] text-[#9CA3AF] font-medium transition cursor-pointer"
                      >
                        {tplKey}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={sampleInputJson}
                  onChange={(e) => setSampleInputJson(e.target.value)}
                  placeholder="Paste JSON response body here..."
                  className="w-full bg-[#111827] border border-[#111827] rounded-2xl p-4 text-xs font-mono text-[#9CA3AF] focus:outline-none focus:border-[#0F2D5C]"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRunTest()}
                    disabled={isTesting}
                    className="px-5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-none transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isTesting ? "animate-spin" : ""}`} />
                    {isTesting ? "Evaluating..." : "Run Test Evaluation"}
                  </button>
                </div>
              </div>

              {/* Test Results Section */}
              {isTesting ? (
                <div className="p-10 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-[#0F2D5C] animate-spin mx-auto" />
                  <p className="text-xs text-[#9CA3AF]">Parsing JSON and evaluating response mapping paths...</p>
                </div>
              ) : testError ? (
                <div className="p-5 bg-[#0F2D5C]/50 border border-[#0F2D5C]/80 rounded-2xl space-y-2 text-[#9CA3AF] text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Mapping Evaluation Error</span>
                  </div>
                  <p className="font-mono">{testError}</p>
                </div>
              ) : testResult ? (
                <div className="space-y-6 pt-4 border-t border-[#111827]">
                  {/* Test Result Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-[#111827]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#9CA3AF]">Mapping Test Result:</span>
                      <span
                        className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                          testResult.testResult === "SUCCESS"
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-700"
                            : testResult.testResult === "PARTIAL"
                            ? "bg-amber-950/70 text-amber-300 border-amber-700"
                            : "bg-red-950/70 text-red-300 border-red-700"
                        }`}
                      >
                        {testResult.testResult}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#9CA3AF]">
                        Invalid Paths: <strong className="text-red-400">{testResult.invalidPaths?.length || 0}</strong>
                      </span>
                      <span className="text-[#9CA3AF]">
                        Unmapped Fields: <strong className="text-amber-400">{testResult.missingFields?.length || 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Warnings for Invalid Paths */}
                  {testResult.invalidPaths && testResult.invalidPaths.length > 0 && (
                    <div className="p-4 bg-[#0F2D5C]/40 border border-[#0F2D5C]/60 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-[#9CA3AF] font-bold text-xs">
                        <XCircle className="h-4 w-4" />
                        <span>Invalid / Unresolved JSON Paths ({testResult.invalidPaths.length})</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF]">The following configured paths returned <code className="text-[#9CA3AF] font-mono">undefined</code> against the sample JSON:</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {testResult.invalidPaths.map((ip: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#0F2D5C] text-[#9CA3AF] font-mono text-[10px] border border-[#0F2D5C]">
                            {ip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed Output - Smart Link Standard Response */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#9CA3AF]" />
                        Final Internal Smart Link Standardized Output
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyText(JSON.stringify(testResult.parsedOutput, null, 2), "parsedOutput")}
                        className="text-[11px] text-[#9CA3AF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "parsedOutput" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy Output JSON
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-xs font-mono bg-[#111827] p-4 rounded-2xl border border-[#111827]">
                      {testResult.parsedOutput && Object.keys(testResult.parsedOutput).map((key) => {
                        const val = testResult.parsedOutput[key];
                        return (
                          <div key={key} className="p-2.5 bg-[#111827]/80 rounded-xl border border-[#111827] flex flex-col justify-between">
                            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-sans font-semibold">{key}</span>
                            <span className={`font-bold truncate mt-1 ${
                              key === "status"
                                ? val === "SUCCESS" ? "text-emerald-400" : "text-red-400"
                                : val !== null && val !== undefined ? "text-[#E5E7EB]" : "text-[#4B5563] italic"
                            }`}>
                              {val === null || val === undefined ? "null" : typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Original Input JSON */}
                  <div className="space-y-2">
                    <label className="font-bold text-xs text-[#E5E7EB]">Original Provider JSON</label>
                    <pre className="p-4 bg-[#111827] border border-[#111827] rounded-2xl text-[11px] text-[#E5E7EB] font-mono overflow-x-auto max-h-48">
                      {JSON.stringify(testResult.originalJson || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-4 border-t border-[#111827]">
                <button
                  type="button"
                  onClick={() => setIsTestRunnerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-white font-medium text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXECUTION LOGS MODAL */}
      <AnimatePresence>
        {isLogsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-[#111827] border border-[#111827] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#111827] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 rounded-xl text-[#9CA3AF]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">API Response Mapping Test Logs</h2>
                    <p className="text-xs text-[#9CA3AF]">Historical records of response mapping tests and validation results.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogsOpen(false)}
                  className="p-2 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-[#9CA3AF] space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-[#4B5563]" />
                  <p className="text-xs">No response mapping test logs recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827]/60 text-[#9CA3AF] border-b border-[#111827]">
                      <tr>
                        <th className="px-4 py-3 font-semibold uppercase">Mapping / Provider</th>
                        <th className="px-4 py-3 font-semibold uppercase">Test Result</th>
                        <th className="px-4 py-3 font-semibold uppercase">Tested By</th>
                        <th className="px-4 py-3 font-semibold uppercase">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#6B7280] text-[#E5E7EB]">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#111827]/30">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-bold text-white">{log.mappingName}</p>
                              <p className="text-[10px] font-mono text-[#9CA3AF]">{log.provider}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                log.testResult === "SUCCESS"
                                  ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                                  : log.testResult === "PARTIAL"
                                  ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                                  : "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                              }`}
                            >
                              {log.testResult}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#E5E7EB]">{log.testedBy}</td>
                          <td className="px-4 py-3 text-[#9CA3AF] font-mono text-[11px]">{log.date} {log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-[#111827]">
                <button
                  type="button"
                  onClick={() => setIsLogsOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#4B5563] text-white font-medium text-xs transition cursor-pointer"
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
