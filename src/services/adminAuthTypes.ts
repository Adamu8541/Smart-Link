/**
 * SmartLink Admin Auth Types and Session Storage Helpers
 * Client-safe definitions (no Node/Firebase imports)
 */

export type AdminRoleType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCE_MANAGER"
  | "SUPPORT_OFFICER"
  | "VERIFICATION_OFFICER"
  | "READ_ONLY_AUDITOR";

export interface AdminRoleDefinition {
  role: AdminRoleType;
  displayName: string;
  description: string;
  permissions: string[];
  colorBadge: string;
}

export const ADMIN_ROLES_CONFIG: Record<AdminRoleType, AdminRoleDefinition> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    displayName: "Super Admin",
    description: "Full system access, role management, security overrides & full administrative control",
    permissions: ["*"],
    colorBadge: "bg-purple-950 text-purple-400 border-purple-800",
  },
  ADMIN: {
    role: "ADMIN",
    displayName: "Admin",
    description: "Manage users, transactions, services, and general platform operations",
    permissions: [
      "VIEW_DASHBOARD",
      "MANAGE_USERS",
      "VIEW_USERS",
      "MANAGE_TRANSACTIONS",
      "VIEW_TRANSACTIONS",
      "MANAGE_SERVICES",
      "MANAGE_SUPPORT",
      "VIEW_REPORTS",
    ],
    colorBadge: "bg-blue-950 text-blue-400 border-blue-800",
  },
  FINANCE_MANAGER: {
    role: "FINANCE_MANAGER",
    displayName: "Finance Manager",
    description: "Financial reconciliations, refund processing, pricing configuration & wallet overrides",
    permissions: ["VIEW_DASHBOARD", "MANAGE_WALLET", "MANAGE_REFUNDS", "VIEW_TRANSACTIONS", "VIEW_REPORTS", "MANAGE_SETTINGS"],
    colorBadge: "bg-emerald-950 text-emerald-400 border-emerald-800",
  },
  SUPPORT_OFFICER: {
    role: "SUPPORT_OFFICER",
    displayName: "Support Officer",
    description: "Manage support tickets, customer communications, notifications & user profile assistance",
    permissions: ["VIEW_DASHBOARD", "MANAGE_SUPPORT", "MANAGE_NOTIFICATIONS", "VIEW_USERS", "VIEW_TRANSACTIONS"],
    colorBadge: "bg-amber-950 text-amber-400 border-amber-800",
  },
  VERIFICATION_OFFICER: {
    role: "VERIFICATION_OFFICER",
    displayName: "Verification Officer",
    description: "Identity verification oversight (NIN/BVN/CAC), API provider monitoring & logs verification",
    permissions: ["VIEW_DASHBOARD", "MANAGE_VERIFICATION", "MANAGE_PROVIDERS", "VIEW_PROVIDERS", "VIEW_TRANSACTIONS"],
    colorBadge: "bg-cyan-950 text-cyan-400 border-cyan-800",
  },
  READ_ONLY_AUDITOR: {
    role: "READ_ONLY_AUDITOR",
    displayName: "Read-Only Auditor",
    description: "View-only access across all administrative modules. Cannot modify, create, or delete data",
    permissions: ["VIEW_DASHBOARD", "VIEW_USERS", "VIEW_TRANSACTIONS", "VIEW_REFUNDS", "VIEW_SETTINGS", "VIEW_PROVIDERS", "VIEW_REPORTS"],
    colorBadge: "bg-slate-900 text-slate-400 border-slate-700",
  },
};

export interface AdminUserDocument {
  uid: string;
  email: string;
  fullName: string;
  role: AdminRoleType;
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  passwordHash?: string;
  salt?: string;
  lastLogin?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  sessionToken: string;
  uid: string;
  email: string;
  fullName: string;
  role: AdminRoleType;
  permissions: string[];
  loginTime: string;
  expiresAt: string;
  lastActive: string;
  status: "ACTIVE" | "EXPIRED" | "LOGGED_OUT";
}

export interface AdminActivityLog {
  id: string;
  logId: string;
  adminUid?: string;
  adminEmail?: string;
  adminRole?: string;
  action:
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "SESSION_EXPIRED"
    | "UNAUTHORIZED_ACCESS_ATTEMPT"
    | "PASSWORD_RESET_REQUEST"
    | "PERMISSION_DENIED";
  route?: string;
  ipAddress?: string;
  details: string;
  status: "SUCCESS" | "FAILURE" | "WARNING";
  timestamp: string;
}

export interface AdminTestResult {
  testName: string;
  status: "PASSED" | "FAILED";
  durationMs: number;
  details: string;
}

export const ADMIN_ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/dashboard": ["VIEW_DASHBOARD"],
  "/admin/users": ["MANAGE_USERS", "VIEW_USERS"],
  "/admin/wallet": ["MANAGE_WALLET", "VIEW_FINANCE"],
  "/admin/services": ["MANAGE_SERVICES", "VIEW_SERVICES"],
  "/admin/providers": ["MANAGE_PROVIDERS", "VIEW_PROVIDERS"],
  "/admin/transactions": ["MANAGE_TRANSACTIONS", "VIEW_TRANSACTIONS"],
  "/admin/refunds": ["MANAGE_REFUNDS", "VIEW_FINANCE"],
  "/admin/reports": ["MANAGE_REPORTS", "VIEW_REPORTS"],
  "/admin/settings": ["MANAGE_SETTINGS", "VIEW_SETTINGS"],
  "/admin/support": ["MANAGE_TICKETS", "VIEW_SUPPORT"],
  "/admin/security": ["MANAGE_SECURITY", "VIEW_AUDIT_LOGS"],
  "/admin/system": ["MANAGE_SYSTEM", "VIEW_AUDIT_LOGS"],
  "/admin/notifications": ["VIEW_DASHBOARD"],
};

export function getStoredAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem("smart_link_admin_session");
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem("smart_link_admin_session");
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

export function saveAdminSession(session: AdminSession): void {
  try {
    sessionStorage.setItem("smart_link_admin_session", JSON.stringify(session));
  } catch (e) {
    console.error("Failed to store admin session", e);
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem("smart_link_admin_session");
  } catch (e) {
    console.error("Failed to clear admin session", e);
  }
}
