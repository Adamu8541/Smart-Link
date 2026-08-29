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
  Building2,
  RotateCcw,
  HelpCircle,
  Layers,
  ChevronDown,
  Mail,
  Send,
  Printer,
  Sparkles,
  Phone,
  Hash,
  User,
  Calendar,
  Eye,
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
import { VerificationValidator } from "../../services/verificationValidator";
import { WalletService } from "../../services/walletService";
import { ConfirmationDialog } from "../wallet/ConfirmationDialog";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { SlipPrintModal } from "./slips/SlipPrintModal";
import { SlipLivePreviewCard } from "./slips/SlipLivePreviewCard";
import {
  BVN_SLIP_OPTIONS,
  SlipOptionConfig,
} from "../../services/slipOptionsConfig";
import { IdentityVerificationConsentNotice } from "../legal/IdentityVerificationConsentNotice";
import { legalConsentService } from "../../services/legalConsentService";

interface BvnVerificationViewProps {
  userId: string;
  userEmail?: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type BvnViewTab = "VERIFY" | "HISTORY";
export type BvnSearchMethod = "BY_BVN" | "BY_PHONE" | "BY_DOB_NAME";

export const BvnVerificationView: React.FC<BvnVerificationViewProps> = ({
  userId,
  userEmail,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<BvnViewTab>("VERIFY");

  // Search Method
  const [searchMethod, setSearchMethod] = useState<BvnSearchMethod>("BY_BVN");

  // Slip Format Selection
  const [selectedSlip, setSelectedSlip] = useState<SlipOptionConfig>(BVN_SLIP_OPTIONS[0]);

  // Form Inputs
  const [primaryInput, setPrimaryInput] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("KYC Onboarding");
  const [autoEmailRegistered, setAutoEmailRegistered] = useState(true);
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "CONFIRMATION" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Slip Print Modal
  const [showSlipModal, setShowSlipModal] = useState(false);

  // History states
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistorySlip, setSelectedHistorySlip] = useState<StandardizedVerificationResult | null>(null);

  const effectiveRegisteredEmail = userEmail || "adamuamuhammad8541@gmail.com";

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
          const bvnItems = items.filter((i) => i.service === "BVN");
          setHistory(bvnItems);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, userId]);

  // Handle Form Submission Validation
  const handleProceedToConfirmation = () => {
    const cleanInput = primaryInput.trim();

    if (searchMethod === "BY_BVN") {
      const validation = VerificationValidator.validateBVN(cleanInput);
      if (!validation.valid) {
        setInputError(validation.error || "Please enter a valid 11-digit BVN.");
        return;
      }
    } else if (searchMethod === "BY_PHONE") {
      const validation = VerificationValidator.validatePhone(cleanInput);
      if (!validation.valid) {
        setInputError(validation.error || "Please enter a valid 11-digit Nigerian phone number.");
        return;
      }
    } else if (searchMethod === "BY_DOB_NAME") {
      if (!fullName) {
        setInputError("Please enter the customer's Full Name.");
        return;
      }
      if (!dateOfBirth) {
        setInputError("Please enter the customer's Date of Birth.");
        return;
      }
    }

    // Consent Checkbox Validation
    if (!userConsent) {
      setInputError("You must confirm user consent before querying NIBSS identity records under NDPR guidelines.");
      return;
    }

    // Balance check
    if (userBalance < selectedSlip.price) {
      setInputError(`Insufficient wallet balance (₦${userBalance.toLocaleString()}). You need ₦${selectedSlip.price.toLocaleString()} for this ${selectedSlip.name}.`);
      return;
    }

    setInputError(null);
    setStepMode("CONFIRMATION");
  };

  // Handle Execution Call
  const handleConfirmAndExecute = async () => {
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    try {
      const targetQuery = searchMethod === "BY_DOB_NAME" ? fullName : primaryInput.trim();
      const extraFields: Record<string, string> = {
        searchMethod,
        slipType: selectedSlip.id,
        verificationPurpose,
        customerPhone,
      };

      if (fullName) extraFields.fullName = fullName;
      if (dateOfBirth) extraFields.dateOfBirth = dateOfBirth;

      const res = await VerificationEngineService.executeVerification({
        userId,
        serviceType: "BVN",
        primaryInput: targetQuery,
        additionalFields: extraFields,
        slipType: selectedSlip.id,
        customFee: selectedSlip.price,
        autoEmailToRegistered: autoEmailRegistered,
        onProgressUpdate: (step) => setCurrentStep(step),
      });

      if (res.success && res.result) {
        setResult(res.result);
        setStepMode("SUCCESS");
        refreshBalance();
        onBalanceUpdate?.();

        // Record compliance audit trail for CBN/NDPR inquiry
        legalConsentService.recordAcceptance({
          userId,
          userEmail: userEmail || effectiveRegisteredEmail,
          documentId: "kyc-notice",
          documentVersion: "2.1.0",
          scope: "KYC_VALIDATION",
          agreementType: "KYC_VALIDATION",
          status: "ACCEPTED",
          metadata: {
            serviceType: "BVN",
            searchMethod,
            verificationPurpose,
            slipFormat: selectedSlip.id,
            timestamp: new Date().toISOString(),
          },
        }).catch((e) => console.warn("Legal consent recording note:", e));
      } else if (res.errorState) {
        setErrorState(res.errorState);
        setStepMode("ERROR");
      }
    } catch (err: any) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err.message || "Failed to communicate with NIBSS Gateway.",
        friendlyMessage: "NIBSS Provider Gateway Connection Failure",
        details: "Please check your network connection and try again.",
      });
      setStepMode("ERROR");
    }
  };

  const handleResetForm = () => {
    setPrimaryInput("");
    setFullName("");
    setDateOfBirth("");
    setCustomerPhone("");
    setVerificationPurpose("KYC Onboarding");
    setUserConsent(false);
    setInputError(null);
    setResult(null);
    setErrorState(null);
    setStepMode("INPUT");
  };

  // Filtered BVN History
  const filteredHistory = history.filter(
    (item) =>
      !historySearch ||
      item.verifiedId.includes(historySearch) ||
      item.maskedId.includes(historySearch) ||
      item.reference.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.receiptNumber.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-3 sm:p-6 text-left">
      {/* Top Header Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
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

            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
              <CreditCard className="h-7 w-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Bank Verification Number (BVN) Portal
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full border border-blue-300 dark:border-blue-800">
                  NIBSS Central Switch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instant banking biometrics lookup, KYC profile verification, and official slip printing
              </p>
            </div>
          </div>

          {/* Wallet Balance & Live Dynamic Fee Badge */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Wallet Balance
              </span>
              <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Selected Slip Fee
              </span>
              <span
                className="font-mono text-sm font-extrabold"
                style={{ color: selectedSlip.themeColor }}
              >
                ₦{selectedSlip.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("VERIFY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VERIFY"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>BVN Verification &amp; Slip Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Verification Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BVN Verification Form & Workflow */}
      {activeTab === "VERIFY" && (
        <div className="space-y-6">
          {stepMode === "INPUT" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Configuration & Form Inputs */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
                {/* 1. Slip Type Selector (Dropdown & Quick Select Cards) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600" />
                      <span>Select Output BVN Slip Format</span>
                    </label>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      Live Price: ₦{selectedSlip.price}
                    </span>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative">
                    <select
                      value={selectedSlip.id}
                      onChange={(e) => {
                        const opt = BVN_SLIP_OPTIONS.find((s) => s.id === e.target.value);
                        if (opt) setSelectedSlip(opt);
                      }}
                      className="w-full appearance-none px-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 pr-10 cursor-pointer shadow-xs"
                    >
                      {BVN_SLIP_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} — ₦{opt.price.toLocaleString()} ({opt.badge})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Quick Select Pill Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {BVN_SLIP_OPTIONS.map((opt) => {
                      const isSelected = selectedSlip.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedSlip(opt)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {opt.badge}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                              ₦{opt.price}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {opt.name.split("(")[0].trim()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Search Method Selector (Tabs) */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-600" />
                    <span>Choose Query / Search Method</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                    {[
                      { id: "BY_BVN", label: "11-Digit BVN", icon: Hash },
                      { id: "BY_PHONE", label: "Phone Number", icon: Phone },
                      { id: "BY_DOB_NAME", label: "Name & DOB", icon: User },
                    ].map((m) => {
                      const isCurr = searchMethod === m.id;
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSearchMethod(m.id as BvnSearchMethod);
                            setInputError(null);
                          }}
                          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isCurr
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Form Input Fields */}
                <div className="space-y-4">
                  {searchMethod === "BY_BVN" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="bvnPrimaryInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Bank Verification Number (BVN) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-mono text-slate-400">
                          {primaryInput.length}/11 digits
                        </span>
                      </div>
                      <input
                        id="bvnPrimaryInput"
                        type="text"
                        maxLength={11}
                        value={primaryInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                          setPrimaryInput(val);
                          if (inputError) setInputError(null);
                        }}
                        placeholder="e.g. 22233344455"
                        className={`w-full px-4 py-3.5 text-base bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-wider text-slate-900 dark:text-white ${
                          inputError
                            ? "border-rose-500 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                        }`}
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Enter the 11-digit BVN registered across Nigerian commercial banks.</span>
                      </p>
                    </div>
                  )}

                  {searchMethod === "BY_PHONE" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="bvnPhoneInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Linked Nigerian Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-mono text-slate-400">
                          {primaryInput.length}/11 digits
                        </span>
                      </div>
                      <input
                        id="bvnPhoneInput"
                        type="tel"
                        maxLength={11}
                        value={primaryInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                          setPrimaryInput(val);
                          if (inputError) setInputError(null);
                        }}
                        placeholder="e.g. 08012345678"
                        className="w-full px-4 py-3.5 text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono tracking-wider text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {searchMethod === "BY_DOB_NAME" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Full Legal Name as Registered in Bank <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Adamu Abubakar Muhammad"
                          className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Date of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Verification Purpose & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Customer WhatsApp / Mobile (Optional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 08031234567"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Verification Purpose
                      </label>
                      <select
                        value={verificationPurpose}
                        onChange={(e) => setVerificationPurpose(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="KYC Onboarding">KYC Onboarding &amp; Account</option>
                        <option value="Loan Underwriting">Credit / Loan Underwriting</option>
                        <option value="ID Verification">Identity Attestation</option>
                        <option value="Agent Banking">POS Agent Terminal</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-Email Slip to Registered Account Toggle */}
                  <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-600 text-white rounded-xl">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Auto-Send PDF to Registered Email
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                          {effectiveRegisteredEmail}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoEmailRegistered}
                        onChange={(e) => setAutoEmailRegistered(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Interactive Regulatory Identity Verification Consent Notice */}
                  <IdentityVerificationConsentNotice
                    serviceName="Central Bank of Nigeria (CBN) / NIBSS BVN Verification"
                    hasConsented={userConsent}
                    onConsentChange={(checked) => {
                      setUserConsent(checked);
                      if (inputError) setInputError(null);
                    }}
                    onOpenPolicy={(docId) => {
                      window.dispatchEvent(new CustomEvent("open_legal_document", { detail: { documentId: docId } }));
                    }}
                  />

                  {/* Input Error Callout */}
                  {inputError && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{inputError}</span>
                    </div>
                  )}
                </div>

                {/* Main Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  {onBackToDashboard && (
                    <button
                      type="button"
                      onClick={onBackToDashboard}
                      className="py-3.5 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleProceedToConfirmation}
                    className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span>
                      Verify &amp; Generate {selectedSlip.name.split("(")[0].trim()} (₦{selectedSlip.price.toLocaleString()})
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Interactive Slip Preview Card */}
              <div className="lg:col-span-5 sticky top-6">
                <SlipLivePreviewCard
                  slipOption={selectedSlip}
                  userBalance={userBalance}
                  serviceType="BVN"
                />
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={`BVN Verification — ${selectedSlip.name}`}
            recipientDetails={`Target: ${
              primaryInput
                ? `${primaryInput.substring(0, 3)}****${primaryInput.substring(primaryInput.length - 4)}`
                : fullName
            } | Format: ${selectedSlip.name}`}
            amount={selectedSlip.price}
            currentBalance={userBalance}
          />

          {/* Loading Progress State */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle={`BVN Verification (${selectedSlip.name})`}
              providerName="NIBSS Central Switch"
            />
          )}

          {/* Success Result View */}
          {stepMode === "SUCCESS" && result && (
            <div className="space-y-6">
              {/* Quick Slip Action Bar */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Official {selectedSlip.name} Ready
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Attested by NIBSS Banking Biometric Switch with QR verification link
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSlipModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View &amp; Print Slip</span>
                  </button>
                </div>
              </div>

              <VerificationSuccess
                result={result}
                userId={userId}
                userEmail={userEmail}
                onRepeatVerification={() => setStepMode("CONFIRMATION")}
                onNewVerification={handleResetForm}
              />
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

      {/* TAB 2: BVN History */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                <span>BVN Verification &amp; Slip History</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit log of all Bank Verification Number queries on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by BVN or Reference..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span>Loading BVN query history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CreditCard className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No BVN Records Found
              </p>
              <p className="text-[11px] text-slate-400">
                Perform your first BVN query using the generator above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                          {item.maskedId || item.verifiedId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ref: {item.reference} • {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const stdRes: StandardizedVerificationResult = {
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
                        };
                        setSelectedHistorySlip(stdRes);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-300 dark:border-blue-800 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slip Print Modal for Active or Selected Record */}
      {(showSlipModal && result) && (
        <SlipPrintModal
          verificationResult={result}
          userId={userId}
          userEmail={userEmail}
          initialFormat={selectedSlip.id}
          onClose={() => setShowSlipModal(false)}
        />
      )}

      {selectedHistorySlip && (
        <SlipPrintModal
          verificationResult={selectedHistorySlip}
          userId={userId}
          userEmail={userEmail}
          initialFormat="BVN_STANDARD"
          onClose={() => setSelectedHistorySlip(null)}
        />
      )}
    </div>
  );
};
