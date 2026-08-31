import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck, Check, Sparkles } from "lucide-react";
import { auth, verifyPasswordResetCode, confirmPasswordReset, isFirebaseConfigured } from "../../firebase";
import { getFriendlyErrorMessage } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { AuthFormSkeleton } from "../ui/AuthSkeleton";

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

  // Parse and verify oobCode on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (window.location.hash && window.location.hash.includes("?")) {
      hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf("?")));
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

    if (isFirebaseConfigured) {
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setTargetEmail(email);
          setVerifyingCode(false);
        })
        .catch((err) => {
          soundFx.playErrorSound();
          setError(getFriendlyErrorMessage(err));
          setVerifyingCode(false);
        });
    } else {
      // Dev mode or simulation fallback
      setTargetEmail("user@smartlinkng.com.ng");
      setVerifyingCode(false);
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
      if (isFirebaseConfigured) {
        await confirmPasswordReset(auth, oobCode, newPassword);
      } else {
        // Dev server API fallback
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
      {/* Background Soft Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5E7EB]/70 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#E5E7EB]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer bg-white hover:bg-[#E5E7EB] px-3.5 py-2 rounded-xl border border-[#E5E7EB] shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <span className="text-[11px] font-bold tracking-wider text-[#0F2D5C] uppercase bg-[#F5F7FA] border border-[#E5E7EB] px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-[#0F2D5C]" />
          Reset Password
        </span>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#E5E7EB]/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div>
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">
              Create New Password
            </h1>
            {targetEmail && (
              <p className="text-xs text-[#0F2D5C] font-medium mt-1.5 bg-[#F5F7FA] border border-[#E5E7EB] inline-block px-3 py-1 rounded-full">
                For account: <span className="font-semibold text-[#111827]">{targetEmail}</span>
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
            <div className="w-16 h-16 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#111827]">Password Reset Complete!</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed max-w-sm mx-auto">
                Your password has been securely updated. You can now log into your Smart Link Nigeria account with your new credentials.
              </p>
            </div>

            <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-xs text-[#4B5563] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0F2D5C] shrink-0" />
              <span>Redirecting to Sign In in <strong className="text-[#111827]">{countdown}s</strong>...</span>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer"
            >
              Sign In Now
            </button>
          </motion.div>
        ) : error && !targetEmail ? (
          /* Invalid Code / Link Expired State */
          <div className="space-y-5 text-center py-2">
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-[#0F2D5C]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0F2D5C]" />
                <span>Link Invalid or Expired</span>
              </div>
              <p className="leading-relaxed font-medium">{error}</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer"
              >
                Request New Password Reset Link
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 bg-[#E5E7EB] hover:bg-[#E5E7EB] text-[#4B5563] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Form to enter new password */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
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
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] focus:ring-1 focus:ring-[#111827] text-[#111827] rounded-xl pl-3.5 pr-10 py-2.5 text-xs placeholder-slate-400 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors cursor-pointer p-1"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6B7280]">Password Strength:</span>
                    <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden border border-[#E5E7EB]">
                    <div className={`h-full ${strength.score >= 1 ? strength.colorClass : "bg-[#E5E7EB]"}`} />
                    <div className={`h-full ${strength.score >= 2 ? strength.colorClass : "bg-[#E5E7EB]"}`} />
                    <div className={`h-full ${strength.score >= 3 ? strength.colorClass : "bg-[#E5E7EB]"}`} />
                    <div className={`h-full ${strength.score >= 4 ? strength.colorClass : "bg-[#E5E7EB]"}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-[#6B7280] pt-1">
                    <span className={`flex items-center gap-1 ${strength.checks.hasMinLength ? "text-[#0F2D5C] font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> 6+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasDigit ? "text-[#0F2D5C] font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> Includes number
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasLengthEight ? "text-[#0F2D5C] font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> 8+ recommended
                    </span>
                    <span className={`flex items-center gap-1 ${strength.checks.hasSpecial ? "text-[#0F2D5C] font-semibold" : ""}`}>
                      <Check className="w-3 h-3" /> Special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
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
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] focus:ring-1 focus:ring-[#111827] text-[#111827] rounded-xl pl-3.5 pr-10 py-2.5 text-xs placeholder-slate-400 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors cursor-pointer p-1"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p className={`text-[11px] font-medium ${newPassword === confirmPassword ? "text-[#0F2D5C]" : "text-[#0F2D5C]"}`}>
                  {newPassword === confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
