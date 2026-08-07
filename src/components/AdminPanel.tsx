/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Settings,
  DollarSign,
  Palette,
  Briefcase,
  MessageSquare,
  Activity,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  CheckCircle2,
  Eye,
  Tag,
  Radio,
  FileText,
  Clock,
  Send,
  Sparkles,
  Server,
  Webhook
} from "lucide-react";
import ProviderManagerAdmin from "./admin/ProviderManagerAdmin";
import WebhookManagerAdmin from "./admin/WebhookManagerAdmin";
import UserManagementAdmin from "./admin/UserManagementAdmin";

import { UserProfile, UserRole, SubAdminPermission, SiteSettings, PriceMatrix, DataPlan, Transaction, CACApplication, SupportTicket } from "../types";
import { db, doc, setDoc, onSnapshot } from "../firebase";

interface AdminPanelProps {
  currentUser: UserProfile;
  onRefreshUser: (uid: string) => void;
  isDarkMode?: boolean;
}

const PERMISSION_CONFIG = [
  { id: SubAdminPermission.MANAGE_USERS, label: "Manage Users & Wallets", category: "User Operations", shortCode: "USERS", desc: "View registered users, edit profiles, credit/debit balances, change status" },
  { id: SubAdminPermission.MANAGE_PRICES, label: "Price Control & Tariffs", category: "Financials & Tariffs", shortCode: "PRICES", desc: "Modify data plan rates, airtime discounts, exam pins & bill charges" },
  { id: SubAdminPermission.MANAGE_TRANSACTIONS, label: "Transaction Ledger & Refunds", category: "Financials & Tariffs", shortCode: "TX_LEDGER", desc: "View all platform transactions, override status, issue auto-refunds" },
  { id: SubAdminPermission.MANAGE_CAC, label: "CAC Filings Review Board", category: "Services & Support", shortCode: "CAC", desc: "Review, approve or reject corporate business name reservations" },
  { id: SubAdminPermission.MANAGE_SUPPORT, label: "Support Ticket Desk", category: "Services & Support", shortCode: "HELP_DESK", desc: "Reply to and resolve customer support helpdesk inquiries" },
  { id: SubAdminPermission.MANAGE_SERVICES, label: "Services & Marketplace", category: "Services & Support", shortCode: "SERVICES", desc: "Add, edit, or toggle vendor and platform digital services" },
  { id: SubAdminPermission.MANAGE_THEME, label: "Theme & Notice Customizer", category: "Platform & Branding", shortCode: "THEME", desc: "Customize site colors, brand title, announcement banner, maintenance mode" },
  { id: SubAdminPermission.MANAGE_SUBADMINS, label: "Sub-Admin Delegation", category: "Platform & Branding", shortCode: "DELEGATE", desc: "Create new sub-admins and delegate operational permissions" },
];

const ROLE_PRESET_TEMPLATES = [
  {
    name: "Customer Support Lead",
    roleCode: "SUPPORT_LEAD",
    desc: "Handles user support tickets, CAC business filings, and user status queries.",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    permissions: [SubAdminPermission.MANAGE_SUPPORT, SubAdminPermission.MANAGE_CAC, SubAdminPermission.MANAGE_USERS]
  },
  {
    name: "Financials & Tariff Controller",
    roleCode: "FINANCE_DESK",
    desc: "Manages pricing tariffs, data plan margins, transaction overrides, and manual wallet adjustments.",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    permissions: [SubAdminPermission.MANAGE_PRICES, SubAdminPermission.MANAGE_TRANSACTIONS, SubAdminPermission.MANAGE_USERS]
  },
  {
    name: "Platform Operations Director",
    roleCode: "OPS_DIRECTOR",
    desc: "Full operational authority across users, services, CAC, support, themes, and transactions.",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    permissions: [
      SubAdminPermission.MANAGE_USERS,
      SubAdminPermission.MANAGE_PRICES,
      SubAdminPermission.MANAGE_TRANSACTIONS,
      SubAdminPermission.MANAGE_CAC,
      SubAdminPermission.MANAGE_SUPPORT,
      SubAdminPermission.MANAGE_SERVICES,
      SubAdminPermission.MANAGE_THEME
    ]
  },
  {
    name: "Read-Only Auditor Staff",
    roleCode: "AUDITOR",
    desc: "Restricted staff account with view-only permissions for stats and overview charts.",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    permissions: []
  }
];

export default function AdminPanel({ currentUser, onRefreshUser, isDarkMode = false }: AdminPanelProps) {
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const userPermissions = currentUser.permissions || [];

  const hasPermission = (perm: SubAdminPermission) => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(perm);
  };

  // Admin Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "STATS" | "SUB_ADMINS" | "USERS" | "THEME" | "PRICES" | "TRANSACTIONS" | "CAC_SUPPORT" | "AUDIT" | "PROVIDERS"
  >("STATS");


  // Global State
  const [adminStats, setAdminStats] = useState<any>({});
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [subAdminsList, setSubAdminsList] = useState<UserProfile[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: "Smart Link Digital",
    primaryColor: "#2563eb",
    secondaryColor: "#0f172a",
    themePreset: "indigo",
    announcementText: "⚡ Welcome to Smart Link Digital! All Identity, CAC & VTU Services operating at 100% Uptime.",
    showAnnouncement: true,
    maintenanceMode: false,
    supportEmail: "support@smartlink.com",
    supportPhone: "+2348031234567"
  });
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix>({
    identityRates: {
      ninFee: 500,
      bvnFee: 500,
      ipeFee: 1500,
      phoneToNinFee: 1000
    },
    cacRates: {
      businessNameFee: 15000,
      companyFee: 25000,
      ngoFee: 35000,
      reservationFee: 2000
    },
    dataPlans: [],
    airtimeDiscountPercent: { MTN: 2, GLO: 3, AIRTEL: 2, "9MOBILE": 4 },
    examPrices: { WAEC: 3800, NECO: 1200, JAMB: 4700 },
    utilityProcessingFee: 50,
    cableCharges: { DSTV: 100, GOTV: 100, STARTIMES: 100 }
  });
  const [priceCategoryFilter, setPriceCategoryFilter] = useState<"ALL" | "IDENTITY" | "CAC" | "VTU_DATA" | "AIRTIME" | "UTILITIES" | "EDUCATION">("ALL");
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [cacApps, setCacApps] = useState<CACApplication[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [txSearch, setTxSearch] = useState("");

  // Permissions Manager UI State
  const [permManagerViewMode, setPermManagerViewMode] = useState<"MATRIX" | "CARDS" | "PRESETS">("MATRIX");
  const [permSearchQuery, setPermSearchQuery] = useState("");
  const [matrixDraft, setMatrixDraft] = useState<{ [targetUid: string]: SubAdminPermission[] }>({});
  const [showSimulatedSubAdminModal, setShowSimulatedSubAdminModal] = useState<UserProfile | null>(null);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Modals
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [newSubAdminForm, setNewSubAdminForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    permissions: [
      SubAdminPermission.MANAGE_USERS,
      SubAdminPermission.MANAGE_TRANSACTIONS,
      SubAdminPermission.MANAGE_CAC,
      SubAdminPermission.MANAGE_SUPPORT
    ]
  });

  const [editPermissionsUser, setEditPermissionsUser] = useState<UserProfile | null>(null);
  const [editPermissionsForm, setEditPermissionsForm] = useState<SubAdminPermission[]>([]);

  // Wallet Modal
  const [walletUser, setWalletUser] = useState<UserProfile | null>(null);
  const [walletAction, setWalletAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");

  // Inspect User Modal
  const [inspectedUserDetail, setInspectedUserDetail] = useState<{ user: UserProfile; transactions: Transaction[]; cacApplications: CACApplication[] } | null>(null);

  // Ticket Reply state
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  // New Data Plan Form State
  const [showAddDataPlan, setShowAddDataPlan] = useState(false);
  const [newDataPlan, setNewDataPlan] = useState<DataPlan>({
    id: "",
    network: "MTN",
    type: "SME",
    planName: "MTN SME 1.5GB",
    validity: "30 Days",
    customerPrice: 380,
    agentPrice: 350,
    isActive: true
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statRes = await fetch("/api/admin/stats");
      if (statRes.ok) setAdminStats(await statRes.json());

      // 2. Site Settings
      const setRes = await fetch("/api/site/settings");
      if (setRes.ok) {
        const d = await setRes.json();
        if (d.settings) setSiteSettings(d.settings);
      }

      // 3. Price Matrix
      const prRes = await fetch("/api/site/prices");
      if (prRes.ok) {
        const d = await prRes.json();
        if (d.priceMatrix) setPriceMatrix(d.priceMatrix);
      }

      // 4. Users
      const usrRes = await fetch("/api/admin/users");
      if (usrRes.ok) {
        const d = await usrRes.json();
        setUsersList(d.users || []);
        setSubAdminsList((d.users || []).filter((u: UserProfile) => u.role === UserRole.SUB_ADMIN || u.role === UserRole.STAFF || u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN));
      }

      // 5. Transactions
      const txRes = await fetch("/api/admin/transactions");
      if (txRes.ok) {
        const d = await txRes.json();
        setAllTransactions(d.transactions || []);
      }

      // 6. CAC
      const cacRes = await fetch("/api/cac/all");
      if (cacRes.ok) {
        const d = await cacRes.json();
        setCacApps(d.applications || []);
      }

      // 7. Tickets
      const tkRes = await fetch("/api/tickets/all");
      if (tkRes.ok) {
        const d = await tkRes.json();
        setTickets(d.tickets || []);
      }

      // 8. Audit Logs
      const auditRes = await fetch("/api/admin/audit-logs");
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.auditLogs || []);
      }
    } catch (err) {
      console.error("Admin data loading error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();

    // Subscribe to real-time Firestore service pricing updates
    const unsub = onSnapshot(doc(db, "service_pricing", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PriceMatrix;
        setPriceMatrix((prev) => ({
          ...prev,
          ...data,
          identityRates: {
            ninFee: data.identityRates?.ninFee ?? prev.identityRates?.ninFee ?? 500,
            bvnFee: data.identityRates?.bvnFee ?? prev.identityRates?.bvnFee ?? 500,
            ipeFee: data.identityRates?.ipeFee ?? prev.identityRates?.ipeFee ?? 1500,
            phoneToNinFee: data.identityRates?.phoneToNinFee ?? prev.identityRates?.phoneToNinFee ?? 1000
          },
          cacRates: {
            businessNameFee: data.cacRates?.businessNameFee ?? prev.cacRates?.businessNameFee ?? 15000,
            companyFee: data.cacRates?.companyFee ?? prev.cacRates?.companyFee ?? 25000,
            ngoFee: data.cacRates?.ngoFee ?? prev.cacRates?.ngoFee ?? 35000,
            reservationFee: data.cacRates?.reservationFee ?? prev.cacRates?.reservationFee ?? 2000
          }
        }));
      }
    }, (err) => {
      console.warn("Firestore service pricing snapshot listener note:", err);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (subAdminsList.length > 0) {
      const draft: { [uid: string]: SubAdminPermission[] } = {};
      subAdminsList.forEach((a) => {
        draft[a.uid] = a.permissions || [];
      });
      setMatrixDraft(draft);
    }
  }, [subAdminsList]);

  const toggleMatrixPermission = (targetUid: string, perm: SubAdminPermission) => {
    setMatrixDraft((prev) => {
      const current = prev[targetUid] || [];
      const exists = current.includes(perm);
      const updated = exists ? current.filter((p) => p !== perm) : [...current, perm];
      return { ...prev, [targetUid]: updated };
    });
  };

  const applyPresetToSubAdminDraft = (targetUid: string, permissions: SubAdminPermission[], presetName: string) => {
    setMatrixDraft((prev) => ({
      ...prev,
      [targetUid]: [...permissions]
    }));
    showToast("success", `Applied "${presetName}" template to staff member draft!`);
  };

  const handleSaveMatrixChanges = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(matrixDraft).map(([targetUid, permissions]) => ({
        targetUid,
        permissions
      }));

      const res = await fetch("/api/admin/subadmins/batch-update-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          updates
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions matrix");

      showToast("success", `Successfully saved permissions matrix for ${updates.length} sub-admin staff accounts!`);
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          settings: siteSettings
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update site settings");
      showToast("success", "Website theme, notice banner & branding updated successfully!");
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save to backend REST API
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          priceMatrix
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update price matrix");

      // 2. Trigger immediate Firestore update for real-time client sync
      try {
        await setDoc(doc(db, "service_pricing", "global"), {
          ...priceMatrix,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.email || currentUser.uid,
          updatedByName: currentUser.fullName
        }, { merge: true });
      } catch (fsErr: any) {
        console.warn("Firestore service pricing live sync note:", fsErr);
      }

      showToast("success", "Global service pricing (NIN, CAC, VTU, Bills & Exam Cards) published live & synced to Firestore database!");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDataPlan = () => {
    if (!newDataPlan.planName || !newDataPlan.customerPrice) {
      return showToast("error", "Please specify plan name and customer price");
    }
    const newId = `${newDataPlan.network.toLowerCase()}_${newDataPlan.type.toLowerCase()}_${Date.now()}`;
    const updatedPlans = [...priceMatrix.dataPlans, { ...newDataPlan, id: newId }];
    setPriceMatrix({ ...priceMatrix, dataPlans: updatedPlans });
    setShowAddDataPlan(false);
    showToast("success", "Data plan added to list. Click 'Save Price Matrix' to publish live.");
  };

  const handleDeleteDataPlan = (id: string) => {
    const updatedPlans = priceMatrix.dataPlans.filter((p) => p.id !== id);
    setPriceMatrix({ ...priceMatrix, dataPlans: updatedPlans });
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/subadmins/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          ...newSubAdminForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Sub-Admin");

      showToast("success", `Sub-Admin account created for ${data.subAdmin.email}!`);
      setShowAddSubAdminModal(false);
      setNewSubAdminForm({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        permissions: [
          SubAdminPermission.MANAGE_USERS,
          SubAdminPermission.MANAGE_TRANSACTIONS,
          SubAdminPermission.MANAGE_CAC,
          SubAdminPermission.MANAGE_SUPPORT
        ]
      });
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleUpdateSubAdminPermissions = async () => {
    if (!editPermissionsUser) return;
    try {
      const res = await fetch("/api/admin/subadmins/update-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          targetUid: editPermissionsUser.uid,
          permissions: editPermissionsForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions");

      showToast("success", `Updated permissions for ${editPermissionsUser.fullName}`);
      setEditPermissionsUser(null);
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleRevokeSubAdmin = async (targetUid: string) => {
    if (!confirm("Are you sure you want to revoke Sub-Admin access for this user?")) return;
    try {
      const res = await fetch("/api/admin/subadmins/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid: currentUser.uid, targetUid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke Sub-Admin");

      showToast("success", "Sub-Admin access revoked successfully.");
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletUser) return;
    try {
      const res = await fetch("/api/admin/users/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          targetUid: walletUser.uid,
          actionType: walletAction,
          amount: parseFloat(walletAmount),
          description: walletReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wallet adjustment failed");

      showToast("success", `Wallet ${walletAction === "CREDIT" ? "Credited" : "Debited"} ₦${parseFloat(walletAmount).toLocaleString()} for ${walletUser.fullName}`);
      setWalletUser(null);
      setWalletAmount("");
      setWalletReason("");
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleInspectUser = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/users/${uid}`);
      const data = await res.json();
      if (res.ok) setInspectedUserDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          targetUid: user.uid,
          status: newStatus
        })
      });
      if (!res.ok) throw new Error("Status update failed");
      showToast("success", `User ${user.fullName} is now ${newStatus}`);
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to permanently delete this user account?")) return;
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid: currentUser.uid, targetUid })
      });
      if (!res.ok) throw new Error("User deletion failed");
      showToast("success", "User account deleted permanently.");
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleTxOverride = async (txId: string, newStatus: string, autoRefund: boolean = false) => {
    try {
      const res = await fetch("/api/admin/transactions/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          transactionId: txId,
          newStatus,
          autoRefund
        })
      });
      if (!res.ok) throw new Error("Override failed");
      showToast("success", `Transaction status set to ${newStatus}${autoRefund ? " with automated refund" : ""}`);
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleCacApproval = async (id: string, status: "APPROVED" | "REJECTED", approvedName?: string) => {
    try {
      const res = await fetch("/api/cac/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, approvedName })
      });
      if (!res.ok) throw new Error("CAC approval update failed");
      showToast("success", `CAC application ${status.toLowerCase()} successfully.`);
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    const reply = replyText[ticketId];
    if (!reply) return;
    try {
      const res = await fetch("/api/tickets/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticketId,
          reply,
          repliedBy: currentUser.fullName
        })
      });
      if (!res.ok) throw new Error("Ticket reply failed");
      showToast("success", "Ticket resolution dispatched.");
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
      loadAllAdminData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(userSearch));
    const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Transactions
  const filteredTransactions = allTransactions.filter((tx) => {
    return (
      tx.reference.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.userEmail.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.type.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.description.toLowerCase().includes(txSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-white transition-all animate-bounce ${
            feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* ADMIN HEADER & IDENTITY BANNER */}
      <div className="bg-[#0F2D5C] rounded-[16px] p-6 md:p-8 text-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] relative overflow-hidden border border-[#0F2D5C]">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase ${
                isSuperAdmin ? "bg-amber-400 text-slate-950" : "bg-white/20 text-blue-100 border border-white/20"
              }`}>
                {isSuperAdmin ? "⚡ CHIEF SUPER ADMIN" : "🛡️ DELEGATED SUB-ADMIN"}
              </span>
              <span className="text-blue-200 text-xs font-mono">ID: {currentUser.uid}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {siteSettings.siteName} Management Portal
            </h1>
            <p className="text-xs text-blue-100/80 max-w-2xl">
              {isSuperAdmin
                ? "Full administrative control over website themes, user accounts, price control matrices, sub-admin permissions, and transaction ledgers."
                : `Sub-Admin Portal (${userPermissions.length} active permissions delegated by Super Admin).`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-white/10 mt-6 no-scrollbar">
          <button
            onClick={() => setActiveTab("STATS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === "STATS" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Activity className="h-4 w-4" />
            Overview & Stats
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("SUB_ADMINS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "SUB_ADMINS" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              Sub-Admins Control
            </button>
          )}

          {hasPermission(SubAdminPermission.MANAGE_USERS) && (
            <button
              onClick={() => setActiveTab("USERS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "USERS" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <Users className="h-4 w-4" />
              Users & Wallets
            </button>
          )}

          {hasPermission(SubAdminPermission.MANAGE_THEME) && (
            <button
              onClick={() => setActiveTab("THEME")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "THEME" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <Palette className="h-4 w-4" />
              Website Theme & Notice
            </button>
          )}

          {hasPermission(SubAdminPermission.MANAGE_PRICES) && (
            <button
              onClick={() => setActiveTab("PRICES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "PRICES" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Price & Tariff Control
            </button>
          )}

          {hasPermission(SubAdminPermission.MANAGE_TRANSACTIONS) && (
            <button
              onClick={() => setActiveTab("TRANSACTIONS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "TRANSACTIONS" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <Sliders className="h-4 w-4" />
              Transaction Ledger
            </button>
          )}

          {(hasPermission(SubAdminPermission.MANAGE_CAC) || hasPermission(SubAdminPermission.MANAGE_SUPPORT)) && (
            <button
              onClick={() => setActiveTab("CAC_SUPPORT")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "CAC_SUPPORT" ? "bg-white text-[#0F2D5C] shadow-md" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              CAC & Support Desk
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("AUDIT")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "AUDIT" ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <FileText className="h-4 w-4" />
              System Audit Logs
            </button>
          )}

          {(isSuperAdmin || hasPermission(SubAdminPermission.MANAGE_SERVICES)) && (
            <button
              onClick={() => setActiveTab("PROVIDERS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "PROVIDERS" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Server className="h-4 w-4 text-emerald-400" />
              API Provider Manager
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("WEBHOOKS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === "WEBHOOKS" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Webhook className="h-4 w-4 text-indigo-400" />
              Webhook Manager
            </button>
          )}
        </div>
      </div>


      {/* TAB: API PROVIDER MANAGER */}
      {activeTab === "PROVIDERS" && (
        <ProviderManagerAdmin adminUid={currentUser.uid} isDarkMode={isDarkMode} />
      )}

      {/* TAB: DYNAMIC WEBHOOK MANAGER */}
      {activeTab === "WEBHOOKS" && (
        <WebhookManagerAdmin adminUid={currentUser.uid} isDarkMode={isDarkMode} />
      )}

      {/* TAB 1: STATS & SYSTEM STATUS */}

      {activeTab === "STATS" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] font-bold font-mono">REGISTERED USERS</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{adminStats.usersCount || 0}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <span className="text-[10px] font-bold font-mono">SUB-ADMINS & STAFF</span>
              </div>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{adminStats.subAdminsCount || 0}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-bold font-mono">TOTAL BANK DEPOSITS</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                ₦{(adminStats.totalFunding || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                <span className="text-[10px] font-bold font-mono">PLATFORM REVENUE</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                ₦{(adminStats.totalRevenue || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Website Status & Quick Banner Controls
            </h3>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Announcement Notice Banner</h4>
                    <p className="text-[11px] text-slate-500">Displays announcement at top of home screen</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.showAnnouncement}
                    onChange={(e) => setSiteSettings({ ...siteSettings, showAnnouncement: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={siteSettings.announcementText}
                  onChange={(e) => setSiteSettings({ ...siteSettings, announcementText: e.target.value })}
                  placeholder="Announcement text..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Maintenance Mode Switch</h4>
                    <p className="text-[11px] text-slate-500">Lock non-admin users during site updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.maintenanceMode}
                    onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                    className="h-4 w-4 text-rose-600 rounded cursor-pointer"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Status: {siteSettings.maintenanceMode ? "🔴 WEBSITE IN MAINTENANCE" : "🟢 WEBSITE LIVE & ONLINE"}
                </div>
              </div>
            </div>

            {hasPermission(SubAdminPermission.MANAGE_THEME) && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Apply Quick Controls
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUB-ADMINS & PERMISSIONS MANAGER */}
      {activeTab === "SUB_ADMINS" && isSuperAdmin && (
        <div className="space-y-6 text-left">
          {/* Header Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black font-mono tracking-widest uppercase bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                  ⚡ SUPER ADMIN CONTROL DESK
                </span>
                <span className="text-slate-400 text-xs font-mono">{subAdminsList.length} Active Staff Accounts</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-500" />
                Granular Permissions Manager
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Visually configure and delegate operational permissions across sub-admin staff. Adjust matrix access rights, apply predefined role templates, and simulate delegated sub-admin views.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowAddSubAdminModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Sub-Admin Staff
              </button>

              <button
                onClick={handleSaveMatrixChanges}
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-indigo-500/30"
              >
                <Check className="h-4 w-4" />
                Save Permission Matrix
              </button>
            </div>
          </div>

          {/* View Mode Switcher & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setPermManagerViewMode("MATRIX")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  permManagerViewMode === "MATRIX"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Permissions Matrix
              </button>

              <button
                onClick={() => setPermManagerViewMode("CARDS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  permManagerViewMode === "CARDS"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Staff Cards
              </button>

              <button
                onClick={() => setPermManagerViewMode("PRESETS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  permManagerViewMode === "PRESETS"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                Role Templates
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={permSearchQuery}
                onChange={(e) => setPermSearchQuery(e.target.value)}
                placeholder="Filter staff by name, email, or role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* MODE 1: PERMISSIONS MATRIX GRID */}
          {permManagerViewMode === "MATRIX" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4 min-w-[200px]">Sub-Admin Staff</th>
                      {PERMISSION_CONFIG.map((perm) => (
                        <th key={perm.id} className="p-3 text-center min-w-[110px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{perm.shortCode}</div>
                          <div className="text-[9px] text-slate-400 font-normal normal-case truncate max-w-[100px]" title={perm.label}>
                            {perm.label}
                          </div>
                        </th>
                      ))}
                      <th className="p-4 text-right min-w-[150px]">Actions & Presets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subAdminsList
                      .filter(
                        (a) =>
                          a.fullName.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
                          a.email.toLowerCase().includes(permSearchQuery.toLowerCase())
                      )
                      .map((admin) => {
                        const currentPerms = matrixDraft[admin.uid] || admin.permissions || [];
                        const isSuper = admin.role === UserRole.SUPER_ADMIN;

                        return (
                          <tr key={admin.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            {/* Staff info */}
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-black flex items-center justify-center text-xs shrink-0">
                                  {admin.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-bold text-slate-900 dark:text-slate-100">{admin.fullName}</div>
                                  <div className="text-[11px] text-slate-400 font-normal truncate">{admin.email}</div>
                                  <div className="mt-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                        isSuper
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                                      }`}
                                    >
                                      {admin.role}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Permissions matrix checkboxes */}
                            {PERMISSION_CONFIG.map((perm) => {
                              const isGranted = isSuper || currentPerms.includes(perm.id as SubAdminPermission);

                              return (
                                <td key={perm.id} className="p-3 text-center">
                                  {isSuper ? (
                                    <span className="text-amber-500 font-bold text-[10px]">⚡ ALL</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleMatrixPermission(admin.uid, perm.id as SubAdminPermission)}
                                      className={`p-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center border ${
                                        isGranted
                                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                                      }`}
                                      title={`${isGranted ? "Granted" : "Restricted"}: ${perm.label}`}
                                    >
                                      {isGranted ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                                      )}
                                    </button>
                                  )}
                                </td>
                              );
                            })}

                            {/* Action dropdowns & Simulator trigger */}
                            <td className="p-4 text-right space-y-1">
                              {!isSuper && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick Preset Selector */}
                                  <select
                                    onChange={(e) => {
                                      const preset = ROLE_PRESET_TEMPLATES.find((p) => p.roleCode === e.target.value);
                                      if (preset) {
                                        applyPresetToSubAdminDraft(admin.uid, preset.permissions, preset.name);
                                      }
                                      e.target.value = "";
                                    }}
                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                                  >
                                    <option value="">Apply Role Template...</option>
                                    {ROLE_PRESET_TEMPLATES.map((tmpl) => (
                                      <option key={tmpl.roleCode} value={tmpl.roleCode}>
                                        {tmpl.name}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={() => setShowSimulatedSubAdminModal(admin)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer"
                                    title="Preview Delegated View"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleRevokeSubAdmin(admin.uid)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-lg text-xs font-semibold cursor-pointer"
                                    title="Revoke Sub-Admin Access"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODE 2: STAFF CARDS VIEW */}
          {permManagerViewMode === "CARDS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subAdminsList
                .filter(
                  (a) =>
                    a.fullName.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
                    a.email.toLowerCase().includes(permSearchQuery.toLowerCase())
                )
                .map((admin) => {
                  const currentPerms = matrixDraft[admin.uid] || admin.permissions || [];
                  const isSuper = admin.role === UserRole.SUPER_ADMIN;

                  return (
                    <div
                      key={admin.uid}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-black flex items-center justify-center text-sm">
                              {admin.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{admin.fullName}</h3>
                              <p className="text-xs text-slate-400">{admin.email}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                              isSuper
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                            }`}
                          >
                            {admin.role}
                          </span>
                        </div>

                        {/* Granted permissions list */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
                            <span>Delegated Capabilities</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {isSuper ? "ALL (Unrestricted)" : `${currentPerms.length}/${PERMISSION_CONFIG.length} Active`}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {PERMISSION_CONFIG.map((perm) => {
                              const isGranted = isSuper || currentPerms.includes(perm.id as SubAdminPermission);
                              return (
                                <button
                                  key={perm.id}
                                  type="button"
                                  disabled={isSuper}
                                  onClick={() => toggleMatrixPermission(admin.uid, perm.id as SubAdminPermission)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    isGranted
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60 hover:opacity-100"
                                  }`}
                                >
                                  {isGranted ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-slate-400" />}
                                  {perm.shortCode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card actions */}
                      {!isSuper && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setEditPermissionsUser(admin);
                              setEditPermissionsForm(currentPerms);
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Detailed Config
                          </button>

                          <button
                            onClick={() => setShowSimulatedSubAdminModal(admin)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold cursor-pointer"
                            title="Preview Sub-Admin View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleRevokeSubAdmin(admin.uid)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer"
                            title="Revoke Access"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* MODE 3: ROLE PRESETS & CAPABILITY TEMPLATES */}
          {permManagerViewMode === "PRESETS" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Predefined Sub-Admin Role Templates
                </div>
                <p>
                  Use these standard templates to instantly assign recommended operational permission bundles to new or existing sub-admin staff members.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ROLE_PRESET_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.roleCode}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{tmpl.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{tmpl.desc}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${tmpl.badgeColor}`}>
                          {tmpl.roleCode}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">Included Permissions ({tmpl.permissions.length})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {tmpl.permissions.map((p) => {
                            const conf = PERMISSION_CONFIG.find((c) => c.id === p);
                            return (
                              <span
                                key={p}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"
                              >
                                <Check className="h-3 w-3 text-emerald-500" />
                                {conf?.label || p}
                              </span>
                            );
                          })}
                          {tmpl.permissions.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No permissions (Read-only observer)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Apply Selector */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500">Apply template to:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyPresetToSubAdminDraft(e.target.value, tmpl.permissions, tmpl.name);
                            e.target.value = "";
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none cursor-pointer font-bold"
                      >
                        <option value="">Select Sub-Admin Staff...</option>
                        {subAdminsList
                          .filter((a) => a.role !== UserRole.SUPER_ADMIN)
                          .map((a) => (
                            <option key={a.uid} value={a.uid}>
                              {a.fullName} ({a.email})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER CONTROL & WALLET MANAGEMENT */}
      {activeTab === "USERS" && hasPermission(SubAdminPermission.MANAGE_USERS) && (
        <div className="space-y-6 text-left">
          <UserManagementAdmin
            adminUid={currentUser.uid}
            currentUserRole={currentUser.role}
            isDarkMode={isDarkMode}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                User Profiles, Balances & Dashboard Inspection
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                View customer accounts, adjust wallet balances manually, suspend or reactivate users, and preview dashboards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email..."
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none w-48 sm:w-64"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="AGENT_VENDOR">Agents/Vendors</option>
                <option value="STAFF">Staff</option>
                <option value="SUB_ADMIN">Sub-Admins</option>
                <option value="SUPER_ADMIN">Super Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>{usr.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{usr.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{usr.walletBalance.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          usr.status === "SUSPENDED" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {usr.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px] font-mono">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setWalletUser(usr);
                              setWalletAction("CREDIT");
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Credit/Debit
                          </button>

                          <button
                            onClick={() => handleInspectUser(usr.uid)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>

                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            {usr.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                          </button>

                          {isSuperAdmin && usr.role !== UserRole.SUPER_ADMIN && (
                            <button
                              onClick={() => handleDeleteUser(usr.uid)}
                              className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEBSITE THEME & NOTICE CUSTOMIZER */}
      {activeTab === "THEME" && hasPermission(SubAdminPermission.MANAGE_THEME) && (
        <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-500" />
                No-Code Website Theme & Visual Customizer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize site branding, theme colors, announcement banners, support contacts, and maintenance mode without coding.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website Brand Title</label>
                <input
                  type="text"
                  required
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Helpdesk Email</label>
                <input
                  type="email"
                  value={siteSettings.supportEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Phone Number</label>
                <input
                  type="text"
                  value={siteSettings.supportPhone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, supportPhone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme Preset Palette</label>
                <select
                  value={siteSettings.themePreset}
                  onChange={(e: any) => setSiteSettings({ ...siteSettings, themePreset: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="indigo">Royal Indigo (#2563eb)</option>
                  <option value="emerald">Emerald Green (#059669)</option>
                  <option value="navy">Deep Navy (#0f172a)</option>
                  <option value="gold">Luxury Dark Gold (#d97706)</option>
                  <option value="coral">Sunset Coral (#e11d48)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Announcement & Notice Banner</h3>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="annToggle"
                  checked={siteSettings.showAnnouncement}
                  onChange={(e) => setSiteSettings({ ...siteSettings, showAnnouncement: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="annToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Display announcement banner across customer dashboards
                </label>
              </div>

              <textarea
                value={siteSettings.announcementText}
                onChange={(e) => setSiteSettings({ ...siteSettings, announcementText: e.target.value })}
                rows={2}
                placeholder="Enter live message for users..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Save Website Theme & Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 5: SERVICE PRICING & TARIFF MASTER MODULE */}
      {activeTab === "PRICES" && hasPermission(SubAdminPermission.MANAGE_PRICES) && (
        <form onSubmit={handleSavePrices} className="space-y-6 text-left">
          {/* Module Banner & Firestore Live Sync Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Service Pricing & Global Tariff Control
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    FIRESTORE REALTIME SYNC
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage global service costs across Identity (NIN/BVN), CAC Corporate Filings, VTU Telecoms, Bill Payments, and Educational ePINs. Updates publish directly to Firestore to immediately update all active customer dashboards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {loading ? "Publishing to Firestore..." : "Publish Rates Live"}
                </button>
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: "ALL", label: "All Rates & Charges" },
                { id: "IDENTITY", label: "🆔 Identity & KYC (NIN, BVN)" },
                { id: "CAC", label: "🏢 CAC Corporate Filings" },
                { id: "VTU_DATA", label: "📱 VTU Data Bundles" },
                { id: "AIRTIME", label: "📞 Airtime Discounts" },
                { id: "UTILITIES", label: "⚡ Utilities & Cable TV" },
                { id: "EDUCATION", label: "🎓 Educational ePINs" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPriceCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    priceCategoryFilter === cat.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. IDENTITY & KYC RATES */}
          {(priceCategoryFilter === "ALL" || priceCategoryFilter === "IDENTITY") && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  Identity & Digital KYC Service Rates (₦)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Real-time NIMC & NIBSS Rates</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">NIN Slip Verification Fee</label>
                  <p className="text-[10px] text-slate-400">Standard NIMC profile lookup</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.identityRates?.ninFee ?? 500}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        identityRates: {
                          ninFee: parseFloat(e.target.value) || 0,
                          bvnFee: priceMatrix.identityRates?.bvnFee ?? 500,
                          ipeFee: priceMatrix.identityRates?.ipeFee ?? 1500,
                          phoneToNinFee: priceMatrix.identityRates?.phoneToNinFee ?? 1000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">BVN Validation & Search Rate</label>
                  <p className="text-[10px] text-slate-400">CBN NIBSS verification</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.identityRates?.bvnFee ?? 500}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        identityRates: {
                          ninFee: priceMatrix.identityRates?.ninFee ?? 500,
                          bvnFee: parseFloat(e.target.value) || 0,
                          ipeFee: priceMatrix.identityRates?.ipeFee ?? 1500,
                          phoneToNinFee: priceMatrix.identityRates?.phoneToNinFee ?? 1000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">IPE Clearance Rate</label>
                  <p className="text-[10px] text-slate-400">Biometric security clearance</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.identityRates?.ipeFee ?? 1500}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        identityRates: {
                          ninFee: priceMatrix.identityRates?.ninFee ?? 500,
                          bvnFee: priceMatrix.identityRates?.bvnFee ?? 500,
                          ipeFee: parseFloat(e.target.value) || 0,
                          phoneToNinFee: priceMatrix.identityRates?.phoneToNinFee ?? 1000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Phone to NIN Lookup Rate</label>
                  <p className="text-[10px] text-slate-400">Telco MSISDN resolution</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.identityRates?.phoneToNinFee ?? 1000}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        identityRates: {
                          ninFee: priceMatrix.identityRates?.ninFee ?? 500,
                          bvnFee: priceMatrix.identityRates?.bvnFee ?? 500,
                          ipeFee: priceMatrix.identityRates?.ipeFee ?? 1500,
                          phoneToNinFee: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAC CORPORATE FILING RATES */}
          {(priceCategoryFilter === "ALL" || priceCategoryFilter === "CAC") && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  CAC Corporate Filing Rates (₦)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Corporate Affairs Commission Filings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Business Name Registration</label>
                  <p className="text-[10px] text-slate-400">Sole proprietor / Partnership</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.cacRates?.businessNameFee ?? 15000}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        cacRates: {
                          businessNameFee: parseFloat(e.target.value) || 0,
                          companyFee: priceMatrix.cacRates?.companyFee ?? 25000,
                          ngoFee: priceMatrix.cacRates?.ngoFee ?? 35000,
                          reservationFee: priceMatrix.cacRates?.reservationFee ?? 2000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Limited Liability Company</label>
                  <p className="text-[10px] text-slate-400">LTD / Private Company</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.cacRates?.companyFee ?? 25000}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        cacRates: {
                          businessNameFee: priceMatrix.cacRates?.businessNameFee ?? 15000,
                          companyFee: parseFloat(e.target.value) || 0,
                          ngoFee: priceMatrix.cacRates?.ngoFee ?? 35000,
                          reservationFee: priceMatrix.cacRates?.reservationFee ?? 2000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Incorporated Trustee / NGO</label>
                  <p className="text-[10px] text-slate-400">Church, Club, Foundation</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.cacRates?.ngoFee ?? 35000}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        cacRates: {
                          businessNameFee: priceMatrix.cacRates?.businessNameFee ?? 15000,
                          companyFee: priceMatrix.cacRates?.companyFee ?? 25000,
                          ngoFee: parseFloat(e.target.value) || 0,
                          reservationFee: priceMatrix.cacRates?.reservationFee ?? 2000
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Name Reservation Rate</label>
                  <p className="text-[10px] text-slate-400">60-day name lock fee</p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      value={priceMatrix.cacRates?.reservationFee ?? 2000}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        cacRates: {
                          businessNameFee: priceMatrix.cacRates?.businessNameFee ?? 15000,
                          companyFee: priceMatrix.cacRates?.companyFee ?? 25000,
                          ngoFee: priceMatrix.cacRates?.ngoFee ?? 35000,
                          reservationFee: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. VTU DATA PLANS & BUNDLES */}
          {(priceCategoryFilter === "ALL" || priceCategoryFilter === "VTU_DATA") && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-emerald-500" />
                    VTU Data Bundles & Customer/Agent Tariffs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Control exact pricing for MTN, Glo, Airtel, and 9mobile SME, Gifting & Corporate data plans.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDataPlan(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Data Bundle
                </button>
              </div>

              {/* Plans Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Network</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Plan Name</th>
                      <th className="p-3">Validity</th>
                      <th className="p-3">Customer Price (₦)</th>
                      <th className="p-3">Agent Price (₦)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {priceMatrix.dataPlans.map((plan, idx) => (
                      <tr key={plan.id || idx}>
                        <td className="p-3 font-bold font-mono text-indigo-600">{plan.network}</td>
                        <td className="p-3 font-mono text-[10px]">{plan.type}</td>
                        <td className="p-3 font-semibold">{plan.planName}</td>
                        <td className="p-3 text-slate-400 font-mono">{plan.validity}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={plan.customerPrice}
                            onChange={(e) => {
                              const updated = [...priceMatrix.dataPlans];
                              updated[idx].customerPrice = parseFloat(e.target.value) || 0;
                              setPriceMatrix({ ...priceMatrix, dataPlans: updated });
                            }}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded font-mono text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={plan.agentPrice}
                            onChange={(e) => {
                              const updated = [...priceMatrix.dataPlans];
                              updated[idx].agentPrice = parseFloat(e.target.value) || 0;
                              setPriceMatrix({ ...priceMatrix, dataPlans: updated });
                            }}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded font-mono text-xs"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteDataPlan(plan.id)}
                            className="text-rose-600 hover:text-rose-700 cursor-pointer p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. AIRTIME DISCOUNTS & 5. UTILITIES/EXAMS */}
          <div className="grid md:grid-cols-2 gap-6">
            {(priceCategoryFilter === "ALL" || priceCategoryFilter === "AIRTIME") && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  Airtime Discount Rates (%)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">MTN Discount %</label>
                    <input
                      type="number"
                      value={priceMatrix.airtimeDiscountPercent?.MTN || 2}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        airtimeDiscountPercent: { ...priceMatrix.airtimeDiscountPercent, MTN: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">GLO Discount %</label>
                    <input
                      type="number"
                      value={priceMatrix.airtimeDiscountPercent?.GLO || 3}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        airtimeDiscountPercent: { ...priceMatrix.airtimeDiscountPercent, GLO: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">Airtel Discount %</label>
                    <input
                      type="number"
                      value={priceMatrix.airtimeDiscountPercent?.AIRTEL || 2}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        airtimeDiscountPercent: { ...priceMatrix.airtimeDiscountPercent, AIRTEL: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">9mobile Discount %</label>
                    <input
                      type="number"
                      value={priceMatrix.airtimeDiscountPercent?.["9MOBILE"] || 4}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        airtimeDiscountPercent: { ...priceMatrix.airtimeDiscountPercent, "9MOBILE": parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {(priceCategoryFilter === "ALL" || priceCategoryFilter === "EDUCATION") && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Examination Scratch Cards & ePIN Rates (₦)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">WAEC Scratch Card</label>
                    <input
                      type="number"
                      value={priceMatrix.examPrices?.WAEC || 3800}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        examPrices: { ...priceMatrix.examPrices, WAEC: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">NECO Token</label>
                    <input
                      type="number"
                      value={priceMatrix.examPrices?.NECO || 1200}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        examPrices: { ...priceMatrix.examPrices, NECO: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-mono">JAMB ePIN</label>
                    <input
                      type="number"
                      value={priceMatrix.examPrices?.JAMB || 4700}
                      onChange={(e) => setPriceMatrix({
                        ...priceMatrix,
                        examPrices: { ...priceMatrix.examPrices, JAMB: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. UTILITY & CABLE TV PROCESSING FEES */}
          {(priceCategoryFilter === "ALL" || priceCategoryFilter === "UTILITIES") && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-500" />
                Utilities & Cable TV Processing Charges (₦)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-mono">Electricity Bill Fee (₦)</label>
                  <input
                    type="number"
                    value={priceMatrix.utilityProcessingFee || 50}
                    onChange={(e) => setPriceMatrix({
                      ...priceMatrix,
                      utilityProcessingFee: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-mono">DSTV Processing Fee (₦)</label>
                  <input
                    type="number"
                    value={priceMatrix.cableCharges?.DSTV || 100}
                    onChange={(e) => setPriceMatrix({
                      ...priceMatrix,
                      cableCharges: { ...priceMatrix.cableCharges, DSTV: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-mono">GOTV Processing Fee (₦)</label>
                  <input
                    type="number"
                    value={priceMatrix.cableCharges?.GOTV || 100}
                    onChange={(e) => setPriceMatrix({
                      ...priceMatrix,
                      cableCharges: { ...priceMatrix.cableCharges, GOTV: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-mono">Startimes Fee (₦)</label>
                  <input
                    type="number"
                    value={priceMatrix.cableCharges?.STARTIMES || 100}
                    onChange={(e) => setPriceMatrix({
                      ...priceMatrix,
                      cableCharges: { ...priceMatrix.cableCharges, STARTIMES: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Saving triggers an immediate Firestore database write & broadcasts across all customer dashboards live.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {loading ? "Publishing Updates..." : "Publish Tariff & Pricing Matrix Live"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: TRANSACTION LEDGER & OVERRIDES */}
      {activeTab === "TRANSACTIONS" && hasPermission(SubAdminPermission.MANAGE_TRANSACTIONS) && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-500" />
                Platform Master Transaction Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time audit view of all system transactions with manual status override and automated refund triggers.
              </p>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search reference, email, service..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none w-64"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Type & Details</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Override Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{tx.reference}</td>
                      <td className="p-4 font-normal text-slate-500">{tx.userEmail}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{tx.type}</div>
                        <div className="text-[11px] text-slate-400">{tx.description}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        ₦{tx.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : tx.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {tx.status !== "SUCCESS" && (
                            <button
                              onClick={() => handleTxOverride(tx.id, "SUCCESS")}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {tx.status !== "FAILED" && (
                            <button
                              onClick={() => handleTxOverride(tx.id, "FAILED", true)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold cursor-pointer"
                            >
                              Fail & Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CAC & SUPPORT DESK */}
      {activeTab === "CAC_SUPPORT" && (
        <div className="grid lg:grid-cols-12 gap-8 text-left">
          {hasPermission(SubAdminPermission.MANAGE_CAC) && (
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-indigo-500" />
                  CAC Corporate Registry Review Board
                </h2>
                <p className="text-xs text-slate-500">Approve corporate, enterprise, and NGO filings</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {cacApps.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center font-mono">No CAC filings pending review.</p>
                ) : (
                  cacApps.map((app) => (
                    <div key={app.id} className="pt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded">
                            {app.type} FILING
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{app.proposedNames.join(" / ")}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          app.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {app.status === "PENDING" && (
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => handleCacApproval(app.id, "REJECTED")}
                            className="px-3 py-1 border text-rose-600 border-rose-200 hover:bg-rose-50 rounded text-xs cursor-pointer"
                          >
                            Reject Filing
                          </button>
                          <button
                            onClick={() => handleCacApproval(app.id, "APPROVED", app.proposedNames[0])}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs cursor-pointer"
                          >
                            Approve Name
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {hasPermission(SubAdminPermission.MANAGE_SUPPORT) && (
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
                  Support Ticket Helpdesk
                </h2>
                <p className="text-xs text-slate-500">Dispatch resolutions for customer support inquiries</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center font-mono">No support tickets currently open.</p>
                ) : (
                  tickets.map((tk) => (
                    <div key={tk.id} className="pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{tk.subject}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          tk.status === "OPEN" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {tk.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded font-mono">
                        {tk.message}
                      </p>

                      {tk.reply ? (
                        <div className="p-2.5 rounded bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs">
                          <strong>Staff Response:</strong> <p className="text-slate-600 dark:text-slate-300 mt-1">{tk.reply}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={replyText[tk.id] || ""}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [tk.id]: e.target.value }))}
                            placeholder="Type resolution message here..."
                            rows={2}
                            className="w-full px-3 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleTicketReply(tk.id)}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs cursor-pointer"
                            >
                              Dispatch Resolution
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: SYSTEM AUDIT LOGS */}
      {activeTab === "AUDIT" && isSuperAdmin && (
        <div className="space-y-6 text-left">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Administrative System Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Immutable history of actions executed by Super Admin and Sub-Admins across the website.
            </p>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2 border border-slate-800">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 italic">No administrative actions logged yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2 border-b border-slate-800 text-[11px] flex items-start gap-3">
                    <span className="text-amber-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <div>
                      <span className="font-bold text-white">{log.action}</span> by <span className="text-indigo-400">{log.adminEmail}</span>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUB-ADMIN */}
      {showAddSubAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                Create New Sub-Admin Account
              </h3>
              <button onClick={() => setShowAddSubAdminModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newSubAdminForm.fullName}
                  onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, fullName: e.target.value })}
                  placeholder="e.g., Usman Bello"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newSubAdminForm.email}
                  onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, email: e.target.value })}
                  placeholder="subadmin@smartlink.ng"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={newSubAdminForm.password}
                  onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign Permissions</label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {PERMISSION_CONFIG.map((perm) => {
                    const isChecked = newSubAdminForm.permissions.includes(perm.id);
                    return (
                      <label key={perm.id} className="flex items-start gap-2.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSubAdminForm({ ...newSubAdminForm, permissions: [...newSubAdminForm.permissions, perm.id] });
                            } else {
                              setNewSubAdminForm({
                                ...newSubAdminForm,
                                permissions: newSubAdminForm.permissions.filter((p) => p !== perm.id)
                              });
                            }
                          }}
                          className="mt-0.5 h-4 w-4 text-amber-500 rounded cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{perm.label}</div>
                          <div className="text-[10px] text-slate-500">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSubAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Create Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERMISSIONS */}
      {editPermissionsUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  Edit Sub-Admin Rights
                </h3>
                <p className="text-xs text-slate-500">{editPermissionsUser.fullName} ({editPermissionsUser.email})</p>
              </div>
              <button onClick={() => setEditPermissionsUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-slate-400">Quick Template Bundles</label>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.roleCode}
                    type="button"
                    onClick={() => setEditPermissionsForm([...tmpl.permissions])}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    + {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Granular Operational Capabilities:</span>
                <div className="flex gap-2 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setEditPermissionsForm(PERMISSION_CONFIG.map((p) => p.id as SubAdminPermission))}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissionsForm([])}
                    className="text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {PERMISSION_CONFIG.map((perm) => {
                  const isChecked = editPermissionsForm.includes(perm.id as SubAdminPermission);
                  return (
                    <label key={perm.id} className="flex items-start gap-2.5 cursor-pointer text-xs p-1.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditPermissionsForm([...editPermissionsForm, perm.id as SubAdminPermission]);
                          } else {
                            setEditPermissionsForm(editPermissionsForm.filter((p) => p !== perm.id));
                          }
                        }}
                        className="mt-0.5 h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {perm.label}
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {perm.shortCode}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{perm.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditPermissionsUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubAdminPermissions}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Save Access Rights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUB-ADMIN DELEGATED VIEW SIMULATOR */}
      {showSimulatedSubAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    DELEGATED VIEW SIMULATOR
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                  <Eye className="h-5 w-5 text-indigo-500" />
                  Simulating Dashboard Access for {showSimulatedSubAdminModal.fullName}
                </h3>
              </div>
              <button
                onClick={() => setShowSimulatedSubAdminModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span>Account Email: <strong>{showSimulatedSubAdminModal.email}</strong></span>
                <span>Role: <strong>{showSimulatedSubAdminModal.role}</strong></span>
              </div>
              <div className="text-xs text-slate-500">
                This simulator shows exactly which admin navigation tabs and feature modules this sub-admin can view or interact with when logged in.
              </div>
            </div>

            {/* Simulated Admin Tabs Bar */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Simulated Portal Navigation Bar</h4>
              <div className="p-4 bg-slate-900 rounded-2xl space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Overview Stats (Always Active)
                  </div>

                  {[
                    { perm: SubAdminPermission.MANAGE_USERS, label: "Users & Wallets" },
                    { perm: SubAdminPermission.MANAGE_PRICES, label: "Price & Tariffs" },
                    { perm: SubAdminPermission.MANAGE_TRANSACTIONS, label: "Transaction Ledger" },
                    { perm: SubAdminPermission.MANAGE_CAC, label: "CAC & Support Desk" },
                    { perm: SubAdminPermission.MANAGE_THEME, label: "Theme & Notice" },
                    { perm: SubAdminPermission.MANAGE_SUBADMINS, label: "Sub-Admins Control" }
                  ].map((item) => {
                    const isAllowed =
                      showSimulatedSubAdminModal.role === UserRole.SUPER_ADMIN ||
                      (matrixDraft[showSimulatedSubAdminModal.uid] || showSimulatedSubAdminModal.permissions || []).includes(item.perm);

                    return (
                      <div
                        key={item.perm}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          isAllowed
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800/80 text-slate-500 border-slate-700/60 opacity-60 line-through"
                        }`}
                      >
                        {isAllowed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Granular Permission Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Delegated Capabilities Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERMISSION_CONFIG.map((perm) => {
                  const isAllowed =
                    showSimulatedSubAdminModal.role === UserRole.SUPER_ADMIN ||
                    (matrixDraft[showSimulatedSubAdminModal.uid] || showSimulatedSubAdminModal.permissions || []).includes(
                      perm.id as SubAdminPermission
                    );

                  return (
                    <div
                      key={perm.id}
                      className={`p-3 rounded-xl border text-xs text-left space-y-1 ${
                        isAllowed
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{perm.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            isAllowed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isAllowed ? "ACCESSIBLE" : "RESTRICTED"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{perm.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowSimulatedSubAdminModal(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Close Simulator Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL WALLET ADJUSTMENT */}
      {walletUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                Manual Wallet Adjustment
              </h3>
              <button onClick={() => setWalletUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWalletAdjust} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <div>User: <strong className="text-slate-900 dark:text-slate-100">{walletUser.fullName}</strong></div>
                <div>Current Balance: <strong className="text-emerald-600 font-mono">₦{walletUser.walletBalance.toLocaleString()}</strong></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Action Type</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="wAction"
                      checked={walletAction === "CREDIT"}
                      onChange={() => setWalletAction("CREDIT")}
                    />
                    <span className="font-bold text-emerald-600">Credit Wallet (+)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="wAction"
                      checked={walletAction === "DEBIT"}
                      onChange={() => setWalletAction("DEBIT")}
                    />
                    <span className="font-bold text-rose-600">Debit Wallet (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount (₦)</label>
                <input
                  type="number"
                  required
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  placeholder="e.g., Manual refund or offline bank transfer"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalletUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT USER DASHBOARD DETAIL */}
      {inspectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-500" />
                Inspect User Dashboard: {inspectedUserDetail.user.fullName}
              </h3>
              <button onClick={() => setInspectedUserDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl font-mono">
              <div>Email: <strong>{inspectedUserDetail.user.email}</strong></div>
              <div>Role: <strong>{inspectedUserDetail.user.role}</strong></div>
              <div>Wallet: <strong className="text-emerald-600">₦{inspectedUserDetail.user.walletBalance.toLocaleString()}</strong></div>
              <div>Registered: <strong>{new Date(inspectedUserDetail.user.createdAt).toLocaleDateString()}</strong></div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">User Transaction History ({inspectedUserDetail.transactions.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inspectedUserDetail.transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono">No transactions recorded for this user.</p>
                ) : (
                  inspectedUserDetail.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{tx.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.reference} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">₦{tx.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectedUserDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DATA BUNDLE */}
      {showAddDataPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 text-left space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Data Bundle</h3>
              <button onClick={() => setShowAddDataPlan(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Network Provider</label>
                <select
                  value={newDataPlan.network}
                  onChange={(e: any) => setNewDataPlan({ ...newDataPlan, network: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="MTN">MTN Nigeria</option>
                  <option value="GLO">Globacom</option>
                  <option value="AIRTEL">Airtel Nigeria</option>
                  <option value="9MOBILE">9mobile</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data Type</label>
                <select
                  value={newDataPlan.type}
                  onChange={(e: any) => setNewDataPlan({ ...newDataPlan, type: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="SME">SME Data</option>
                  <option value="GIFTING">Direct Gifting</option>
                  <option value="CORPORATE">Corporate Gifting</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Plan Title</label>
                <input
                  type="text"
                  value={newDataPlan.planName}
                  onChange={(e) => setNewDataPlan({ ...newDataPlan, planName: e.target.value })}
                  placeholder="e.g. MTN SME 2.5GB (30 Days)"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Price (₦)</label>
                  <input
                    type="number"
                    value={newDataPlan.customerPrice}
                    onChange={(e) => setNewDataPlan({ ...newDataPlan, customerPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Agent Price (₦)</label>
                  <input
                    type="number"
                    value={newDataPlan.agentPrice}
                    onChange={(e) => setNewDataPlan({ ...newDataPlan, agentPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDataPlan(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDataPlan}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Add Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
