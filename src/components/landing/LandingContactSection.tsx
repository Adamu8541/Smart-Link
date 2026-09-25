/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface LandingContactSectionProps {
  className?: string;
  onNavigateFAQ?: () => void;
}

export const LandingContactSection: React.FC<LandingContactSectionProps> = ({
  className = "",
  onNavigateFAQ,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General Inquiry & Support");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    reference: string;
    message: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanMsg = message.trim();

    if (!cleanName || !cleanEmail || !cleanMsg) {
      setError("Please fill out all required fields (Name, Email, and Message).");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim(),
          subject: subject.trim(),
          message: cleanMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setSuccessData({
        reference: data.reference || "INQ-" + Math.floor(100000 + Math.random() * 900000),
        message: data.message || "Your inquiry has been received. Our team will contact you shortly.",
      });

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while sending your message.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  return (
    <section
      id="contact-section"
      className={`py-20 bg-white border-t border-[#E5E7EB] scroll-mt-20 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="h-3.5 w-3.5" />
            Official Communications Desk
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111827] tracking-tight">
            Get in Touch with Our Team
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] font-normal leading-relaxed">
            Have questions about CAC filings, automated API integration, identity verifications, or wallet funding? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: Contact Channels & Credentials */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Cards */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0F2D5C]" />
                Direct Communication Channels
              </h3>

              <div className="space-y-4">
                {/* Email Desk */}
                <div className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Support Email
                    </span>
                    <a
                      href="mailto:Smartlinkcomputerbusiness@gmail.com"
                      className="text-xs sm:text-sm font-bold text-[#0F2D5C] hover:underline break-all"
                    >
                      Smartlinkcomputerbusiness@gmail.com
                    </a>
                    <span className="text-[10px] text-[#9CA3AF] block">
                      Official ticketing & compliance desk
                    </span>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Phone & Hotlines
                    </span>
                    <a
                      href="tel:+2348085490982"
                      className="text-xs sm:text-sm font-bold text-[#111827] hover:text-[#0F2D5C] block"
                    >
                      +234 808 549 0982
                    </a>
                    <span className="text-[10px] text-[#9CA3AF] block">
                      Mon – Sat: 8:00 AM – 8:00 PM (GMT+1)
                    </span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0F2D5C] dark:text-blue-300 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      WhatsApp Live Desk
                    </span>
                    <a
                      href="https://wa.me/2349047738212?text=Hello%20SmartLink%20Support,%20I%20have%20an%20inquiry"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-[#0F2D5C] hover:underline flex items-center gap-1.5"
                    >
                      +234 904 773 8212
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </a>
                    <span className="text-[10px] text-[#9CA3AF] block">
                      Fast response for registered agents
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-7 sm:p-9 shadow-sm text-left">
              
              {successData ? (
                <div className="py-8 text-center space-y-6 animate-fadeIn">
                  <div className="h-16 w-16 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="text-xs font-bold text-[#166534] uppercase tracking-wider bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#BBF7D0] inline-block">
                      Inquiry Dispatched Successfully
                    </span>
                    <h3 className="text-2xl font-black text-[#111827] tracking-tight">
                      Thank You for Contacting Us
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                      {successData.message}
                    </p>
                  </div>

                  {/* Reference Card */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl max-w-md mx-auto space-y-2">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Tracking Reference
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-base font-black text-[#0F2D5C] tracking-wide font-mono bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                        {successData.reference}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyReference(successData.reference)}
                        className="p-2 bg-white hover:bg-[#F5F7FA] border border-[#E2E8F0] text-[#0F2D5C] rounded-lg transition-colors cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedRef ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      A confirmation has been sent to your email. Keep this ticket reference for tracking.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSuccessData(null)}
                      className="px-6 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-[#E5E7EB] pb-4 mb-2">
                    <h3 className="text-lg font-bold text-[#111827] tracking-tight">
                      Send Us an Official Message
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Fill out the form below. We will respond directly to your email address.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-start gap-2 animate-fadeIn">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="contact-name" className="text-xs font-semibold text-[#111827]">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Adamu Muhammad"
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-[#F8FAFC] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="contact-email" className="text-xs font-semibold text-[#111827]">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. adamu@example.com"
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-[#F8FAFC] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="contact-phone" className="text-xs font-semibold text-[#111827]">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        disabled={loading}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08031234567"
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-[#F8FAFC] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10"
                      />
                    </div>

                    {/* Subject / Department */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="contact-subject" className="text-xs font-semibold text-[#111827]">
                        Inquiry Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="contact-subject"
                        disabled={loading}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none transition-all text-[#111827] bg-[#F8FAFC] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 cursor-pointer"
                      >
                        <option value="General Inquiry & Support">General Inquiry & Support</option>
                        <option value="CAC Corporate Registration & Compliance">CAC Corporate Registration & Compliance</option>
                        <option value="Identity Verification (NIN / BVN / TIN)">Identity Verification (NIN / BVN / TIN)</option>
                        <option value="Wallet Funding & Payment Settlement">Wallet Funding & Payment Settlement</option>
                        <option value="Enterprise API & Bulk Services">Enterprise API & Bulk Services</option>
                        <option value="Account & Security Compliance">Account & Security Compliance</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-[#111827]">
                      Message / Inquiry Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      disabled={loading}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your inquiry, transaction reference, or specific requirements in detail..."
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none transition-all placeholder-[#9CA3AF] text-[#111827] bg-[#F8FAFC] focus:bg-white focus:border-[#0F2D5C] focus:ring-2 focus:ring-[#0F2D5C]/10 resize-y min-h-[100px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F2D5C]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching Inquiry via Secure Mail...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Official Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-[#9CA3AF] pt-1">
                    Protected by NDPA 2023. We will never share your personal information.
                  </p>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default LandingContactSection;
