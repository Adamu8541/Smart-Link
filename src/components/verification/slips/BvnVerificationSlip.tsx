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
    // Generate QR using cryptographically signed payload from server
    // Fallback to verification URL if signed content is not present (legacy records)
    const qrTarget = slip.signedQrContent || qrVerificationUrl;

    if (!qrTarget) return;

    QRCode.toDataURL(qrTarget, {
      width: 250,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0F2D5C", light: "#FFFFFF" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("BVN QR Error:", err));
  }, [qrVerificationUrl, slip.signedQrContent, slip.qrVerificationToken]);

  return (
    <div
      id={id}
      className="bg-white text-[#111827] font-sans p-6 rounded-2xl border-2 border-[#0F2D5C] max-w-[680px] mx-auto shadow-xl select-text print:shadow-none print:border-2 print:border-[#0F2D5C] print:m-0 print:p-4 print:w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0F2D5C] pb-4">
        <div className="w-16 flex justify-center">
          <NigerianCoatOfArmsSvg size={52} />
        </div>
        <div className="text-center space-y-0.5">
          <h1 className="text-base font-black tracking-tight text-[#0F2D5C] uppercase">
            NIGERIA INTER-BANK SETTLEMENT SYSTEM PLC
          </h1>
          <h2 className="text-xs font-bold text-[#4B5563] uppercase">
            CENTRAL BANK OF NIGERIA (CBN) KYC GATEWAY
          </h2>
          <h3 className="text-xs font-black text-[#0F2D5C] uppercase">
            Official Bank Verification Number (BVN) Certificate
          </h3>
        </div>
        <div className="w-20 flex justify-center">
          <NibssOfficialLogoSvg size={70} />
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="py-4 grid grid-cols-12 gap-4 border-b border-[#E5E7EB]">
        {/* Photo Box */}
        <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl">
          {photo && !imgError ? (
            <div className="w-28 h-32 border-2 border-[#0F2D5C] rounded-lg overflow-hidden shadow-xs">
              <img
                src={photo}
                alt={holderData.fullName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-32 border-2 border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center bg-[#F5F7FA]/50 text-[#0F2D5C] text-[10px] font-bold text-center p-2">
              <span>NIBSS VERIFIED</span>
              <span>BIOMETRICS</span>
            </div>
          )}
          <span className="mt-2 text-[10px] font-mono font-bold text-[#0F2D5C] bg-[#E5E7EB] px-2 py-0.5 rounded-full">
            ● BIOMETRIC VERIFIED
          </span>
        </div>

        {/* Details Grid */}
        <div className="col-span-8 grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-2 p-2 bg-[#F5F7FA]/60 rounded-lg border border-[#E5E7EB]">
            <span className="text-[10px] font-bold text-[#0F2D5C] uppercase block">Account Holder Full Name</span>
            <span className="text-sm font-black text-[#111827] uppercase">{holderData.fullName || "RECORD CONFIRMED"}</span>
          </div>

          <div className="p-2 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB]">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Date of Birth</span>
            <span className="font-bold text-[#111827] font-mono">{holderData.dateOfBirth || "-"}</span>
          </div>

          <div className="p-2 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB]">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Gender</span>
            <span className="font-bold text-[#111827]">{holderData.gender || "-"}</span>
          </div>

          <div className="p-2 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB]">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Registered Phone</span>
            <span className="font-bold text-[#111827] font-mono">{holderData.phoneNumber || "-"}</span>
          </div>

          <div className="p-2 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB]">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Enrollment State / LGA</span>
            <span className="font-bold text-[#111827]">{holderData.stateOfOrigin || "Federal Registry"}</span>
          </div>
        </div>
      </div>

      {/* Prominent BVN Display Bar */}
      <div className="my-4 p-3 bg-[#0F2D5C] text-white rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] block">
            Bank Verification Number (BVN)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-[#9CA3AF]">
            {formattedBvn}
          </span>
        </div>
        <div className="text-right text-[10px] font-mono text-[#9CA3AF]">
          <div>STATUS: <strong className="text-[#9CA3AF]">ACTIVE & VERIFIED</strong></div>
          <div>REF: #{reference}</div>
        </div>
      </div>

      {/* Bottom Footer with QR & Legal Advisory */}
      <div className="flex items-center justify-between pt-2 text-[10px] text-[#4B5563]">
        <div className="space-y-1 max-w-[440px]">
          <p className="font-semibold text-[#111827]">
            This verification certificate was generated via SmartLink Digital API Gateway in compliance with CBN regulatory standards.
          </p>
          <p className="text-[9px] text-[#6B7280] font-mono">
            Date Issued: {new Date(createdAt).toLocaleString()} | Security Hash: {slip.qrVerificationToken.substring(0, 16)}
          </p>
        </div>
        {qrDataUrl && (
          <div className="w-16 h-16 p-1 border border-[#0F2D5C] rounded-lg bg-white flex-shrink-0">
            <img src={qrDataUrl} alt="NIBSS Validation QR" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};
