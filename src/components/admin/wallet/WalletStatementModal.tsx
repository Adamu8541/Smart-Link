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
import { AdminSession } from "../../../services/adminAuthTypes";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-[#111827] border border-[#111827] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-5 bg-[#111827] border-b border-[#111827] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Financial Wallet Statement</h3>
              <p className="text-xs text-[#9CA3AF]">Export audited ledger statements with running balance</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-[#0F2D5C]/60 border border-[#0F2D5C] rounded-xl text-[#9CA3AF] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          {!statementData ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl text-xs space-y-1">
                <span className="text-[#9CA3AF] block">Target Account</span>
                <div className="font-bold text-white text-sm">{user?.fullName}</div>
                <div className="text-[#9CA3AF] font-mono">{user?.email} • Wallet ID: <strong className="text-[#9CA3AF]">WLT_{user?.userId || user?.uid}</strong></div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#E5E7EB]">Quick Period Presets</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePreset(7)} className="px-3 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs rounded-lg cursor-pointer">
                    Last 7 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(30)} className="px-3 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs rounded-lg cursor-pointer">
                    Last 30 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(90)} className="px-3 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs rounded-lg cursor-pointer">
                    Last 90 Days
                  </button>
                  <button type="button" onClick={() => handlePreset(365)} className="px-3 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs rounded-lg cursor-pointer">
                    Last 1 Year
                  </button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white text-xs focus:outline-none focus:border-[#0F2D5C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E5E7EB] mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white text-xs focus:outline-none focus:border-[#0F2D5C]"
                    required
                  />
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-2">Statement Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat("PDF")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "PDF" ? "bg-[#0F2D5C]/80 border-[#0F2D5C] text-[#9CA3AF]" : "bg-[#111827] border-[#111827] text-[#9CA3AF] hover:text-[#E5E7EB]"
                    }`}
                  >
                    <FileText className="h-5 w-5" /> Printable PDF Statement
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("CSV")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "CSV" ? "bg-[#0F2D5C]/80 border-[#0F2D5C] text-[#9CA3AF]" : "bg-[#111827] border-[#111827] text-[#9CA3AF] hover:text-[#E5E7EB]"
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5" /> CSV Spreadsheet
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("EXCEL")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      format === "EXCEL" ? "bg-[#0F2D5C]/80 border-[#0F2D5C] text-[#9CA3AF]" : "bg-[#111827] border-[#111827] text-[#9CA3AF] hover:text-[#E5E7EB]"
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5" /> Excel Document
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#111827]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Generate Statement
                </button>
              </div>
            </form>
          ) : (
            /* Generated Statement View */
            <div className="space-y-6">
              <div className="p-6 bg-[#111827] border border-[#111827] rounded-3xl space-y-4 print:p-0 print:bg-white print:text-[#111827]">
                {/* Statement Header */}
                <div className="flex items-start justify-between border-b border-[#111827] pb-4">
                  <div>
                    <h2 className="text-lg font-black text-white print:text-[#111827]">SmartLink Financial Statement</h2>
                    <p className="text-xs text-[#9CA3AF] font-mono">Statement ID: {statementData.statementId}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">Period: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right text-xs text-[#9CA3AF]">
                    <div className="font-bold text-white print:text-[#111827]">{statementData.user.fullName}</div>
                    <div>{statementData.user.email}</div>
                    <div className="font-mono text-[#9CA3AF]">{statementData.user.walletId}</div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl">
                    <span className="text-[#6B7280] block text-[10px]">Opening Balance</span>
                    <span className="font-mono font-bold text-[#E5E7EB]">₦{statementData.summary.openingBalance.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl">
                    <span className="text-[#6B7280] block text-[10px]">Total Credits (+)</span>
                    <span className="font-mono font-bold text-[#9CA3AF]">₦{statementData.summary.totalCredits.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl">
                    <span className="text-[#6B7280] block text-[10px]">Total Debits (-)</span>
                    <span className="font-mono font-bold text-[#9CA3AF]">₦{statementData.summary.totalDebits.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl">
                    <span className="text-[#6B7280] block text-[10px]">Closing Balance</span>
                    <span className="font-mono font-bold text-white">₦{statementData.summary.closingBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto border border-[#111827] rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#111827] text-[#9CA3AF] uppercase tracking-wider text-[10px] font-bold">
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
                        <tr key={idx} className="hover:bg-[#111827]/40">
                          <td className="py-2 px-3 text-[#9CA3AF]">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-[#E5E7EB]">{item.reference}</td>
                          <td className="py-2 px-3 text-[#E5E7EB] font-sans text-xs">{item.description}</td>
                          <td className="py-2 px-3 text-right text-[#9CA3AF]">{item.debit > 0 ? `₦${item.debit.toLocaleString()}` : "-"}</td>
                          <td className="py-2 px-3 text-right text-[#9CA3AF]">{item.credit > 0 ? `₦${item.credit.toLocaleString()}` : "-"}</td>
                          <td className="py-2 px-3 text-right font-bold text-white">₦{item.runningBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statement Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#111827]">
                <button
                  type="button"
                  onClick={() => setStatementData(null)}
                  className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Change Dates / Format
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Download className="h-4 w-4" /> Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
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
