import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, KeyRound, UserPlus } from "lucide-react";
import {
  auth,
  db,
  sendPasswordResetEmail,
  collection,
  query,
  where,
  limit,
  getDocs,
  withTimeout,
  isFirebaseConfigured
} from "../../firebase";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { getFriendlyErrorMessage } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { AuthFormSkeleton } from "../ui/AuthSkeleton";

interface ForgotPasswordViewProps {
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToRegister?: () => void;
  initialEmail?: string;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigateToLogin,
  onNavigateHome,
  onNavigateToRegister,
  initialEmail = "",
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email.trim())) {
      soundFx.playErrorSound();
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Step 1: Verify email exists via server verification
      try {
        const checkRes = await fetch("/api/auth/check-email-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const checkData = await checkRes.json();
        if (checkData && checkData.exists === false) {
          soundFx.playErrorSound();
          setError("email not found or not registered, register instead");
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        console.warn("[ForgotPasswordView] Check email existence note:", checkErr);
      }

      let sent = false;
      if (isFirebaseConfigured) {
        try {
          await sendPasswordResetEmail(auth, cleanEmail);
          sent = true;
        } catch (fbErr: any) {
          if (
            fbErr?.code === "auth/user-not-found" ||
            fbErr?.message?.includes("user-not-found") ||
            fbErr?.message?.includes("User not found")
          ) {
            soundFx.playErrorSound();
            setError("email not found or not registered, register instead");
            setLoading(false);
            return;
          }
          throw fbErr;
        }
      }

      if (!sent) {
        // Fallback or server-side email dispatch
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          if (
            res.status === 404 ||
            data.error?.toLowerCase().includes("not found") ||
            data.error?.toLowerCase().includes("not registered")
          ) {
            soundFx.playErrorSound();
            setError("email not found or not registered, register instead");
            setLoading(false);
            return;
          }
          throw new Error(data.error || data.message || "Unable to send password reset email.");
        }
        sent = true;
      }

      soundFx.playSuccessSound();
      setEmailSent(true);
      setSuccessMessage(
        `We've sent password reset instructions to ${cleanEmail}. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      soundFx.playErrorSound();
      const friendly = getFriendlyErrorMessage(err);
      if (
        friendly.toLowerCase().includes("not found") ||
        friendly.toLowerCase().includes("not registered")
      ) {
        setError("email not found or not registered, register instead");
      } else {
        setError(friendly);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Soft Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5E7EB]/80 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#E5E7EB]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header / Back Button */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer bg-white hover:bg-[#E5E7EB] px-3.5 py-2 rounded-xl border border-[#E5E7EB] shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        
        <span className="text-[11px] font-bold tracking-wider text-[#0F2D5C] uppercase bg-[#F5F7FA] border border-[#E5E7EB] px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <KeyRound className="w-3 h-3 text-[#0F2D5C]" />
          Account Recovery
        </span>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#E5E7EB]/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-none relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div>
            <h1 className="text-xl font-bold text-[#111827] tracking-tight flex items-center justify-center gap-2">
              Forgot Password?
            </h1>
            <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
              Enter your registered email address and we'll send you secure instructions to reset your Smart Link password.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs flex items-start gap-2.5 shadow-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-[#0F2D5C] shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1 font-medium">
                <div>{error}</div>
                {error.includes("register instead") && (
                  <div className="mt-2 pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-between">
                    <span className="text-[11px] text-[#0F2D5C] font-normal">Need an account?</span>
                    <button
                      type="button"
                      onClick={onNavigateToRegister || onNavigateToLogin}
                      className="text-xs font-bold text-[#0F2D5C] hover:text-[#0F2D5C] underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Register now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success View */}
        {emailSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-center py-2"
          >
            <div className="w-14 h-14 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#111827]">Reset Link Sent!</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed max-w-sm mx-auto">
                {successMessage}
              </p>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-left text-[11px] text-[#4B5563] space-y-1">
              <p className="font-semibold text-[#111827] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F2D5C]" />
                Didn't receive the email?
              </p>
              <p>Check your spam/junk folder or verify that you entered the correct email address.</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="w-full py-2.5 px-4 bg-[#E5E7EB] hover:bg-[#E5E7EB] text-[#111827] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Try Another Email
              </button>
              
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-none cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </motion.div>
        ) : loading ? (
          <AuthFormSkeleton />
        ) : (
          /* Reset Request Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="recovery-email" className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0F2D5C]" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="recovery-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#F5F7FA] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] focus:ring-1 focus:ring-[#111827] text-[#111827] rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 transition-colors outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>Send Reset Instructions</span>
            </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-[#4B5563]">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-[#0F2D5C] hover:text-[#0F2D5C] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </motion.div>

      {/* Footer copyright */}
      <p className="text-[10px] text-[#9CA3AF] mt-8 text-center">
        © {new Date().getFullYear()} Smart Link Nigeria. Secure Authentication System.
      </p>
    </div>
  );
};
