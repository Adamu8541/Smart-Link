import { getAdminFirestore } from "./firebaseAdmin";

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

const NOTIFICATIONS_COLL = "notifications";
const HISTORY_COLL = "notification_history";

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
    const db = getAdminFirestore();
    let query: any = db.collection(NOTIFICATIONS_COLL);

    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    } else if (filters?.userEmail) {
      query = query.where("userEmail", "==", filters.userEmail);
    }

    const snapshot = await query.get();
    let list: NotificationDoc[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      list.push({
        ...data,
        id: doc.id,
        notificationId: data.notificationId || doc.id,
        message: data.message || data.body || "",
        body: data.body || data.message || "",
        read: data.read !== undefined ? data.read : (data.isRead !== undefined ? data.isRead : false),
        isRead: data.isRead !== undefined ? data.isRead : (data.read !== undefined ? data.read : false),
      } as NotificationDoc);
    });

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

    // Sort newest first
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
    const db = getAdminFirestore();
    const limitNum = typeof filters === "number" ? filters : filters?.limit || 200;
    const snapshot = await db.collection(NOTIFICATIONS_COLL).limit(limitNum).get();
    let list: NotificationDoc[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      list.push({
        ...data,
        id: doc.id,
        notificationId: data.notificationId || doc.id,
        message: data.message || data.body || "",
        body: data.body || data.message || "",
        read: data.read !== undefined ? data.read : (data.isRead !== undefined ? data.isRead : false),
        isRead: data.isRead !== undefined ? data.isRead : (data.read !== undefined ? data.read : false),
      } as NotificationDoc);
    });

    if (typeof filters === "object") {
      if (filters.category && filters.category !== "ALL") list = list.filter((n) => n.category === filters.category);
      if (filters.priority && filters.priority !== "ALL") list = list.filter((n) => n.priority === filters.priority);
      if (filters.status && filters.status !== "ALL") list = list.filter((n) => n.status === filters.status);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (n) =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.message && n.message.toLowerCase().includes(q)) ||
            (n.body && n.body.toLowerCase().includes(q)) ||
            (n.createdBy && n.createdBy.toLowerCase().includes(q))
        );
      }
    }

    list.sort((a, b) => ((b.createdAt || "") > (a.createdAt || "") ? 1 : -1));
    return list;
  } catch (err) {
    console.error("[notificationsStore] getAllNotifications error:", err);
    return [];
  }
}

export async function getNotificationById(id: string): Promise<NotificationDoc | null> {
  if (!id) return null;
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(NOTIFICATIONS_COLL).doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        notificationId: data?.notificationId || docSnap.id,
        message: data?.message || data?.body || "",
        body: data?.body || data?.message || "",
        read: data?.read !== undefined ? data.read : (data?.isRead !== undefined ? data.isRead : false),
        isRead: data?.isRead !== undefined ? data.isRead : (data?.read !== undefined ? data.read : false),
      } as NotificationDoc;
    }

    // Try query by notificationId
    const querySnap = await db.collection(NOTIFICATIONS_COLL).where("notificationId", "==", id).limit(1).get();
    if (!querySnap.empty) {
      const foundDoc = querySnap.docs[0];
      const data = foundDoc.data();
      return {
        ...data,
        id: foundDoc.id,
        notificationId: data.notificationId || foundDoc.id,
        message: data.message || data.body || "",
        body: data.body || data.message || "",
        read: data.read !== undefined ? data.read : (data.isRead !== undefined ? data.isRead : false),
        isRead: data.isRead !== undefined ? data.isRead : (data.read !== undefined ? data.read : false),
      } as NotificationDoc;
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
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(clean));
    await db.collection(NOTIFICATIONS_COLL).doc(docId).set(sanitized, { merge: true });
  } catch (err) {
    console.error("[notificationsStore] createNotification error:", err);
  }
  return clean;
}

export async function updateNotification(id: string, updates: Partial<NotificationDoc>): Promise<NotificationDoc | null> {
  try {
    const db = getAdminFirestore();
    const existing = await getNotificationById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const sanitized = JSON.parse(JSON.stringify(merged));
    await db.collection(NOTIFICATIONS_COLL).doc(existing.id).set(sanitized, { merge: true });
    return merged;
  } catch (err) {
    console.error("[notificationsStore] updateNotification error:", err);
    return null;
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const existing = await getNotificationById(id);
    if (!existing) return false;

    await db.collection(NOTIFICATIONS_COLL).doc(existing.id).delete();
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
    const db = getAdminFirestore();
    const snapshot = await db.collection(HISTORY_COLL).limit(limit).get();
    const list: NotificationHistoryDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as NotificationHistoryDoc);
    });
    list.sort((a, b) => ((b.sentDate || b.sentAt || "") > (a.sentDate || a.sentAt || "") ? 1 : -1));
    return list;
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
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(clean));
    await db.collection(HISTORY_COLL).doc(docId).set(sanitized, { merge: true });
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
    const db = getAdminFirestore();
    const snap = await db.collection(NOTIFICATIONS_COLL).limit(1).get();
    if (snap.empty) {
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
