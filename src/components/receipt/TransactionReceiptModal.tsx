import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Mail
} from "lucide-react";
import { ReceiptDocument, TransactionDocument } from "../../types/database";

interface TransactionReceiptModalProps {
  receipt?: ReceiptDocument | null;
  transaction?: TransactionDocument | null;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  receipt,
  transaction,
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Normalize data between receipt & transaction
  const ref = receipt?.smartlinkRef || (receipt as any)?.smartlinkReference || transaction?.smartlinkReference || "SL-RECEIPT-00000";
  const providerRef = receipt?.providerRef || (receipt as any)?.providerReference || transaction?.providerReference || "PROV-PENDING";
  const title = receipt?.title || transaction?.service || "SmartLink Wallet Funding";
  const amount = receipt?.amount ?? transaction?.amount ?? 0;
  const charge = receipt?.charge ?? transaction?.charge ?? 0;
  const totalAmount = amount + charge;
  const status = receipt?.status || transaction?.status || "SUCCESSFUL";
  const dateStr = receipt?.issueTimestamp || (receipt as any)?.createdAt || transaction?.createdAt || new Date().toISOString();
  const formattedDate = new Date(dateStr).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "medium"
  });
  const recipient = receipt?.recipient || transaction?.recipient || "Self";
  const paymentMethod = receipt?.paymentMethod || transaction?.paymentMethod || "Virtual Bank Account";
  const userName = receipt?.userName || (receipt as any)?.userEmail || "Verified User";
  const userEmail = receipt?.userEmail || "user@smartlink.com";
  const balanceBefore = receipt?.balanceBefore ?? (receipt as any)?.previousBalance ?? transaction?.balanceBefore;
  const balanceAfter = receipt?.balanceAfter ?? (receipt as any)?.newBalance ?? transaction?.balanceAfter;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/receipt/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: ref, email: userEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatus(`Receipt sent to ${data.email || userEmail}!`);
      } else {
        setEmailStatus(data.error || "Failed to send receipt email.");
      }
    } catch (err: any) {
      setEmailStatus("Error connecting to email service.");
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `SmartLink Receipt - ${ref}`,
        text: `Transaction Receipt for ${title} - ₦${totalAmount.toLocaleString()} (${status}). Ref: ${ref}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyRef();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full max-w-lg mb-8 rounded-2xl shadow-2xl overflow-hidden border ${
          isDarkMode
            ? "bg-[#111827] border-[#111827] text-[#E5E7EB]"
            : "bg-white border-[#E5E7EB] text-[#111827]"
        } print:border-none print:shadow-none print:w-full print:max-w-none print:absolute print:inset-0`}
      >
        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#111827]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
                SL
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#111827] dark:text-white leading-tight">
                  SmartLink Digital
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Official Financial Transaction Receipt
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge & Amount */}
          <div className="text-center py-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl border border-[#E5E7EB] dark:border-[#111827]/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              {status === "SUCCESSFUL" && (
                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Transaction Successful
                </span>
              )}
              {status === "PENDING" && (
                <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Processing Transaction
                </span>
              )}
              {status === "FAILED" && (
                <span className="bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  Transaction Failed
                </span>
              )}
              {status === "REFUNDED" && (
                <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Refunded to Wallet
                </span>
              )}
            </div>

            <div className="text-3xl font-black text-[#111827] dark:text-white tracking-tight">
              ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              {title}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">SmartLink Ref:</span>
              <span className="font-semibold font-mono text-[#111827] dark:text-[#E5E7EB] flex items-center gap-1">
                {ref}
                <button
                  onClick={handleCopyRef}
                  className="text-[#9CA3AF] hover:text-[#0F2D5C] transition-colors print:hidden"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#0F2D5C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Provider Ref:</span>
              <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">{providerRef}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Payer Name:</span>
              <span className="font-medium text-[#111827] dark:text-[#E5E7EB]">{userName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Recipient / Beneficiary:</span>
              <span className="font-medium text-[#111827] dark:text-[#E5E7EB]">{recipient}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Date & Time:</span>
              <span className="text-[#4B5563] dark:text-[#E5E7EB]">{formattedDate}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Payment Channel:</span>
              <span className="font-medium text-[#111827] dark:text-[#E5E7EB]">{paymentMethod}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Service Base Cost:</span>
              <span className="text-[#4B5563] dark:text-[#E5E7EB]">₦{amount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#111827]">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">Service Fee / Charge:</span>
              <span className="text-[#4B5563] dark:text-[#E5E7EB]">₦{charge.toLocaleString()}</span>
            </div>

            {balanceBefore !== undefined && balanceAfter !== undefined && (
              <div className="flex justify-between py-1.5 bg-[#F5F7FA] dark:bg-[#111827]/40 px-3 rounded-lg mt-2">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Wallet Balance (Before / After):</span>
                <span className="font-medium text-[#111827] dark:text-[#E5E7EB]">
                  ₦{balanceBefore.toLocaleString()} ➔ ₦{balanceAfter.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Footer Security Seal */}
          <div className="flex items-center justify-between p-4 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-xl border border-[#E5E7EB]/60 dark:border-[#111827]">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#0F2D5C]" />
                Verified Digital Receipt
              </div>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Official transaction record verified on SmartLink core network.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#0F2D5C]/10 text-[#0F2D5C] dark:text-[#9CA3AF] font-mono text-[11px] font-bold">
              VERIFIED
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        {emailStatus && (
          <div className="px-4 py-2 bg-[#F5F7FA] dark:bg-[#0F2D5C]/70 border-t border-[#E5E7EB] dark:border-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] text-xs font-semibold text-center">
            {emailStatus}
          </div>
        )}
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/90 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            <button
              onClick={handleEmailReceipt}
              disabled={sendingEmail}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-[#0F2D5C]" />
              {sendingEmail ? "Sending..." : "Email"}
            </button>
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-semibold hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied Link!" : "Share"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
