import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Wallet,
  AlertCircle,
  Info,
  Lock,
  History,
  CheckCircle2,
  FileText,
  Search,
  RefreshCw,
  Clock,
  UserCheck,
  ChevronDown,
  Folder,
  X,
  Check,
  Calendar,
  User,
  Phone,
  AlertTriangle,
} from "lucide-react";
import {
  StandardizedVerificationResult,
  VerificationProgressStep,
  VerificationErrorState,
  VerificationHistoryItem,
  SlipFormatType,
} from "../../types/verification";
import {
  VerificationEngine as VerificationEngineService,
  VERIFICATION_PROGRESS_STEPS,
} from "../../services/verificationEngine";
import { WalletService } from "../../services/walletService";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { legalConsentService } from "../../services/legalConsentService";
import { formatNaira, formatSafeDateTime } from "../../utils/formatUtils";
import { getBvnSlipOptions, mapBvnSlipToConfig, BvnSlipType3 } from "./BvnVerificationView";

interface BvnDemographyViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
  onOpenFundWallet?: () => void;
}

export type BvnDemographyTab = "VERIFY" | "HISTORY";

export const BvnDemographyView: React.FC<BvnDemographyViewProps> = ({
  userId,
  userEmail,
  serviceTitle,
  onBackToDashboard,
  onBalanceUpdate,
  onOpenFundWallet,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getBvnSlipOptions(config);

  const [activeTab, setActiveTab] = useState<BvnDemographyTab>("VERIFY");
  const [selectedSlip, setSelectedSlip] = useState<BvnSlipType3 | null>(null);

  // Demographic Fields: First Name, Last Name, Date of Birth, Gender
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const [hasConsent, setHasConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Status & Progress States
  const [userBalance, setUserBalance] = useState<number>(0);
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Cached PDF Slip for instant download & email dispatch right from loader
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_BVN_Demography_Slip.pdf");

  const [showSlipModal, setShowSlipModal] = useState(false);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistorySlip, setSelectedHistorySlip] = useState<StandardizedVerificationResult | null>(null);

  const effectiveRegisteredEmail = userEmail || "";
  const displayTitle = serviceTitle || "BVN Verification with Name & DOB";

  const refreshBalance = async () => {
    if (!userId) return;
    try {
      const res = await WalletService.getWalletBalance(userId);
      if (res.success && res.wallet) {
        setUserBalance(res.wallet.currentBalance);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [userId]);

  useEffect(() => {
    if (activeTab === "HISTORY" && userId) {
      setHistoryLoading(true);
      VerificationEngineService.getVerificationHistory(userId)
        .then((items) => {
          const bvnItems = items.filter(
            (i) => i.service === "BVN" || i.serviceTitle?.toLowerCase().includes("bvn")
          );
          setHistory(bvnItems);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, userId]);

  const handleVerify = async () => {
    setInputError(null);
    if (!selectedSlip) {
      setInputError("Please choose a slip type.");
      return;
    }

    if (!firstName.trim() || firstName.trim().length < 2) {
      setInputError("Please enter First Name as registered on BVN (at least 2 characters).");
      return;
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      setInputError("Please enter Last Name as registered on BVN (at least 2 characters).");
      return;
    }

    if (!gender) {
      setInputError("Please select Gender.");
      return;
    }

    if (!dateOfBirth) {
      setInputError("Please select the Date of Birth matching the BVN record.");
      return;
    }

    if (!hasConsent) {
      setInputError("You must confirm user consent to query NIBSS records under NDPR guidelines.");
      return;
    }

    const slipPrice = selectedSlip?.price ?? 500;
    if (userBalance < slipPrice) {
      setInputError(
        `Insufficient wallet balance. You have ${formatNaira(userBalance)}, but this service requires ${formatNaira(slipPrice)}. Please fund your wallet.`
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
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "BVN_DEMOGRAPHY",
        primaryInput: fullName,
        customFee: slipPrice,
        slipType: selectedSlip.formatId,
        additionalFields: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName,
          dateOfBirth,
          dob: dateOfBirth,
          gender,
          searchMethod: "BY_BVN_DEMOGRAPHICS",
          slipType: selectedSlip.id,
          consent: true,
          consentCaptured: true,
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
          slipType: selectedSlip.id,
          formatId: selectedSlip.formatId,
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

        legalConsentService.recordAcceptance({
          userId,
          userEmail: effectiveRegisteredEmail,
          documentId: "bvn-demography-notice",
          documentVersion: "2.1.0",
          scope: "KYC_VALIDATION",
          agreementType: "KYC_VALIDATION",
          status: "ACCEPTED",
          metadata: {
            serviceType: "BVN_DEMOGRAPHY",
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            fullName,
            dob: dateOfBirth,
            gender,
            slipFormat: selectedSlip.id,
            timestamp: new Date().toISOString(),
          },
        }).catch((e) => console.warn("Legal consent recording note:", e));
      } else {
        setErrorState(
          res.errorState || {
            code: "VERIFICATION_FAILED",
            title: `${displayTitle} Failed`,
            message: "Unable to verify the provided BVN demographic record at this time.",
            details: "Please confirm that First Name, Last Name, Gender, and Date of Birth match official bank records exactly.",
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
        message: err.message || "An unexpected error occurred during BVN verification.",
        retryable: true,
      });
      setStepMode("ERROR");
    }
  };

  const handleResetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGender("");
    setHasConsent(false);
    setSelectedSlip(null);
    setInputError(null);
    setResult(null);
    setCachedBlob(null);
    setCachedPdfBytes(null);
    setErrorState(null);
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);
    setStepMode("INPUT");
    refreshBalance();
  };

  const filteredHistory = history.filter(
    (item) =>
      !historySearch ||
      item.verifiedId.includes(historySearch) ||
      item.maskedId.includes(historySearch) ||
      item.reference.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.receiptNumber.toLowerCase().includes(historySearch.toLowerCase())
  );

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
              <CreditCard className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {displayTitle}
            </h1>
            <p className="text-xs text-white/80">
              Verify Bank Verification Number (BVN) with demographic records &amp; print slip
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

      {/* 2. Tabs Bar */}
      <div className="bg-slate-100/90 p-2 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "VERIFY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>BVN Demographic Verify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
          </button>
        </div>

        <div className="text-right px-2">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Wallet Balance</span>
          <span className="font-mono text-xs font-extrabold text-[#0F2D5C]">
            {formatNaira(userBalance)}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-6 bg-white">
        {activeTab === "VERIFY" && stepMode === "INPUT" && (
          <div className="space-y-6">
            {/* SECTION 1: SLIP TYPE & PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  SLIP TYPE &amp; PREVIEW
                </h2>
              </div>

              {/* Dropdown with BVN Card, BVN Slip */}
              <div className="relative">
                <select
                  id="bvn-demography-slip-type-selector"
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = availableSlips.find((s) => s.id === e.target.value);
                    setSelectedSlip(found || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs cursor-pointer pr-10"
                >
                  <option value="">— Choose a slip / preview format —</option>
                  {availableSlips.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {formatNaira(opt.price)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>

              {/* Live Slip Preview Box - matching BVN Verification */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6 flex flex-col items-center justify-center min-h-[160px] text-center shadow-inner">
                {selectedSlip ? (
                  <div className="w-full">
                    <SlipLivePreviewCard
                      slipOption={mapBvnSlipToConfig(selectedSlip)}
                      userBalance={userBalance}
                      serviceType="BVN"
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
                    <span className="text-xs text-slate-300 block font-medium">Price</span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      {formatNaira(selectedSlip.price ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: DEMOGRAPHIC FIELDS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  ENTER DEMOGRAPHIC INFORMATION
                </h2>
              </div>

              {/* 2x2 Grid: First Name, Last Name, Gender, Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="bvn-firstname-field" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0F2D5C]" />
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bvn-firstname-field"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="e.g. Abubakar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bvn-lastname-field" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0F2D5C]" />
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bvn-lastname-field"
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="e.g. Muhammad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bvn-gender-field" className="text-xs font-bold text-slate-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bvn-gender-field"
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] cursor-pointer"
                  >
                    <option value="">- Select Gender -</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bvn-dob-field" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0F2D5C]" />
                    Date of Birth on BVN <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bvn-dob-field"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] cursor-pointer"
                  />
                </div>
              </div>

              {/* Important Info Notice */}
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-950 leading-relaxed shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-bold text-blue-900">Important:</strong> Please ensure the
                  name, gender, and date of birth match exactly as registered on the candidate's bank BVN records with
                  NIBSS. Discrepancies will lead to validation failure.
                </p>
              </div>
            </div>

            {/* SECTION 3: CONSENT CHECKBOX */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="bvnDemographyConsent"
                  checked={hasConsent}
                  onChange={(e) => {
                    setHasConsent(e.target.checked);
                    if (inputError) setInputError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                />
                <label htmlFor="bvnDemographyConsent" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                  <strong className="text-slate-800 font-bold block mb-0.5">Mandatory NDPR &amp; NIBSS Consent Declaration</strong>
                  I confirm that I have explicit consent from the BVN holder to perform this identity verification and print the requested slip format.
                </label>
              </div>
            </div>

            {/* Error Message if any */}
            {inputError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{inputError}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!selectedSlip || !firstName.trim() || !lastName.trim() || !dateOfBirth || !gender || !hasConsent}
              className="w-full bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0F2D5C] text-white py-3.5 px-5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify &amp; Generate {selectedSlip?.name || "BVN Slip"}</span>
            </button>

            {/* Note at the bottom */}
            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Note: In accordance with Central Bank of Nigeria (CBN) and NIBSS data privacy regulations, all BVN demographic verification queries are logged with secure cryptographic audit timestamps.
            </div>
          </div>
        )}

        {/* LOADING STATE (0% -> 55% -> 90% -> 100% with inline action buttons) */}
        {activeTab === "VERIFY" && stepMode === "LOADING" && (
          <div className="py-8">
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle={displayTitle}
              serviceId="BVN"
              idNumber={`${firstName} ${lastName}`.trim()}
              result={result}
              userId={userId}
              userEmail={effectiveRegisteredEmail}
              cachedBlob={cachedBlob}
              cachedPdfBytes={cachedPdfBytes}
              cachedFilename={cachedFilename}
              onNewVerification={handleResetForm}
            />
          </div>
        )}

        {/* ERROR STATE */}
        {activeTab === "VERIFY" && stepMode === "ERROR" && errorState && (
          <div className="py-4">
            <VerificationError
              errorState={errorState}
              onRetry={() => {
                setStepMode("INPUT");
                setErrorState(null);
              }}
              onCancel={handleResetForm}
            />
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "HISTORY" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by BVN or reference..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-hidden text-slate-800"
              />
            </div>

            {historyLoading ? (
              <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0F2D5C]" />
                <span>Loading BVN history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No BVN verification history found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.maskedId || item.verifiedId}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                          VERIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{formatSafeDateTime(item.timestamp)}</span>
                        <span>•</span>
                        <span className="font-mono">{item.reference}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHistorySlip({
                          status: item.status || "SUCCESS",
                          reference: item.reference,
                          message: "BVN Demographic Verification Record",
                          data: item.data || null,
                          timestamp: item.timestamp,
                          providerName: item.providerName || "NIBSS Portal",
                          responseTime: item.responseTime || 200,
                          receiptNumber: item.receiptNumber,
                          service: item.service || "BVN",
                          serviceTitle: item.serviceTitle || "BVN Verification with Name & DOB",
                          fee: item.fee,
                          verifiedId: item.verifiedId,
                          maskedId: item.maskedId,
                          userId: item.userId,
                          formatId: "BVN_CARD",
                          slipType: "BVN_CARD",
                        });
                        setShowSlipModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#0F2D5C] text-white hover:bg-[#1E3A8A] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slip Print Modal for History re-prints */}
      {showSlipModal && selectedHistorySlip && (
        <SlipPrintModal
          verificationResult={selectedHistorySlip}
          userId={userId}
          userEmail={effectiveRegisteredEmail}
          initialFormat={(selectedHistorySlip.formatId as any) || "BVN_CARD"}
          onClose={() => {
            setShowSlipModal(false);
            setSelectedHistorySlip(null);
          }}
        />
      )}
    </div>
  );
};
