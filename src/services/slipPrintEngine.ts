/**
 * SmartLink High-Resolution Slip Print & PDF Export Engine
 *
 * Provides crisp 300 DPI PDF generation, PNG image export,
 * and direct thermal / desktop printing routines.
 */

import type { IdentitySlipData } from "./identitySlipPdfOverlay";
import { generateIdentitySlipPdf } from "./identitySlipPdfOverlay";
import type { StandardizedVerificationResult } from "../types/verification";

export class SlipPrintEngine {
  /**
   * Helper to extract and normalize provider data into IdentitySlipData,
   * disambiguating first name and surname from fullName, and sniffing all photo fields.
   */
  static buildIdentitySlipData(result: StandardizedVerificationResult): IdentitySlipData {
    const d: any = result.data || {};
    const rawFields: any = (result.data as any)?.rawFields || {};

    const candidatePhoto = (
      d.photoUrl ||
      d.photo_url ||
      d.photo ||
      d.image ||
      d.imageUrl ||
      d.image_url ||
      d.rawPhoto ||
      d.raw_photo ||
      d.base64Image ||
      d.base64_image ||
      d.applicant_photo ||
      d.picture ||
      d.avatar ||
      d.passport ||
      d.passport_photo ||
      d.face ||
      d.face_image ||
      d.data?.photoUrl ||
      d.data?.photo_url ||
      d.data?.photo ||
      d.data?.image ||
      d.data?.applicant_photo ||
      d.data?.base64Image ||
      rawFields.photo ||
      rawFields.photoUrl ||
      rawFields.photo_url ||
      rawFields.image ||
      rawFields.applicant_photo ||
      rawFields.base64Image ||
      rawFields.base64_image ||
      rawFields.picture ||
      rawFields.avatar ||
      rawFields.passport ||
      (result as any).photoUrl ||
      (result as any).photo ||
      (result as any).rawPhoto ||
      (result as any).image ||
      (result as any).holderData?.photoUrl ||
      (result as any).holderData?.photo ||
      ""
    ).toString().trim();

    const candidateDob = (
      d.dateOfBirth ||
      d.dob ||
      d.birthdate ||
      d.birthDate ||
      d.date_of_birth ||
      d.birth_date ||
      d.data?.dateOfBirth ||
      d.data?.dob ||
      d.data?.birthdate ||
      d.data?.birthDate ||
      d.data?.date_of_birth ||
      rawFields.dateOfBirth ||
      rawFields.dob ||
      rawFields.birthdate ||
      rawFields.birthDate ||
      rawFields.date_of_birth ||
      rawFields.birth_date ||
      (result as any).dateOfBirth ||
      (result as any).dob ||
      (result as any).birthdate ||
      (result as any).birthDate ||
      (result as any).date_of_birth ||
      (result as any).holderData?.dateOfBirth ||
      (result as any).holderData?.dob ||
      (result as any).holderData?.birthdate ||
      ""
    ).toString().trim();

    let fName = (
      d.firstName ||
      (d as any).first_name ||
      (d as any).firstname ||
      rawFields.firstName ||
      ""
    ).trim();

    let lName = (
      d.lastName ||
      (d as any).surname ||
      (d as any).last_name ||
      rawFields.lastName ||
      rawFields.surname ||
      ""
    ).trim();

    const fFullName = (
      d.fullName ||
      (d as any).name ||
      rawFields.fullName ||
      ""
    ).trim();

    // Disambiguate if surname is missing or equal to first name
    if ((!lName || (fName && lName.toLowerCase() === fName.toLowerCase())) && fFullName) {
      const parts = fFullName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const others = parts.filter((p) => !fName || p.toLowerCase() !== fName.toLowerCase());
        lName = others.length > 0 ? others.join(" ") : parts[1] || parts[0];
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

    return {
      firstName: fName,
      lastName: lName,
      surname: lName,
      middleName:
        d.middleName ||
        (d as any).middle_name ||
        (d as any).middlename ||
        (d as any).otherName ||
        (d as any).other_name ||
        (d as any).otherNames ||
        (d as any).other_names ||
        rawFields.middleName ||
        rawFields.middle_name ||
        rawFields.middlename ||
        rawFields.otherName ||
        rawFields.other_name ||
        rawFields.otherNames,
      otherName:
        d.otherName ||
        (d as any).other_name ||
        (d as any).otherNames ||
        (d as any).other_names ||
        d.middleName ||
        (d as any).middle_name ||
        (d as any).middlename,
      fullName: fFullName || [lName, fName].filter(Boolean).join(" ") || "RECORD CONFIRMED",
      gender: d.gender || (d as any).sex || "M",
      dateOfBirth: candidateDob,
      dob: candidateDob,
      birthdate: candidateDob,
      birthDate: candidateDob,
      photoUrl: candidatePhoto,
      photo: candidatePhoto,
      rawPhoto: candidatePhoto,
      image: candidatePhoto,
      nin: (() => {
        // Collect all possible candidate NIN fields returned from provider
        const candidates = [
          d.nin,
          d.national_identity_number,
          d.nationalId,
          d.national_id,
          d.vnin,
          d.vNin,
          d.idNumber,
          d.id_number,
          d.identificationNumber,
          d.identityNumber,
          rawFields.nin,
          rawFields.national_identity_number,
          rawFields.nationalId,
          rawFields.national_id,
          rawFields.vnin,
          rawFields.vNin,
          rawFields.idNumber,
          result.verifiedId,
          (result as any).idNumber,
          (result as any).identificationNumber,
          (result as any).nin,
          (result as any).searchQuery,
          (result as any).query,
          result.maskedId,
        ].filter(Boolean).map((v) => String(v).trim());

        // Prefer exact 11-digit unmasked NIN
        const clean11 = candidates.find((c) => c.replace(/\D/g, "").length === 11);
        if (clean11) return clean11.replace(/\D/g, "");

        // Otherwise return first non-empty candidate
        return candidates[0] || "";
      })(),
      bvn: d.bvn,
      idNumber: (() => {
        const rawNin =
          d.nin ||
          d.national_identity_number ||
          d.nationalId ||
          d.national_id ||
          d.idNumber ||
          rawFields.nin ||
          result.verifiedId ||
          (result as any).identificationNumber;
        return rawNin ? String(rawNin).trim() : undefined;
      })(),
      trackingId: (() => {
        const raw =
          d.trackingId ||
          d.tracking_id ||
          d.trackingID ||
          rawFields.trackingId ||
          rawFields.tracking_id ||
          rawFields.trackingID ||
          (result as any).trackingId ||
          (result as any).tracking_id;
        return raw ? String(raw).trim() : undefined;
      })(),
      phoneNumber: (() => {
        const raw =
          d.phoneNumber ||
          d.phone ||
          d.phone_number ||
          d.telephone ||
          d.mobile ||
          d.mobile_number ||
          d.phoneNo ||
          d.phone_no ||
          d.phoneNumber1 ||
          d.telephoneno ||
          d.telephone_number ||
          rawFields.phoneNumber ||
          rawFields.phone ||
          rawFields.phone_number ||
          rawFields.telephone ||
          rawFields.mobile ||
          rawFields.mobile_number ||
          rawFields.phoneNo ||
          rawFields.phone_no ||
          rawFields.phoneNumber1 ||
          rawFields.telephoneno ||
          rawFields.telephone_number ||
          (result as any).phoneNumber ||
          (result as any).phone ||
          (result as any).phone_number ||
          (result as any).userPhone;
        return raw ? String(raw).trim() : undefined;
      })(),
      phone: (() => {
        const raw =
          d.phone ||
          d.phoneNumber ||
          d.phone_number ||
          rawFields.phone ||
          rawFields.phoneNumber ||
          rawFields.phone_number;
        return raw ? String(raw).trim() : undefined;
      })(),
      maritalStatus:
        d.maritalStatus ||
        d.marital_status ||
        rawFields.maritalStatus ||
        rawFields.marital_status ||
        "Single",
      enrolmentInstitution:
        d.enrolmentInstitution ||
        d.institution ||
        d.bank ||
        d.enrolment_institution ||
        rawFields.enrolmentInstitution ||
        rawFields.institution ||
        rawFields.bank ||
        "NIBSS",
      enrolmentBranch:
        d.enrolmentBranch ||
        d.branch ||
        d.enrolment_branch ||
        rawFields.enrolmentBranch ||
        rawFields.branch ||
        "HEAD OFFICE",
      originState:
        d.originState ||
        d.stateOfOrigin ||
        d.state_of_origin ||
        d.origin_state ||
        d.state ||
        rawFields.originState ||
        rawFields.stateOfOrigin ||
        rawFields.state_of_origin ||
        rawFields.state,
      originLga:
        d.originLga ||
        d.lgaOfOrigin ||
        d.lga_of_origin ||
        d.origin_lga ||
        d.lga ||
        rawFields.originLga ||
        rawFields.lgaOfOrigin ||
        rawFields.lga_of_origin ||
        rawFields.lga,
      residenceState:
        d.residenceState ||
        d.stateOfResidence ||
        d.residence_state ||
        d.state_of_residence ||
        d.state ||
        rawFields.residenceState ||
        rawFields.stateOfResidence ||
        rawFields.residence_state ||
        rawFields.state,
      residenceLga:
        d.residenceLga ||
        d.lgaOfResidence ||
        d.residence_lga ||
        d.lga_of_residence ||
        d.lga ||
        rawFields.residenceLga ||
        rawFields.lgaOfResidence ||
        rawFields.residence_lga ||
        rawFields.lga,
      address:
        d.address ||
        d.residence_address ||
        d.residential_address ||
        d.home_address ||
        rawFields.address ||
        rawFields.residence_address ||
        rawFields.residential_address,
      addressLine1:
        d.addressLine1 ||
        d.street ||
        d.residence_address ||
        d.residential_address ||
        d.address ||
        rawFields.addressLine1 ||
        rawFields.street ||
        rawFields.residence_address ||
        rawFields.address,
      addressLine2:
        d.addressLine2 ||
        d.lga ||
        d.residence_lga ||
        rawFields.addressLine2 ||
        rawFields.lga,
      lga:
        d.lga ||
        d.residence_lga ||
        d.lga_of_residence ||
        d.lgaOfOrigin ||
        d.town ||
        d.city ||
        rawFields.lga ||
        rawFields.residence_lga ||
        rawFields.lga_of_residence,
      state:
        d.state ||
        d.residence_state ||
        d.state_of_residence ||
        d.stateOfResidence ||
        d.stateOfOrigin ||
        d.state_of_origin ||
        rawFields.state ||
        rawFields.residence_state ||
        rawFields.state_of_residence,
      slipType:
        (result as any).slipType ||
        (result as any).formatType ||
        (result as any).selectedSlip?.formatId ||
        (result as any).selectedSlip?.id ||
        (result.data as any)?.slipType,
      providerReference: result.reference || (result as any).providerReference,
      engineTransactionId: result.receiptNumber || (result as any).slipId || (result as any).id,
      verificationDate: new Date(),
    };
  }

  /**
   * Generates official overlaid PDF bytes (using authentic background template)
   */
  static async generateOverlayPdfBytes(data: IdentitySlipData, requestedType?: string): Promise<Uint8Array> {
    const isBvnSlip =
      requestedType === "BVN_SLIP" ||
      requestedType === "BVN_SLIP_1" ||
      requestedType === "STANDARD_SLIP" ||
      data.slipType === "BVN_SLIP" ||
      data.slipType === "BVN_SLIP_1" ||
      (typeof data.slipType === "string" && data.slipType.toUpperCase().includes("BVN_SLIP"));

    const isBvnCard =
      !isBvnSlip && (
        requestedType === "BVN_CARD" ||
        requestedType === "BVN" ||
        requestedType === "BVN_PLASTIC" ||
        data.slipType === "BVN_CARD" ||
        data.slipType === "BVN" ||
        (typeof data.slipType === "string" && data.slipType.toUpperCase().includes("BVN_CARD"))
      );

    const isRegular =
      !isBvnSlip && !isBvnCard && (
        requestedType === "REGULAR" ||
        requestedType === "NIN_REGULAR" ||
        data.slipType === "REGULAR" ||
        data.slipType === "NIN_REGULAR" ||
        (typeof data.slipType === "string" && data.slipType.toUpperCase().includes("REGULAR"))
      );

    let templateBuffer: ArrayBuffer | null = null;
    const templateUrls = isBvnSlip
      ? [
          "/assets/BVN%20Slip.pdf",
          "/assets/BVN Slip.pdf",
          "/assets/BVN%20SLIP.pdf",
          "/assets/BVN SLIP.pdf",
          "/BVN%20Slip.pdf",
          "/BVN Slip.pdf",
          "/BVN%20SLIP.pdf",
          "/BVN SLIP.pdf",
          "/templates/BVN%20Slip.pdf",
          "/templates/BVN Slip.pdf",
        ]
      : isBvnCard
      ? [
          "/assets/BVN%20Card.pdf",
          "/assets/BVN Card.pdf",
          "/BVN%20Card.pdf",
          "/BVN Card.pdf",
          "/templates/BVN%20Card.pdf",
          "/templates/BVN Card.pdf",
        ]
      : isRegular
      ? [
          "/templates/Regular%20Slip.pdf",
          "/templates/Regular Slip.pdf",
          "/assets/Regular%20Slip.pdf",
          "/assets/Regular Slip.pdf",
          "/Regular%20Slip.pdf",
          "/Regular Slip.pdf",
        ]
      : [
          "/templates/Premium%20NIN%20Slip.pdf",
          "/templates/Premium NIN Slip.pdf",
          "/assets/Premium%20NIN%20Slip.pdf",
          "/assets/Premium NIN Slip.pdf",
          "/Premium%20NIN%20Slip.pdf",
          "/Premium NIN Slip.pdf",
        ];

    for (const url of templateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          templateBuffer = await res.arrayBuffer();
          break;
        }
      } catch {
        // try next candidate
      }
    }

    if (!templateBuffer) {
      // Backend generation fallback
      const targetSlipType = isBvnSlip
        ? "BVN_SLIP"
        : isBvnCard
        ? "BVN_CARD"
        : isRegular
        ? "NIN_REGULAR"
        : (data.slipType || "NIN_PREMIUM_WHITE");

      const res = await fetch("/api/slips/generate-overlay-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, slipType: targetSlipType }),
      });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return new Uint8Array(arrayBuf);
      }
      throw new Error("Unable to fetch slip template from client or server.");
    }

    return await generateIdentitySlipPdf(templateBuffer, {
      ...data,
      slipType: isBvnSlip ? "BVN_SLIP" : isBvnCard ? "BVN_CARD" : isRegular ? "REGULAR" : (data.slipType || "PREMIUM"),
    });
  }

  /**
   * Triggers an immediate browser / mobile download
   */
  static triggerBlobDownload(pdfBytesOrBlob: Uint8Array | Blob, filename: string): void {
    const blob =
      pdfBytesOrBlob instanceof Blob
        ? pdfBytesOrBlob
        : new Blob([pdfBytesOrBlob], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    link.href = downloadUrl;
    link.download = cleanFilename;
    link.setAttribute("download", cleanFilename);
    link.target = "_self";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(downloadUrl);
    }, 20000);
  }

  /**
   * Automatically extracts provider return data, overlays on the PDF,
   * and immediately triggers automatic download onto user phone/device.
   */
  static async autoExportIdentitySlip(
    result: StandardizedVerificationResult,
    customFilename?: string
  ): Promise<{
    success: boolean;
    pdfBytes?: Uint8Array;
    blob?: Blob;
    filename: string;
    slipData: IdentitySlipData;
    error?: string;
  }> {
    const slipData = this.buildIdentitySlipData(result);
    const rawId = (slipData.nin || slipData.bvn || slipData.idNumber || result.verifiedId || (result.data as any)?.nin || (result.data as any)?.bvn || "").toString().trim();
    const safeId = rawId ? rawId.replace(/[^a-zA-Z0-9_-]/g, "") : "";
    const isBvnService = (result.service || "").toUpperCase().includes("BVN") || Boolean(slipData.bvn);

    const isBvnSlip =
      (result as any).formatId === "BVN_SLIP_1" ||
      (result as any).slipType === "BVN_SLIP_1" ||
      (result as any).slipType === "BVN_SLIP" ||
      (result as any).selectedSlip?.id === "BVN_SLIP_1" ||
      (result as any).selectedSlip?.formatId === "BVN_SLIP_1" ||
      slipData.slipType === "BVN_SLIP" ||
      slipData.slipType === "BVN_SLIP_1";

    const isBvnCard =
      !isBvnSlip && (
        isBvnService ||
        slipData.slipType === "BVN_CARD" ||
        (result as any).slipType === "BVN_CARD" ||
        (result as any).formatId === "BVN_CARD" ||
        (result as any).selectedSlip?.id === "BVN_CARD" ||
        (result as any).selectedSlip?.formatId === "BVN_CARD"
      );

    const isNinService = (result.service || "").toUpperCase().includes("NIN") || Boolean(slipData.nin);
    const isRegular =
      !isBvnSlip && !isBvnCard && (
        slipData.slipType === "REGULAR" ||
        slipData.slipType === "NIN_REGULAR" ||
        (typeof slipData.slipType === "string" && slipData.slipType.toUpperCase().includes("REGULAR")) ||
        (result as any).slipType === "REGULAR" ||
        (result as any).slipType === "NIN_REGULAR" ||
        (result as any).formatId === "NIN_REGULAR" ||
        (result as any).selectedSlip?.id === "REGULAR" ||
        (result as any).selectedSlip?.formatId === "NIN_REGULAR"
      );

    let defaultFilename: string;
    if (isBvnSlip) {
      defaultFilename = safeId ? `BVN Slip ${safeId}.pdf` : `BVN Slip.pdf`;
    } else if (isBvnCard) {
      defaultFilename = safeId ? `BVN ${safeId}.pdf` : `BVN.pdf`;
    } else if (isRegular) {
      defaultFilename = safeId ? `NIN Regular slip ${safeId}.pdf` : `NIN Regular slip.pdf`;
    } else if (isNinService) {
      defaultFilename = safeId ? `NIN Premium card ${safeId}.pdf` : `NIN Premium card.pdf`;
    } else {
      defaultFilename = `SmartLink_Official_${result.service || "ID"}_Slip_${safeId || "Verified"}.pdf`;
    }

    const filename = customFilename || defaultFilename;
    const effectiveType = isBvnSlip ? "BVN_SLIP" : isBvnCard ? "BVN_CARD" : isRegular ? "REGULAR" : (slipData.slipType || "PREMIUM");

    try {
      const pdfBytes = await this.generateOverlayPdfBytes(
        { ...slipData, slipType: effectiveType },
        effectiveType
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      this.triggerBlobDownload(blob, filename);

      return {
        success: true,
        pdfBytes,
        blob,
        filename,
        slipData: { ...slipData, slipType: effectiveType },
      };
    } catch (err: any) {
      console.error("[SlipPrintEngine] autoExportIdentitySlip error:", err);
      // Fallback try server POST
      try {
        const res = await fetch("/api/slips/generate-overlay-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...slipData, slipType: effectiveType }),
        });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const pdfBytes = new Uint8Array(ab);
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          this.triggerBlobDownload(blob, filename);
          return {
            success: true,
            pdfBytes,
            blob,
            filename,
            slipData: { ...slipData, slipType: effectiveType },
          };
        }
      } catch (fallbackErr) {
        console.error("[SlipPrintEngine] autoExportIdentitySlip server fallback error:", fallbackErr);
      }

      return {
        success: false,
        filename,
        slipData: { ...slipData, slipType: effectiveType },
        error: err.message || "Failed to generate identity slip PDF.",
      };
    }
  }

  /**
   * Export official BVN Slip PDF overlaid on the authentic template
   * using exact locked coordinates and pdf-lib
   */
  static async exportBvnSlipPdf(
    data: IdentitySlipData,
    filename: string
  ): Promise<boolean> {
    try {
      const pdfBytes = await this.generateOverlayPdfBytes({ ...data, slipType: "BVN_SLIP" }, "BVN_SLIP");
      this.triggerBlobDownload(pdfBytes, filename);
      return true;
    } catch (err) {
      console.error("[SlipPrintEngine] Error exporting authentic BVN Slip PDF:", err);
      return false;
    }
  }

  /**
   * Export official BVN Card PDF overlaid on the authentic template
   * using exact locked coordinates and pdf-lib
   */
  static async exportBvnCardPdf(
    data: IdentitySlipData,
    filename: string
  ): Promise<boolean> {
    try {
      const pdfBytes = await this.generateOverlayPdfBytes({ ...data, slipType: "BVN_CARD" }, "BVN_CARD");
      this.triggerBlobDownload(pdfBytes, filename);
      return true;
    } catch (err) {
      console.error("[SlipPrintEngine] Error exporting authentic BVN Card PDF:", err);
      return false;
    }
  }

  /**
   * Export official Regular NIN Slip PDF overlaid on the authentic template
   */
  static async exportRegularNinPdf(
    data: IdentitySlipData,
    filename: string
  ): Promise<boolean> {
    try {
      const pdfBytes = await this.generateOverlayPdfBytes({ ...data, slipType: "REGULAR" }, "REGULAR");
      this.triggerBlobDownload(pdfBytes, filename);
      return true;
    } catch (err) {
      console.error("[SlipPrintEngine] Error exporting authentic Regular NIN Slip PDF:", err);
      return false;
    }
  }

  /**
   * Export official Premium NIN Slip PDF overlaid on the authentic template
   * using exact locked coordinates and pdf-lib
   */
  static async exportPremiumNinPdf(
    data: IdentitySlipData,
    filename: string
  ): Promise<boolean> {
    try {
      const pdfBytes = await this.generateOverlayPdfBytes({ ...data, slipType: "PREMIUM" }, "PREMIUM");
      this.triggerBlobDownload(pdfBytes, filename);
      return true;
    } catch (err) {
      console.error("[SlipPrintEngine] Error exporting authentic Premium NIN Slip PDF:", err);
      return false;
    }
  }

  /**
   * Export DOM element as a crisp, print-ready PDF
   */
  static async exportToPdf(params: {
    elementId: string;
    filename: string;
    format?: "a4" | "card";
    orientation?: "portrait" | "landscape";
  }): Promise<boolean> {
    const { elementId, filename, format = "a4", orientation = "portrait" } = params;

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Slip element with ID "${elementId}" not found in DOM.`);
      return false;
    }

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // 1. Render high-resolution canvas at 2.5x - 3x display scale
      const canvas = await html2canvas(element, {
        scale: 3, // High-DPI 300 DPI equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // 2. Determine PDF dimensions
      if (format === "card") {
        // Standard ID-1 card size: 85.6mm x 54mm (or double height for foldable 85.6mm x 108mm)
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: [85.6, 110], // Foldable card format
        });

        pdf.addImage(imgData, "PNG", 0, 0, 85.6, 110);
        pdf.save(`${filename}.pdf`);
      } else {
        // Standard A4 sheet: 210mm x 297mm
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 190;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${filename}.pdf`);
      }

      return true;
    } catch (err) {
      console.error("PDF Export Error:", err);
      // Fallback: trigger system print
      window.print();
      return false;
    }
  }

  /**
   * Export DOM element as a High-Resolution PNG image
   */
  static async exportToPng(elementId: string, filename: string): Promise<boolean> {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.error("PNG Export Error:", err);
      return false;
    }
  }

  /**
   * Trigger direct system print for thermal or standard office printers
   */
  static triggerPrint(): void {
    window.print();
  }
}
