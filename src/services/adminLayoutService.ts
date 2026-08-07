/**
 * SmartLink Admin Panel — Layout & Navigation Service (Module 2)
 */

import {
  AdminNotification,
  AdminAnnouncement,
  AdminPreferences,
  AdminBreadcrumb,
  AdminGlobalSearchItem,
} from "../types/adminLayoutTypes";

class AdminLayoutService {
  private static instance: AdminLayoutService;

  private mockNotifications: AdminNotification[] = [];

  private mockAnnouncements: AdminAnnouncement[] = [];

  private preferences: AdminPreferences = {
    theme: "dark",
    sidebarCollapsed: false,
    compactMode: false,
    notifyOnAlerts: true,
  };

  private constructor() {
    this.loadPreferencesFromStorage();
  }

  public static getInstance(): AdminLayoutService {
    if (!AdminLayoutService.instance) {
      AdminLayoutService.instance = new AdminLayoutService();
    }
    return AdminLayoutService.instance;
  }

  private loadPreferencesFromStorage() {
    try {
      const stored = localStorage.getItem("smart_link_admin_prefs");
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch {
      // fallback to default
    }
  }

  public getPreferences(): AdminPreferences {
    return { ...this.preferences };
  }

  public savePreferences(newPrefs: Partial<AdminPreferences>): AdminPreferences {
    this.preferences = { ...this.preferences, ...newPrefs };
    try {
      localStorage.setItem("smart_link_admin_prefs", JSON.stringify(this.preferences));
    } catch {
      // ignore
    }
    return { ...this.preferences };
  }

  public getNotifications(): AdminNotification[] {
    return [...this.mockNotifications];
  }

  public markNotificationRead(id: string): AdminNotification[] {
    this.mockNotifications = this.mockNotifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    return [...this.mockNotifications];
  }

  public markAllNotificationsRead(): AdminNotification[] {
    this.mockNotifications = this.mockNotifications.map((n) => ({ ...n, read: true }));
    return [...this.mockNotifications];
  }

  public getAnnouncements(): AdminAnnouncement[] {
    return [...this.mockAnnouncements];
  }

  /**
   * Breadcrumbs Generation Strategy
   */
  public getBreadcrumbs(currentRoute: string): AdminBreadcrumb[] {
    const routeMap: Record<string, { label: string; categoryLabel: string }> = {
      "/admin/dashboard": { label: "Overview Dashboard", categoryLabel: "Core & Overview" },
      "/admin/users": { label: "User Directory & Status", categoryLabel: "User Governance" },
      "/admin/wallet": { label: "Wallet Management & Funding", categoryLabel: "User Governance" },
      "/admin/services": { label: "Verification & VTU Services", categoryLabel: "Services & Products" },
      "/admin/providers": { label: "API Gateway Providers", categoryLabel: "Services & Products" },
      "/admin/transactions": { label: "Transaction Ledger & Audits", categoryLabel: "Finance & Accounting" },
      "/admin/refunds": { label: "Refund Processing Portal", categoryLabel: "Finance & Accounting" },
      "/admin/reports": { label: "Financial Settlement Reports", categoryLabel: "Finance & Accounting" },
      "/admin/support": { label: "Customer Support Tickets", categoryLabel: "Operations & Support" },
      "/admin/notifications": { label: "Admin Alerts & Notifications", categoryLabel: "Operations & Support" },
      "/admin/security": { label: "Audit Logs & Security", categoryLabel: "Operations & Support" },
      "/admin/settings": { label: "System Platform Settings", categoryLabel: "System Admin" },
      "/admin/system": { label: "System Logs & Health", categoryLabel: "System Admin" },
    };

    const target = routeMap[currentRoute] || { label: "Admin Page", categoryLabel: "Admin Panel" };

    if (currentRoute === "/admin/dashboard") {
      return [
        { label: "Admin Panel", path: "/admin/dashboard", isCurrentPage: false },
        { label: "Dashboard", path: "/admin/dashboard", isCurrentPage: true },
      ];
    }

    return [
      { label: "Admin Panel", path: "/admin/dashboard", isCurrentPage: false },
      { label: target.categoryLabel, path: "/admin/dashboard", isCurrentPage: false },
      { label: target.label, path: currentRoute, isCurrentPage: true },
    ];
  }

  /**
   * Global Search Engine
   */
  public searchAdminData(query: string): AdminGlobalSearchItem[] {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const results: AdminGlobalSearchItem[] = [];

    // Mock match candidates
    const mockUsers = [
      { uid: "USR_101", email: "adamuamuhammad8541@gmail.com", name: "Adamu Muhammad", role: "Super Admin" },
    ];

    const mockTransactions: any[] = [];

    const mockProviders = [
      { name: "Monnify Payment Gateway", code: "MONNIFY", type: "Wallet Auto-Funding" },
      { name: "OPay Direct Transfer", code: "OPAY", type: "Collection API" },
      { name: "Paystack Gateway", code: "PAYSTACK", type: "Card & Transfer API" },
      { name: "Flutterwave Gateway", code: "FLUTTERWAVE", type: "Card & Mobile Money" },
    ];

    mockUsers.forEach((u) => {
      if (u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q)) {
        results.push({
          id: u.uid,
          type: "USER",
          title: u.name,
          subtitle: `${u.email} • Role: ${u.role}`,
          path: "/admin/users",
          status: "ACTIVE",
        });
      }
    });

    mockTransactions.forEach((t) => {
      if (t.id.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.user.toLowerCase().includes(q)) {
        results.push({
          id: t.id,
          type: "TRANSACTION",
          title: `${t.id} — ${t.type}`,
          subtitle: `Amount: ${t.amount} • Account: ${t.user}`,
          path: "/admin/transactions",
          status: t.status,
        });
      }
    });

    mockProviders.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) {
        results.push({
          id: p.code,
          type: "PROVIDER",
          title: p.name,
          subtitle: `Provider Code: ${p.code} • Service: ${p.type}`,
          path: "/admin/providers",
          status: "OPERATIONAL",
        });
      }
    });

    return results;
  }
}

export const adminLayoutService = AdminLayoutService.getInstance();
