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
    id: "NIN_STANDARD",
    name: "Standard NIMC Slip (Regular)",
    badge: "Official Standard",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
    price: 150,
    description: "Official NIMC Enrolment & Verification Slip with Tracking ID, 2D Barcode, scannable QR verification seal, and full demographic profile.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "Banks, Embassies, Passports, Government Agencies & Official KYC",
    themeColor: "#059669",
    bgGradient: "from-emerald-900/10 via-emerald-500/5 to-slate-900/10",
    features: [
      "Official NIMC Coat of Arms Header",
      "Full Legal Demographics & Address",
      "2D Barcode & Scannable QR Code",
      "Official NIMC Tracking Number",
      "Print-Ready High Resolution PDF",
    ],
    isOfficialDefault: true,
    sampleLayout: "STANDARD_SLIP",
  },
  {
    id: "NIN_PREMIUM_WHITE",
    name: "Premium Plastic White Card (Dual-Sided)",
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
    price: 250,
    description: "Dual-sided landscape wallet-sized white card format with high-resolution photograph, national seals, 2D barcode, and issue metadata.",
    dimensions: "CR80 (85.6mm x 53.98mm - Standard ID Card)",
    recommendedFor: "ID Card Printing, PVC Lamination, Wallets & Field Identification",
    themeColor: "#2563eb",
    bgGradient: "from-blue-900/10 via-blue-500/5 to-slate-900/10",
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
    id: "NIN_PREMIUM_GREEN",
    name: "Digital Green e-ID Slip (Improved)",
    badge: "High Security",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
    price: 300,
    description: "High-security green holographic textured slip with Nigerian coat of arms, digital signature, NIN watermark background, and security stamp.",
    dimensions: "CR80 / A5 Landscape",
    recommendedFor: "Corporate Security, Telecoms, Financial Institutions & Law Enforcement",
    themeColor: "#15803d",
    bgGradient: "from-green-900/15 via-emerald-600/10 to-slate-900/10",
    features: [
      "Full Green Holographic Security Background",
      "Official Nigerian Federal Seal",
      "Biometric Photo & Digital Signature",
      "Encrypted QR Watermark Stamp",
      "NIMC Digital Gateway Verification Token",
    ],
    sampleLayout: "DIGITAL_GREEN",
  },
  {
    id: "NIN_THERMAL",
    name: "POS Thermal Mini Slip (58mm / 80mm)",
    badge: "Counter POS",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
    price: 100,
    description: "Compact monochrome thermal receipt format optimized for Bluetooth thermal printers, agent POS terminals, and rapid customer handoffs.",
    dimensions: "58mm or 80mm Continuous Roll",
    recommendedFor: "Agent POS Terminals, Retail Counters & Instant Verification Receipts",
    themeColor: "#d97706",
    bgGradient: "from-amber-900/10 via-amber-500/5 to-slate-900/10",
    features: [
      "58mm / 80mm Thermal Printer Optimized",
      "High-Contrast Monochrome Layout",
      "Scannable 2D QR Code",
      "Fast 1-Second Counter Printing",
    ],
    sampleLayout: "THERMAL_RECEIPT",
  },
  {
    id: "NIN_BASIC_LOOKUP",
    name: "Basic Data Lookup (No Slip / Text Only)",
    badge: "Lowest Cost",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    price: 70,
    description: "Instant data validation query returning full verified customer demographics (Name, DOB, Phone, Address, State) without printable slip generation.",
    dimensions: "Digital Text & JSON Output Only",
    recommendedFor: "Quick Customer Verification, Database Audits & Internal KYC Checks",
    themeColor: "#475569",
    bgGradient: "from-slate-800/10 via-slate-500/5 to-slate-900/10",
    features: [
      "Instant Demographic Record Validation",
      "Full Name, DOB, Gender, Phone & Address",
      "Official NIMC Database Confirmation",
      "Text / JSON KYC Result",
    ],
    sampleLayout: "TEXT_DATA",
  },
];

export const BVN_SLIP_OPTIONS: SlipOptionConfig[] = [
  {
    id: "BVN_STANDARD",
    name: "Official NIBSS BVN Slip",
    badge: "Standard Banking",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
    price: 150,
    description: "Official Bank Verification Number slip with verified banking demographics, photograph, registered phone, and NIBSS trust seal.",
    dimensions: "A4 / Letter (Portrait)",
    recommendedFor: "Banks, Microfinance, Loan Applications & Financial KYC",
    themeColor: "#1d4ed8",
    bgGradient: "from-blue-900/10 via-blue-500/5 to-slate-900/10",
    features: [
      "Official NIBSS Verification Seal",
      "Verified Banking Profile & Photo",
      "Registered Phone & Contact Address",
      "Scannable Verification QR Code",
    ],
    isOfficialDefault: true,
    sampleLayout: "STANDARD_SLIP",
  },
  {
    id: "BVN_PREMIUM_CARD",
    name: "Premium BVN Identity Card (Dual-Sided)",
    badge: "Card Format",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300",
    price: 250,
    description: "Dual-sided landscape wallet card format with customer photograph, bank verification seal, and security watermark.",
    dimensions: "CR80 (Standard ID Card)",
    recommendedFor: "Wallet Card Printing, Financial Agents & Plastic Card Issuance",
    themeColor: "#4338ca",
    bgGradient: "from-indigo-900/10 via-indigo-500/5 to-slate-900/10",
    features: [
      "Front & Back Dual-Sided Card",
      "Biometric Photograph & Details",
      "Security Guilloche Background",
      "Scannable QR Verification",
    ],
    isPopular: true,
    sampleLayout: "PREMIUM_CARD",
  },
  {
    id: "BVN_BASIC_LOOKUP",
    name: "Basic BVN Lookup (Text / KYC Only)",
    badge: "Text Only",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    price: 80,
    description: "Quick text lookup returning verified customer name, date of birth, phone, and banking account status.",
    dimensions: "Digital Text & JSON Output Only",
    recommendedFor: "Instant Account Verification & Credit Risk Checks",
    themeColor: "#475569",
    bgGradient: "from-slate-800/10 via-slate-500/5 to-slate-900/10",
    features: [
      "Instant Full Name & DOB Validation",
      "Registered Banking Phone Match",
      "NIBSS Database Confirmation",
    ],
    sampleLayout: "TEXT_DATA",
  },
];

export const SERVICE_MANIFESTS: Record<string, ServiceSlipManifest> = {
  NIN: {
    service: "NIN",
    title: "National Identification Number (NIN)",
    gateway: "NIMC Federal Identity Gateway",
    searchMethods: [
      {
        id: "BY_NIN",
        label: "Search by 11-Digit NIN",
        placeholder: "e.g. 12345678901",
        helpText: "Enter the 11 numeric digits printed on the NIMC slip or National e-ID card.",
        maxLength: 11,
        inputType: "number",
      },
      {
        id: "BY_PHONE",
        label: "Search by Linked Phone Number",
        placeholder: "e.g. 08012345678",
        helpText: "Enter the registered phone number linked to the customer's NIMC record.",
        maxLength: 11,
        inputType: "tel",
      },
      {
        id: "BY_TRACKING_ID",
        label: "Search by NIMC Tracking ID",
        placeholder: "e.g. TRACK-892182049",
        helpText: "Enter the alphanumeric tracking code issued upon NIMC biometric enrolment.",
        inputType: "text",
      },
      {
        id: "BY_VNIN",
        label: "Search by Virtual NIN (vNIN)",
        placeholder: "e.g. 1234567890123456",
        helpText: "Enter the 16-character Virtual NIN generated via the NIMC Mobile ID app.",
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
    gateway: "NIBSS Inter-Bank Gateway",
    searchMethods: [
      {
        id: "BY_BVN",
        label: "Search by 11-Digit BVN",
        placeholder: "e.g. 22233344455",
        helpText: "Enter the 11-digit Bank Verification Number issued by NIBSS.",
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
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      price: 150,
      description: "Official identity verification slip with barcode & QR code.",
      dimensions: "A4 Portrait",
      recommendedFor: "Official KYC & Identification",
      themeColor: "#059669",
      bgGradient: "from-emerald-900/10 to-slate-900/10",
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
