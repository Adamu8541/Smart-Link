/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  ExternalLink,
  Edit3,
  Lock,
  Layers,
  BarChart3,
  Calendar,
  Clock,
  Shield,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { LegalAcceptanceRecord, LegalPolicyVersion, LegalComplianceStats } from "../../../types/legal";
import { LegalConsentService } from "../../../services/legalConsentService";
import { LEGAL_DOCUMENTS } from "../../legal/legalData";

export interface AdminLegalComplianceViewProps {
  session: AdminSession | null;
  onNavigate?: (routePath: string) => void;
}

export function AdminLegalComplianceView({ session, onNavigate }: AdminLegalComplianceViewProps) {
  const [activeTab, setActiveTab] = useState<"POLICIES" | "ANALYTICS" | "AUDIT_LOGS" | "DPO">("POLICIES");
  const [stats, setStats] = useState<LegalComplianceStats | null>(null);
  const [policies, setPolicies] = useState<LegalPolicyVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState<string>("ALL");
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>("ALL");

  // Edit Policy Modal State
  const [editingPolicy, setEditingPolicy] = useState<LegalPolicyVersion | null>(null);
  const [editVersion, setEditVersion] = useState<string>("");
  const [editEffectiveDate, setEditEffectiveDate] = useState<string>("");
  const [editRequiresReAcceptance, setEditRequiresReAcceptance] = useState<boolean>(true);
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await LegalConsentService.getAdminComplianceStats();
      if (data) {
        setStats(data.stats);
        setPolicies(data.policies || []);
      }
    } catch (e) {
      console.error("Failed to load legal compliance stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (policy: LegalPolicyVersion) => {
    setEditingPolicy(policy);
    setEditVersion(policy.version);
    setEditEffectiveDate(policy.effectiveDate);
    setEditRequiresReAcceptance(policy.requiresReAcceptance);
  };

  const handleSavePolicyEdit = async () => {
    if (!editingPolicy || !editVersion) return;
    setEditSaving(true);
    try {
      const success = await LegalConsentService.updatePolicyVersion({
        documentId: editingPolicy.documentId,
        version: editVersion,
        effectiveDate: editEffectiveDate,
        requiresReAcceptance: editRequiresReAcceptance,
        lastUpdated: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      });

      if (success) {
        setSuccessToast(`Successfully updated version for ${editingPolicy.documentName}`);
        setTimeout(() => setSuccessToast(null), 4000);
        setEditingPolicy(null);
        await loadData();
      }
    } catch (e) {
      console.error("Failed to update policy:", e);
    } finally {
      setEditSaving(false);
    }
  };

  // Filter audit logs
  const filteredLogs = (stats?.recentAcceptances || []).filter((log) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.documentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.documentId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWorkflow =
      selectedWorkflowFilter === "ALL" || log.workflow === selectedWorkflowFilter;

    const matchesDoc =
      selectedDocFilter === "ALL" || log.documentId === selectedDocFilter;

    return matchesSearch && matchesWorkflow && matchesDoc;
  });

  const exportAuditLogsCsv = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    const headers = ["Acceptance ID", "User ID", "User Email", "Document", "Version", "Workflow", "Timestamp", "IP Address", "User Agent"];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.userId}"`,
      `"${l.userEmail || ""}"`,
      `"${l.documentTitle || l.documentId}"`,
      `"${l.documentVersion}"`,
      `"${l.workflow}"`,
      `"${l.acceptedAt}"`,
      `"${l.ipAddress || ""}"`,
      `"${(l.userAgent || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartlink_legal_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-left max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] text-white p-6 rounded-2xl border border-[#111827] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 flex items-center justify-center text-[#9CA3AF] shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight">Legal & Regulatory Compliance Hub</h1>
              <span className="bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                NDPA 2023 Active
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Manage binding user agreements, statutory document versions, and immutable consent audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] border border-[#4B5563] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs rounded-xl font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#0F2D5C] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] text-xs">
            <span>Total Recorded Consents</span>
            <CheckCircle2 className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <div className="text-2xl font-bold text-[#111827]">
            {stats?.totalAcceptances || 0}
          </div>
          <p className="text-[11px] text-[#6B7280]">Immutable audit logs in secure database</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] text-xs">
            <span>Unique Consented Users</span>
            <Users className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <div className="text-2xl font-bold text-[#111827]">
            {stats?.uniqueUsersAccepted || 0}
          </div>
          <p className="text-[11px] text-[#6B7280]">Verified account holders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] text-xs">
            <span>Active Policy Suite</span>
            <FileText className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <div className="text-2xl font-bold text-[#111827]">
            {policies.length || LEGAL_DOCUMENTS.length}
          </div>
          <p className="text-[11px] text-[#6B7280]">Full statutory document catalog</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] text-xs">
            <span>Mandatory Re-acceptance</span>
            <Lock className="h-4 w-4 text-[#0F2D5C]" />
          </div>
          <div className="text-2xl font-bold text-[#111827]">
            {policies.filter((p) => p.requiresReAcceptance).length || 4}
          </div>
          <p className="text-[11px] text-[#6B7280]">Gated on login if updated</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="flex border-b border-[#E5E7EB] bg-[#F5F7FA]/70 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === "POLICIES"
                ? "border-[#0F2D5C] text-[#0F2D5C] bg-white shadow-2xs"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Policy Versions & Re-acceptance Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ANALYTICS")}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === "ANALYTICS"
                ? "border-[#0F2D5C] text-[#0F2D5C] bg-white shadow-2xs"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Consent Analytics & Breakdowns
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("AUDIT_LOGS")}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "AUDIT_LOGS"
                ? "border-[#0F2D5C] text-[#0F2D5C] bg-white shadow-2xs"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-[#6B7280]" />
            <span>Immutable Acceptance Logs ({filteredLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DPO")}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === "DPO"
                ? "border-[#0F2D5C] text-[#0F2D5C] bg-white shadow-2xs"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            NDPA 2023 & DPO Governance
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: POLICIES */}
          {activeTab === "POLICIES" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Legal Document Versioning Registry</h3>
                  <p className="text-xs text-[#6B7280]">
                    Updating a document version here will automatically enforce user re-acceptance on their next session.
                  </p>
                </div>
              </div>

              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#4B5563] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Document Title</th>
                      <th className="py-3 px-3">Active Version</th>
                      <th className="py-3 px-3">Effective Date</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Re-acceptance Rule</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#6B7280] text-[#4B5563]">
                    {policies.map((p) => (
                      <tr key={p.documentId} className="hover:bg-[#F5F7FA]/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111827]">
                          {p.documentName}
                          <div className="text-[10px] font-mono text-[#9CA3AF] font-normal">
                            /{p.documentId}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0F2D5C]">
                          v{p.version}
                        </td>
                        <td className="py-3 px-3 text-[#6B7280]">
                          {p.effectiveDate}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#4B5563] border border-[#E5E7EB]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {p.requiresReAcceptance ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F2D5C] bg-[#F5F7FA] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                              <Lock className="h-2.5 w-2.5" />
                              Mandatory Gated
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F7FA] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                              Informational
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1 bg-[#E5E7EB] hover:bg-[#F5F7FA] hover:text-[#0F2D5C] border border-[#E5E7EB] rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Update Version</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === "ANALYTICS" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Consent Distribution Analytics</h3>
                <p className="text-xs text-[#6B7280]">
                  Aggregated acceptance metrics across platform policies and business workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Acceptances by Document */}
                <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-3">
                  <h4 className="text-xs font-bold text-[#111827] flex items-center justify-between">
                    <span>Acceptances by Document</span>
                    <span className="text-[10px] font-normal text-[#6B7280]">Total volume</span>
                  </h4>

                  <div className="space-y-2.5">
                    {policies.map((p) => {
                      const count = stats?.acceptancesByDocument?.[p.documentId] || 0;
                      const total = stats?.totalAcceptances || 1;
                      const pct = Math.round((count / total) * 100);

                      return (
                        <div key={p.documentId} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-[#4B5563]">
                            <span className="truncate pr-2">{p.documentName}</span>
                            <span className="font-bold text-[#111827] shrink-0">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#0F2D5C] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Acceptances by Workflow */}
                <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-3">
                  <h4 className="text-xs font-bold text-[#111827] flex items-center justify-between">
                    <span>Acceptances by Workflow Trigger</span>
                    <span className="text-[10px] font-normal text-[#6B7280]">Contextual origin</span>
                  </h4>

                  <div className="space-y-3">
                    {Object.entries(stats?.acceptancesByWorkflow || {
                      NEW_USER_REGISTRATION: 0,
                      WALLET_FIRST_FUNDING: 0,
                      IDENTITY_NIN_LOOKUP: 0,
                      IDENTITY_BVN_LOOKUP: 0,
                      POLICY_UPDATE_GATE: 0
                    }).map(([wf, count]) => {
                      const total = stats?.totalAcceptances || 1;
                      const pct = Math.round(((count as number) / total) * 100);

                      return (
                        <div key={wf} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-[#4B5563]">
                            <span>{wf.replace(/_/g, " ")}</span>
                            <span className="font-bold text-[#111827]">{count as number} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#0F2D5C] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, (count as number) > 0 ? 3 : 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === "AUDIT_LOGS" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <span>Immutable Consent Audit Logs</span>
                    <span className="text-[10px] font-semibold text-[#0F2D5C] bg-[#F5F7FA] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                      Write-Only Immutable
                    </span>
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Tamper-proof records protected under advanced database security rules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportAuditLogsCsv}
                  className="px-3 py-1.5 bg-[#111827] hover:bg-[#111827] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search email, UID, or doc..."
                    className="w-full pl-8 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#0F2D5C] bg-[#F5F7FA]"
                  />
                </div>

                <div>
                  <select
                    value={selectedWorkflowFilter}
                    onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#0F2D5C] bg-[#F5F7FA] cursor-pointer"
                  >
                    <option value="ALL">All Workflows</option>
                    <option value="NEW_USER_REGISTRATION">Registration</option>
                    <option value="WALLET_FIRST_FUNDING">Wallet Funding</option>
                    <option value="IDENTITY_NIN_LOOKUP">NIN Verification</option>
                    <option value="IDENTITY_BVN_LOOKUP">BVN Verification</option>
                    <option value="POLICY_UPDATE_GATE">Policy Re-acceptance</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedDocFilter}
                    onChange={(e) => setSelectedDocFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#0F2D5C] bg-[#F5F7FA] cursor-pointer"
                  >
                    <option value="ALL">All Documents</option>
                    {policies.map((p) => (
                      <option key={p.documentId} value={p.documentId}>
                        {p.documentName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Log Table */}
              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#4B5563] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">User Email / ID</th>
                      <th className="py-2.5 px-3">Document</th>
                      <th className="py-2.5 px-2">Version</th>
                      <th className="py-2.5 px-3">Workflow</th>
                      <th className="py-2.5 px-3">Origin IP / Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#6B7280] text-[#4B5563]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#9CA3AF] text-xs">
                          No audit log entries matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F5F7FA]/60 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-[#6B7280] whitespace-nowrap">
                            {new Date(log.acceptedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </td>
                          <td className="py-2 px-3 font-medium text-[#111827]">
                            {log.userEmail || log.userId}
                          </td>
                          <td className="py-2 px-3 text-[#111827]">
                            {log.documentTitle || log.documentId}
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] font-bold text-[#0F2D5C]">
                            v{log.documentVersion}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-[#4B5563]">
                            <span className="px-2 py-0.5 bg-[#E5E7EB] rounded border border-[#E5E7EB]">
                              {log.workflow}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[10px] font-mono text-[#9CA3AF] truncate max-w-[140px]" title={log.userAgent}>
                            {log.ipAddress || "Web Client"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DPO */}
          {activeTab === "DPO" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F7FA]/80 border border-[#E5E7EB] rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-[#0F2D5C] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0F2D5C]" />
                  <span>Nigeria Data Protection Commission (NDPC) Compliance Governance</span>
                </h3>
                <p className="text-xs text-[#0F2D5C] leading-relaxed">
                  SmartLink NG operates in full adherence to the Nigeria Data Protection Act (NDPA 2023). Below are designated organizational compliance contacts and response SLAs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-2">
                  <h4 className="font-bold text-[#111827]">Designated Data Protection Officer (DPO)</h4>
                  <div className="text-[#4B5563] space-y-1 text-[11px]">
                    <div><strong>Enterprise:</strong> Smart Link Computer Business (operating as SmartLink NG / Smart Link Nigeria)</div>
                    <div><strong>Registration:</strong> CAC RC 9347502</div>
                    <div><strong>DPO Email:</strong> Smartlinkcomputerbusiness@gmail.com</div>
                    <div><strong>Telephone:</strong> +234 808 549 0982</div>
                    <div><strong>WhatsApp:</strong> +234 904 773 8212</div>
                  </div>
                </div>

                <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-2">
                  <h4 className="font-bold text-[#111827]">Statutory Compliance Timelines</h4>
                  <div className="text-[#4B5563] space-y-1 text-[11px]">
                    <div><strong>Data Access Requests:</strong> Within 14 working days</div>
                    <div><strong>Rectification / Erasure:</strong> Within 14 working days</div>
                    <div><strong>Financial Audit Ledger Retention:</strong> 6 years (CBN standard)</div>
                    <div><strong>Breach Notification to NDPC:</strong> Within 72 hours</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Policy Edit Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#111827]">
                Update Policy Version
              </h3>
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="text-[#9CA3AF] hover:text-[#4B5563]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-[#4B5563]">
              Editing: <strong className="text-[#111827]">{editingPolicy.documentName}</strong>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#4B5563]">New Version Number</label>
                <input
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  placeholder="e.g. 2.4.0"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#0F2D5C] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#4B5563]">Effective Date</label>
                <input
                  type="text"
                  value={editEffectiveDate}
                  onChange={(e) => setEditEffectiveDate(e.target.value)}
                  placeholder="e.g. January 15, 2024"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#0F2D5C]"
                />
              </div>

              <div className="pt-2 border-t border-[#E5E7EB]">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editRequiresReAcceptance}
                    onChange={(e) => setEditRequiresReAcceptance(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#0F2D5C] rounded border-[#E5E7EB]"
                  />
                  <div>
                    <div className="font-semibold text-[#111827]">
                      Enforce Mandatory User Re-acceptance
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-tight">
                      When enabled, users with older versions will see a mandatory agreement prompt upon next login.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#E5E7EB] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={handleSavePolicyEdit}
                className="px-4 py-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {editSaving ? "Saving..." : "Save Policy Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
