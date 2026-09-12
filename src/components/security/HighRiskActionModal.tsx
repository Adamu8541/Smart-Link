import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Lock,
  Mail,
  Key,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { SensitiveActionPurpose } from "../../types/auth";
import { SupabaseAuthService } from "../../services/supabaseAuth";
import { soundFx } from "../../utils/audioEffects";

export interface HighRiskActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  purpose: SensitiveActionPurpose;
  title?: string;
  description?: string;
  targetValue?: string;
  onSuccess: (ticket: string) => void;
  isDarkMode?: boolean;
}

export const HighRiskActionModal: React.FC<HighRiskActionModalProps> = ({
  isOpen,
  onClose,
  purpose,
  title,
  description,
  targetValue,
  onSuccess,
  isDarkMode = false,
}) => {
  const [method, setMethod] = useState<"OTP" | "PASSWORD">("OTP");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  // Password state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setOtpCode("");
      setPassword("");
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtpRequested(false);
    }
  }, [isOpen, purpose]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const defaultTitle =
    title ||
    (purpose === "CHANGE_SECURITY_SETTINGS"
      ? "Security Verification: System Settings"
      : purpose === "CHANGE_USER_PRIVILEGES"
      ? "Security Verification: User Privileges"
      : purpose === "CRITICAL_ADMIN_OPERATION"
      ? "Security Verification: Critical Operation"
      : purpose === "CHANGE_PHONE"
      ? "Security Verification: Phone Number"
      : purpose === "CHANGE_EMAIL"
      ? "Security Verification: Email Address"
      : "Security Verification Required");

  const defaultDesc =
    description ||
    "This sensitive operation requires high-risk authorization to prevent unauthorized changes.";

  const handleRequestOtp = async () => {
    if (resendCooldown > 0 || isRequestingOtp) return;
    setIsRequestingOtp(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      soundFx.playTapSound();
      const res = await SupabaseAuthService.requestSensitiveActionOtp(purpose, targetValue);
      setOtpRequested(true);
      setMaskedEmail(res.emailMasked || "your registered email");
      setResendCooldown(res.resendCooldownSeconds || 60);
      setSuccessMsg(res.message || "A 6-digit verification code has been dispatched to your email.");
      soundFx.playSuccessSound();
    } catch (err: any) {
      soundFx.playErrorSound();
      setErrorMsg(err.message || "Unable to send verification code. Please try again.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (method === "OTP") {
      const cleanOtp = otpCode.replace(/\D/g, "");
      if (cleanOtp.length !== 6) {
        setErrorMsg("Please enter the complete 6-digit code.");
        soundFx.playErrorSound();
        return;
      }
    } else {
      if (!password.trim()) {
        setErrorMsg("Please enter your current account password.");
        soundFx.playErrorSound();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      soundFx.playTapSound();
      const res = await SupabaseAuthService.stepUpVerify({
        purpose,
        otp: method === "OTP" ? otpCode.trim() : undefined,
        password: method === "PASSWORD" ? password : undefined,
        targetValue,
      });

      if (res.highRiskTicket) {
        soundFx.playSuccessSound();
        setSuccessMsg("Security authorization confirmed.");
        setTimeout(() => {
          onSuccess(res.highRiskTicket);
          onClose();
        }, 300);
      } else {
        throw new Error("Authorization ticket missing from verification response.");
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setErrorMsg(err.message || "Security verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDarkMode
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{defaultTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero-Trust Step-Up Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {defaultDesc}
          </p>

          {/* Verification Method Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMethod("OTP");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                method === "OTP"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("PASSWORD");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                method === "PASSWORD"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Account Password</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            {method === "OTP" ? (
              <div className="space-y-3">
                {!otpRequested ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click below to dispatch a secure 6-digit one-time code to your registered email.
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isRequestingOtp}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isRequestingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Code...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send 6-Digit Code</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Enter 6-Digit OTP Code
                      </label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Sent to {maskedEmail}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.6em] text-2xl font-mono py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={resendCooldown > 0 || isRequestingOtp}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium disabled:opacity-50 disabled:no-underline flex items-center space-x-1"
                      >
                        {resendCooldown > 0 ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Resend in {resendCooldown}s</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resend Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full py-2.5 pl-4 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (method === "OTP" && (!otpRequested || otpCode.length !== 6)) ||
                  (method === "PASSWORD" && !password.trim())
                }
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize Action</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
