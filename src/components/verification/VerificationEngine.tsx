import React, { useState, useEffect } from "react";
import { X, ArrowLeft, ShieldCheck, Wallet, AlertCircle, Info, Lock } from "lucide-react";
import {
  VerificationServiceConfig,
  VerificationType,
  StandardizedVerificationResult,
  VerificationProgressStep,
  VerificationErrorState,
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
import { VerificationService } from "./VerificationService";

export type VerificationEngineViewMode =
  | "SERVICE_SELECT"
  | "FORM_INPUT"
  | "CONFIRMATION"
  | "LOADING"
  | "SUCCESS"
  | "ERROR";

interface VerificationEngineProps {
  userId: string;
  initialServiceType?: VerificationType;
  initialTargetId?: string;
  onClose?: () => void;
  onSuccess?: (result: StandardizedVerificationResult) => void;
  onBalanceUpdate?: () => void;
}

export const VerificationEngine: React.FC<VerificationEngineProps> = ({
  userId,
  initialServiceType,
  initialTargetId = "",
  onClose,
  onSuccess,
  onBalanceUpdate,
}) => {
  const [selectedService, setSelectedService] = useState<VerificationServiceConfig | null>(
    initialServiceType
      ? VerificationEngineService.getServiceConfig(initialServiceType)
      : null
  );

  const [viewMode, setViewMode] = useState<VerificationEngineViewMode>(
    initialServiceType ? "FORM_INPUT" : "SERVICE_SELECT"
  );

  const [primaryInput, setPrimaryInput] = useState<string>(initialTargetId);
  const [additionalFields, setAdditionalFields] = useState<Record<string, string>>({});
  const [userConsent, setUserConsent] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [userBalance, setUserBalance] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<VerificationProgressStep>(
    VERIFICATION_PROGRESS_STEPS[0]
  );
  const [result, setResult] = useState<StandardizedVerificationResult | null>(null);
  const [errorState, setErrorState] = useState<VerificationErrorState | null>(null);

  // Fetch initial wallet balance
  useEffect(() => {
    if (userId) {
      WalletService.getWalletBalance(userId).then((res) => {
        if (res.success && res.wallet) {
          setUserBalance(res.wallet.currentBalance);
        }
      });
    }
  }, [userId]);

  // Handle service selection
  const handleSelectService = (service: VerificationServiceConfig) => {
    setSelectedService(service);
    setPrimaryInput("");
    setAdditionalFields({});
    setInputError(null);
    setViewMode("FORM_INPUT");
  };

  // Handle Form Submission & Input Validation
  const handleProceedToConfirmation = () => {
    if (!selectedService) return;

    // Validate input
    const validation = VerificationValidator.validateInput(
      selectedService.id,
      primaryInput,
      additionalFields
    );

    if (!validation.valid) {
      setInputError(validation.error || "Invalid identification number format.");
      return;
    }

    // Validate User Consent Statement
    if (!userConsent) {
      setInputError(
        `You must check the user consent checkbox confirming authorization to query this ${selectedService.id} identity record.`
      );
      return;
    }

    setInputError(null);
    setViewMode("CONFIRMATION");
  };

  // Execute Verification
  const handleConfirmAndExecute = async () => {
    if (!selectedService) return;

    setViewMode("LOADING");
    setCurrentStep(VERIFICATION_PROGRESS_STEPS[0]);

    const res = await VerificationEngineService.executeVerification({
      userId,
      serviceType: selectedService.id,
      primaryInput,
      additionalFields: { ...additionalFields, consent: userConsent },
      onProgressUpdate: (step) => setCurrentStep(step),
    });

    if (res.success && res.result) {
      setResult(res.result);
      setViewMode("SUCCESS");
      onSuccess?.(res.result);
      onBalanceUpdate?.();
    } else if (res.errorState) {
      setErrorState(res.errorState);
      setViewMode("ERROR");
    }
  };

  const handleReset = () => {
    setPrimaryInput("");
    setAdditionalFields({});
    setInputError(null);
    setResult(null);
    setErrorState(null);
    if (initialServiceType) {
      setViewMode("FORM_INPUT");
    } else {
      setSelectedService(null);
      setViewMode("SERVICE_SELECT");
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between bg-[#F5F7FA]/50 dark:bg-[#111827]/30">
        <div className="flex items-center gap-3">
          {viewMode !== "SERVICE_SELECT" && !initialServiceType && (
            <button
              type="button"
              onClick={() => {
                if (viewMode === "FORM_INPUT") setViewMode("SERVICE_SELECT");
                else if (viewMode === "CONFIRMATION") setViewMode("FORM_INPUT");
                else handleReset();
              }}
              className="p-1.5 rounded-xl hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#6B7280] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#0F2D5C] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                <span>{selectedService ? selectedService.title : "SmartLink Central Verification Engine"}</span>
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                {selectedService ? selectedService.subtitle : "Select an official service gateway"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 border border-[#E5E7EB] dark:border-[#0F2D5C] rounded-xl font-mono text-xs font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
            <Wallet className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container View Dispatcher */}
      <div className="p-5 sm:p-6">
        {/* VIEW 1: Service Selection Grid */}
        {viewMode === "SERVICE_SELECT" && (
          <VerificationService onSelectService={handleSelectService} />
        )}

        {/* VIEW 2: Form Input */}
        {viewMode === "FORM_INPUT" && selectedService && (
          <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
            {/* Service Summary Card */}
            <div className="p-4 bg-[#F5F7FA]/60 dark:bg-[#0F2D5C]/40 rounded-2xl border border-[#E5E7EB] dark:border-[#0F2D5C]/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#0F2D5C] dark:text-[#9CA3AF] tracking-wider">
                  {selectedService.category} GATEWAY
                </span>
                <p className="text-xs font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
                  {selectedService.providerName}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-extrabold text-[#0F2D5C] dark:text-[#9CA3AF] bg-white dark:bg-[#111827] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#0F2D5C]">
                  Fee: ₦{selectedService.fee.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                  {selectedService.primaryInputLabel} <span className="text-[#0F2D5C]">*</span>
                </label>
                <input
                  type={selectedService.inputType}
                  value={primaryInput}
                  onChange={(e) => {
                    setPrimaryInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder={selectedService.primaryInputPlaceholder}
                  className={`w-full px-4 py-3 text-sm bg-[#F5F7FA] dark:bg-[#111827] border rounded-2xl focus:outline-hidden focus:ring-2 transition-all font-mono text-[#111827] dark:text-white ${
                    inputError
                      ? "border-[#0F2D5C] ring-[#0F2D5C]/20"
                      : "border-[#E5E7EB] dark:border-[#4B5563] focus:ring-[#0F2D5C]/20"
                  }`}
                />
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                  <Info className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                  <span>{selectedService.primaryInputHelp}</span>
                </p>
              </div>

              {/* Additional Fields if any */}
              {selectedService.additionalFields?.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                    {field.label} {field.required && <span className="text-[#0F2D5C]">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={additionalFields[field.name] || ""}
                      onChange={(e) =>
                        setAdditionalFields({
                          ...additionalFields,
                          [field.name]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-xs bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={additionalFields[field.name] || ""}
                      onChange={(e) =>
                        setAdditionalFields({
                          ...additionalFields,
                          [field.name]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 text-xs bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
                    />
                  )}
                </div>
              ))}

              {/* User Consent Checkbox */}
              <div className="flex items-start gap-3 p-3.5 bg-[#F5F7FA] dark:bg-[#111827]/40 border border-[#E5E7EB] dark:border-[#4B5563] rounded-2xl">
                <input
                  type="checkbox"
                  id="userConsentCheckbox"
                  checked={userConsent}
                  onChange={(e) => {
                    setUserConsent(e.target.checked);
                    if (inputError) setInputError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#E5E7EB] text-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer shrink-0"
                />
                <label htmlFor="userConsentCheckbox" className="text-xs text-[#4B5563] dark:text-[#E5E7EB] cursor-pointer leading-tight">
                  I confirm that I have consent from the identity owner to verify this <span className="font-bold text-[#111827] dark:text-[#E5E7EB]">{selectedService.id}</span> for legitimate KYC verification purposes in accordance with NIMC & NDPR guidelines.
                </label>
              </div>

              {/* Error Callout */}
              {inputError && (
                <div className="p-3 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 rounded-xl flex items-center gap-2 text-xs text-[#0F2D5C] dark:text-[#9CA3AF]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#0F2D5C]" />
                  <span>{inputError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {!initialServiceType && (
                <button
                  type="button"
                  onClick={() => setViewMode("SERVICE_SELECT")}
                  className="py-3 px-5 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Change Service
                </button>
              )}

              <button
                type="button"
                onClick={handleProceedToConfirmation}
                className="flex-1 py-3 px-6 bg-[#0F2D5C] hover:bg-[#0F2D5C] active:scale-98 text-white font-semibold rounded-2xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Verify & Proceed (₦{selectedService.fee.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Confirmation Dialog */}
        {selectedService && (
          <ConfirmationDialog
            isOpen={viewMode === "CONFIRMATION"}
            onClose={() => setViewMode("FORM_INPUT")}
            onConfirm={handleConfirmAndExecute}
            serviceName={selectedService.title}
            recipientDetails={`${selectedService.id}: ${VerificationValidator.maskID(primaryInput)}`}
            amount={selectedService.fee}
            currentBalance={userBalance}
          />
        )}

        {/* VIEW 4: Multi-Step Progress Loader */}
        {viewMode === "LOADING" && selectedService && (
          <VerificationLoader
            currentStep={currentStep}
            serviceTitle={selectedService.title}
            providerName={selectedService.providerName}
          />
        )}

        {/* VIEW 5: Verification Result / Success */}
        {viewMode === "SUCCESS" && result && (
          <VerificationSuccess
            result={result}
            onRepeatVerification={() => {
              setViewMode("CONFIRMATION");
            }}
            onNewVerification={handleReset}
          />
        )}

        {/* VIEW 6: Standardized Error State */}
        {viewMode === "ERROR" && errorState && (
          <VerificationError
            errorState={errorState}
            onRetry={handleConfirmAndExecute}
            onBack={() => setViewMode("FORM_INPUT")}
          />
        )}
      </div>
    </div>
  );
};
