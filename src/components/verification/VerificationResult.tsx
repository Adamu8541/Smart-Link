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
    <div className="space-y-5 animate-fade-in text-slate-900 dark:text-white">
      {/* Verified Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-blue-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                Official Verification Confirmed
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
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
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Send verification certificate to registered email"
            >
              {emailDeliveredMsg ? <Check className="h-4 w-4 text-emerald-600" /> : <Mail className="h-4 w-4" />}
              <span>{isSendingEmail ? "Sending..." : emailDeliveredMsg ? "Delivered!" : "Email Slip"}</span>
            </button>
          )}

          {isSlipSupported && onGenerateSlip && (
            <button
              type="button"
              onClick={onGenerateSlip}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Print Official Slip</span>
            </button>
          )}

          {onViewReceipt && (
            <button
              type="button"
              onClick={onViewReceipt}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Receipt</span>
            </button>
          )}
        </div>
      </div>

      {/* Instant Email Notification Banner */}
      {emailDeliveredMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{emailDeliveredMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        {/* Profile Header if Person/Identity */}
        {data && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            {cleanPhotoUrl && !imgError ? (
              <div className="relative">
                <img
                  src={cleanPhotoUrl}
                  alt={data.fullName || "Verified Profile"}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                {data.companyName
                  ? <Building2 className="h-8 w-8" />
                  : <User className="h-8 w-8" />}
              </div>
            )}

            <div className="space-y-1 flex-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {data.fullName || data.companyName || "Verified Record"}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-700 dark:text-slate-300">
                  ID: {maskedId}
                </span>
                {data.gender && (
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md font-semibold text-[11px]">
                    {data.gender}
                  </span>
                )}
                {data.companyStatus && (
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold text-[11px]">
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
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" /> Date of Birth
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono">{data.dateOfBirth}</p>
              </div>
            )}

            {data.phoneNumber && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-slate-400" /> Phone Number
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono">{data.phoneNumber}</p>
              </div>
            )}

            {data.email && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" /> Email Address
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono truncate">{data.email}</p>
              </div>
            )}

            {data.stateOfOrigin && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" /> State & LGA
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {data.stateOfOrigin} {data.lga ? `(${data.lga})` : ""}
                </p>
              </div>
            )}

            {data.address && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5 col-span-1 md:col-span-2">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" /> Registered Address
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{data.address}</p>
              </div>
            )}

            {data.rcNumber && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400" /> RC / BN Number
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono">{data.rcNumber}</p>
              </div>
            )}

            {data.tin && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Hash className="h-3 w-3 text-slate-400" /> Tax Identification Number
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono">{data.tin}</p>
              </div>
            )}

            {data.taxOffice && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                  <Award className="h-3 w-3 text-slate-400" /> Tax Office
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{data.taxOffice}</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Footer Metadata */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            Ref: <span className="font-mono font-bold text-slate-600 dark:text-slate-400">#{reference}</span>
          </div>
          <div>
            Date: <span className="font-mono text-slate-600 dark:text-slate-400">{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
