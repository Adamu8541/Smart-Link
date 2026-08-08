import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileCheck,
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
  Building2,
  RotateCcw,
  Receipt,
  Building,
  FileCheck2,
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
import { ConfirmationDialog } from "../wallet/ConfirmationDialog";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { VerificationReceipt } from "./VerificationReceipt";

interface TinVerificationViewProps {
  userId: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type TinViewTab = "VERIFY" | "HISTORY";
export type TinVerificationTypeOption = "VERIFY_BY_TIN" | "VERIFY_BY_BUSINESS_NAME" | "VERIFY_BY_RC_NUMBER";

export const TinVerificationView: React.FC<TinVerificationViewProps> = ({
  userId,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TinViewTab>("VERIFY");

  // Selected TIN Verification Option
  const [tinType, setTinType] = useState<TinVerificationTypeOption>("VERIFY_BY_TIN");

  // Form Inputs
  const [tinNumberInput, setTinNumberInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [rcNumberInput, setRcNumberInput] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("Tax Compliance & Filing Audit");
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const tinFee = 500;
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "CONFIRMATION" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState<StandardizedVerificationResult | null>(null);

  // Provider Status & Speed
  const providerStatus = "ONLINE";
  const estimatedProcessingTime = "250ms";

  // Fetch initial balance
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

  // Load history when tab changes to HISTORY
  useEffect(() => {
    if (activeTab === "HISTORY" && userId) {
      setHistoryLoading(true);
      VerificationEngineService.getVerificationHistory(userId)
        .then((items) => {
          const tinItems = items.filter(
            (i) => i.service === "TIN" || i.service.startsWith("TIN_") || i.service === "TAX"
          );
          setHistory(tinItems);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, userId]);

  // Handle Input Validation
  const handleProceedToConfirmation = () => {
    const cleanTin = tinNumberInput.replace(/\s+/g, "").trim();
    const cleanBizName = businessNameInput.trim();
    const cleanRc = rcNumberInput.replace(/\s+/g, "").trim();

    if (tinType === "VERIFY_BY_TIN") {
      if (!cleanTin) {
        setInputError("Tax Identification Number (TIN) is required.");
        return;
      }
      if (cleanTin.length < 5) {
        setInputError("TIN Number must be at least 5 alphanumeric characters.");
        return;
      }
    } else if (tinType === "VERIFY_BY_BUSINESS_NAME") {
      if (!cleanBizName) {
        setInputError("Registered Business Name is required.");
        return;
      }
      if (cleanBizName.length < 3) {
        setInputError("Business Name must be at least 3 characters.");
        return;
      }
    } else if (tinType === "VERIFY_BY_RC_NUMBER") {
      if (!cleanRc) {
        setInputError("RC or Business Registration Number is required.");
        return;
      }
      if (cleanRc.length < 3) {
        setInputError("RC Number must be at least 3 characters.");
        return;
      }
    }

    // Consent Checkbox Validation
    if (!userConsent) {
      setInputError("You must confirm user authorization and regulatory consent before querying JTB / FIRS tax records.");
      return;
    }

    setInputError(null);
    setStepMode("CONFIRMATION");
  };

  // Execute Verification
  const handleConfirmAndExecute = async () => {
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const primaryInput =
      tinType === "VERIFY_BY_TIN"
        ? tinNumberInput.replace(/\s+/g, "").trim()
        : tinType === "VERIFY_BY_BUSINESS_NAME"
        ? businessNameInput.trim()
        : rcNumberInput.replace(/\s+/g, "").trim();

    try {
      const startTime = Date.now();
      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[1]);

      const response = await fetch("/api/services/tin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          verificationType: tinType,
          tinNumber: tinNumberInput.replace(/\s+/g, "").trim(),
          businessName: businessNameInput.trim(),
          rcNumber: rcNumberInput.replace(/\s+/g, "").trim(),
          referenceNote,
          verificationPurpose,
          consent: userConsent,
        }),
      });

      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[4]);

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (!response.ok || !data.success) {
        setErrorState({
          code: data.errorCode || "TIN_VERIFICATION_FAILED",
          message: data.error || "TIN verification request rejected by JTB / FIRS server.",
          friendlyMessage: data.friendlyMessage || "TIN Tax Search Failed",
          details: data.details || data.error,
        });
        setStepMode("ERROR");
        return;
      }

      const standardizedResult: StandardizedVerificationResult = {
        status: data.status || "SUCCESS",
        reference: data.reference,
        message: data.message || "TIN Verification Completed Successfully",
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        providerName: data.providerName || "Joint Tax Board (JTB) Gateway",
        responseTime: data.responseTime || responseTime,
        receiptNumber: data.receiptNumber,
        service: "TIN",
        serviceTitle: "TIN Tax Verification",
        fee: data.fee || tinFee,
        verifiedId: primaryInput,
        maskedId: data.maskedId || primaryInput,
        userId,
      };

      setResult(standardizedResult);
      setStepMode("SUCCESS");
      refreshBalance();
      onBalanceUpdate?.();
    } catch (err: any) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err.message || "Failed to communicate with Joint Tax Board Gateway.",
        friendlyMessage: "JTB Tax Gateway Connection Failure",
        details: "Please check your network connection and try again.",
      });
      setStepMode("ERROR");
    }
  };

  const onProgressUpdate = (step: VerificationProgressStep) => {
    setCurrentStep(step);
  };

  const handleResetForm = () => {
    setTinNumberInput("");
    setBusinessNameInput("");
    setRcNumberInput("");
    setReferenceNote("");
    setVerificationPurpose("Tax Compliance & Filing Audit");
    setUserConsent(false);
    setInputError(null);
    setResult(null);
    setErrorState(null);
    setStepMode("INPUT");
  };

  // Filtered History
  const filteredHistory = history.filter(
    (item) =>
      !historySearch ||
      item.verifiedId.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.maskedId.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.reference.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.receiptNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.data && item.data.taxpayerName && item.data.taxpayerName.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 text-left">
      {/* Top Header Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
              <FileCheck className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Tax Identification Number (TIN) Verification
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                  JTB & FIRS Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Joint Tax Board & Federal Inland Revenue Service taxpayer status database lookup
              </p>
            </div>
          </div>

          {/* Service Meta Stats & Wallet */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Balance</span>
              <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee</span>
              <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                ₦{tinFee.toLocaleString()}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {providerStatus}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Speed</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                {estimatedProcessingTime}
              </span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VERIFY"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>TIN Tax Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <History className="h-4 w-4" />
            <span>TIN Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TIN Verification Form */}
      {activeTab === "VERIFY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {stepMode === "INPUT" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Official Joint Tax Board (JTB) Central Database</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Retrieves official tax office registration, taxpayer classification, active compliance status, and registered corporate RC/BN link.
                  </p>
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Search Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTinType("VERIFY_BY_TIN");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      tinType === "VERIFY_BY_TIN"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Verify by TIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTinType("VERIFY_BY_BUSINESS_NAME");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      tinType === "VERIFY_BY_BUSINESS_NAME"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    <span>Business Name</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTinType("VERIFY_BY_RC_NUMBER");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      tinType === "VERIFY_BY_RC_NUMBER"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    <span>RC Number</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-4">
                {tinType === "VERIFY_BY_TIN" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinInputNumber" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tax Identification Number (TIN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="tinInputNumber"
                      type="text"
                      value={tinNumberInput}
                      onChange={(e) => {
                        setTinNumberInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder="e.g. 23456789-0001 or 1234567890"
                      className={`w-full px-4 py-3.5 text-base bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-slate-900 dark:text-white ${
                        inputError
                          ? "border-rose-500 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Enter valid JTB / FIRS Tax Identification Number issued to individual or corporate taxpayer.</span>
                    </p>
                  </div>
                )}

                {tinType === "VERIFY_BY_BUSINESS_NAME" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinBizNameInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Registered Business / Taxpayer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="tinBizNameInput"
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => {
                        setBusinessNameInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder="e.g. SmartLink Digital Systems Ltd"
                      className={`w-full px-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                        inputError
                          ? "border-rose-500 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Enter the exact registered corporate or trade name registered with FIRS.</span>
                    </p>
                  </div>
                )}

                {tinType === "VERIFY_BY_RC_NUMBER" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinRcNumberInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Company RC or BN Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="tinRcNumberInput"
                      type="text"
                      value={rcNumberInput}
                      onChange={(e) => {
                        setRcNumberInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder="e.g. RC1908234 or BN3498102"
                      className={`w-full px-4 py-3.5 text-base bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-slate-900 dark:text-white ${
                        inputError
                          ? "border-rose-500 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Enter the CAC registration number to query linked federal TIN records.</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="tinVerificationPurpose" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Verification Purpose
                    </label>
                    <select
                      id="tinVerificationPurpose"
                      value={verificationPurpose}
                      onChange={(e) => setVerificationPurpose(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                    >
                      <option value="Tax Compliance & Filing Audit">Tax Compliance & Filing Audit</option>
                      <option value="KYC Onboarding">KYC Onboarding & Bank Account</option>
                      <option value="Government Contract Bidding">Government Contract Tender</option>
                      <option value="Corporate Due Diligence">Corporate Vendor Verification</option>
                      <option value="Loan Application">Credit & Loan Documentation</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tinReferenceNote" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reference Note (Optional)
                    </label>
                    <input
                      id="tinReferenceNote"
                      type="text"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      placeholder="e.g. Audit Filing Ref #554"
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="checkbox"
                    id="tinConsentCheckbox"
                    checked={userConsent}
                    onChange={(e) => {
                      setUserConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="tinConsentCheckbox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                    I confirm that I have explicit authorization to verify this <span className="font-bold text-slate-800 dark:text-slate-100">Tax Identification Record</span> for legitimate compliance purposes under JTB, FIRS & NDPR guidelines.
                  </label>
                </div>

                {/* Input Error Callout */}
                {inputError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Form</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Verify TIN (₦{tinFee.toLocaleString()})</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={`TIN Tax Verification (${tinType.replace(/_/g, " ")})`}
            recipientDetails={
              tinType === "VERIFY_BY_TIN"
                ? `TIN: ${tinNumberInput}`
                : tinType === "VERIFY_BY_BUSINESS_NAME"
                ? `Business: ${businessNameInput}`
                : `RC: ${rcNumberInput}`
            }
            amount={tinFee}
            currentBalance={userBalance}
          />

          {/* Loading Progress State */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle="TIN Tax Verification"
              providerName="Joint Tax Board (JTB) Gateway"
            />
          )}

          {/* Success Result View */}
          {stepMode === "SUCCESS" && result && (
            <VerificationSuccess
              result={result}
              onRepeatVerification={() => setStepMode("CONFIRMATION")}
              onNewVerification={handleResetForm}
            />
          )}

          {/* Error View */}
          {stepMode === "ERROR" && errorState && (
            <VerificationError
              errorState={errorState}
              onRetry={handleConfirmAndExecute}
              onBack={() => setStepMode("INPUT")}
            />
          )}
        </div>
      )}

      {/* TAB 2: TIN History */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-500" />
                <span>TIN Tax Verification Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of all Joint Tax Board & FIRS query executions on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by TIN, Name, Ref..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
              <span>Loading TIN query history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileCheck className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No TIN Verifications Found</p>
              <p className="text-[11px] text-slate-400">Perform your first tax query using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.data?.taxpayerName || item.verifiedId}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                          {item.data?.taxStatus || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>TIN: {item.maskedId}</span>
                        <span>•</span>
                        <span>Ref: #{item.reference}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      ₦{item.fee.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const stdRes: StandardizedVerificationResult = {
                          status: item.status,
                          reference: item.reference,
                          message: "TIN Tax Verification Receipt",
                          data: item.data,
                          timestamp: item.createdAt,
                          providerName: item.providerName,
                          responseTime: item.responseTime,
                          receiptNumber: item.receiptNumber,
                          service: "TIN",
                          serviceTitle: "TIN Tax Verification",
                          fee: item.fee,
                          verifiedId: item.verifiedId,
                          maskedId: item.maskedId,
                          userId: item.userId,
                        };
                        setSelectedHistoryReceipt(stdRes);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Receipt Modal */}
      {selectedHistoryReceipt && (
        <VerificationReceipt
          result={selectedHistoryReceipt}
          onClose={() => setSelectedHistoryReceipt(null)}
        />
      )}
    </div>
  );
};
