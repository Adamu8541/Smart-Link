import * as usersStore from "../../src/services/usersStore";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { readDB } from "../db";

export interface RecipientUser {
  email: string;
  name: string;
  walletBalance?: number;
  isVerified?: boolean;
  createdAt?: string;
  source: "turso" | "supabase" | "firebase" | "json";
}

export async function getAllPlatformRecipients(): Promise<RecipientUser[]> {
  const recipientMap = new Map<string, RecipientUser>();
  
  // Turso Users
  try {
    const tursoUsers = await usersStore.getAllUsers();
    console.log("[DEBUG] Turso users fetched:", Array.isArray(tursoUsers) ? tursoUsers.length : "Not array");
    if (Array.isArray(tursoUsers)) {
      for (const u of tursoUsers) {
        const email = (u.email || "").toLowerCase().trim();
        if (email && email.includes("@")) {
          recipientMap.set(email, {
            email,
            name: u.fullName || u.name || u.username || email.split("@")[0],
            walletBalance: Number(u.walletBalance || u.balance || 0),
            isVerified: Boolean(u.isKycVerified || u.isVerified),
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
            source: "turso",
          });
        }
      }
    }
  } catch (err) {
    console.warn("[EmailRecipientService] Failed to fetch Turso users:", err);
  }

  // Supabase Users
  try {
    const supaAdmin = getSupabaseAdmin();
    console.log("[DEBUG] SupaAdmin available:", !!supaAdmin);
    if (supaAdmin) {
      const { data, error } = await supaAdmin.auth.admin.listUsers();
      console.log("[DEBUG] Supabase users fetched:", data?.users ? data.users.length : "None", error ? error : "No error");
      if (!error && data?.users) {
        for (const supaUser of data.users) {
          const email = (supaUser.email || "").toLowerCase().trim();
          if (email && email.includes("@") && !recipientMap.has(email)) {
            const metadata = supaUser.user_metadata || {};
            recipientMap.set(email, {
              email,
              name: metadata.full_name || metadata.name || email.split("@")[0],
              walletBalance: Number(metadata.wallet_balance || 0),
              isVerified: Boolean(supaUser.email_confirmed_at),
              createdAt: supaUser.created_at || new Date().toISOString(),
              source: "supabase",
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("[EmailRecipientService] Failed to fetch Supabase users:", err);
  }

  // JSON DB Users (Fallback)
  try {
    const db = readDB();
    const jsonUsers = db.users || db.registered_users || [];
    console.log("[DEBUG] JSON DB users fetched:", Array.isArray(jsonUsers) ? jsonUsers.length : "Not array");
    if (Array.isArray(jsonUsers)) {
      for (const u of jsonUsers) {
        const email = (u.email || "").toLowerCase().trim();
        if (email && email.includes("@") && !recipientMap.has(email)) {
          recipientMap.set(email, {
            email,
            name: u.fullName || u.name || email.split("@")[0],
            walletBalance: Number(u.walletBalance || 0),
            isVerified: Boolean(u.isVerified || u.isKycVerified),
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
            source: "json",
          });
        }
      }
    }
  } catch (err) {
    console.warn("[EmailRecipientService] Failed to fetch JSON DB users:", err);
  }

  console.log("[DEBUG] Total unique recipients found:", recipientMap.size);
  return Array.from(recipientMap.values());
}

export async function getFilteredRecipients(criteria: {
  mode: "all" | "selective" | "individual";
  selectedEmails?: string[];
  filterType?: "all" | "new_7_days" | "new_30_days" | "verified" | "unverified" | "has_balance" | "inactive";
}): Promise<RecipientUser[]> {
  const allRecipients = await getAllPlatformRecipients();
  const unsubscribedSet = new Set<string>();
  
  try {
    const supaAdmin = getSupabaseAdmin();
    if (supaAdmin) {
      const { data, error } = await supaAdmin.from("email_unsubscribes").select("email");
      if (!error && data) {
        for (const row of data) {
          if (row.email) unsubscribedSet.add(row.email.toLowerCase().trim());
        }
      }
    }
  } catch (err) {
    console.warn("[EmailRecipientService] Failed to fetch unsubscribes:", err);
    const db = readDB();
    if (Array.isArray(db.email_unsubscribes)) {
      for (const item of db.email_unsubscribes) {
        if (item.email) unsubscribedSet.add(item.email.toLowerCase().trim());
      }
    }
  }

  const validRecipients = allRecipients.filter((u) => {
    const email = u.email.toLowerCase().trim();
    if (!email || !email.includes("@")) return false;
    if (unsubscribedSet.has(email)) return false;
    return true;
  });

  if (criteria.mode === "individual" || criteria.mode === "selective") {
    const targetSet = new Set((criteria.selectedEmails || []).map((e) => e.toLowerCase().trim()));
    return validRecipients.filter((u) => targetSet.has(u.email.toLowerCase().trim()));
  }

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return validRecipients.filter((u) => {
    const createdTime = u.createdAt ? new Date(u.createdAt).getTime() : now;
    const ageDays = (now - createdTime) / ONE_DAY;
    switch (criteria.filterType) {
      case "new_7_days":
        return ageDays <= 7;
      case "new_30_days":
        return ageDays <= 30;
      case "verified":
        return u.isVerified === true;
      case "unverified":
        return u.isVerified !== true;
      case "has_balance":
        return (u.walletBalance || 0) > 0;
      case "inactive":
        return ageDays > 60;
      case "all":
      default:
        return true;
    }
  });
}
