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
  ArrowDown,
  Sparkles,
  Save
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
  const [provider, setProvider] = useState("SmartLink Portal Direct");
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

  // NIN Slip Price Control State
  const [slipPriceState, setSlipPriceState] = useState({
    PREMIUM: 250,
    STANDARD: 200,
    REGULAR: 180,
  });
  const [savingSlipPrices, setSavingSlipPrices] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchSlipPrices();
  }, [search, selectedCategory, statusFilter, pagination.pageNum]);

  const fetchSlipPrices = async () => {
    try {
      const res = await fetch("/api/site/prices");
      const json = await res.json();
      if (json.priceMatrix?.slipPrices) {
        setSlipPriceState({
          PREMIUM: json.priceMatrix.slipPrices.PREMIUM ?? 250,
          STANDARD: json.priceMatrix.slipPrices.STANDARD ?? 200,
          REGULAR: json.priceMatrix.slipPrices.REGULAR ?? 180,
        });
      }
    } catch (err) {
      // Keep defaults
    }
  };

  const handleSaveSlipPrices = async () => {
    setSavingSlipPrices(true);
    try {
      const token = getStoredAdminSession()?.sessionToken || "";
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          priceMatrix: {
            slipPrices: {
              PREMIUM: Number(slipPriceState.PREMIUM),
              STANDARD: Number(slipPriceState.STANDARD),
              REGULAR: Number(slipPriceState.REGULAR),
            },
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "NIN Slip rates updated successfully across platform!");
        window.dispatchEvent(new CustomEvent("site_config_updated"));
      } else {
        showToast("error", json.error || "Failed to update slip rates.");
      }
    } catch (err) {
      showToast("error", "Network error saving slip rates.");
    } finally {
      setSavingSlipPrices(false);
    }
  };

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
    setProvider("SmartLink Portal Direct");
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
    setProvider(service.provider || "SmartLink Portal Direct");
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
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("services_updated"));
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
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("services_updated"));
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
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("services_updated"));
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
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("services_updated"));
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
        return " bg-blue-50 text-[#0F2D5C] border-blue-200";
      case "TELECOM_VTU":
        return " bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UTILITY_BILLS":
        return " bg-amber-50 text-amber-700 border-amber-200";
      case "EDUCATION_RESULT_PINS":
        return " bg-purple-50 text-purple-700 border-purple-200";
      default:
        return " bg-[#F5F7FA] text-[#111827] border-[#E5E7EB]";
    }
  };

  return (
    <div className="space-y-8 text-[#111827] font-sans pb-12">
      {/* Header Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-4 shadow-xs text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6B7280] mb-1">
              <span>ADMINISTRATIVE CONTROL</span>
              <span>/</span>
              <span className="text-[#0F2D5C]">MODULE 2 — SERVICES & PRICING</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-[#0F2D5C]" />
              <span>Services & Pricing Management</span>
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Configure identity, bill payment, VTU, and scratchcard service catalogs, service fees, commissions, and visibility toggles.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchServices}
              disabled={loading}
              className="py-2.5 px-4 bg-[#F5F7FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#111827] font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F2D5C]" : "text-[#6B7280]"}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate ? onNavigate("/admin/prices") : window.location.assign("/admin/prices")}
              className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Manage all service prices directly in Turso database"
            >
              <DollarSign className="h-4 w-4" />
              <span>Turso Price Control</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Service</span>
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`p-4 border text-xs font-semibold rounded-2xl flex items-center justify-between transition-all ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="font-bold text-sm hover:opacity-70">
              ✕
            </button>
          </div>
        )}

        {/* Metrics Banner */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Total Services</span>
              <div className="text-2xl font-black text-[#111827]">{metrics.totalServices}</div>
              <span className="text-[10px] text-[#6B7280]">Catalog Offerings</span>
            </div>

            <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Active Services</span>
              <div className="text-2xl font-black text-emerald-600">{metrics.activeServices}</div>
              <span className="text-[10px] text-emerald-700 font-medium">Visible to End-Users</span>
            </div>

            <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Hidden / Deactivated</span>
              <div className="text-2xl font-black text-amber-600">{metrics.hiddenServices}</div>
              <span className="text-[10px] text-amber-700 font-medium">Disabled / Inactive</span>
            </div>

            <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Avg. Commission</span>
              <div className="text-2xl font-black text-[#0F2D5C]">{metrics.avgCommissionRate}%</div>
              <span className="text-[10px] text-[#0F2D5C]">Partner & Agent Yield</span>
            </div>

            <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl space-y-1 col-span-2 md:col-span-1">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Total Volume</span>
              <div className="text-2xl font-black text-[#0F2D5C]">{metrics.totalVolume?.toLocaleString()}</div>
              <span className="text-[10px] text-[#6B7280]">Successful Calls</span>
            </div>
          </div>
        )}
      </div>

      {/* NIN Slip Pricing Admin Control Panel */}
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl space-y-4 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>SUPER ADMIN PRICING CONTROL</span>
            </div>
            <h3 className="text-lg font-black text-[#111827] mt-0.5">
              NIN Verification Slip Rates (Premium Card, Regular Slip)
            </h3>
            <p className="text-xs text-[#6B7280]">
              Adjust official fees automatically deducted from user wallets upon successful NIN verification.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSlipPrices}
            disabled={savingSlipPrices}
            className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs self-start sm:self-auto"
          >
            {savingSlipPrices ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Slip Rates</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Premium Slip */}
          <div className="p-4 bg-[#F9FAFB] border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Premium Card
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                PLASTIC CARD
              </span>
            </div>
            <label className="block text-[11px] text-[#6B7280]">Fee Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#6B7280] font-mono font-bold text-xs">₦</span>
              <input
                type="number"
                step="1"
                min="0"
                value={slipPriceState.PREMIUM}
                onChange={(e) => setSlipPriceState({ ...slipPriceState, PREMIUM: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-7 pr-3 py-2 text-sm text-[#111827] font-mono font-bold focus:outline-hidden focus:border-[#0F2D5C]"
              />
            </div>
            <p className="text-[10px] text-[#6B7280]">Default: ₦250.00 • Green Guilloche Plastic</p>
          </div>

          {/* Regular Slip */}
          <div className="p-4 bg-[#F9FAFB] border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                Regular Slip
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                BASIC POS
              </span>
            </div>
            <label className="block text-[11px] text-[#6B7280]">Fee Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#6B7280] font-mono font-bold text-xs">₦</span>
              <input
                type="number"
                step="1"
                min="0"
                value={slipPriceState.REGULAR}
                onChange={(e) => setSlipPriceState({ ...slipPriceState, REGULAR: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-7 pr-3 py-2 text-sm text-[#111827] font-mono font-bold focus:outline-hidden focus:border-[#0F2D5C]"
              />
            </div>
            <p className="text-[10px] text-[#6B7280]">Default: ₦180.00 • POS Thermal Monochrome</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setSelectedCategory("IDENTITY_VERIFICATION")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "IDENTITY_VERIFICATION"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            Identity Verification
          </button>
          <button
            onClick={() => setSelectedCategory("TELECOM_VTU")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "TELECOM_VTU"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            Telecom & VTU
          </button>
          <button
            onClick={() => setSelectedCategory("UTILITY_BILLS")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "UTILITY_BILLS"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            Bills & Utilities
          </button>
          <button
            onClick={() => setSelectedCategory("EDUCATION_RESULT_PINS")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "EDUCATION_RESULT_PINS"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            Education Pins
          </button>
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F2D5C] focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="HIDDEN">Hidden / Inactive</option>
          </select>
        </div>
      </div>

      {/* Services Catalog Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#E5E7EB] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#6B7280]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0F2D5C] mb-2" />
                    <span>Loading Services Catalog...</span>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#6B7280]">
                    No services found matching filters.
                  </td>
                </tr>
              ) : (
                services.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-[#F9FAFB] transition-colors group">
                    {/* Order Controls */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleMoveOrder(idx, "up")}
                          disabled={idx === 0}
                          className="text-[#6B7280] hover:text-[#111827] disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-[10px] font-bold text-[#6B7280]">{s.displayOrder || idx + 1}</span>
                        <button
                          onClick={() => handleMoveOrder(idx, "down")}
                          disabled={idx === services.length - 1}
                          className="text-[#6B7280] hover:text-[#111827] disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Service Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[#0F2D5C] shrink-0">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-[#111827] flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#F5F7FA] border border-[#E5E7EB] text-[#6B7280] rounded-md">
                              {s.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] line-clamp-1 max-w-xs">{s.description}</p>
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
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6B7280]">{s.provider}</td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#6B7280]">
                      ₦{(s.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Selling Fee */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">
                      ₦{(s.sellingFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Service Charge */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">
                      ₦{(s.serviceCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Commission Rate */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-[#0F2D5C] px-2 py-0.5 bg-[#0F2D5C]/10 border border-[#0F2D5C]/20 rounded-md">
                        {s.commissionRate || 0}%
                      </span>
                    </td>

                    {/* Active/Inactive Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                          s.isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s.isActive ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 text-gray-500" />
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
                          className="p-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#0F2D5C] rounded-lg cursor-pointer transition shadow-xs"
                          title="Edit Pricing & Fees"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#0F2D5C] rounded-lg cursor-pointer transition shadow-xs"
                          title="Edit Service Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(s.id)}
                          className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer transition shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#0F2D5C]" />
                <span>{editingService ? "Edit Service" : "Add New Service to Catalog"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NIN Instant Lookup"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Service Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingService)}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NIN_VERIFY"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] font-mono uppercase focus:outline-none focus:border-[#0F2D5C] focus:bg-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C]"
                  >
                    <option value="IDENTITY_VERIFICATION">Identity Verification</option>
                    <option value="TELECOM_VTU">Telecom & VTU</option>
                    <option value="UTILITY_BILLS">Utility & Cable Bills</option>
                    <option value="EDUCATION_RESULT_PINS">Education Result Pins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Provider API</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Prembly NIN API"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0F2D5C] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of service features and processing flow..."
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#0F2D5C] focus:bg-white"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-[#111827] uppercase tracking-wider block">
                  Pricing, Fees & Commission Configuration
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[#6B7280] text-[10px] mb-1">Cost Price (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[#111827] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] text-[10px] mb-1">Selling Fee (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingFee}
                      onChange={(e) => setSellingFee(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[#0F2D5C] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] text-[10px] mb-1">Service Charge (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[#0F2D5C] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B7280] text-[10px] mb-1">Commission (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[#0F2D5C] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Display Priority Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#6B7280] mb-1 font-medium">Service Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      isActive
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-gray-100 border border-gray-200 text-gray-600"
                    }`}
                  >
                    {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span>{isActive ? "ACTIVE & VISIBLE" : "HIDDEN / INACTIVE"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 bg-white border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#111827] font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-6 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#0F2D5C]" />
                <span>Adjust Pricing for {pricingService.name}</span>
              </h3>
              <button onClick={() => setIsPricingModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Provider Cost Price (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#111827] font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Selling Fee (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingFee}
                  onChange={(e) => setSellingFee(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#0F2D5C] font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Service Charge (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#0F2D5C] font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Agent/Vendor Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-[#0F2D5C] font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="py-2.5 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#111827] font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl">
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Delete Service from Catalog?</h3>
            <p className="text-xs text-[#6B7280]">
              This action cannot be undone. Any active transactions using this service code will fail until re-created.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="py-2 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#111827] text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(deletingId)}
                className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
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
