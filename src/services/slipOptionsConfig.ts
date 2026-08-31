/**
 * SmartLink Official Verification Slip Templates & Pricing Configuration
 * Defines available slip types, pricing, visual previews, dimensions, and features
 * matching leading Nigerian identity and verification agent platforms.
 */

import { SlipFormatType, VerificationType } from "../types/verification";

export interface SlipOptionConfig {
  id: SlipFormatType;
  name: string;
  badge: string;
  badgeColor: string;
  price: number;
  description: string;
  dimensions: string;
  recommendedFor: string;
  themeColor: string;
  bgGradient: string;
  features: string[];
  isPopular?: boolean;
  isOfficialDefault?: boolean;
  sampleLayout: "STANDARD_SLIP" | "PREMIUM_CARD" | "DIGITAL_GREEN" | "THERMAL_RECEIPT" | "TEXT_DATA";
}

export interface ServiceSlipManifest {
  service: VerificationType;
  title: string;
  gateway: string;
  searchMethods: {
    id: string;
    label: string;
    placeholder: string;
    helpText: string;
    maxLength?: number;
    inputType: "text" | "number" | "tel";
  }[];
  slipOptions: SlipOptionConfig[];
}

export const NIN_SLIP_OPTIONS: SlipOptionConfig[] = [
  {
    id: "NIN_PREMIUM_WHITE",
    name: "Premium Slip",
    badge: "Plastic White Card",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 250,
    description: "Dual-sided landscape wallet-sized white card format with high-resolution photograph, national seals, 2D barcode, and issue metadata.",
    dimensions: "CR80 (85.6mm x 53.98mm - Standard ID Card)",
    recommendedFor: "ID Card Printing, PVC Lamination, Wallets & Field Identification",
    themeColor: "#2563eb",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: [
      "Front & Back Dual-Sided Card Layout",
      "High-Resolution Biometric Photo",
      "Wallet Card Size (PVC Printable)",
      "Guilloche Security Watermark Pattern",
      "Security QR Authentication Seal",
    ],
    isPopular: true,
    sampleLayout: "PREMIUM_CARD",
  },
  {
    id: "NIN_STANDARD",
    name: "Standard Slip",
    badge: "Official Standard",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 200,
    description: "NIN Verification Slip with Tracking ID, 2D Barcode, scannable QR verification seal, and full demographic profile.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "Banks, Embassies, Passports, Government Agencies & Official KYC",
    themeColor: "#059669",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: [
      "Standard Verification Header",
      "Full Legal Demographics & Address",
      "2D Barcode & Scannable QR Code",
      "Standard Tracking Number",
      "Print-Ready High Resolution PDF",
    ],
    isOfficialDefault: true,
    sampleLayout: "STANDARD_SLIP",
  },
  {
    id: "NIN_REGULAR",
    name: "Regular Slip",
    badge: "Basic Slip",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 180,
    description: "Basic NIN Slip format with key demographic fields, barcode, and QR verification.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "General Identity Verification & Basic Enrolment Confirmation",
    themeColor: "#10b981",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: [
      "Demographic Profile & Address",
      "Barcode & Scannable QR Code",
      "Printable High-Resolution Layout",
    ],
    sampleLayout: "STANDARD_SLIP",
  },
];

export const BVN_SLIP_OPTIONS: SlipOptionConfig[] = [
  {
    id: "BVN_CARD" as any,
    name: "BVN Card",
    badge: "Plastic Card",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 250,
    description: "Dual-sided landscape wallet card format with customer photograph and verification seal.",
    dimensions: "CR80 (Standard ID Card)",
    recommendedFor: "Wallet Card Printing & Plastic Card Issuance",
    themeColor: "#4338ca",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: ["Front & Back Card", "Biometric Photo", "QR Code"],
    isPopular: true,
    sampleLayout: "PREMIUM_CARD",
  },
  {
    id: "BVN_SLIP_1" as any,
    name: "BVN Slip 1",
    badge: "Official Slip",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 200,
    description: "Official verification slip with banking demographics, photo, and seal.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "Banks & Official KYC",
    themeColor: "#1d4ed8",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: ["Standard Verification Seal", "Verified Photo & Phone", "QR Code"],
    isOfficialDefault: true,
    sampleLayout: "STANDARD_SLIP",
  },
  {
    id: "BVN_SLIP_2" as any,
    name: "BVN Slip 2",
    badge: "Basic Slip",
    badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
    price: 180,
    description: "Basic verification slip format.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "Basic Verification",
    themeColor: "#059669",
    bgGradient: "from-[#0F2D5C]/10 via-[#0F2D5C]/5 to-[#111827]/10",
    features: ["Basic Profile", "Verification Seal"],
    sampleLayout: "STANDARD_SLIP",
  },
];

export const SERVICE_MANIFESTS: Record<string, ServiceSlipManifest> = {
  NIN: {
    service: "NIN",
    title: "National Identification Number (NIN)",
    gateway: "NIN Validation Gateway",
    searchMethods: [
      {
        id: "BY_NIN",
        label: "Search by 11-Digit NIN",
        placeholder: "e.g. 12345678901",
        helpText: "Enter the 11 numeric digits printed on the NIN slip or National e-ID card.",
        maxLength: 11,
        inputType: "number",
      },
      {
        id: "BY_PHONE",
        label: "Search by Linked Phone Number",
        placeholder: "e.g. 08012345678",
        helpText: "Enter the registered phone number linked to the customer's NIN record.",
        maxLength: 11,
        inputType: "tel",
      },
      {
        id: "BY_TRACKING_ID",
        label: "Search by Tracking ID",
        placeholder: "e.g. TRACK-892182049",
        helpText: "Enter the alphanumeric tracking code issued upon biometric enrolment.",
        inputType: "text",
      },
      {
        id: "BY_VNIN",
        label: "Search by Virtual NIN (vNIN)",
        placeholder: "e.g. 1234567890123456",
        helpText: "Enter the 16-character Virtual NIN generated via the Mobile ID app.",
        maxLength: 16,
        inputType: "text",
      },
      {
        id: "BY_DEMOGRAPHICS",
        label: "Search by Demographics (Name, DOB & State)",
        placeholder: "First Name & Surname",
        helpText: "Match records using full legal name, date of birth, and state of origin.",
        inputType: "text",
      },
    ],
    slipOptions: NIN_SLIP_OPTIONS,
  },
  BVN: {
    service: "BVN",
    title: "Bank Verification Number (BVN)",
    gateway: "BVN Validation Gateway",
    searchMethods: [
      {
        id: "BY_BVN",
        label: "Search by 11-Digit BVN",
        placeholder: "e.g. 22233344455",
        helpText: "Enter the 11-digit Bank Verification Number issued by your bank.",
        maxLength: 11,
        inputType: "number",
      },
      {
        id: "BY_PHONE",
        label: "Search by Banking Phone Number",
        placeholder: "e.g. 08098765432",
        helpText: "Enter the phone number registered with the customer's bank account.",
        maxLength: 11,
        inputType: "tel",
      },
    ],
    slipOptions: BVN_SLIP_OPTIONS,
  },
};

export function getSlipOptionById(formatType: string): SlipOptionConfig {
  const all = [...NIN_SLIP_OPTIONS, ...BVN_SLIP_OPTIONS];
  const found = all.find((s) => s.id === formatType);
  return (
    found || {
      id: "NIN_STANDARD",
      name: "Standard Official Slip",
      badge: "Standard",
      badgeColor: "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]",
      price: 150,
      description: "Official identity verification slip with barcode & QR code.",
      dimensions: "A4 Portrait",
      recommendedFor: "Official KYC & Identification",
      themeColor: "#059669",
      bgGradient: "from-[#0F2D5C]/10 to-[#111827]/10",
      features: ["Official Seals", "QR Code Verification", "Demographic Details"],
      sampleLayout: "STANDARD_SLIP",
    }
  );
}

/**
 * Ensures photo URLs, raw Base64 strings, or data URIs render correctly
 * without broken image tags across all slip templates and UI cards.
 */
export function normalizePhotoUrl(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "none" ||
    trimmed === "false" ||
    trimmed === "{}" ||
    trimmed === "[]"
  ) {
    return "";
  }

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/api/storage/") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  const cleanBase64 = trimmed.replace(/\s+/g, "");
  if (cleanBase64.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("R0lGOD")) {
    return `data:image/gif;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("UklGR")) {
    return `data:image/webp;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith("PHN2Zy") || cleanBase64.startsWith("PD94bWw")) {
    return `data:image/svg+xml;base64,${cleanBase64}`;
  }

  if (cleanBase64.length > 30 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    return `data:image/jpeg;base64,${cleanBase64}`;
  }

  return trimmed;
}
