/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowRight, ShieldCheck, Cpu, Wallet, BookOpen, Mail, Phone, ExternalLink, FileText, Activity, CheckCircle2, RefreshCw, Sparkles, Smartphone, Check, Lock, User, Fingerprint, CreditCard, Plus, ArrowUpRight, Wifi, Bell, ShieldAlert, Zap, Send } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreServices?: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactMessage, setContactMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<"success" | "error" | null>(null);
  const [statusMessage, setStatusMessage] = React.useState("");

  // Interactive Live Simulator States
  const [simTab, setSimTab] = React.useState<"kyc" | "cac" | "edu" | "vtu">("kyc");
  const [simInput, setSimInput] = React.useState("");
  const [simStatus, setSimStatus] = React.useState<"idle" | "loading" | "success">("idle");
  const [simLoadingStep, setSimLoadingStep] = React.useState(0);

  // High-fidelity Mock Smartphone App states
  const [activeMobileTab, setActiveMobileTab] = React.useState<"wallet" | "verify" | "cac" | "vtu">("wallet");
  const [isFingerprintScanning, setIsFingerprintScanning] = React.useState(false);
  const [fingerprintScanComplete, setFingerprintScanComplete] = React.useState(false);
  const [selectedCarrier, setSelectedCarrier] = React.useState<"mtn" | "airtel" | "glo" | "9mobile">("mtn");
  const [vtuPhoneNumber, setVtuPhoneNumber] = React.useState("");
  const [vtuPurchaseStatus, setVtuPurchaseStatus] = React.useState<"idle" | "loading" | "success">("idle");
  const [cacFilingStep, setCacFilingStep] = React.useState(2);

  const triggerFingerprintScan = () => {
    if (fingerprintScanComplete) {
      setFingerprintScanComplete(false);
      return;
    }
    setIsFingerprintScanning(true);
    setTimeout(() => {
      setIsFingerprintScanning(false);
      setFingerprintScanComplete(true);
    }, 1800);
  };

  const handleVtuPurchase = () => {
    setVtuPurchaseStatus("loading");
    setTimeout(() => {
      setVtuPurchaseStatus("success");
    }, 1500);
  };

  const resetVtu = () => {
    setVtuPurchaseStatus("idle");
    setVtuPhoneNumber("");
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simStatus === "loading") {
      setSimLoadingStep(0);
      interval = setInterval(() => {
        setSimLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simStatus]);

  const runSimulation = () => {
    setSimStatus("loading");
    setTimeout(() => {
      setSimStatus("success");
    }, 1600);
  };

  const handleTabChange = (tab: "kyc" | "cac" | "edu" | "vtu") => {
    setSimTab(tab);
    setSimInput("");
    setSimStatus("idle");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setSubmitStatus("error");
      setStatusMessage("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSubmitStatus("success");
        setStatusMessage(data.message || "Your message has been sent successfully!");
        setContactName("");
        setContactEmail("");
        setContactMessage("");
      } else {
        setSubmitStatus("error");
        setStatusMessage(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      setSubmitStatus("error");
      setStatusMessage("An error occurred while sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] text-[#4B5563]" id="hero-section">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden bg-white py-20 lg:py-28 text-[#111827] border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Centered Heading */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#111827] leading-tight"
            >
              Smart Technology Solutions
            </motion.h1>
          </div>

          {/* Centered Paragraph Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Smart Link is a unified enterprise portal delivering consolidated corporate CAC registration filings, 
            national biometrics identity routing, educational scratch card dispatch, and seamless digital service automation 
            for professionals and businesses.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] transition-all font-bold text-white shadow-xs active:scale-98 cursor-pointer text-sm sm:text-base"
            >
              Access Client Portal
              <ArrowRight className="h-4.5 w-4.5 text-white" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* 2. SOLUTIONS SECTION */}
      <section id="solutions-section" className="py-20 bg-[#F5F7FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
              Our Core Services
            </span>
            <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight">
              Simple, Reliable Digital Solutions
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-2xl mx-auto">
              We help you register businesses, verify official identity documents, purchase educational tokens, 
              and pay utility bills securely in one easy-to-use platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 text-left">
            {/* Card 1: Identity & Verification */}
            <div className="group relative bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md hover:border-[#0F2D5C] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-[#F5F7FA] px-2.5 py-1 rounded-full">KYC Verification</span>
                  <h3 className="font-bold text-lg text-[#111827] tracking-tight">Identity & Verification</h3>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Easily check and verify official identity cards, NIN slips, and bank credentials with extreme safety.
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button onClick={onGetStarted} className="w-full py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Verify Now <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Card 2: Business Registration */}
            <div className="group relative bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md hover:border-[#0F2D5C] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
                  <Cpu className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-[#F5F7FA] px-2.5 py-1 rounded-full">CAC Services</span>
                  <h3 className="font-bold text-lg text-[#111827] tracking-tight">Business Registration</h3>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Register your company name or business fast and legally with the Corporate Affairs Commission (CAC).
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button onClick={onGetStarted} className="w-full py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Register Now <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Card 3: Airtime & Bills */}
            <div className="group relative bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md hover:border-[#0F2D5C] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-[#F5F7FA] px-2.5 py-1 rounded-full">VTU & Bills</span>
                  <h3 className="font-bold text-lg text-[#111827] tracking-tight">Airtime, Data & Bills</h3>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Top up airtime, purchase internet data, and pay your electricity and television bills with ease.
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button onClick={onGetStarted} className="w-full py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Recharge Now <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Card 4: School Pins */}
            <div className="group relative bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md hover:border-[#0F2D5C] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-[#F5F7FA] px-2.5 py-1 rounded-full">Education Pins</span>
                  <h3 className="font-bold text-lg text-[#111827] tracking-tight">School Pins & Tokens</h3>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Buy immediate, real registration pins and results checker tokens for WAEC, NECO, and JAMB.
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button onClick={onGetStarted} className="w-full py-2.5 px-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Get Pins <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT US SECTION */}
      <section id="about-section" className="py-24 bg-white border-b border-[#E5E7EB] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">
                About SmartLink NG
              </span>
              <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight leading-tight">
                Nigeria's Premier Digital Verification & <span className="text-[#0F2D5C]">Technology Infrastructure Gateway</span>
              </h2>
            </div>

            <div className="space-y-5 text-sm sm:text-base text-[#4B5563] leading-relaxed text-left sm:text-center">
              <p>
                <strong>SmartLink NG</strong> (SmartLink Digital Technologies & Enterprise) is an indigenous, certified technology platform headquartered in Nigeria. We specialize in building robust, secure, and lightning-fast digital infrastructure that bridges the gap between citizens, businesses, sub-agents, and authorized government verification channels.
              </p>
              <p>
                Our platform empowers thousands of entrepreneurs, cybercafes, SME owners, and corporate partners across all 36 states of the Federation to seamlessly process National Identification Number (NIN) slips, Corporate Affairs Commission (CAC) business registrations, educational pins (WAEC, NECO, JAMB), and instant VTU utility services (Airtime, Data, Electricity, and Cable TV subscriptions) with 99.9% uptime.
              </p>
              <p>
                Driven by uncompromising security standards, SmartLink NG utilizes bank-grade 256-bit SSL encryption, real-time automated wallet funding, and direct API routing to ensure that every lookup and transaction is instantaneous, transparent, and fully protected.
              </p>
            </div>

            {/* Core Pillars Grid */}
            <div className="grid sm:grid-cols-3 gap-6 pt-6 text-left">
              <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="font-bold text-sm text-[#111827]">Authorized Compliance</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Direct alignment with official regulatory standards, ensuring compliance and data integrity across all verification services.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="font-bold text-sm text-[#111827]">Instant Dispatch</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Automated processing engine delivering verified slips, tokens, and utility top-ups in under 3 seconds.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[#0F2D5C] text-white flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="font-bold text-sm text-[#111827]">Agent Empowerment</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Lucrative sub-agent tiers, automated commission tracking, and robust API developer integrations for modern businesses.
                </p>
              </div>
            </div>

            {/* Stylish Stats Cards */}
            <div className="grid grid-cols-2 gap-4 pt-4 max-w-xl mx-auto text-left">
              <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white text-[#0F2D5C] flex items-center justify-center border border-[#E5E7EB] shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">99.9%</div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Success Rate</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white text-[#0F2D5C] flex items-center justify-center border border-[#E5E7EB] shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">Real-Time</div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Instant Dispatch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT SECTION */}
      <section id="contact-section" className="py-24 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-[#0F2D5C] border border-[#E5E7EB]">
              Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight leading-tight">
              We Are Here to Support <span className="text-[#0F2D5C]">Your Success</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-2xl mx-auto">
              Have questions about agency accounts, corporate API integrations, wallet funding, or verification support? Connect with our dedicated support desk instantly.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 text-left">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-6">
                <h3 className="text-base font-bold text-[#111827] border-b border-[#E5E7EB] pb-3">
                  SmartLink NG Official Contacts
                </h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shrink-0 mt-0.5">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Email Address</div>
                      <a href="mailto:Smartlinkcomputerbusiness@gmail.com" className="text-xs font-bold text-[#0F2D5C] hover:underline break-all">
                        Smartlinkcomputerbusiness@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Phone / Message Number */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shrink-0 mt-0.5">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Phone & Message Hotline</div>
                      <a href="tel:+2348085490982" className="text-xs font-bold text-[#111827] hover:text-[#0F2D5C]">
                        +234 808 549 0982
                      </a>
                      <div className="text-[11px] text-[#6B7280] font-medium">Active for Calls & SMS Messages</div>
                    </div>
                  </div>

                  {/* Secondary Hotline */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shrink-0 mt-0.5">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Secondary Support Line</div>
                      <a href="tel:+2349047738212" className="text-xs font-bold text-[#111827] hover:text-[#0F2D5C]">
                        +234 904 773 8212
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp Support */}
                  <div className="flex items-start gap-3.5 pt-2">
                    <a
                      href="https://wa.me/2348085490982?text=Hello%20SmartLink%20Support%2C%20I%20need%20assistance."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      Chat on WhatsApp (08085490982)
                    </a>
                  </div>

                  {/* Office Hub */}
                  <div className="pt-2 border-t border-[#E5E7EB] text-xs text-[#6B7280] space-y-1">
                    <span className="font-bold text-[#111827]">Headquarters Hub:</span>
                    <div>Central Business District, Federal Capital Territory, Nigeria.</div>
                    <div className="text-[11px] text-[#0F2D5C] font-semibold pt-1">Hours: Mon - Sat (8:00 AM - 8:00 PM WAT)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
              <form onSubmit={handleContactSubmit} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Adamu Muhammad"
                    className="w-full text-xs p-3 border border-[#E5E7EB] rounded-xl bg-[#F5F7FA] focus:bg-white focus:outline-[#0F2D5C] font-medium text-[#111827]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. adamu@example.com"
                    className="w-full text-xs p-3 border border-[#E5E7EB] rounded-xl bg-[#F5F7FA] focus:bg-white focus:outline-[#0F2D5C] font-medium text-[#111827]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wide">Message Inquiry</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your corporate agency requirements or support query here..."
                    className="w-full text-xs p-3 border border-[#E5E7EB] rounded-xl bg-[#F5F7FA] focus:bg-white focus:outline-[#0F2D5C] font-medium text-[#111827] leading-relaxed"
                  ></textarea>
                </div>

                {submitStatus && (
                  <div className={`sm:col-span-2 p-3.5 rounded-xl text-xs font-medium border ${
                    submitStatus === "success" 
                      ? "bg-[#F5F7FA] text-[#0F2D5C] border-[#E5E7EB]" 
                      : "bg-[#F5F7FA] text-[#4B5563] border-[#E5E7EB]"
                  }`}>
                    {statusMessage}
                  </div>
                )}

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#0F2D5C] hover:bg-[#17407E] disabled:bg-[#E5E7EB] text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending Inquiry...
                      </>
                    ) : (
                      "Send Message to Admin"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
