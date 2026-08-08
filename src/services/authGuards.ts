/**
 * SmartLink Role-Based Access Control (RBAC) & Permission Guards Engine
 */

import { UserRole, FirebaseCustomClaims, PermissionGuards } from "../types.js";

export class AuthGuardService {
  /**
   * Check if user has specific roles
   */
  static hasRole(userRole?: UserRole, allowedRoles: UserRole[] = []): boolean {
    if (!userRole) return false;
    if (userRole === UserRole.SUPER_ADMIN) return true; // Super Admin overrides
    return allowedRoles.includes(userRole);
  }

  /**
   * Check if user has Firebase Custom Claim
   */
  static hasClaim(claims?: FirebaseCustomClaims, claimName?: keyof FirebaseCustomClaims): boolean {
    if (!claims) return false;
    if (claims.superAdmin === true) return true; // Super Admin claim overrides
    return Boolean(claims[claimName as string]);
  }

  /**
   * Evaluate full permission suite for current user session
   */
  static evaluatePermissions(userRole?: UserRole, claims?: FirebaseCustomClaims): PermissionGuards {
    const isSuper = userRole === UserRole.SUPER_ADMIN || claims?.superAdmin === true;
    const isAdmin = isSuper || userRole === UserRole.ADMIN || userRole === UserRole.SUB_ADMIN || claims?.admin === true;
    const isFinance = isSuper || isAdmin || userRole === UserRole.FINANCE_OFFICER || claims?.finance === true;
    const isSupport = isSuper || isAdmin || userRole === UserRole.SUPPORT_AGENT || userRole === UserRole.STAFF || claims?.support === true;
    const isStaff = isSuper || isAdmin || userRole === UserRole.STAFF || claims?.staff === true;

    return {
      canAccessAdmin: isAdmin,
      canAccessSuperAdmin: isSuper,
      canAccessFinance: isFinance,
      canAccessSupport: isSupport,
      canAccessUsers: isAdmin,
      canAccessServices: isStaff || isAdmin,
      canAccessWallet: true,
      canAccessReports: isFinance || isAdmin,
    };
  }

  /**
   * Password strength validation
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    if (!password || password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter (A-Z).");
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter (a-z).");
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number (0-9).");
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character.");
    } else {
      score += 1;
    }

    // Common weak password patterns check
    const weakPatterns = ["password", "123456", "admin", "smartlink", "qwerty", "letmein"];
    if (weakPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
      errors.push("Password contains common easily guessable words.");
      score = Math.max(0, score - 2);
    }

    return {
      valid: errors.length === 0,
      errors,
      score,
    };
  }
}
