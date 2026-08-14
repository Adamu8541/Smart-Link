import { getAdminFirestore } from "./firebaseAdmin";

export interface TicketDoc {
  id: string;
  ticketNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedTo?: string;
  assignedAdminEmail?: string;
  assignedDepartment?: string;
  description?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  reply?: string;
  repliedBy?: string;
  [key: string]: any;
}

export interface TicketMessageDoc {
  id: string;
  ticketId: string;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  message: string;
  attachments?: any[];
  createdAt: string;
  isInternalNote?: boolean;
  [key: string]: any;
}

export interface TicketAttachmentDoc {
  id: string;
  ticketId: string;
  messageId?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt: string;
  [key: string]: any;
}

export interface TicketActivityLogDoc {
  id: string;
  ticketId: string;
  action: string;
  performedBy?: string;
  performedByEmail?: string;
  details?: string;
  timestamp: string;
  oldStatus?: string;
  newStatus?: string;
  [key: string]: any;
}

const TICKETS_COLLECTION = "support_tickets";
const MESSAGES_COLLECTION = "ticket_messages";
const ATTACHMENTS_COLLECTION = "ticket_attachments";
const LOGS_COLLECTION = "ticket_activity_logs";

export async function getAllTickets(filters?: {
  userId?: string;
  status?: string;
  priority?: string;
  category?: string;
  limit?: number;
}): Promise<TicketDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(TICKETS_COLLECTION);

    if (filters?.userId) {
      query = query.where("userId", "==", filters.userId);
    }
    if (filters?.status && filters.status !== "ALL") {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.priority && filters.priority !== "ALL") {
      query = query.where("priority", "==", filters.priority);
    }
    if (filters?.category && filters.category !== "ALL") {
      query = query.where("category", "==", filters.category);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const tickets: TicketDoc[] = [];
    snapshot.forEach((doc: any) => {
      tickets.push({ id: doc.id, ...doc.data() } as TicketDoc);
    });
    return tickets;
  } catch (err) {
    console.error("[supportStore] getAllTickets error:", err);
    return [];
  }
}

export async function getTicketById(ticketIdOrNumber: string): Promise<TicketDoc | null> {
  if (!ticketIdOrNumber) return null;
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(TICKETS_COLLECTION).doc(ticketIdOrNumber);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as TicketDoc;
    }

    const qNum = await db.collection(TICKETS_COLLECTION).where("ticketNumber", "==", ticketIdOrNumber).limit(1).get();
    if (!qNum.empty) {
      const doc = qNum.docs[0];
      return { id: doc.id, ...doc.data() } as TicketDoc;
    }

    const qId = await db.collection(TICKETS_COLLECTION).where("id", "==", ticketIdOrNumber).limit(1).get();
    if (!qId.empty) {
      const doc = qId.docs[0];
      return { id: doc.id, ...doc.data() } as TicketDoc;
    }
  } catch (err) {
    console.error("[supportStore] getTicketById error:", err);
  }
  return null;
}

export async function createTicket(ticket: TicketDoc): Promise<TicketDoc> {
  const docId = ticket.id || `TKT_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const newTicket: TicketDoc = {
    ...ticket,
    id: docId,
    ticketNumber: ticket.ticketNumber || docId,
    createdAt: ticket.createdAt || new Date().toISOString(),
    updatedAt: ticket.updatedAt || new Date().toISOString(),
  };
  try {
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(newTicket));
    await db.collection(TICKETS_COLLECTION).doc(docId).set(sanitized, { merge: true });
  } catch (err) {
    console.error("[supportStore] createTicket error:", err);
  }
  return newTicket;
}

export async function updateTicket(ticketIdOrNumber: string, updates: Partial<TicketDoc>): Promise<TicketDoc | null> {
  try {
    const existing = await getTicketById(ticketIdOrNumber);
    if (!existing) return null;

    const db = getAdminFirestore();
    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    const sanitized = JSON.parse(JSON.stringify(merged));
    await db.collection(TICKETS_COLLECTION).doc(existing.id).set(sanitized, { merge: true });
    return merged;
  } catch (err) {
    console.error("[supportStore] updateTicket error:", err);
    return null;
  }
}

export async function deleteTicket(ticketIdOrNumber: string): Promise<boolean> {
  try {
    const existing = await getTicketById(ticketIdOrNumber);
    if (!existing) return false;

    const db = getAdminFirestore();
    await db.collection(TICKETS_COLLECTION).doc(existing.id).delete();
    return true;
  } catch (err) {
    console.error("[supportStore] deleteTicket error:", err);
    return false;
  }
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessageDoc[]> {
  if (!ticketId) return [];
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(MESSAGES_COLLECTION).where("ticketId", "==", ticketId).get();
    const messages: TicketMessageDoc[] = [];
    snapshot.forEach((doc: any) => {
      messages.push({ id: doc.id, ...doc.data() } as TicketMessageDoc);
    });
    messages.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    return messages;
  } catch (err) {
    console.error("[supportStore] getTicketMessages error:", err);
    return [];
  }
}

export async function createTicketMessage(msg: TicketMessageDoc): Promise<TicketMessageDoc> {
  const docId = msg.id || `MSG_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const newMsg: TicketMessageDoc = {
    ...msg,
    id: docId,
    createdAt: msg.createdAt || new Date().toISOString(),
  };
  try {
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(newMsg));
    await db.collection(MESSAGES_COLLECTION).doc(docId).set(sanitized, { merge: true });
  } catch (err) {
    console.error("[supportStore] createTicketMessage error:", err);
  }
  return newMsg;
}

export async function getTicketActivityLogs(ticketId?: string, limit: number = 50): Promise<TicketActivityLogDoc[]> {
  try {
    const db = getAdminFirestore();
    let query: any = db.collection(LOGS_COLLECTION);
    if (ticketId) {
      query = query.where("ticketId", "==", ticketId);
    }
    if (limit) {
      query = query.limit(limit);
    }
    const snapshot = await query.get();
    const logs: TicketActivityLogDoc[] = [];
    snapshot.forEach((doc: any) => {
      logs.push({ id: doc.id, ...doc.data() } as TicketActivityLogDoc);
    });
    logs.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return logs;
  } catch (err) {
    console.error("[supportStore] getTicketActivityLogs error:", err);
    return [];
  }
}

export async function addTicketActivityLog(log: TicketActivityLogDoc): Promise<TicketActivityLogDoc> {
  const docId = log.id || `LOG_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const newLog: TicketActivityLogDoc = {
    ...log,
    id: docId,
    timestamp: log.timestamp || new Date().toISOString(),
  };
  try {
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(newLog));
    await db.collection(LOGS_COLLECTION).doc(docId).set(sanitized, { merge: true });
  } catch (err) {
    console.error("[supportStore] addTicketActivityLog error:", err);
  }
  return newLog;
}

export async function seedSupportIfEmpty(initialData: {
  tickets?: TicketDoc[];
  messages?: TicketMessageDoc[];
  logs?: TicketActivityLogDoc[];
}): Promise<void> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(TICKETS_COLLECTION).limit(1).get();
    if (snap.empty) {
      if (initialData.tickets && initialData.tickets.length > 0) {
        for (const t of initialData.tickets) {
          await createTicket(t);
        }
      }
      if (initialData.messages && initialData.messages.length > 0) {
        for (const m of initialData.messages) {
          await createTicketMessage(m);
        }
      }
      if (initialData.logs && initialData.logs.length > 0) {
        for (const l of initialData.logs) {
          await addTicketActivityLog(l);
        }
      }
    }
  } catch (err) {
    console.error("[supportStore] seedSupportIfEmpty error:", err);
  }
}

export const supportStore = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketMessages,
  createTicketMessage,
  getTicketActivityLogs,
  addTicketActivityLog,
  seedSupportIfEmpty,
};

export default supportStore;
