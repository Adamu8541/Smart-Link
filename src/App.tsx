/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import SmartLinkLandingPage from "./components/landing/SmartLinkLandingPage";
import HeroSection from "./components/HeroSection";
import ServicesGrid, { ServiceItem } from "./components/ServicesGrid";
import ServiceModal from "./components/ServiceModal";
import Dashboards from "./components/Dashboards";
import Marketplace from "./components/Marketplace";
import AIAutomationSuite from "./components/AIAutomationSuite";
import Navigation from "./components/Navigation";
import AdminLogin from "./components/admin/AdminLogin";
import AdminGuard from "./components/admin/AdminGuard";
import AdminDashboardOverview from "./components/admin/AdminDashboardOverview";
import AdminDashboardLayout from "./components/admin/layout/AdminDashboardLayout";
import AdminDashboardHome from "./components/admin/views/AdminDashboardHome";
import AdminPermissionsView from "./components/admin/views/AdminPermissionsView";
import { AdminUsersView } from "./components/admin/views/AdminUsersView";
import { AdminWalletView } from "./components/admin/views/AdminWalletView";
import { AdminTransactionsView } from "./components/admin/views/AdminTransactionsView";
import { AdminProvidersView } from "./components/admin/views/AdminProvidersView";
import ApiRequestBuilderView from "./components/admin/views/ApiRequestBuilderView";
import ApiResponseMapperView from "./components/admin/views/ApiResponseMapperView";
import { AdminSettingsView } from "./components/admin/views/AdminSettingsView";
import { AdminSupportView } from "./components/admin/views/AdminSupportView";
import { AdminNotificationsView } from "./components/admin/views/AdminNotificationsView";
import { UserSupportContainer } from "./components/support/UserSupportContainer";
import { UserNotificationCenter } from "./components/notification/UserNotificationCenter";
import { AdminSecurityView } from "./components/admin/views/AdminSecurityView";
import { AdminServicesView } from "./components/admin/views/AdminServicesView";
import { AdminReconciliationView } from "./components/admin/views/AdminReconciliationView";
import {
  AdminRefundsView,
  AdminReportsView,
  AdminSystemView,
} from "./components/admin/views/AdminPlaceholderViews";
import { AdminSession, getStoredAdminSession, clearAdminSession } from "./services/adminAuthTypes";
import { UserProfile, UserRole } from "./types";
import logoImg from "./assets/images/smartlink_logo_1785934050308.jpg";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Mail, Lock, Phone, Tag, UserRound, Check, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, LogOut, X } from "lucide-react";
import { SmartLinkLogoMark } from "./components/ui/SmartLinkLogoMark";
import { getFriendlyErrorMessage, safeFetchJson } from "./utils/authErrorHandler";
import { soundFx } from "./utils/audioEffects";
import { AuthFormSkeleton } from "./components/ui/AuthSkeleton";
import { ForgotPasswordView } from "./components/auth/ForgotPasswordView";
import { ResetPasswordView } from "./components/auth/ResetPasswordView";
import { VerifyEmailView } from "./components/auth/VerifyEmailView";
import { AuthActionHandler } from "./components/auth/AuthActionHandler";
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  isFirebaseConfigured,
  withTimeout
} from "./firebase";

interface PasswordStrength {
  score: number;
  label: string;
  colorClass: string;
  textColorClass: string;
  checks: {
    hasMinLength: boolean;
    hasLengthEight: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    hasMinLength: password.length >= 6,
    hasLengthEight: password.length >= 8,
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (checks.hasMinLength) score += 1;
  if (checks.hasLengthEight) score += 1;
  if (checks.hasDigit) score += 1;
  if (checks.hasSpecial) score += 1;

  let label = "Very Weak";
  let colorClass = "bg-red-500";
  let textColorClass = "text-red-500";

  if (score === 1) {
    label = "Weak";
    colorClass = "bg-red-400";
    textColorClass = "text-red-400";
  } else if (score === 2) {
    label = "Fair";
    colorClass = "bg-amber-500";
    textColorClass = "text-amber-500";
  } else if (score === 3) {
    label = "Strong";
    colorClass = "bg-teal-500";
    textColorClass = "text-teal-500";
  } else if (score === 4) {
    label = "Very Strong";
    colorClass = "bg-emerald-500";
    textColorClass = "text-emerald-500";
  }

  return { score, label, colorClass, textColorClass, checks };
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    try {
      const stored = localStorage.getItem("smart_link_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.uid) {
          return {
            "Content-Type": "application/json",
            "x-user-id": u.uid,
            "x-user-email": u.email || "",
          };
        }
      }
    } catch {}
    return { "Content-Type": "application/json" };
  }
  try {
    const idToken = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      "x-user-id": user.uid,
      "x-user-email": user.email || "",
    };
  } catch {
    return {
      "Content-Type": "application/json",
      "x-user-id": user.uid,
      "x-user-email": user.email || "",
    };
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("smart_link_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [currentView, setCurrentView] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === "/dashboard") return "DASHBOARD";
    if (path === "/services") return "SERVICES";
    if (path === "/marketplace") return "MARKETPLACE";
    if (path === "/admin/login" || path.startsWith("/admin")) return "ADMIN_DASHBOARD";
    return "HOME";
  });
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showServicesSummaryDropdown, setShowServicesSummaryDropdown] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Admin Session & RBAC State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getStoredAdminSession());
  const [adminSecuritySubRoute, setAdminSecuritySubRoute] = useState<string>("/admin/security");

  const routeToViewMap: Record<string, string> = {
    "/": "HOME",
    "/dashboard": "DASHBOARD",
    "/services": "SERVICES",
    "/marketplace": "MARKETPLACE",
    "/ai-automation": "AI_SUITE",
    "/support": "SUPPORT",
    "/notifications": "NOTIFICATIONS",
    "/admin/login": "ADMIN_LOGIN",
    "/admin/dashboard": "ADMIN_DASHBOARD",
    "/admin/users": "ADMIN_USERS",
    "/admin/wallet": "ADMIN_WALLET",
    "/admin/permissions": "ADMIN_PERMISSIONS",
    "/admin/services": "ADMIN_SERVICES",
    "/admin/providers": "ADMIN_PROVIDERS",
    "/admin/api-builder": "ADMIN_API_BUILDER",
    "/admin/response-mapper": "ADMIN_RESPONSE_MAPPER",
    "/admin/transactions": "ADMIN_TRANSACTIONS",
    "/admin/refunds": "ADMIN_REFUNDS",
    "/admin/reports": "ADMIN_REPORTS",
    "/admin/settings": "ADMIN_SETTINGS",
    "/admin/support": "ADMIN_SUPPORT",
    "/admin/security": "ADMIN_SECURITY",
    "/admin/security/audit-logs": "ADMIN_SECURITY",
    "/admin/security/login-history": "ADMIN_SECURITY",
    "/admin/security/blocked-users": "ADMIN_SECURITY",
    "/admin/security/blocked-devices": "ADMIN_SECURITY",
    "/admin/security/blocked-ip": "ADMIN_SECURITY",
    "/admin/security/suspicious-activity": "ADMIN_SECURITY",
    "/admin/security/session-management": "ADMIN_SECURITY",
    "/admin/security/alerts": "ADMIN_SECURITY",
    "/admin/system": "ADMIN_SYSTEM",
    "/admin/notifications": "ADMIN_NOTIFICATIONS",
    "/forgot-password": "FORGOT_PASSWORD",
    "/reset-password": "RESET_PASSWORD",
    "/verify-email": "VERIFY_EMAIL",
    "/auth/action": "AUTH_ACTION",
    "/__/auth/action": "AUTH_ACTION",
  };

  const viewToRouteMap: Record<string, string> = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    SERVICES: "/services",
    MARKETPLACE: "/marketplace",
    AI_SUITE: "/ai-automation",
    SUPPORT: "/support",
    NOTIFICATIONS: "/notifications",
    ADMIN_LOGIN: "/admin/login",
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_USERS: "/admin/users",
    ADMIN_WALLET: "/admin/wallet",
    ADMIN_SERVICES: "/admin/services",
    ADMIN_PROVIDERS: "/admin/providers",
    ADMIN_TRANSACTIONS: "/admin/transactions",
    ADMIN_REFUNDS: "/admin/refunds",
    ADMIN_REPORTS: "/admin/reports",
    ADMIN_SETTINGS: "/admin/settings",
    ADMIN_SUPPORT: "/admin/support",
    ADMIN_SECURITY: "/admin/security",
    ADMIN_SYSTEM: "/admin/system",
    ADMIN_NOTIFICATIONS: "/admin/notifications",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    AUTH_ACTION: "/auth/action",
  };

  const pendingNavigationRef = useRef<string | null>(null);

  const currentViewRef = useRef(currentView);
  const currentUserRef = useRef(currentUser);
  const adminSessionRef = useRef(adminSession);
  const selectedServiceRef = useRef(selectedService);

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { adminSessionRef.current = adminSession; }, [adminSession]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  const navigateToView = (view: string, replace: boolean = false) => {
    setCurrentView(view);
    const targetRoute = viewToRouteMap[view] || (view === "DASHBOARD" ? "/dashboard" : "/");
    try {
      const stateObj = { view, userUid: currentUser?.uid || null };
      if (replace) {
        window.history.replaceState(stateObj, document.title, targetRoute);
      } else {
        if (window.location.pathname !== targetRoute || window.history.state?.view !== view) {
          window.history.pushState(stateObj, document.title, targetRoute);
        }
      }
    } catch (e) {
      console.warn("Could not push history state:", e);
    }
  };

  // Dark mode state (persisting across the session)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return sessionStorage.getItem("smart_link_dark_mode") === "true";
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newVal = !prev;
      sessionStorage.setItem("smart_link_dark_mode", String(newVal));
      return newVal;
    });
  };

  // Authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessState, setAuthSuccessState] = useState<"login" | "register" | "recovery" | "reset" | null>(null);
  const [isAppInitializing, setIsAppInitializing] = useState(false);

  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regSurname, setRegSurname] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [regReferralCode, setRegReferralCode] = useState("");

  // Password recovery states
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);

  // Email verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Global toast state
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  // Site Settings state (theme, announcement, maintenance)
  const [siteSettings, setSiteSettings] = useState<any>({
    appName: "Smart Link Nigeria",
    tagline: "Unified Nigeria Digital Platform",
    announcement: "",
    maintenanceMode: false,
    ninFee: 500,
    bvnFee: 500,
    cacBaseFee: 15000,
  });

  useEffect(() => {
    safeFetchJson("/api/site/settings")
      .then((res) => {
        if (res.ok && res.data?.settings) {
          setSiteSettings((prev: any) => ({
            ...prev,
            ...res.data.settings,
          }));
        }
      })
      .catch(() => {
        // Quiet fallback
      });

    // Real-time Firestore sync for global service pricing
    const unsubPrices = onSnapshot(doc(db, "service_pricing", "global"), (snap) => {
      if (snap.exists()) {
        const pData = snap.data();
        setSiteSettings((prev: any) => ({
          ...prev,
          priceMatrix: pData,
          ninFee: pData.identityRates?.ninFee ?? prev?.ninFee,
          bvnFee: pData.identityRates?.bvnFee ?? prev?.bvnFee,
          cacBaseFee: pData.cacRates?.businessNameFee ?? prev?.cacBaseFee
        }));
      }
    }, (err) => {
      console.warn("Firestore client price sync note:", err);
    });

    return () => unsubPrices();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle browser back/forward navigation and URL routing
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If service modal is open, back button closes modal first
      if (selectedServiceRef.current) {
        setSelectedService(null);
        const currentRoute = viewToRouteMap[currentViewRef.current] || "/";
        try {
          window.history.pushState({ view: currentViewRef.current, userUid: currentUserRef.current?.uid }, document.title, currentRoute);
        } catch (err) {}
        return;
      }

      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      let targetView = e.state?.view || routeToViewMap[path] || "HOME";

      if (path === "/forgot-password") targetView = "FORGOT_PASSWORD";
      else if (path === "/reset-password") targetView = "RESET_PASSWORD";
      else if (path === "/verify-email") targetView = "VERIFY_EMAIL";
      else if (
        path.startsWith("/auth/action") ||
        path.startsWith("/__/auth/action") ||
        params.get("mode") ||
        (params.get("oobCode") && !path.includes("reset-password") && !path.includes("verify-email"))
      ) {
        targetView = "AUTH_ACTION";
      }

      const userIsSignedIn = Boolean(currentUserRef.current);
      const adminIsSignedIn = Boolean(adminSessionRef.current);

      const unauthenticatedViews = [
        "HOME",
        "ADMIN_LOGIN",
        "FORGOT_PASSWORD",
        "RESET_PASSWORD",
        "VERIFY_EMAIL",
        "AUTH_ACTION",
      ];

      const isNavigatingToUnauth = unauthenticatedViews.includes(targetView);

      // Prevent going back out of signed-in session without confirmation
      if ((userIsSignedIn || adminIsSignedIn) && isNavigatingToUnauth) {
        const currentViewVal = currentViewRef.current;
        const activeRoute = viewToRouteMap[currentViewVal] || (adminIsSignedIn ? "/admin/dashboard" : "/dashboard");

        try {
          window.history.pushState(
            { view: currentViewVal, userUid: currentUserRef.current?.uid || null },
            document.title,
            activeRoute
          );
        } catch (err) {
          console.warn("Failed to push history state on intercept:", err);
        }

        pendingNavigationRef.current = targetView;
        setShowLogoutModal(true);
        return;
      }

      // Normal in-session or logged-out back navigation
      setCurrentView(targetView);
    };

        const pathOnMount = window.location.pathname;
    const paramsOnMount = new URLSearchParams(window.location.search);
    let initialView = routeToViewMap[pathOnMount] || "HOME";

    if (
      pathOnMount.startsWith("/auth/action") ||
      pathOnMount.startsWith("/__/auth/action") ||
      paramsOnMount.get("mode") ||
      (paramsOnMount.get("oobCode") && !pathOnMount.includes("reset-password") && !pathOnMount.includes("verify-email"))
    ) {
      initialView = "AUTH_ACTION";
    }

    try {
      window.history.replaceState({ view: initialView, userUid: currentUser?.uid || null }, document.title, pathOnMount);
    } catch (e) {}

    window.addEventListener("popstate", handlePopState);

    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken") || params.get("token");
    if (token && window.location.pathname !== "/reset-password") {
      setRecoveryToken(token);
      setIsResetPassword(true);
      setIsRegistering(false);
      setCurrentView("DASHBOARD");
    }

    const verificationStatus = params.get("verificationStatus");
    const email = params.get("email");
    const msg = params.get("message");
    if (verificationStatus) {
      if (email) {
        setAuthEmail(email);
      }
      if (verificationStatus === "success") {
        setToast({
          message: msg || "Your email address is verified! You can now log in securely.",
          type: "success"
        });
        setIsVerifyingEmail(false);
        setVerificationEmail("");
      } else if (verificationStatus === "error") {
        setToast({
          message: msg || "Email verification failed. Please try again or request a new link.",
          type: "error"
        });
      }
      if (!params.get("oobCode") && !params.get("mode")) {
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Could not strip URL query params", e);
        }
      }
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Continuous Firebase Authentication & Firestore Synchronization Listener
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const email = (fbUser.email || "").toLowerCase().trim();
        const fullName = fbUser.displayName || email.split("@")[0] || "Smart Link User";
        const phone = fbUser.phoneNumber || "";

        try {
          // 1. Sync with server database / usersStore
          const syncRes = await safeFetchJson("/api/auth/sync-firebase-user", {
            method: "POST",
            body: JSON.stringify({
              uid: fbUser.uid,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              isVerified: true,
            }),
          });

          let userObj = syncRes.ok && syncRes.data?.user ? syncRes.data.user : null;

          if (!userObj) {
            userObj = {
              uid: fbUser.uid,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              role: UserRole.CUSTOMER,
              walletBalance: 0.0,
              referralCode: "SL" + Math.floor(1000 + Math.random() * 9000),
              isVerified: true,
              createdAt: new Date().toISOString(),
            };
          }

          // 2. Ensure Firestore users document is merged
          try {
            await setDoc(
              doc(db, "users", fbUser.uid),
              {
                uid: fbUser.uid,
                email: email,
                fullName: fullName,
                phoneNumber: phone || userObj.phoneNumber || "",
                isVerified: true,
                role: userObj.role || "CUSTOMER",
                walletBalance: userObj.walletBalance ?? 0.0,
                referralCode: userObj.referralCode || "SL" + Math.floor(1000 + Math.random() * 9000),
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (fsErr) {
            console.warn("[onAuthStateChanged] Firestore sync note:", fsErr);
          }

          setCurrentUser(userObj);
          localStorage.setItem("smart_link_user", JSON.stringify(userObj));

          // If on home/auth pages, route directly to DASHBOARD
          const currentPath = window.location.pathname;
          if (currentPath === "/dashboard" || currentPath === "/login" || currentPath === "/register") {
            navigateToView("DASHBOARD");
          }
        } catch (e) {
          console.warn("[onAuthStateChanged] Error syncing auth user:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Poll verification status in the background so the user is instantly logged in when verified in Firebase
  useEffect(() => {
    let intervalId: any;
    if (isVerifyingEmail && verificationEmail) {
      intervalId = setInterval(async () => {
        try {
          const currentUserObj = auth.currentUser;
          if (currentUserObj) {
            try {
              await reload(currentUserObj);
              if (currentUserObj.emailVerified) {
                try {
                  await updateDoc(doc(db, "users", currentUserObj.uid), { isVerified: true });
                } catch (e) {
                  // Ignore firestore status update warning
                }

                const syncRes = await fetch("/api/auth/sync-firebase-user", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    uid: currentUserObj.uid,
                    email: currentUserObj.email,
                    isVerified: true
                  })
                });
                if (syncRes.ok) {
                  const syncData = await syncRes.json();
                  setCurrentUser(syncData.user);
                  setCurrentView("DASHBOARD");
                  setIsVerifyingEmail(false);
                  setVerificationEmail("");
                  setToast({
                    message: "Email successfully verified via Firebase! Welcome to Smart Link Nigeria.",
                    type: "success"
                  });
                  return;
                }
              }
            } catch (fbErr) {
              // Ignore Firebase reload errors during polling
            }
          }

          const res = await fetch(`/api/auth/check-verification-status?email=${encodeURIComponent(verificationEmail)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.isVerified) {
            setCurrentUser(data.user);
            setCurrentView("DASHBOARD");
            setIsVerifyingEmail(false);
            setVerificationEmail("");
            setToast({
              message: "Email successfully verified! Welcome to your Smart Link Nigeria portal.",
              type: "success"
            });
          }
        } catch (err) {
          // Silent catch during transient dev server reconnects or offline states
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVerifyingEmail, verificationEmail]);

  // Redirect SERVICES and MARKETPLACE view to DASHBOARD if not logged in
  useEffect(() => {
    if ((currentView === "SERVICES" || currentView === "MARKETPLACE") && !currentUser) {
      setCurrentView("DASHBOARD");
    }
  }, [currentView, currentUser]);

  // Load profile details from server
  const fetchUserProfile = async (uid: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/auth/profile?uid=${uid}`, { headers });
      const data = await res.json();
      if (res.ok && data?.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error loading user profile", err);
    }
  };

  // Real-Time Webhook Credit Monitor & Wallet Balance Listeners
  const prevBalanceRef = useRef<number | null>(null);
  const prevUidRef = useRef<string | null>(null);

  // Listen for explicit wallet credit custom events (instant UI dispatch)
  useEffect(() => {
    const handleWalletCredited = (e: any) => {
      if (e?.detail?.amount) {
        const amount = Number(e.detail.amount);
        const gateway = e.detail.gateway || "Gateway Webhook";
        setToast({
          message: `💳 Real-Time Webhook Alert: ₦${amount.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} credited to your digital wallet via ${gateway}!`,
          type: "success",
        });
      }
    };
    window.addEventListener("wallet_credited", handleWalletCredited);
    return () => window.removeEventListener("wallet_credited", handleWalletCredited);
  }, []);

  // Monitor currentUser wallet balance changes for positive credits
  useEffect(() => {
    if (!currentUser?.uid) {
      prevBalanceRef.current = null;
      prevUidRef.current = null;
      return;
    }

    if (prevUidRef.current !== currentUser.uid) {
      prevUidRef.current = currentUser.uid;
      prevBalanceRef.current = currentUser.walletBalance;
      return;
    }

    if (prevBalanceRef.current !== null && currentUser.walletBalance > prevBalanceRef.current) {
      const creditedAmt = currentUser.walletBalance - prevBalanceRef.current;
      setToast({
        message: `⚡ Webhook Credit Alert: ₦${creditedAmt.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} has been credited to your wallet in real-time!`,
        type: "success",
      });
    }

    prevBalanceRef.current = currentUser.walletBalance;
  }, [currentUser?.walletBalance, currentUser?.uid]);

  // Real-time background poller (polls profile every 3s when logged in to catch incoming webhooks)
  useEffect(() => {
    if (!currentUser?.uid) return;

    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;

    const interval = setInterval(async () => {
      if (consecutiveFailures >= maxConsecutiveFailures) {
        clearInterval(interval);
        console.warn("[App poller] Paused background profile polling due to consecutive authentication or network errors.");
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/auth/profile?uid=${currentUser.uid}`, { headers });
        if (res.ok) {
          consecutiveFailures = 0;
          const data = await res.json();
          if (data?.user) {
            if (prevBalanceRef.current !== null && data.user.walletBalance > prevBalanceRef.current) {
              const creditedAmt = data.user.walletBalance - prevBalanceRef.current;
              setToast({
                message: `🎉 Real-Time Webhook Credit: ₦${creditedAmt.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} added to your digital wallet!`,
                type: "success",
              });
              prevBalanceRef.current = data.user.walletBalance;
              setCurrentUser(data.user);
            } else if (data.user.walletBalance !== currentUser.walletBalance) {
              prevBalanceRef.current = data.user.walletBalance;
              setCurrentUser(data.user);
            }
          }
        } else {
          consecutiveFailures++;
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.warn(`[App poller] Background poller encountered status ${res.status}. Stopping polling interval.`);
            clearInterval(interval);
          }
        }
      } catch (err) {
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.warn("[App poller] Background poller encountered consecutive network failures. Stopping polling interval.", err);
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, currentUser?.walletBalance]);

  // Direct login form submission using Firebase Authentication
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authEmail || !authPassword) {
      soundFx.playErrorSound();
      setAuthError("We couldn't sign you in. Please check your email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessState(null);

    try {
      let userCredential: any = null;
      let fbError: any = null;

      if (isFirebaseConfigured) {
        try {
          userCredential = await withTimeout(
            signInWithEmailAndPassword(auth, authEmail, authPassword),
            5000
          );
        } catch (err: any) {
          fbError = err;
          console.info("Firebase Auth sign-in bypassed or timed out, routing to fast server auth:", err?.message || err);
        }
      }

      let loginUser: any = null;

      if (userCredential?.user) {
        const user = userCredential.user;
        const userEmailLower = (user.email || "").toLowerCase().trim();

        updateDoc(doc(db, "users", user.uid), { isVerified: true }).catch(() => {});

        const syncResult = await safeFetchJson("/api/auth/sync-firebase-user", {
          method: "POST",
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            isVerified: true
          })
        });

        loginUser = syncResult.data?.user || {
          uid: user.uid,
          email: user.email || "",
          fullName: user.displayName || user.email?.split("@")[0] || "Member",
          phoneNumber: "",
          role: UserRole.CUSTOMER,
          walletBalance: 0.0,
          referralCode: "SL" + Math.floor(1000 + Math.random() * 9000),
          isVerified: true,
          createdAt: new Date().toISOString()
        };
      } else {
        // Fallback fast server auth call
        const apiRes = await safeFetchJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });

        if (apiRes.ok && apiRes.data?.user) {
          loginUser = apiRes.data.user;
        } else if (apiRes.error) {
          throw new Error(apiRes.error);
        } else {
          throw fbError || new Error("Authentication failed. Incorrect email address or password.");
        }
      }

      if (loginUser?.status === "SUSPENDED" || loginUser?.status === "INACTIVE" || loginUser?.status === "BLOCKED") {
        throw new Error("Your account has been strictly blocked or suspended by security administration. Access to the dashboard is denied.");
      }

      // Persist in localStorage
      localStorage.setItem("smart_link_user", JSON.stringify(loginUser));

      soundFx.playSuccessSound();
      setAuthSuccessState("login");

      setCurrentUser(loginUser);
      navigateToView("DASHBOARD");
      setAuthEmail("");
      setAuthPassword("");
      setAuthSuccessState(null);
      setToast({
        message: "Successfully authenticated! Welcome to your Smart Link Nigeria portal.",
        type: "success"
      });
    } catch (err: any) {
      soundFx.playErrorSound();
      const friendlyMsg = getFriendlyErrorMessage(err);
      setAuthError(friendlyMsg);
      setAuthPassword(""); // Reset password on error for security
    } finally {
      setAuthLoading(false);
    }
  };

  // Registration form submission using Firebase Authentication
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFirstName || regFirstName.trim() === "") {
      soundFx.playErrorSound();
      setAuthError("First Name is required and cannot be empty.");
      return;
    }

    if (!regSurname || regSurname.trim() === "") {
      soundFx.playErrorSound();
      setAuthError("Surname is required and cannot be empty.");
      return;
    }

    const computedFullName = `${regFirstName.trim()} ${regSurname.trim()}`.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail || !emailPattern.test(regEmail)) {
      soundFx.playErrorSound();
      setAuthError("Please provide a valid email address.");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      soundFx.playErrorSound();
      setAuthError("Password is too weak. Please choose a password with at least 6 characters.");
      return;
    }

    const phoneDigits = regPhoneNumber.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length !== 11 || !phoneDigits.startsWith("0")) {
      soundFx.playErrorSound();
      setAuthError("Phone number must be exactly 11 numeric digits and start with 0 (e.g. 08012345678).");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessState(null);

    try {
      let userCredential: any = null;
      let fbError: any = null;

      if (isFirebaseConfigured) {
        try {
          userCredential = await withTimeout(
            createUserWithEmailAndPassword(auth, regEmail, regPassword),
            5000
          );
        } catch (err: any) {
          fbError = err;
          if (err.code === "auth/email-already-in-use") {
            throw err;
          }
          console.info("Firebase Auth sign-up bypassed or timed out, routing to fast server auth:", err?.message || err);
        }
      }

      let activeUser: any = null;

      if (userCredential?.user) {
        const user = userCredential.user;
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: regEmail.toLowerCase(),
          firstName: regFirstName.trim(),
          surname: regSurname.trim(),
          lastName: regSurname.trim(),
          fullName: computedFullName,
          phoneNumber: regPhoneNumber,
          referralCode: regReferralCode || ("SL" + Math.floor(1000 + Math.random() * 9000)),
          isVerified: true,
          role: "CUSTOMER",
          walletBalance: 0.0,
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        const syncResult = await safeFetchJson("/api/auth/sync-firebase-user", {
          method: "POST",
          body: JSON.stringify({
            uid: user.uid,
            email: regEmail,
            firstName: regFirstName.trim(),
            surname: regSurname.trim(),
            fullName: computedFullName,
            phoneNumber: regPhoneNumber,
            referralCode: regReferralCode,
            isVerified: true
          })
        });

        if (!syncResult.ok) {
          throw new Error(syncResult.error || "Failed to register profile details.");
        }

        activeUser = syncResult.data?.user || {
          uid: user.uid,
          email: regEmail.toLowerCase(),
          firstName: regFirstName.trim(),
          surname: regSurname.trim(),
          lastName: regSurname.trim(),
          fullName: computedFullName,
          phoneNumber: regPhoneNumber,
          role: UserRole.CUSTOMER,
          walletBalance: 0.0,
          referralCode: regReferralCode || ("SL" + Math.floor(1000 + Math.random() * 9000)),
          isVerified: true,
          createdAt: new Date().toISOString()
        };
      } else {
        const apiRes = await safeFetchJson("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: regEmail,
            password: regPassword,
            firstName: regFirstName.trim(),
            surname: regSurname.trim(),
            fullName: computedFullName,
            phoneNumber: regPhoneNumber,
            referralCode: regReferralCode
          }),
        });

        if (!apiRes.ok || !apiRes.data?.user) {
          throw fbError || new Error(apiRes.error || "Registration rejected. Please check your details.");
        }

        activeUser = apiRes.data.user;

        // Sign in on Firebase Auth client if available
        if (isFirebaseConfigured) {
          try {
            await signInWithEmailAndPassword(auth, regEmail, regPassword);
          } catch {
            // ignore
          }
        }
      }

      // Persist in localStorage
      localStorage.setItem("smart_link_user", JSON.stringify(activeUser));

      soundFx.playSuccessSound();
      setAuthSuccessState("register");

      setCurrentUser(activeUser);
      navigateToView("DASHBOARD");
      setRegEmail("");
      setRegPassword("");
      setRegFirstName("");
      setRegSurname("");
      setRegPhoneNumber("");
      setRegRole(UserRole.CUSTOMER);
      setRegReferralCode("");
      setIsRegistering(false);
      setIsVerifyingEmail(false);
      setAuthSuccessState(null);
      setToast({
        message: "Account created successfully! Welcome to Smart Link Nigeria.",
        type: "success"
      });
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Check verification status on-demand
  const handleCheckVerificationStatus = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        await reload(currentUserObj);
        if (currentUserObj.emailVerified) {
          try {
            await updateDoc(doc(db, "users", currentUserObj.uid), { isVerified: true });
          } catch (e) {
            console.log("Firestore update status error", e);
          }

          const syncResult = await safeFetchJson("/api/auth/sync-firebase-user", {
            method: "POST",
            body: JSON.stringify({
              uid: currentUserObj.uid,
              email: currentUserObj.email,
              isVerified: true
            })
          });

          if (syncResult.data?.user) {
            setCurrentUser(syncResult.data.user);
            setCurrentView("DASHBOARD");
            setIsVerifyingEmail(false);
            setVerificationEmail("");
            soundFx.playSuccessSound();
            setToast({
              message: "Email verification confirmed! Welcome to Smart Link Nigeria.",
              type: "success"
            });
            return;
          }
        }
      }

      const res = await safeFetchJson(`/api/auth/check-verification-status?email=${encodeURIComponent(verificationEmail)}`);
      if (res.ok && res.data?.isVerified) {
        setCurrentUser(res.data.user);
        setCurrentView("DASHBOARD");
        setIsVerifyingEmail(false);
        setVerificationEmail("");
        soundFx.playSuccessSound();
        setToast({
          message: "Your email address is verified! Welcome to Smart Link Nigeria.",
          type: "success"
        });
      } else {
        soundFx.playErrorSound();
        setAuthError("Your email is not verified yet. Please open your inbox and click the verification link.");
        setToast({
          message: "Email address not verified yet. Please check your inbox.",
          type: "info"
        });
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Resend Verification Link handler using Firebase Authentication
  const handleResendVerification = async (targetEmail?: string) => {
    const emailToUse = typeof targetEmail === "string" && targetEmail ? targetEmail : verificationEmail;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        };
        await sendEmailVerification(currentUserObj, actionCodeSettings);
      } else {
        const res = await safeFetchJson("/api/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email: emailToUse }),
        });
        if (!res.ok) throw new Error(res.error || "Failed to resend verification link.");
      }

      soundFx.playSuccessSound();
      setToast({
        message: "A fresh Firebase verification email has been sent! Check your inbox and Spam folder.",
        type: "success"
      });
    } catch (err: any) {
      soundFx.playErrorSound();
      const errMsg = getFriendlyErrorMessage(err);
      setAuthError(errMsg);
      setToast({
        message: errMsg,
        type: "error"
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Instant manual activation fallback if email delivery is delayed
  const handleManualActivate = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const emailToUse = verificationEmail;
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        try {
          await updateDoc(doc(db, "users", currentUserObj.uid), { isVerified: true });
        } catch (e) {
          console.log("Firestore status update note", e);
        }
      }

      const res = await safeFetchJson("/api/auth/verify-account-now", {
        method: "POST",
        body: JSON.stringify({ email: emailToUse }),
      });
      if (!res.ok || !res.data?.user) throw new Error(res.error || "Failed to activate account.");

      soundFx.playSuccessSound();
      setCurrentUser(res.data.user);
      setCurrentView("DASHBOARD");
      setIsVerifyingEmail(false);
      setVerificationEmail("");
      setToast({
        message: "Account verified & activated! Welcome to Smart Link Nigeria.",
        type: "success"
      });
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setRecoverySuccessMessage(null);

    try {
      const res = await safeFetchJson("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: recoveryToken, password: newPassword }),
      });
      if (!res.ok) throw new Error(res.error || "Failed to reset password.");

      soundFx.playSuccessSound();
      setRecoverySuccessMessage(res.data?.message || "Your password has been reset successfully!");
      setRecoveryToken("");
      setNewPassword("");
      
      setIsResetPassword(false);
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    pendingNavigationRef.current = "HOME";
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    pendingNavigationRef.current = null;
  };

  const confirmLogout = () => {
    const destView = pendingNavigationRef.current || "HOME";
    pendingNavigationRef.current = null;

    if (isFirebaseConfigured) {
      signOut(auth).catch(() => {});
    }

    localStorage.removeItem("smart_link_user");
    setCurrentUser(null);
    if (adminSession) {
      clearAdminSession();
      setAdminSession(null);
    }

    setShowLogoutModal(false);
    setCurrentView(destView);

    const targetRoute = viewToRouteMap[destView] || "/";
    try {
      window.history.replaceState({ view: destView, userUid: null }, document.title, targetRoute);
    } catch (e) {
      console.warn("Could not update history on logout", e);
    }

    setToast({
      message: "You have been signed out successfully.",
      type: "info",
    });
  };

  const tokenClean = recoveryToken.trim();
  const isHex = /^[0-9a-fA-F]*$/.test(tokenClean);
  const isCorrectLength = tokenClean.length === 40;
  const isTokenValid = isHex && isCorrectLength;

  return (
    <div className={`min-h-screen bg-slate-50 transition-colors duration-300 ${isDarkMode ? "dark-theme-active" : ""} ${!currentUser ? "flex flex-col bg-white" : "flex flex-col lg:flex-row"}`}>
      {/* Full-screen non-interactive loading overlay */}
      {authLoading && (
        <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <SmartLinkLogoMark size="lg" color="#0F2D5C" animating={true} />
          <p className="text-sm font-semibold text-[#111827]">Processing, please wait...</p>
        </div>
      )}

      {/* Real-time Global Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
          >
            <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/30 text-rose-100"
                : "bg-slate-900/95 border-indigo-500/30 text-indigo-100"
            }`}>
              <div className="mt-0.5">
                {toast.type === "success" ? (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <SmartLinkLogoMark size="xs" color="#818CF8" animating={true} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold uppercase tracking-wider text-[10px] opacity-80">
                  {toast.type === "success" ? "Operation Successful" : toast.type === "error" ? "System Error Alert" : "System Notification"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed font-normal">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[10px] hover:text-white underline cursor-pointer shrink-0 ml-1 opacity-70 hover:opacity-100 font-mono focus:outline-none"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Responsive Sidebar for Logged-In Users */}
      {currentUser && (
        <Navigation
          currentView={currentView}
          onNavigate={navigateToView}
          currentUser={currentUser}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onSelectService={setSelectedService}
          onSetAuthStates={({ isRegistering, isResetPassword }) => {
            setIsRegistering(isRegistering);
            setIsResetPassword(isResetPassword);
            setAuthError(null);
            setRecoverySuccessMessage(null);
          }}
        />
      )}

      {/* Top Header for Logged-Out Public Homepage */}
      {!currentUser && currentView !== "HOME" && (
        <header className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigateToView("HOME")}>
              <img
                src={logoImg}
                alt="Smart Link Nigeria"
                className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 object-contain rounded-3xl shadow-xl border-2 border-[#E5E7EB] bg-white p-2"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
              />
              <span className="font-sans text-2xl font-black tracking-tight beautiful-brand-logo">Smart Link Nigeria</span>
            </div>

            {/* Center Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => {
                  navigateToView("HOME");
                  setTimeout(() => {
                    document.getElementById("solutions-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none ${
                  currentView === "HOME" ? "text-slate-500 hover:text-blue-600" : "text-slate-500 hover:text-blue-600"
                }`}
              >
                Solutions
              </button>
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowServicesSummaryDropdown(!showServicesSummaryDropdown);
                  }}
                  className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1.5 ${
                    currentView === "SERVICES" || showServicesSummaryDropdown ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  <span>Services</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${showServicesSummaryDropdown ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {showServicesSummaryDropdown && (
                  <>
                    {/* Click-away overlay */}
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowServicesSummaryDropdown(false)}
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[460px] bg-white border border-slate-200/80 rounded-2xl shadow-xl p-5 z-50 text-left">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                          Smart Link Nigeria Services Summary
                        </span>
                        {currentUser ? (
                          <button
                            onClick={() => {
                              navigateToView("SERVICES");
                              setShowServicesSummaryDropdown(false);
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                          >
                            View Full Portal
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              navigateToView("DASHBOARD");
                              setShowServicesSummaryDropdown(false);
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Sign In / Login
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                        {/* 1. Identity & KYC */}
                        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/30 space-y-1 hover:bg-blue-50 transition-colors">
                          <span className="text-[11px] font-black text-blue-700 block">Identity & KYC</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            NIN verification/validation, VNIN slips, and instant secure BVN lookup.
                          </p>
                        </div>

                        {/* 2. CAC Registration */}
                        <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/30 space-y-1 hover:bg-indigo-50 transition-colors">
                          <span className="text-[11px] font-black text-indigo-700 block">Corporate Registry (CAC)</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Incorporate Business Names, Private Limited Companies, and NGO status.
                          </p>
                        </div>

                        {/* 3. Education Scratch Cards */}
                        <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/30 space-y-1 hover:bg-amber-50 transition-colors">
                          <span className="text-[11px] font-black text-amber-700 block">Education Portal</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Official printable result checker scratch cards for WAEC, NECO, & JAMB.
                          </p>
                        </div>

                        {/* 4. Telecom & VTU */}
                        <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/30 space-y-1 hover:bg-emerald-50 transition-colors">
                          <span className="text-[11px] font-black text-emerald-700 block">Telecom & VTU</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Instant airtime dispatch, highly discounted internet data, and TV subs.
                          </p>
                        </div>

                        {/* 5. Government Portals */}
                        <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/30 space-y-1 hover:bg-rose-50 transition-colors">
                          <span className="text-[11px] font-black text-rose-700 block">Government Gateway</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            FRSC drivers licenses, international passports, and corporate filings.
                          </p>
                        </div>

                        {/* 6. ICT & Business Branding */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/40 space-y-1 hover:bg-slate-100 transition-colors">
                          <span className="text-[11px] font-black text-slate-700 block">ICT & Branding</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Web development, computer maintenance/repairs, and brand design.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Need full portal access? Sign in to your node.</span>
                        <button
                          onClick={() => {
                            setCurrentView("DASHBOARD");
                            setIsRegistering(false);
                            setShowServicesSummaryDropdown(false);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                        >
                          Secure Sign In
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={() => {
                  setCurrentView("HOME");
                  setTimeout(() => {
                    document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-none"
              >
                About Us
              </button>
              <button 
                onClick={() => {
                  setCurrentView("HOME");
                  setTimeout(() => {
                    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-none"
              >
                Contact
              </button>
            </div>

            {/* Right Login Button */}
            <div>
              <button
                onClick={() => {
                  setCurrentView("DASHBOARD");
                  setIsRegistering(false);
                  setIsResetPassword(false);
                  setAuthError(null);
                }}
                className="px-6 py-2.5 bg-black hover:bg-slate-900 text-white font-bold rounded-full text-xs shadow-md transition-all cursor-pointer"
              >
                Client Login
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col justify-between">
        <div className="w-full">
          {siteSettings?.showAnnouncement && siteSettings?.announcementText && currentView !== "HOME" && (
            <div className="bg-[#0F2D5C] text-white px-4 py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs border-b border-white/10">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-300 animate-pulse" />
              <span>{siteSettings.announcementText}</span>
            </div>
          )}
          {currentView === "HOME" && (
            <SmartLinkLandingPage
              onLogin={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(false);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onRegister={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(true);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onGetStarted={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(true);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onAdminLogin={() => {
                navigateToView("ADMIN_LOGIN");
              }}
              onExploreServices={() => {
                if (currentUser) {
                  navigateToView("SERVICES");
                } else {
                  const el = document.getElementById("services-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              onSelectService={(serviceId) => {
                if (currentUser) {
                  navigateToView("SERVICES");
                } else {
                  navigateToView("DASHBOARD");
                  setIsRegistering(false);
                }
              }}
              siteAnnouncement={{
                showAnnouncement: siteSettings?.showAnnouncement,
                announcementText: siteSettings?.announcementText,
              }}
            />
          )}

          {currentView === "SERVICES" && (
            currentUser ? (
              <ServicesGrid onSelectService={setSelectedService} />
            ) : (
              <div className="max-w-md mx-auto my-16 px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
                  <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">Portal Authentication Required</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      All government portal integrations, VTU services, and scratch card dispatch pipelines require an active authenticated user profile.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCurrentView("DASHBOARD");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="w-full py-2.5 bg-slate-900 text-white hover:bg-blue-600 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Authenticate Now
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {currentView === "MARKETPLACE" && (
            currentUser ? (
              <Marketplace currentUser={currentUser} onRefreshUser={fetchUserProfile} isDarkMode={isDarkMode} />
            ) : (
              <div className="max-w-md mx-auto my-16 px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
                  <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">Escrow Marketplace Locked</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Access to our multi-vendor agent list, commission payouts, and custom filing services is restricted to registered members.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCurrentView("DASHBOARD");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="w-full py-2.5 bg-slate-900 text-white hover:bg-blue-600 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Sign In to Marketplace
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {currentView === "AI_SUITE" && (
            currentUser ? (
              <AIAutomationSuite userEmail={currentUser?.email} />
            ) : (
              <div className="max-w-md mx-auto my-16 px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">AI Automation Suite Restricted</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Please log in to access our real-time smart advisor, custom legal business drafters, and localized market insights.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCurrentView("DASHBOARD");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="w-full py-2.5 bg-slate-900 text-white hover:bg-blue-600 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Secure Portal Login
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Admin Login View */}
          {currentView === "ADMIN_LOGIN" && (
            <div className="w-full bg-slate-950 min-h-[calc(100vh-75px)] flex flex-col items-center justify-center p-4 md:p-8">
              <AdminLogin
                onLoginSuccess={(session) => {
                  setAdminSession(session);
                  setCurrentView("ADMIN_DASHBOARD");
                }}
              />
            </div>
          )}

          {/* Admin Protected Views wrapped in AdminGuard & AdminDashboardLayout */}
          {currentView.startsWith("ADMIN_") && currentView !== "ADMIN_LOGIN" && (
            <div className="w-full bg-slate-950 min-h-screen">
              <AdminGuard
                currentRoute={viewToRouteMap[currentView] || "/admin/dashboard"}
                adminSession={adminSession}
                onLogout={() => {
                  clearAdminSession();
                  setAdminSession(null);
                  setCurrentView("ADMIN_LOGIN");
                }}
                onNavigate={(routePath) => {
                  const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                  setCurrentView(targetView);
                }}
              >
                {adminSession && (
                  <AdminDashboardLayout
                    currentRoute={viewToRouteMap[currentView] || "/admin/dashboard"}
                    session={adminSession}
                    onNavigate={(routePath) => {
                      const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                      setCurrentView(targetView);
                    }}
                    onLogout={() => {
                      clearAdminSession();
                      setAdminSession(null);
                      setCurrentView("ADMIN_LOGIN");
                    }}
                  >
                    {currentView === "ADMIN_DASHBOARD" && (
                      <AdminDashboardHome
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                        onLogout={() => {
                          clearAdminSession();
                          setAdminSession(null);
                          setCurrentView("ADMIN_LOGIN");
                        }}
                      />
                    )}

                    {currentView === "ADMIN_USERS" && (
                      <AdminUsersView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_WALLET" && (
                      <AdminWalletView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_PERMISSIONS" && (
                      <AdminPermissionsView
                        session={adminSession!}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_SERVICES" && (
                      <AdminServicesView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_PROVIDERS" && (
                      <AdminProvidersView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_API_BUILDER" && (
                      <ApiRequestBuilderView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_RESPONSE_MAPPER" && (
                      <ApiResponseMapperView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_TRANSACTIONS" && (
                      <AdminTransactionsView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_REFUNDS" && (
                      <AdminRefundsView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_REPORTS" && (
                      <AdminReconciliationView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_SETTINGS" && (
                      <AdminSettingsView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_SUPPORT" && (
                      <AdminSupportView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_SECURITY" && (
                      <AdminSecurityView
                        session={adminSession}
                        subRoute={adminSecuritySubRoute}
                        onNavigate={(routePath) => {
                          if (routePath.startsWith("/admin/security")) {
                            setAdminSecuritySubRoute(routePath);
                          }
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_SYSTEM" && (
                      <AdminSystemView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}

                    {currentView === "ADMIN_NOTIFICATIONS" && (
                      <AdminNotificationsView
                        session={adminSession}
                        onNavigate={(routePath) => {
                          const targetView = routeToViewMap[routePath] || "ADMIN_DASHBOARD";
                          setCurrentView(targetView);
                        }}
                      />
                    )}
                  </AdminDashboardLayout>
                )}
              </AdminGuard>
            </div>
          )}
          {currentView === "DASHBOARD" && currentUser && (
            <Dashboards
              currentUser={currentUser}
              onRefreshUser={fetchUserProfile}
              onSwitchView={setCurrentView}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onSelectService={setSelectedService}
            />
          )}

          {currentView === "USER_SUPPORT" && (
            <UserSupportContainer
              currentUser={currentUser}
              onNavigateHome={() => setCurrentView("DASHBOARD")}
            />
          )}

          {currentView === "USER_NOTIFICATIONS" && (
            <UserNotificationCenter
              currentUser={currentUser}
              onNavigateHome={() => setCurrentView("DASHBOARD")}
            />
          )}

          {/* Custom Firebase Auth Action Pages */}
          {currentView === "FORGOT_PASSWORD" && (
            <ForgotPasswordView
              onNavigateToLogin={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
                setIsRegistering(false);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onNavigateHome={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("HOME");
              }}
              initialEmail={authEmail}
            />
          )}

          {currentView === "RESET_PASSWORD" && (
            <ResetPasswordView
              onNavigateToLogin={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
                setIsRegistering(false);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onNavigateHome={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("HOME");
              }}
              onNavigateToForgotPassword={() => {
                window.history.pushState({}, "", "/forgot-password");
                setCurrentView("FORGOT_PASSWORD");
              }}
            />
          )}

          {currentView === "VERIFY_EMAIL" && (
            <VerifyEmailView
              onNavigateToLogin={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
                setIsRegistering(false);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onNavigateHome={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("HOME");
              }}
              onNavigateToDashboard={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
              }}
              userEmailFromProps={authEmail || verificationEmail}
            />
          )}

          {currentView === "AUTH_ACTION" && (
            <AuthActionHandler
              onNavigateToLogin={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
                setIsRegistering(false);
                setIsResetPassword(false);
                setAuthError(null);
              }}
              onNavigateHome={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("HOME");
              }}
              onNavigateToDashboard={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
              }}
            />
          )}

          {/* Secure Node Manual Login / Register Form */}
          {currentView === "DASHBOARD" && !currentUser && (
            <div className="w-full bg-[#f8f9fc] min-h-[calc(100vh-75px)] flex flex-col items-center justify-center py-16 px-4">
              <div className="w-full max-w-[460px] bg-white border border-slate-100 rounded-[28px] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-left overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => navigateToView("HOME")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Home
                  </button>
                </div>

                {/* Top Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-sans">
                    SMART LINK NG
                  </h1>
                </div>

                <AnimatePresence mode="wait">
                  {isAppInitializing ? (
                    <motion.div
                      key="auth-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AuthFormSkeleton />
                    </motion.div>
                  ) : isVerifyingEmail ? (
                    <motion.div
                      key="verify-email"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-1.5">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                          <Mail className="h-7 w-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Check Your Email Inbox</h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                          We have sent a secure verification link via Firebase Authentication to <strong className="text-slate-800">{verificationEmail}</strong>.
                        </p>
                      </div>

                      {authError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium animate-fadeIn leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                          <div>{authError}</div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-left space-y-2 shadow-xs">
                        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                          Firebase Verification Dispatched
                        </div>
                        <p className="text-[11px] leading-relaxed text-blue-800 font-normal">
                          Check your email inbox and <strong className="font-semibold text-blue-900">Spam or Junk folder</strong> for the Firebase verification link.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleCheckVerificationStatus()}
                          disabled={authLoading}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                        >
                          {authLoading ? (
                            <>
                              <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                              Verifying Status...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              I've Clicked the Verification Link
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-2 text-center">
                        <button
                          onClick={() => {
                            setIsVerifyingEmail(false);
                            setVerificationEmail("");
                            setAuthError(null);
                          }}
                          className="text-xs text-slate-500 hover:text-blue-600 font-semibold hover:underline cursor-pointer focus:outline-none"
                        >
                          ← Back to Secure Login
                        </button>
                      </div>
                    </motion.div>
                  ) : isResetPassword ? (
                    <motion.div
                      key="reset-password"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-1">
                        <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Reset Portal</h2>
                        <p className="text-xs text-slate-500 font-medium">Enter your secure reset token to update password</p>
                      </div>

                      {authError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded font-medium animate-fadeIn">
                          {authError}
                        </div>
                      )}

                      {recoverySuccessMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium animate-fadeIn">
                          {recoverySuccessMessage}
                        </div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-800">
                              Security Reset Token
                            </label>
                            {recoveryToken && (
                              <span className={`text-[10px] font-bold ${
                                isTokenValid ? "text-emerald-600 animate-fadeIn" : !isHex ? "text-rose-500 animate-fadeIn" : "text-amber-500 animate-fadeIn"
                              }`}>
                                {isTokenValid ? "✓ Valid format" : !isHex ? "✗ Non-hex characters" : `⚠ Partial (${recoveryToken.length}/40)`}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            value={recoveryToken}
                            onChange={(e) => setRecoveryToken(e.target.value)}
                            placeholder="Enter the secure hex security token"
                            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all font-mono tracking-wider bg-white ${
                              recoveryToken
                                ? isTokenValid
                                  ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                  : !isHex
                                  ? "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                  : "border-amber-500 focus:ring-4 focus:ring-amber-100 bg-amber-50/10"
                                : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                          />
                          {recoveryToken && isTokenValid && (
                            <p className="text-[10px] text-emerald-600 font-semibold animate-fadeIn mt-1">
                              ✓ Secure reset token format is verified and ready for database handshake.
                            </p>
                          )}
                          {recoveryToken && !isTokenValid && (
                            <p className={`text-[10px] font-semibold animate-fadeIn mt-1 ${!isHex ? "text-rose-500" : "text-amber-600"}`}>
                              {!isHex
                                ? "Token can only contain hexadecimal characters (0-9, a-f)."
                                : `The secure hex token must be exactly 40 characters long. Current: ${recoveryToken.length} characters.`}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-800">
                              New Access Password
                            </label>
                            {newPassword && (() => {
                              const strength = getPasswordStrength(newPassword);
                              return (
                                <span className={`text-[10px] font-bold ${strength.textColorClass} animate-fadeIn`}>
                                  {strength.label}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimum 6 characters required"
                              className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                                newPassword
                                  ? newPassword.length >= 6
                                    ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                    : "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>

                          {newPassword && (() => {
                            const strength = getPasswordStrength(newPassword);
                            return (
                              <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100 animate-fadeIn text-left">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                  <span>Password Strength</span>
                                  <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                                </div>
                                
                                <div className="flex gap-1 h-1">
                                  {[1, 2, 3, 4].map((index) => (
                                    <div
                                      key={index}
                                      className={`h-full rounded-full flex-1 transition-all duration-300 ${
                                        index <= strength.score ? strength.colorClass : "bg-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="pt-2 space-y-1 text-[10px] border-t border-slate-100">
                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasMinLength ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasMinLength ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      At least 6 characters (Required)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasLengthEight ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasLengthEight ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      At least 8 characters (Recommended)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasDigit ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasDigit ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      Contains a number (0-9)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasSpecial ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasSpecial ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      Contains a special character (e.g. !@#$)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {newPassword && newPassword.length >= 6 && (
                            <p className="text-[10px] text-emerald-600 font-semibold animate-fadeIn mt-1">
                              ✓ New password meets the minimum length requirement.
                            </p>
                          )}
                          {newPassword && newPassword.length < 6 && (
                            <p className="text-[10px] text-rose-500 font-semibold animate-fadeIn mt-1">
                              ✗ Password is too short. It must be at least 6 characters.
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          {authLoading ? (
                            <>
                              <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                              Saving New Credentials...
                            </>
                          ) : (
                            "Save New Password"
                          )}
                        </button>
                      </form>

                      <div className="pt-4 text-center">
                        <button
                          onClick={() => {
                            setIsResetPassword(false);
                            setIsRegistering(false);
                            setAuthError(null);
                            setRecoverySuccessMessage(null);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer focus:outline-none"
                        >
                          ← Back to Secure Login
                        </button>
                      </div>
                    </motion.div>
                  ) : !isRegistering ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-center space-y-1">
                          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Welcome back!</h2>
                          <p className="text-xs text-[#6B7280] font-medium">Happy to see you again!</p>
                        </div>
                      </div>

                      {authError && (
                        <div role="alert" aria-live="polite" className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1 leading-relaxed">{authError}</div>
                        </div>
                      )}

                      <form onSubmit={handleDirectLogin} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label htmlFor="auth-email-input" className="text-xs font-semibold text-[#111827]">
                            Email Address
                          </label>
                          <input
                            id="auth-email-input"
                            type="email"
                            required
                            disabled={authLoading || authSuccessState !== null}
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="name@company.com"
                            aria-invalid={!!authError}
                            className={`w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 disabled:bg-[#F5F7FA] disabled:text-[#6B7280] ${
                              authError ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label htmlFor="auth-password-input" className="text-xs font-semibold text-[#111827]">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="auth-password-input"
                              type={showAuthPassword ? "text" : "password"}
                              required
                              disabled={authLoading || authSuccessState !== null}
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              aria-invalid={!!authError}
                              className={`w-full pl-4 pr-12 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 disabled:bg-[#F5F7FA] disabled:text-[#6B7280] ${
                                authError ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAuthPassword(!showAuthPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] focus:outline-none transition-colors cursor-pointer"
                              aria-label={showAuthPassword ? "Hide password" : "Show password"}
                            >
                              {showAuthPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Remember Me Checkbox & Forgot Password */}
                        <div className="flex items-center justify-between pt-1 text-left">
                          <div className="flex items-center gap-2">
                            <input
                              id="remember-me"
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-black accent-black focus:ring-black cursor-pointer"
                              defaultChecked
                            />
                            <label htmlFor="remember-me" className="text-xs text-[#6B7280] font-medium select-none cursor-pointer">
                              Keep me signed in
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/forgot-password";
                            }}
                            className="text-xs font-semibold text-[#0F2D5C] hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading || authSuccessState !== null}
                          className={`w-full py-3.5 text-white font-bold rounded-xl text-sm tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm focus:outline-none ${
                            authSuccessState === "login"
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : "bg-[#111827] hover:bg-black active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                          }`}
                        >
                          {authSuccessState === "login" ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
                              <span>SIGN IN SUCCESSFUL!</span>
                            </>
                          ) : authLoading ? (
                            <>
                              <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                              <span>SIGNING IN...</span>
                            </>
                          ) : (
                            "SIGN IN"
                          )}
                        </button>
                      </form>

                      {/* Sign Up Link */}
                      <div className="pt-3 text-center">
                        <p className="text-xs text-[#111827] font-medium">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegistering(true);
                              setAuthError(null);
                              setRecoverySuccessMessage(null);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-center space-y-1">
                          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Secure Account</h2>
                          <p className="text-xs text-slate-500 font-medium">Enter your details to create an account</p>
                        </div>
                      </div>

                      {authError && (
                        <div role="alert" aria-live="polite" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex-1 leading-relaxed">{authError}</div>
                        </div>
                      )}

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* First Name */}
                          <div className="space-y-1.5 text-left">
                            <div className="flex justify-between items-center">
                              <label htmlFor="reg-first-name" className="text-xs font-semibold text-slate-800">
                                First Name
                              </label>
                              {regFirstName && (
                                <span className={`text-[10px] font-bold ${regFirstName.trim().length > 0 ? "text-emerald-600 animate-fadeIn" : "text-rose-500 animate-fadeIn"}`}>
                                  {regFirstName.trim().length > 0 ? "✓ Present" : "✗ Required"}
                                </span>
                              )}
                            </div>
                            <input
                              id="reg-first-name"
                              type="text"
                              required
                              value={regFirstName}
                              onChange={(e) => setRegFirstName(e.target.value)}
                              placeholder="e.g. Abubakar"
                              className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                                regFirstName
                                  ? regFirstName.trim().length > 0
                                    ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                    : "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              }`}
                            />
                            {regFirstName && regFirstName.trim().length === 0 && (
                              <p className="text-[10px] text-rose-500 font-semibold animate-fadeIn">First name cannot consist of spaces only.</p>
                            )}
                          </div>

                          {/* Surname */}
                          <div className="space-y-1.5 text-left">
                            <div className="flex justify-between items-center">
                              <label htmlFor="reg-surname" className="text-xs font-semibold text-slate-800">
                                Surname
                              </label>
                              {regSurname && (
                                <span className={`text-[10px] font-bold ${regSurname.trim().length > 0 ? "text-emerald-600 animate-fadeIn" : "text-rose-500 animate-fadeIn"}`}>
                                  {regSurname.trim().length > 0 ? "✓ Present" : "✗ Required"}
                                </span>
                              )}
                            </div>
                            <input
                              id="reg-surname"
                              type="text"
                              required
                              value={regSurname}
                              onChange={(e) => setRegSurname(e.target.value)}
                              placeholder="e.g. Muhammad"
                              className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                                regSurname
                                  ? regSurname.trim().length > 0
                                    ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                    : "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              }`}
                            />
                            {regSurname && regSurname.trim().length === 0 && (
                              <p className="text-[10px] text-rose-500 font-semibold animate-fadeIn">Surname cannot consist of spaces only.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-800">
                              Email
                            </label>
                            {regEmail && (() => {
                              const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail);
                              return (
                                <span className={`text-[10px] font-bold ${isValid ? "text-emerald-600 animate-fadeIn" : "text-amber-500 animate-fadeIn"}`}>
                                  {isValid ? "✓ Valid format" : "⚠ Invalid format"}
                                </span>
                              );
                            })()}
                          </div>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="e.g. client@company.com"
                            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                              regEmail
                                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)
                                  ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                  : "border-amber-500 focus:ring-4 focus:ring-amber-100 bg-amber-50/10"
                                : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                          />
                          {regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                            <p className="text-[10px] text-amber-600 font-semibold animate-fadeIn">Please enter a valid format (e.g., mail@domain.com).</p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-semibold text-slate-800">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showRegPassword ? "text" : "password"}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Minimum 6 characters recommended"
                              className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                                regPassword
                                  ? regPassword.length >= 6
                                    ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                    : "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                              aria-label={showRegPassword ? "Hide password" : "Show password"}
                            >
                              {showRegPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          
                          {regPassword && (() => {
                            const strength = getPasswordStrength(regPassword);
                            return (
                              <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100 animate-fadeIn text-left">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                  <span>Password Strength</span>
                                  <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                                </div>
                                
                                <div className="flex gap-1 h-1">
                                  {[1, 2, 3, 4].map((index) => (
                                    <div
                                      key={index}
                                      className={`h-full rounded-full flex-1 transition-all duration-300 ${
                                        index <= strength.score ? strength.colorClass : "bg-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="pt-2 space-y-1 text-[10px] border-t border-slate-100">
                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasMinLength ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasMinLength ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      At least 6 characters (Required)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasLengthEight ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasLengthEight ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      At least 8 characters (Recommended)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasDigit ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasDigit ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      Contains a number (0-9)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasSpecial ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasSpecial ? "text-slate-700 font-semibold" : "text-slate-400"}>
                                      Contains a special character (e.g. !@#$)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="reg-phone-number" className="text-xs font-semibold text-slate-800">
                              Phone Number
                            </label>
                            {regPhoneNumber && (() => {
                              const isElevenDigits = regPhoneNumber.length === 11;
                              const startsWithZero = regPhoneNumber.startsWith("0");
                              const isValid = isElevenDigits && startsWithZero;
                              return (
                                <span className={`text-[10px] font-bold ${isValid ? "text-emerald-600 animate-fadeIn" : "text-rose-500 animate-fadeIn"}`}>
                                  {isValid ? "✓ 11 digits (Valid)" : !startsWithZero ? "✗ Must start with 0" : `✗ ${regPhoneNumber.length}/11 digits`}
                                </span>
                              );
                            })()}
                          </div>
                          <input
                            id="reg-phone-number"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={11}
                            required
                            value={regPhoneNumber}
                            onChange={(e) => {
                              // Rule 4: Numbers only (letters, characters, symbols, space all not allowed)
                              // Rule 3: Max 11 digits
                              const numbersOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
                              setRegPhoneNumber(numbersOnly);
                            }}
                            placeholder="e.g. 08012345678"
                            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all font-mono tracking-wide bg-white ${
                              regPhoneNumber
                                ? regPhoneNumber.length === 11 && regPhoneNumber.startsWith("0")
                                  ? "border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50/10"
                                  : "border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/10"
                                : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                          />
                          {regPhoneNumber && (() => {
                            const startsWithZero = regPhoneNumber.startsWith("0");
                            const isElevenDigits = regPhoneNumber.length === 11;
                            if (!startsWithZero) {
                              return (
                                <p className="text-[10px] text-rose-500 font-semibold animate-fadeIn">
                                  Phone number must start with 0 (e.g. 08012345678).
                                </p>
                              );
                            }
                            if (!isElevenDigits) {
                              return (
                                <p className="text-[10px] text-rose-500 font-semibold animate-fadeIn">
                                  Phone number must be exactly 11 digits. Current: {regPhoneNumber.length}/11 digits.
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>





                        <button
                          type="submit"
                          disabled={authLoading || authSuccessState !== null}
                          className={`w-full py-3.5 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 focus:ring-4 focus:outline-none ${
                            authSuccessState === "register"
                              ? "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20 focus:ring-emerald-100"
                              : "bg-[#111827] hover:bg-black active:scale-98 shadow-sm focus:ring-slate-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                          }`}
                        >
                          {authSuccessState === "register" ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
                              <span>Account Created Successfully!</span>
                            </>
                          ) : authLoading ? (
                            <>
                              <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </button>
                      </form>

                      <div className="pt-4 text-center">
                        <p className="text-xs text-[#111827] font-medium">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegistering(false);
                              setAuthError(null);
                              setRecoverySuccessMessage(null);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            Sign In
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Global Footer */}
        {currentView !== "HOME" && (
          <footer className="bg-white text-[#4B5563] py-12 border-t border-[#E5E7EB] text-xs">
            <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-8 text-left">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImg}
                      alt="Smart Link Nigeria"
                      className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl border-2 border-[#E5E7EB] bg-white p-2 shadow-md shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e: any) => { e.currentTarget.src = "/logo.png"; }}
                    />
                    <span className="font-sans text-base font-bold text-[#111827] tracking-tight">Smart Link Nigeria</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] font-normal leading-relaxed max-w-sm">
                    Smart Link Nigeria Computer is a premier technology enterprise and authorized service channel in Nigeria, providing professional CAC business registrations, reliable biometrics identity solutions, WAEC/JAMB scratch card distributions, and comprehensive enterprise ICT solutions.
                  </p>
                </div>
                <div className="space-y-3 md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Contact Us</p>
                  <p className="text-[11px] text-[#4B5563]">
                    Smartlinkcomputerbusiness@gmail.com<br />
                    +2348085490982 | WhatsApp: 09047738212
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[#6B7280]">
                <p>© {new Date().getFullYear()} Smart Link Nigeria Computer. All rights reserved. RC 9347502.</p>
                <p>Registered in Nigeria under the Corporate Affairs Commission (CAC).</p>
              </div>
            </div>
          </footer>
        )}
      </main>

      {/* Global Action Modal for Ordering/Verifying */}
      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          currentUser={currentUser}
          onRefreshUser={fetchUserProfile}
        />
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <button
                type="button"
                onClick={cancelLogout}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                <LogOut className="h-6 w-6 ml-0.5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  You are currently signed in. Navigating back or exiting will sign you out of your account session. Are you sure you want to sign out?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
