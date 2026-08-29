import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { GeneratedSlipRecord } from "../../../types/verification";

interface ThermalReceiptSlipProps {
  slip: GeneratedSlipRecord;
  id?: string;
  paperWidth?: "58mm" | "80mm";
}

export const ThermalReceiptSlip: React.FC<ThermalReceiptSlipProps> = ({
  slip,
  id = "thermal-receipt-slip",
  paperWidth = "80mm",
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { holderData, identificationNumber, qrVerificationUrl, reference, createdAt, serviceType } = slip;

  const maxWidthClass = paperWidth === "58mm" ? "max-w-[240px]" : "max-w-[320px]";

  useEffect(() => {
    const qrTarget = qrVerificationUrl || `https://smartlinkdigital.ng/verify/slip/${slip.qrVerificationToken}`;
    QRCode.toDataURL(qrTarget, {
      width: 180,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Thermal QR Error:", err));
  }, [qrVerificationUrl, slip.qrVerificationToken]);

  return (
    <div
      id={id}
      className={`bg-white text-black font-mono p-4 ${maxWidthClass} mx-auto border border-black shadow-md text-xs leading-tight print:border-none print:shadow-none print:m-0 print:p-2 select-text`}
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Header */}
      <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
        <h1 className="font-bold text-sm uppercase">SMARTLINK DIGITAL</h1>
        <p className="text-[10px]">OFFICIAL AGENT TRANSACTION RECEIPT</p>
        <p className="text-[9px]">TEL: 0700-CALL-SMARTLINK</p>
      </div>

      {/* Transaction Metadata */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>SERVICE:</span>
          <span className="font-bold">{serviceType} VERIFICATION</span>
        </div>
        <div className="flex justify-between">
          <span>REF NO:</span>
          <span>{reference}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>TIME:</span>
          <span>{new Date(createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>STATUS:</span>
          <span className="font-bold">VERIFIED [SUCCESS]</span>
        </div>
      </div>

      {/* Verified Record Body */}
      <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
        <div>
          <span className="block text-[10px] text-slate-600">ID NUMBER:</span>
          <span className="font-bold text-sm tracking-wider block">{identificationNumber}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-600">NAME:</span>
          <span className="font-bold uppercase block">{holderData.fullName || "RECORD CONFIRMED"}</span>
        </div>
        {holderData.dateOfBirth && (
          <div className="flex justify-between">
            <span>DOB:</span>
            <span>{holderData.dateOfBirth}</span>
          </div>
        )}
        {holderData.gender && (
          <div className="flex justify-between">
            <span>GENDER:</span>
            <span>{holderData.gender}</span>
          </div>
        )}
        {holderData.stateOfOrigin && (
          <div className="flex justify-between">
            <span>STATE:</span>
            <span>{holderData.stateOfOrigin}</span>
          </div>
        )}
      </div>

      {/* Scannable Validation QR Code */}
      <div className="py-3 text-center space-y-2 flex flex-col items-center justify-center">
        {qrDataUrl && (
          <div className="w-24 h-24 p-1 border border-black bg-white">
            <img src={qrDataUrl} alt="Thermal Receipt QR" className="w-full h-full object-contain" />
          </div>
        )}
        <span className="text-[9px] block">SCAN TO VERIFY AUTHENTICITY</span>
        <span className="text-[8px] text-slate-600 block break-all font-mono">
          TOKEN: {slip.qrVerificationToken.substring(0, 16)}...
        </span>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 border-t border-dashed border-black text-center space-y-1 text-[9px]">
        <p>Thank you for using SmartLink Agent Portal</p>
        <p>Keep receipt safe for reference.</p>
        <p className="font-bold">*** POWERED BY SMARTLINK CORE ***</p>
      </div>
    </div>
  );
};
