/**
 * SmartLink Admin Panel — Layout & Navigation Types (Module 2)
 */

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  iconName: string; // Lucide icon name string for dynamic rendering
  category: "OVERVIEW" | "GOVERNANCE" | "SERVICES" | "FINANCE" | "OPERATIONS" | "SYSTEM";
  requiredPermissions: string[];
  badgeCount?: number;
  badgeColor?: string;
  description?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  category: "SECURITY" | "FINANCE" | "SYSTEM" | "SUPPORT" | "VERIFICATION";
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  date: string;
  author: string;
  active: boolean;
}

export interface AdminBreadcrumb {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

export interface AdminPreferences {
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  compactMode: boolean;
  notifyOnAlerts: boolean;
}

export interface AdminGlobalSearchItem {
  id: string;
  type: "USER" | "TRANSACTION" | "WALLET" | "VERIFICATION" | "SERVICE" | "REPORT" | "PROVIDER";
  title: string;
  subtitle: string;
  path: string;
  status?: string;
  timestamp?: string;
}
