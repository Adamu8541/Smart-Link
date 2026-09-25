import React, { useState, useEffect } from "react";
import { FaviconLoader } from "../../ui/FaviconLoader";
import {
  X,
  Printer,
  Download,
  FileImage,
  QrCode,
  ShieldCheck,
  CreditCard,
  FileText,
  Receipt,
  Layers,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  Mail,
  Send,
  Smartphone,
  MessageSquare,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  GeneratedSlipRecord,
  SlipFormatType,
  StandardizedVerificationResult,
} from "../../../types/verification";
import { SlipService as StorageSlipService } from "../../../services/slipService";
import { SlipPrintEngine } from "../../../services/slipPrintEngine";
import { EmailSlipService } from "../../../services/emailSlipService";
import type { IdentitySlipData } from "../../../services/identitySlipPdfOverlay";

interface SlipPrintModalProps {
  verificationResult: StandardizedVerificationResult;
  userId: string;
  userEmail?: string;
  initialFormat?: SlipFormatType;
  onClose: () => void;
}

export const SlipPrintModal: React.FC<SlipPrintModalProps> = ({
  verificationResult,
  userId,
  userEmail,
  initialFormat = "NIN_REGULAR",
  onClose,
}) => {
  const isBvn = verificationResult.service === "BVN";
  const [selectedFormat, setSelectedFormat] = useState<SlipFormatType>(
    isBvn ? "BVN_STANDARD" : initialFormat
  );
  const [isFoldable, setIsFoldable] = useState(true);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");

  const [activeSlip, setActiveSlip] = useState<GeneratedSlipRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
  }, []);

  // Email & Delivery State
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [sendToRegistered, setSendToRegistered] = useState(true);
  const [customNote, setCustomNote] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const effectiveRegisteredEmail = userEmail || "";

  // Initialize or save slip to Storage
  useEffect(() => {
    let isMounted = true;
    setIsSaving(true);

    StorageSlipService.saveSlipFromVerification({
      userId,
      userEmail: effectiveRegisteredEmail,
      verificationResult,
      formatType: selectedFormat,
    })
      .then((savedSlip) => {
        if (isMounted) {
          setActiveSlip(savedSlip);
          setIsSaving(false);
        }
      })
      .catch((err) => {
        console.error("Slip initialization error:", err);
        if (isMounted) setIsSaving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFormat, verificationResult, userId, effectiveRegisteredEmail]);

  const handleDownloadPDF = async () => {
    if (!activeSlip) return;
    setIsExporting(true);

    const isNin = activeSlip.serviceType?.toUpperCase().includes("NIN") || Boolean(activeSlip.holderData?.nin);
    const rawNin = (activeSlip.identificationNumber || activeSlip.holderData?.nin || "").toString().trim();
    const safeNin = rawNin ? rawNin.replace(/[^a-zA-Z0-9_-]/g, "") : "";
    const rawBvn = (
      (activeSlip.holderData as any)?.bvn ||
      verificationResult?.data?.bvn ||
      (isBvn ? activeSlip.identificationNumber || verificationResult?.verifiedId : "") ||
      ""
    ).toString().trim();
    const safeBvn = rawBvn ? rawBvn.replace(/[^a-zA-Z0-9_-]/g, "") : "";

    const isBvnSlipSelected =
      selectedFormat === "BVN_SLIP_1" ||
      (selectedFormat as any) === "BVN_SLIP" ||
      (typeof selectedFormat === "string" && selectedFormat.toUpperCase().includes("BVN_SLIP"));

    const isBvnCardSelected =
      !isBvnSlipSelected && (
        isBvn ||
        selectedFormat === "BVN_CARD" ||
        (activeSlip.serviceType && activeSlip.serviceType.toUpperCase().includes("BVN"))
      );

    const isBvnSelected = isBvnSlipSelected || isBvnCardSelected;

    const isRegularSelected =
      !isBvnSelected &&
      (selectedFormat === "NIN_REGULAR" ||
        (typeof selectedFormat === "string" && selectedFormat.toUpperCase().includes("REGULAR")));

    const isPremiumSelected =
      !isBvnSelected &&
      (selectedFormat === "NIN_PREMIUM_WHITE" ||
        selectedFormat === "NIN_PREMIUM_GREEN" ||
        (typeof selectedFormat === "string" && selectedFormat.toUpperCase().includes("PREMIUM")));

    const filename = isBvnSlipSelected
      ? (safeBvn ? `BVN Slip ${safeBvn}` : `BVN Slip`)
      : isBvnCardSelected
      ? (safeBvn ? `BVN ${safeBvn}` : `BVN`)
      : isRegularSelected
      ? (safeNin ? `NIN Regular slip ${safeNin}` : `NIN Regular slip`)
      : isNin
      ? (safeNin ? `NIN Premium card ${safeNin}` : `NIN Premium card`)
      : `SmartLink_${activeSlip.serviceType}_Slip_${activeSlip.identificationNumber}`;

    if (isRegularSelected || isPremiumSelected || isBvnSelected) {
      const candidatePhoto = (
        activeSlip.holderData?.photoUrl ||
        (activeSlip.holderData as any)?.photo_url ||
        (activeSlip.holderData as any)?.photo ||
        (activeSlip.holderData as any)?.image ||
        (activeSlip.holderData as any)?.rawPhoto ||
        (activeSlip.holderData as any)?.base64Image ||
        (activeSlip.holderData as any)?.applicant_photo ||
        (activeSlip.holderData as any)?.picture ||
        (activeSlip.holderData as any)?.avatar ||
        verificationResult?.data?.photoUrl ||
        (verificationResult?.data as any)?.photo_url ||
        (verificationResult?.data as any)?.photo ||
        (verificationResult?.data as any)?.image ||
        (verificationResult?.data as any)?.rawPhoto ||
        (verificationResult?.data as any)?.base64Image ||
        (verificationResult?.data as any)?.applicant_photo ||
        (verificationResult?.data as any)?.picture ||
        (verificationResult?.data as any)?.avatar ||
        verificationResult?.data?.rawFields?.photo ||
        verificationResult?.data?.rawFields?.photoUrl ||
        verificationResult?.data?.rawFields?.photo_url ||
        verificationResult?.data?.rawFields?.image ||
        verificationResult?.data?.rawFields?.applicant_photo ||
        verificationResult?.data?.rawFields?.base64Image ||
        (activeSlip.metadata as any)?.photoUrl ||
        ""
      ).toString().trim();

      let fName = (
        activeSlip.holderData?.firstName ||
        verificationResult?.data?.firstName ||
        (verificationResult?.data as any)?.first_name ||
        (verificationResult?.data as any)?.firstname ||
        ""
      ).trim();

      let lName = (
        activeSlip.holderData?.surname ||
        (activeSlip.holderData as any)?.lastName ||
        verificationResult?.data?.lastName ||
        (verificationResult?.data as any)?.surname ||
        (verificationResult?.data as any)?.last_name ||
        ""
      ).trim();

      const fFullName = (
        activeSlip.holderData?.fullName ||
        verificationResult?.data?.fullName ||
        (verificationResult?.data as any)?.name ||
        ""
      ).trim();

      // Disambiguate if surname is missing or identical to first name
      if ((!lName || (fName && lName.toLowerCase() === fName.toLowerCase())) && fFullName) {
        const parts = fFullName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          const others = parts.filter((p) => !fName || p.toLowerCase() !== fName.toLowerCase());
          if (others.length > 0) {
            lName = others.join(" ");
          } else {
            lName = parts[1] || parts[0];
          }
        }
      }

      if (!fName && fFullName) {
        const parts = fFullName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          if (lName) {
            const others = parts.filter((p) => p.toLowerCase() !== lName.toLowerCase());
            fName = others[0] || parts[1];
          } else {
            lName = parts[0];
            fName = parts[1];
          }
        } else {
          fName = parts[0] || "";
        }
      }

      const slipData: IdentitySlipData = {
        firstName: fName,
        lastName: lName,
        surname: lName,
        middleName: activeSlip.holderData?.middleName || verificationResult?.data?.middleName,
        fullName: fFullName || [lName, fName].filter(Boolean).join(" "),
        gender: activeSlip.holderData?.gender || verificationResult?.data?.gender,
        dateOfBirth:
          activeSlip.holderData?.dateOfBirth ||
          (activeSlip.holderData as any)?.dob ||
          (activeSlip.holderData as any)?.birthdate ||
          (activeSlip.holderData as any)?.birthDate ||
          (activeSlip.holderData as any)?.date_of_birth ||
          (activeSlip.holderData as any)?.birth_date ||
          verificationResult?.data?.dateOfBirth ||
          (verificationResult?.data as any)?.dob ||
          (verificationResult?.data as any)?.birthdate ||
          (verificationResult?.data as any)?.birthDate ||
          (verificationResult?.data as any)?.date_of_birth ||
          (verificationResult?.data as any)?.birth_date ||
          verificationResult?.data?.rawFields?.dateOfBirth ||
          verificationResult?.data?.rawFields?.dob ||
          verificationResult?.data?.rawFields?.birthdate ||
          verificationResult?.data?.rawFields?.birthDate ||
          verificationResult?.data?.rawFields?.date_of_birth ||
          (verificationResult as any)?.dateOfBirth ||
          (verificationResult as any)?.dob ||
          (verificationResult as any)?.birthdate ||
          "",
        dob:
          activeSlip.holderData?.dateOfBirth ||
          (activeSlip.holderData as any)?.dob ||
          (activeSlip.holderData as any)?.birthdate ||
          verificationResult?.data?.dateOfBirth ||
          (verificationResult?.data as any)?.birthdate ||
          "",
        birthdate:
          activeSlip.holderData?.dateOfBirth ||
          (activeSlip.holderData as any)?.birthdate ||
          verificationResult?.data?.dateOfBirth ||
          (verificationResult?.data as any)?.birthdate ||
          "",
        photoUrl: candidatePhoto,
        photo: candidatePhoto,
        rawPhoto: candidatePhoto,
        nin: activeSlip.identificationNumber || activeSlip.holderData?.nin || verificationResult?.verifiedId,
        bvn:
          (activeSlip.holderData as any)?.bvn ||
          verificationResult?.data?.bvn ||
          (isBvn ? activeSlip.identificationNumber || verificationResult?.verifiedId : undefined),
        idNumber: activeSlip.identificationNumber || verificationResult?.verifiedId,
        trackingId:
          (activeSlip.holderData as any)?.trackingId ||
          (activeSlip.holderData as any)?.tracking_id ||
          (activeSlip.holderData as any)?.trackingID ||
          (activeSlip.holderData as any)?.rawFields?.trackingId ||
          (activeSlip.holderData as any)?.rawFields?.tracking_id ||
          (activeSlip.holderData as any)?.rawFields?.trackingID ||
          verificationResult?.data?.trackingId ||
          (verificationResult?.data as any)?.tracking_id ||
          (verificationResult?.data as any)?.trackingID ||
          verificationResult?.data?.rawFields?.trackingId ||
          verificationResult?.data?.rawFields?.tracking_id ||
          undefined,
        phoneNumber:
          activeSlip.holderData?.phoneNumber ||
          activeSlip.holderData?.phone ||
          (activeSlip.holderData as any)?.phone_number ||
          (activeSlip.holderData as any)?.mobile ||
          (activeSlip.holderData as any)?.phoneNo ||
          verificationResult?.data?.phoneNumber ||
          verificationResult?.data?.phone ||
          (verificationResult?.data as any)?.phone_number ||
          (verificationResult?.data as any)?.mobile,
        phone:
          activeSlip.holderData?.phone ||
          activeSlip.holderData?.phoneNumber ||
          verificationResult?.data?.phone ||
          verificationResult?.data?.phoneNumber,
        maritalStatus:
          (activeSlip.holderData as any)?.maritalStatus ||
          (activeSlip.holderData as any)?.marital_status ||
          (verificationResult?.data as any)?.maritalStatus ||
          (verificationResult?.data as any)?.marital_status,
        enrolmentInstitution:
          (activeSlip.holderData as any)?.enrolmentInstitution ||
          (activeSlip.holderData as any)?.institution ||
          (activeSlip.holderData as any)?.bank ||
          (verificationResult?.data as any)?.enrolmentInstitution ||
          (verificationResult?.data as any)?.institution ||
          (verificationResult?.data as any)?.bank,
        enrolmentBranch:
          (activeSlip.holderData as any)?.enrolmentBranch ||
          (activeSlip.holderData as any)?.branch ||
          (verificationResult?.data as any)?.enrolmentBranch ||
          (verificationResult?.data as any)?.branch,
        originState:
          (activeSlip.holderData as any)?.originState ||
          (activeSlip.holderData as any)?.stateOfOrigin ||
          (activeSlip.holderData as any)?.state_of_origin ||
          (verificationResult?.data as any)?.originState ||
          (verificationResult?.data as any)?.stateOfOrigin,
        originLga:
          (activeSlip.holderData as any)?.originLga ||
          (activeSlip.holderData as any)?.lgaOfOrigin ||
          (activeSlip.holderData as any)?.lga_of_origin ||
          (verificationResult?.data as any)?.originLga ||
          (verificationResult?.data as any)?.lgaOfOrigin,
        residenceState:
          (activeSlip.holderData as any)?.residenceState ||
          (activeSlip.holderData as any)?.stateOfResidence ||
          (activeSlip.holderData as any)?.residence_state ||
          (verificationResult?.data as any)?.residenceState ||
          (verificationResult?.data as any)?.stateOfResidence,
        residenceLga:
          (activeSlip.holderData as any)?.residenceLga ||
          (activeSlip.holderData as any)?.lgaOfResidence ||
          (activeSlip.holderData as any)?.residence_lga ||
          (verificationResult?.data as any)?.residenceLga ||
          (verificationResult?.data as any)?.lgaOfResidence,
        address:
          activeSlip.holderData?.address ||
          (activeSlip.holderData as any)?.residence_address ||
          verificationResult?.data?.address ||
          (verificationResult?.data as any)?.residence_address,
        addressLine1:
          (activeSlip.holderData as any)?.addressLine1 ||
          (activeSlip.holderData as any)?.street ||
          verificationResult?.data?.addressLine1 ||
          (verificationResult?.data as any)?.street,
        addressLine2:
          (activeSlip.holderData as any)?.addressLine2 ||
          (activeSlip.holderData as any)?.lga ||
          verificationResult?.data?.addressLine2 ||
          (verificationResult?.data as any)?.lga,
        lga:
          (activeSlip.holderData as any)?.lga ||
          (activeSlip.holderData as any)?.residence_lga ||
          verificationResult?.data?.lga ||
          (verificationResult?.data as any)?.residence_lga,
        state:
          (activeSlip.holderData as any)?.state ||
          (activeSlip.holderData as any)?.residence_state ||
          verificationResult?.data?.state ||
          (verificationResult?.data as any)?.residence_state,
        slipType: isBvnSlipSelected ? "BVN_SLIP" : isBvnCardSelected ? "BVN_CARD" : (isRegularSelected ? "REGULAR" : "PREMIUM"),
        providerReference: activeSlip.reference || verificationResult?.reference,
        engineTransactionId: activeSlip.slipId || activeSlip.id || verificationResult?.receiptNumber,
        verificationDate: activeSlip.createdAt ? new Date(activeSlip.createdAt) : new Date(),
      };

      const success = isBvnSlipSelected
        ? await SlipPrintEngine.exportBvnSlipPdf(slipData, filename)
        : isBvnCardSelected
        ? await SlipPrintEngine.exportBvnCardPdf(slipData, filename)
        : isRegularSelected
        ? await SlipPrintEngine.exportRegularNinPdf(slipData, filename)
        : await SlipPrintEngine.exportPremiumNinPdf(slipData, filename);

      if (success) {
        setIsExporting(false);
        return;
      }
    }

    const elementId = "active-printable-slip";
    const isCard = selectedFormat === "NIN_PREMIUM_GREEN" || selectedFormat === "NIN_PREMIUM_WHITE";

    await SlipPrintEngine.exportToPdf({
      elementId,
      filename,
      format: isCard ? "card" : "a4",
      orientation: "portrait",
    });

    setIsExporting(false);
  };

  const handleDownloadPNG = async () => {
    if (!activeSlip) return;
    setIsExporting(true);

    const elementId = "active-printable-slip";
    const isNin = activeSlip.serviceType?.toUpperCase().includes("NIN") || Boolean(activeSlip.holderData?.nin);
    const rawNin = (activeSlip.identificationNumber || activeSlip.holderData?.nin || "").toString().trim();
    const safeNin = rawNin ? rawNin.replace(/[^a-zA-Z0-9_-]/g, "") : "";
    const filename = isNin
      ? (safeNin ? `NIN Premium card ${safeNin}` : `NIN Premium card`)
      : `SmartLink_${activeSlip.serviceType}_Slip_${activeSlip.identificationNumber}`;

    await SlipPrintEngine.exportToPng(elementId, filename);
    setIsExporting(false);
  };

  const handleDirectPrint = () => {
    SlipPrintEngine.triggerPrint();
  };

  const handleCopyValidationLink = () => {
    if (!activeSlip) return;
    navigator.clipboard.writeText(activeSlip.qrVerificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Instant Email Dispatch Action (To Registered Email or Custom Recipient)
  const handleSendEmailDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSlip) return;

    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: "" });

    try {
      const res = await EmailSlipService.sendSlipToEmail({
        userId,
        recipientEmail: effectiveRegisteredEmail,
        sendToRegistered,
        customRecipientEmail: customEmail.trim() || undefined,
        verificationResult,
        slipData: activeSlip,
        formatType: selectedFormat,
        customNote: customNote.trim() || undefined,
      });

      if (res.success) {
        setEmailStatus({
          type: "success",
          message: res.message || `Official verification certificate successfully dispatched to ${res.recipientEmails?.join(", ") || effectiveRegisteredEmail}.`,
        });
      } else {
        setEmailStatus({
          type: "error",
          message: res.error || "Failed to dispatch email certificate.",
        });
      }
    } catch (err: any) {
      setEmailStatus({
        type: "error",
        message: err.message || "Network error during email dispatch.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp Instant Share
  const handleWhatsAppShare = () => {
    if (!activeSlip) return;
    const holderName = verificationResult.data?.fullName || activeSlip.holderData?.fullName || "RECORD CONFIRMED";
    const maskedId = verificationResult.maskedId || activeSlip.maskedId;
    const reference = verificationResult.reference || activeSlip.reference;

    const url = EmailSlipService.generateWhatsAppShareUrl({
      serviceType: activeSlip.serviceType,
      holderName,
      maskedId,
      reference,
      qrVerificationUrl: activeSlip.qrVerificationUrl,
      customNote: customNote || undefined,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Copy SMS Formatted Text
  const handleCopySmsText = () => {
    if (!activeSlip) return;
    const holderName = verificationResult.data?.fullName || activeSlip.holderData?.fullName || "RECORD CONFIRMED";
    const maskedId = verificationResult.maskedId || activeSlip.maskedId;
    const reference = verificationResult.reference || activeSlip.reference;

    const smsText = EmailSlipService.generateSmsText({
      serviceType: activeSlip.serviceType,
      holderName,
      maskedId,
      reference,
      qrVerificationUrl: activeSlip.qrVerificationUrl,
    });

    navigator.clipboard.writeText(smsText);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-8 pb-12 bg-[#111827]/80 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] mb-8 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Header Controls (Hidden during direct print) */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#111827] flex flex-wrap items-center justify-between gap-3 bg-[#F5F7FA]/80 dark:bg-[#111827]/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                  Official Identity Slip Generator & Print Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0F2D5C] dark:bg-blue-950/50 dark:text-blue-300 border border-slate-200 dark:border-slate-700">
                  REAL VERIFIED
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Government-compliant printable slips with scannable 2D QR authentication &amp; instant email dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmailPanel(!showEmailPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showEmailPanel
                  ? "bg-[#0F2D5C] text-white shadow-md shadow-purple-600/20"
                  : "bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 border border-slate-200 dark:border-slate-700 hover:bg-[#E5E7EB] dark:hover:bg-[#0F2D5C]/40"
              }`}
              title="Email official verification slip"
            >
              <Mail className="h-4 w-4" />
              <span>Email Slip</span>
              {showEmailPanel ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] hover:bg-[#E5E7EB]/50 dark:hover:bg-[#4B5563]/50 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Email & Multi-Channel Dispatch Drawer (Collapsible) */}
        {showEmailPanel && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#0F2D5C]/10 border-b border-[#E5E7EB] dark:border-[#0F2D5C]/50 space-y-4 print:hidden animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#0F2D5C]" />
                  <span>Send Official Certificate &amp; Verification Slip</span>
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Sends an official digital verification slip with PDF download links directly to your registered email or customer.
                </p>
              </div>

              {/* Instant Registered Email Dispatch Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEmailDispatch()}
                  disabled={isSendingEmail || !activeSlip}
                  className="px-4 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isSendingEmail ? "Dispatching..." : `Send to Registered Email (${effectiveRegisteredEmail})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Fields for Custom Recipient or Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#0F2D5C]/30">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Registered Account Email
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs font-mono font-semibold text-[#4B5563] dark:text-[#E5E7EB]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C] shrink-0" />
                  <span className="truncate">{effectiveRegisteredEmail}</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToRegistered}
                    onChange={(e) => setSendToRegistered(e.target.checked)}
                    className="rounded text-[#0F2D5C] focus:ring-[#0F2D5C] h-3.5 w-3.5"
                  />
                  <span>Always send copy to registered email</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Custom Recipient / Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs text-[#111827] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#E5E7EB]">
                  Additional Agent Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Validated for Account Opening"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] text-xs text-[#111827] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]"
                />
              </div>
            </div>

            {/* Multi-Channel Quick Actions: WhatsApp & SMS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={!activeSlip}
                  className="px-3 py-1.5 rounded-xl bg-[#0F2D5C]/15 hover:bg-[#0F2D5C]/25 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#0F2D5C]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySmsText}
                  disabled={!activeSlip}
                  className="px-3 py-1.5 rounded-xl bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSms ? <Check className="h-3.5 w-3.5 text-[#0F2D5C]" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  <span>{copiedSms ? "SMS Text Copied!" : "Copy SMS Format"}</span>
                </button>
              </div>

              {/* Status Message */}
              {emailStatus.message && (
                <div
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 ${
                    emailStatus.type === "success"
                      ? "bg-blue-50 text-[#0F2D5C] dark:bg-blue-950/50 dark:text-blue-300 border border-slate-200 dark:border-slate-700"
                      : "bg-blue-50 text-[#0F2D5C] dark:bg-blue-950/50 dark:text-blue-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {emailStatus.type === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#0F2D5C]" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-[#0F2D5C]" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Selector Bar (Hidden during print) */}
        <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#111827] bg-white dark:bg-[#111827] flex flex-wrap items-center justify-between gap-3 print:hidden">
          {/* Format Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {isBvn ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedFormat("BVN_CARD" as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFormat === ("BVN_CARD" as any) || selectedFormat === "BVN_STANDARD"
                      ? "bg-[#0F2D5C] text-white shadow-md shadow-blue-600/20"
                      : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>BVN Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat("BVN_SLIP_1" as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFormat === ("BVN_SLIP_1" as any)
                      ? "bg-[#0F2D5C] text-white shadow-md shadow-emerald-600/20"
                      : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>BVN Slip</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedFormat("NIN_REGULAR" as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFormat === ("NIN_REGULAR" as any)
                      ? "bg-[#0F2D5C] text-white shadow-md shadow-emerald-600/20"
                      : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Regular Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat("NIN_PREMIUM_WHITE")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFormat === "NIN_PREMIUM_WHITE" || selectedFormat === "NIN_PREMIUM_GREEN"
                      ? "bg-[#0F2D5C] text-white shadow-md shadow-blue-600/20"
                      : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Premium Card</span>
                </button>
              </>
            )}
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting || isSaving || !activeSlip}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? "Rendering PDF..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting || isSaving || !activeSlip}
              className="px-3 py-2 rounded-xl bg-[#E5E7EB] hover:bg-[#E5E7EB] dark:bg-[#111827] dark:hover:bg-[#4B5563] text-[#111827] dark:text-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileImage className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PNG Image</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={!activeSlip}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Preview Area */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-[#E5E7EB]/70 dark:bg-[#111827] flex flex-col items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          {activeSlip ? (
            <div className="w-full flex flex-col items-center justify-center">
              {/* Slip Card Render Container targeted by ID */}
              <div id="active-printable-slip" className="w-full max-w-xl flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {isBvn ? (
                  selectedFormat === "BVN_SLIP_1" || (selectedFormat as any) === "BVN_SLIP" ? (
                    <img src="/assets/BVN%20Slip%201.webp" alt="BVN Slip" loading="eager" referrerPolicy="no-referrer" className="w-full h-auto object-contain rounded-xl" />
                  ) : (
                    <img src="/assets/BVN%20Card.webp" alt="BVN Card" loading="eager" referrerPolicy="no-referrer" className="w-full h-auto object-contain rounded-xl" />
                  )
                ) : (
                  selectedFormat === "NIN_PREMIUM_WHITE" || selectedFormat === "NIN_PREMIUM_GREEN" ? (
                    <img
                      src="/assets/premium.webp"
                      alt="Premium Card"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes("Premium.webp")) target.src = "/assets/Premium.webp";
                      }}
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  ) : (
                    <img
                      src="/assets/Regular.webp"
                      alt="Regular Slip"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes("regular.webp")) target.src = "/assets/regular.webp";
                      }}
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <FaviconLoader size="md" label="Generating authentic slip from database records..." />
            </div>
          )}
        </div>

        {/* Footer Meta & Quick Copy Validation URL (Hidden in Print) */}
        {activeSlip && (
          <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#111827] bg-white dark:bg-[#111827] flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF] text-[11px]">Public QR Scan URL:</span>
              <span className="font-mono text-[#0F2D5C] dark:text-[#9CA3AF] font-bold text-[11px] truncate max-w-xs sm:max-w-md">
                {activeSlip.qrVerificationUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyValidationLink}
                className="p-1 rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#111827] text-[#6B7280] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                title="Copy validation link"
              >
                {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5 text-[#0F2D5C]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[#9CA3AF] text-[11px]">
              <span>Slip ID: <strong className="text-[#4B5563] dark:text-[#E5E7EB] font-mono">{activeSlip.slipId}</strong></span>
              <span>•</span>
              <span>Stored securely</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
