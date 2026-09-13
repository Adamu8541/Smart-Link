/**
 * SmartLink Authentication, Authorization & RBAC Types
 */

import { UserRole, SubAdminPermission } from "../types";

export interface UserCustomClaims {
  superAdmin?: boolean;
  admin?: boolean;
  staff?: boolean;
  support?: boolean;
  finance?: boolean;
  role?: UserRole;
  [key: string]: any;
}

export interface LoginHistoryRecord {
  id: string;
  userId: string;
  email: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  browser: string;
  os: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  failureReason?: string;
}

export interface PermissionGuards {
  canAccessAdmin: boolean;
  canAccessSuperAdmin: boolean;
  canAccessFinance: boolean;
  canAccessSupport: boolean;
  canAccessUsers: boolean;
  canAccessServices: boolean;
  canAccessWallet: boolean;
  canAccessReports: boolean;
}

export interface AuthSession {
  uid: string;
  email: string;
  emailVerified: boolean;
  claims: UserCustomClaims;
  lastActive: string;
  rememberMe: boolean;
  provider?: "supabase" | "local" | "turso";
  accessToken?: string;
}

export interface SupabaseAuthUserMetadata {
  fullName?: string;
  phoneNumber?: string;
  referralCode?: string;
  role?: UserRole;
  [key: string]: any;
}

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  isVerified: boolean;
  authProvider: "supabase" | "local" | "turso" | null;
}

export type SensitiveActionPurpose =
  | "CHANGE_PASSWORD"
  | "CHANGE_EMAIL"
  | "CHANGE_PHONE"
  | "CHANGE_PIN"
  | "TOGGLE_PIN_REQUIREMENT"
  | "CHANGE_SECURITY_SETTINGS"
  | "CHANGE_ACCOUNT_INFO"
  | "CHANGE_USER_PRIVILEGES"
  | "CRITICAL_ADMIN_OPERATION";

export interface OtpRequestPayload {
  purpose: SensitiveActionPurpose;
  targetValue?: string; // New email or phone if applicable
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  emailMasked?: string;
  resendCooldownSeconds: number;
  expiresInSeconds: number;
  error?: string;
}

export interface OtpVerifyAndChangePayload {
  purpose: SensitiveActionPurpose;
  otp: string;
  payload: {
    newPassword?: string;
    newEmail?: string;
    newPhoneNumber?: string;
    newPin?: string;
    pinRequiredForTransactions?: boolean;
    fullName?: string;
    securitySettings?: Record<string, any>;
  };
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  user?: any;
  highRiskTicket?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface StepUpVerifyPayload {
  purpose: SensitiveActionPurpose;
  otp?: string;
  password?: string;
  targetValue?: string;
}

export interface StepUpVerifyResponse {
  success: boolean;
  message: string;
  highRiskTicket?: string;
  expiresInSeconds?: number;
  error?: string;
}

