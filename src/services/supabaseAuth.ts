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

import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { UserRole } from "../types";
import {
  SensitiveActionPurpose,
  OtpRequestResponse,
  OtpVerifyAndChangePayload,
  OtpVerifyResponse,
  StepUpVerifyPayload,
  StepUpVerifyResponse,
} from "../types/auth";

// Public Environment Variables (Browser-safe anon key only)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("placeholder")
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
          flowType: "pkce", // High security PKCE flow for web clients
        },
      });
    } catch (err) {
      console.error("[SupabaseAuth] Failed to initialize Supabase client:", err);
      return null;
    }
  }
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
  error?: string;
}

export class SupabaseAuthService {
  /**
   * Get active Supabase client or throw informative error
   */
  private static getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) {
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
    const client = this.getClient();
    const cleanEmail = payload.email.toLowerCase().trim();
    const redirectUrl = payload.redirectTo || `${window.location.origin}/verify-email`;

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: payload.fullName.trim(),
          phone_number: payload.phoneNumber.trim(),
          referral_code: payload.referralCode?.trim() || "",
          role: UserRole.CUSTOMER, // Default role strictly Customer (prevents client escalation)
        },
      },
    });

    if (error) {
      throw error;
    }

    // Determine if confirmation email was dispatched
    const user = data.user;
    const session = data.session;
    const needsEmailConfirmation = !user?.email_confirmed_at;

    return {
      user,
      session,
      needsEmailConfirmation,
    };
  }

  /**
   * Sign in with Email and Password
   * Enforces email confirmation verification check
   */
  static async signIn(email: string, password: string): Promise<SupabaseLoginResult> {
    const client = this.getClient();
    const cleanEmail = email.toLowerCase().trim();

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    const session = data.session;
    const isEmailVerified = Boolean(user?.email_confirmed_at);

    return {
      user,
      session,
      isEmailVerified,
    };
  }

  /**
   * Sign out the active session
   */
  static async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const client = this.getClient();
    const { error } = await client.auth.signOut();
    if (error) {
      console.warn("[SupabaseAuth] Sign out note:", error.message);
    }
  }

  /**
   * Send Password Recovery Email via Supabase
   */
  static async resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
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
    const client = this.getClient();
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
    const client = this.getClient();
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
    if (!isSupabaseConfigured) return null;
    try {
      const client = this.getClient();
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
    if (!isSupabaseConfigured) return null;
    try {
      const client = this.getClient();
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
    const client = this.getClient();
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
    const client = this.getClient();
    return client.auth.onAuthStateChange(callback);
  }

  // =========================================================================
  // ARCHITECTURE EXTENSION HOOKS FOR FUTURE PHASES (Zero Breaking Changes)
  // =========================================================================

  /**
   * Phase 2 Future Hook: Email OTP for sensitive account changes (e.g. wallet withdrawal, password update)
   */
  static async verifyEmailOtpForAction(email: string, token: string, type: "email_change" | "recovery" = "recovery") {
    const client = this.getClient();
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
    const client = this.getClient();
    return client.auth.mfa.enroll({
      factorType: "totp",
      issuer,
    });
  }

  /**
   * Phase 2 Future Hook: TOTP MFA challenge verification
   */
  static async verifyTotpMfa(factorId: string, code: string) {
    const client = this.getClient();
    const challenge = await client.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;
    return client.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
  }

  /**
   * Request 6-digit Email OTP for sensitive account change
   */
  static async requestSensitiveActionOtp(
    purpose: SensitiveActionPurpose,
    targetValue?: string
  ): Promise<OtpRequestResponse> {
    const session = await this.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers,
      body: JSON.stringify({
        purpose,
        targetValue,
        userId: session?.user?.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to request verification code.");
    }
    return data;
  }

  /**
   * Verify 6-digit Email OTP and complete sensitive account change
   */
  static async verifySensitiveActionOtp(
    payload: OtpVerifyAndChangePayload
  ): Promise<OtpVerifyResponse> {
    const session = await this.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/auth/otp/verify-and-change", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...payload,
        userId: session?.user?.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to verify code and apply changes.");
    }

    // If password was changed and active Supabase session exists, update client session
    if (payload.purpose === "CHANGE_PASSWORD" && payload.payload.newPassword && this.isConfigured) {
      try {
        await this.getClient().auth.updateUser({
          password: payload.payload.newPassword,
        });
      } catch (clientSyncErr) {
        console.warn("[SupabaseAuth] Client session password sync note:", clientSyncErr);
      }
    }

    return data;
  }

  /**
   * Get current authenticated user profile
   */
  static async getProfile(): Promise<User | null> {
    const client = getSupabaseClient();
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
