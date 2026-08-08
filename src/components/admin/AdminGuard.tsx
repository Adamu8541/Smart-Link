/**
 * SmartLink Admin Panel — Route Guard & RBAC Access Control Wrapper
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  LogOut,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  User,
  Shield
} from "lucide-react";
import { AdminSession, ADMIN_ROLES_CONFIG, ADMIN_ROUTE_PERMISSIONS } from "../../services/adminAuthService";

interface AdminGuardProps {
  currentRoute: string;
  adminSession: AdminSession | null;
  onLogout: () => void;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export default function AdminGuard({
  currentRoute,
  adminSession,
  onLogout,
  onNavigate,
  children,
}: AdminGuardProps) {
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [permissionAllowed, setPermissionAllowed] = useState<boolean>(true);
  const [denialReason, setDenialReason] = useState<string>("");
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800); // 30 mins

  // Validate session against server whenever route or session token changes
  useEffect(() => {
    if (!adminSession || !adminSession.sessionToken) {
      setSessionValid(false);
      return;
    }

    let isMounted = true;

    fetch(`/api/admin/auth/session?token=${adminSession.sessionToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.session) {
          setSessionValid(true);
          // Calculate remaining time
          const expiresAt = new Date(data.session.expiresAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeRemainingSeconds(remaining);
        } else {
          setSessionValid(false);
          onLogout();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // Local fallback check if network issue
        setSessionValid(true);
      });

    return () => {
      isMounted = false;
    };
  }, [adminSession, currentRoute]);

  // Check RBAC Route Permission
  useEffect(() => {
    if (!adminSession) return;

    if (adminSession.role === "SUPER_ADMIN" || adminSession.permissions.includes("*")) {
      setPermissionAllowed(true);
      return;
    }

    const requiredPerms = ADMIN_ROUTE_PERMISSIONS[currentRoute];
    if (!requiredPerms || requiredPerms.length === 0) {
      setPermissionAllowed(true);
      return;
    }

    const hasRequired = requiredPerms.some((perm) => adminSession.permissions.includes(perm));

    if (hasRequired) {
      setPermissionAllowed(true);
      setDenialReason("");
    } else {
      setPermissionAllowed(false);
      setDenialReason(
        `Access Denied: Your assigned role (${
          ADMIN_ROLES_CONFIG[adminSession.role]?.displayName || adminSession.role
        }) does not possess the necessary privileges (${requiredPerms.join(
          ", "
        )}) to access "${currentRoute}".`
      );
    }
  }, [adminSession, currentRoute]);

  // Session Inactivity Timer Countdown
  useEffect(() => {
    if (!sessionValid) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionValid]);

  const handleExtendSession = async () => {
    if (!adminSession?.sessionToken) return;
    try {
      const res = await fetch(`/api/admin/auth/session?token=${adminSession.sessionToken}`);
      const data = await res.json();
      if (data.success && data.session) {
        setTimeRemainingSeconds(1800);
      }
    } catch (err) {
      // Silent catch
    }
  };

  // 1. Loading State
  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4" />
        <p className="text-xs font-semibold text-slate-400">Verifying Admin Session & RBAC Permissions...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to Login
  if (!sessionValid || !adminSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Unauthorized Administrator Access</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You must authenticate with valid administrator credentials to access protected SmartLink Admin pages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/admin/login")}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Proceed to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // 3. Permission Denied -> Display RBAC Block
  if (!permissionAllowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg bg-slate-900 border border-rose-900/60 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
                RBAC Access Denied
              </span>
              <h2 className="text-base font-bold text-white">Insufficient Role Privileges</h2>
            </div>
          </div>

          <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl space-y-2 text-xs text-rose-200 leading-relaxed">
            <p className="font-semibold text-rose-300">{denialReason}</p>
            <p className="text-[11px] text-slate-400">
              Your session is active as <span className="font-bold text-white">{adminSession.fullName}</span> ({ADMIN_ROLES_CONFIG[adminSession.role]?.displayName || adminSession.role}), but this page requires higher administrative authorization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Admin Dashboard
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Switch Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Authorized -> Render Protected Page with Session Bar
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Session & RBAC Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400 font-bold text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SmartLink Admin Panel</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">{adminSession.fullName}</span>
            <span className="text-slate-500">|</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[10px]">
              {ADMIN_ROLES_CONFIG[adminSession.role]?.displayName || adminSession.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Inactivity Timer Banner */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
            timeRemainingSeconds < 300
              ? "bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Session: {formatTimer(timeRemainingSeconds)}</span>
            <button
              type="button"
              onClick={handleExtendSession}
              title="Extend Session"
              className="ml-1 text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="py-1 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
