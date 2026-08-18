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
    // 1. Parse search query parameters
    const searchParams = new URLSearchParams(window.location.search);

    // 2. Parse hash query parameters if present (e.g. /#/reset-password?mode=...)
    let hashParams = new URLSearchParams();
    if (window.location.hash && window.location.hash.includes("?")) {
      hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf("?")));
    }

    // 3. Parse continueUrl embedded parameters if passed by Firebase custom action handler
    let continueParams = new URLSearchParams();
    const continueUrl = searchParams.get("continueUrl") || hashParams.get("continueUrl");
    if (continueUrl) {
      try {
        const parsedUrl = new URL(continueUrl, window.location.origin);
        continueParams = new URLSearchParams(parsedUrl.search);
      } catch (e) {}
    }

    const modeParam =
      searchParams.get("mode") ||
      hashParams.get("mode") ||
      continueParams.get("mode");

    const codeParam =
      searchParams.get("oobCode") ||
      searchParams.get("resetToken") ||
      searchParams.get("token") ||
      hashParams.get("oobCode") ||
      hashParams.get("resetToken") ||
      hashParams.get("token") ||
      continueParams.get("oobCode") ||
      continueParams.get("resetToken") ||
      continueParams.get("token");

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
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-sans">
              SMART LINK NG
            </h1>
            <h2 className="text-lg font-bold text-slate-900">Email Recovery Action</h2>
          </div>
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
