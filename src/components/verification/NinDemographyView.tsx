import React, { useState, useEffect } from "react";
import {
  Users,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  Mail,
  ArrowLeft,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Calendar,
  User,
  X,
  FileText,
  Lock,
  ExternalLink,
  ChevronDown,
  Folder,
} from "lucide-react";
import { NigerianCoatOfArmsSvg, NinOfficialLogoSvg } from "./slips/SlipSecurityAssets";
import { WalletService } from "../../services/walletService";
import {
  VerificationEngine as VerificationEngineService,
  VERIFICATION_PROGRESS_STEPS,
} from "../../services/verificationEngine";
import {
  StandardizedVerificationResult,
  GeneratedSlipRecord,
  VerificationProgressStep,
  VerificationErrorState,
} from "../../types/verification";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { THREE_NIN_SLIPS, mapSlipToConfig, NinSlipType3, getNinSlipOptions } from "./NinVerificationView";
import { formatNaira } from "../../utils/formatUtils";
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";

interface NinDemographyViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
  onOpenFundWallet?: () => void;
}

export const NinDemographyView: React.FC<NinDemographyViewProps> = ({
  userId,
  userEmail,
  serviceTitle,
  onBackToDashboard,
  onBalanceUpdate,
  onOpenFundWallet,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getNinSlipOptions(config);

  // Form State
  const [selectedSlip, setSelectedSlip] = useState<NinSlipType3 | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ninNumber, setNinNumber] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Status & Execution State
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<StandardizedVerificationResult | null>(null);

  // Cached PDF Slip for instant download & email dispatch right from loader
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_NIN_Demography_Slip.pdf");

  const [showSlipModal, setShowSlipModal] = useState(false);

  // Refresh wallet balance
  const fetchBalance = async () => {
    if (!userId) return;
    setIsLoadingBalance(true);
    try {
      const res = await WalletService.getWalletBalance(userId);
      if (res.success && res.wallet) {
        setUserBalance(res.wallet.currentBalance);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const isFormValid =
    Boolean(selectedSlip) &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    Boolean(gender) &&
    Boolean(dateOfBirth) &&
    hasConsent;

  const handleVerify = async () => {
    if (!selectedSlip || !isFormValid || isVerifying) return;
    setErrorMessage(null);
    setErrorState(null);

    // Balance check
    const slipPrice = selectedSlip?.price ?? 0;
    if (userBalance < slipPrice) {
      setErrorMessage(
        `Insufficient wallet balance. You have ${formatNaira(userBalance)}, but this service requires ${formatNaira(slipPrice)}. Please fund your wallet to proceed.`
      );
      return;
    }

    setIsVerifying(true);
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const timer1 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[1]), 700);
    const timer2 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[2]), 1400);
    const timer3 = setTimeout(() => setCurrentStep(VERIFICATION_PROGRESS_STEPS[3]), 2100);

    try {
      const targetId = `${firstName.trim()} ${lastName.trim()}`;
      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "NIN_DEMOGRAPHY",
        primaryInput: targetId,
        customFee: selectedSlip.price,
        slipType: selectedSlip.formatId,
        additionalFields: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          gender,
          dateOfBirth,
          nin: ninNumber.trim() || undefined,
          id_number: ninNumber.trim() || undefined,
          idNumber: ninNumber.trim() || undefined,
          searchMethod: "BY_DEMOGRAPHICS",
          slipType: selectedSlip.id,
          consent: true,
          ...(selectedProvider ? {
            providerId: selectedProvider,
            preferredProvider: selectedProvider,
          } : {}),
        },
        onProgressUpdate: (step) => setCurrentStep(step),
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
          label: "Verification Complete & Official Slip Auto-Downloaded",
          progress: 100,
        });
        setVerificationResult(enrichedResult);

        // Keep in LOADING mode so VerificationLoader displays the 100% complete state with buttons!
        if (onBalanceUpdate) onBalanceUpdate();
        fetchBalance();
      } else {
        const errObj: VerificationErrorState = res.errorState || {
          code: "VERIFICATION_FAILED",
          title: "Demographic Verification Notice",
          message:
            res.errorState?.message ||
            res.errorState?.details ||
            "Demographic verification failed. Please verify that the name, gender, and birth date match NIMC records exactly.",
          details: res.errorState?.details,
          retryable: true,
        };
        setErrorState(errObj);
        setErrorMessage(errObj.message);
        setStepMode("ERROR");
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      const errObj: VerificationErrorState = {
        code: "SYSTEM_ERROR",
        title: "Verification Notice",
        message: err.message || "An unexpected error occurred during verification. Please try again.",
        retryable: true,
      };
      setErrorState(errObj);
      setErrorMessage(errObj.message);
      setStepMode("ERROR");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setVerificationResult(null);
    setCachedBlob(null);
    setCachedPdfBytes(null);
    setErrorMessage(null);
    setErrorState(null);
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);
    setStepMode("INPUT");
    setFirstName("");
    setLastName("");
    setGender("");
    setDateOfBirth("");
    setHasConsent(false);
    setSelectedSlip(null);
    fetchBalance();
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans select-text">
      {/* Header Banner - SmartLink Brand Navy */}
      <div className="bg-gradient-to-r from-[#0F2D5C] via-[#1E3A8A] to-[#0F2D5C] px-5 py-4 text-white flex items-center justify-between shadow-xs">
        {onBackToDashboard ? (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-1.5 -ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-center text-white flex-1">
          NIN Demography
        </h1>
        {onBackToDashboard ? (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-1.5 -mr-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Loading State: Animated VerificationLoader (0% -> 55% -> 90% -> 100% with inline action buttons) */}
        {stepMode === "LOADING" && (
          <div className="py-6">
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle={serviceTitle || "NIN Demography Verification"}
              providerName={verificationResult?.providerName || (selectedProvider ? `${selectedProvider.toUpperCase()} Portal` : "NIMC Demographic Registry")}
              serviceId="NIN_DEMOGRAPHY"
              idNumber={`${firstName} ${lastName}`.trim()}
              result={verificationResult}
              userId={userId}
              userEmail={userEmail}
              cachedBlob={cachedBlob}
              cachedPdfBytes={cachedPdfBytes}
              cachedFilename={cachedFilename}
              onNewVerification={handleReset}
            />
          </div>
        )}

        {/* Verification Error View */}
        {stepMode === "ERROR" && (
          <div className="py-4">
            <VerificationError
              errorState={
                errorState || {
                  code: "DEMOGRAPHY_VERIFICATION_FAILED",
                  message: errorMessage || "Demographic verification failed.",
                  details: "Please verify that the name, gender, and birth date match NIMC records exactly.",
                  retryable: true,
                }
              }
              onRetry={() => {
                setStepMode("INPUT");
                setErrorState(null);
                setErrorMessage(null);
              }}
              onBack={() => {
                setStepMode("INPUT");
                setErrorState(null);
                setErrorMessage(null);
              }}
            />
          </div>
        )}

        {stepMode === "INPUT" && (
          <>
            {/* SECTION 1: SLIP TYPE & PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  SLIP TYPE &amp; PREVIEW
                </h2>
              </div>

              {/* Dropdown with Options: Regular Slip, Premium Card */}
              <div className="relative">
                <select
                  id="nin-demography-slip-type-selector"
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = availableSlips.find((s) => s.id === e.target.value);
                    setSelectedSlip(found || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs cursor-pointer pr-10"
                >
                  <option value="">
                    - choose a slip type -
                  </option>
                  {availableSlips.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
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
                    <p className="text-[10px] text-amber-700 font-medium max-w-xs mx-auto pt-0.5">
                      Note: The generated card/slip is for verification purposes only and is not an official NIMC document
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
                      {formatNaira(selectedSlip?.price ?? 0)}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Wallet balance checked
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Enter Demographic Information */}
            <div className="pt-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#0F2D5C]" />
                Enter Demographic Information
              </h2>

              {/* 2x2 Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="demography-first-name" className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    id="demography-first-name"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isVerifying}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] focus:border-transparent shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="demography-last-name" className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    id="demography-last-name"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isVerifying}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] focus:border-transparent shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="demography-gender-select" className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    id="demography-gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={isVerifying}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] focus:border-transparent shadow-2xs cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="demography-dob" className="block text-xs font-bold text-slate-700 mb-1">Date of birth on NIN</label>
                  <input
                    id="demography-dob"
                    type="date"
                    placeholder="Date of birth on NIN"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={isVerifying}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] focus:border-transparent shadow-2xs"
                  />
                </div>
              </div>

              {/* Important Info Notice */}
              <div className="mt-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-950 leading-relaxed shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-bold text-blue-900">Important:</strong> Please ensure all
                  information matches exactly as registered with NIMC. Any discrepancy may result in
                  verification failure.
                </p>
              </div>

              {/* Consent Checkbox */}
              <div className="mt-4 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-snug select-none">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    disabled={isVerifying}
                    className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">I confirm that:</span>
                    <span className="text-slate-600">
                      • I have obtained proper consent from the person whose details I'm verifying
                    </span>
                  </div>
                </label>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-800 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-0.5">Verification Notice</p>
                    <p>{errorMessage}</p>
                    {errorMessage.includes("Insufficient") && onOpenFundWallet && (
                      <button
                        type="button"
                        onClick={onOpenFundWallet}
                        className="mt-2 inline-flex items-center gap-1 font-bold text-xs text-[#0F2D5C] underline hover:text-blue-800"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Fund Wallet Now
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Verify Data Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!isFormValid || isVerifying}
                  className="w-full bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0F2D5C] text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Users className="w-5 h-5" />
                  <span>Verify Data</span>
                </button>
              </div>

              {/* Wallet Info Footer */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Wallet Balance:{" "}
                    <strong className="text-slate-800">
                      {formatNaira(userBalance)}
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> NIMC Authorized Portal
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slip Print Modal */}
      {showSlipModal && verificationResult && (
        <SlipPrintModal
          verificationResult={verificationResult}
          userId={userId}
          userEmail={userEmail}
          initialFormat={selectedSlip?.formatId || "NIN_REGULAR"}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
