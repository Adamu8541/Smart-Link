import { readDB, writeDB } from "../../server/db";
import { executeTurso } from "../../server/turso/client";
import { UserRepository } from "../../server/turso/repositories";

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

function sanitizeUserRecord(row: any): UserDoc {
  if (!row) return row;
  const uid = row.uid || row.id;
  const hasPin = row.has_transaction_pin !== undefined && row.has_transaction_pin !== null
    ? Boolean(row.has_transaction_pin)
    : (row.hasTransactionPin !== undefined ? Boolean(row.hasTransactionPin) : Boolean(row.transaction_pin_hash || row.transactionPinHash));
  const pinHash = row.transaction_pin_hash || row.transactionPinHash || undefined;
  const pinRequired = row.pin_required_for_transactions !== undefined && row.pin_required_for_transactions !== null
    ? (row.pin_required_for_transactions === 1 || row.pin_required_for_transactions === true)
    : (row.pinRequiredForTransactions !== undefined ? Boolean(row.pinRequiredForTransactions) : true);

  return {
    ...row,
    id: uid,
    uid: uid,
    email: row.email || "",
    fullName: row.full_name || row.fullName || "Smart Link User",
    phoneNumber: row.phone_number || row.phoneNumber || "",
    role: row.role || "CUSTOMER",
    walletBalance: typeof row.wallet_balance === "number" ? row.wallet_balance : (typeof row.walletBalance === "number" ? row.walletBalance : 0),
    referralCode: row.referral_code || row.referralCode || "",
    isVerified: row.is_verified !== undefined ? Boolean(row.is_verified) : (row.isVerified !== undefined ? Boolean(row.isVerified) : true),
    status: row.status || "ACTIVE",
    hasTransactionPin: hasPin,
    transactionPinHash: pinHash,
    pinRequiredForTransactions: pinRequired,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function getAllUsers(): Promise<UserDoc[]> {
  try {
    const res = await executeTurso("SELECT * FROM users ORDER BY created_at DESC;");
    if (res.rows && res.rows.length > 0) {
      return res.rows.map(sanitizeUserRecord);
    }
  } catch (tursoErr) {
    console.warn("[usersStore] Turso getAllUsers error:", tursoErr);
  }

  try {
    const localDb = readDB();
    return Array.isArray(localDb?.users) ? localDb.users.map(sanitizeUserRecord) : [];
  } catch (err) {
    return [];
  }
}

export async function getUserByUid(uid: string): Promise<UserDoc | null> {
  if (!uid) return null;

  try {
    const res = await executeTurso("SELECT * FROM users WHERE uid = ? OR id = ? LIMIT 1;", [uid, uid]);
    if (res.rows && res.rows.length > 0) {
      return sanitizeUserRecord(res.rows[0]);
    }
  } catch (tursoErr) {
    console.warn(`[usersStore] Turso getUserByUid (${uid}) error:`, tursoErr);
  }

  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.uid === uid || u.id === uid
    );
    if (found) return sanitizeUserRecord(found);
  } catch (err) {}
  return null;
}

export const getUserById = getUserByUid;

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  if (!email) return null;
  const targetEmail = email.toLowerCase().trim();

  try {
    const res = await executeTurso("SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1;", [targetEmail]);
    if (res.rows && res.rows.length > 0) {
      return sanitizeUserRecord(res.rows[0]);
    }
  } catch (tursoErr) {
    console.warn(`[usersStore] Turso getUserByEmail (${targetEmail}) error:`, tursoErr);
  }

  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.email && u.email.toLowerCase().trim() === targetEmail
    );
    if (found) return sanitizeUserRecord(found);
  } catch (err) {}
  return null;
}

export async function getUserByPhone(phoneNumber: string): Promise<UserDoc | null> {
  if (!phoneNumber) return null;
  const targetPhone = phoneNumber.trim();

  try {
    const res = await executeTurso("SELECT * FROM users WHERE phone_number = ? LIMIT 1;", [targetPhone]);
    if (res.rows && res.rows.length > 0) {
      return sanitizeUserRecord(res.rows[0]);
    }
  } catch (tursoErr) {
    console.warn(`[usersStore] Turso getUserByPhone (${targetPhone}) error:`, tursoErr);
  }

  try {
    const localDb = readDB();
    const found = (localDb?.users || []).find(
      (u: any) => u.phoneNumber && u.phoneNumber.trim() === targetPhone
    );
    if (found) return sanitizeUserRecord(found);
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

  // Direct persistence to Turso single source of truth
  try {
    const hasPin = cleanUser.hasTransactionPin ? 1 : 0;
    const pinHash = cleanUser.transactionPinHash || null;
    const pinReq = cleanUser.pinRequiredForTransactions !== false ? 1 : 0;

    await executeTurso(
      `INSERT INTO users (id, uid, email, phone_number, full_name, role, wallet_balance, referral_code, is_verified, status, has_transaction_pin, transaction_pin_hash, pin_required_for_transactions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET
         email=excluded.email,
         phone_number=excluded.phone_number,
         full_name=excluded.full_name,
         role=excluded.role,
         wallet_balance=excluded.wallet_balance,
         is_verified=excluded.is_verified,
         status=excluded.status,
         has_transaction_pin=excluded.has_transaction_pin,
         transaction_pin_hash=excluded.transaction_pin_hash,
         pin_required_for_transactions=excluded.pin_required_for_transactions,
         updated_at=excluded.updated_at;`,
      [
        uid,
        uid,
        cleanUser.email || "",
        cleanUser.phoneNumber || "",
        cleanUser.fullName || "",
        cleanUser.role || "CUSTOMER",
        cleanUser.walletBalance || 0,
        cleanUser.referralCode || "",
        cleanUser.isVerified ? 1 : 0,
        cleanUser.status || "ACTIVE",
        hasPin,
        pinHash,
        pinReq,
        cleanUser.createdAt || now,
        cleanUser.updatedAt || now,
      ]
    );
  } catch (tursoErr) {
    console.warn("[usersStore] Turso createUser error:", tursoErr);
  }

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
  const now = new Date().toISOString();

  // 1. Update directly in Turso single source of truth
  try {
    const hasPinVal = updates.hasTransactionPin !== undefined
      ? (updates.hasTransactionPin ? 1 : 0)
      : (updates.transactionPinHash !== undefined ? (updates.transactionPinHash ? 1 : 0) : null);
    const pinHashVal = updates.transactionPinHash !== undefined ? (updates.transactionPinHash || null) : null;
    const pinReqVal = updates.pinRequiredForTransactions !== undefined
      ? (updates.pinRequiredForTransactions ? 1 : 0)
      : null;

    await executeTurso(
      `UPDATE users SET 
         full_name = COALESCE(?, full_name),
         phone_number = COALESCE(?, phone_number),
         role = COALESCE(?, role),
         wallet_balance = COALESCE(?, wallet_balance),
         is_verified = COALESCE(?, is_verified),
         status = COALESCE(?, status),
         has_transaction_pin = COALESCE(?, has_transaction_pin),
         transaction_pin_hash = COALESCE(?, transaction_pin_hash),
         pin_required_for_transactions = COALESCE(?, pin_required_for_transactions),
         updated_at = ?
       WHERE uid = ? OR id = ?;`,
      [
        updates.fullName ?? null,
        updates.phoneNumber ?? null,
        updates.role ?? null,
        updates.walletBalance ?? null,
        updates.isVerified !== undefined ? (updates.isVerified ? 1 : 0) : null,
        updates.status ?? null,
        hasPinVal,
        pinHashVal,
        pinReqVal,
        now,
        uid,
        uid
      ]
    );
  } catch (tursoErr) {
    console.warn(`[usersStore] Turso updateUser (${uid}) error:`, tursoErr);
  }

  try {
    const localDb = readDB();
    if (Array.isArray(localDb.users)) {
      const idx = localDb.users.findIndex((u: any) => u.uid === uid || u.id === uid);
      if (idx >= 0) {
        const merged = {
          ...localDb.users[idx],
          ...updates,
          updatedAt: now,
        };
        localDb.users[idx] = merged;
        writeDB(localDb);
        return sanitizeUserRecord(merged);
      }
    }
  } catch (err) {}

  return getUserByUid(uid);
}

export async function deleteUser(uid: string): Promise<boolean> {
  if (!uid) return false;

  try {
    await executeTurso(`DELETE FROM users WHERE uid = ? OR id = ?;`, [uid, uid]);
  } catch (tursoErr) {
    console.warn(`[usersStore] Turso deleteUser (${uid}) error:`, tursoErr);
  }

  try {
    const localDb = readDB();
    if (Array.isArray(localDb.users)) {
      localDb.users = localDb.users.filter((u: any) => u.uid !== uid && u.id !== uid);
      writeDB(localDb);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function seedUsersIfEmpty(initialUsers: UserDoc[] = []): Promise<void> {
  try {
    const res = await executeTurso("SELECT COUNT(*) as count FROM users;");
    const count = Number(res.rows?.[0]?.count || 0);
    if (count === 0 && initialUsers.length > 0) {
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
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  updateUser,
  deleteUser,
  seedUsersIfEmpty,
};

export default usersStore;
