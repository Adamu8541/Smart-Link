import React, { useState, useEffect } from "react";
import { ArrowLeft, Ticket, Upload, X, CheckCircle2, AlertCircle, FileText, Send, Sparkles, Image as ImageIcon } from "lucide-react";

interface CreateTicketViewProps {
  onBack: () => void;
  onTicketCreated: (ticketId: string) => void;
  userEmail?: string;
  userName?: string;
}

export function CreateTicketView({ onBack, onTicketCreated, userEmail = "adamuamuhammad8541@gmail.com", userName = "Adamu A. Muhammad" }: CreateTicketViewProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Wallet Issues");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [relatedService, setRelatedService] = useState("General / Wallet");
  const [relatedTransactionRef, setRelatedTransactionRef] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto generated preview ticket number
  const [previewNumber, setPreviewNumber] = useState("");

  useEffect(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(100000 + Math.random() * 900000);
    setPreviewNumber(`SL-TKT-${dateStr}-${rand}`);

    // Fetch support categories
    fetch("/api/support/tickets?email=" + encodeURIComponent(userEmail))
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          setCategories([
            { id: "cat_wallet", name: "Wallet Issues" },
            { id: "cat_verification", name: "Verification Issues" },
            { id: "cat_bill_payments", name: "Bill Payment Issues" },
            { id: "cat_account", name: "Account Issues" },
            { id: "cat_refund", name: "Refund Request" },
            { id: "cat_api", name: "API Errors" },
            { id: "cat_technical", name: "Technical Support" },
            { id: "cat_complaint", name: "Complaint" },
            { id: "cat_suggestion", name: "Suggestion" },
            { id: "cat_other", name: "Other" },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, [userEmail]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setError("Maximum 5 file attachments allowed per support ticket.");
      return;
    }

    Array.from(files).forEach((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds maximum allowed size of 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || "application/pdf",
            fileUrl: dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError("Please provide a clear subject for your ticket.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a detailed description of the issue.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          description: description.trim(),
          relatedService,
          relatedTransactionRef: relatedTransactionRef.trim() || null,
          attachments,
          userEmail,
          userName,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setSuccessMsg(`Ticket ${data.ticket.ticketNumber} successfully submitted! Assigning support staff...`);
        setTimeout(() => {
          onTicketCreated(data.ticket.id);
        }, 1200);
      } else {
        setError(data.message || "Failed to create support ticket. Please try again.");
      }
    } catch (err) {
      setError("Network error encountered. Please verify connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Support Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-3 py-1.5 rounded-full">
          <Ticket className="h-4 w-4" />
          <span>Generated Ticket ID: {previewNumber}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-6 bg-[#0F2D5C] rounded-[16px] text-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-[#0F2D5C] space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>SmartLink Priority Helpdesk</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Create New Support Ticket</h1>
        <p className="text-sm text-blue-100">
          Our customer support officers and technical engineers are available 24/7 to resolve your wallet, verification, and bill payment inquiries.
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-3 font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Wallet Funding Pending ₦5,000 / NIN Slip Delay"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ticket Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Priority Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="Low">Low — General inquiry or suggestion</option>
              <option value="Normal">Normal — Standard response (within 24 hrs)</option>
              <option value="High">High — Important transaction or verification issue</option>
              <option value="Urgent">Urgent — Severe wallet balance or API blockage</option>
            </select>
          </div>

          {/* Related Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Related Service (Optional)</label>
            <select
              value={relatedService}
              onChange={(e) => setRelatedService(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="General / Wallet">General / Wallet Funding</option>
              <option value="NIN Verification">NIN Verification (Slip / IPE / Phone-to-NIN)</option>
              <option value="BVN Verification">BVN Verification & Matching</option>
              <option value="CAC Registration">CAC Business / Company Registration</option>
              <option value="MTN SME Data">MTN Data & Airtime Topup</option>
              <option value="Glo Data">Glo Data & Airtime Topup</option>
              <option value="Airtel Data">Airtel Data & Airtime Topup</option>
              <option value="Electricity / Cable TV">Electricity Tokens & Cable TV Subscriptions</option>
              <option value="Developer API">Developer Webhook / REST API Integration</option>
            </select>
          </div>

          {/* Related Transaction Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Related Transaction Ref (Optional)</label>
            <input
              type="text"
              value={relatedTransactionRef}
              onChange={(e) => setRelatedTransactionRef(e.target.value)}
              placeholder="e.g. SL-PAY-882910 or NIN-20260731-98210"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detailed Issue Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain what happened, including exact dates, transaction amounts, error messages displayed, and steps taken..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              required
            ></textarea>
          </div>

          {/* Attachments Upload */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Upload Attachments (Screenshots, Receipts, PDFs - Max 5 files, 10MB each)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">{attachments.length} / 5 uploaded</span>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/30 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
              <input
                type="file"
                id="file-upload-input"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center shadow-inner">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400">Click to select files</span>
                  <span className="text-slate-500 dark:text-slate-400"> or drag and drop image/PDF files</span>
                </div>
                <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP, and PDF documents</p>
              </label>
            </div>

            {/* Uploaded Attachments Preview List */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      {att.fileType?.includes("image") ? (
                        <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{Math.round(att.fileSize / 1024)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Ticket...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Support Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
