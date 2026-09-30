import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck, Check, Sparkles } from "lucide-react";
import { SupabaseAuthService, isSupabaseConfigured } from "../../services/supabaseAuth";
import { getFriendlyErrorMessage } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { AuthFormSkeleton } from "../ui/AuthSkeleton";
import { LoginLoaderModal } from "./LoginLoaderModal";

interface ResetPasswordViewProps {
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToForgotPassword: () => void;
  oobCodeFromProps?: string | null;
}

interface PasswordStrength {
  score: number;
  label: string;
  colorClass: string;
  textColorClass: string;
  checks: {
    hasMinLength: boolean;
    hasLengthEight: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    hasMinLength: password.length >= 6,
    hasLengthEight: password.length >= 8,
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (checks.hasMinLength) score += 1;
  if (checks.hasLengthEight) score += 1;
  if (checks.hasDigit) score += 1;
  if (checks.hasSpecial) score += 1;

  let label = "Very Weak";
  let colorClass = "bg-[#0F2D5C]";
  let textColorClass = "text-[#0F2D5C]";

  if (score === 1) {
    label = "Weak";
    colorClass = "bg-[#0F2D5C]";
    textColorClass = "text-[#9CA3AF]";
  } else if (score === 2) {
    label = "Fair";
    colorClass = "bg-[#0F2D5C]";
    textColorClass = "text-[#0F2D5C]";
  } else if (score === 3) {
    label = "Strong";
    colorClass = "bg-[#0F2D5C]";
    textColorClass = "text-[#0F2D5C]";
  } else if (score === 4) {
    label = "Very Strong";
    colorClass = "bg-[#0F2D5C]";
    textColorClass = "text-[#0F2D5C]";
  }

  return { score, label, colorClass, textColorClass, checks };
};

export const ResetPasswordView: React.FC<ResetPasswordViewProps>= ({
  onNavigateToLogin,
  onNavigateHome,
  onNavigateToForgotPassword,
  oobCodeFromProps,
}) => {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [isSupabaseRecovery, setIsSupabaseRecovery] = useState(false);

  // Parse and verify oobCode or Supabase tokens on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#/, "");
      hashParams = new URLSearchParams(cleanHash);
    }

    // 1. Check for Supabase recovery hash tokens
    const hashAccessToken = hashParams.get("access_token");
    const hashRefreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    if (isSupabaseConfigured && (hashType === "recovery" || (hashAccessToken && hashRefreshToken))) {
      if (hashAccessToken && hashRefreshToken) {
        setIsSupabaseRecovery(true);
        setOobCode("supabase_session");
        SupabaseAuthService.setSession(hashAccessToken, hashRefreshToken)
          .then(async (res) => {
            const user = res?.user || (await SupabaseAuthService.getUser());
            if (user?.email) {
              setTargetEmail(user.email);
            }
            setVerifyingCode(false);
          })
          .catch((err) => {
            soundFx.playErrorSound();
            setError(getFriendlyErrorMessage(err));
            setVerifyingCode(false);
          });
        return;
      }
    }

    const code =
      oobCodeFromProps ||
      searchParams.get("oobCode") ||
      searchParams.get("resetToken") ||
      searchParams.get("token") ||
      hashParams.get("oobCode") ||
      hashParams.get("resetToken") ||
      hashParams.get("token");

    if (!code) {
      setVerifyingCode(false);
      setError("No valid password reset code found in the link. Please request a new link.");
      return;
    }

    setOobCode(code);
    setTargetEmail("user@smartlinkng.com.ng");
    setVerifyingCode(false);
  }, [oobCodeFromProps]);

  // Auto-redirect countdown after success
  useEffect(() => {
    let timer: any;
    if (resetSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resetSuccess && countdown === 0) {
      onNavigateToLogin();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resetSuccess, countdown, onNavigateToLogin]);

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      soundFx.playErrorSound();
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      soundFx.playErrorSound();
      setError("Passwords do not match. Please ensure both fields match exactly.");
      return;
    }

    if (!oobCode) {
      soundFx.playErrorSound();
      setError("Missing reset code. Please request a new password reset link.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseRecovery || oobCode === "supabase_session") {
        await SupabaseAuthService.updatePassword(newPassword);
      } else {
        // Backend API
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: oobCode, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Password reset failed.");
        }
      }

      soundFx.playSuccessSound();
      setResetSuccess(true);
    } catch (err: any) {
      soundFx.playErrorSound();
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Verification-Style Password Reset Loader Modal */}
      <LoginLoaderModal
        isOpen={loading}
        title="Updating Password Credentials"
        providerName="SmartLink Security Authority"
        customSteps={[
          { progress: 25, label: "Validating new password strength..." },
          { progress: 55, label: "Updating cryptographic credentials..." },
          { progress: 85, label: "Invalidating previous active sessions..." },
          { progress: 100, label: "Password updated successfully!" },
        ]}
      />

      {/* Background Soft Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5E7EB]/70 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#E5E7EB]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0F2D5C] transition-colors cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 bg-white shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <span className="text-[11px] font-bold tracking-wider text-[#0F2D5C] uppercase bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-[#0F2D5C]" />
          Reset Password
        </span>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 space-y-6 text-left"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create New Password
            </h1>
            {targetEmail && (
              <p className="text-xs text-[#0F2D5C] font-medium mt-1.5 bg-blue-50 border border-blue-200 inline-block px-3 py-1 rounded-full">
                For account: <span className="font-semibold text-slate-900">{targetEmail}</span>
              </p>
            )}
          </div>
        </div>

        {/* Verifying Skeleton State */}
        {verifyingCode ? (
          <AuthFormSkeleton />
        ) : resetSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-2"
          >
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your password has been securely updated. You can now log into your Smart Link Nigeria account with your new credentials.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0F2D5C] shrink-0" />
              <span>Redirecting to Sign In in <strong className="text-slate-900">{countdown}s</strong>...</span>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3.5 px-4 active:scale-98 font-bold text-xs rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white transition-all shadow-md cursor-pointer"
            >
              Sign In Now
            </button>
          </motion.div>
        ) : error && !targetEmail ? (
          /* Invalid Code / Link Expired State */
          <div className="space-y-5 text-center py-2">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Link Invalid or Expired</span>
              </div>
              <p className="leading-relaxed font-medium">{error}</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="w-full py-3 px-4 active:scale-98 font-bold text-xs rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white transition-all shadow-md cursor-pointer"
              >
                Request New Password Reset Link
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 font-semibold text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Form to enter new password */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0F2D5C]" />
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white border border-slate-300 focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 text-slate-900 rounded-xl pl-3.5 pr-10 py-2.5 text-sm placeholder-slate-400 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 animate-fadeIn text-left">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Password Strength:</span>
                    <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                  </div>
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-full rounded-full flex-1 transition-all duration-300 ${
                          index <= strength.score ? strength.colorClass : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500 pt-1">
                    <span className={`flex items-center gap-1 ${strength.checks.hasMinLength ? "text-emerald-600 font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> 6+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasDigit ? "text-emerald-600 font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> Includes number
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasLengthEight ? "text-emerald-600 font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> 8+ recommended
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasSpecial ? "text-emerald-600 font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> Special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0F2D5C]" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-white border border-slate-300 focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 text-slate-900 rounded-xl pl-3.5 pr-10 py-2.5 text-sm placeholder-slate-400 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p className={`text-[11px] font-medium ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                  {newPassword === confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 active:scale-98 font-bold text-xs rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Updating Password..." : "Update Password"}</span>
            </button>
          </form>
        )}
      </motion.div>

      <p className="text-[10px] text-[#9CA3AF] mt-8 text-center">
        © {new Date().getFullYear()} Smart Link Nigeria. All rights reserved.
      </p>
    </div>
  );
};
