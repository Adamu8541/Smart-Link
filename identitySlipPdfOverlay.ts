/**
 * identitySlipPdfOverlay.ts
 * ---------------------------------------------------------------
 * Overlays LumiID (or any identity-provider) verification data
 * onto a FIXED PDF template at exact, pre-measured coordinates.
 *
 * Coordinates below were measured directly off the uploaded
 * template (595 x 841 pt page) by rendering it at 200 DPI and
 * mapping each field's pixel bounding box back to PDF points
 * (pt = px * 72/200). Adjust CONFIG if your production template
 * differs by even a few px — everything is centralized there.
 *
 * npm install pdf-lib qrcode
 * (qrcode is already a dependency in this project)
 * ---------------------------------------------------------------
 */

import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  degrees,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  clip,
  endPath,
  moveTo,
  lineTo,
  closePath,
} from "pdf-lib";
import QRCode from "qrcode";

// ---------------------------------------------------------------
// 1. Types — mirrors LumiIDAdapter.mapToStandardFields() output
// ---------------------------------------------------------------

export interface IdentitySlipData {
  firstName?: string;
  lastName?: string;
  surname?: string;
  middleName?: string;
  otherName?: string;
  otherNames?: string;
  fullName?: string;
  gender?: string;              // "Male" | "Female" | "M" | "F"
  dateOfBirth?: string;         // any parseable date string
  dob?: string;                 // convenient alias for dateOfBirth
  birthdate?: string;           // provider alias
  birthDate?: string;           // provider alias
  photoUrl?: string;            // data:image/jpeg;base64,... OR raw base64 OR http/https URL
  photo?: string;               // provider alias
  rawPhoto?: string;            // provider alias
  image?: string;               // provider alias
  base64Image?: string;         // provider alias
  bvn?: string;
  nin?: string;
  idNumber?: string;            // fallback generic ID number if bvn/nin absent
  phoneNumber?: string;         // Phone number (e.g. 08012345678)
  phone?: string;               // alias
  telephone?: string;           // alias
  mobile?: string;              // alias
  maritalStatus?: string;
  enrolmentInstitution?: string;
  enrolmentBranch?: string;
  originState?: string;
  originLga?: string;
  residenceState?: string;
  residenceLga?: string;
  trackingId?: string;          // Tracking ID for regular slip (e.g. 0RM7XBOSO2FCCD2)
  address?: string;             // Residence / street address
  addressLine1?: string;
  addressLine2?: string;
  lga?: string;                 // LGA of residence
  state?: string;               // State of residence
  providerReference?: string;   // from LumiID's response (json.meta.request_id / reference)
  engineTransactionId?: string; // your own engine's transaction id (SmartLink side)
  verificationDate?: Date;      // defaults to "now" if omitted
  qrPayload?: string;           // optional custom QR payload override
  slipType?: "PREMIUM" | "REGULAR" | "STANDARD" | "NIN_PREMIUM_WHITE" | "NIN_PREMIUM_GREEN" | "NIN_REGULAR" | "NIN_STANDARD" | string;
  rawFields?: any;
}

// ---------------------------------------------------------------
// 2. CONFIG — every fixed coordinate, font size and color lives here.
//    All x/y are in PDF points, origin bottom-left (PDF standard).
//    Page assumed 595 x 841 pt (matches the uploaded template).
// ---------------------------------------------------------------

export const PAGE = { width: 595.276, height: 841.89 };

export const CONFIG = {
  photo: {
    // Measured across 5 independent methods against clear template white aperture
    // Sub-pixel aligned to aperture perimeter: [x=202.4, y=601.2, w=55.6, h=63.2] pt
    x: 202.4,
    y: 601.2,
    width: 55.6,
    height: 63.2,
  },
  firstName: {
    x: 268.0,
    y: 640.8,   // baseline
    size: 6.5,
    color: rgb(0.05, 0.05, 0.1),
    bold: false,
  },
  lastName: {
    x: 268.0,
    y: 623.5,
    size: 6.5,
    color: rgb(0.05, 0.05, 0.1),
    bold: false,
  },
  dateOfBirth: {
    x: 268.0,
    y: 604.0,
    size: 8,
    color: rgb(0.05, 0.05, 0.1),
    bold: false,
  },
  gender: {
    x: 340.0,
    y: 604.0,
    size: 8,
    color: rgb(0.05, 0.05, 0.1),
    bold: false,
  },
  issueDate: {
    x: 369.5,
    y: 600.9,
    size: 7,
    color: rgb(0.05, 0.05, 0.1),
    bold: false,
  },
  idNumber: {
    // "1264 567 8910" style, grouped 4-3-4 (standard BVN/NIN length = 11)
    startX: 237.0,
    y: 563.0,
    size: 20,
    color: rgb(0, 0, 0),
    groupGapPt: 12,   // extra gap inserted between digit groups
    groups: [4, 3, 4],
    bold: false,
  },
  qr: {
    // Exact template vector bytecode QR bounds: x=362.8346 pt, y=634.9608 pt, 56.6929 pt (20.0 mm)
    x: 362.83,
    y: 634.96,
    size: 56.69, // exactly 20.0 mm square
  },
  bottomRightDiagonalNin: {
    // Relocated from below QR to bottom-right corner of the card
    // Diagonally oriented (55°), placed in the right bottom corner opposite to the parallel lines on the left
    x: 396.0,
    y: 558.0,
    angle: 55, // degrees (best fit and optical balance matching the 55° security watermark angle)
    size: 6.0,
    color: rgb(0.55, 0.55, 0.55),
  },
  ninBelowQr: {
    // Maintained for backward compatibility, mapped to bottom-right diagonal position
    x: 396.0,
    y: 558.0,
    angle: 55,
    size: 6.0,
    color: rgb(0.55, 0.55, 0.55),
  },
  engineRef: {
    // Small reference line fallback
    x: 364.5,
    y: 625.5,
    size: 6,
    color: rgb(0.55, 0.55, 0.55),
  },
  diagonalNin: {
    // 2 parallel lines of NIN overlayed diagonally (55°), 12pt distance between lines
    // First 7 digits start above NIN x coordinate, and last 4 digits overlay onto the photo
    line1: {
      x: 233.0,
      y: 582.2,
    },
    line2: {
      x: 218.35, // 233.0 - 12 / sin(55°), maintaining exact 12pt perpendicular distance
      y: 582.2,  // matched Y ensures both lines cross the photo bottom edge (y=601.3) at the last 4 digits
    },
    angle: 55, // degrees
    distancePt: 12,
    size: 6,
    color: rgb(0.55, 0.55, 0.55),
  },
} as const;

// Exact coordinates for Regular NIN Slip (A4 Sheet Top Section)
// Measured directly from bytecode vector transforms and content stream of Regular Slip.pdf
export const REGULAR_SLIP_CONFIG = {
  trackingId: {
    x: 78.89, // Exactly 1 character space after "Tracking ID:" colon (ends at x=75.74)
    y: 718.07,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  nin: {
    x: 89.86,
    y: 689.42,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  surname: {
    x: 264.18, // Exactly 1 character space after "Surname:" colon (ends at x=261.03)
    y: 718.07,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  firstName: {
    x: 273.69, // Exactly 1 character space after "First Name:" colon (ends at x=270.53)
    y: 689.42,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  middleName: {
    x: 285.04, // Exactly 1 character space after "Middle Name:" colon (ends at x=281.89)
    y: 661.67,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  gender: {
    x: 256.40, // Exactly 1 character space after "Gender:" colon (ends at x=253.25)
    y: 633.91,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  addressLine1: {
    x: 351.64,
    y: 694.82,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  addressLine2: {
    x: 351.64,
    y: 661.67,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  addressLine3: {
    x: 351.64,
    y: 634.27,
    size: 11.34,
    color: rgb(0, 0, 0),
    bold: false,
  },
  photo: {
    // Exact placement from Regular Slip.pdf: [x=483.47, y=627.08, w=85.68, h=107.10] pt
    x: 483.47,
    y: 627.08,
    width: 85.68,
    height: 107.10,
  },
} as const;

export const BVN_CARD_CONFIG = {
  photo: {
    // Exact measured coordinates from BVN Card.pdf (x=73.50mm, y_bottom=209.30mm, w=17.80mm, h=22.00mm)
    x: 208.35,
    y: 593.29,
    width: 50.46,
    height: 62.36,
  },
  surname: {
    // Exact measured coordinates: x=94.30mm (267.31 pt), y_bottom=227.39mm (644.58 pt)
    x: 267.31,
    y: 644.58,
    size: 9.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
  firstOtherNames: {
    // Exact measured coordinates: x=94.30mm (267.31 pt), y_bottom=220.39mm (624.74 pt)
    x: 267.31,
    y: 624.74,
    size: 9.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
  dateOfBirth: {
    // Exact measured coordinates: x=94.30mm (267.31 pt), y_bottom=213.04mm (603.89 pt)
    x: 267.31,
    y: 603.89,
    size: 8.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
  gender: {
    // Exact measured coordinates: x=115.00mm (325.98 pt), y_bottom=212.89mm (603.48 pt)
    x: 325.98,
    y: 603.48,
    size: 9.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
  issueDate: {
    // Exact measured coordinates: x=130.50mm (369.92 pt), y_bottom=215.93mm (612.08 pt)
    x: 369.92,
    y: 612.08,
    size: 6.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
  bvnNumber: {
    // Exact measured coordinates: x=92.00mm (260.79 pt), y_bottom=201.82mm (572.10 pt)
    x: 260.79,
    y: 572.10,
    size: 15.0,
    color: rgb(0, 0, 0),
    bold: false,
  },
} as const;

export const BVN_SLIP_CONFIG = {
  photo: {
    // Adjusted to fully cover the square box gray border lines (box at [108.70, 434.14, 181.50, 160.40])
    x: 108.20,
    y: 433.64,
    width: 182.50,
    height: 161.40,
  },
  headerDate: {
    x: 395.00,
    y: 616.30,
    size: 9.5,
    color: rgb(0, 0, 0),
  },
  table: {
    valueX: 225.05,
    maxWidth: 225.0,
    fontSize: 9.5,
    color: rgb(0, 0, 0),
    rows: {
      bvn: { y: 394.85, isBold: false },
      firstName: { y: 373.61, isBold: false },
      middleName: { y: 352.49, isBold: false },
      lastName: { y: 331.25, isBold: false },
      dateOfBirth: { y: 310.01, isBold: false },
      gender: { y: 288.89, isBold: false },
      maritalStatus: { y: 267.62, isBold: false },
      phoneNumber: { y: 246.38, isBold: false },
      enrolmentInstitution: { y: 225.26, isBold: false },
      enrolmentBranch: { y: 204.02, isBold: false },
      originState: { y: 182.78, isBold: false },
      originLga: { y: 161.66, isBold: false },
      residenceState: { y: 140.42, isBold: false },
      residenceLga: { y: 119.18, isBold: false },
      residentialAddress: { y: 98.04, isBold: false },
    },
  },
} as const;

// ---------------------------------------------------------------
// 3. Small helpers
// ---------------------------------------------------------------

async function loadBrowserImageToJpegBytes(src: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return reject(new Error("Browser DOM environment not available for canvas rendering"));
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Unable to create canvas 2d context"));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        resolve(bytes);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image from src"));
    img.src = src;
  });
}

/** Accepts a data URI, raw base64, or plain base64 without prefix and
 *  returns { bytes, mime } ready for pdf-lib embedding. */
/**
 * Safely extracts pure base64 payload and identifies MIME hint,
 * handling multiline inputs, newlines (\r, \n), whitespace, URL-safe base64, and data: prefixes.
 */
function cleanAndExtractBase64(input: string): { base64: string; mime: "image/jpeg" | "image/png" | "image/webp" | "image/unknown" } {
  let str = (input || "").trim();
  let mime: "image/jpeg" | "image/png" | "image/webp" | "image/unknown" = "image/jpeg";

  const commaIdx = str.indexOf(",");
  if (commaIdx !== -1 && str.substring(0, commaIdx).toLowerCase().includes("base64")) {
    const header = str.substring(0, commaIdx).toLowerCase();
    if (header.includes("png")) mime = "image/png";
    else if (header.includes("webp")) mime = "image/webp";
    else mime = "image/jpeg";
    str = str.substring(commaIdx + 1);
  }

  // Strip all whitespace, newlines, tabs, carriage returns, and fix URL-safe chars
  let clean = str.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (clean.length % 4 !== 0) clean += "=";

  return { base64: clean, mime };
}

/** Accepts a data URI, raw base64, or plain base64 without prefix and
 *  returns { bytes, mime } ready for pdf-lib embedding. */
function decodeBase64Image(input: string): { bytes: Uint8Array; mime: "image/jpeg" | "image/png" } {
  const { base64, mime: detectedMime } = cleanAndExtractBase64(input);
  let mime: "image/jpeg" | "image/png" = detectedMime === "image/png" ? "image/png" : "image/jpeg";

  let bytes: Uint8Array;
  if (typeof Buffer !== "undefined") {
    bytes = new Uint8Array(Buffer.from(base64, "base64"));
  } else {
    const cleanStr = base64.replace(/[^A-Za-z0-9+/=]/g, "");
    const binary = atob(cleanStr);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50) mime = "image/png";
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = "image/jpeg";

  return { bytes, mime };
}

async function embedProviderImage(pdfDoc: PDFDocument, photoInput: string): Promise<PDFImage> {
  let raw = (photoInput || "").trim();
  if (!raw) throw new Error("Empty photo string provided");

  // 1. If it is a remote HTTP(S) URL or relative URL (/...)
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    if (typeof window !== "undefined") {
      try {
        const jpegBytes = await loadBrowserImageToJpegBytes(raw);
        return await pdfDoc.embedJpg(jpegBytes);
      } catch {
        try {
          const proxyUrl = raw.startsWith("http") ? `/api/slips/proxy-image?url=${encodeURIComponent(raw)}` : raw;
          const jpegBytes = await loadBrowserImageToJpegBytes(proxyUrl);
          return await pdfDoc.embedJpg(jpegBytes);
        } catch {}
      }
    }

    try {
      const res = await fetch(raw);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching photo from ${raw}`);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes[0] === 0x89 && bytes[1] === 0x50) {
        return await pdfDoc.embedPng(bytes);
      }
      return await pdfDoc.embedJpg(bytes);
    } catch (fetchErr) {
      console.warn("[identitySlipPdfOverlay] Direct fetch of photo URL failed:", fetchErr);
    }
  }

  // 2. Base64 payload (handles data:image/...;base64, prefixes, multiline strings, raw base64)
  const { base64, mime } = cleanAndExtractBase64(raw);

  // If WebP in browser, convert via canvas to JPEG
  if (mime === "image/webp" && typeof window !== "undefined") {
    try {
      const jpegBytes = await loadBrowserImageToJpegBytes(`data:image/webp;base64,${base64}`);
      return await pdfDoc.embedJpg(jpegBytes);
    } catch {}
  }

  let bytes: Uint8Array;
  try {
    if (typeof Buffer !== "undefined") {
      bytes = new Uint8Array(Buffer.from(base64, "base64"));
    } else {
      const cleanStr = base64.replace(/[^A-Za-z0-9+/=]/g, "");
      const binary = atob(cleanStr);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }
  } catch (decodeErr) {
    if (typeof window !== "undefined") {
      const src = `data:image/jpeg;base64,${base64}`;
      const jpegBytes = await loadBrowserImageToJpegBytes(src);
      return await pdfDoc.embedJpg(jpegBytes);
    }
    throw decodeErr;
  }

  // Magic bytes sniffing:
  // PNG magic bytes: 0x89 0x50 ('%PNG')
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await pdfDoc.embedJpg(bytes);
    }
  }
  // JPEG magic bytes: 0xFF 0xD8 (SOI)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return await pdfDoc.embedPng(bytes);
    }
  }

  // WebP magic bytes: RIFF .... WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && typeof window !== "undefined") {
    try {
      const jpegBytes = await loadBrowserImageToJpegBytes(`data:image/webp;base64,${base64}`);
      return await pdfDoc.embedJpg(jpegBytes);
    } catch {}
  }

  try {
    return await pdfDoc.embedJpg(bytes);
  } catch {
    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      if (typeof window !== "undefined") {
        const src = `data:image/jpeg;base64,${base64}`;
        const jpegBytes = await loadBrowserImageToJpegBytes(src);
        return await pdfDoc.embedJpg(jpegBytes);
      }
      throw new Error("Unable to embed photo: unrecognized image format");
    }
  }
}

/** Draws an image into a fixed box using "cover" fit (fills the box,
 *  cropping overflow) via a clip path, so aspect ratio is preserved
 *  and the box position/size is respected exactly. */
function drawImageCover(
  page: PDFPage,
  image: PDFImage,
  box: { x: number; y: number; width: number; height: number }
) {
  const imgRatio = image.width / image.height;
  const boxRatio = box.width / box.height;

  let drawWidth: number, drawHeight: number;
  if (imgRatio > boxRatio) {
    drawHeight = box.height;
    drawWidth = drawHeight * imgRatio;
  } else {
    drawWidth = box.width;
    drawHeight = drawWidth / imgRatio;
  }
  const drawX = box.x - (drawWidth - box.width) / 2;
  const drawY = box.y - (drawHeight - box.height) / 2;

  page.pushOperators(
    pushGraphicsState(),
    moveTo(box.x, box.y),
    lineTo(box.x + box.width, box.y),
    lineTo(box.x + box.width, box.y + box.height),
    lineTo(box.x, box.y + box.height),
    closePath(),
    clip(),
    endPath()
  );

  page.drawImage(image, { x: drawX, y: drawY, width: drawWidth, height: drawHeight });

  page.pushOperators(popGraphicsState());
}

/**
 * Parses date inputs across common ISO (YYYY-MM-DD), Nigerian/Commonwealth (DD/MM/YYYY, DD-MM-YYYY),
 * and standard text date formats.
 */
function parseFlexibleDate(input?: string | Date): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const str = String(input).trim();
  if (!str) return null;

  // Standard Date parse (handles YYYY-MM-DD, Month DD YYYY, etc.)
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function formatDateLikeTemplate(input?: string | Date): string {
  if (!input) return "";
  const d = parseFlexibleDate(input);
  if (!d) return String(input ?? "");
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`; // e.g. "20 Jul 1994"
}

/**
 * Formats date and time specifically for the BVN Slip "Date:" header field
 * Example output: "25 Sep, 2026. 10:00pm"
 */
export function formatBvnSlipDateTime(input?: string | Date): string {
  const d = input instanceof Date ? input : parseFlexibleDate(input) || new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const day = String(validDate.getDate()).padStart(2, "0");
  const month = validDate.toLocaleString("en-US", { month: "short" });
  const year = validDate.getFullYear();

  const hours = validDate.getHours();
  const minutes = String(validDate.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${String(formattedHours).padStart(2, "0")}:${minutes}${ampm}`;

  return `${day} ${month}, ${year}. ${time}`;
}

/**
 * Generates the standardized QR code payload for Nigerian Identity Slips.
 * Always encodes:
 * - First Name
 * - Surname
 * - Date of Birth (formatted like "DD Mon YYYY")
 * - NIN / ID number
 *
 * If a custom payload is provided, checks whether Date of Birth is already encoded;
 * if not present, it appends Date of Birth.
 */
export function generateIdentitySlipQrPayload(params: {
  firstName?: string;
  lastName?: string;
  surname?: string;
  dateOfBirth?: string | Date;
  dob?: string | Date;
  birthdate?: string | Date;
  birthDate?: string | Date;
  nin?: string;
  bvn?: string;
  idNumber?: string;
  customPayload?: string;
}): string {
  const fName = (params.firstName || "").trim();
  const lName = (params.lastName || params.surname || "").trim();
  const rawDob = params.dateOfBirth || params.dob || params.birthdate || params.birthDate || "";
  const dobText = formatDateLikeTemplate(rawDob);
  const id = (params.nin || params.bvn || params.idNumber || "").toString().trim();

  // If a custom payload was explicitly passed, verify if Date of Birth is already present
  if (params.customPayload && params.customPayload.trim()) {
    const custom = params.customPayload.trim();
    const hasDob = /date\s*of\s*birth|dob/i.test(custom);
    if (!hasDob && dobText) {
      return `${custom}\nDate of Birth: ${dobText}`;
    }
    return custom;
  }

  // Canonical payload with Date of Birth included
  const lines: string[] = [
    `First Name: ${fName}`,
    `Surname: ${lName}`,
    `Date of Birth: ${dobText}`,
    `NIN: ${id}`,
  ];

  return lines.join("\n");
}

function normalizeGender(g?: string): string {
  if (!g) return "";
  const first = g.trim().charAt(0).toUpperCase();
  return first === "M" || first === "F" ? first : g.trim().toUpperCase();
}

/** Splits a numeric string into groups (e.g. [4,3,4]) and draws each
 *  group at a fixed x offset so spacing matches the template exactly,
 *  regardless of what font metrics say the "natural" width would be. */
function drawGroupedNumber(
  page: PDFPage,
  font: PDFFont,
  digits: string,
  cfg: typeof CONFIG.idNumber
) {
  const clean = digits.replace(/\D/g, "");
  let cursor = cfg.startX;
  let offset = 0;

  for (const groupLen of cfg.groups) {
    const group = clean.slice(offset, offset + groupLen);
    offset += groupLen;

    page.drawText(group, {
      x: cursor,
      y: cfg.y,
      size: cfg.size,
      font,
      color: cfg.color,
    });

    const groupWidth = font.widthOfTextAtSize(group, cfg.size);
    cursor += groupWidth + cfg.groupGapPt;
  }
}

// ---------------------------------------------------------------
// 4. Main overlay function (Premium Card)
// ---------------------------------------------------------------

export async function generatePremiumCardPdf(
  templatePdfBytes: Uint8Array | ArrayBuffer,
  data: IdentitySlipData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const page = pdfDoc.getPages()[0];

  // Sanity check — warn (don't throw) if template isn't the expected size,
  // since CONFIG coordinates are calibrated to a 595x842 page.
  const { width, height } = page.getSize();
  if (Math.abs(width - PAGE.width) > 1.0 || Math.abs(height - PAGE.height) > 1.0) {
    console.warn(
      `[identitySlipPdfOverlay] Template page is ${width}x${height}pt, ` +
      `CONFIG was calibrated for ${PAGE.width}x${PAGE.height}pt. Positions may be off.`
    );
  }

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ---- Photo -----------------------------------------------------
  const candidatePhoto = (
    data.photoUrl ||
    data.photo ||
    data.rawPhoto ||
    data.image ||
    data.base64Image ||
    (data as any)?.picture ||
    (data as any)?.avatar ||
    (data as any)?.applicant_photo ||
    (data as any)?.photo_url ||
    ""
  ).toString().trim();

  if (candidatePhoto) {
    try {
      const image = await embedProviderImage(pdfDoc, candidatePhoto);
      drawImageCover(page, image, CONFIG.photo);
    } catch (err) {
      console.error("[identitySlipPdfOverlay] Failed to embed photo:", err);
    }
  }

  // ---- Names & Other/Middle Name Overlay --------------------------
  let rawFirstName = (data.firstName || "").trim();
  let rawLastName = (data.lastName || data.surname || "").trim();
  let rawMiddleName = (
    data.middleName ||
    data.otherName ||
    data.otherNames ||
    (data as any).middle_name ||
    (data as any).middlename ||
    (data as any).other_name ||
    (data as any).other_names ||
    ""
  ).trim();
  const rawFullName = (data.fullName || "").trim();

  // If lastName is empty OR if lastName is identical to firstName, extract distinct names from fullName
  const isLastNameMissingOrDuplicate =
    !rawLastName ||
    (rawFirstName && rawLastName.toLowerCase() === rawFirstName.toLowerCase());

  if (isLastNameMissingOrDuplicate && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      // Find candidate parts that are distinct from rawFirstName
      const distinctParts = parts.filter(
        (p) => !rawFirstName || p.toLowerCase() !== rawFirstName.toLowerCase()
      );
      if (distinctParts.length > 0) {
        rawLastName = distinctParts[0];
        if (!rawMiddleName && distinctParts.length > 1) {
          rawMiddleName = distinctParts.slice(1).join(" ");
        }
      } else {
        rawLastName = parts[1] || parts[0];
      }
    }
  }

  // If firstName is missing but fullName is present
  if (!rawFirstName && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      if (rawLastName) {
        const distinct = parts.filter(
          (p) => p.toLowerCase() !== rawLastName.toLowerCase()
        );
        rawFirstName = distinct[0] || parts[1];
        if (!rawMiddleName && distinct.length > 1) {
          rawMiddleName = distinct.slice(1).join(" ");
        }
      } else {
        rawLastName = parts[0];
        rawFirstName = parts[1];
        if (!rawMiddleName && parts.length > 2) {
          rawMiddleName = parts.slice(2).join(" ");
        }
      }
    } else {
      rawFirstName = parts[0] || "";
    }
  }

  // If middle/other name wasn't provided directly, extract from fullName if it has 3+ parts
  if (!rawMiddleName && rawFullName) {
    const parts = rawFullName.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 3) {
      const remaining = parts.filter((p) => {
        const lower = p.toLowerCase();
        return (
          (!rawLastName || lower !== rawLastName.toLowerCase()) &&
          (!rawFirstName || lower !== rawFirstName.toLowerCase())
        );
      });
      if (remaining.length > 0) {
        rawMiddleName = remaining.join(" ");
      }
    }
  }

  // If one of the names is still missing, fallback gracefully
  if (!rawFirstName && rawLastName) {
    rawFirstName = rawLastName;
  }
  if (!rawLastName && rawFirstName) {
    rawLastName = rawFirstName;
  }

  // Combine first name and other/middle name together immediately after first name
  // with ONE character space between the firstname and the other/middle name
  let combinedFirstName = rawFirstName.replace(/\s+/g, " ").trim();
  const cleanMiddle = rawMiddleName.replace(/\s+/g, " ").trim();

  if (cleanMiddle) {
    const lowerFirst = combinedFirstName.toLowerCase();
    const lowerMiddle = cleanMiddle.toLowerCase();
    // Only append if other/middle name is not already included in combinedFirstName
    if (!lowerFirst.includes(lowerMiddle)) {
      if (combinedFirstName) {
        combinedFirstName = `${combinedFirstName} ${cleanMiddle}`;
      } else {
        combinedFirstName = cleanMiddle;
      }
    }
  }

  // Ensure single spaces between words and uppercase for official standard
  combinedFirstName = combinedFirstName.replace(/\s+/g, " ").trim();

  const firstName = combinedFirstName.toUpperCase();
  const lastName = rawLastName.replace(/\s+/g, " ").trim().toUpperCase();

  // Width safety: ensure long names don't overlap QR code (at x=362.5)
  const maxNameWidth = 92;
  const firstFont = CONFIG.firstName.bold ? fontBold : fontRegular;
  let firstSize: number = CONFIG.firstName.size;
  const currentFirstWidth = firstFont.widthOfTextAtSize(firstName, firstSize);
  if (currentFirstWidth > maxNameWidth && currentFirstWidth > 0) {
    firstSize = Math.max(5.0, (maxNameWidth / currentFirstWidth) * firstSize);
  }

  const lastFont = CONFIG.lastName.bold ? fontBold : fontRegular;
  let lastSize: number = CONFIG.lastName.size;
  const currentLastWidth = lastFont.widthOfTextAtSize(lastName, lastSize);
  if (currentLastWidth > maxNameWidth && currentLastWidth > 0) {
    lastSize = Math.max(5.0, (maxNameWidth / currentLastWidth) * lastSize);
  }

  page.drawText(firstName, {
    x: CONFIG.firstName.x,
    y: CONFIG.firstName.y,
    size: firstSize,
    font: firstFont,
    color: CONFIG.firstName.color,
  });

  page.drawText(lastName, {
    x: CONFIG.lastName.x,
    y: CONFIG.lastName.y,
    size: lastSize,
    font: lastFont,
    color: CONFIG.lastName.color,
  });

  // ---- DOB / Gender --------------------------------------------
  const rawDob =
    data.dateOfBirth ||
    data.dob ||
    data.birthdate ||
    data.birthDate ||
    (data as any)?.date_of_birth ||
    (data as any)?.birth_date ||
    "";
  const formattedDob = formatDateLikeTemplate(rawDob);

  page.drawText(formattedDob, {
    x: CONFIG.dateOfBirth.x,
    y: CONFIG.dateOfBirth.y,
    size: CONFIG.dateOfBirth.size,
    font: fontRegular,
    color: CONFIG.dateOfBirth.color,
  });

  page.drawText(normalizeGender(data.gender), {
    x: CONFIG.gender.x,
    y: CONFIG.gender.y,
    size: CONFIG.gender.size,
    font: fontRegular,
    color: CONFIG.gender.color,
  });

  // ---- Issue / verification date ---------------------------------
  page.drawText(formatDateLikeTemplate(data.verificationDate || new Date()), {
    x: CONFIG.issueDate.x,
    y: CONFIG.issueDate.y,
    size: CONFIG.issueDate.size,
    font: fontRegular,
    color: CONFIG.issueDate.color,
  });

  // ---- ID number (BVN/NIN), grouped 4-3-4 ------------------------
  const idNumber = data.nin || data.bvn || data.idNumber || "";
  if (idNumber) {
    drawGroupedNumber(page, fontRegular, idNumber, CONFIG.idNumber);
  }

  // ---- QR code (encodes First Name, Surname, Date of Birth, NIN) ----------------
  const qrPayload = generateIdentitySlipQrPayload({
    firstName,
    lastName,
    dateOfBirth: formattedDob || rawDob,
    dob: formattedDob || rawDob,
    birthdate: formattedDob || rawDob,
    nin: idNumber,
    customPayload: data.qrPayload,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 0, width: 400 });
  const { bytes: qrBytes } = decodeBase64Image(qrDataUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImage, {
    x: CONFIG.qr.x,
    y: CONFIG.qr.y,
    width: CONFIG.qr.size,
    height: CONFIG.qr.size,
  });

  // ---- Diagonal Security NIN Overlays ----
  const diagonalNinText = (
    data.nin ||
    data.idNumber ||
    ""
  ).toString().trim();

  if (diagonalNinText) {
    // 1. Right Bottom Corner: Diagonal NIN (relocated from below QR code, 55° diagonal angle)
    page.drawText(diagonalNinText, {
      x: CONFIG.bottomRightDiagonalNin.x,
      y: CONFIG.bottomRightDiagonalNin.y,
      size: CONFIG.bottomRightDiagonalNin.size,
      font: fontRegular,
      color: CONFIG.bottomRightDiagonalNin.color,
      rotate: degrees(CONFIG.bottomRightDiagonalNin.angle),
    });

    // 2. Left Side: 2 Parallel Diagonal Lines of NIN (12pt distance, crossing over the photo area)
    // Line 1
    page.drawText(diagonalNinText, {
      x: CONFIG.diagonalNin.line1.x,
      y: CONFIG.diagonalNin.line1.y,
      size: CONFIG.diagonalNin.size,
      font: fontRegular,
      color: CONFIG.diagonalNin.color,
      rotate: degrees(CONFIG.diagonalNin.angle),
    });

    // Line 2 (parallel, 12pt perpendicular distance)
    page.drawText(diagonalNinText, {
      x: CONFIG.diagonalNin.line2.x,
      y: CONFIG.diagonalNin.line2.y,
      size: CONFIG.diagonalNin.size,
      font: fontRegular,
      color: CONFIG.diagonalNin.color,
      rotate: degrees(CONFIG.diagonalNin.angle),
    });
  }

  return pdfDoc.save();
}

/**
 * Splits and formats candidate address fields into the 3 official NIMC Regular Slip lines:
 * Line 1: Street / Residential address
 * Line 2: Local Government Area (LGA) / Town
 * Line 3: State of Residence
 */
export function splitRegularSlipAddress(data: IdentitySlipData): { line1: string; line2: string; line3: string } {
  let rawLga = (
    data.lga ||
    (data as any).residence_lga ||
    (data as any).lga_of_residence ||
    (data as any).lgaOfResidence ||
    (data as any).lgaOfOrigin ||
    (data as any).lga_of_origin ||
    (data as any).town ||
    (data as any).city ||
    ""
  ).trim();
  let rawState = (
    data.state ||
    (data as any).residence_state ||
    (data as any).state_of_residence ||
    (data as any).stateOfResidence ||
    (data as any).stateOfOrigin ||
    (data as any).state_of_origin ||
    ""
  ).trim();
  let rawStreet = (data.addressLine1 || (data as any).street || "").trim();
  let rawFullAddress = (data.address || (data as any).residence_address || (data as any).residential_address || (data as any).home_address || "").trim();

  let fullText = rawFullAddress || rawStreet;
  if (!fullText && (rawLga || rawState)) {
    fullText = [rawStreet, rawLga, rawState].filter(Boolean).join(", ");
  }

  let line1 = rawStreet;
  let line2 = rawLga;
  let line3 = rawState;

  // If line2 (LGA) or line3 (State) is missing, attempt smart comma-splitting from fullText or line1
  const textToSplit = (line1 && line1.includes(",")) ? line1 : fullText;
  if ((!line2 || !line3) && textToSplit) {
    const parts = textToSplit.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      if (!line1 || line1.includes(",")) line1 = parts.slice(0, parts.length - 2).join(", ");
      if (!line2) line2 = parts[parts.length - 2];
      if (!line3) line3 = parts[parts.length - 1];
    } else if (parts.length === 2) {
      if (!line1 || line1.includes(",")) line1 = parts[0];
      if (!line2) line2 = parts[1];
    }
  }

  // Deduplicate line1 if line2/line3 are repeated at the end of street string
  if (line1 && line2 && line1.toUpperCase().endsWith(line2.toUpperCase())) {
    line1 = line1.substring(0, line1.length - line2.length).replace(/[\s,]+$/, "").trim();
  }
  if (line1 && line3 && line1.toUpperCase().endsWith(line3.toUpperCase())) {
    line1 = line1.substring(0, line1.length - line3.length).replace(/[\s,]+$/, "").trim();
  }

  return {
    line1: (line1 || fullText).toUpperCase(),
    line2: line2.toUpperCase(),
    line3: line3.toUpperCase(),
  };
}

/**
 * Extracts official tracking ID returned by provider.
 * If not provided by the identity provider, returns empty string (no reference generation or fallback hash).
 */
export function getOrCreateTrackingId(data: IdentitySlipData): string {
  const candidate = (
    data.trackingId ||
    (data as any).tracking_id ||
    (data as any).trackingID ||
    (data.rawFields as any)?.trackingId ||
    (data.rawFields as any)?.tracking_id ||
    (data.rawFields as any)?.trackingID ||
    ""
  ).toString().trim().replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();

  // ONLY return tracking ID if authentic provider-returned value exists
  return candidate;
}

/**
 * Overlays returned data onto the authentic Regular Slip PDF template.
 * Uses exact locked coordinates matching NIMC specifications:
 * - Tracking ID: x=89.86, y=718.07, size=11.34
 * - NIN: x=89.86, y=689.42, size=11.34
 * - Surname: x=293.14, y=718.07, size=11.34
 * - First Name: x=293.14, y=689.42, size=11.34
 * - Middle Name: x=293.14, y=661.67, size=11.34
 * - Gender: x=293.14, y=633.91, size=11.34
 * - Address: line 1 at x=351.64, y=694.82; line 2 at x=351.64, y=661.67; line 3 at x=351.64, y=634.27
 * - Applicant Photo: x=483.47, y=627.08, w=85.68, h=107.10
 */
export async function generateRegularSlipPdf(
  templatePdfBytes: Uint8Array | ArrayBuffer,
  data: IdentitySlipData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const page = pdfDoc.getPages()[0];
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 1. Applicant Photo
  const candidatePhoto = (
    data.photoUrl ||
    data.photo ||
    data.rawPhoto ||
    data.image ||
    data.base64Image ||
    (data as any)?.picture ||
    (data as any)?.avatar ||
    (data as any)?.applicant_photo ||
    (data as any)?.photo_url ||
    ""
  ).toString().trim();

  if (candidatePhoto) {
    try {
      const image = await embedProviderImage(pdfDoc, candidatePhoto);
      drawImageCover(page, image, REGULAR_SLIP_CONFIG.photo);
    } catch (err) {
      console.error("[identitySlipPdfOverlay] Failed to embed photo on Regular Slip:", err);
    }
  }

  // 2. Names Extraction
  let rawFirstName = (data.firstName || "").trim();
  let rawLastName = (data.lastName || data.surname || "").trim();
  let rawMiddleName = (
    data.middleName ||
    data.otherName ||
    data.otherNames ||
    (data as any).middle_name ||
    (data as any).middlename ||
    ""
  ).trim();
  const rawFullName = (data.fullName || "").trim();

  if ((!rawLastName || (rawFirstName && rawLastName.toLowerCase() === rawFirstName.toLowerCase())) && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const distinct = parts.filter((p) => !rawFirstName || p.toLowerCase() !== rawFirstName.toLowerCase());
      if (distinct.length > 0) {
        rawLastName = distinct[0];
        if (!rawMiddleName && distinct.length > 1) {
          rawMiddleName = distinct.slice(1).join(" ");
        }
      } else {
        rawLastName = parts[1] || parts[0];
      }
    }
  }

  if (!rawFirstName && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      rawLastName = parts[0];
      rawFirstName = parts[1];
      if (!rawMiddleName && parts.length > 2) {
        rawMiddleName = parts.slice(2).join(" ");
      }
    } else {
      rawFirstName = parts[0] || "";
    }
  }

  const surname = (rawLastName || rawFirstName || "").trim().toUpperCase();
  const firstName = (rawFirstName || rawLastName || "").trim().toUpperCase();
  const middleName = rawMiddleName.trim().toUpperCase();

  // 3. Tracking ID (Only draw if authentic tracking ID returned by provider; otherwise leave slot empty)
  const trackingId = getOrCreateTrackingId(data);
  if (trackingId) {
    page.drawText(trackingId, {
      x: REGULAR_SLIP_CONFIG.trackingId.x,
      y: REGULAR_SLIP_CONFIG.trackingId.y,
      size: REGULAR_SLIP_CONFIG.trackingId.size,
      font: fontRegular,
      color: REGULAR_SLIP_CONFIG.trackingId.color,
    });
  }

  // 4. NIN (11 digits unmasked)
  const rawNin = (data.nin || data.idNumber || "").toString().replace(/\D/g, "");
  if (rawNin) {
    page.drawText(rawNin, {
      x: REGULAR_SLIP_CONFIG.nin.x,
      y: REGULAR_SLIP_CONFIG.nin.y,
      size: REGULAR_SLIP_CONFIG.nin.size,
      font: fontRegular,
      color: REGULAR_SLIP_CONFIG.nin.color,
    });
  }

  // 5. Surname
  if (surname) {
    page.drawText(surname, {
      x: REGULAR_SLIP_CONFIG.surname.x,
      y: REGULAR_SLIP_CONFIG.surname.y,
      size: REGULAR_SLIP_CONFIG.surname.size,
      font: fontRegular,
      color: REGULAR_SLIP_CONFIG.surname.color,
    });
  }

  // 6. First Name
  if (firstName) {
    page.drawText(firstName, {
      x: REGULAR_SLIP_CONFIG.firstName.x,
      y: REGULAR_SLIP_CONFIG.firstName.y,
      size: REGULAR_SLIP_CONFIG.firstName.size,
      font: fontRegular,
      color: REGULAR_SLIP_CONFIG.firstName.color,
    });
  }

  // 7. Middle Name (if present)
  if (middleName) {
    page.drawText(middleName, {
      x: REGULAR_SLIP_CONFIG.middleName.x,
      y: REGULAR_SLIP_CONFIG.middleName.y,
      size: REGULAR_SLIP_CONFIG.middleName.size,
      font: fontRegular,
      color: REGULAR_SLIP_CONFIG.middleName.color,
    });
  }

  // 8. Gender (e.g. "M" or "F")
  const rawGender = (data.gender || "M").toString().trim();
  const cleanGender = rawGender.toLowerCase().startsWith("f") ? "F" : "M";
  page.drawText(cleanGender, {
    x: REGULAR_SLIP_CONFIG.gender.x,
    y: REGULAR_SLIP_CONFIG.gender.y,
    size: REGULAR_SLIP_CONFIG.gender.size,
    font: fontRegular,
    color: REGULAR_SLIP_CONFIG.gender.color,
  });

  // 9. Address (3 lines: Street, LGA, State)
  const addr = splitRegularSlipAddress(data);

  const drawFittedAddressLine = (text: string, x: number, y: number, defaultSize: number, maxW = 125, color = rgb(0, 0, 0)) => {
    if (!text) return;
    let size = defaultSize;
    let textW = fontRegular.widthOfTextAtSize(text, size);
    if (textW > maxW) {
      size = Math.max(6.5, (maxW / textW) * size);
    }
    page.drawText(text, {
      x,
      y,
      size,
      font: fontRegular,
      color,
    });
  };

  if (addr.line1) {
    drawFittedAddressLine(addr.line1, REGULAR_SLIP_CONFIG.addressLine1.x, REGULAR_SLIP_CONFIG.addressLine1.y, REGULAR_SLIP_CONFIG.addressLine1.size, 125, REGULAR_SLIP_CONFIG.addressLine1.color);
  }
  if (addr.line2) {
    drawFittedAddressLine(addr.line2, REGULAR_SLIP_CONFIG.addressLine2.x, REGULAR_SLIP_CONFIG.addressLine2.y, REGULAR_SLIP_CONFIG.addressLine2.size, 125, REGULAR_SLIP_CONFIG.addressLine2.color);
  }
  if (addr.line3) {
    drawFittedAddressLine(addr.line3, REGULAR_SLIP_CONFIG.addressLine3.x, REGULAR_SLIP_CONFIG.addressLine3.y, REGULAR_SLIP_CONFIG.addressLine3.size, 125, REGULAR_SLIP_CONFIG.addressLine3.color);
  }

  return pdfDoc.save();
}

/**
 * Overlays BVN verification data onto the authentic BVN Card PDF template.
 * Uses exact measured coordinates matching the template specifications:
 * - Photo: [x=208.35, y=593.29, w=50.46, h=62.36] pt ([x=73.50mm, y_bottom=209.30mm, w=17.80mm, h=22.00mm])
 * - Surname (Line 1): x=267.31, y=644.58, size=9.0, Bold (x=94.30mm, y_bottom=227.39mm)
 * - First & Other Names (Line 2): x=267.31, y=624.74, size=9.0, Bold (x=94.30mm, y_bottom=220.39mm)
 * - Date of Birth: x=267.31, y=603.89, size=8.0 (x=94.30mm, y_bottom=213.04mm)
 * - Gender: x=325.98, y=603.48, size=9.0 (x=115.00mm, y_bottom=212.89mm)
 * - Issue Date: x=369.92, y=612.08, size=6.0 (x=130.50mm, y_bottom=215.93mm)
 * - BVN Number (Bold 4-3-4): x=260.79, y=572.10, size=15.0, Bold (x=92.00mm, y_bottom=201.82mm)
 */
export async function generateBvnCardPdf(
  templatePdfBytes: Uint8Array | ArrayBuffer,
  data: IdentitySlipData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const page = pdfDoc.getPages()[0];

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 1. Photo
  const candidatePhoto = (
    data.photoUrl ||
    data.photo ||
    data.rawPhoto ||
    data.image ||
    data.base64Image ||
    (data as any)?.picture ||
    (data as any)?.avatar ||
    (data as any)?.applicant_photo ||
    (data as any)?.photo_url ||
    ""
  ).toString().trim();

  if (candidatePhoto) {
    try {
      const image = await embedProviderImage(pdfDoc, candidatePhoto);
      drawImageCover(page, image, BVN_CARD_CONFIG.photo);
    } catch (err) {
      console.error("[identitySlipPdfOverlay] Failed to embed photo on BVN Card:", err);
    }
  }

  // 2. Names Extraction (Surname and First + Other Names)
  let rawFirstName = (data.firstName || "").trim();
  let rawLastName = (data.lastName || data.surname || "").trim();
  let rawMiddleName = (
    data.middleName ||
    data.otherName ||
    data.otherNames ||
    (data as any).middle_name ||
    (data as any).middlename ||
    ""
  ).trim();
  const rawFullName = (data.fullName || "").trim();

  if ((!rawLastName || (rawFirstName && rawLastName.toLowerCase() === rawFirstName.toLowerCase())) && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const distinct = parts.filter((p) => !rawFirstName || p.toLowerCase() !== rawFirstName.toLowerCase());
      if (distinct.length > 0) {
        rawLastName = distinct[0];
        if (!rawMiddleName && distinct.length > 1) {
          rawMiddleName = distinct.slice(1).join(" ");
        }
      } else {
        rawLastName = parts[1] || parts[0];
      }
    }
  }

  if (!rawFirstName && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      rawLastName = parts[0];
      rawFirstName = parts[1];
      if (!rawMiddleName && parts.length > 2) {
        rawMiddleName = parts.slice(2).join(" ");
      }
    } else {
      rawFirstName = parts[0] || "";
    }
  }

  const surname = (rawLastName || rawFirstName || "").trim().toUpperCase();
  const rawCleanFirstName = (rawFirstName || "").trim().toUpperCase();
  const rawCleanMiddleName = rawMiddleName.trim().toUpperCase();

  // Draw Surname (Line 1) - Regular font (not bold)
  if (surname) {
    let size: number = BVN_CARD_CONFIG.surname.size;
    const textWidth = fontRegular.widthOfTextAtSize(surname, size);
    const maxWidth = 135;
    if (textWidth > maxWidth) {
      size = Math.max(6.0, (maxWidth / textWidth) * size);
    }

    page.drawText(surname, {
      x: BVN_CARD_CONFIG.surname.x,
      y: BVN_CARD_CONFIG.surname.y,
      size,
      font: fontRegular,
      color: BVN_CARD_CONFIG.surname.color,
    });
  }

  // Draw First & Other Names (Line 2) - Regular font (not bold), strictly deduplicated
  const surnameTokens = surname.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
  const firstTokens = rawCleanFirstName
    .split(/[\s,]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => Boolean(t) && !surnameTokens.includes(t));

  const middleTokens = rawCleanMiddleName
    .split(/[\s,]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => Boolean(t) && !surnameTokens.includes(t) && !firstTokens.includes(t));

  let firstOtherNames = "";
  if (firstTokens.length > 0 && middleTokens.length > 0) {
    firstOtherNames = `${firstTokens.join(" ")}, ${middleTokens.join(" ")}`;
  } else if (firstTokens.length > 0) {
    firstOtherNames = firstTokens.join(" ");
  } else if (middleTokens.length > 0) {
    firstOtherNames = middleTokens.join(" ");
  } else if (rawFullName) {
    const fullTokens = rawFullName
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => Boolean(t) && !surnameTokens.includes(t));
    if (fullTokens.length > 0) {
      firstOtherNames = fullTokens.length > 1 ? `${fullTokens[0]}, ${fullTokens.slice(1).join(" ")}` : fullTokens[0];
    }
  }

  if (firstOtherNames) {
    let size: number = BVN_CARD_CONFIG.firstOtherNames.size;
    const textWidth = fontRegular.widthOfTextAtSize(firstOtherNames, size);
    const maxWidth = 135;
    if (textWidth > maxWidth) {
      size = Math.max(6.0, (maxWidth / textWidth) * size);
    }

    page.drawText(firstOtherNames, {
      x: BVN_CARD_CONFIG.firstOtherNames.x,
      y: BVN_CARD_CONFIG.firstOtherNames.y,
      size,
      font: fontRegular,
      color: BVN_CARD_CONFIG.firstOtherNames.color,
    });
  }

  // 3. Date of Birth
  const rawDob =
    data.dateOfBirth ||
    data.dob ||
    data.birthdate ||
    data.birthDate ||
    (data as any)?.date_of_birth ||
    (data as any)?.birth_date ||
    "";
  const formattedDob = formatDateLikeTemplate(rawDob);

  if (formattedDob) {
    page.drawText(formattedDob, {
      x: BVN_CARD_CONFIG.dateOfBirth.x,
      y: BVN_CARD_CONFIG.dateOfBirth.y,
      size: BVN_CARD_CONFIG.dateOfBirth.size,
      font: fontRegular,
      color: BVN_CARD_CONFIG.dateOfBirth.color,
    });
  }

  // 4. Gender (e.g. "M" or "F")
  const rawGender = (data.gender || "M").toString().trim();
  const cleanGender = rawGender.toLowerCase().startsWith("f") ? "F" : "M";

  page.drawText(cleanGender, {
    x: BVN_CARD_CONFIG.gender.x,
    y: BVN_CARD_CONFIG.gender.y,
    size: BVN_CARD_CONFIG.gender.size,
    font: fontRegular,
    color: BVN_CARD_CONFIG.gender.color,
  });

  // 5. Issue Date (e.g. "25 Sep 2026")
  const formattedIssueDate = formatDateLikeTemplate(data.verificationDate || new Date());
  if (formattedIssueDate) {
    page.drawText(formattedIssueDate, {
      x: BVN_CARD_CONFIG.issueDate.x,
      y: BVN_CARD_CONFIG.issueDate.y,
      size: BVN_CARD_CONFIG.issueDate.size,
      font: fontRegular,
      color: BVN_CARD_CONFIG.issueDate.color,
    });
  }

  // 6. BVN Number (Big & bold formatted 4-3-4: "XXXX XXX XXXX")
  const rawBvn = (data.bvn || data.idNumber || (data as any)?.bvnNumber || "").toString().replace(/\D/g, "");
  if (rawBvn) {
    const formattedBvn =
      rawBvn.length === 11
        ? `${rawBvn.slice(0, 4)} ${rawBvn.slice(4, 7)} ${rawBvn.slice(7, 11)}`
        : rawBvn;

    page.drawText(formattedBvn, {
      x: BVN_CARD_CONFIG.bvnNumber.x,
      y: BVN_CARD_CONFIG.bvnNumber.y,
      size: BVN_CARD_CONFIG.bvnNumber.size,
      font: fontRegular,
      color: BVN_CARD_CONFIG.bvnNumber.color,
    });
  }

  return pdfDoc.save();
}

/**
 * Overlays returned BVN verification data onto the official BVN Slip PDF template.
 * Uses exact point coordinates measured from the authentic BVN SLIP.pdf:
 * - Applicant Photo: [x=109.68, y=438.72, w=179.52, h=151.20] pt
 * - Header Date: x=395.00, y=616.30 pt
 * - Table rows (x=225.05 pt):
 *   BVN (y=394.85), First Name (y=373.61), Middle Name (y=352.49), Last Name (y=331.25),
 *   Date of Birth (y=310.01), Gender (y=288.89), Marital Status (y=267.62), Phone Number (y=246.38),
 *   Enrolment Institution (y=225.26), Enrolment Branch (y=204.02), Origin State (y=182.78),
 *   Origin LGA (y=161.66), Residence State (y=140.42), Residence LGA (y=119.18), Residential Address (y=98.04)
 */
export async function generateBvnSlipPdf(
  templatePdfBytes: Uint8Array | ArrayBuffer,
  data: IdentitySlipData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const page = pdfDoc.getPages()[0];

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Applicant Photo
  const candidatePhoto = (
    data.photoUrl ||
    data.photo ||
    data.rawPhoto ||
    data.image ||
    data.base64Image ||
    (data as any)?.picture ||
    (data as any)?.avatar ||
    (data as any)?.applicant_photo ||
    (data as any)?.photo_url ||
    ""
  ).toString().trim();

  if (candidatePhoto) {
    try {
      const image = await embedProviderImage(pdfDoc, candidatePhoto);
      drawImageCover(page, image, BVN_SLIP_CONFIG.photo);
    } catch (err) {
      console.error("[identitySlipPdfOverlay] Failed to embed photo on BVN Slip:", err);
    }
  }

  // 2. Header Date with Time (e.g. "25 Sep, 2026. 10:00pm")
  const rawDate = data.verificationDate || new Date();
  const formattedHeaderDate = formatBvnSlipDateTime(rawDate);
  if (formattedHeaderDate) {
    page.drawText(formattedHeaderDate, {
      x: BVN_SLIP_CONFIG.headerDate.x,
      y: BVN_SLIP_CONFIG.headerDate.y,
      size: BVN_SLIP_CONFIG.headerDate.size,
      font: fontRegular,
      color: BVN_SLIP_CONFIG.headerDate.color,
    });
  }

  // 3. Helper to draw text fitted within the right table column
  function drawTableCell(text: string, y: number, isBold = false) {
    if (!text) return;
    let size: number = BVN_SLIP_CONFIG.table.fontSize;
    const font = isBold ? fontBold : fontRegular;
    const maxWidth = BVN_SLIP_CONFIG.table.maxWidth;
    const width = font.widthOfTextAtSize(text, size);
    if (width > maxWidth && width > 0) {
      size = Math.max(6.0, (maxWidth / width) * size);
    }
    page.drawText(text, {
      x: BVN_SLIP_CONFIG.table.valueX,
      y,
      size,
      font,
      color: BVN_SLIP_CONFIG.table.color,
    });
  }

  // 4. Data Extraction
  const rawBvn = (data.bvn || data.idNumber || (data as any)?.bvnNumber || "").toString().trim();
  let rawFirstName = (data.firstName || "").toString().trim().toUpperCase();
  let rawMiddleName = (data.middleName || data.otherName || data.otherNames || (data as any)?.middle_name || "").toString().trim().toUpperCase();
  let rawLastName = (data.lastName || data.surname || "").toString().trim().toUpperCase();
  const rawFullName = (data.fullName || "").toString().trim();

  // Name disambiguation if split from full name
  if ((!rawLastName || (rawFirstName && rawLastName.toLowerCase() === rawFirstName.toLowerCase())) && rawFullName) {
    const parts = rawFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      rawLastName = parts[0].toUpperCase();
      rawFirstName = parts[1].toUpperCase();
      if (!rawMiddleName && parts.length > 2) {
        rawMiddleName = parts.slice(2).join(" ").toUpperCase();
      }
    }
  }

  const rawDob =
    data.dateOfBirth ||
    data.dob ||
    data.birthdate ||
    data.birthDate ||
    (data as any)?.date_of_birth ||
    (data as any)?.birth_date ||
    "";
  const formattedDob = formatDateLikeTemplate(rawDob);

  const rawGender = (data.gender || "M").toString().trim();
  const gender = rawGender.toLowerCase().startsWith("f") ? "FEMALE" : "MALE";

  const maritalStatus = (
    (data as any)?.maritalStatus ||
    (data as any)?.marital_status ||
    (data as any)?.rawFields?.maritalStatus ||
    (data as any)?.rawFields?.marital_status ||
    "Single"
  ).toString().trim();

  const phoneNumber = (
    data.phoneNumber ||
    data.phone ||
    data.telephone ||
    data.mobile ||
    (data as any)?.mobileNumber ||
    (data as any)?.phone_number ||
    (data as any)?.mobile_number ||
    (data as any)?.phoneNo ||
    (data as any)?.phone_no ||
    (data as any)?.phoneNumber1 ||
    (data as any)?.telephoneno ||
    (data as any)?.telephone_number ||
    (data as any)?.customerPhone ||
    (data as any)?.userPhone ||
    (data as any)?.user_phone ||
    (data as any)?.rawFields?.phoneNumber ||
    (data as any)?.rawFields?.phone ||
    (data as any)?.rawFields?.phone_number ||
    (data as any)?.rawFields?.telephone ||
    (data as any)?.rawFields?.mobile ||
    (data as any)?.rawFields?.mobile_number ||
    (data as any)?.rawFields?.phoneNo ||
    (data as any)?.rawFields?.phoneNumber1 ||
    (data as any)?.rawFields?.telephoneno ||
    (data as any)?.rawFields?.telephone_number ||
    (data as any)?.holderData?.phoneNumber ||
    (data as any)?.holderData?.phone ||
    (data as any)?.holderData?.phone_number ||
    (data as any)?.holderData?.mobile ||
    ""
  ).toString().trim();

  const enrolmentInstitution = (
    (data as any)?.enrolmentInstitution ||
    (data as any)?.institution ||
    (data as any)?.bank ||
    (data as any)?.enrolment_institution ||
    (data as any)?.rawFields?.enrolmentInstitution ||
    (data as any)?.rawFields?.institution ||
    "NIBSS"
  ).toString().trim().toUpperCase();

  const enrolmentBranch = (
    (data as any)?.enrolmentBranch ||
    (data as any)?.branch ||
    (data as any)?.enrolment_branch ||
    (data as any)?.rawFields?.enrolmentBranch ||
    (data as any)?.rawFields?.branch ||
    "HEAD OFFICE"
  ).toString().trim().toUpperCase();

  const originState = (
    (data as any)?.originState ||
    (data as any)?.stateOfOrigin ||
    (data as any)?.state_of_origin ||
    (data as any)?.origin_state ||
    data.state ||
    (data as any)?.rawFields?.originState ||
    (data as any)?.rawFields?.stateOfOrigin ||
    ""
  ).toString().trim().toUpperCase();

  const originLga = (
    (data as any)?.originLga ||
    (data as any)?.lgaOfOrigin ||
    (data as any)?.lga_of_origin ||
    (data as any)?.origin_lga ||
    data.lga ||
    (data as any)?.rawFields?.originLga ||
    (data as any)?.rawFields?.lgaOfOrigin ||
    ""
  ).toString().trim().toUpperCase();

  const residenceState = (
    (data as any)?.residenceState ||
    (data as any)?.stateOfResidence ||
    (data as any)?.residence_state ||
    (data as any)?.state_of_residence ||
    data.state ||
    (data as any)?.rawFields?.residenceState ||
    ""
  ).toString().trim().toUpperCase();

  const residenceLga = (
    (data as any)?.residenceLga ||
    (data as any)?.lgaOfResidence ||
    (data as any)?.residence_lga ||
    (data as any)?.lga_of_residence ||
    data.lga ||
    (data as any)?.rawFields?.residenceLga ||
    ""
  ).toString().trim().toUpperCase();

  const residentialAddress = (
    (data as any)?.address ||
    (data as any)?.residence_address ||
    (data as any)?.residential_address ||
    (data as any)?.addressLine1 ||
    (data as any)?.street ||
    ""
  ).toString().trim().toUpperCase();

  // 5. Draw rows matching BVN SLIP.pdf exact baseline coordinates
  drawTableCell(rawBvn, BVN_SLIP_CONFIG.table.rows.bvn.y, BVN_SLIP_CONFIG.table.rows.bvn.isBold);
  drawTableCell(rawFirstName, BVN_SLIP_CONFIG.table.rows.firstName.y);
  drawTableCell(rawMiddleName, BVN_SLIP_CONFIG.table.rows.middleName.y);
  drawTableCell(rawLastName, BVN_SLIP_CONFIG.table.rows.lastName.y);
  drawTableCell(formattedDob, BVN_SLIP_CONFIG.table.rows.dateOfBirth.y);
  drawTableCell(gender, BVN_SLIP_CONFIG.table.rows.gender.y);
  drawTableCell(maritalStatus, BVN_SLIP_CONFIG.table.rows.maritalStatus.y);
  drawTableCell(phoneNumber, BVN_SLIP_CONFIG.table.rows.phoneNumber.y);
  drawTableCell(enrolmentInstitution, BVN_SLIP_CONFIG.table.rows.enrolmentInstitution.y);
  drawTableCell(enrolmentBranch, BVN_SLIP_CONFIG.table.rows.enrolmentBranch.y);
  drawTableCell(originState, BVN_SLIP_CONFIG.table.rows.originState.y);
  drawTableCell(originLga, BVN_SLIP_CONFIG.table.rows.originLga.y);
  drawTableCell(residenceState, BVN_SLIP_CONFIG.table.rows.residenceState.y);
  drawTableCell(residenceLga, BVN_SLIP_CONFIG.table.rows.residenceLga.y);
  drawTableCell(residentialAddress, BVN_SLIP_CONFIG.table.rows.residentialAddress.y);

  return pdfDoc.save();
}

/**
 * Universal Identity Slip PDF generator. Dispatches automatically to
 * generateBvnSlipPdf, generateBvnCardPdf, generateRegularSlipPdf, or generatePremiumCardPdf based on slipType.
 */
export async function generateIdentitySlipPdf(
  templatePdfBytes: Uint8Array | ArrayBuffer,
  data: IdentitySlipData
): Promise<Uint8Array> {
  const slipType = (data.slipType || "").toString().toUpperCase();

  const isBvnSlip =
    slipType === "BVN_SLIP" ||
    slipType === "BVN_SLIP_1" ||
    slipType.includes("BVN_SLIP") ||
    slipType === "BVN_STANDARD";

  if (isBvnSlip) {
    return generateBvnSlipPdf(templatePdfBytes, data);
  }

  const isBvnCard =
    slipType === "BVN_CARD" ||
    slipType.includes("BVN_CARD") ||
    slipType === "BVN" ||
    slipType === "BVN_PLASTIC";

  if (isBvnCard) {
    return generateBvnCardPdf(templatePdfBytes, data);
  }

  const isRegular =
    slipType === "REGULAR" ||
    slipType === "NIN_REGULAR" ||
    slipType.includes("REGULAR");

  if (isRegular) {
    return generateRegularSlipPdf(templatePdfBytes, data);
  }

  return generatePremiumCardPdf(templatePdfBytes, data);
}

// ---------------------------------------------------------------
// 5. Example usage — wiring it to your existing LumiID adapter
// ---------------------------------------------------------------
/*
import fs from "fs";
import { LumiIDAdapter } from "./services/providers/lumiidAdapter";
import { generateIdentitySlipPdf } from "./identitySlipPdfOverlay";

const adapter = new LumiIDAdapter();
const result = await adapter.verifyIdentity("BVN", "12645678910", {}, providerConfig);

if (result.success && result.data) {
  const templateBytes = fs.readFileSync("./templates/bvn-slip-template.pdf");

  const pdfBytes = await generateIdentitySlipPdf(templateBytes, {
    ...result.data,                          // firstName, lastName, dob, gender, photoUrl, bvn, etc.
    providerReference: result.providerReference,
    engineTransactionId: result.transactionId,
    verificationDate: new Date(),
  });

  fs.writeFileSync("./output/verification-slip.pdf", pdfBytes);
  // or, in an Express route:
  // res.setHeader("Content-Type", "application/pdf");
  // res.send(Buffer.from(pdfBytes));
}
*/
