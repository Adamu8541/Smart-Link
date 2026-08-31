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
import { VerificationValidator } from "../../services/verificationValidator";
import { WalletService } from "../../services/walletService";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import { SlipOptionConfig } from "../../services/slipOptionsConfig";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { legalConsentService } from "../../services/legalConsentService";

interface BvnVerificationViewProps {
  userId: string;
  userEmail?: string;
  serviceTitle?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type BvnViewTab = "VERIFY" | "HISTORY";

export interface BvnSlipType3 {
  id: "BVN_CARD" | "BVN_SLIP_1" | "BVN_SLIP_2";
  name: string;
  label: string;
  price: number;
  badge: string;
  formatId: SlipFormatType;
}

export function getBvnSlipOptions(siteConfig?: any): BvnSlipType3[] {
  const priceMatrix = siteConfig?.priceMatrix || {};
  const slipPrices = priceMatrix.slipPrices || siteConfig?.systemSettings?.slipPrices || {};

  const cardPrice = typeof slipPrices.BVN_CARD === "number" ? slipPrices.BVN_CARD : 250;
  const slip1Price = typeof slipPrices.BVN_SLIP_1 === "number" ? slipPrices.BVN_SLIP_1 : 200;
  const slip2Price = typeof slipPrices.BVN_SLIP_2 === "number" ? slipPrices.BVN_SLIP_2 : 180;

  return [
    {
      id: "BVN_CARD",
      name: "BVN Card",
      label: "BVN Card",
      price: cardPrice,
      badge: "Plastic Card",
      formatId: "BVN_PREMIUM_CARD",
    },
    {
      id: "BVN_SLIP_1",
      name: "BVN Slip 1",
      label: "BVN Slip 1",
      price: slip1Price,
      badge: "Official Slip",
      formatId: "NIN_STANDARD",
    },
    {
      id: "BVN_SLIP_2",
      name: "BVN Slip 2",
      label: "BVN Slip 2",
      price: slip2Price,
      badge: "Basic Slip",
      formatId: "NIN_REGULAR" as any,
    },
  ];
}

export const mapBvnSlipToConfig = (s: BvnSlipType3): SlipOptionConfig => ({
  id: s.formatId,
  name: s.name,
  badge: s.badge,
  badgeColor: "bg-[#0F2D5C] text-white",
  price: s.price,
  description: `${s.name} generated with official NIBSS banking watermarks & QR verification.`,
  dimensions: s.id === "BVN_CARD" ? "CR80 Plastic Card Size" : "Standard A4 / Letter",
  recommendedFor: "Banking KYC & Identity Verification",
  themeColor: "#0F2D5C",
  bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
  features: ["NIBSS Verification Seal", "Scannable 2D QR Code", "Official Tracking ID", "Digital Watermark"],
  sampleLayout: s.id === "BVN_CARD" ? "PREMIUM_CARD" : "STANDARD_SLIP",
});

export const BvnVerificationView: React.FC<BvnVerificationViewProps> = ({
  userId,
  userEmail,
  serviceTitle,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const { config } = useSiteConfig();
  const availableSlips = getBvnSlipOptions(config);

  const [activeTab, setActiveTab] = useState<BvnViewTab>("VERIFY");
  const [selectedSlip, setSelectedSlip] = useState<BvnSlipType3 | null>(availableSlips[0] || null);

  const [primaryInput, setPrimaryInput] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [userBalance, setUserBalance] = useState<number>(0);
  const [stepMode, setStepMode] = useState<"INPUT" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  const [showSlipModal, setShowSlipModal] = useState(false);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistorySlip, setSelectedHistorySlip] = useState<StandardizedVerificationResult | null>(null);

  const effectiveRegisteredEmail = userEmail || "adamuamuhammad8541@gmail.com";
  const displayTitle = serviceTitle || "BVN Slip Print & Verification";

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

  useEffect(() => {
    if (activeTab === "HISTORY" && userId) {
      setHistoryLoading(true);
      VerificationEngineService.getVerificationHistory(userId)
        .then((items) => {
          const bvnItems = items.filter((i) => i.service === "BVN");
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

    const cleanBvn = primaryInput.trim();
    const validation = VerificationValidator.validateBVN(cleanBvn);
    if (!validation.valid) {
      setInputError(validation.error || "Please enter a valid 11-digit BVN.");
      return;
    }

    if (!hasConsent) {
      setInputError("You must confirm user consent to query NIBSS records under NDPR guidelines.");
      return;
    }

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
        serviceType: "BVN",
        primaryInput: cleanBvn,
        customFee: selectedSlip.price,
        slipType: selectedSlip.formatId,
        additionalFields: {
          slipType: selectedSlip.id,
          consent: true,
        },
      });

      if (res.success && res.result) {
        setResult(res.result);
        setStepMode("SUCCESS");
        if (onBalanceUpdate) onBalanceUpdate();
        refreshBalance();

        legalConsentService.recordAcceptance({
          userId,
          userEmail: effectiveRegisteredEmail,
          documentId: "kyc-notice",
          documentVersion: "2.1.0",
          scope: "KYC_VALIDATION",
          agreementType: "KYC_VALIDATION",
          status: "ACCEPTED",
          metadata: {
            serviceType: "BVN",
            bvn: cleanBvn,
            slipFormat: selectedSlip.id,
            timestamp: new Date().toISOString(),
          },
        }).catch((e) => console.warn("Legal consent recording note:", e));
      } else {
        setErrorState(
          res.errorState || {
            code: "VERIFICATION_FAILED",
            title: `${displayTitle} Failed`,
            message: "Unable to verify the provided BVN record at this time.",
            details: "Please verify the 11-digit BVN and try again.",
            retryable: true,
          }
        );
        setStepMode("ERROR");
      }
    } catch (err: any) {
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
    setErrorState(null);
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
              Securely verify a Bank Verification Number (BVN) in seconds
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
            <span>BVN Print &amp; Verify</span>
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
            ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
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

              {/* Dropdown with BVN Card, BVN Slip 1, BVN Slip 2 */}
              <div className="relative">
                <select
                  id="bvn-slip-type-selector"
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
                      {opt.name} ({opt.badge})
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
                      ₦{selectedSlip.price.toLocaleString("en-NG")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: 11-DIGIT BVN NUMBER INPUT ONLY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F2D5C]" />
                <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  ENTER 11-DIGIT BVN NUMBER
                </h2>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="bvnNumberInput" className="text-xs font-bold text-slate-700">
                    Bank Verification Number (BVN) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {primaryInput.length}/11 digits
                  </span>
                </div>
                <input
                  id="bvnNumberInput"
                  type="text"
                  maxLength={11}
                  value={primaryInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setPrimaryInput(val);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="e.g. 22113344556"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 font-mono text-base tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]"
                />
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <Info className="w-3.5 h-3.5 text-[#0F2D5C] shrink-0" />
                  <span>Enter the exact 11-digit BVN issued by NIBSS / commercial banks.</span>
                </p>
              </div>
            </div>

            {/* SECTION 3: CONSENT CHECKBOX */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="bvnUserConsent"
                  checked={hasConsent}
                  onChange={(e) => {
                    setHasConsent(e.target.checked);
                    if (inputError) setInputError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                />
                <label htmlFor="bvnUserConsent" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                  <strong className="text-slate-800 font-bold block mb-0.5">Mandatory NDPR &amp; NIBSS Consent Declaration</strong>
                  I confirm that I have explicit consent from the BVN holder to perform this identity verification and print the requested slip format.
                </label>
              </div>
            </div>

            {/* Error Message if any */}
            {inputError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inputError}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!selectedSlip || primaryInput.length !== 11 || !hasConsent}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                selectedSlip && primaryInput.length === 11 && hasConsent
                  ? "bg-[#0F2D5C] hover:bg-[#1E3A8A] text-white shadow-[#0F2D5C]/20 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                Verify &amp; Print {selectedSlip ? selectedSlip.name : "BVN Slip"} (₦{selectedSlip?.price || 0})
              </span>
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {stepMode === "LOADING" && (
          <VerificationLoader currentStep={currentStep} serviceTitle={displayTitle} />
        )}

        {/* SUCCESS STATE */}
        {stepMode === "SUCCESS" && result && (
          <div className="space-y-6">
            <VerificationSuccess
              result={result}
              onPrintSlip={() => setShowSlipModal(true)}
              onNewVerification={handleResetForm}
            />
          </div>
        )}

        {/* ERROR STATE */}
        {stepMode === "ERROR" && errorState && (
          <VerificationError
            errorState={errorState}
            onRetry={handleVerify}
            onBack={handleResetForm}
          />
        )}

        {/* TAB 2: AUDIT HISTORY */}
        {activeTab === "HISTORY" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase">BVN Query Audit Log</h3>
              <div className="relative w-48">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search history..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#0F2D5C]" />
                <span>Loading history records...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No BVN verification history found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{item.maskedId || item.verifiedId}</span>
                      <p className="text-[10px] text-slate-500">Ref: {item.reference} • {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHistorySlip({
                          status: item.status,
                          reference: item.reference,
                          message: "BVN Verification Record",
                          data: item.data || null,
                          timestamp: item.createdAt,
                          providerName: item.providerName,
                          responseTime: item.responseTime,
                          receiptNumber: item.receiptNumber,
                          service: item.service,
                          serviceTitle: item.serviceTitle,
                          fee: item.fee,
                          verifiedId: item.verifiedId,
                          maskedId: item.maskedId,
                          userId: item.userId,
                        });
                      }}
                      className="px-3 py-1.5 bg-[#0F2D5C] text-white rounded-xl font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slip Modal for Success Result */}
      {showSlipModal && result && (
        <SlipPrintModal
          verificationResult={result}
          userId={userId}
          userEmail={userEmail}
          initialFormat={selectedSlip ? selectedSlip.formatId : "NIN_STANDARD"}
          onClose={() => setShowSlipModal(false)}
        />
      )}

      {/* Slip Modal for History Item */}
      {selectedHistorySlip && (
        <SlipPrintModal
          verificationResult={selectedHistorySlip}
          userId={userId}
          userEmail={userEmail}
          initialFormat="NIN_STANDARD"
          onClose={() => setSelectedHistorySlip(null)}
        />
      )}
    </div>
  );
};
