import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Building,
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
  RotateCcw,
  CreditCard,
  ChevronDown,
  ChevronUp,
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
import { BankService, Bank } from "../../services/bankService";
import { ConfirmationDialog } from "../wallet/ConfirmationDialog";
import { VerificationLoader } from "./VerificationLoader";
import { VerificationError } from "./VerificationError";
import { VerificationSuccess } from "./VerificationSuccess";
import { VerificationReceipt } from "./VerificationReceipt";

interface BankAccountVerificationViewProps {
  userId: string;
  onBackToDashboard?: () => void;
  onBalanceUpdate?: () => void;
}

export type BankViewTab = "VERIFY" | "HISTORY";

export const BankAccountVerificationView: React.FC<BankAccountVerificationViewProps> = ({
  userId,
  onBackToDashboard,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<BankViewTab>("VERIFY");

  // Bank List States
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [banksLoading, setBanksLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form Inputs
  const [accountNumber, setAccountNumber] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("KYC & Account Onboarding");
  const [userConsent, setUserConsent] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fee & Balance
  const verificationFee = 100;
  const [userBalance, setUserBalance] = useState<number>(0);

  // Execution View Modes
  const [stepMode, setStepMode] = useState<"INPUT" | "CONFIRMATION" | "LOADING" | "SUCCESS" | "ERROR">("INPUT");
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(VERIFICATION_PROGRESS_STEPS[0]);
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // History States
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState<StandardizedVerificationResult | null>(null);

  // Provider Status & Speed
  const providerStatus = "ONLINE";
  const estimatedProcessingTime = "180ms";

  // Load Banks
  useEffect(() => {
    setBanksLoading(true);
    BankService.getSupportedBanks()
      .then((loaded) => {
        setBanks(loaded);
        if (loaded.length > 0) {
          // Default select GTBank or First Bank
          const defaultBank = loaded.find((b) => b.code === "058") || loaded[0];
          setSelectedBank(defaultBank);
        }
      })
      .finally(() => setBanksLoading(false));
  }, []);

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refresh Balance
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

  // Load History
  useEffect(() => {
    if (activeTab === "HISTORY" && userId) {
      setHistoryLoading(true);
      VerificationEngineService.getVerificationHistory(userId)
        .then((items) => {
          const bankItems = items.filter(
            (i) => i.service === "BANK_ACCOUNT" || i.service === "BANK" || i.service === "NAME_ENQUIRY"
          );
          setHistory(bankItems);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, userId]);

  // Input Validation
  const handleProceedToConfirmation = () => {
    const cleanAccount = accountNumber.replace(/\s+/g, "").trim();

    if (!selectedBank) {
      setInputError("Please select a Nigerian bank from the dropdown list.");
      return;
    }

    if (!cleanAccount) {
      setInputError("Account Number is required.");
      return;
    }

    if (!/^\d{10}$/.exec(cleanAccount)) {
      setInputError("Account Number must be exactly 10 numeric digits.");
      return;
    }

    if (!userConsent) {
      setInputError("You must confirm user consent before executing NIBSS account name enquiry.");
      return;
    }

    setInputError(null);
    setStepMode("CONFIRMATION");
  };

  // Execute Verification
  const handleConfirmAndExecute = async () => {
    setStepMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const cleanAccount = accountNumber.replace(/\s+/g, "").trim();

    try {
      const startTime = Date.now();
      onProgressUpdate(VERIFICATION_PROGRESS_STEPS[1]);

      const response = await fetch("/api/services/bank-account-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountNumber: cleanAccount,
          bankCode: selectedBank?.code,
          bankName: selectedBank?.name,
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
          code: data.errorCode || "ACCOUNT_VERIFICATION_FAILED",
          message: data.error || "Bank account enquiry failed or record not found.",
          friendlyMessage: data.friendlyMessage || "Account Name Enquiry Failed",
          details: data.details || data.error,
        });
        setStepMode("ERROR");
        return;
      }

      const maskedAccount =
        cleanAccount.length === 10
          ? `${cleanAccount.substring(0, 3)}****${cleanAccount.substring(7)}`
          : cleanAccount;

      const standardizedResult: StandardizedVerificationResult = {
        status: data.status || "SUCCESS",
        reference: data.reference,
        message: data.message || "Bank Account Name Enquiry Completed Successfully",
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        providerName: data.providerName || "NIBSS Instant Payment (NIP) Gateway",
        responseTime: data.responseTime || responseTime,
        receiptNumber: data.receiptNumber,
        service: "BANK_ACCOUNT",
        serviceTitle: "Bank Account Verification",
        fee: data.fee || verificationFee,
        verifiedId: `${selectedBank?.name} - ${cleanAccount}`,
        maskedId: `${selectedBank?.name} (${selectedBank?.code}) - ${maskedAccount}`,
        userId,
      };

      setResult(standardizedResult);
      setStepMode("SUCCESS");
      refreshBalance();
      onBalanceUpdate?.();
    } catch (err: any) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err.message || "Failed to communicate with NIBSS Bank Account Gateway.",
        friendlyMessage: "NIBSS Gateway Connection Error",
        details: "Please check your network connection and try again.",
      });
      setStepMode("ERROR");
    }
  };

  const onProgressUpdate = (step: VerificationProgressStep) => {
    setCurrentStep(step);
  };

  const handleResetForm = () => {
    setAccountNumber("");
    setReferenceNote("");
    setVerificationPurpose("KYC & Account Onboarding");
    setUserConsent(false);
    setInputError(null);
    setResult(null);
    setErrorState(null);
    setStepMode("INPUT");
  };

  // Searchable Bank List
  const filteredBanks = BankService.searchBanks(banks, bankSearchQuery);

  // Filtered History
  const filteredHistory = history.filter(
    (item) =>
      !historySearch ||
      item.verifiedId.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.maskedId.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.reference.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.receiptNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.data && item.data.fullName && item.data.fullName.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 text-left">
      {/* Top Header Card */}
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

            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
              <Building className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Bank Account Verification (Name Enquiry)
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full border border-blue-300 dark:border-blue-800">
                  NIBSS Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instant real-time account holder name lookup across all CBN-licensed banks & PSBs
              </p>
            </div>
          </div>

          {/* Service Meta Stats & Wallet */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Balance</span>
              <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee</span>
              <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                ₦{verificationFee.toLocaleString()}
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
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Name Enquiry Search</span>
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
            <span>Name Enquiry Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Verification Form */}
      {activeTab === "VERIFY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {stepMode === "INPUT" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Official NIBSS (Nigeria Inter-Bank Settlement System) Gateway
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Confirms verified account holder name, account status, bank code, and BVN linking prior to money transfer or payout.
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                {/* Searchable Bank Dropdown */}
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Select Bank <span className="text-rose-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden text-left flex items-center justify-between cursor-pointer text-slate-900 dark:text-white"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold">{selectedBank.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                          Code: {selectedBank.code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Choose a Nigerian bank...</span>
                    )}
                    {bankDropdownOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* Dropdown Options List */}
                  {bankDropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-2 max-h-72 overflow-y-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          placeholder="Search bank name or code..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
                          autoFocus
                        />
                      </div>

                      {filteredBanks.length === 0 ? (
                        <p className="p-3 text-center text-xs text-slate-400">No matching banks found.</p>
                      ) : (
                        <div className="space-y-1">
                          {filteredBanks.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setSelectedBank(b);
                                setBankDropdownOpen(false);
                                setBankSearchQuery("");
                                if (inputError) setInputError(null);
                              }}
                              className={`w-full p-2.5 rounded-xl text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                                selectedBank?.code === b.code
                                  ? "bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span>{b.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                {b.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Account Number Input */}
                <div className="space-y-1.5">
                  <label htmlFor="accountNumberInput" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    NUBAN Account Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="accountNumberInput"
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAccountNumber(val);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="e.g. 0123456789"
                    className={`w-full px-4 py-3.5 text-lg bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-hidden focus:ring-2 font-mono tracking-widest text-slate-900 dark:text-white ${
                      inputError
                        ? "border-rose-500 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Enter the 10-digit NUBAN account number maintained with {selectedBank?.name || "the selected bank"}.</span>
                  </p>
                </div>

                {/* Purpose and Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="bankVerificationPurpose" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Verification Purpose
                    </label>
                    <select
                      id="bankVerificationPurpose"
                      value={verificationPurpose}
                      onChange={(e) => setVerificationPurpose(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                    >
                      <option value="KYC & Account Onboarding">KYC & Account Onboarding</option>
                      <option value="Payroll & Disbursement Verification">Payroll & Disbursement</option>
                      <option value="Vendor & Supplier Verification">Vendor Payment Verification</option>
                      <option value="Loan & Credit Assessment">Loan & Credit Assessment</option>
                      <option value="Financial Transaction Audit">Financial Audit & Reconciliation</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bankReferenceNote" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reference Note (Optional)
                    </label>
                    <input
                      id="bankReferenceNote"
                      type="text"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      placeholder="e.g. Salary Payout Batch #12"
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="checkbox"
                    id="bankConsentCheckbox"
                    checked={userConsent}
                    onChange={(e) => {
                      setUserConsent(e.target.checked);
                      if (inputError) setInputError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="bankConsentCheckbox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                    I confirm that I have user authorization and legitimate regulatory cause to perform <span className="font-bold text-slate-800 dark:text-slate-100">NIBSS Bank Account Name Enquiry</span> under CBN and NDPR guidelines.
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
                  className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Verify Account Name (₦{verificationFee.toLocaleString()})</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={stepMode === "CONFIRMATION"}
            onClose={() => setStepMode("INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName="Bank Account Verification (Name Enquiry)"
            recipientDetails={`Bank: ${selectedBank?.name} (${selectedBank?.code}) | Account: ${accountNumber.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}`}
            amount={verificationFee}
            currentBalance={userBalance}
          />

          {/* Loading State */}
          {stepMode === "LOADING" && (
            <VerificationLoader
              currentStep={currentStep}
              serviceTitle="Bank Account Verification"
              providerName="NIBSS NIP Name Enquiry Gateway"
            />
          )}

          {/* Success View */}
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

      {/* TAB 2: History Audit Trail */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                <span>Bank Account Name Enquiry Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of all NIBSS bank account enquiry queries executed on your account
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by Name, Account, Ref..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span>Loading bank account enquiry history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Bank Account Enquiries Found</p>
              <p className="text-[11px] text-slate-400">Perform your first account verification using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.data?.fullName || item.verifiedId}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          {item.data?.companyStatus || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{item.maskedId}</span>
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
                          message: "Bank Account Verification Receipt",
                          data: item.data,
                          timestamp: item.createdAt,
                          providerName: item.providerName,
                          responseTime: item.responseTime,
                          receiptNumber: item.receiptNumber,
                          service: "BANK_ACCOUNT",
                          serviceTitle: "Bank Account Verification",
                          fee: item.fee,
                          verifiedId: item.verifiedId,
                          maskedId: item.maskedId,
                          userId: item.userId,
                        };
                        setSelectedHistoryReceipt(stdRes);
                      }}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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
