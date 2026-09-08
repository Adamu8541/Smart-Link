import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Send, ShieldCheck, Sparkles, Check } from "lucide-react";
import { auth, applyActionCode, sendEmailVerification, reload, isFirebaseConfigured } from "../../firebase";
import { getFriendlyErrorMessage, safeFetchJson } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { AuthFormSkeleton } from "../ui/AuthSkeleton";

interface VerifyEmailViewProps {
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToDashboard?: () => void;
  oobCodeFromProps?: string | null;
  userEmailFromProps?: string;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  onNavigateToLogin,
  onNavigateHome,
  onNavigateToDashboard,
  oobCodeFromProps,
  userEmailFromProps,
}) => {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const currentUser = auth.currentUser;
  const targetEmail = userEmailFromProps || currentUser?.email || "your email address";

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (window.location.hash && window.location.hash.includes("?")) {
      hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf("?")));
    }

    const code =
      oobCodeFromProps ||
      searchParams.get("oobCode") ||
      searchParams.get("token") ||
      hashParams.get("oobCode") ||
      hashParams.get("token");

    if (code) {
      setOobCode(code);
      setVerifying(true);

      if (isFirebaseConfigured) {
        applyActionCode(auth, code)
          .then(async () => {
            soundFx.playSuccessSound();
            setVerifiedSuccess(true);
            setVerifying(false);

            // Sync with backend if user is signed in
            if (auth.currentUser) {
              try {
                await reload(auth.currentUser);
                await safeFetchJson("/api/auth/sync-firebase-user", {
                  method: "POST",
                  body: JSON.stringify({
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    isVerified: true,
                  }),
                });
              } catch (e) {
                // Ignore sync errors
              }
            }
          })
          .catch((err) => {
            soundFx.playErrorSound();
            setError(getFriendlyErrorMessage(err));
            setVerifying(false);
          });
      } else {
        // Local simulation fallback
        soundFx.playSuccessSound();
        setVerifiedSuccess(true);
        setVerifying(false);
      }
    }
  }, [oobCodeFromProps]);

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendSuccess(null);
    setError(null);

    try {
      if (currentUser && isFirebaseConfigured) {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        };
        await sendEmailVerification(currentUser, actionCodeSettings);
      } else {
        // Fallback endpoint call
        const res = await safeFetchJson("/api/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email: targetEmail }),
        });
        if (!res.ok) {
          throw new Error(res.error || "Failed to resend verification email.");
        }
      }

      soundFx.playSuccessSound();
      setResendSuccess(`Verification email sent to ${targetEmail}. Please check your inbox.`);
    } catch (err: any) {
      soundFx.playErrorSound();
      setError(getFriendlyErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5E7EB]/70 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
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
          Email Verification
        </span>
      </div>

      {/* Main Card */}
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
              Email Verification
            </h1>
          </div>
        </div>

        {verifying ? (
          <AuthFormSkeleton />
        ) : verifiedSuccess ? (
          /* Verification Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-2"
          >
            <div className="w-16 h-16 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#111827]">Email Address Verified!</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed max-w-sm mx-auto">
                Thank you for verifying your email address. Your Smart Link Nigeria account is now fully active and verified.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {onNavigateToDashboard ? (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer"
                >
                  Sign In to Your Account
                </button>
              )}
            </div>
          </motion.div>
        ) : error && oobCode ? (
          /* Invalid Verification Code Screen */
          <div className="space-y-5 text-center py-2">
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-[#0F2D5C]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0F2D5C]" />
                <span>Verification Link Error</span>
              </div>
              <p className="leading-relaxed font-medium">{error}</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer disabled:opacity-60"
              >
                {resendLoading ? "Sending Email..." : "Resend Verification Email"}
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
          /* Standard Unverified State with Resend Action */
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#111827]">Verify Your Email Address</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                We sent a verification link to:
              </p>
              <p className="text-xs font-semibold text-[#0F2D5C] bg-[#F5F7FA] border border-[#E5E7EB] inline-block px-3 py-1.5 rounded-full">
                {targetEmail}
              </p>
              <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                Please click the verification link inside that email to activate your account.
              </p>
            </div>

            <AnimatePresence>
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs flex items-start gap-2 text-left"
                >
                  <Check className="w-4 h-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                  <div className="leading-relaxed flex-1 font-medium">{resendSuccess}</div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#0F2D5C] text-xs flex items-start gap-2 text-left"
                >
                  <AlertCircle className="w-4 h-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                  <div className="leading-relaxed flex-1 font-medium">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#111827] active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resending Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 bg-[#E5E7EB] hover:bg-[#E5E7EB] text-[#4B5563] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Sign In With Another Account
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <p className="text-[10px] text-[#9CA3AF] mt-8 text-center">
        © {new Date().getFullYear()} Smart Link Nigeria. All rights reserved.
      </p>
    </div>
  );
};
