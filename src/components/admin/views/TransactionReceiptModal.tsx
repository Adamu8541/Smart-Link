import React from "react";
import { X, Printer, Download, Share2, CheckCircle2, AlertTriangle, Clock, RefreshCw, ShieldCheck, FileText } from "lucide-react";

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  user: any;
}

export function TransactionReceiptModal({ isOpen, onClose, transaction, user }: TransactionReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Generate downloadable text representation / trigger print view as PDF
    const element = document.createElement("a");
    const file = new Blob([
      `==================================================\n` +
      `             SMARTLINK DIGITAL RECEIPT            \n` +
      `==================================================\n` +
      `SmartLink Ref: ${transaction.smartLinkRef || transaction.id}\n` +
      `Provider Ref: ${transaction.providerRef || "N/A"}\n` +
      `Date & Time: ${transaction.date} ${transaction.time}\n` +
      `Status: ${transaction.status}\n` +
      `--------------------------------------------------\n` +
      `CUSTOMER INFORMATION:\n` +
      `Name: ${user?.fullName || transaction.userName || "SmartLink Customer"}\n` +
      `Email: ${user?.email || transaction.userEmail || "N/A"}\n` +
      `Phone: ${user?.phoneNumber || transaction.userPhone || "N/A"}\n` +
      `--------------------------------------------------\n` +
      `TRANSACTION DETAILS:\n` +
      `Service: ${transaction.serviceName || transaction.serviceType}\n` +
      `Provider: ${transaction.provider || "VTU Gateway"}\n` +
      `Payment Method: ${transaction.paymentMethod || "WALLET"}\n` +
      `Amount: ₦${(transaction.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
      `Charges: ₦${(transaction.charges || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
      `TOTAL PAID: ₦${((transaction.amount || 0) + (transaction.charges || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
      `--------------------------------------------------\n` +
      `Thank you for transacting with SmartLink Digital!\n` +
      `==================================================\n`
    ], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${transaction.smartLinkRef || transaction.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `SmartLink Receipt - ${transaction.smartLinkRef || transaction.id}`,
        text: `SmartLink Digital Receipt for ${transaction.serviceName || transaction.serviceType} (₦${(transaction.amount || 0).toLocaleString()}). Status: ${transaction.status}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`SmartLink Receipt ${transaction.smartLinkRef || transaction.id} - ₦${(transaction.amount || 0).toLocaleString()} [${transaction.status}]`);
      alert("Receipt link copied to clipboard!");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-700/80";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-950/70 text-red-300 border-red-700/80";
      case "REFUNDED":
      case "REVERSED":
        return "bg-blue-950/70 text-blue-300 border-blue-700/80";
      default:
        return "bg-amber-950/70 text-amber-300 border-amber-700/80";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[#111827] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#111827] flex items-center justify-between bg-[#111827]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F2D5C]/80 border border-[#0F2D5C]/80 rounded-xl text-[#9CA3AF]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Official Transaction Receipt</h2>
              <p className="text-xs text-[#9CA3AF] font-mono">Ref: {transaction.smartLinkRef || transaction.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#111827] text-[#9CA3AF] hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Canvas Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-[#111827] print:bg-white print:text-black">
          {/* SmartLink Header */}
          <div className="text-center pb-6 border-b border-[#111827]/80 print:border-black">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-lg font-black text-white tracking-wider uppercase print:text-black">SMARTLINK DIGITAL</span>
            </div>
            <p className="text-xs text-[#9CA3AF] print:text-[#4B5563]">Smart Link Digital Identity & Payment Infrastructure</p>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5 print:text-[#6B7280]">Official Electronic Receipt • Issued {transaction.date} {transaction.time}</p>
          </div>

          {/* Status Badge Stamp */}
          <div className="flex justify-center">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(transaction.status)}`}>
              {(transaction.status === "SUCCESSFUL" || transaction.status === "COMPLETED") && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {(transaction.status === "FAILED" || transaction.status === "CANCELLED") && <AlertTriangle className="h-4 w-4 text-red-400" />}
              {transaction.status === "PENDING" && <Clock className="h-4 w-4 text-amber-400 animate-spin" />}
              {(transaction.status === "REFUNDED" || transaction.status === "REVERSED") && <RefreshCw className="h-4 w-4 text-blue-400" />}
              <span>{transaction.status}</span>
            </div>
          </div>

          {/* Reference Numbers Table */}
          <div className="bg-[#111827]/60 border border-[#111827]/80 rounded-2xl p-4 space-y-2 text-xs print:bg-[#E5E7EB] print:border-[#E5E7EB]">
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF] print:text-[#4B5563]">SmartLink Ref:</span>
              <span className="font-mono font-bold text-white print:text-black">{transaction.smartLinkRef || transaction.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF] print:text-[#4B5563]">Provider Ref:</span>
              <span className="font-mono font-bold text-[#E5E7EB] print:text-black">{transaction.providerRef || "PRV-PENDING"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9CA3AF] print:text-[#4B5563]">Payment Gateway:</span>
              <span className="font-medium text-[#E5E7EB] print:text-black">{transaction.provider || "VTU Gateway"}</span>
            </div>
          </div>

          {/* Customer & Service Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-[#111827]/40 border border-[#111827]/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Customer</span>
              <p className="font-bold text-white truncate">{user?.fullName || transaction.userName || "Customer"}</p>
              <p className="text-[#9CA3AF] text-[11px] truncate">{user?.email || transaction.userEmail}</p>
              <p className="text-[#9CA3AF] text-[11px] font-mono">{user?.phoneNumber || transaction.userPhone}</p>
            </div>
            <div className="p-3.5 bg-[#111827]/40 border border-[#111827]/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Payment Method</span>
              <p className="font-bold text-white uppercase">{transaction.paymentMethod || "WALLET"}</p>
              <p className="text-[#9CA3AF] text-[11px] truncate">{transaction.walletUsed || "Main Wallet Float"}</p>
              <p className="text-[#9CA3AF] text-[10px] font-bold">100% Encrypted Ledger</p>
            </div>
          </div>

          {/* Line Items Breakdown */}
          <div className="border border-[#111827]/80 rounded-2xl overflow-hidden text-xs">
            <div className="bg-[#111827]/80 p-3 font-bold text-[#E5E7EB] border-b border-[#111827] flex justify-between">
              <span>Service Description</span>
              <span>Amount</span>
            </div>
            <div className="p-4 space-y-3 bg-[#111827]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white">{transaction.serviceName || transaction.serviceType}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{transaction.description || "Digital Service Execution"}</p>
                </div>
                <span className="font-mono font-bold text-white">₦{(transaction.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>

              {transaction.charges > 0 && (
                <div className="flex justify-between items-center text-[#9CA3AF] pt-2 border-t border-[#111827]/60">
                  <span>Convenience / Processing Fee</span>
                  <span className="font-mono">₦{(transaction.charges || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center font-bold text-sm text-[#9CA3AF] pt-3 border-t border-[#111827]">
                <span>Total Paid</span>
                <span className="font-mono text-base">₦{((transaction.amount || 0) + (transaction.charges || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Security Verification Footer */}
          <div className="pt-2 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9CA3AF]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <span>Verified SmartLink Digital Cryptographic Ledger Entry</span>
            </div>
            <p className="text-[10px] text-[#6B7280] font-mono">For support inquiries, contact support@smartlink.com or +234 803 123 4567.</p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 border-t border-[#111827] bg-[#111827]/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Share2 className="h-4 w-4 text-[#9CA3AF]" /> Share
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4 text-[#9CA3AF]" /> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-none transition-all"
            >
              <Download className="h-4 w-4" /> Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
