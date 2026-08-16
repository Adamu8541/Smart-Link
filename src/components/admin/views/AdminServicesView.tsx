import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  DollarSign,
  Zap,
  ShieldCheck,
  Building,
  FileText,
  CreditCard,
  Globe,
  PhoneCall,
  Wifi,
  Tv,
  BookOpen,
  Award,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Percent,
  TrendingUp,
  Tag,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { getStoredAdminSession } from "../../../services/adminAuthTypes";

interface AdminServicesViewProps {
  session?: any;
  onNavigate?: (route: string) => void;
}

export function AdminServicesView({ session, onNavigate }: AdminServicesViewProps) {
  const [services, setServices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    pageNum: 1,
    limitNum: 15,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Toasts & Modal States
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("IDENTITY_VERIFICATION");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("SmartLink Gateway Direct");
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [sellingFee, setSellingFee] = useState<number | string>(0);
  const [serviceCharge, setServiceCharge] = useState<number | string>(0);
  const [commissionRate, setCommissionRate] = useState<number | string>(10);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number | string>(1);
  const [icon, setIcon] = useState("CheckSquare");

  // Pricing Modal State
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingService, setPricingService] = useState<any | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [search, selectedCategory, statusFilter, pagination.pageNum]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const queryParams = new URLSearchParams({
        search,
        category: selectedCategory,
        status: statusFilter,
        page: pagination.pageNum.toString(),
        limit: pagination.limitNum.toString(),
      });

      const res = await fetch(`/api/admin/services?${queryParams.toString()}`, {
        headers: { "x-admin-token": token },
      });

      const json = await res.json();
      if (json.success) {
        setServices(json.services || []);
        setPagination(json.pagination || pagination);
        setMetrics(json.metrics || null);
        setCategories(json.categories || []);
      } else {
        showToast("error", "Failed to load services catalog.");
      }
    } catch (err: any) {
      showToast("error", "Network error communicating with Services Engine.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setEditingService(null);
    setName("");
    setCode("");
    setCategory("IDENTITY_VERIFICATION");
    setDescription("");
    setProvider("SmartLink Gateway Direct");
    setCostPrice(0);
    setSellingFee(0);
    setServiceCharge(0);
    setCommissionRate(10);
    setIsActive(true);
    setDisplayOrder(services.length + 1);
    setIcon("CheckSquare");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: any) => {
    setEditingService(service);
    setName(service.name || "");
    setCode(service.code || "");
    setCategory(service.category || "IDENTITY_VERIFICATION");
    setDescription(service.description || "");
    setProvider(service.provider || "SmartLink Gateway Direct");
    setCostPrice(service.costPrice ?? 0);
    setSellingFee(service.sellingFee ?? 0);
    setServiceCharge(service.serviceCharge ?? 0);
    setCommissionRate(service.commissionRate ?? 10);
    setIsActive(service.isActive ?? true);
    setDisplayOrder(service.displayOrder ?? 1);
    setIcon(service.icon || "CheckSquare");
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      showToast("error", "Service Name and Service Code are required.");
      return;
    }

    setFormLoading(true);
    const token = getStoredAdminSession()?.sessionToken || "";
    const adminUid = session?.adminUid || getStoredAdminSession()?.uid || "SUPER_ADMIN";

    const payload = {
      adminUid,
      service: {
        name,
        code,
        category,
        description,
        provider,
        costPrice: Number(costPrice),
        sellingFee: Number(sellingFee),
        serviceCharge: Number(serviceCharge),
        commissionRate: Number(commissionRate),
        isActive,
        displayOrder: Number(displayOrder),
        icon,
      },
    };

    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "Service saved successfully.");
        setIsModalOpen(false);
        fetchServices();
      } else {
        showToast("error", json.error || "Failed to save service.");
      }
    } catch (err: any) {
      showToast("error", "Network error saving service.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    const token = getStoredAdminSession()?.sessionToken || "";
    const adminUid = session?.adminUid || getStoredAdminSession()?.uid || "SUPER_ADMIN";

    try {
      const res = await fetch(`/api/admin/services/${serviceId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ adminUid, isActive: !currentStatus }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        fetchServices();
      } else {
        showToast("error", json.error || "Failed to toggle status.");
      }
    } catch (err: any) {
      showToast("error", "Network error toggling service status.");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const token = getStoredAdminSession()?.sessionToken || "";
    const adminUid = session?.adminUid || getStoredAdminSession()?.uid || "SUPER_ADMIN";

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ adminUid }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setDeletingId(null);
        fetchServices();
      } else {
        showToast("error", json.error || "Failed to delete service.");
      }
    } catch (err: any) {
      showToast("error", "Network error deleting service.");
    }
  };

  const handleOpenPricingModal = (service: any) => {
    setPricingService(service);
    setCostPrice(service.costPrice ?? 0);
    setSellingFee(service.sellingFee ?? 0);
    setServiceCharge(service.serviceCharge ?? 0);
    setCommissionRate(service.commissionRate ?? 10);
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingService) return;

    setFormLoading(true);
    const token = getStoredAdminSession()?.sessionToken || "";
    const adminUid = session?.adminUid || getStoredAdminSession()?.uid || "SUPER_ADMIN";

    try {
      const res = await fetch(`/api/admin/services/${pricingService.id}/pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          adminUid,
          costPrice: Number(costPrice),
          sellingFee: Number(sellingFee),
          serviceCharge: Number(serviceCharge),
          commissionRate: Number(commissionRate),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setIsPricingModalOpen(false);
        fetchServices();
      } else {
        showToast("error", json.error || "Failed to update pricing.");
      }
    } catch (err: any) {
      showToast("error", "Network error updating pricing.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === services.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...services];

    // Swap displayOrders
    const tempOrder = updated[index].displayOrder;
    updated[index].displayOrder = updated[targetIndex].displayOrder;
    updated[targetIndex].displayOrder = tempOrder;

    // Swap positions
    const tempItem = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = tempItem;

    setServices(updated);

    const token = getStoredAdminSession()?.sessionToken || "";
    const adminUid = session?.adminUid || getStoredAdminSession()?.uid || "SUPER_ADMIN";

    const orders = updated.map((s, idx) => ({ id: s.id, displayOrder: idx + 1 }));

    try {
      await fetch("/api/admin/services/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ adminUid, orders }),
      });
      showToast("success", "Service display ordering updated.");
    } catch (err) {
      showToast("error", "Failed to save reordered services.");
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "IDENTITY_VERIFICATION":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
      case "TELECOM_VTU":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "UTILITY_BILLS":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "EDUCATION_RESULT_PINS":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-1">
            <span>ADMINISTRATIVE CONTROL</span>
            <span>/</span>
            <span className="text-slate-400">MODULE 2 — SERVICES & PRICING</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-cyan-400" />
            <span>Services & Pricing Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure identity, bill payment, VTU, and scratchcard service catalogs, service fees, commissions, and visibility toggles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServices}
            disabled={loading}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 border text-xs font-medium rounded-2xl flex items-center justify-between transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Services</span>
            <div className="text-2xl font-black text-white">{metrics.totalServices}</div>
            <span className="text-[10px] text-slate-500">Catalog Offerings</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-emerald-950/60 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400">Active Services</span>
            <div className="text-2xl font-black text-emerald-400">{metrics.activeServices}</div>
            <span className="text-[10px] text-emerald-500/80">Visible to End-Users</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-amber-950/60 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400">Hidden / Deactivated</span>
            <div className="text-2xl font-black text-amber-400">{metrics.hiddenServices}</div>
            <span className="text-[10px] text-amber-500/80">Disabled / Inactive</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-cyan-950/60 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400">Avg. Commission</span>
            <div className="text-2xl font-black text-cyan-300">{metrics.avgCommissionRate}%</div>
            <span className="text-[10px] text-cyan-500/80">Partner & Agent Yield</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-purple-950/60 rounded-2xl space-y-1 col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono uppercase text-purple-400">Total Volume</span>
            <div className="text-2xl font-black text-purple-300">{metrics.totalVolume?.toLocaleString()}</div>
            <span className="text-[10px] text-purple-500/80">Successful Calls</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setSelectedCategory("IDENTITY_VERIFICATION")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "IDENTITY_VERIFICATION"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Identity Verification
          </button>
          <button
            onClick={() => setSelectedCategory("TELECOM_VTU")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "TELECOM_VTU"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Telecom & VTU
          </button>
          <button
            onClick={() => setSelectedCategory("UTILITY_BILLS")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "UTILITY_BILLS"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Bills & Utilities
          </button>
          <button
            onClick={() => setSelectedCategory("EDUCATION_RESULT_PINS")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "EDUCATION_RESULT_PINS"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Education Pins
          </button>
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="HIDDEN">Hidden / Inactive</option>
          </select>
        </div>
      </div>

      {/* Services Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-12">Order</th>
                <th className="py-4 px-4">Service Details</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Provider API</th>
                <th className="py-4 px-4 text-right">Cost Price</th>
                <th className="py-4 px-4 text-right">Selling Fee</th>
                <th className="py-4 px-4 text-right">Service Charge</th>
                <th className="py-4 px-4 text-center">Commission</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading Services Catalog...</span>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No services found matching filters.
                  </td>
                </tr>
              ) : (
                services.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Order Controls */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleMoveOrder(idx, "up")}
                          disabled={idx === 0}
                          className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-[10px] font-bold text-slate-400">{s.displayOrder || idx + 1}</span>
                        <button
                          onClick={() => handleMoveOrder(idx, "down")}
                          disabled={idx === services.length - 1}
                          className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Service Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 shrink-0">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-md">
                              {s.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{s.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCategoryBadgeColor(s.category)}`}>
                        {s.category?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{s.provider}</td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-400">
                      ₦{(s.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Selling Fee */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ₦{(s.sellingFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Service Charge */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      ₦{(s.serviceCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Commission Rate */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 bg-cyan-950/60 border border-cyan-900 rounded-md">
                        {s.commissionRate || 0}%
                      </span>
                    </td>

                    {/* Active/Inactive Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                          s.isActive
                            ? "bg-emerald-950/80 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60"
                            : "bg-rose-950/80 border-rose-800 text-rose-400 hover:bg-rose-900/60"
                        }`}
                      >
                        {s.isActive ? (
                          <>
                            <Eye className="h-3 w-3 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 text-rose-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenPricingModal(s)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-lg cursor-pointer transition"
                          title="Edit Pricing & Fees"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded-lg cursor-pointer transition"
                          title="Edit Service Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(s.id)}
                          className="p-1.5 bg-slate-950 hover:bg-rose-950 border border-slate-800 text-rose-400 rounded-lg cursor-pointer transition"
                          title="Delete Service"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-cyan-400" />
                <span>{editingService ? "Edit Service" : "Add New Service to Catalog"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NIN Instant Lookup"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Service Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingService)}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NIN_VERIFY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="IDENTITY_VERIFICATION">Identity Verification</option>
                    <option value="TELECOM_VTU">Telecom & VTU</option>
                    <option value="UTILITY_BILLS">Utility & Cable Bills</option>
                    <option value="EDUCATION_RESULT_PINS">Education Result Pins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Provider API</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Prembly NIMC API"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of service features and processing flow..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Pricing, Fees & Commission Configuration
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Cost Price (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-400 text-[10px] mb-1">Selling Fee (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingFee}
                      onChange={(e) => setSellingFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-400 text-[10px] mb-1">Service Charge (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 text-[10px] mb-1">Commission (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-cyan-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Display Priority Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Service Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      isActive
                        ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                        : "bg-rose-950 border border-rose-800 text-rose-300"
                    }`}
                  >
                    {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span>{isActive ? "ACTIVE & VISIBLE" : "HIDDEN / INACTIVE"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-950/50"
                >
                  {formLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{editingService ? "Update Service" : "Create Service"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pricing Adjustment Modal */}
      {isPricingModalOpen && pricingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                <span>Adjust Pricing for {pricingService.name}</span>
              </h3>
              <button onClick={() => setIsPricingModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Provider Cost Price (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1 font-medium">Selling Fee (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingFee}
                  onChange={(e) => setSellingFee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1 font-medium">Service Charge (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 font-medium">Agent/Vendor Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/50"
                >
                  {formLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>Save Pricing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl">
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-400 rounded-2xl w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Service from Catalog?</h3>
            <p className="text-xs text-slate-400">
              This action cannot be undone. Any active transactions using this service code will fail until re-created.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="py-2 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(deletingId)}
                className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-950/50"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
