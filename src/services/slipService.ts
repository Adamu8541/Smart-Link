/**
 * SmartLink Slip Service
 *
 * Persists and validates generated identity slips via Supabase / Turso backend API.
 */

import {
  GeneratedSlipRecord,
  SlipFormatType,
  StandardizedVerificationResult,
} from "../types/verification";
import { safeFetchJson } from "../utils/authErrorHandler";

export class SlipService {
  /**
   * Helper to generate a secure random verification token for QR codes
   */
  static generateSecureToken(serviceType: string, idNumber: string): string {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `SLIP-${serviceType.toUpperCase()}-${idNumber.substring(0, 4)}-${randomHex}`;
  }

  /**
   * Create and persist a new generated slip
   */
  static async saveSlipFromVerification(params: {
    userId: string;
    userEmail?: string;
    verificationResult: StandardizedVerificationResult;
    formatType: SlipFormatType;
  }): Promise<GeneratedSlipRecord> {
    const { userId, userEmail, verificationResult, formatType } = params;
    const { data, reference, providerName, verifiedId, maskedId, service } = verificationResult;

    const slipId = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const qrToken = this.generateSecureToken(service || "NIN", verifiedId || "0000");

    const origin = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://smartlinkdigital.ng";
    const qrVerificationUrl = `${origin}/verify/slip/${qrToken}`;

    const nowISO = new Date().toISOString();

    // Robust photo extraction from all potential provider fields
    const candidatePhoto =
      data?.photoUrl ||
      (data as any)?.photo ||
      (data as any)?.image ||
      (data as any)?.rawPhoto ||
      (data as any)?.base64Image ||
      (data as any)?.applicant_photo ||
      data?.rawFields?.photo ||
      data?.rawFields?.photoUrl ||
      data?.rawFields?.image ||
      data?.rawFields?.applicant_photo ||
      data?.rawFields?.base64Image ||
      "";

    let fName = (
      data?.firstName ||
      (data as any)?.first_name ||
      (data as any)?.firstname ||
      data?.rawFields?.firstName ||
      data?.rawFields?.first_name ||
      ""
    ).trim();

    let sName = (
      data?.lastName ||
      (data as any)?.surname ||
      (data as any)?.last_name ||
      data?.rawFields?.lastName ||
      data?.rawFields?.surname ||
      ""
    ).trim();

    const mName = (
      data?.middleName ||
      (data as any)?.middle_name ||
      (data as any)?.middlename ||
      data?.rawFields?.middleName ||
      ""
    ).trim();

    let fullLegalName = (data?.fullName || (data as any)?.name || "").trim();

    // Disambiguate if surname is missing or identical to first name
    if ((!sName || (fName && sName.toLowerCase() === fName.toLowerCase())) && fullLegalName) {
      const parts = fullLegalName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const distinct = parts.filter((p) => !fName || p.toLowerCase() !== fName.toLowerCase());
        if (distinct.length > 0) {
          sName = distinct.join(" ");
        } else {
          sName = parts[1] || parts[0];
        }
      }
    }

    if (!fName && fullLegalName) {
      const parts = fullLegalName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        if (sName) {
          const distinct = parts.filter((p) => p.toLowerCase() !== sName.toLowerCase());
          fName = distinct[0] || parts[1];
        } else {
          sName = parts[0];
          fName = parts[1];
        }
      } else {
        fName = parts[0] || "";
      }
    }

    if (!fullLegalName) {
      fullLegalName = [sName, fName, mName].filter(Boolean).join(" ") || "RECORD CONFIRMED";
    }

    const slipRecord: GeneratedSlipRecord = {
      id: slipId,
      slipId,
      userId,
      userEmail: userEmail || undefined,
      serviceType: service || "NIN",
      formatType,
      identificationNumber: verifiedId,
      maskedId,
      trackingId:
        data?.trackingId ||
        data?.tracking_id ||
        data?.trackingID ||
        data?.rawFields?.trackingId ||
        data?.rawFields?.tracking_id ||
        data?.rawFields?.trackingID ||
        undefined,
      qrVerificationToken: qrToken,
      qrVerificationUrl,
      holderData: {
        fullName: fullLegalName,
        surname: sName,
        firstName: fName,
        middleName: mName || data?.fullName?.split(" ").slice(2).join(" ") || "",
        gender: data?.gender || "M",
        dateOfBirth: data?.dateOfBirth || "",
        issueDate: nowISO,
        address: data?.address || "FEDERAL RESIDENTIAL REGISTRY",
        stateOfOrigin: data?.stateOfOrigin || "",
        lga: data?.lga || "",
        phoneNumber: data?.phoneNumber || "",
        email: data?.email || "",
        photoUrl: candidatePhoto,
        nin: verifiedId,
        bvn: data?.bvn,
      },
      reference,
      providerName,
      createdAt: nowISO,
      status: "ACTIVE",
    };

    try {
      await safeFetchJson("/api/verification/slips", {
        method: "POST",
        body: JSON.stringify(slipRecord),
      });
    } catch (err) {
      console.warn("[SlipService] Local slip save notification:", err);
    }

    return slipRecord;
  }

  /**
   * Fetch a slip by its Slip ID
   */
  static async getSlipById(slipId: string): Promise<GeneratedSlipRecord | null> {
    try {
      const res = await safeFetchJson(`/api/verification/slips/${encodeURIComponent(slipId)}`);
      if (res.ok && res.data?.slip) {
        return res.data.slip;
      }
    } catch (err) {
      console.error("[SlipService] Error retrieving slip by ID:", err);
    }
    return null;
  }

  /**
   * Fetch all slips generated by a specific user
   */
  static async getUserSlips(userId: string): Promise<GeneratedSlipRecord[]> {
    if (!userId) return [];
    try {
      const res = await safeFetchJson(`/api/verification/slips?userId=${encodeURIComponent(userId)}`);
      if (res.ok && Array.isArray(res.data?.slips)) {
        return res.data.slips;
      }
    } catch (err) {
      console.warn("[SlipService] Error fetching user slips:", err);
    }
    return [];
  }
}

// Backwards compatibility alias
export const StorageSlipService = SlipService;
