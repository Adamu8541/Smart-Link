import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
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
  Briefcase,
  RotateCcw,
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
import { VerificationValidator } from "../../services/verificationValidator";
import { WalletService } from "../../services/walletService";
import { ConfirmationDialog } from "../wallet/ConfirmationDialog";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { VerificationReceipt } from "./VerificationReceipt";

interface CacVerificationViewProps {
  userId: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type CacViewTab = "VERIFY" | "HISTORY";
export type CacVerificationTypeOption =
  | "BUSINESS_NAME"
  | "COMPANY_RC"
  | "INCORPORATED_TRUSTEE"
  | "REGISTRATION_NUMBER";

export const CacVerificationView: React.FC<CacVerificationViewProps> = ({
  userId,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<CacViewTab>("VERIFY");

  // Selected CAC Verification Subtype
  const [cacType, setCacType] = useState<CacVerificationTypeOption>("COMPANY_RC");

  // Form inputs
  const [targetInput, setTargetInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("Corporate Due Diligence");
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const cacFee = 1000;
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
  const estimatedProcessingTime = "300ms";

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
          const cacItems = items.filter(
            (i) => i.service === "CAC" || i.service.startsWith("CAC_")
          );
          setHistory(cacItems);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, userId]);

  // Handle Input Validation
  const handleProceedToConfirmation = () => {
    const cleanTarget = targetInput.replace(/\s+/g, " ").trim();
    const cleanBizName = businessNameInput.trim();

    if (cacType === "BUSINESS_NAME") {
      if (!cleanBizName) {
        setInputError("Business Name is required.");
        return;
      }
      if (cleanBizName.length < 3) {
        setInputError("Business Name must be at least 3 characters.");
        return;
      }
      if (cleanBizName.length > 200) {
        setInputError("Business Name must not exceed 200 characters.");
        return;
      }
    } else if (cacType === "COMPANY_RC") {
      if (!cleanTarget) {
        setInputError("Company RC Number is required (e.g. RC1234567).");
        return;
      }
      if (cleanTarget.length < 3) {
        setInputError("RC Number must be at least 3 characters.");
        return;
      }
    } else if (cacType === "INCORPORATED_TRUSTEE") {
      if (!cleanTarget) {
        setInputError("Incorporated Trustee Registration Number is required (e.g. IT123456).");
        return;
      }
      if (cleanTarget.length < 3) {
        setInputError("IT Registration Number must be at least 3 characters.");
        return;
      }
    } else {
      // REGISTRATION_NUMBER
      if (!cleanTarget) {
        setInputError("CAC Registration Number is required.");
        return;
      }
      if (cleanTarget.length < 3) {
        setInputError("Registration Number must be at least 3 characters.");
        return;
      }
    }

    // Consent Checkbox Validation
    if (!userConsent) {
      setInputError("You must confirm user authorization and regulatory consent before querying CAC records.");
      return;
    }

    setInputError(null);
    setStepMode("CONFIRMATION");
  };

  // Execute Verification
  const handleConfirmAndExecute = async () => {
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const primaryInput = cacType === "BUSINESS_NAME" ? businessNameInput.trim() : targetInput.trim();

    try {
      // Call dedicated CAC backend endpoint directly or via VerificationEngine
      const startTime = Date.now();
      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[1]);

      const response = await fetch("/api/services/cac-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          verificationType: cacType,
          registrationNumber: primaryInput,
          businessName: businessNameInput.trim(),
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
          code: data.errorCode || "CAC_VERIFICATION_FAILED",
          message: data.error || "CAC verification request rejected by provider server.",
          friendlyMessage: data.friendlyMessage || "Business Verification Failed",
          details: data.details || data.error,
        });
        setStepMode("ERROR");
        return;
      }

      const standardizedResult: StandardizedVerificationResult = {
        status: data.status || "SUCCESS",
        reference: data.reference,
        message: data.message || "CAC Business Verification Completed Successfully",
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        providerName: data.providerName || "CAC Enterprise Portal",
        responseTime: data.responseTime || responseTime,
        receiptNumber: data.receiptNumber,
        service: "CAC",
        serviceTitle: "CAC Business Verification",
        fee: data.fee || cacFee,
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
        message: err.message || "Failed to communicate with CAC Enterprise Portal.",
        friendlyMessage: "CAC Portal Connection Failure",
        details: "Please check your network connection and try again.",
      });
      setStepMode("ERROR");
    }
  };

  const onProgressUpdate = (step: VerificationProgressStep) => {
    setCurrentStep(step);
  };

  const handleResetForm = () => {
    setTargetInput("");
    setBusinessNameInput("");
    setReferenceNote("");
    setVerificationPurpose("Corporate Due Diligence");
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
      (item.data && item.data.companyName && item.data.companyName.toLowerCase().includes(historySearch.toLowerCase()))
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

            <div className="p-3 bg-gradient-to-tr from-amber-600 to-yellow-600 text-white rounded-2xl shadow-md shadow-amber-600/20">
              <Building2 className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  CAC Business Verification
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                  CAC Abuja Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Corporate Affairs Commission register for Business Names, RC Companies, and Incorporated Trustees
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
              <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                ₦{cacFee.toLocaleString()}
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
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Building className="h-4 w-4" />
            <span>CAC Business Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <History className="h-4 w-4" />
            <span>CAC Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CAC Form & Execution */}
      {activeTab === "VERIFY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {stepMode === "INPUT" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Official Corporate Affairs Commission Registry</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Returns verified registration status, RC/BN/IT number, incorporation date, registered address, and board of directors.
                  </p>
                </div>
              </div>

              {/* Verification Type Selectors */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Verification Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCacType("COMPANY_RC");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                      cacType === "COMPANY_RC"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Company (RC Number)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCacType("BUSINESS_NAME");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                      cacType === "BUSINESS_NAME"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Briefcase className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Business Name</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCacType("INCORPORATED_TRUSTEE");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                      cacType === "INCORPORATED_TRUSTEE"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Building className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Incorporated Trustee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCacType("REGISTRATION_NUMBER");
                      setInputError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                      cacType === "REGISTRATION_NUMBER"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <FileCheck2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Registration Number</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Input Fields */}
              <div className="space-y-4">
                {cacType === "BUSINESS_NAME" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="bizNameInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Full Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="bizNameInput"
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => {
                        setBusinessNameInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder="e.g. SmartLink Digital Solutions"
                      className={`w-full px-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                        inputError
                          ? "border-rose-500 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:ring-amber-500/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Enter between 3 and 200 characters of the registered business name.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="targetNumberInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cacType === "COMPANY_RC"
                        ? "Company RC Number"
                        : cacType === "INCORPORATED_TRUSTEE"
                        ? "Incorporated Trustee Registration Number"
                        : "CAC Registration Number"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="targetNumberInput"
                      type="text"
                      value={targetInput}
                      onChange={(e) => {
                        setTargetInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={
                        cacType === "COMPANY_RC"
                          ? "e.g. RC1908234 or 1908234"
                          : cacType === "INCORPORATED_TRUSTEE"
                          ? "e.g. IT987654"
                          : "e.g. BN234567"
                      }
                      className={`w-full px-4 py-3.5 text-base bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-slate-900 dark:text-white ${
                        inputError
                          ? "border-rose-500 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:ring-amber-500/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Enter valid CAC Registration Number issued upon incorporation.</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cacVerificationPurpose" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Verification Purpose
                    </label>
                    <select
                      id="cacVerificationPurpose"
                      value={verificationPurpose}
                      onChange={(e) => setVerificationPurpose(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                    >
                      <option value="Corporate Due Diligence">Corporate Due Diligence</option>
                      <option value="KYC Onboarding">KYC Onboarding & Verification</option>
                      <option value="Vendor Background Check">Vendor Background Check</option>
                      <option value="Loan Assessment">Credit & Loan Assessment</option>
                      <option value="Asset Licensing">Asset Licensing & Legal Compliance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cacReferenceNote" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reference Note (Optional)
                    </label>
                    <input
                      id="cacReferenceNote"
                      type="text"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      placeholder="e.g. Compliance Audit #104"
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Mandatory Regulatory Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="checkbox"
                    id="cacConsentCheckbox"
                    checked={userConsent}
                    onChange={(e) => {
                      setUserConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="cacConsentCheckbox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                    I confirm that I have explicit authorization to verify this <span className="font-bold text-slate-800 dark:text-slate-100">CAC Corporate Entity Record</span> for legitimate due diligence purposes in accordance with CAC regulations & NDPR rules.
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
                  className="flex-1 py-3.5 px-6 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-amber-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Verify Business (₦{cacFee.toLocaleString()})</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={`CAC Business Verification (${cacType.replace("_", " ")})`}
            recipientDetails={
              cacType === "BUSINESS_NAME"
                ? `Business: ${businessNameInput}`
                : `RC/Reg No: ${targetInput}`
            }
            amount={cacFee}
            currentBalance={userBalance}
          />

          {/* Loading Progress State */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle="CAC Business Verification"
              providerName="CAC Enterprise Portal"
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

      {/* TAB 2: CAC History */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-amber-500" />
                <span>CAC Business Verification Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of all Corporate Affairs Commission queries executed on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by RC, Company Name, Ref..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
              <span>Loading CAC query history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building2 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No CAC Verifications Found</p>
              <p className="text-[11px] text-slate-400">Perform your first business query using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.data?.companyName || item.verifiedId}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                          {item.data?.companyStatus || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>Reg No: {item.maskedId}</span>
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
                          message: "CAC Business Verification Receipt",
                          data: item.data,
                          timestamp: item.createdAt,
                          providerName: item.providerName,
                          responseTime: item.responseTime,
                          receiptNumber: item.receiptNumber,
                          service: "CAC",
                          serviceTitle: "CAC Business Verification",
                          fee: item.fee,
                          verifiedId: item.verifiedId,
                          maskedId: item.maskedId,
                          userId: item.userId,
                        };
                        setSelectedHistoryReceipt(stdRes);
                      }}
                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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
