/**
 * SmartLink Admin Panel — Reports & Financial Settlements View
 * Live Firestore Aggregation & Homepage Theme Matching
 */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Filter,
  BarChart3,
  Layers,
  ArrowDownToLine,
  ShieldCheck,
  Zap
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";
import { getAuthHeaders } from "../../../services/providerService";

interface SettlementReport {
  id: string;
  title: string;
  period: string;
  totalTransactions: number;
  totalVolume: number;
  successfulVolume: number;
  feeRevenue: number;
  generatedAt: string;
  status: string;
}

interface ReportsMetrics {
  totalVolume: number;
  successfulVolume: number;
  feeRevenue: number;
  totalUsers: number;
  totalTransactions: number;
}

interface AdminReportsViewProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminReportsView({ session, onNavigate }: AdminReportsViewProps) {
  const [reports, setReports] = useState<SettlementReport[]>([]);
  const [metrics, setMetrics] = useState<ReportsMetrics>({
    totalVolume: 0,
    successfulVolume: 0,
    feeRevenue: 0,
    totalUsers: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/reports", {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.reports)) setReports(data.reports);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err: any) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = (report: SettlementReport) => {
    setExporting(report.id);
    setTimeout(() => {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        `Report Title,${report.title}\n` +
        `Period,${report.period}\n` +
        `Generated At,${report.generatedAt}\n` +
        `Total Transactions,${report.totalTransactions}\n` +
        `Total Volume (NGN),${report.totalVolume}\n` +
        `Successful Settlement Volume (NGN),${report.successfulVolume}\n` +
        `Platform Fee Revenue (NGN),${report.feeRevenue}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SmartLink_${report.id}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(null);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#0F2D5C]">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0F2D5C] text-xs font-semibold mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Financial Settlement & Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Reports & Financial Settlement Ledger
            </h1>
            <p className="text-xs md:text-sm text-[#4B5563] mt-0.5">
              Live transaction volume audits, service reconciliation summaries, and financial statement exports powered by Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReports}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F5F7FA] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Gross Transaction Volume</span>
          <p className="text-2xl font-bold text-[#111827]">₦{metrics.totalVolume.toLocaleString()}</p>
          <span className="text-[11px] text-[#4B5563]">All lifetime processed orders</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Successful Settlements</span>
          <p className="text-2xl font-bold text-emerald-600">₦{metrics.successfulVolume.toLocaleString()}</p>
          <span className="text-[11px] text-[#4B5563]">Completed & delivered value</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Platform Fee Revenue</span>
          <p className="text-2xl font-bold text-[#0F2D5C]">₦{metrics.feeRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Service charges & margins</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-1">
          <span className="text-xs font-semibold text-[#4B5563]">Total Audit Count</span>
          <p className="text-2xl font-bold text-[#111827]">{metrics.totalTransactions.toLocaleString()}</p>
          <span className="text-[11px] text-[#4B5563]">Logged Firestore transactions</span>
        </div>
      </div>

      {/* Reports Available Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.06)] overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F2D5C]">
            <Layers className="h-4 w-4" />
            <span>Generated Settlement Reports & Statements</span>
          </div>
          <span className="text-xs text-[#6B7280]">Real-time Database Aggregates</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-[#4B5563]">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0F2D5C] mb-2" />
              <span>Calculating live settlement numbers...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-[#4B5563]">
              <FileText className="h-8 w-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#111827]">No settlement reports available</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#0F2D5C]/30 transition-all"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#111827]">{report.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563]">
                    Period: <strong className="text-[#111827]">{report.period}</strong> • Total Transactions:{" "}
                    <strong className="text-[#111827]">{report.totalTransactions.toLocaleString()}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#6B7280]">
                    <span>
                      Volume: <strong className="text-[#111827]">₦{report.totalVolume.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Settled: <strong className="text-emerald-700">₦{report.successfulVolume.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportCSV(report)}
                  disabled={exporting === report.id}
                  className="py-2 px-4 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {exporting === report.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  )}
                  <span>Export CSV</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
