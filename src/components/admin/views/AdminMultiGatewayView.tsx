/**
 * SmartLink Multi-Gateway Routing & Failover Management
 * Phase 2 - Production Identity Gateway Controller
 *
 * Configures intelligent multi-gateway failover matching agenthub.ng & nintrust.com.ng:
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Multi-Gateway Routing & Failover
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Phase 2 Engine Active
                  </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated Provider Failover, Latency Balancing &amp; Real-time Background Reconciliation (NINTrust, AgentHub, Aspfiy, NIMC Direct)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-ping-all-gateways"
              onClick={handlePingAllGateways}
              disabled={loading || pingingId !== null}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
            >
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Probe All Gateways</span>
            </button>

            <button
              id="btn-trigger-reconciliation-sweep"
              onClick={handleTriggerSweep}
              disabled={isProcessingSweep}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isProcessingSweep ? "animate-spin" : ""}`} />
              <span>{isProcessingSweep ? "Sweeping Queue..." : "Run Reconciliation Sweep"}</span>
            </button>

            <button
              id="btn-queue-background-job"
              onClick={() => setIsQueueModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
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
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Gateways</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {metrics.filter((m) => m.status === "ONLINE").length} / {metrics.length} Online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Avg Network Latency</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + m.avgLatencyMs, 0) / metrics.length) : 240}ms
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Failover Occurrences</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{failovers.length} logged</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Async Jobs in Queue</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {jobs.filter((j) => j.status === "QUEUED" || j.status === "PROCESSING").length} Pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "matrix"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Gateway Health Matrix ({metrics.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "rules"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Service Routing Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("failovers")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "failovers"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Failover Audit Stream ({failovers.length})
          </button>
          <button
            onClick={() => setActiveTab("background_queue")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "background_queue"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Background Reconciliation ({jobs.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gateways, services, logs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{metric.providerName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{metric.baseUrl}</p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        metric.status === "ONLINE"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>

                  {/* Circuit Breaker Status */}
                  {metric.circuitBreakerTripped && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Circuit Breaker Tripped ({metric.consecutiveFailures} consecutive failures)</span>
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Uptime Guarantee</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{metric.uptimePercentage}%</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg Latency</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {metric.avgLatencyMs}ms
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Successful Queries</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {metric.successfulQueries.toLocaleString()} / {metric.totalQueries.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Failovers Caused</p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{metric.failoverTriggeredCount} events</p>
                    </div>
                  </div>

                  {/* Last Ping Output */}
                  {pingRes && (
                    <div className="mt-3 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {pingRes.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{pingRes.message}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{pingRes.latency}ms</span>
                    </div>
                  )}
                </div>

                {/* Footer Ping Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Last Checked: {metric.lastPingAt ? new Date(metric.lastPingAt).toLocaleTimeString() : "Never"}
                  </span>

                  <button
                    onClick={() => handlePingGateway(metric.providerId)}
                    disabled={isPinging}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin text-emerald-600" : ""}`} />
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Automated Gateway Routing Matrix (Per Verification Service)
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Auto-Failover switches to secondary gateway immediately if primary latency exceeds timeout or returns 5xx error.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{rule.service}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{rule.serviceName}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {rule.strategy}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{rule.primaryProviderName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-medium">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{rule.secondaryProviderName || "None"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-500 dark:text-slate-400 font-normal">
                        {rule.tertiaryProviderName || "NIMC Direct Fallback"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {rule.timeoutMs}ms / {rule.maxRetries}x
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          rule.autoFailover
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Automated Gateway Failover Audit Stream
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Audit log recording every incident where primary gateway faltered and the switch rescued the transaction.
            </span>
          </div>

          {filteredFailovers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-slate-700 dark:text-slate-300">All primary verification gateways operating flawlessly.</p>
              <p className="text-xs mt-1 text-slate-500">Zero recent failover triggers recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredFailovers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(f.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">{f.reference}</span>
                          <p className="text-[11px] text-slate-500 font-mono">{f.targetIdMasked}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {f.service}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                        {f.failedProviderName}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {f.failureReason}
                      </td>

                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {f.fallbackProviderName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Background Verification &amp; Reconciliation Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated worker sweeps this queue every 45 seconds to resolve asynchronous identity lookups with multi-gateway routing.
              </p>
            </div>

            <button
              onClick={handleTriggerSweep}
              disabled={isProcessingSweep}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessingSweep ? "animate-spin" : ""}`} />
              <span>{isProcessingSweep ? "Processing..." : "Sweep Queue Now"}</span>
            </button>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-slate-700 dark:text-slate-300">Background queue is empty.</p>
              <p className="text-xs mt-1 text-slate-500">All identity verification queries processed in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {job.reference}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{job.service}</span>
                          <p className="text-[11px] text-slate-500 font-mono">{job.maskedId || job.targetId}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {job.userEmail || job.userId}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {job.attempts} / {job.maxAttempts}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            job.status === "COMPLETED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : job.status === "PROCESSING"
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 animate-pulse"
                              : job.status === "FAILED"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {job.resultData ? (
                          <span className="text-emerald-600 font-semibold text-xs">
                            {job.resultData.fullName || "Verified"}
                          </span>
                        ) : job.errorReason ? (
                          <span className="text-rose-600 text-xs truncate max-w-xs">{job.errorReason}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">In Queue</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Configure Gateway Routing: {selectedRule.service}
              </h3>
              <button
                onClick={() => setIsEditingRule(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Routing Strategy
                </label>
                <select
                  value={selectedRule.strategy}
                  onChange={(e) =>
                    setSelectedRule({ ...selectedRule, strategy: e.target.value as RoutingStrategyType })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="PRIORITY_ORDER">PRIORITY_ORDER (Primary &rarr; Secondary &rarr; Tertiary)</option>
                  <option value="FASTEST_RESPONSE">FASTEST_RESPONSE (Dynamic Latency Probing)</option>
                  <option value="LEAST_ERROR_RATE">LEAST_ERROR_RATE (Circuit Breaker Aware)</option>
                  <option value="ROUND_ROBIN">ROUND_ROBIN (Equal Distribution)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Provider
                  </label>
                  <select
                    value={selectedRule.primaryProviderId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const pName = pId === "nintrust" ? "NINTrust Federal Gateway" : pId === "agenthub" ? "AgentHub Identity Gateway" : "Aspfiy Payment Gateway";
                      setSelectedRule({ ...selectedRule, primaryProviderId: pId, primaryProviderName: pName });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="nintrust">NINTrust Federal Gateway (nintrust.com.ng)</option>
                    <option value="agenthub">AgentHub Identity Gateway (agenthub.ng)</option>
                    <option value="aspfiy">Aspfiy Payment Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Gateway (Failover 1)
                  </label>
                  <select
                    value={selectedRule.secondaryProviderId || ""}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const pName = pId === "nintrust" ? "NINTrust Federal Gateway" : pId === "agenthub" ? "AgentHub Identity Gateway" : "Aspfiy Payment Gateway";
                      setSelectedRule({ ...selectedRule, secondaryProviderId: pId, secondaryProviderName: pName });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="agenthub">AgentHub Identity Gateway (agenthub.ng)</option>
                    <option value="nintrust">NINTrust Federal Gateway (nintrust.com.ng)</option>
                    <option value="aspfiy">Aspfiy Payment Gateway</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Timeout Threshold (ms)
                  </label>
                  <input
                    type="number"
                    value={selectedRule.timeoutMs}
                    onChange={(e) => setSelectedRule({ ...selectedRule, timeoutMs: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Retries Before Failover
                  </label>
                  <input
                    type="number"
                    value={selectedRule.maxRetries}
                    onChange={(e) => setSelectedRule({ ...selectedRule, maxRetries: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="chk-autofailover"
                  checked={selectedRule.autoFailover}
                  onChange={(e) => setSelectedRule({ ...selectedRule, autoFailover: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="chk-autofailover" className="font-semibold text-slate-800 dark:text-slate-200">
                  Enable Automatic Instant Failover to Secondary Gateway
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRule(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition font-semibold shadow-sm"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Queue Background Identity Job
              </h3>
              <button
                onClick={() => setIsQueueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQueueJob} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Verification Service
                </label>
                <select
                  value={newJobService}
                  onChange={(e) => setNewJobService(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Identification Number
                </label>
                <input
                  type="text"
                  value={newJobTargetId}
                  onChange={(e) => setNewJobTargetId(e.target.value)}
                  placeholder="e.g. 12345678901 (11 digits)"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    User Identifier
                  </label>
                  <input
                    type="text"
                    value={newJobUserId}
                    onChange={(e) => setNewJobUserId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={newJobUserEmail}
                    onChange={(e) => setNewJobUserEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQueueModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold shadow-sm"
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
