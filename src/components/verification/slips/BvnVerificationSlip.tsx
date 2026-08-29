import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { NibssOfficialLogoSvg, NigerianCoatOfArmsSvg } from "./SlipSecurityAssets";
import { GeneratedSlipRecord } from "../../../types/verification";
import { normalizePhotoUrl } from "../../../services/slipOptionsConfig";

interface BvnVerificationSlipProps {
  slip: GeneratedSlipRecord;
  id?: string;
}

export const BvnVerificationSlip: React.FC<BvnVerificationSlipProps> = ({
  slip,
  id = "bvn-verification-slip",
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [imgError, setImgError] = useState(false);
  const { holderData, identificationNumber, qrVerificationUrl, reference, createdAt } = slip;
  const photo = normalizePhotoUrl(holderData.photoUrl || "");

  const formattedBvn =
    identificationNumber.length === 11
      ? `${identificationNumber.substring(0, 4)}  ${identificationNumber.substring(4, 7)}  ${identificationNumber.substring(7, 11)}`
      : identificationNumber;

  useEffect(() => {
    const qrTarget = qrVerificationUrl || `https://smartlinkdigital.ng/verify/slip/${slip.qrVerificationToken}`;
    QRCode.toDataURL(qrTarget, {
      width: 250,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0F2D5C", light: "#FFFFFF" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("BVN QR Error:", err));
  }, [qrVerificationUrl, slip.qrVerificationToken]);

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans p-6 rounded-2xl border-2 border-blue-900 max-w-[680px] mx-auto shadow-xl select-text print:shadow-none print:border-2 print:border-blue-900 print:m-0 print:p-4 print:w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4">
        <div className="w-16 flex justify-center">
          <NigerianCoatOfArmsSvg size={52} />
        </div>
        <div className="text-center space-y-0.5">
          <h1 className="text-base font-black tracking-tight text-blue-950 uppercase">
            NIGERIA INTER-BANK SETTLEMENT SYSTEM PLC
          </h1>
          <h2 className="text-xs font-bold text-slate-700 uppercase">
            CENTRAL BANK OF NIGERIA (CBN) KYC GATEWAY
          </h2>
          <h3 className="text-xs font-black text-blue-900 uppercase">
            Official Bank Verification Number (BVN) Certificate
          </h3>
        </div>
        <div className="w-20 flex justify-center">
          <NibssOfficialLogoSvg size={70} />
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="py-4 grid grid-cols-12 gap-4 border-b border-blue-200">
        {/* Photo Box */}
        <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-300 rounded-xl">
          {photo && !imgError ? (
            <div className="w-28 h-32 border-2 border-blue-900 rounded-lg overflow-hidden shadow-xs">
              <img
                src={photo}
                alt={holderData.fullName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-32 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center bg-blue-50/50 text-blue-900 text-[10px] font-bold text-center p-2">
              <span>NIBSS VERIFIED</span>
              <span>BIOMETRICS</span>
            </div>
          )}
          <span className="mt-2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            ● BIOMETRIC VERIFIED
          </span>
        </div>

        {/* Details Grid */}
        <div className="col-span-8 grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-2 p-2 bg-blue-50/60 rounded-lg border border-blue-100">
            <span className="text-[10px] font-bold text-blue-900 uppercase block">Account Holder Full Name</span>
            <span className="text-sm font-black text-slate-950 uppercase">{holderData.fullName || "RECORD CONFIRMED"}</span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Date of Birth</span>
            <span className="font-bold text-slate-900 font-mono">{holderData.dateOfBirth || "-"}</span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Gender</span>
            <span className="font-bold text-slate-900">{holderData.gender || "-"}</span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Registered Phone</span>
            <span className="font-bold text-slate-900 font-mono">{holderData.phoneNumber || "-"}</span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Enrollment State / LGA</span>
            <span className="font-bold text-slate-900">{holderData.stateOfOrigin || "Federal Registry"}</span>
          </div>
        </div>
      </div>

      {/* Prominent BVN Display Bar */}
      <div className="my-4 p-3 bg-blue-900 text-white rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
            Bank Verification Number (BVN)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-400">
            {formattedBvn}
          </span>
        </div>
        <div className="text-right text-[10px] font-mono text-blue-200">
          <div>STATUS: <strong className="text-emerald-400">ACTIVE & VERIFIED</strong></div>
          <div>REF: #{reference}</div>
        </div>
      </div>

      {/* Bottom Footer with QR & Legal Advisory */}
      <div className="flex items-center justify-between pt-2 text-[10px] text-slate-600">
        <div className="space-y-1 max-w-[440px]">
          <p className="font-semibold text-slate-800">
            This verification certificate was generated via SmartLink Digital API Gateway in compliance with CBN regulatory standards.
          </p>
          <p className="text-[9px] text-slate-500 font-mono">
            Date Issued: {new Date(createdAt).toLocaleString()} | Security Hash: {slip.qrVerificationToken.substring(0, 16)}
          </p>
        </div>
        {qrDataUrl && (
          <div className="w-16 h-16 p-1 border border-blue-900 rounded-lg bg-white flex-shrink-0">
            <img src={qrDataUrl} alt="NIBSS Validation QR" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};
