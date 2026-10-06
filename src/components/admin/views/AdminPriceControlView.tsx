/**
 * SmartLink NG — Admin Price Control Panel
 * Enterprise Service Price & Margin Management strictly backed by Turso Database.
 * 
 * SPECIFICATION:
 * - All prices are fetched directly from Turso database (/api/admin/prices).
 * - Every edit is saved directly to Turso database via atomic transactions.
 * - Supports inline editing, bulk updates, and individual service configuration.
 * - Provides live calculation of profit margins and markup percentages.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Search,
  RefreshCw,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  TrendingUp,
  Percent,
  Edit3,
  Sliders,
  Download,
  Database,
  ArrowUpDown,
  FileText,
  CreditCard,
  Building,
  GraduationCap,
  Wifi,
  Phone,
  HelpCircle,
  X,
  Check,
  Sparkles
} from "lucide-react";
import { soundFx } from "../../../utils/audioEffects";
import { safeFetchJson } from "../../../utils/authErrorHandler";
import { getStoredAdminSession } from "../../../services/adminAuthTypes";

export interface TursoPriceItem {
  id: string;
  service_id: string;
  service_code: string;
  name: string;
  category: string;
  description?: string | null;
  price: number;
  cost_price: number;
  service_charge: number;
  commission_rate: number;
  price_label?: string | null;
  is_active: number;
  updated_by?: string | null;
  updated_at: string;
}

interface AdminPriceControlViewProps {
  session?: any;
  onNavigate?: (route: string) => void;
}

export default function AdminPriceControlView({ session, onNavigate }: AdminPriceControlViewProps) {
  const [prices, setPrices] = useState<TursoPriceItem[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, {
    price: number;
    cost_price: number;
    service_charge: number;
    commission_rate: number;
    is_active: number;
    price_label?: string;
  }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<TursoPriceItem | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortField, setSortField] = useState<"name" | "price" | "cost_price" | "profit" | "category">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Feedback Toasts
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const adminSession = session || getStoredAdminSession();
  const token = adminSession?.sessionToken || "";

  // 1. Fetch all prices from Turso
  const fetchPricesFromTurso = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        source: string;
        services: TursoPriceItem[];
        totalServices: number;
      }>("/api/admin/prices", {
        headers: {
          "x-admin-token": token,
        },
      });

      if (res.ok && res.data?.services) {
        setPrices(res.data.services);
        setEditedPrices({});
        if (!silent) {
          setToast({ type: "info", message: `Loaded ${res.data.services.length} services live from Turso database.` });
        }
      } else {
        throw new Error(res.error || "Failed to load service prices from Turso.");
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Could not retrieve pricing from Turso." });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricesFromTurso();
  }, []);

  // Clear toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle local change in price input
  const handlePriceFieldChange = (
    serviceId: string,
    field: "price" | "cost_price" | "service_charge" | "commission_rate" | "is_active" | "price_label",
    value: any
  ) => {
    const original = prices.find((p) => p.service_id === serviceId);
    if (!original) return;

    setEditedPrices((prev) => {
      const current = prev[serviceId] || {
        price: original.price,
        cost_price: original.cost_price,
        service_charge: original.service_charge,
        commission_rate: original.commission_rate,
        is_active: original.is_active,
        price_label: original.price_label || "",
      };

      return {
        ...prev,
        [serviceId]: {
          ...current,
          [field]: field === "price_label" ? value : Number(value),
        },
      };
    });
  };

  // Check if a row has uncommitted changes
  const hasRowChanges = (serviceId: string) => {
    return Boolean(editedPrices[serviceId]);
  };

  const totalPendingChanges = Object.keys(editedPrices).length;

  // Save single service to Turso
  const handleSaveSingleService = async (serviceId: string) => {
    const changes = editedPrices[serviceId];
    if (!changes) return;

    setSavingId(serviceId);
    try {
      const res = await safeFetchJson<{ success: boolean; service: TursoPriceItem; message: string }>(
        `/api/admin/prices/${serviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({
            price: changes.price,
            costPrice: changes.cost_price,
            serviceCharge: changes.service_charge,
            commissionRate: changes.commission_rate,
            priceLabel: changes.price_label,
            isActive: Boolean(changes.is_active),
          }),
        }
      );

      if (res.ok && res.data?.service) {
        soundFx.playSuccessSound();
        setToast({ type: "success", message: `Saved ₦${changes.price.toLocaleString()} for ${res.data.service.name} to Turso!` });

        // Update local state with the returned Turso record
        setPrices((prev) =>
          prev.map((item) => (item.service_id === serviceId ? res.data.service : item))
        );
        // Clear pending edit
        setEditedPrices((prev) => {
          const next = { ...prev };
          delete next[serviceId];
          return next;
        });

        // Broadcast update to window so all components and user sessions re-fetch immediately
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("prices_updated"));
      } else {
        throw new Error(res.error || "Failed to save price to Turso.");
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setToast({ type: "error", message: err.message || "Failed to commit price change to Turso." });
    } finally {
      setSavingId(null);
    }
  };

  // Bulk save all edited rows to Turso
  const handleSaveAllChanges = async () => {
    if (totalPendingChanges === 0) return;

    setSavingAll(true);
    try {
      const payloadPrices = Object.entries(editedPrices).map(([sId, data]: [string, any]) => ({
        service_id: sId,
        price: data.price,
        cost_price: data.cost_price,
        service_charge: data.service_charge,
        commission_rate: data.commission_rate,
        price_label: data.price_label,
        is_active: data.is_active,
      }));

      const res = await safeFetchJson<{
        success: boolean;
        source: string;
        message: string;
        services: TursoPriceItem[];
      }>("/api/admin/prices/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ prices: payloadPrices }),
      });

      if (res.ok && res.data?.services) {
        soundFx.playSuccessSound();
        setToast({
          type: "success",
          message: `Successfully saved ${payloadPrices.length} service prices strictly to Turso database!`,
        });
        setPrices(res.data.services);
        setEditedPrices({});

        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("prices_updated"));
      } else {
        throw new Error(res.error || "Failed to save bulk prices to Turso.");
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setToast({ type: "error", message: err.message || "Bulk save to Turso failed." });
    } finally {
      setSavingAll(false);
    }
  };

  // Reset all service prices to defaults in Turso
  const handleResetToDefaults = async () => {
    setResetting(true);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        source: string;
        message: string;
        services: TursoPriceItem[];
      }>("/api/admin/prices/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
      });

      if (res.ok && res.data?.services) {
        soundFx.playSuccessSound();
        setToast({ type: "success", message: "All service prices reset to defaults in Turso database!" });
        setPrices(res.data.services);
        setEditedPrices({});
        setShowResetModal(false);

        window.dispatchEvent(new CustomEvent("site_config_updated"));
        window.dispatchEvent(new CustomEvent("prices_updated"));
      } else {
        throw new Error(res.error || "Failed to reset prices in Turso.");
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setToast({ type: "error", message: err.message || "Could not reset Turso prices." });
    } finally {
      setResetting(false);
    }
  };

  // Export current price table as CSV
  const handleExportCsv = () => {
    if (prices.length === 0) return;
    const headers = ["Service ID", "Service Code", "Name", "Category", "Customer Selling Price (NGN)", "Cost Price (NGN)", "Service Charge (NGN)", "Net Profit (NGN)", "Margin (%)", "Status"];
    const rows = prices.map((p) => {
      const current = editedPrices[p.service_id] || p;
      const profit = current.price - current.cost_price;
      const margin = current.price > 0 ? ((profit / current.price) * 100).toFixed(1) : "0";
      return [
        `"${p.service_id}"`,
        `"${p.service_code}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        current.price,
        current.cost_price,
        current.service_charge,
        profit,
        `"${margin}%"`,
        current.is_active ? "Active" : "Disabled",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartlink_service_prices_turso_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: "info", message: "Price sheet exported successfully." });
  };

  // Category list derived from items
  const categoriesList = useMemo(() => {
    const cats = new Set(prices.map((p) => p.category));
    return ["ALL", ...Array.from(cats)];
  }, [prices]);

  // Filtered & sorted prices
  const displayedPrices = useMemo(() => {
    return prices
      .filter((item) => {
        const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && (editedPrices[item.service_id]?.is_active ?? item.is_active) === 1) ||
          (statusFilter === "INACTIVE" && (editedPrices[item.service_id]?.is_active ?? item.is_active) === 0);

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.service_code.toLowerCase().includes(q) ||
          item.service_id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);

        return matchesCategory && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const aVal = editedPrices[a.service_id] || a;
        const bVal = editedPrices[b.service_id] || b;

        let diff = 0;
        if (sortField === "name") diff = a.name.localeCompare(b.name);
        else if (sortField === "category") diff = a.category.localeCompare(b.category);
        else if (sortField === "price") diff = aVal.price - bVal.price;
        else if (sortField === "cost_price") diff = aVal.cost_price - bVal.cost_price;
        else if (sortField === "profit") {
          const aProfit = aVal.price - aVal.cost_price;
          const bProfit = bVal.price - bVal.cost_price;
          diff = aProfit - bProfit;
        }

        return sortAsc ? diff : -diff;
      });
  }, [prices, editedPrices, searchQuery, selectedCategory, statusFilter, sortField, sortAsc]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = prices.length;
    const active = prices.filter((p) => (editedPrices[p.service_id]?.is_active ?? p.is_active) === 1).length;
    const avgSelling = total > 0 ? Math.round(prices.reduce((s, p) => s + (editedPrices[p.service_id]?.price ?? p.price), 0) / total) : 0;
    const avgCost = total > 0 ? Math.round(prices.reduce((s, p) => s + (editedPrices[p.service_id]?.cost_price ?? p.cost_price), 0) / total) : 0;
    const totalNetPotentialProfit = prices.reduce((s, p) => {
      const cur = editedPrices[p.service_id] || p;
      return s + (cur.price - cur.cost_price);
    }, 0);

    return {
      total,
      active,
      avgSelling,
      avgCost,
      totalNetPotentialProfit,
    };
  }, [prices, editedPrices]);

  const toggleSort = (field: "name" | "price" | "cost_price" | "profit" | "category") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "IDENTITY":
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
      case "CAC":
        return <Building className="w-3.5 h-3.5 text-purple-600" />;
      case "EDUCATION":
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />;
      case "VTU":
        return <Wifi className="w-3.5 h-3.5 text-amber-600" />;
      case "SLIPS":
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-3 transition-all animate-fadeIn ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-300"
              : "bg-blue-50 text-blue-900 border-blue-300"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
          {toast.type === "info" && <Database className="w-4 h-4 text-blue-600" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F2D5C] tracking-tight">
                  Service Price Control
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Turso DB Primary
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, edit, and enforce fees for every existing service. Prices are queried & saved strictly on Turso.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Understanding price calculations and terms"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Pricing Guide</span>
          </button>

          <button
            type="button"
            onClick={() => fetchPricesFromTurso(false)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh prices from Turso"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Turso</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={prices.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export CSV price list"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset all prices to project defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllChanges}
            disabled={totalPendingChanges === 0 || savingAll}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              totalPendingChanges > 0
                ? "bg-[#0F2D5C] hover:bg-[#17407E] active:scale-95 animate-pulse"
                : "bg-slate-300 cursor-not-allowed opacity-60"
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${savingAll ? "animate-spin" : ""}`} />
            <span>
              {savingAll
                ? "Saving to Turso..."
                : totalPendingChanges > 0
                ? `Save All Changes (${totalPendingChanges})`
                : "All Saved in Turso"}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Services</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0F2D5C] font-mono">{metrics.total}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{metrics.active} active services</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Customer Fee</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">₦{metrics.avgSelling.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Selling price across catalog</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Cost Price</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-700 font-mono">₦{metrics.avgCost.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">API provider base charge</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Profit Spread</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            ₦{Math.max(0, metrics.avgSelling - metrics.avgCost).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            {metrics.avgSelling > 0
              ? `${Math.round(((metrics.avgSelling - metrics.avgCost) / metrics.avgSelling) * 100)}% avg margin`
              : "0% margin"}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search service by name, code (e.g. NIN, BVN, WAEC, CAC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]/30 focus:border-[#0F2D5C]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-500 font-bold mr-1">Status:</span>
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#0F2D5C] text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          <span className="text-xs text-slate-400 font-bold shrink-0 mr-1">Category:</span>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-[#0F2D5C] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat !== "ALL" && getCategoryIcon(cat)}
              <span>{cat}</span>
              {cat === "ALL" ? (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{prices.length}</span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                  {prices.filter((p) => p.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pricing Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#0F2D5C] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Querying live service prices from Turso database...</p>
          </div>
        ) : displayedPrices.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No services match the current filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs font-bold text-[#0F2D5C] underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-800" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      <span>Service & Code</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => toggleSort("category")}>
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => toggleSort("cost_price")}>
                    <div className="flex items-center gap-1">
                      <span>API Cost (₦)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => toggleSort("price")}>
                    <div className="flex items-center gap-1 text-[#0F2D5C]">
                      <span>Customer Price (₦)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Service Fee (₦)</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => toggleSort("profit")}>
                    <div className="flex items-center gap-1">
                      <span>Net Profit (₦)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Turso Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {displayedPrices.map((item) => {
                  const edited = editedPrices[item.service_id];
                  const currentPrice = edited ? edited.price : item.price;
                  const currentCost = edited ? edited.cost_price : item.cost_price;
                  const currentCharge = edited ? edited.service_charge : item.service_charge;
                  const currentActive = edited ? Boolean(edited.is_active) : Boolean(item.is_active);

                  const profit = currentPrice - currentCost;
                  const marginPct = currentPrice > 0 ? Math.round((profit / currentPrice) * 100) : 0;
                  const isModified = Boolean(edited);
                  const isSavingThis = savingId === item.service_id;

                  return (
                    <tr
                      key={item.service_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isModified ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {/* 1. Service Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isModified && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Unsaved changes in memory" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400 font-mono text-[10px]">
                          <span>ID: {item.service_id}</span>
                          <span>•</span>
                          <span>CODE: {item.service_code}</span>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </span>
                      </td>

                      {/* 3. API Cost Price Input */}
                      <td className="py-3 px-3">
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={currentCost}
                            onChange={(e) =>
                              handlePriceFieldChange(item.service_id, "cost_price", parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </td>

                      {/* 4. Customer Selling Price (Highlight Input) */}
                      <td className="py-3 px-3">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0F2D5C] font-bold text-xs">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={currentPrice}
                            onChange={(e) =>
                              handlePriceFieldChange(item.service_id, "price", parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-6 pr-2 py-1.5 bg-blue-50/50 border border-blue-300 rounded-lg text-xs font-mono font-extrabold text-[#0F2D5C] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                          />
                        </div>
                        {item.price_label && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[110px]" title={item.price_label}>
                            {item.price_label}
                          </div>
                        )}
                      </td>

                      {/* 5. Service Fee / Charge Input */}
                      <td className="py-3 px-3">
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={currentCharge}
                            onChange={(e) =>
                              handlePriceFieldChange(item.service_id, "service_charge", parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-5 pr-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </td>

                      {/* 6. Net Profit & Margin */}
                      <td className="py-3 px-3">
                        <div
                          className={`font-mono font-bold text-xs ${
                            profit > 0 ? "text-emerald-600" : profit === 0 ? "text-slate-500" : "text-rose-600"
                          }`}
                        >
                          ₦{profit.toLocaleString()}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            marginPct >= 20
                              ? "bg-emerald-100 text-emerald-800"
                              : marginPct > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {marginPct}% margin
                        </span>
                      </td>

                      {/* 7. Active Status Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handlePriceFieldChange(item.service_id, "is_active", currentActive ? 0 : 1)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                            currentActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {currentActive ? "Active" : "Disabled"}
                        </button>
                      </td>

                      {/* 8. Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedServiceForModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0F2D5C] transition-colors cursor-pointer"
                            title="Detailed Edit"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {isModified ? (
                            <button
                              type="button"
                              onClick={() => handleSaveSingleService(item.service_id)}
                              disabled={isSavingThis}
                              className="px-2.5 py-1 rounded-lg bg-[#0F2D5C] hover:bg-[#17407E] text-white text-[11px] font-extrabold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Save changes to Turso"
                            >
                              <Save className={`w-3 h-3 ${isSavingThis ? "animate-spin" : ""}`} />
                              <span>{isSavingThis ? "Saving..." : "Save"}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1" title="Synchronized with Turso">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Synced
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Quick Edit Modal */}
      {selectedServiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left p-6 space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F2D5C] text-white flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F2D5C]">{selectedServiceForModal.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedServiceForModal.service_id} • Turso Schema</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      editedPrices[selectedServiceForModal.service_id]?.price ?? selectedServiceForModal.price
                    }
                    onChange={(e) =>
                      handlePriceFieldChange(selectedServiceForModal.service_id, "price", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl text-sm font-mono font-bold text-[#0F2D5C] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    API / Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      editedPrices[selectedServiceForModal.service_id]?.cost_price ?? selectedServiceForModal.cost_price
                    }
                    onChange={(e) =>
                      handlePriceFieldChange(selectedServiceForModal.service_id, "cost_price", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Service / Processing Fee (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      editedPrices[selectedServiceForModal.service_id]?.service_charge ?? selectedServiceForModal.service_charge
                    }
                    onChange={(e) =>
                      handlePriceFieldChange(selectedServiceForModal.service_id, "service_charge", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      editedPrices[selectedServiceForModal.service_id]?.commission_rate ?? selectedServiceForModal.commission_rate
                    }
                    onChange={(e) =>
                      handlePriceFieldChange(selectedServiceForModal.service_id, "commission_rate", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Price Label / Custom Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. WhatsApp Desk, Select plan, Pay exact amount"
                  value={
                    editedPrices[selectedServiceForModal.service_id]?.price_label ?? (selectedServiceForModal.price_label || "")
                  }
                  onChange={(e) =>
                    handlePriceFieldChange(selectedServiceForModal.service_id, "price_label", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description / Service Details
                </label>
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {selectedServiceForModal.description || "Official SmartLink automated service."}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Service Active on Platform:</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentActive =
                      (editedPrices[selectedServiceForModal.service_id]?.is_active ?? selectedServiceForModal.is_active) === 1;
                    handlePriceFieldChange(selectedServiceForModal.service_id, "is_active", currentActive ? 0 : 1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all cursor-pointer ${
                    (editedPrices[selectedServiceForModal.service_id]?.is_active ?? selectedServiceForModal.is_active) === 1
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-300 text-slate-700"
                  }`}
                >
                  {(editedPrices[selectedServiceForModal.service_id]?.is_active ?? selectedServiceForModal.is_active) === 1
                    ? "Active"
                    : "Disabled"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedServiceForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveSingleService(selectedServiceForModal.service_id);
                  setSelectedServiceForModal(null);
                }}
                disabled={savingId === selectedServiceForModal.service_id}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#0F2D5C] hover:bg-[#17407E] text-white flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Turso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Guide & Terms Glossary Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-left animate-scaleIn">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F2D5C] to-[#1E4D8C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Price Control Terminology Guide</h3>
                  <p className="text-xs text-slate-200">How pricing, costs, service charges, and margins work</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs">
              {/* Card 1: Selling Price / Customer Price */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#0F2D5C] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Selling Price (Customer Price / Final Rate)
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">What the user pays</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  This is the <strong>total fee deducted from the customer's wallet</strong> when they request a service (e.g., verifying a NIN slip or buying WAEC pin).
                </p>
                <div className="text-[11px] font-mono text-emerald-700 bg-white p-2 rounded-lg border border-slate-200">
                  Example: If <strong>Selling Price = ₦180</strong> for NIN Regular Slip, exactly ₦180 is deducted from the customer's wallet balance.
                </div>
              </div>

              {/* Card 2: Cost Price */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#0F2D5C] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Cost Price (Provider Base Cost)
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Your raw cost</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The actual wholesale cost charged by the upstream API provider or government portal (e.g. NIMC, NIBSS, Telco gateway) to execute the query.
                </p>
                <div className="text-[11px] font-mono text-indigo-700 bg-white p-2 rounded-lg border border-slate-200">
                  Example: The NIMC/LumiID gateway charges you <strong>₦50</strong> per query. That is your <strong>Cost Price</strong>.
                </div>
              </div>

              {/* Card 3: Profit Spread & Margin */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#0F2D5C] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Profit Spread &amp; Profit Margin (%)
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Your net gain</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The net profit earned on each successful transaction:
                </p>
                <div className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div><strong>Profit (₦)</strong> = Selling Price (₦180) - Cost Price (₦50) = <strong>₦130 gain per transaction</strong></div>
                  <div><strong>Margin (%)</strong> = (Profit ÷ Selling Price) × 100 = (₦130 ÷ ₦180) × 100 = <strong>72.2%</strong></div>
                </div>
              </div>

              {/* Card 4: Service Charge & Commission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    Service Charge
                  </span>
                  <p className="text-[11px] text-slate-500">
                    An optional fixed processing or convenience charge included within the transaction breakdown.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-purple-600" />
                    Commission Rate (%)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    The percentage allocated to agents, partners, or corporate developer API consumers on resale.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#0F2D5C] hover:bg-[#17407E] text-white cursor-pointer transition-colors"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left p-6 space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Reset All Prices in Turso?</h3>
              <p className="text-xs text-slate-500">
                This will overwrite all service prices currently stored in the Turso database with the factory default pricing matrix.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={resetting}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                <span>{resetting ? "Resetting on Turso..." : "Confirm Turso Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
