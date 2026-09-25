import express from "express";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { readDB, writeDB, UPLOADS_DIR } from "../db";
import { verifyUserOrAdminSession, requireAdmin } from "../middleware/auth";
import { ServerWalletEngine } from "../../src/services/serverWalletEngine";
import { DEFAULT_MANUAL_ADMIN_EMAIL } from "../../src/data/manualServicesConfig";
import { getResolvedSmtpConfig, sendPlatformEmail } from "../services/email.service";

const router = express.Router();
const app = router;

// Local upload directories for manual attachments (stored securely on local disk)
const MANUAL_ATTACHMENTS_DIR = path.join(UPLOADS_DIR, "manual_submissions");
if (!fs.existsSync(MANUAL_ATTACHMENTS_DIR)) {
  try {
    fs.mkdirSync(MANUAL_ATTACHMENTS_DIR, { recursive: true });
  } catch (e) {}
}

/**
 * Configure Nodemailer Transport
 * Uses system SMTP credentials or returns null if not configured
 */
function getEmailTransporter(db: any) {
  const { transporter } = getResolvedSmtpConfig(db);
  return transporter;
}

/**
 * GET /api/manual-services/config
 * Returns public configuration and service recipient emails configured by admin
 */
app.get("/api/manual-services/config", async (req, res) => {
  const db = readDB();
  const manualServiceEmails = db.manual_services_email_routes || {};
  const defaultRecipient = db.system_settings?.manualServicesDefaultEmail || DEFAULT_MANUAL_ADMIN_EMAIL;

  res.json({
    success: true,
    defaultRecipient,
    serviceEmailRoutes: manualServiceEmails,
  });
});

/**
 * POST /api/admin/manual-services/email-routes (Admin Only)
 * Update recipient email mapping for manual services
 */
app.post("/api/admin/manual-services/email-routes", requireAdmin, async (req, res) => {
  const { defaultEmail, serviceRoutes } = req.body;
  const db = readDB();

  if (!db.manual_services_email_routes) {
    db.manual_services_email_routes = {};
  }

  if (serviceRoutes && typeof serviceRoutes === "object") {
    db.manual_services_email_routes = {
      ...db.manual_services_email_routes,
      ...serviceRoutes,
    };
  }

  if (!db.system_settings) db.system_settings = {};
  if (defaultEmail) {
    db.system_settings.manualServicesDefaultEmail = defaultEmail.trim();
  }

  const admin = (req as any).admin;
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "audit_" + Date.now(),
    adminUid: admin?.uid || "ADMIN",
    adminEmail: admin?.email || "admin",
    action: "UPDATE_MANUAL_SERVICES_EMAIL_ROUTES",
    details: `Updated manual services email dispatch routes. Default: ${defaultEmail || db.system_settings.manualServicesDefaultEmail}`,
    timestamp: new Date().toISOString(),
  });

  writeDB(db);

  res.json({
    success: true,
    message: "Manual service email configurations saved successfully.",
    defaultRecipient: db.system_settings.manualServicesDefaultEmail,
    serviceRoutes: db.manual_services_email_routes,
  });
});

/**
 * POST /api/manual-services/submit
 * Handles user submission of CAC, TIN, Passport, Modification, and other manual services.
 * 
 * - Debits user wallet (if fee > 0)
 * - Saves attachments to local disk storage (NEVER sent or saved to cloud storage)
 * - Dispatches formatted HTML email with attachments to admin email (from settings or route)
 * - Returns clean "SUCCESS" response for the frontend to show "Submitted Successfully"
 */
app.post("/api/manual-services/submit", async (req, res) => {
  const {
    userId,
    serviceId,
    serviceName,
    formData,
    filesData, // { [fieldName]: { fileName, mimeType, base64 } }
    fee = 0,
  } = req.body;

  if (!serviceId || !serviceName || !formData) {
    return res.status(400).json({ error: "Missing required service parameters or form details." });
  }

  const db = readDB();

  // 1. Verify user session
  let effectiveUserId = userId;
  let userEmail = "user@smartlink.ng";
  let userFullName = "SmartLink User";

  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const authCheck = await verifyUserOrAdminSession(req, userId, db);
      if (authCheck.authorized && authCheck.authenticatedUid) {
        effectiveUserId = authCheck.authenticatedUid;
      }
    } catch (authErr) {
      console.warn("[Manual Services Auth] Token verification note:", authErr);
    }
  }

  const user = (db.users || []).find((u: any) => u.uid === effectiveUserId || u.id === effectiveUserId);
  if (user) {
    userEmail = user.email || userEmail;
    userFullName = user.fullName || user.name || userFullName;
  } else if (!effectiveUserId) {
    effectiveUserId = `anon_${Date.now()}`;
  }

  // 2. Check wallet balance and debit required filing fee
  let resolvedFee = Number(fee) || 0;
  if (resolvedFee <= 0) {
    if (serviceId === "cac_biz_name" || serviceId === "id_cac_registration") {
      resolvedFee = 28000;
    } else if (serviceId === "cac_ltd_co") {
      resolvedFee = 35000;
    }
  }

  const numericFee = resolvedFee;
  const reference = `SML-MANUAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let debitResult: any = null;
  if (numericFee > 0) {
    try {
      debitResult = await ServerWalletEngine.debitWallet(db, {
        userId: effectiveUserId,
        amount: numericFee,
        serviceName: `${serviceName} Filing Fee`,
        provider: "Manual Processing Desk",
        description: `Manual Application Filing: ${serviceName}`,
        reference,
        recipientDetails: userEmail,
        type: "MANUAL_SERVICE_FILING",
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Insufficient wallet balance to file this application." });
    }
  }

  // 3. Process and save uploaded files to local disk storage (NO cloud storage)
  const savedAttachments: { filename: string; path: string; contentType: string; size: number }[] = [];
  const filesSummary: { [key: string]: string } = {};

  if (filesData && typeof filesData === "object") {
    for (const [fieldKey, fileObj] of Object.entries<any>(filesData)) {
      if (fileObj && fileObj.base64) {
        try {
          const rawBase64 = fileObj.base64.replace(/^data:([a-zA-Z0-9\/\-+.]+);base64,/, "");
          const buffer = Buffer.from(rawBase64, "base64");
          const safeName = `${Date.now()}_${fieldKey}_${(fileObj.fileName || "attachment.dat").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const filePath = path.join(MANUAL_ATTACHMENTS_DIR, safeName);

          fs.writeFileSync(filePath, buffer);

          savedAttachments.push({
            filename: fileObj.fileName || `${fieldKey}.png`,
            path: filePath,
            contentType: fileObj.mimeType || "application/octet-stream",
            size: buffer.length,
          });

          filesSummary[fieldKey] = `Attached (${fileObj.fileName || "File"} - ${(buffer.length / 1024).toFixed(1)} KB)`;
        } catch (fileErr) {
          console.error(`Error saving attachment ${fieldKey}:`, fileErr);
        }
      }
    }
  }

  // 4. Determine Target Admin Email for this specific service
  const serviceRoutes = db.manual_services_email_routes || {};
  const targetEmail = serviceRoutes[serviceId] || db.system_settings?.manualServicesDefaultEmail || DEFAULT_MANUAL_ADMIN_EMAIL;

  // 5. Construct Beautiful HTML Email
  const timestamp = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "medium" });
  
  // Format form entries into table rows
  const formRowsHtml = Object.entries(formData)
    .map(([key, val]) => {
      const readableKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      const valueStr = String(val ?? "").replace(/\n/g, "<br/>");
      return `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 14px; font-weight: 600; color: #374151; background-color: #F9FAFB; width: 35%;">${readableKey}</td>
          <td style="padding: 10px 14px; color: #111827; font-family: sans-serif;">${valueStr || "<em>Not Provided</em>"}</td>
        </tr>
      `;
    })
    .join("");

  const filesRowsHtml = savedAttachments.length > 0
    ? savedAttachments
        .map(
          (att) => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px 14px; font-weight: 600; color: #0F2D5C; background-color: #EFF6FF;">Attached File</td>
            <td style="padding: 8px 14px; color: #111827;">📎 <strong>${att.filename}</strong> (${(att.size / 1024).toFixed(1)} KB) — <em>See Email Attachments</em></td>
          </tr>
        `
        )
        .join("")
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Service Filing - ${serviceName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB;">
        
        <!-- Header -->
        <div style="background-color: #0F2D5C; color: #FFFFFF; padding: 24px; text-align: left;">
          <h1 style="margin: 0 0 6px 0; font-size: 20px; letter-spacing: -0.5px; font-weight: bold;">Smart Link NG</h1>
          <p style="margin: 0; font-size: 13px; color: #93C5FD; font-weight: 500;">New Manual Application Submission</p>
        </div>

        <!-- Banner Alert -->
        <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 14px 20px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; font-weight: bold;">
            🚀 New Order: ${serviceName}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4B5563;">
            Reference ID: <strong style="font-family: monospace;">${reference}</strong> | Submitted: ${timestamp}
          </p>
        </div>

        <!-- Content Body -->
        <div style="padding: 24px;">
          
          <!-- User Summary Card -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Customer Overview</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Full Name:</strong> ${userFullName}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Account Email:</strong> ${userEmail}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>User ID:</strong> <code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px;">${effectiveUserId}</code></p>
            <p style="margin: 0; font-size: 14px;"><strong>Fee Paid:</strong> ₦${numericFee.toLocaleString()} (Debited from User Wallet)</p>
          </div>

          <!-- Application Details Table -->
          <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0F2D5C; border-bottom: 2px solid #0F2D5C; padding-bottom: 6px;">Submitted Information & Fields</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px;">
            <tbody>
              ${formRowsHtml}
              ${filesRowsHtml}
            </tbody>
          </table>

          <!-- Action Footer -->
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
              ✓ All attachments have been sent directly to this email in high resolution.
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803D;">
              You can now proceed with portal submission on CAC / Immigration / FIRS portals for this client.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 16px 24px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #6B7280;">
          <p style="margin: 0;">SmartLink Digital Services • Automated Manual Services Dispatcher</p>
          <p style="margin: 4px 0 0 0;">Delivered directly to: ${targetEmail}</p>
        </div>

      </div>
    </body>
    </html>
  `;

  // 6. Send Email via Transporter
  let emailSentSuccessfully = false;
  let emailErrorMsg: string | null = null;

  try {
    const transporter = getEmailTransporter(db);
    
    if (transporter) {
      // Attachments formatted for nodemailer
      const mailAttachments = savedAttachments.map((att) => ({
        filename: att.filename,
        path: att.path,
        contentType: att.contentType,
      }));

      const senderEmail = db.system_settings?.email?.smtpUser || process.env.SMTP_USER || "notifications@smartlink.ng";
      const mailOptions = {
        from: `"SmartLink Services" <${senderEmail}>`,
        to: targetEmail,
        replyTo: formData.applicantEmail || formData.proprietorEmail || formData.contactEmail || userEmail,
        subject: `[NEW FILING] ${serviceName} - ${formData.proposedName1 || formData.companyName1 || formData.fullName || userFullName} (${reference})`,
        html: emailHtml,
        attachments: mailAttachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Manual Services Mailer] Email dispatched to ${targetEmail}. MessageId: ${info?.messageId || "ok"}`);
      emailSentSuccessfully = true;
    } else {
      console.log(`[Manual Services Dispatch] Filing order ${reference} successfully saved to local database & disk storage.`);
    }
  } catch (mailErr: any) {
    console.warn(`[Manual Services Mailer] Note on email dispatch:`, mailErr?.message);
    emailErrorMsg = mailErr?.message;
  }

  // 7. Store in Local Database so Admin can also see in Admin Orders dashboard
  if (!db.manual_service_orders) {
    db.manual_service_orders = [];
  }

  const orderRecord = {
    id: reference,
    serviceId,
    serviceName,
    userId: effectiveUserId,
    userEmail,
    userFullName,
    formData,
    filesSummary,
    fee: numericFee,
    dispatchedToEmail: targetEmail,
    emailDispatched: emailSentSuccessfully,
    status: "PROCESSING",
    createdAt: new Date().toISOString(),
  };

  db.manual_service_orders.unshift(orderRecord);
  writeDB(db);

  // Return clean success response
  return res.json({
    success: true,
    message: "Submitted Successfully",
    reference,
    balance: debitResult?.wallet?.currentBalance ?? user?.walletBalance,
  });
});

/**
 * GET /api/admin/manual-services/orders (Admin Only)
 * View all manual service submissions
 */
app.get("/api/admin/manual-services/orders", requireAdmin, async (req, res) => {
  const db = readDB();
  const orders = db.manual_service_orders || [];
  res.json({
    success: true,
    orders,
    total: orders.length,
  });
});

export default app;
