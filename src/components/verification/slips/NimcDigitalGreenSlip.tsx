import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { NigerianCoatOfArmsSvg, GuillocheSecurityBackground } from "./SlipSecurityAssets";
import { GeneratedSlipRecord } from "../../../types/verification";
import { normalizePhotoUrl } from "../../../services/slipOptionsConfig";

interface NimcDigitalGreenSlipProps {
  slip: GeneratedSlipRecord;
  id?: string;
  isFoldable?: boolean;
}

export const NimcDigitalGreenSlip: React.FC<NimcDigitalGreenSlipProps> = ({
  slip,
  id = "nimc-digital-green-slip",
  isFoldable = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [imgError, setImgError] = useState(false);
  const { holderData, identificationNumber, qrVerificationUrl, createdAt } = slip;
  const photo = normalizePhotoUrl(holderData.photoUrl || "");

  // Extract names
  const surname = (holderData.surname || holderData.fullName?.split(" ")[0] || "HOLDER").toUpperCase();
  const givenNames = (
    holderData.firstName
      ? `${holderData.firstName} ${holderData.middleName || ""}`
      : holderData.fullName?.split(" ").slice(1).join(" ") || "NIGERIAN CITIZEN"
  ).trim().toUpperCase();

  const gender = holderData.gender ? (holderData.gender.toUpperCase().startsWith("M") ? "M" : "F") : "M";
  const dob = holderData.dateOfBirth || "01 JAN 1990";

  // Issue date formatted e.g. "14 AUG 2026"
  const formattedIssueDate = holderData.issueDate || (() => {
    const d = new Date(createdAt || Date.now());
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  })();

  // Format NIN with 4-3-4 grouping (e.g. 3089 434 4164)
  const formattedNin =
    identificationNumber.length === 11
      ? `${identificationNumber.substring(0, 4)}  ${identificationNumber.substring(4, 7)}  ${identificationNumber.substring(7, 11)}`
      : identificationNumber;

  useEffect(() => {
    // Generate QR using cryptographically signed payload from server
    // Fallback to verification URL if signed content is not present (legacy records)
    const qrTarget = slip.signedQrContent || qrVerificationUrl;

    if (!qrTarget) return;

    QRCode.toDataURL(qrTarget, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [qrVerificationUrl, slip.signedQrContent, slip.qrVerificationToken]);

  return (
    <div
      id={id}
      className="bg-white text-[#111827] font-sans max-w-[420px] mx-auto border-2 border-black rounded-xl overflow-hidden shadow-xl select-text print:shadow-none print:border-2 print:border-black print:m-0 print:max-w-none print:w-[380px]"
      style={{ fontFamily: "'Arial', 'Segoe UI', sans-serif" }}
    >
      {/* =========================================================
          FRONT CARD (DIGITAL NIN SLIP)
          ========================================================= */}
      <div className="relative p-4 sm:p-5 bg-gradient-to-b from-[#F5F7FA]/90 via-[#F5F7FA]/40 to-[#F5F7FA]/90 border-b-2 border-dashed border-black overflow-hidden min-h-[255px]">
        {/* Fine-line security guilloche pattern */}
        <GuillocheSecurityBackground color="#16a34a" opacity={0.16} />

        {/* Center Coat of Arms Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <NigerianCoatOfArmsSvg size={150} />
        </div>

        {/* Repetitive Diagonal NIN Watermark Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-wrap gap-x-12 gap-y-8 p-3 select-none text-[11px] font-mono font-bold text-[#0F2D5C] -rotate-12 transform scale-110">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>{identificationNumber}</span>
          ))}
        </div>

        {/* Front Card Header */}
        <div className="relative z-10 space-y-0.5">
          <h2 className="text-xs sm:text-[13px] font-black tracking-tight text-[#0F2D5C] uppercase leading-none">
            FEDERAL REPUBLIC OF NIGERIA
          </h2>
          <h3 className="text-[11px] sm:text-xs font-black text-[#111827] tracking-wider uppercase">
            DIGITAL NIN SLIP
          </h3>
        </div>

        {/* Front Card Body */}
        <div className="relative z-10 grid grid-cols-12 gap-2.5 mt-2.5 items-start">
          {/* Left: Applicant Photo */}
          <div className="col-span-4 relative flex flex-col items-start">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 border-2 border-[#0F2D5C]/60 rounded-xs overflow-hidden bg-white shadow-xs">
              {photo && !imgError ? (
                <img
                  src={photo}
                  alt={holderData.fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F7FA] text-[#0F2D5C] text-[9px] font-bold p-1 text-center">
                  <span>OFFICIAL</span>
                  <span>PHOTO</span>
                </div>
              )}
              {/* Diagonal Watermark on Photo */}
              <div className="absolute bottom-1 -left-2 -right-2 transform -rotate-12 bg-black/60 text-white text-[8px] font-mono font-bold text-center py-0.5 pointer-events-none">
                {identificationNumber}
              </div>
            </div>
          </div>

          {/* Center: Identification Details */}
          <div className="col-span-5 space-y-1.5 text-[10px] sm:text-[11px] leading-tight">
            <div>
              <span className="text-[8.5px] font-bold text-[#4B5563] uppercase tracking-wider block">
                SURNAME/NOM
              </span>
              <span className="font-black text-[#111827] uppercase text-xs sm:text-[13px] block">
                {surname}
              </span>
            </div>

            <div>
              <span className="text-[8.5px] font-bold text-[#4B5563] uppercase tracking-wider block">
                GIVEN NAMES/PRÉNOMS
              </span>
              <span className="font-bold text-[#111827] uppercase block line-clamp-2">
                {givenNames}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div>
                <span className="text-[8px] font-bold text-[#4B5563] uppercase block">DATE OF BIRTH</span>
                <span className="font-black text-[#111827] text-[10px] block font-mono">
                  {dob}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-bold text-[#4B5563] uppercase block">SEX/SEXE</span>
                <span className="font-black text-[#111827] text-[10px] block">
                  {gender}
                </span>
              </div>
            </div>
          </div>

          {/* Right: 2D Barcode & Country Tag */}
          <div className="col-span-3 flex flex-col items-center justify-between h-full space-y-1">
            {qrDataUrl && (
              <div className="w-16 h-16 sm:w-18 sm:h-18 p-0.5 bg-white border border-[#111827] shadow-xs">
                <img src={qrDataUrl} alt="NIN 2D Verification Barcode" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="text-center w-full">
              <span className="font-black text-xs tracking-wider text-[#111827] block leading-none">
                NGA
              </span>
              <span className="text-[7.5px] font-bold text-[#4B5563] uppercase block mt-0.5">
                ISSUE DATE
              </span>
              <span className="text-[8px] font-black text-[#111827] font-mono block">
                {formattedIssueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom NIN Number Bar */}
        <div className="relative z-10 mt-3 pt-1.5 border-t border-[#0F2D5C]/40 text-center">
          <span className="text-[9px] font-bold text-[#111827] uppercase tracking-wider block">
            National Identification Number (NIN)
          </span>
          <div className="font-mono font-black text-base sm:text-lg tracking-widest text-black mt-0.5">
            {formattedNin}
          </div>
        </div>
      </div>

      {/* =========================================================
          BACK CARD (INVERTED DISCLAIMER FOR FOLDABLE PRINTING)
          ========================================================= */}
      {isFoldable && (
        <div
          className="relative p-4 sm:p-5 bg-white text-black min-h-[240px] flex flex-col justify-between"
          style={{ transform: "rotate(180deg)" }}
        >
          {/* Fine Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <NigerianCoatOfArmsSvg size={160} />
          </div>

          <div className="relative z-10 space-y-2 text-center">
            <h2 className="text-sm font-black tracking-widest uppercase text-black">
              DISCLAIMER
            </h2>
            <p className="text-[10px] italic font-serif text-[#4B5563]">
              Trust, but verify
            </p>

            <div className="pt-1">
              <span className="text-xs font-black text-black uppercase tracking-wider block">
                CAUTION!
              </span>
            </div>

            <div className="space-y-1.5 text-[8.5px] sm:text-[9.5px] text-[#111827] leading-snug max-w-[340px] mx-auto text-center font-medium">
              <p>
                Kindly ensure each time this ID is presented, that you verify the credentials using a Government-APPROVED verification resource.
              </p>
              <p>
                The details on the front of this NIN Slip must <strong className="font-black">EXACTLY</strong> match the verification result.
              </p>
              <p>
                If this NIN was not issued to the person on the front of this document, please DO NOT attempt to scan, photocopy or replicate the personal data contained herein.
              </p>
              <p>
                You are only permitted to scan the barcode for the purpose of identity verification.
              </p>
              <p className="text-[8px] font-bold text-[#4B5563] uppercase">
                The FEDERAL GOVERNMENT OF NIGERIA assumes no responsibility if you accept any variance in the scan result or do not scan the 2D barcode overleaf.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-[#E5E7EB] text-center flex items-center justify-between text-[8px] font-mono text-[#6B7280]">
            <span>REF: {slip.reference}</span>
            <span>SMARTLINK DIGITAL CORE VERIFIED</span>
          </div>
        </div>
      )}
    </div>
  );
};
