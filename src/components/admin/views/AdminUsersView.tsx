/**
 * SmartLink Admin Panel — Module 3 User Management System Main View
 * Provides complete data table, search, multi-filter, pagination, sorting,
 * profile drawers, action modals, wallet adjustments, bulk actions, and export engine.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useModalBackHandler } from "../../../services/navigationManager";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Filter,
  Sliders,
  Download,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit,
  Shield,
  Wallet,
  Bell,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  MoreVertical,
  Key,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  FileSpreadsheet,
  FileText,
  PlayCircle
} from "lucide-react";
import { UserProfile, UserRole } from "../../../types";
import { AdminSession } from "../../../services/adminAuthTypes";
import { UserProfileDrawer } from "../users/UserProfileDrawer";
import {
  EditProfileModal,
  StatusChangeModal,
  WalletAdjustmentModal,
  SendNotificationModal,
  BulkActionModal
} from "../users/UserActionModals";
import { UserExportModal } from "../users/UserExportModal";

interface AdminUsersViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminUsersView({ session, onNavigate }: AdminUsersViewProps) {
  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [verificationFilter, setVerificationFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [minBalance, setMinBalance] = useState<string>("");
  const [maxBalance, setMaxBalance] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = useState<keyof UserProfile | "walletBalance" | "createdAt" | "fullName" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Multi-Selection for Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals & Drawers State
  const [activeDrawerUserId, setActiveDrawerUserId] = useState<string | null>(null);
  useModalBackHandler(!!activeDrawerUserId, "admin-user-drawer", () => setActiveDrawerUserId(null));
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  useModalBackHandler(!!editingUser, "admin-edit-user-modal", () => setEditingUser(null));
  const [statusModalUser, setStatusModalUser] = useState<UserProfile | null>(null);
  useModalBackHandler(!!statusModalUser, "admin-user-status-modal", () => setStatusModalUser(null));
  const [targetStatus, setTargetStatus] = useState<"ACTIVE" | "SUSPENDED" | "DISABLED" | "LOCKED" | "DELETED">("SUSPENDED");
  const [walletModalUser, setWalletModalUser] = useState<UserProfile | null>(null);
  useModalBackHandler(!!walletModalUser, "admin-user-wallet-modal", () => setWalletModalUser(null));
  const [notifyModalUser, setNotifyModalUser] = useState<UserProfile | null>(null);
  useModalBackHandler(!!notifyModalUser, "admin-user-notify-modal", () => setNotifyModalUser(null));
  const [bulkActionType, setBulkActionType] = useState<"ACTIVATE" | "SUSPEND" | "BROADCAST" | "DELETE" | null>(null);
  useModalBackHandler(!!bulkActionType, "admin-user-bulk-modal", () => setBulkActionType(null));
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  useModalBackHandler(isExportModalOpen, "admin-user-export-modal", () => setIsExportModalOpen(false));
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Toast Feedback
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          "x-admin-token": session.sessionToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to load user directory.");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session.sessionToken]);

  // Combined Filter & Search Computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.fullName?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesPhone = u.phoneNumber?.toLowerCase().includes(q);
        const matchesUid = u.uid?.toLowerCase().includes(q);
        const matchesUsername = ((u as any).username || "").toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesUid && !matchesUsername) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== "ALL") {
        const accStatus = u.status || "ACTIVE";
        if (accStatus !== statusFilter) return false;
      }

      // Verification Filter
      if (verificationFilter !== "ALL") {
        const isVerif = (u as any).verificationStatus || (u.isVerified ? "VERIFIED" : "UNVERIFIED");
        if (isVerif !== verificationFilter) return false;
      }

      // Role Filter
      if (roleFilter !== "ALL") {
        if (u.role !== roleFilter) return false;
      }

      // Min Balance
      if (minBalance !== "") {
        const minB = parseFloat(minBalance);
        if (!isNaN(minB) && (u.walletBalance || 0) < minB) return false;
      }

      // Max Balance
      if (maxBalance !== "") {
        const maxB = parseFloat(maxBalance);
        if (!isNaN(maxB) && (u.walletBalance || 0) > maxB) return false;
      }

      // Date Range Filter
      if (dateRange !== "ALL" && u.createdAt) {
        const regTime = new Date(u.createdAt).getTime();
        const now = Date.now();
        if (dateRange === "24H" && now - regTime > 86400000) return false;
        if (dateRange === "7D" && now - regTime > 86400000 * 7) return false;
        if (dateRange === "30D" && now - regTime > 86400000 * 30) return false;
      }

      return true;
    });
  }, [users, searchQuery, statusFilter, verificationFilter, roleFilter, minBalance, maxBalance, dateRange]);

  // Sorting Computation
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: any = a[sortField as keyof UserProfile] ?? "";
      let valB: any = b[sortField as keyof UserProfile] ?? "";

      if (sortField === "walletBalance") {
        valA = a.walletBalance || 0;
        valB = b.walletBalance || 0;
      } else if (sortField === "createdAt") {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  // Pagination Computation
  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  // Master Checkbox Toggle
  const handleSelectAllOnPage = () => {
    const pageUserIds = paginatedUsers.map((u) => u.uid);
    const allSelected = pageUserIds.every((id) => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds(selectedUserIds.filter((id) => !pageUserIds.includes(id)));
    } else {
      setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...pageUserIds])));
    }
  };

  const handleToggleSelectUser = (uid: string) => {
    if (selectedUserIds.includes(uid)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== uid));
    } else {
      setSelectedUserIds([...selectedUserIds, uid]);
    }
  };

  // Quick Password Reset Handler
  const handleResetPassword = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to trigger a password reset link for ${user.fullName} (${user.email})?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Password reset trigger failed.");
      showToast("success", `Password reset instructions sent to ${user.email}.`);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Metric Stats
  const activeCount = users.filter((u) => (u.status || "ACTIVE") === "ACTIVE").length;
  const suspendedCount = users.filter((u) => (u.status || "ACTIVE") === "SUSPENDED" || (u.status as string) === "DISABLED").length;
  const totalBalanceSum = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
  const verifiedCount = users.filter((u) => (u as any).verificationStatus === "VERIFIED" || u.isVerified).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold text-white ${
              toast.type === "success" ? "bg-emerald-700 border-emerald-500 text-white" : "bg-red-700 border-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : <AlertTriangle className="h-5 w-5 text-red-200" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-blue-400">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">User Governance Engine</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-800/80">MODULE 3 ACTIVE</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white">SmartLink Users Directory</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage user profiles, account statuses, wallet floats, KYC verifications, and audit controls.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4 text-blue-400" /> Export Data ({filteredUsers.length})
            </button>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={refreshing}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-400" : "text-slate-300"}`} />
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Directory Users</p>
            <p className="text-xl font-extrabold text-white mt-1">{users.length} Accounts</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active User Accounts</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">{activeCount} Active</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Suspended / Disabled</p>
            <p className="text-xl font-extrabold text-rose-400 mt-1">{suspendedCount} Suspended</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Combined Wallet Float</p>
            <p className="text-xl font-extrabold text-blue-400 mt-1 font-mono">
              ₦{totalBalanceSum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Search & Multi-Filters Toolbar */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Name, Username, Email, Phone, or User ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Account Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active Users</option>
                <option value="SUSPENDED">Suspended Users</option>
                <option value="DISABLED">Disabled Users</option>
                <option value="LOCKED">Locked Users</option>
                <option value="DELETED">Soft Deleted Users</option>
              </select>

              {/* Verification Status */}
              <select
                value={verificationFilter}
                onChange={(e) => {
                  setVerificationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Verification: All</option>
                <option value="VERIFIED">Verified (NIN/BVN)</option>
                <option value="UNVERIFIED">Unverified Users</option>
                <option value="PENDING">Pending Review</option>
              </select>

              {/* User Role */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Role: All Roles</option>
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.AGENT_VENDOR}>Agent Vendor</option>
                <option value={UserRole.STAFF}>Staff</option>
                <option value={UserRole.SUB_ADMIN}>Sub Admin</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Reg Date: All Time</option>
                <option value="24H">Last 24 Hours</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Controls Bar (Visible when users selected) */}
          {selectedUserIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200 flex-wrap gap-2"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{selectedUserIds.length} users selected for bulk action</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkActionType("ACTIVATE")}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Bulk Activate
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType("SUSPEND")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Bulk Suspend
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType("BROADCAST")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Broadcast Alert
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedUsers.length > 0 &&
                        paginatedUsers.every((u) => selectedUserIds.includes(u.uid))
                      }
                      onChange={handleSelectAllOnPage}
                      className="rounded-xs border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField("fullName"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    <div className="flex items-center gap-1.5">
                      User Identity
                      <ArrowUpDown className="h-3 w-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Role & KYC</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField("walletBalance"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    <div className="flex items-center gap-1.5">
                      Wallet Float
                      <ArrowUpDown className="h-3 w-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField("status"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown className="h-3 w-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField("createdAt"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                    <div className="flex items-center gap-1.5">
                      Reg Date
                      <ArrowUpDown className="h-3 w-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
                      Loading User Registry...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                      No user accounts match the selected filters or search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.uid);
                    const isVerif = (u as any).verificationStatus === "VERIFIED" || u.isVerified;

                    return (
                      <tr
                        key={u.uid}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected ? "bg-blue-950/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(u.uid)}
                            className="rounded-xs border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-950/70 border border-blue-800/80 flex items-center justify-center text-blue-300 font-bold shrink-0 text-xs">
                              {u.fullName ? u.fullName.substring(0, 2).toUpperCase() : "US"}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveDrawerUserId(u.uid)}
                                className="font-bold text-white hover:text-blue-400 text-left transition-colors cursor-pointer"
                              >
                                {u.fullName}
                              </button>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {(u as any).username || "@" + (u.fullName || "user").toLowerCase().replace(/\s+/g, "")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="p-4 font-mono text-[11px]">
                          <p className="text-slate-200 font-medium">{u.email}</p>
                          <p className="text-slate-400">{u.phoneNumber || "+2348000000000"}</p>
                        </td>

                        {/* Role & KYC */}
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            {u.role}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Tier {(u as any).kycLevel || 1}</p>
                        </td>

                        {/* Wallet Balance */}
                        <td className="p-4 font-mono font-bold text-white text-sm">
                          ₦{(Number(u.walletBalance) || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Verification */}
                        <td className="p-4">
                          {isVerif ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              UNVERIFIED
                            </span>
                          )}
                        </td>

                        {/* Account Status */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              (u.status || "ACTIVE") === "ACTIVE"
                                ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
                                : (u.status || "ACTIVE") === "SUSPENDED"
                                ? "bg-amber-950/70 text-amber-300 border-amber-800"
                                : "bg-rose-950/70 text-rose-300 border-rose-800"
                            }`}
                          >
                            {u.status || "ACTIVE"}
                          </span>
                        </td>

                        {/* Reg Date */}
                        <td className="p-4 text-[11px] text-slate-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "short" }) : "N/A"}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveDrawerUserId(u.uid)}
                              title="View User Details"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              title="Edit User Profile"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setWalletModalUser(u)}
                              title="Adjust Wallet Float"
                              className="p-1.5 bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetPassword(u)}
                              title="Reset User Password"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </button>

                            {u.status === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() => { setStatusModalUser(u); setTargetStatus("SUSPENDED"); }}
                                title="Suspend Account"
                                className="p-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg cursor-pointer transition-colors"
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setStatusModalUser(u); setTargetStatus("ACTIVE"); }}
                                title="Activate Account"
                                className="p-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg cursor-pointer transition-colors"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="pl-2 border-l border-slate-700">
                Showing <strong className="text-white">{sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{" "}
                <strong className="text-white">{Math.min(currentPage * pageSize, sortedUsers.length)}</strong> of{" "}
                <strong className="text-white">{sortedUsers.length}</strong> users
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-bold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Side Drawer */}
      <UserProfileDrawer
        isOpen={!!activeDrawerUserId}
        onClose={() => setActiveDrawerUserId(null)}
        userId={activeDrawerUserId}
        session={session}
        onOpenEdit={(u) => { setEditingUser(u); setActiveDrawerUserId(null); }}
        onOpenStatus={(u, st) => { setStatusModalUser(u); setTargetStatus(st); setActiveDrawerUserId(null); }}
        onOpenWallet={(u) => { setWalletModalUser(u); setActiveDrawerUserId(null); }}
        onOpenNotify={(u) => { setNotifyModalUser(u); setActiveDrawerUserId(null); }}
      />

      {/* Action Modals */}
      <EditProfileModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        session={session}
        onSuccess={() => { showToast("success", "User profile updated successfully."); fetchUsers(); }}
        user={editingUser}
      />

      <StatusChangeModal
        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        session={session}
        onSuccess={() => { showToast("success", "User status updated and logged to audit ledger."); fetchUsers(); }}
        user={statusModalUser}
        targetStatus={targetStatus}
      />

      <WalletAdjustmentModal
        isOpen={!!walletModalUser}
        onClose={() => setWalletModalUser(null)}
        session={session}
        onSuccess={() => { showToast("success", "Wallet ledger adjustment executed successfully."); fetchUsers(); }}
        user={walletModalUser}
      />

      <SendNotificationModal
        isOpen={!!notifyModalUser}
        onClose={() => setNotifyModalUser(null)}
        session={session}
        onSuccess={() => showToast("success", "Direct user notification dispatched.")}
        user={notifyModalUser}
      />

      <BulkActionModal
        isOpen={!!bulkActionType}
        onClose={() => setBulkActionType(null)}
        session={session}
        onSuccess={() => { showToast("success", `Bulk ${bulkActionType} executed on ${selectedUserIds.length} users.`); setSelectedUserIds([]); fetchUsers(); }}
        selectedUserIds={selectedUserIds}
        actionType={bulkActionType || "ACTIVATE"}
      />

      <UserExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        usersToExport={filteredUsers}
        activeFilterSummary={`Status: ${statusFilter} | Verification: ${verificationFilter} | Role: ${roleFilter}`}
      />
    </div>
  );
}
