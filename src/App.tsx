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
import { AdminMultiGatewayView } from "./components/admin/views/AdminMultiGatewayView";
import ApiRequestBuilderView from "./components/admin/views/ApiRequestBuilderView";
import ApiResponseMapperView from "./components/admin/views/ApiResponseMapperView";
import { AdminSettingsView } from "./components/admin/views/AdminSettingsView";
import { AdminNotificationsView } from "./components/admin/views/AdminNotificationsView";
import { UserNotificationCenter } from "./components/notification/UserNotificationCenter";
import { AdminSecurityView } from "./components/admin/views/AdminSecurityView";
import { AdminServicesView } from "./components/admin/views/AdminServicesView";
import { AdminReconciliationView } from "./components/admin/views/AdminReconciliationView";
import { AdminLegalComplianceView } from "./components/admin/views/AdminLegalComplianceView";
import {
  AdminRefundsView,
  AdminReportsView,
  AdminSystemView,
} from "./components/admin/views/AdminPlaceholderViews";
import { AdminSession, getStoredAdminSession, clearAdminSession } from "./services/adminAuthTypes";
import { UserProfile, UserRole } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Mail, Lock, Phone, Tag, UserRound, Check, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, LogOut, X, FileCheck } from "lucide-react";
import { SmartLinkLogoMark } from "./components/ui/SmartLinkLogoMark";
import { DEFAULT_LOGO_URL, handleLogoError } from "./utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;
import { getFriendlyErrorMessage, safeFetchJson } from "./utils/authErrorHandler";
import { soundFx } from "./utils/audioEffects";
import { AuthFormSkeleton } from "./components/ui/AuthSkeleton";
import { ForgotPasswordView } from "./components/auth/ForgotPasswordView";
import { ResetPasswordView } from "./components/auth/ResetPasswordView";
import { VerifyEmailView } from "./components/auth/VerifyEmailView";
import { AuthActionHandler } from "./components/auth/AuthActionHandler";

import { useSiteConfig } from "./context/SiteConfigContext";
import { MaintenanceScreen } from "./components/maintenance/MaintenanceScreen";
import {
  LegalCenter,
  LegalDocumentView,
  LegalQuickModal,
  LegalConsentBox,
  PolicyUpdateReAcceptanceModal,
  UserLegalAgreementsModal,
  LEGAL_DOCUMENTS,
  getLegalDocumentById,
} from "./components/legal";
import { legalConsentService } from "./services/legalConsentService";

const docIdToViewMap: Record<string, string> = {
  "privacy-policy": "LEGAL_DOCUMENT_PRIVACY",
  "terms-of-service": "LEGAL_DOCUMENT_TERMS",
  "refund-policy": "LEGAL_DOCUMENT_REFUND",
  "wallet-terms": "LEGAL_DOCUMENT_WALLET",
  "payment-terms": "LEGAL_DOCUMENT_PAYMENT",
  "cookie-policy": "LEGAL_DOCUMENT_COOKIE",
  "kyc-notice": "LEGAL_DOCUMENT_KYC",
  "acceptable-use": "LEGAL_DOCUMENT_ACCEPTABLE_USE",
  "data-protection": "LEGAL_DOCUMENT_DATA_PROTECTION",
  "disclaimer": "LEGAL_DOCUMENT_DISCLAIMER",
};

const viewToDocIdMap: Record<string, string> = {
  LEGAL_DOCUMENT_PRIVACY: "privacy-policy",
  LEGAL_DOCUMENT_TERMS: "terms-of-service",
  LEGAL_DOCUMENT_REFUND: "refund-policy",
  LEGAL_DOCUMENT_WALLET: "wallet-terms",
  LEGAL_DOCUMENT_PAYMENT: "payment-terms",
  LEGAL_DOCUMENT_COOKIE: "cookie-policy",
  LEGAL_DOCUMENT_KYC: "kyc-notice",
  LEGAL_DOCUMENT_ACCEPTABLE_USE: "acceptable-use",
  LEGAL_DOCUMENT_DATA_PROTECTION: "data-protection",
  LEGAL_DOCUMENT_DISCLAIMER: "disclaimer",
};
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
  collection,
  getDocs,
  query,
  where,
  limit,
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
  let colorClass = "bg-[#0F2D5C]";
  let textColorClass = "text-[#0F2D5C]";

  if (score === 1) {
    label = "Weak";
    colorClass = "bg-[#0F2D5C]/60";
    textColorClass = "text-[#0F2D5C]/60";
  } else if (score === 2) {
    label = "Fair";
    colorClass = "bg-[#17407E]/70";
    textColorClass = "text-[#17407E]/70";
  } else if (score === 3) {
    label = "Strong";
    colorClass = "bg-[#17407E]";
    textColorClass = "text-[#17407E]";
  } else if (score === 4) {
    label = "Very Strong";
    colorClass = "bg-[#0F2D5C]";
    textColorClass = "text-[#0F2D5C]";
  }

  return { score, label, colorClass, textColorClass, checks };
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {}
  }
  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers["Authorization"] = `Bearer ${idToken}`;
      return headers;
    } catch {}
  }

  // Check admin session token
  try {
    const adminSessionRaw = sessionStorage.getItem("smart_link_admin_session");
    if (adminSessionRaw) {
      const adminSession = JSON.parse(adminSessionRaw);
      if (adminSession?.sessionToken) {
        headers["Authorization"] = `Bearer ${adminSession.sessionToken}`;
        headers["x-admin-token"] = adminSession.sessionToken;
        return headers;
      }
    }
  } catch {}

  // Check user session in localStorage
  try {
    const userRaw = localStorage.getItem("smart_link_user");
    if (userRaw) {
      const u = JSON.parse(userRaw);
      if (u?.sessionToken || u?.token || u?.idToken) {
        headers["Authorization"] = `Bearer ${u.sessionToken || u.token || u.idToken}`;
        return headers;
      }
    }
  } catch {}

  return headers;
}

export default function App() {
  const { maintenanceActive, config: siteConfig, logoUrl: contextLogoUrl, refreshConfig: refreshSiteConfig } = useSiteConfig();
  const dynamicLogo = siteConfig.branding?.logoUrl || siteConfig.branding?.lightLogoUrl || contextLogoUrl || DEFAULT_LOGO_URL;
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
  const [slipValidationToken, setSlipValidationToken] = useState<string>(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.startsWith("/verify/slip/")) {
      return decodeURIComponent(path.replace("/verify/slip/", ""));
    }
    return params.get("slipToken") || params.get("token") || "";
  });

  const [activeLegalDocId, setActiveLegalDocId] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/legal/")) {
      return path.replace("/legal/", "");
    }
    if (path === "/privacy") return "privacy-policy";
    if (path === "/terms" || path === "/terms-and-conditions") return "terms-of-service";
    if (path === "/refund-policy" || path === "/refunds") return "refund-policy";
    if (path === "/wallet-terms") return "wallet-terms";
    if (path === "/payment-terms") return "payment-terms";
    if (path === "/cookie-policy") return "cookie-policy";
    if (path === "/kyc-notice") return "kyc-notice";
    if (path === "/acceptable-use") return "acceptable-use";
    if (path === "/data-protection") return "data-protection";
    if (path === "/disclaimer") return "disclaimer";
    return "privacy-policy";
  });
  const [quickLegalModalDocId, setQuickLegalModalDocId] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<string>(() => {
    const storedUser = localStorage.getItem("smart_link_user");
    const hasUser = Boolean(storedUser);
    const hasAdmin = Boolean(getStoredAdminSession());

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    const unauthPaths = ["/", "/home", "/admin/login", "/forgot-password", "/reset-password", "/verify-email"];
    if ((hasUser || hasAdmin) && (unauthPaths.includes(path) || path === "")) {
      return hasAdmin ? "ADMIN_DASHBOARD" : "DASHBOARD";
    }

    if (path.startsWith("/verify/slip/") || path === "/validate-slip" || params.get("slipToken")) {
      return "VERIFY_SLIP";
    }
    if (path === "/forgot-password") return "FORGOT_PASSWORD";
    if (path === "/reset-password") return "RESET_PASSWORD";
    if (path === "/verify-email") return "VERIFY_EMAIL";
    if (
      path.startsWith("/auth/action") ||
      path.startsWith("/__/auth/action") ||
      params.get("mode") ||
      (params.get("oobCode") && !path.includes("reset-password") && !path.includes("verify-email"))
    ) {
      return "AUTH_ACTION";
    }
    if (path === "/legal" || path === "/legal-center") {
      return "LEGAL_CENTER";
    }
    if (
      path.startsWith("/legal/") ||
      path === "/privacy" ||
      path === "/terms" ||
      path === "/terms-and-conditions" ||
      path === "/refund-policy" ||
      path === "/refunds" ||
      path === "/wallet-terms" ||
      path === "/payment-terms" ||
      path === "/cookie-policy" ||
      path === "/kyc-notice" ||
      path === "/acceptable-use" ||
      path === "/data-protection" ||
      path === "/disclaimer"
    ) {
      const docId = path.startsWith("/legal/")
        ? path.replace("/legal/", "")
        : path === "/privacy"
        ? "privacy-policy"
        : path === "/terms" || path === "/terms-and-conditions"
        ? "terms-of-service"
        : path === "/refund-policy" || path === "/refunds"
        ? "refund-policy"
        : path.replace("/", "");
      return docIdToViewMap[docId] || "LEGAL_DOCUMENT";
    }
    if (path === "/dashboard") return "DASHBOARD";
    if (path === "/services") return "SERVICES";
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
    "/notifications": "NOTIFICATIONS",
    "/admin/login": "ADMIN_LOGIN",
    "/admin/dashboard": "ADMIN_DASHBOARD",
    "/admin/users": "ADMIN_USERS",
    "/admin/wallet": "ADMIN_WALLET",
    "/admin/permissions": "ADMIN_PERMISSIONS",
    "/admin/services": "ADMIN_SERVICES",
    "/admin/providers": "ADMIN_PROVIDERS",
    "/admin/gateway-routing": "ADMIN_GATEWAY_ROUTING",
    "/admin/api-builder": "ADMIN_API_BUILDER",
    "/admin/response-mapper": "ADMIN_RESPONSE_MAPPER",
    "/admin/transactions": "ADMIN_TRANSACTIONS",
    "/admin/refunds": "ADMIN_REFUNDS",
    "/admin/reports": "ADMIN_REPORTS",
    "/admin/settings": "ADMIN_SETTINGS",
    "/admin/security": "ADMIN_SECURITY",
    "/admin/security/audit-logs": "ADMIN_SECURITY",
    "/admin/security/login-history": "ADMIN_SECURITY",
    "/admin/security/blocked-users": "ADMIN_SECURITY",
    "/admin/security/blocked-devices": "ADMIN_SECURITY",
    "/admin/security/blocked-ip": "ADMIN_SECURITY",
    "/admin/security/suspicious-activity": "ADMIN_SECURITY",
    "/admin/security/session-management": "ADMIN_SECURITY",
    "/admin/security/alerts": "ADMIN_SECURITY",
    "/admin/legal": "ADMIN_LEGAL",
    "/admin/system": "ADMIN_SYSTEM",
    "/admin/notifications": "ADMIN_NOTIFICATIONS",
    "/forgot-password": "FORGOT_PASSWORD",
    "/reset-password": "RESET_PASSWORD",
    "/verify-email": "VERIFY_EMAIL",
    "/auth/action": "AUTH_ACTION",
    "/__/auth/action": "AUTH_ACTION",
    "/legal": "LEGAL_CENTER",
    "/legal-center": "LEGAL_CENTER",
    "/privacy": "LEGAL_DOCUMENT_PRIVACY",
    "/terms": "LEGAL_DOCUMENT_TERMS",
    "/terms-and-conditions": "LEGAL_DOCUMENT_TERMS",
    "/refund-policy": "LEGAL_DOCUMENT_REFUND",
    "/refunds": "LEGAL_DOCUMENT_REFUND",
    "/wallet-terms": "LEGAL_DOCUMENT_WALLET",
    "/payment-terms": "LEGAL_DOCUMENT_PAYMENT",
    "/cookie-policy": "LEGAL_DOCUMENT_COOKIE",
    "/kyc-notice": "LEGAL_DOCUMENT_KYC",
    "/acceptable-use": "LEGAL_DOCUMENT_ACCEPTABLE_USE",
    "/data-protection": "LEGAL_DOCUMENT_DATA_PROTECTION",
    "/disclaimer": "LEGAL_DOCUMENT_DISCLAIMER",
    "/legal/privacy-policy": "LEGAL_DOCUMENT_PRIVACY",
    "/legal/terms-of-service": "LEGAL_DOCUMENT_TERMS",
    "/legal/refund-policy": "LEGAL_DOCUMENT_REFUND",
    "/legal/wallet-terms": "LEGAL_DOCUMENT_WALLET",
    "/legal/payment-terms": "LEGAL_DOCUMENT_PAYMENT",
    "/legal/cookie-policy": "LEGAL_DOCUMENT_COOKIE",
    "/legal/kyc-notice": "LEGAL_DOCUMENT_KYC",
    "/legal/acceptable-use": "LEGAL_DOCUMENT_ACCEPTABLE_USE",
    "/legal/data-protection": "LEGAL_DOCUMENT_DATA_PROTECTION",
    "/legal/disclaimer": "LEGAL_DOCUMENT_DISCLAIMER",
  };

  const viewToRouteMap: Record<string, string> = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    SERVICES: "/services",
    NOTIFICATIONS: "/notifications",
    ADMIN_LOGIN: "/admin/login",
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_USERS: "/admin/users",
    ADMIN_WALLET: "/admin/wallet",
    ADMIN_SERVICES: "/admin/services",
    ADMIN_PROVIDERS: "/admin/providers",
    ADMIN_GATEWAY_ROUTING: "/admin/gateway-routing",
    ADMIN_TRANSACTIONS: "/admin/transactions",
    ADMIN_REFUNDS: "/admin/refunds",
    ADMIN_REPORTS: "/admin/reports",
    ADMIN_SETTINGS: "/admin/settings",
    ADMIN_SECURITY: "/admin/security",
    ADMIN_LEGAL: "/admin/legal",
    ADMIN_SYSTEM: "/admin/system",
    ADMIN_NOTIFICATIONS: "/admin/notifications",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    AUTH_ACTION: "/auth/action",
    LEGAL_CENTER: "/legal",
    LEGAL_DOCUMENT: "/legal",
    LEGAL_DOCUMENT_PRIVACY: "/privacy",
    LEGAL_DOCUMENT_TERMS: "/terms",
    LEGAL_DOCUMENT_REFUND: "/refund-policy",
    LEGAL_DOCUMENT_WALLET: "/wallet-terms",
    LEGAL_DOCUMENT_PAYMENT: "/payment-terms",
    LEGAL_DOCUMENT_COOKIE: "/cookie-policy",
    LEGAL_DOCUMENT_KYC: "/kyc-notice",
    LEGAL_DOCUMENT_ACCEPTABLE_USE: "/acceptable-use",
    LEGAL_DOCUMENT_DATA_PROTECTION: "/data-protection",
    LEGAL_DOCUMENT_DISCLAIMER: "/disclaimer",
  };

  const navigateToLegal = (docId?: string) => {
    if (!docId || docId === "legal-center") {
      navigateToView("LEGAL_CENTER");
    } else {
      setActiveLegalDocId(docId);
      const targetView = docIdToViewMap[docId] || "LEGAL_DOCUMENT";
      navigateToView(targetView);
    }
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
    if (maintenanceActive && !adminSessionRef.current && !view.startsWith("ADMIN_")) {
      return;
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

    if ((userIsSignedIn || adminIsSignedIn) && unauthenticatedViews.includes(view)) {
      pendingNavigationRef.current = view;
      setShowLogoutModal(true);
      return;
    }

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
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [regReferralCode, setRegReferralCode] = useState("");

  // Legal Consent & Compliance State
  const [regAgreedTerms, setRegAgreedTerms] = useState(false);
  const [regAgreedPrivacy, setRegAgreedPrivacy] = useState(false);
  const [regAgreedKyc, setRegAgreedKyc] = useState(false);
  const [regMarketingAccepted, setRegMarketingAccepted] = useState(false);
  const [showUserAgreementsModal, setShowUserAgreementsModal] = useState(false);
  const [showReAcceptanceModal, setShowReAcceptanceModal] = useState(false);
  const [pendingReAcceptancePolicies, setPendingReAcceptancePolicies] = useState<any[]>([]);

  // Password recovery states
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);

  // Email verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Global toast state
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  useEffect(() => {
    const keepServerWarm = async () => {
      try {
        await fetch("/api/health", {
          method: "GET",
          cache: "no-cache",
        });
      } catch {}
    };

    keepServerWarm();
    const intervalId = setInterval(keepServerWarm, 600000);

    return () => clearInterval(intervalId);
  }, []);
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

      if (path.startsWith("/legal/")) {
        const docId = path.replace("/legal/", "");
        setActiveLegalDocId(docId);
        targetView = docIdToViewMap[docId] || "LEGAL_DOCUMENT";
      } else if (path === "/privacy") {
        setActiveLegalDocId("privacy-policy");
        targetView = "LEGAL_DOCUMENT_PRIVACY";
      } else if (path === "/terms" || path === "/terms-and-conditions") {
        setActiveLegalDocId("terms-of-service");
        targetView = "LEGAL_DOCUMENT_TERMS";
      } else if (path === "/refund-policy" || path === "/refunds") {
        setActiveLegalDocId("refund-policy");
        targetView = "LEGAL_DOCUMENT_REFUND";
      } else if (path === "/wallet-terms") {
        setActiveLegalDocId("wallet-terms");
        targetView = "LEGAL_DOCUMENT_WALLET";
      } else if (path === "/payment-terms") {
        setActiveLegalDocId("payment-terms");
        targetView = "LEGAL_DOCUMENT_PAYMENT";
      } else if (path === "/cookie-policy") {
        setActiveLegalDocId("cookie-policy");
        targetView = "LEGAL_DOCUMENT_COOKIE";
      } else if (path === "/kyc-notice") {
        setActiveLegalDocId("kyc-notice");
        targetView = "LEGAL_DOCUMENT_KYC";
      } else if (path === "/acceptable-use") {
        setActiveLegalDocId("acceptable-use");
        targetView = "LEGAL_DOCUMENT_ACCEPTABLE_USE";
      } else if (path === "/data-protection") {
        setActiveLegalDocId("data-protection");
        targetView = "LEGAL_DOCUMENT_DATA_PROTECTION";
      } else if (path === "/disclaimer") {
        setActiveLegalDocId("disclaimer");
        targetView = "LEGAL_DOCUMENT_DISCLAIMER";
      } else if (path === "/forgot-password") targetView = "FORGOT_PASSWORD";
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

      if (maintenanceActive && !adminIsSignedIn && !targetView.startsWith("ADMIN_")) {
        return;
      }

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

    if (pathOnMount.startsWith("/verify/slip/")) {
      initialView = "VERIFY_SLIP";
      const token = decodeURIComponent(pathOnMount.replace("/verify/slip/", ""));
      setSlipValidationToken(token);
    } else if (pathOnMount === "/validate-slip" || paramsOnMount.get("slipToken")) {
      initialView = "VERIFY_SLIP";
      const token = paramsOnMount.get("slipToken") || paramsOnMount.get("token") || "";
      setSlipValidationToken(token);
    } else if (pathOnMount === "/forgot-password") {
      initialView = "FORGOT_PASSWORD";
    } else if (pathOnMount === "/reset-password") {
      initialView = "RESET_PASSWORD";
    } else if (pathOnMount === "/verify-email") {
      initialView = "VERIFY_EMAIL";
    } else if (
      pathOnMount.startsWith("/auth/action") ||
      pathOnMount.startsWith("/__/auth/action") ||
      paramsOnMount.get("mode") ||
      (paramsOnMount.get("oobCode") && !pathOnMount.includes("reset-password") && !pathOnMount.includes("verify-email"))
    ) {
      initialView = "AUTH_ACTION";
    } else if (pathOnMount === "/legal" || pathOnMount === "/legal-center") {
      initialView = "LEGAL_CENTER";
    } else if (
      pathOnMount.startsWith("/legal/") ||
      pathOnMount === "/privacy" ||
      pathOnMount === "/terms" ||
      pathOnMount === "/terms-and-conditions" ||
      pathOnMount === "/refund-policy" ||
      pathOnMount === "/refunds" ||
      pathOnMount === "/wallet-terms" ||
      pathOnMount === "/payment-terms" ||
      pathOnMount === "/cookie-policy" ||
      pathOnMount === "/kyc-notice" ||
      pathOnMount === "/acceptable-use" ||
      pathOnMount === "/data-protection" ||
      pathOnMount === "/disclaimer"
    ) {
      const docId = pathOnMount.startsWith("/legal/")
        ? pathOnMount.replace("/legal/", "")
        : pathOnMount === "/privacy"
        ? "privacy-policy"
        : pathOnMount === "/terms" || pathOnMount === "/terms-and-conditions"
        ? "terms-of-service"
        : pathOnMount === "/refund-policy" || pathOnMount === "/refunds"
        ? "refund-policy"
        : pathOnMount.replace("/", "");
      setActiveLegalDocId(docId);
      initialView = docIdToViewMap[docId] || "LEGAL_DOCUMENT";
    }

    setCurrentView(initialView);

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

  // Global listeners for legal policies navigation and quick modal inspection
  useEffect(() => {
    const handleOpenLegalDoc = (e: any) => {
      const docId = e.detail?.documentId || e.detail?.docId;
      if (docId) {
        navigateToLegal(docId);
      }
    };
    const handleOpenQuickModal = (e: any) => {
      const docId = e.detail?.documentId || e.detail?.docId;
      if (docId) {
        setQuickLegalModalDocId(docId);
      }
    };
    const handleOpenLegalCenter = () => {
      navigateToLegal("legal-center");
    };

    window.addEventListener("open_legal_document", handleOpenLegalDoc);
    window.addEventListener("open_quick_legal_modal", handleOpenQuickModal);
    window.addEventListener("open_legal_center", handleOpenLegalCenter);

    return () => {
      window.removeEventListener("open_legal_document", handleOpenLegalDoc);
      window.removeEventListener("open_quick_legal_modal", handleOpenQuickModal);
      window.removeEventListener("open_legal_center", handleOpenLegalCenter);
    };
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

          // 2. Ensure Firestore users document is merged (non-blocking async)
          setDoc(
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
          ).catch((fsErr) => {
            console.warn("[onAuthStateChanged] Firestore sync note:", fsErr);
          });

          setCurrentUser(userObj);
          localStorage.setItem("smart_link_user", JSON.stringify(userObj));

          // Ensure authenticated users are directed to DASHBOARD
          const currentViewName = currentViewRef.current;
          const currentPath = window.location.pathname;
          if (
            currentViewName === "DASHBOARD" ||
            currentViewName === "HOME" ||
            currentViewName === "LOGIN" ||
            currentViewName === "REGISTER" ||
            currentPath === "/" ||
            currentPath === "/dashboard"
          ) {
            navigateToView("DASHBOARD");
          }

          // Check if any platform policies have updated since user last accepted (non-blocking)
          legalConsentService
            .checkPendingReAcceptances(fbUser.uid)
            .then((pending) => {
              if (pending && pending.length > 0) {
                setPendingReAcceptancePolicies(pending);
                setShowReAcceptanceModal(true);
              }
            })
            .catch((pendingErr) => {
              console.warn("Check pending policy updates note:", pendingErr);
            });
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
                    message: "Email successfully verified! Welcome to Smart Link Nigeria.",
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

  // Redirect SERVICES view to DASHBOARD if not logged in
  useEffect(() => {
    if (currentView === "SERVICES" && !currentUser) {
      setCurrentView("DASHBOARD");
    }
  }, [currentView, currentUser]);

  // Load profile details from server
  const fetchUserProfile = async (uid: string) => {
    if (!uid) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/auth/profile?uid=${encodeURIComponent(uid)}`, { headers });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok && data?.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem("smart_link_user", JSON.stringify(data.user));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Notice loading user profile:", err);
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
    const maxConsecutiveFailures = 5;

    const interval = setInterval(async () => {
      if (consecutiveFailures >= maxConsecutiveFailures) {
        clearInterval(interval);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/auth/profile?uid=${encodeURIComponent(currentUser.uid)}`, { headers });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
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
            clearInterval(interval);
          }
        }
      } catch (err) {
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, currentUser?.walletBalance]);

  // Direct login form submission strictly using Firebase Authentication
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authEmail || !authPassword) {
      soundFx.playErrorSound();
      setAuthError("Email and password are required.");
      return;
    }

    const cleanEmail = authEmail.toLowerCase().trim();

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessState(null);

    try {
      let user: any = null;
      let loginUser: any = null;

      if (isFirebaseConfigured) {
        try {
          // Direct Firebase Authentication sign-in - strictly authenticated, no bypass
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, authPassword);
          const fbUser = userCredential.user;

          if (fbUser) {
            user = {
              uid: fbUser.uid,
              email: fbUser.email || cleanEmail,
              displayName: fbUser.displayName,
              emailVerified: fbUser.emailVerified,
            };

            // Sync and retrieve the user profile from server
            const syncResult = await safeFetchJson("/api/auth/sync-firebase-user", {
              method: "POST",
              body: JSON.stringify({
                uid: fbUser.uid,
                email: fbUser.email || cleanEmail,
                isVerified: fbUser.emailVerified || true,
              }),
            });
            loginUser = syncResult.data?.user;
          }
        } catch (fbLoginErr: any) {
          const isNetworkOrConfigErr = 
            fbLoginErr?.code === "auth/network-request-failed" ||
            fbLoginErr?.code === "auth/invalid-api-key" ||
            String(fbLoginErr?.message || "").toLowerCase().includes("network-request-failed") ||
            String(fbLoginErr?.message || "").toLowerCase().includes("invalid-api-key");

          if (!isNetworkOrConfigErr) {
            // Real auth error (like incorrect password), throw to fail directly
            throw fbLoginErr;
          }
          console.log("[Login fallback] Firebase client sign-in encountered network or config error, falling back to secure server auth.");
        }
      }

      // If client auth was bypassed or failed due to network-request-failed, login via Express server
      if (!loginUser) {
        const loginRes = await safeFetchJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            password: authPassword,
          }),
        });

        if (!loginRes.ok || !loginRes.data?.user) {
          throw new Error(loginRes.error || "Authentication failed.");
        }

        loginUser = loginRes.data.user;
        user = {
          uid: loginUser.uid || loginUser.id,
          email: loginUser.email,
          displayName: loginUser.fullName,
        };
      }

      if (
        loginUser?.status === "SUSPENDED" ||
        loginUser?.status === "INACTIVE" ||
        loginUser?.status === "BLOCKED"
      ) {
        if (isFirebaseConfigured) {
          try {
            await signOut(auth);
          } catch {
            // ignore
          }
        }
        throw new Error(
          "Your account has been strictly blocked or suspended by security administration. Access to the dashboard is denied."
        );
      }

      // Update Firestore user document (non-blocking async)
      if (isFirebaseConfigured && user?.uid) {
        setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email || cleanEmail,
            isVerified: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((fsErr) => {
          console.log("Firestore profile sync on login note:", fsErr);
        });
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
        type: "success",
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

  // Registration form submission strictly using Firebase Authentication
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName || regFullName.trim() === "") {
      soundFx.playErrorSound();
      setAuthError("Full Name is required and cannot be empty.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail || !emailPattern.test(regEmail.trim())) {
      soundFx.playErrorSound();
      setAuthError("Please provide a valid email address.");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      soundFx.playErrorSound();
      setAuthError("Password is too weak. Please choose a password with at least 6 characters.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      soundFx.playErrorSound();
      setAuthError("Passwords do not match. Please ensure both password entries are identical.");
      return;
    }

    if (!regPhoneNumber || !/^0\d{10}$/.test(regPhoneNumber.trim())) {
      soundFx.playErrorSound();
      setAuthError("Phone number must be exactly 11 digits and must start with 0.");
      return;
    }

    // Check if user has accepted the mandatory legal terms
    if (!regAgreedTerms || !regAgreedPrivacy || !regAgreedKyc) {
      soundFx.playErrorSound();
      setAuthError("You must read and agree to the Terms of Service, Privacy Policy, and KYC Policy before creating an account.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessState(null);

    try {
      const cleanEmail = regEmail.toLowerCase().trim();
      const cleanPhone = regPhoneNumber.trim();

      // Step 1: Verify phone number uniqueness on server
      const phoneCheckRes = await safeFetchJson("/api/auth/check-phone-exists", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });
      if (phoneCheckRes.data?.exists) {
        soundFx.playErrorSound();
        setAuthError('"phone number already linked to another account" change phone number');
        setAuthLoading(false);
        return;
      }

      // Step 2: Direct Firebase Authentication account creation - no bypass whatsoever
      let activeUser: any = null;
      let firebaseUid: string = "";

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
        const fbUser = userCredential.user;
        firebaseUid = fbUser.uid;

        // Sync with backend profile store
        const syncRes = await safeFetchJson("/api/auth/sync-firebase-user", {
          method: "POST",
          body: JSON.stringify({
            uid: fbUser.uid,
            email: cleanEmail,
            fullName: regFullName.trim(),
            phoneNumber: cleanPhone,
            referralCode: regReferralCode.trim(),
            isVerified: true,
          }),
        });

        activeUser = syncRes.data?.user || {
          uid: fbUser.uid,
          email: cleanEmail,
          fullName: regFullName.trim(),
          phoneNumber: cleanPhone,
          role: UserRole.CUSTOMER,
          walletBalance: 0.0,
          referralCode: "SL" + Math.floor(1000 + Math.random() * 9000),
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        // Write user profile to Firestore (non-blocking async)
        if (isFirebaseConfigured && fbUser?.uid) {
          setDoc(
            doc(db, "users", fbUser.uid),
            {
              uid: fbUser.uid,
              email: cleanEmail,
              fullName: regFullName.trim(),
              phoneNumber: cleanPhone,
              role: "CUSTOMER",
              walletBalance: 0.0,
              referralCode: activeUser.referralCode,
              isVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch((fsErr) => {
            console.warn("Firestore user profile initialization note:", fsErr);
          });
        }
      } catch (fbCreateErr: any) {
        // If client SDK creation reports email already in use, fail immediately with exact error
        if (
          fbCreateErr?.code === "auth/email-already-in-use" ||
          fbCreateErr?.code === "auth/email-already-exists" ||
          fbCreateErr?.message?.includes("email-already-in-use")
        ) {
          soundFx.playErrorSound();
          setAuthError("email exist sign in instead");
          setAuthLoading(false);
          return;
        }

        // If client SDK network or configuration restriction occurs, execute atomic Firebase Admin registration
        const apiRes = await safeFetchJson("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            password: regPassword,
            fullName: regFullName.trim(),
            phoneNumber: cleanPhone,
            referralCode: regReferralCode.trim(),
          }),
        });

        if (!apiRes.ok || !apiRes.data?.user) {
          soundFx.playErrorSound();
          const errMsg = apiRes.error || getFriendlyErrorMessage(fbCreateErr);
          setAuthError(errMsg);
          setAuthLoading(false);
          return;
        }

        activeUser = apiRes.data.user;
        firebaseUid = activeUser.uid;

        // Sign in on Firebase Auth client if fully configured
        if (isFirebaseConfigured) {
          try {
            await signInWithEmailAndPassword(auth, cleanEmail, regPassword);
          } catch (signInErr) {
            console.log("Client sign-in after server creation note (handled):", signInErr);
          }
        } else {
          console.log("Skipped client sign-in after server creation: Firebase is not configured.");
        }
      }

      // Record immutable NDPR legal agreement batch acceptance
      try {
        await legalConsentService.recordBatchAcceptances({
          userId: firebaseUid || activeUser.uid,
          userEmail: cleanEmail,
          acceptances: [
            { documentId: "terms-of-service", documentTitle: "Terms of Service", documentVersion: "2.4.0" },
            { documentId: "privacy-policy", documentTitle: "Privacy Policy", documentVersion: "2.4.0" },
            { documentId: "wallet-terms", documentTitle: "Wallet Terms", documentVersion: "2.0.0" },
            { documentId: "kyc-notice", documentTitle: "KYC Policy", documentVersion: "2.0.0" },
          ],
          acceptanceType: "REGISTRATION_SIGNUP",
          workflow: "NEW_USER_REGISTRATION",
          metadata: {
            fullName: regFullName.trim(),
            phoneNumber: cleanPhone,
            marketingConsent: regMarketingAccepted,
            agreedPrivacy: regAgreedPrivacy,
            agreedKyc: regAgreedKyc,
          },
        });
      } catch (legalRecErr) {
        console.warn("Legal consent acceptance recording note:", legalRecErr);
      }

      // Persist in localStorage
      localStorage.setItem("smart_link_user", JSON.stringify(activeUser));

      soundFx.playSuccessSound();
      setAuthSuccessState("register");

      setCurrentUser(activeUser);
      navigateToView("DASHBOARD");
      setRegEmail("");
      setRegPassword("");
      setRegFullName("");
      setRegPhoneNumber("");
      setRegRole(UserRole.CUSTOMER);
      setRegReferralCode("");
      setRegAgreedTerms(false);
      setRegAgreedPrivacy(false);
      setRegAgreedKyc(false);
      setRegMarketingAccepted(false);
      setIsRegistering(false);
      setIsVerifyingEmail(false);
      setAuthSuccessState(null);
      setToast({
        message: "Account created successfully! Welcome to Smart Link Nigeria.",
        type: "success",
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
        message: "A fresh verification email has been sent! Check your inbox and Spam folder.",
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
    <div className={`min-h-screen bg-[#F5F7FA] transition-colors duration-300 ${isDarkMode ? "dark-theme-active" : ""} ${!currentUser ? "flex flex-col bg-white" : "flex flex-col lg:flex-row"}`}>
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
            <div className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-[#E5E7EB] bg-[#111827]/95 shadow-xl backdrop-blur-md text-xs font-medium text-white">
              <div className="mt-0.5">
                {toast.type === "success" ? (
                  <Check className="h-4 w-4 text-[#FFFFFF] shrink-0" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                ) : (
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
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

      {/* Global Maintenance Mode Interceptor Screen for Normal Users */}
      {maintenanceActive && !currentView.startsWith("ADMIN_") ? (
        <MaintenanceScreen
          onAdminLoginRequested={() => {
            navigateToView("ADMIN_LOGIN");
          }}
          onAdminSessionCreated={(sess) => {
            setAdminSession(sess);
            navigateToView("ADMIN_DASHBOARD");
          }}
          adminSession={adminSession}
          onNavigateToAdminDashboard={() => {
            navigateToView("ADMIN_DASHBOARD");
          }}
        />
      ) : (
        <>
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
          onRefreshUser={fetchUserProfile}
          onSetAuthStates={({ isRegistering, isResetPassword }) => {
            setIsRegistering(isRegistering);
            setIsResetPassword(isResetPassword);
            setAuthError(null);
            setRecoverySuccessMessage(null);
          }}
        />
      )}

      {/* Top Header for Logged-Out Public Homepage */}
      {!currentUser && !["HOME", "FORGOT_PASSWORD", "RESET_PASSWORD", "VERIFY_EMAIL", "AUTH_ACTION", "ADMIN_LOGIN", "ADMIN_DASHBOARD"].includes(currentView) && (
        <header className="w-full bg-white border-b border-[#E5E7EB] py-4 px-6 md:px-12 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigateToView("HOME")}>
              <img
                src={dynamicLogo}
                alt="Smart Link Nigeria"
                className="h-14 sm:h-16 w-auto max-w-[240px] object-contain"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
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
                  currentView === "HOME" ? "text-[#4B5563] hover:text-[#0F2D5C]" : "text-[#4B5563] hover:text-[#0F2D5C]"
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
                    currentView === "SERVICES" || showServicesSummaryDropdown ? "text-[#0F2D5C]" : "text-[#4B5563] hover:text-[#0F2D5C]"
                  }`}
                >
                  <span>Services</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${showServicesSummaryDropdown ? "rotate-180 text-[#0F2D5C]" : "text-[#9CA3AF]"}`}
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
                    <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[460px] bg-white border border-[#E5E7EB]/80 rounded-2xl shadow-xl p-5 z-50 text-left">
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] font-mono">
                          Smart Link Nigeria Services Summary
                        </span>
                        {currentUser ? (
                          <button
                            onClick={() => {
                              navigateToView("SERVICES");
                              setShowServicesSummaryDropdown(false);
                            }}
                            className="text-[10px] font-bold text-[#0F2D5C] hover:underline bg-transparent border-none cursor-pointer"
                          >
                            View Full Portal
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              navigateToView("DASHBOARD");
                              setShowServicesSummaryDropdown(false);
                            }}
                            className="text-[10px] font-bold text-[#0F2D5C] hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Sign In / Login
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                        {/* 1. Identity & KYC */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">Identity & KYC</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            NIN verification/validation, VNIN slips, and instant secure BVN lookup.
                          </p>
                        </div>

                        {/* 2. CAC Registration */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">Corporate Registry (CAC)</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            Incorporate Business Names, Private Limited Companies, and NGO status.
                          </p>
                        </div>

                        {/* 3. Education Scratch Cards */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">Education Portal</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            Official printable result checker scratch cards for WAEC, NECO, & JAMB.
                          </p>
                        </div>

                        {/* 4. Telecom & VTU */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">Telecom & VTU</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            Instant airtime dispatch, highly discounted internet data, and TV subs.
                          </p>
                        </div>

                        {/* 5. Government Portals */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">Government Gateway</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            FRSC drivers licenses, international passports, and corporate filings.
                          </p>
                        </div>

                        {/* 6. ICT & Business Branding */}
                        <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] space-y-1 hover:bg-[#E5E7EB] transition-colors">
                          <span className="text-[11px] font-black text-[#0F2D5C] block">ICT & Branding</span>
                          <p className="text-[10px] text-[#4B5563] leading-normal">
                            Web development, computer maintenance/repairs, and brand design.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#9CA3AF]">
                        <span>Need full portal access? Sign in to your node.</span>
                        <button
                          onClick={() => {
                            setCurrentView("DASHBOARD");
                            setIsRegistering(false);
                            setShowServicesSummaryDropdown(false);
                          }}
                          className="px-3 py-1 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
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
                className="text-xs font-bold text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none"
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
                className="text-xs font-bold text-[#4B5563] hover:text-[#0F2D5C] transition-colors cursor-pointer bg-transparent border-none"
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
                className="px-6 py-2.5 bg-[#082051] hover:bg-[#06183e] text-white font-bold rounded-full text-xs shadow-md transition-all cursor-pointer"
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
              <Sparkles className="h-4 w-4 shrink-0 text-[#E5E7EB] animate-pulse" />
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
              onNavigateLegal={navigateToLegal}
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
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center space-y-6">
                  <div className="h-12 w-12 rounded-full bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#0F2D5C]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#111827]">Portal Authentication Required</h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed max-w-xs mx-auto">
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
                      className="w-full py-2.5 bg-[#111827] text-white hover:bg-[#0F2D5C] hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Authenticate Now
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Admin Login View */}
          {currentView === "ADMIN_LOGIN" && (
            <div className="w-full bg-[#111827] min-h-[calc(100vh-75px)] flex flex-col items-center justify-center p-4 md:p-8">
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
            <div className="w-full bg-[#111827] min-h-screen">
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

                    {currentView === "ADMIN_GATEWAY_ROUTING" && (
                      <AdminMultiGatewayView />
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

                    {currentView === "ADMIN_LEGAL" && (
                      <AdminLegalComplianceView
                        session={adminSession}
                        onNavigate={(routePath) => {
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
              onSwitchView={navigateToView}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onSelectService={setSelectedService}
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
              onNavigateToRegister={() => {
                window.history.pushState({}, "", "/");
                setCurrentView("DASHBOARD");
                setIsRegistering(true);
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

          {/* Legal & Compliance Center View */}
          {currentView === "LEGAL_CENTER" && (
            <LegalCenter
              onSelectDocument={(docId) => navigateToLegal(docId)}
              onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
            />
          )}

          {/* Individual Legal Document View */}
          {(currentView === "LEGAL_DOCUMENT" || currentView.startsWith("LEGAL_DOCUMENT_")) && (
            <LegalDocumentView
              docId={viewToDocIdMap[currentView] || activeLegalDocId || "privacy-policy"}
              documentId={viewToDocIdMap[currentView] || activeLegalDocId || "privacy-policy"}
              onNavigateCenter={() => navigateToView("LEGAL_CENTER")}
              onBack={() => navigateToView("LEGAL_CENTER")}
              onSelectDocument={(docId) => navigateToLegal(docId)}
              onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
              onLogin={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(false);
              }}
            />
          )}

          {/* Secure Node Manual Login / Register Form */}
          {currentView === "DASHBOARD" && !currentUser && (
            <div className="w-full bg-[#F5F7FA] min-h-[calc(100vh-75px)] flex flex-col items-center justify-center py-16 px-4">
              <div className="w-full max-w-[460px] bg-white border border-[#E5E7EB] rounded-[28px] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-left overflow-hidden transition-all duration-300">
                <button
                  type="button"
                  onClick={() => navigateToView("HOME")}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Home
                </button>
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
                        <div className="h-14 w-14 rounded-2xl bg-[#F5F7FA] text-[#0F2D5C] flex items-center justify-center mx-auto border border-[#E5E7EB] shadow-xs">
                          <Mail className="h-7 w-7" />
                        </div>
                        <h2 className="text-xl font-bold text-[#111827] tracking-tight">Check Your Email Inbox</h2>
                        <p className="text-xs text-[#4B5563] font-medium leading-relaxed max-w-sm mx-auto">
                          We have sent a secure verification link to <strong className="text-[#111827]">{verificationEmail}</strong>.
                        </p>
                      </div>

                      {authError && (
                        <div className="p-3.5 bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-xs rounded-xl font-medium animate-fadeIn leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-[#6B7280] mt-0.5" />
                          <div>{authError}</div>
                        </div>
                      )}

                      <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl text-left space-y-2 shadow-xs">
                        <div className="flex items-center gap-2 text-[#0F2D5C] font-bold text-xs">
                          <span className="h-2 w-2 rounded-full bg-[#0F2D5C] animate-ping"></span>
                          Verification Dispatched
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#4B5563] font-normal">
                          Check your email inbox and <strong className="font-semibold text-[#111827]">Spam or Junk folder</strong> for the verification link.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleCheckVerificationStatus()}
                          disabled={authLoading}
                          className="w-full py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-500/10 disabled:opacity-50"
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
                          className="text-xs text-[#4B5563] hover:text-[#0F2D5C] font-semibold hover:underline cursor-pointer focus:outline-none"
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
                        <div className="h-12 w-12 rounded-full bg-[#F5F7FA] text-[#0F2D5C] flex items-center justify-center mx-auto border border-[#E5E7EB]">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-[#111827] tracking-tight">Security Reset Portal</h2>
                        <p className="text-xs text-[#4B5563] font-medium">Enter your secure reset token to update password</p>
                      </div>

                      {authError && (
                        <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-xs rounded font-medium animate-fadeIn">
                          {authError}
                        </div>
                      )}

                      {recoverySuccessMessage && (
                        <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-xs rounded font-medium animate-fadeIn">
                          {recoverySuccessMessage}
                        </div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#4B5563]">
                              Security Reset Token
                            </label>
                            {recoveryToken && (
                              <span className={`text-[10px] font-bold ${
                                isTokenValid ? "text-[#0F2D5C] animate-fadeIn" : !isHex ? "text-[#6B7280] animate-fadeIn" : "text-[#6B7280] animate-fadeIn"
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
                                  ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]/10"
                                  : !isHex
                                  ? "border-[#9CA3AF] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]/10"
                                  : "border-[#9CA3AF] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]/10"
                                : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                            }`}
                          />
                          {recoveryToken && isTokenValid && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn mt-1">
                              ✓ Secure reset token format is verified and ready for database handshake.
                            </p>
                          )}
                          {recoveryToken && !isTokenValid && (
                            <p className="text-[10px] font-semibold animate-fadeIn mt-1 text-[#6B7280]">
                              {!isHex
                                ? "Token can only contain hexadecimal characters (0-9, a-f)."
                                : `The secure hex token must be exactly 40 characters long. Current: ${recoveryToken.length} characters.`}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#4B5563]">
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
                                    ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]/10"
                                    : "border-[#9CA3AF] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]/10"
                                  : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] focus:outline-none transition-colors"
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
                              <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] animate-fadeIn text-left">
                                <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280]">
                                  <span>Password Strength</span>
                                  <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                                </div>
                                
                                <div className="flex gap-1 h-1">
                                  {[1, 2, 3, 4].map((index) => (
                                    <div
                                      key={index}
                                      className={`h-full rounded-full flex-1 transition-all duration-300 ${
                                        index <= strength.score ? strength.colorClass : "bg-[#E5E7EB]"
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="pt-2 space-y-1 text-[10px] border-t border-[#E5E7EB]">
                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasMinLength ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasMinLength ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      At least 6 characters (Required)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasLengthEight ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasLengthEight ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      At least 8 characters (Recommended)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasDigit ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasDigit ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      Contains a number (0-9)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasSpecial ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasSpecial ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      Contains a special character (e.g. !@#$)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {newPassword && newPassword.length >= 6 && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn mt-1">
                              ✓ New password meets the minimum length requirement.
                            </p>
                          )}
                          {newPassword && newPassword.length < 6 && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn mt-1">
                              ✗ Password is too short. It must be at least 6 characters.
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F2D5C]/10"
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
                          className="text-xs text-[#0F2D5C] hover:text-[#17407E] font-bold hover:underline cursor-pointer focus:outline-none"
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
                      <div className="flex flex-col items-center justify-center space-y-3">
                        {/* Brand text */}
                        <span className="text-2xl sm:text-3xl font-black tracking-[0.08em] text-[#111827] uppercase font-sans text-center">
                          SMART LINK NIGERIA
                        </span>

                        <div className="text-center space-y-1">
                          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Welcome back!</h2>
                          <p className="text-xs text-[#6B7280] font-medium">Happy to see you again!</p>
                        </div>
                      </div>

                      {authError && (
                        <div role="alert" aria-live="polite" className="p-3.5 bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-xs rounded-xl font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                          <AlertCircle className="h-4 w-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                          <div className="flex-1 leading-relaxed">
                            <div>{authError}</div>
                            {(authError.includes("sign up if not register before") || authError.includes("check email and try again") || authError.includes("register please") || authError.includes("sign up")) && (
                              <div className="mt-2 pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-between">
                                <span className="text-[11px] text-[#4B5563] font-normal">Need an account?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsRegistering(true);
                                    setAuthError(null);
                                  }}
                                  className="text-xs font-bold text-[#0F2D5C] hover:text-[#17407E] underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                >
                                  Sign up / Register now →
                                </button>
                              </div>
                            )}
                            {(authError.includes("try forgot password instead") || authError.includes("incorrect password") || authError.includes("forgot password")) && (
                              <div className="mt-2 pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-between">
                                <span className="text-[11px] text-[#4B5563] font-normal">Forgotten your password?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentView("FORGOT_PASSWORD");
                                    setAuthError(null);
                                  }}
                                  className="text-xs font-bold text-[#0F2D5C] hover:text-[#17407E] underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                >
                                  Forgot password? Reset here →
                                </button>
                              </div>
                            )}
                          </div>
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
                              authError ? "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-[#E5E7EB]" : ""
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
                                authError ? "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-[#E5E7EB]" : ""
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
                              className="h-4 w-4 rounded border-[#E5E7EB] text-[#0F2D5C] accent-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                              defaultChecked
                            />
                            <label htmlFor="remember-me" className="text-xs text-[#6B7280] font-medium select-none cursor-pointer">
                              Keep me signed in
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              window.history.pushState({ view: "FORGOT_PASSWORD" }, "", "/forgot-password");
                              setCurrentView("FORGOT_PASSWORD");
                              setIsRegistering(false);
                              setIsResetPassword(false);
                              setAuthError(null);
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
                              ? "bg-[#0F2D5C] hover:bg-[#17407E]"
                              : "bg-[#082051] hover:bg-[#06183e] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
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

                        <div className="pt-2 text-[11px] text-[#9CA3AF] text-center">
                          NDPR Compliant &bull;{" "}
                          <button
                            type="button"
                            onClick={() => setQuickLegalModalDocId("privacy-policy")}
                            className="text-[#4B5563] hover:text-[#0F2D5C] font-medium hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                          >
                            Privacy
                          </button>{" "}
                          &bull;{" "}
                          <button
                            type="button"
                            onClick={() => setQuickLegalModalDocId("terms-of-service")}
                            className="text-[#4B5563] hover:text-[#0F2D5C] font-medium hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                          >
                            Terms
                          </button>
                        </div>
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
                            className="text-[#0F2D5C] hover:text-[#17407E] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
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
                      <div className="flex flex-col items-center justify-center space-y-3">
                        {/* Brand text */}
                        <span className="text-2xl sm:text-3xl font-black tracking-[0.08em] text-[#111827] uppercase font-sans text-center">
                          SMART LINK NIGERIA
                        </span>

                        <div className="text-center space-y-1">
                          <h2 className="text-xl font-bold text-[#111827] tracking-tight">Create Secure Account</h2>
                        </div>
                      </div>

                      {authError && (
                        <div role="alert" aria-live="polite" className="p-3.5 bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-xs rounded-xl font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                          <AlertCircle className="h-4 w-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                          <div className="flex-1 leading-relaxed">
                            <div>{authError}</div>
                            {authError.toLowerCase().includes("email exist") && (
                              <div className="mt-2 pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-between">
                                <span className="text-[11px] text-[#4B5563] font-normal">Already have an account?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsRegistering(false);
                                    setAuthEmail(regEmail);
                                    setAuthError(null);
                                  }}
                                  className="text-xs font-bold text-[#0F2D5C] hover:text-[#17407E] underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                >
                                  Sign In now →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#111827]">
                              Full Name
                            </label>
                            {regFullName && (
                              <span className={`text-[10px] font-bold ${regFullName.trim().length > 0 ? "text-[#0F2D5C] animate-fadeIn" : "text-[#0F2D5C] animate-fadeIn"}`}>
                                {regFullName.trim().length > 0 ? "✓ Name present" : "✗ Cannot be empty"}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g. Abubakar Muhammad"
                            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                              regFullName
                                ? regFullName.trim().length > 0
                                  ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                  : "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                            }`}
                          />
                          {regFullName && regFullName.trim().length === 0 && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn">Name cannot consist of empty spaces only.</p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#111827]">
                              Email
                            </label>
                            {regEmail && (() => {
                              const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail);
                              return (
                                <span className={`text-[10px] font-bold ${isValid ? "text-[#0F2D5C] animate-fadeIn" : "text-[#0F2D5C] animate-fadeIn"}`}>
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
                                  ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                  : "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                            }`}
                          />
                          {regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn">Please enter a valid format (e.g., mail@domain.com).</p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-semibold text-[#111827]">
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
                                    ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                    : "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                  : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] focus:outline-none transition-colors"
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
                              <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] animate-fadeIn text-left">
                                <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280]">
                                  <span>Password Strength</span>
                                  <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                                </div>
                                
                                <div className="flex gap-1 h-1">
                                  {[1, 2, 3, 4].map((index) => (
                                    <div
                                      key={index}
                                      className={`h-full rounded-full flex-1 transition-all duration-300 ${
                                        index <= strength.score ? strength.colorClass : "bg-[#E5E7EB]"
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="pt-2 space-y-1 text-[10px] border-t border-[#E5E7EB]">
                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasMinLength ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasMinLength ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      At least 6 characters (Required)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasLengthEight ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasLengthEight ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      At least 8 characters (Recommended)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasDigit ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasDigit ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
                                      Contains a number (0-9)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {strength.checks.hasSpecial ? (
                                      <Check className="h-3 w-3 text-[#0F2D5C] shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full" />
                                      </div>
                                    )}
                                    <span className={strength.checks.hasSpecial ? "text-[#4B5563] font-semibold" : "text-[#9CA3AF]"}>
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
                            <label className="text-xs font-semibold text-[#111827]">
                              Confirm Password
                            </label>
                            {regConfirmPassword && (
                              <span className={`text-[10px] font-bold ${regPassword === regConfirmPassword ? "text-[#0F2D5C]" : "text-amber-600"}`}>
                                {regPassword === regConfirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showRegConfirmPassword ? "text" : "password"}
                              required
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="Re-enter your password"
                              className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm outline-none transition-all bg-white ${
                                regConfirmPassword
                                  ? regPassword === regConfirmPassword
                                    ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                    : "border-amber-400 focus:ring-4 focus:ring-amber-100 bg-amber-50/30"
                                  : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] focus:outline-none transition-colors"
                              aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showRegConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#111827]">
                              Phone Number
                            </label>
                            {regPhoneNumber && (() => {
                              const isValid = /^0\d{10}$/.test(regPhoneNumber);
                              return (
                                <span className={`text-[10px] font-bold ${isValid ? "text-[#0F2D5C] animate-fadeIn" : "text-[#0F2D5C] animate-fadeIn"}`}>
                                  {isValid ? "✓ Valid 11 digits" : !regPhoneNumber.startsWith("0") ? "✗ Must start with 0" : regPhoneNumber.length !== 11 ? `✗ ${regPhoneNumber.length}/11 digits` : "✗ Numbers only"}
                                </span>
                              );
                            })()}
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={regPhoneNumber}
                            onChange={(e) => setRegPhoneNumber(e.target.value)}
                            placeholder="e.g. 08012345678"
                            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all bg-white font-mono tracking-wide ${
                              regPhoneNumber
                                ? (() => {
                                    const isValid = /^0\d{10}$/.test(regPhoneNumber);
                                    return isValid
                                      ? "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]"
                                      : "border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB] bg-[#F5F7FA]";
                                  })()
                                : "border-[#E5E7EB] focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                            }`}
                          />
                          {regPhoneNumber && !/^0\d{10}$/.test(regPhoneNumber) && (
                            <p className="text-[10px] text-[#0F2D5C] font-semibold animate-fadeIn">
                              Phone number must be exactly 11 digits and must start with 0.
                            </p>
                          )}
                        </div>





                        {/* Interactive Legal & NDPR Consent Checkboxes */}
                        <div className="pt-2">
                          <LegalConsentBox
                            agreeTerms={regAgreedTerms}
                            onAgreeTermsChange={setRegAgreedTerms}
                            ackPrivacy={regAgreedPrivacy}
                            onAckPrivacyChange={setRegAgreedPrivacy}
                            agreeKyc={regAgreedKyc}
                            onAgreeKycChange={setRegAgreedKyc}
                            marketingEmail={regMarketingAccepted}
                            onMarketingEmailChange={setRegMarketingAccepted}
                            onOpenDocument={(docId) => setQuickLegalModalDocId(docId)}
                            showError={!!authError && (!regAgreedTerms || !regAgreedPrivacy || !regAgreedKyc)}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading || authSuccessState !== null}
                          className={`w-full py-3.5 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 focus:ring-4 focus:outline-none ${
                            authSuccessState === "register"
                              ? "bg-[#0F2D5C] hover:bg-[#17407E] focus:ring-[#E5E7EB]"
                              : "bg-[#082051] hover:bg-[#06183e] active:scale-98 shadow-sm focus:ring-[#E5E7EB] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
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

                        {/* Legal terms agreement notice */}
                        <div className="pt-3 text-[11px] text-[#6B7280] leading-relaxed text-center">
                          By creating an account, you agree to SmartLink NG&apos;s{" "}
                          <button
                            type="button"
                            onClick={() => setQuickLegalModalDocId("terms-of-service")}
                            className="text-[#0F2D5C] font-semibold hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                          >
                            Terms of Service
                          </button>
                          ,{" "}
                          <button
                            type="button"
                            onClick={() => setQuickLegalModalDocId("privacy-policy")}
                            className="text-[#0F2D5C] font-semibold hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                          >
                            Privacy Policy
                          </button>
                          , and{" "}
                          <button
                            type="button"
                            onClick={() => setQuickLegalModalDocId("kyc-notice")}
                            className="text-[#0F2D5C] font-semibold hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                          >
                            KYC Policy
                          </button>
                          .
                        </div>
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
                            className="text-[#0F2D5C] hover:text-[#17407E] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                {/* Brand Column */}
                <div className="space-y-3 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={dynamicLogo}
                      alt="Smart Link Nigeria"
                      className="h-12 sm:h-14 w-auto max-w-[220px] object-contain shrink-0"
                      referrerPolicy="no-referrer"
                      onError={handleLogoError}
                    />
                  </div>
                  <p className="text-[11px] text-[#4B5563] font-normal leading-relaxed">
                    Smart Link Nigeria Computer is a premier technology enterprise and authorized service channel in Nigeria, providing professional CAC business registrations, reliable biometrics identity solutions, WAEC/JAMB scratch card distributions, and comprehensive enterprise ICT solutions.
                  </p>
                  <p className="text-[10px] text-[#6B7280] font-mono">RC: 9347502 &bull; BN Registered</p>
                </div>

                {/* Quick Navigation */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Quick Links</p>
                  <ul className="space-y-2 text-[11px]">
                    <li>
                      <button
                        onClick={() => navigateToView("HOME")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Home Page
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToView(currentUser ? "SERVICES" : "HOME")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Digital Services
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToView("DASHBOARD")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        {currentUser ? "User Dashboard" : "Client Portal"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal()}
                        className="text-[#0F2D5C] font-bold hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Legal & Compliance Hub
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Legal & Policies Column */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Legal & Policies</p>
                  <ul className="space-y-1.5 text-[11px]">
                    <li>
                      <button
                        onClick={() => navigateToLegal("privacy-policy")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("terms-of-service")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Terms of Service
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("refund-policy")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Refund & Cancellation
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("wallet-terms")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Wallet Terms & Conditions
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("payment-terms")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Payment Terms
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("kyc-notice")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        KYC & Identity Notice
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("data-protection")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        NDPR Data Protection
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLegal("disclaimer")}
                        className="text-[#4B5563] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Third-Party Disclaimer
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Contact & Hours */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Support & Inquiries</p>
                  <p className="text-[11px] text-[#4B5563] leading-relaxed">
                    <strong>Email:</strong> Smartlinkcomputerbusiness@gmail.com<br />
                    <strong>Tel:</strong> +234 808 549 0982<br />
                    <strong>WhatsApp:</strong> +234 904 773 8212<br />
                    <strong>Hours:</strong> Mon – Sat: 8:00 AM – 6:00 PM WAT
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigateToLegal("acceptable-use")}
                      className="text-[11px] text-[#6B7280] hover:text-[#111827] transition-colors bg-transparent border-none p-0 cursor-pointer underline"
                    >
                      Report Fraud / Abuse &rarr;
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[#6B7280]">
                <p>© {new Date().getFullYear()} Smart Link Computer Business (RC 9347502). All rights reserved.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigateToLegal("terms-of-service")}
                    className="text-[#6B7280] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    Terms
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => navigateToLegal("privacy-policy")}
                    className="text-[#6B7280] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    Privacy
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => navigateToLegal("cookie-policy")}
                    className="text-[#6B7280] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    Cookies
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => navigateToLegal("disclaimer")}
                    className="text-[#6B7280] hover:text-[#0F2D5C] transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    Disclaimers
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => navigateToLegal()}
                    className="text-[#0F2D5C] font-bold hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    All Policies
                  </button>
                </div>
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
        </>
      )}

      {/* Quick Legal Policy Slide-over Modal */}
      {quickLegalModalDocId && (
        <LegalQuickModal
          docId={quickLegalModalDocId}
          documentId={quickLegalModalDocId}
          isOpen={true}
          onClose={() => setQuickLegalModalDocId(null)}
          onOpenFullPage={(docId) => {
            setQuickLegalModalDocId(null);
            navigateToLegal(docId);
          }}
          onOpenFullView={(docId) => {
            setQuickLegalModalDocId(null);
            navigateToLegal(docId);
          }}
        />
      )}

      {/* User Legal Agreements Modal */}
      {showUserAgreementsModal && currentUser && (
        <UserLegalAgreementsModal
          isOpen={showUserAgreementsModal}
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onClose={() => setShowUserAgreementsModal(false)}
          onOpenDocument={(docId) => {
            setShowUserAgreementsModal(false);
            navigateToLegal(docId);
          }}
        />
      )}

      {/* Policy Re-Acceptance Modal (NDPR Major Changes) */}
      {showReAcceptanceModal && pendingReAcceptancePolicies.length > 0 && currentUser && (
        <PolicyUpdateReAcceptanceModal
          userId={currentUser.uid}
          userEmail={currentUser.email}
          pendingPolicies={pendingReAcceptancePolicies}
          onAccepted={() => {
            setShowReAcceptanceModal(false);
            setPendingReAcceptancePolicies([]);
            setToast({
              message: "Platform policies updated and re-accepted successfully!",
              type: "success",
            });
          }}
          onOpenDocumentView={(docId) => setQuickLegalModalDocId(docId)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#E5E7EB] rounded-2xl p-6 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <button
                type="button"
                onClick={cancelLogout}
                className="absolute top-4 right-4 p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#111827]/60 text-[#0F2D5C] dark:text-[#E5E7EB] flex items-center justify-center shadow-xs">
                <LogOut className="h-6 w-6 ml-0.5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-[#4B5563] dark:text-[#6B7280] leading-relaxed">
                  You are currently signed in. Navigating back or exiting will sign you out of your account session. Are you sure you want to sign out?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="flex-1 py-2.5 px-4 bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] active:scale-98 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-[#0F2D5C]/20 cursor-pointer flex items-center justify-center gap-1.5"
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
