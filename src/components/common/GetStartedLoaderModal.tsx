import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

export interface GetStartedLoaderModalProps {
  isOpen: boolean;
  onReadyToOpen?: () => void;
  title?: string;
}

interface LoaderStage {
  progress: number;
  label: string;
}

export const GetStartedLoaderModal: React.FC<GetStartedLoaderModalProps> = ({
  isOpen,
  onReadyToOpen,
  title = "SmartLink Sovereign Portal",
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stages: LoaderStage[] = [
    { progress: 28, label: "Initiating secure onboarding connection..." },
    { progress: 62, label: "Connecting to sovereign verification network..." },
    { progress: 92, label: "Preparing registration & wallet workspace..." },
    { progress: 100, label: "Launching portal..." },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    setCurrentStepIndex(0);

    const timer1 = setTimeout(() => setCurrentStepIndex(1), 220);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 480);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 720);
    const timerComplete = setTimeout(() => {
      if (onReadyToOpen) {
        onReadyToOpen();
      }
    }, 850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerComplete);
    };
  }, [isOpen, onReadyToOpen]);

  if (!isOpen) return null;

  const currentStep = stages[currentStepIndex] || stages[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#111827]/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Loading SmartLink Portal"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-center space-y-3.5 max-h-[85dvh] overflow-y-auto animate-scaleUp">
        {/* Animated SmartLink Logo Mark Badge */}
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0F2D5C]/15 dark:bg-blue-500/20 animate-ping opacity-60" />
          <div className="relative p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <SmartLinkLogoMark size="sm" animating={currentStep.progress < 100} />
          </div>
        </div>

        {/* Header Information */}
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0F2D5C]/10 text-[#0F2D5C] dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold tracking-wide uppercase">
            <Sparkles className="h-2.5 w-2.5" />
            <span>SECURE ONBOARDING GATEWAY</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 font-medium">
            <Lock className="h-3 w-3 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
            <span>Encrypted Federal &amp; Provider Hub</span>
          </p>
        </div>

        {/* Step Status Text & Progress Bar */}
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-[#0F2D5C] dark:text-blue-400">
              {currentStep.progress >= 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <SmartLinkLogoMark size="xs" animating={true} />
              )}
              <span>{currentStep.label}</span>
            </span>
            <span className="font-mono text-[11px] font-extrabold text-[#0F2D5C] dark:text-blue-300">
              {currentStep.progress}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0F2D5C] dark:bg-blue-600 h-full transition-all duration-300 ease-out rounded-full shadow-sm"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>

        {/* Security & Verification Guarantee Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>256-Bit SSL Encrypted Session &bull; 100% Uptime Hub</span>
        </div>
      </div>
    </div>
  );
};

export default GetStartedLoaderModal;
