import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  FileImage,
  QrCode,
  ShieldCheck,
  CreditCard,
  FileText,
  Receipt,
  Layers,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  Mail,
  Send,
  Smartphone,
  MessageSquare,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  GeneratedSlipRecord,
  SlipFormatType,
  StandardizedVerificationResult,
} from "../../../types/verification";
import { FirestoreSlipService } from "../../../services/firestoreSlipService";
import { SlipPrintEngine } from "../../../services/slipPrintEngine";
import { EmailSlipService } from "../../../services/emailSlipService";
import { NinStandardSlip } from "./NinStandardSlip";
import { BvnVerificationSlip } from "./BvnVerificationSlip";
import { ThermalReceiptSlip } from "./ThermalReceiptSlip";

interface SlipPrintModalProps {
  verificationResult: StandardizedVerificationResult;
  userId: string;
  userEmail?: string;
  initialFormat?: SlipFormatType;
  onClose: () => void;
}

export const SlipPrintModal: React.FC<SlipPrintModalProps> = ({
  verificationResult,
  userId,
  userEmail,
  initialFormat = "NIN_STANDARD",
  onClose,
}) => {
  const isBvn = verificationResult.service === "BVN";
  const [selectedFormat, setSelectedFormat] = useState<SlipFormatType>(
    isBvn ? "BVN_STANDARD" : (initialFormat as string === "NIN_PREMIUM_WHITE" ? "NIN_STANDARD" : initialFormat)
  );
  const [isFoldable, setIsFoldable] = useState(true);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");

  const [activeSlip, setActiveSlip] = useState<GeneratedSlipRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  // Email & Delivery State
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [sendToRegistered, setSendToRegistered] = useState(true);
  const [customNote, setCustomNote] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const effectiveRegisteredEmail = userEmail || "adamuamuhammad8541@gmail.com";

  // Initialize or save slip to Firestore
  useEffect(() => {
    let isMounted = true;
    setIsSaving(true);

    FirestoreSlipService.saveSlipFromVerification({
      userId,
      userEmail: effectiveRegisteredEmail,
      verificationResult,
      formatType: selectedFormat,
    })
      .then((savedSlip) => {
        if (isMounted) {
          setActiveSlip(savedSlip);
          setIsSaving(false);
        }
      })
      .catch((err) => {
        console.error("Slip initialization error:", err);
        if (isMounted) setIsSaving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFormat, verificationResult, userId, effectiveRegisteredEmail]);

  const handleDownloadPDF = async () => {
    if (!activeSlip) return;
    setIsExporting(true);

    const elementId = "active-printable-slip";
    const filename = `SmartLink_${activeSlip.serviceType}_Slip_${activeSlip.identificationNumber}`;
    const isCard = selectedFormat === "BVN_PREMIUM_CARD";

    await SlipPrintEngine.exportToPdf({
      elementId,
      filename,
      format: isCard ? "card" : "a4",
      orientation: "portrait",
    });

    setIsExporting(false);
  };

  const handleDownloadPNG = async () => {
    if (!activeSlip) return;
    setIsExporting(true);

    const elementId = "active-printable-slip";
    const filename = `SmartLink_${activeSlip.serviceType}_Slip_${activeSlip.identificationNumber}`;

    await SlipPrintEngine.exportToPng(elementId, filename);
    setIsExporting(false);
  };

  const handleDirectPrint = () => {
    SlipPrintEngine.triggerPrint();
  };

  const handleCopyValidationLink = () => {
    if (!activeSlip) return;
    navigator.clipboard.writeText(activeSlip.qrVerificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Instant Email Dispatch Action (To Registered Email or Custom Recipient)
  const handleSendEmailDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSlip) return;

    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: "" });

    try {
      const res = await EmailSlipService.sendSlipToEmail({
        userId,
        recipientEmail: effectiveRegisteredEmail,
        sendToRegistered,
        customRecipientEmail: customEmail.trim() || undefined,
        verificationResult,
        slipData: activeSlip,
        formatType: selectedFormat,
        customNote: customNote.trim() || undefined,
      });

      if (res.success) {
        setEmailStatus({
          type: "success",
          message: res.message || `Official verification certificate successfully dispatched to ${res.recipientEmails?.join(", ") || effectiveRegisteredEmail}.`,
        });
      } else {
        setEmailStatus({
          type: "error",
          message: res.error || "Failed to dispatch email certificate.",
        });
      }
    } catch (err: any) {
      setEmailStatus({
        type: "error",
        message: err.message || "Network error during email dispatch.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp Instant Share
  const handleWhatsAppShare = () => {
    if (!activeSlip) return;
    const holderName = verificationResult.data?.fullName || activeSlip.holderData?.fullName || "RECORD CONFIRMED";
    const maskedId = verificationResult.maskedId || activeSlip.maskedId;
    const reference = verificationResult.reference || activeSlip.reference;

    const url = EmailSlipService.generateWhatsAppShareUrl({
      serviceType: activeSlip.serviceType,
      holderName,
      maskedId,
      reference,
      qrVerificationUrl: activeSlip.qrVerificationUrl,
      customNote: customNote || undefined,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Copy SMS Formatted Text
  const handleCopySmsText = () => {
    if (!activeSlip) return;
    const holderName = verificationResult.data?.fullName || activeSlip.holderData?.fullName || "RECORD CONFIRMED";
    const maskedId = verificationResult.maskedId || activeSlip.maskedId;
    const reference = verificationResult.reference || activeSlip.reference;

    const smsText = EmailSlipService.generateSmsText({
      serviceType: activeSlip.serviceType,
      holderName,
      maskedId,
      reference,
      qrVerificationUrl: activeSlip.qrVerificationUrl,
    });

    navigator.clipboard.writeText(smsText);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#111827]/80 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Header Controls (Hidden during direct print) */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#111827] flex flex-wrap items-center justify-between gap-3 bg-[#F5F7FA]/80 dark:bg-[#111827]/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                  Official Identity Slip Generator & Print Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
                  REAL VERIFIED
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Government-compliant printable slips with scannable 2D QR authentication &amp; instant email dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmailPanel(!showEmailPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showEmailPanel
                  ? "bg-[#0F2D5C] text-white shadow-md shadow-purple-600/20"
                  : "bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]/60 hover:bg-[#E5E7EB] dark:hover:bg-[#0F2D5C]/40"
              }`}
              title="Email official verification slip"
            >
              <Mail className="h-4 w-4" />
              <span>Email Slip</span>
              {showEmailPanel ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB]/50 dark:hover:bg-[#4B5563]/50 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Email & Multi-Channel Dispatch Drawer (Collapsible) */}
        {showEmailPanel && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#0F2D5C]/10 border-b border-[#E5E7EB] dark:border-[#0F2D5C]/50 space-y-4 print:hidden animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#0F2D5C]" />
                  <span>Send Official Certificate &amp; Verification Slip</span>
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Sends an official digital verification slip with PDF download links directly to your registered email or customer.
                </p>
              </div>

              {/* Instant Registered Email Dispatch Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEmailDispatch()}
                  disabled={isSendingEmail || !activeSlip}
                  className="px-4 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isSendingEmail ? "Dispatching..." : `Send to Registered Email (${effectiveRegisteredEmail})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Fields for Custom Recipient or Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#0F2D5C]/30">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Registered Account Email
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs font-mono font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
                  <span className="truncate">{effectiveRegisteredEmail}</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToRegistered}
                    onChange={(e) => setSendToRegistered(e.target.checked)}
                    className="rounded text-[#0F2D5C] focus:ring-[#0F2D5C] h-3.5 w-3.5"
                  />
                  <span>Always send copy to registered email</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Custom Recipient / Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs text-[#111827] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Additional Agent Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Validated for Account Opening"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs text-[#111827] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                />
              </div>
            </div>

            {/* Multi-Channel Quick Actions: WhatsApp & SMS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={!activeSlip}
                  className="px-3 py-1.5 rounded-xl bg-[#0F2D5C]/15 hover:bg-[#0F2D5C]/25 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#0F2D5C]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySmsText}
                  disabled={!activeSlip}
                  className="px-3 py-1.5 rounded-xl bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSms ? <Check className="h-3.5 w-3.5 text-[#0F2D5C]" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  <span>{copiedSms ? "SMS Text Copied!" : "Copy SMS Format"}</span>
                </button>
              </div>

              {/* Status Message */}
              {emailStatus.message && (
                <div
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 ${
                    emailStatus.type === "success"
                      ? "bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]"
                      : "bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]"
                  }`}
                >
                  {emailStatus.type === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#0F2D5C]" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-[#0F2D5C]" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Selector Bar (Hidden during print) */}
        <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#111827] bg-white dark:bg-[#111827] flex flex-wrap items-center justify-between gap-3 print:hidden">
          {/* Format Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFormat("NIN_STANDARD")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedFormat === "NIN_STANDARD"
                  ? "bg-[#0F2D5C] text-white shadow-md shadow-emerald-600/20"
                  : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Standard Slip</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat("NIN_REGULAR" as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedFormat === ("NIN_REGULAR" as any)
                  ? "bg-[#0F2D5C] text-white shadow-md shadow-emerald-600/20"
                  : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Regular Slip</span>
            </button>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting || isSaving || !activeSlip}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? "Rendering PDF..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting || isSaving || !activeSlip}
              className="px-3 py-2 rounded-xl bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#111827] dark:text-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileImage className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PNG Image</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={!activeSlip}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Preview Area */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-[#E5E7EB]/70 dark:bg-[#111827] flex flex-col items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          {activeSlip ? (
            <div className="w-full flex flex-col items-center justify-center">
              {/* Slip Card Render Container targeted by ID */}
              <div id="active-printable-slip" className="w-full">
                {activeSlip.serviceType === "BVN" || isBvn ? (
                  <BvnVerificationSlip slip={activeSlip} />
                ) : (
                  <NinStandardSlip slip={activeSlip} />
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[#0F2D5C] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#6B7280] font-semibold">Generating authentic slip from database records...</p>
            </div>
          )}
        </div>

        {/* Footer Meta & Quick Copy Validation URL (Hidden in Print) */}
        {activeSlip && (
          <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#111827] bg-white dark:bg-[#111827] flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF] text-[11px]">Public QR Scan URL:</span>
              <span className="font-mono text-[#0F2D5C] dark:text-[#9CA3AF] font-bold text-[11px] truncate max-w-xs sm:max-w-md">
                {activeSlip.qrVerificationUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyValidationLink}
                className="p-1 rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#111827] text-[#6B7280] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                title="Copy validation link"
              >
                {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[#9CA3AF] text-[11px]">
              <span>Slip ID: <strong className="text-[#4B5563] dark:text-[#E5E7EB] font-mono">{activeSlip.slipId}</strong></span>
              <span>•</span>
              <span>Stored securely</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
