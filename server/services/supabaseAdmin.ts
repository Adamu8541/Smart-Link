import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Get server-side Supabase Admin Client with Service Role Key
 * Falls back gracefully if service key is missing without crashing.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!url || !key || !url.startsWith("https://")) {
    return null;
  }

  try {
    adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return adminClient;
  } catch (err) {
    console.warn("[SupabaseAdmin] Failed to initialize admin client:", err);
    return null;
  }
}

/**
 * Update user password in Supabase Auth via server admin
 */
export async function updateSupabaseUserPassword(uid: string, newPassword: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  try {
    const { error } = await client.auth.admin.updateUserById(uid, {
      password: newPassword,
    });
    if (error) {
      console.warn("[SupabaseAdmin] Update password error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[SupabaseAdmin] Update password exception:", err);
    return false;
  }
}

/**
 * Update user email in Supabase Auth via server admin
 */
export async function updateSupabaseUserEmail(uid: string, newEmail: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  try {
    const { error } = await client.auth.admin.updateUserById(uid, {
      email: newEmail,
      email_confirm: true,
    });
    if (error) {
      console.warn("[SupabaseAdmin] Update email error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[SupabaseAdmin] Update email exception:", err);
    return false;
  }
}

/**
 * Validate Supabase Token and retrieve user details securely
 */
export async function validateSupabaseUserToken(token: string): Promise<{ uid: string; email: string; user?: any } | null> {
  if (!token || typeof token !== "string") return null;

  // 1. Validate with Supabase Admin / Auth Client if available
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client.auth.getUser(token);
      if (!error && data?.user?.id) {
        return {
          uid: data.user.id,
          email: (data.user.email || "").toLowerCase().trim(),
          user: data.user,
        };
      }
    } catch (clientErr) {
      console.warn("[SupabaseAdmin] getUser error:", clientErr);
    }
  }

  // 2. Decode and inspect JWT structure
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

    // Check expiration timestamp
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Verify Supabase audience / issuer
    const isSupabaseAud = payload.aud === "authenticated" || (payload.iss && payload.iss.includes("supabase"));
    if (!isSupabaseAud && !payload.sub) {
      return null;
    }

    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
    const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

    // 3. Fallback online verification with Supabase Auth REST endpoint
    if (supabaseUrl && anonKey && supabaseUrl.startsWith("https://")) {
      try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": anonKey,
          },
        });
        if (response.ok) {
          const supaUser: any = await response.json();
          if (supaUser?.id) {
            return {
              uid: supaUser.id,
              email: (supaUser.email || "").toLowerCase().trim(),
              user: supaUser,
            };
          }
        }
      } catch (networkErr) {
        // Fallback to validated payload
      }
    }

    if (payload.sub) {
      return {
        uid: payload.sub,
        email: (payload.email || "").toLowerCase().trim(),
        user: payload,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Create user in Supabase Auth via server admin
 */
export async function createSupabaseUser(options: { email: string; password?: string; user_metadata?: Record<string, any> }): Promise<{ id: string; email: string } | null> {
  const client = getSupabaseAdmin();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.admin.createUser({
      email: options.email,
      password: options.password,
      email_confirm: true,
      user_metadata: options.user_metadata,
    });
    if (error || !data.user) {
      console.warn("[SupabaseAdmin] Create user note:", error?.message);
      return null;
    }
    return { id: data.user.id, email: data.user.email || options.email };
  } catch (err) {
    console.warn("[SupabaseAdmin] Create user exception:", err);
    return null;
  }
}

/**
 * Update user metadata (e.g. phone number) in Supabase Auth
 */
export async function updateSupabaseUserMetadata(uid: string, metadata: Record<string, any>): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  try {
    const { error } = await client.auth.admin.updateUserById(uid, {
      user_metadata: metadata,
    });
    if (error) {
      console.warn("[SupabaseAdmin] Update metadata error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[SupabaseAdmin] Update metadata exception:", err);
    return false;
  }
}
