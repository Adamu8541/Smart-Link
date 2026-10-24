import express from "express";
import { readDB, writeDB } from "../db";
import { adminAuthService } from "../../src/services/adminAuthService";
import { getResolvedSmtpConfig, sendPlatformEmail } from "../services/email.service";
import { getFilteredRecipients, getAllPlatformRecipients } from "../services/emailRecipient.service";
import { dispatchEmailCampaign, getCampaignQueueStatus, renderNewsletterHtml } from "../services/emailQueue.service";
import { getSupabaseAdmin } from "../services/supabaseAdmin";

const router = express.Router();

async function verifyAdmin(req: express.Request, res: express.Response): Promise<{ valid: boolean; email?: string; error?: string }> {
  const token = (req.headers["x-admin-token"] as string) || (req.headers["authorization"]?.replace("Bearer ", "")) || "";
  if (!token) {
    return { valid: false, error: "Missing admin authorization token." };
  }
  const db = readDB();
  const val = await adminAuthService.validateSession(db, token);
  if (!val.valid || !val.session) {
    return { valid: false, error: "Unauthorized admin session." };
  }
  return { valid: true, email: val.session.email };
}

// 1. GET /api/admin/emails/recipients - Preview recipients & count
router.get("/api/admin/emails/recipients", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const mode = (req.query.mode as any) || "all";
  const filterType = (req.query.filterType as any) || "all";
  const emailsParam = (req.query.emails as string) || "";
  const selectedEmails = emailsParam ? emailsParam.split(",").map(e => e.trim()).filter(Boolean) : [];

  try {
    const recipients = await getFilteredRecipients({
      mode,
      selectedEmails,
      filterType,
    });

    return res.json({
      success: true,
      count: recipients.length,
      recipients: recipients.slice(0, 100),
      totalMatched: recipients.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch recipients" });
  }
});

// 2. GET /api/admin/emails/directory & /recipients-list - Get user directory
router.get(["/api/admin/emails/directory", "/api/admin/emails/recipients-list"], async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  try {
    const allUsers = await getAllPlatformRecipients();
    return res.json({
      success: true,
      users: allUsers,
      count: allUsers.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch user directory" });
  }
});

// 3. POST /api/admin/emails/send & /api/admin/emails/campaigns - Unified dispatch endpoint
router.post(["/api/admin/emails/send", "/api/admin/emails/campaigns", "/api/admin/emails/dispatch"], async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const {
    isTest,
    testEmail,
    title,
    subject,
    senderName = "SmartLink NG",
    recipientMode = "all",
    filterType = "all",
    selectedEmails = [],
    recipients = [],
    templateId,
    body,
    message,
    bannerHeadline,
    ctaLabel,
    ctaUrl,
    attachments = [],
  } = req.body;

  const emailSubject = (subject || title || "").trim();
  const emailBody = (body || message || "").trim();

  if (!emailSubject) {
    return res.status(400).json({ success: false, message: "Email subject line is required." });
  }
  if (!emailBody) {
    return res.status(400).json({ success: false, message: "Email message body is required." });
  }

  // Handle single test email dispatch mode
  if (isTest || testEmail) {
    const targetEmail = (testEmail || auth.email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid test email address is required." });
    }

    try {
      const html = renderNewsletterHtml({
        subject: emailSubject,
        body: emailBody,
        senderName,
        bannerHeadline: bannerHeadline || "Test Broadcast Notice",
        ctaLabel: ctaLabel || "View Dashboard",
        ctaUrl: ctaUrl || "https://smartlinkng.com.ng/dashboard",
        recipientName: "Admin Tester",
        recipientEmail: targetEmail,
        walletBalance: 25000.0,
      });

      const formattedAttachments = Array.isArray(attachments) ? attachments.map((att: any) => ({
        filename: att.filename || att.name || "attachment",
        base64Content: att.base64Content || att.data || att.content || "",
        contentType: att.contentType || att.type || "application/octet-stream",
      })).filter(att => att.base64Content) : [];

      const result = await sendPlatformEmail({
        to: targetEmail,
        subject: `[TEST] ${emailSubject}`,
        html,
        senderName,
        attachments: formattedAttachments,
      });

      if (result.success) {
        return res.json({
          success: true,
          message: `Test email successfully dispatched to ${targetEmail}. Check your inbox!`,
          messageId: result.messageId,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || result.error || "Failed to dispatch test email.",
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || "Failed to send test email" });
    }
  }

  // Handle main campaign broadcast
  try {
    let rawRecipients: string[] = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      rawRecipients = recipients.map((r: any) => (typeof r === "string" ? r : r.email || "")).filter(Boolean);
    } else if (Array.isArray(selectedEmails) && selectedEmails.length > 0) {
      rawRecipients = selectedEmails;
    }

    const filteredRecipients = await getFilteredRecipients({
      mode: recipientMode,
      selectedEmails: rawRecipients,
      filterType,
    });

    if (filteredRecipients.length === 0) {
      return res.status(400).json({ success: false, message: "No valid recipients found matching the specified criteria." });
    }

    const campaignId = `CAMP_${Date.now()}`;
    const supaAdmin = getSupabaseAdmin();

    if (supaAdmin) {
      await supaAdmin.from("email_campaigns").insert({
        id: campaignId,
        title: emailSubject,
        subject: emailSubject,
        sender_name: senderName,
        recipient_mode: recipientMode,
        filter_criteria: { filterType, count: filteredRecipients.length },
        recipients_list: rawRecipients,
        template_id: templateId || null,
        body: emailBody,
        banner_headline: bannerHeadline || null,
        cta_label: ctaLabel || null,
        cta_url: ctaUrl || null,
        status: "processing",
        total_count: filteredRecipients.length,
        sent_count: 0,
        failed_count: 0,
      });
    }

    const db = readDB();
    if (!db.email_campaigns) db.email_campaigns = [];
    db.email_campaigns.unshift({
      id: campaignId,
      title: emailSubject,
      subject: emailSubject,
      senderName,
      recipientMode,
      totalCount: filteredRecipients.length,
      sentCount: 0,
      failedCount: 0,
      status: "processing",
      timestamp: new Date().toISOString(),
    });
    writeDB(db);

    const formattedAttachments = Array.isArray(attachments) ? attachments.map((att: any) => ({
      filename: att.filename || att.name || "attachment",
      base64Content: att.base64Content || att.data || att.content || "",
      contentType: att.contentType || att.type || "application/octet-stream",
    })).filter(att => att.base64Content) : [];

    dispatchEmailCampaign({
      campaignId,
      subject: emailSubject,
      body: emailBody,
      senderName,
      bannerHeadline,
      ctaLabel,
      ctaUrl,
      recipients: filteredRecipients,
      attachments: formattedAttachments,
    });

    return res.json({
      success: true,
      message: `Email campaign successfully queued for ${filteredRecipients.length} recipients.`,
      campaignId,
      totalRecipients: filteredRecipients.length,
      sentCount: filteredRecipients.length,
    });
  } catch (err: any) {
    console.error("[EmailCampaigns] Dispatch error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to dispatch email campaign" });
  }
});

// 4. GET /api/admin/emails/campaigns & /history - List campaigns
router.get(["/api/admin/emails/campaigns", "/api/admin/emails/history"], async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  try {
    const supaAdmin = getSupabaseAdmin();
    if (supaAdmin) {
      const { data, error } = await supaAdmin.from("email_campaigns").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        const historyList = data.map((c: any) => ({
          id: c.id,
          subject: c.subject,
          recipientMode: c.recipient_mode,
          targetCount: c.total_count,
          sentCount: c.sent_count,
          failedCount: c.failed_count,
          senderName: c.sender_name,
          timestamp: c.created_at || c.updated_at,
        }));
        return res.json({ success: true, campaigns: data, history: historyList });
      }
    }

    const db = readDB();
    const historyList = (db.email_campaigns || []).map((c: any) => ({
      id: c.id,
      subject: c.subject,
      recipientMode: c.recipientMode || "all",
      targetCount: c.totalCount || 0,
      sentCount: c.sentCount || 0,
      failedCount: c.failedCount || 0,
      senderName: c.senderName || "SmartLink NG",
      timestamp: c.timestamp || new Date().toISOString(),
    }));

    return res.json({ success: true, campaigns: db.email_campaigns || [], history: historyList });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch campaigns history" });
  }
});

// 5. GET /api/admin/emails/campaigns/:id - Campaign details & logs
router.get("/api/admin/emails/campaigns/:id", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const { id } = req.params;
  try {
    const supaAdmin = getSupabaseAdmin();
    let campaign: any = null;
    let logs: any[] = [];

    if (supaAdmin) {
      const campRes = await supaAdmin.from("email_campaigns").select("*").eq("id", id).single();
      campaign = campRes.data;

      const logRes = await supaAdmin.from("email_logs").select("*").eq("campaign_id", id).order("created_at", { ascending: false });
      logs = logRes.data || [];
    }

    if (!campaign) {
      const db = readDB();
      campaign = (db.email_campaigns || []).find((c: any) => c.id === id);
    }

    const queueStatus = getCampaignQueueStatus(id);

    return res.json({
      success: true,
      campaign,
      logs,
      queueStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch campaign details" });
  }
});

// 6. POST /api/admin/emails/campaigns/:id/resend-failed - Resend failed
router.post("/api/admin/emails/campaigns/:id/resend-failed", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const { id } = req.params;
  try {
    const supaAdmin = getSupabaseAdmin();
    if (!supaAdmin) {
      return res.status(400).json({ success: false, message: "Supabase connection required for resending failed logs." });
    }

    const { data: campaign, error: campErr } = await supaAdmin.from("email_campaigns").select("*").eq("id", id).single();
    if (campErr || !campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const { data: failedLogs, error: logErr } = await supaAdmin.from("email_logs").select("*").eq("campaign_id", id).eq("status", "failed");
    if (logErr || !failedLogs || failedLogs.length === 0) {
      return res.status(400).json({ success: false, message: "No failed email logs found for this campaign." });
    }

    const failedRecipients = failedLogs.map((l: any) => ({
      email: l.recipient_email,
      name: l.recipient_name || l.recipient_email.split("@")[0],
      source: "supabase" as const,
    }));

    dispatchEmailCampaign({
      campaignId: `${id}_RESEND_${Date.now()}`,
      subject: campaign.subject,
      body: campaign.body,
      senderName: campaign.sender_name,
      bannerHeadline: campaign.banner_headline,
      ctaLabel: campaign.cta_label,
      ctaUrl: campaign.cta_url,
      recipients: failedRecipients,
    });

    return res.json({
      success: true,
      message: `Successfully re-queued retry for ${failedRecipients.length} failed recipients.`,
      retriedCount: failedRecipients.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to resend failed emails" });
  }
});

// 7. GET /api/admin/emails/templates - List templates
router.get("/api/admin/emails/templates", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  try {
    const supaAdmin = getSupabaseAdmin();
    if (supaAdmin) {
      const { data, error } = await supaAdmin.from("email_templates").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return res.json({ success: true, templates: data });
      }
    }

    const db = readDB();
    return res.json({ success: true, templates: db.email_templates || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch templates" });
  }
});

// 8. POST /api/admin/emails/templates - Save template
router.post("/api/admin/emails/templates", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const { id, name, subject, category, bannerHeadline, body, ctaLabel, ctaUrl } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ success: false, message: "Template name, subject, and body are required." });
  }

  try {
    const supaAdmin = getSupabaseAdmin();
    if (supaAdmin) {
      if (id) {
        await supaAdmin.from("email_templates").update({
          name,
          subject,
          category: category || "announcement",
          banner_headline: bannerHeadline,
          body,
          cta_label: ctaLabel,
          cta_url: ctaUrl,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
      } else {
        await supaAdmin.from("email_templates").insert({
          name,
          subject,
          category: category || "announcement",
          banner_headline: bannerHeadline,
          body,
          cta_label: ctaLabel,
          cta_url: ctaUrl,
        });
      }
    }

    return res.json({ success: true, message: "Template successfully saved." });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to save template" });
  }
});

// 9. POST /api/admin/emails/test-send - Test email
router.post("/api/admin/emails/test-send", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  const { testEmail, subject, body, senderName = "SmartLink NG", bannerHeadline, ctaLabel, ctaUrl } = req.body;
  const targetEmail = testEmail || auth.email;

  if (!targetEmail) {
    return res.status(400).json({ success: false, message: "Test email recipient address is required." });
  }

  try {
    const html = renderNewsletterHtml({
      subject: subject || "Test Email from SmartLink Messaging Center",
      body: body || "This is a test broadcast message to verify Gmail SMTP configuration.",
      senderName,
      bannerHeadline: bannerHeadline || "Test Broadcast Preview",
      ctaLabel: ctaLabel || "View Dashboard",
      ctaUrl: ctaUrl || "https://smartlink.ng/dashboard",
      recipientName: "Admin Tester",
      recipientEmail: targetEmail,
      walletBalance: 25000.00,
    });

    const result = await sendPlatformEmail({
      to: targetEmail,
      subject: `[TEST] ${subject || "SmartLink Test Notice"}`,
      html,
      senderName,
    });

    if (result.success) {
      return res.json({ success: true, message: `Test email successfully sent to ${targetEmail}` });
    } else {
      return res.status(400).json({ success: false, message: result.message || result.error });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to send test email" });
  }
});

// 10. GET /api/admin/emails/smtp-health - SMTP health check
router.get("/api/admin/emails/smtp-health", async (req, res) => {
  const auth = await verifyAdmin(req, res);
  if (!auth.valid) return res.status(401).json({ success: false, message: auth.error });

  try {
    const { transporter, config, error } = getResolvedSmtpConfig();
    if (!transporter) {
      return res.status(400).json({ success: false, healthy: false, message: error || "SMTP not configured" });
    }

    await new Promise((resolve, reject) => {
      transporter.verify((err, success) => {
        if (err) reject(err);
        else resolve(success);
      });
    });

    return res.json({
      success: true,
      healthy: true,
      config: {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        senderName: config.senderName,
      },
      message: "SMTP connection verified successfully.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      healthy: false,
      message: `SMTP Connection test failed: ${err.message}`,
    });
  }
});

// 11. GET /api/emails/unsubscribe - Public unsubscribe
router.get("/api/emails/unsubscribe", async (req, res) => {
  const email = (req.query.email as string) || "";
  if (!email || !email.includes("@")) {
    return res.status(400).send("Invalid unsubscribe link.");
  }

  try {
    const supaAdmin = getSupabaseAdmin();
    if (supaAdmin) {
      await supaAdmin.from("email_unsubscribes").upsert({
        email: email.toLowerCase().trim(),
        reason: "User clicked unsubscribe link",
        unsubscribed_at: new Date().toISOString(),
      }, { onConflict: "email" });
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribed - SmartLink NG</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 60px; background-color: #F3F4F6;">
        <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <h2 style="color: #0F2D5C; margin-top: 0;">Unsubscribed Successfully</h2>
          <p style="color: #4B5563; font-size: 14px;">The email address <strong>${email}</strong> has been successfully removed from our promotional mailing list.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">SmartLink Digital Services</p>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    return res.status(500).send("An error occurred while processing your unsubscribe request.");
  }
});

export default router;
