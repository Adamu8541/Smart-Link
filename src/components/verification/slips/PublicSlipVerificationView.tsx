import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  User,
  Hash,
  Award,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { SlipValidationPublicResult } from "../../../types/verification";
import { FirestoreSlipService } from "../../../services/firestoreSlipService";
import { NigerianCoatOfArmsSvg } from "./SlipSecurityAssets";

interface PublicSlipVerificationViewProps {
  token: string;
  onBackHome?: () => void;
}

export const PublicSlipVerificationView: React.FC<PublicSlipVerificationViewProps> = ({
  token,
  onBackHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<SlipValidationPublicResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided in URL parameter.");
      setLoading(false);
      return;
    }

    setLoading(true);
    FirestoreSlipService.validateToken(token)
      .then((res) => {
        if (res && res.isValid) {
          setValidation(res);
        } else {
          setError("The scanned QR code or verification token could not be verified. It may be invalid or expired.");
        }
      })
      .catch((err) => {
        console.error("Token verification error:", err);
        setError("Network error while communicating with verification gateway.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <NigerianCoatOfArmsSvg size={40} />
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              SMARTLINK DIGITAL IDENTITY
            </h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Federal Credential Verification Gateway
            </p>
          </div>
        </div>
        {onBackHome && (
          <button
            type="button"
            onClick={onBackHome}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>
        )}
      </div>

      {/* Main Verification Card */}
      <div className="max-w-xl mx-auto w-full my-8">
        {loading ? (
          <div className="p-8 bg-slate-800/80 border border-slate-700 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-base font-bold text-white">Validating Security Token...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Querying cryptographic ledger on Firestore...
              </p>
            </div>
          </div>
        ) : error || !validation ? (
          <div className="p-6 sm:p-8 bg-rose-950/40 border border-rose-700/50 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-rose-200">
                Invalid or Unverified Credential
              </h3>
              <p className="text-xs text-rose-300/80 max-w-md mx-auto">
                {error || "The requested verification token does not match any active record in the federal identity database."}
              </p>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
              TOKEN: {token}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Verified Header Banner */}
            <div className="flex items-center gap-4 pb-5 border-b border-slate-700">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    AUTHENTIC CREDENTIAL
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {validation.serviceType}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white">
                  Government Record Verified
                </h2>
                <p className="text-xs text-slate-400">
                  Confirmed through SmartLink Federal API Gateway
                </p>
              </div>
            </div>

            {/* Holder Profile Breakdown */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registered Full Name
                </span>
                <p className="text-base font-black text-white uppercase tracking-wide">
                  {validation.holderName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Verified ID Number
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {validation.maskedIdentification}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Gender
                  </span>
                  <span className="font-bold text-white">
                    {validation.gender || "MALE"}
                  </span>
                </div>

                {validation.stateOfOrigin && (
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      State / LGA
                    </span>
                    <span className="font-bold text-white">
                      {validation.stateOfOrigin} {validation.lga ? `(${validation.lga})` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Proof Box */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-2 text-[11px]">
              <div className="flex justify-between items-center text-slate-400">
                <span>Validation Hash:</span>
                <span className="font-mono text-emerald-400 font-bold break-all">
                  {validation.token.substring(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Issue Timestamp:</span>
                <span className="font-mono text-white">
                  {new Date(validation.issuedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Scan Checks:</span>
                <span className="font-bold text-emerald-400">
                  {validation.verificationCount} Successful Scans
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} SmartLink Digital Identity Services. All Rights Reserved.</p>
        <p className="mt-0.5">Powered by SmartLink Core Gateway & Firebase Firestore</p>
      </div>
    </div>
  );
};
