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
    <div id="admin-login-page" className="min-h-screen w-full bg-[#F5F7FA] text-[#111827] flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans">
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0F2D5C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        id="admin-login-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 shadow-xl relative z-10 space-y-6 text-[#111827]"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
            <img
              src={activeLogo}
              alt={siteName || "SmartLink Logo"}
              className="h-12 md:h-14 w-auto max-w-[200px] object-contain"
              onError={handleLogoError}
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-[#0F2D5C] mb-1.5 uppercase tracking-wider">
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
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Authentication Error</p>
                <p className="font-normal text-rose-800">{errorMessage}</p>
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
                <p className="font-bold text-emerald-900">Session Verified</p>
                <p className="font-normal text-emerald-800">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-[#0F2D5C]" />
              Admin Email Address
            </label>
            <input
              id="admin-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smartlinkng.com.ng"
              required
              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#6B7280] transition-colors outline-none"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#0F2D5C]" />
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
                className="text-xs font-bold text-[#0F2D5C] hover:underline transition-colors cursor-pointer"
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
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 rounded-xl pl-4 pr-12 py-3 text-sm text-[#111827] placeholder-[#6B7280] transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
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
              className="w-full py-3.5 px-5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 focus:outline-none"
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
                className="w-full py-3 px-5 border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563] hover:text-[#111827] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center shadow-2xs"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xl space-y-4 relative text-[#111827]"
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
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#111827] placeholder-[#6B7280] outline-none"
                />

                {forgotResponse && (
                  <p className="text-[11px] p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0F2D5C] font-semibold">
                    {forgotResponse}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 border border-[#E5E7EB] hover:bg-[#F8FAFC] rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#111827] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
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
