import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { ServiceItem } from "../../data/servicesData";

export interface ServiceOpeningLoaderModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onReadyToOpen?: () => void;
}

interface LoaderStage {
  progress: number;
  label: string;
}

export const ServiceOpeningLoaderModal: React.FC<ServiceOpeningLoaderModalProps> = ({
  service,
  isOpen,
  onReadyToOpen,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stages: LoaderStage[] = [
    { progress: 28, label: "Initiating secure service connection..." },
    { progress: 62, label: "Verifying live gateway & rates..." },
    { progress: 92, label: "Establishing encrypted session..." },
    { progress: 100, label: "Launching service workspace..." },
  ];

  useEffect(() => {
    if (!isOpen || !service) {
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
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const currentStep = stages[currentStepIndex] || stages[0];
  const serviceName = service.name || "Digital Service";
  const categoryLabel = (service.category || "IDENTITY").toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${serviceName}`}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6 animate-scaleUp">
        {/* Animated SmartLink Logo Mark Badge */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0F2D5C]/15 dark:bg-blue-500/20 animate-ping opacity-60" />
          <div className="relative p-3.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <SmartLinkLogoMark size="lg" animating={currentStep.progress < 100} />
          </div>
        </div>

        {/* Service Header */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0F2D5C]/10 text-[#0F2D5C] dark:bg-blue-900/40 dark:text-blue-300 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="h-3 w-3" />
            <span>{categoryLabel} GATEWAY</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {serviceName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="h-3.5 w-3.5 text-[#0F2D5C] dark:text-blue-400 shrink-0" />
            <span>Encrypted Portal: Federal & Multi-Provider Hub</span>
          </p>
        </div>

        {/* Step Status Text & Progress Bar */}
        <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-2 text-[#0F2D5C] dark:text-blue-400">
              <SmartLinkLogoMark size="xs" animating={currentStep.progress < 100} />
              <span>{currentStep.label}</span>
            </span>
            <span className="font-mono text-xs font-extrabold text-[#0F2D5C] dark:text-blue-300">
              {currentStep.progress}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0F2D5C] dark:bg-blue-600 h-full transition-all duration-300 ease-out rounded-full shadow-sm"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>

        {/* Security & Verification Guarantee Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>256-Bit SSL Encrypted Session &bull; 100% Uptime Hub</span>
        </div>
      </div>
    </div>
  );
};
