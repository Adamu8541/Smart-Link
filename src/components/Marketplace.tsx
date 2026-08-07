/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SmartLinkLogoMark } from "./ui/SmartLinkLogoMark";
import { 
  ShoppingBag, 
  Search, 
  ShieldCheck, 
  Clock, 
  Check, 
  AlertCircle, 
  Sparkles,
  Wallet,
  CreditCard,
  Building,
  Coins,
  ArrowRight,
  X,
  Plus,
  CheckCircle
} from "lucide-react";
import { VendorService, UserProfile } from "../types";

interface MarketplaceProps {
  currentUser: UserProfile | null;
  onRefreshUser: (uid: string) => void;
  isDarkMode?: boolean;
}

export default function Marketplace({ currentUser, onRefreshUser, isDarkMode = false }: MarketplaceProps) {
  const [services, setServices] = useState<VendorService[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<any | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Funding modal states
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("5000");
  const [fundingMethod, setFundingMethod] = useState<"BANK" | "CARD">("BANK");
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [fundingSuccess, setFundingSuccess] = useState(false);
  const [fundedAmountRealized, setFundedAmountRealized] = useState(0);

  // Card specific simulation states
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardName, setCardName] = useState(currentUser?.fullName || "Ahmad Usman");

  useEffect(() => {
    if (currentUser) {
      setCardName(currentUser.fullName);
    }
  }, [currentUser]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/marketplace/services");
      const data = await res.json();
      if (res.ok) {
        setServices(data.services);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amt = parseFloat(fundingAmount);
    if (isNaN(amt) || amt <= 0) {
      setFundingError("Please enter a valid transfer amount greater than ₦0.");
      return;
    }

    setFundingLoading(true);
    setFundingError(null);

    try {
      const generatedRef = fundingMethod === "BANK" 
        ? `SML-BANK-${Math.floor(100000 + Math.random() * 900000)}`
        : `SML-CARD-${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          amount: amt,
          gateway: fundingMethod === "BANK" ? "Bank Wire Transfer" : "Paystack Card Payment",
          ref: generatedRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment processing declined by gateway.");
      }

      setFundedAmountRealized(amt);
      setFundingSuccess(true);
      onRefreshUser(currentUser.uid);
    } catch (err: any) {
      setFundingError(err.message || "Payment system encountered a connection error.");
    } finally {
      setFundingLoading(false);
    }
  };

  const handleBuyService = async (srv: VendorService) => {
    if (!currentUser) {
      setPurchaseError("Please sign in to your account to purchase services from verified agents.");
      return;
    }

    if (currentUser.walletBalance < srv.price) {
      setPurchaseError(`Insufficient wallet balance. This service costs ₦${srv.price.toLocaleString()}, but your balance is ₦${currentUser.walletBalance.toLocaleString()}.`);
      return;
    }

    setPurchaseLoading(srv.id);
    setPurchaseError(null);
    setPurchaseResult(null);

    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          serviceId: srv.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      setPurchaseResult({
        title: srv.title,
        price: srv.price,
        vendor: srv.vendorName,
        ref: data.reference,
      });

      onRefreshUser(currentUser.uid); // update main balance
    } catch (err: any) {
      setPurchaseError(err.message || "Filing purchase order failed.");
    } finally {
      setPurchaseLoading(null);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesCategory = categoryFilter === "ALL" || srv.category === categoryFilter;
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-12 bg-white" id="marketplace-page-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title & Wallet Info Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 border-b pb-6">
          <div className="text-left space-y-3 max-w-3xl">
            <span className="px-2.5 py-1 rounded bg-violet-100 text-violet-800 text-xs font-mono font-bold uppercase tracking-wider">
              Agent Ecosystem
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verified Agent Marketplace</h1>
            <p className="text-slate-500 font-light text-sm">
              Smart Link operates as a decentralized commission-based marketplace. Secure digital assistances from CAC filing professionals, NIN plastic lamination agents, and local ICT installers.
            </p>
          </div>
          
          {currentUser ? (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-w-[240px] text-left shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-indigo-500" />
                  Your Wallet
                </span>
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30">
                  Live Balance
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Available Funds</p>
                <p className="text-2xl font-black text-slate-950 dark:text-slate-100 font-mono">
                  ₦{currentUser.walletBalance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setFundingError(null);
                  setFundingSuccess(false);
                  setIsFundingModalOpen(true);
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
              >
                <Wallet className="h-3.5 w-3.5" />
                Fund Wallet
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left max-w-[240px]">
              <p className="text-xs text-slate-500">Sign in to Smart Link to view your digital wallet balance and commission ledgers.</p>
            </div>
          )}
        </div>

        {/* Global feedbacks */}
        {purchaseError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold mb-6 flex justify-between items-center">
            <span>{purchaseError}</span>
            <button onClick={() => setPurchaseError(null)}>✕</button>
          </div>
        )}

        {purchaseResult && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm mb-6 space-y-2 text-left">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Check className="h-4.5 w-4.5 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
              Agent Order Dispatched Securely!
            </h4>
            <p className="text-xs text-emerald-700">
              Purchased: <strong>&quot;{purchaseResult.title}&quot;</strong> from verified agent <strong>{purchaseResult.vendor}</strong>.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Filing Reference ID: {purchaseResult.ref}. Funds are held securely and payout is auto-released with Smart Link platform fee deducted.
            </p>
          </div>
        )}

        {/* Filters and search block */}
        <div className="grid md:grid-cols-12 gap-4 items-center mb-8">
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              id="marketplace-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agent SCUML, card printing services..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {["ALL", "IDENTITY", "CAC", "EDUCATION", "VTU", "ICT"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                id={`tab-mkt-${cat}`}
                className={`px-3 py-1.5 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Offerings" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all text-left bg-slate-50 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-bold font-mono text-[9px] tracking-wider uppercase">
                    {srv.category} Service
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">Agent Listing Fee</div>
                    <div className="text-sm font-extrabold text-slate-950 font-mono">₦{srv.price.toLocaleString()}</div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{srv.title}</h3>

                {/* Scope Description */}
                <p className="text-xs text-slate-500 font-light leading-relaxed">{srv.description}</p>

                {/* Agent Credentials Info */}
                <div className="p-2.5 rounded bg-white border text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      Verified Agent:
                    </span>
                    <strong className="text-slate-900">{srv.vendorName}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-mono text-[10px]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Delivery Cycle:
                    </span>
                    <strong>{srv.deliveryTime}</strong>
                  </div>
                </div>
              </div>

              {/* Purchase Trigger Button */}
              <div className="mt-5 pt-3 border-t">
                <button
                  onClick={() => handleBuyService(srv)}
                  id={`btn-purchase-srv-${srv.id}`}
                  disabled={purchaseLoading !== null}
                  className="w-full py-2 bg-slate-900 text-white hover:bg-indigo-600 hover:text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  {purchaseLoading === srv.id ? (
                    <>
                      <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                      Routing Platform Commission...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Purchase Service
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="col-span-full py-16 text-center space-y-3 border border-dashed rounded-xl">
              <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-mono text-sm">No independent vendor services matching your query have been listed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulated 'Fund Wallet' Modal */}
      {isFundingModalOpen && currentUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-xl text-left space-y-6 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsFundingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {fundingSuccess ? (
              /* Success View */
              <div className="text-center py-6 space-y-5">
                <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Secure Top-up Approved!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs px-4">
                    Your digital wallet has been credited with the requested funds. The transaction is logged on the Smart Link secure ledger.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 max-w-xs mx-auto border border-slate-100 dark:border-slate-800/80 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Recipient Email:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Funding Method:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{fundingMethod === "BANK" ? "Bank Wire Transfer" : "Paystack Card Payment"}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-200 dark:border-slate-800/80 pt-2 font-bold text-sm">
                    <span className="text-slate-900 dark:text-slate-100">Amount Credited:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">₦{fundedAmountRealized.toLocaleString()}.00</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsFundingModalOpen(false)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Return to Marketplace
                </button>
              </div>
            ) : (
              /* Main Form View */
              <div className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Wallet className="h-5 w-5" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">Secure Payment Gateway</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Fund Digital Wallet</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Initiate a Paystack card transaction or bank wire transfer to update your balance immediately.
                  </p>
                </div>

                {/* Error Banner */}
                {fundingError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{fundingError}</span>
                  </div>
                )}

                {/* Tab select */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setFundingMethod("BANK");
                      setFundingError(null);
                    }}
                    className={`py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      fundingMethod === "BANK"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Building className="h-3.5 w-3.5" />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFundingMethod("CARD");
                      setFundingError(null);
                    }}
                    className={`py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      fundingMethod === "CARD"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Card Payment
                  </button>
                </div>

                <form onSubmit={handleFundWallet} className="space-y-4">
                  {/* Amount Entry */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Top-up Amount (NGN)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold font-mono text-xs">
                        ₦
                      </span>
                      <input
                        type="number"
                        required
                        min="100"
                        max="500000"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        placeholder="Amount (e.g. 10000)"
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Min: ₦100 | Max: ₦500,000</p>
                  </div>

                  {fundingMethod === "BANK" ? (
                    /* Bank Transfer Mock Details */
                    <div className="space-y-3.5">
                      <div className="p-3 bg-indigo-50/40 dark:bg-slate-950/50 rounded-xl border border-indigo-100/50 dark:border-slate-800 text-xs space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Beneficiary Bank:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">Smart Link Demo Wire</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Account Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 select-all bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100/40 dark:border-indigo-900/30">
                              99537f8d90
                            </span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText("99537f8d90")}
                              className="text-[10px] text-indigo-500 hover:underline font-bold"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account Name:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                            SML-Portal / {currentUser.email.split("@")[0]}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-100/50 dark:border-amber-900/20 text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                        Upon transferring funds to the dedicated account details shown above, click the authorization button below to let the Gateway confirm and instantly credit your wallet balance.
                      </div>
                    </div>
                  ) : (
                    /* Card Simulation Fields */
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Adamu Muhammad"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4111 2222 3333 4444"
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                          />
                          <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/29"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            CVV
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Submission buttons */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFundingModalOpen(false)}
                      className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={fundingLoading}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {fundingLoading ? (
                        <>
                          <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          {fundingMethod === "BANK" ? "Confirm Wire" : "Pay Now"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
