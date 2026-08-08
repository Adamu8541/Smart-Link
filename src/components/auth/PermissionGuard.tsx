/**
 * SmartLink Reusable Permission Guards Components
 * High-security access control wrappers for views and action elements.
 */

import React from "react";
import { UserProfile, UserRole, FirebaseCustomClaims } from "../../types";
import { AuthGuardService } from "../../services/authGuards";
import { ShieldAlert, Mail, Lock } from "lucide-react";

interface BaseGuardProps {
  currentUser: UserProfile | null;
  claims?: FirebaseCustomClaims;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAuth: React.FC<BaseGuardProps> = ({ currentUser, children, fallback }) => {
  if (!currentUser) {
    return (
      fallback || (
        <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 dark:border-rose-900/60 my-6">
          <Lock className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Authentication Required</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto">
            You must be logged into your SmartLink account to access this section.
          </p>
        </div>
      )
    );
  }
  return <>{children}</>;
};

export const RequireVerifiedEmail: React.FC<BaseGuardProps & { onResendEmail?: () => void }> = ({
  currentUser,
  children,
  fallback,
  onResendEmail
}) => {
  if (!currentUser) return null;
  if (!currentUser.isVerified) {
    return (
      fallback || (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 rounded-3xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 my-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">Email Verification Required</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Please verify your email address (<strong>{currentUser.email}</strong>) to access high-security verification services.
              </p>
            </div>
          </div>
          {onResendEmail && (
            <button
              onClick={onResendEmail}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Resend Verification Email
            </button>
          )}
        </div>
      )
    );
  }
  return <>{children}</>;
};

export const RequireAdmin: React.FC<BaseGuardProps> = ({ currentUser, claims, children, fallback }) => {
  const perms = AuthGuardService.evaluatePermissions(currentUser?.role, claims);
  if (!perms.canAccessAdmin) {
    return (
      fallback || (
        <div className="p-8 text-center bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 my-8">
          <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Access Restricted</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            This administrative area requires Admin privileges. Custom Claim or Admin Role assignment required.
          </p>
        </div>
      )
    );
  }
  return <>{children}</>;
};

export const RequireSuperAdmin: React.FC<BaseGuardProps> = ({ currentUser, claims, children, fallback }) => {
  const perms = AuthGuardService.evaluatePermissions(currentUser?.role, claims);
  if (!perms.canAccessSuperAdmin) {
    return (
      fallback || (
        <div className="p-8 text-center bg-slate-900 text-white rounded-3xl border border-slate-800 my-8">
          <ShieldAlert className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Super Admin Privilege Required</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Only designated Super Administrators can perform role updates or system-wide security configurations.
          </p>
        </div>
      )
    );
  }
  return <>{children}</>;
};

export const RequireFinance: React.FC<BaseGuardProps> = ({ currentUser, claims, children, fallback }) => {
  const perms = AuthGuardService.evaluatePermissions(currentUser?.role, claims);
  if (!perms.canAccessFinance) {
    return (
      fallback || (
        <div className="p-6 text-center bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Finance Officer permissions required.</p>
        </div>
      )
    );
  }
  return <>{children}</>;
};

export const RequireSupport: React.FC<BaseGuardProps> = ({ currentUser, claims, children, fallback }) => {
  const perms = AuthGuardService.evaluatePermissions(currentUser?.role, claims);
  if (!perms.canAccessSupport) {
    return (
      fallback || (
        <div className="p-6 text-center bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Agent permissions required.</p>
        </div>
      )
    );
  }
  return <>{children}</>;
};
