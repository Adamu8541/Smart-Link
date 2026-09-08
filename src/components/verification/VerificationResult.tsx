import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, Clock, Building2, User, FileText, MapPin, Calendar, Smartphone, Mail, Hash, Award, Printer, CreditCard, Send, Check } from "lucide-react";
import { StandardizedVerificationResult } from "../../types/verification";
import { EmailSlipService } from "../../services/emailSlipService";
import { auth } from "../../firebase";
import { normalizePhotoUrl } from "../../services/slipOptionsConfig";

interface VerificationResultProps {
  result: StandardizedVerificationResult;
  onViewReceipt?: () => void;
  onGenerateSlip?: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  result,
  onViewReceipt,
  onGenerateSlip,
}) => {
  const { data, providerName, responseTime, reference, timestamp, serviceTitle, fee, maskedId, service } = result;
  const isSlipSupported = service === "NIN" || service === "BVN" || service === "PHONE";

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDeliveredMsg, setEmailDeliveredMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const cleanPhotoUrl = normalizePhotoUrl(data?.photoUrl || data?.photo || data?.image || "");

  const handleQuickEmailDispatch = async () => {
    const user = auth.currentUser;
    const userId = user?.uid || "guest_user";
    const userEmail = user?.email || "adamuamuhammad8541@gmail.com";

    setIsSendingEmail(true);
    setEmailDeliveredMsg(null);

    try {
      const res = await EmailSlipService.sendSlipToEmail({
        userId,
        recipientEmail: userEmail,
        sendToRegistered: true,
        verificationResult: result,
      });

      if (res.success) {
        setEmailDeliveredMsg(`Certificate sent to ${res.recipientEmails?.join(", ") || userEmail}!`);
        setTimeout(() => setEmailDeliveredMsg(null), 5000);
      } else {
        setEmailDeliveredMsg(`Failed: ${res.error || "Could not send"}`);
        setTimeout(() => setEmailDeliveredMsg(null), 5000);
      }
    } catch (err: any) {
      setEmailDeliveredMsg("Network error sending certificate.");
      setTimeout(() => setEmailDeliveredMsg(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-[#111827] dark:text-white">
      {/* Verified Banner */}
      <div className="p-4 bg-gradient-to-r from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#0F2D5C]/10 border border-[#0F2D5C]/30 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
                Official Verification Confirmed
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#E5E7EB] text-[#0F2D5C] dark:bg-[#0F2D5C]/60 dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-[#4B5563] dark:text-[#9CA3AF]">
              Query matched against federal records at {providerName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSlipSupported && (
            <button
              type="button"
              onClick={handleQuickEmailDispatch}
              disabled={isSendingEmail}
              className="px-3.5 py-2 rounded-xl bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#0F2D5C]/50 dark:hover:bg-[#0F2D5C]/50 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Send verification certificate to registered email"
            >
              {emailDeliveredMsg ? <Check className="h-4 w-4 text-[#0F2D5C]" /> : <Mail className="h-4 w-4" />}
              <span>{isSendingEmail ? "Sending..." : emailDeliveredMsg ? "Delivered!" : "Email Slip"}</span>
            </button>
          )}

          {isSlipSupported && onGenerateSlip && (
            <button
              type="button"
              onClick={onGenerateSlip}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Print Official Slip</span>
            </button>
          )}

          {onViewReceipt && (
            <button
              type="button"
              onClick={onViewReceipt}
              className="px-3 py-2 rounded-xl bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#111827] dark:text-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Receipt</span>
            </button>
          )}
        </div>
      </div>

      {/* Instant Email Notification Banner */}
      {emailDeliveredMsg && (
        <div className="p-3 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C] rounded-xl text-xs text-[#0F2D5C] dark:text-[#9CA3AF] font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#0F2D5C] shrink-0" />
          <span>{emailDeliveredMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="p-5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl shadow-sm space-y-5">
        {/* Profile Header if Person/Identity */}
        {data && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#111827]">
            {cleanPhotoUrl && !imgError ? (
              <div className="relative">
                <img
                  src={cleanPhotoUrl}
                  alt={data.fullName || "Verified Profile"}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0F2D5C] shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#0F2D5C] text-white p-0.5 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 border border-[#E5E7EB] dark:border-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center font-bold text-xl">
                {data.companyName
                  ? <Building2 className="h-8 w-8" />
                  : <User className="h-8 w-8" />}
              </div>
            )}

            <div className="space-y-1 flex-1">
              <h4 className="text-base font-extrabold text-[#111827] dark:text-white">
                {data.fullName || data.companyName || "Verified Record"}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                <span className="font-mono bg-[#E5E7EB] dark:bg-[#111827] px-2 py-0.5 rounded-md font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  ID: {maskedId}
                </span>
                {data.gender && (
                  <span className="px-2 py-0.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-md font-semibold text-[11px]">
                    {data.gender}
                  </span>
                )}
                {data.companyStatus && (
                  <span className="px-2 py-0.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] rounded-md font-semibold text-[11px]">
                    {data.companyStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Detail Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {data.dateOfBirth && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#9CA3AF]" /> Date of Birth
                </span>
                <p className="font-bold text-[#111827] dark:text-white font-mono">{data.dateOfBirth}</p>
              </div>
            )}

            {data.phoneNumber && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-[#9CA3AF]" /> Phone Number
                </span>
                <p className="font-bold text-[#111827] dark:text-white font-mono">{data.phoneNumber}</p>
              </div>
            )}

            {data.email && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Mail className="h-3 w-3 text-[#9CA3AF]" /> Email Address
                </span>
                <p className="font-bold text-[#111827] dark:text-white font-mono truncate">{data.email}</p>
              </div>
            )}

            {data.stateOfOrigin && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#9CA3AF]" /> State & LGA
                </span>
                <p className="font-bold text-[#111827] dark:text-white">
                  {data.stateOfOrigin} {data.lga ? `(${data.lga})` : ""}
                </p>
              </div>
            )}

            {data.address && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5 col-span-1 md:col-span-2">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#9CA3AF]" /> Registered Address
                </span>
                <p className="font-semibold text-[#111827] dark:text-white">{data.address}</p>
              </div>
            )}

            {data.rcNumber && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-[#9CA3AF]" /> RC / BN Number
                </span>
                <p className="font-bold text-[#111827] dark:text-white font-mono">{data.rcNumber}</p>
              </div>
            )}

            {data.tin && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Hash className="h-3 w-3 text-[#9CA3AF]" /> Tax Identification Number
                </span>
                <p className="font-bold text-[#111827] dark:text-white font-mono">{data.tin}</p>
              </div>
            )}

            {data.taxOffice && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[#111827]/50 rounded-xl space-y-0.5">
                <span className="text-[#9CA3AF] text-[10px] font-semibold flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#9CA3AF]" /> Tax Office
                </span>
                <p className="font-semibold text-[#111827] dark:text-white">{data.taxOffice}</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Footer Metadata */}
        <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#111827] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9CA3AF]">
          <div>
            Ref: <span className="font-mono font-bold text-[#4B5563] dark:text-[#9CA3AF]">#{reference}</span>
          </div>
          <div>
            Date: <span className="font-mono text-[#4B5563] dark:text-[#9CA3AF]">{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
