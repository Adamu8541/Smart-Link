import nodemailer, { type Transporter } from "nodemailer";
import dns from "dns";
import { readDB } from "../db";

// Force Node.js global DNS resolver to prioritize IPv4
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {}

/**
 * Custom DNS lookup handler that strictly returns IPv4 addresses (family: 4).
 * This prevents Node.js from attempting unreachable IPv6 sockets on cloud hosts like Render.
 */
function forceIpv4Lookup(hostname: string, options: any, callback: any) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  const opts = typeof options === "number" ? { family: 4 } : { ...(options || {}), family: 4 };

  dns.lookup(hostname, opts, (err, address, family) => {
    if (err || !address || (typeof address === "string" && address.includes(":"))) {
      // If IPv6 returned or primary lookup failed, attempt explicit IPv4 resolution
      dns.resolve4(hostname, (resErr, addresses) => {
        if (!resErr && addresses && addresses.length > 0) {
          return callback(null, addresses[0], 4);
        }
        return callback(err || new Error("IPv4 resolution failed"), address, family);
      });
      return;
    }
    return callback(null, address, 4);
  });
}

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
 * Helper to resolve active SMTP configuration from environment variables (Primary) or database (Fallback)
 */
export function getResolvedSmtpConfig(customDb?: any): {
  transporter: Transporter | null;
  config: SmtpConfig;
  fromAddress: string;
  error?: string;
} {
  let db: any = {};
  try {
    db = customDb || readDB();
  } catch (e) {
    db = {};
  }
  const emailSettings: SmtpConfig = db.system_settings?.email || {};

  // 1. Resolve User / Email from Environment Variables FIRST (Independent of Admin DB)
  let rawEnvUser =
    process.env.AUTH_EMAIL ||
    process.env.AUTH_SMTP_USER ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.AUTH_EMAIL_FROM ||
    process.env.SUPPORT_EMAIL ||
    "";

  // Extract email if formatted as "Name <email@domain.com>"
  if (rawEnvUser.includes("<") && rawEnvUser.includes(">")) {
    const match = rawEnvUser.match(/<([^>]+)>/);
    if (match) rawEnvUser = match[1];
  }

  const smtpUser = (rawEnvUser.trim() || emailSettings.smtpUser || emailSettings.smtpUsername || "").trim();

  // 2. Resolve Host - Defaults to smtp.gmail.com
  const rawHost =
    process.env.SMTP_HOST ||
    process.env.AUTH_SMTP_HOST ||
    emailSettings.smtpHost ||
    "smtp.gmail.com";
  const smtpHost = normalizeSmtpHost(rawHost, smtpUser);

  // 3. Resolve Port - Defaults to 465 or 587
  const rawPort =
    process.env.SMTP_PORT ||
    process.env.AUTH_SMTP_PORT ||
    emailSettings.smtpPort ||
    "465";
  const smtpPort = Number(rawPort) || 465;

  // 4. Resolve Password / App Password from Environment Variables FIRST (Independent of Admin DB)
  let rawEnvPass =
    process.env.AUTH_APP_PASSWORD ||
    process.env.AUTH_SMTP_PASS ||
    process.env.AUTH_SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    "";

  let smtpPass = (rawEnvPass.trim() || emailSettings.smtpPassword || emailSettings.smtpPass || "").trim();

  // Clean spaces and quotes from Google App Passwords
  const cleanPass = smtpPass.replace(/\s+/g, "").replace(/['"]/g, "");

  // 5. Resolve Sender Name
  const senderName =
    process.env.AUTH_EMAIL_SENDER_NAME ||
    process.env.APP_NAME ||
    emailSettings.senderName ||
    db.system_settings?.general?.appName ||
    "SmartLink NG";

  const replyTo = emailSettings.replyToAddress || smtpUser;
  const fromAddress = `"${senderName}" <${smtpUser}>`;

  if (!cleanPass || cleanPass === "••••••••••••••••" || cleanPass === "dummy-pass") {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
      error: "SMTP Password or Google App Password is missing. Please set AUTH_APP_PASSWORD or AUTH_SMTP_PASS in server environment variables.",
    };
  }

  if (!smtpUser || !smtpUser.includes("@")) {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass },
      fromAddress,
      error: "SMTP Email account is missing or invalid. Please set AUTH_EMAIL or AUTH_SMTP_USER in server environment variables.",
    };
  }

  const currentConfigHash = `${smtpHost}:${smtpPort}:${smtpUser}:${cleanPass}`;

  // Reuse pooled transporter if configuration hasn't changed
  if (cachedTransporter && cachedConfigHash === currentConfigHash) {
    return {
      transporter: cachedTransporter,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass, replyToAddress: replyTo },
      fromAddress,
    };
  }

  // Reset cached transporter if config changed
  if (cachedTransporter) {
    resetSmtpTransporterCache();
  }

  try {
    const isGmail = smtpHost.includes("gmail") || smtpUser.toLowerCase().endsWith("@gmail.com");
    let transporter: Transporter;

    if (isGmail) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: smtpPort === 587 ? 587 : 465,
        secure: smtpPort !== 587,
        lookup: forceIpv4Lookup,
        family: 4, // Enforce IPv4 socket connection
        connectionTimeout: 8000, // 8s connection timeout
        greetingTimeout: 5000,
        socketTimeout: 12000,
        pool: true,
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
          minVersion: "TLSv1.2",
          servername: "smtp.gmail.com",
        },
      } as any);
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        lookup: forceIpv4Lookup,
        family: 4, // Enforce IPv4 socket connection
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 12000,
        pool: true,
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
          servername: smtpHost,
        },
      } as any);
    }

    cachedTransporter = transporter;
    cachedConfigHash = currentConfigHash;

    return {
      transporter,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass, replyToAddress: replyTo },
      fromAddress,
    };
  } catch (err: any) {
    return {
      transporter: null,
      config: { ...emailSettings, smtpHost, smtpPort, smtpUser, smtpPass, replyToAddress: replyTo },
      fromAddress,
      error: err.message || "Failed to initialize Nodemailer transporter",
    };
  }
}

/**
 * Global helper to send an email with robust error handling and automatic port fallback (465 <-> 587)
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

  const mailData = {
    from: activeFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo || config.replyToAddress || config.smtpUser,
    attachments: resolvedAttachments,
  };

  try {
    const info = await transporter.sendMail(mailData);
    return {
      success: true,
      messageId: info.messageId,
      message: `Email successfully sent to ${options.to}`,
    };
  } catch (err: any) {
    const errMsg = err.message || "";
    console.error("[EmailService] Primary dispatch attempt failed:", errMsg);

    // If socket error or connection error (ENETUNREACH, ETIMEDOUT, ECONNREFUSED), try fallback port (587 or 465)
    if (
      errMsg.includes("ENETUNREACH") ||
      errMsg.includes("ETIMEDOUT") ||
      errMsg.includes("ECONNREFUSED") ||
      errMsg.includes("connect")
    ) {
      console.warn("[EmailService] Triggering fallback IPv4 transporter on alternate port...");
      try {
        const fallbackPort = Number(config.smtpPort) === 587 ? 465 : 587;
        const cleanPass = (config.smtpPass || "").replace(/\s+/g, "").replace(/['"]/g, "");

        const fallbackTransporter = nodemailer.createTransport({
          host: config.smtpHost || "smtp.gmail.com",
          port: fallbackPort,
          secure: fallbackPort === 465,
          lookup: forceIpv4Lookup,
          family: 4,
          connectionTimeout: 8000,
          greetingTimeout: 5000,
          socketTimeout: 12000,
          auth: {
            user: config.smtpUser,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false,
            minVersion: "TLSv1.2",
            servername: config.smtpHost || "smtp.gmail.com",
          },
        } as any);

        const fallbackInfo = await fallbackTransporter.sendMail(mailData);
        return {
          success: true,
          messageId: fallbackInfo.messageId,
          message: `Email successfully sent to ${options.to} via fallback port ${fallbackPort}`,
        };
      } catch (fallbackErr: any) {
        console.error("[EmailService] Fallback dispatch also failed:", fallbackErr.message);
        return {
          success: false,
          message: `Failed to dispatch email: ${fallbackErr.message}`,
          error: fallbackErr.message,
        };
      }
    }

    return {
      success: false,
      message: `Failed to dispatch email: ${err.message}`,
      error: err.message,
    };
  }
}
