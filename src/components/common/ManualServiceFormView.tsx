/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  Paperclip,
  Check,
  X,
  Sparkles,
  Info,
  RefreshCw,
  Wallet,
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileCheck,
  ExternalLink,
  Copy
} from "lucide-react";
import { WhatsAppOfficialLogo } from "./ScreenshotServiceLogos";

import {
  ManualServiceConfig,
  ManualFieldDefinition,
  MANUAL_SERVICES_CATALOG,
  TAX_IDENTITY_SERVICES_LIST,
  CAC_SERVICES_LIST,
} from "../../data/manualServicesConfig";
import { UserProfile } from "../../types";

// Helper function to compress images before base64 encoding (prevents payload size limit issues)
async function compressImageFile(file: File): Promise<{ fileName: string; mimeType: string; base64: string; size: number }> {
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          base64: reader.result as string,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            fileName: file.name,
            mimeType: file.type,
            base64: e.target?.result as string,
            size: file.size,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
        const approxSize = Math.round(((compressedBase64.length - 23) * 3) / 4);

        resolve({
          fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          mimeType: "image/jpeg",
          base64: compressedBase64,
          size: approxSize,
        });
      };
      img.onerror = () => {
        resolve({
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64: e.target?.result as string,
          size: file.size,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

interface ManualServiceFormViewProps {
  serviceConfig: ManualServiceConfig;
  currentUser: UserProfile | null;
  onClose: () => void;
  onBalanceUpdate: () => void;
}

export function ManualServiceFormView({
  serviceConfig,
  currentUser,
  onClose,
  onBalanceUpdate,
}: ManualServiceFormViewProps) {
  const [activeServiceConfig, setActiveServiceConfig] = useState<ManualServiceConfig>(serviceConfig);

  useEffect(() => {
    setActiveServiceConfig(serviceConfig);
  }, [serviceConfig.id]);

  const storageDraftKey = `draft_manual_form_${activeServiceConfig.id}_${currentUser?.uid || "guest"}`;

  // Form input state
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  // File uploads state: stores metadata and base64 strings locally in state (never sent to Firebase)
  const [filesData, setFilesData] = useState<{
    [fieldName: string]: { fileName: string; mimeType: string; base64: string; size: number };
  }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successReference, setSuccessReference] = useState<string>("");
  const [copiedNumber, setCopiedNumber] = useState(false);

  const isNgo =
    activeServiceConfig.id === "cac_ngo" ||
    activeServiceConfig.name.toLowerCase().includes("ngo");

  const isTrustee =
    activeServiceConfig.id === "cac_incorporated_trustee" ||
    activeServiceConfig.id === "cac_ngo_trustee" ||
    activeServiceConfig.name.toLowerCase().includes("trustee");

  const isAnnualReturns =
    activeServiceConfig.id === "cac_annual_returns" ||
    activeServiceConfig.name.toLowerCase().includes("annual return");

  const isScuml =
    activeServiceConfig.id === "cac_scuml" ||
    activeServiceConfig.name.toLowerCase().includes("scuml");

  const isWhatsAppDesk = isNgo || isTrustee || isAnnualReturns || isScuml;

  const officerWhatsapp = "+234 904 773 8212";
  const officerWhatsappClean = "2349047738212";
  const officerAltWhatsapp = "+234 808 549 0982";
  const officerAltWhatsappClean = "2348085490982";

  let inquiryText = "";
  if (isNgo) {
    inquiryText = "Hello SmartLink CAC Registration Officer, I would like to discuss the requirements, registration fee, and procedure for registering an NGO (Non-Governmental Organization) with CAC.";
  } else if (isTrustee) {
    inquiryText = "Hello SmartLink CAC Registration Officer, I would like to discuss the requirements, registration fee, and procedure for registering an Incorporated Trustees (Foundation, Religious Body, or Association) with CAC.";
  } else if (isAnnualReturns) {
    inquiryText = "Hello SmartLink CAC Compliance Officer, I would like to check my CAC corporate status, calculate annual return filing fees and default penalties (if any), and discuss the procedure for filing Annual Returns.";
  } else if (isScuml) {
    inquiryText = "Hello SmartLink Compliance Officer, I would like to discuss the requirements, registration fee, and procedure for obtaining a SCUML Certificate for my registered entity.";
  } else {
    inquiryText = `Hello SmartLink Officer, I would like to make an inquiry regarding ${activeServiceConfig.name}.`;
  }

  const whatsappChatUrl = `https://wa.me/${officerWhatsappClean}?text=${encodeURIComponent(inquiryText)}`;

  const deskInfo = useMemo(() => {
    if (isNgo) {
      return {
        badge: "CAC Accreditation Desk • Part F",
        title: "NGO Registration WhatsApp Desk",
        officerLabel: "Registration Officer WhatsApp:",
        callLabel: "Call Officer",
        description:
          "Due to statutory CAMA 2020 Part F requirements — including national newspaper gazetting in two dailies, constitution drafting, and formal trustees vetting — all NGO registrations are coordinated directly with our certified CAC Registration Officer.",
        requirements: [
          { title: "Two Proposed Names", desc: "Option 1 and Option 2 for official CAC name availability search and reservation." },
          { title: "Trustees Biodata (Minimum 2)", desc: "Full legal names, NIN, passport photos (white background), valid government ID, and phone numbers." },
          { title: "Aims & Objectives", desc: "Statement of charitable, humanitarian, educational, religious, or community aims." },
          { title: "Inaugural Meeting Minutes", desc: "Minutes appointing trustees and adopting the constitution (drafting guidance provided)." },
          { title: "Statutory Publication", desc: "28-day public notice in two (2) National Daily Newspapers." }
        ],
        procedure: [
          { title: "Name Availability & Reservation", desc: "Name search and approval on the official CAC portal (24-48 hours)." },
          { title: "Constitution & Rules Drafting", desc: "Preparing formal constitution, rules, and trustees qualification affidavits." },
          { title: "National Dailies Publication", desc: "Statutory publication in 2 national newspapers with mandatory 28-day notice period." },
          { title: "CAC Headquarters Vetting", desc: "Formal application, sworn declarations, and final review by CAC Part F legal division." },
          { title: "Certificate Issuance", desc: "Official CAC Certificate of Incorporation & Status Report." }
        ],
        tariffNotice:
          "Government statutory filing tariffs and newspaper advert costs vary based on current publication rates and entity category. No fees are deducted from your SmartLink wallet at this stage. Click on the WhatsApp icon above to discuss the current fee schedule, fast-track timeline, and procedure directly with the officer."
      };
    }
    if (isTrustee) {
      return {
        badge: "CAC Accreditation Desk • Part F",
        title: "Incorporated Trustees WhatsApp Desk",
        officerLabel: "Registration Officer WhatsApp:",
        callLabel: "Call Officer",
        description:
          "Incorporation of Foundations, Charities, Churches, Mosques, Clubs, and Community Associations under CAMA Part F requires specialized constitution drafting, trustees affidavits, and statutory national gazetting coordinated by our certified CAC Registration Officer.",
        requirements: [
          { title: "Two Proposed Names", desc: "Approved reservation choices for Foundation, Association, or Religious Body." },
          { title: "Trustees Information (Minimum 2 or 3)", desc: "Full legal names, NIN, valid government ID, passport photographs, and residential address." },
          { title: "Constitution & Objectives", desc: "Clear draft of rules, governing body structure, and community/charitable aims." },
          { title: "Meeting Minutes & Sworn Affidavits", desc: "Formal minutes electing trustees, adoption of constitution, and oath of trusteeship." },
          { title: "National Newspaper Notice", desc: "Mandatory publication in two (2) National Daily Newspapers with 28-day objection window." }
        ],
        procedure: [
          { title: "Name Search & Reservation", desc: "Official reservation approval on the CAC portal (24-48 hours)." },
          { title: "Drafting Constitution & Affidavits", desc: "Legal preparation of constitution and sworn trustees affidavits." },
          { title: "National Dailies Publication", desc: "28-Day statutory notices in two major Nigerian daily newspapers." },
          { title: "Statutory Filing & CAC Vetting", desc: "Document submission and vetting by CAC Part F headquarters legal division." },
          { title: "Certificate Issuance", desc: "Official CAC Certificate of Incorporation & Status Report." }
        ],
        tariffNotice:
          "Government statutory filing tariffs and newspaper advert costs vary based on current publication rates and entity category. No fees are deducted from your SmartLink wallet at this stage. Click on the WhatsApp icon above to discuss the current fee schedule, fast-track timeline, and procedure directly with the officer."
      };
    }
    if (isAnnualReturns) {
      return {
        badge: "CAC Corporate Compliance • Annual Returns",
        title: "CAC Annual Returns WhatsApp Desk",
        officerLabel: "CAC Compliance Officer WhatsApp:",
        callLabel: "Call Compliance Desk",
        description:
          "Filing Annual Returns is legally mandatory under CAMA to maintain 'ACTIVE' status on the CAC Portal. Inactive status leads to severe default penalties, deregistration notices, and corporate bank account restrictions. Connect directly with our compliance officer for an immediate registry audit and expedited filing.",
        requirements: [
          { title: "Registered Entity Details", desc: "Registered Business Name, Company Name (LTD), or Incorporated Trustees/NGO name." },
          { title: "CAC Registration Number", desc: "RC Number or BN Number / copy of CAC Certificate or Status Report." },
          { title: "Outstanding Filing Years", desc: "List of unpaid filing years requiring regularisation (e.g., 2021 to 2025)." },
          { title: "Financial / Turnover Overview", desc: "Approximate annual turnover and operational summary for the years to file." },
          { title: "Current Directors / Trustees", desc: "Names and contact information of current directors, proprietors, or trustees." }
        ],
        procedure: [
          { title: "CAC Registry Status Audit", desc: "Instant query on the CAC portal to verify entity profile and identify default years." },
          { title: "Penalty Assessment & Quotation", desc: "Accurate calculation of CAC statutory filing fees and applicable late penalties." },
          { title: "Prescribed Returns Documentation", desc: "Drafting and compiling prescribed CAC Annual Return forms and balance sheets." },
          { title: "Direct Electronic Submission", desc: "Official e-filing into the Corporate Affairs Commission database." },
          { title: "Acknowledgment & Status Reactivation", desc: "Official CAC Annual Return Acknowledgment Letter and reactivation of 'ACTIVE' status." }
        ],
        tariffNotice:
          "CAC statutory filing tariffs and late penalty fees depend on your entity structure (Business Name vs. LTD vs. Incorporated Trustees) and the total number of defaulted years. No fee is deducted from your SmartLink wallet. Chat with the officer on WhatsApp for an immediate audit and clear quotation."
      };
    }
    if (isScuml) {
      return {
        badge: "SCUML Compliance Desk • AML/CFT",
        title: "SCUML Registration WhatsApp Desk",
        officerLabel: "SCUML Compliance Officer WhatsApp:",
        callLabel: "Call Compliance Desk",
        description:
          "Under the Money Laundering (Prevention and Prohibition) Act 2022, Designated Non-Financial Businesses & Professions (DNFBPs) and NGOs are legally required to obtain a SCUML Certificate before opening or operating corporate bank accounts. Our compliance team coordinates end-to-end processing.",
        requirements: [
          { title: "CAC Incorporation Documents", desc: "Certificate of Incorporation and CAC Status Report (or Form CAC 1.1 / BN 01)." },
          { title: "Tax Identification Number (TIN)", desc: "Official JTB / FIRS Tax ID Certificate or Tax Clearance Certificate." },
          { title: "Valid Director / Proprietor ID", desc: "NIN Slip / Card, International Passport, or Voter's Card of directors." },
          { title: "Business Office Address Proof", desc: "Physical office address and recent utility bill (PHCN/Water) or tenancy agreement." },
          { title: "Corporate Account Details", desc: "Existing corporate account details or bank introduction letter for new accounts." }
        ],
        procedure: [
          { title: "Entity Eligibility Assessment", desc: "Classifying your business under the Designated Non-Financial Businesses & Professions (DNFBPs) framework." },
          { title: "AML/CFT Document Digitization", desc: "Compiling and verifying required CAC, TIN, and anti-money laundering compliance declarations." },
          { title: "SCUML Portal Lodgment", desc: "Creating and submitting the application profile on the official SCUML regulatory portal." },
          { title: "Compliance Vetting", desc: "Tracking internal security vetting, desk queries, and compliance clearances." },
          { title: "SCUML Certificate Delivery", desc: "Issuance of official digital SCUML registration certificate ready for banks." }
        ],
        tariffNotice:
          "Professional facilitation covers document review, regulatory anti-money laundering attestation, application lodgment, and tracking until your certificate is issued. No wallet deductions apply. Chat on WhatsApp with the compliance officer to review the tariff and initiate filing."
      };
    }
    return {
      badge: "WhatsApp Desk",
      title: `${activeServiceConfig.name} WhatsApp Desk`,
      officerLabel: "Officer WhatsApp:",
      callLabel: "Call Officer",
      description: activeServiceConfig.description,
      requirements: [],
      procedure: [],
      tariffNotice: "Discuss requirements, tariffs, and procedure directly on WhatsApp."
    };
  }, [isNgo, isTrustee, isAnnualReturns, isScuml, activeServiceConfig]);

  const isTaxIdentityGroup =
    activeServiceConfig.id.startsWith("tax_id_") ||
    activeServiceConfig.id === "id_tax_id_search" ||
    activeServiceConfig.id === "tax_identity" ||
    activeServiceConfig.id === "id_tin_registration" ||
    serviceConfig.id.startsWith("tax_id_") ||
    serviceConfig.id === "id_tax_id_search" ||
    serviceConfig.id === "tax_identity";

  const isCacGroup =
    activeServiceConfig.id.startsWith("cac_") ||
    activeServiceConfig.id === "id_cac_registration" ||
    serviceConfig.id.startsWith("cac_") ||
    serviceConfig.id === "id_cac_registration";

  const isTaxOrCac = isTaxIdentityGroup || isCacGroup;

  const handleSwitchSubService = (targetId: string) => {
    const targetConfig = MANUAL_SERVICES_CATALOG.find((s) => s.id === targetId);
    if (!targetConfig) return;

    // 1. Save current form draft before switching
    try {
      localStorage.setItem(storageDraftKey, JSON.stringify(formData));
    } catch (e) {}

    // 2. Switch active service config
    setActiveServiceConfig(targetConfig);
    setError(null);
    setIsSuccess(false);

    // 3. For CAC and Tax Identity, completely remove auto-fill; start with clean empty form
    const isTargetTaxOrCac =
      targetConfig.id.startsWith("tax_id_") ||
      targetConfig.id.startsWith("cac_") ||
      targetConfig.id === "id_tax_id_search" ||
      targetConfig.id === "id_cac_registration" ||
      targetConfig.id === "tax_identity";

    if (isTargetTaxOrCac) {
      setFormData({});
      setFilesData({});
      return;
    }

    // 4. Restore draft for other standard manual services if present
    try {
      const saved = localStorage.getItem(`draft_manual_form_${targetConfig.id}_${currentUser?.uid || "guest"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData(parsed);
        }
      } else {
        const initial: { [key: string]: any } = {};
        if (currentUser) {
          const userFullName = currentUser.fullName || "";
          const userPhone = currentUser.phoneNumber || "";
          targetConfig.fields.forEach((f) => {
            if (f.name.toLowerCase().includes("email") && currentUser.email) {
              initial[f.name] = currentUser.email;
            }
            if ((f.name.toLowerCase().includes("name") || f.name.toLowerCase().includes("proprietor")) && userFullName) {
              initial[f.name] = userFullName;
            }
            if (f.name.toLowerCase().includes("phone") && userPhone) {
              initial[f.name] = userPhone;
            }
          });
          setFormData(initial);
        } else {
          setFormData({});
        }
      }
    } catch (e) {
      setFormData({});
    }

    setFilesData({});
  };

  // Restore draft on mount so that if submission failed or page was refreshed, no data is lost
  useEffect(() => {
    // For CAC and Tax Identity, DO NOT auto-fill anything. Keep the fields completely blank so only the label guides the user.
    if (isTaxOrCac) {
      setFormData({});
      return;
    }

    try {
      const saved = localStorage.getItem(storageDraftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData(parsed);
        }
      } else {
        // Pre-fill user profile fields if available (for non-CAC and non-Tax services)
        const initial: { [key: string]: any } = {};
        if (currentUser) {
          const userFullName = currentUser.fullName || "";
          const userPhone = currentUser.phoneNumber || "";
          activeServiceConfig.fields.forEach((f) => {
            if (f.name.toLowerCase().includes("email") && currentUser.email) {
              initial[f.name] = currentUser.email;
            }
            if ((f.name.toLowerCase().includes("name") || f.name.toLowerCase().includes("proprietor")) && userFullName) {
              initial[f.name] = userFullName;
            }
            if (f.name.toLowerCase().includes("phone") && userPhone) {
              initial[f.name] = userPhone;
            }
          });
          setFormData(initial);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
  }, [activeServiceConfig.id, currentUser?.uid, isTaxOrCac]);

  // Save changes to localStorage draft in real-time (no data loss)
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [fieldName]: value };
      try {
        localStorage.setItem(storageDraftKey, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    if (error) setError(null);
  };

  // Handle file uploads (converts file to compressed base64 for direct attachment in email & local disk storage)
  const handleFileChange = async (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB max per single file
    if (file.size > 15 * 1024 * 1024) {
      setError(`File "${file.name}" is too large. Maximum allowed size is 15MB.`);
      return;
    }

    try {
      const processed = await compressImageFile(file);
      setFilesData((prev) => ({
        ...prev,
        [fieldName]: processed,
      }));
      if (error) setError(null);
    } catch (readErr: any) {
      setError(readErr.message || `Failed to process file ${file.name}. Please try again.`);
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    setFilesData((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("Please sign in to your SmartLink account to submit this service filing.");
      return;
    }

    // Validate required fields
    for (const field of activeServiceConfig.fields) {
      if (field.required) {
        if (field.type === "file") {
          if (!filesData[field.name]) {
            setError(`Please upload the required file: ${field.label}`);
            return;
          }
        } else {
          const val = formData[field.name];
          if (val === undefined || val === null || String(val).trim() === "") {
            setError(`Please complete the required field: ${field.label}`);
            return;
          }
        }
      }
    }

    // Wallet balance verification
    if (activeServiceConfig.price > 0 && currentUser.walletBalance < activeServiceConfig.price) {
      setError(
        `Insufficient wallet balance. Total fee is ₦${activeServiceConfig.price.toLocaleString()}, but your balance is ₦${currentUser.walletBalance.toLocaleString()}. Please fund your wallet first.`
      );
      return;
    }

    setLoading(true);

    try {
      let idToken: string | null = null;
      try {
        const stored = localStorage.getItem("smart_link_user");
        if (stored) {
          const u = JSON.parse(stored);
          idToken = u.uid || u.id;
        }
      } catch (tokenErr) {}

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const res = await fetch("/api/manual-services/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: currentUser.uid,
          serviceId: activeServiceConfig.id,
          serviceName: activeServiceConfig.name,
          fee: activeServiceConfig.price,
          formData,
          filesData, // Sent directly to backend mailer and local storage, NOT to Firebase
        }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        if (res.status === 413 || responseText.toLowerCase().includes("too large")) {
          throw new Error("The uploaded files are too large. Please upload smaller photos or documents.");
        }
        throw new Error(
          res.status === 404
            ? "Submission endpoint is temporarily unavailable. Please try again in a few moments."
            : `Server response (${res.status}): Please review your submission and try again.`
        );
      }

      if (!res.ok || !data.success) {
        // Keep formData completely intact in state so user doesn't lose a single character!
        throw new Error(data.error || "Submission could not be completed. Please review your details and try again.");
      }

      // Success: Clear saved draft
      try {
        localStorage.removeItem(storageDraftKey);
      } catch (err) {}

      setSuccessReference(data.reference || "SML-MANUAL-" + Date.now());
      setIsSuccess(true);
      onBalanceUpdate();
    } catch (err: any) {
      // Keep everything in state, show precise error message
      setError(err.message || "An error occurred while transmitting your submission. Your entered information is preserved.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#374151] overflow-hidden max-w-3xl w-full mx-auto transition-all animate-fade-in text-[#111827] dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F2D5C] to-[#1E3A8A] text-white p-5 sm:p-6 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              {activeServiceConfig.category} Filing
            </span>
            <span className="flex items-center gap-1 text-[11px] text-blue-200">
              <Clock className="w-3.5 h-3.5" /> {activeServiceConfig.processingTime}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{activeServiceConfig.name}</h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">{activeServiceConfig.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sub-Service Selection for Tax Identity */}
      {isTaxIdentityGroup && (
        <div className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#374151] p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2D5C] dark:text-[#60A5FA] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Tax Identity Services
            </span>
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium hidden sm:inline">
              Select 1 of 4 official tax desks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {TAX_IDENTITY_SERVICES_LIST.map((srv) => {
              const isSelected = activeServiceConfig.id === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleSwitchSubService(srv.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/20 dark:ring-blue-500/40"
                      : "bg-white dark:bg-[#1F2937] text-[#111827] dark:text-white border-[#E5E7EB] dark:border-[#374151] hover:border-[#0F2D5C]/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isSelected
                          ? "bg-white text-[#0F2D5C]"
                          : "bg-[#F1F5F9] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]"
                      }`}
                    >
                      {srv.stepNum}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-50 dark:bg-blue-900/40 text-[#0F2D5C] dark:text-blue-300"
                      }`}
                    >
                      {srv.badge}
                    </span>
                  </div>
                  <span className="font-bold text-xs leading-snug mb-1">
                    {srv.title}
                  </span>
                  <span
                    className={`text-[10.5px] leading-tight line-clamp-2 ${
                      isSelected ? "text-blue-100" : "text-[#6B7280] dark:text-[#9CA3AF]"
                    }`}
                  >
                    {srv.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Service Selection for CAC */}
      {isCacGroup && (
        <div className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#374151] p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2D5C] dark:text-[#60A5FA] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              CAC Corporate Registration Categories
            </span>
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium hidden sm:inline">
              Choose entity type
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CAC_SERVICES_LIST.map((srv) => {
              const isSelected = activeServiceConfig.id === srv.id;
              const isWhatsAppDesk = srv.badge.includes("WhatsApp");
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleSwitchSubService(srv.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md ring-2 ring-[#0F2D5C]/20 dark:ring-blue-500/40"
                      : "bg-white dark:bg-[#1F2937] text-[#111827] dark:text-white border-[#E5E7EB] dark:border-[#374151] hover:border-[#0F2D5C]/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                        isSelected
                          ? "bg-white text-[#0F2D5C]"
                          : "bg-[#F1F5F9] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]"
                      }`}
                    >
                      {srv.stepNum}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                        isSelected
                          ? isWhatsAppDesk
                            ? "bg-[#25D366] text-white font-extrabold"
                            : "bg-white/20 text-white"
                          : isWhatsAppDesk
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-extrabold"
                          : "bg-blue-50 dark:bg-blue-900/40 text-[#0F2D5C] dark:text-blue-300"
                      }`}
                    >
                      {srv.badge}
                    </span>
                  </div>
                  <span className="font-bold text-[11px] leading-tight mb-0.5">
                    {srv.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Success State */}
      {isSuccess ? (
        <div className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-300 dark:border-emerald-700 animate-scale-in">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-[#111827] dark:text-white">Submitted Successfully</h3>
            <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] max-w-md mx-auto">
              Your application details and uploaded attachments have been securely dispatched for manual processing.
            </p>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#374151] rounded-xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Tracking Reference:</span>
              <span className="font-mono font-bold text-[#0F2D5C] dark:text-[#60A5FA]">{successReference}</span>
            </div>
            <div className="flex justify-between items-center text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Service:</span>
              <span className="font-semibold text-[#111827] dark:text-white">{activeServiceConfig.name}</span>
            </div>
            <div className="flex justify-between items-center text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Estimated Delivery:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeServiceConfig.processingTime}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#0F2D5C] hover:bg-[#1E3A8A] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      ) : isWhatsAppDesk ? (
        /* WhatsApp Officer Consultation Desk for NGO, Incorporated Trustees, Annual Returns, and SCUML */
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-[#111827] dark:text-white animate-fade-in">
          {/* Main WhatsApp Card */}
          <div className="bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46] text-white rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  {deskInfo.badge}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {deskInfo.title}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                  {deskInfo.description}
                </p>
              </div>

              <div className="shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center p-3 border border-white/20 shadow-inner">
                  <WhatsAppOfficialLogo className="w-full h-full fill-[#25D366]" />
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl font-black text-sm sm:text-base shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <WhatsAppOfficialLogo className="w-6 h-6 fill-white shrink-0" />
                <span>Chat on WhatsApp with {isAnnualReturns || isScuml ? "Compliance Officer" : "Registration Officer"}</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <a
                href={`tel:${officerWhatsappClean}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors border border-white/20"
              >
                <Phone className="w-4 h-4" />
                <span>{deskInfo.callLabel}</span>
              </a>
            </div>

            {/* WhatsApp Number Details & Copy */}
            <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-emerald-100 font-semibold">{deskInfo.officerLabel}</span>
                <span className="font-mono font-bold bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 text-white text-xs sm:text-sm">
                  {officerWhatsapp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(officerWhatsapp);
                    setCopiedNumber(true);
                    setTimeout(() => setCopiedNumber(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors cursor-pointer"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? "Copied!" : "Copy Number"}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-200">
                Alt Line: <span className="font-mono font-bold">{officerAltWhatsapp}</span>
              </div>
            </div>
          </div>

          {/* Requirements & Procedure Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requirements Box */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#374151] space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2D5C] dark:text-blue-400">
                <FileCheck className="w-4 h-4" />
                <span>Requirements to Prepare</span>
              </div>
              <ul className="space-y-2 text-xs text-[#4B5563] dark:text-[#D1D5DB] leading-relaxed">
                {deskInfo.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>{req.title}:</strong> {req.desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Procedure Box */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#374151] space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2D5C] dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span>Registration & Filing Procedure</span>
              </div>
              <ol className="space-y-2 text-xs text-[#4B5563] dark:text-[#D1D5DB] leading-relaxed">
                {deskInfo.procedure.map((proc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span><strong>{proc.title}:</strong> {proc.desc}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Registration Fee & Tariffs Notice */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Fees, Tariffs & Assessment</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {deskInfo.tariffNotice}
            </p>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#374151] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Certified CAC & Compliance Desk • WhatsApp Direct Consultation</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 border border-[#D1D5DB] dark:border-[#4B5563] hover:bg-gray-100 dark:hover:bg-gray-800 text-[#374151] dark:text-[#D1D5DB] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Desk
              </button>

              <a
                href={whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <WhatsAppOfficialLogo className="w-4 h-4 fill-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Form Fill Area */
        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Instructions box if any */}
          {activeServiceConfig.instructions && activeServiceConfig.instructions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-100 uppercase tracking-wider text-[11px]">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Filing Guidelines & Requirements
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11.5px] leading-relaxed">
                {activeServiceConfig.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing & Wallet Summary */}
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-[#111827] rounded-xl border border-[#E2E8F0] dark:border-[#374151]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#0F2D5C]/10 dark:bg-blue-900/30 text-[#0F2D5C] dark:text-blue-300">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase">Filing Fee</span>
                <p className="text-lg font-black text-[#0F2D5C] dark:text-[#60A5FA]">
                  {activeServiceConfig.price > 0 ? `₦${activeServiceConfig.price.toLocaleString()}` : "Free Application"}
                </p>
              </div>
            </div>

            {currentUser && (
              <div className="text-right">
                <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase">Your Wallet</span>
                <p className={`text-sm font-bold ${currentUser.walletBalance < activeServiceConfig.price ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  ₦{currentUser.walletBalance.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Submission Notice</p>
                <p>{error}</p>
                <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">
                  Your filled information is safely kept. Please make the required correction and click submit.
                </p>
              </div>
            </div>
          )}

          {/* Fields Mapping */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
              Required Information & Attachments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeServiceConfig.fields.map((field) => {
                const isFullWidth =
                  field.type === "textarea" ||
                  field.type === "file" ||
                  field.name.toLowerCase().includes("address") ||
                  field.name.toLowerCase().includes("objective") ||
                  field.name.toLowerCase().includes("nature") ||
                  field.name.toLowerCase().includes("aims");

                return (
                  <div key={field.name} className={`space-y-1.5 ${isFullWidth ? "sm:col-span-2" : ""}`}>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#D1D5DB] flex items-center justify-between">
                      <span>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </span>
                      {field.helpText && (
                        <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-normal">
                          {field.helpText}
                        </span>
                      )}
                    </label>

                    {/* SELECT FIELD */}
                    {field.type === "select" ? (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#4B5563] rounded-xl text-sm outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-blue-500/20 text-[#111827] dark:text-white"
                      >
                        <option value="">-- Choose Option --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      /* TEXTAREA FIELD */
                      <textarea
                        rows={3}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={isTaxOrCac ? undefined : field.placeholder}
                        autoComplete="off"
                        required={field.required}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#4B5563] rounded-xl text-sm outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-blue-500/20 text-[#111827] dark:text-white resize-y"
                      />
                    ) : field.type === "file" ? (
                      /* FILE UPLOAD FIELD */
                      <div className="border-2 border-dashed border-[#D1D5DB] dark:border-[#4B5563] rounded-xl p-3.5 bg-[#F9FAFB] dark:bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0F2D5C] dark:text-blue-300 shrink-0">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            {filesData[field.name] ? (
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                                  <Check className="w-3.5 h-3.5" /> {filesData[field.name].fileName}
                                </p>
                                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                                  {(filesData[field.name].size / 1024).toFixed(1)} KB • Ready for Dispatch
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-[#374151] dark:text-[#D1D5DB]">
                                  {field.label}
                                </p>
                                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                                  Images (JPG, PNG) or PDF documents (Max 12MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {filesData[field.name] ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.name)}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Remove
                            </button>
                          ) : (
                            <label className="cursor-pointer px-4 py-2 bg-[#0F2D5C] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                              <Paperclip className="w-3.5 h-3.5" /> Choose File
                              <input
                                type="file"
                                accept={field.accept || "image/*,application/pdf"}
                                onChange={(e) => handleFileChange(field.name, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* STANDARD TEXT / NUMBER / DATE / EMAIL / TEL INPUT */
                      <input
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={isTaxOrCac ? undefined : field.placeholder}
                        autoComplete="off"
                        required={field.required}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#4B5563] rounded-xl text-sm outline-none focus:border-[#0F2D5C] focus:ring-2 focus:ring-blue-500/20 text-[#111827] dark:text-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#374151] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & Confidential. Direct email delivery to authorized processing desk.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-initial px-5 py-2.5 border border-[#D1D5DB] dark:border-[#4B5563] hover:bg-gray-100 dark:hover:bg-gray-800 text-[#374151] dark:text-[#D1D5DB] rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#0F2D5C] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    {activeServiceConfig.actionLabel} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
