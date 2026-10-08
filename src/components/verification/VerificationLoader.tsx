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

  // Local state for re-download alert & auto email dispatch
  const [downloadedAgainToast, setDownloadedAgainToast] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // Helper to reliably resolve user's email without manual entry
  const resolveTargetEmail = (): string => {
    if (userEmail && userEmail.includes("@")) return userEmail.trim();
    if (result?.data && (result.data as any).email && String((result.data as any).email).includes("@")) {
      return String((result.data as any).email).trim();
    }
    try {
      const raw =
        localStorage.getItem("smart_link_user") ||
        localStorage.getItem("smartlink_user") ||
        localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email && String(parsed.email).includes("@")) return String(parsed.email).trim();
      }
    } catch (e) {
      // ignore JSON parse errors
    }
    return "";
  };

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

  // Automatically dispatch verification slip to the user's email address
  const handleAutoSendEmail = async () => {
    const targetEmail = resolveTargetEmail();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailStatus({
        success: false,
        message: "No registered email address found on file to dispatch slip.",
      });
      setTimeout(() => setEmailStatus(null), 6000);
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
        setTimeout(() => setEmailStatus(null), 8000);
      }
      return;
    }

    if (!result) {
      setEmailStatus({
        success: false,
        message: "Official verification slip not available to email.",
      });
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 6000);
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
          message: `Official slip automatically dispatched to ${targetEmail}`,
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
      setTimeout(() => setEmailStatus(null), 8000);
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

          {/* The TWO Action Buttons: "Send slip to email" (auto dispatch) and "Download again" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Button 1: Send slip to email (Auto Dispatch to user's email) */}
            <button
              type="button"
              onClick={handleAutoSendEmail}
              disabled={isSendingEmail}
              className="w-full py-3.5 px-4 bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-75 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                  <span>Dispatching to email...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-white shrink-0" />
                  <span>Send slip to email</span>
                </>
              )}
            </button>

            {/* Button 2: Download again */}
            <button
              type="button"
              onClick={handleDownloadAgain}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-white shrink-0" />
              <span>Download again</span>
            </button>
          </div>

          {/* Email Dispatch Result Status */}
          {emailStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 ${
                emailStatus.success
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-700"
              }`}
            >
              {emailStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{emailStatus.message}</span>
            </div>
          )}

          {/* Solid Styled Action: Verify Another ID Button (Ensures full visibility, background, and high contrast) */}
          {onNewVerification && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNewVerification}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-extrabold rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                <span>Verify another ID</span>
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
