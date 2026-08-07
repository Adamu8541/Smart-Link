/**
 * SmartLink Admin Panel — Wallet Statement Generator Modal (Module 4)
 * Allows generating PDF, CSV, or Excel wallet statements with running balance ledger.
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Wallet
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthService";

interface WalletStatementModalProps {
  user: any;
  session: AdminSession;
  onClose: () => void;
}

export function WalletStatementModal({ user, session, onClose }: WalletStatementModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [format, setFormat] = useState<"CSV" | "EXCEL" | "PDF">("PDF");

  const [generating, setGenerating] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/wallets/${user.userId || user.uid}/statement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          format,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate statement.");
      }

      setStatementData(data.statement);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!statementData) return;
    const items = statementData.items || [];
    let csv = `Date,Reference,Type,Description,Debit (NGN),Credit (NGN),Running Balance (NGN)\n`;

    items.forEach((item: any) => {
      csv += `"${new Date(item.date).toLocaleString()}","${item.reference}","${item.type}","${item.description.replace(/"/g, '""')}",${item.debit},${item.credit},${item.runningBalance}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Wallet_Statement_${user.email}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Financial Wallet Statement</h3>
              <p className="text-xs text-slate-400">Export audited ledger statements with running balance</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          {!statementData ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
                <span className="text-slate-400 block">Target Account</span>
                <div className="font-bold text-white text-sm">{user?.fullName}</div>
                <div className="text-slate-400 font-mono">{user?.email} • Wallet ID: <strong className="text-emerald-400">WLT_{user?.userId || user?.uid}</strong></div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Quick Period Presets</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePreset(7)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer">
                    Last 7 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(30)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer">
                    Last 30 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(90)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer">
                    Last 90 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(365)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer">
                    Last 1 Year
                  </button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Statement Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat("PDF")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "PDF" ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText className="h-5 w-5" /> Printable PDF Statement
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("CSV")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "CSV" ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5" /> CSV Spreadsheet
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("EXCEL")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "EXCEL" ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5" /> Excel Document
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Generate Statement
                </button>
              </div>
            </form>
          ) : (
            /* Generated Statement View */
            <div className="space-y-6">
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 print:p-0 print:bg-white print:text-slate-900">
                {/* Statement Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-white print:text-slate-900">SmartLink Financial Statement</h2>
                    <p className="text-xs text-emerald-400 font-mono">Statement ID: {statementData.statementId}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Period: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div className="font-bold text-white print:text-slate-900">{statementData.user.fullName}</div>
                    <div>{statementData.user.email}</div>
                    <div className="font-mono text-emerald-400">{statementData.user.walletId}</div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Opening Balance</span>
                    <span className="font-mono font-bold text-slate-200">₦{statementData.summary.openingBalance.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Total Credits (+)</span>
                    <span className="font-mono font-bold text-emerald-400">₦{statementData.summary.totalCredits.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Total Debits (-)</span>
                    <span className="font-mono font-bold text-red-400">₦{statementData.summary.totalDebits.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Closing Balance</span>
                    <span className="font-mono font-bold text-white">₦{statementData.summary.closingBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Debit (₦)</th>
                        <th className="py-2.5 px-3 text-right">Credit (₦)</th>
                        <th className="py-2.5 px-3 text-right">Running Bal (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {statementData.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-400">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-slate-300">{item.reference}</td>
                          <td className="py-2 px-3 text-slate-200 font-sans text-xs">{item.description}</td>
                          <td className="py-2 px-3 text-right text-red-400">{item.debit > 0 ? `₦${item.debit.toLocaleString()}` : "-"}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{item.credit > 0 ? `₦${item.credit.toLocaleString()}` : "-"}</td>
                          <td className="py-2 px-3 text-right font-bold text-white">₦{item.runningBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statement Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatementData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Change Dates / Format
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Download className="h-4 w-4" /> Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Printer className="h-4 w-4" /> Print / Save PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
