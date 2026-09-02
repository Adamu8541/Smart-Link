/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Globe,
  GraduationCap,
  Dices,
  Shield,
  Droplets,
  Trash2,
  Landmark,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Printer,
  Share2,
  Clock,
  ShieldCheck,
  CreditCard,
  Wallet as WalletIcon,
  ChevronRight,
  UserCheck,
  BarChart3,
  Filter,
  Eye,
  FileText
} from "lucide-react";
import QRCode from "qrcode";
import { UserProfile, UserRole } from "../../types";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import {
  BillCategory,
  BillCategoryType,
  BillPlan,
  BillProvider,
  BillPaymentRequest,
  BillPaymentResponse,
  CustomerValidationResponse
} from "../../types/bills";
import { BillPaymentEngine } from "../../services/billPaymentEngine";

export interface BillPaymentViewProps {
  currentUser: UserProfile;
  onBackToDashboard: () => void;
  onBalanceUpdate: () => void;
  initialCategory?: BillCategoryType;
}

export const BillPaymentView: React.FC<BillPaymentViewProps> = ({
  currentUser,
  onBackToDashboard,
  onBalanceUpdate,
  initialCategory
}) => {
  // Categories state
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Active Category & Provider selection
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [providers, setProviders] = useState<BillProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
  const [plans, setPlans] = useState<BillPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillPlan | null>(null);

  // Form inputs
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser.phoneNumber || "");
  const [customerId, setCustomerId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [meterType, setMeterType] = useState<"PREPAID" | "POSTPAID">("PREPAID");
  const [institutionId, setInstitutionId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [customFields, setCustomFields] = useState<{ [key: string]: string }>({});

  // Customer verification state
  const [isValidatingCustomer, setIsValidatingCustomer] = useState(false);
  const [customerValidation, setCustomerValidation] = useState<CustomerValidationResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Confirmation Modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Result state
  const [paymentResult, setPaymentResult] = useState<BillPaymentResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // History & Admin Stats state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"CATALOG" | "FORM" | "RESULT" | "HISTORY" | "ADMIN_STATS">("CATALOG");

  // Admin stats
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);

  // Feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const walletBalance = currentUser.walletBalance || 0;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  // Load Categories on mount
  useEffect(() => {
    loadCategoriesCatalog();
    loadHistory();
  }, []);

  const loadCategoriesCatalog = async () => {
    setLoadingCategories(true);
    const catList = await BillPaymentEngine.getCategories();
    setCategories(catList);
    setLoadingCategories(false);

    if (initialCategory) {
      const match = catList.find((c) => c.id === initialCategory);
      if (match) selectCategory(match);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/bills/history?userId=${currentUser.uid}`);
      const data = await res.json();
      if (res.ok && data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Error loading bill history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAdminStats = async () => {
    setLoadingAdminStats(true);
    try {
      const res = await fetch("/api/admin/bills/stats");
      const data = await res.json();
      if (res.ok && data.stats) {
        setAdminStats(data.stats);
      }
    } catch (e) {
      console.error("Error loading admin bill stats:", e);
    } finally {
      setLoadingAdminStats(false);
    }
  };

  // Select Category
  const selectCategory = async (category: BillCategory) => {
    setSelectedCategory(category);
    setSelectedProvider(null);
    setSelectedPlan(null);
    setCustomerValidation(null);
    setValidationError(null);
    setCustomerId("");
    setAmount("");
    setViewMode("FORM");

    // Fetch Providers
    const provs = await BillPaymentEngine.getProviders(category.id);
    setProviders(provs);
    if (provs.length > 0) {
      selectProvider(provs[0], category.id);
    }
  };

  // Select Provider
  const selectProvider = async (provider: BillProvider, categoryId?: BillCategoryType) => {
    setSelectedProvider(provider);
    setSelectedPlan(null);
    setCustomerValidation(null);
    setValidationError(null);

    const cat = categoryId || (selectedCategory ? selectedCategory.id : "AIRTIME");
    const planList = await BillPaymentEngine.getPlans(provider.code, cat);
    setPlans(planList);
    if (planList.length > 0) {
      setSelectedPlan(planList[0]);
      setAmount(planList[0].amount.toString());
    }
  };

  // Validate Customer ID (Meter, IUC, Betting Account)
  const handleValidateCustomer = async () => {
    if (!selectedCategory || !selectedProvider || !customerId) {
      setValidationError("Please enter a valid Account, Meter or Customer ID.");
      return;
    }

    setIsValidatingCustomer(true);
    setValidationError(null);
    setCustomerValidation(null);

    const res = await BillPaymentEngine.validateCustomer({
      category: selectedCategory.id,
      providerCode: selectedProvider.code,
      customerId,
      meterType: selectedCategory.id === "ELECTRICITY" ? meterType : undefined
    });

    setIsValidatingCustomer(false);
    if (!res.valid) {
      setValidationError(res.errorMessage || "Account validation failed. Please check the ID entered.");
    } else {
      setCustomerValidation(res);
      if (res.minimumAmount && !amount) {
        setAmount(res.minimumAmount.toString());
      }
    }
  };

  // Form submission / Initiate Confirmation
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedCategory || !selectedProvider) {
      setValidationError("Please select a valid service category and provider.");
      return;
    }

    const payAmt = selectedPlan ? selectedPlan.amount : parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setValidationError("Please specify a valid payment amount greater than ₦0.");
      return;
    }

    // Category specific validations
    if (selectedCategory.id === "AIRTIME" || selectedCategory.id === "DATA") {
      const phoneCheck = BillPaymentEngine.validatePhoneNumber(phoneNumber);
      if (!phoneCheck.valid) {
        setValidationError(phoneCheck.error || "Invalid phone number.");
        return;
      }
    }

    if (
      (selectedCategory.id === "ELECTRICITY" ||
        selectedCategory.id === "CABLE_TV" ||
        selectedCategory.id === "BETTING" ||
        selectedCategory.id === "INTERNET") &&
      !customerId
    ) {
      setValidationError("Account / Meter / Customer ID is strictly required.");
      return;
    }

    // Customer validation check for categories requiring validation
    if (selectedCategory.requiresValidation && !customerValidation) {
      // Auto-trigger validation first
      handleValidateCustomer();
      return;
    }

    // Check balance
    const charge = selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0;
    const totalCost = payAmt + charge;

    if (walletBalance < totalCost) {
      setValidationError(
        `Insufficient wallet balance. Your available balance is ₦${walletBalance.toLocaleString(
          "en-NG",
          { minimumFractionDigits: 2 }
        )}, but total cost is ₦${totalCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`
      );
      return;
    }

    setShowConfirmation(true);
  };

  // Confirm and execute payment
  const handleConfirmPayment = async () => {
    if (!selectedCategory || !selectedProvider) return;

    setIsProcessingPayment(true);
    const payAmt = selectedPlan ? selectedPlan.amount : parseFloat(amount);
    const charge = selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0;

    const req: BillPaymentRequest = {
      userId: currentUser.uid,
      category: selectedCategory.id,
      providerCode: selectedProvider.code,
      providerName: selectedProvider.name,
      customerId: customerId || phoneNumber,
      customerName: customerValidation?.customerName || currentUser.fullName,
      amount: payAmt,
      charge,
      meterType: selectedCategory.id === "ELECTRICITY" ? meterType : undefined,
      planId: selectedPlan?.id,
      planName: selectedPlan?.planName,
      phoneNumber,
      network: selectedProvider.code
    };

    const res = await BillPaymentEngine.executePayment(req);
    setIsProcessingPayment(false);
    setShowConfirmation(false);

    setPaymentResult(res);
    setViewMode("RESULT");

    if (res.success) {
      onBalanceUpdate();
      loadHistory();
      if (res.smartlinkReference) {
        generateQrCode(res.smartlinkReference);
      }
    }
  };

  // Generate QR Code for receipt
  const generateQrCode = (ref: string) => {
    QRCode.toDataURL(ref, { width: 220, margin: 2 }, (err, url) => {
      if (!err && url) setQrCodeDataUrl(url);
    });
  };

  // Download Official PDF Receipt
  const handleDownloadPDF = async (resObj: BillPaymentResponse) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Header background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SMART LINK BILL PAYMENT ENGINE", 15, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Utility Payment Voucher & Transaction Receipt", 15, 26);

    // Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("BILL PAYMENT RECEIPT", 15, 46);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt ID: ${resObj.receiptId || "REC-" + Date.now()}`, 15, 53);
    doc.text(`Date & Time: ${new Date(resObj.timestamp).toLocaleString("en-NG")}`, 15, 59);

    // Main Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 66, 180, 105, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Service & Provider Details", 22, 76);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Service Category: ${resObj.serviceName}`, 22, 84);
    doc.text(`Provider: ${resObj.providerName}`, 22, 91);
    doc.text(`Account / Customer ID: ${resObj.customerId}`, 22, 98);
    if (resObj.customerName) {
      doc.text(`Customer Name: ${resObj.customerName}`, 22, 105);
    }

    // Token highlight box if electricity or pins
    let yPos = 112;
    if (resObj.token) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(22, yPos, 166, 20, 2, 2, "FD");
      doc.setTextColor(4, 120, 87);
      doc.setFont("helvetica", "bold");
      doc.text(`ELECTRICITY TOKEN: ${resObj.token}`, 26, yPos + 9);
      if (resObj.units) {
        doc.setFont("helvetica", "normal");
        doc.text(`Units: ${resObj.units}`, 26, yPos + 16);
      }
      doc.setTextColor(30, 41, 59);
      yPos += 26;
    } else if (resObj.pins && resObj.pins.length > 0) {
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(99, 102, 241);
      doc.roundedRect(22, yPos, 166, 20, 2, 2, "FD");
      doc.setTextColor(67, 56, 202);
      doc.setFont("helvetica", "bold");
      doc.text(`EXAM PIN: ${resObj.pins[0].pin} (Serial: ${resObj.pins[0].serial})`, 26, yPos + 12);
      doc.setTextColor(30, 41, 59);
      yPos += 26;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Financial Breakdown", 22, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.text(`Amount Paid: NGN ${(resObj.amountPaid || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 22, yPos + 16);
    doc.text(`Convenience Charge: NGN ${(resObj.charge || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 22, yPos + 22);
    doc.text(`Total Deducted: NGN ${(resObj.totalDeducted || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 22, yPos + 28);
    doc.text(`Status: ${resObj.status}`, 22, yPos + 34);

    doc.text(`SmartLink Ref: ${resObj.smartlinkReference}`, 110, yPos + 16);
    doc.text(`Provider Ref: ${resObj.providerReference || "PROV-ACK"}`, 110, yPos + 22);
    doc.text(`Wallet Balance After: NGN ${(resObj.balanceAfter || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 110, yPos + 28);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This payment was verified and settled via SmartLink Central API Provider Engine.", 15, 185);
    doc.text("For assistance, contact support@smartlinkng.com.ng with your SmartLink Reference.", 15, 190);

    doc.save(`SmartLink_Bill_Receipt_${resObj.smartlinkReference}.pdf`);
  };

  // Helper copy text
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Category Icon Mapper
  const renderCategoryIcon = (iconName: string, className = "h-6 w-6") => {
    switch (iconName) {
      case "Smartphone": return <Smartphone className={className} />;
      case "Wifi": return <Wifi className={className} />;
      case "Zap": return <Zap className={className} />;
      case "Tv": return <Tv className={className} />;
      case "Globe": return <Globe className={className} />;
      case "GraduationCap": return <GraduationCap className={className} />;
      case "Dices": return <Dices className={className} />;
      case "Shield": return <Shield className={className} />;
      case "Droplets": return <Droplets className={className} />;
      case "Trash2": return <Trash2 className={className} />;
      case "Landmark": return <Landmark className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // Filter history items
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.smartlinkReference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.providerName || item.provider || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customerId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serviceName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "ALL" || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Wallet Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111827] via-[#0F2D5C] to-[#111827] p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#0F2D5C]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToDashboard}
                className="text-xs text-[#9CA3AF] hover:text-white font-bold flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
              >
                ← Back to Portal
              </button>
              <span className="text-xs font-bold text-[#9CA3AF] bg-[#0F2D5C]/20 px-2.5 py-1 rounded-full border border-[#0F2D5C]/30 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Module 7 Payment Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Bill Payment Services</h1>
            <p className="text-xs text-[#E5E7EB] max-w-xl leading-relaxed">
              Pay Electricity, Cable TV, Airtime, Data, Exams, Betting & Utility bills with instant automated provider verification.
            </p>
          </div>

          {/* Wallet summary pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shrink-0 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#0F2D5C]/20 border border-[#E5E7EB]/30 flex items-center justify-center text-[#9CA3AF]">
              <WalletIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#E5E7EB] uppercase tracking-wider font-semibold">Wallet Balance</span>
              <p className="text-xl md:text-2xl font-black font-mono text-white">
                ₦{walletBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setViewMode("CATALOG");
              setSelectedCategory(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "CATALOG" ? "bg-white text-[#111827] font-bold" : "text-[#E5E7EB] hover:text-white hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Service Catalog
          </button>
          <button
            onClick={() => {
              setViewMode("HISTORY");
              loadHistory();
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "HISTORY" ? "bg-white text-[#111827] font-bold" : "text-[#E5E7EB] hover:text-white hover:bg-white/10"
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Payment History ({history.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setViewMode("ADMIN_STATS");
                loadAdminStats();
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "ADMIN_STATS" ? "bg-[#0F2D5C] text-[#111827] font-bold" : "text-[#9CA3AF] hover:text-white hover:bg-white/10"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Admin Analytics
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: CATEGORY CATALOG DASHBOARD */}
      {viewMode === "CATALOG" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">Supported Payment Categories</h2>
              <p className="text-xs text-[#6B7280]">Select a service category to initiate instant bill settlement.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#0F2D5C]"></span> 100% Provider API Gateway Online
            </div>
          </div>

          {loadingCategories ? (
            <div className="py-16 text-center space-y-3 flex flex-col items-center">
              <SmartLinkLogoMark size="lg" animating={true} />
              <p className="text-xs text-[#6B7280] font-medium">Loading Bill Payment categories catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => selectCategory(cat)}
                  className="group bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl p-5 hover:border-[#0F2D5C] dark:hover:border-[#0F2D5C] hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer space-y-4 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/50 border border-[#E5E7EB] dark:border-[#0F2D5C] flex items-center justify-center text-[#0F2D5C] dark:text-[#9CA3AF] group-hover:scale-110 transition-transform">
                        {renderCategoryIcon(cat.icon)}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 text-[#0F2D5C] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#0F2D5C]">
                        {cat.providerStatus}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-[#111827] dark:text-white text-base group-hover:text-[#0F2D5C] dark:group-hover:text-[#9CA3AF] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#0F2D5C]" /> {cat.estimatedProcessingTime}
                    </span>
                    <span className="text-[#0F2D5C] dark:text-[#9CA3AF] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Pay <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BILL PAYMENT FORM */}
      {viewMode === "FORM" && selectedCategory && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#111827] pb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("CATALOG")}
                className="p-2.5 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0F2D5C] dark:text-[#9CA3AF] uppercase tracking-wider font-mono">
                    Category: {selectedCategory.id}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#111827] dark:text-white">{selectedCategory.name}</h2>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F5F7FA] dark:bg-[#111827]/50 px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#4B5563]">
              <Clock className="h-3.5 w-3.5 text-[#0F2D5C]" /> Estimated: {selectedCategory.estimatedProcessingTime}
            </div>
          </div>

          {validationError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          <form onSubmit={handleInitiatePayment} className="space-y-6">
            {/* Step 1: Select Provider */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB] uppercase tracking-wider">
                1. Select Provider / Service Network
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {providers.map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => selectProvider(prov)}
                    className={`p-3.5 rounded-xl border font-bold text-xs transition-all text-center cursor-pointer ${
                      selectedProvider?.code === prov.code
                        ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-md shadow-indigo-600/20"
                        : "bg-[#F5F7FA] dark:bg-[#111827]/50 text-[#4B5563] dark:text-[#E5E7EB] border-[#E5E7EB] dark:border-[#4B5563] hover:border-[#E5E7EB]"
                    }`}
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Meter Type selection for Electricity */}
            {selectedCategory.id === "ELECTRICITY" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB] uppercase tracking-wider">
                  Select Meter Type
                </label>
                <div className="flex items-center gap-3">
                  {(["PREPAID", "POSTPAID"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setMeterType(type);
                        setCustomerValidation(null);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                        meterType === type
                          ? "bg-[#0F2D5C] text-white border-[#0F2D5C]"
                          : "bg-[#F5F7FA] dark:bg-[#111827]/50 text-[#4B5563] dark:text-[#E5E7EB] border-[#E5E7EB] dark:border-[#4B5563]"
                      }`}
                    >
                      {type} METER
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Data Plans catalog selector if DATA or CABLE or EDUCATION */}
            {plans.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB] uppercase tracking-wider">
                  Select Plan / Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPlan(p);
                        setAmount(p.amount.toString());
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        selectedPlan?.id === p.id
                          ? "bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border-[#0F2D5C] ring-2 ring-[#0F2D5C]/20"
                          : "bg-[#F5F7FA] dark:bg-[#111827]/30 border-[#E5E7EB] dark:border-[#4B5563] hover:border-[#E5E7EB]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111827] dark:text-white">{p.planName}</span>
                        <span className="text-xs font-mono font-black text-[#0F2D5C] dark:text-[#9CA3AF]">
                          ₦{p.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span>Validity: {p.validity || "Standard"}</span>
                        <span>{p.dataVolume || "Instant"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Airtime & Data Phone Number */}
              {(selectedCategory.id === "AIRTIME" || selectedCategory.id === "DATA") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                    Target Phone Number (11-Digits)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="08012345678"
                      className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-sm outline-none transition-all bg-white dark:bg-[#111827] text-[#111827] dark:text-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#F5F7FA]"
                    />
                  </div>
                </div>
              )}

              {/* Customer ID / Meter Number / IUC Number */}
              {selectedCategory.id !== "AIRTIME" && selectedCategory.id !== "DATA" && (
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                      {selectedCategory.id === "ELECTRICITY"
                        ? "Meter Number"
                        : selectedCategory.id === "CABLE_TV"
                        ? "Smart Card Number / IUC Number"
                        : selectedCategory.id === "BETTING"
                        ? "Betting Customer User ID"
                        : selectedCategory.id === "EDUCATION"
                        ? "Candidate Exam / Student ID"
                        : "Account / Customer ID"}
                    </label>
                    {selectedCategory.requiresValidation && (
                      <button
                        type="button"
                        onClick={handleValidateCustomer}
                        disabled={isValidatingCustomer || !customerId}
                        className="text-xs font-bold text-[#0F2D5C] dark:text-[#9CA3AF] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isValidatingCustomer ? (
                          <>
                            <SmartLinkLogoMark size="xs" color="#4F46E5" animating={true} /> Verifying...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Verify Customer
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        setCustomerValidation(null);
                      }}
                      placeholder="e.g. 45019283921"
                      className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-sm outline-none transition-all bg-white dark:bg-[#111827] text-[#111827] dark:text-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#F5F7FA] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Amount input if not selecting fixed plan */}
              {!selectedPlan && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB]">
                    Payment Amount (NGN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#9CA3AF] text-sm">₦</span>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-9 pr-4 py-3 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-sm outline-none transition-all bg-white dark:bg-[#111827] text-[#111827] dark:text-white focus:border-[#0F2D5C] focus:ring-4 focus:ring-[#F5F7FA]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customer Validation Success Details Box */}
            {customerValidation && customerValidation.valid && (
              <div className="p-4 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/30 border border-[#E5E7EB] dark:border-[#0F2D5C] space-y-2 animate-fadeIn text-xs text-[#0F2D5C] dark:text-[#9CA3AF]">
                <div className="flex items-center gap-1.5 font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
                  <CheckCircle2 className="h-4 w-4 text-[#0F2D5C]" /> Account Verified Successfully
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] uppercase text-[#0F2D5C] dark:text-[#9CA3AF]">Customer Name</span>
                    <p className="font-bold text-[#111827] dark:text-white">{customerValidation.customerName || "N/A"}</p>
                  </div>
                  {customerValidation.customerAddress && (
                    <div>
                      <span className="text-[10px] uppercase text-[#0F2D5C] dark:text-[#9CA3AF]">Address / Location</span>
                      <p className="font-bold text-[#111827] dark:text-white">{customerValidation.customerAddress}</p>
                    </div>
                  )}
                  {customerValidation.currentPlan && (
                    <div>
                      <span className="text-[10px] uppercase text-[#0F2D5C] dark:text-[#9CA3AF]">Current Bouquet</span>
                      <p className="font-bold text-[#111827] dark:text-white">{customerValidation.currentPlan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary Footer */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#6B7280] space-y-0.5">
                <div>
                  Convenience Fee: <strong className="text-[#111827] dark:text-white">
                    ₦{(selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  Total Payable: <strong className="text-[#0F2D5C] dark:text-[#9CA3AF] font-mono font-bold text-sm">
                    ₦{((selectedPlan ? selectedPlan.amount : parseFloat(amount) || 0) + (selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Confirmation</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmation && selectedCategory && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#111827] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2D5C] dark:text-[#9CA3AF]">
                  Transaction Audit Review
                </span>
                <h3 className="text-lg font-bold text-[#111827] dark:text-white">Confirm Bill Payment</h3>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-white cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#F5F7FA] dark:bg-[#111827]/50 p-4 rounded-2xl space-y-2 border border-[#E5E7EB] dark:border-[#4B5563]">
                <div className="flex justify-between text-[#4B5563] dark:text-[#9CA3AF]">
                  <span>Service Category</span>
                  <strong className="text-[#111827] dark:text-white">{selectedCategory.name}</strong>
                </div>
                <div className="flex justify-between text-[#4B5563] dark:text-[#9CA3AF]">
                  <span>Provider</span>
                  <strong className="text-[#111827] dark:text-white">{selectedProvider.name}</strong>
                </div>
                <div className="flex justify-between text-[#4B5563] dark:text-[#9CA3AF]">
                  <span>Target Customer ID</span>
                  <strong className="text-[#111827] dark:text-white font-mono">{customerId || phoneNumber}</strong>
                </div>
                {customerValidation?.customerName && (
                  <div className="flex justify-between text-[#4B5563] dark:text-[#9CA3AF]">
                    <span>Verified Name</span>
                    <strong className="text-[#0F2D5C] dark:text-[#9CA3AF]">{customerValidation.customerName}</strong>
                  </div>
                )}
              </div>

              <div className="bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 p-4 rounded-2xl space-y-2 border border-[#E5E7EB] dark:border-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] font-medium">
                <div className="flex justify-between">
                  <span>Base Bill Amount</span>
                  <span>₦{(selectedPlan ? selectedPlan.amount : parseFloat(amount)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Convenience Fee</span>
                  <span>₦{(selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#0F2D5C] flex justify-between font-bold text-sm text-[#0F2D5C] dark:text-white">
                  <span>Total Debit Amount</span>
                  <span className="font-mono text-base">
                    ₦{((selectedPlan ? selectedPlan.amount : parseFloat(amount)) + (selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#E5E7EB] dark:bg-[#111827] rounded-xl flex justify-between text-[11px] text-[#4B5563] dark:text-[#E5E7EB]">
                <span>Wallet Balance After Payment</span>
                <strong className="font-mono text-[#111827] dark:text-white">
                  ₦{(walletBalance - ((selectedPlan ? selectedPlan.amount : parseFloat(amount)) + (selectedCategory.id === "ELECTRICITY" || selectedCategory.id === "CABLE_TV" ? 100 : 0))).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessingPayment}
                className="flex-1 py-3 px-4 rounded-xl border border-[#E5E7EB] dark:border-[#4B5563] text-[#4B5563] dark:text-[#E5E7EB] font-bold text-xs hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} /> Authorizing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Authorize & Debit Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TRANSACTION RESULT & RECEIPT */}
      {viewMode === "RESULT" && paymentResult && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm max-w-3xl mx-auto animate-fadeIn">
          {paymentResult.success ? (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center space-y-2 py-4 border-b border-[#E5E7EB] dark:border-[#111827]">
                <div className="h-16 w-16 rounded-full bg-[#E5E7EB] dark:bg-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-[#111827] dark:text-white">Bill Payment Successful!</h2>
                <p className="text-xs text-[#6B7280]">
                  Your transaction has been processed and settled instantly via SmartLink Provider Gateway.
                </p>
              </div>

              {/* Token or Pin Highlight Box if present */}
              {paymentResult.token && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F2D5C] to-[#111827] text-white space-y-3 shadow-xl border border-[#0F2D5C]/30">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">
                    Generated Electricity Meter Token
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl md:text-3xl font-mono font-black tracking-widest text-[#9CA3AF]">
                      {paymentResult.token}
                    </span>
                    <button
                      onClick={() => copyToClipboard(paymentResult.token!, "token")}
                      className="px-3.5 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-[#111827] font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      {copiedText === "token" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedText === "token" ? "Copied" : "Copy Token"}</span>
                    </button>
                  </div>
                  {paymentResult.units && (
                    <div className="text-xs text-[#E5E7EB] pt-1">
                      Power Units Allocated: <strong className="text-white font-bold">{paymentResult.units}</strong>
                    </div>
                  )}
                </div>
              )}

              {paymentResult.pins && paymentResult.pins.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#0F2D5C] text-white space-y-2 border border-[#0F2D5C]">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF]">Exam PIN Voucher Details</span>
                  <div className="font-mono text-sm space-y-1">
                    <p>PIN: <strong className="text-[#9CA3AF] text-lg">{paymentResult.pins[0].pin}</strong></p>
                    <p>Serial: {paymentResult.pins[0].serial}</p>
                  </div>
                </div>
              )}

              {/* Key Value Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-[#F5F7FA] dark:bg-[#111827]/40 p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#4B5563]">
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Service</span>
                  <p className="font-bold text-[#111827] dark:text-white mt-0.5">{paymentResult.serviceName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Provider</span>
                  <p className="font-bold text-[#111827] dark:text-white mt-0.5">{paymentResult.providerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Account / Phone</span>
                  <p className="font-bold text-[#111827] dark:text-white mt-0.5 font-mono">{paymentResult.customerId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Amount Paid</span>
                  <p className="font-bold text-[#0F2D5C] dark:text-[#9CA3AF] mt-0.5 font-mono">
                    ₦{paymentResult.amountPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">SmartLink Ref</span>
                  <p className="font-bold text-[#111827] dark:text-white mt-0.5 font-mono text-[11px] truncate">
                    {paymentResult.smartlinkReference}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Provider Ref</span>
                  <p className="font-bold text-[#111827] dark:text-white mt-0.5 font-mono text-[11px] truncate">
                    {paymentResult.providerReference || "N/A"}
                  </p>
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#111827]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(paymentResult)}
                    className="px-4 py-2.5 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Download PDF Receipt
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] text-xs font-bold hover:bg-[#E5E7EB] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="h-4 w-4" /> Print
                  </button>
                </div>

                <button
                  onClick={() => {
                    setViewMode("CATALOG");
                    setSelectedCategory(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#111827] dark:bg-[#E5E7EB] text-white dark:text-[#111827] text-xs font-bold transition-all cursor-pointer"
                >
                  Done / Make Another Payment
                </button>
              </div>
            </div>
          ) : (
            /* Failed Result View */
            <div className="text-center py-6 space-y-6">
              <div className="h-16 w-16 rounded-full bg-[#E5E7EB] dark:bg-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#111827] dark:text-white">Bill Payment Failed</h2>
                <p className="text-xs text-[#0F2D5C] dark:text-[#9CA3AF] max-w-md mx-auto font-medium">
                  {paymentResult.errorMessage || "The payment could not be completed by the provider gateway."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#111827]">
                <button
                  onClick={() => setViewMode("FORM")}
                  className="px-5 py-2.5 rounded-xl bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Retry Payment
                </button>
                <button
                  onClick={() => setViewMode("CATALOG")}
                  className="px-5 py-2.5 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] font-bold text-xs hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                >
                  Go Back to Catalog
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: PAYMENT HISTORY AUDIT TRAIL */}
      {viewMode === "HISTORY" && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#111827] pb-5">
            <div>
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">Bill Payment Audit Trail</h2>
              <p className="text-xs text-[#6B7280]">View, search, filter, and re-download official receipts.</p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="p-2.5 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} /> Sync History
            </button>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, customer ID, or provider..."
                className="w-full pl-9 pr-4 py-2.5 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs outline-none bg-white dark:bg-[#111827] text-[#111827] dark:text-white"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl text-xs outline-none bg-white dark:bg-[#111827] text-[#111827] dark:text-white font-semibold cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="AIRTIME">Airtime</option>
              <option value="DATA">Data</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="CABLE_TV">Cable TV</option>
              <option value="EDUCATION">Education</option>
              <option value="BETTING">Betting</option>
            </select>
          </div>

          {/* Table */}
          {loadingHistory ? (
            <div className="py-12 text-center space-y-2 flex flex-col items-center">
              <SmartLinkLogoMark size="md" animating={true} />
              <p className="text-xs text-[#6B7280] font-medium">Loading history records...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6B7280] space-y-2">
              <FileText className="h-10 w-10 text-[#E5E7EB] mx-auto" />
              <p>No bill payment records matching your filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#111827] text-[#9CA3AF] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-2">Service / Provider</th>
                    <th className="pb-3">Customer ID</th>
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F5F7FA] dark:hover:bg-[#111827]/40 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-[#111827] dark:text-white">
                        {item.serviceName || item.service || "Bill Payment"}
                        <div className="text-[10px] text-[#9CA3AF] font-normal">{item.providerName || item.provider}</div>
                      </td>
                      <td className="py-3.5 font-mono text-[#4B5563] dark:text-[#E5E7EB]">{item.customerId || item.recipient || "N/A"}</td>
                      <td className="py-3.5 font-mono text-[#6B7280] text-[11px]">{item.smartlinkReference || item.reference}</td>
                      <td className="py-3.5 font-mono font-bold text-[#111827] dark:text-white">
                        ₦{(item.amount || item.amountPaid || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "SUCCESSFUL" || item.status === "SUCCESS"
                            ? "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]"
                            : "bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#6B7280] text-[11px]">
                        {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleDateString("en-NG")}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          onClick={() => handleDownloadPDF({
                            success: true,
                            transactionId: item.id,
                            smartlinkReference: item.smartlinkReference || item.reference,
                            providerReference: item.providerReference || "PROV-ACK",
                            receiptId: item.receiptId || "REC-" + item.id,
                            serviceName: item.serviceName || item.service || "Bill Payment",
                            category: item.category || "AIRTIME",
                            providerName: item.providerName || item.provider || "Gateway",
                            customerId: item.customerId || item.recipient || "N/A",
                            amountPaid: item.amount || 0,
                            charge: item.charge || 0,
                            totalDeducted: (item.amount || 0) + (item.charge || 0),
                            status: item.status || "SUCCESSFUL",
                            balanceBefore: item.balanceBefore || 0,
                            balanceAfter: item.balanceAfter || 0,
                            timestamp: item.createdAt || new Date().toISOString()
                          })}
                          className="px-2.5 py-1 bg-[#F5F7FA] dark:bg-[#0F2D5C] text-[#0F2D5C] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: ADMIN PERFORMANCE ANALYTICS */}
      {viewMode === "ADMIN_STATS" && isAdmin && (
        <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#111827] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2D5C] dark:text-[#9CA3AF]">
                Staff Admin Telemetry
              </span>
              <h2 className="text-xl font-bold text-[#111827] dark:text-white">Bill Payment Engine Analytics</h2>
            </div>
            <button
              onClick={loadAdminStats}
              disabled={loadingAdminStats}
              className="px-3.5 py-2 rounded-xl bg-[#0F2D5C]/10 text-[#0F2D5C] dark:text-[#9CA3AF] font-bold text-xs hover:bg-[#0F2D5C]/20 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingAdminStats ? "animate-spin" : ""}`} /> Refresh Metrics
            </button>
          </div>

          {loadingAdminStats || !adminStats ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="h-8 w-8 text-[#0F2D5C] animate-spin mx-auto" />
              <p className="text-xs text-[#6B7280]">Aggregating bill payment performance metrics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827]/40 border border-[#E5E7EB] dark:border-[#4B5563] space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Total Payments</span>
                  <p className="text-2xl font-black text-[#111827] dark:text-white font-mono">{adminStats.totalPayments}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827]/40 border border-[#E5E7EB] dark:border-[#4B5563] space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Gross Volume</span>
                  <p className="text-2xl font-black text-[#0F2D5C] dark:text-[#9CA3AF] font-mono">
                    ₦{adminStats.totalVolume.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827]/40 border border-[#E5E7EB] dark:border-[#4B5563] space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Success Rate</span>
                  <p className="text-2xl font-black text-[#0F2D5C] dark:text-[#9CA3AF] font-mono">{adminStats.successRate}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827]/40 border border-[#E5E7EB] dark:border-[#4B5563] space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Avg Processing Time</span>
                  <p className="text-2xl font-black text-[#0F2D5C] dark:text-[#9CA3AF] font-mono">{adminStats.avgProcessingTimeMs}ms</p>
                </div>
              </div>

              {/* Provider Performance Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB] uppercase tracking-wider">
                  Provider Gateway Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] dark:border-[#111827] text-[#9CA3AF] font-semibold uppercase text-[10px]">
                        <th className="pb-2">Provider Name</th>
                        <th className="pb-2">Total Executed</th>
                        <th className="pb-2">Successful</th>
                        <th className="pb-2">Failed</th>
                        <th className="pb-2 text-right">Avg Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {(adminStats.providerPerformance || []).map((prov: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-bold font-sans text-[#111827] dark:text-white">{prov.provider}</td>
                          <td className="py-2.5">{prov.total}</td>
                          <td className="py-2.5 text-[#0F2D5C] font-bold">{prov.success}</td>
                          <td className="py-2.5 text-[#0F2D5C] font-bold">{prov.failed}</td>
                          <td className="py-2.5 text-right">{prov.avgTime}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
