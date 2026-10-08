/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { getFriendlyErrorMessage, safeFetchJson } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { UserProfile, UserRole } from "../../types";
import { LegalConsentBox } from "../legal";
import { legalConsentService } from "../../services/legalConsentService";
import { SupabaseAuthService, isSupabaseConfigured } from "../../services/supabaseAuth";
import { BiometricAuthService } from "../../services/biometricAuthService";
import { LoginLoaderModal } from "./LoginLoaderModal";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";

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

export interface AuthPortalProps {
  initialIsRegistering?: boolean;
  onAuthSuccess: (user: UserProfile) => void;
  onNavigateHome: () => void;
  onOpenLegalDoc: (docId: string) => void;
  onNavigateForgotPassword?: () => void;
  setToast: (toast: { message: string; type: "success" | "error" | "info" } | null) => void;
}

export const AuthPortal: React.FC<AuthPortalProps>= ({
  initialIsRegistering = false,
  onAuthSuccess,
  onNavigateHome,
  onOpenLegalDoc,
  onNavigateForgotPassword,
  setToast,
}) => {
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { logoUrl, siteName } = useSiteConfig();

  const useSupabase = isSupabaseConfigured;

  // Login Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessState, setAuthSuccessState] = useState<"login" | "register" | null>(null);

  // Biometric / Passkey State
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  useEffect(() => {
    BiometricAuthService.isBiometricSupported().then(setIsBiometricSupported);
  }, []);

  const handleBiometricSignIn = async () => {
    if (authLoading || isBiometricLoading) return;
    setIsBiometricLoading(true);
    setAuthError(null);
    try {
      const res = await BiometricAuthService.authenticateWithBiometrics(authEmail);
      if (res.success && res.user) {
        setAuthSuccessState("login");
        soundFx.playSuccessSound();
        setToast({ message: "Biometric authentication verified!", type: "success" });
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 500);
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(err.message || "Biometric authentication failed. Please sign in with password.");
    } finally {
      setIsBiometricLoading(false);
    }
  };

  // Registration Form State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regReferralCode, setRegReferralCode] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Legal Consent Checkbox States
  const [regAgreedTerms, setRegAgreedTerms] = useState(false);
  const [regAgreedPrivacy, setRegAgreedPrivacy] = useState(false);
  const [regAgreedKyc, setRegAgreedKyc] = useState(false);
  const [regMarketingAccepted, setRegMarketingAccepted] = useState(false);

  // Reset Password State
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);

  const tokenClean = recoveryToken.trim();
  const isHex = /^[0-9a-fA-F]*$/.test(tokenClean);
  const isCorrectLength = tokenClean.length === 40;
  const isTokenValid = isHex && isCorrectLength;

  // Sync initialIsRegistering prop
  useEffect(() => {
    setIsRegistering(initialIsRegistering);
  }, [initialIsRegistering]);

  // Polling verification status in the background
  useEffect(() => {
    let intervalId: any;
    if (isVerifyingEmail && verificationEmail) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/check-verification-status?email=${encodeURIComponent(verificationEmail)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.isVerified) {
            onAuthSuccess(data.user);
            setIsVerifyingEmail(false);
            setVerificationEmail("");
            setToast({
              message: "Email successfully verified! Welcome to your Smart Link Nigeria portal.",
              type: "success",
            });
          }
        } catch (err) {}
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVerifyingEmail, verificationEmail, onAuthSuccess, setToast]);
  // Direct login form submission
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authEmail || !authPassword) {
      soundFx.playErrorSound();
      setAuthError("Both email and password are required to sign in.");
      return;
    }

    const cleanEmail = authEmail.toLowerCase().trim();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessState(null);

    try {
      // If Supabase is configured, authenticate via Supabase Auth
      if (useSupabase) {
        const supaLogin = await SupabaseAuthService.signIn(cleanEmail, authPassword);
        
        if (!supaLogin.user) {
          throw new Error("Authentication failed. Please check your email and password.");
        }

        // Fetch / Sync user profile using verified Supabase ID & email
        const syncResult = await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: supaLogin.session?.access_token ? { Authorization: `Bearer ${supaLogin.session.access_token}` } : undefined,
          body: JSON.stringify({
            id: supaLogin.user.id,
            uid: supaLogin.user.id,
            email: cleanEmail,
            isVerified: true,
          }),
        });

        let loginUser: any = syncResult.ok && syncResult.data?.user ? syncResult.data.user : null;
        if (!loginUser) {
          loginUser = {
            uid: supaLogin.user.id,
            email: cleanEmail,
            fullName: supaLogin.user.user_metadata?.full_name || cleanEmail.split("@")[0] || "Smart Link User",
            role: "CUSTOMER",
            walletBalance: 0.0,
            referralCode: supaLogin.user.user_metadata?.referral_code || "SL" + Math.floor(1000 + Math.random() * 9000),
            isVerified: true,
            createdAt: new Date().toISOString(),
          };
        }

        // Verify account status
        if (
          loginUser?.status === "SUSPENDED" ||
          loginUser?.status === "INACTIVE" ||
          loginUser?.status === "BLOCKED"
        ) {
          throw new Error(
            "Your account has been strictly blocked or suspended by security administration. Access to the dashboard is denied."
          );
        }

        const sessionToken = supaLogin.session?.access_token || (loginUser as any).token || "";
        if (sessionToken) {
          (loginUser as any).token = sessionToken;
          (loginUser as any).sessionToken = sessionToken;
          localStorage.setItem("smartlink_token", sessionToken);
          localStorage.setItem("token", sessionToken);
        }

        localStorage.setItem("smart_link_user", JSON.stringify(loginUser));
        soundFx.playSuccessSound();
        setAuthSuccessState("login");

        onAuthSuccess(loginUser);
        setAuthEmail("");
        setAuthPassword("");
        setAuthSuccessState(null);
        setToast({
          message: "Successfully signed in! Welcome to your Smart Link Nigeria portal.",
          type: "success",
        });
        return;
      }

      // Fallback API authentication if Supabase is not directly connected in client
      const res = await safeFetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail, password: authPassword }),
      });

      if (!res.ok || !res.data?.user) {
        throw new Error(res.data?.message || res.data?.error || res.error || "Authentication failed. Please check your email and password.");
      }

      const loginUser = res.data.user;
      if (
        loginUser?.status === "SUSPENDED" ||
        loginUser?.status === "INACTIVE" ||
        loginUser?.status === "BLOCKED"
      ) {
        throw new Error(
          "Your account has been strictly blocked or suspended by security administration. Access to the dashboard is denied."
        );
      }

      const fallbackToken = res.data?.token || res.data?.sessionToken || (loginUser as any).token || "";
      if (fallbackToken) {
        (loginUser as any).token = fallbackToken;
        (loginUser as any).sessionToken = fallbackToken;
        localStorage.setItem("smartlink_token", fallbackToken);
        localStorage.setItem("token", fallbackToken);
      }

      localStorage.setItem("smart_link_user", JSON.stringify(loginUser));
      soundFx.playSuccessSound();
      setAuthSuccessState("login");

      onAuthSuccess(loginUser);
      setAuthEmail("");
      setAuthPassword("");
      setAuthSuccessState(null);
      setToast({
        message: "Successfully signed in! Welcome to your Smart Link Nigeria portal.",
        type: "success",
      });
    } catch (err: any) {
      soundFx.playErrorSound();
      const friendlyMsg = getFriendlyErrorMessage(err);
      setAuthError(friendlyMsg);
      setAuthPassword("");
    } finally {
      setAuthLoading(false);
    }
  };

  // Registration form submission
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

      // If Supabase is configured, register user via Supabase Auth
      if (useSupabase) {
        const supaReg = await SupabaseAuthService.signUp({
          email: cleanEmail,
          password: regPassword,
          fullName: regFullName.trim(),
          phoneNumber: cleanPhone,
          referralCode: regReferralCode.trim(),
        });

        const supaUser = supaReg.user;
        if (!supaUser) {
          throw new Error("Registration failed. Unable to create user account.");
        }

        // Record NDPR legal agreements
        try {
          await legalConsentService.recordBatchAcceptances({
            userId: supaUser.id,
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

        // Sync Supabase user with backend and Storage mirror
        const syncRes = await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: supaReg.session?.access_token ? { Authorization: `Bearer ${supaReg.session.access_token}` } : undefined,
          body: JSON.stringify({
            id: supaUser.id,
            uid: supaUser.id,
            email: cleanEmail,
            fullName: regFullName.trim(),
            phoneNumber: cleanPhone,
            referralCode: regReferralCode.trim(),
            isVerified: true,
          }),
        });

        const activeUser = syncRes.ok && syncRes.data?.user ? syncRes.data.user : {
          uid: supaUser.id,
          id: supaUser.id,
          email: cleanEmail,
          fullName: regFullName.trim(),
          phoneNumber: cleanPhone,
          role: "CUSTOMER",
          walletBalance: 0.0,
          referralCode: regReferralCode.trim() || "SL" + Math.floor(1000 + Math.random() * 9000),
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem("smart_link_user", JSON.stringify(activeUser));
        soundFx.playSuccessSound();
        setAuthSuccessState("register");

        onAuthSuccess(activeUser);
        setRegEmail("");
        setRegPassword("");
        setRegFullName("");
        setRegPhoneNumber("");
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
        return;
      }

      // Fallback API registration if Supabase is not directly configured in client
      const regRes = await safeFetchJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password: regPassword,
          fullName: regFullName.trim(),
          phoneNumber: cleanPhone,
          referralCode: regReferralCode.trim(),
        }),
      });

      if (!regRes.ok || !regRes.data?.user) {
        throw new Error(regRes.data?.message || regRes.data?.error || "Registration failed. Unable to create user account.");
      }

      const activeUser = regRes.data.user;

      // Record NDPR legal agreements
      try {
        await legalConsentService.recordBatchAcceptances({
          userId: activeUser.id || activeUser.uid,
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

      localStorage.setItem("smart_link_user", JSON.stringify(activeUser));
      soundFx.playSuccessSound();
      setAuthSuccessState("register");

      onAuthSuccess(activeUser);
      setRegEmail("");
      setRegPassword("");
      setRegFullName("");
      setRegPhoneNumber("");
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

  // Check verification status
  const handleCheckVerificationStatus = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (useSupabase) {
        const supaUser = await SupabaseAuthService.getUser();
        if (supaUser && supaUser.email_confirmed_at) {
          const syncResult = await safeFetchJson("/api/auth/sync-supabase-user", {
            method: "POST",
            body: JSON.stringify({
              id: supaUser.id,
              uid: supaUser.id,
              email: supaUser.email,
              isVerified: true,
            }),
          });

          const userProfile = syncResult.data?.user || {
            uid: supaUser.id,
            email: supaUser.email,
            fullName: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "Smart Link User",
            role: "CUSTOMER",
            walletBalance: 0.0,
            referralCode: supaUser.user_metadata?.referral_code || "SL" + Math.floor(1000 + Math.random() * 9000),
            isVerified: true,
            createdAt: new Date().toISOString(),
          };

          onAuthSuccess(userProfile);
          setIsVerifyingEmail(false);
          setVerificationEmail("");
          soundFx.playSuccessSound();
          setToast({
            message: "Email verification confirmed! Welcome to Smart Link Nigeria.",
            type: "success",
          });
          return;
        }
      }

      const currentUserObj = await SupabaseAuthService.getProfile();
      if (currentUserObj) {
        const syncResult = await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          body: JSON.stringify({
            uid: currentUserObj.id,
            email: currentUserObj.email,
            isVerified: true,
          }),
        });

        if (syncResult.data?.user) {
          onAuthSuccess(syncResult.data.user);
          setIsVerifyingEmail(false);
          setVerificationEmail("");
          soundFx.playSuccessSound();
          setToast({
            message: "Email verification confirmed! Welcome to Smart Link Nigeria.",
            type: "success",
          });
          return;
        }
      }

      const res = await safeFetchJson(`/api/auth/check-verification-status?email=${encodeURIComponent(verificationEmail)}`);
      if (res.ok && res.data?.isVerified) {
        onAuthSuccess(res.data.user);
        setIsVerifyingEmail(false);
        setVerificationEmail("");
        soundFx.playSuccessSound();
        setToast({
          message: "Your email address is verified! Welcome to Smart Link Nigeria.",
          type: "success",
        });
      } else {
        soundFx.playErrorSound();
        setAuthError("Your email is not verified yet. Please open your inbox and click the verification link.");
        setToast({
          message: "Email address not verified yet. Please check your inbox.",
          type: "info",
        });
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendSupabaseVerification = async () => {
    if (!verificationEmail) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (useSupabase) {
        await SupabaseAuthService.resendVerificationEmail(verificationEmail);
      } else {
        await safeFetchJson("/api/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email: verificationEmail }),
        });
      }
      soundFx.playSuccessSound();
      setToast({
        message: `Verification link resent to ${verificationEmail}. Please check your inbox and spam folder.`,
        type: "success",
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

  return (
    <div className="w-full bg-[#F5F7FA] min-h-[calc(100vh-75px)] flex flex-col items-center justify-center py-2 px-2.5 sm:py-6 sm:px-4 font-sans">
      {/* Verification-Style Auth Loader Modal */}
      <LoginLoaderModal
        isOpen={authLoading}
        title={
          isResetPassword
            ? "Resetting Password Credentials"
            : isRegistering
            ? "Creating SmartLink Account"
            : "SmartLink User Authentication"
        }
        providerName="SmartLink Security Authority"
        customSteps={
          isResetPassword
            ? [
                { progress: 25, label: "Validating recovery parameters..." },
                { progress: 55, label: "Verifying security credentials..." },
                { progress: 85, label: "Updating security keys..." },
                { progress: 100, label: "Password updated successfully!" },
              ]
            : isRegistering
            ? [
                { progress: 25, label: "Processing account registration..." },
                { progress: 55, label: "Generating cryptographic credentials..." },
                { progress: 85, label: "Provisioning user wallet & workspace..." },
                { progress: 100, label: "Account created successfully!" },
              ]
            : [
                { progress: 25, label: "Processing credentials..." },
                { progress: 55, label: "Authenticating security token..." },
                { progress: 85, label: "Verifying account privileges..." },
                { progress: 100, label: "Loading user workspace..." },
              ]
        }
      />

      <div className="w-full max-w-[410px] bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-lg text-left overflow-y-auto max-h-[80dvh] sm:max-h-[85vh] transition-all duration-300">
        <button
          type="button"
          onClick={onNavigateHome}
          className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#0F2D5C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Home
        </button>

        {isVerifyingEmail ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1.5">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-[#0F2D5C] flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                <Mail className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Check Your Email Inbox</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                We have sent a secure verification link to <strong className="text-slate-900">{verificationEmail}</strong>.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium animate-fadeIn leading-relaxed flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div>{authError}</div>
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0F2D5C] font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-[#0F2D5C] animate-ping" />
                Verification Dispatched
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 font-normal">
                Check your email inbox and <strong className="font-semibold text-slate-800">Spam or Junk folder</strong> for the verification link.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckVerificationStatus}
                disabled={authLoading}
                className="w-full py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
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

              <button
                type="button"
                onClick={handleResendSupabaseVerification}
                disabled={authLoading}
                className="w-full py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0F2D5C] font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5 text-[#0F2D5C]" />
                Resend Verification Link
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setIsVerifyingEmail(false);
                  setVerificationEmail("");
                  setAuthError(null);
                }}
                className="text-xs font-semibold text-[#0F2D5C] hover:underline cursor-pointer focus:outline-none"
              >
                ← Back to Secure Login
              </button>
            </div>
          </div>
        ) : isResetPassword ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-[#0F2D5C] flex items-center justify-center mx-auto border border-blue-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Reset Portal</h2>
              <p className="text-xs text-slate-600 font-medium">Enter your secure reset token to update password</p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium animate-fadeIn">
                {authError}
              </div>
            )}

            {recoverySuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium animate-fadeIn">
                {recoverySuccessMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Security Reset Token</label>
                  {recoveryToken && (
                    <span className={`text-[10px] font-bold ${isTokenValid ? "text-emerald-600" : "text-amber-600"}`}>
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all font-mono tracking-wider bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">New Access Password</label>
                  {newPassword && (() => {
                    const strength = getPasswordStrength(newPassword);
                    return <span className={`text-[10px] font-bold ${strength.textColorClass}`}>{strength.label}</span>;
                  })()}
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters required"
                    className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1 cursor-pointer"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
                className="text-xs font-bold text-[#0F2D5C] hover:underline cursor-pointer focus:outline-none"
              >
                ← Back to Secure Login
              </button>
            </div>
          </div>
        ) : !isRegistering ? (
          <div className="space-y-2.5 sm:space-y-3.5 animate-fadeIn">
            {/* Header / Brand */}
            <div className="flex flex-col items-center justify-center space-y-1 pb-0.5">
              <div className="flex items-center justify-center">
                <img
                  src={logoUrl || DEFAULT_LOGO_URL}
                  alt={siteName || "Smart Link NG"}
                  className="h-10 sm:h-12 w-auto max-w-[190px] object-contain shrink-0"
                  referrerPolicy="no-referrer"
                  onError={handleLogoError}
                />
              </div>
              <div className="text-center">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">Log in to access your dashboard and services</p>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="p-0.5 bg-slate-100 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError(null);
                }}
                className="flex-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all bg-white text-[#0F2D5C] shadow-xs cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError(null);
                }}
                className="flex-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-slate-600 hover:text-[#0F2D5C] cursor-pointer"
              >
                Register / Sign Up
              </button>
            </div>

            {authError && (
              <div role="alert" aria-live="polite" className="p-2 bg-red-50 border border-red-200 text-red-800 text-[10.5px] sm:text-[11px] rounded-xl font-medium flex items-start gap-1.5 animate-fadeIn text-left leading-normal">
                <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <div>{authError}</div>
                  {(authError.toLowerCase().includes("not verified") || authError.toLowerCase().includes("email is not verify") || authError.toLowerCase().includes("confirmation link")) && (
                    <div className="mt-1 pt-1 border-t border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-[10px] text-red-700 font-normal">Need the verification link resent?</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (authEmail) {
                            setVerificationEmail(authEmail.trim());
                            setIsVerifyingEmail(true);
                            handleResendSupabaseVerification();
                          } else {
                            setIsVerifyingEmail(true);
                          }
                        }}
                        className="text-[10.5px] font-bold text-[#0F2D5C] underline flex items-center gap-1 cursor-pointer border-none p-0 focus:outline-none"
                      >
                        Send verify link to email →
                      </button>
                    </div>
                  )}
                  {(authError.includes("sign up if not register before") || authError.includes("check email and try again") || authError.includes("register please") || authError.includes("sign up")) && (
                    <div className="mt-1 pt-1 border-t border-red-200/80 flex items-center justify-between">
                      <span className="text-[10px] text-red-700 font-normal">Need an account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(true);
                          setAuthError(null);
                        }}
                        className="text-[10.5px] font-bold text-[#0F2D5C] underline flex items-center gap-1 cursor-pointer border-none p-0 focus:outline-none"
                      >
                        Sign up / Register now →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleDirectLogin} className="space-y-2">
              <div className="space-y-0.5 text-left">
                <label htmlFor="auth-email-input" className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">
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
                  className="w-full px-2.5 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-slate-400 text-slate-900 bg-white focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div className="space-y-0.5 text-left">
                <label htmlFor="auth-password-input" className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">
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
                    className="w-full pl-2.5 pr-9 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-slate-400 text-slate-900 bg-white focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer p-0.5"
                    aria-label={showAuthPassword ? "Hide password" : "Show password"}
                  >
                    {showAuthPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-left">
                <div className="flex items-center gap-1.5">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 text-[#0F2D5C] accent-[#0F2D5C] focus:ring-[#0F2D5C] cursor-pointer"
                    defaultChecked
                  />
                  <label htmlFor="remember-me" className="text-[10px] sm:text-[11px] text-slate-600 font-medium select-none cursor-pointer">
                    Keep me signed in
                  </label>
                </div>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[10px] sm:text-[11px] font-semibold text-[#0F2D5C] hover:text-[#17407E] hover:underline cursor-pointer border-none p-0 focus:outline-none"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading || authSuccessState !== null}
                className="w-full py-2 sm:py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1.5 shadow-xs hover:shadow focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authSuccessState === "login" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" />
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

              {/* Biometric Passkey / Fingerprint Sign-in Option */}
              {isBiometricSupported && (
                <div className="pt-2 flex flex-col items-center">
                  {/* Thumb / Fingerprint Biometric Scanner Graphic in between */}
                  <div className="relative w-full flex items-center justify-center my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBiometricSignIn}
                      disabled={authLoading || isBiometricLoading || authSuccessState !== null}
                      aria-label="Click to sign in with Fingerprint"
                      title="Click to sign in with Fingerprint"
                      className="relative bg-white p-1 rounded-full border border-slate-200 shadow-2xs flex items-center justify-center text-[#0F2D5C] hover:scale-105 active:scale-95 hover:border-[#0F2D5C]/50 hover:shadow-md transition-all cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0F2D5C]/10 border border-[#0F2D5C]/20 flex items-center justify-center shrink-0 group-hover:bg-[#0F2D5C]/20 transition-colors">
                        <Fingerprint className={`w-7 h-7 text-[#0F2D5C] ${isBiometricLoading ? "animate-bounce" : "animate-pulse group-hover:scale-110 transition-transform"}`} />
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleBiometricSignIn}
                    disabled={authLoading || isBiometricLoading || authSuccessState !== null}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 hover:border-[#0F2D5C]/60 hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isBiometricLoading ? (
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#0F2D5C] tracking-wide uppercase text-center flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4 text-[#0F2D5C] inline animate-bounce" />
                        Scanning Fingerprint...
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#0F2D5C] tracking-wide uppercase text-center">
                        SIGN IN WITH FINGERPRINT
                      </span>
                    )}
                  </button>
                </div>
              )}

              <div className="pt-1 text-[10.5px] text-slate-500 leading-relaxed text-center px-1">
                By signing in, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc("terms-of-service")}
                  className="font-semibold text-[#0F2D5C] hover:text-[#17407E] hover:underline border-none p-0 inline cursor-pointer"
                >
                  Terms of Service
                </button>
                {", "}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc("privacy-policy")}
                  className="font-semibold text-[#0F2D5C] hover:text-[#17407E] hover:underline border-none p-0 inline cursor-pointer"
                >
                  Privacy Policy
                </button>
                {", and "}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc("ndpr-compliance")}
                  className="font-semibold text-[#0F2D5C] hover:text-[#17407E] hover:underline border-none p-0 inline cursor-pointer"
                >
                  NDPR Compliance
                </button>
                {" standards."}
              </div>
            </form>

            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-600 font-medium">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setAuthError(null);
                    setRecoverySuccessMessage(null);
                  }}
                  className="font-bold text-[#0F2D5C] hover:text-[#17407E] hover:underline cursor-pointer border-none p-0 focus:outline-none"
                >
                  Sign up now
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 animate-fadeIn">
            {/* Header / Brand */}
            <div className="flex flex-col items-center justify-center space-y-1 pb-0.5">
              <div className="flex items-center justify-center">
                <img
                  src={logoUrl || DEFAULT_LOGO_URL}
                  alt={siteName || "Smart Link NG"}
                  className="h-10 sm:h-12 w-auto max-w-[190px] object-contain shrink-0"
                  referrerPolicy="no-referrer"
                  onError={handleLogoError}
                />
              </div>
              <div className="text-center">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Create Secure Account</h2>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">Join SmartLink for fast NIN, BVN & VTU services</p>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="p-0.5 bg-slate-100 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError(null);
                }}
                className="flex-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-slate-600 hover:text-[#0F2D5C] cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError(null);
                }}
                className="flex-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all bg-white text-[#0F2D5C] shadow-xs cursor-pointer"
              >
                Register / Sign Up
              </button>
            </div>

            {authError && (
              <div role="alert" aria-live="polite" className="p-2 bg-red-50 border border-red-200 text-red-800 text-[10.5px] sm:text-[11px] rounded-xl font-medium flex items-start gap-1.5 animate-fadeIn text-left leading-normal">
                <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <div>{authError}</div>
                  {authError.toLowerCase().includes("email exist") && (
                    <div className="mt-1 pt-1 border-t border-red-200/80 flex items-center justify-between">
                      <span className="text-[10px] text-red-700 font-normal">Already have an account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(false);
                          setAuthEmail(regEmail);
                          setAuthError(null);
                        }}
                        className="text-[10.5px] font-bold text-[#0F2D5C] underline flex items-center gap-1 cursor-pointer border-none p-0 focus:outline-none"
                      >
                        Sign In now →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-1.5 sm:space-y-2">
              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Abubakar Muhammad"
                  className="w-full px-2.5 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20"
                />
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full px-2.5 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20"
                />
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-2.5 pr-9 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-0.5 cursor-pointer"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {regPassword && (() => {
                  const strength = getPasswordStrength(regPassword);
                  return (
                    <div className="mt-0.5 space-y-0.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200 animate-fadeIn text-left">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                        <span>Password Strength:</span>
                        <span className={`font-bold ${strength.textColorClass}`}>{strength.label}</span>
                      </div>
                      <div className="flex gap-1 h-0.5">
                        {[1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className={`h-full rounded-full flex-1 transition-all duration-300 ${
                              index <= strength.score ? strength.colorClass : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-2.5 pr-9 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-0.5 cursor-pointer"
                    aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showRegConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={regPhoneNumber}
                  onChange={(e) => setRegPhoneNumber(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-2.5 py-1.5 sm:py-2 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 font-mono tracking-wide focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C]/20"
                />
              </div>

              <div className="pt-0.5">
                <LegalConsentBox
                  agreeTerms={regAgreedTerms}
                  onAgreeTermsChange={setRegAgreedTerms}
                  ackPrivacy={regAgreedPrivacy}
                  onAckPrivacyChange={setRegAgreedPrivacy}
                  agreeKyc={regAgreedKyc}
                  onAgreeKycChange={setRegAgreedKyc}
                  marketingEmail={regMarketingAccepted}
                  onMarketingEmailChange={setRegMarketingAccepted}
                  onOpenDocument={onOpenLegalDoc}
                  showError={!!authError && (!regAgreedTerms || !regAgreedPrivacy || !regAgreedKyc)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading || authSuccessState !== null}
                className="w-full py-2 sm:py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow mt-1.5 focus:ring-1 focus:ring-[#0F2D5C]/20 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authSuccessState === "register" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" />
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

            <div className="pt-1.5 text-center border-t border-slate-100">
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setAuthError(null);
                    setRecoverySuccessMessage(null);
                  }}
                  className="font-bold text-[#0F2D5C] hover:text-[#17407E] hover:underline cursor-pointer border-none p-0 focus:outline-none"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPortal;
