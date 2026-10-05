import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  Phone,
  ShieldCheck,
  Search,
  Folder,
  ChevronDown,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  History,
  UserCheck,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  StandardizedVerificationResult,
  VerificationProgressStep,
  VerificationErrorState,
  VerificationHistoryItem,
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
import { getBvnSlipOptions, mapBvnSlipToConfig, BvnSlipType3 } from "./BvnVerificationView";
import { formatNaira, formatSafeDateTime } from "../../utils/formatUtils";
import { legalConsentService } from "../../services/legalConsentService";

interface BvnPhoneVerificationViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export const BvnPhoneVerificationView: React.FC<BvnPhoneVerificationViewProps> = ({
  userId,
  userEmail,
  serviceTitle = "BVN Verification with Phone Number",
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getBvnSlipOptions(config);

  const [activeTab, setActiveTab] = useState<"VERIFY" | "HISTORY">("VERIFY");
  const [selectedSlip, setSelectedSlip] = useState<BvnSlipType3 | null>(null);

  // Phone Number Input
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Status & Balance
  const [userBalance, setUserBalance] = useState<number>(0);
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Cached PDF Slip for instant download & email dispatch right from loader
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_BVN_Phone_Slip.pdf");

  const [showSlipModal, setShowSlipModal] = useState(false);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistorySlip, setSelectedHistorySlip] = useState<StandardizedVerificationResult | null>(null);

  const effectiveRegisteredEmail = userEmail || "";

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "BVN_PHONE",
        primaryInput: phoneNumber,
        customFee: slipPrice,
        slipType: selectedSlip.formatId,
        additionalFields: {
          phone: phoneNumber,
          phoneNumber: phoneNumber,
          searchMethod: "BY_PHONE",
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
          label: "Verification Complete & Official Slip Auto-Downloaded",
          progress: 100,
        });
        setResult(enrichedResult);

        // Keep in LOADING mode so VerificationLoader displays the 100% complete state with buttons!
        if (onBalanceUpdate) onBalanceUpdate();
        refreshBalance();

        legalConsentService.recordAcceptance({
          userId,
          userEmail: effectiveRegisteredEmail,
          documentId: "bvn-phone-notice",
          documentVersion: "2.1.0",
          scope: "KYC_VALIDATION",
          agreementType: "KYC_VALIDATION",
          status: "ACCEPTED",
          metadata: {
            serviceType: "BVN_PHONE",
            phone: phoneNumber,
            slipFormat: selectedSlip.id,
            timestamp: new Date().toISOString(),
          },
        }).catch((e) => console.warn("Legal consent recording note:", e));
      } else {
        setErrorState(
          res.errorState || {
            code: "VERIFICATION_FAILED",
            title: `${serviceTitle} Failed`,
            message: "Unable to find BVN profile linked to this phone number.",
            details: "Please verify that this mobile number is actively registered to a BVN bank account.",
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
    setPhoneNumber("");
    setHasConsent(false);
    setInputError(null);
    setResult(null);
    setCachedBlob(null);
    setCachedPdfBytes(null);
    setErrorState(null);
    setSelectedSlip(null);
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
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              {serviceTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/80">
              Query &amp; verify Bank Verification Number (BVN) via registered phone number
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

      {/* 2. Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 sm:p-2 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "VERIFY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>BVN Phone Verify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Audit History</span>
          </button>
        </div>

        <div className="text-right px-2">
          <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-bold">Wallet Balance</span>
          <span className="font-mono text-xs font-extrabold text-[#0F2D5C]">
            {formatNaira(userBalance)}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-5 bg-white">
        {activeTab === "VERIFY" && stepMode === "INPUT" && (
          <div className="space-y-3.5 sm:space-y-5">
            {/* SECTION 1: SLIP TYPE & PREVIEW */}
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 tracking-wider uppercase">
                  SLIP TYPE &amp; PREVIEW
                </h2>
              </div>

              {/* Dropdown with BVN Card, BVN Slip */}
              <div className="relative">
                <select
                  id="bvn-phone-slip-type-selector"
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = availableSlips.find((s) => s.id === e.target.value);
                    setSelectedSlip(found || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-2.5 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C] shadow-2xs cursor-pointer pr-10"
                >
                  <option value="">- choose a slip type -</option>
                  {availableSlips.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
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
                      slipOption={mapBvnSlipToConfig(selectedSlip)}
                      userBalance={userBalance}
                      serviceType="BVN"
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
                    <span className="text-[10px] text-slate-300 block font-medium">Price</span>
                    <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                      {formatNaira(selectedSlip.price ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: 11-DIGIT PHONE NUMBER INPUT */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 tracking-wider uppercase">
                  ENTER REGISTERED PHONE NUMBER
                </h2>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="bvn-phone-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0F2D5C]" />
                    Registered Phone Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {phoneNumber.length}/11 digits
                  </span>
                </div>
                <input
                  id="bvn-phone-input"
                  type="text"
                  maxLength={11}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="e.g. 08012345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-2.5 px-3 sm:py-3 sm:px-4 font-mono text-sm sm:text-base tracking-wider text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]"
                />
                <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                  <Lock className="w-3 h-3 text-[#0F2D5C] shrink-0" />
                  <span>Enter the 11-digit phone number registered to the BVN record.</span>
                </p>
              </div>
            </div>

            {/* SECTION 3: CONSENT CHECKBOX */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="bvnPhoneConsent"
                  checked={hasConsent}
                  onChange={(e) => {
                    setHasConsent(e.target.checked);
                    if (inputError) setInputError(null);
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                />
                <label htmlFor="bvnPhoneConsent" className="text-[11px] sm:text-xs text-slate-600 cursor-pointer leading-relaxed">
                  <strong className="text-slate-800 font-bold block mb-0.5">Mandatory NDPR &amp; NIBSS Consent Declaration</strong>
                  I confirm that I have explicit lawful consent from the BVN holder to perform this identity verification and print the requested slip format.
                </label>
              </div>
            </div>

            {/* Error Message if any */}
            {inputError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{inputError}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!selectedSlip || phoneNumber.length !== 11 || !hasConsent}
              className="w-full bg-[#0F2D5C] hover:bg-[#1E3A8A] active:bg-[#0B2144] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0F2D5C] text-white py-3.5 px-5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify &amp; Generate {selectedSlip?.name || "BVN Slip"}</span>
            </button>

            {/* Note at bottom */}
            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Note: In accordance with Central Bank of Nigeria (CBN) and NIBSS data privacy regulations, all BVN phone verification queries are logged with secure cryptographic audit timestamps.
            </div>
          </div>
        )}

        {/* LOADING STATE (0% -> 55% -> 90% -> 100% with inline action buttons) */}
        {activeTab === "VERIFY" && stepMode === "LOADING" && (
          <div className="py-8">
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle={serviceTitle}
              serviceId="BVN"
              idNumber={phoneNumber}
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
                placeholder="Search history by phone or reference..."
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
                          message: "BVN Phone Verification Record",
                          data: item.data || null,
                          timestamp: item.timestamp,
                          providerName: item.providerName || "NIBSS Portal",
                          responseTime: item.responseTime || 200,
                          receiptNumber: item.receiptNumber,
                          service: item.service || "BVN",
                          serviceTitle: item.serviceTitle || "BVN Verification with Phone Number",
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
