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
  public searchAdminData(query: string, dataSources?: { users?: any[]; transactions?: any[]; providers?: any[] }): AdminGlobalSearchItem[] {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const results: AdminGlobalSearchItem[] = [];

    const users = dataSources?.users || [];
    const transactions = dataSources?.transactions || [];
    const providers = dataSources?.providers || [];

    users.forEach((u: any) => {
      const email = u.email || "";
      const name = u.fullName || u.name || "";
      const uid = u.uid || u.id || "";
      if (email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || uid.toLowerCase().includes(q)) {
        results.push({
          id: uid,
          type: "USER",
          title: name || email,
          subtitle: `${email} • Role: ${u.role || "User"}`,
          path: "/admin/users",
          status: u.status || "ACTIVE",
        });
      }
    });

    transactions.forEach((t: any) => {
      const id = t.id || t.reference || "";
      const type = t.type || t.serviceName || "Transaction";
      const user = t.userEmail || t.userId || "";
      if (id.toLowerCase().includes(q) || type.toLowerCase().includes(q) || user.toLowerCase().includes(q)) {
        results.push({
          id,
          type: "TRANSACTION",
          title: `${id} — ${type}`,
          subtitle: `Amount: ₦${t.amount || 0} • ${user}`,
          path: "/admin/transactions",
          status: t.status || "SUCCESSFUL",
        });
      }
    });

    providers.forEach((p: any) => {
      const name = p.name || p.providerName || "";
      const code = p.code || p.id || "";
      if (name.toLowerCase().includes(q) || code.toLowerCase().includes(q)) {
        results.push({
          id: code,
          type: "PROVIDER",
          title: name,
          subtitle: `Provider Code: ${code} • Service: ${p.category || "API Provider"}`,
          path: "/admin/providers",
          status: p.status || "OPERATIONAL",
        });
      }
    });

    return results;
  }
}

export const adminLayoutService = AdminLayoutService.getInstance();
