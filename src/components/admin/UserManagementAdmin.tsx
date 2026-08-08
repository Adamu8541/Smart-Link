/**
 * SmartLink User Management & RBAC Admin Portal
 * Full user directory, status controls, role assignment, custom claims management,
 * password reset triggers, and login security audit ledger.
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Key,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  FileText,
  Lock,
  Unlock,
  Award
} from "lucide-react";
import { UserProfile, UserRole, LoginHistoryRecord, FirebaseCustomClaims } from "../../types";

interface UserManagementAdminProps {
  adminUid: string;
  currentUserRole: UserRole;
  isDarkMode?: boolean;
}

export default function UserManagementAdmin({
  adminUid,
  currentUserRole,
  isDarkMode = false
}: UserManagementAdminProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userLogs, setUserLogs] = useState<LoginHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [editingRoleUser, setEditingRoleUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [customClaims, setCustomClaims] = useState<FirebaseCustomClaims>({});
  
  const [viewHistoryUser, setViewHistoryUser] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const isSuperAdmin = currentUserRole === UserRole.SUPER_ADMIN;

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/users?adminUid=${adminUid}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      showFeedback("error", "Error connecting to user management backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [adminUid]);

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid, status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user status");

      showFeedback("success", `User ${user.fullName} is now ${nextStatus}.`);
      fetchUsers();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const handleOpenRoleModal = (user: UserProfile) => {
    setEditingRoleUser(user);
    setNewRole(user.role || UserRole.CUSTOMER);
    setCustomClaims({
      superAdmin: user.role === UserRole.SUPER_ADMIN,
      admin: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN,
      staff: user.role === UserRole.STAFF,
      support: user.role === UserRole.SUPPORT_AGENT,
      finance: user.role === UserRole.FINANCE_OFFICER,
    });
  };

  const handleSaveRoleAndClaims = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleUser) return;

    // Protection check: Only super admin can grant ADMIN or SUPER_ADMIN
    if ((newRole === UserRole.ADMIN || newRole === UserRole.SUPER_ADMIN) && !isSuperAdmin) {
      showFeedback("error", "Only Super Administrators can assign Admin or Super Admin roles.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${editingRoleUser.uid}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid,
          role: newRole,
          customClaims
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      showFeedback("success", `Updated role for ${editingRoleUser.fullName} to ${newRole}`);
      setEditingRoleUser(null);
      fetchUsers();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const handleTriggerPasswordReset = async (user: UserProfile) => {
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid, email: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send password reset email");

      showFeedback("success", `Password reset instructions sent to ${user.email}`);
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const handleFetchUserHistory = async (user: UserProfile) => {
    setViewHistoryUser(user);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/login-history?adminUid=${adminUid}`);
      if (res.ok) {
        const data = await res.json();
        setUserLogs(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch login history:", err);
    }
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchQuery));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || (u.status || "ACTIVE") === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-white transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-mono">
                RBAC ACCESS CONTROL
              </span>
              <span className="text-xs text-slate-400 font-mono">FIREBASE CUSTOM CLAIMS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-400" />
              User & Access Management
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Control user accounts, assign Firebase Custom Claims, enforce account status (Active / Suspended), send password resets, and review security login history.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Directory
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Users</div>
            <div className="text-xl font-black text-white mt-0.5">{users.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Active Accounts</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {users.filter((u) => u.status !== "SUSPENDED").length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-bold text-amber-300 uppercase">Admins & Staff</div>
            <div className="text-xl font-black text-amber-200 mt-0.5">
              {users.filter((u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN || u.role === UserRole.STAFF).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-bold text-rose-300 uppercase">Suspended</div>
            <div className="text-xl font-black text-rose-300 mt-0.5">
              {users.filter((u) => u.status === "SUSPENDED").length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.CUSTOMER}>Customer</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            <option value={UserRole.STAFF}>Staff</option>
            <option value={UserRole.SUPPORT_AGENT}>Support Agent</option>
            <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
            <option value={UserRole.AGENT_VENDOR}>Agent Vendor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role & Claims</th>
                <th className="p-3">Wallet Balance</th>
                <th className="p-3">Email Verified</th>
                <th className="p-3">Account Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    No users found matching your search parameters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase font-mono ${
                          u.role === UserRole.SUPER_ADMIN
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                            : u.role === UserRole.ADMIN
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                            : u.role === UserRole.FINANCE_OFFICER
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {u.role || "CUSTOMER"}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white font-mono">
                      ₦{(u.walletBalance || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.status === "SUSPENDED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <UserX className="h-3 w-3" />
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <UserCheck className="h-3 w-3" />
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleFetchUserHistory(u)}
                          title="View Login History"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTriggerPasswordReset(u)}
                          title="Trigger Password Reset Email"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-all cursor-pointer"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          title="Modify Role & Claims"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "SUSPENDED" ? "Activate User" : "Suspend User"}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            u.status === "SUSPENDED"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {u.status === "SUSPENDED" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT ROLE & CUSTOM CLAIMS */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                Edit Access Rights for {editingRoleUser.fullName}
              </h3>
              <button
                onClick={() => setEditingRoleUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoleAndClaims} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Assigned User Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value={UserRole.CUSTOMER}>Customer (Standard User)</option>
                  <option value={UserRole.STAFF}>Staff Member</option>
                  <option value={UserRole.SUPPORT_AGENT}>Support Agent</option>
                  <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={UserRole.AGENT_VENDOR}>Agent Vendor</option>
                  <option value={UserRole.ADMIN} disabled={!isSuperAdmin}>
                    Admin {!isSuperAdmin ? "(Super Admin Only)" : ""}
                  </option>
                  <option value={UserRole.SUPER_ADMIN} disabled={!isSuperAdmin}>
                    Super Admin {!isSuperAdmin ? "(Super Admin Only)" : ""}
                  </option>
                </select>
              </div>

              {/* Firebase Custom Claims checkboxes */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-indigo-500" />
                  Firebase Custom Claims Assignment
                </h4>
                
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(customClaims.superAdmin)}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setCustomClaims({ ...customClaims, superAdmin: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>superAdmin = true</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(customClaims.admin)}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setCustomClaims({ ...customClaims, admin: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>admin = true</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(customClaims.staff)}
                    onChange={(e) => setCustomClaims({ ...customClaims, staff: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>staff = true</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(customClaims.support)}
                    onChange={(e) => setCustomClaims({ ...customClaims, support: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>support = true</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(customClaims.finance)}
                    onChange={(e) => setCustomClaims({ ...customClaims, finance: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>finance = true</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRoleUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Save Access Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW LOGIN HISTORY */}
      {viewHistoryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  Security Login Audit Trail
                </h3>
                <p className="text-xs text-slate-500">History for {viewHistoryUser.fullName} ({viewHistoryUser.email})</p>
              </div>
              <button
                onClick={() => setViewHistoryUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
              {userLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-sans">
                  No login history sessions recorded for this user yet.
                </div>
              ) : (
                userLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{log.loginTime}</span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        IP: {log.ipAddress} • {log.browser} on {log.os} ({log.deviceType})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                onClick={() => setViewHistoryUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
