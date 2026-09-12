import crypto from "crypto";
import { sendPlatformEmail } from "./email.service";

export type SensitiveOtpPurpose =
  | "CHANGE_PASSWORD"
  | "CHANGE_EMAIL"
  | "CHANGE_PHONE"
  | "CHANGE_PIN"
  | "CHANGE_SECURITY_SETTINGS"
  | "CHANGE_ACCOUNT_INFO"
  | "CHANGE_USER_PRIVILEGES"
  | "CRITICAL_ADMIN_OPERATION";

export interface StoredOtpRecord {
  id: string;
  userId: string;
  userEmail: string;
  purpose: SensitiveOtpPurpose;
  targetValueHash?: string; // SHA-256 hash of new email, new phone, etc.
  otpHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  used: boolean;
  createdAt: number;
  lastResendAt: number;
  resendCount: number;
}

export interface StoredHighRiskTicket {
  ticket: string;
  userId: string;
  userEmail: string;
  purpose: SensitiveOtpPurpose;
  targetValueHash?: string;
  ipAddress?: string;
  expiresAt: number;
  createdAt: number;
  used: boolean;
}

// In-memory thread-safe store with periodic cleanup
const otpMemoryStore = new Map<string, StoredOtpRecord>();
const highRiskTicketStore = new Map<string, StoredHighRiskTicket>();

// Cleanup expired OTPs and high-risk tickets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpMemoryStore.entries()) {
    if (record.expiresAt < now || record.used) {
      otpMemoryStore.delete(key);
    }
  }
  for (const [key, ticket] of highRiskTicketStore.entries()) {
    if (ticket.expiresAt < now || ticket.used) {
      highRiskTicketStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const TICKET_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const MAX_RESENDS_PER_WINDOW = 5;
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(otp.trim()).digest("hex");
}

function hashTargetValue(val: string): string {
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***.com";
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length <= 2 ? user[0] + "***" : user.slice(0, 2) + "***" + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

export class EmailOtpService {
  /**
   * Generate and dispatch a 6-digit OTP for a sensitive account action
   */
  static async requestOtp(params: {
    userId: string;
    userEmail: string;
    purpose: SensitiveOtpPurpose;
    targetValue?: string;
    ipAddress?: string;
  }): Promise<{
    success: boolean;
    message: string;
    emailMasked?: string;
    resendCooldownSeconds: number;
    expiresInSeconds: number;
    error?: string;
    status?: number;
  }> {
    const { userId, userEmail, purpose, targetValue, ipAddress } = params;
    const cleanEmail = userEmail.toLowerCase().trim();
    const storeKey = `${userId}:${purpose}`;
    const now = Date.now();

    const existing = otpMemoryStore.get(storeKey);

    if (existing && !existing.used && existing.expiresAt > now) {
      // Check resend cooldown
      const timeSinceLastResend = now - existing.lastResendAt;
      if (timeSinceLastResend < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastResend) / 1000);
        return {
          success: false,
          status: 429,
          error: `Please wait ${remainingSec} seconds before requesting a new verification code.`,
          message: `Please wait ${remainingSec} seconds before requesting a new verification code.`,
          resendCooldownSeconds: remainingSec,
          expiresInSeconds: Math.ceil((existing.expiresAt - now) / 1000),
          emailMasked: maskEmail(cleanEmail),
        };
      }

      // Check hourly resend rate limit
      if (existing.resendCount >= MAX_RESENDS_PER_WINDOW) {
        return {
          success: false,
          status: 429,
          error: "Maximum verification code requests exceeded for this hour. Please try again later.",
          message: "Maximum verification code requests exceeded for this hour. Please try again later.",
          resendCooldownSeconds: 60,
          expiresInSeconds: 0,
        };
      }
    }

    // Generate cryptographically secure 6-digit OTP code (never logged or exposed)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const otpHash = hashOtp(rawOtp, salt);

    const targetValueHash = targetValue ? hashTargetValue(targetValue) : undefined;
    const resendCount = existing && now - existing.createdAt < RESEND_WINDOW_MS ? existing.resendCount + 1 : 1;

    const newRecord: StoredOtpRecord = {
      id: crypto.randomUUID(),
      userId,
      userEmail: cleanEmail,
      purpose,
      targetValueHash,
      otpHash,
      salt,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      used: false,
      createdAt: now,
      lastResendAt: now,
      resendCount,
    };

    otpMemoryStore.set(storeKey, newRecord);

    // Format human-readable purpose
    const purposeTitles: Record<SensitiveOtpPurpose, string> = {
      CHANGE_PASSWORD: "Password Change Verification",
      CHANGE_EMAIL: "Email Address Change Verification",
      CHANGE_PHONE: "Phone Number Change Verification",
      CHANGE_PIN: "Transaction PIN Security Update",
      CHANGE_SECURITY_SETTINGS: "Security Settings Authorization",
      CHANGE_ACCOUNT_INFO: "Critical Account Information Update",
      CHANGE_USER_PRIVILEGES: "User Privileges & Role Authorization",
      CRITICAL_ADMIN_OPERATION: "Critical Administrative Operation Authorization",
    };

    const actionDescriptions: Record<SensitiveOtpPurpose, string> = {
      CHANGE_PASSWORD: "change the login password for your Smart Link NG account",
      CHANGE_EMAIL: `change the registered email address for your Smart Link NG account${targetValue ? ` to ${targetValue}` : ""}`,
      CHANGE_PHONE: `update your registered phone number on Smart Link NG${targetValue ? ` to ${targetValue}` : ""}`,
      CHANGE_PIN: "set or modify your 4-digit Transaction Authorization PIN",
      CHANGE_SECURITY_SETTINGS: "update platform security settings or system configurations",
      CHANGE_ACCOUNT_INFO: "modify important identity or account records",
      CHANGE_USER_PRIVILEGES: "modify user roles, administrative permissions, or account access status",
      CRITICAL_ADMIN_OPERATION: "execute a critical administrative operation (wallet adjustment, provider routing, or refund)",
    };

    const actionTitle = purposeTitles[purpose] || "Security Verification";
    const actionDesc = actionDescriptions[purpose] || "perform a sensitive account change";

    // Send email using platform nodemailer / Gmail SMTP
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 0; color: #1E293B; }
          .container { max-width: 540px; margin: 30px auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
          .header { background-color: #0F2D5C; padding: 24px; text-align: center; }
          .header h1 { color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; }
          .content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #EFF6FF; color: #1D4ED8; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
          .code-box { background-color: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0F2D5C; font-family: monospace; }
          .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px; border-radius: 6px; font-size: 13px; color: #991B1B; margin-top: 24px; }
          .footer { background-color: #F8FAFC; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Smart Link NG Security</h1>
          </div>
          <div class="content">
            <span class="badge">${actionTitle}</span>
            <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #0F172A;">Verification Code Required</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
              You requested to ${actionDesc}. Use the one-time verification code below to authorize this change:
            </p>
            <div class="code-box">
              <div class="otp-code">${rawOtp}</div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748B; font-weight: 600;">Valid for 10 minutes • Single Use Only</p>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #64748B;">
              ${ipAddress ? `Request originated from IP: <strong>${ipAddress}</strong><br>` : ""}
              Time: ${new Date().toUTCString()}
            </p>
            <div class="warning">
              <strong>Security Notice:</strong> Smart Link NG staff will NEVER ask for this verification code. If you did not initiate this request, your account credentials may be compromised. Please secure your account immediately.
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Smart Link NG. All rights reserved. Secure Identity & Financial Portal.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendPlatformEmail({
        to: cleanEmail,
        subject: `[Smart Link NG] ${rawOtp} is your ${actionTitle} code`,
        html: emailHtml,
        senderName: "Smart Link Security",
      });
    } catch (mailErr) {
      console.error("[EmailOtpService] SMTP dispatch error:", mailErr);
    }

    return {
      success: true,
      message: `A 6-digit verification code has been dispatched to ${maskEmail(cleanEmail)}. It will expire in 10 minutes.`,
      emailMasked: maskEmail(cleanEmail),
      resendCooldownSeconds: 60,
      expiresInSeconds: 600,
    };
  }

  /**
   * Verify the 6-digit OTP code against the hashed record
   */
  static verifyOtp(params: {
    userId: string;
    purpose: SensitiveOtpPurpose;
    otp: string;
    targetValue?: string;
  }): {
    success: boolean;
    status?: number;
    error?: string;
  } {
    const { userId, purpose, otp, targetValue } = params;
    const storeKey = `${userId}:${purpose}`;
    const record = otpMemoryStore.get(storeKey);

    if (!record) {
      return {
        success: false,
        status: 400,
        error: "No active verification code found for this action. Please request a new code.",
      };
    }

    if (record.used) {
      return {
        success: false,
        status: 400,
        error: "This verification code has already been used. Please request a new code.",
      };
    }

    if (record.expiresAt < Date.now()) {
      otpMemoryStore.delete(storeKey);
      return {
        success: false,
        status: 400,
        error: "This verification code has expired. Please request a new code.",
      };
    }

    // Check excessive failed attempts
    if (record.attempts >= record.maxAttempts) {
      otpMemoryStore.delete(storeKey);
      return {
        success: false,
        status: 429,
        error: "Too many incorrect attempts. For your security, this verification code has been revoked. Please request a new code.",
      };
    }

    // Target value binding check (if target value was bound)
    if (record.targetValueHash && targetValue) {
      const currentTargetHash = hashTargetValue(targetValue);
      if (currentTargetHash !== record.targetValueHash) {
        return {
          success: false,
          status: 400,
          error: "The submitted update does not match the value authorized for this verification code. Please request a new code.",
        };
      }
    }

    // Compare hash with timing-safe comparison
    const candidateHash = hashOtp(otp, record.salt);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(candidateHash, "hex"),
      Buffer.from(record.otpHash, "hex")
    );

    if (!isValid) {
      record.attempts += 1;
      const remainingAttempts = record.maxAttempts - record.attempts;
      if (remainingAttempts <= 0) {
        otpMemoryStore.delete(storeKey);
        return {
          success: false,
          status: 429,
          error: "Too many incorrect attempts. This verification code has been revoked. Please request a new code.",
        };
      }
      return {
        success: false,
        status: 400,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before lockout.`,
      };
    }

    // Mark as used immediately (single-use constraint)
    record.used = true;
    otpMemoryStore.delete(storeKey);

    return {
      success: true,
    };
  }

  /**
   * Create a cryptographically random, short-lived (5-minute) ticket for high-risk operations
   */
  static createHighRiskTicket(params: {
    userId: string;
    userEmail: string;
    purpose: SensitiveOtpPurpose;
    targetValueHash?: string;
    ipAddress?: string;
  }): { ticket: string; expiresInSeconds: number } {
    const { userId, userEmail, purpose, targetValueHash, ipAddress } = params;
    const now = Date.now();
    const rawTicket = "hrt_" + crypto.randomBytes(24).toString("base64url");

    const record: StoredHighRiskTicket = {
      ticket: rawTicket,
      userId,
      userEmail: userEmail.toLowerCase().trim(),
      purpose,
      targetValueHash,
      ipAddress,
      expiresAt: now + TICKET_EXPIRY_MS,
      createdAt: now,
      used: false,
    };

    highRiskTicketStore.set(rawTicket, record);

    return {
      ticket: rawTicket,
      expiresInSeconds: 300,
    };
  }

  /**
   * Validate and consume a single-use high-risk ticket
   */
  static validateHighRiskTicket(params: {
    ticket: string;
    userId: string;
    purpose: SensitiveOtpPurpose;
    targetValue?: string;
  }): { valid: boolean; error?: string } {
    const { ticket, userId, purpose, targetValue } = params;
    const record = highRiskTicketStore.get(ticket);

    if (!record) {
      return { valid: false, error: "Invalid or expired high-risk verification ticket. Please verify again." };
    }

    if (record.used) {
      highRiskTicketStore.delete(ticket);
      return { valid: false, error: "This authorization ticket has already been used. Please verify again." };
    }

    if (record.expiresAt < Date.now()) {
      highRiskTicketStore.delete(ticket);
      return { valid: false, error: "This authorization ticket has expired. Please verify again." };
    }

    // Zero-trust check: must belong to the exact authenticated user
    if (record.userId.toLowerCase() !== userId.toLowerCase()) {
      return { valid: false, error: "Security ticket identity mismatch." };
    }

    // Purpose match (CRITICAL_ADMIN_OPERATION is valid for all administrative actions)
    if (record.purpose !== purpose && record.purpose !== "CRITICAL_ADMIN_OPERATION") {
      return { valid: false, error: "Security ticket was not authorized for this specific operation." };
    }

    // Target value check if target was bound
    if (record.targetValueHash && targetValue) {
      const currentTargetHash = hashTargetValue(targetValue);
      if (currentTargetHash !== record.targetValueHash) {
        return { valid: false, error: "Security ticket target value mismatch." };
      }
    }

    // Consume ticket immediately (single-use constraint)
    record.used = true;
    highRiskTicketStore.delete(ticket);

    return { valid: true };
  }

  /**
   * Unified validator for sensitive / high-risk endpoints.
   * Checks for:
   * 1) 'x-high-risk-ticket' header or 'req.body.highRiskTicket'
   * 2) 'x-security-otp' header or 'req.body.securityOtp'
   * If either is valid, authorizes the action.
   */
  static validateHighRiskAction(params: {
    req: any;
    userId: string;
    purpose: SensitiveOtpPurpose;
    targetValue?: string;
  }): { valid: boolean; reason?: string; requiresVerification?: boolean; status?: number; purpose: SensitiveOtpPurpose } {
    const { req, userId, purpose, targetValue } = params;

    const ticket = (
      req.headers["x-high-risk-ticket"] ||
      req.headers["x-security-ticket"] ||
      req.body?.highRiskTicket ||
      req.body?.securityTicket
    ) as string;

    if (ticket && typeof ticket === "string" && ticket.trim()) {
      const ticketResult = EmailOtpService.validateHighRiskTicket({
        ticket: ticket.trim(),
        userId,
        purpose,
        targetValue,
      });

      if (ticketResult.valid) {
        return { valid: true, purpose };
      }
      return {
        valid: false,
        status: 403,
        reason: ticketResult.error || "Invalid security ticket.",
        requiresVerification: true,
        purpose,
      };
    }

    const otp = (
      req.headers["x-security-otp"] ||
      req.headers["x-otp"] ||
      req.body?.securityOtp ||
      req.body?.otp
    ) as string;

    if (otp && typeof otp === "string" && otp.trim()) {
      const otpResult = EmailOtpService.verifyOtp({
        userId,
        purpose,
        otp: otp.trim(),
        targetValue,
      });

      if (otpResult.success) {
        return { valid: true, purpose };
      }
      return {
        valid: false,
        status: otpResult.status || 400,
        reason: otpResult.error || "Invalid verification code.",
        requiresVerification: true,
        purpose,
      };
    }

    return {
      valid: false,
      status: 403,
      reason: "High-risk operation requires security verification. Please provide an email verification code (OTP) or authorization ticket.",
      requiresVerification: true,
      purpose,
    };
  }
}
