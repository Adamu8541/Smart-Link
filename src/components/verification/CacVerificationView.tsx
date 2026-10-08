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
  RotateCcw,
  Building,
  FileCheck2,
  Download,
  Printer,
  ChevronDown,
  Layers,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Award,
  X,
  Briefcase,
  Check,
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
import { VerificationReceipt } from "./VerificationReceipt";
import { formatNaira, formatSafeDateTime } from "../../utils/formatUtils";
import { generateCacVerificationPdf, CacReportData } from "../../services/cacPdfEngine";
import { getAuthHeaders } from "../../services/providerService";

interface CacVerificationViewProps {
  userId: string;
  userEmail?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type CacViewTab = "VERIFY" | "HISTORY";

export type CacVerificationTypeOption =
  | "CAC_BASIC"
  | "CAC_ADVANCE"
  | "CAC_BUSINESS_NAME"
  | "CAC_INCORPORATED_TRUSTEES"
  | "CAC_NAME_SEARCH"
  | "CAC_TIN"
  | "COMPANY_RC"
  | "BUSINESS_NAME"
  | "INCORPORATED_TRUSTEE";

export interface CacTypeConfig {
  id: CacVerificationTypeOption;
  label: string;
  shortName: string;
  categoryTag: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  isNameSearch?: boolean;
  helper: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CAC_TYPES: CacTypeConfig[] = [
  {
    id: "CAC_BASIC",
    label: "CAC Basic Verification (Company Status & RC/BN Lookup)",
    shortName: "Basic RC / BN Lookup",
    categoryTag: "Company Status",
    description: "Verify registered company or enterprise status, RC/BN number, incorporation date, and CAMA classification.",
    inputLabel: "RC or BN Registration Number",
    placeholder: "e.g. RC 1908234 or BN 2450123",
    helper: "Enter the official registration number (RC for limited companies, BN for business names).",
    badge: "Official RC Status",
    icon: Building2,
  },
  {
    id: "CAC_ADVANCE",
    label: "CAC Advanced Corporate Verification (Full Profile & Directors)",
    shortName: "Full Profile & Directors",
    categoryTag: "Board & Shares",
    description: "Comprehensive audit returning board of directors, registered office address, share capital, and principal objectives.",
    inputLabel: "Company RC / BN / IT Number",
    placeholder: "e.g. RC 1908234",
    helper: "Retrieves complete Board of Directors, shareholder information, and authorized share capital.",
    badge: "Directors & Capital",
    icon: Users,
  },
  {
    id: "CAC_BUSINESS_NAME",
    label: "CAC Business Name (BN Sole Proprietorship / Enterprise)",
    shortName: "Business Name (BN)",
    categoryTag: "Sole Proprietor",
    description: "Verify registered sole proprietorship and enterprise names (BN), registered trade activities, and owners.",
    inputLabel: "Business Name Registration Number (BN)",
    placeholder: "e.g. BN 2345678",
    helper: "Format: BN followed by numeric registration code.",
    badge: "Enterprise Record",
    icon: Briefcase,
  },
  {
    id: "CAC_INCORPORATED_TRUSTEES",
    label: "CAC Incorporated Trustees (NGOs, Foundations & Religious Bodies)",
    shortName: "Trustees & NGOs (IT)",
    categoryTag: "Part F Registry",
    description: "Verify registered Non-Governmental Organizations, charitable foundations, alumni associations, and churches/mosques.",
    inputLabel: "Trustee Registration Number (IT)",
    placeholder: "e.g. IT 123456",
    helper: "Format: IT followed by numeric certificate number.",
    badge: "NGOs & Non-Profits",
    icon: Building,
  },
  {
    id: "CAC_NAME_SEARCH",
    label: "CAC Company Name Search (Look Up by Registered Business Name)",
    shortName: "Registry Name Search",
    categoryTag: "Trade Name",
    description: "Search the official national registry by full business or company trade name to retrieve matching RC/BN records.",
    inputLabel: "Registered Business or Company Name",
    placeholder: "e.g. SmartLink Technologies Limited",
    isNameSearch: true,
    helper: "Enter the registered trade or corporate legal name.",
    badge: "Search by Name",
    icon: Search,
  },
  {
    id: "CAC_TIN",
    label: "CAC Company & Tax Compliance (CAC + Joint Tax Board TIN)",
    shortName: "CAC + Tax ID (TIN)",
    categoryTag: "Tax & Compliance",
    description: "Simultaneous verification of CAC corporate entity linked with Joint Tax Board (JTB) / FIRS Tax ID Number records.",
    inputLabel: "RC Number or Tax ID (TIN)",
    placeholder: "e.g. RC 1908234 or 23456789-0001",
    helper: "Enter either CAC registration number or official FIRS 10-14 digit TIN.",
    badge: "Tax Link Record",
    icon: FileCheck2,
  },
];

export const CacVerificationView: React.FC<CacVerificationViewProps> = ({
  userId,
  userEmail = "",
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<CacViewTab>("VERIFY");

  // Selected CAC Verification Type
  const [cacType, setCacType] = useState<CacVerificationTypeOption>("CAC_BASIC");

  // Form inputs
  const [targetInput, setTargetInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("Corporate Due Diligence");
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const cacFee = 500;
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "CONFIRMATION" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState<StandardizedVerificationResult | null>(null);

  // Active configuration for selected type
  const activeTypeConfig = CAC_TYPES.find((t) => t.id === cacType) || CAC_TYPES[0];

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

    if (activeTypeConfig.isNameSearch) {
      const searchTarget = cleanBizName || cleanTarget;
      if (!searchTarget) {
        setInputError("Registered Business or Company Name is required.");
        return;
      }
      if (searchTarget.length < 3) {
        setInputError("Business Name must be at least 3 characters.");
        return;
      }
    } else {
      if (!cleanTarget) {
        setInputError(`${activeTypeConfig.inputLabel} is required.`);
        return;
      }
      if (cleanTarget.length < 3) {
        setInputError(`${activeTypeConfig.inputLabel} must be at least 3 characters.`);
        return;
      }
    }

    if (!userConsent) {
      setInputError("Please check the consent authorization box before submitting.");
      return;
    }

    setInputError(null);
    setStepMode("CONFIRMATION");
  };

  // Trigger PDF Generation & Download
  const triggerPdfDownload = async (customResult?: StandardizedVerificationResult) => {
    const targetResult = customResult || result;
    if (!targetResult) return;
    setIsDownloadingPdf(true);
    try {
      const d = targetResult.data || {};
      const reportData: CacReportData = {
        companyName: d.companyName || d.name || d.businessName || targetResult.verifiedId || "CAC REGISTERED ENTITY",
        rcNumber: d.rcNumber || d.registrationNumber || targetResult.verifiedId || "",
        companyType: d.companyType || d.classification,
        classification: d.classification || d.companyType,
        registrationDate: d.registrationDate || d.incorporationDate,
        incorporationDate: d.incorporationDate || d.registrationDate,
        companyStatus: d.companyStatus || d.status || "ACTIVE",
        status: d.status || "ACTIVE",
        address: d.address || d.headOffice || d.branchAddress,
        headOffice: d.headOffice || d.address,
        branchAddress: d.branchAddress,
        city: d.city,
        state: d.state,
        lga: d.lga,
        tin: d.tin,
        taxOffice: d.taxOffice,
        email: d.email,
        phoneNumber: d.phoneNumber,
        natureOfBusiness: d.natureOfBusiness,
        shareCapital: d.shareCapital,
        directors: d.directors,
        verificationType: cacType,
        reference: targetResult.reference,
        providerReference: (targetResult as any).providerReference || targetResult.receiptNumber,
        providerName: "Corporate Affairs Commission Records",
        timestamp: targetResult.timestamp,
        verifiedBy: "SmartLink Corporate Verification Portal",
        rawResponse: d,
      };
      await generateCacVerificationPdf(reportData);
    } catch (err) {
      console.error("CAC PDF generation error:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Execute Verification
  const handleConfirmAndExecute = async () => {
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const primaryInput = activeTypeConfig.isNameSearch
      ? (businessNameInput.trim() || targetInput.trim())
      : targetInput.trim();

    try {
      const startTime = Date.now();
      const timer1 = setTimeout(() => onProgressUpdate(VERIFICATION_PROGRESS_STEPS[1]), 500);
      const timer2 = setTimeout(() => onProgressUpdate(VERIFICATION_PROGRESS_STEPS[2]), 1100);
      const timer3 = setTimeout(() => onProgressUpdate(VERIFICATION_PROGRESS_STEPS[3]), 2000);

      const authHeaders = await getAuthHeaders(userId);
      const response = await fetch("/api/services/cac-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          userId,
          verificationType: cacType,
          registrationNumber: primaryInput,
          businessName: businessNameInput.trim() || primaryInput,
          referenceNote,
          verificationPurpose,
          consent: userConsent,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[4]);

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (!response.ok || !data.success) {
        setErrorState({
          code: data.errorCode || "CAC_VERIFICATION_FAILED",
          message: data.error || "CAC verification request could not be processed.",
          friendlyMessage: data.friendlyMessage || "CAC Business Record Not Found",
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
        providerName: "Corporate Affairs Commission National Registry",
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

      // Trigger automatic PDF download upon data arrival as requested
      setTimeout(() => {
        triggerPdfDownload(standardizedResult);
      }, 500);
    } catch (err: any) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err.message || "Failed to communicate with CAC National Registry.",
        friendlyMessage: "CAC Portal Network Connection Failure",
        details: "Please verify your internet connection and try again.",
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
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden font-sans select-text text-left">
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
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CAC Verification
            </h1>
            <p className="text-xs text-white/80">
              Official Corporate Affairs Commission Registry Lookup
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
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Stepper / Tabs Bar */}
      <div className="bg-slate-100/90 p-2 border-b border-slate-200/80 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "VERIFY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Search &amp; Verify</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-mono">
          <Wallet className="w-3.5 h-3.5 text-[#0F2D5C]" />
          <span>{formatNaira(userBalance)}</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-6 bg-white">
        {/* TAB 1: New CAC Verification Form */}
        {activeTab === "VERIFY" && (
          <div className="space-y-6">
            {stepMode === "INPUT" && (
              <div className="space-y-6">
                {/* Service Fee Header Banner */}
                <div className="bg-[#0F2D5C] text-white rounded-2xl p-4 shadow-md border border-[#0F2D5C]/80 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-sm font-mono shadow-inner">
                      ₦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                          CAC Search Filing Fee
                        </span>
                        <span className="text-[10px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full border border-white/20 font-semibold">
                          Instant Search
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-medium mt-0.5">
                        Auto-deducted from wallet on successful verification
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-amber-300 font-mono tracking-tight">
                      {formatNaira(cacFee)}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Wallet checked
                    </span>
                  </div>
                </div>

                {/* 1. CAC Verification Type Dropdown Selection (Clean single dropdown) */}
                <div className="space-y-2">
                  <label htmlFor="cacTypeDropdown" className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Select CAC Verification Type <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      id="cacTypeDropdown"
                      value={cacType}
                      onChange={(e) => {
                        setCacType(e.target.value as CacVerificationTypeOption);
                        setInputError(null);
                      }}
                      className="w-full px-4 py-3.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 appearance-none cursor-pointer focus:ring-2 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] focus:outline-none shadow-xs"
                    >
                      {CAC_TYPES.map((type) => (
                        <option
                          key={type.id}
                          value={type.id}
                          className="bg-white text-slate-900 py-2"
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 h-4 w-4 text-slate-600 pointer-events-none" />
                  </div>

                  {/* Selected Type Guidance Card */}
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-[#0F2D5C]">
                        {activeTypeConfig.shortName} ({activeTypeConfig.categoryTag})
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {activeTypeConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

              {/* 2. Primary Input Field with Clear High Contrast */}
              <div className="space-y-4">
                {activeTypeConfig.isNameSearch ? (
                  <div className="space-y-1.5">
                    <label htmlFor="bizNameInput" className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {activeTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bizNameInput"
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => {
                        setBusinessNameInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={activeTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-sm font-medium bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${
                        inputError
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-slate-300 dark:border-slate-700 focus:border-[#0F2D5C] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
                      <span>{activeTypeConfig.helper}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="targetNumberInput" className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {activeTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="targetNumberInput"
                      type="text"
                      value={targetInput}
                      onChange={(e) => {
                        setTargetInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={activeTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-base font-mono font-bold tracking-wider bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${
                        inputError
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-slate-300 dark:border-slate-700 focus:border-[#0F2D5C] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
                      <span>{activeTypeConfig.helper}</span>
                    </p>
                  </div>
                )}

                {/* Additional Inputs: Purpose & Reference Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cacVerificationPurpose" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Verification Purpose
                    </label>
                    <select
                      id="cacVerificationPurpose"
                      value={verificationPurpose}
                      onChange={(e) => setVerificationPurpose(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]/20"
                    >
                      <option value="Corporate Due Diligence">Corporate Due Diligence</option>
                      <option value="KYC Onboarding">KYC Onboarding & Account Opening</option>
                      <option value="Vendor Background Check">Vendor & Contractor Vetting</option>
                      <option value="Credit Assessment">Credit & Loan Assessment</option>
                      <option value="Legal Compliance">Legal Compliance & CAMA Audit</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cacReferenceNote" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Audit Reference Note (Optional)
                    </label>
                    <input
                      id="cacReferenceNote"
                      type="text"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      placeholder="e.g. Compliance Audit #2026-01"
                      className="w-full px-4 py-3 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]/20"
                    />
                  </div>
                </div>

                {/* Mandatory Regulatory Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="checkbox"
                    id="cacConsentCheckbox"
                    checked={userConsent}
                    onChange={(e) => {
                      setUserConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer shrink-0"
                  />
                  <label htmlFor="cacConsentCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer leading-relaxed">
                    I confirm that I possess authorized regulatory consent to query this <span className="font-extrabold text-slate-900 dark:text-white">Corporate Affairs Commission (CAC)</span> record under the Companies and Allied Matters Act (CAMA 2020) and Nigerian Data Protection Regulations (NDPR).
                  </label>
                </div>

                {/* Input Error Callout */}
                {inputError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: SmartLink Exact Navy Theme */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto py-3.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-white" />
                  <span>Clear Form</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-[#0F2D5C]/20 hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4 text-white" />
                  <span>Verify CAC Record ({formatNaira(cacFee)})</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={`CAC Verification (${activeTypeConfig.shortName})`}
            recipientDetails={
              activeTypeConfig.isNameSearch
                ? `Company: ${businessNameInput || targetInput}`
                : `Registration No: ${targetInput}`
            }
            amount={cacFee}
            currentBalance={userBalance}
          />

          {/* Loading Progress State */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle={`CAC Verification (${activeTypeConfig.shortName})`}
              providerName="Corporate Affairs Commission Registry"
              userId={userId}
              userEmail={userEmail}
            />
          )}

          {/* SUCCESS MODE: Formatted CAC Profile & PDF Auto-Download Notice */}
          {stepMode === "SUCCESS" && result && (
            <div className="space-y-5">
              {/* PDF Auto-Download Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0A5C36] text-white rounded-xl shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0A5C36] dark:text-emerald-400 uppercase tracking-wider">
                      Search Report PDF Auto-Downloaded
                    </h3>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      Your 300 DPI CAC Status Search Report was generated and downloaded automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerPdfDownload()}
                    disabled={isDownloadingPdf}
                    className="px-4 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`h-4 w-4 text-white ${isDownloadingPdf ? "animate-bounce" : ""}`} />
                    <span>{isDownloadingPdf ? "Generating..." : "Download PDF Again"}</span>
                  </button>
                </div>
              </div>

              {/* Formatted Corporate Result Card */}
              <div className="bg-white dark:bg-slate-900 border-2 border-[#0F2D5C] dark:border-blue-600 rounded-3xl overflow-hidden shadow-lg shadow-[#0F2D5C]/5">
                {/* Official Certificate Header */}
                <div className="bg-[#0F2D5C] p-6 text-white text-center space-y-1.5 relative">
                  <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-1">
                    <Building2 className="h-8 w-8 text-blue-200" />
                  </div>
                  <h2 className="text-xs font-extrabold tracking-widest text-blue-200 uppercase">
                    FEDERAL REPUBLIC OF NIGERIA
                  </h2>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    CORPORATE AFFAIRS COMMISSION
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    National Corporate Status & Verification Certificate
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-blue-200">
                    <span>REF: {result.reference}</span>
                    <span>•</span>
                    <span>EXTRACTED: {formatSafeDateTime(result.timestamp)}</span>
                    <span>•</span>
                    <span>SOURCE: CAC NATIONAL REGISTRY</span>
                  </div>
                </div>

                {/* Company Name & Status Strip */}
                <div className="p-5 sm:p-6 bg-blue-50/50 dark:bg-slate-800/80 border-b border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#0F2D5C] dark:text-blue-400 uppercase tracking-wider block">
                      Registered Corporate Entity Name
                    </span>
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase">
                      {result.data?.companyName || result.data?.name || result.verifiedId}
                    </h4>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      REGISTRATION NO: <span className="text-[#0F2D5C] dark:text-blue-400 font-extrabold">{result.data?.rcNumber || result.verifiedId}</span>
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-100 text-[#0F2D5C] dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                      <Award className="h-4 w-4 text-[#0F2D5C] dark:text-blue-400" />
                      <span>{result.data?.companyStatus || result.data?.status || "ACTIVE"}</span>
                    </span>
                  </div>
                </div>

                {/* Particulars Grid: High Contrast */}
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-[#0F2D5C]" />
                        <span>Registration Number</span>
                      </span>
                      <p className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                        {result.data?.rcNumber || result.verifiedId}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#0F2D5C]" />
                        <span>Incorporation Date</span>
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {result.data?.registrationDate || result.data?.incorporationDate || "Officially Registered"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Building className="h-3 w-3 text-[#0F2D5C]" />
                        <span>Entity Classification</span>
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {result.data?.companyType || result.data?.classification || "Private Limited Company (LTD)"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#0F2D5C]" />
                        <span>Registered Office Address</span>
                      </span>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {result.data?.address || result.data?.headOffice || "Federal Republic of Nigeria"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                        <FileCheck2 className="h-3 w-3 text-[#0F2D5C]" />
                        <span>Tax ID Number (TIN)</span>
                      </span>
                      <p className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                        {result.data?.tin || "FIRS / JTB Integrated"}
                      </p>
                    </div>
                  </div>

                  {/* Registered Objectives */}
                  {result.data?.natureOfBusiness && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block">
                        Principal Business Activities & Objectives
                      </span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {result.data.natureOfBusiness}
                      </p>
                    </div>
                  )}

                  {/* Directors & Officers Table */}
                  {result.data?.directors && result.data.directors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#0F2D5C]" />
                        <span>Board of Directors & Principal Officers</span>
                      </span>
                      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-3">Officer Name</th>
                              <th className="p-3">Designation</th>
                              <th className="p-3">Appointment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {result.data.directors.map((dir: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-3 font-bold text-slate-900 dark:text-white">{dir.name || "OFFICER"}</td>
                                <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{dir.designation || dir.role || "DIRECTOR"}</td>
                                <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{dir.appointmentDate || "AT INCORPORATION"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons: Exact Smart Link Color */}
                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-3 px-5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-white" />
                    <span>Verify Another Entity</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-3 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5 text-white" />
                      <span>Print</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerPdfDownload()}
                      disabled={isDownloadingPdf}
                      className="py-3 px-5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-[#0F2D5C]/20 hover:shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className={`h-4 w-4 text-white ${isDownloadingPdf ? "animate-bounce" : ""}`} />
                      <span>{isDownloadingPdf ? "Generating..." : "Download Official PDF"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-[#0A5C36]" />
                <span>CAC Business Verification Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Audit records of all Corporate Affairs Commission queries executed on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by RC, Company Name, Ref..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#0F2D5C]" />
              <span>Loading CAC query history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building2 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No CAC Verifications Found</p>
              <p className="text-[11px] text-slate-500">Perform your first business query using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#0F2D5C]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0F2D5C] dark:text-blue-400 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.data?.companyName || item.verifiedId}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 text-[#0F2D5C] dark:bg-blue-950 dark:text-blue-300">
                          {item.data?.companyStatus || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>Reg No: {item.maskedId}</span>
                        <span>•</span>
                        <span>Ref: #{item.reference}</span>
                        <span>•</span>
                        <span>{formatSafeDateTime(item.createdAt, "Recently")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formatNaira(item.fee ?? 0)}
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
                        triggerPdfDownload(stdRes);
                      }}
                      className="px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5 text-white" />
                      <span>PDF</span>
                    </button>
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
                      className="px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-white" />
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
    </div>
  );
};
