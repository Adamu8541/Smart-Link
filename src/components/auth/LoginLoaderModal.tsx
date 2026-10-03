import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

export interface LoginLoaderStep {
  progress: number;
  label: string;
}

export interface LoginLoaderModalProps {
  isOpen: boolean;
  title?: string;
  providerName?: string;
  customSteps?: LoginLoaderStep[];
  onComplete?: () => void;
}

const DEFAULT_LOGIN_STEPS: LoginLoaderStep[] = [
  { progress: 25, label: "Processing credentials..." },
  { progress: 55, label: "Authenticating security token..." },
  { progress: 85, label: "Verifying account privileges..." },
  { progress: 100, label: "Loading user workspace..." },
];

export const LoginLoaderModal: React.FC<LoginLoaderModalProps> = ({
  isOpen,
  title = "SmartLink User Authentication",
  providerName = "SmartLink Security Authority",
  customSteps = DEFAULT_LOGIN_STEPS,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    // Progressive stage transitions matching verification loader
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 450);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 1050);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 1750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = customSteps[currentStepIndex] || customSteps[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#111827]/70 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-center space-y-3 max-h-[80dvh] overflow-y-auto animate-scale-up">
        {/* Animated SmartLink Logo Mark Badge */}
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0F2D5C]/15 dark:bg-blue-500/20 animate-ping opacity-60" />
          <div className="relative p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <SmartLinkLogoMark size="sm" animating={currentStep.progress < 100} />
          </div>
        </div>

        {/* Service Header */}
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 font-medium">
            <Lock className="h-3 w-3 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
            <span>Encrypted Portal: {providerName}</span>
          </p>
        </div>

        {/* Step Status Text */}
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-[#0F2D5C] dark:text-blue-400">
              <SmartLinkLogoMark size="xs" animating={currentStep.progress < 100} />
              <span>{currentStep.label}</span>
            </span>
            <span className="font-mono text-[11px] font-extrabold text-[#0F2D5C] dark:text-blue-300">
              {currentStep.progress}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0F2D5C] dark:bg-blue-600 h-full transition-all duration-300 ease-out rounded-full shadow-xs"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>

        {/* Security notice footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
          <span>256-Bit SSL Encrypted Communication</span>
        </div>
      </div>
    </div>
  );
};
