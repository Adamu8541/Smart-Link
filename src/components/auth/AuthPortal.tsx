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
} from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { getFriendlyErrorMessage, safeFetchJson } from "../../utils/authErrorHandler";
import { soundFx } from "../../utils/audioEffects";
import { UserProfile, UserRole } from "../../types";
import { LegalConsentBox } from "../legal";
import { legalConsentService } from "../../services/legalConsentService";
import { SupabaseAuthService, isSupabaseConfigured } from "../../services/supabaseAuth";

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

export const AuthPortal: React.FC<AuthPortalProps> = ({
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

  const useSupabase = isSupabaseConfigured;

  // Login Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessState, setAuthSuccessState] = useState<"login" | "register" | null>(null);

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
        
        // Email verification check
        if (supaLogin.emailNotConfirmed || !supaLogin.isEmailVerified || !supaLogin.user) {
          if (supaLogin.emailNotConfirmed || !supaLogin.isEmailVerified) {
            setVerificationEmail(cleanEmail);
            setIsVerifyingEmail(true);
            setAuthLoading(false);
            setToast({
              message: "Your email is not verified yet. Please check your inbox for the confirmation link sent by Supabase, or click 'Resend Verification Link'.",
              type: "info",
            });
            return;
          }
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

        localStorage.setItem("smart_link_user", JSON.stringify(loginUser));
        soundFx.playSuccessSound();
        setAuthSuccessState("login");

        onAuthSuccess(loginUser);
        setAuthEmail("");
        setAuthPassword("");
        setAuthSuccessState(null);
        setToast({
          message: "Successfully signed in via Supabase! Welcome to your Smart Link Nigeria portal.",
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
        if (res.data?.emailNotConfirmed || res.error?.toLowerCase().includes("not verified") || res.error?.toLowerCase().includes("confirmation link")) {
          setVerificationEmail(cleanEmail);
          setIsVerifyingEmail(true);
          setAuthLoading(false);
          setToast({
            message: "Your email is not verified yet. Please check your inbox for the verification link or click 'Resend Verification Link'.",
            type: "info",
          });
          return;
        }
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
      const rawMsg = (err?.message || err?.error || err || "").toLowerCase();
      if (
        rawMsg.includes("email not confirmed") ||
        rawMsg.includes("not confirmed") ||
        rawMsg.includes("not verified") ||
        rawMsg.includes("email is not verify")
      ) {
        setVerificationEmail(cleanEmail);
        setIsVerifyingEmail(true);
        setToast({
          message: "Your email is not verified yet. Please check your inbox or click 'Resend Verification Link'.",
          type: "info",
        });
      } else {
        const friendlyMsg = getFriendlyErrorMessage(err);
        setAuthError(friendlyMsg);
        setAuthPassword("");
      }
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
          redirectTo: `${window.location.origin}/verify-email`,
        });

        const supaUser = supaReg.user;
        if (!supaUser) {
          throw new Error("Registration failed. Unable to create Supabase user account.");
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
        await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: supaReg.session?.access_token ? { Authorization: `Bearer ${supaReg.session.access_token}` } : undefined,
          body: JSON.stringify({
            id: supaUser.id,
            uid: supaUser.id,
            email: cleanEmail,
            fullName: regFullName.trim(),
            phoneNumber: cleanPhone,
            referralCode: regReferralCode.trim(),
            isVerified: !supaReg.needsEmailConfirmation,
          }),
        });

        soundFx.playSuccessSound();
        setAuthLoading(false);
        setVerificationEmail(cleanEmail);
        setIsVerifyingEmail(true);
        setIsRegistering(false);
        setToast({
          message: "Registration successful! A verification link has been sent to your email. Please click the link to activate your account.",
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

      if (regRes.data?.needsEmailConfirmation || !activeUser.isVerified) {
        soundFx.playSuccessSound();
        setAuthLoading(false);
        setVerificationEmail(cleanEmail);
        setIsVerifyingEmail(true);
        setIsRegistering(false);
        setToast({
          message: "Registration successful! A verification link has been dispatched to your email. Please click the link to activate your account.",
          type: "success",
        });
        return;
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
    <div className="w-full bg-[#F5F7FA] min-h-[calc(100vh-75px)] flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-[460px] bg-white border border-[#E5E7EB] rounded-[28px] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-left overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={onNavigateHome}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>

        {isVerifyingEmail ? (
          <div className="space-y-6 animate-fadeIn">
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
                <span className="h-2 w-2 rounded-full bg-[#0F2D5C] animate-ping" />
                Verification Dispatched
              </div>
              <p className="text-[11px] leading-relaxed text-[#4B5563] font-normal">
                Check your email inbox and <strong className="font-semibold text-[#111827]">Spam or Junk folder</strong> for the verification link.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckVerificationStatus}
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

              <button
                type="button"
                onClick={handleResendSupabaseVerification}
                disabled={authLoading}
                className="w-full py-3 bg-[#F5F7FA] hover:bg-[#E5E7EB] text-[#111827] font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#E5E7EB] disabled:opacity-50"
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
                className="text-xs text-[#4B5563] hover:text-[#0F2D5C] font-semibold hover:underline cursor-pointer focus:outline-none"
              >
                ← Back to Secure Login
              </button>
            </div>
          </div>
        ) : isResetPassword ? (
          <div className="space-y-6 animate-fadeIn">
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
                  <label className="text-xs font-semibold text-[#4B5563]">Security Reset Token</label>
                  {recoveryToken && (
                    <span className={`text-[10px] font-bold ${isTokenValid ? "text-[#0F2D5C]" : "text-[#6B7280]"}`}>
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
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all font-mono tracking-wider bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#4B5563]">New Access Password</label>
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
                    className="w-full pl-4 pr-12 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] focus:outline-none transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
          </div>
        ) : !isRegistering ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col items-center justify-center space-y-3">
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
                  {(authError.toLowerCase().includes("not verified") || authError.toLowerCase().includes("email is not verify") || authError.toLowerCase().includes("confirmation link")) && (
                    <div className="mt-2 pt-2 border-t border-[#E5E7EB]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-[#4B5563] font-normal">Need the verification link resent?</span>
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
                        className="text-xs font-bold text-[#0F2D5C] hover:text-[#17407E] underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                      >
                        Send verify link to email →
                      </button>
                    </div>
                  )}
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
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 disabled:bg-[#F5F7FA] disabled:text-[#6B7280]"
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
                    className="w-full pl-4 pr-12 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/15 disabled:bg-[#F5F7FA] disabled:text-[#6B7280]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] focus:outline-none transition-colors cursor-pointer"
                    aria-label={showAuthPassword ? "Hide password" : "Show password"}
                  >
                    {showAuthPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

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
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs font-semibold text-[#0F2D5C] hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    Forgot password?
                  </button>
                )}
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
                  onClick={() => onOpenLegalDoc("privacy-policy")}
                  className="text-[#4B5563] hover:text-[#0F2D5C] font-medium hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                >
                  Privacy
                </button>{" "}
                &bull;{" "}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc("terms-of-service")}
                  className="text-[#4B5563] hover:text-[#0F2D5C] font-medium hover:underline bg-transparent border-none p-0 inline cursor-pointer"
                >
                  Terms
                </button>
              </div>
            </form>

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
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col items-center justify-center space-y-3">
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
                <label className="text-xs font-semibold text-[#111827]">Full Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Abubakar Muhammad"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-[#111827]">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-[#111827]">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters recommended"
                    className="w-full pl-4 pr-12 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] focus:outline-none transition-colors"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-[#111827]">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-4 pr-12 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] focus:outline-none transition-colors"
                    aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showRegConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-[#111827]">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={regPhoneNumber}
                  onChange={(e) => setRegPhoneNumber(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none transition-all bg-white font-mono tracking-wide focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#E5E7EB]"
                />
              </div>

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
                  onOpenDocument={onOpenLegalDoc}
                  showError={!!authError && (!regAgreedTerms || !regAgreedPrivacy || !regAgreedKyc)}
                />
              </div>



              <button
                type="submit"
                disabled={authLoading || authSuccessState !== null}
                className={`w-full py-3.5 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 focus:ring-4 focus:outline-none ${
                  authSuccessState === "register"
                    ? "bg-[#0F2D5C] hover:bg-[#17407E] focus:ring-[#E5E7EB]"
                    : "bg-[#082051] hover:bg-[#06183e] active:scale-98 shadow-sm focus:ring-[#E5E7EB] disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="text-[#0F2D5C] hover:text-[#17407E] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
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
