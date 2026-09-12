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

  // Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetFormStates = () => {
    setOtpStep(false);
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail("");
    setNewPhone("");
    setNewPin("");
    setConfirmPin("");
    setStatusMessage(null);
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

    try {
      const res = await SupabaseAuthService.requestSensitiveActionOtp(purpose, targetValue);
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

    try {
      const res = await SupabaseAuthService.verifySensitiveActionOtp({
        purpose,
        otp: otpCode.trim(),
        payload,
      });

      soundFx.playSuccessSound();
      setStatusMessage({
        type: "success",
        text: res.message || "Account security changes successfully verified and applied!",
      });

      // Reset form and refresh user profile
      setTimeout(() => {
        resetFormStates();
        onRefreshUser(currentUser.uid);
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
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-2">
          <button
            type="button"
            onClick={() => handleTabSwitch("PASSWORD")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PASSWORD"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
            }`}
          >
            <Key className="h-4 w-4" />
            Change Password
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("EMAIL")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "EMAIL"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
            }`}
          >
            <Mail className="h-4 w-4" />
            Change Email
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("PHONE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PHONE"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
            }`}
          >
            <Phone className="h-4 w-4" />
            Change Phone
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("PIN")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PIN"
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
            }`}
          >
            <Lock className="h-4 w-4" />
            Transaction PIN
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
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send 6-Digit Email Code
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
                      Check your inbox or spam folder for the 6-digit code. Valid for 10 minutes.
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
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send 6-Digit Email Code
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
                      A 6-digit code has been dispatched to <strong>{maskedEmail}</strong>. Enter it below to complete this update.
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
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send 6-Digit Email Code
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
                      Code sent to your email <strong>{maskedEmail}</strong>. Enter the 6-digit code below:
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
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  {currentUser.hasTransactionPin ? "Change 4-Digit Transaction PIN" : "Configure 4-Digit Transaction PIN"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Your 4-digit PIN authorizes wallet transfers, airtime/data purchases, and bill payments.
                </p>
              </div>

              {!otpStep ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      New 4-Digit PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-center text-lg font-mono tracking-widest font-bold focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#4B5563]"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Confirm 4-Digit PIN
                    </label>
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-center text-lg font-mono tracking-widest font-bold focus:ring-2 focus:ring-[#0F2D5C] focus:outline-none"
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
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send 6-Digit Email Code
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
                      Enter the 6-digit confirmation code sent to your email to lock in your new 4-digit PIN.
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
          )}
        </div>
      </div>
    </div>
  );
};
