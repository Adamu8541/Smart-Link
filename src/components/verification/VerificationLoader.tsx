import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Download,
  Mail,
  CheckCircle2,
  RefreshCw,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { VerificationProgressStep, StandardizedVerificationResult } from "../../types/verification";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { EmailSlipService } from "../../services/emailSlipService";

export interface VerificationLoaderProps {
  currentStep: VerificationProgressStep;
  serviceTitle: string;
  providerName?: string;
  serviceId?: string;
  idNumber?: string;
  // Completed result & cached slip data
  result?: StandardizedVerificationResult | null;
  userId?: string;
  userEmail?: string;
  cachedBlob?: Blob | null;
  cachedPdfBytes?: Uint8Array | null;
  cachedFilename?: string;
  onDownloadAgain?: () => void;
  onSendEmail?: (email: string) => Promise<{ success: boolean; message: string }>;
  onNewVerification?: () => void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const VerificationLoader: React.FC<VerificationLoaderProps> = ({
  currentStep,
  serviceTitle,
  providerName = "Federal E-Verification Portal",
  result,
  userId = "user_guest",
  userEmail = "",
  cachedBlob,
  cachedPdfBytes,
  cachedFilename,
  onDownloadAgain,
  onSendEmail,
  onNewVerification,
}) => {
  const isComplete = currentStep.progress >= 100;

  // Local state for re-download alert & inline email dispatch
  const [downloadedAgainToast, setDownloadedAgainToast] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState(
    userEmail || (result?.data as any)?.email || ""
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // Sync email input if userEmail changes
  useEffect(() => {
    if (userEmail && !emailInput) {
      setEmailInput(userEmail);
    }
  }, [userEmail]);

  // Handle "Download again" without opening any modal
  const handleDownloadAgain = async () => {
    if (onDownloadAgain) {
      onDownloadAgain();
      setDownloadedAgainToast(true);
      setTimeout(() => setDownloadedAgainToast(false), 4000);
      return;
    }

    const filename = cachedFilename || `Official_${serviceTitle.replace(/\s+/g, "_")}_Slip.pdf`;

    if (cachedBlob) {
      SlipPrintEngine.triggerBlobDownload(cachedBlob, filename);
      setDownloadedAgainToast(true);
      setTimeout(() => setDownloadedAgainToast(false), 4000);
      return;
    }

    if (cachedPdfBytes) {
      const blob = new Blob([cachedPdfBytes], { type: "application/pdf" });
      SlipPrintEngine.triggerBlobDownload(blob, filename);
      setDownloadedAgainToast(true);
      setTimeout(() => setDownloadedAgainToast(false), 4000);
      return;
    }

    // Fallback if result object is present
    if (result) {
      try {
        const exportResult = await SlipPrintEngine.autoExportIdentitySlip(result, filename);
        if (exportResult.success) {
          setDownloadedAgainToast(true);
          setTimeout(() => setDownloadedAgainToast(false), 4000);
        }
      } catch (err) {
        console.error("Re-download failed:", err);
      }
    }
  };

  // Handle "send pdf to email" inline without opening any modal
  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (emailInput || userEmail).trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailStatus({ success: false, message: "Please enter a valid email address." });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(null);

    if (onSendEmail) {
      try {
        const res = await onSendEmail(targetEmail);
        setEmailStatus(res);
      } catch (err: any) {
        setEmailStatus({ success: false, message: err.message || "Failed to dispatch email." });
      } finally {
        setIsSendingEmail(false);
      }
      return;
    }

    if (!result) {
      setEmailStatus({
        success: false,
        message: "Official verification slip not available to email.",
      });
      setIsSendingEmail(false);
      return;
    }

    try {
      let base64Pdf: string | undefined = undefined;
      if (cachedPdfBytes) {
        base64Pdf = bytesToBase64(cachedPdfBytes);
      } else {
        const generated = await SlipPrintEngine.generateOverlayPdfBytes(
          SlipPrintEngine.buildIdentitySlipData(result)
        );
        base64Pdf = bytesToBase64(generated);
      }

      const res = await EmailSlipService.sendSlipToEmail({
        userId,
        recipientEmail: targetEmail,
        customRecipientEmail: targetEmail,
        sendToRegistered: false,
        verificationResult: result,
        formatType: (result as any).formatId || (result as any).slipType || "NIN_REGULAR",
        pdfBase64: base64Pdf,
        pdfFilename: cachedFilename || "Official_ID_Slip.pdf",
      });

      if (res.success) {
        setEmailStatus({
          success: true,
          message: `Official PDF slip dispatched successfully to ${targetEmail}`,
        });
      } else {
        setEmailStatus({
          success: false,
          message: res.message || res.error || "Unable to send slip to email at this time.",
        });
      }
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.message || "Failed to communicate with email dispatch service.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 text-center space-y-6 animate-fade-in max-w-md mx-auto select-text font-sans">
      {/* Dynamic Animated Status Badge */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {isComplete ? (
          <div className="relative p-4 rounded-3xl bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-in zoom-in-75 duration-300" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 rounded-full bg-[#0F2D5C]/10 animate-ping opacity-50" />
            <div className="relative p-3.5 rounded-2xl bg-white shadow-xl border border-[#E5E7EB] flex items-center justify-center">
              <SmartLinkLogoMark size="lg" animating={true} />
            </div>
          </>
        )}
      </div>

      {/* Service Header */}
      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-black text-[#111827] dark:text-white tracking-tight">
          {serviceTitle}
        </h3>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-center gap-1.5 font-medium">
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Identity Verified Successfully</span>
            </span>
          ) : (
            <>
              <Lock className="h-3 w-3 text-[#0F2D5C] shrink-0" />
              <span>Encrypted Portal: {providerName}</span>
            </>
          )}
        </p>
      </div>

      {/* Step Status Text & Progress Bar */}
      <div className="space-y-2.5 p-4 bg-[#F5F7FA] dark:bg-[#111827]/60 rounded-2xl border border-[#E5E7EB]/70 dark:border-[#4B5563]/60 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
          <span
            className={`flex items-center gap-2 ${
              isComplete ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-[#0F2D5C] dark:text-[#9CA3AF]"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <SmartLinkLogoMark size="xs" animating={true} />
            )}
            <span>{currentStep.label}</span>
          </span>
          <span
            className={`font-mono text-[11px] font-bold ${
              isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {currentStep.progress}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#E5E7EB] dark:bg-[#4B5563] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out rounded-full ${
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/50"
                : "bg-[#0F2D5C]"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentStep.progress))}%` }}
          />
        </div>
      </div>

      {/* When 100% Completed: Auto-Downloaded Notice + Two Action Buttons */}
      {isComplete && (
        <div className="space-y-4 pt-1 animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Automatic Download Success Banner */}
          <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Official PDF slip automatically downloaded to your device</span>
          </div>

          {downloadedAgainToast && (
            <div className="p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold animate-in fade-in zoom-in-95 flex items-center justify-center gap-2">
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>PDF downloaded again successfully</span>
            </div>
          )}

          {/* The TWO Action Buttons: "send pdf to email" and "Download again" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Button 1: send pdf to email */}
            <button
              type="button"
              onClick={() => {
                setShowEmailInput(!showEmailInput);
                setEmailStatus(null);
              }}
              className="w-full py-3.5 px-4 bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              <span>send pdf to email</span>
            </button>

            {/* Button 2: Download again */}
            <button
              type="button"
              onClick={handleDownloadAgain}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download again</span>
            </button>
          </div>

          {/* Inline Email Form (toggled without opening any modal) */}
          {showEmailInput && (
            <form
              onSubmit={handleSendEmail}
              className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-left space-y-3 animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Destination Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]"
                />
                <button
                  type="submit"
                  disabled={isSendingEmail || !emailInput.includes("@")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {isSendingEmail ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSendingEmail ? "Sending..." : "Send"}</span>
                </button>
              </div>

              {emailStatus && (
                <div
                  className={`text-xs font-semibold p-2.5 rounded-xl ${
                    emailStatus.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {emailStatus.message}
                </div>
              )}
            </form>
          )}

          {/* Optional: Verify Another ID Button (resets back to input) */}
          {onNewVerification && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNewVerification}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Verify another ID</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Security notice footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-[#9CA3AF] dark:text-[#6B7280] pt-1">
        <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C]" />
        <span>End-to-End 256-Bit SSL Encrypted Communication</span>
      </div>
    </div>
  );
};
