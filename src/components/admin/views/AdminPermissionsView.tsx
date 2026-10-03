/**
 * SmartLink Admin Panel — Permission Matrix & Sub-Admin Management Component
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Save,
  RefreshCw,
  Search,
  Lock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Users,
  KeyRound,
  Sliders,
  X
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { SubAdminPermission, UserRole } from "../../../types";
import { getAuthHeaders } from "../../../services/providerService";

interface SubAdminUser {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  status?: string;
  permissions?: string[];
  createdAt?: string;
}

interface AdminPermissionsViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

const ALL_PERMISSIONS: { id: SubAdminPermission; label: string; desc: string }[] = [
  { id: SubAdminPermission.MANAGE_USERS, label: "Users & KYC", desc: "View and manage user accounts, status & KYC" },
  { id: SubAdminPermission.MANAGE_TRANSACTIONS, label: "Transactions", desc: "View, approve & refund user wallet transactions" },
  { id: SubAdminPermission.MANAGE_SERVICES, label: "VTU Services", desc: "Manage VTU data, airtime, power & cable services" },
  { id: SubAdminPermission.MANAGE_PRICES, label: "Provider APIs", desc: "Configure portal providers & API credentials" },
  { id: SubAdminPermission.MANAGE_THEME, label: "System Settings", desc: "Configure system maintenance & site branding" },
  { id: SubAdminPermission.MANAGE_CAC, label: "CAC Verification", desc: "Process identity and CAC business verification" },
  { id: SubAdminPermission.MANAGE_SUBADMINS, label: "Sub-Admins", desc: "Create sub-admins & assign system permissions" },
];

export default function AdminPermissionsView({ session, onNavigate }: AdminPermissionsViewProps) {
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingTarget, setSavingTarget] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Sub-Admin Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([
    SubAdminPermission.MANAGE_USERS,
    SubAdminPermission.MANAGE_TRANSACTIONS
  ]);
  const [creating, setCreating] = useState(false);

  // Track unsaved local permission changes per user ID
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders(session?.uid, session?.sessionToken);
      const res = await fetch("/api/admin/subadmins", { headers });
      if (!res.ok) throw new Error("Failed to fetch sub-admins");
      const data = await res.json();
      const list: SubAdminUser[] = data.subAdmins || [];
      setSubAdmins(list);

      // Initialize local matrix state from fetched data
      const initialMatrix: Record<string, string[]>= {};
      list.forEach((sa) => {
        initialMatrix[sa.uid] = sa.permissions || [];
      });
      setMatrixState(initialMatrix);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load sub-admin directory." });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (uid: string, perm: string) => {
    setMatrixState((prev) => {
      const current = prev[uid] || [];
      const updated = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm];
      return { ...prev, [uid]: updated };
    });
  };

  const handleSaveSingleUser = async (targetUid: string) => {
    setSavingTarget(targetUid);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders(session?.uid, session?.sessionToken);
      const targetPerms = matrixState[targetUid] || [];
      const res = await fetch("/api/admin/subadmins/update-permissions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: session.uid,
          targetUid,
          permissions: targetPerms
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update permissions");
      }
      setStatusMessage({ type: "success", text: `Successfully updated permissions for ${data.subAdmin?.fullName || "sub-admin"}.` });
      fetchSubAdmins();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update permissions." });
    } finally {
      setSavingTarget(null);
    }
  };

  const handleBatchSaveMatrix = async () => {
    setBatchSaving(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders(session?.uid, session?.sessionToken);
      const updates = Object.entries(matrixState).map(([targetUid, permissions]) => ({
        targetUid,
        permissions
      }));

      const res = await fetch("/api/admin/subadmins/batch-update-permissions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: session.uid,
          updates
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to batch update permissions");
      }
      setStatusMessage({ type: "success", text: `Successfully updated permission matrix for all ${updates.length} sub-admins.` });
      fetchSubAdmins();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to batch save permissions." });
    } finally {
      setBatchSaving(false);
    }
  };

  const handleRevokeSubAdmin = async (targetUid: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke sub-admin access for ${name}?`)) return;
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders(session?.uid, session?.sessionToken);
      const res = await fetch("/api/admin/subadmins/revoke", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: session.uid,
          targetUid
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to revoke access");
      }
      setStatusMessage({ type: "success", text: `Revoked sub-admin permissions for ${name}.` });
      fetchSubAdmins();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to revoke access." });
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      setStatusMessage({ type: "error", text: "Full Name, Email, and Password are required." });
      return;
    }

    setCreating(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders(session?.uid, session?.sessionToken);
      const res = await fetch("/api/admin/subadmins/create", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: session.uid,
          fullName: newFullName,
          email: newEmail,
          password: newPassword,
          phoneNumber: newPhone,
          permissions: newPermissions
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create sub-admin");
      }

      setStatusMessage({ type: "success", text: `Created sub-admin account for ${newFullName} (${newEmail}).` });
      setShowCreateModal(false);
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setNewPermissions([SubAdminPermission.MANAGE_USERS, SubAdminPermission.MANAGE_TRANSACTIONS]);
      fetchSubAdmins();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to create sub-admin account." });
    } finally {
      setCreating(false);
    }
  };

  const filteredSubAdmins = subAdmins.filter((sa) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      sa.fullName.toLowerCase().includes(query) ||
      sa.email.toLowerCase().includes(query) ||
      sa.uid.toLowerCase().includes(query);

    if (permissionFilter === "ALL") return matchesSearch;
    const currentPerms = matrixState[sa.uid] || [];
    return matchesSearch && currentPerms.includes(permissionFilter);
  });

  return (
    <div className="space-y-6 text-[#111827]">
      {/* Top Banner / Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl text-[#0F2D5C]">
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Role-Based Access Control (RBAC)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ENFORCED
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
                Sub-Admin Permission Matrix
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Configure module access, assign granular privileges, and enforce operational governance across administrative team members.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Add New Sub-Admin
            </button>

            <button
              type="button"
              onClick={handleBatchSaveMatrix}
              disabled={batchSaving || loading}
              className="py-2.5 px-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Save className={`h-4 w-4 ${batchSaving ? "animate-spin" : ""}`} /> Save Matrix Changes
            </button>

            <button
              type="button"
              onClick={fetchSubAdmins}
              disabled={loading}
              className="py-2.5 px-3 bg-[#F8FAFC] hover:bg-[#F0F5FA] text-[#0F2D5C] border border-[#E5E7EB] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F2D5C]" : ""}`} />
            </button>
          </div>
        </div>

        {/* System Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
            <p className="text-[10px] text-[#6B7280] uppercase font-bold">Total Sub-Admins</p>
            <p className="text-xl font-extrabold text-[#111827] font-mono mt-1">{subAdmins.length} Accounts</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
            <p className="text-[10px] text-[#6B7280] uppercase font-bold">Active Sessions</p>
            <p className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
              {subAdmins.filter((s) => s.status !== "INACTIVE" && s.status !== "BLOCKED").length} Active
            </p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
            <p className="text-[10px] text-[#6B7280] uppercase font-bold">Module Scope</p>
            <p className="text-xl font-extrabold text-[#0F2D5C] font-mono mt-1">8 Permissions</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
            <p className="text-[10px] text-[#6B7280] uppercase font-bold">Governance Status</p>
            <p className="text-xl font-extrabold text-[#111827] font-mono mt-1">AES-256 RBAC</p>
          </div>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Sub-Admin Name, Email, or User ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] text-xs font-medium focus:outline-hidden focus:border-[#0F2D5C] placeholder:text-[#9CA3AF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280] font-medium">Filter Privilege:</span>
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] font-medium focus:outline-hidden focus:border-[#0F2D5C] cursor-pointer"
            >
              <option value="ALL">All Permissions</option>
              {ALL_PERMISSIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  Has {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs text-left">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0F2D5C]" />
            <h2 className="text-sm font-bold text-[#111827]">Active Sub-Admin Matrix</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white border border-[#E5E7EB] text-[#0F2D5C] font-bold">
              {filteredSubAdmins.length} Personnel
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="p-4 min-w-[200px]">Sub-Admin Account</th>
                <th className="p-4 text-center">Role</th>
                {ALL_PERMISSIONS.map((perm) => (
                  <th key={perm.id} className="p-3 text-center min-w-[100px]" title={perm.desc}>
                    <div className="flex flex-col items-center">
                      <span>{perm.label}</span>
                      <span className="text-[8px] font-mono lowercase text-[#9CA3AF] font-normal mt-0.5">
                        {perm.id}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-4 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={ALL_PERMISSIONS.length + 3} className="p-8 text-center text-[#6B7280]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0F2D5C]" />
                    <span>Loading Sub-Admin Directory...</span>
                  </td>
                </tr>
              ) : filteredSubAdmins.length === 0 ? (
                <tr>
                  <td colSpan={ALL_PERMISSIONS.length + 3} className="p-8 text-center text-[#6B7280]">
                    No sub-admins found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubAdmins.map((sa) => {
                  const currentPerms = matrixState[sa.uid] || [];
                  const isSuperAdmin = sa.role === UserRole.SUPER_ADMIN;

                  return (
                    <tr
                      key={sa.uid}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      {/* Sub-Admin Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] font-bold shrink-0 text-xs">
                            {sa.fullName ? sa.fullName.substring(0, 2).toUpperCase() : "SA"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#111827] truncate">{sa.fullName}</p>
                            <p className="text-[11px] text-[#6B7280] truncate">{sa.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isSuperAdmin
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]"
                          }`}
                        >
                          {sa.role}
                        </span>
                      </td>

                      {/* Permission Matrix Toggles */}
                      {ALL_PERMISSIONS.map((perm) => {
                        const hasPerm = isSuperAdmin || currentPerms.includes(perm.id);

                        return (
                          <td key={perm.id} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              disabled={isSuperAdmin}
                              onChange={() => togglePermission(sa.uid, perm.id)}
                              className="h-4 w-4 rounded-xs border-[#E5E7EB] text-[#0F2D5C] focus:ring-0 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        );
                      })}

                      {/* Row Action Buttons */}
                      <td className="p-4 text-right">
                        {!isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleUser(sa.uid)}
                              disabled={savingTarget === sa.uid}
                              className="p-1.5 border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F0F5FA] text-[#0F2D5C] rounded-lg cursor-pointer transition-colors shadow-xs"
                              title="Save permissions for this sub-admin"
                            >
                              <Save className={`h-3.5 w-3.5 ${savingTarget === sa.uid ? "animate-spin" : ""}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRevokeSubAdmin(sa.uid, sa.fullName)}
                              className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                              title="Revoke sub-admin account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Sub-Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#111827]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-[#111827] text-left">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[#0F2D5C]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Provision Sub-Admin Account</h3>
                  <p className="text-xs text-[#6B7280]">Create login credentials and set initial privileges</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[#6B7280] hover:text-[#111827] cursor-pointer rounded-lg hover:bg-[#F5F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#111827] font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Ibrahim Abubakar"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#111827] focus:outline-hidden focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin.sub@smartlink.ng"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#111827] focus:outline-hidden focus:border-[#0F2D5C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#111827] font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#111827] focus:outline-hidden focus:border-[#0F2D5C]"
                  />
                </div>

                <div>
                  <label className="block text-[#111827] font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#111827] focus:outline-hidden focus:border-[#0F2D5C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#111827] font-bold mb-2">Assign Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB] max-h-40 overflow-y-auto">
                  {ALL_PERMISSIONS.map((p) => {
                    const isChecked = newPermissions.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewPermissions(newPermissions.filter((item) => item !== p.id));
                            } else {
                              setNewPermissions([...newPermissions, p.id]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded-xs bg-white border-[#E5E7EB] text-[#0F2D5C] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[#111827] font-medium">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-bold text-[#6B7280] hover:text-[#111827] rounded-xl cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <UserPlus className="h-4 w-4" />
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
