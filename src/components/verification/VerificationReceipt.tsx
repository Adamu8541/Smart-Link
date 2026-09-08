import React, { useState } from "react";
import { X, Download, Printer, ShieldCheck, FileText, CheckCircle2, QrCode, CreditCard, Mail, Send, Check } from "lucide-react";
import { StandardizedVerificationResult } from "../../types/verification";
import { EmailSlipService } from "../../services/emailSlipService";
import { auth } from "../../firebase";

interface VerificationReceiptProps {
  result: StandardizedVerificationResult;
  onClose: () => void;
  onGenerateSlip?: () => void;
}

export const VerificationReceipt: React.FC<VerificationReceiptProps> = ({
  result,
  onClose,
  onGenerateSlip,
}) => {
  const isSlipSupported = result.service === "NIN" || result.service === "BVN" || result.service === "PHONE";
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickEmailDispatch = async () => {
    const user = auth.currentUser;
    const userId = user?.uid || "guest_user";
    const userEmail = user?.email || "adamuamuhammad8541@gmail.com";

    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    try {
      const res = await EmailSlipService.sendSlipToEmail({
        userId,
        recipientEmail: userEmail,
        sendToRegistered: true,
        verificationResult: result,
      });

      if (res.success) {
        setEmailStatusMsg(`Certificate sent to ${res.recipientEmails?.join(", ") || userEmail}!`);
        setTimeout(() => setEmailStatusMsg(null), 5000);
      } else {
        setEmailStatusMsg(`Failed: ${res.error || "Could not send"}`);
        setTimeout(() => setEmailStatusMsg(null), 5000);
      }
    } catch (err: any) {
      setEmailStatusMsg("Network error sending certificate.");
      setTimeout(() => setEmailStatusMsg(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadPDF = () => {
    // Simulate PDF generation/download trigger
    const element = document.createElement("a");
    const file = new Blob(
      [
        `SMARTLINK OFFICIAL VERIFICATION RECEIPT\n` +
          `==========================================\n` +
          `Receipt Number: ${result.receiptNumber}\n` +
          `Reference: ${result.reference}\n` +
          `Service: ${result.serviceTitle}\n` +
          `Provider: ${result.providerName}\n` +
          `Verified Target ID: ${result.maskedId}\n` +
          `Status: ${result.status}\n` +
          `Verification Fee: ₦${result.fee.toLocaleString()}\n` +
          `Timestamp: ${new Date(result.timestamp).toLocaleString()}\n` +
          `Response Time: ${result.responseTime}ms\n` +
          `==========================================\n` +
          `Authenticity secured by SmartLink API Gateway.\n`
      ],
      { type: "text/plain" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `SmartLink_Receipt_${result.receiptNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Close Button - Hidden in Print */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer print:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2 pt-2 border-b border-[#E5E7EB] dark:border-[#111827] pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F2D5C] to-[#0F2D5C] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#0F2D5C] dark:text-[#9CA3AF]">
              SMART LINK DIGITAL PROOF
            </span>
            <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
              Verification Transaction Receipt
            </h3>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              Official e-Verification Certificate & Audit Record
            </p>
          </div>
        </div>

        {/* Main Receipt Details Box */}
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#111827]/40 rounded-2xl space-y-3.5 text-xs border border-[#E5E7EB] dark:border-[#111827]">
          <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]/80 dark:border-[#4B5563]/80">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Verification Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#0F2D5C] dark:text-[#9CA3AF] bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 px-2.5 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#0F2D5C]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{result.status}</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Receipt No.</span>
            <span className="font-mono font-bold text-[#111827] dark:text-white">
              {result.receiptNumber}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Reference Ref.</span>
            <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">
              #{result.reference}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Service Executed</span>
            <span className="font-semibold text-[#111827] dark:text-white text-right">
              {result.serviceTitle}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Target ID Verified</span>
            <span className="font-mono font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
              {result.maskedId}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">Provider Gateway</span>
            <span className="font-medium text-[#111827] dark:text-[#E5E7EB]">
              {result.providerName}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]/80 dark:border-[#4B5563]/80">
            <span className="text-[#6B7280] dark:text-[#9CA3AF] font-semibold">Verification Fee</span>
            <span className="font-mono text-sm font-extrabold text-[#111827] dark:text-white">
              ₦{result.fee.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 text-[11px] text-[#9CA3AF]">
            <span>Query Response Time</span>
            <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">{result.responseTime}ms</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#9CA3AF]">
            <span>Issued Date & Time</span>
            <span className="font-mono text-[#4B5563] dark:text-[#E5E7EB]">
              {new Date(result.timestamp).toLocaleString("en-NG")}
            </span>
          </div>
        </div>

        {/* QR Code & Authenticity Seal */}
        <div className="p-3 bg-[#F5F7FA]/60 dark:bg-[#0F2D5C]/30 rounded-xl border border-[#E5E7EB] dark:border-[#0F2D5C]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-[#111827] rounded-lg shadow-xs border border-[#E5E7EB] dark:border-[#0F2D5C] text-[#0F2D5C]">
              <QrCode className="h-8 w-8" />
            </div>
            <div className="text-[11px]">
              <p className="font-bold text-[#111827] dark:text-white">Instant QR Seal</p>
              <p className="text-[#6B7280] dark:text-[#9CA3AF]">Scan to verify certificate authenticity on SmartLink portal</p>
            </div>
          </div>
        </div>

        {/* Buttons - Hidden in Print */}
        <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
          {emailStatusMsg && (
            <div className="w-full p-2.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C] rounded-xl text-xs text-[#0F2D5C] dark:text-[#9CA3AF] font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-[#0F2D5C] shrink-0" />
              <span>{emailStatusMsg}</span>
            </div>
          )}

          {isSlipSupported && (
            <button
              type="button"
              onClick={handleQuickEmailDispatch}
              disabled={isSendingEmail}
              className="w-full py-2.5 px-3 bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/50 dark:hover:bg-[#0F2D5C]/50 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C] font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              <span>{isSendingEmail ? "Dispatching..." : "Send Slip to Registered Email"}</span>
            </button>
          )}

          {isSlipSupported && onGenerateSlip && (
            <button
              type="button"
              onClick={onGenerateSlip}
              className="w-full py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Generate Official Identity Slip (NIN / BVN)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 px-3 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
