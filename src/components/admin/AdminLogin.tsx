/**
 * SmartLink Admin Panel — Dedicated Admin Login Page
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
  Loader2,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  UserCheck,
  Building2,
  RefreshCw,
  X
} from "lucide-react";
import logoImg from "../../assets/images/logo.png";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { AdminRoleType } from "../../services/adminAuthTypes";
import { useSiteConfig } from "../../context/SiteConfigContext";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your administrator email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Authentication failed. Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Authentication successful! Redirecting to Admin Dashboard...");
      
      // Store session in sessionStorage
      sessionStorage.setItem("smart_link_admin_session", JSON.stringify(data.session));
      sessionStorage.setItem("smart_link_admin_token", data.session.sessionToken);

      setTimeout(() => {
        onLoginSuccess(data.session);
      }, 700);

    } catch (err: any) {
      setErrorMessage("Network error: Could not connect to authentication server.");
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
      const data = await res.json();
      setForgotResponse(data.message || "Password reset instructions sent.");
    } catch (err: any) {
      setForgotResponse("Failed to send reset instructions. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background ambient subtle gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EAF3FF]/80 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#E5EAF0]/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#E5EAF0] rounded-2xl p-6 md:p-8 shadow-xl shadow-[#0B1F3A]/5 relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-2xl shadow-xs">
            <img src={activeLogo} alt={siteName || "SmartLink Logo"} className="h-14 md:h-16 w-auto max-w-[220px] object-contain" onError={(e: any) => { e.currentTarget.src = "/logo.png"; }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#E5EAF0] text-[11px] font-semibold text-[#0066FF] mb-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0066FF]" />
              SmartLink Admin Portal
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#101828] tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Restricted Area — Authenticate with your assigned administrative role
            </p>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-white border border-[#E5EAF0] text-[#F04438] rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-[#F04438] mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#F04438]">Authentication Error</p>
                <p className="font-medium text-[#667085]">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-white border border-[#E5EAF0] text-[#12B76A] rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#12B76A] mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#12B76A]">Session Initialized</p>
                <p className="font-medium text-[#667085]">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#101828] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#0066FF]" />
              Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartlinkng.com.ng"
                required
                className="w-full bg-[#F7F9FC] border border-[#E5EAF0] focus:bg-white focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-[#101828] placeholder-[#667085] transition-colors outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101828] flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#0066FF]" />
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                  setForgotResponse(null);
                }}
                className="text-[11px] text-[#0066FF] hover:text-[#123C73] font-semibold hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#F7F9FC] border border-[#E5EAF0] focus:bg-white focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#101828] placeholder-[#667085] transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#101828] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0B1F3A] hover:bg-[#123C73] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                  Authenticating Session...
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
                type="button"
                onClick={onNavigateHome}
                className="w-full py-2.5 px-4 bg-[#F7F9FC] hover:bg-[#EAF3FF] border border-[#E5EAF0] text-[#101828] font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xl space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-[#667085] hover:text-[#101828] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-[#0066FF]">
                <KeyRound className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-[#101828]">Reset Admin Password</h3>
              </div>

              <p className="text-xs text-[#667085]">
                Enter your administrative email address to dispatch password recovery instructions.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@smartlink.ng"
                  required
                  className="w-full bg-[#F7F9FC] border border-[#E5EAF0] focus:bg-white focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] rounded-xl px-3 py-2 text-xs text-[#101828] placeholder-[#667085] outline-none"
                />

                {forgotResponse && (
                  <p className="text-[11px] p-2.5 rounded-lg bg-[#EAF3FF] border border-[#E5EAF0] text-[#0066FF] font-medium">
                    {forgotResponse}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 bg-[#F7F9FC] text-[#667085] border border-[#E5EAF0] rounded-xl text-xs font-semibold hover:bg-white cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-[#0B1F3A] hover:bg-[#123C73] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
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
