import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  Folder,
  CreditCard,
  ChevronDown,
  Printer,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  StandardizedVerificationResult,
  VerificationProgressStep,
  VerificationErrorState,
  SlipFormatType,
} from "../../types/verification";
import {
  VerificationEngine as VerificationEngineService,
  VERIFICATION_PROGRESS_STEPS,
} from "../../services/verificationEngine";
import { VerificationValidator } from "../../services/verificationValidator";
import { WalletService } from "../../services/walletService";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import { SlipOptionConfig } from "../../services/slipOptionsConfig";
import { formatNaira } from "../../utils/formatUtils";

interface NinVerificationViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  serviceId?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export interface NinSlipType3 {
  id: "PREMIUM" | "REGULAR";
  name: string;
  label: string;
  price: number;
  badge: string;
  formatId: SlipFormatType;
}

export function getNinSlipOptions(siteConfig?: any): NinSlipType3[] {
  const priceMatrix = siteConfig?.priceMatrix || {};
  const slipPrices = priceMatrix.slipPrices || siteConfig?.systemSettings?.slipPrices || {};
  const priceMap = priceMatrix.priceMap || siteConfig?.priceMap || {};

  const regularPrice =
    typeof slipPrices.REGULAR === "number"
      ? slipPrices.REGULAR
      : typeof slipPrices.regular === "number"
      ? slipPrices.regular
      : typeof priceMap["slip_regular"] === "number"
      ? priceMap["slip_regular"]
      : typeof priceMap["NIN_REGULAR"] === "number"
      ? priceMap["NIN_REGULAR"]
      : 180;

  const premiumPrice =
    typeof slipPrices.PREMIUM === "number"
      ? slipPrices.PREMIUM
      : typeof slipPrices.premium === "number"
      ? slipPrices.premium
      : typeof priceMap["slip_premium"] === "number"
      ? priceMap["slip_premium"]
      : typeof priceMap["NIN_PREMIUM_WHITE"] === "number"
      ? priceMap["NIN_PREMIUM_WHITE"]
      : 250;

  return [
    {
      id: "REGULAR",
      name: "Regular Slip",
      label: "Regular Slip",
      price: regularPrice,
      badge: "Basic Slip",
      formatId: "NIN_REGULAR",
    },
    {
      id: "PREMIUM",
      name: "Premium Card",
      label: "Premium Card",
      price: premiumPrice,
      badge: "Premium Card",
      formatId: "NIN_PREMIUM_WHITE",
    },
  ];
}

export const THREE_NIN_SLIPS: NinSlipType3[] = getNinSlipOptions();

export const mapSlipToConfig = (s: NinSlipType3): SlipOptionConfig => ({
  id: s.formatId,
  name: s.name,
  badge: s.badge,
  badgeColor: "bg-[#0F2D5C] text-white",
  price: s.price,
  description: `${s.name} generated with standard security watermarks & scannable QR verification.`,
  dimensions: s.id === "PREMIUM" ? "CR80 Plastic Card Size" : "Standard A4 / Letter",
  recommendedFor: s.id === "PREMIUM" ? "Plastic Card Printing & Wallet ID" : "General Identity Verification",
  themeColor: "#0F2D5C",
  bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
  features: ["Verification Security Seal", "Scannable 2D QR Code", "Digital Tracking ID", "Digital Watermark"],
  sampleLayout: s.id === "PREMIUM" ? "PREMIUM_CARD" : "STANDARD_SLIP",
});

export const NinVerificationView: React.FC<NinVerificationViewProps> = ({
  userId,
  userEmail,
  serviceTitle,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getNinSlipOptions(config);

  // Selected Slip (Defaults to null to match screenshot placeholder "— Choose a slip type —")
  const [selectedSlip, setSelectedSlip] = useState<NinSlipType3 | null>(null);

  // Inputs
  const [primaryInput, setPrimaryInput] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Fee & Balance
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Cached PDF Slip for instant download & email dispatch right from loader
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_NIN_Slip.pdf");

  // Slip Modal
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Title formatting
  const displayTitle = serviceTitle || "NIN Verification";
  let actionButtonText = "Verify NIN Now";
  if (displayTitle.toLowerCase().includes("generation") || displayTitle.toLowerCase().includes("slip")) {
    actionButtonText = "Generate NIN Slip Now";
  } else if (displayTitle.toLowerCase().includes("validation")) {
    actionButtonText = "Validate NIN Now";
  }

  // Fetch balance
  const refreshBalance = async () => {
    if (!userId) return;
    const res = await WalletService.getWalletBalance(userId);
    if (res.success && res.wallet) {
      setUserBalance(res.wallet.currentBalance);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [userId]);

  const isFormValid =
    Boolean(selectedSlip) &&
    primaryInput.trim().length === 11 &&
    hasConsent;

  const handleVerify = async () => {
    setInputError(null);
    if (!selectedSlip) {
      setInputError("Please choose a slip type.");
      return;
    }

    const cleanNin = primaryInput.trim();
    const validation = VerificationValidator.validateNIN(cleanNin);
    if (!validation.valid) {
      setInputError(validation.error || "Please enter a valid 11-digit NIN.");
      return;
    }

    if (!hasConsent) {
      setInputError("You must confirm consent from the NIN owner to proceed.");
      return;
    }

    // Check balance
    if (userBalance < (selectedSlip?.price ?? 0)) {
      setInputError(
        `Insufficient wallet balance. You have ${formatNaira(userBalance)}, but this service requires ${formatNaira(selectedSlip?.price ?? 0)}. Please fund your wallet.`
      );
      return;
    }

    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    // Continuous progress step timers while awaiting provider response
    const timer1 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[1]), 500);
    const timer2 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[2]), 1100);
    const timer3 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[3]), 2000);

    try {
      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "NIN",
        primaryInput: cleanNin,
        customFee: selectedSlip.price,
        slipType: selectedSlip.formatId,
        additionalFields: {
          nin: cleanNin,
          id_number: cleanNin,
          idNumber: cleanNin,
          slipType: selectedSlip.id,
          consent: true,
          ...(selectedProvider ? {
            preferredProvider: selectedProvider,
            providerId: selectedProvider,
          } : {}),
        },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (res.success && res.result) {
        const enrichedResult: StandardizedVerificationResult = {
          ...res.result,
          slipType: selectedSlip?.id || "REGULAR",
          formatId: selectedSlip?.formatId || "NIN_REGULAR",
          selectedSlip: selectedSlip,
        };

        // 1. Advance to 90%: Applying authentic security overlay
        setCurrentStep({
          id: 5,
          label: "Applying Official Security Overlay & Preparing Slip...",
          progress: 90,
        });

        // 2. Perform the overlay and auto-download right during the loader!
        try {
          const exportResult = await SlipPrintEngine.autoExportIdentitySlip(enrichedResult);
          if (exportResult.success && exportResult.pdfBytes) {
            setCachedPdfBytes(exportResult.pdfBytes);
            setCachedBlob(exportResult.blob || new Blob([exportResult.pdfBytes], { type: "application/pdf" }));
            setCachedFilename(exportResult.filename);
          }
        } catch (overlayErr) {
          console.error("Auto-overlay error during loading:", overlayErr);
        }

        // 3. Advance to 100%: Completed!
        setCurrentStep({
          id: 6,
          label: "Verification Complete & Digital Slip Auto-Downloaded",
          progress: 100,
        });
        setResult(enrichedResult);

        // Keep in LOADING mode so VerificationLoader displays the 100% complete state with buttons!
        if (onBalanceUpdate) onBalanceUpdate();
        refreshBalance();
      } else {
        setErrorState(
          res.errorState || {
            code: "VERIFICATION_FAILED",
            title: `${displayTitle} Failed`,
            message: "Unable to verify the provided NIN record at this time.",
            details: "Please verify the 11-digit NIN and try again.",
            retryable: true,
          }
        );
        setStepMode("ERROR");
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorState({
        code: "SYSTEM_ERROR",
        title: "System Error",
        message: err.message || "An unexpected error occurred during verification.",
        retryable: true,
      });
      setStepMode("ERROR");
    }
  };

  const handleResetForm = () => {
    setPrimaryInput("");
    setHasConsent(false);
    setInputError(null);
    setResult(null);
    setCachedBlob(null);
    setCachedPdfBytes(null);
    setErrorState(null);
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);
    setStepMode("INPUT");
    refreshBalance();
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden font-sans select-text">
      {/* 1. Top Header Banner - SmartLink NG Navy Gradient */}
      <div className="bg-gradient-to-r from-[#0F2D5C] via-[#1E3A8A] to-[#0F2D5C] p-3.5 sm:p-5 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {onBackToDashboard ? (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-1.5 -ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              {displayTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/80">
              Securely verify a National Identity Number in seconds
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-1.5 -mr-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* 2. Stepper Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 sm:p-2 border-b border-slate-200/80">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="py-1.5 px-1 bg-white rounded-lg sm:rounded-xl text-slate-900 font-extrabold text-[10px] sm:text-xs shadow-2xs border border-slate-200 flex items-center justify-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-[#0F2D5C] text-white text-[9px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="truncate">Select Slip</span>
          </div>
          <div className="py-1.5 px-1 text-slate-500 font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="truncate">Enter NIN</span>
          </div>
          <div className="py-1.5 px-1 text-slate-500 font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] flex items-center justify-center shrink-0">
              3
            </span>
            <span className="truncate">Consent</span>
          </div>
          <div className="py-1.5 px-1 text-slate-500 font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] flex items-center justify-center shrink-0">
              4
            </span>
            <span className="truncate">Verify</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-5 bg-white">
        {stepMode === "INPUT" && (
          <div className="space-y-3.5 sm:space-y-5">
            {/* SECTION 1: SLIP TYPE & PREVIEW */}
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 tracking-wider uppercase">
                  SLIP TYPE &amp; PREVIEW
                </h2>
              </div>

              {/* Dropdown with Options: Regular Slip, Premium Card */}
              <div className="relative">
                <select
                  id="nin-slip-type-selector"
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = availableSlips.find((s) => s.id === e.target.value);
                    setSelectedSlip(found || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-2.5 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs cursor-pointer pr-10"
                >
                  <option value="">
                    — Choose a slip / preview format —
                  </option>
                  {availableSlips.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {formatNaira(opt.price)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
              </div>

              {/* Live Slip Preview Box */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50/50 p-3 sm:p-5 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[140px] text-center shadow-inner">
                {selectedSlip ? (
                  <div className="w-full">
                    <SlipLivePreviewCard
                      slipOption={mapSlipToConfig(selectedSlip)}
                      userBalance={userBalance}
                      serviceType="NIN"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 py-1">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Folder className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      Select a slip type to see a preview
                    </p>
                  </div>
                )}
              </div>

              {/* Auto Display Price / Fee Layer Down the Preview */}
              {selectedSlip && (
                <div className="mt-2 bg-[#0F2D5C] text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-md border border-[#0F2D5C]/80 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-xs font-mono shadow-inner">
                      ₦
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
                          {selectedSlip.name} Fee
                        </span>
                        <span className="text-[9px] bg-white/10 text-slate-200 px-2 py-0.2 rounded-full border border-white/20 font-semibold">
                          {selectedSlip.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-200 font-medium">
                        Auto-deducted on successful lookup
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight">
                      {formatNaira(selectedSlip.price ?? 0)}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Wallet checked
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: NATIONAL IDENTITY NUMBER */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 tracking-wider uppercase">
                  NATIONAL IDENTITY NUMBER
                </h2>
              </div>

              <div>
                <label
                  htmlFor="nin-input-field"
                  className="block text-[10px] sm:text-[11px] font-black text-slate-700 tracking-wider uppercase mb-1"
                >
                  ENTER YOUR 11-DIGIT NIN
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">
                    #
                  </span>
                  <input
                    id="nin-input-field"
                    type="text"
                    maxLength={11}
                    value={primaryInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setPrimaryInput(val);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="e.g. 12345678901"
                    className="w-full pl-8 pr-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-mono tracking-wider font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs"
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-400 text-right mt-0.5">
                  {primaryInput.length} / 11 digits
                </p>
              </div>

              {/* Privacy Notice Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex items-start gap-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F2D5C] shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                  <strong className="font-bold text-slate-800">Privacy Notice:</strong> Encrypted &amp; securely processed. We never store personal data.
                </p>
              </div>
            </div>

            {/* SECTION 3: CONSENT */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 tracking-wider uppercase">
                  CONSENT
                </h2>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-2xs">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => {
                      setHasConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 w-3.5 h-3.5 rounded-sm border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">I confirm that:</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                      • I have obtained proper consent from the NIN owner for this verification
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Input Error Message */}
            {inputError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Notice</p>
                  <p>{inputError}</p>
                </div>
              </div>
            )}

            {/* ACTION BUTTON & FOOTER */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={!isFormValid}
                className="w-full bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0F2D5C] text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{actionButtonText}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="text-emerald-600 font-bold">🔒 256-bit encrypted</span>
                <span>· Wallet balance:</span>
                <strong className="text-slate-800 font-bold">
                  {formatNaira(userBalance)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Verification Loader State (0% -> 55% -> 90% -> 100% with inline action buttons) */}
        {stepMode === "LOADING" && (
          <VerificationLoader
            currentStep={currentStep}
            serviceTitle={displayTitle}
            providerName="National Identity Verification Portal"
            result={result}
            userId={userId}
            userEmail={userEmail}
            cachedBlob={cachedBlob}
            cachedPdfBytes={cachedPdfBytes}
            cachedFilename={cachedFilename}
            onNewVerification={handleResetForm}
          />
        )}

        {/* Error View */}
        {stepMode === "ERROR" && errorState && (
          <VerificationError
            errorState={errorState}
            onRetry={handleVerify}
            onBack={() => setStepMode("INPUT")}
          />
        )}
      </div>

      {/* Slip Print Modal */}
      {showSlipModal && result && (
        <SlipPrintModal
          verificationResult={result}
          userId={userId}
          userEmail={userEmail}
          initialFormat={selectedSlip?.formatId || "NIN_REGULAR"}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
