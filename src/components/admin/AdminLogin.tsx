/**
 * SmartLink Admin Panel — Dedicated Secure Admin Login Page
 * Path: /admin/login
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  X
} from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

interface AdminLoginProps {
  onLoginSuccess: (session: any) => void;
  onNavigateHome?: () => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigateHome }: AdminLoginProps) {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.logoUrl || config.branding?.lightLogoUrl || configuredLogoUrl || logoImg;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResponse, setForgotResponse] = useState<string | null>(null);

  const establishAdminSession = async (token: string, fallbackSession?: any) => {
    try {
      const res = await fetch("/api/admin/auth/session", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (fallbackSession) {
          const stored = { ...fallbackSession, sessionToken: fallbackSession.sessionToken || token };
          sessionStorage.setItem("smart_link_admin_session", JSON.stringify(stored));
          setSuccessMessage("Authentication successful! Loading Administrator Dashboard...");
          setTimeout(() => onLoginSuccess(stored), 600);
          return;
        }
        setErrorMessage(data.error || data.message || "Access Denied: Your account does not have administrative privileges.");
        setLoading(false);
        try { await auth.signOut(); } catch {}
        return;
      }

      setSuccessMessage("Authentication verified! Welcome to the Admin Portal.");
      const finalSession = {
        ...data.session,
        sessionToken: data.session?.sessionToken || token,
      };
      sessionStorage.setItem("smart_link_admin_session", JSON.stringify(finalSession));

      setTimeout(() => {
        onLoginSuccess(finalSession);
      }, 600);
    } catch (err: any) {
      if (fallbackSession) {
        const stored = { ...fallbackSession, sessionToken: fallbackSession.sessionToken || token };
        sessionStorage.setItem("smart_link_admin_session", JSON.stringify(stored));
        setSuccessMessage("Authentication successful! Loading Administrator Dashboard...");
        setTimeout(() => onLoginSuccess(stored), 600);
        return;
      }
      setErrorMessage("Network error verifying admin session. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your administrator email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Try Firebase Email/Password Sign-In
      let idToken: string | null = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        idToken = await userCredential.user.getIdToken();
      } catch (fbErr: any) {
        console.log("[AdminLogin] Firebase login attempt:", fbErr.code);
      }

      if (idToken) {
        await establishAdminSession(idToken);
        return;
      }

      // 2. Fallback to Direct Backend Admin Login (Email & Password Credentials)
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.session) {
        await establishAdminSession(data.session.sessionToken, data.session);
        return;
      }

      setErrorMessage(data.message || "Invalid administrator email address or password.");
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setForgotResponse(null);

    try {
      try {
        await sendPasswordResetEmail(auth, forgotEmail.trim());
        setForgotResponse("Password reset email sent. Please check your inbox.");
      } catch {
        const res = await fetch("/api/admin/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail.trim() }),
        });
        const data = await res.json();
        setForgotResponse(data.message || "Password reset instructions dispatched.");
      }
    } catch (err: any) {
      setForgotResponse("Failed to send reset instructions. Please contact technical support.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div id="admin-login-page" style={{ backgroundColor: '#ffffff' }} className="min-h-screen w-full text-slate-800 flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0F2D5C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#0F2D5C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        id="admin-login-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor: '#d7dbf7' }}
        className="w-full max-w-md border border-[#0F2D5C]/15 rounded-2xl p-6 md:p-8 shadow-xl relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 border border-white rounded-2xl shadow-xs">
            <img
              src={activeLogo}
              alt={siteName || "SmartLink Logo"}
              className="h-12 md:h-14 w-auto max-w-[200px] object-contain"
              onError={handleLogoError}
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2D5C]/10 border border-[#0F2D5C]/20 text-[11px] font-semibold text-[#0F2D5C] mb-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0F2D5C]" />
              SmartLink Admin Portal
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-[#4B5563] mt-1">
              Restricted Area — Authenticate with your assigned administrative credentials
            </p>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              id="admin-login-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Authentication Error</p>
                <p className="font-normal text-red-800">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              id="admin-login-success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Session Verified</p>
                <p className="font-normal text-emerald-800">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#0F2D5C]" />
              Admin Email Address
            </label>
            <input
              id="admin-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smartlinkng.com.ng"
              required
              className="w-full bg-white border border-[#0F2D5C]/15 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] placeholder-slate-400 transition-colors outline-none"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#0F2D5C]" />
                Password
              </label>
              <button
                id="admin-forgot-password-btn"
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                  setForgotResponse(null);
                }}
                className="text-[11px] text-[#0F2D5C] hover:text-[#17407E] font-semibold hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-white border border-[#0F2D5C]/15 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#111827] placeholder-slate-400 transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              id="admin-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                  Authenticating Administrator...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Login to Admin Panel
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              )}
            </button>

            {onNavigateHome && (
              <button
                id="admin-return-home-btn"
                type="button"
                onClick={onNavigateHome}
                className="w-full py-2.5 px-4 bg-white/80 hover:bg-white border border-[#0F2D5C]/15 text-[#374151] hover:text-[#111827] font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs"
              >
                Return to Public Application
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xl space-y-4 relative text-[#111827]"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-[#0F2D5C]">
                <KeyRound className="h-5 w-5 text-[#0F2D5C]" />
                <h3 className="text-sm font-bold text-[#111827]">Reset Admin Password</h3>
              </div>

              <p className="text-xs text-[#4B5563]">
                Enter your administrative email address to dispatch password recovery instructions.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@smartlinkng.com.ng"
                  required
                  className="w-full bg-white border border-[#0F2D5C]/15 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] placeholder-slate-400 outline-none"
                />

                {forgotResponse && (
                  <p className="text-[11px] p-2.5 rounded-lg bg-[#0F2D5C]/5 border border-[#0F2D5C]/15 text-[#0F2D5C] font-semibold">
                    {forgotResponse}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 bg-white text-[#374151] border border-[#E5E7EB] rounded-xl text-xs font-semibold hover:bg-[#F5F7FA] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} /> : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
