/**
 * SmartLink Nigeria — Centralized Authentication Context
 * Unifies Supabase Auth with existing user session management and Firebase compatibility.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UserProfile, UserRole } from "../types";
import { SupabaseAuthService, isSupabaseConfigured, SupabaseRegistrationPayload } from "../services/supabaseAuth";
import { safeFetchJson } from "../utils/authErrorHandler";
import { User as SupaUser, Session as SupaSession } from "@supabase/supabase-js";

interface AuthContextType {
  currentUser: UserProfile | null;
  supabaseUser: SupaUser | null;
  session: SupaSession | null;
  loading: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  authProvider: "supabase" | "local" | null;
  isSupabaseActive: boolean;
  loginWithSupabase: (email: string, password: string) => Promise<{ user: UserProfile; isVerified: boolean }>;
  registerWithSupabase: (payload: SupabaseRegistrationPayload) => Promise<{ needsConfirmation: boolean; user: any }>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem("smart_link_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [supabaseUser, setSupabaseUser] = useState<SupaUser | null>(null);
  const [session, setSession] = useState<SupaSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authProvider, setAuthProvider] = useState<"supabase" | "local" | null>(null);

  const isEmailVerified = Boolean(
    currentUser?.isVerified ||
    supabaseUser?.email_confirmed_at ||
    (supabaseUser as any)?.confirmed_at
  );

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUB_ADMIN;

  /**
   * Synchronize Supabase user with backend database
   */
  const syncSupabaseUserWithBackend = useCallback(async (supaUser: SupaUser, userSession?: SupaSession | null): Promise<UserProfile | null> => {
    try {
      const email = (supaUser.email || "").toLowerCase().trim();
      const metadata = supaUser.user_metadata || {};
      const fullName = metadata.full_name || email.split("@")[0] || "Smart Link User";
      const phoneNumber = metadata.phone_number || "";
      const referralCode = metadata.referral_code || "";
      const isVerified = Boolean(supaUser.email_confirmed_at || (supaUser as any).confirmed_at);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession?.access_token) {
        headers["Authorization"] = `Bearer ${userSession.access_token}`;
      }

      const res = await safeFetchJson("/api/auth/sync-supabase-user", {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: supaUser.id,
          uid: supaUser.id,
          email,
          fullName,
          phoneNumber,
          referralCode,
          isVerified,
        }),
      });

      if (res.ok && res.data?.user) {
        const syncdUser: UserProfile = res.data.user;
        setCurrentUser(syncdUser);
        localStorage.setItem("smart_link_user", JSON.stringify(syncdUser));
        return syncdUser;
      }
    } catch (err) {
      console.warn("[AuthContext] Sync Supabase user note:", err);
    }
    return null;
  }, []);

  /**
   * Initial mount: Detect Supabase session, handle URL hash tokens, or fall back to Firebase
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          // 1. Check for URL hash tokens (from verification link redirect or password reset redirect)
          const hash = window.location.hash;
          if (hash && hash.includes("access_token=")) {
            try {
              const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
              const accessToken = hashParams.get("access_token");
              const refreshToken = hashParams.get("refresh_token");
              const type = hashParams.get("type");

              if (accessToken && refreshToken) {
                const supaSession = await SupabaseAuthService.setSession(accessToken, refreshToken);
                if (supaSession?.user && isMounted) {
                  setSession(supaSession);
                  setSupabaseUser(supaSession.user);
                  setAuthProvider("supabase");
                  await syncSupabaseUserWithBackend(supaSession.user, supaSession);

                  // Clear sensitive hash fragments from URL without page reload
                  window.history.replaceState(null, "", window.location.pathname + window.location.search);
                }
              }
            } catch (hashErr) {
              console.warn("[AuthContext] Hash token parse note:", hashErr);
            }
          }

          // 2. Fetch existing Supabase session
          const currentSession = await SupabaseAuthService.getSession();
          if (currentSession?.user && isMounted) {
            setSession(currentSession);
            setSupabaseUser(currentSession.user);
            setAuthProvider("supabase");
            await syncSupabaseUserWithBackend(currentSession.user, currentSession);
          }

          // 3. Listen for Supabase auth state changes
          const { data: subData } = SupabaseAuthService.onAuthStateChange(async (event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
            setSupabaseUser(newSession?.user || null);

            if (newSession?.user) {
              setAuthProvider("supabase");
              await syncSupabaseUserWithBackend(newSession.user, newSession);
            } else if (event === "SIGNED_OUT") {
              setAuthProvider(null);
              setCurrentUser(null);
              localStorage.removeItem("smart_link_user");
            }
          });

          if (currentSession?.user) {
            if (isMounted) setLoading(false);
            return () => {
              isMounted = false;
              subData?.subscription?.unsubscribe?.();
            };
          }
        }
      } catch (err) {
        console.error("[AuthContext] Initialization error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [syncSupabaseUserWithBackend]);

  /**
   * Log in using Supabase Auth
   */
  const loginWithSupabase = async (email: string, password: string): Promise<{ user: UserProfile; isVerified: boolean }> => {
    const result = await SupabaseAuthService.signIn(email, password);
    if (!result.user) {
      throw new Error("Supabase authentication returned no user.");
    }

    setSupabaseUser(result.user);
    setSession(result.session);
    setAuthProvider("supabase");

    const syncd = await syncSupabaseUserWithBackend(result.user, result.session);
    const resolvedUser: UserProfile = syncd || {
      uid: result.user.id,
      email: result.user.email || email,
      fullName: result.user.user_metadata?.full_name || email.split("@")[0] || "Smart Link User",
      phoneNumber: result.user.user_metadata?.phone_number || "",
      role: UserRole.CUSTOMER,
      walletBalance: 0.0,
      referralCode: result.user.user_metadata?.referral_code || "SL" + Math.floor(1000 + Math.random() * 9000),
      isVerified: result.isEmailVerified,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(resolvedUser);
    localStorage.setItem("smart_link_user", JSON.stringify(resolvedUser));

    return {
      user: resolvedUser,
      isVerified: result.isEmailVerified,
    };
  };

  /**
   * Register with Supabase Auth (Dispatches verification link email)
   */
  const registerWithSupabase = async (payload: SupabaseRegistrationPayload) => {
    const res = await SupabaseAuthService.signUp(payload);
    return {
      needsConfirmation: res.needsEmailConfirmation,
      user: res.user,
    };
  };

  /**
   * Sign out of all providers cleanly
   */
  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await SupabaseAuthService.signOut();
      }
    } catch (err) {
      console.warn("[AuthContext] Logout cleanup note:", err);
    } finally {
      setCurrentUser(null);
      setSupabaseUser(null);
      setSession(null);
      setAuthProvider(null);
      localStorage.removeItem("smart_link_user");
      sessionStorage.removeItem("smart_link_admin_session");
    }
  };

  /**
   * Resend signup verification link
   */
  const resendVerification = async (email: string) => {
    return SupabaseAuthService.resendVerificationEmail(email);
  };

  /**
   * Refresh current user profile from server
   */
  const refreshUser = async () => {
    if (!currentUser?.uid) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await safeFetchJson(`/api/auth/profile?uid=${encodeURIComponent(currentUser.uid)}`, { headers });
      if (res.ok && res.data?.user) {
        setCurrentUser(res.data.user);
        localStorage.setItem("smart_link_user", JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.warn("[AuthContext] Refresh user note:", e);
    }
  };

  const value: AuthContextType = {
    currentUser,
    supabaseUser,
    session,
    loading,
    isEmailVerified,
    isAdmin,
    isSuperAdmin,
    authProvider,
    isSupabaseActive: isSupabaseConfigured,
    loginWithSupabase,
    registerWithSupabase,
    logout,
    resendVerification,
    refreshUser,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
