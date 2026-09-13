/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  ShieldAlert,
  Clock,
  RefreshCw,
  Lock,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ZapOff,
  Calendar,
  Info,
  ArrowLeft,
  Server
} from "lucide-react";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { formatSafeDateTime } from "../../utils/formatUtils";
import { safeFetchJson } from "../../utils/authErrorHandler";
import { AdminSession } from "../../services/adminAuthTypes";

interface MaintenanceScreenProps {
  onAdminLoginRequested?: () => void;
  onAdminSessionCreated?: (session: AdminSession) => void;
  adminSession?: AdminSession | null;
  onNavigateToAdminDashboard?: () => void;
  scope?: "GLOBAL" | "LOGIN" | "REGISTRATION" | "SERVICE";
  serviceName?: string;
  onBackToSafety?: () => void;
}

export function MaintenanceScreen({
  onAdminLoginRequested,
  onAdminSessionCreated,
  adminSession,
  onNavigateToAdminDashboard,
  scope = "GLOBAL",
  serviceName,
  onBackToSafety,
}: MaintenanceScreenProps) {
  const { config, logoUrl, siteName, refreshConfig } = useSiteConfig();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "active" | "cleared"; message: string } | null>(null);

  // Quick Admin Login modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const maintenance = config.maintenance || {};
  const maintenanceMessage =
    maintenance.maintenanceMessage ||
    "SmartLink is currently undergoing scheduled infrastructure upgrades. Core services and transactions will resume shortly.";
  
  const startDateRaw = maintenance.startDate || (maintenance as any).updatedAt || new Date().toISOString();
  const endDateRaw = maintenance.scheduledEndTime || (maintenance as any).estimatedDowntime || null;

  const formatDate = (isoOrStr?: any) => {
    if (!isoOrStr) return "To Be Announced (TBA)";
    return formatSafeDateTime(isoOrStr, typeof isoOrStr === "string" ? isoOrStr : "To Be Announced (TBA)", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formattedStartDate = formatDate(startDateRaw);
  const formattedEndDate = formatDate(endDateRaw);

  const supportEmail = config.general?.supportEmail || "support@smartlinkng.com.ng";
  const supportPhone = config.general?.supportPhone || "+234 808 549 0982";
  const whatsappNumber = maintenance.supportContact || config.general?.whatsappNumber || "+234 904 773 8212";

  // Dynamic scope details
  let title = "Website Temporarily Unavailable";
  let badgeText = "SYSTEM UPGRADE & MAINTENANCE IN PROGRESS";
  let description =
    "We are currently performing critical infrastructure maintenance and database optimizations to serve you better. During this window, core platform services are temporarily restricted.";

  if (scope === "LOGIN") {
    title = "Website Login Under Maintenance";
    badgeText = "AUTHENTICATION GATEWAY MAINTENANCE";
    description =
      "User sign-in and account access are currently undergoing scheduled maintenance. Administrators can still access the dashboard via the Admin Portal.";
  } else if (scope === "REGISTRATION") {
    title = "Account Registration Suspended";
    badgeText = "NEW USER SIGNUP MAINTENANCE";
    description =
      "New user account creations and registration gateways are temporarily paused while we upgrade our verification systems.";
  } else if (scope === "SERVICE") {
    title = `${serviceName || "Service"} Under Maintenance`;
    badgeText = "SERVICE GATEWAY MAINTENANCE";
    description = `The ${serviceName || "requested service"} is currently undergoing scheduled provider maintenance. All other unaffected services remain operational.`;
  }

  // List of active affected components
  const affectedList = [];
  if (maintenance.maintenanceMode) {
    affectedList.push("Entire Platform & All User Transactions");
  } else {
    if (maintenance.loginMaintenanceMode) affectedList.push("User Account Sign-In / Login");
    if (maintenance.signupMaintenanceMode) affectedList.push("New Account Registrations & Verification");
    if (maintenance.servicesMaintenanceMode) {
      if (maintenance.maintenanceModeAllServices) {
        affectedList.push("All Digital & Financial Services");
      } else if (maintenance.maintenanceServices && maintenance.maintenanceServices.length > 0) {
        affectedList.push(`Services: ${maintenance.maintenanceServices.join(", ")}`);
      }
    }
  }
  if (affectedList.length === 0) {
    affectedList.push("Core System Infrastructure");
  }

  // Check live status
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setStatusFeedback(null);
    try {
      const res = await safeFetchJson<{ success: boolean; maintenanceActive: boolean }>("/api/maintenance/status", {
        cache: "no-store",
      });

      if (res.ok && res.data) {
        if (!res.data.maintenanceActive) {
          setStatusFeedback({
            type: "cleared",
            message: "🎉 Maintenance mode has been completed! Restoring website access...",
          });
          await refreshConfig();
          setTimeout(() => {
            if (onBackToSafety) onBackToSafety();
            else window.location.reload();
          }, 800);
        } else {
          setStatusFeedback({
            type: "active",
            message: "Maintenance is still active. Engineers are optimizing the system.",
          });
          await refreshConfig();
        }
      } else {
        setStatusFeedback({
          type: "active",
          message: "System is undergoing maintenance. Please check back shortly.",
        });
      }
    } catch {
      setStatusFeedback({
        type: "active",
        message: "Maintenance in progress. Please check back shortly.",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError("Please enter your admin email and password.");
      return;
    }

    setAdminLoading(true);
    setAdminError(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        sessionToken?: string;
        session?: AdminSession;
        message?: string;
        error?: string;
      }>("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }),
      });

      if (res.ok && res.data?.success && res.data.session) {
        const session = res.data.session;
        if (onAdminSessionCreated) {
          onAdminSessionCreated(session);
        }
        setShowAdminModal(false);
        if (onNavigateToAdminDashboard) {
          onNavigateToAdminDashboard();
        }
      } else {
        setAdminError(res.data?.message || res.data?.error || "Invalid admin credentials.");
      }
    } catch (err: any) {
      setAdminError(err.message || "Failed to authenticate with admin server.");
    } finally {
      setAdminLoading(false);
    }
  };

  if (scope === "SERVICE") {
    return (
      <div className="bg-[#111827] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-left space-y-5 text-[#E5E7EB] relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Wrench className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Service Maintenance</h3>
              <p className="text-xs text-slate-400">{serviceName || "Requested Digital Service"}</p>
            </div>
          </div>
          {onBackToSafety && (
            <button
              onClick={onBackToSafety}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-200 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Started</span>
              <span className="font-mono text-white font-semibold text-[11px]">{formattedStartDate}</span>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Completion</span>
              <span className="font-mono text-amber-300 font-semibold text-[11px]">{formattedEndDate}</span>
            </div>
          </div>

          {maintenanceMessage && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Notice</span>
              <p className="text-slate-300 italic text-[11px]">"{maintenanceMessage}"</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Inquiry%20regarding%20maintenance%20on%20${encodeURIComponent(serviceName || "service")}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </a>
          ) : <span />}

          {onBackToSafety && (
            <button
              onClick={onBackToSafety}
              className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Choose Another Service
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111827] via-[#0B1528] to-[#111827] text-[#E5E7EB] flex flex-col justify-between selection:bg-[#0F2D5C] selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#0F2D5C]/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-[#0F2D5C]/15 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Brand Bar */}
      <header className="w-full border-b border-[#111827]/80 bg-[#111827]/70 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-10 sm:h-12 w-auto max-w-[200px] object-contain rounded-lg bg-white p-1 shadow-sm border border-[#4B5563]"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0F2D5C] to-[#0F2D5C] flex items-center justify-center font-bold text-white shadow-md">
              SL
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{siteName}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0F2D5C] animate-ping" />
            </h1>
            <p className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">
              Enterprise Digital Infrastructure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#0F2D5C]/60 border border-[#0F2D5C]/30 rounded-full text-[11px] font-semibold text-[#9CA3AF]">
            <span className="w-2 h-2 rounded-full bg-[#0F2D5C] animate-pulse" />
            <span>MAINTENANCE MODE ACTIVE</span>
          </div>

          {onBackToSafety && scope !== "GLOBAL" && (
            <button
              onClick={onBackToSafety}
              className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-white text-xs font-semibold rounded-lg border border-[#4B5563] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return Back</span>
            </button>
          )}

          {adminSession ? (
            <button
              onClick={() => {
                if (onNavigateToAdminDashboard) onNavigateToAdminDashboard();
                else if (onAdminLoginRequested) onAdminLoginRequested();
              }}
              className="px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/30 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onAdminLoginRequested) {
                  onAdminLoginRequested();
                } else {
                  setShowAdminModal(true);
                }
              }}
              className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] hover:text-white text-xs font-semibold rounded-lg border border-[#4B5563] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Admin Access</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full space-y-8"
        >
          {/* Animated Icon Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-[#0F2D5C]/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0F2D5C]/30 via-[#0F2D5C]/10 to-[#111827] border border-[#0F2D5C]/40 flex items-center justify-center shadow-2xl text-[#9CA3AF]">
              <Wrench className="w-10 h-10 animate-[spin_12s_linear_infinite]" />
            </div>
          </div>

          {/* Title & Status */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0F2D5C]/20 border border-[#0F2D5C]/40 rounded-full text-xs font-bold text-[#9CA3AF]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{badgeText}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-[#E5E7EB] max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Requirement 8: Mandatory Schedule & Details Card */}
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#111827]/90 border border-[#0F2D5C]/40 shadow-2xl backdrop-blur-md text-left space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#0F2D5C]" />
            
            <div className="flex items-center justify-between border-b border-[#111827] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#9CA3AF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Official Maintenance Schedule & Details
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0F2D5C]/30 border border-[#0F2D5C]/40 text-[#9CA3AF] uppercase">
                {scope} SCOPE
              </span>
            </div>

            {/* Timestamps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-[#111827]/70 border border-[#111827] flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                    Maintenance Started Date & Time
                  </span>
                  <span className="text-xs font-semibold text-white font-mono">
                    {formattedStartDate}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827]/70 border border-[#111827] flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                    Expected Finish Date & Time
                  </span>
                  <span className="text-xs font-semibold text-[#9CA3AF] font-mono">
                    {formattedEndDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Reason for Maintenance */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Reason for Maintenance
              </span>
              <p className="text-xs sm:text-sm text-[#E5E7EB] leading-relaxed whitespace-pre-line bg-[#111827]/50 p-3 rounded-xl border border-[#111827]">
                {maintenanceMessage}
              </p>
            </div>

            {/* Affected Components */}
            <div className="space-y-1.5 pt-1 border-t border-[#111827]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#9CA3AF]" /> Affected System Components:
              </span>
              <div className="flex flex-wrap gap-2">
                {affectedList.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#0F2D5C]/20 border border-[#0F2D5C]/30 text-xs text-[#9CA3AF] font-medium">
                    • {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Security Assurance */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-xl bg-[#111827]/60 border border-[#111827] space-y-2">
              <div className="flex items-center gap-2 text-[#9CA3AF] font-bold text-xs">
                <ZapOff className="w-4 h-4" />
                <span>Strict Access Enforcement</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Automated security locks are active. No transactions or actions can be submitted during this window to preserve data integrity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111827]/60 border border-[#111827] space-y-2">
              <div className="flex items-center gap-2 text-[#9CA3AF] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Wallet Balances Vaulted</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                All existing user funds, ledger histories, and pending operations are 100% encrypted and safe in our vault.
              </p>
            </div>
          </div>

          {/* Status Feedback Banner */}
          {statusFeedback && (
            <div
              className={`max-w-md mx-auto p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                statusFeedback.type === "cleared"
                  ? "bg-[#0F2D5C]/70 border-[#0F2D5C]/40 text-[#9CA3AF]"
                  : "bg-[#111827] border-[#4B5563] text-[#E5E7EB]"
              }`}
            >
              {statusFeedback.type === "cleared" ? (
                <CheckCircle2 className="w-4 h-4 text-[#9CA3AF]" />
              ) : (
                <Clock className="w-4 h-4 text-[#9CA3AF]" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
              <span>{checkingStatus ? "Re-checking Status..." : "Check System Status"}</span>
            </button>

            <button
              onClick={() => {
                if (onAdminLoginRequested) {
                  onAdminLoginRequested();
                } else {
                  setShowAdminModal(true);
                }
              }}
              className="px-5 py-3 bg-[#111827] hover:bg-[#111827] text-[#E5E7EB] border border-[#4B5563] font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#9CA3AF]" />
              <span>Administrator Portal</span>
            </button>
          </div>

          {/* Contact Support Row */}
          <div className="pt-6 border-t border-[#111827]/80 flex flex-wrap items-center justify-center gap-6 text-xs text-[#9CA3AF]">
            <span className="font-semibold text-[#E5E7EB]">Need Urgent Assistance?</span>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-1.5 hover:text-[#9CA3AF] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{supportEmail}</span>
              </a>
            )}
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1.5 hover:text-[#9CA3AF] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{supportPhone}</span>
              </a>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello%20SmartLink%20Support,%20inquiry%20regarding%20maintenance%20mode.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#9CA3AF] font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Support</span>
              </a>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#111827]/80 bg-[#111827]/60 py-4 px-6 text-center text-xs text-[#6B7280] flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <div>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#9CA3AF]">
          <span>STATUS: MAINTENANCE ENFORCED</span>
          <span>•</span>
          <span>NIGERIA DIGITAL INFRASTRUCTURE</span>
        </div>
      </footer>

      {/* Embedded Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-[#4B5563] rounded-2xl p-6 max-w-md w-full shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#111827] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#0F2D5C]/20 text-[#9CA3AF] rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Administrator Access</h3>
                    <p className="text-[11px] text-[#9CA3AF]">Authenticate to bypass maintenance mode</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="text-[#9CA3AF] hover:text-white text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {adminError && (
                <div className="p-3 bg-[#0F2D5C]/80 border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@smartlinkng.com.ng"
                    className="w-full bg-[#111827] border border-[#4B5563] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0F2D5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#111827] border border-[#4B5563] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0F2D5C]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="px-5 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {adminLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In as Admin</span>
                      </>
                    )}
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

export default MaintenanceScreen;
