/**
 * SmartLink Admin Panel — Reports & Financial Settlements View
 * Live Cloud Database Aggregation & Homepage Theme Matching
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
    <div className="space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-2xl text-blue-400">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800 text-xs font-semibold mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Financial Settlement & Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Reports & Financial Settlement Ledger
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Live transaction volume audits, service reconciliation summaries, and financial statement exports powered by our database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReports}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : "text-slate-400"}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400">Gross Transaction Volume</span>
          <p className="text-2xl font-bold text-white font-mono">₦{metrics.totalVolume.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">All lifetime processed orders</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400">Successful Settlements</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">₦{metrics.successfulVolume.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">Completed & delivered value</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400">Platform Fee Revenue</span>
          <p className="text-2xl font-bold text-blue-400 font-mono">₦{metrics.feeRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-blue-400 font-medium">Service charges & margins</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Audit Count</span>
          <p className="text-2xl font-bold text-white font-mono">{metrics.totalTransactions.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">Logged system database transactions</span>
        </div>
      </div>

      {/* Reports Available Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>Generated Settlement Reports & Statements</span>
          </div>
          <span className="text-xs text-slate-500">Real-time Database Aggregates</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400 mb-2" />
              <span>Calculating live settlement numbers...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-200">No settlement reports available</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-500/40 transition-all"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{report.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Period: <strong className="text-white">{report.period}</strong> • Total Transactions:{" "}
                    <strong className="text-white">{report.totalTransactions.toLocaleString()}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                    <span>
                      Volume: <strong className="text-white">₦{report.totalVolume.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Settled: <strong className="text-emerald-400">₦{report.successfulVolume.toLocaleString()}</strong>
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
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
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
