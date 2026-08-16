/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  Plus,
  CreditCard,
  Building2,
  QrCode,
  Copy,
  Check,
  Share2,
  RefreshCw,
  History,
  Lock,
  ShieldCheck,
  ArrowUpRight,
  Download,
  Printer,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  UserCheck,
  Search,
  FileText,
  Clock,
  ArrowDownLeft,
  DollarSign
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { UserProfile, UserRole } from "../../types";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";
import { ProviderService, ActiveProviderConfig, getAuthHeaders } from "../../services/providerService";

export interface VirtualAccountDetails {
  provider: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  userEmail?: string;
  createdAt?: string;
  status?: string;
  reference?: string;
}

export interface WalletFundingViewProps {
  currentUser: UserProfile;
  onBackToDashboard: () => void;
  onBalanceUpdate: () => void;
  initialTab?: "VIRTUAL_ACCOUNT" | "BANK_TRANSFER" | "CARD" | "ADMIN_CREDIT";
}

export const WalletFundingView: React.FC<WalletFundingViewProps> = ({
  currentUser,
  onBackToDashboard,
  onBalanceUpdate,
  initialTab = "VIRTUAL_ACCOUNT",
}) => {
  const [activeTab, setActiveTab] = useState<"VIRTUAL_ACCOUNT" | "BANK_TRANSFER" | "CARD" | "ADMIN_CREDIT">(
    initialTab
  );

  // Dynamic Payment Engine State
  const [activeProvider, setActiveProvider] = useState<ActiveProviderConfig | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<boolean>(true);

  // Balance display
  const [showBalance, setShowBalance] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(currentUser.walletBalance || 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Virtual Accounts state
  const [reservedAccount, setReservedAccount] = useState<VirtualAccountDetails | null>(null);
  const [loadingReserved, setLoadingReserved] = useState(false);

  // Dynamic Bank Transfer state
  const [transferAmount, setTransferAmount] = useState<string>("5000");
  const [dynamicBankInfo, setDynamicBankInfo] = useState<VirtualAccountDetails | null>(null);
  const [loadingDynamicBank, setLoadingDynamicBank] = useState(false);

  // Card Payment state
  const [cardAmount, setCardAmount] = useState<string>("2000");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardName, setCardName] = useState<string>(currentUser.fullName || "");
  const [isCardProcessing, setIsCardProcessing] = useState(false);
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [cardError, setCardError] = useState<string | null>(null);

  // Admin Manual Credit state
  const [targetEmailOrUid, setTargetEmailOrUid] = useState<string>("");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualAction, setManualAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [manualReason, setManualReason] = useState<string>("");
  const [isAdminProcessing, setIsAdminProcessing] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  // QR Code Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrAccountTitle, setQrAccountTitle] = useState<string>("");

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Webhook Sandbox simulation state
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);

  // Funding History & Receipt state
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  // Refresh User Profile & Wallet Balance
  const fetchLatestBalance = async () => {
    setIsRefreshing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/auth/profile?uid=${currentUser.uid}`, { headers });
      const data = await res.json();
      if (res.ok && data.user) {
        setWalletBalance(data.user.walletBalance || 0);
        onBalanceUpdate();
      }
    } catch (err) {
      console.error("Error refreshing wallet balance:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Load Virtual Accounts & History on mount
  useEffect(() => {
    loadActiveProvider();
    loadFundingHistory();
  }, [currentUser.uid]);

  const loadActiveProvider = async () => {
    setLoadingProvider(true);
    setProviderError(null);
    try {
      const res = await ProviderService.getActiveProvider(currentUser.uid);
      if (res.success && res.provider) {
        setActiveProvider(res.provider);
        loadVirtualAccounts(res.provider);
      } else {
        setActiveProvider(null);
        setProviderError(res.error || "No active payment provider configured.");
      }
    } catch (err) {
      setActiveProvider(null);
      setProviderError("No active payment provider configured.");
    } finally {
      setLoadingProvider(false);
    }
  };

  const loadVirtualAccounts = async (prov?: ActiveProviderConfig) => {
    setLoadingReserved(true);
    try {
      const vaRes = await ProviderService.getVirtualAccount(currentUser.uid);
      if (vaRes.success && vaRes.account) {
        setReservedAccount({
          provider: vaRes.account.providerName || prov?.name || "ACTIVE_PROVIDER",
          bankName: vaRes.account.bankName,
          accountNumber: vaRes.account.accountNumber,
          accountName: vaRes.account.accountName,
          status: vaRes.account.status,
          reference: vaRes.account.reference
        });
      }
    } catch (e) {
      console.error("Virtual Account fetch note:", e);
    } finally {
      setLoadingReserved(false);
    }
  };

  const loadFundingHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/wallet/funding-history?userId=${currentUser.uid}`);
      const data = await res.json();
      if (res.ok && data.history) {
        setFundingHistory(data.history);
      } else {
        // Fallback: fetch from transactions endpoint
        const txRes = await fetch(`/api/transaction/history?userId=${currentUser.uid}&serviceType=WALLET_FUNDING`);
        const txData = await txRes.json();
        if (txRes.ok && txData.transactions) {
          setFundingHistory(txData.transactions);
        }
      }
    } catch (e) {
      console.error("Error loading funding history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Generate or Retrieve Reserved Virtual Account
  const handleGenerateReservedAccount = async () => {
    setLoadingReserved(true);
    try {
      const res = await fetch("/api/wallet/virtual-account/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          provider: "GATEWAY",
          userEmail: currentUser.email,
          userName: currentUser.fullName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Reserved Account");
      setReservedAccount(data.virtualAccount);
    } catch (err: any) {
      alert(err.message || "Failed to generate Reserved Account");
    } finally {
      setLoadingReserved(false);
    }
  };

  // Generate Dynamic Bank Transfer
  const handleGenerateDynamicBank = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt < 100) {
      alert("Minimum transfer amount is ₦100");
      return;
    }
    setLoadingDynamicBank(true);
    try {
      const res = await fetch("/api/wallet/virtual-account/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          provider: "DYNAMIC_BANK",
          amount: amt,
          userEmail: currentUser.email,
          userName: currentUser.fullName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to allocate dynamic transfer account");
      setDynamicBankInfo(data.virtualAccount);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingDynamicBank(false);
    }
  };

  // Webhook automatic funding is processed directly via server-side active provider notifications

  // Card Payment Handler
  const handleInitiateCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    const amt = parseFloat(cardAmount);
    if (isNaN(amt) || amt < 100) {
      setCardError("Minimum funding amount via Card is ₦100.00.");
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 15) {
      setCardError("Please enter a valid 16-digit debit or credit card number.");
      return;
    }

    if (!cardExpiry || !cardCvv || cardCvv.length < 3) {
      setCardError("Please fill in card expiry date and 3-digit CVV.");
      return;
    }

    // Open 3DS OTP modal
    setShow3DSModal(true);
  };

  const handleVerify3DSOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      alert("Please enter the 6-digit OTP code sent to your registered mobile line.");
      return;
    }

    setIsCardProcessing(true);
    try {
      const amt = parseFloat(cardAmount);
      const res = await fetch("/api/wallet/fund/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          amount: amt,
          cardNumberMasked: `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(-4)}`,
          cardName,
          otpCode,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Card payment authorization failed.");

      setShow3DSModal(false);
      setOtpCode("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      alert(`🎉 Payment Authorized! ₦${amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })} has been instantly credited to your wallet.`);

      fetchLatestBalance();
      loadFundingHistory();

      window.dispatchEvent(
        new CustomEvent("wallet_credited", {
          detail: {
            amount: amt,
            gateway: "Debit Card (3D Secure)",
            reference: data.reference || `CARD-${Date.now()}`,
          },
        })
      );
    } catch (err: any) {
      alert(err.message || "Card verification error.");
    } finally {
      setIsCardProcessing(false);
    }
  };

  // Admin Manual Credit / Debit Handler
  const handleAdminManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);

    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      setAdminErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    if (!targetEmailOrUid) {
      setAdminErrorMsg("Please specify a target user email address or UID.");
      return;
    }

    if (!manualReason) {
      setAdminErrorMsg("Please specify a mandatory audit reason for this manual ledger adjustment.");
      return;
    }

    setIsAdminProcessing(true);
    try {
      const res = await fetch("/api/admin/wallet/manual-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          adminEmail: currentUser.email,
          targetEmailOrUid,
          action: manualAction,
          amount: amt,
          reason: manualReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Manual credit execution failed");

      setAdminSuccessMsg(
        `Success: Wallet ${manualAction === "CREDIT" ? "credited" : "debited"} with ₦${amt.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
        })} for user ${data.targetUser?.fullName || targetEmailOrUid}.`
      );
      setTargetEmailOrUid("");
      setManualAmount("");
      setManualReason("");
      fetchLatestBalance();
      loadFundingHistory();
    } catch (err: any) {
      setAdminErrorMsg(err.message || "Admin manual credit error.");
    } finally {
      setIsAdminProcessing(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show QR Modal helper
  const openQrModal = async (accountNumber: string, bankName: string, accountName: string) => {
    const payload = `Bank: ${bankName}\nAccount Number: ${accountNumber}\nAccount Name: ${accountName}`;
    try {
      const url = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
      setQrCodeDataUrl(url);
      setQrAccountTitle(`${bankName} - ${accountNumber}`);
      setShowQrModal(true);
    } catch (err) {
      console.error("QR Code error:", err);
    }
  };

  // Download Official PDF Receipt
  const downloadReceiptPDF = (receipt: any) => {
    const doc = new jsPDF();
    
    // Brand header
    doc.setFillColor(27, 100, 242);
    doc.rect(0, 0, 210, 30, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SMART LINK COMPUTER BUSINESS", 15, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Financial Payment Voucher & Wallet Receipt", 15, 25);

    // Title & Receipt Number
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("WALLET FUNDING RECEIPT", 15, 45);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt No: ${receipt.receiptId || receipt.id || "REC-" + Date.now()}`, 15, 52);
    doc.text(`Date & Time: ${new Date(receipt.createdAt || receipt.issueTimestamp || Date.now()).toLocaleString("en-NG")}`, 15, 58);

    // Box details
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 65, 180, 85, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.text("Customer Details:", 22, 75);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${currentUser.fullName}`, 22, 82);
    doc.text(`Email: ${currentUser.email}`, 22, 88);
    doc.text(`Phone: ${currentUser.phoneNumber || "N/A"}`, 22, 94);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Metrics:", 110, 75);
    doc.setFont("helvetica", "normal");
    doc.text(`Amount Funded: NGN ${(receipt.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 110, 82);
    doc.text(`Gateway / Provider: ${receipt.gateway || receipt.provider || "SmartLink Gateway"}`, 110, 88);
    doc.text(`SmartLink Ref: ${receipt.smartlinkReference || receipt.reference || "N/A"}`, 110, 94);
    doc.text(`Status: ${receipt.status || "SUCCESSFUL"}`, 110, 100);

    doc.setFont("helvetica", "bold");
    doc.text("Ledger Impact:", 22, 115);
    doc.setFont("helvetica", "normal");
    doc.text(`Balance Before: NGN ${(receipt.balanceBefore ?? walletBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 22, 122);
    doc.text(`Balance After: NGN ${(receipt.balanceAfter ?? (walletBalance + (receipt.amount || 0))).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, 22, 128);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This receipt is automatically generated by Smart Link Central Financial Verification Ledger Engine.", 15, 165);
    doc.text("For compliance, audit, or verification queries, contact support@smartlinkng.com.ng.", 15, 170);

    doc.save(`SmartLink_Receipt_${receipt.reference || Date.now()}.pdf`);
  };

  // Filter history
  const filteredHistory = fundingHistory.filter((item) => {
    const matchesSearch =
      (item.reference || "").toLowerCase().includes(searchHistory.toLowerCase()) ||
      (item.gateway || item.provider || "").toLowerCase().includes(searchHistory.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchHistory.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Wallet Balance */}
      <div className="relative overflow-hidden rounded-[16px] bg-[#0F2D5C] p-6 md:p-8 text-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-[#0F2D5C]">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToDashboard}
                className="text-xs text-blue-300 hover:text-white font-bold flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
              >
                ← Back to Portal
              </button>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Encrypted Financial Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Wallet Funding Portal</h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Instantly fund your SmartLink wallet via Virtual Bank Accounts, Dynamic Bank Transfers, or Debit Cards.
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5">
                <WalletIcon className="h-4 w-4 text-blue-400" /> Total Available Balance
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-white transition-colors cursor-pointer"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight">
                {showBalance
                  ? `₦${walletBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                  : "••••••••••••"}
              </span>
              <button
                onClick={fetchLatestBalance}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
                title="Sync Balance"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span>Account Status: <strong className="text-emerald-400 font-bold">VERIFIED</strong></span>
              <span>Currency: <strong className="text-white font-mono font-bold">NGN (₦)</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Simulation Alert */}
      {webhookMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          webhookMessage.includes("✅")
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <span>{webhookMessage}</span>
          <button
            onClick={() => setWebhookMessage(null)}
            className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Provider Error Banner */}
      {!loadingProvider && !activeProvider && (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 font-bold text-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">Payment Engine Status</div>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">{providerError || "No active payment provider configured."}</div>
            </div>
          </div>
          <button
            onClick={loadActiveProvider}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Retry Engine
          </button>
        </div>
      )}

      {/* Active Provider Status Badge */}
      {activeProvider && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Payment Provider: <strong className="font-black text-slate-900 dark:text-white uppercase">{activeProvider.name}</strong></span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
            DYNAMIC ENGINE ACTIVE
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E7EB]">
        <button
          onClick={() => setActiveTab("VIRTUAL_ACCOUNT")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === "VIRTUAL_ACCOUNT"
              ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-xs"
              : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#0F2D5C]"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Virtual Bank Account</span>
          <span className="text-[10px] bg-blue-100 text-[#0F2D5C] px-1.5 py-0.5 rounded font-mono font-bold">Instant Bank</span>
        </button>

        <button
          onClick={() => setActiveTab("BANK_TRANSFER")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === "BANK_TRANSFER"
              ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-xs"
              : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#0F2D5C]"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Dynamic Bank Transfer</span>
        </button>

        <button
          onClick={() => setActiveTab("CARD")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === "CARD"
              ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-xs"
              : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#0F2D5C]"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Debit / Credit Card</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("ADMIN_CREDIT")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
              activeTab === "ADMIN_CREDIT"
                ? "bg-[#0F2D5C] text-white border-[#0F2D5C] shadow-xs"
                : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-500"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Manual Credit</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">STAFF</span>
          </button>
        )}
      </div>

      {/* Tab 1: Virtual Bank Account */}
      {activeTab === "VIRTUAL_ACCOUNT" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Virtual Bank Account</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dedicated commercial bank account reserved permanently for your wallet.
              </p>
            </div>
          </div>

          {loadingReserved ? (
            <div className="py-12 text-center space-y-3 flex flex-col items-center">
              <SmartLinkLogoMark size="lg" animating={true} />
              <p className="text-xs text-slate-500 font-medium">Retrieving Virtual Bank Account details...</p>
            </div>
          ) : reservedAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-black text-blue-300 text-lg">
                      VA
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Payment Gateway Account</h4>
                      <p className="text-[10px] text-blue-300 font-mono">Bank Transfer Gateway</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-full">
                    Active Reserved Account
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Account Number</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-2xl md:text-3xl font-mono font-black tracking-wider text-blue-300">
                        {reservedAccount.accountNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(reservedAccount.accountNumber, "reservedNum")}
                        className="p-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
                      >
                        {copiedField === "reservedNum" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copiedField === "reservedNum" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Account Name</span>
                      <p className="font-bold text-white mt-0.5">{reservedAccount.accountName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Bank Name</span>
                      <p className="font-bold text-white mt-0.5">{reservedAccount.bankName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-slate-300">
                  <button
                    onClick={() => openQrModal(reservedAccount.accountNumber, reservedAccount.bankName, reservedAccount.accountName)}
                    className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white font-bold cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" /> Show QR Code
                  </button>
                  <span className="text-[10px] text-blue-400 font-mono">Reference: {reservedAccount.reference || "RESERVED"}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" /> Gateway Integration
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Reserved Accounts are monitored 24/7 by automated banking webhooks. Any transfer to this account immediately triggers the SmartLink Wallet Engine.
                </p>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 font-medium">
                  💡 Zero minimum funding limit. All incoming transfers are credited instantly.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">No Reserved Account Allocated</h4>
                <p className="text-xs text-slate-500">Allocate your dedicated Reserved Account to receive transfers from any bank.</p>
              </div>
              <button
                onClick={handleGenerateReservedAccount}
                disabled={loadingReserved}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Allocate Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dynamic Bank Transfer */}
      {activeTab === "BANK_TRANSFER" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dynamic Bank Transfer Allocation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Specify your intended funding amount to allocate a session-based dynamic account number with reference matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Target Amount to Fund (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₦</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {["1000", "2000", "5000", "10000", "20000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      transferAmount === amt
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    ₦{parseInt(amt).toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateDynamicBank}
                disabled={loadingDynamicBank}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingDynamicBank ? (
                  <>
                    <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} /> Allocating Account...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" /> Allocate Transfer Account
                  </>
                )}
              </button>
            </div>

            {dynamicBankInfo && (
              <div className="bg-indigo-950 text-white rounded-2xl p-6 space-y-4 border border-indigo-800 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
                  <span className="text-xs font-bold text-indigo-300">Session Allocated Transfer Account</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                    Active Session
                  </span>
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Bank Name</span>
                    <p className="font-bold text-white text-base">{dynamicBankInfo.bankName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Account Number</span>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-indigo-300 text-xl">{dynamicBankInfo.accountNumber}</p>
                      <button
                        onClick={() => copyToClipboard(dynamicBankInfo.accountNumber, "dynNum")}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-sans cursor-pointer"
                      >
                        {copiedField === "dynNum" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Account Name</span>
                    <p className="font-bold text-white">{dynamicBankInfo.accountName}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-800 text-[11px] text-indigo-200 font-sans">
                  ⚠️ Transfer exactly <strong>₦{parseFloat(transferAmount).toLocaleString()}</strong> to ensure automated matching.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Card Payment */}
      {activeTab === "CARD" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Debit / Credit Card Payment Gateway</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Securely fund your wallet using Visa, Mastercard, Verve, or Interswitch cards with 3D Secure OTP authorization.
            </p>
          </div>

          {cardError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium animate-fadeIn flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{cardError}</span>
            </div>
          )}

          <form onSubmit={handleInitiateCardPayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Amount to Fund (NGN)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₦</span>
                  <input
                    type="number"
                    required
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Cardholder Full Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Abubakar Muhammad"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())}
                    placeholder="5399 0000 0000 0000"
                    className="w-full pl-4 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                      setCardExpiry(val);
                    }}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>Pay ₦{parseFloat(cardAmount || "0").toLocaleString("en-NG", { minimumFractionDigits: 2 })} Now</span>
              </button>
            </div>

            {/* Visual Card Preview */}
            <div className="hidden md:flex flex-col justify-center items-center">
              <div className="w-full max-w-sm h-52 rounded-2xl bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-2xl relative overflow-hidden border border-purple-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-wider text-purple-300">SMARTLINK CARD</span>
                  <div className="h-7 w-10 bg-amber-400/80 rounded-md border border-amber-300/40" />
                </div>

                <div className="font-mono text-lg tracking-widest text-purple-200">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400">Cardholder</span>
                    <p className="font-bold text-white uppercase truncate max-w-[160px]">{cardName || "YOUR NAME"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400">Expires</span>
                    <p className="font-bold font-mono text-white">{cardExpiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Admin Manual Credit */}
      {isAdmin && activeTab === "ADMIN_CREDIT" && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Admin Manual Ledger Adjustment</h3>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
              Directly credit or debit a customer wallet with full audit logging, receipt generation, and real-time notification dispatch.
            </p>
          </div>

          {adminSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{adminSuccessMsg}</span>
            </div>
          )}

          {adminErrorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{adminErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminManualCredit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Adjustment Mode</label>
                <select
                  value={manualAction}
                  onChange={(e) => setManualAction(e.target.value as "CREDIT" | "DEBIT")}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="CREDIT">➕ Credit Wallet (Deposit)</option>
                  <option value="DEBIT">➖ Debit Wallet (Charge)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Amount (NGN)</label>
                <input
                  type="number"
                  required
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Target User Email address or UID</label>
              <input
                type="text"
                required
                value={targetEmailOrUid}
                onChange={(e) => setTargetEmailOrUid(e.target.value)}
                placeholder="e.g. client@company.com or UID"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Audit Reason / Authorization Note</label>
              <textarea
                required
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="Specify reason for audit logs e.g. 'Bank transfer verification approved by finance desk'"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isAdminProcessing}
              className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isAdminProcessing ? (
                <>
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} /> Processing Ledger Adjustment...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Execute {manualAction} Adjustment
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Funding History & Receipts Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" /> Wallet Funding Audit Log & Receipts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive chronological log of all wallet credits, webhooks, and generated payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Search reference..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">SUCCESSFUL</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <SmartLinkLogoMark size="md" animating={true} />
            Loading funding audit history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <FileText className="h-8 w-8 mx-auto text-slate-300" />
            <p>No wallet funding records match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Provider / Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount Funded</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.gateway || item.provider || "SmartLink Gateway"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {item.smartlinkReference || item.reference || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +₦{(item.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.status === "SUCCESS" || item.status === "SUCCESSFUL"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {item.status || "SUCCESSFUL"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded-lg transition-all cursor-pointer text-[11px]"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3D Secure OTP Modal for Card Payment */}
      {show3DSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShow3DSModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto font-black border border-purple-100">
                3DS
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">3D Secure OTP Authorization</h3>
              <p className="text-xs text-slate-500">
                Enter the One-Time Password (OTP) sent by your card issuer to authorize ₦
                {parseFloat(cardAmount || "0").toLocaleString("en-NG", { minimumFractionDigits: 2 })}.
              </p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-200 text-center font-mono">
              💡 Test Sandbox OTP Code: <strong>123456</strong>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleVerify3DSOTP}
              disabled={isCardProcessing}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCardProcessing ? (
                <>
                  <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} /> Authorizing Payment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Authorize & Credit Wallet
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">Scan Bank QR Code</h3>
            <p className="text-xs text-slate-500">{qrAccountTitle}</p>

            {qrCodeDataUrl && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                <img src={qrCodeDataUrl} alt="Bank QR" className="w-48 h-48 object-contain" />
              </div>
            )}

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Close QR Code
            </button>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full my-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Receipt Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5 text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-blue-700 dark:text-blue-300 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> SmartLink Official Wallet Receipt
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">₦{(selectedReceipt.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</h2>
              <p className="text-xs text-slate-500 font-mono">Reference: {selectedReceipt.smartlinkReference || selectedReceipt.reference || "N/A"}</p>
            </div>

            {/* Details Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentUser.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Payment Gateway</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReceipt.gateway || selectedReceipt.provider || "SmartLink Gateway"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {new Date(selectedReceipt.createdAt || selectedReceipt.timestamp || Date.now()).toLocaleString("en-NG")}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{selectedReceipt.status || "SUCCESSFUL"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Receipt No</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedReceipt.receiptId || selectedReceipt.id || "REC-" + Date.now()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => downloadReceiptPDF(selectedReceipt)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Download PDF Receipt
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
