import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck, Check, Sparkles, Mail, RefreshCw } from "lucide-react";
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

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onNavigateToLogin,
  onNavigateHome,
  onNavigateToForgotPassword,
  oobCodeFromProps,
}) => {
  const [resetCode, setResetCode] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [isPrefilledCode, setIsPrefilledCode] = useState(false);
  const [expiredLinkNotice, setExpiredLinkNotice] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSupabaseRecovery, setIsSupabaseRecovery] = useState(false);

  // Parse token, code, email, or error parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#/, "");
      hashParams = new URLSearchParams(cleanHash);
    }

    // 1. Check for email parameter in search, hash, or sessionStorage
    const storedEmail = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("smartlink_reset_email") || "") : "";
    const detectedEmail =
      searchParams.get("email") ||
      hashParams.get("email") ||
      storedEmail ||
      "";
    if (detectedEmail) {
      setEmailInput(detectedEmail.trim());
    }

    // 2. Check for expired link errors from Supabase / external mail clients
    const errCode = searchParams.get("error_code") || hashParams.get("error_code");
    const errDesc = searchParams.get("error_description") || hashParams.get("error_description");
    const err = searchParams.get("error") || hashParams.get("error");

    if (errCode === "otp_expired" || (errDesc && errDesc.toLowerCase().includes("expired")) || err === "access_denied") {
      setExpiredLinkNotice(
        "The single-use link in your email has expired. You can still reset your password below using the 6-digit code from your email, or request a new code."
      );
    }

    // 3. Check for Supabase session recovery tokens
    const hashAccessToken = hashParams.get("access_token");
    const hashRefreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    if (isSupabaseConfigured && (hashType === "recovery" || (hashAccessToken && hashRefreshToken))) {
      if (hashAccessToken && hashRefreshToken) {
        setIsSupabaseRecovery(true);
        setResetCode("supabase_session");
        setIsPrefilledCode(true);
        SupabaseAuthService.setSession(hashAccessToken, hashRefreshToken)
          .then(async (res) => {
            const user = res?.user || (await SupabaseAuthService.getUser());
            if (user?.email) {
              setEmailInput(user.email);
            }
          })
          .catch(() => {});
        return;
      }
    }

    // 4. Check for direct query/hash tokens or OTP codes
    const code =
      oobCodeFromProps ||
      searchParams.get("token") ||
      searchParams.get("resetToken") ||
      searchParams.get("code") ||
      searchParams.get("otp") ||
      searchParams.get("oobCode") ||
      hashParams.get("token") ||
      hashParams.get("resetToken") ||
      hashParams.get("code") ||
      hashParams.get("otp") ||
      hashParams.get("oobCode");

    if (code && !code.startsWith("pkce_")) {
      setResetCode(code.trim());
      setIsPrefilledCode(true);
    }
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

    const cleanCode = resetCode.trim();
    const normalizedCode = cleanCode.replace(/[\s-]+/g, "");
    if (!normalizedCode) {
      soundFx.playErrorSound();
      setError("Please enter the 6-digit verification code or token from your email.");
      return;
    }

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

    setLoading(true);

    try {
      // 1. If code is 6 digits and email is present, attempt Supabase OTP verification
      if (/^\d{6}$/.test(normalizedCode) && emailInput.trim() && isSupabaseConfigured) {
        try {
          const otpRes = await SupabaseAuthService.verifyEmailOtpForAction(
            emailInput.trim().toLowerCase(),
            normalizedCode,
            "recovery"
          );
          if (!otpRes.error && otpRes.data?.session) {
            await SupabaseAuthService.updatePassword(newPassword);
          }
        } catch (otpErr) {
          console.warn("[ResetPasswordView] Supabase OTP verify note:", otpErr);
        }
      }

      // 2. If active Supabase recovery session exists, update password in Supabase
      if (isSupabaseRecovery || normalizedCode === "supabase_session" || cleanCode === "supabase_session") {
        try {
          await SupabaseAuthService.updatePassword(newPassword);
        } catch (supaErr) {
          console.warn("[ResetPasswordView] Supabase client session update note:", supaErr);
        }
      }

      // Submit password update to backend API
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: normalizedCode,
          code: normalizedCode,
          rawCode: cleanCode,
          password: newPassword,
          newPassword: newPassword,
          email: emailInput.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Password reset failed. Please check your reset code.");
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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-[#0F2D5C] transition-colors cursor-pointer px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-600">
            Enter your new secure password below to regain full account access.
          </p>
        </div>

        {resetSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-2"
          >
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your password has been successfully updated. You can now sign into your SmartLink account using your new password.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0F2D5C] shrink-0" />
              <span>Redirecting to Sign In in <strong className="text-slate-900">{countdown}s</strong>...</span>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full h-12 py-3 px-5 active:scale-[0.99] font-bold text-sm sm:text-base rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              Sign In Now
            </button>
          </motion.div>
        ) : (
          /* Form to enter new password */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Expired link notice if detected from Supabase redirect */}
            {expiredLinkNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Email Link Expired</span>
                </div>
                <p className="leading-relaxed font-normal text-amber-800">
                  {expiredLinkNotice}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Email Address (optional / prefilled) */}
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0F2D5C]" />
                Account Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-slate-300 focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm placeholder-slate-400 transition-colors outline-none"
              />
            </div>

            {/* Reset Code / Token Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="reset-code" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0F2D5C]" />
                  6-Digit Code or Reset Token
                </label>
                {isPrefilledCode && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Verified from Link
                  </span>
                )}
              </div>
              <input
                id="reset-code"
                type="text"
                required
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setIsPrefilledCode(false);
                }}
                placeholder="e.g. 123456"
                className={`w-full bg-white border ${
                  isPrefilledCode ? "border-emerald-300 bg-emerald-50/20" : "border-slate-300"
                } focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono placeholder-slate-400 transition-colors outline-none`}
              />
            </div>

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
              className="w-full h-12 py-3 px-5 active:scale-[0.99] font-bold text-sm sm:text-base rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Updating Password..." : "Update Password"}</span>
            </button>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-sm">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-[#0F2D5C] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Request a new code
              </button>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </motion.div>

      <p className="text-[10px] text-[#9CA3AF] mt-8 text-center">
        © {new Date().getFullYear()} Smart Link Nigeria. All rights reserved.
      </p>
    </div>
  );
};
