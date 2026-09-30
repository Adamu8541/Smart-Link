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
import { LoginLoaderModal } from "../auth/LoginLoaderModal";
const logoImg = DEFAULT_LOGO_URL;

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

  const establishAdminSession = async (token: string) => {
    try {
      const res = await fetch("/api/admin/auth/session", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || data.message || "Access Denied: Your account does not have administrative privileges.");
        setLoading(false);
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
      }, 500);
    } catch (err: any) {
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
      // Direct Backend Admin Login (Email & Password Credentials)
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const loginText = await res.text().catch(() => "");
      let data: any = {};
      try { data = loginText ? JSON.parse(loginText) : {}; } catch { data = {}; }

      if (res.ok && data.success && data.session?.sessionToken) {
        await establishAdminSession(data.session.sessionToken);
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
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const forgotText = await res.text().catch(() => "");
      let data: any = {};
      try { data = forgotText ? JSON.parse(forgotText) : {}; } catch { data = {}; }
      setForgotResponse(data.message || "Password reset instructions dispatched.");
    } catch (err: any) {
      setForgotResponse("Failed to send reset instructions. Please contact technical support.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div id="admin-login-page" className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Verification-Style Admin Login Loader Modal */}
      <LoginLoaderModal
        isOpen={loading}
        title="Administrator Authentication"
        providerName="SmartLink Admin Security Authority"
        customSteps={[
          { progress: 25, label: "Processing admin credentials..." },
          { progress: 55, label: "Authenticating administrative tokens..." },
          { progress: 85, label: "Verifying security clearances & RBAC..." },
          { progress: 100, label: "Loading administrative console..." },
        ]}
      />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        id="admin-login-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
            <img
              src={activeLogo}
              alt={siteName || "SmartLink Logo"}
              className="h-12 md:h-14 w-auto max-w-[200px] object-contain"
              onError={handleLogoError}
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-400 mb-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              SmartLink Admin Portal
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-slate-400 mt-1">
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
              className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Authentication Error</p>
                <p className="font-normal text-rose-300">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              id="admin-login-success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-200">Session Verified</p>
                <p className="font-normal text-emerald-300">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-blue-400" />
              Admin Email Address
            </label>
            <input
              id="admin-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smartlinkng.com.ng"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors outline-none"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-400" />
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
                className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              id="admin-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold rounded-xl text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 focus:outline-none"
            >
              {loading ? (
                <>
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                  Authenticating Administrator...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  LOGIN TO ADMIN PANEL
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </>
              )}
            </button>

            {onNavigateHome && (
              <button
                id="admin-return-home-btn"
                type="button"
                onClick={onNavigateHome}
                className="w-full py-3 px-5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center shadow-xs"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative text-slate-100"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-blue-400">
                <KeyRound className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Reset Admin Password</h3>
              </div>

              <p className="text-xs text-slate-400">
                Enter your administrative email address to dispatch password recovery instructions.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@smartlinkng.com.ng"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />

                {forgotResponse && (
                  <p className="text-[11px] p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
                    {forgotResponse}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-colors shadow-md"
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
