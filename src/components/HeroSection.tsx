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
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-[#0F2D5C] border border-blue-200">
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
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-blue-50 px-2.5 py-1 rounded-full">KYC Verification</span>
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
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-blue-50 px-2.5 py-1 rounded-full">CAC Services</span>
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
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-blue-50 px-2.5 py-1 rounded-full">VTU & Bills</span>
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
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F2D5C] bg-blue-50 px-2.5 py-1 rounded-full">Education Pins</span>
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
      <section id="about-section" className="py-24 bg-[#F5F7FA] border-b border-[#E5E7EB] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-[#0F2D5C] border border-blue-200">
                Who We Are
              </span>
              <h2 className="text-3xl sm:text-4.5xl font-bold text-[#111827] tracking-tight leading-tight">
                Making digital services <span className="text-[#0F2D5C]">simple and safe</span> for everyone
              </h2>
            </div>

            <div className="space-y-5 text-sm sm:text-base text-[#4B5563] leading-relaxed">
              <p>
                Smart Link is a certified technology company. We help business owners, students, and sub-agents perform registrations, 
                verify national identity cards, and process payments without any of the usual stress or complexity.
              </p>
              <p>
                By partnering with official government channels and highly secure payment systems, we guarantee that 
                your data is completely protected and your transactions are completed in seconds.
              </p>
            </div>

            {/* Stylish Stats Cards */}
            <div className="grid grid-cols-2 gap-4 pt-4 max-w-xl mx-auto text-left">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0F2D5C] flex items-center justify-center border border-blue-100 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">99.9%</div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Success Rate</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0F2D5C] flex items-center justify-center border border-blue-100 shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">Real-Time</div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Instant Dispatch</div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Interactive Smartphone App Mockup */}
            <div className="hidden">
              {/* Outer phone case/bezel shadow wrapper */}
              <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-slate-950 dark:bg-slate-900 rounded-[48px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-800/80 dark:border-slate-700/60 transition-all duration-500 hover:scale-[1.02] group/phone">
                
                {/* Outer status glows */}
                <div className="absolute -inset-1 rounded-[50px] bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 opacity-0 group-hover/phone:opacity-100 blur-md transition-opacity duration-700 pointer-events-none"></div>

                {/* Speaker pill notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-30 flex items-center justify-between px-3.5 shadow-inner">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-800/80"></div>
                  <div className="h-1 w-8 rounded-full bg-slate-900/60"></div>
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </div>
                </div>

                {/* Inner Screen Container */}
                <div className="relative h-full w-full bg-[#050711] rounded-[36px] overflow-hidden flex flex-col justify-between border border-slate-900/40 select-none">
                  
                  {/* Status Bar */}
                  <div className="pt-8 px-5 pb-2 flex justify-between items-center text-white/90 text-[10px] font-semibold z-20">
                    <span className="font-mono tracking-tight text-slate-300">08:45 AM</span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Wifi className="h-3 w-3" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 font-mono">5G LTE</span>
                      <div className="h-3.5 w-6 border border-slate-600 rounded-sm p-0.5 flex items-center">
                        <div className="h-full w-4/5 bg-emerald-500 rounded-2xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Mobile App Viewport */}
                  <div className="flex-1 px-4.5 pb-2 pt-1.5 overflow-hidden flex flex-col justify-between text-left">
                    
                    {/* Viewport Header */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-[9px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-widest leading-none mb-0.5">SMART LINK HUB</p>
                        <h4 className="text-xs font-black text-white tracking-tight">Digital Gateway App</h4>
                      </div>
                      <div className="relative h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                        <Bell className="h-3.5 w-3.5 text-slate-300" />
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      </div>
                    </div>

                    {/* View 1: Wallet Dashboard ("wallet") */}
                    {activeMobileTab === "wallet" && (
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        {/* Elegant Credit Card Wallet */}
                        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-lg overflow-hidden flex flex-col justify-between aspect-[1.6/1]">
                          {/* Background design elements */}
                          <div className="absolute -bottom-6 -right-6 h-20 w-20 bg-white/5 rounded-full blur-xl"></div>
                          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-400/15 rounded-full blur-xl"></div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-blue-100 font-medium">Smart Link Ledger</p>
                              <h5 className="text-[10px] font-bold text-slate-200">Adamu Muhammad</h5>
                            </div>
                            <div className="flex h-5 w-8 rounded-md bg-white/10 backdrop-blur-xs border border-white/10 items-center justify-center">
                              <Wallet className="h-3 w-3 text-blue-200" />
                            </div>
                          </div>

                          <div className="my-1.5">
                            <p className="text-[8px] text-blue-200/90 leading-none">Wallet Balance</p>
                            <h3 className="text-base font-black tracking-tight mt-0.5 font-mono">₦240,500.00</h3>
                          </div>

                          <div className="flex justify-between items-center text-[8px] font-mono text-blue-200/80">
                            <span>SL-4920-192-PRO</span>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-bold uppercase text-[7px]">Active Agent</span>
                          </div>
                        </div>

                        {/* Fast Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={onGetStarted} className="py-2 px-2.5 rounded-xl bg-[#101430] border border-blue-500/20 text-white flex items-center justify-between hover:bg-[#151a3d] transition-colors cursor-pointer text-left">
                            <div>
                              <p className="text-[8px] font-extrabold uppercase text-blue-400">Withdraw</p>
                              <p className="text-[9px] text-slate-400 font-light">Instant Cash</p>
                            </div>
                            <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                          </button>
                          
                          <button onClick={onGetStarted} className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs cursor-pointer text-left">
                            <div>
                              <p className="text-[8px] font-bold uppercase text-blue-100">Add Funds</p>
                              <p className="text-[9px] text-blue-200 font-light">Auto Deposit</p>
                            </div>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Recent Transactions Feed */}
                        <div className="space-y-1.5 flex-1 overflow-hidden">
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500">Live Commission Feed</p>
                          <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                            
                            <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900/60 flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                  <Cpu className="h-3.5 w-3.5 text-purple-400" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">CAC filing: Approved</p>
                                  <p className="text-[8px] text-slate-500">1m ago • Batch #9028</p>
                                </div>
                              </div>
                              <span className="font-bold text-emerald-400 font-mono">+₦4,500.00</span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900/60 flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">Glo VTU Airtime</p>
                                  <p className="text-[8px] text-slate-500">4m ago • Commission saved</p>
                                </div>
                              </div>
                              <span className="font-bold text-emerald-400 font-mono">+₦120.00</span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900/60 flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">WAEC PIN Generation</p>
                                  <p className="text-[8px] text-slate-500">12m ago • Instant issue</p>
                                </div>
                              </div>
                              <span className="font-bold text-emerald-400 font-mono">+₦350.00</span>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 2: Security, BVN & NIN scanner ("verify") */}
                    {activeMobileTab === "verify" && (
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-2xl">
                          <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Biometric Identity Verification</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-light">Query federal NIMC databases and secure immediate NIN biometric approvals.</p>
                        </div>

                        {/* Scanner stage */}
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#070b1b] rounded-2xl border border-slate-900/80 p-4 relative overflow-hidden min-h-[140px]">
                          {/* Animated radar rings when scanning */}
                          {isFingerprintScanning && (
                            <>
                              <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                              <div className="absolute h-28 w-28 rounded-full border border-blue-500/30 animate-ping"></div>
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce"></div>
                            </>
                          )}

                          {!isFingerprintScanning && !fingerprintScanComplete ? (
                            <button
                              onClick={triggerFingerprintScan}
                              className="h-16 w-16 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center shadow-lg transition-all cursor-pointer group/scan"
                            >
                              <Fingerprint className="h-8 w-8 text-blue-500 group-hover/scan:scale-110 transition-transform" />
                            </button>
                          ) : isFingerprintScanning ? (
                            <div className="flex flex-col items-center space-y-2">
                              <Fingerprint className="h-10 w-10 text-blue-400 animate-pulse" />
                              <p className="text-[9px] font-mono text-blue-300 animate-pulse uppercase tracking-widest">Scanning Biometrics...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-2 text-center animate-scale-up">
                              <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <Check className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-white leading-none">KYC DATABASE MATCHED</p>
                                <p className="text-[8px] font-mono text-slate-400 mt-1">NIN Verified • Jane Adewale</p>
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2.5 text-[8px] text-slate-500 font-mono">
                            {!isFingerprintScanning && !fingerprintScanComplete && "Tap sensor to initiate check"}
                            {isFingerprintScanning && "NIMC Gateway: Secure Connection Active"}
                            {fingerprintScanComplete && "Transaction Catalogued Successfully"}
                          </div>
                        </div>

                        <button
                          onClick={triggerFingerprintScan}
                          disabled={isFingerprintScanning}
                          className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {fingerprintScanComplete ? "Verify Another Identity" : "Scan Fingerprint"}
                        </button>
                      </div>
                    )}

                    {/* View 3: CAC Filing tracker ("cac") */}
                    {activeMobileTab === "cac" && (
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-[8px] font-bold text-purple-400 uppercase tracking-wider">CAC Portal Pipeline</p>
                            <p className="text-[10px] text-slate-400">Smart Link Filing tracking terminal</p>
                          </div>
                          <span className="text-[8px] bg-purple-500/25 text-purple-300 font-mono px-1.5 py-0.5 rounded-md border border-purple-500/40">RC: 94829</span>
                        </div>

                        {/* Pipeline workflow pipeline */}
                        <div className="flex-1 bg-slate-900/30 rounded-2xl border border-slate-900/80 p-3.5 space-y-3 flex flex-col justify-between">
                          
                          <div className="space-y-2.5">
                            {/* Step 1 */}
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                                <Check className="h-2 w-2" />
                              </div>
                              <div>
                                <p className="text-[9px] font-extrabold text-white leading-none">Name Inquiry Reserved</p>
                                <p className="text-[8px] text-slate-400">Smart Link Computer Services LTD (Approved)</p>
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-2.5">
                              <div className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                                cacFilingStep >= 2 
                                  ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-400" 
                                  : "bg-slate-950 border border-slate-800 text-slate-500"
                              }`}>
                                {cacFilingStep >= 2 ? <Check className="h-2 w-2" /> : <span className="text-[7px] font-mono">2</span>}
                              </div>
                              <div>
                                <p className="text-[9px] font-extrabold text-white leading-none">Document Stamp Duty Filed</p>
                                <p className="text-[8px] text-slate-400">Legal affidavits and registration payments completed</p>
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-2.5">
                              <div className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                                cacFilingStep >= 3 
                                  ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-400" 
                                  : "bg-slate-950 border border-slate-800 text-slate-500"
                              }`}>
                                {cacFilingStep >= 3 ? <Check className="h-2 w-2" /> : <span className="text-[7px] font-mono">3</span>}
                              </div>
                              <div>
                                <p className="text-[9px] font-extrabold text-white leading-none">Commission Audit Logged</p>
                                <p className="text-[8px] text-slate-400">Agent escrow fee catalogued on Smart Link ledger</p>
                              </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 h-3.5 w-3.5 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              </div>
                              <div>
                                <p className="text-[9px] font-extrabold text-amber-400 leading-none">Final Certificate Dispatch</p>
                                <p className="text-[8px] text-slate-400">Estimated duration: Within 24-48 business hours</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-950/40 text-[8px] text-slate-500">
                            <span>Status: Pending Signature</span>
                            <button 
                              onClick={() => setCacFilingStep(cacFilingStep === 2 ? 3 : 2)} 
                              className="text-purple-400 font-bold hover:underline cursor-pointer"
                            >
                              Simulate Next Stage
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 4: VTU Hub ("vtu") */}
                    {activeMobileTab === "vtu" && (
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                          <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Automated Airtime Dispatch</p>
                          <p className="text-[10px] text-slate-400">Super-fast topups with immediate agent commission gains.</p>
                        </div>

                        {vtuPurchaseStatus === "idle" && (
                          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                            {/* Carrier Selector */}
                            <div className="grid grid-cols-4 gap-1.5">
                              {/* MTN */}
                              <button
                                onClick={() => setSelectedCarrier("mtn")}
                                className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedCarrier === "mtn"
                                    ? "bg-amber-400/20 border-amber-400 text-amber-400 font-extrabold shadow-xs"
                                    : "bg-slate-900/60 border-slate-900 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span className="text-[8px] block font-bold">MTN</span>
                                <span className="text-[6px] font-mono block opacity-80">4% Off</span>
                              </button>

                              {/* Airtel */}
                              <button
                                onClick={() => setSelectedCarrier("airtel")}
                                className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedCarrier === "airtel"
                                    ? "bg-rose-600/20 border-rose-500 text-rose-500 font-extrabold shadow-xs"
                                    : "bg-slate-900/60 border-slate-900 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span className="text-[8px] block font-bold">Airtel</span>
                                <span className="text-[6px] font-mono block opacity-80">3% Off</span>
                              </button>

                              {/* Glo */}
                              <button
                                onClick={() => setSelectedCarrier("glo")}
                                className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedCarrier === "glo"
                                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 font-extrabold shadow-xs"
                                    : "bg-slate-900/60 border-slate-900 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span className="text-[8px] block font-bold">Glo</span>
                                <span className="text-[6px] font-mono block opacity-80">5% Off</span>
                              </button>

                              {/* 9mobile */}
                              <button
                                onClick={() => setSelectedCarrier("9mobile")}
                                className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedCarrier === "9mobile"
                                    ? "bg-teal-500/20 border-teal-400 text-teal-400 font-extrabold shadow-xs"
                                    : "bg-slate-900/60 border-slate-900 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span className="text-[8px] block font-bold">9mobile</span>
                                <span className="text-[6px] font-mono block opacity-80">4% Off</span>
                              </button>
                            </div>

                            {/* Phone Input */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block">Recipient Phone</label>
                              <input
                                type="text"
                                value={vtuPhoneNumber}
                                onChange={(e) => setVtuPhoneNumber(e.target.value)}
                                placeholder="e.g., 08085490982"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-950 text-white placeholder:text-slate-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            {/* CTA Action */}
                            <button
                              onClick={handleVtuPurchase}
                              disabled={!vtuPhoneNumber}
                              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Dispatch Airtime
                            </button>
                          </div>
                        )}

                        {vtuPurchaseStatus === "loading" && (
                          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-3 bg-[#070b1b] rounded-2xl border border-slate-900/80">
                            <div className="h-8 w-8 rounded-full border-2 border-slate-800 border-t-emerald-500 animate-spin"></div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-200 animate-pulse uppercase">Connecting Telecom Switching Node</p>
                              <p className="text-[8px] text-slate-500 font-mono mt-0.5">Authorizing instant wallet charge...</p>
                            </div>
                          </div>
                        )}

                        {vtuPurchaseStatus === "success" && (
                          <div className="flex-1 flex flex-col justify-between space-y-3 bg-[#070b1b] rounded-2xl border border-slate-900/80 p-3.5 text-center animate-scale-up">
                            <div className="space-y-1">
                              <div className="mx-auto h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <Check className="h-4 w-4" />
                              </div>
                              <p className="text-[10px] font-bold text-white uppercase mt-1">RECHARGE DISPATCHED!</p>
                              <p className="text-[8px] text-slate-400">₦2,000 Airtime credited to {vtuPhoneNumber}</p>
                              <p className="text-[8px] font-bold text-emerald-400 font-mono">+₦80.00 Saved in Commissions</p>
                            </div>

                            <button
                              onClick={resetVtu}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Purchase Another Topup
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                  {/* Device Bottom Tab Navigation Bar */}
                  <div className="px-3.5 pb-5 pt-3.5 bg-[#03050c] border-t border-slate-950/80 flex justify-between items-center z-20">
                    <button
                      onClick={() => setActiveMobileTab("wallet")}
                      className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeMobileTab === "wallet" ? "text-blue-500 scale-105" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Wallet className="h-4.5 w-4.5" />
                      <span className="text-[8px] font-extrabold tracking-tight">Ledger</span>
                    </button>

                    <button
                      onClick={() => setActiveMobileTab("verify")}
                      className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeMobileTab === "verify" ? "text-blue-500 scale-105" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Fingerprint className="h-4.5 w-4.5" />
                      <span className="text-[8px] font-extrabold tracking-tight">Verify</span>
                    </button>

                    <button
                      onClick={() => setActiveMobileTab("cac")}
                      className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeMobileTab === "cac" ? "text-blue-500 scale-105" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Cpu className="h-4.5 w-4.5" />
                      <span className="text-[8px] font-extrabold tracking-tight">CAC tracker</span>
                    </button>

                    <button
                      onClick={() => setActiveMobileTab("vtu")}
                      className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeMobileTab === "vtu" ? "text-blue-500 scale-105" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Zap className="h-4.5 w-4.5" />
                      <span className="text-[8px] font-extrabold tracking-tight">VTU Hub</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CONTACT SECTION */}
      <section id="contact-section" className="py-20 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12 text-left">
            <div className="lg:col-span-1 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0F2D5C]">Connect With Us</span>
              <h2 className="text-2xl sm:text-3.5xl font-bold text-[#111827] tracking-tight leading-none">
                Start a Secure Partnership
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Have questions about custom API lookups, agency roles, or enterprise billing integrations? Reach out to our Abuja main hub.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 text-[#4B5563]">
                  <div className="h-8 w-8 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shadow-2xs">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">Smartlinkcomputerbusiness@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-[#4B5563]">
                  <div className="h-8 w-8 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shadow-2xs">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">+2348085490982</span>
                </div>
                <div className="flex items-center gap-3 text-[#4B5563]">
                  <div className="h-8 w-8 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F2D5C] shadow-2xs font-bold text-[10px]">
                    WA
                  </div>
                  <span className="text-xs font-medium">WhatsApp: 09047738212</span>
                </div>
              </div>
            </div>

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
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-red-50 text-red-800 border-red-200"
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
