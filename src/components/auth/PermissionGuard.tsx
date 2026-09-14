/**
 * SmartLink Reusable Permission Guards Components
 * High-security access control wrappers for views and action elements.
 */

import React from "react";
import { UserProfile, UserRole, UserCustomClaims } from "../../types";
import { AuthGuardService } from "../../services/authGuards";
import { ShieldAlert, Mail, Lock } from "lucide-react";

interface BaseGuardProps {
  currentUser: UserProfile | null;
  claims?: UserCustomClaims;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAuth: React.FC<BaseGuardProps> = ({ currentUser, children, fallback }) => {
  if (!currentUser) {
    return (
      fallback || (
        <div className="p-8 text-center bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 rounded-3xl border border-[#E5E7EB] dark:border-[#0F2D5C]/60 my-6">
          <Lock className="h-10 w-10 text-[#0F2D5C] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">Authentication Required</h3>
          <p className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] mt-1 max-w-md mx-auto">
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
}) => {
  if (!currentUser) return null;
  return <>{children}</>;
};

export const RequireAdmin: React.FC<BaseGuardProps> = ({ currentUser, claims, children, fallback }) => {
  const perms = AuthGuardService.evaluatePermissions(currentUser?.role, claims);
  if (!perms.canAccessAdmin) {
    return (
      fallback || (
        <div className="p-8 text-center bg-[#E5E7EB] dark:bg-[#111827] rounded-3xl border border-[#E5E7EB] dark:border-[#111827] my-8">
          <ShieldAlert className="h-12 w-12 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#E5E7EB]">Access Restricted</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-md mx-auto">
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
        <div className="p-8 text-center bg-[#111827] text-white rounded-3xl border border-[#111827] my-8">
          <ShieldAlert className="h-12 w-12 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-lg font-bold">Super Admin Privilege Required</h3>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-md mx-auto">
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
        <div className="p-6 text-center bg-[#E5E7EB] dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#111827]">
          <ShieldAlert className="h-8 w-8 text-[#0F2D5C] mx-auto mb-2" />
          <p className="text-xs font-bold text-[#4B5563] dark:text-[#E5E7EB]">Finance Officer permissions required.</p>
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
        <div className="p-6 text-center bg-[#E5E7EB] dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#111827]">
          <ShieldAlert className="h-8 w-8 text-[#0F2D5C] mx-auto mb-2" />
          <p className="text-xs font-bold text-[#4B5563] dark:text-[#E5E7EB]">Support Agent permissions required.</p>
        </div>
      )
    );
  }
  return <>{children}</>;
};
