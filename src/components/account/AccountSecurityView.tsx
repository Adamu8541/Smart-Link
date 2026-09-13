import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Zap,
  Sliders,
  X,
} from "lucide-react";
import { UserProfile } from "../../types";
import { SensitiveActionPurpose } from "../../types/auth";
import { SupabaseAuthService } from "../../services/supabaseAuth";
import { soundFx } from "../../utils/audioEffects";

interface AccountSecurityViewProps {
  currentUser: UserProfile;
  onBack: () => void;
  onRefreshUser: (uid: string) => void;
  isDarkMode?: boolean;
}

type TabType = "PASSWORD" | "EMAIL" | "PHONE" | "PIN";

export const AccountSecurityView: React.FC<AccountSecurityViewProps> = ({
  currentUser,
  onBack,
  onRefreshUser,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("PASSWORD");

  // Form inputs
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // OTP flow state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Toggle PIN requirement reauthentication state
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleTargetValue, setToggleTargetValue] = useState<boolean>(false);
  const [toggleOtp, setToggleOtp] = useState("");
  const [toggleNewPin, setToggleNewPin] = useState("");
  const [isTogglingOtpRequest, setIsTogglingOtpRequest] = useState(false);
  const [isVerifyingToggleOtp, setIsVerifyingToggleOtp] = useState(false);
  const [toggleResendCooldown, setToggleResendCooldown] = useState(0);
  const [toggleMaskedEmail, setToggleMaskedEmail] = useState("");
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Local state for instant toggle switch feedback
  const isPinActive = currentUser.pinRequiredForTransactions !== false && Boolean(currentUser.hasTransactionPin);
  const [localPinRequired, setLocalPinRequired] = useState<boolean>(isPinActive);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    setLocalPinRequired(currentUser.pinRequiredForTransactions !== false && Boolean(currentUser.hasTransactionPin));
  }, [currentUser.pinRequiredForTransactions, currentUser.hasTransactionPin]);

  const resetFormStates = () => {
    setOtpStep(false);
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail("");
    setNewPhone("");
    setNewPin("");
    setConfirmPin("");
    setShowToggleModal(false);
    setToggleOtp("");
    setToggleNewPin("");
    setToggleError(null);
    setStatusMessage(null);
  };

  const handleInitiateTogglePinRequirement = async () => {
    const currentRequirement = localPinRequired;
    const targetState = !currentRequirement;
    setToggleTargetValue(targetState);
    setToggleOtp("");
    setToggleNewPin("");
    setToggleError(null);
    setShowToggleModal(true);
    setIsTogglingOtpRequest(true);

    const targetUid = currentUser?.uid || (currentUser as any)?.id || "";

    try {
      const res = await SupabaseAuthService.requestSensitiveActionOtp(
        "TOGGLE_PIN_REQUIREMENT",
        String(targetState),
        targetUid
      );
      setToggleResendCooldown(res.resendCooldownSeconds || 60);
      setToggleMaskedEmail(res.emailMasked || currentUser.email || "");
      soundFx.playSuccessSound();
    } catch (err: any) {
      setToggleError(err.message || "Failed to dispatch reauthentication code.");
      soundFx.playErrorSound();
    } finally {
      setIsTogglingOtpRequest(false);
    }
  };

  const handleResendToggleOtp = async () => {
    if (toggleResendCooldown > 0 || isTogglingOtpRequest) return;
    setIsTogglingOtpRequest(true);
    setToggleError(null);
    const targetUid = currentUser?.uid || (currentUser as any)?.id || "";

    try {
      const res = await SupabaseAuthService.requestSensitiveActionOtp(
        "TOGGLE_PIN_REQUIREMENT",
        String(toggleTargetValue),
        targetUid
      );
      setToggleResendCooldown(res.resendCooldownSeconds || 60);
      setToggleMaskedEmail(res.emailMasked || currentUser.email || "");
      soundFx.playSuccessSound();
    } catch (err: any) {
      setToggleError(err.message || "Failed to resend code.");
      soundFx.playErrorSound();
    } finally {
      setIsTogglingOtpRequest(false);
    }
  };

  const handleVerifyAndApplyToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toggleOtp || !/^\d{6}$/.test(toggleOtp.trim())) {
      setToggleError("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    if (!currentUser.hasTransactionPin && toggleTargetValue && (!toggleNewPin || !/^\d{4}$/.test(toggleNewPin.trim()))) {
      setToggleError("Please enter a 4-digit Transaction PIN to complete setup.");
      return;
    }

    setIsVerifyingToggleOtp(true);
    setToggleError(null);
    const targetUid = currentUser?.uid || (currentUser as any)?.id || "";

    try {
      const res = await SupabaseAuthService.verifySensitiveActionOtp(
        {
          purpose: "TOGGLE_PIN_REQUIREMENT",
          otp: toggleOtp.trim(),
          payload: {
            pinRequiredForTransactions: toggleTargetValue,
            ...(toggleNewPin ? { newPin: toggleNewPin.trim() } : {}),
          },
        },
        targetUid
      );

      soundFx.playSuccessSound();
      setLocalPinRequired(toggleTargetValue);
      setShowToggleModal(false);
      setToggleOtp("");
      setToggleNewPin("");
      setStatusMessage({
        type: "success",
        text: res.message || `Transaction PIN requirement has been successfully turned ${toggleTargetValue ? "ON" : "OFF"}!`,
      });

      if (onRefreshUser) {
        onRefreshUser(targetUid, res.user);
      }
    } catch (err: any) {
      soundFx.playErrorSound();
      setToggleError(err.message || "Invalid or expired reauthentication code. Please try again.");
    } finally {
      setIsVerifyingToggleOtp(false);
    }
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    resetFormStates();
  };

  const getPurposeForTab = (tab: TabType): SensitiveActionPurpose => {
    switch (tab) {
      case "PASSWORD":
        return "CHANGE_PASSWORD";
      case "EMAIL":
        return "CHANGE_EMAIL";
      case "PHONE":
        return "CHANGE_PHONE";
      case "PIN":
        return "CHANGE_PIN";
    }
  };

  // Step 1: Request 6-digit Email OTP
  const handleRequestOtp = async () => {
    setStatusMessage(null);

    // Validation before requesting OTP
    if (activeTab === "PASSWORD") {
      if (!newPassword || newPassword.length < 6) {
        setStatusMessage({ type: "error", text: "New password must be at least 6 characters long." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: "error", text: "New passwords do not match. Please re-enter." });
        return;
      }
    }

    if (activeTab === "EMAIL") {
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
        setStatusMessage({ type: "error", text: "Please provide a valid new email address." });
        return;
      }
      if (newEmail.trim().toLowerCase() === currentUser.email?.toLowerCase().trim()) {
        setStatusMessage({ type: "error", text: "New email cannot be the same as your current registered email." });
        return;
      }
    }

    if (activeTab === "PHONE") {
      if (!newPhone || !/^0\d{10}$/.test(newPhone.trim())) {
        setStatusMessage({ type: "error", text: "Phone number must be exactly 11 digits and start with 0 (e.g. 08012345678)." });
        return;
      }
      if (newPhone.trim() === (currentUser.phoneNumber || "").trim()) {
        setStatusMessage({ type: "error", text: "New phone number cannot be the same as your current registered phone." });
        return;
      }
    }

    if (activeTab === "PIN") {
      if (!newPin || !/^\d{4}$/.test(newPin.trim())) {
        setStatusMessage({ type: "error", text: "Transaction PIN must be exactly 4 digits (numeric only)." });
        return;
      }
      if (newPin !== confirmPin) {
        setStatusMessage({ type: "error", text: "4-digit PINs do not match. Please verify." });
        return;
      }
    }

    setIsRequestingOtp(true);
    const purpose = getPurposeForTab(activeTab);
    const targetValue =
      activeTab === "EMAIL" ? newEmail.trim().toLowerCase() : activeTab === "PHONE" ? newPhone.trim() : undefined;
    const targetUid = currentUser?.uid || (currentUser as any)?.id || "";

    try {
      const res = await SupabaseAuthService.requestSensitiveActionOtp(purpose, targetValue, targetUid);
      setOtpStep(true);
      setResendCooldown(res.resendCooldownSeconds || 60);
      setMaskedEmail(res.emailMasked || currentUser.email || "");
      setStatusMessage({
        type: "info",
        text: res.message || "A 6-digit verification code has been dispatched to your email.",
      });
      soundFx.playSuccessSound();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to dispatch verification code. Please check your network connection.",
      });
      soundFx.playErrorSound();
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP & apply sensitive update
  const handleVerifyAndApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !/^\d{6}$/.test(otpCode.trim())) {
      setStatusMessage({ type: "error", text: "Please enter the complete 6-digit verification code." });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    const purpose = getPurposeForTab(activeTab);
    const payload: any = {};
    if (activeTab === "PASSWORD") payload.newPassword = newPassword;
    if (activeTab === "EMAIL") payload.newEmail = newEmail.trim().toLowerCase();
    if (activeTab === "PHONE") payload.newPhoneNumber = newPhone.trim();
    if (activeTab === "PIN") payload.newPin = newPin.trim();
    const targetUid = currentUser?.uid || (currentUser as any)?.id || "";

    try {
      const res = await SupabaseAuthService.verifySensitiveActionOtp({
        purpose,
        otp: otpCode.trim(),
        payload,
      }, targetUid);

      soundFx.playSuccessSound();
      setStatusMessage({
        type: "success",
        text: res.message || "Account security changes successfully verified and applied!",
      });

      // Reset form and refresh user profile
      setTimeout(() => {
        resetFormStates();
        onRefreshUser(targetUid);
      }, 1500);
    } catch (err: any) {
      soundFx.playErrorSound();
      setStatusMessage({
        type: "error",
        text: err.message || "Verification failed. Please ensure your code is accurate.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 bg-[#F5F7FA] min-h-screen text-left" id="account-security-view">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-[#0F2D5C] hover:text-[#17407E] transition-colors cursor-pointer bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F2D5C]" />
            <span>Secure 2FA Protected</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#0F2D5C]/5 text-[#0F2D5C]">
                  <Shield className="h-5 w-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                  Account & Security Settings
                </h1>
              </div>
              <p className="text-xs text-[#6B7280] font-medium mt-1">
                Protect your account with Email OTP verification. All sensitive changes require one-time authorization codes.
              </p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl text-left text-xs">
              <span className="text-[#64748B] block font-mono text-[10px] uppercase">Registered Email</span>
              <strong className="text-[#0F172A] font-semibold">{currentUser.email}</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs" role="tablist" aria-label="Security Tabs">
          <button
            id="tab-btn-change-password"
            type="button"
            role="tab"
            aria-selected={activeTab === "PASSWORD"}
            onClick={() => handleTabSwitch("PASSWORD")}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === "PASSWORD"
                ? "bg-[#0F2D5C] text-white shadow-xs ring-1 ring-[#0F2D5C]/30"
                : "bg-transparent text-slate-600 hover:text-[#0F2D5C] hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-2xs"
            }`}
          >
            <Key className={`h-4 w-4 transition-colors ${activeTab === "PASSWORD" ? "text-amber-300" : "text-slate-400 group-hover:text-[#0F2D5C]"}`} />
            <span>Change Password</span>
            {activeTab === "PASSWORD" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-xs animate-pulse" />
            )}
          </button>

          <button
            id="tab-btn-change-email"
            type="button"
            role="tab"
            aria-selected={activeTab === "EMAIL"}
            onClick={() => handleTabSwitch("EMAIL")}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === "EMAIL"
                ? "bg-[#0F2D5C] text-white shadow-xs ring-1 ring-[#0F2D5C]/30"
                : "bg-transparent text-slate-600 hover:text-[#0F2D5C] hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-2xs"
            }`}
          >
            <Mail className={`h-4 w-4 transition-colors ${activeTab === "EMAIL" ? "text-amber-300" : "text-slate-400 group-hover:text-[#0F2D5C]"}`} />
            <span>Change Email</span>
            {activeTab === "EMAIL" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-xs animate-pulse" />
            )}
          </button>

          <button
            id="tab-btn-change-phone"
            type="button"
            role="tab"
            aria-selected={activeTab === "PHONE"}
            onClick={() => handleTabSwitch("PHONE")}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === "PHONE"
                ? "bg-[#0F2D5C] text-white shadow-xs ring-1 ring-[#0F2D5C]/30"
                : "bg-transparent text-slate-600 hover:text-[#0F2D5C] hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-2xs"
            }`}
          >
            <Phone className={`h-4 w-4 transition-colors ${activeTab === "PHONE" ? "text-amber-300" : "text-slate-400 group-hover:text-[#0F2D5C]"}`} />
            <span>Change Phone</span>
            {activeTab === "PHONE" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-xs animate-pulse" />
            )}
          </button>

          <button
            id="tab-btn-change-pin"
            type="button"
            role="tab"
            aria-selected={activeTab === "PIN"}
            onClick={() => handleTabSwitch("PIN")}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === "PIN"
                ? "bg-[#0F2D5C] text-white shadow-xs ring-1 ring-[#0F2D5C]/30"
                : "bg-transparent text-slate-600 hover:text-[#0F2D5C] hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-2xs"
            }`}
          >
            <Lock className={`h-4 w-4 transition-colors ${activeTab === "PIN" ? "text-amber-300" : "text-slate-400 group-hover:text-[#0F2D5C]"}`} />
            <span>Transaction PIN</span>
            {activeTab === "PIN" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-xs animate-pulse" />
            )}
          </button>
        </div>

        {/* Global Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-3 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p>{statusMessage.text}</p>
            </div>
          </div>
        )}

        {/* Main Form Body */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
          {/* TAB 1: CHANGE PASSWORD */}
          {activeTab === "PASSWORD" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Update Login Password</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Choose a strong, unique password with at least 6 characters. A 6-digit confirmation code will be dispatched to your email.
                </p>
              </div>

              {!otpStep ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter minimum 6 characters"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#4B5563]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isRequestingOtp || !newPassword || !confirmPassword}
                    className="w-full mt-2 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isRequestingOtp ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Requesting Code...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Reauthentication Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAndApply} className="space-y-4 max-w-md">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
                      Code Sent To: {maskedEmail}
                    </span>
                    <p className="text-xs text-slate-600">
                      Check your inbox or spam folder for the 6-digit code sent via Supabase Reauthentication. Valid for 10 minutes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] text-center text-xl font-mono tracking-widest font-bold text-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={resendCooldown > 0 || isRequestingOtp}
                      className="text-[#0F2D5C] font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Verification Code"}
                    </button>
                    <button
                      type="button"
                      onClick={resetFormStates}
                      className="text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel / Re-enter
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length !== 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify Code & Update Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: CHANGE EMAIL */}
          {activeTab === "EMAIL" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Change Registered Email Address</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Update your primary email address. A 6-digit verification code will be dispatched to your current email to confirm your authorization.
                </p>
              </div>

              {!otpStep ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Current Email Address
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email || ""}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280] font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isRequestingOtp || !newEmail}
                    className="w-full mt-2 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isRequestingOtp ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Requesting Code...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Reauthentication Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAndApply} className="space-y-4 max-w-md">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
                      Target Email: {newEmail}
                    </span>
                    <p className="text-xs text-slate-600">
                      A 6-digit code has been dispatched to <strong>{maskedEmail}</strong> via Supabase Reauthentication. Enter it below to complete this update.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] text-center text-xl font-mono tracking-widest font-bold text-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={resendCooldown > 0 || isRequestingOtp}
                      className="text-[#0F2D5C] font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Verification Code"}
                    </button>
                    <button
                      type="button"
                      onClick={resetFormStates}
                      className="text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel / Re-enter
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length !== 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Applying Email Change...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify Code & Update Email
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CHANGE PHONE */}
          {activeTab === "PHONE" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Update Registered Phone Number</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Update your linked Nigerian mobile phone number. Phone number must be 11 digits starting with 0.
                </p>
              </div>

              {!otpStep ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Current Phone Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.phoneNumber || "None Registered"}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280] font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      New 11-Digit Phone Number
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="08012345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-mono focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isRequestingOtp || !newPhone || newPhone.length !== 11}
                    className="w-full mt-2 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isRequestingOtp ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Requesting Code...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Reauthentication Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAndApply} className="space-y-4 max-w-md">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
                      Target Phone: {newPhone}
                    </span>
                    <p className="text-xs text-slate-600">
                      A 6-digit authorization code has been dispatched to <strong>{maskedEmail}</strong> via Supabase Reauthentication. Enter it below to authorize this phone update.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] text-center text-xl font-mono tracking-widest font-bold text-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={resendCooldown > 0 || isRequestingOtp}
                      className="text-[#0F2D5C] font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Verification Code"}
                    </button>
                    <button
                      type="button"
                      onClick={resetFormStates}
                      className="text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel / Re-enter
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length !== 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Updating Phone Number...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify Code & Update Phone
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTION PIN */}
          {activeTab === "PIN" && (
            <div className="space-y-8">
              {/* SECTION 1: TRANSACTION PIN REQUIREMENT TOGGLE */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-white to-[#F9FAFB] dark:from-[#111827] dark:to-[#0F2D5C]/10 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#0F2D5C]/10 dark:bg-[#0F2D5C]/30 text-[#0F2D5C] dark:text-sky-400">
                        <Sliders className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-bold text-[#111827] dark:text-white">
                        Require PIN Before Transactions
                      </h4>
                      {localPinRequired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Active (Required)
                        </span>
                      ) : currentUser.hasTransactionPin ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Disabled (1-Click Pay)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Not Configured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-xl">
                      {localPinRequired
                        ? "Fintech Strict Protection: User must input the 4-digit transaction PIN before any wallet debit, transfer, or bill payment is processed."
                        : "Fast Checkout Mode: Transactions proceed immediately without asking for a transaction PIN."}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localPinRequired}
                      onClick={handleInitiateTogglePinRequirement}
                      disabled={isTogglingOtpRequest}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0F2D5C] focus:ring-offset-2 ${
                        localPinRequired
                          ? "bg-[#0F2D5C]"
                          : "bg-slate-300 dark:bg-slate-700"
                      } ${isTogglingOtpRequest ? "opacity-60 cursor-wait" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          localPinRequired
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      >
                        {isTogglingOtpRequest ? (
                          <RefreshCw className="h-3 w-3 text-[#0F2D5C] animate-spin" />
                        ) : localPinRequired ? (
                          <Lock className="h-3 w-3 text-[#0F2D5C]" />
                        ) : (
                          <Zap className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                    </button>
                    <span className="text-xs font-bold text-[#374151] dark:text-slate-300 min-w-[32px]">
                      {localPinRequired ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>

                {!currentUser.hasTransactionPin && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>You haven't set up a transaction PIN yet. Please create your 4-digit PIN below first.</span>
                  </div>
                )}
              </div>

              {/* REAUTHENTICATION MODAL FOR TOGGLE PIN */}
              {showToggleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-xs animate-fadeIn">
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-2xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl relative">
                    <button
                      type="button"
                      onClick={() => setShowToggleModal(false)}
                      disabled={isVerifyingToggleOtp}
                      className="absolute top-4 right-4 p-1.5 rounded-full text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-1 text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F2D5C]/10 dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-sky-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Supabase Native Reauthentication</span>
                      </div>
                      <h3 className="text-base font-bold text-[#111827] dark:text-white">
                        Confirm PIN Requirement {toggleTargetValue ? "Activation (ON)" : "Deactivation (OFF)"}
                      </h3>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        A 6-digit confirmation code has been dispatched to <strong>{toggleMaskedEmail || currentUser.email}</strong>.
                      </p>
                    </div>

                    {toggleError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{toggleError}</span>
                      </div>
                    )}

                    <form onSubmit={handleVerifyAndApplyToggle} className="space-y-4">
                      {!currentUser.hasTransactionPin && toggleTargetValue && (
                        <div>
                          <label className="block text-xs font-bold text-[#374151] dark:text-[#D1D5DB] uppercase tracking-wider mb-1.5">
                            Set New 4-Digit Transaction PIN
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={toggleNewPin}
                            onChange={(e) => setToggleNewPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-slate-900 text-center text-lg font-mono tracking-widest font-bold text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none mb-3"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-[#374151] dark:text-[#D1D5DB] uppercase tracking-wider mb-1.5">
                          Enter 6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          autoFocus
                          value={toggleOtp}
                          onChange={(e) => setToggleOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-slate-900 text-center text-xl font-mono tracking-widest font-bold text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={handleResendToggleOtp}
                          disabled={toggleResendCooldown > 0 || isTogglingOtpRequest}
                          className="text-[#0F2D5C] dark:text-sky-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                        >
                          {toggleResendCooldown > 0 ? `Resend Code in ${toggleResendCooldown}s` : "Resend Verification Code"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowToggleModal(false)}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowToggleModal(false)}
                          disabled={isVerifyingToggleOtp}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E7EB] dark:border-[#4B5563] text-xs font-semibold text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#F3F4F6] dark:hover:bg-[#111827] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifyingToggleOtp || toggleOtp.length !== 6}
                          className="flex-1 py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isVerifyingToggleOtp ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Confirm & Apply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SECTION 2: CONFIGURE / CHANGE 4-DIGIT PIN */}
              <div className="border-t border-[#E5E7EB] dark:border-[#374151] pt-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#111827] dark:text-white">
                    {currentUser.hasTransactionPin ? "Change 4-Digit Transaction PIN" : "Configure 4-Digit Transaction PIN"}
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    Your 4-digit PIN is stored securely with bcrypt hashing. Setting or updating your PIN requires Supabase Reauthentication.
                  </p>
                </div>

                {!otpStep ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] dark:text-[#D1D5DB] uppercase tracking-wider mb-1">
                        New 4-Digit PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-slate-900 text-center text-lg font-mono tracking-widest font-bold text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] cursor-pointer"
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#374151] dark:text-[#D1D5DB] uppercase tracking-wider mb-1">
                        Confirm 4-Digit PIN
                      </label>
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-slate-900 text-center text-lg font-mono tracking-widest font-bold text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isRequestingOtp || newPin.length !== 4 || confirmPin.length !== 4}
                      className="w-full mt-2 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isRequestingOtp ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Requesting Code...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send Reauthentication Code
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyAndApply} className="space-y-4 max-w-md">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                      <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block">
                        Code Sent To: {maskedEmail}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Enter the 6-digit confirmation code sent to your email via Supabase Reauthentication to lock in your new 4-digit PIN.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#374151] dark:text-[#D1D5DB] uppercase tracking-wider mb-1">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-slate-900 text-center text-xl font-mono tracking-widest font-bold text-[#0F2D5C] dark:text-white focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={resendCooldown > 0 || isRequestingOtp}
                        className="text-[#0F2D5C] dark:text-sky-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                      >
                        {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Verification Code"}
                      </button>
                      <button
                        type="button"
                        onClick={resetFormStates}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                      >
                        Cancel / Re-enter
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length !== 6}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Saving PIN...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Verify Code & Secure PIN
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
