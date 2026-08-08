/**
 * SmartLink Fintech Centralized Notification Engine & Activity Logger
 * Phase 1 Part 7 Centralized Architecture
 */

import {
  NotificationDocument,
  NotificationType,
  ActivityLogDocument,
  AdminActivityLogDocument,
  NotificationSettingsDocument
} from "../types/database.js";

export interface DispatchNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  category?: "TRANSACTION" | "VERIFICATION" | "SECURITY" | "SYSTEM" | "ACCOUNT";
  reference?: string;
  actionUrl?: string;
  status?: "SUCCESS" | "FAILED" | "PENDING" | "WARNING";
  activityDescription?: string;
  metadata?: Record<string, any>;
  adminActionParams?: {
    adminUid: string;
    adminEmail: string;
    action: string;
    details: string;
    targetUserId?: string;
  };
}

export interface NotificationFilterParams {
  userId: string;
  read?: boolean;
  type?: string;
  category?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ActivityLogFilterParams {
  userId?: string;
  activityType?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const NotificationEngine = {
  /**
   * Central Dispatcher: Sends notification, logs activity, updates user history, and records admin audit if needed.
   */
  async dispatch(params: DispatchNotificationParams): Promise<{
    success: boolean;
    notificationId?: string;
    activityId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to dispatch notification and activity log."
        };
      }

      return {
        success: true,
        notificationId: data.notificationId,
        activityId: data.activityId
      };
    } catch (err: any) {
      console.error("Error in NotificationEngine.dispatch:", err);
      return {
        success: false,
        error: err.message || "Network error while dispatching notification."
      };
    }
  },

  /**
   * Fetch paginated notifications with filters
   */
  async getNotifications(params: NotificationFilterParams): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const qp = new URLSearchParams();
      qp.append("userId", params.userId);
      if (params.read !== undefined) qp.append("read", params.read.toString());
      if (params.type) qp.append("type", params.type);
      if (params.category) qp.append("category", params.category);
      if (params.searchQuery) qp.append("searchQuery", params.searchQuery);
      if (params.startDate) qp.append("startDate", params.startDate);
      if (params.endDate) qp.append("endDate", params.endDate);
      if (params.page) qp.append("page", params.page.toString());
      if (params.pageSize) qp.append("pageSize", params.pageSize.toString());

      const res = await fetch(`/api/notifications?${qp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return await res.json();
    } catch (err) {
      console.error("Error fetching notifications:", err);
      return { notifications: [], total: 0, unreadCount: 0, page: 1, pageSize: 20 };
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      return res.ok;
    } catch (err) {
      console.error("Error marking notification read:", err);
      return false;
    }
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      return res.ok;
    } catch (err) {
      console.error("Error marking all read:", err);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      return res.ok;
    } catch (err) {
      console.error("Error deleting notification:", err);
      return false;
    }
  },

  /**
   * Fetch notification preferences
   */
  async getSettings(userId: string): Promise<NotificationSettingsDocument> {
    try {
      const res = await fetch(`/api/notifications/settings/${userId}`);
      if (!res.ok) throw new Error("Settings not found");
      const data = await res.json();
      return data.settings;
    } catch (err) {
      // Default fallback preferences
      return {
        id: `NS_${userId}`,
        userId,
        inAppNotifications: true,
        emailNotifications: true,
        securityAlerts: true,
        marketingMessages: false,
        systemAnnouncements: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },

  /**
   * Save notification preferences
   */
  async updateSettings(
    userId: string,
    settings: Partial<NotificationSettingsDocument>
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/settings/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      return res.ok;
    } catch (err) {
      console.error("Error updating notification settings:", err);
      return false;
    }
  },

  /**
   * Fetch Activity Logs for a user
   */
  async getActivityLogs(params: ActivityLogFilterParams): Promise<{
    logs: ActivityLogDocument[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const qp = new URLSearchParams();
      if (params.userId) qp.append("userId", params.userId);
      if (params.activityType) qp.append("activityType", params.activityType);
      if (params.searchQuery) qp.append("searchQuery", params.searchQuery);
      if (params.startDate) qp.append("startDate", params.startDate);
      if (params.endDate) qp.append("endDate", params.endDate);
      if (params.page) qp.append("page", params.page.toString());
      if (params.pageSize) qp.append("pageSize", params.pageSize.toString());

      const res = await fetch(`/api/activity-logs?${qp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return await res.json();
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      return { logs: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  /**
   * Fetch Admin Activity Logs (Restricted to Admins)
   */
  async getAdminActivityLogs(adminUid: string, page = 1, pageSize = 20): Promise<{
    logs: AdminActivityLogDocument[];
    total: number;
  }> {
    try {
      const res = await fetch(`/api/admin/activity-logs?adminUid=${adminUid}&page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to fetch admin activity logs");
      return await res.json();
    } catch (err) {
      console.error("Error fetching admin logs:", err);
      return { logs: [], total: 0 };
    }
  },

  /**
   * Get Consolidated User History (Wallet, Verifications, Transactions, Notifications, Logins)
   */
  async getUserHistory(userId: string): Promise<{
    walletLogs: any[];
    verifications: any[];
    transactions: any[];
    notifications: any[];
    logins: any[];
    activityLogs: any[];
  }> {
    try {
      const res = await fetch(`/api/user-history/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user history");
      return await res.json();
    } catch (err) {
      console.error("Error fetching user history:", err);
      return {
        walletLogs: [],
        verifications: [],
        transactions: [],
        notifications: [],
        logins: [],
        activityLogs: []
      };
    }
  }
};
