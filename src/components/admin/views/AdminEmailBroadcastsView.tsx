import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Paperclip,
  Sparkles,
  ShieldAlert,
  Megaphone,
  BellRing,
  Tag,
  RefreshCw,
  Search,
  X,
  Check,
  Info,
  Clock,
  Layers,
  HelpCircle,
  Eye,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckSquare,
  Square
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface AdminEmailBroadcastsViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

interface PlatformRecipient {
  email: string;
  name: string;
  walletBalance?: number;
  isVerified?: boolean;
  createdAt?: string;
  source?: string;
}

interface BroadcastHistoryItem {
  id: string;
  subject: string;
  recipientMode: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  senderName: string;
  themeColor?: string;
  timestamp: string;
}

const COLOR_THEMES = [
  {
    id: "navy",
    name: "Executive Navy",
    primary: "#0F2D5C",
    accent: "#2563EB",
    bgClass: "bg-[#0F2D5C]",
    borderClass: "border-[#2563EB]",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    id: "emerald",
    name: "Emerald Wealth",
    primary: "#065F46",
    accent: "#059669",
    bgClass: "bg-[#065F46]",
    borderClass: "border-[#059669]",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    id: "violet",
    name: "Royal Violet",
    primary: "#4C1D95",
    accent: "#7C3AED",
    bgClass: "bg-[#4C1D95]",
    borderClass: "border-[#7C3AED]",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
  },
  {
    id: "crimson",
    name: "Crimson Corporate",
    primary: "#881337",
    accent: "#E11D48",
    bgClass: "bg-[#881337]",
    borderClass: "border-[#E11D48]",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
  },
  {
    id: "amber",
    name: "Amber Gold",
    primary: "#78350F",
    accent: "#D97706",
    bgClass: "bg-[#78350F]",
    borderClass: "border-[#D97706]",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    id: "slate",
    name: "Minimalist Slate",
    primary: "#0F172A",
    accent: "#3B82F6",
    bgClass: "bg-[#0F172A]",
    borderClass: "border-[#3B82F6]",
    badgeClass: "bg-slate-100 text-slate-900 border-slate-300",
  },
];

const PREBUILT_TEMPLATES = [
  {
    id: "system_update",
    name: "System Update & Service Enhancements",
    icon: Megaphone,
    badge: "Announcement",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200",
    theme: "navy",
    subject: "📢 Major Platform Upgrade: Biometric NIN/BVN & Fast Funding active on SmartLink NG",
    bannerHeadline: "SYSTEM ENHANCEMENT NOTICE: 99.99% UPTIME & FAST ROUTING",
    ctaLabel: "Access User Dashboard",
    ctaUrl: "https://smartlinkng.com.ng/dashboard",
    message: `Dear {{name}},

We are pleased to announce critical performance upgrades across SmartLink NG services to elevate your daily verification and automated utility payments.

## What's New in this Release

• **Instant Biometric NIN & BVN Verification**: Ultra-fast photo and record retrieval with 99.99% uptime.
• **Automated Multi-Provider Routing**: Zero downtime failover across our primary and secondary gateway partners.
• **Wallet Balance Synchronization**: Your current wallet balance is {{walletBalance}}. All funding transactions are reconciled in real time.

[HIGHLIGHT]
Priority Routing Active: Enjoy reduced latency and instant callback notifications on all verification endpoints.
[/HIGHLIGHT]

[INFO]
Please ensure your registered profile details are up to date to maintain seamless access to enterprise services.
[/INFO]

Thank you for choosing SmartLink NG as your trusted digital services engine.

Warm regards,
SmartLink Management Team`
  },
  {
    id: "kyc_notice",
    name: "KYC Compliance & Verification Advisory",
    icon: ShieldAlert,
    badge: "Compliance",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200",
    theme: "violet",
    subject: "🔒 Mandatory Identity Verification & Account Security Notice",
    bannerHeadline: "MANDATORY KYC COMPLIANCE ADVISORY",
    ctaLabel: "Complete Verification Now",
    ctaUrl: "https://smartlinkng.com.ng/dashboard",
    message: `Hello {{name}},

This is an important regulatory notice regarding your SmartLink NG account linked to {{email}}.

## Identity Verification Guidelines

To ensure full compliance with central financial and identity regulations, all platform accounts are required to complete biometric KYC verification.

[ALERT]
Accounts without verified identity credentials will be subject to temporary daily transaction limits starting this week.
[/ALERT]

[SUCCESS]
Once submitted, identity verification is processed automatically in under 30 seconds.
[/SUCCESS]

If you have already completed your verification, no further action is required.

Best regards,
SmartLink Security & Compliance Team`
  },
  {
    id: "promotional_offer",
    name: "Developer API & Zero-Fee Promo Advert",
    icon: Sparkles,
    badge: "Promotional",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    theme: "emerald",
    subject: "🔥 Special Advert: Zero-Fee API Access & Bulk Discount on SmartLink NG",
    bannerHeadline: "EXCLUSIVE PROMOTIONAL OFFER: ZERO-FEE VERIFICATIONS",
    ctaLabel: "Explore Developer Portal",
    ctaUrl: "https://smartlinkng.com.ng/dashboard",
    message: `Dear Partner {{name}},

Unlock maximum efficiency for your business with SmartLink NG's Enterprise API Portal!

## Exclusive Promotional Benefits

• **Zero-Fee API Requests**: Enjoy 0% commission on all bulk data & utility subscriptions.
• **Instant Webhooks**: Real-time delivery status push to your server endpoint.
• **Your Wallet Balance**: {{walletBalance}} — ready for automated disbursements.

[HIGHLIGHT]
Limited Time Offer: Get 10% bonus cashback on single wallet fundings above ₦50,000.
[/HIGHLIGHT]

Start integrating our robust API endpoints into your applications today!

Cheers to your growth,
SmartLink Commercial Operations`
  },
  {
    id: "security_alert",
    name: "Urgent Security Alert & Password Advisory",
    icon: AlertTriangle,
    badge: "Security",
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-200",
    theme: "crimson",
    subject: "⚠️ Urgent Security Alert: Mandatory Password Strength Notice",
    bannerHeadline: "SECURITY NOTICE: PROTECT YOUR ACCOUNT CREDENTIALS",
    ctaLabel: "Manage Account Security",
    ctaUrl: "https://smartlinkng.com.ng/dashboard",
    message: `Dear Account Holder {{name}},

At SmartLink NG, safeguarding your account credentials and wallet balance is our utmost priority.

[ALERT]
Never share your login password, PIN, or Email OTP with anyone. SmartLink staff will NEVER ask for your password or PIN.
[/ALERT]

## Security Checklist

• Enable Two-Factor Authentication (2FA) in your security settings.
• Audit active login devices on your dashboard.
• Verify that emails originate from @smartlinkng.com.ng.

[INFO]
If you notice any unauthorized access attempt on {{email}}, change your password immediately or contact our 24/7 helpdesk.
[/INFO]

Stay secure,
SmartLink Information Security`
  }
];

export default function AdminEmailBroadcastsView({ session, onNavigate }: AdminEmailBroadcastsViewProps) {
  // Targeting mode
  const [recipientMode, setRecipientMode] = useState<"selective" | "all" | "individual">("selective");
  
  // Platform users directory
  const [recipientsList, setRecipientsList] = useState<PlatformRecipient[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [userFilterTab, setUserFilterTab] = useState<"all" | "verified" | "funded" | "json">("all");

  // Selected Ticked Email Addresses
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Composer fields
  const [senderName, setSenderName] = useState<string>("SmartLink NG");
  const [themeColor, setThemeColor] = useState<string>("navy");
  const [bannerHeadline, setBannerHeadline] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [ctaLabel, setCtaLabel] = useState<string>("");
  const [ctaUrl, setCtaUrl] = useState<string>("");
  const [individualEmailsInput, setIndividualEmailsInput] = useState<string>("");

  // Attachments
  const [attachments, setAttachments] = useState<{ filename: string; base64Content: string; contentType: string; size?: number }[]>([]);

  // Test Email
  const [testEmailInput, setTestEmailInput] = useState<string>(session.email || "");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; sentCount?: number; failedCount?: number } | null>(null);

  // History & logs
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const getAdminToken = () => {
    if (session?.sessionToken) return session.sessionToken;
    const t1 = localStorage.getItem("smartlink_admin_token") || sessionStorage.getItem("smartlink_admin_token");
    if (t1) return t1;
    const t2 = localStorage.getItem("smartlink_admin_session_token") || sessionStorage.getItem("smartlink_admin_session_token");
    if (t2) return t2;
    try {
      const rawSess = sessionStorage.getItem("smart_link_admin_session") || localStorage.getItem("smartlink_admin_session");
      if (rawSess) {
        const parsed = JSON.parse(rawSess);
        if (parsed.sessionToken) return parsed.sessionToken;
        if (parsed.token) return parsed.token;
      }
    } catch {}
    return session?.uid || "SUPER_ADMIN_SESSION";
  };

  useEffect(() => {
    fetchUsersDirectory();
    fetchHistory();
  }, []);

  const fetchUsersDirectory = async () => {
    setIsLoadingUsers(true);
    try {
      const token = getAdminToken();
      const headers = {
        "x-admin-token": token,
        "x-admin-session-token": token,
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch("/api/admin/emails/recipients-list", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setRecipientsList(data.users);
      } else {
        // Fallback to /api/admin/users
        const fallbackRes = await fetch("/api/admin/users/list", { headers });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.users && Array.isArray(fallbackData.users)) {
          const mapped = fallbackData.users.map((u: any) => ({
            email: u.email,
            name: u.fullName || u.name || u.email?.split("@")[0],
            walletBalance: Number(u.walletBalance || 0),
            isVerified: Boolean(u.isKycVerified || u.isVerified),
          }));
          setRecipientsList(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to load recipients list", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/emails/history", {
        headers: {
          "x-admin-token": token,
          "x-admin-session-token": token,
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch broadcast history", err);
    }
  };

  const handleSelectTemplate = (tmpl: typeof PREBUILT_TEMPLATES[0]) => {
    setSubject(tmpl.subject);
    setBannerHeadline(tmpl.bannerHeadline);
    setMessage(tmpl.message);
    setThemeColor(tmpl.theme);
    setCtaLabel(tmpl.ctaLabel);
    setCtaUrl(tmpl.ctaUrl);
  };

  // User ticking handlers
  const toggleSelectEmail = (email: string) => {
    const target = email.toLowerCase().trim();
    if (!target) return;
    setSelectedEmails((prev) =>
      prev.includes(target) ? prev.filter((e) => e !== target) : [...prev, target]
    );
  };

  const selectAllFilteredUsers = () => {
    const emails = filteredUsers.map((u) => u.email.toLowerCase().trim()).filter((e) => e && e.includes("@"));
    setSelectedEmails(Array.from(new Set([...selectedEmails, ...emails])));
  };

  const deselectAllUsers = () => {
    setSelectedEmails([]);
  };

  const removeTickedEmail = (emailToRemove: string) => {
    setSelectedEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const copyTickedEmails = () => {
    if (selectedEmails.length === 0) return;
    navigator.clipboard.writeText(selectedEmails.join(", "));
    alert(`Copied ${selectedEmails.length} email address(es) to clipboard!`);
  };

  // Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files as ArrayLike<File>).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1] || "";
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            base64Content: base64String,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick insertion helpers into message textarea
  const insertTextAtCursor = (insertionText: string) => {
    setMessage((prev) => prev + (prev ? "\n" : "") + insertionText);
  };

  // Send Test Email Action
  const handleSendTestEmail = async () => {
    if (!testEmailInput || !testEmailInput.includes("@")) {
      alert("Please enter a valid test email address.");
      return;
    }
    if (!subject.trim()) {
      alert("Please enter an email subject line.");
      return;
    }
    if (!message.trim()) {
      alert("Please enter the email message body.");
      return;
    }

    setIsSendingTest(true);
    setSendResult(null);

    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
          "x-admin-session-token": token,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          isTest: true,
          testEmail: testEmailInput,
          subject,
          message,
          senderName,
          themeColor,
          bannerHeadline,
          ctaLabel,
          ctaUrl,
          attachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: `Test email sent successfully to ${testEmailInput}! Check your inbox to verify layout and formatting.`,
        });
      } else {
        setSendResult({
          success: false,
          message: data.message || "Failed to dispatch test email.",
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || "Error sending test email.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Dispatch Main Broadcast Action
  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert("Please enter an email subject line.");
      return;
    }
    if (!message.trim()) {
      alert("Please enter the email message body.");
      return;
    }

    let targetRecipients: string[] = [];
    if (recipientMode === "all") {
      targetRecipients = recipientsList.map((u) => u.email).filter(Boolean);
    } else if (recipientMode === "selective") {
      targetRecipients = selectedEmails;
    } else {
      targetRecipients = individualEmailsInput.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
    }

    if (targetRecipients.length === 0) {
      alert("Please select or specify at least one valid recipient email address.");
      return;
    }

    setIsSending(true);
    setSendResult(null);


    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
          "x-admin-session-token": token,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientMode,
          recipients: targetRecipients,
          subject,
          message,
          senderName,
          themeColor,
          bannerHeadline,
          ctaLabel,
          ctaUrl,
          attachments,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSendResult({
          success: true,
          message: data.message || `Broadcast completed! Sent to ${data.sentCount} recipient(s).`,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
        });

        // Add item to history log
        const newItem: BroadcastHistoryItem = {
          id: Date.now().toString(),
          subject,
          recipientMode,
          targetCount: targetRecipients.length,
          sentCount: data.sentCount || targetRecipients.length,
          failedCount: data.failedCount || 0,
          senderName,
          themeColor,
          timestamp: new Date().toLocaleString(),
        };
        setHistory((prev) => [newItem, ...prev].slice(0, 50));

        // Clear subject & message after success
        setSubject("");
        setMessage("");
        setBannerHeadline("");
        setCtaLabel("");
        setCtaUrl("");
        setAttachments([]);
      } else {
        setSendResult({
          success: false,
          message: data.message || "Failed to dispatch email broadcast.",
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || "Network error while dispatching broadcast.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Filter user list
  const filteredUsers = recipientsList.filter((u) => {
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (userFilterTab === "verified") return Boolean(u.isVerified);
    if (userFilterTab === "funded") return Number(u.walletBalance || 0) > 0;
    return true;
  });

  const activeThemeObj = COLOR_THEMES.find((t) => t.id === themeColor) || COLOR_THEMES[0];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-gradient-to-r from-[#0F2D5C] via-[#17407E] to-[#1E3A8A] text-white p-6 md:p-8 rounded-2xl shadow-xl border border-blue-900/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-white/20 text-blue-100 text-xs font-mono font-bold tracking-wider uppercase">
              ENTERPRISE BROADCASTING ENGINE
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Gmail SMTP Active
            </span>
            <span className="px-3 py-1 rounded-md bg-amber-500/20 text-amber-200 text-xs font-mono font-bold border border-amber-400/20">
              {recipientsList.length} Total Users Available
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-300 shrink-0" />
            Email Broadcast & Newsletter Studio
          </h1>
          <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
            Dispatch high-converting announcements, security notices, and promotional newsletters directly to user inboxes. Fully equipped with multi-section color styling, selective user ticking, and real-time previews.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/25 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Eye className="h-4 w-4" /> Live Visual Preview
          </button>
        </div>
      </div>

      {/* Result Alert Notice */}
      {sendResult && (
        <div className={`p-4 rounded-2xl border flex items-start gap-4 shadow-md transition-all ${
          sendResult.success 
            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100" 
            : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
        }`}>
          {sendResult.success ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">
            <h4 className="font-bold text-base">{sendResult.success ? "Operation Successful" : "Dispatch Notice"}</h4>
            <p className="mt-1 leading-relaxed">{sendResult.message}</p>
          </div>
          <button
            onClick={() => setSendResult(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Ticked Emails Bar (Always Visible when emails are selected in Selective Mode) */}
      {recipientMode === "selective" && (
        <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200 dark:border-blue-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                Directly Ticked Recipient Emails ({selectedEmails.length})
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs">
                {selectedEmails.length} Ticked
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyTickedEmails}
                disabled={selectedEmails.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Ticked List
              </button>

              <button
                type="button"
                onClick={deselectAllUsers}
                disabled={selectedEmails.length === 0}
                className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Selection
              </button>
            </div>
          </div>

          {selectedEmails.length === 0 ? (
            <p className="text-xs text-blue-700 dark:text-blue-300 italic">
              No users selected yet. Tick user checkboxes below or click "Select All Filtered Users" to populate recipient targets.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2.5 max-h-36 overflow-y-auto pr-1">
              {selectedEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 text-xs font-semibold border-2 border-blue-400 dark:border-blue-700 shadow-xs"
                >
                  <div className="h-4 w-4 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="font-mono">{email}</span>
                  <button
                    type="button"
                    title="Untick email"
                    onClick={() => removeTickedEmail(email)}
                    className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-500 cursor-pointer transition-colors ml-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Pre-Built Templates */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" /> Pre-Built Professional Email Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PREBUILT_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{tmpl.name}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Load Layout & Style</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Broadcast Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form & User Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          <form onSubmit={handleDispatchBroadcast} className="space-y-6">
            
            {/* 1. RECIPIENT GROUP TARGETING */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" /> Step 1: Select Email Recipients
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Target Mode: <strong className="text-blue-600 uppercase">{recipientMode}</strong>
                </span>
              </div>

              {/* Recipient Mode Radio Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRecipientMode("selective")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientMode === "selective"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 text-blue-950 dark:text-blue-100 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Specific Ticked Users
                    </span>
                    {recipientMode === "selective" && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Directly tick single or multiple users from directory ({selectedEmails.length} ticked)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode("all")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientMode === "all"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 text-blue-950 dark:text-blue-100 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" /> All Platform Users
                    </span>
                    {recipientMode === "all" && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Broadcast to all registered platform users ({recipientsList.length} users)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode("individual")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientMode === "individual"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 text-blue-950 dark:text-blue-100 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-indigo-600" /> Custom Raw List
                    </span>
                    {recipientMode === "individual" && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Type or paste comma-separated email list
                  </p>
                </button>
              </div>

              {/* Selective User Directory Table/List */}
              {recipientMode === "selective" && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setUserFilterTab("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userFilterTab === "all"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        All ({recipientsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserFilterTab("verified")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userFilterTab === "verified"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        KYC Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserFilterTab("funded")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userFilterTab === "funded"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        Funded Wallets
                      </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-medium"
                      />
                      {userSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery("")}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Select Actions Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Showing {filteredUsers.length} user(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFilteredUsers}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5" /> Select All ({filteredUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllUsers}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Square className="h-3.5 w-3.5" /> Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Users Scrollable List */}
                  {isLoadingUsers ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" /> Loading platform recipients...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching user records found. Try adjusting search query.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-white dark:bg-slate-900">
                      {filteredUsers.map((u) => {
                        const isTicked = selectedEmails.includes(u.email.toLowerCase().trim());
                        return (
                          <div
                            key={u.email}
                            onClick={() => toggleSelectEmail(u.email)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                              isTicked
                                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 font-bold shadow-2xs"
                                : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                                  isTicked
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                }`}
                              >
                                {isTicked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  {u.name}
                                  {u.isVerified && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                                      KYC Verified
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                              </div>
                            </div>

                            <div className="text-right text-[11px]">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                ₦{Number(u.walletBalance || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Individual Raw Emails Input */}
              {recipientMode === "individual" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter Recipient Emails (comma, space, or line separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="user1@example.com, user2@domain.com, client@partner.org"
                    value={individualEmailsInput}
                    onChange={(e) => setIndividualEmailsInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* 2. THEME & HEADER CONFIGURATION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="h-5 w-5 text-blue-600" /> Step 2: Select Color Palette & Branding
              </h3>

              {/* Color Themes Palette Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Email Visual Color Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        themeColor === theme.id
                          ? "bg-slate-100 dark:bg-slate-800 border-2 border-blue-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`h-4 w-4 rounded-full ${theme.bgClass}`} />
                        {themeColor === theme.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Name & Subject Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 📢 Important Platform Upgrade Notice"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Banner Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-blue-600" /> Header Alert Banner Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SYSTEM NOTICE: Mandatory Biometric Verification Requirement"
                  value={bannerHeadline}
                  onChange={(e) => setBannerHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* 3. MESSAGE COMPOSER & SECTIONS TOOLBAR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" /> Step 3: Message Content & Visual Sections
                </h3>
                <span className="text-xs font-mono text-slate-400">Supports HTML & Custom Cards</span>
              </div>

              {/* Quick Section Inserter Toolbar */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Insert Structured Colored Sections & Personalization Tokens
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("## Section Title Heading")}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Headline Section
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("[HIGHLIGHT]\nEnter your key highlight message here...\n[/HIGHLIGHT]")}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Highlight Card
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("[SUCCESS]\nYour account or transaction has been confirmed.\n[/SUCCESS]")}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Success Card
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("[ALERT]\nPlease complete verification before deadline.\n[/ALERT]")}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Warning Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("[INFO]\nRoutine system maintenance scheduled.\n[/INFO]")}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Advisory Box
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("{{name}}")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    &#123;&#123;name&#125;&#125;
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("{{walletBalance}}")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    &#123;&#123;walletBalance&#125;&#125;
                  </button>
                </div>
              </div>

              {/* Message Content Area */}
              <div className="space-y-1.5">
                <textarea
                  rows={9}
                  required
                  placeholder="Type your message body here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              {/* CTA Action Button Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-600" /> Optional Call-to-Action (CTA) Button
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Button Text (e.g. Access User Portal)"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                  <input
                    type="url"
                    placeholder="Destination Link URL (https://smartlinkng.com.ng/dashboard)"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Document Attachments */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-blue-600" /> Attach Files & Certificates ({attachments.length})
                  </label>
                  <label className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold cursor-pointer transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Attach Document
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="font-bold truncate">{att.filename}</span>
                          <span className="text-slate-400 text-[10px]">({Math.round((att.size || 0) / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. STICKY FLOATING MAIN DISPATCH & TEST ACTION BAR */}
            <div className="sticky bottom-4 z-40 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/40 dark:border-blue-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              
              {/* Send Test Email Box */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="email"
                  placeholder="Test inbox email..."
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 w-full sm:w-64 font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 text-blue-950 dark:text-blue-100 font-extrabold text-xs flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 transition-all border border-blue-300 dark:border-blue-700 shadow-2xs"
                >
                  {isSendingTest ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <Send className="h-4 w-4 text-blue-600" />
                  )}
                  Send 1-Click Test
                </button>
              </div>

              {/* Main Mass Dispatch Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1F40] text-white font-black text-sm shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0 border-2 border-[#1E40AF]"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin text-white" /> Dispatching Emails...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 text-white" />
                    {recipientMode === "selective"
                      ? `🚀 Dispatch to ${selectedEmails.length} Ticked Users`
                      : recipientMode === "all"
                      ? `🚀 Broadcast to All ${recipientsList.length} Users`
                      : `🚀 Dispatch to Custom Email List`}
                  </>
                )}
              </button>

            </div>


          </form>

        </div>

        {/* Right Col: Info & Past Broadcast Audit History */}
        <div className="space-y-6">
          
          {/* SMTP Transporter Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldAlert className="h-4 w-4 text-emerald-600" /> Gmail SMTP Infrastructure
            </h3>
            
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">Connection Status</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Active & Verified
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>Emails are securely dispatched via authenticated TLS Gmail SMTP with 100% inbox landing optimization.</p>
              
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                <p className="font-bold text-slate-900 dark:text-white">Active Features:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                  <li>Direct user ticking and bulk selection</li>
                  <li>Multi-color section cards & badges</li>
                  <li>Token replacement (name, email, balance)</li>
                  <li>1-click test email to admin inbox</li>
                  <li>Document attachments support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Audit History Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" /> Recent Broadcast Logs
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{history.length} logged</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No broadcast history recorded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-blue-600 uppercase">
                        {item.recipientMode} MODE
                      </span>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>

                    <p className="font-bold text-slate-900 dark:text-white line-clamp-2">{item.subject}</p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-500">Targets: <strong>{item.targetCount || item.sentCount}</strong></span>
                      <span className="text-emerald-600 font-bold">Sent: {item.sentCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Visual Email Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Layout & Style Preview</h3>
                  <p className="text-[11px] text-slate-500">Theme Palette: <strong className="uppercase">{activeThemeObj.name}</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      previewDevice === "desktop" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      previewDevice === "mobile" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Render Canvas */}
            <div className="p-6 bg-slate-100 dark:bg-slate-950 flex-1 overflow-y-auto flex justify-center">
              <div
                className={`bg-white text-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-300 font-sans transition-all ${
                  previewDevice === "mobile" ? "max-w-[380px] w-full" : "max-w-[640px] w-full"
                }`}
              >
                {/* Simulated Header */}
                <div className="p-6 text-white" style={{ backgroundColor: activeThemeObj.primary }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-9 w-auto object-contain bg-white/10 p-1 rounded-lg"
                      />
                      <div>
                        <h1 className="text-lg font-extrabold uppercase tracking-tight text-white">Smart Link NG</h1>
                        <p className="text-xs text-blue-200">{senderName} • Official Notice</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Banner Headline */}
                <div className="p-4 bg-blue-50 border-l-4 border-blue-600 border-b border-slate-200">
                  <p className="text-xs font-bold text-blue-900">📢 {bannerHeadline || subject || "Sample Email Subject Line"}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Dispatched: {new Date().toLocaleString()}</p>
                </div>

                {/* Message Content Body */}
                <div className="p-6 text-xs leading-relaxed space-y-3 font-sans text-slate-800">
                  <p>Dear <strong>Valued Customer</strong>,</p>
                  
                  <div className="whitespace-pre-line">
                    {message || "Your composed email message body will appear here with dynamic colored sections, highlight cards, and call-to-action buttons."}
                  </div>

                  {ctaLabel && ctaUrl && (
                    <div className="text-center py-4">
                      <a
                        href={ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-6 py-3 rounded-lg text-white font-bold text-xs uppercase shadow-md"
                        style={{ backgroundColor: activeThemeObj.accent }}
                      >
                        {ctaLabel} →
                      </a>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-[11px] text-slate-700">📎 Attached Documents ({attachments.length}):</p>
                      {attachments.map((att, i) => (
                        <p key={i} className="text-[10px] text-slate-600">• {att.filename}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">SmartLink Digital Services • Customer Communications Engine</p>
                  <p>© {new Date().getFullYear()} {senderName}. All rights reserved.</p>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-900 dark:text-white font-bold text-xs cursor-pointer"
              >
                Close Visual Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
