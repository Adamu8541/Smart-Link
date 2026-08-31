import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { NigerianCoatOfArmsSvg } from "./SlipSecurityAssets";
import { GeneratedSlipRecord } from "../../../types/verification";
import { normalizePhotoUrl } from "../../../services/slipOptionsConfig";

interface NimcPremiumWhiteSlipProps {
  slip: GeneratedSlipRecord;
  id?: string;
  isFoldable?: boolean;
}

export const NimcPremiumWhiteSlip: React.FC<NimcPremiumWhiteSlipProps> = ({
  slip,
  id = "nimc-premium-white-slip",
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
      ? `${holderData.firstName}, ${holderData.middleName || ""}`
      : holderData.fullName?.split(" ").slice(1).join(" ") || "NIGERIAN CITIZEN"
  ).trim().toUpperCase();

  const dob = holderData.dateOfBirth || "20 JUL 1994";

  // Issue date formatted e.g. "26 DEC 2025"
  const formattedIssueDate = holderData.issueDate || (() => {
    const d = new Date(createdAt || Date.now());
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  })();

  // Format NIN with 4-3-4 grouping (e.g. 6540 687 5560)
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
      className="bg-white text-black font-sans max-w-[420px] mx-auto border-2 border-black rounded-xl overflow-hidden shadow-xl select-text print:shadow-none print:border-2 print:border-black print:m-0 print:max-w-none print:w-[380px]"
      style={{ fontFamily: "'Arial', 'Segoe UI', sans-serif" }}
    >
      {/* =========================================================
          FRONT CARD (STANDARD PREMIUM WHITE WALLET SLIP)
          ========================================================= */}
      <div className="relative p-5 bg-white border-b-2 border-dashed border-black overflow-hidden min-h-[260px] flex flex-col justify-between">
        {/* Subtle Watermark Layer */}
        <div className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none">
          <NigerianCoatOfArmsSvg size={140} />
        </div>

        {/* Top Header with Centered Coat of Arms & Right NGA */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="w-16"></div> {/* Spacer balance */}
          <div className="flex justify-center flex-1">
            <NigerianCoatOfArmsSvg size={56} />
          </div>
          <div className="w-16 text-right">
            <span className="font-black text-sm tracking-widest text-black">NGA</span>
          </div>
        </div>

        {/* Front Details Row */}
        <div className="relative z-10 grid grid-cols-12 gap-3 items-center mt-2">
          {/* Photo */}
          <div className="col-span-4 relative">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 border border-[#9CA3AF] overflow-hidden bg-[#F5F7FA] shadow-xs">
              {photo && !imgError ? (
                <img
                  src={photo}
                  alt={holderData.fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#E5E7EB] text-[#6B7280] text-[9px] font-bold p-1 text-center">
                  <span>PHOTO</span>
                </div>
              )}
              {/* Diagonal Watermark on Photo */}
              <div className="absolute bottom-1 -left-2 -right-2 transform -rotate-12 bg-black/60 text-white text-[8px] font-mono font-bold text-center py-0.5 pointer-events-none">
                {identificationNumber}
              </div>
            </div>
          </div>

          {/* Center Details */}
          <div className="col-span-5 space-y-1.5 text-[10.5px] leading-tight">
            <div>
              <span className="text-[8.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Surname/Nom
              </span>
              <span className="font-black text-black uppercase text-xs sm:text-[13px] block">
                {surname}
              </span>
            </div>

            <div>
              <span className="text-[8.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Given Names/Prénoms
              </span>
              <span className="font-bold text-black uppercase block line-clamp-2">
                {givenNames}
              </span>
            </div>

            <div>
              <span className="text-[8.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Date of Birth
              </span>
              <span className="font-black text-black text-xs block font-mono">
                {dob}
              </span>
            </div>
          </div>

          {/* Right QR Code & Issue Date */}
          <div className="col-span-3 flex flex-col items-center justify-center space-y-1">
            {qrDataUrl && (
              <div className="w-16 h-16 sm:w-18 sm:h-18 p-0.5 bg-white border border-black shadow-xs">
                <img src={qrDataUrl} alt="NIN Verification Barcode" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="text-center w-full">
              <span className="text-[7.5px] font-bold text-[#6B7280] uppercase block">
                ISSUE DATE
              </span>
              <span className="text-[8px] font-black text-black font-mono block">
                {formattedIssueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom NIN Display */}
        <div className="relative z-10 mt-3 pt-2 text-center border-t border-[#E5E7EB]">
          <span className="text-[9px] font-bold text-black uppercase tracking-wider block">
            National Identification Number (NIN)
          </span>
          <div className="font-mono font-black text-lg sm:text-xl tracking-widest text-black mt-0.5">
            {formattedNin}
          </div>
          <p className="text-[8px] italic font-serif text-[#4B5563] mt-0.5">
            Kindly ensure you scan the barcode to verify the credential
          </p>
        </div>
      </div>

      {/* =========================================================
          BACK CARD (INVERTED DISCLAIMER FOR FOLDABLE PRINTING)
          ========================================================= */}
      {isFoldable && (
        <div
          className="relative p-5 bg-white text-black min-h-[240px] flex flex-col justify-between"
          style={{ transform: "rotate(180deg)" }}
        >
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
            <span>SMARTLINK DIGITAL VALIDATED</span>
          </div>
        </div>
      )}
    </div>
  );
};
