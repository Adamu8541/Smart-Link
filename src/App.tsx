/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense } from "react";
import SmartLinkLandingPage from "./components/landing/SmartLinkLandingPage";
import { RouteLoadingFallback } from "./components/common/RouteLoadingFallback";
import { lazyWithRetry } from "./utils/lazyRetry";

// Lazy-loaded routes & heavy components with automatic retry & stale chunk recovery
const Navigation = lazyWithRetry(() => import("./components/Navigation"), "Navigation");
const ServicesGrid = lazyWithRetry(() => import("./components/ServicesGrid"), "ServicesGrid");
const ServiceModal = lazyWithRetry(() => import("./components/ServiceModal"), "ServiceModal");
const Dashboards = lazyWithRetry(() => import("./components/Dashboards"), "Dashboards");
const AdminLogin = lazyWithRetry(() => import("./components/admin/AdminLogin"), "AdminLogin");
const AdminGuard = lazyWithRetry(() => import("./components/admin/AdminGuard"), "AdminGuard");
const AdminDashboardOverview = lazyWithRetry(() => import("./components/admin/AdminDashboardOverview"), "AdminDashboardOverview");
const AdminDashboardLayout = lazyWithRetry(() => import("./components/admin/layout/AdminDashboardLayout"), "AdminDashboardLayout");
const AdminDashboardHome = lazyWithRetry(() => import("./components/admin/views/AdminDashboardHome"), "AdminDashboardHome");
const AdminPermissionsView = lazyWithRetry(() => import("./components/admin/views/AdminPermissionsView"), "AdminPermissionsView");
const AdminUsersView = lazyWithRetry(() => import("./components/admin/views/AdminUsersView").then(m => ({ default: m.AdminUsersView })), "AdminUsersView");
const AdminWalletView = lazyWithRetry(() => import("./components/admin/views/AdminWalletView").then(m => ({ default: m.AdminWalletView })), "AdminWalletView");
const AdminTransactionsView = lazyWithRetry(() => import("./components/admin/views/AdminTransactionsView").then(m => ({ default: m.AdminTransactionsView })), "AdminTransactionsView");
const AdminProvidersView = lazyWithRetry(() => import("./components/admin/views/AdminProvidersView").then(m => ({ default: m.AdminProvidersView })), "AdminProvidersView");
const AdminMultiGatewayView = lazyWithRetry(() => import("./components/admin/views/AdminMultiGatewayView").then(m => ({ default: m.AdminMultiGatewayView })), "AdminMultiGatewayView");
const ApiRequestBuilderView = lazyWithRetry(() => import("./components/admin/views/ApiRequestBuilderView"), "ApiRequestBuilderView");
const ApiResponseMapperView = lazyWithRetry(() => import("./components/admin/views/ApiResponseMapperView"), "ApiResponseMapperView");
const AdminSettingsView = lazyWithRetry(() => import("./components/admin/views/AdminSettingsView").then(m => ({ default: m.AdminSettingsView })), "AdminSettingsView");
const AdminNotificationsView = lazyWithRetry(() => import("./components/admin/views/AdminNotificationsView").then(m => ({ default: m.AdminNotificationsView })), "AdminNotificationsView");
const UserNotificationCenter = lazyWithRetry(() => import("./components/notification/UserNotificationCenter").then(m => ({ default: m.UserNotificationCenter })), "UserNotificationCenter");
const AdminSecurityView = lazyWithRetry(() => import("./components/admin/views/AdminSecurityView").then(m => ({ default: m.AdminSecurityView })), "AdminSecurityView");
const AdminServicesView = lazyWithRetry(() => import("./components/admin/views/AdminServicesView").then(m => ({ default: m.AdminServicesView })), "AdminServicesView");
const AdminReconciliationView = lazyWithRetry(() => import("./components/admin/views/AdminReconciliationView").then(m => ({ default: m.AdminReconciliationView })), "AdminReconciliationView");
const AdminLegalComplianceView = lazyWithRetry(() => import("./components/admin/views/AdminLegalComplianceView").then(m => ({ default: m.AdminLegalComplianceView })), "AdminLegalComplianceView");
const AdminRefundsView = lazyWithRetry(() => import("./components/admin/views/AdminPlaceholderViews").then(m => ({ default: m.AdminRefundsView })), "AdminRefundsView");
const AdminReportsView = lazyWithRetry(() => import("./components/admin/views/AdminPlaceholderViews").then(m => ({ default: m.AdminReportsView })), "AdminReportsView");
const AdminSystemView = lazyWithRetry(() => import("./components/admin/views/AdminPlaceholderViews").then(m => ({ default: m.AdminSystemView })), "AdminSystemView");
const ForgotPasswordView = lazyWithRetry(() => import("./components/auth/ForgotPasswordView").then(m => ({ default: m.ForgotPasswordView })), "ForgotPasswordView");
const ResetPasswordView = lazyWithRetry(() => import("./components/auth/ResetPasswordView").then(m => ({ default: m.ResetPasswordView })), "ResetPasswordView");
const VerifyEmailView = lazyWithRetry(() => import("./components/auth/VerifyEmailView").then(m => ({ default: m.VerifyEmailView })), "VerifyEmailView");
const AuthActionHandler = lazyWithRetry(() => import("./components/auth/AuthActionHandler").then(m => ({ default: m.AuthActionHandler })), "AuthActionHandler");
const LegalCenter = lazyWithRetry(() => import("./components/legal").then(m => ({ default: m.LegalCenter })), "LegalCenter");
const LegalDocumentView = lazyWithRetry(() => import("./components/legal").then(m => ({ default: m.LegalDocumentView })), "LegalDocumentView");
const LegalQuickModal = lazyWithRetry(() => import("./components/legal").then(m => ({ default: m.LegalQuickModal })), "LegalQuickModal");
const UserLegalAgreementsModal = lazyWithRetry(() => import("./components/legal").then(m => ({ default: m.UserLegalAgreementsModal })), "UserLegalAgreementsModal");
const PolicyUpdateReAcceptanceModal = lazyWithRetry(() => import("./components/legal").then(m => ({ default: m.PolicyUpdateReAcceptanceModal })), "PolicyUpdateReAcceptanceModal");
const AuthPortal = lazyWithRetry(() => import("./components/auth/AuthPortal").then(m => ({ default: m.AuthPortal })), "AuthPortal");
const ExploreServicesPublicView = lazyWithRetry(() => import("./components/public/ExploreServicesPublicView").then(m => ({ default: m.ExploreServicesPublicView })), "ExploreServicesPublicView");
const BillsPublicView = lazyWithRetry(() => import("./components/public/BillsPublicView").then(m => ({ default: m.BillsPublicView })), "BillsPublicView");
const VerificationPublicView = lazyWithRetry(() => import("./components/public/VerificationPublicView").then(m => ({ default: m.VerificationPublicView })), "VerificationPublicView");
const ApiDocsPublicView = lazyWithRetry(() => import("./components/public/ApiDocsPublicView").then(m => ({ default: m.ApiDocsPublicView })), "ApiDocsPublicView");
const AccountSecurityView = lazyWithRetry(() => import("./components/account/AccountSecurityView").then(m => ({ default: m.AccountSecurityView })), "AccountSecurityView");

import { ServiceItem } from "./data/servicesData";
import { AdminSession, getStoredAdminSession, clearAdminSession } from "./services/adminAuthTypes";
import { UserProfile, UserRole } from "./types";
import { navigationManager, useModalBackHandler } from "./services/navigationManager";
import { Sparkles, Lock, Check, AlertCircle, LogOut, X } from "lucide-react";
import { SmartLinkLogoMark } from "./components/ui/SmartLinkLogoMark";
import { FaviconLoader } from "./components/ui/FaviconLoader";
import { DEFAULT_LOGO_URL, handleLogoError } from "./utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;
import { getFriendlyErrorMessage, safeFetchJson } from "./utils/authErrorHandler";
import { soundFx } from "./utils/audioEffects";
import { AuthFormSkeleton } from "./components/ui/AuthSkeleton";

import { useSiteConfig } from "./context/SiteConfigContext";
import { MaintenanceScreen } from "./components/maintenance/MaintenanceScreen";
import { MaintenanceNoticeBanner } from "./components/maintenance/MaintenanceNoticeBanner";
import { formatNaira } from "./utils/formatUtils";
import { legalConsentService } from "./services/legalConsentService";
import { SupabaseAuthService, isSupabaseConfigured } from "./services/supabaseAuth";

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
  "compliance": "LEGAL_DOCUMENT_COMPLIANCE",
  "security": "LEGAL_DOCUMENT_SECURITY",
  "sla": "LEGAL_DOCUMENT_SLA",
  "marketing-policy": "LEGAL_DOCUMENT_MARKETING",
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
  LEGAL_DOCUMENT_COMPLIANCE: "compliance",
  LEGAL_DOCUMENT_SECURITY: "security",
  LEGAL_DOCUMENT_SLA: "sla",
  LEGAL_DOCUMENT_MARKETING: "marketing-policy",
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // 1. Check Supabase active session token first
  try {
    const { SupabaseAuthService, isSupabaseConfigured } = await import("./services/supabaseAuth");
    if (isSupabaseConfigured) {
      const supaSession = await SupabaseAuthService.getSession();
      if (supaSession?.access_token) {
        headers["Authorization"] = `Bearer ${supaSession.access_token}`;
        return headers;
      }
    }
  } catch {}

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
  const { maintenanceActive, config: siteConfig, logoUrl: contextLogoUrl, refreshConfig: refreshSiteConfig, isServiceUnderMaintenance } = useSiteConfig();
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
  useModalBackHandler(quickLegalModalDocId !== null, "app-quick-legal-modal", () => setQuickLegalModalDocId(null));

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
    if (path === "/explore-services") return "PUBLIC_EXPLORE_SERVICES";
    if (path === "/services" && !hasUser && !hasAdmin) return "PUBLIC_EXPLORE_SERVICES";
    if (
      (path === "/bills" ||
        path === "/electricity" ||
        path === "/data" ||
        path === "/airtime" ||
        path === "/cable-tv" ||
        path === "/exam-pins" ||
        path === "/vtu") &&
      !hasUser &&
      !hasAdmin
    ) {
      return "PUBLIC_BILLS";
    }
    if (
      (path === "/verification" ||
        path === "/nin" ||
        path === "/bvn" ||
        path === "/cac" ||
        path === "/scuml") &&
      !hasUser &&
      !hasAdmin
    ) {
      return "PUBLIC_VERIFICATION";
    }
    if (path === "/api-docs" || path === "/developer-api" || path === "/docs") {
      return "PUBLIC_API_DOCS";
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
      path === "/compliance" ||
      path === "/security" ||
      path === "/sla" ||
      path === "/wallet-terms" ||
      path === "/payment-terms" ||
      path === "/cookie-policy" ||
      path === "/kyc-notice" ||
      path === "/acceptable-use" ||
      path === "/data-protection" ||
      path === "/disclaimer" ||
      path === "/marketing-policy"
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
    if (path === "/account-security" || path === "/security-settings") return "ACCOUNT_SECURITY";
    if (path === "/dashboard") return "DASHBOARD";
    if (path === "/services") return "SERVICES";
    if (path === "/admin/login" || path.startsWith("/admin")) return "ADMIN_DASHBOARD";
    return "HOME";
  });
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  useModalBackHandler(selectedService !== null, "app-service-modal", () => setSelectedService(null));
  const [showServicesSummaryDropdown, setShowServicesSummaryDropdown] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  useModalBackHandler(showLogoutModal, "app-logout-modal", () => setShowLogoutModal(false));

  // Admin Session & RBAC State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getStoredAdminSession());
  const [adminSecuritySubRoute, setAdminSecuritySubRoute] = useState<string>("/admin/security");

  const routeToViewMap: Record<string, string> = {
    "/": "HOME",
    "/explore-services": "PUBLIC_EXPLORE_SERVICES",
    "/bills": "PUBLIC_BILLS",
    "/electricity": "PUBLIC_BILLS",
    "/data": "PUBLIC_BILLS",
    "/airtime": "PUBLIC_BILLS",
    "/cable-tv": "PUBLIC_BILLS",
    "/exam-pins": "PUBLIC_BILLS",
    "/vtu": "PUBLIC_BILLS",
    "/verification": "PUBLIC_VERIFICATION",
    "/nin": "PUBLIC_VERIFICATION",
    "/bvn": "PUBLIC_VERIFICATION",
    "/cac": "PUBLIC_VERIFICATION",
    "/scuml": "PUBLIC_VERIFICATION",
    "/api-docs": "PUBLIC_API_DOCS",
    "/developer-api": "PUBLIC_API_DOCS",
    "/docs": "PUBLIC_API_DOCS",
    "/dashboard": "DASHBOARD",
    "/account-security": "ACCOUNT_SECURITY",
    "/security-settings": "ACCOUNT_SECURITY",
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
    "/compliance": "LEGAL_DOCUMENT_COMPLIANCE",
    "/security": "LEGAL_DOCUMENT_SECURITY",
    "/sla": "LEGAL_DOCUMENT_SLA",
    "/wallet-terms": "LEGAL_DOCUMENT_WALLET",
    "/payment-terms": "LEGAL_DOCUMENT_PAYMENT",
    "/cookie-policy": "LEGAL_DOCUMENT_COOKIE",
    "/kyc-notice": "LEGAL_DOCUMENT_KYC",
    "/acceptable-use": "LEGAL_DOCUMENT_ACCEPTABLE_USE",
    "/data-protection": "LEGAL_DOCUMENT_DATA_PROTECTION",
    "/disclaimer": "LEGAL_DOCUMENT_DISCLAIMER",
    "/marketing-policy": "LEGAL_DOCUMENT_MARKETING",
    "/legal/privacy-policy": "LEGAL_DOCUMENT_PRIVACY",
    "/legal/terms-of-service": "LEGAL_DOCUMENT_TERMS",
    "/legal/refund-policy": "LEGAL_DOCUMENT_REFUND",
    "/legal/compliance": "LEGAL_DOCUMENT_COMPLIANCE",
    "/legal/security": "LEGAL_DOCUMENT_SECURITY",
    "/legal/sla": "LEGAL_DOCUMENT_SLA",
    "/legal/wallet-terms": "LEGAL_DOCUMENT_WALLET",
    "/legal/payment-terms": "LEGAL_DOCUMENT_PAYMENT",
    "/legal/cookie-policy": "LEGAL_DOCUMENT_COOKIE",
    "/legal/kyc-notice": "LEGAL_DOCUMENT_KYC",
    "/legal/acceptable-use": "LEGAL_DOCUMENT_ACCEPTABLE_USE",
    "/legal/data-protection": "LEGAL_DOCUMENT_DATA_PROTECTION",
    "/legal/disclaimer": "LEGAL_DOCUMENT_DISCLAIMER",
    "/legal/marketing-policy": "LEGAL_DOCUMENT_MARKETING",
  };

  const viewToRouteMap: Record<string, string> = {
    HOME: "/",
    PUBLIC_EXPLORE_SERVICES: "/explore-services",
    PUBLIC_BILLS: "/bills",
    PUBLIC_VERIFICATION: "/verification",
    PUBLIC_API_DOCS: "/api-docs",
    DASHBOARD: "/dashboard",
    ACCOUNT_SECURITY: "/account-security",
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
    LEGAL_DOCUMENT_COMPLIANCE: "/compliance",
    LEGAL_DOCUMENT_SECURITY: "/security",
    LEGAL_DOCUMENT_SLA: "/sla",
    LEGAL_DOCUMENT_WALLET: "/wallet-terms",
    LEGAL_DOCUMENT_PAYMENT: "/payment-terms",
    LEGAL_DOCUMENT_COOKIE: "/cookie-policy",
    LEGAL_DOCUMENT_KYC: "/kyc-notice",
    LEGAL_DOCUMENT_ACCEPTABLE_USE: "/acceptable-use",
    LEGAL_DOCUMENT_DATA_PROTECTION: "/data-protection",
    LEGAL_DOCUMENT_DISCLAIMER: "/disclaimer",
    LEGAL_DOCUMENT_MARKETING: "/marketing-policy",
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
  useEffect(() => {
    currentUserRef.current = currentUser;
    navigationManager.setSessionStatus(Boolean(currentUser), Boolean(adminSession));
  }, [currentUser, adminSession]);
  useEffect(() => {
    adminSessionRef.current = adminSession;
    navigationManager.setSessionStatus(Boolean(currentUser), Boolean(adminSession));
  }, [adminSession]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  useEffect(() => {
    const unregister = navigationManager.registerViewChangeHandler((view) => {
      setCurrentView(view);
    });
    return unregister;
  }, []);

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
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const targetRoute = viewToRouteMap[view] || (view === "DASHBOARD" ? "/dashboard" : "/");
    navigationManager.pushView(view, targetRoute, replace);
  };

  // Ensure every page view and popup shows from the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView, selectedService]);

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

  // Registration & Modal states
  const [isRegistering, setIsRegistering] = useState(false);

  // Legal Consent & Compliance State
  const [showUserAgreementsModal, setShowUserAgreementsModal] = useState(false);
  useModalBackHandler(showUserAgreementsModal, "app-agreements-modal", () => setShowUserAgreementsModal(false));
  const [showReAcceptanceModal, setShowReAcceptanceModal] = useState(false);
  useModalBackHandler(showReAcceptanceModal, "app-reacceptance-modal", () => setShowReAcceptanceModal(false));
  const [pendingReAcceptancePolicies, setPendingReAcceptancePolicies] = useState<any[]>([]);

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
    cacBaseFee: 28000,
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
      if (navigationManager.hasOpenModals()) {
        navigationManager.handlePopState(e, routeToViewMap);
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
      setCurrentView("RESET_PASSWORD");
    }

    const verificationStatus = params.get("verificationStatus");
    const email = params.get("email");
    const msg = params.get("message");
    if (verificationStatus) {
      
      if (verificationStatus === "success") {
        setToast({
          message: msg || "Your email address is verified! You can now log in securely.",
          type: "success"
        });
        
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

  // Continuous Supabase Authentication & Session Synchronization Listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check existing session
    SupabaseAuthService.getSession().then(async (session) => {
      if (session?.user) {
        const supaUser = session.user;
        const email = (supaUser.email || "").toLowerCase().trim();
        const fullName = supaUser.user_metadata?.full_name || email.split("@")[0] || "Smart Link User";
        const phone = supaUser.user_metadata?.phone_number || supaUser.phone || "";
        const isVerified = true;

        try {
          const syncRes = await safeFetchJson("/api/auth/sync-supabase-user", {
            method: "POST",
            headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            body: JSON.stringify({
              id: supaUser.id,
              uid: supaUser.id,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              isVerified: true,
            }),
          });

          let userObj = syncRes.ok && syncRes.data?.user ? syncRes.data.user : null;
          if (!userObj) {
            userObj = {
              uid: supaUser.id,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              role: UserRole.CUSTOMER,
              walletBalance: 0.0,
              referralCode: supaUser.user_metadata?.referral_code || "SL" + Math.floor(1000 + Math.random() * 9000),
              isVerified: true,
              createdAt: supaUser.created_at || new Date().toISOString(),
            };
          }

          setCurrentUser(userObj);
          localStorage.setItem("smart_link_user", JSON.stringify(userObj));
        } catch (err) {
          console.warn("[Supabase session restore note]:", err);
        }
      }
    });

    const { data: authSubscription } = SupabaseAuthService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const supaUser = session.user;
        const email = (supaUser.email || "").toLowerCase().trim();
        const fullName = supaUser.user_metadata?.full_name || email.split("@")[0] || "Smart Link User";
        const phone = supaUser.user_metadata?.phone_number || supaUser.phone || "";
        const isVerified = true;

        try {
          const syncRes = await safeFetchJson("/api/auth/sync-supabase-user", {
            method: "POST",
            headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            body: JSON.stringify({
              id: supaUser.id,
              uid: supaUser.id,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              isVerified: true,
            }),
          });

          let userObj = syncRes.ok && syncRes.data?.user ? syncRes.data.user : null;
          if (!userObj) {
            userObj = {
              uid: supaUser.id,
              email: email,
              fullName: fullName,
              phoneNumber: phone,
              role: UserRole.CUSTOMER,
              walletBalance: 0.0,
              referralCode: supaUser.user_metadata?.referral_code || "SL" + Math.floor(1000 + Math.random() * 9000),
              isVerified: true,
              createdAt: supaUser.created_at || new Date().toISOString(),
            };
          }

          setCurrentUser(userObj);
          localStorage.setItem("smart_link_user", JSON.stringify(userObj));
        } catch (err) {
          console.warn("[Supabase onAuthStateChange note]:", err);
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        localStorage.removeItem("smart_link_user");
      }
    });

    return () => {
      authSubscription?.subscription?.unsubscribe?.();
    };
  }, []);

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
          message: `💳 Real-Time Webhook Alert: ${formatNaira(amount, true)} credited to your digital wallet via ${gateway}!`,
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

    if (prevBalanceRef.current !== null && (currentUser.walletBalance ?? 0) > (prevBalanceRef.current ?? 0)) {
      const creditedAmt = (currentUser.walletBalance ?? 0) - (prevBalanceRef.current ?? 0);
      setToast({
        message: `⚡ Webhook Credit Alert: ${formatNaira(creditedAmt, true)} has been credited to your wallet in real-time!`,
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
            if (prevBalanceRef.current !== null && (data.user.walletBalance ?? 0) > (prevBalanceRef.current ?? 0)) {
              const creditedAmt = (data.user.walletBalance ?? 0) - (prevBalanceRef.current ?? 0);
              setToast({
                message: `🎉 Real-Time Webhook Credit: ${formatNaira(creditedAmt, true)} added to your digital wallet!`,
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

    if (isSupabaseConfigured) {
      SupabaseAuthService.signOut().catch(() => {});
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

  

  return (
    <div className={`min-h-screen bg-[#F5F7FA] transition-colors duration-300 ${isDarkMode ? "dark-theme-active" : ""} ${!currentUser ? "flex flex-col bg-white" : "flex flex-col lg:flex-row"}`}>
      {/* Real-time Global Toast Notifications */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-4">
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
        </div>
      )}

      {/* Global Top Maintenance Advisory Notice Banner */}
      {!currentView.startsWith("ADMIN_") && <MaintenanceNoticeBanner />}

      {/* Global Full Platform Maintenance Mode Interceptor Screen */}
      {maintenanceActive && !currentView.startsWith("ADMIN_") ? (
        <MaintenanceScreen
          scope="GLOBAL"
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
        <Suspense fallback={null}>
          <Navigation
            currentView={currentView}
            onNavigate={navigateToView}
            currentUser={currentUser}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onSelectService={setSelectedService}
            onRefreshUser={fetchUserProfile}
            onSetAuthStates={({ isRegistering }) => { setIsRegistering(isRegistering); }}
          />
        </Suspense>
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
              currentUser={currentUser}
              onLogin={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(false);
                
                
              }}
              onRegister={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(true);
                
                
              }}
              onGetStarted={() => {
                navigateToView("DASHBOARD");
                setIsRegistering(true);
                
                
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

          <Suspense fallback={<RouteLoadingFallback />}>
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

            {currentView === "ACCOUNT_SECURITY" && currentUser && (
              <AccountSecurityView
                currentUser={currentUser}
                onBack={() => {
                  window.history.pushState({}, "", "/dashboard");
                  setCurrentView("DASHBOARD");
                }}
                onRefreshUser={fetchUserProfile}
                isDarkMode={isDarkMode}
              />
            )}
            {currentView === "ACCOUNT_SECURITY" && !currentUser && (
              <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
                <p className="text-sm text-[#4B5563]">Authentication required to access account security settings.</p>
                <button
                  onClick={() => {
                    window.history.pushState({}, "", "/");
                    setCurrentView("HOME");
                  }}
                  className="px-4 py-2 bg-[#0F2D5C] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Sign In to Continue
                </button>
              </div>
            )}

            {currentView === "USER_NOTIFICATIONS" && (
              <UserNotificationCenter
                currentUser={currentUser}
                onNavigateHome={() => setCurrentView("DASHBOARD")}
              />
            )}

            {/* Custom Auth Action Pages */}
            {currentView === "FORGOT_PASSWORD" && (
              <ForgotPasswordView
                onNavigateToLogin={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("DASHBOARD");
                  setIsRegistering(false);
                  
                  
                }}
                onNavigateToRegister={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("DASHBOARD");
                  setIsRegistering(true);
                  
                  
                }}
                onNavigateHome={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("HOME");
                }}
                initialEmail={""}
              />
            )}

            {currentView === "RESET_PASSWORD" && (
              <ResetPasswordView
                onNavigateToLogin={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("DASHBOARD");
                  setIsRegistering(false);
                  
                  
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
                  
                  
                }}
                onNavigateHome={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("HOME");
                }}
                onNavigateToDashboard={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("DASHBOARD");
                }}
                userEmailFromProps={""}
              />
            )}

            {currentView === "AUTH_ACTION" && (
              <AuthActionHandler
                onNavigateToLogin={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentView("DASHBOARD");
                  setIsRegistering(false);
                  
                  
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

            {/* Public SEO & Marketing Views */}
            {currentView === "PUBLIC_EXPLORE_SERVICES" && (
              <ExploreServicesPublicView
                onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
                onSelectService={(service) => {
                  if (currentUser) {
                    setSelectedService(service);
                  } else {
                    navigateToView("DASHBOARD");
                    setIsRegistering(false);
                  }
                }}
                onLogin={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(false);
                }}
                onRegister={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(true);
                }}
              />
            )}

            {currentView === "PUBLIC_BILLS" && (
              <BillsPublicView
                onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
                onSelectService={(service) => {
                  if (currentUser) {
                    setSelectedService(service);
                  } else {
                    navigateToView("DASHBOARD");
                    setIsRegistering(false);
                  }
                }}
                onLogin={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(false);
                }}
                onRegister={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(true);
                }}
              />
            )}

            {currentView === "PUBLIC_VERIFICATION" && (
              <VerificationPublicView
                onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
                onSelectService={(service) => {
                  if (currentUser) {
                    setSelectedService(service);
                  } else {
                    navigateToView("DASHBOARD");
                    setIsRegistering(false);
                  }
                }}
                onLogin={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(false);
                }}
                onRegister={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(true);
                }}
              />
            )}

            {currentView === "PUBLIC_API_DOCS" && (
              <ApiDocsPublicView
                onNavigateHome={() => navigateToView(currentUser ? "DASHBOARD" : "HOME")}
                onLogin={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(false);
                }}
                onRegister={() => {
                  navigateToView("DASHBOARD");
                  setIsRegistering(true);
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
          </Suspense>

          {/* Secure Node Manual Login / Register Form */}
          {currentView === "DASHBOARD" && !currentUser && (
            (() => {
              const isLoginMaint = Boolean(siteConfig.maintenance?.loginMaintenanceMode);
              const isSignupMaint = Boolean(siteConfig.maintenance?.signupMaintenanceMode);

              if (isLoginMaint && !isRegistering) {
                return (
                  <MaintenanceScreen
                    scope="LOGIN"
                    onAdminLoginRequested={() => navigateToView("ADMIN_LOGIN")}
                    onAdminSessionCreated={(sess) => {
                      setAdminSession(sess);
                      navigateToView("ADMIN_DASHBOARD");
                    }}
                    onBackToSafety={() => navigateToView("HOME")}
                  />
                );
              }

              if (isSignupMaint && isRegistering) {
                return (
                  <MaintenanceScreen
                    scope="REGISTRATION"
                    onAdminLoginRequested={() => navigateToView("ADMIN_LOGIN")}
                    onAdminSessionCreated={(sess) => {
                      setAdminSession(sess);
                      navigateToView("ADMIN_DASHBOARD");
                    }}
                    onBackToSafety={() => navigateToView("HOME")}
                  />
                );
              }

              return (
                <Suspense fallback={<AuthFormSkeleton />}>
                  <AuthPortal
                    initialIsRegistering={isRegistering}
                    onAuthSuccess={(user) => {
                      setCurrentUser(user);
                      navigateToView("DASHBOARD");
                      setIsRegistering(false);
                    }}
                    onNavigateHome={() => navigateToView("HOME")}
                    onOpenLegalDoc={(docId) => setQuickLegalModalDocId(docId)}
                    onNavigateForgotPassword={() => navigateToView("FORGOT_PASSWORD")}
                    setToast={setToast}
                  />
                </Suspense>
              );
            })()
          )}
        </div>
      </main>

      {/* Global Action Modal for Ordering/Verifying */}
      <Suspense fallback={null}>
        {selectedService && (
          isServiceUnderMaintenance((selectedService as any).code || selectedService.id || selectedService.name) ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="max-w-md w-full">
                <MaintenanceScreen
                  scope="SERVICE"
                  serviceName={selectedService.name}
                  onBackToSafety={() => setSelectedService(null)}
                />
              </div>
            </div>
          ) : (
            <ServiceModal
              service={selectedService}
              onClose={() => setSelectedService(null)}
              currentUser={currentUser}
              onRefreshUser={fetchUserProfile}
            />
          )
        )}
      </Suspense>
        </>
      )}

      {/* Quick Legal Policy Slide-over Modal */}
      <Suspense fallback={null}>
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
      </Suspense>

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
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-[#111827]/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#E5E7EB] rounded-2xl p-6 shadow-2xl space-y-5 text-center relative overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
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
          </div>
        </div>
      )}
    </div>
  );
}
