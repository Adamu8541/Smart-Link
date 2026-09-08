/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Zap,
  Smartphone,
  Tv,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Clock,
  Sparkles,
  HelpCircle,
  PhoneCall,
  RefreshCw,
  Award,
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import LandingHeader from "../landing/LandingHeader";
import LandingFooter from "../landing/LandingFooter";

interface BillsPublicViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onNavigateHome: () => void;
  onNavigateLegal?: (docId?: string) => void;
}

export const BillsPublicView: React.FC<BillsPublicViewProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
  onNavigateLegal,
}) => {
  const [activeTab, setActiveTab] = useState<"electricity" | "data" | "airtime" | "cable" | "exam">("electricity");

  const discos = [
    { name: "Ikeja Electric (IKEDC)", coverage: "Lagos Mainland & Environs", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Eko Electricity (EKEDC)", coverage: "Lagos Island, Lekki & Parts of Ogun", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Abuja Electricity (AEDC)", coverage: "FCT, Niger, Kogi, Nasarawa", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Ibadan Electricity (IBEDC)", coverage: "Oyo, Ogun, Osun, Kwara, Parts of Ekiti", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Kaduna Electric (KAEDCO)", coverage: "Kaduna, Sokoto, Kebbi, Zamfara", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Enugu Electricity (EEDC)", coverage: "Enugu, Abia, Imo, Anambra, Ebonyi", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Port Harcourt Electric (PHED)", coverage: "Rivers, Bayelsa, Cross River, Akwa Ibom", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Jos Electricity (JEDC)", coverage: "Plateau, Bauchi, Benue, Gombe", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Kano Electricity (KEDCO)", coverage: "Kano, Katsina, Jigawa", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Benin Electricity (BEDC)", coverage: "Edo, Delta, Ondo, Parts of Ekiti", type: "Prepaid & Postpaid", speed: "< 15s" },
    { name: "Yola Electricity (YEDC)", coverage: "Adamawa, Borno, Taraba, Yobe", type: "Prepaid & Postpaid", speed: "< 15s" },
  ];

  const dataPlans = [
    { network: "MTN SME & Corporate", size: "1.0 GB", price: "₦265", validity: "30 Days", popular: true },
    { network: "MTN SME & Corporate", size: "2.0 GB", price: "₦530", validity: "30 Days", popular: true },
    { network: "MTN SME & Corporate", size: "5.0 GB", price: "₦1,320", validity: "30 Days", popular: false },
    { network: "MTN SME & Corporate", size: "10.0 GB", price: "₦2,640", validity: "30 Days", popular: false },
    { network: "Airtel SME & Corporate", size: "1.0 GB", price: "₦280", validity: "30 Days", popular: true },
    { network: "Airtel SME & Corporate", size: "2.0 GB", price: "₦560", validity: "30 Days", popular: false },
    { network: "Airtel SME & Corporate", size: "5.0 GB", price: "₦1,390", validity: "30 Days", popular: false },
    { network: "Glo Corporate Gifting", size: "1.0 GB", price: "₦250", validity: "30 Days", popular: true },
    { network: "Glo Corporate Gifting", size: "3.0 GB", price: "₦740", validity: "30 Days", popular: false },
    { network: "Glo Corporate Gifting", size: "5.0 GB", price: "₦1,240", validity: "30 Days", popular: false },
    { network: "9mobile SME Data", size: "1.0 GB", price: "₦195", validity: "30 Days", popular: true },
    { network: "9mobile SME Data", size: "2.0 GB", price: "₦390", validity: "30 Days", popular: false },
  ];

  const cableBouquets = [
    { provider: "DSTV", package: "Padi / Yanga / Confam / Compact / Premium", speed: "Instant Signal Reconnection", discount: "0% Surcharge" },
    { provider: "GOtv", package: "Smallie / Jinja / Jolli / Max / Supa", speed: "Instant IUC Validation", discount: "0% Surcharge" },
    { provider: "StarTimes", package: "Nova / Basic / Smart / Classic / Super", speed: "Auto SmartCard Refresh", discount: "0% Surcharge" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-[#111827] antialiased">
      <SEOHead
        title="Electricity Disco Tokens, Cheap SME Data & Airtime VTU | Smart Link NG"
        description="Instant utility bill payment gateway in Nigeria: Pay prepaid/postpaid electricity meter tokens for all 11 Discos with zero surcharge, buy cheap SME data from ₦240/GB, top up VTU airtime with cash rebates, and renew DSTV/GOtv/StarTimes subscriptions instantly."
        canonicalUrl="https://smartlinkng.com.ng/bills"
      />

      {/* Header */}
      <LandingHeader
        onLogin={onLogin}
        onRegister={onRegister}
        onGetStarted={onGetStarted}
        onNavigateSection={() => onNavigateHome()}
      />

      {/* Hero */}
      <header className="bg-gradient-to-b from-[#0F2D5C] to-[#17407E] text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#0F2D5C]/30">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
            <Zap className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Automated 24/7 VTU &amp; Utility Billing Gateway</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Pay Electricity Bills, Buy Cheap SME Data &amp; Airtime Instantly
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Zero convenience fees on Disco meter tokens, direct wholesale data pricing across MTN, Airtel, Glo, and 9mobile, and instant automated transaction receipts.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>Recharge / Pay Bills Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabs Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("electricity")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "electricity"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Zap className="h-4 w-4 text-[#F59E0B]" />
            <span>Electricity Discos (All 11)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "data"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-500" />
            <span>Cheap SME Data (from ₦240/GB)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("airtime")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "airtime"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <CreditCard className="h-4 w-4 text-blue-400" />
            <span>Airtime VTU (Cashback)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cable")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "cable"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Tv className="h-4 w-4 text-purple-400" />
            <span>Cable TV (DSTV/GOtv)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exam")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "exam"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-amber-500" />
            <span>Exam Result PINs (WAEC/NECO)</span>
          </button>
        </div>

        {/* Tab 1: Electricity Discos */}
        {activeTab === "electricity" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <div className="max-w-3xl">
                <h2 className="text-xl font-black text-gray-900">
                  Instant Prepaid Meter Tokens &amp; Postpaid Bill Settlement
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Recharge your prepaid electricity meter or pay postpaid bills with instant 20-digit token generation sent via SMS, email, and on-screen printable receipt.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {discos.map((d, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-[#0F2D5C] transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{d.name}</span>
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        {d.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{d.coverage}</p>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 pt-1 border-t border-gray-200">
                      <span>{d.type}</span>
                      <span className="text-emerald-600 font-bold">₦0 Fee</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Customer Meter Name &amp; Address validation verified before payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Automatic multi-gateway redundancy to prevent failed recharges</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Pay Electricity Meter Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cheap SME Data */}
        {activeTab === "data" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <div className="max-w-3xl">
                <h2 className="text-xl font-black text-gray-900">
                  Wholesale SME &amp; Corporate Gifting Internet Data Bundles
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Enjoy discounted high-speed mobile data for personal use or resale with 30-day validity across MTN, Airtel, Glo, and 9mobile.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {dataPlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      plan.popular
                        ? "bg-blue-50/50 border-blue-200 shadow-sm"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#0F2D5C]">{plan.network}</span>
                      {plan.popular && (
                        <span className="text-[10px] font-black bg-[#0F2D5C] text-white px-2 py-0.5 rounded-md">
                          Best Seller
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-gray-900 my-1">{plan.size}</div>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-2 border-t border-gray-200">
                      <span>{plan.price}</span>
                      <span className="text-gray-500 font-normal">{plan.validity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-600">
                  <p className="font-bold text-gray-900">API Access for VTU Resellers Available</p>
                  <p>Integrate our sub-450ms data vending API with automated webhook notifications.</p>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Buy Cheap Data Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Airtime VTU */}
        {activeTab === "airtime" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900">Instant Airtime Top-Up with Cash Rebates</h2>
            <p className="text-xs text-gray-600 max-w-2xl">
              Recharge MTN, Airtel, Glo, and 9mobile with up to 3% instant wallet cashbacks. Support for single number and bulk multi-number disbursements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-200 text-center space-y-1">
                <div className="text-base font-black text-yellow-900">MTN Nigeria</div>
                <div className="text-xl font-black text-yellow-700">2.5% Cashback</div>
                <p className="text-[11px] text-yellow-800">Instant 24/7 Top-up</p>
              </div>

              <div className="p-5 bg-red-50 rounded-2xl border border-red-200 text-center space-y-1">
                <div className="text-base font-black text-red-900">Airtel Nigeria</div>
                <div className="text-xl font-black text-red-700">2.5% Cashback</div>
                <p className="text-[11px] text-red-800">Instant 24/7 Top-up</p>
              </div>

              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <div className="text-base font-black text-emerald-900">Glo Mobile</div>
                <div className="text-xl font-black text-emerald-700">3.0% Cashback</div>
                <p className="text-[11px] text-emerald-800">Instant 24/7 Top-up</p>
              </div>

              <div className="p-5 bg-green-50 rounded-2xl border border-green-200 text-center space-y-1">
                <div className="text-base font-black text-green-900">9mobile</div>
                <div className="text-xl font-black text-green-700">3.0% Cashback</div>
                <p className="text-[11px] text-green-800">Instant 24/7 Top-up</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Recharge Airtime Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Cable TV */}
        {activeTab === "cable" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900">Cable TV Subscriptions (DSTV, GOtv, StarTimes)</h2>
            <p className="text-xs text-gray-600 max-w-2xl">
              Zero surcharge and instant signal restoration upon successful payment. Upgrade or renew your favorite bouquets seamlessly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {cableBouquets.map((c, i) => (
                <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="text-lg font-black text-[#0F2D5C]">{c.provider}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.package}</p>
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>{c.speed}</span>
                    <span>{c.discount}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Renew Cable TV Subscription</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Exam Result Cards */}
        {activeTab === "exam" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900">Official WAEC &amp; NECO Result Checking Electronic PINs</h2>
            <p className="text-xs text-gray-600 max-w-2xl">
              Buy genuine, direct electronic scratch card PINs for WAEC, NECO, and NABTEB exam result verification with instant serial number and PIN display.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2 text-center">
                <div className="text-lg font-black text-blue-950">WAEC Result PIN</div>
                <div className="text-2xl font-black text-[#0F2D5C]">₦3,600</div>
                <p className="text-xs text-gray-600">Valid for checking 5 candidate results</p>
              </div>

              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2 text-center">
                <div className="text-lg font-black text-emerald-950">NECO Result Token</div>
                <div className="text-2xl font-black text-emerald-700">₦1,150</div>
                <p className="text-xs text-gray-600">Official SSCE &amp; BECE checking token</p>
              </div>

              <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2 text-center">
                <div className="text-lg font-black text-purple-950">NABTEB Result PIN</div>
                <div className="text-2xl font-black text-purple-700">₦1,800</div>
                <p className="text-xs text-gray-600">National Technical Exam Board PIN</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Purchase Exam PINs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <LandingFooter
        onNavigateSection={() => onNavigateHome()}
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigateLegal={onNavigateLegal}
        activeInfoTab={null}
        setActiveInfoTab={() => {}}
      />
    </div>
  );
};

export default BillsPublicView;
