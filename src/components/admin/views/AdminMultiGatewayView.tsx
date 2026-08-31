/**
 * SmartLink Multi-Gateway Routing & Failover Management
 * Phase 2 - Production Identity Gateway Controller
 *
 * Configures intelligent multi-gateway failover matching aspfiy & verifyng ecosystems:
 * - Dynamic Service Routing Rules (NIN, BVN, Phone, CAC, TIN, etc.)
 * - Gateway Health Matrix & Real-Time Latency Probes
 * - Automated Failover Audit Logs Stream
 * - Background Verification Reconciliation Queue
 */

import React, { useState, useEffect } from "react";
import {
  Server,
  Shield,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  Clock,
  Settings2,
  Sliders,
  Send,
  Layers,
  Search,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  GatewayRoutingRule,
  GatewayHealthMetric,
  GatewayFailoverLog,
  BackgroundVerificationJob,
  RoutingStrategyType,
} from "../../../types/provider";

export const AdminMultiGatewayView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matrix" | "rules" | "failovers" | "background_queue">("matrix");
  const [loading, setLoading] = useState<boolean>(true);
  const [rules, setRules] = useState<GatewayRoutingRule[]>([]);
  const [metrics, setMetrics] = useState<GatewayHealthMetric[]>([]);
  const [failovers, setFailovers] = useState<GatewayFailoverLog[]>([]);
  const [jobs, setJobs] = useState<BackgroundVerificationJob[]>([]);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latency: number; message: string }>>({});
  const [selectedRule, setSelectedRule] = useState<GatewayRoutingRule | null>(null);
  const [isEditingRule, setIsEditingRule] = useState<boolean>(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [isProcessingSweep, setIsProcessingSweep] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // New Queue Form State
  const [newJobService, setNewJobService] = useState<string>("NIN");
  const [newJobTargetId, setNewJobTargetId] = useState<string>("");
  const [newJobUserId, setNewJobUserId] = useState<string>("usr_admin_test");
  const [newJobUserEmail, setNewJobUserEmail] = useState<string>("admin@smartlink.ng");

  // Load gateway routing data from backend
  const fetchGatewayData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gateway-routing");
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        setMetrics(data.metrics || []);
        setFailovers(data.failovers || []);
        setJobs(data.backgroundJobs || []);
      }
    } catch (err) {
      console.error("Failed to load gateway data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // Ping a specific Gateway
  const handlePingGateway = async (providerId: string) => {
    setPingingId(providerId);
    try {
      const res = await fetch("/api/admin/gateway-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.success && data.pingResult) {
        setPingResults((prev) => ({
          ...prev,
          [providerId]: {
            ok: data.pingResult.ok,
            latency: data.pingResult.responseTimeMs,
            message: data.pingResult.message,
          },
        }));
        if (data.metrics) setMetrics(data.metrics);
        showFeedback(`${providerId.toUpperCase()} ping: ${data.pingResult.message} (${data.pingResult.responseTimeMs}ms)`);
      } else {
        showFeedback(data.error || "Ping failed", "error");
      }
    } catch (err: any) {
      showFeedback(`Ping error: ${err.message}`, "error");
    } finally {
      setPingingId(null);
    }
  };

  // Ping all gateways in parallel
  const handlePingAllGateways = async () => {
    for (const metric of metrics) {
      await handlePingGateway(metric.providerId);
    }
  };

  // Save updated routing rule
  const handleSaveRule = async (updatedRule: GatewayRoutingRule) => {
    try {
      const res = await fetch("/api/admin/gateway-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: updatedRule }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        setIsEditingRule(false);
        setSelectedRule(null);
        showFeedback(`Routing rules for ${updatedRule.service} updated successfully.`);
      } else {
        showFeedback(data.error || "Failed to update routing rule.", "error");
      }
    } catch (err: any) {
      showFeedback(`Update failed: ${err.message}`, "error");
    }
  };

  // Trigger Background Verification Sweep
  const handleTriggerSweep = async () => {
    setIsProcessingSweep(true);
    try {
      const res = await fetch("/api/admin/background-jobs/process", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        showFeedback(data.message || "Background verification sweep completed.");
        fetchGatewayData();
      } else {
        showFeedback(data.error || "Sweep execution failed.", "error");
      }
    } catch (err: any) {
      showFeedback(`Sweep error: ${err.message}`, "error");
    } finally {
      setIsProcessingSweep(false);
    }
  };

  // Queue a new test background job
  const handleQueueJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTargetId.trim()) {
      showFeedback("Target ID is required.", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/background-jobs/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: newJobService,
          targetId: newJobTargetId.trim(),
          userId: newJobUserId,
          userEmail: newJobUserEmail,
          fee: 500,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("Verification successfully queued in background worker.");
        setIsQueueModalOpen(false);
        setNewJobTargetId("");
        fetchGatewayData();
      } else {
        showFeedback(data.error || "Failed to queue job.", "error");
      }
    } catch (err: any) {
      showFeedback(`Queue error: ${err.message}`, "error");
    }
  };

  // Filtered lists
  const filteredRules = rules.filter(
    (r) =>
      r.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.primaryProviderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFailovers = failovers.filter(
    (f) =>
      f.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.failedProviderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.fallbackProviderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(
    (j) =>
      j.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="admin-multi-gateway-view" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-lg">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  Multi-Gateway Routing & Failover
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#E5E7EB] dark:bg-[#0F2D5C]/50 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
                    Phase 2 Engine Active
                  </span>
                </h1>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                  Automated Provider Failover, Latency Balancing &amp; Real-time Background Reconciliation (Aspfiy, VerifyNG, NIN API)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-ping-all-gateways"
              onClick={handlePingAllGateways}
              disabled={loading || pingingId !== null}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] border border-[#E5E7EB] dark:border-[#4B5563] transition"
            >
              <Activity className="w-4 h-4 text-[#0F2D5C] animate-pulse" />
              <span>Probe All Gateways</span>
            </button>

            <button
              id="btn-trigger-reconciliation-sweep"
              onClick={handleTriggerSweep}
              disabled={isProcessingSweep}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white shadow-sm transition disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isProcessingSweep ? "animate-spin" : ""}`} />
              <span>{isProcessingSweep ? "Sweeping Queue..." : "Run Reconciliation Sweep"}</span>
            </button>

            <button
              id="btn-queue-background-job"
              onClick={() => setIsQueueModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white shadow-sm transition"
            >
              <Play className="w-4 h-4" />
              <span>Queue Async Job</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm flex items-center space-x-2 border ${
              statusMessage.type === "success"
                ? "bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#0F2D5C]"
                : "bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#0F2D5C]"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Active Gateways</p>
              <p className="text-lg font-bold text-[#111827] dark:text-white">
                {metrics.filter((m) => m.status === "ONLINE").length} / {metrics.length} Online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Avg Network Latency</p>
              <p className="text-lg font-bold text-[#111827] dark:text-white">
                {metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + m.avgLatencyMs, 0) / metrics.length) : 240}ms
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Failover Occurrences</p>
              <p className="text-lg font-bold text-[#111827] dark:text-white">{failovers.length} logged</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Async Jobs in Queue</p>
              <p className="text-lg font-bold text-[#111827] dark:text-white">
                {jobs.filter((j) => j.status === "QUEUED" || j.status === "PROCESSING").length} Pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#111827] pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "matrix"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#111827]"
            }`}
          >
            Gateway Health Matrix ({metrics.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "rules"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#111827]"
            }`}
          >
            Service Routing Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("failovers")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "failovers"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#111827]"
            }`}
          >
            Failover Audit Stream ({failovers.length})
          </button>
          <button
            onClick={() => setActiveTab("background_queue")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "background_queue"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#111827]"
            }`}
          >
            Background Reconciliation ({jobs.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gateways, services, logs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
          />
        </div>
      </div>

      {/* TAB 1: GATEWAY HEALTH MATRIX */}
      {activeTab === "matrix" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map((metric) => {
            const isPinging = pingingId === metric.providerId;
            const pingRes = pingResults[metric.providerId];

            return (
              <div
                key={metric.providerId}
                className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl p-5 shadow-sm hover:border-[#E5E7EB] dark:hover:border-[#4B5563] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-[#111827] dark:text-white text-base">{metric.providerName}</h3>
                      </div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">{metric.baseUrl}</p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        metric.status === "ONLINE"
                          ? "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]"
                          : "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]"
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>

                  {/* Circuit Breaker Status */}
                  {metric.circuitBreakerTripped && (
                    <div className="mt-3 p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] text-xs flex items-center space-x-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Circuit Breaker Tripped ({metric.consecutiveFailures} consecutive failures)</span>
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#111827]">
                    <div className="bg-[#F5F7FA] dark:bg-[#111827]/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Uptime Guarantee</p>
                      <p className="text-sm font-bold text-[#111827] dark:text-white">{metric.uptimePercentage}%</p>
                    </div>

                    <div className="bg-[#F5F7FA] dark:bg-[#111827]/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Avg Latency</p>
                      <p className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#0F2D5C]" />
                        {metric.avgLatencyMs}ms
                      </p>
                    </div>

                    <div className="bg-[#F5F7FA] dark:bg-[#111827]/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Successful Queries</p>
                      <p className="text-sm font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
                        {metric.successfulQueries.toLocaleString()} / {metric.totalQueries.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-[#F5F7FA] dark:bg-[#111827]/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Failovers Caused</p>
                      <p className="text-sm font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">{metric.failoverTriggeredCount} events</p>
                    </div>
                  </div>

                  {/* Last Ping Output */}
                  {pingRes && (
                    <div className="mt-3 p-2.5 bg-[#E5E7EB] dark:bg-[#111827] rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {pingRes.ok ? <CheckCircle2 className="w-4 h-4 text-[#0F2D5C]" /> : <AlertTriangle className="w-4 h-4 text-[#0F2D5C]" />}
                        <span className="text-[#4B5563] dark:text-[#E5E7EB] truncate max-w-[180px]">{pingRes.message}</span>
                      </div>
                      <span className="font-mono font-bold text-[#111827] dark:text-white">{pingRes.latency}ms</span>
                    </div>
                  )}
                </div>

                {/* Footer Ping Button */}
                <div className="mt-5 pt-3 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
                  <span className="text-[11px] text-[#9CA3AF]">
                    Last Checked: {metric.lastPingAt ? new Date(metric.lastPingAt).toLocaleTimeString() : "Never"}
                  </span>

                  <button
                    onClick={() => handlePingGateway(metric.providerId)}
                    disabled={isPinging}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/40 dark:hover:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C] transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin text-[#0F2D5C]" : ""}`} />
                    <span>{isPinging ? "Testing..." : "Ping Provider"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SERVICE ROUTING RULES */}
      {activeTab === "rules" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
            <h2 className="font-bold text-[#111827] dark:text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0F2D5C]" />
              Automated Gateway Routing Matrix (Per Verification Service)
            </h2>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Auto-Failover switches to secondary gateway immediately if primary latency exceeds timeout or returns 5xx error.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] dark:bg-[#111827]/60 text-[#4B5563] dark:text-[#E5E7EB] font-semibold border-b border-[#E5E7EB] dark:border-[#111827]">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Routing Strategy</th>
                  <th className="py-3 px-4">Primary Gateway</th>
                  <th className="py-3 px-4">Secondary (Failover 1)</th>
                  <th className="py-3 px-4">Tertiary (Failover 2)</th>
                  <th className="py-3 px-4">Timeout / Retries</th>
                  <th className="py-3 px-4">Auto-Failover</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B7280] dark:divide-[#6B7280] text-[#111827] dark:text-[#E5E7EB]">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#111827]/30 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-[#111827] dark:text-white text-sm">{rule.service}</span>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{rule.serviceName}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] border border-[#E5E7EB] dark:border-[#4B5563]">
                        {rule.strategy}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-[#0F2D5C] dark:text-[#9CA3AF] font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{rule.primaryProviderName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-[#4B5563] dark:text-[#9CA3AF] font-medium">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#0F2D5C] shrink-0" />
                        <span>{rule.secondaryProviderName || "None"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[#6B7280] dark:text-[#9CA3AF] font-normal">
                        {rule.tertiaryProviderName || "NIN API Fallback"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[#4B5563] dark:text-[#9CA3AF] font-medium">
                        {rule.timeoutMs}ms / {rule.maxRetries}x
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          rule.autoFailover
                            ? "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF]"
                            : "bg-[#E5E7EB] dark:bg-[#111827] text-[#6B7280]"
                        }`}
                      >
                        {rule.autoFailover ? "Enabled" : "Disabled"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsEditingRule(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] transition"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Configure</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FAILOVER AUDIT STREAM */}
      {activeTab === "failovers" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
            <h2 className="font-bold text-[#111827] dark:text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0F2D5C]" />
              Automated Gateway Failover Audit Stream
            </h2>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Audit log recording every incident where primary gateway faltered and the switch rescued the transaction.
            </span>
          </div>

          {filteredFailovers.length === 0 ? (
            <div className="p-12 text-center text-[#9CA3AF]">
              <CheckCircle2 className="w-10 h-10 text-[#0F2D5C] mx-auto mb-2 opacity-80" />
              <p className="font-medium text-[#4B5563] dark:text-[#E5E7EB]">All primary verification gateways operating flawlessly.</p>
              <p className="text-xs mt-1 text-[#6B7280]">Zero recent failover triggers recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] dark:bg-[#111827]/60 text-[#4B5563] dark:text-[#E5E7EB] font-semibold border-b border-[#E5E7EB] dark:border-[#111827]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Reference / Target</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Failed Provider</th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4">Resolved Backup Gateway</th>
                    <th className="py-3 px-4">Recovery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6B7280] dark:divide-[#6B7280] text-[#111827] dark:text-[#E5E7EB]">
                  {filteredFailovers.map((f) => (
                    <tr key={f.id} className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#111827]/30 transition">
                      <td className="py-3 px-4 font-mono text-[#6B7280]">
                        {new Date(f.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold font-mono text-[#111827] dark:text-white">{f.reference}</span>
                          <p className="text-[11px] text-[#6B7280] font-mono">{f.targetIdMasked}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-[#E5E7EB] dark:bg-[#111827] text-[#111827] dark:text-[#E5E7EB]">
                          {f.service}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#0F2D5C] dark:text-[#9CA3AF] font-medium">
                        {f.failedProviderName}
                      </td>

                      <td className="py-3 px-4 text-[#4B5563] dark:text-[#9CA3AF] max-w-xs truncate">
                        {f.failureReason}
                      </td>

                      <td className="py-3 px-4 text-[#0F2D5C] dark:text-[#9CA3AF] font-semibold">
                        {f.fallbackProviderName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
                          Rescued &amp; Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BACKGROUND RECONCILIATION QUEUE */}
      {activeTab === "background_queue" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#111827] dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F2D5C]" />
                Background Verification &amp; Reconciliation Queue
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Automated worker sweeps this queue every 45 seconds to resolve asynchronous identity lookups with multi-gateway routing.
              </p>
            </div>

            <button
              onClick={handleTriggerSweep}
              disabled={isProcessingSweep}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white shadow-sm transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessingSweep ? "animate-spin" : ""}`} />
              <span>{isProcessingSweep ? "Processing..." : "Sweep Queue Now"}</span>
            </button>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-[#9CA3AF]">
              <Clock className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
              <p className="font-medium text-[#4B5563] dark:text-[#E5E7EB]">Background queue is empty.</p>
              <p className="text-xs mt-1 text-[#6B7280]">All identity verification queries processed in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] dark:bg-[#111827]/60 text-[#4B5563] dark:text-[#E5E7EB] font-semibold border-b border-[#E5E7EB] dark:border-[#111827]">
                  <tr>
                    <th className="py-3 px-4">Job Reference</th>
                    <th className="py-3 px-4">Service / Target</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6B7280] dark:divide-[#6B7280] text-[#111827] dark:text-[#E5E7EB]">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#F5F7FA]/50 dark:hover:bg-[#111827]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827] dark:text-white">
                        {job.reference}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-[#111827] dark:text-[#E5E7EB]">{job.service}</span>
                          <p className="text-[11px] text-[#6B7280] font-mono">{job.maskedId || job.targetId}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#4B5563] dark:text-[#9CA3AF] font-mono">
                        {job.userEmail || job.userId}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {job.attempts} / {job.maxAttempts}
                      </td>

                      <td className="py-3 px-4 text-[#6B7280]">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            job.status === "COMPLETED"
                              ? "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF]"
                              : job.status === "PROCESSING"
                              ? "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF] animate-pulse"
                              : job.status === "FAILED"
                              ? "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF]"
                              : "bg-[#E5E7EB] dark:bg-[#0F2D5C]/60 text-[#0F2D5C] dark:text-[#9CA3AF]"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {job.resultData ? (
                          <span className="text-[#0F2D5C] font-semibold text-xs">
                            {job.resultData.fullName || "Verified"}
                          </span>
                        ) : job.errorReason ? (
                          <span className="text-[#0F2D5C] text-xs truncate max-w-xs">{job.errorReason}</span>
                        ) : (
                          <span className="text-[#9CA3AF] text-xs">In Queue</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT ROUTING RULE MODAL */}
      {isEditingRule && selectedRule && (
        <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl max-w-lg w-full border border-[#E5E7EB] dark:border-[#111827] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
              <h3 className="font-bold text-[#111827] dark:text-white text-base">
                Configure Gateway Routing: {selectedRule.service}
              </h3>
              <button
                onClick={() => setIsEditingRule(false)}
                className="text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB]"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRule(selectedRule);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                  Routing Strategy
                </label>
                <select
                  value={selectedRule.strategy}
                  onChange={(e) =>
                    setSelectedRule({ ...selectedRule, strategy: e.target.value as RoutingStrategyType })
                  }
                  className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                >
                  <option value="PRIORITY_ORDER">PRIORITY_ORDER (Primary &rarr; Secondary &rarr; Tertiary)</option>
                  <option value="FASTEST_RESPONSE">FASTEST_RESPONSE (Dynamic Latency Probing)</option>
                  <option value="LEAST_ERROR_RATE">LEAST_ERROR_RATE (Circuit Breaker Aware)</option>
                  <option value="ROUND_ROBIN">ROUND_ROBIN (Equal Distribution)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    Primary Provider
                  </label>
                  <select
                    value={selectedRule.primaryProviderId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const pName = pId === "aspfiy" ? "Aspfiy Payment Gateway" : pId === "verifyng" ? "VerifyNG Gateway" : "LumiID Gateway";
                      setSelectedRule({ ...selectedRule, primaryProviderId: pId, primaryProviderName: pName });
                    }}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                  >
                    <option value="aspfiy">Aspfiy Payment Gateway</option>
                    <option value="verifyng">VerifyNG Gateway</option>
                    <option value="lumiid">LumiID Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    Secondary Gateway (Failover 1)
                  </label>
                  <select
                    value={selectedRule.secondaryProviderId || ""}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const pName = pId === "aspfiy" ? "Aspfiy Payment Gateway" : pId === "verifyng" ? "VerifyNG Gateway" : "LumiID Gateway";
                      setSelectedRule({ ...selectedRule, secondaryProviderId: pId, secondaryProviderName: pName });
                    }}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                  >
                    <option value="aspfiy">Aspfiy Payment Gateway</option>
                    <option value="verifyng">VerifyNG Gateway</option>
                    <option value="lumiid">LumiID Gateway</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    Timeout Threshold (ms)
                  </label>
                  <input
                    type="number"
                    value={selectedRule.timeoutMs}
                    onChange={(e) => setSelectedRule({ ...selectedRule, timeoutMs: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    Max Retries Before Failover
                  </label>
                  <input
                    type="number"
                    value={selectedRule.maxRetries}
                    onChange={(e) => setSelectedRule({ ...selectedRule, maxRetries: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="chk-autofailover"
                  checked={selectedRule.autoFailover}
                  onChange={(e) => setSelectedRule({ ...selectedRule, autoFailover: e.target.checked })}
                  className="rounded border-[#E5E7EB] text-[#0F2D5C] focus:ring-[#0F2D5C] w-4 h-4"
                />
                <label htmlFor="chk-autofailover" className="font-semibold text-[#111827] dark:text-[#E5E7EB]">
                  Enable Automatic Instant Failover to Secondary Gateway
                </label>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRule(false)}
                  className="px-4 py-2 rounded-lg bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F2D5C] text-white hover:bg-[#0F2D5C] transition font-semibold shadow-sm"
                >
                  Save Routing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUEUE ASYNC JOB MODAL */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl max-w-md w-full border border-[#E5E7EB] dark:border-[#111827] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between">
              <h3 className="font-bold text-[#111827] dark:text-white text-base">
                Queue Background Identity Job
              </h3>
              <button
                onClick={() => setIsQueueModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQueueJob} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                  Verification Service
                </label>
                <select
                  value={newJobService}
                  onChange={(e) => setNewJobService(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                >
                  <option value="NIN">NIN Identity Verification</option>
                  <option value="BVN">BVN Banking Verification</option>
                  <option value="PHONE">Phone KYC Lookup</option>
                  <option value="CAC">CAC Corporate Verification</option>
                  <option value="TIN">TIN Tax ID Verification</option>
                  <option value="DRIVER_LICENSE">Driver License Validation</option>
                  <option value="PASSPORT">International Passport</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                  Target Identification Number
                </label>
                <input
                  type="text"
                  value={newJobTargetId}
                  onChange={(e) => setNewJobTargetId(e.target.value)}
                  placeholder="e.g. 12345678901 (11 digits)"
                  className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    User Identifier
                  </label>
                  <input
                    type="text"
                    value={newJobUserId}
                    onChange={(e) => setNewJobUserId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B5563] dark:text-[#E5E7EB] mb-1">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={newJobUserEmail}
                    onChange={(e) => setNewJobUserEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQueueModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F2D5C] text-white hover:bg-[#0F2D5C] transition font-semibold shadow-sm"
                >
                  Enqueue Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
