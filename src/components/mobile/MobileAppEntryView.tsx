import React, { useState, useEffect, useRef } from "react";
import {
  Fingerprint,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Upload,
  ArrowRight,
  Zap,
  Tv,
  Smartphone,
  FileCheck,
} from "lucide-react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { BiometricAuthService } from "../../services/biometricAuthService";
import { SupabaseAuthService, isSupabaseConfigured } from "../../services/supabaseAuth";
import { soundFx } from "../../utils/audioEffects";
import { getFriendlyErrorMessage, safeFetchJson } from "../../utils/authErrorHandler";

export interface MobileAppEntryViewProps {
  onAuthSuccess: (user: any) => void;
  onNavigateForgotPassword: () => void;
  onOpenLegalDoc: (docId: string) => void;
  setToast: (toast: { message: string; type: "success" | "error" | "info" }) => void;
  onSwitchToWebsite?: () => void;
}

export const MobileAppEntryView: React.FC<MobileAppEntryViewProps> = ({
  onAuthSuccess,
  onNavigateForgotPassword,
  onOpenLegalDoc,
  setToast,
  onSwitchToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Advert Picture State (supports default /app-advert-banner.jpg and user-uploaded custom picture)
  const [advertImgSrc, setAdvertImgSrc] = useState<string>(() => {
    try {
      return localStorage.getItem("smartlink_custom_advert_image") || "/app-advert-banner.jpg";
    } catch {
      return "/app-advert-banner.jpg";
    }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Common Auth States
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState(() => {
    try {
      const saved = localStorage.getItem("smartlink_saved_email");
      if (saved && saved.trim()) return saved.trim();
      const rawUser = localStorage.getItem("smart_link_user") || localStorage.getItem("smartlink_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.email) return u.email;
      }
    } catch {}
    return "";
  });
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Biometrics State
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  // Sign Up State
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpReferralCode, setSignUpReferralCode] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeKyc, setAgreeKyc] = useState(false);

  useEffect(() => {
    BiometricAuthService.isBiometricSupported().then(setIsBiometricSupported);
  }, []);

  // Handle Custom Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select an image file (PNG, JPG, WEBP).", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAdvertImgSrc(dataUrl);
        try {
          localStorage.setItem("smartlink_custom_advert_image", dataUrl);
        } catch {
          // If quota exceeded, just keep in runtime memory
        }
        setToast({ message: "Advert picture updated successfully!", type: "success" });
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Touch Fingerprint Sign In
  const handleBiometricSignIn = async () => {
    if (authLoading || isBiometricLoading) return;
    setIsBiometricLoading(true);
    setAuthError(null);
    try {
      const emailToUse = signInEmail.trim() || (() => {
        try {
          return localStorage.getItem("smartlink_saved_email") || "";
        } catch {
          return "";
        }
      })();
      const res = await BiometricAuthService.authenticateWithBiometrics(emailToUse);
      if (res.success && res.user) {
        soundFx.playSuccessSound();
        setAuthSuccess("Fingerprint verified! Opening portal...");
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

  // Direct Sign In
  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      soundFx.playErrorSound();
      setAuthError("Both email and password are required.");
      return;
    }

    const cleanEmail = signInEmail.toLowerCase().trim();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSupabaseConfigured) {
        const supaLogin = await SupabaseAuthService.signIn(cleanEmail, signInPassword);
        if (!supaLogin.user) {
          throw new Error("Invalid email or password.");
        }

        const syncResult = await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: supaLogin.session?.access_token ? { Authorization: `Bearer ${supaLogin.session.access_token}` } : undefined,
          body: JSON.stringify({
            id: supaLogin.user.id,
            uid: supaLogin.user.id,
            email: supaLogin.user.email || cleanEmail,
          }),
        });

        const loginUser = syncResult.ok && syncResult.data?.user ? syncResult.data.user : {
          id: supaLogin.user.id,
          uid: supaLogin.user.id,
          email: supaLogin.user.email || cleanEmail,
          role: "CUSTOMER",
          walletBalance: 0.0,
          token: supaLogin.session?.access_token,
        };

        if (loginUser.status === "SUSPENDED" || loginUser.status === "BLOCKED") {
          throw new Error("Your account has been suspended by administration.");
        }

        const token = supaLogin.session?.access_token || "";
        if (token) {
          localStorage.setItem("smartlink_token", token);
          localStorage.setItem("token", token);
        }
        localStorage.setItem("smart_link_user", JSON.stringify(loginUser));
        localStorage.setItem("smartlink_saved_email", cleanEmail);
        soundFx.playSuccessSound();
        setAuthSuccess("Successfully signed in!");
        onAuthSuccess(loginUser);
        return;
      }

      // API Fallback Login
      const res = await safeFetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail, password: signInPassword }),
      });

      if (!res.ok || !res.data?.user) {
        throw new Error(res.data?.message || res.data?.error || "Invalid credentials.");
      }

      const loginUser = res.data.user;
      if (loginUser.status === "SUSPENDED" || loginUser.status === "BLOCKED") {
        throw new Error("Your account has been suspended by administration.");
      }

      const token = res.data?.token || res.data?.sessionToken || "";
      if (token) {
        localStorage.setItem("smartlink_token", token);
        localStorage.setItem("token", token);
      }
      localStorage.setItem("smart_link_user", JSON.stringify(loginUser));
      localStorage.setItem("smartlink_saved_email", cleanEmail);

      soundFx.playSuccessSound();
      setAuthSuccess("Successfully signed in!");
      onAuthSuccess(loginUser);
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Direct Sign Up
  const handleDirectSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpFullName.trim()) {
      soundFx.playErrorSound();
      setAuthError("Full name is required.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signUpEmail || !emailPattern.test(signUpEmail.trim())) {
      soundFx.playErrorSound();
      setAuthError("Please provide a valid email address.");
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      soundFx.playErrorSound();
      setAuthError("Password must be at least 6 characters long.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      soundFx.playErrorSound();
      setAuthError("Passwords do not match.");
      return;
    }
    if (!signUpPhone || !/^0\d{10}$/.test(signUpPhone.trim())) {
      soundFx.playErrorSound();
      setAuthError("Phone number must be 11 digits starting with 0 (e.g. 08012345678).");
      return;
    }
    if (!agreeTerms || !agreePrivacy || !agreeKyc) {
      soundFx.playErrorSound();
      setAuthError("Please agree to the Terms of Service, Privacy Policy, and KYC Notice.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const cleanEmail = signUpEmail.toLowerCase().trim();
      const cleanPhone = signUpPhone.trim();

      const phoneCheckRes = await safeFetchJson("/api/auth/check-phone-exists", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });
      if (phoneCheckRes.data?.exists) {
        soundFx.playErrorSound();
        setAuthError("Phone number is already registered. Please sign in or use another number.");
        setAuthLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        const supaReg = await SupabaseAuthService.signUp({
          email: cleanEmail,
          password: signUpPassword,
          fullName: signUpFullName.trim(),
          phoneNumber: cleanPhone,
          referralCode: signUpReferralCode.trim(),
        });

        if (!supaReg.user) {
          throw new Error("Unable to create account. Please try again.");
        }

        const syncRes = await safeFetchJson("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: supaReg.session?.access_token ? { Authorization: `Bearer ${supaReg.session.access_token}` } : undefined,
          body: JSON.stringify({
            id: supaReg.user.id,
            uid: supaReg.user.id,
            email: cleanEmail,
            fullName: signUpFullName.trim(),
            phoneNumber: cleanPhone,
            referralCode: signUpReferralCode.trim(),
            isVerified: true,
          }),
        });

        const activeUser = syncRes.ok && syncRes.data?.user ? syncRes.data.user : {
          uid: supaReg.user.id,
          id: supaReg.user.id,
          email: cleanEmail,
          fullName: signUpFullName.trim(),
          phoneNumber: cleanPhone,
          role: "CUSTOMER",
          walletBalance: 0.0,
          token: supaReg.session?.access_token,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem("smart_link_user", JSON.stringify(activeUser));
        localStorage.setItem("smartlink_saved_email", cleanEmail);
        soundFx.playSuccessSound();
        setAuthSuccess("Account created successfully!");
        onAuthSuccess(activeUser);
        return;
      }

      // API Fallback Register
      const regRes = await safeFetchJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: signUpFullName.trim(),
          email: cleanEmail,
          password: signUpPassword,
          phoneNumber: cleanPhone,
          referralCode: signUpReferralCode.trim(),
        }),
      });

      if (!regRes.ok || !regRes.data?.user) {
        throw new Error(regRes.data?.message || regRes.data?.error || "Registration failed.");
      }

      const activeUser = regRes.data.user;
      const token = regRes.data?.token || "";
      if (token) {
        localStorage.setItem("smartlink_token", token);
        localStorage.setItem("token", token);
      }
      localStorage.setItem("smart_link_user", JSON.stringify(activeUser));
      localStorage.setItem("smartlink_saved_email", cleanEmail);

      soundFx.playSuccessSound();
      setAuthSuccess("Account created successfully!");
      onAuthSuccess(activeUser);
    } catch (err: any) {
      soundFx.playErrorSound();
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#0F2D5C] to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Hidden File Input for Custom Banner Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Mobile Bar */}
      <header className="w-full max-w-md mx-auto pt-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
            <SmartLinkLogoMark size="sm" animating={false} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-tight">SMART LINK NG</h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Mobile Portal</p>
          </div>
        </div>

        {onSwitchToWebsite && (
          <button
            type="button"
            onClick={onSwitchToWebsite}
            className="text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Visit Website</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </header>

      {/* Main Mobile App Card */}
      <main className="w-full max-w-md mx-auto px-4 py-3 flex-1 flex flex-col justify-center">
        {/* SECTION 1: Advert Picture for Verification, Airtime, Data, DStv, Electricity */}
        <section className="mb-4 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 group">
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={advertImgSrc}
              alt="SmartLink Instant Services: Verification, Airtime, Data, DStv, Electricity"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => {
                // Fallback if local path not cached
                setAdvertImgSrc("/app-advert-banner.jpg");
              }}
            />
            {/* Dark gradient overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

            {/* Custom upload button badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload custom advert picture"
              aria-label="Upload custom advert picture"
              className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/90 active:scale-95 text-white/90 text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-md border border-white/20 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Upload className="w-3 h-3 text-emerald-400" />
              <span>Change Image</span>
            </button>

            {/* Service Tags Bar overlaid on bottom of advert */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 text-[9.5px] font-bold text-white/90 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1 text-emerald-300">
                <FileCheck className="w-3 h-3 text-emerald-400" /> NIN & BVN
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Smartphone className="w-3 h-3 text-amber-400" /> Airtime/Data
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1 text-sky-300">
                <Zap className="w-3 h-3 text-sky-400" /> Electricity
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1 text-purple-300">
                <Tv className="w-3 h-3 text-purple-400" /> DStv
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: Redesigned Mobile Sign In & Create Account Card */}
        <section className="bg-white rounded-3xl p-5 shadow-2xl text-slate-800 border border-slate-100 animate-fadeIn">
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-black tracking-wide uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "signin"
                  ? "bg-[#0F2D5C] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-black tracking-wide uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "signup"
                  ? "bg-[#0F2D5C] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {authError && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{authError}</div>
            </div>
          )}

          {authSuccess && (
            <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-medium">{authSuccess}</div>
            </div>
          )}

          {/* TAB 1: REDESIGNED SIGN IN */}
          {activeTab === "signin" && (
            <div>
              {/* 1-Touch Fingerprint Unlock Option (Prominent Fintech Button) */}
              {isBiometricSupported && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleBiometricSignIn}
                    disabled={authLoading || isBiometricLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#0F2D5C] to-[#1E40AF] hover:from-[#17407E] hover:to-[#2563EB] active:scale-[0.98] text-white font-black text-xs tracking-wider uppercase rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group border border-white/20"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Fingerprint
                        className={`w-4 h-4 text-emerald-300 ${
                          isBiometricLoading ? "animate-bounce" : "group-hover:scale-110 transition-transform"
                        }`}
                      />
                    </div>
                    <span>
                      {isBiometricLoading ? "Verifying Fingerprint..." : "Sign In with Fingerprint"}
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="w-full border-t border-slate-200"></div>
                    <span className="bg-white px-2.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      or use password
                    </span>
                  </div>
                </div>
              )}

              {/* Standard Password Form */}
              <form onSubmit={handleDirectSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="e.g. user@gmail.com"
                      autoComplete="username"
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateForgotPassword}
                      className="text-[11px] font-bold text-[#0F2D5C] hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-3 bg-[#0F2D5C] hover:bg-[#17407E] active:scale-[0.98] text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {authLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Quick Switch */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("signup");
                      setAuthError(null);
                    }}
                    className="font-bold text-[#0F2D5C] hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: REDESIGNED CREATE ACCOUNT */}
          {activeTab === "signup" && (
            <form onSubmit={handleDirectSignUp} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Babatunde Adeyemi"
                    autoComplete="name"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Phone Number (11 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="08012345678"
                    maxLength={11}
                    autoComplete="tel"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      autoComplete="new-password"
                      required
                      className="w-full px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showSignUpConfirmPassword ? "text" : "password"}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      autoComplete="new-password"
                      required
                      className="w-full px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={signUpReferralCode}
                  onChange={(e) => setSignUpReferralCode(e.target.value)}
                  placeholder="e.g. SL9820"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F2D5C] transition-all uppercase"
                />
              </div>

              {/* Legal Consents */}
              <div className="pt-1 space-y-1.5 text-[10.5px] text-slate-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C]"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => onOpenLegalDoc("terms-of-service")}
                      className="font-bold text-[#0F2D5C] hover:underline"
                    >
                      Terms of Service
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C]"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => onOpenLegalDoc("privacy-policy")}
                      className="font-bold text-[#0F2D5C] hover:underline"
                    >
                      Privacy Policy (NDPR)
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeKyc}
                    onChange={(e) => setAgreeKyc(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-300 text-[#0F2D5C] focus:ring-[#0F2D5C]"
                  />
                  <span>
                    I consent to the{" "}
                    <button
                      type="button"
                      onClick={() => onOpenLegalDoc("kyc-notice")}
                      className="font-bold text-[#0F2D5C] hover:underline"
                    >
                      KYC Identity Verification Notice
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {authLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("signin");
                      setAuthError(null);
                    }}
                    className="font-bold text-[#0F2D5C] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </section>
      </main>

      {/* Mobile Footer */}
      <footer className="w-full max-w-md mx-auto py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>NDPR & NIMC Authorized Compliance · 256-Bit SSL Encrypted</span>
        </div>
      </footer>
    </div>
  );
};

export default MobileAppEntryView;
