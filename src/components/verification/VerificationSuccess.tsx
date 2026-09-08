import React, { useState } from "react";
import { Download, Printer, RefreshCw, FileText, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import { StandardizedVerificationResult } from "../../types/verification";
import { VerificationResult } from "./VerificationResult";
import { VerificationReceipt } from "./VerificationReceipt";
import { SlipPrintModal } from "./slips/SlipPrintModal";

interface VerificationSuccessProps {
  result: StandardizedVerificationResult;
  userId?: string;
  userEmail?: string;
  onRepeatVerification?: () => void;
  onNewVerification?: () => void;
}

export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  result,
  userId = "user_guest",
  userEmail,
  onRepeatVerification,
  onNewVerification,
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const isSlipSupported = result.service === "NIN" || result.service === "BVN" || result.service === "PHONE";

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Verification Result Component */}
      <VerificationResult
        result={result}
        onViewReceipt={() => setShowReceipt(true)}
        onGenerateSlip={() => setShowSlipModal(true)}
      />

      {/* Primary Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {/* Prominent High-Fidelity Slip Button */}
        {isSlipSupported && (
          <button
            type="button"
            onClick={() => setShowSlipModal(true)}
            className="w-full py-3 px-5 bg-gradient-to-r from-[#0F2D5C] to-[#0F2D5C] hover:from-[#0F2D5C] hover:to-[#0F2D5C] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Generate & Print Official Slip ({result.service})</span>
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowReceipt(true)}
            className="flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#111827] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>View Digital Receipt</span>
          </button>

          {onRepeatVerification && (
            <button
              type="button"
              onClick={onRepeatVerification}
              className="flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#111827] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#0F2D5C]" />
              <span>Repeat Query</span>
            </button>
          )}

          {onNewVerification && (
            <button
              type="button"
              onClick={onNewVerification}
              className="w-full sm:w-auto py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Perform Another Verification</span>
            </button>
          )}
        </div>
      </div>

      {/* Digital Receipt Modal Dialog */}
      {showReceipt && (
        <VerificationReceipt
          result={result}
          onClose={() => setShowReceipt(false)}
          onGenerateSlip={() => {
            setShowReceipt(false);
            setShowSlipModal(true);
          }}
        />
      )}

      {/* High-Fidelity Slip Print Modal */}
      {showSlipModal && (
        <SlipPrintModal
          verificationResult={result}
          userId={userId}
          userEmail={userEmail}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
