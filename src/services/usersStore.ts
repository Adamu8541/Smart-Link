import { getAdminFirestore } from "./firebaseAdmin";
import { readDB, writeDB } from "../../server/db";

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
 * Get all users from Firestore "users" collection with local DB fallback.
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
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore getAllUsers unavailable, using local database fallback.");
    }
    try {
      const localDb = readDB();
      return Array.isArray(localDb?.users) ? localDb.users : [];
    } catch (dbErr) {
      return [];
    }
  }
}

/**
 * Get a user by ID or UID with local DB fallback.
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
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore getUserById lookup unavailable, using local database fallback.");
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find((u: any) => u.id === idOrUid || u.uid === idOrUid);
    if (found) return found;
  } catch (dbErr) {}

  return null;
}

/**
 * Get a user by email address with local DB fallback.
 */
export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  if (!email) return null;
  const cleanEmail = email.trim();
  const normalizedEmail = cleanEmail.toLowerCase();
  try {
    const db = getAdminFirestore();
    let querySnap = await db.collection(COLLECTION_NAME).where("email", "==", normalizedEmail).limit(1).get();
    if (querySnap.empty && cleanEmail !== normalizedEmail) {
      querySnap = await db.collection(COLLECTION_NAME).where("email", "==", cleanEmail).limit(1).get();
    }
    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore getUserByEmail lookup unavailable, using local database fallback.");
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find((u: any) => (u.email || "").toLowerCase().trim() === normalizedEmail);
    if (found) return found;
  } catch (dbErr) {}

  return null;
}

export async function getUserByPhone(phoneNumber: string): Promise<UserDoc | null> {
  if (!phoneNumber) return null;
  const cleanPhone = phoneNumber.trim();
  if (!cleanPhone) return null;
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION_NAME).where("phoneNumber", "==", cleanPhone).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as UserDoc;
      return { id: doc.id, uid: data.uid || doc.id, ...data };
    }
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore getUserByPhone lookup unavailable, using local database fallback.");
    }
  }

  // Local DB Fallback
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find((u: any) => (u.phoneNumber || "").trim() === cleanPhone);
    if (found) return found;
  } catch (dbErr) {}

  return null;
}

/**
 * Create a new user document in "users" collection.
 */
export async function createUser(user: UserDoc): Promise<UserDoc> {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  const cleanPhone = (user.phoneNumber || "").trim();

  // 1. Strict uniqueness check for email before creation
  if (normalizedEmail) {
    const existingUserWithEmail = await getUserByEmail(normalizedEmail);
    if (existingUserWithEmail && existingUserWithEmail.uid !== user.uid) {
      throw new Error("email exist sign in instead");
    }
  }

  // 2. Strict uniqueness check for phone before creation
  if (cleanPhone) {
    const existingUserWithPhone = await getUserByPhone(cleanPhone);
    if (existingUserWithPhone && existingUserWithPhone.uid !== user.uid) {
      throw new Error('"phone number already linked to another account" change phone number');
    }
  }

  const docId = user.id || user.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanUser: UserDoc = {
    ...user,
    id: docId,
    uid: user.uid || docId,
    email: normalizedEmail || user.email,
    phoneNumber: cleanPhone || user.phoneNumber,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  const db = getAdminFirestore();
  const sanitized = JSON.parse(JSON.stringify(cleanUser));

  try {
    const docRef = db.collection(COLLECTION_NAME).doc(docId);
    const snap = await docRef.get();
    if (snap.exists) {
      const existingData = snap.data() as UserDoc;
      if (existingData.email && existingData.email.toLowerCase().trim() !== normalizedEmail) {
        throw new Error("email exist sign in instead");
      }
      return { id: snap.id, uid: existingData.uid || snap.id, ...existingData };
    }
    await docRef.set(sanitized);
  } catch (err: any) {
    if (err?.message === "email exist sign in instead" || err?.message?.includes("already linked")) {
      throw err;
    }
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore createUser bypassed, saving to local database fallback.");
    }
  }

  // Persist to local JSON DB
  try {
    const localDb = readDB();
    if (Array.isArray(localDb.users)) {
      const idx = localDb.users.findIndex((u: any) => u.id === docId || u.uid === cleanUser.uid);
      if (idx >= 0) {
        localDb.users[idx] = { ...localDb.users[idx], ...cleanUser };
      } else {
        localDb.users.push(cleanUser);
      }
      writeDB(localDb);
    }
  } catch (dbErr) {}

  return cleanUser;
}

/**
 * Update an existing user in "users" collection with local DB fallback.
 */
export async function updateUser(idOrUid: string, updates: Partial<UserDoc>): Promise<UserDoc | null> {
  if (!idOrUid) return null;
  let existing = await getUserById(idOrUid);
  if (!existing) {
    return null;
  }

  const docId = existing.id || existing.uid || idOrUid;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const sanitized = JSON.parse(JSON.stringify(merged));

  try {
    const db = getAdminFirestore();
    await db.collection(COLLECTION_NAME).doc(docId).set(sanitized, { merge: true });
  } catch (err: any) {
    if (!err?.message?.includes("RESOURCE_EXHAUSTED") && err?.code !== 8) {
      console.log("[usersStore] Firestore updateUser bypassed, updating local database fallback.");
    }
  }

  // Update in local JSON DB
  try {
    const localDb = readDB();
    if (Array.isArray(localDb.users)) {
      const idx = localDb.users.findIndex((u: any) => u.id === docId || u.uid === docId || u.id === idOrUid || u.uid === idOrUid);
      if (idx >= 0) {
        localDb.users[idx] = { ...localDb.users[idx], ...merged };
      } else {
        localDb.users.push(merged);
      }
      writeDB(localDb);
    }
  } catch (dbErr) {}

  return merged;
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
  } catch (err) {}

  try {
    const localDb = readDB();
    if (Array.isArray(localDb.users)) {
      const existing = (localDb.users || []).find((u: any) => u.id === idOrUid || u.uid === idOrUid);
      if (existing) {
        localDb.users = localDb.users.filter((u: any) => u.id !== existing.id && u.uid !== existing.uid);
        writeDB(localDb);
      }
    }
  } catch (dbErr) {}

  return true;
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
  } catch (err) {}
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
