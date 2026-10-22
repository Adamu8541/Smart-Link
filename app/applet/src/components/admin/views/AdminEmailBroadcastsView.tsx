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
  ShieldCheck,
  Megaphone,
  BellRing,
  Tag,
  RefreshCw,
  Search,
  X,
  Check,
  Clock,
  ArrowRight,
  HelpCircle,
  Eye,
  Play,
  RotateCcw
} from "lucide-react";

export function AdminEmailBroadcastsView({ session, onNavigate }: { session: any; onNavigate: (path: string) => void }) {
  const [activeTab, setActiveTab] = useState<"compose" | "campaigns" | "templates" | "health">("compose");

  // Composer State
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("SmartLink NG");
  const [bannerHeadline, setBannerHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "selective" | "individual">("all");
  const [filterType, setFilterType] = useState<"all" | "new_7_days" | "new_30_days" | "verified" | "unverified" | "has_balance" | "inactive">("all");
  
  // User Directory & Selection
  const [userDirectory, setUserDirectory] = useState<any[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  
  // Recipient Preview Count
  const [previewCount, setPreviewCount] = useState(0);
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Array<{ filename: string; base64Content: string; contentType: string }>>([]);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Campaigns History
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<any>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // SMTP Health
  const [smtpHealth, setSmtpHealth] = useState<any>(null);
  const [isCheckingSmtp, setIsCheckingSmtp] = useState(false);

  // Test Email
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // General Status & Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchTemplates();
    fetchCampaigns();
    checkSmtpHealth();
    fetchUserDirectory();
  }, []);

  // Fetch preview count whenever mode or filter changes
  useEffect(() => {
    fetchRecipientPreview();
  }, [recipientMode, filterType, selectedEmails]);

  const getToken = () => localStorage.getItem("smartlink_admin_token") || "";

  const fetchUserDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const res = await fetch("/api/admin/emails/directory", {
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      if (data.success) {
        setUserDirectory(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load directory", err);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  const fetchRecipientPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams({
        mode: recipientMode,
        filterType,
        emails: selectedEmails.join(","),
      });
      const res = await fetch(`/api/admin/emails/recipients?${params.toString()}`, {
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      if (data.success) {
        setPreviewCount(data.count || 0);
        setPreviewList(data.recipients || []);
      }
    } catch (err) {
      console.error("Failed to preview recipients", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/emails/templates", {
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const res = await fetch("/api/admin/emails/campaigns", {
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const checkSmtpHealth = async () => {
    setIsCheckingSmtp(true);
    try {
      const res = await fetch("/api/admin/emails/smtp-health", {
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      setSmtpHealth(data);
    } catch (err: any) {
      setSmtpHealth({ success: false, healthy: false, message: err.message });
    } finally {
      setIsCheckingSmtp(false);
    }
  };

  const handleApplyTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setSubject(tmpl.subject || "");
      setBannerHeadline(tmpl.banner_headline || "");
      setBody(tmpl.body || "");
      setCtaLabel(tmpl.cta_label || "");
      setCtaUrl(tmpl.cta_url || "");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files as ArrayLike<File>).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            base64Content: base64,
            contentType: file.type || "application/octet-stream",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a subject and email body." });
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch this email broadcast to ${previewCount} recipients?`)) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/emails/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": getToken(),
        },
        body: JSON.stringify({
          title: subject,
          subject,
          senderName,
          recipientMode,
          filterType,
          selectedEmails,
          templateId: selectedTemplateId || null,
          body,
          bannerHeadline,
          ctaLabel,
          ctaUrl,
          attachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: data.message || "Email campaign successfully dispatched to background queue!" });
        setActiveTab("campaigns");
        fetchCampaigns();
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to dispatch email campaign." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error while sending campaign." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmailTarget) return;
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/admin/emails/test-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": getToken(),
        },
        body: JSON.stringify({
          testEmail: testEmailTarget,
          subject,
          body,
          senderName,
          bannerHeadline,
          ctaLabel,
          ctaUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Test email sent successfully!");
        setTestEmailModal(false);
      } else {
        alert(data.message || "Failed to send test email.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send test email.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResendFailed = async (campId: string) => {
    if (!window.confirm("Are you sure you want to re-queue failed emails for this campaign?")) return;
    try {
      const res = await fetch(`/api/admin/emails/campaigns/${campId}/resend-failed`, {
        method: "POST",
        headers: { "x-admin-token": getToken() },
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchCampaigns();
      } else {
        alert(data.message || "Failed to resend failed emails.");
      }
    } catch (err: any) {
      alert(err.message || "Error retrying failed emails.");
    }
  };

  const filteredDirectoryUsers = userDirectory.filter(
    (u) =>
      u.email.toLowerCase().includes(directorySearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Email Messaging Center</h1>
              <p className="text-sm text-slate-500">
                Professional broadcast manager powered by Gmail SMTP & pooled background queue
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkSmtpHealth}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingSmtp ? "animate-spin" : ""}`} />
            SMTP Status: {smtpHealth?.healthy ? <span className="text-emerald-600 font-bold">Connected</span> : <span className="text-amber-600 font-bold">Check</span>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        {[
          { id: "compose", label: "Broadcast Composer", icon: Send },
          { id: "campaigns", label: "Campaign History & Audit", icon: FileText },
          { id: "templates", label: "Email Templates", icon: Sparkles },
          { id: "health", label: "SMTP & Connection Health", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 font-semibold text-sm border-b-2 transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            statusMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{statusMessage.text}</p>
        </div>
      )}

      {/* TAB 1: COMPOSE & BROADCAST */}
      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Composer */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSendCampaign} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                Step 1: Recipient Audience Selection
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "all", label: "All Platform Users", desc: "Broadcast to all verified & active users" },
                  { id: "selective", label: "Selected Users", desc: "Pick specific users from list" },
                  { id: "individual", label: "Individual Email", desc: "Send to single email address" },
                ].map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setRecipientMode(mode.id as any)}
                    className={`p-4 text-left rounded-xl border-2 transition ${
                      recipientMode === mode.id
                        ? "border-blue-600 bg-blue-50/50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900">{mode.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{mode.desc}</p>
                  </button>
                ))}
              </div>

              {recipientMode === "all" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Audience Filter Segment</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
                  >
                    <option value="all">All Active Users</option>
                    <option value="new_7_days">New Users (Joined in last 7 days)</option>
                    <option value="new_30_days">New Users (Joined in last 30 days)</option>
                    <option value="verified">KYC Verified Users Only</option>
                    <option value="unverified">Unverified Users</option>
                    <option value="has_balance">Users with Positive Wallet Balance</option>
                    <option value="inactive">Inactive Users (60+ days)</option>
                  </select>
                </div>
              )}

              {recipientMode === "selective" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Select Recipients ({selectedEmails.length} selected)</label>
                    <div className="relative w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={directorySearch}
                        onChange={(e) => setDirectorySearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                    {filteredDirectoryUsers.map((u) => {
                      const isSelected = selectedEmails.includes(u.email);
                      return (
                        <div
                          key={u.email}
                          onClick={() => {
                            setSelectedEmails((prev) =>
                              isSelected ? prev.filter((e) => e !== u.email) : [...prev, u.email]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                            isSelected ? "bg-blue-100 text-blue-900 font-medium" : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold">{u.name || u.email}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {recipientMode === "individual" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Email Address</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={selectedEmails[0] || ""}
                    onChange={(e) => setSelectedEmails([e.target.value])}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-blue-900 uppercase">Live Target Count</p>
                    <p className="text-sm text-blue-700 font-semibold">{previewCount} Verified Recipients Ready</p>
                  </div>
                </div>
                {isLoadingPreview && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
              </div>

              {/* Template Picker */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Load Pre-built Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
                >
                  <option value="">-- Choose template or write custom --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Highlight Banner Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. 📢 Important Platform Upgrade Notice"
                    value={bannerHeadline}
                    onChange={(e) => setBannerHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exciting New Features & 5% Cashback Rewards"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Message Body *</label>
                  <span className="text-xs text-slate-400">Supports variables: {'{{name}}'}, {'{{email}}'}, {'{{walletBalance}}'}</span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Hello {{name}},&#10;&#10;We are excited to announce..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Call to Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CTA Button Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Access Dashboard"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CTA Destination URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://smartlink.ng/dashboard"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Optional Document Attachments</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-sm font-medium transition">
                    <Paperclip className="w-4 h-4" />
                    Attach Files (PDF, DOCX, PNG)
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-xs font-bold text-blue-600">{attachments.length} file(s) attached</span>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg">
                        📎 {att.filename}
                        <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-600 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTestEmailTarget(session?.email || "");
                    setTestEmailModal(true);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Send Test Email
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || previewCount === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 text-sm transition"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Dispatch Broadcast ({previewCount} Recipients)
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Pane */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Inbox Preview
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
                <div className="bg-slate-100 p-3 border-b border-slate-200 text-slate-600 space-y-1">
                  <p><strong>From:</strong> "{senderName}" &lt;notifications@smartlink.ng&gt;</p>
                  <p><strong>To:</strong> user@example.com</p>
                  <p><strong>Subject:</strong> {subject || "(No Subject)"}</p>
                </div>
                <div className="p-4 bg-white space-y-3 font-sans text-slate-800">
                  {bannerHeadline && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-2.5 text-blue-900 font-bold">
                      {bannerHeadline}
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">
                    {body ? body.replace(/\{\{name\}\}/g, "John Doe").replace(/\{\{walletBalance\}\}/g, "₦25,000.00") : "Your message body preview will appear here..."}
                  </p>
                  {ctaLabel && (
                    <div className="text-center pt-2">
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold inline-block text-xs">
                        {ctaLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGN HISTORY & AUDIT */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campaign History & Delivery Logs</h2>
              <p className="text-xs text-slate-500">Track sent, failed, and in-progress email broadcasts</p>
            </div>
            <button
              onClick={fetchCampaigns}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-4">Campaign Title</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Time Dispatched</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp: any) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {camp.title || camp.subject}
                    </td>
                    <td className="p-4 text-slate-600 text-xs">{camp.sender_name || camp.senderName}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {camp.recipient_mode || camp.recipientMode}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          camp.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : camp.status === "processing"
                            ? "bg-blue-50 text-blue-700 animate-pulse"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {camp.status === "completed" ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <span className="text-emerald-600 font-bold">{camp.sent_count || camp.sentCount || 0} sent</span>
                      {(camp.failed_count || camp.failedCount || 0) > 0 && (
                        <span className="text-red-600 font-bold ml-2">({camp.failed_count || camp.failedCount} failed)</span>
                      )}
                      <span className="text-slate-400"> / {camp.total_count || camp.totalCount || 0}</span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(camp.created_at || camp.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {(camp.failed_count || camp.failedCount || 0) > 0 && (
                        <button
                          onClick={() => handleResendFailed(camp.id)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Resend Failed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && !isLoadingCampaigns && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No past email campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tmpl: any) => (
              <div key={tmpl.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase">
                    {tmpl.category}
                  </span>
                  <button
                    onClick={() => {
                      handleApplyTemplate(tmpl.id);
                      setActiveTab("compose");
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Use Template <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tmpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Subject: {tmpl.subject}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 line-clamp-3 font-mono">
                  {tmpl.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SMTP & CONNECTION HEALTH */}
      {activeTab === "health" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Gmail SMTP Server Health & Diagnostics
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-medium text-slate-700">SMTP Host</span>
              <span className="font-mono font-bold text-slate-900">smtp.gmail.com (Port 587 / SSL)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-medium text-slate-700">Authentication Mode</span>
              <span className="font-semibold text-emerald-600">Google App Password (Secure)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-medium text-slate-700">Connection Status</span>
              <span className={`font-bold ${smtpHealth?.healthy ? "text-emerald-600" : "text-red-600"}`}>
                {smtpHealth?.healthy ? "Healthy & Ready" : "Unhealthy / Not Configured"}
              </span>
            </div>
            {smtpHealth?.message && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                {smtpHealth.message}
              </div>
            )}
          </div>

          <button
            onClick={checkSmtpHealth}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md"
          >
            Run SMTP Diagnostic Test
          </button>
        </div>
      )}

      {/* Test Email Modal */}
      {testEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Send Test Email</h3>
              <button onClick={() => setTestEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Test Recipient Email</label>
              <input
                type="email"
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setTestEmailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleTestSend}
                disabled={isSendingTest}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2"
              >
                {isSendingTest && <RefreshCw className="w-4 h-4 animate-spin" />}
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
