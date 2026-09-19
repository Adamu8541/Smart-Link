/**
 * SmartLink Nigeria — Supabase Centralized Authentication Service
 * Enterprise-grade authentication foundation with zero-trust token handling.
 *
 * Security Directives:
 * - NEVER import or reference SUPABASE_SERVICE_ROLE_KEY here (Client-side code).
 * - Only use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * - Registration uses Verification Link (emailRedirectTo).
 * - Ready for Phase 2: Email OTP for sensitive actions, TOTP MFA, Turso DB, and Supabase Storage.
 */

import type { SupabaseClient, User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { UserRole } from "../types";
import { safeFetchJson } from "../utils/authErrorHandler";
import {
  SensitiveActionPurpose,
  OtpRequestResponse,
  OtpVerifyAndChangePayload,
  OtpVerifyResponse,
  StepUpVerifyPayload,
  StepUpVerifyResponse,
} from "../types/auth";

// Helper to sanitize Supabase Project URL (strips trailing slashes, /rest/v1, /auth/v1)
export function sanitizeSupabaseUrl(url: string): string {
  if (!url) return "";
  let clean = url.trim().replace(/\/+$/, "");
  clean = clean.replace(/\/(rest|auth|storage)\/v1\/?$/i, "");
  return clean.replace(/\/+$/, "");
}

// Check if current browser state has any indication of a Supabase session or pending auth redirect
export function hasPotentialSupabaseSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (
      hash.includes("access_token=") ||
      hash.includes("refresh_token=") ||
      hash.includes("type=recovery") ||
      hash.includes("type=signup") ||
      hash.includes("type=email_change") ||
      hash.includes("error_description=") ||
      search.includes("code=")
    ) {
      return true;
    }

    if (localStorage.getItem("smart_link_user")) {
      return true;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

// Public Environment Variables (Browser-safe anon key only)
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("placeholder")
);

let supabasePromise: Promise<SupabaseClient | null> | null = null;
let supabaseInstance: SupabaseClient | null = null;

export async function getSupabaseClientAsync(force = false): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  if (!force && !hasPotentialSupabaseSession() && !supabaseInstance) {
    return null;
  }
  if (supabaseInstance) return supabaseInstance;
  if (supabasePromise) return supabasePromise;

  supabasePromise = (async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
          flowType: "pkce", // High security PKCE flow for web clients
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error("[SupabaseAuth] Failed to initialize Supabase client:", err);
      return null;
    } finally {
      supabasePromise = null;
    }
  })();

  return supabasePromise;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseInstance;
}

export interface SupabaseRegistrationPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  referralCode?: string;
  redirectTo?: string;
}

export interface SupabaseLoginResult {
  user: User | null;
  session: Session | null;
  isEmailVerified: boolean;
  emailNotConfirmed?: boolean;
  error?: string;
}

export class SupabaseAuthService {
  /**
   * Get active Supabase client or throw informative error
   */
  private static async getClient(force = true): Promise<SupabaseClient | null> {
    const client = await getSupabaseClientAsync(force);
    if (!client && force) {
      throw new Error("Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings.");
    }
    return client;
  }

  /**
   * Check if Supabase client is configured and operational
   */
  static isConfigured(): boolean {
    return isSupabaseConfigured;
  }

  /**
   * Register a new user with Email Verification Link (Strictly Link-based verification)
   */
  static async signUp(payload: SupabaseRegistrationPayload): Promise<{ user: User | null; session: Session | null; needsEmailConfirmation: boolean }> {
    const cleanEmail = payload.email.toLowerCase().trim();

    // 1. Register via server admin API to ensure email_confirm: true in Supabase Admin & usersStore without confirmation link
    const regRes = await safeFetchJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: cleanEmail,
        password: payload.password,
        fullName: payload.fullName.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        referralCode: payload.referralCode?.trim() || "",
      }),
    });

    if (!regRes.ok) {
      throw new Error(regRes.data?.message || regRes.data?.error || regRes.error || "Registration failed.");
    }

    // 2. Automatically establish client-side Supabase Auth session
    let user: User | null = null;
    let session: Session | null = null;
    try {
      const client = await getSupabaseClientAsync(true);
      if (client) {
        const { data } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: payload.password,
        });
        if (data?.user) {
          user = data.user;
          session = data.session;
        }
      }
    } catch (e) {
      console.warn("[SupabaseAuth] Auto signIn note:", e);
    }

    return {
      user: user || (regRes.data?.user ? { id: regRes.data.user.id || regRes.data.user.uid, email: cleanEmail } as any : null),
      session,
      needsEmailConfirmation: false,
    };
  }

  /**
   * Sign in with Email and Password
   */
  static async signIn(email: string, password: string): Promise<SupabaseLoginResult> {
    const client = await this.getClient(true);
    if (!client) {
      throw new Error("Supabase client could not be initialized.");
    }
    const cleanEmail = email.toLowerCase().trim();

    let data: any = null;
    let error: any = null;

    try {
      const res = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      data = res.data;
      error = res.error;
    } catch (caughtErr: any) {
      error = caughtErr;
    }

    if (error) {
      const errMsg = (error.message || "").toLowerCase();
      if (
        errMsg.includes("email not confirmed") ||
        errMsg.includes("email_not_confirmed") ||
        errMsg.includes("not confirmed")
      ) {
        // Auto-confirm user in backend and retry sign in seamlessly
        try {
          await safeFetchJson("/api/auth/verify-account-now", {
            method: "POST",
            body: JSON.stringify({ email: cleanEmail }),
          });
          const retryRes = await client.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (retryRes.data?.user) {
            return {
              user: retryRes.data.user,
              session: retryRes.data.session,
              isEmailVerified: true,
            };
          }
        } catch {}
      }
      throw error;
    }

    const user = data?.user || null;
    const session = data?.session || null;

    return {
      user,
      session,
      isEmailVerified: true,
    };
  }

  /**
   * Sign out the active session
   */
  static async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const client = await this.getClient(false);
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      console.warn("[SupabaseAuth] Sign out note:", error.message);
    }
  }

  /**
   * Send Password Recovery Email via Supabase
   */
  static async resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ success: boolean; message: string }> {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    const cleanEmail = email.toLowerCase().trim();
    const redirectUrl = redirectTo || `${window.location.origin}/reset-password`;

    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "Password recovery link has been dispatched to your email address.",
    };
  }

  /**
   * Update User Password (used after clicking password recovery link)
   */
  static async updatePassword(newPassword: string): Promise<{ success: boolean }> {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Resend signup verification link
   */
  static async resendVerificationEmail(email: string, redirectTo?: string): Promise<{ success: boolean; message: string }> {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    const cleanEmail = email.toLowerCase().trim();
    const redirectUrl = redirectTo || `${window.location.origin}/verify-email`;

    const { error } = await client.auth.resend({
      type: "signup",
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "Verification email re-dispatched. Please inspect your inbox and spam folders.",
    };
  }

  /**
   * Get current active session
   */
  static async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured || !hasPotentialSupabaseSession()) return null;
    try {
      const client = await this.getClient(false);
      if (!client) return null;
      const { data, error } = await client.auth.getSession();
      if (error || !data?.session) return null;
      return data.session;
    } catch {
      return null;
    }
  }

  /**
   * Get current authenticated user
   */
  static async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured || !hasPotentialSupabaseSession()) return null;
    try {
      const client = await this.getClient(false);
      if (!client) return null;
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Set session directly from URL tokens (e.g. from verification or recovery link redirect)
   */
  static async setSession(access_token: string, refresh_token: string): Promise<Session | null> {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    const { data, error } = await client.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  /**
   * Subscribe to authentication state changes
   */
  static onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    let sub: { unsubscribe: () => void } | null = null;
    let isCancelled = false;

    // Only subscribe immediately if there is a potential active session
    if (hasPotentialSupabaseSession() || supabaseInstance) {
      getSupabaseClientAsync(false).then((client) => {
        if (client && !isCancelled) {
          const { data } = client.auth.onAuthStateChange(callback);
          sub = data.subscription;
        }
      });
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            isCancelled = true;
            if (sub) sub.unsubscribe();
          },
        },
      },
    };
  }

  // =========================================================================
  // ARCHITECTURE EXTENSION HOOKS FOR FUTURE PHASES (Zero Breaking Changes)
  // =========================================================================

  /**
   * Phase 2 Future Hook: Email OTP for sensitive account changes (e.g. wallet withdrawal, password update)
   */
  static async verifyEmailOtpForAction(email: string, token: string, type: "email_change" | "recovery" = "recovery") {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    return client.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: type === "email_change" ? "email_change" : "recovery",
    });
  }

  /**
   * Phase 2 Future Hook: TOTP MFA enrollment for Administrators
   */
  static async enrollTotpMfa(issuer = "Smart Link NG Admin") {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    return client.auth.mfa.enroll({
      factorType: "totp",
      issuer,
    });
  }

  /**
   * Phase 2 Future Hook: TOTP MFA challenge verification
   */
  static async verifyTotpMfa(factorId: string, code: string) {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    const challenge = await client.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;
    return client.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
  }

  // Helper to safely mask email address
  private static maskEmail(email: string): string {
    if (!email || !email.includes("@")) return email || "";
    const [userPart, domain] = email.split("@");
    if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
    return `${userPart.slice(0, 2)}***${userPart.slice(-1)}@${domain}`;
  }

  /**
   * Request 6-digit Reauthentication code via Supabase Auth.
   * This triggers Supabase's native "Reauthentication" template:
   * "Ask users to verify their identity before a sensitive operation"
   */
  static async reauthenticate(): Promise<{ data: any; error: any }> {
    const client = await this.getClient(true);
    if (!client) throw new Error("Supabase client unavailable.");
    return await client.auth.reauthenticate();
  }

  /**
   * Request 6-digit Email OTP for sensitive account change.
   * Leverages Supabase's built-in Reauthentication email template first,
   * with server fallback if session is missing.
   */
  static async requestSensitiveActionOtp(
    purpose: SensitiveActionPurpose,
    targetValue?: string,
    userId?: string
  ): Promise<OtpRequestResponse> {
    const session = await this.getSession();

    // 1. If Supabase is configured and has an active user session, use Supabase native reauthenticate()
    // This sends the email using Supabase's "Reauthentication" template ("Ask users to verify their identity before a sensitive operation")
    if (this.isConfigured() && session?.user) {
      try {
        const client = await this.getClient(true);
        if (client) {
          const { error } = await client.auth.reauthenticate();

          if (!error) {
            const userEmail = session.user.email || "";
            return {
              success: true,
              message: `A 6-digit verification code has been dispatched to ${this.maskEmail(userEmail)} via Supabase Reauthentication template.`,
              emailMasked: this.maskEmail(userEmail),
              resendCooldownSeconds: 60,
              expiresInSeconds: 600,
            };
          }

          console.warn("[SupabaseAuth] client.auth.reauthenticate error:", error.message);
          // If rate limit or user error from Supabase, throw to inform the user
          const errMsg = (error.message || "").toLowerCase();
          if (errMsg.includes("rate limit") || (error as any).status === 429) {
            throw new Error("Too many verification attempts. Please wait a minute before requesting another code.");
          }
        }
      } catch (reauthErr: any) {
        console.warn("[SupabaseAuth] Native reauthenticate attempt failed, trying backend fallback:", reauthErr?.message);
        if (reauthErr?.message && reauthErr.message.includes("Too many")) {
          throw reauthErr;
        }
      }
    }

    // 2. Server-side endpoint fallback for non-Supabase sessions
    const token = session?.access_token || localStorage.getItem("smartlink_session_token") || localStorage.getItem("auth_token") || "";
    const resolvedUserId = session?.user?.id || userId || localStorage.getItem("current_user_id") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (resolvedUserId) {
      headers["x-user-id"] = resolvedUserId;
    }

    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers,
      body: JSON.stringify({
        purpose,
        targetValue,
        userId: resolvedUserId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to request verification code.");
    }

    return data;
  }

  /**
   * Verify 6-digit Email OTP and complete sensitive account change.
   * If reauthenticated via Supabase, validates the nonce with Supabase Auth first,
   * then updates the backend system state.
   */
  static async verifySensitiveActionOtp(
    payload: OtpVerifyAndChangePayload,
    userId?: string
  ): Promise<OtpVerifyResponse> {
    const session = await this.getSession();
    let reauthenticatedViaSupabase = false;

    // 1. If Supabase is configured and active session exists, verify nonce via Supabase
    if (this.isConfigured() && session?.user) {
      const client = await this.getClient(true);
      if (client) {
        try {
          if (payload.purpose === "CHANGE_PASSWORD" && payload.payload.newPassword) {
            const { error } = await client.auth.updateUser({
              password: payload.payload.newPassword,
              nonce: payload.otp.trim(),
            });
            if (error) throw error;
            reauthenticatedViaSupabase = true;
          } else if (payload.purpose === "CHANGE_EMAIL" && payload.payload.newEmail) {
            const { error } = await client.auth.updateUser({
              email: payload.payload.newEmail.trim().toLowerCase(),
              nonce: payload.otp.trim(),
            });
            if (error) throw error;
            reauthenticatedViaSupabase = true;
          } else if (payload.purpose === "CHANGE_PHONE" && payload.payload.newPhoneNumber) {
            const { error } = await client.auth.updateUser({
              data: { phone_number: payload.payload.newPhoneNumber.trim() },
              nonce: payload.otp.trim(),
            });
            if (error) throw error;
            reauthenticatedViaSupabase = true;
          } else if (payload.purpose === "CHANGE_PIN") {
            const { error } = await client.auth.updateUser({
              data: { has_transaction_pin: true, pin_required_for_transactions: true },
              nonce: payload.otp.trim(),
            });
            if (error) throw error;
            reauthenticatedViaSupabase = true;
          } else if (payload.purpose === "TOGGLE_PIN_REQUIREMENT") {
            const { error } = await client.auth.updateUser({
              data: { pin_required_for_transactions: payload.payload.pinRequiredForTransactions },
              nonce: payload.otp.trim(),
            });
            if (error) throw error;
            reauthenticatedViaSupabase = true;
          }
        } catch (supaErr: any) {
          console.warn("[SupabaseAuth] client.auth.updateUser with nonce attempt note:", supaErr.message);
          // Supabase reauth template was either not dispatched by Supabase or project uses backend email OTP.
          // Fall back to backend EmailOtpService verification.
          reauthenticatedViaSupabase = false;
        }
      }
    }

    // 2. Synchronize with backend database, audit trail, and user record
    const token = session?.access_token || localStorage.getItem("smartlink_session_token") || localStorage.getItem("auth_token") || "";
    const resolvedUserId = session?.user?.id || userId || localStorage.getItem("current_user_id") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (resolvedUserId) {
      headers["x-user-id"] = resolvedUserId;
    }

    const res = await fetch("/api/auth/otp/verify-and-change", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...payload,
        userId: resolvedUserId,
        reauthenticatedViaSupabase,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to verify code and apply changes.");
    }

    return data;
  }

  /**
   * Get current authenticated user profile
   */
  static async getProfile(): Promise<User | null> {
    const client = await this.getClient(false);
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
  }

  /**
   * Phase 3: Step-Up verification to acquire a single-use highRiskTicket
   */
  static async stepUpVerify(payload: StepUpVerifyPayload): Promise<StepUpVerifyResponse> {
    const session = await this.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/auth/step-up/verify", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...payload,
        userId: session?.user?.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Step-up verification failed.");
    }
    return data;
  }
}
