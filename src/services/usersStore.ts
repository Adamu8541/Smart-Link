import { getAdminFirestore } from "./firebaseAdmin";

export interface UserDoc {
  id?: string;
  uid?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  walletBalance?: number;
  referralCode?: string;
  passwordHash?: string;
  salt?: string;
  isVerified?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  customClaims?: any;
  lastLogin?: string;
  referredBy?: string;
  permissions?: string[];
  [key: string]: any;
}

const COLLECTION_NAME = "users";

/**
 * Get all users from Firestore "users" collection.
 */
export async function getAllUsers(): Promise<UserDoc[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const users: UserDoc[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as UserDoc;
      const docId = doc.id;
      users.push({
        id: docId,
        uid: data.uid || docId,
        ...data,
      });
    });
    return users;
  } catch (err) {
    console.error("[usersStore] getAllUsers error:", err);
    return [];
  }
}

/**
 * Get a user by ID or UID.
 */
export async function getUserById(idOrUid: string): Promise<UserDoc | null> {
  if (!idOrUid) return null;
  try {
    const db = getAdminFirestore();
    // Try direct document lookup first
    const docRef = db.collection(COLLECTION_NAME).doc(idOrUid);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data() as UserDoc;
      return { id: docSnap.id, uid: data.uid || docSnap.id, ...data };
    }

    // Fallback: Query by uid field
    const queryUid = await db.collection(COLLECTION_NAME).where("uid", "==", idOrUid).limit(1).get();
    if (!queryUid.empty) {
      const doc = queryUid.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }

    // Fallback: Query by id field
    const queryId = await db.collection(COLLECTION_NAME).where("id", "==", idOrUid).limit(1).get();
    if (!queryId.empty) {
      const doc = queryId.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }
  } catch (err) {
    console.error("[usersStore] getUserById error:", err);
  }
  return null;
}

/**
 * Get a user by email address.
 */
export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  if (!email) return null;
  try {
    const db = getAdminFirestore();
    const querySnap = await db.collection(COLLECTION_NAME).where("email", "==", email).limit(1).get();
    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }

    // Case-insensitive fallback scan if not found by exact string
    const normalized = email.toLowerCase().trim();
    const all = await getAllUsers();
    const found = all.find((u) => u.email && u.email.toLowerCase().trim() === normalized);
    return found || null;
  } catch (err) {
    console.error("[usersStore] getUserByEmail error:", err);
  }
  return null;
}

export async function getUserByPhone(phoneNumber: string): Promise<UserDoc | null> {
  if (!phoneNumber) return null;
  try {
    const db = getAdminFirestore();
    const normalized = phoneNumber.replace(/\D/g, "");
    if (!normalized) return null;

    // 1. Direct query by exact phoneNumber
    const snapshot = await db.collection(COLLECTION_NAME).where("phoneNumber", "==", phoneNumber.trim()).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }

    // 2. Normalized digits fallback match
    const allUsers = await getAllUsers();
    const found = allUsers.find(
      (u: any) => u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === normalized
    );
    return found || null;
  } catch (err) {
    console.error("[usersStore] getUserByPhone error:", err);
    try {
      const allUsers = await getAllUsers();
      const normalized = phoneNumber.replace(/\D/g, "");
      const found = allUsers.find(
        (u: any) => u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === normalized
      );
      return found || null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a new user document in "users" collection.
 */
export async function createUser(user: UserDoc): Promise<UserDoc> {
  const docId = user.id || user.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanUser: UserDoc = {
    ...user,
    id: docId,
    uid: user.uid || docId,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  try {
    const db = getAdminFirestore();
    const sanitized = JSON.parse(JSON.stringify(cleanUser));
    await db.collection(COLLECTION_NAME).doc(docId).set(sanitized, { merge: true });
  } catch (err) {
    console.error("[usersStore] createUser error:", err);
  }
  return cleanUser;
}

/**
 * Update an existing user in "users" collection.
 */
export async function updateUser(idOrUid: string, updates: Partial<UserDoc>): Promise<UserDoc | null> {
  if (!idOrUid) return null;
  try {
    const db = getAdminFirestore();
    let existing = await getUserById(idOrUid);
    if (!existing) {
      return null;
    }

    const docId = existing.id || existing.uid || idOrUid;
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const sanitized = JSON.parse(JSON.stringify(merged));

    await db.collection(COLLECTION_NAME).doc(docId).set(sanitized, { merge: true });
    return merged;
  } catch (err) {
    console.error("[usersStore] updateUser error:", err);
    return null;
  }
}

/**
 * Delete a user from "users" collection.
 */
export async function deleteUser(idOrUid: string): Promise<boolean> {
  if (!idOrUid) return false;
  try {
    const db = getAdminFirestore();
    const existing = await getUserById(idOrUid);
    if (!existing) return false;

    const docId = existing.id || existing.uid || idOrUid;
    await db.collection(COLLECTION_NAME).doc(docId).delete();
    return true;
  } catch (err) {
    console.error("[usersStore] deleteUser error:", err);
    return false;
  }
}

/**
 * Seed default users if the collection is empty.
 */
export async function seedUsersIfEmpty(defaultUsers: UserDoc[]): Promise<void> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(COLLECTION_NAME).limit(1).get();
    if (snap.empty && Array.isArray(defaultUsers) && defaultUsers.length > 0) {
      for (const u of defaultUsers) {
        await createUser(u);
      }
      console.log(`[usersStore] Seeded ${defaultUsers.length} default users to Firestore "users" collection.`);
    }
  } catch (err) {
    console.error("[usersStore] seedUsersIfEmpty error:", err);
  }
}

export const usersStore = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  updateUser,
  deleteUser,
  seedUsersIfEmpty,
};

export default usersStore;
