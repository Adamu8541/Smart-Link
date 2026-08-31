import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  Folder,
  ChevronDown,
  Printer,
  AlertTriangle,
  X,
  CheckCircle2,
  Phone,
} from "lucide-react";
import {
  StandardizedVerificationResult,
  VerificationProgressStep,
  VerificationErrorState,
} from "../../types/verification";
import {
  VerificationEngine as VerificationEngineService,
  VERIFICATION_PROGRESS_STEPS,
} from "../../services/verificationEngine";
import { WalletService } from "../../services/walletService";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { THREE_NIN_SLIPS, mapSlipToConfig, NinSlipType3, getNinSlipOptions } from "./NinVerificationView";

interface NinPhoneVerificationViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export const NinPhoneVerificationView: React.FC<NinPhoneVerificationViewProps> = ({
  userId,
  userEmail,
  serviceTitle = "NIN With Phone Number",
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getNinSlipOptions(config);

  // Selected Slip (Defaults to null)
  const [selectedSlip, setSelectedSlip] = useState<NinSlipType3 | null>(null);

  // Phone Number Input
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Slip Modal
  const [showSlipModal, setShowSlipModal] = useState(false);

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

  // Validation check: must have selected slip, exact 11 digits starting with 0, and consent
  const isFormValid =
    Boolean(selectedSlip) &&
    phoneNumber.length === 11 &&
    phoneNumber.startsWith("0") &&
    hasConsent;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly extract digits only (no spaces, hyphens, characters, symbols)
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 11);
    setPhoneNumber(digitsOnly);
    if (inputError) setInputError(null);
  };

  const handleVerify = async () => {
    setInputError(null);
    if (!selectedSlip) {
      setInputError("Please choose a slip type.");
      return;
    }

    if (!phoneNumber) {
      setInputError("Phone number is required.");
      return;
    }

    if (!phoneNumber.startsWith("0")) {
      setInputError("Phone number must start with 0 (e.g. 08012345678).");
      return;
    }

    if (phoneNumber.length !== 11) {
      setInputError("Phone number must be exactly 11 digits (no less or more).");
      return;
    }

    if (!hasConsent) {
      setInputError("You must confirm consent from the phone number owner to proceed.");
      return;
    }

    // Check balance
    if (userBalance < selectedSlip.price) {
      setInputError(
        `Insufficient wallet balance. You have ₦${userBalance.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
        })}, but this service requires ₦${selectedSlip.price.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
        })}. Please fund your wallet.`
      );
      return;
    }

    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    try {
      setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[1]), 800);
      setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[2]), 1600);

      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "PHONE",
        primaryInput: phoneNumber,
        customFee: selectedSlip.price,
        slipType: selectedSlip.formatId,
        additionalFields: {
          searchMethod: "BY_PHONE_NUMBER",
          slipType: selectedSlip.id,
          consent: true,
        },
      });

      if (res.success && res.result) {
        setResult(res.result);
        setStepMode("SUCCESS");
        if (onBalanceUpdate) onBalanceUpdate();
        refreshBalance();
      } else {
        setErrorState(
          res.errorState || {
            code: "VERIFICATION_FAILED",
            title: "NIN With Phone Number Failed",
            message: "Unable to verify NIN record associated with the provided phone number.",
            details: "Please verify the 11-digit phone number and try again.",
            retryable: true,
          }
        );
        setStepMode("ERROR");
      }
    } catch (err: any) {
      setErrorState({
        code: "SYSTEM_ERROR",
        title: "System Error",
        message: err.message || "An unexpected error occurred during phone verification.",
        retryable: true,
      });
      setStepMode("ERROR");
    }
  };

  const handleResetForm = () => {
    setPhoneNumber("");
    setHasConsent(false);
    setInputError(null);
    setResult(null);
    setErrorState(null);
    setSelectedSlip(null);
    setStepMode("INPUT");
    refreshBalance();
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden font-sans select-text">
      {/* 1. Top Header Banner - SmartLink NG Navy Gradient */}
      <div className="bg-gradient-to-r from-[#0F2D5C] via-[#1E3A8A] to-[#0F2D5C] p-5 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          {onBackToDashboard ? (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 -ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {serviceTitle}
            </h1>
            <p className="text-xs text-white/80">
              Verify NIN records using candidate's 11-digit phone number
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 -mr-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Stepper Tabs Bar */}
      <div className="bg-slate-100/90 p-2 border-b border-slate-200/80">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="py-2 px-1 bg-white rounded-xl text-slate-900 font-extrabold text-[11px] sm:text-xs shadow-2xs border border-slate-200 flex items-center justify-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[10px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="truncate">Select Slip</span>
          </div>
          <div className="py-2 px-1 text-slate-500 font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="truncate">Phone Number</span>
          </div>
          <div className="py-2 px-1 text-slate-500 font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center shrink-0">
              3
            </span>
            <span className="truncate">Consent</span>
          </div>
          <div className="py-2 px-1 text-slate-500 font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center shrink-0">
              4
            </span>
            <span className="truncate">Verify</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-6 bg-white">
        {stepMode === "INPUT" && (
          <div className="space-y-6">
            {/* SECTION 1: SLIP TYPE & PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  SLIP TYPE &amp; PREVIEW
                </h2>
              </div>

              {/* Dropdown with 3 Options: Premium, Standard, Regular */}
              <div className="relative">
                <select
                  id="nin-phone-slip-type-selector"
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = availableSlips.find((s) => s.id === e.target.value);
                    setSelectedSlip(found || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs cursor-pointer pr-10"
                >
                  <option value="" disabled>
                    — Choose a slip type —
                  </option>
                  {availableSlips.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} Slip
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>

              {/* Live Slip Preview Box */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6 flex flex-col items-center justify-center min-h-[160px] text-center shadow-inner">
                {selectedSlip ? (
                  <div className="w-full">
                    <SlipLivePreviewCard
                      slipOption={mapSlipToConfig(selectedSlip)}
                      userBalance={userBalance}
                      serviceType="NIN"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Folder className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      Select a slip type to see a preview
                    </p>
                  </div>
                )}
              </div>

              {/* Auto Display Price / Fee Layer Down the Preview */}
              {selectedSlip && (
                <div className="mt-3 bg-[#0F2D5C] text-white rounded-2xl p-4 shadow-md border border-[#0F2D5C]/80 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-sm font-mono shadow-inner">
                      ₦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                          {selectedSlip.name} Service Fee
                        </span>
                        <span className="text-[10px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full border border-white/20 font-semibold">
                          {selectedSlip.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-medium mt-0.5">
                        Auto-deducted from wallet on successful lookup
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-amber-300 font-mono tracking-tight">
                      ₦{selectedSlip.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Wallet balance checked
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: PHONE NUMBER */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  REGISTERED PHONE NUMBER
                </h2>
              </div>

              <div>
                <label
                  htmlFor="phone-number-input-field"
                  className="block text-[11px] font-black text-slate-700 tracking-wider uppercase mb-1.5"
                >
                  ENTER 11-DIGIT PHONE NUMBER
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    id="phone-number-input-field"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="e.g. 08012345678"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono tracking-wider font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-slate-400">
                  <span>Must start with 0 (e.g., 080...)</span>
                  <span>{phoneNumber.length} / 11 digits</span>
                </div>
              </div>

              {/* Privacy Notice Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="font-bold text-slate-800">Privacy Notice:</strong> Your phone number query is encrypted and securely processed via official NIMC telco registries.
                </p>
              </div>
            </div>

            {/* SECTION 3: CONSENT */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  CONSENT
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => {
                      setHasConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">I confirm that:</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      • I have obtained explicit consent from the phone number owner to query their NIMC identity record
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
                className="w-full bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Verify Phone Number Now</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="text-emerald-600 font-bold">🔒 256-bit encrypted</span>
                <span>· Wallet balance:</span>
                <strong className="text-slate-800 font-bold">
                  ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Execution Loader State */}
        {stepMode === "LOADING" && (
          <VerificationLoader
            currentStep={currentStep}
            serviceTitle="NIN With Phone Number"
            providerName="NIMC Telco Gateway"
          />
        )}

        {/* Success Result View */}
        {stepMode === "SUCCESS" && result && (
          <div className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm">
                    Verification Successful
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Official NIN record retrieved and slip generated.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSlipModal(true)}
                className="px-3.5 py-2 bg-[#0F2D5C] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>

            <VerificationSuccess
              result={result}
              userId={userId}
              userEmail={userEmail}
              onRepeatVerification={handleVerify}
              onNewVerification={handleResetForm}
            />
          </div>
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
          initialFormat={selectedSlip?.formatId || "NIN_STANDARD"}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
