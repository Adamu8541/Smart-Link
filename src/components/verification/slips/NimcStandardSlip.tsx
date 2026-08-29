import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { NigerianCoatOfArmsSvg, NimcOfficialLogoSvg } from "./SlipSecurityAssets";
import { GeneratedSlipRecord } from "../../../types/verification";
import { normalizePhotoUrl } from "../../../services/slipOptionsConfig";

interface NimcStandardSlipProps {
  slip: GeneratedSlipRecord;
  id?: string;
}

export const NimcStandardSlip: React.FC<NimcStandardSlipProps> = ({ slip, id = "nimc-standard-slip" }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [imgError, setImgError] = useState(false);
  const { holderData, identificationNumber, trackingId, qrVerificationUrl } = slip;

  const realTrackingId = trackingId || holderData.trackingId || `20TO${identificationNumber.substring(0, 4)}000008J`;
  const surname = (holderData.surname || holderData.fullName?.split(" ")[0] || "HOLDER").toUpperCase();
  const firstName = (holderData.firstName || holderData.fullName?.split(" ")[1] || "").toUpperCase();
  const middleName = (holderData.middleName || holderData.fullName?.split(" ").slice(2).join(" ") || "").toUpperCase();
  const gender = holderData.gender ? (holderData.gender.toUpperCase().startsWith("M") ? "M" : "F") : "M";
  const address = holderData.address || "OFFICIAL RESIDENTIAL RECORD";
  const state = holderData.stateOfOrigin || "";
  const lga = holderData.lga || "";
  const photo = normalizePhotoUrl(holderData.photoUrl || "");

  useEffect(() => {
    // Generate high resolution scannable 2D QR barcode
    const qrTarget = qrVerificationUrl || `https://smartlinkdigital.ng/verify/slip/${slip.qrVerificationToken}`;
    QRCode.toDataURL(qrTarget, {
      width: 250,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [qrVerificationUrl, slip.qrVerificationToken]);

  return (
    <div
      id={id}
      className="bg-white text-black font-sans p-4 sm:p-6 rounded-lg border-2 border-black max-w-[760px] mx-auto shadow-lg select-text print:shadow-none print:border-2 print:border-black print:m-0 print:p-4 print:w-full"
      style={{ fontFamily: "'Arial', 'Helvetica Neue', sans-serif" }}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        {/* Left: Coat of Arms */}
        <div className="flex-shrink-0 w-16 sm:w-20 flex justify-center">
          <NigerianCoatOfArmsSvg size={68} />
        </div>

        {/* Center: Official Title */}
        <div className="text-center flex-1 px-2 space-y-0.5">
          <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight uppercase text-black leading-tight">
            National Identity Management System
          </h1>
          <h2 className="text-xs sm:text-sm font-bold text-black uppercase">
            Federal Republic of Nigeria
          </h2>
          <h3 className="text-xs sm:text-sm font-black text-black">
            National Identification Number Slip (NINS)
          </h3>
        </div>

        {/* Right: NIMC Green Logo */}
        <div className="flex-shrink-0 w-16 sm:w-20 flex justify-center">
          <NimcOfficialLogoSvg size={68} />
        </div>
      </div>

      {/* Main Grid Table - 4 Columns */}
      <div className="border-b-2 border-black text-xs sm:text-[13px] leading-snug">
        {/* Row 1: Tracking ID & Surname & Address & Photo */}
        <div className="grid grid-cols-12 border-b border-black">
          {/* Tracking ID col */}
          <div className="col-span-3 border-r border-black p-2 bg-white flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">Tracking ID:</span>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wide mt-1 break-all">
              {realTrackingId}
            </span>
          </div>

          {/* Surname col */}
          <div className="col-span-3 border-r border-black p-2 flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">Surname:</span>
            <span className="font-bold text-xs sm:text-sm uppercase mt-1">
              {surname}
            </span>
          </div>

          {/* Address col (Spans down) */}
          <div className="col-span-3 border-r border-black p-2 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[11px] sm:text-xs">Address:</span>
              <p className="font-medium text-[11px] sm:text-xs uppercase mt-0.5 break-words line-clamp-3">
                {address}
              </p>
            </div>
            <div className="pt-2 text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase">
              {lga && <div>{lga}</div>}
              {state && <div>{state}</div>}
            </div>
          </div>

          {/* Photo Box col */}
          <div className="col-span-3 p-1.5 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {photo && !imgError ? (
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 border border-black overflow-hidden bg-white shadow-xs">
                <img
                  src={photo}
                  alt={holderData.fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
                {/* Diagonal Watermark on Photo */}
                <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-1">
                  <span className="text-[9px] font-mono font-black text-white bg-black/60 px-1 py-0.5 rounded-xs tracking-wider">
                    {identificationNumber}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-24 h-28 sm:w-28 sm:h-32 border border-black flex flex-col items-center justify-center bg-slate-200 text-slate-500 text-[10px] p-2 text-center">
                <span className="font-bold">PASSPORT PHOTO</span>
                <span className="font-mono text-[9px] mt-1">{identificationNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: NIN & First Name */}
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-3 border-r border-black p-2 bg-white flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">NIN:</span>
            <span className="font-mono font-black text-sm sm:text-base tracking-widest text-black mt-1">
              {identificationNumber}
            </span>
          </div>

          <div className="col-span-3 border-r border-black p-2 flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">First Name:</span>
            <span className="font-bold text-xs sm:text-sm uppercase mt-1">
              {firstName}
            </span>
          </div>

          {/* QR Code Validation Box spanning right cols */}
          <div className="col-span-6 p-2 flex items-center justify-between gap-2 bg-slate-50/60">
            <div className="space-y-0.5">
              <span className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-900 block">
                Official Validation QR
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-600 block">
                Scan to confirm authenticity on SmartLink Digital
              </span>
              <span className="font-mono text-[8px] text-slate-500 block">
                TOKEN: {slip.qrVerificationToken.substring(0, 16)}...
              </span>
            </div>
            {qrDataUrl && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 border border-black p-0.5 bg-white">
                <img src={qrDataUrl} alt="NIMC Slip Verification QR" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Middle Name & Gender */}
        <div className="grid grid-cols-12">
          <div className="col-span-3 border-r border-black p-2 bg-slate-50/30">
            {/* Empty matching original layout */}
          </div>

          <div className="col-span-3 border-r border-black p-2 flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">Middle Name:</span>
            <span className="font-bold text-xs sm:text-sm uppercase mt-0.5">
              {middleName || "-"}
            </span>
          </div>

          <div className="col-span-3 border-r border-black p-2 flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">Gender:</span>
            <span className="font-bold text-xs sm:text-sm mt-0.5">{gender}</span>
          </div>

          <div className="col-span-3 p-2 flex flex-col justify-start">
            <span className="font-bold text-[11px] sm:text-xs">Date of Birth:</span>
            <span className="font-bold font-mono text-xs sm:text-sm mt-0.5">
              {holderData.dateOfBirth || "RECORD VERIFIED"}
            </span>
          </div>
        </div>
      </div>

      {/* Official Legal Disclaimer Box */}
      <div className="py-2.5 px-2 border-b-2 border-black space-y-1 text-center bg-white">
        <p className="text-[11px] sm:text-xs font-bold text-black">
          Note: The <span className="italic font-black">National Identification Number (NIN) is your identity.</span> It is confidential and may only be released for legitimate transactions.
        </p>
        <p className="text-[10px] sm:text-[11px] text-slate-800">
          You will be notified when your National Identity Card is ready (for any enquiries please contact)
        </p>
      </div>

      {/* 4 Bottom Contact Information Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-black text-[10px] sm:text-[11px]">
        {/* Box 1: Email */}
        <div className="p-2.5 border-r border-b md:border-b-0 border-black flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-base">📧</span>
          <span className="font-bold text-blue-900 break-all">helpdesk@nimc.gov.ng</span>
        </div>

        {/* Box 2: Website */}
        <div className="p-2.5 border-r md:border-r border-b md:border-b-0 border-black flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-base">🌐</span>
          <span className="font-bold text-blue-900">www.nimc.gov.ng</span>
        </div>

        {/* Box 3: Phone Helpdesk */}
        <div className="p-2.5 border-r border-black flex flex-col items-center justify-center text-center space-y-0.5">
          <span className="text-base">📞</span>
          <span className="font-black text-black">0700-CALL-NIMC</span>
          <span className="font-mono text-[9px] text-slate-700">(0700-2255-646)</span>
        </div>

        {/* Box 4: Address */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
          <span className="text-base">🏛️</span>
          <span className="font-black text-black text-[10px] leading-tight">National Identity Management Commission</span>
          <span className="text-[9px] text-slate-700 leading-tight">
            11, Sokode Crescent, Off Dalaba Street, Zone 5 Wuse, Abuja Nigeria
          </span>
        </div>
      </div>
    </div>
  );
};
