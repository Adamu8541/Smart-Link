/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  Wallet,
  Cpu,
  Fingerprint,
  CreditCard,
  Building2,
  Sparkles,
  PhoneCall,
  Search,
  Check,
  ArrowUpRight,
  ShieldAlert,
  Server
} from "lucide-react";

interface LandingHeroProps {
  onGetStarted: () => void;
  onExploreServices: () => void;
  onLogin?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onGetStarted,
  onExploreServices,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<"verification" | "wallet" | "vtu">("verification");
  const [demoInput, setDemoInput] = useState("12345678901");
  const [demoState, setDemoState] = useState<"idle" | "verifying" | "success">("success");

  const runDemoVerification = () => {
    setDemoState("verifying");
    setTimeout(() => {
      setDemoState("success");
    }, 1200);
  };

  return (
    <section id="hero-section" className="relative overflow-hidden bg-white text-[#111827] pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-[#E5E7EB]">
      
      {/* Background Subtle Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,45,92,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="space-y-8">
          
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12] text-[#111827]"
          >
            Verify Any Identity Instantly &{" "}
            <span className="text-[#0F2D5C]">
              Power Your Payments
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#4B5563] font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Streamline your business with high-velocity NIN, BVN, and CAC verifications, instant VTU router, and automated wallet operations on Nigeria's most reliable compliance gateway.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 pt-2"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button
                id="hero-primary-btn"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
              >
                Get Started
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>

            {onLogin && (
              <button
                id="hero-login-btn"
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold rounded-xl text-sm shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
              >
                Login
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default LandingHero;
