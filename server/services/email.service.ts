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

let cachedTransporter: Transporter | null = null;
let cachedConfigHash = "";

export function normalizeSmtpHost(rawHost: string, userEmail: string = ""): string {
  if (!rawHost) return "smtp.gmail.com";
  let cleaned = rawHost.trim().toLowerCase();

  // If user passed e.g. "gmtp@gmail.com", "smtp@gmail.com", "gmtp.gmail.com", "smatp@gmail.com", "gmail.com"
  if (
    cleaned.includes("gmail") ||
    cleaned.includes("gmtp") ||
    cleaned.includes("smatp") ||
    cleaned === "gmail.com" ||
    userEmail.trim().toLowerCase().endsWith("@gmail.com")
  ) {
    return "smtp.gmail.com";
  }

  // Strip prefix typos like smtp@, gmtp@, smatp@
  cleaned = cleaned.replace(/^(smtp|gmtp|smatp)@/, "smtp.");

  return cleaned;
}

export function resetSmtpTransporterCache() {
  if (cachedTransporter) {
    try {
      cachedTransporter.close();
    } catch (e) {}
  }
  cachedTransporter = null;
  cachedConfigHash = "";
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

  const rawHost = process.env.SMTP_HOST || process.env.AUTH_SMTP_HOST || emailSettings.smtpHost || "smtp.gmail.com";
  
  // Resolve username/email
  let smtpUser = 
    process.env.SMTP_USER || 
    process.env.AUTH_SMTP_USER || 
    emailSettings.smtpUser || 
    emailSettings.smtpUsername || 
    "";
  const replyTo = emailSettings.replyToAddress || (emailSettings as any).fromAddress || process.env.AUTH_EMAIL_FROM || process.env.SUPPORT_EMAIL || "";
  
  if (!smtpUser || !smtpUser.includes("@")) {
    if (replyTo && replyTo.includes("@")) {
      smtpUser = replyTo;
    }
  }

  // Auto-normalize typos in host (e.g. gmtp@gmail.com, smatp@gmail.com -> smtp.gmail.com)
  const smtpHost = normalizeSmtpHost(rawHost, smtpUser);
  const smtpPort = Number(process.env.SMTP_PORT || process.env.AUTH_SMTP_PORT || emailSettings.smtpPort || 587);

  // Resolve password / app password
  let smtpPass = 
    process.env.SMTP_PASS || 
    process.env.SMTP_PASSWORD || 
    process.env.AUTH_SMTP_PASS || 
    process.env.AUTH_SMTP_PASSWORD || 
    process.env.GMAIL_APP_PASSWORD || 
    emailSettings.smtpPassword || 
    emailSettings.smtpPass || 
    emailSettings.smtpPasswordMasked || 
    "";

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
      error: "SMTP Password or Google App Password is missing or masked. Please enter the App Password in System Settings > Email Portal.",
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

  const cleanPass = smtpPass.replace(/\s+/g, "");
  const currentConfigHash = `${smtpHost}:${smtpPort}:${smtpUser}:${cleanPass}`;

  // Reuse pooled transporter if configuration hasn't changed
  if (cachedTransporter && cachedConfigHash === currentConfigHash) {
    return {
      transporter: cachedTransporter,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
    };
  }

  // Config changed or not cached: reset old pool
  if (cachedTransporter) {
    resetSmtpTransporterCache();
  }

  try {
    const isGmail = smtpHost.includes("gmail") || smtpUser.toLowerCase().endsWith("@gmail.com");
    let transporter: Transporter;

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        pool: true,             // Enable connection pooling
        maxConnections: 5,      // Max 5 simultaneous TCP sockets
        maxMessages: 100,       // Reuse connection up to 100 messages
        rateDelta: 1000,        // 1 sec window
        rateLimit: 8,           // Safe max 8 emails/sec to prevent Gmail 421 drop errors
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        pool: true,             // Enable connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    cachedTransporter = transporter;
    cachedConfigHash = currentConfigHash;

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
