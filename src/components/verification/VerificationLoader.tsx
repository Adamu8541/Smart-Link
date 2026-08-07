import React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { VerificationProgressStep } from "../../types/verification";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

interface VerificationLoaderProps {
  currentStep: VerificationProgressStep;
  serviceTitle: string;
  providerName?: string;
}

export const VerificationLoader: React.FC<VerificationLoaderProps> = ({
  currentStep,
  serviceTitle,
  providerName = "Federal E-Verification Gateway",
}) => {
  return (
    <div className="p-8 text-center space-y-6 animate-fade-in max-w-md mx-auto">
      {/* Animated SmartLink Logo Mark Badge */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-50" />
        <div className="relative p-3 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center">
          <SmartLinkLogoMark size="lg" animating={currentStep.progress < 100} />
        </div>
      </div>

      {/* Service Header */}
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {serviceTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
          <span>Encrypted Gateway: {providerName}</span>
        </p>
      </div>

      {/* Step Status Text */}
      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 text-[#0F2D5C] dark:text-blue-400">
            <SmartLinkLogoMark size="xs" animating={currentStep.progress < 100} />
            <span>{currentStep.label}</span>
          </span>
          <span className="font-mono text-[11px] font-bold">{currentStep.progress}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0F2D5C] h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${currentStep.progress}%` }}
          />
        </div>
      </div>

      {/* Security notice footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>End-to-End 256-Bit SSL Encrypted Communication</span>
      </div>
    </div>
  );
};

