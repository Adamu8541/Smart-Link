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

let authColumnsEnsured = false;
export async function ensureAuthColumns() {
  if (authColumnsEnsured) return;
  authColumnsEnsured = true;
  const queries = [
    "ALTER TABLE users ADD COLUMN password_hash TEXT;",
    "ALTER TABLE users ADD COLUMN salt TEXT;",
    "ALTER TABLE users ADD COLUMN reset_token TEXT;",
    "ALTER TABLE users ADD COLUMN reset_token_expires INTEGER;",
    "ALTER TABLE users ADD COLUMN reset_otp TEXT;"
  ];
  for (const q of queries) {
    try {
      await executeTurso(q);
    } catch {}
  }
}
// Run once on module initialization
ensureAuthColumns().catch(() => {});

function sanitizeUserRecord(row: any): UserDoc {
  if (!row) return row;
  const uid = row.uid || row.id;
  const hasPin = row.has_transaction_pin !== undefined && row.has_transaction_pin !== null
    ? Boolean(row.has_transaction_pin)
    : (row.hasTransactionPin !== undefined ? Boolean(row.hasTransactionPin) : Boolean(row.transaction_pin_hash || row.transactionPinHash));
  const pinHash = row.transaction_pin_hash || row.transactionPinHash || undefined;
  const pinRequired = false;

  const pwdHash = row.password_hash || row.passwordHash || undefined;
  const salt = row.salt || undefined;
  const resetToken = row.reset_token !== undefined ? row.reset_token : (row.resetToken !== undefined ? row.resetToken : undefined);
  const resetTokenExpires = row.reset_token_expires !== undefined
    ? Number(row.reset_token_expires)
    : (row.resetTokenExpires !== undefined ? Number(row.resetTokenExpires) : undefined);
  const resetOtp = row.reset_otp !== undefined ? row.reset_otp : (row.resetOtp !== undefined ? row.resetOtp : undefined);

  let perms = row.permissions;
  if (typeof perms === "string") {
    try { perms = JSON.parse(perms); } catch { perms = []; }
  }

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
    passwordHash: pwdHash,
    password_hash: pwdHash,
    salt: salt,
    resetToken: resetToken,
    reset_token: resetToken,
    resetTokenExpires: resetTokenExpires,
    reset_token_expires: resetTokenExpires,
    resetOtp: resetOtp,
    reset_otp: resetOtp,
    permissions: Array.isArray(perms) ? perms : (row.role === "SUPER_ADMIN" ? ["*"] : undefined),
    hasTransactionPin: hasPin,
    transactionPinHash: pinHash,
    pinRequiredForTransactions: pinRequired,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function getAllUsers(): Promise<UserDoc[]> {
  await ensureAuthColumns();
  const res = await executeTurso("SELECT * FROM users ORDER BY created_at DESC;");
  if (res.rows && res.rows.length > 0) {
    return res.rows.map(sanitizeUserRecord);
  }
  return [];
}

export async function getUserByUid(uid: string): Promise<UserDoc | null> {
  if (!uid) return null;
  await ensureAuthColumns();
  const res = await executeTurso("SELECT * FROM users WHERE uid = ? OR id = ? LIMIT 1;", [uid, uid]);
  if (res.rows && res.rows.length > 0) {
    return sanitizeUserRecord(res.rows[0]);
  }
  return null;
}

export const getUserById = getUserByUid;

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  if (!email) return null;
  await ensureAuthColumns();
  const targetEmail = email.toLowerCase().trim();
  const res = await executeTurso("SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1;", [targetEmail]);
  if (res.rows && res.rows.length > 0) {
    return sanitizeUserRecord(res.rows[0]);
  }

  // Fallback to db.json if exists
  try {
    const db = readDB();
    if (Array.isArray(db.users)) {
      const match = db.users.find((u: any) => u.email && u.email.toLowerCase().trim() === targetEmail);
      if (match) {
        // Seed into Turso so it exists going forward
        await createUser(match);
        return sanitizeUserRecord(match);
      }
    }
  } catch {}

  return null;
}

export async function getUserByPhone(phoneNumber: string): Promise<UserDoc | null> {
  if (!phoneNumber) return null;
  const targetPhone = phoneNumber.trim();
  const res = await executeTurso("SELECT * FROM users WHERE phone_number = ? LIMIT 1;", [targetPhone]);
  if (res.rows && res.rows.length > 0) {
    return sanitizeUserRecord(res.rows[0]);
  }
  return null;
}

export async function createUser(user: UserDoc): Promise<UserDoc> {
  const uid = user.uid || user.id || `usr_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanEmail = user.email ? user.email.toLowerCase().trim() : "";
  const cleanUser: UserDoc = {
    ...user,
    uid,
    id: uid,
    email: cleanEmail,
    fullName: user.fullName || "Smart Link User",
    role: user.role || "CUSTOMER",
    walletBalance: typeof user.walletBalance === "number" ? user.walletBalance : 0,
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    status: user.status || "ACTIVE",
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
  };

  const hasPin = cleanUser.hasTransactionPin ? 1 : 0;
  const pinHash = cleanUser.transactionPinHash || null;
  const pinReq = cleanUser.pinRequiredForTransactions !== false ? 1 : 0;

  // Check if user exists by UID first
  const existingByUid = await getUserByUid(uid);
  if (existingByUid) {
    await updateUser(uid, cleanUser);
    return (await getUserByUid(uid)) || cleanUser;
  }

  // Check if user exists by email to prevent UNIQUE constraint failed on email
  if (cleanEmail) {
    const existingByEmail = await getUserByEmail(cleanEmail);
    if (existingByEmail) {
      await executeTurso(
        `UPDATE users SET
           uid = ?,
           id = ?,
           phone_number = COALESCE(?, phone_number),
           full_name = COALESCE(?, full_name),
           role = COALESCE(?, role),
           wallet_balance = COALESCE(?, wallet_balance),
           is_verified = COALESCE(?, is_verified),
           status = COALESCE(?, status),
           updated_at = ?
         WHERE lower(email) = lower(?);`,
        [
          uid,
          uid,
          cleanUser.phoneNumber || null,
          cleanUser.fullName || null,
          cleanUser.role || null,
          cleanUser.walletBalance || null,
          cleanUser.isVerified ? 1 : 0,
          cleanUser.status || null,
          now,
          cleanEmail,
        ]
      );
      return (await getUserByUid(uid)) || cleanUser;
    }
  }

  const cleanReferralCode = cleanUser.referralCode && cleanUser.referralCode.trim()
    ? cleanUser.referralCode.trim()
    : null;

  try {
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
        cleanUser.email || `${uid}@user.smartlink.ng`,
        cleanUser.phoneNumber || "",
        cleanUser.fullName || "",
        cleanUser.role || "CUSTOMER",
        cleanUser.walletBalance || 0,
        cleanReferralCode,
        cleanUser.isVerified ? 1 : 0,
        cleanUser.status || "ACTIVE",
        hasPin,
        pinHash,
        pinReq,
        cleanUser.createdAt || now,
        cleanUser.updatedAt || now,
      ]
    );
  } catch (insertErr: any) {
    console.warn(`[usersStore] User insert note: ${insertErr?.message}`);
    try {
      await executeTurso(
        `INSERT INTO users (id, uid, email, full_name, role, wallet_balance, referral_code, is_verified, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, NULL, 1, 'ACTIVE', ?, ?)
         ON CONFLICT(uid) DO UPDATE SET updated_at = excluded.updated_at;`,
        [uid, uid, cleanUser.email || `${uid}@user.smartlink.ng`, cleanUser.fullName || "Smart Link User", cleanUser.role || "CUSTOMER", now, now]
      );
    } catch (fallbackErr: any) {
      console.warn(`[usersStore] User fallback insert note: ${fallbackErr?.message}`);
    }
  }

  return cleanUser;
}

export async function ensureUserExists(uid: string, fallback?: Partial<UserDoc>): Promise<UserDoc> {
  if (!uid) return null as any;
  const existingByUid = await getUserByUid(uid);
  if (existingByUid) return existingByUid;

  const email = fallback?.email ? fallback.email.toLowerCase().trim() : `${uid}@user.smartlink.ng`;
  const existingByEmail = await getUserByEmail(email);
  if (existingByEmail) {
    return existingByEmail;
  }

  const created = await createUser({
    uid,
    id: uid,
    email,
    fullName: fallback?.fullName || "Smart Link User",
    phoneNumber: fallback?.phoneNumber || fallback?.phone || "",
    role: fallback?.role || "CUSTOMER",
    walletBalance: typeof fallback?.walletBalance === "number" ? fallback.walletBalance : 0,
    isVerified: fallback?.isVerified ?? true,
    status: fallback?.status || "ACTIVE",
  });

  const verified = await getUserByUid(uid);
  return verified || created;
}

export async function updateUser(uid: string, updates: Partial<UserDoc>): Promise<UserDoc | null> {
  if (!uid) return null;
  await ensureAuthColumns();
  const now = new Date().toISOString();

  const hasPinVal = updates.hasTransactionPin !== undefined
    ? (updates.hasTransactionPin ? 1 : 0)
    : (updates.transactionPinHash !== undefined ? (updates.transactionPinHash ? 1 : 0) : null);
  const pinHashVal = updates.transactionPinHash !== undefined ? (updates.transactionPinHash || null) : null;
  const pinReqVal = updates.pinRequiredForTransactions !== undefined
    ? (updates.pinRequiredForTransactions ? 1 : 0)
    : null;

  const pwdHash = updates.passwordHash || updates.password_hash || null;
  const saltVal = updates.salt || null;
  const hasResetToken = updates.resetToken !== undefined || updates.reset_token !== undefined;
  const resetTokenVal = updates.resetToken !== undefined ? updates.resetToken : (updates.reset_token !== undefined ? updates.reset_token : null);

  const hasResetExpires = updates.resetTokenExpires !== undefined || updates.reset_token_expires !== undefined;
  const resetExpiresVal = updates.resetTokenExpires !== undefined ? updates.resetTokenExpires : (updates.reset_token_expires !== undefined ? updates.reset_token_expires : null);

  const hasResetOtp = updates.resetOtp !== undefined || updates.reset_otp !== undefined;
  const resetOtpVal = updates.resetOtp !== undefined ? updates.resetOtp : (updates.reset_otp !== undefined ? updates.reset_otp : null);

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
       password_hash = CASE WHEN ? IS NOT NULL THEN ? ELSE password_hash END,
       salt = CASE WHEN ? IS NOT NULL THEN ? ELSE salt END,
       reset_token = CASE WHEN ? = 1 THEN ? ELSE reset_token END,
       reset_token_expires = CASE WHEN ? = 1 THEN ? ELSE reset_token_expires END,
       reset_otp = CASE WHEN ? = 1 THEN ? ELSE reset_otp END,
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
      pwdHash,
      pwdHash,
      saltVal,
      saltVal,
      hasResetToken ? 1 : 0,
      resetTokenVal,
      hasResetExpires ? 1 : 0,
      resetExpiresVal,
      hasResetOtp ? 1 : 0,
      resetOtpVal,
      now,
      uid,
      uid
    ]
  );

  // Keep db.json in sync if it exists
  try {
    const db = readDB();
    if (Array.isArray(db.users)) {
      const idx = db.users.findIndex((u: any) => u.uid === uid || u.id === uid);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updates, updatedAt: now };
        writeDB(db);
      }
    }
  } catch {}

  return getUserByUid(uid);
}

export async function deleteUser(uid: string, email?: string): Promise<boolean> {
  if (!uid && !email) return false;

  let targetUid = uid || "";
  let targetId = uid || "";
  let targetEmail = (email || "").toLowerCase().trim();

  // Try to lookup user details if not fully provided
  try {
    const existing = uid ? await getUserByUid(uid) : (targetEmail ? await getUserByEmail(targetEmail) : null);
    if (existing) {
      if (existing.uid) targetUid = existing.uid;
      if (existing.id) targetId = existing.id;
      if (existing.email) targetEmail = existing.email.toLowerCase().trim();
    }
  } catch {}

  // 1. Delete from Turso tables (in strict reverse dependency order)
  try {
    if (targetUid || targetId || targetEmail) {
      // Step A: Delete child records that reference user/wallet first
      await executeTurso(`DELETE FROM wallet_ledger WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM transactions WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM payments WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM user_virtual_accounts WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM user_passkeys WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM cac_applications WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM slip_logs WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(`DELETE FROM verification_records WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});
      await executeTurso(
        `DELETE FROM admin_users WHERE uid = ? OR uid = ? OR (email = ? AND ? != '');`,
        [targetUid, targetId, targetEmail, targetEmail]
      ).catch(() => {});

      // Step B: Delete wallet records
      await executeTurso(`DELETE FROM wallets WHERE user_id = ? OR user_id = ?;`, [targetUid, targetId]).catch(() => {});

      // Step C: Delete parent user record LAST
      await executeTurso(
        `DELETE FROM users WHERE uid = ? OR id = ? OR (email = ? AND ? != '');`,
        [targetUid, targetId, targetEmail, targetEmail]
      );
    }
  } catch (err) {
    console.warn("[usersStore] Turso delete error:", err);
  }

  // 2. Synchronize and clean db.json
  try {
    const db = readDB();
    if (db) {
      let modified = false;
      if (Array.isArray(db.users)) {
        const prevLen = db.users.length;
        db.users = db.users.filter(
          (u: any) =>
            u.uid !== targetUid &&
            u.id !== targetId &&
            u.uid !== targetId &&
            u.id !== targetUid &&
            (!targetEmail || u.email?.toLowerCase().trim() !== targetEmail)
        );
        if (db.users.length !== prevLen) modified = true;
      }
      if (Array.isArray(db.wallets)) {
        db.wallets = db.wallets.filter((w: any) => w.userId !== targetUid && w.userId !== targetId && w.user_id !== targetUid && w.user_id !== targetId);
        modified = true;
      }
      if (Array.isArray(db.virtualAccounts)) {
        db.virtualAccounts = db.virtualAccounts.filter((v: any) => v.userId !== targetUid && v.userId !== targetId && v.user_id !== targetUid && v.user_id !== targetId);
        modified = true;
      }
      if (Array.isArray(db.passkeys)) {
        db.passkeys = db.passkeys.filter((p: any) => p.userId !== targetUid && p.userId !== targetId && p.user_id !== targetUid && p.user_id !== targetId);
        modified = true;
      }
      if (Array.isArray(db.admin_users)) {
        db.admin_users = db.admin_users.filter((a: any) => a.uid !== targetUid && a.uid !== targetId && (!targetEmail || a.email?.toLowerCase().trim() !== targetEmail));
        modified = true;
      }
      if (Array.isArray(db.transactions)) {
        db.transactions = db.transactions.filter((t: any) => t.userId !== targetUid && t.userId !== targetId && (!targetEmail || t.userEmail?.toLowerCase().trim() !== targetEmail));
        modified = true;
      }
      if (Array.isArray(db.notifications)) {
        db.notifications = db.notifications.filter((n: any) => n.userId !== targetUid && n.userId !== targetId && (!targetEmail || n.userEmail?.toLowerCase().trim() !== targetEmail));
        modified = true;
      }
      if (modified) {
        writeDB(db);
      }
    }
  } catch (err) {
    console.warn("[usersStore] db.json sync delete error:", err);
  }

  return true;
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

export async function getVirtualAccountByNumber(accountNumber: string): Promise<any | null> {
  if (!accountNumber) return null;
  const clean = String(accountNumber).replace(/\D/g, "");
  try {
    const res = await executeTurso(
      `SELECT * FROM user_virtual_accounts WHERE account_number = ? OR account_number LIKE ? LIMIT 1;`,
      [clean, `%${clean}%`]
    );
    return res.rows?.[0] || null;
  } catch (err) {
    return null;
  }
}

export async function getVirtualAccountByReference(reference: string): Promise<any | null> {
  if (!reference) return null;
  try {
    const res = await executeTurso(
      `SELECT * FROM user_virtual_accounts WHERE reference = ? OR reference LIKE ? LIMIT 1;`,
      [reference, `%${reference}%`]
    );
    return res.rows?.[0] || null;
  } catch (err) {
    return null;
  }
}

export const usersStore = {
  getAllUsers,
  getUserByUid,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  ensureUserExists,
  updateUser,
  deleteUser,
  seedUsersIfEmpty,
  getVirtualAccountByNumber,
  getVirtualAccountByReference,
};

export default usersStore;
