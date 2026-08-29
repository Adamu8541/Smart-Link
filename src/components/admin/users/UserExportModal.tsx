/**
 * SmartLink Admin Panel — Module 3 User Data Export Engine (CSV, Excel, PDF)
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  Sparkles
} from "lucide-react";
import { UserProfile } from "../../../types";

interface UserExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersToExport: UserProfile[];
  activeFilterSummary: string;
}

export function UserExportModal({ isOpen, onClose, usersToExport, activeFilterSummary }: UserExportModalProps) {
  if (!isOpen) return null;

  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // 1. Export CSV
  const handleExportCSV = () => {
    const headers = [
      "User ID",
      "Full Name",
      "Username",
      "Email Address",
      "Phone Number",
      "Role",
      "Account Status",
      "Verification Status",
      "Wallet Balance (NGN)",
      "Registration Date",
      "Last Login",
    ];

    const rows = usersToExport.map((u) => [
      `"${u.uid}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${(u as any).username || ""}"`,
      `"${u.email}"`,
      `"${u.phoneNumber || ""}"`,
      `"${u.role}"`,
      `"${u.status || "ACTIVE"}"`,
      `"${(u as any).verificationStatus || (u.isVerified ? "VERIFIED" : "UNVERIFIED")}"`,
      (u.walletBalance || 0).toFixed(2),
      `"${u.createdAt ? new Date(u.createdAt).toISOString() : ""}"`,
      `"${u.lastLogin ? new Date(u.lastLogin).toISOString() : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartlink_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Excel (TSV format compatible with Excel)
  const handleExportExcel = () => {
    const headers = [
      "User ID\tFull Name\tUsername\tEmail Address\tPhone Number\tRole\tAccount Status\tVerification Status\tWallet Balance (NGN)\tRegistration Date\tLast Login",
    ];

    const rows = usersToExport.map(
      (u) =>
        `${u.uid}\t${u.fullName}\t${(u as any).username || ""}\t${u.email}\t${u.phoneNumber || ""}\t${u.role}\t${u.status || "ACTIVE"}\t${
          (u as any).verificationStatus || (u.isVerified ? "VERIFIED" : "UNVERIFIED")
        }\t${(u.walletBalance || 0).toFixed(2)}\t${u.createdAt || ""}\t${u.lastLogin || ""}`
    );

    const blob = new Blob([[headers, ...rows].join("\n")], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartlink_users_report_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Trigger Printable PDF View
  const handlePrintPDF = () => {
    setShowPdfPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const totalWalletSum = usersToExport.reduce((acc, u) => acc + (u.walletBalance || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Export & Compliance Engine</span>
            <h3 className="text-base font-bold text-white">Export Users Directory Data</h3>
            <p className="text-xs text-slate-400">Exporting <strong className="text-emerald-400 font-bold">{usersToExport.length} user records</strong> based on active filter set.</p>
          </div>
        </div>

        {/* Filter Specs */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 mb-5 space-y-1">
          <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Active Export Scope:</p>
          <p className="font-medium text-white">{activeFilterSummary || "All Active User Records"}</p>
          <p className="text-slate-400 text-[11px]">Total Combined Wallet Balance: <strong className="text-emerald-400">₦{totalWalletSum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong></p>
        </div>

        {/* Export Options */}
        <div className="space-y-3 text-xs mb-6">
          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Download Standard CSV (.csv)</p>
                <p className="text-slate-400 text-[11px]">Raw comma-separated dataset for database import or custom script processing.</p>
              </div>
            </div>
            <Download className="h-4 w-4 text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-600 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-950 border border-blue-800 rounded-xl text-blue-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Download Microsoft Excel (.xls)</p>
                <p className="text-slate-400 text-[11px]">Tab-delimited spreadsheet pre-formatted for Excel & financial audit tools.</p>
              </div>
            </div>
            <Download className="h-4 w-4 text-blue-400" />
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-600 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-950 border border-purple-800 rounded-xl text-purple-400 group-hover:scale-105 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Printable Audit PDF Document</p>
                <p className="text-slate-400 text-[11px]">Formatted printable executive summary report with seal and signature block.</p>
              </div>
            </div>
            <Printer className="h-4 w-4 text-purple-400" />
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
