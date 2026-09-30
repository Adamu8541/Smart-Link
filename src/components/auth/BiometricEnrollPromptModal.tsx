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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6 animate-scaleUp overflow-hidden">
        {/* Subtle Background Glow Aura */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#0F2D5C]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Central Fintech Fingerprint Badge with Animated Pulse Rings */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center pt-2">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 animate-ping opacity-60" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#0F2D5C] to-emerald-600 opacity-20 blur-xs" />
          
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0F2D5C] to-[#1E56A0] text-white shadow-xl flex items-center justify-center border-2 border-white/20">
            {isSuccess ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-300 animate-bounce" />
            ) : isLoading ? (
              <SmartLinkLogoMark size="md" animating={true} />
            ) : (
              <Fingerprint className="h-10 w-10 text-emerald-300 animate-pulse" />
            )}
          </div>
        </div>

        {/* Modal Copy */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Fintech Fast Passkey</span>
          </div>

          <h3
            id="biometric-modal-title"
            className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            {isSuccess ? "Fingerprint Activated!" : "Enable 1-Touch Fingerprint Sign-In?"}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {isSuccess
              ? "Your biometric passkey is now linked. Next time you visit, log in with just your fingerprint!"
              : `Hi ${userFullName.split(" ")[0]}, activate device biometrics to sign in faster without typing your password each time.`}
          </p>
        </div>

        {/* Benefits Card */}
        {!isSuccess && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Instant 1-Touch Access on this device</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-[#0F2D5C] dark:text-sky-400 shrink-0" />
              <span>FIDO2 Encrypted & Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Your biometric data never leaves your device</span>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-left">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {!isSuccess ? (
            <>
              <button
                type="button"
                onClick={handleActivateBiometrics}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#0F2D5C] via-[#17407E] to-[#0F2D5C] hover:opacity-95 active:scale-[0.99] text-white font-extrabold rounded-2xl text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                    <span>TOUCH SENSOR NOW...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-5 w-5 text-emerald-300" />
                    <span>ACTIVATE FINGERPRINT NOW</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Maybe Later (Skip for Now)
              </button>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4" />
              <span>Redirecting to your dashboard...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
