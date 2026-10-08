import React, { useState, useEffect, useRef } from "react";
import { Download, Mail, CheckCircle2, RefreshCw, Send, ShieldCheck, ArrowRight } from "lucide-react";
import { StandardizedVerificationResult } from "../../types/verification";
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { EmailSlipService } from "../../services/emailSlipService";

interface VerificationSuccessProps {
  result: StandardizedVerificationResult;
  userId?: string;
  userEmail?: string;
  onRepeatVerification?: () => void;
  onNewVerification?: () => void;
  onPrintSlip?: () => void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  result,
  userId = "user_guest",
  userEmail = "",
  onRepeatVerification,
  onNewVerification,
}) => {
  const [isOverlaying, setIsOverlaying] = useState(true);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_ID_Card.pdf");

  // Email dispatch state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);

  const lastProcessedId = useRef<string>("");

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

  const isBvnSlip =
    (result as any).formatId === "BVN_SLIP_1" ||
    (result as any).slipType === "BVN_SLIP_1" ||
    (result as any).slipType === "BVN_SLIP" ||
    (result as any).selectedSlip?.id === "BVN_SLIP_1" ||
    (result as any).selectedSlip?.formatId === "BVN_SLIP_1" ||
    (result.data as any)?.slipType === "BVN_SLIP" ||
    (result.data as any)?.slipType === "BVN_SLIP_1";

  const isRegular =
    !isBvnSlip && (
      (result as any).slipType === "NIN_REGULAR" ||
      (result as any).slipType === "REGULAR" ||
      (result as any).formatId === "NIN_REGULAR" ||
      (result as any).selectedSlip?.id === "REGULAR" ||
      (result as any).selectedSlip?.formatId === "NIN_REGULAR" ||
      (result.data as any)?.slipType === "REGULAR" ||
      (result.data as any)?.slipType === "NIN_REGULAR" ||
      (typeof (result as any).slipType === "string" && (result as any).slipType.toUpperCase().includes("REGULAR")) ||
      (typeof (result as any).formatId === "string" && (result as any).formatId.toUpperCase().includes("REGULAR"))
    );

  // 1. Immediately catch return data, overlay on PDF, and auto-download on user phone
  useEffect(() => {
    const currentId = (result.transactionId || result.reference || result.verifiedId || (result.data as any)?.nin || (result.data as any)?.bvn || JSON.stringify(result.data || {})).toString();
    if (lastProcessedId.current === currentId) return;
    lastProcessedId.current = currentId;

    let isMounted = true;

    async function performAutoOverlayAndDownload() {
      setIsOverlaying(true);
      try {
        const rawNin = (
          result.verifiedId ||
          (result.data as any)?.nin ||
          (result.data as any)?.idNumber ||
          (result.data as any)?.identificationNumber ||
          ""
        ).toString().trim();
        const safeNin = rawNin ? rawNin.replace(/[^a-zA-Z0-9_-]/g, "") : "";
        const rawBvn = (
          (result.data as any)?.bvn ||
          (result.data as any)?.bvnNumber ||
          ((result.service || "").toUpperCase().includes("BVN") ? result.verifiedId : "") ||
          ""
        ).toString().trim();
        const safeBvn = rawBvn ? rawBvn.replace(/[^a-zA-Z0-9_-]/g, "") : "";

        const isBvnService = (result.service || "").toUpperCase().includes("BVN") || Boolean((result.data as any)?.bvn);
        const isNinService = (result.service || "").toUpperCase().includes("NIN") || Boolean((result.data as any)?.nin);

        let filename: string;
        if (isBvnSlip) {
          filename = safeBvn ? `BVN Slip ${safeBvn}.pdf` : `BVN Slip.pdf`;
        } else if (isBvnService || (result as any).slipType === "BVN_CARD") {
          filename = safeBvn ? `BVN ${safeBvn}.pdf` : `BVN.pdf`;
        } else if (isRegular) {
          filename = safeNin ? `NIN Regular slip ${safeNin}.pdf` : `NIN Regular slip.pdf`;
        } else if (isNinService) {
          filename = safeNin ? `NIN Premium card ${safeNin}.pdf` : `NIN Premium card.pdf`;
        } else {
          filename = `SmartLink_${result.service || "ID"}_Card_${safeNin || "Verified"}.pdf`;
        }

        const exportResult = await SlipPrintEngine.autoExportIdentitySlip({
          ...result,
          slipType: isBvnSlip ? "BVN_SLIP" : isRegular ? "REGULAR" : ((result as any).slipType || "PREMIUM"),
        }, filename);

        if (!isMounted) return;

        if (exportResult.success && exportResult.pdfBytes) {
          setCachedPdfBytes(exportResult.pdfBytes);
          setCachedBlob(exportResult.blob || new Blob([exportResult.pdfBytes], { type: "application/pdf" }));
          setCachedFilename(exportResult.filename);
        }

        setDownloadSuccessToast(true);
        setTimeout(() => {
          if (isMounted) setDownloadSuccessToast(false);
        }, 6000);
      } catch (err) {
        console.error("[VerificationSuccess] Auto-download error:", err);
      } finally {
        if (isMounted) setIsOverlaying(false);
      }
    }

    performAutoOverlayAndDownload();

    return () => {
      isMounted = false;
    };
  }, [result, isRegular]);

  // 2. Action: Download id card again
  const handleDownloadAgain = async () => {
    if (cachedBlob) {
      SlipPrintEngine.triggerBlobDownload(cachedBlob, cachedFilename);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4000);
      return;
    }

    if (cachedPdfBytes) {
      const blob = new Blob([cachedPdfBytes], { type: "application/pdf" });
      setCachedBlob(blob);
      SlipPrintEngine.triggerBlobDownload(blob, cachedFilename);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4000);
      return;
    }

    // Fallback: re-generate and download
    setIsOverlaying(true);
    try {
      const exportResult = await SlipPrintEngine.autoExportIdentitySlip({
        ...result,
        slipType: isBvnSlip ? "BVN_SLIP" : isRegular ? "REGULAR" : ((result as any).slipType || "PREMIUM"),
      }, cachedFilename);
      if (exportResult.success && exportResult.pdfBytes) {
        setCachedPdfBytes(exportResult.pdfBytes);
        setCachedBlob(exportResult.blob || new Blob([exportResult.pdfBytes], { type: "application/pdf" }));
        setDownloadSuccessToast(true);
        setTimeout(() => setDownloadSuccessToast(false), 4000);
      }
    } finally {
      setIsOverlaying(false);
    }
  };

  // 3. Action: Auto-dispatch slip to user's registered email
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
        formatType: "NIN_PREMIUM_WHITE",
        pdfBase64: base64Pdf,
        pdfFilename: cachedFilename,
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
    <div className="w-full max-w-lg mx-auto py-4 px-2 select-text">
      {/* State A: Overlaying & Downloading */}
      {isOverlaying ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <ShieldCheck className="w-10 h-10 text-emerald-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {isRegular ? "Generating Standard Regular Slip..." : "Generating Premium ID Card..."}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Applying authentic security overlay and preparing automatic download to your device.
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-[#0F2D5C] w-full animate-pulse" />
          </div>
        </div>
      ) : (
        /* State B: Downloaded Complete - Clean Verified Successful with 2 Action Buttons */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl text-center space-y-6 animate-fade-in">
          {/* Success Checkmark & Verified Header */}
          <div className="space-y-3">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-11 h-11 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                verified successful
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                Official record verified and your authentic {isRegular ? "NIN Regular Slip PDF" : "ID card"} has been automatically downloaded to your device.
              </p>
            </div>

            {downloadSuccessToast && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Downloaded automatically</span>
              </div>
            )}
          </div>

          {/* Exactly the 2 Primary Action Buttons: Auto-send to Email + Download again */}
          <div className="space-y-3 pt-2">
            {/* Button 1: Download id card again */}
            <button
              type="button"
              onClick={handleDownloadAgain}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <Download className="w-5 h-5 text-white" />
              <span>{isRegular ? "Download Regular Slip again" : "Download id card again"}</span>
            </button>

            {/* Button 2: Auto-send slip to user's registered email */}
            <button
              type="button"
              onClick={handleAutoSendEmail}
              disabled={isSendingEmail}
              className="w-full py-4 px-6 bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-75 text-white font-extrabold rounded-2xl text-sm sm:text-base transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  <span>Dispatching to email...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-white" />
                  <span>send slip to my email</span>
                </>
              )}
            </button>
          </div>

          {/* Email Dispatch Result Status */}
          {emailStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 ${
                emailStatus.success
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                  : "bg-rose-50 text-rose-900 border border-rose-300"
              }`}
            >
              {emailStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{emailStatus.message}</span>
            </div>
          )}

          {/* Solid Styled Action: Perform another verification button */}
          {onNewVerification && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNewVerification}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-extrabold rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                <span>Perform another verification</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
