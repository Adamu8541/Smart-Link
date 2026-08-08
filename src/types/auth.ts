/**
 * SmartLink Authentication, Authorization & RBAC Types
 */

import { UserRole, SubAdminPermission } from "../types.js";

export interface FirebaseCustomClaims {
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
  claims: FirebaseCustomClaims;
  lastActive: string;
  rememberMe: boolean;
}
