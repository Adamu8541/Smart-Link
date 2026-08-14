import { getAdminFirestore } from "./firebaseAdmin";

export interface NotificationDoc {
  id: string;
  userId?: string;
  userEmail?: string;
  title: string;
  message: string;
  category?: string;
  type?: string;
  channel?: "In-App" | "Push" | "SMS" | "Email";
  priority?: "Normal" | "High" | "Critical";
  status?: "Sent" | "Scheduled" | "Draft" | "Failed" | "Cancelled";
  read?: boolean;
  readAt?: string;
  sentAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredCount?: number;
  readCount?: number;
  failedCount?: number;
  targetAudience?: string;
  [key: string]: any;
}

export interface NotificationHistoryDoc {
  id: string;
  notificationId?: string;
  title: string;
  category?: string;
  channel?: string;
  recipientsCount?: number;
  status?: string;
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
  priority?: string;
  limit?: number;
}): Promise<NotificationDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(NOTIFICATIONS_COLL);

    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    }
    if (filters?.userEmail) {
      query = query.where("userEmail", "==", filters.userEmail);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.category) {
      query = query.where("category", "==", filters.category);
    }
    if (filters?.priority) {
      query = query.where("priority", "==", filters.priority);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const list: NotificationDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as NotificationDoc);
    });

    // Sort newest first
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return list;
  } catch (err) {
    console.error("[notificationsStore] getNotifications error:", err);
    return [];
  }
}

export async function getAllNotifications(filters?: {
  category?: string;
  priority?: string;
  status?: string;
  limit?: number;
}): Promise<NotificationDoc[]> {
  try {
    const db = getAdminFirestore();
    const limitNum = typeof filters === "number" ? filters : filters?.limit || 100;
    const snapshot = await db.collection(NOTIFICATIONS_COLL).limit(limitNum).get();
    let list: NotificationDoc[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() } as NotificationDoc);
    });

    if (typeof filters === "object") {
      if (filters.category) list = list.filter((n) => n.category === filters.category);
      if (filters.priority) list = list.filter((n) => n.priority === filters.priority);
      if (filters.status) list = list.filter((n) => n.status === filters.status);
    }

    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
      return { id: docSnap.id, ...docSnap.data() } as NotificationDoc;
    }
  } catch (err) {
    console.error("[notificationsStore] getNotificationById error:", err);
  }
  return null;
}

export async function createNotification(notif: NotificationDoc): Promise<NotificationDoc> {
  const docId = notif.id || `NTF_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const clean: NotificationDoc = {
    ...notif,
    id: docId,
    createdAt: notif.createdAt || new Date().toISOString(),
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
  return (await updateNotification(id, { read: true, readAt: new Date().toISOString() })) !== null;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const userNotifs = await getNotifications({ userId });
    for (const n of userNotifs) {
      if (!n.read) {
        await updateNotification(n.id, { read: true, readAt: new Date().toISOString() });
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
    list.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
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
    sentAt: record.sentAt || new Date().toISOString(),
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

export const notificationsStore = {
  getNotifications,
  getAllNotifications,
  getNotificationById,
  getUserNotifications,
  createNotification,
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
