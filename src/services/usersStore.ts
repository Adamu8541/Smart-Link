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
  isBanned?: boolean;
  status?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  createdAt?: string;
  updatedAt?: string;
  tier?: string;
  nin?: string;
  bvn?: string;
  [key: string]: any;
}

const USERS_COLLECTION = "users";

export async function getAllUsers(): Promise<UserDoc[]> {
  try {
    const localDb = readDB();
    return Array.isArray(localDb?.users) ? localDb.users : [];
  } catch (err) {
    console.warn("[usersStore] getAllUsers error:", err);
    return [];
  }
}

export async function getUserByUid(uid: string): Promise<UserDoc | null> {
  if (!uid) return null;
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.uid === uid || u.id === uid
    );
    if (found) return found;
  } catch (err) {}
  return null;
}

export const getUserById = getUserByUid;

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  if (!email) return null;
  const targetEmail = email.toLowerCase().trim();
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.email && u.email.toLowerCase().trim() === targetEmail
    );
    if (found) return found;
  } catch (err) {}
  return null;
}

export async function getUserByPhone(phoneNumber: string): Promise<UserDoc | null> {
  if (!phoneNumber) return null;
  const targetPhone = phoneNumber.trim();
  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.phoneNumber && u.phoneNumber.trim() === targetPhone
    );
    if (found) return found;
  } catch (err) {}
  return null;
}

export async function createUser(user: UserDoc): Promise<UserDoc> {
  const uid = user.uid || user.id || `usr_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanUser: UserDoc = {
    ...user,
    uid,
    id: uid,
    email: user.email ? user.email.toLowerCase().trim() : "",
    fullName: user.fullName || "Smart Link User",
    role: user.role || "CUSTOMER",
    walletBalance: typeof user.walletBalance === "number" ? user.walletBalance : 0,
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    status: user.status || "ACTIVE",
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
  };

  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.users)) localDb.users = [];
    const idx = localDb.users.findIndex((u: any) => u.uid === uid || u.id === uid || (cleanUser.email && u.email?.toLowerCase().trim() === cleanUser.email));
    if (idx >= 0) {
      localDb.users[idx] = { ...localDb.users[idx], ...cleanUser };
    } else {
      localDb.users.push(cleanUser);
    }
    writeDB(localDb);
  } catch (dbErr) {}

  return cleanUser;
}

export async function updateUser(uid: string, updates: Partial<UserDoc>): Promise<UserDoc | null> {
  if (!uid) return null;
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.users)) return null;
    const idx = localDb.users.findIndex((u: any) => u.uid === uid || u.id === uid);
    if (idx < 0) return null;

    const merged = {
      ...localDb.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localDb.users[idx] = merged;
    writeDB(localDb);
    return merged;
  } catch (err) {
    console.warn("[usersStore] updateUser error:", err);
    return null;
  }
}

export async function deleteUser(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const localDb = readDB();
    if (!Array.isArray(localDb.users)) return false;
    localDb.users = localDb.users.filter((u: any) => u.uid !== uid && u.id !== uid);
    writeDB(localDb);
    return true;
  } catch (err) {
    console.warn("[usersStore] deleteUser error:", err);
    return false;
  }
}

export async function seedUsersIfEmpty(initialUsers: UserDoc[] = []): Promise<void> {
  try {
    const localDb = readDB();
    if (!localDb.users || localDb.users.length === 0) {
      for (const u of initialUsers) {
        await createUser(u);
      }
    }
  } catch (err) {
    console.warn("[usersStore] seedUsersIfEmpty error:", err);
  }
}

export const usersStore = {
  getAllUsers,
  getUserByUid,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  seedUsersIfEmpty,
};

export default usersStore;
