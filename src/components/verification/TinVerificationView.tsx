import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Info,
  Lock,
  History,
  CheckCircle2,
  FileText,
  Search,
  RefreshCw,
  Clock,
  Building2,
  RotateCcw,
  Building,
  Phone,
  Layers,
  ChevronDown,
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
import { SlipPrintEngine } from "../../services/slipPrintEngine";
import { VerificationReceipt } from "./VerificationReceipt";
import { formatNaira, formatSafeDateTime } from "../../utils/formatUtils";
import { getAuthHeaders } from "../../services/providerService";

interface TinVerificationViewProps {
  userId: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type TinViewTab = "VERIFY" | "HISTORY";
export type TinVerificationTypeOption =
  | "VERIFY_BY_TIN"
  | "VERIFY_BY_RC_NUMBER"
  | "VERIFY_BY_BUSINESS_NAME"
  | "VERIFY_BY_PHONE";

interface TinTypeOptionMeta {
  id: TinVerificationTypeOption;
  label: string;
  shortLabel: string;
  badge: string;
  inputLabel: string;
  placeholder: string;
  description: string;
  helpText: string;
  icon: React.FC<{ className?: string }>;
  example: string;
}

const TIN_TYPE_OPTIONS: TinTypeOptionMeta[] = [
  {
    id: "VERIFY_BY_TIN",
    label: "Verify by Tax Identification Number (TIN)",
    shortLabel: "Tax ID (TIN)",
    badge: "Direct TIN",
    inputLabel: "Federal Tax Identification Number (TIN)",
    placeholder: "e.g. 23456789-0001 or 1234567890",
    description: "Verify active taxpayer status, legal name, and assigned tax office using an official JTB / FIRS Tax ID.",
    helpText: "Enter the standard 10 or 12-digit numeric or hyphenated Tax Identification Number.",
    icon: FileCheck,
    example: "23456789-0001",
  },
  {
    id: "VERIFY_BY_RC_NUMBER",
    label: "Verify by CAC RC / BN Registration Number",
    shortLabel: "CAC RC / BN",
    badge: "CAC Linked",
    inputLabel: "CAC Registration Number (RC / BN / IT)",
    placeholder: "e.g. RC1908234 or BN3498102",
    description: "Validate corporate taxpayer credentials and retrieve linked TIN records from CAC registration numbers.",
    helpText: "Enter the Corporate Affairs Commission registration number (RC, BN, IT, or LLP).",
    icon: Building2,
    example: "RC1908234",
  },
  {
    id: "VERIFY_BY_BUSINESS_NAME",
    label: "Verify by Registered Business / Legal Name",
    shortLabel: "Business Name",
    badge: "Entity Search",
    inputLabel: "Registered Business or Corporate Name",
    placeholder: "e.g. SmartLink Digital Systems Ltd",
    description: "Search the Joint Tax Board central corporate registry by legal trade or incorporated entity name.",
    helpText: "Enter the full registered business name as filed with the Corporate Affairs Commission.",
    icon: Building,
    example: "SmartLink Digital Systems Ltd",
  },
  {
    id: "VERIFY_BY_PHONE",
    label: "TIN Retrieval by Registered Phone Number",
    shortLabel: "Phone Retrieval",
    badge: "Mobile Query",
    inputLabel: "Registered Taxpayer Mobile Phone Number",
    placeholder: "e.g. 08012345678 or 09087654321",
    description: "Query linked individual or corporate Tax Identification Numbers using registered telephone contact.",
    helpText: "Enter the active 11-digit Nigerian mobile number linked to the taxpayer registry.",
    icon: Phone,
    example: "08012345678",
  },
];

export const TinVerificationView: React.FC<TinVerificationViewProps> = ({
  userId,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TinViewTab>("VERIFY");

  // Selected TIN Verification Type
  const [tinType, setTinType] = useState<TinVerificationTypeOption>("VERIFY_BY_TIN");

  // Form Inputs
  const [tinNumberInput, setTinNumberInput] = useState("");
  const [rcNumberInput, setRcNumberInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("Tax Compliance & Filing Audit");
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const tinFee = 500;
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "CONFIRMATION" | "LOADING" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Cached PDF Slip for instant download & email dispatch right from loader
  const [cachedPdfBytes, setCachedPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [cachedFilename, setCachedFilename] = useState<string>("Official_TIN_Verification_Slip.pdf");

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState<StandardizedVerificationResult | null>(null);

  // Active Type metadata
  const currentTypeConfig = TIN_TYPE_OPTIONS.find((t) => t.id === tinType) || TIN_TYPE_OPTIONS[0];

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
    const cleanRc = rcNumberInput.replace(/\s+/g, "").trim();
    const cleanBizName = businessNameInput.trim();
    const cleanPhone = phoneNumberInput.replace(/\s+/g, "").trim();

    if (tinType === "VERIFY_BY_TIN") {
      if (!cleanTin) {
        setInputError("Please enter the Tax Identification Number (TIN).");
        return;
      }
      if (cleanTin.length < 5) {
        setInputError("TIN Number must be at least 5 alphanumeric characters.");
        return;
      }
    } else if (tinType === "VERIFY_BY_RC_NUMBER") {
      if (!cleanRc) {
        setInputError("Please enter the CAC RC or Business Registration Number.");
        return;
      }
      if (cleanRc.length < 3) {
        setInputError("RC / BN Number must be at least 3 characters.");
        return;
      }
    } else if (tinType === "VERIFY_BY_BUSINESS_NAME") {
      if (!cleanBizName) {
        setInputError("Please enter the Registered Business / Corporate Name.");
        return;
      }
      if (cleanBizName.length < 3) {
        setInputError("Business Name must be at least 3 characters.");
        return;
      }
    } else if (tinType === "VERIFY_BY_PHONE") {
      if (!cleanPhone) {
        setInputError("Please enter the registered Nigerian phone number.");
        return;
      }
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        setInputError("Please enter a valid 11-digit Nigerian phone number.");
        return;
      }
    }

    // Consent Checkbox Validation
    if (!userConsent) {
      setInputError("You must confirm regulatory authorization and user consent before querying JTB & FIRS tax records.");
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
        : tinType === "VERIFY_BY_RC_NUMBER"
        ? rcNumberInput.replace(/\s+/g, "").trim()
        : tinType === "VERIFY_BY_BUSINESS_NAME"
        ? businessNameInput.trim()
        : phoneNumberInput.replace(/\s+/g, "").trim();

    try {
      const startTime = Date.now();
      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[1]);

      const authHeaders = await getAuthHeaders(userId);
      const response = await fetch("/api/services/tin-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          userId,
          verificationType: tinType,
          tinNumber: tinNumberInput.replace(/\s+/g, "").trim(),
          rcNumber: rcNumberInput.replace(/\s+/g, "").trim(),
          businessName: businessNameInput.trim(),
          phoneNumber: phoneNumberInput.replace(/\s+/g, "").trim(),
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
          friendlyMessage: data.friendlyMessage || "TIN Verification Failed",
          details: data.details || data.error,
        });
        setStepMode("ERROR");
        return;
      }

      const standardizedResult: StandardizedVerificationResult = {
        status: data.status || "SUCCESS",
        reference: data.reference,
        message: data.message || "TIN Tax Verification Completed Successfully",
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        providerName: data.providerName || "Joint Tax Board (JTB) Portal",
        responseTime: data.responseTime || responseTime,
        receiptNumber: data.receiptNumber,
        service: "TIN",
        serviceTitle: "TIN Tax Verification",
        fee: data.fee || tinFee,
        verifiedId: primaryInput,
        maskedId: data.maskedId || primaryInput,
        userId,
      };

      // 1. Advance to 90%: Applying authentic security overlay
      onProgressUpdate({
        id: 5,
        label: "Applying Official Security Overlay & Preparing Slip...",
        progress: 90,
      });

      // 2. Perform the overlay and auto-download right during the loader!
      try {
        const exportResult = await SlipPrintEngine.autoExportIdentitySlip(standardizedResult);
        if (exportResult.success && exportResult.pdfBytes) {
          setCachedPdfBytes(exportResult.pdfBytes);
          setCachedBlob(exportResult.blob || new Blob([exportResult.pdfBytes], { type: "application/pdf" }));
          setCachedFilename(exportResult.filename);
        }
      } catch (overlayErr) {
        console.error("Auto-overlay error during loading:", overlayErr);
      }

      // 3. Advance to 100%: Completed!
      onProgressUpdate({
        id: 6,
        label: "Verification Complete & Official Slip Auto-Downloaded",
        progress: 100,
      });
      setResult(standardizedResult);

      // Keep in LOADING mode so VerificationLoader displays the 100% complete state with buttons!
      refreshBalance();
      onBalanceUpdate?.();
    } catch (err: any) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err.message || "Failed to communicate with Joint Tax Board Portal.",
        friendlyMessage: "JTB Tax Portal Connection Failure",
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
    setRcNumberInput("");
    setBusinessNameInput("");
    setPhoneNumberInput("");
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
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="p-2.5 rounded-2xl bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#374151] text-[#4B5563] dark:text-[#E5E7EB] transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="p-3 bg-[#0F2D5C] text-white rounded-2xl shadow-md shadow-[#0F2D5C]/20">
              <FileCheck className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#111827] dark:text-white tracking-tight">
                  Tax Identification Number (TIN) Verification
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-blue-50 text-[#0F2D5C] dark:bg-blue-950/50 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-800/40">
                  JTB & FIRS Portal
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Official Joint Tax Board & Federal Inland Revenue Service taxpayer status & compliance lookup
              </p>
            </div>
          </div>

          {/* Service Meta Stats & Wallet */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-[#F9FAFB] dark:bg-[#1F2937]/60 p-2.5 rounded-2xl border border-[#E5E7EB] dark:border-[#374151]">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Wallet Balance</span>
              <span className="font-mono text-sm font-extrabold text-[#0F2D5C] dark:text-[#60A5FA]">
                {formatNaira(userBalance)}
              </span>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Fee</span>
              <span className="font-mono text-sm font-extrabold text-[#0F2D5C] dark:text-[#60A5FA]">
                {formatNaira(tinFee)}
              </span>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {providerStatus}
              </span>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Speed</span>
              <span className="font-mono text-xs font-bold text-[#4B5563] dark:text-[#E5E7EB] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#9CA3AF]" />
                {estimatedProcessingTime}
              </span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937]">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VERIFY"
                ? "bg-[#0F2D5C] text-white shadow-md shadow-[#0F2D5C]/20"
                : "bg-[#F3F4F6] dark:bg-[#1F2937] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#374151]"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>TIN Verification Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-[#0F2D5C] text-white shadow-md shadow-[#0F2D5C]/20"
                : "bg-[#F3F4F6] dark:bg-[#1F2937] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#374151]"
            }`}
          >
            <History className="h-4 w-4" />
            <span>TIN Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TIN Verification Form */}
      {activeTab === "VERIFY" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl p-6 shadow-sm space-y-6">
          {stepMode === "INPUT" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#111827] dark:text-[#E5E7EB]">Official Joint Tax Board (JTB) Verification</p>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                    Retrieves registered taxpayer classification, active tax clearance status, and assigned Federal / State tax office.
                  </p>
                </div>
              </div>

              {/* 1. Verification Type Dropdown (Primary Selector) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="tinVerificationTypeSelect" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                    Select TIN Verification Type <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#0F2D5C] dark:text-blue-400 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    4 Query Methods Available
                  </span>
                </div>

                <div className="relative">
                  <select
                    id="tinVerificationTypeSelect"
                    value={tinType}
                    onChange={(e) => {
                      setTinType(e.target.value as TinVerificationTypeOption);
                      setInputError(null);
                    }}
                    className="w-full appearance-none pl-4 pr-10 py-3.5 text-sm font-bold bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/30 text-[#111827] dark:text-white cursor-pointer shadow-xs transition-colors"
                  >
                    {TIN_TYPE_OPTIONS.map((opt, idx) => (
                      <option key={opt.id} value={opt.id}>
                        {idx + 1}. {opt.label} ({opt.badge})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#6B7280] dark:text-[#9CA3AF]">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Quick Selection Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {TIN_TYPE_OPTIONS.map((opt) => {
                    const isSelected = tinType === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTinType(opt.id);
                          setInputError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-start gap-1 ${
                          isSelected
                            ? "border-[#0F2D5C] bg-blue-50/80 dark:bg-blue-950/60 ring-1 ring-[#0F2D5C] text-[#0F2D5C] dark:text-blue-300 shadow-xs"
                            : "border-[#E5E7EB] dark:border-[#374151] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] text-[#4B5563] dark:text-[#9CA3AF]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <IconComp className={`h-4 w-4 ${isSelected ? "text-[#0F2D5C] dark:text-blue-400" : "text-[#6B7280]"}`} />
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm uppercase ${
                            isSelected ? "bg-[#0F2D5C] text-white" : "bg-[#E5E7EB] dark:bg-[#374151] text-[#4B5563] dark:text-[#9CA3AF]"
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold leading-snug truncate w-full mt-0.5">
                          {opt.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dynamic Input Fields for the Selected Verification Type */}
              <div className="space-y-4 pt-1">
                {/* Method Description Banner */}
                <div className="p-3 bg-[#F9FAFB] dark:bg-[#1F2937]/50 rounded-xl border border-[#E5E7EB] dark:border-[#374151] text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 text-[#0F2D5C] dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[#4B5563] dark:text-[#D1D5DB] leading-relaxed">
                    {currentTypeConfig.description}
                  </p>
                </div>

                {/* Field 1: VERIFY_BY_TIN */}
                {tinType === "VERIFY_BY_TIN" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinInputNumber" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      {currentTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tinInputNumber"
                      type="text"
                      value={tinNumberInput}
                      onChange={(e) => {
                        setTinNumberInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={currentTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-base bg-[#F9FAFB] dark:bg-[#1F2937] border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-[#111827] dark:text-white ${
                        inputError
                          ? "border-red-500 ring-red-500/20"
                          : "border-[#E5E7EB] dark:border-[#374151] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
                      <span>{currentTypeConfig.helpText}</span>
                    </p>
                  </div>
                )}

                {/* Field 2: VERIFY_BY_RC_NUMBER */}
                {tinType === "VERIFY_BY_RC_NUMBER" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinRcNumberInput" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      {currentTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tinRcNumberInput"
                      type="text"
                      value={rcNumberInput}
                      onChange={(e) => {
                        setRcNumberInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={currentTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-base bg-[#F9FAFB] dark:bg-[#1F2937] border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-[#111827] dark:text-white uppercase ${
                        inputError
                          ? "border-red-500 ring-red-500/20"
                          : "border-[#E5E7EB] dark:border-[#374151] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
                      <span>{currentTypeConfig.helpText}</span>
                    </p>
                  </div>
                )}

                {/* Field 3: VERIFY_BY_BUSINESS_NAME */}
                {tinType === "VERIFY_BY_BUSINESS_NAME" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinBizNameInput" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      {currentTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tinBizNameInput"
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => {
                        setBusinessNameInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={currentTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-sm bg-[#F9FAFB] dark:bg-[#1F2937] border rounded-2xl focus:outline-hidden focus:ring-2 text-[#111827] dark:text-white ${
                        inputError
                          ? "border-red-500 ring-red-500/20"
                          : "border-[#E5E7EB] dark:border-[#374151] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
                      <span>{currentTypeConfig.helpText}</span>
                    </p>
                  </div>
                )}

                {/* Field 4: VERIFY_BY_PHONE */}
                {tinType === "VERIFY_BY_PHONE" && (
                  <div className="space-y-1.5">
                    <label htmlFor="tinPhoneInput" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      {currentTypeConfig.inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tinPhoneInput"
                      type="tel"
                      value={phoneNumberInput}
                      onChange={(e) => {
                        setPhoneNumberInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={currentTypeConfig.placeholder}
                      className={`w-full px-4 py-3.5 text-base bg-[#F9FAFB] dark:bg-[#1F2937] border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-[#111827] dark:text-white ${
                        inputError
                          ? "border-red-500 ring-red-500/20"
                          : "border-[#E5E7EB] dark:border-[#374151] focus:ring-[#0F2D5C]/20"
                      }`}
                    />
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
                      <span>{currentTypeConfig.helpText}</span>
                    </p>
                  </div>
                )}

                {/* Purpose & Reference Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="tinVerificationPurpose" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      Verification Purpose
                    </label>
                    <select
                      id="tinVerificationPurpose"
                      value={verificationPurpose}
                      onChange={(e) => setVerificationPurpose(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
                    >
                      <option value="Tax Compliance & Filing Audit">Tax Compliance & Filing Audit</option>
                      <option value="KYC Onboarding">KYC Onboarding & Bank Account</option>
                      <option value="Government Contract Bidding">Government Contract Tender</option>
                      <option value="Corporate Due Diligence">Corporate Vendor Verification</option>
                      <option value="Loan Application">Credit & Loan Documentation</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tinReferenceNote" className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      Reference Note (Optional)
                    </label>
                    <input
                      id="tinReferenceNote"
                      type="text"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      placeholder="e.g. Audit Filing Ref #554"
                      className="w-full px-4 py-3 text-xs bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-[#F9FAFB] dark:bg-[#1F2937]/40 border border-[#E5E7EB] dark:border-[#374151] rounded-2xl">
                  <input
                    type="checkbox"
                    id="tinConsentCheckbox"
                    checked={userConsent}
                    onChange={(e) => {
                      setUserConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer shrink-0"
                  />
                  <label htmlFor="tinConsentCheckbox" className="text-xs text-[#4B5563] dark:text-[#D1D5DB] cursor-pointer leading-relaxed">
                    I confirm that I have explicit authorization to verify this <span className="font-bold text-[#111827] dark:text-white">Tax Identification Record</span> for legitimate compliance purposes under JTB, FIRS & NDPR guidelines.
                  </label>
                </div>

                {/* Input Error Callout */}
                {inputError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="py-3 px-5 bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#374151] text-[#4B5563] dark:text-[#E5E7EB] font-bold rounded-2xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  className="flex-1 py-3.5 px-6 bg-[#0F2D5C] hover:bg-[#0A1F3D] active:scale-98 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#0F2D5C]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Verify TIN Record ({formatNaira(tinFee)})</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={`TIN Tax Verification (${currentTypeConfig.shortLabel})`}
            recipientDetails={
              tinType === "VERIFY_BY_TIN"
                ? `TIN: ${tinNumberInput}`
                : tinType === "VERIFY_BY_RC_NUMBER"
                ? `RC/BN: ${rcNumberInput}`
                : tinType === "VERIFY_BY_BUSINESS_NAME"
                ? `Entity: ${businessNameInput}`
                : `Phone: ${phoneNumberInput}`
            }
            amount={tinFee}
            currentBalance={userBalance}
          />

          {/* Loading Progress State (0% -> 55% -> 90% -> 100% with inline action buttons) */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle="TIN Tax Verification"
              providerName="Joint Tax Board (JTB) Portal"
              result={result}
              userId={userId}
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
              onRetry={handleConfirmAndExecute}
              onBack={() => setStepMode("INPUT")}
            />
          )}
        </div>
      )}

      {/* TAB 2: TIN History */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-[#0F2D5C]" />
                <span>TIN Tax Verification Audit Trail</span>
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Audit trail of all Joint Tax Board & FIRS query executions on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by TIN, Name, Ref..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-xl focus:outline-hidden text-[#111827] dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF] flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#0F2D5C]" />
              <span>Loading TIN query history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileCheck className="h-10 w-10 mx-auto text-[#D1D5DB] dark:text-[#4B5563]" />
              <p className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF]">No TIN Verifications Found</p>
              <p className="text-[11px] text-[#9CA3AF]">Perform your first tax query using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#F9FAFB] dark:bg-[#1F2937]/40 rounded-2xl border border-[#E5E7EB] dark:border-[#1F2937] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#0F2D5C]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 text-[#0F2D5C] dark:text-blue-300">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#111827] dark:text-white">
                          {item.data?.taxpayerName || item.data?.companyName || item.verifiedId}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                          {item.data?.taxStatus || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-2">
                        <span>TIN: {item.maskedId}</span>
                        <span>•</span>
                        <span>Ref: #{item.reference}</span>
                        <span>•</span>
                        <span>{formatSafeDateTime(item.createdAt, "Recently")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-mono text-xs font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                      {formatNaira(item.fee ?? 0)}
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
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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
