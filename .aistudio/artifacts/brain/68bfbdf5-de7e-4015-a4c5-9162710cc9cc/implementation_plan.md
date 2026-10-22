# Email Broadcasts & Communications Center (Admin Dashboard)

A comprehensive email broadcast and user messaging portal integrated into the SmartLink admin dashboard navigation, leveraging the existing Gmail SMTP infrastructure with a modern newsletter design template, flexible targeting (individual, selected, and all users), and pre-built operational templates.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during Phase 1 interactive clarification:
> - **Navigation Placement**: The feature will be positioned in a dedicated **COMMUNICATIONS** navigation group in the left admin sidebar as **Email Broadcasts** with a `Gmail SMTP` status badge.
> - **Delivered Email Aesthetic**: Delivered emails will utilize a **Modern Newsletter Layout** featuring navy/blue brand accents, an official header badge, editorial highlight banners, distinct category cards, rich formatted typography, customizable call-to-action buttons, and compliant footer disclaimers.
> - **Built-in Templates**: Out-of-the-box templates will be supplied for:
>   1. **System Announcements & Platform Updates** (scheduled maintenance, API upgrades, platform enhancements)
>   2. **Service Reminders & Account Notices** (KYC/demographic verification reminders, wallet balance alerts, invoice receipts)
>   3. **Promotional Offers & Feature Adverts** (service discounts, enterprise verification bundles, referral incentives)
>   4. **Security Alerts & Compliance Notices** (account security recommendations, audit notifications, regulatory updates)

---

## 1. Overview & Core Concept

- **What It Does**: Empowers administrators to draft, preview, schedule, and dispatch transactional and marketing emails to users—either individually by searching/selecting specific accounts, by multi-selecting a filtered subset, or by broadcasting to all registered users. Emails are delivered via the platform's pre-configured Gmail SMTP transporter with full error tracking, delivery audit logs, and document attachment support.
- **Target Audience / Persona**: SmartLink platform administrators, compliance managers, and support leads managing customer engagement, notices, and product announcements.
- **Key Value**: Direct, reliable communication channel directly inside the admin panel without requiring third-party SaaS email subscriptions (Mailchimp/SendGrid), fully utilizing existing Gmail SMTP credentials with modern, responsive email delivery.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Access via Admin Sidebar**:
   - Admin navigates via the left sidebar under the new **COMMUNICATIONS** section and clicks **Email Broadcasts** (`/admin/email-broadcasts` or `/admin/notifications`).
   - The view displays the **Gmail SMTP Operational Status** indicator (e.g., Connected to `smtp.gmail.com` via `smartlinkcomputerbusiness@gmail.com`), rapid dispatch metrics, and quick action tabs.

2. **Recipient Selection Modes**:
   - **All Users (`all`)**: Broadcasts to all verified active customer accounts in the database with recipient count dynamically counted.
   - **Selective Users (`selective`)**: An interactive user picker table featuring search, status filter (active/suspended/verified), checkboxes, and pagination allowing the admin to select multiple recipients.
   - **Individual Recipient (`individual`)**: A direct email input or user selector with autocomplete from the customer directory.

3. **Template Loading & Visual Composer**:
   - Admin selects from the template library (Announcements, Reminders, Adverts, Security Alerts) or creates a custom message.
   - The editor includes Subject Line, Banner Headline, Category Tag, Message Body (rich formatting), Call-to-Action (CTA) Label & URL, and File Attachments (drag-and-drop support).
   - An interactive **Live Email Preview** modal/pane renders the exact responsive HTML newsletter layout prior to sending.

4. **Dispatch & Delivery Tracking**:
   - Admin clicks **Send Broadcast**. A confirmation modal displays target count, estimated sending time, and warning for bulk sends.
   - Real-time progress bar shows send status. Upon completion, a toast and detailed summary (sent count, failed count, error list) are presented.
   - The delivery is logged into the **Broadcast History & Audit Ledger**.

### Visual Identity & Theme (SaaS Dashboard & Modern Newsletter)

- **Admin UI Theme**:
  - Dominant canvas: Crisp `#F5F7FA` with `#FFFFFF` elevated container panels and subtle `#E5E7EB` 1px borders.
  - Brand Navy: `#0F2D5C` matching the SmartLink executive theme.
  - Accent colors: `#2563EB` (Royal Blue) for interactive focus and `#16A34A` (Emerald) for verified delivery status.
  - Typography: Clean neo-grotesque hierarchy with `font-mono tabular-nums` for delivery percentages, counts, and timestamps.

- **Delivered Email Template (HTML/CSS)**:
  - Max-width `640px` centered container with responsive mobile padding.
  - High-contrast header with SmartLink logo, official dispatch badge, and header banner.
  - Highlight Accent Card for the primary announcement message.
  - Secondary card blocks for key details, bulleted instructions, or attachment lists.
  - Action button (`#0F2D5C` background, `#FFFFFF` text, `border-radius: 8px`).
  - Professional footer containing organization address, security verification marker, and unsubscribe/support preferences.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Reuse Platform Gmail SMTP Engine (`server/services/email.service.ts`)**:
  - *Chosen Approach*: Directly leverage `sendPlatformEmail()` which already supports `nodemailer`, Gmail App Password normalization, SSL/TLS handling, attachment encoding, and database settings synchronization.
  - *Why*: Eliminates redundant configurations, avoids external dependencies, and honors the user's specific request.
  - *Alternatives Considered*: Creating a separate standalone transporter was rejected as it would create duplicate credentials and configuration drift.

- **Decision 2: Seamless Tab Integration into Existing Notification Architecture**:
  - *Chosen Approach*: Extend the existing `/admin/notifications` route and view (`AdminNotificationsView.tsx`) with dedicated sub-tabs (`BROADCAST_COMPOSER`, `USER_PICKER`, `TEMPLATES`, `HISTORY`, `SMTP_SETTINGS`), while adding direct sidebar navigation under **COMMUNICATIONS** -> **Email Broadcasts**.
  - *Why*: Unifies notification dispatches, audit history, and email broadcasts in a single clean architecture while maintaining permission guards (`MANAGE_USERS`, `MANAGE_SYSTEM`).

- **Decision 3: Server-Authoritative Rate-Limited Sending**:
  - *Chosen Approach*: Process recipient arrays sequentially or in small parallel batches with error containment so a failure on a single invalid email doesn't abort the entire broadcast, reporting successful vs. failed counts in real-time.
  - *Why*: Protects Gmail SMTP limits (500-2,000 emails/day depending on Google Workspace tier) and prevents connection timeouts.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Left Sidebar                              │
│  COMMUNICATIONS -> Email Broadcasts (/admin/email-broadcasts)          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AdminNotificationsView                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│  │ Email Composer   │ │ Recipient Picker │ │ Modern Newsletter       │ │
│  │ (Subject, Body,  │ │ (All / Selected /│ │ Live Preview            │ │
│  │  Banner, CTA)    │ │  Individual)     │ │ (HTML rendering)        │ │
│  └────────┬─────────┘ └────────┬─────────┘ └────────────┬────────────┘ │
│           └────────────────────┼────────────────────────┘              │
│                                ▼                                       │
│                    Dispatch Action [Send Email]                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Express Backend Route                               │
│            POST /api/admin/emails/send-broadcast                       │
│  - Validate Admin Session & Permissions                                │
│  - Target User Resolution (Turso Users DB)                             │
│  - Newsletter HTML Generator (Modern Responsive Template)              │
│  - Attachment Processor (Base64 / MIME)                                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               server/services/email.service.ts                         │
│           sendPlatformEmail() via Nodemailer (Gmail SMTP)              │
│  - smtp.gmail.com : 587 / 465                                          │
│  - Dynamic Fallback & Audit History Logging                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Endpoints

- **Navigation Integration**:
  - Update `ADMIN_NAV_GROUPS` in `src/components/admin/layout/AdminSidebar.tsx`:
    - Add `{ title: "COMMUNICATIONS", items: [{ id: "NAV_EMAIL_BROADCASTS", label: "Email Broadcasts", path: "/admin/email-broadcasts", icon: Mail, ... }] }`
  - Update `routeToViewMap` and `viewToRouteMap` in `src/App.tsx` to route `/admin/email-broadcasts` and `/admin/notifications` smoothly.

- **API Endpoint**:
  - `POST /api/admin/emails/send` / `POST /api/admin/emails/send-broadcast`:
    - Parameters: `{ recipientMode: "all" | "selective" | "individual", recipients: string[], subject, bannerHeadline, message, category, ctaLabel, ctaUrl, senderName, attachments }`
    - Response: `{ success: boolean, sentCount: number, failedCount: number, failedEmails: string[], logId: string }`
  - `GET /api/admin/users/email-list`:
    - Fetches user email directory with search, KYC status, and role for the Selective User Picker.
  - `GET /api/admin/emails/templates`:
    - Returns the 4 default newsletter templates + custom saved templates.

---

## 5. Implementation Phases (Post-Approval)

1. **Sidebar & Route Configuration**:
   - Add **COMMUNICATIONS** section to `AdminSidebar.tsx` with `Email Broadcasts` entry.
   - Sync route mappings in `src/App.tsx` and ensure breadcrumb navigation displays `Admin / Communications / Email Broadcasts`.

2. **Backend Newsletter Generator & Dispatch Handler**:
   - Implement the modern newsletter HTML builder function in `server/services/emailTemplate.service.ts` featuring the highlight banner, accent cards, and CTA button.
   - Update `server/routes/notifications.routes.ts` dispatch loop with batching, detailed delivery logging, and attachment handling.

3. **Frontend Email Broadcast Studio**:
   - Enhance `AdminNotificationsView.tsx` with:
     - Target selector (All users with live count, Searchable multi-user checklist, Individual email).
     - Modern template picker (Announcements, Reminders, Adverts, Security).
     - Live interactive newsletter preview pane.
     - Attachment uploader.
     - Confirmation modal and progress indicator.
     - Historical broadcast logs with status indicators and search.

4. **Verification**:
   - Verify compilation with `compile_applet` and linting with `lint_applet`.
   - Test test-send functionality with configured Gmail SMTP to ensure delivery integrity.
