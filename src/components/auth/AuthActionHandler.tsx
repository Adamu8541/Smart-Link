import React, { useState, useEffect } from "react";
import { ResetPasswordView } from "./ResetPasswordView";
import { VerifyEmailView } from "./VerifyEmailView";
import { ForgotPasswordView } from "./ForgotPasswordView";
import { motion } from "motion/react";
import { AlertCircle, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import logoImg from "../../assets/images/smartlink_logo_1785934050308.jpg";

interface AuthActionHandlerProps {
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToDashboard?: () => void;
}

export const AuthActionHandler: React.FC<AuthActionHandlerProps> = ({
  onNavigateToLogin,
  onNavigateHome,
  onNavigateToDashboard,
}) => {
  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const codeParam = params.get("oobCode") || params.get("resetToken") || params.get("token");

    setMode(modeParam);
    setOobCode(codeParam);
  }, []);

  if (mode === "resetPassword" || (oobCode && !mode && window.location.pathname.includes("reset-password"))) {
    return (
      <ResetPasswordView
        onNavigateToLogin={onNavigateToLogin}
        onNavigateHome={onNavigateHome}
        onNavigateToForgotPassword={() => {
          window.history.pushState({}, "", "/forgot-password");
          setMode("forgotPassword");
        }}
        oobCodeFromProps={oobCode}
      />
    );
  }

  if (mode === "verifyEmail" || (oobCode && !mode && window.location.pathname.includes("verify-email"))) {
    return (
      <VerifyEmailView
        onNavigateToLogin={onNavigateToLogin}
        onNavigateHome={onNavigateHome}
        onNavigateToDashboard={onNavigateToDashboard}
        oobCodeFromProps={oobCode}
      />
    );
  }

  if (mode === "forgotPassword" || window.location.pathname.includes("forgot-password")) {
    return (
      <ForgotPasswordView
        onNavigateToLogin={onNavigateToLogin}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (mode === "recoverEmail") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 relative font-sans">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-xl shadow-slate-200/70"
        >
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <img src={logoImg} alt="Smart Link" className="w-12 h-12 rounded-xl object-contain" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Email Recovery Action</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are attempting to restore a previous email address associated with your Smart Link account.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-slate-950/20 cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback default: render ResetPasswordView if code exists, otherwise ForgotPasswordView
  if (oobCode) {
    return (
      <ResetPasswordView
        onNavigateToLogin={onNavigateToLogin}
        onNavigateHome={onNavigateHome}
        onNavigateToForgotPassword={() => setMode("forgotPassword")}
        oobCodeFromProps={oobCode}
      />
    );
  }

  return (
    <ForgotPasswordView
      onNavigateToLogin={onNavigateToLogin}
      onNavigateHome={onNavigateHome}
    />
  );
};
