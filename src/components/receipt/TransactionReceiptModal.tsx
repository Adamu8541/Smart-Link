import React, { useState } from "react";
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
import { QRCodeSVG } from "./QRCodeSVG";

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
  const providerRef = receipt?.providerRef || (receipt as any)?.providerReference || (receipt as any)?.monnifyReference || transaction?.providerReference || "PROV-PENDING";
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
  const paymentMethod = receipt?.paymentMethod || transaction?.paymentMethod || "Monnify Reserved Virtual Account";
  const userName = receipt?.userName || (receipt as any)?.userEmail || "Verified User";
  const userEmail = receipt?.userEmail || "user@smartlink.com";
  const balanceBefore = receipt?.balanceBefore ?? (receipt as any)?.previousBalance ?? transaction?.balanceBefore;
  const balanceAfter = receipt?.balanceAfter ?? (receipt as any)?.newBalance ?? transaction?.balanceAfter;

  const qrData = `SMARTLINK-RECEIPT|REF:${ref}|STATUS:${status}|AMOUNT:${totalAmount}NGN|DATE:${formattedDate}`;

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
      const res = await fetch("/api/monnify/receipt/email", {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
          isDarkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        } print:border-none print:shadow-none print:w-full print:max-w-none print:absolute print:inset-0`}
      >
        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
                SL
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  SmartLink Digital
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official Financial Transaction Receipt
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge & Amount */}
          <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              {status === "SUCCESSFUL" && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Transaction Successful
                </span>
              )}
              {status === "PENDING" && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Processing Transaction
                </span>
              )}
              {status === "FAILED" && (
                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Transaction Failed
                </span>
              )}
              {status === "REFUNDED" && (
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Refunded to Wallet
                </span>
              )}
            </div>

            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {title}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">SmartLink Ref:</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-slate-200 flex items-center gap-1">
                {ref}
                <button
                  onClick={handleCopyRef}
                  className="text-slate-400 hover:text-blue-600 transition-colors print:hidden"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Provider Ref:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{providerRef}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Payer Name:</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{userName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Recipient / Beneficiary:</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{recipient}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
              <span className="text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Payment Channel:</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{paymentMethod}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Service Base Cost:</span>
              <span className="text-slate-700 dark:text-slate-300">₦{amount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Service Fee / Charge:</span>
              <span className="text-slate-700 dark:text-slate-300">₦{charge.toLocaleString()}</span>
            </div>

            {balanceBefore !== undefined && balanceAfter !== undefined && (
              <div className="flex justify-between py-1.5 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-lg mt-2">
                <span className="text-slate-500 dark:text-slate-400">Wallet Balance (Before / After):</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  ₦{balanceBefore.toLocaleString()} ➔ ₦{balanceAfter.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* QR Code & Footer Security Seal */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Verified Digital Receipt
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px]">
                Scan QR code to verify authenticity on SmartLink core network.
              </p>
            </div>
            <QRCodeSVG value={qrData} size={70} />
          </div>
        </div>

        {/* Modal Actions Footer */}
        {emailStatus && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/70 border-t border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold text-center">
            {emailStatus}
          </div>
        )}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            <button
              onClick={handleEmailReceipt}
              disabled={sendingEmail}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              {sendingEmail ? "Sending..." : "Email"}
            </button>
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied Link!" : "Share"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
