import React, { useState } from "react";
import { Fingerprint, ShieldCheck, CheckCircle2, X, Sparkles, ArrowRight, Lock } from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { BiometricAuthService } from "../../services/biometricAuthService";
import { soundFx } from "../../utils/audioEffects";

export interface BiometricEnrollPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userFullName?: string;
  userEmail?: string;
}

export const BiometricEnrollPromptModal: React.FC<BiometricEnrollPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userFullName = "Valued Customer",
  userEmail = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivateBiometrics = async () => {
    if (isLoading || isSuccess) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await BiometricAuthService.enrollBiometrics();
      if (res.success) {
        setIsSuccess(true);
        soundFx.playSuccessSound();
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1600);
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setErrorMessage(
        err.message || "Could not complete fingerprint registration. You can try again from Account Security."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#111827]/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
    >
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 text-center space-y-3.5 animate-scaleUp overflow-y-auto max-h-[80dvh]">
        {/* Subtle Background Glow Aura */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#0F2D5C]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Central Fintech Fingerprint Badge with Animated Pulse Rings */}
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center pt-1">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 animate-ping opacity-60" />
          <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-[#0F2D5C] to-emerald-600 opacity-20 blur-xs" />
          
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0F2D5C] to-[#1E56A0] text-white shadow-md flex items-center justify-center border border-white/20">
            {isSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-300 animate-bounce" />
            ) : isLoading ? (
              <SmartLinkLogoMark size="sm" animating={true} />
            ) : (
              <Fingerprint className="h-6 w-6 text-emerald-300 animate-pulse" />
            )}
          </div>
        </div>

        {/* Modal Copy */}
        <div className="space-y-1">
          <h3
            id="biometric-modal-title"
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            {isSuccess ? "Fingerprint Activated!" : "Enable 1-Touch Fingerprint Sign-In?"}
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-normal font-normal">
            {isSuccess
              ? "Your biometric passkey is now linked. Next time you visit, log in with just your fingerprint!"
              : `Hi ${userFullName.split(" ")[0]}, activate device biometrics to sign in faster without typing your password each time.`}
          </p>
        </div>

        {/* Benefits Card */}
        {!isSuccess && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Instant 1-Touch Access on this device</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Your biometric data never leaves your device</span>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-left">
            <p className="text-[11px] text-red-700 dark:text-red-300 font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {!isSuccess ? (
            <>
              <button
                type="button"
                onClick={handleActivateBiometrics}
                disabled={isLoading}
                style={{ backgroundColor: "#0F2D5C", color: "#FFFFFF" }}
                className="w-full py-2.5 px-4 !bg-[#0F2D5C] hover:!bg-[#17407E] active:!bg-[#0A1E3F] !text-white font-bold rounded-xl text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-400"
              >
                {isLoading ? (
                  <>
                    <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                    <span className="!text-white font-bold tracking-wider text-xs" style={{ color: "#FFFFFF" }}>
                      TOUCH SENSOR NOW...
                    </span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span className="!text-white font-bold tracking-wider text-xs" style={{ color: "#FFFFFF" }}>
                      ACTIVATE FINGERPRINT NOW
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-300 ml-0.5 shrink-0" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-1.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                Maybe Later (Skip for Now)
              </button>
            </>
          ) : (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4" />
              <span>Redirecting to your dashboard...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
