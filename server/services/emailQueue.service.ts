import { getResolvedSmtpConfig, sendPlatformEmail } from "./email.service";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { getFilteredRecipients, RecipientUser } from "./emailRecipient.service";

interface CampaignJob {
  campaignId: string;
  subject: string;
  body: string;
  senderName: string;
  bannerHeadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipients: RecipientUser[];
  attachments?: Array<{ filename: string; base64Content: string; contentType?: string }>;
}

const activeCampaigns = new Map<string, { status: string; sent: number; failed: number; total: number }>();

export function renderNewsletterHtml(options: {
  subject: string;
  body: string;
  senderName: string;
  bannerHeadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientName: string;
  recipientEmail: string;
  walletBalance?: number;
}): string {
  const {
    subject,
    body,
    senderName,
    bannerHeadline,
    ctaLabel,
    ctaUrl,
    recipientName,
    recipientEmail,
    walletBalance = 0,
  } = options;

  const vars: Record<string, string> = {
    name: recipientName || recipientEmail.split("@")[0],
    email: recipientEmail,
    walletBalance: `₦${Number(walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };

  let personalizedBody = body.replace(/{{\s*name\s*}}/gi, vars.name)
                            .replace(/{{\s*email\s*}}/gi, vars.email)
                            .replace(/{{\s*walletBalance\s*}}/gi, vars.walletBalance);

  const formattedBody = personalizedBody.includes("<p>") || personalizedBody.includes("<br") || personalizedBody.includes("<div")
    ? personalizedBody
    : personalizedBody.replace(/\n/g, "<br/>");

  const timestamp = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "medium" });

  const ctaButtonHtml = ctaLabel && ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${ctaUrl}" style="background-color: #2563EB; color: #FFFFFF; padding: 12px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 10px rgba(37,99,235,0.25);">
          ${ctaLabel}
        </a>
      </div>
    `
    : "";

  const unsubscribeUrl = `https://smartlink.ng/api/emails/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB;">
        <div style="background-color: #0F2D5C; color: #FFFFFF; padding: 24px; text-align: left;">
          <h1 style="margin: 0 0 6px 0; font-size: 20px; letter-spacing: -0.5px; font-weight: bold; text-transform: uppercase;">Smart Link NG</h1>
          <p style="margin: 0; font-size: 13px; color: #93C5FD; font-weight: 500;">${senderName ? `${senderName} • Official Communication` : "Official Customer Notice"}</p>
        </div>
        ${bannerHeadline ? `
        <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 14px 20px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; font-weight: bold;">📢 ${bannerHeadline}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4B5563;">Dispatched: ${timestamp}</p>
        </div>
        ` : ""}
        <div style="padding: 28px; font-family: Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #111827;">
          ${formattedBody}
          ${ctaButtonHtml}
        </div>
        <div style="margin: 0 24px 24px 24px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="margin: 0; font-size: 12.5px; color: #166534; font-weight: 600;">✓ Securely dispatched via SmartLink Verified Digital Services</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 24px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #6B7280;">
          <p style="margin: 0; font-weight: 600;">SmartLink Digital Services • Customer Communications Engine</p>
          <p style="margin: 6px 0 0 0;">© ${new Date().getFullYear()} ${senderName || "SmartLink Digital Services"}. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #2563EB; text-decoration: underline;">Unsubscribe here</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function dispatchEmailCampaign(job: CampaignJob): Promise<{ campaignId: string; total: number }> {
  const { campaignId, subject, body, senderName, bannerHeadline, ctaLabel, ctaUrl, recipients, attachments } = job;
  const supaAdmin = getSupabaseAdmin();

  activeCampaigns.set(campaignId, { status: "processing", sent: 0, failed: 0, total: recipients.length });

  setImmediate(async () => {
    let sentCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 15;
    const BATCH_DELAY_MS = 2000;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (recipient) => {
          let success = false;
          let errorMessage = "";
          let messageId = "";
          let attempts = 0;
          const MAX_RETRIES = 2;

          const htmlContent = renderNewsletterHtml({
            subject,
            body,
            senderName,
            bannerHeadline,
            ctaLabel,
            ctaUrl,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            walletBalance: recipient.walletBalance,
          });

          while (attempts <= MAX_RETRIES && !success) {
            attempts++;
            try {
              const res = await sendPlatformEmail({
                to: recipient.email,
                subject,
                html: htmlContent,
                senderName,
                attachments,
              });

              if (res.success) {
                success = true;
                messageId = res.messageId || "";
                sentCount++;
              } else {
                errorMessage = res.error || res.message || "Unknown SMTP error";
              }
            } catch (err: any) {
              errorMessage = err.message || "Exception during send";
            }

            if (!success && attempts <= MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, attempts * 1500));
            }
          }

          if (!success) {
            failedCount++;
          }

          if (supaAdmin) {
            try {
              await supaAdmin.from("email_logs").insert({
                campaign_id: campaignId,
                recipient_email: recipient.email,
                recipient_name: recipient.name,
                status: success ? "sent" : "failed",
                error_reason: success ? null : errorMessage,
                message_id: messageId,
                retry_count: attempts - 1,
                sent_at: success ? new Date().toISOString() : null,
              });
            } catch (supaErr) {
              console.warn("[EmailQueue] Failed to record email log in Supabase:", supaErr);
            }
          }
        })
      );

      if (supaAdmin) {
        try {
          await supaAdmin.from("email_campaigns").update({
            sent_count: sentCount,
            failed_count: failedCount,
            updated_at: new Date().toISOString(),
          }).eq("id", campaignId);
        } catch {}
      }

      activeCampaigns.set(campaignId, { status: "processing", sent: sentCount, failed: failedCount, total: recipients.length });

      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const finalStatus = failedCount === recipients.length ? "failed" : "completed";
    activeCampaigns.set(campaignId, { status: finalStatus, sent: sentCount, failed: failedCount, total: recipients.length });

    if (supaAdmin) {
      try {
        await supaAdmin.from("email_campaigns").update({
          status: finalStatus,
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        }).eq("id", campaignId);
      } catch {}
    }
  });

  return { campaignId, total: recipients.length };
}

export function getCampaignQueueStatus(campaignId: string) {
  return activeCampaigns.get(campaignId) || null;
}
