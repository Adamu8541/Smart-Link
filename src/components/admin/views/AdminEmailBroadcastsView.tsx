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
  Eye
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface AdminEmailBroadcastsViewProps {
  session: AdminSession;
  onNavigate: (routePath: string) => void;
}

interface UserRecord {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  role?: string;
  status?: string;
}

interface BroadcastHistoryItem {
  id: string;
  subject: string;
  recipientMode: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  senderName: string;
  timestamp: string;
}

const EMAIL_TEMPLATES = [
  {
    id: "announcement",
    name: "System Announcements & Platform Updates",
    icon: Megaphone,
    badge: "Announcement",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    subject: "📢 Major Platform Update & New Features on SmartLink NG",
    message: `Dear Valued User,\n\nWe are excited to announce major performance upgrades and new digital service integrations on SmartLink NG to elevate your daily transactions and verifications.\n\nWhat's New:\n• Instant NIN, BVN, and CAC Verification with enhanced biometric photo retrieval.\n• Automated multi-provider failover routing for 99.99% uptime.\n• Upgraded wallet funding speed and automated reconciliation.\n\nThank you for choosing SmartLink NG as your trusted digital platform.\n\nBest regards,\nSmartLink Management Team`
  },
  {
    id: "reminder",
    name: "Service Reminders & Account Notices",
    icon: BellRing,
    badge: "Reminder",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    subject: "⚡ Important Service Notice & Account Activity Reminder",
    message: `Hello,\n\nThis is a routine service reminder regarding your SmartLink NG account. Please ensure your KYC verification details are up to date to enjoy uninterrupted access to all verification and utility services.\n\nIf you have any pending transactions or support requests, our 24/7 helpdesk is ready to assist you.\n\nWarm regards,\nSmartLink Client Services`
  },
  {
    id: "promotional",
    name: "Promotional Offers & Feature Adverts",
    icon: Sparkles,
    badge: "Promo",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    subject: "🔥 Special Discount & New Feature Advert: Zero-Fee API Access",
    message: `Dear Partner,\n\nUnlock unlimited potential with our new promotional offer! For a limited time, enjoy reduced pricing and priority routing on all bulk BVN, NIN, and corporate CAC verification endpoints.\n\nExplore our Developer API portal today to integrate robust identity verification seamlessly into your enterprise applications.\n\nCheers to your growth,\nSmartLink Commercial Team`
  },
  {
    id: "security",
    name: "Security Alerts & Compliance Updates",
    icon: ShieldAlert,
    badge: "Security",
    color: "bg-rose-500/10 text-rose-600 border-rose-200",
    subject: "🔒 Security Alert: Mandatory Compliance & Account Protection Guidelines",
    message: `Dear Account Holder,\n\nAt SmartLink NG, safeguarding your account and transactional data is our highest priority. We have recently upgraded our security protocols with multi-factor authentication and advanced session locking.\n\nPlease review your active login sessions in your Account Security settings and ensure your password meets enterprise strength standards.\n\nStay secure,\nSmartLink Security & Compliance Operations`
  }
];

export default function AdminEmailBroadcastsView({ session, onNavigate }: AdminEmailBroadcastsViewProps) {
  const [recipientMode, setRecipientMode] = useState<"all" | "selective" | "individual">("all");
  const [senderName, setSenderName] = useState<string>("SmartLink NG");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [individualEmailsInput, setIndividualEmailsInput] = useState<string>("");
  
  // Users for selective mode
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Attachments
  const [attachments, setAttachments] = useState<{ filename: string; base64Content: string; contentType: string; size?: number }[]>([]);
  
  // Sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; sentCount?: number; failedCount?: number } | null>(null);

  // Broadcast History
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  // Preview toggle
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
    // Load local history if any
    const storedHistory = localStorage.getItem("smartlink_admin_email_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {}
    }
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/users", {
        headers: {
          "x-admin-token": token,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users for email targeting", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSelectTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

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

  const toggleUserSelection = (email: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert("Please enter an email subject.");
      return;
    }
    if (!message.trim()) {
      alert("Please enter email message body.");
      return;
    }

    let recipients: string[] = [];
    if (recipientMode === "all") {
      recipients = users.map((u) => u.email).filter(Boolean);
    } else if (recipientMode === "selective") {
      recipients = selectedUserIds;
    } else {
      recipients = individualEmailsInput.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
    }

    if (recipients.length === 0) {
      alert("Please specify at least one valid recipient email address.");
      return;
    }

    if (!confirm(`Are you sure you want to broadcast this email to ${recipients.length} recipient(s) via Gmail SMTP?`)) {
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          recipientMode,
          recipients,
          subject,
          message,
          senderName,
          attachments,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSendResult({
          success: true,
          message: data.message || `Successfully dispatched email to ${data.sentCount || recipients.length} recipients!`,
          sentCount: data.sentCount || recipients.length,
          failedCount: data.failedCount || 0,
        });

        // Add to history
        const newItem: BroadcastHistoryItem = {
          id: Date.now().toString(),
          subject,
          recipientMode,
          recipientsCount: recipients.length,
          sentCount: data.sentCount || recipients.length,
          failedCount: data.failedCount || 0,
          senderName,
          timestamp: new Date().toLocaleString(),
        };
        const updatedHistory = [newItem, ...history].slice(0, 50);
        setHistory(updatedHistory);
        localStorage.setItem("smartlink_admin_email_history", JSON.stringify(updatedHistory));

        // Reset form slightly
        setSubject("");
        setMessage("");
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
        message: err.message || "Network error while sending email broadcast.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.fullName || u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#0F2D5C] to-[#17407E] text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-white/20 text-blue-100 text-xs font-mono font-bold tracking-wide">COMMUNICATIONS</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Gmail SMTP Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Email Broadcasts & Messaging Center</h1>
          <p className="text-sm text-blue-200">
            Dispatch professional newsletters, system announcements, security alerts, and promotional campaigns directly to users via Gmail SMTP.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
          >
            <Eye className="h-4 w-4" /> Preview Email Layout
          </button>
        </div>
      </div>

      {/* Result Alert */}
      {sendResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          sendResult.success 
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200" 
            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
        }`}>
          {sendResult.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">
            <p className="font-bold">{sendResult.success ? "Broadcast Dispatched Successfully!" : "Dispatch Error"}</p>
            <p className="mt-0.5">{sendResult.message}</p>
          </div>
          <button onClick={() => setSendResult(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Template Selection Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Professional Pre-Built Email Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMAIL_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${tmpl.color}`}>
                      {tmpl.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{tmpl.name}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Apply Template</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Broadcast Composer Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Mail className="h-5 w-5 text-blue-600" /> Compose Email Broadcast
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-6">
              
              {/* Recipient Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Recipient Group
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecipientMode("all")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      recipientMode === "all"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-xs">All Users</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Broadcast to all registered users ({users.length})</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientMode("selective")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      recipientMode === "selective"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs">Selected Users</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Choose specific users ({selectedUserIds.length} selected)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientMode("individual")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      recipientMode === "individual"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs">Custom Emails</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Type comma-separated email list</p>
                  </button>
                </div>
              </div>

              {/* Conditional Recipient Inputs */}
              {recipientMode === "selective" && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Users ({selectedUserIds.length} chosen)
                    </span>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.email);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserSelection(u.email)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 font-bold"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.fullName || u.name || "User"}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                          <div className={`h-4 w-4 rounded flex items-center justify-center border ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {recipientMode === "individual" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Recipient Email Addresses (comma or space separated)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="user1@example.com, user2@example.com, client@domain.com"
                    value={individualEmailsInput}
                    onChange={(e) => setIndividualEmailsInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Sender Name & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sender Display Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Important Update & Service Notice"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Content / Newsletter Body *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Enter your message content here. HTML tags or plain text with line breaks are supported..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Emails will automatically be rendered in a professional modern newsletter layout with highlight banners, accent cards, and Gmail SMTP branding.
                </p>
              </div>

              {/* Attachments Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-blue-600" /> Attached Documents ({attachments.length})
                  </label>
                  <label className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 text-xs font-bold cursor-pointer transition-colors border border-blue-200 dark:border-blue-800">
                    + Add Files
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="font-bold truncate">{att.filename}</span>
                          <span className="text-slate-500 text-[10px]">({Math.round((att.size || 0) / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Dispatching Broadcast...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Email Broadcast via Gmail SMTP
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Col: Info & Recent Broadcast Logs */}
        <div className="space-y-6">
          
          {/* SMTP Configuration Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldAlert className="h-4 w-4 text-emerald-600" /> Gmail SMTP Infrastructure
            </h3>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">Connection Status</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active & Verified
                </span>
              </div>
              <p className="leading-relaxed">
                Emails are securely routed through authenticated Gmail SMTP servers with TLS encryption ensuring maximum inbox delivery rate.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Supported Features:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                  <li>Modern newsletter layout with header banners</li>
                  <li>Attached documents & certificates support</li>
                  <li>Mass broadcast & targeted selective dispatch</li>
                  <li>Audit logging for compliance tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Broadcast History */}
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
                No broadcast emails sent yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.subject}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Mode: <strong className="text-blue-600">{item.recipientMode}</strong></span>
                      <span>Sent: <strong className="text-emerald-600">{item.sentCount}</strong></span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">{item.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Email Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Newsletter Visual Preview</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 dark:bg-slate-950">
              {/* Simulated Email Card */}
              <div className="max-w-xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 text-slate-900">
                <div className="bg-[#0F2D5C] text-white p-6">
                  <h1 className="text-lg font-bold uppercase tracking-tight">Smart Link NG</h1>
                  <p className="text-xs text-blue-200 mt-0.5">{senderName} • Official Communication</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <p className="text-xs font-bold text-blue-900">📢 {subject || "Sample Email Subject Line"}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Date Dispatched: {new Date().toLocaleString()}</p>
                </div>
                <div className="p-6 text-xs leading-relaxed font-sans whitespace-pre-line text-slate-800">
                  {message || "Your composed email message body will appear here with professional formatting, highlights, and links."}
                </div>
                <div className="mx-6 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-emerald-800 font-semibold">✓ Official communication dispatched securely via SmartLink Digital Services</p>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
                  <p className="font-bold">SmartLink Digital Services • Customer Communications Engine</p>
                  <p className="mt-0.5">© {new Date().getFullYear()} {senderName}. All rights reserved.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
