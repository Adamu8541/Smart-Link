/**
 * SmartLink Official Verification Slip & Certificate Email Dispatch Service
 *
 * Dispatches government-compliant digital certificates, download links,
 * and high-fidelity verification receipts directly to the user's registered email,
 * custom customer addresses, WhatsApp, and SMS channels.
 */

import { StandardizedVerificationResult, GeneratedSlipRecord, SlipFormatType } from "../types/verification";

export interface SendEmailSlipParams {
  userId: string;
  recipientEmail?: string;
  sendToRegistered?: boolean;
  customRecipientEmail?: string;
  verificationResult?: StandardizedVerificationResult;
  slipData?: GeneratedSlipRecord;
  formatType?: SlipFormatType;
  customNote?: string;
}

export interface EmailDispatchResponse {
  success: boolean;
  message: string;
  recipientEmails?: string[];
  registeredEmail?: string;
  deliveryMode?: string;
  slipId?: string;
  qrVerificationUrl?: string;
  error?: string;
}

export interface UserEmailPreferences {
  userId: string;
  autoEmailSlipsToRegisteredEmail: boolean;
  customDispatchEmail?: string;
  updatedAt?: string;
}

export class EmailSlipService {
  /**
   * Dispatch verification slip/certificate to registered or specified email address
   */
  static async sendSlipToEmail(params: SendEmailSlipParams): Promise<EmailDispatchResponse> {
    try {
      const res = await fetch("/api/verification/send-email-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("[EmailSlipService] Dispatch error:", err);
      return {
        success: false,
        message: err.message || "Failed to communicate with email dispatch service.",
        error: err.message,
      };
    }
  }

  /**
   * Fetch historical email slip dispatch logs for a specific user
   */
  static async getEmailLogs(userId: string) {
    try {
      const res = await fetch(`/api/verification/slip-email-logs/${userId}`);
      const data = await res.json();
      return data.logs || [];
    } catch (err) {
      console.error("[EmailSlipService] Log fetch error:", err);
      return [];
    }
  }

  /**
   * Get user preferences for automated slip emails
   */
  static async getUserPreferences(userId: string): Promise<UserEmailPreferences> {
    try {
      const res = await fetch(`/api/verification/user-email-preferences/${userId}`);
      const data = await res.json();
      return data.preferences || { userId, autoEmailSlipsToRegisteredEmail: true };
    } catch (err) {
      return { userId, autoEmailSlipsToRegisteredEmail: true };
    }
  }

  /**
   * Save user preferences for automated slip emails
   */
  static async saveUserPreferences(preferences: UserEmailPreferences): Promise<boolean> {
    try {
      const res = await fetch("/api/verification/user-email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      return false;
    }
  }

  /**
   * Generate formatted WhatsApp share URL with verification summary and validation link
   */
  static generateWhatsAppShareUrl(params: {
    serviceType: string;
    holderName: string;
    maskedId: string;
    reference: string;
    qrVerificationUrl: string;
    customNote?: string;
  }): string {
    const { serviceType, holderName, maskedId, reference, qrVerificationUrl, customNote } = params;

    let text = `*OFFICIAL IDENTITY VERIFICATION CERTIFICATE*\n\n`;
    text += `*Service:* ${serviceType.toUpperCase()} Identity Verification\n`;
    text += `*Full Name:* ${holderName}\n`;
    text += `*ID Number:* ${maskedId}\n`;
    text += `*Reference:* #${reference}\n`;
    text += `*Status:* CONFIRMED & VERIFIED \u2705\n\n`;
    if (customNote) {
      text += `*Note:* ${customNote}\n\n`;
    }
    text += `*View & Download Official PDF Slip:*\n${qrVerificationUrl}\n\n`;
    text += `_Issued via SmartLink Enterprise Identity Portal_`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /**
   * Generate formatted SMS message text
   */
  static generateSmsText(params: {
    serviceType: string;
    holderName: string;
    maskedId: string;
    reference: string;
    qrVerificationUrl: string;
  }): string {
    const { serviceType, holderName, maskedId, reference, qrVerificationUrl } = params;
    return `SmartLink Verification Confirmed: ${serviceType.toUpperCase()} for ${holderName} (${maskedId}) is VALID. Ref: #${reference}. View Official Slip: ${qrVerificationUrl}`;
  }
}
