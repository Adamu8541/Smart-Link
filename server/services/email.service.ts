import nodemailer, { type Transporter } from "nodemailer";
import { readDB } from "../db";

export interface SmtpConfig {
  senderName?: string;
  replyToAddress?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpUsername?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpPasswordMasked?: string;
  smtpPass?: string;
  secure?: boolean;
}

/**
 * Helper to resolve active SMTP configuration from database or environment variables
 */
export function getResolvedSmtpConfig(customDb?: any): {
  transporter: Transporter | null;
  config: SmtpConfig;
  fromAddress: string;
  error?: string;
} {
  const db = customDb || readDB();
  const emailSettings: SmtpConfig = db.system_settings?.email || {};

  let smtpHost = process.env.SMTP_HOST || emailSettings.smtpHost || "smtp.gmail.com";
  
  // Normalize and clean invalid hostname typos (e.g., "smtp@gmail.com" -> "smtp.gmail.com")
  smtpHost = smtpHost.trim().toLowerCase();
  if (smtpHost === "smtp@gmail.com" || smtpHost === "gmail.com" || smtpHost === "smtp@gmail") {
    smtpHost = "smtp.gmail.com";
  } else if (smtpHost.startsWith("smtp@")) {
    smtpHost = smtpHost.replace(/^smtp@/, "smtp.");
  }
  const smtpPort = Number(process.env.SMTP_PORT || emailSettings.smtpPort || 587);
  
  // Resolve username/email
  // Note: if user entered a display name in smtpUsername and an email in replyToAddress, pick the email
  let smtpUser = process.env.SMTP_USER || emailSettings.smtpUser || emailSettings.smtpUsername || "";
  const replyTo = emailSettings.replyToAddress || "adamuamuhammad8541@gmail.com";
  
  if (!smtpUser || !smtpUser.includes("@")) {
    if (replyTo && replyTo.includes("@")) {
      smtpUser = replyTo;
    }
  }

  // Resolve password / app password
  let smtpPass = 
    process.env.SMTP_PASS || 
    process.env.SMTP_PASSWORD || 
    process.env.GMAIL_APP_PASSWORD || 
    emailSettings.smtpPassword || 
    emailSettings.smtpPass || 
    emailSettings.smtpPasswordMasked || 
    "";

  // Clean whitespace from app password (e.g. "yavm raix ikvo idty" -> "yavmraixikvoidty" if 16 chars or keep intact)
  if (smtpPass) {
    smtpPass = smtpPass.trim();
  }

  const senderName = emailSettings.senderName || db.system_settings?.general?.appName || "SmartLink NG";
  const fromAddress = `"${senderName}" <${smtpUser || replyTo}>`;

  if (!smtpPass || smtpPass === "••••••••••••••••" || smtpPass === "dummy-pass") {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
      error: "SMTP Password or Google App Password is missing or masked. Please enter the App Password in System Settings > Email Gateway.",
    };
  }

  if (!smtpUser || !smtpUser.includes("@")) {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
      error: "SMTP Username / Sender Email is missing or not a valid email address.",
    };
  }

  try {
    const isGmail = smtpHost.includes("gmail") || smtpUser.includes("@gmail.com");
    let transporter: Transporter;

    if (isGmail && (!smtpHost || smtpHost === "smtp.gmail.com")) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ""), // Gmail App passwords work with spaces stripped
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ""),
        },
        tls: {
          rejectUnauthorized: false, // Prevents self-signed cert blocks
        },
      });
    }

    return {
      transporter,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
    };
  } catch (err: any) {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
      error: err.message || "Failed to initialize Nodemailer transporter",
    };
  }
}

/**
 * Global helper to send an email with robust error handling
 */
export async function sendPlatformEmail(
  options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    senderName?: string;
    attachments?: Array<{
      filename: string;
      content?: string | Buffer;
      base64Content?: string;
      contentType?: string;
      path?: string;
      encoding?: string;
    }>;
  },
  customDb?: any
): Promise<{ success: boolean; messageId?: string; message: string; error?: string }> {
  const { transporter, fromAddress, error, config } = getResolvedSmtpConfig(customDb);

  if (!transporter) {
    return {
      success: false,
      message: error || "SMTP Transporter not configured",
      error: error || "SMTP Transporter not configured",
    };
  }

  // Format sender header
  let activeFrom = fromAddress;
  if (options.senderName) {
    const activeEmail = config.smtpUser || config.replyToAddress || "notifications@smartlink.ng";
    activeFrom = `"${options.senderName}" <${activeEmail}>`;
  }

  // Prepare attachments if present
  let resolvedAttachments: any[] | undefined = undefined;
  if (Array.isArray(options.attachments) && options.attachments.length > 0) {
    resolvedAttachments = options.attachments.map((att) => {
      if (att.base64Content) {
        // Strip data:mime;base64, prefix if present
        const pureBase64 = att.base64Content.replace(/^data:[^;]+;base64,/, "");
        return {
          filename: att.filename,
          content: Buffer.from(pureBase64, "base64"),
          contentType: att.contentType,
        };
      }
      return att;
    });
  }

  try {
    const info = await transporter.sendMail({
      from: activeFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || config.replyToAddress || config.smtpUser,
      attachments: resolvedAttachments,
    });

    return {
      success: true,
      messageId: info.messageId,
      message: `Email successfully sent to ${options.to}`,
    };
  } catch (err: any) {
    console.error("[EmailService] Failed to send email:", err);
    return {
      success: false,
      message: `Failed to dispatch email: ${err.message}`,
      error: err.message,
    };
  }
}
