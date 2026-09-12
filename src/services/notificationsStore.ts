import { readDB, writeDB } from "../../server/db";

export interface NotificationDoc {
  id: string;
  notificationId?: string;
  userId?: string;
  userEmail?: string;
  targetEmail?: string | null;
  targetAudience?: string;
  title: string;
  message?: string;
  body?: string;
  category?: string;
  type?: string;
  channel?: "In-App" | "Push" | "SMS" | "Email" | string;
  channels?: string[];
  priority?: "Normal" | "High" | "Critical" | string;
  status?: "Sent" | "Scheduled" | "Draft" | "Failed" | "Cancelled" | string;
  read?: boolean;
  isRead?: boolean;
  readAt?: string;
  sentAt?: string;
  scheduledFor?: string;
  scheduledSendTime?: string | null;
  expiryDate?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredCount?: number;
  readCount?: number;
  failedCount?: number;
  reference?: string;
  amount?: number;
  service?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface NotificationHistoryDoc {
  id: string;
  notificationId?: string;
  title: string;
  category?: string;
  channel?: string;
  type?: string;
  sender?: string;
  audience?: string;
  deliveryChannels?: string[];
  deliveryStatus?: string;
  readCount?: number;
  failedCount?: number;
  recipientCount?: number;
  recipientsCount?: number;
  status?: string;
  sentDate?: string;
  sentAt?: string;
  sentBy?: string;
  [key: string]: any;
}

export async function getNotifications(filters?: {
  userId?: string;
  userEmail?: string;
  status?: string;
  category?: string;
  type?: string;
  read?: boolean;
  priority?: string;
  searchQuery?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ notifications: NotificationDoc[]; total: number; unreadCount: number }> {
  try {
    const localDb = readDB();
    let rawList: any[] = Array.isArray(localDb?.notifications) ? localDb.notifications : [];
    
    let list: NotificationDoc[] = rawList.map((item: any) => ({
      ...item,
      id: item.id || item.notificationId,
      notificationId: item.notificationId || item.id,
      message: item.message || item.body || "",
      body: item.body || item.message || "",
      read: item.read !== undefined ? item.read : (item.isRead !== undefined ? item.isRead : false),
      isRead: item.isRead !== undefined ? item.isRead : (item.read !== undefined ? item.read : false),
    }));

    if (filters?.userId) {
      list = list.filter((n) => n.userId === filters.userId);
    } else if (filters?.userEmail) {
      list = list.filter((n) => n.userEmail === filters.userEmail || n.targetEmail === filters.userEmail);
    }

    if (filters?.category) {
      list = list.filter((n) => n.category === filters.category);
    }
    if (filters?.type) {
      list = list.filter((n) => n.type === filters.type);
    }
    if (filters?.status) {
      list = list.filter((n) => n.status === filters.status);
    }
    if (filters?.read !== undefined) {
      list = list.filter((n) => n.read === filters.read);
    }
    if (filters?.priority) {
      list = list.filter((n) => n.priority === filters.priority);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          (n.body && n.body.toLowerCase().includes(q)) ||
          (n.reference && n.reference.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => ((b.createdAt || "") > (a.createdAt || "") ? 1 : -1));

    const unreadCount = list.filter((n) => !n.read).length;
    const total = list.length;

    if (filters?.page && filters?.pageSize) {
      const start = (filters.page - 1) * filters.pageSize;
      list = list.slice(start, start + filters.pageSize);
    } else if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }

    return { notifications: list, total, unreadCount };
  } catch (err) {
    console.error("[notificationsStore] getNotifications error:", err);
    return { notifications: [], total: 0, unreadCount: 0 };
  }
}

export async function getAllNotifications(filters?: {
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
  limit?: number;
}): Promise<NotificationDoc[]> {
  try {
    const res = await getNotifications({
      category: filters?.category !== "ALL" ? filters?.category : undefined,
      priority: filters?.priority !== "ALL" ? filters?.priority : undefined,
      status: filters?.status !== "ALL" ? filters?.status : undefined,
      searchQuery: filters?.search,
      limit: filters?.limit || 200,
    });
    return res.notifications;
  } catch (err) {
    console.error("[notificationsStore] getAllNotifications error:", err);
    return [];
  }
}

export async function getNotificationById(id: string): Promise<NotificationDoc | null> {
  if (!id) return null;
  try {
    const localDb = readDB();
    const list = Array.isArray(localDb?.notifications) ? localDb.notifications : [];
    const found = list.find((n: any) => n.id === id || n.notificationId === id);
    if (found) {
      return {
        ...found,
        id: found.id || found.notificationId,
        notificationId: found.notificationId || found.id,
        message: found.message || found.body || "",
        body: found.body || found.message || "",
        read: found.read !== undefined ? found.read : (found.isRead !== undefined ? found.isRead : false),
        isRead: found.isRead !== undefined ? found.isRead : (found.read !== undefined ? found.read : false),
      };
    }
  } catch (err) {
    console.error("[notificationsStore] getNotificationById error:", err);
  }
  return null;
}

export async function createNotification(notif: Partial<NotificationDoc>): Promise<NotificationDoc> {
  const docId = notif.id || notif.notificationId || `NTF_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();
  const clean: NotificationDoc = {
    ...notif,
    id: docId,
    notificationId: notif.notificationId || docId,
    title: notif.title || "Notification",
    message: notif.message || notif.body || "",
    body: notif.body || notif.message || "",
    read: notif.read !== undefined ? notif.read : (notif.isRead !== undefined ? notif.isRead : false),
    isRead: notif.isRead !== undefined ? notif.isRead : (notif.read !== undefined ? notif.read : false),
    status: notif.status || "Sent",
    createdAt: notif.createdAt || now,
    updatedAt: now,
  };
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.notifications)) {
      localDb.notifications = [];
    }
    const idx = localDb.notifications.findIndex((n: any) => n.id === docId || n.notificationId === docId);
    if (idx >= 0) {
      localDb.notifications[idx] = clean;
    } else {
      localDb.notifications.unshift(clean);
    }
    writeDB(localDb);
  } catch (err) {
    console.error("[notificationsStore] createNotification error:", err);
  }
  return clean;
}

export async function updateNotification(id: string, updates: Partial<NotificationDoc>): Promise<NotificationDoc | null> {
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.notifications)) return null;

    const idx = localDb.notifications.findIndex((n: any) => n.id === id || n.notificationId === id);
    if (idx < 0) return null;

    const merged = { ...localDb.notifications[idx], ...updates, updatedAt: new Date().toISOString() };
    localDb.notifications[idx] = merged;
    writeDB(localDb);
    return merged;
  } catch (err) {
    console.error("[notificationsStore] updateNotification error:", err);
    return null;
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.notifications)) return false;

    localDb.notifications = localDb.notifications.filter((n: any) => n.id !== id && n.notificationId !== id);
    writeDB(localDb);
    return true;
  } catch (err) {
    console.error("[notificationsStore] deleteNotification error:", err);
    return false;
  }
}

export async function markNotificationAsRead(id: string, userId?: string): Promise<boolean> {
  const existing = await getNotificationById(id);
  if (!existing) return false;
  return (await updateNotification(existing.id, { read: true, isRead: true, readAt: new Date().toISOString() })) !== null;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const result = await getNotifications({ userId });
    for (const n of result.notifications) {
      if (!n.read) {
        await updateNotification(n.id, { read: true, isRead: true, readAt: new Date().toISOString() });
      }
    }
    return true;
  } catch (err) {
    console.error("[notificationsStore] markAllNotificationsAsRead error:", err);
    return false;
  }
}

export async function getNotificationHistory(limit: number = 50): Promise<NotificationHistoryDoc[]> {
  try {
    const localDb = readDB();
    let list: NotificationHistoryDoc[] = Array.isArray(localDb?.notificationHistory) ? localDb.notificationHistory : [];
    list.sort((a, b) => ((b.sentDate || b.sentAt || "") > (a.sentDate || a.sentAt || "") ? 1 : -1));
    return list.slice(0, limit);
  } catch (err) {
    console.error("[notificationsStore] getNotificationHistory error:", err);
    return [];
  }
}

export async function addNotificationHistory(record: NotificationHistoryDoc): Promise<NotificationHistoryDoc> {
  const docId = record.id || `HIST_${Date.now()}`;
  const clean: NotificationHistoryDoc = {
    ...record,
    id: docId,
    sentAt: record.sentAt || record.sentDate || new Date().toISOString(),
  };
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.notificationHistory)) {
      localDb.notificationHistory = [];
    }
    localDb.notificationHistory.unshift(clean);
    writeDB(localDb);
  } catch (err) {
    console.error("[notificationsStore] addNotificationHistory error:", err);
  }
  return clean;
}

export async function seedNotificationsIfEmpty(
  initialNotifs?: NotificationDoc[],
  initialHistory?: NotificationHistoryDoc[]
): Promise<void> {
  try {
    const localDb = readDB();
    if (!localDb.notifications || localDb.notifications.length === 0) {
      if (initialNotifs && initialNotifs.length > 0) {
        for (const n of initialNotifs) await createNotification(n);
      }
      if (initialHistory && initialHistory.length > 0) {
        for (const h of initialHistory) await addNotificationHistory(h);
      }
    }
  } catch (err) {
    console.error("[notificationsStore] seedNotificationsIfEmpty error:", err);
  }
}

export async function getUserNotifications(userEmail: string): Promise<NotificationDoc[]> {
  try {
    const list = await getAllNotifications({ limit: 100 });
    return list.filter(
      (n) =>
        n.status === "Sent" &&
        (!n.targetEmail || n.targetEmail === userEmail || n.userEmail === userEmail)
    );
  } catch (err) {
    console.error("[notificationsStore] getUserNotifications error:", err);
    return [];
  }
}

export async function markAsRead(id: string): Promise<boolean> {
  return markNotificationAsRead(id);
}

export async function markAllAsRead(userEmail: string): Promise<boolean> {
  return markAllNotificationsAsRead(userEmail);
}

export async function sendAppNotification(db: any, notif: Partial<NotificationDoc>): Promise<NotificationDoc> {
  const created = await createNotification(notif);
  if (db) {
    if (!db.notifications) db.notifications = [];
    const idx = db.notifications.findIndex((n: any) => (n.id && n.id === created.id) || (n.notificationId && n.notificationId === created.id));
    if (idx >= 0) {
      db.notifications[idx] = created;
    } else {
      db.notifications.unshift(created);
    }
  }
  return created;
}

export const notificationsStore = {
  getNotifications,
  getAllNotifications,
  getNotificationById,
  getUserNotifications,
  createNotification,
  sendAppNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markAsRead,
  markAllAsRead,
  getNotificationHistory,
  addNotificationHistory,
  seedNotificationsIfEmpty,
};

export default notificationsStore;
