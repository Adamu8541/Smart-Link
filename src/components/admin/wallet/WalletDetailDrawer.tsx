/**
 * SmartLink Admin Panel — Wallet Details Drawer (Module 4)
 * Slide-over drawer providing comprehensive wallet analytics, balance breakdowns,
 * recent transactions, adjustment logs, and admin action history.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Wallet,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  History,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

interface WalletDetailDrawerProps {
  userId: string | null;
  session: AdminSession;
  onClose: () => void;
  onCredit: () => void;
  onDebit: () => void;
  onStatusChange: (status: "ACTIVE" | "FROZEN" | "LOCKED") => void;
  onGenerateStatement: () => void;
}

export function WalletDetailDrawer({
  userId,
  session,
  onClose,
  onCredit,
  onDebit,
  onStatusChange,
  onGenerateStatement,
}: WalletDetailDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "ADJUSTMENTS" | "ACTIONS">("TRANSACTIONS");

  const fetchWalletDetails = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wallets/${userId}`, {
        headers: {
          "x-admin-token": session.sessionToken,
        },
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load wallet detail.");
      }
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [userId]);

  if (!userId) return null;

  const userInfo = data?.userInfo;
  const walletInfo = data?.walletInfo;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#111827]/80 backdrop-blur-xs"
        />

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-screen max-w-2xl bg-[#111827] border-l border-[#111827] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-[#111827] border-b border-[#111827] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Financial Ledger Drawer</span>
                  <h2 className="text-lg font-bold text-white">Wallet Overview & Audit</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchWalletDetails}
                  className="p-2 text-[#9CA3AF] hover:text-white bg-[#111827] hover:bg-[#4B5563] rounded-xl cursor-pointer transition-colors"
                  title="Refresh Wallet Details"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-[#9CA3AF] hover:text-white bg-[#111827] hover:bg-[#4B5563] rounded-xl cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="py-20 text-center space-y-4">
                  <RefreshCw className="h-8 w-8 text-[#9CA3AF] animate-spin mx-auto" />
                  <p className="text-xs text-[#9CA3AF]">Loading comprehensive wallet audit file...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-[#0F2D5C]/40 border border-[#0F2D5C] rounded-2xl text-[#9CA3AF] text-xs flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-[#9CA3AF]" />
                  <span>{error}</span>
                </div>
              ) : (
                <>
                  {/* Account Header Card */}
                  <div className="p-5 bg-[#111827]/60 border border-[#111827] rounded-3xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F2D5C] to-[#0F2D5C] text-white font-black text-lg flex items-center justify-center shadow-lg shadow-none">
                          {userInfo?.fullName?.substring(0, 2)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{userInfo?.fullName}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                            <span>{userInfo?.email}</span>
                            <span>•</span>
                            <span className="font-mono">{userInfo?.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        walletInfo?.walletStatus === "ACTIVE"
                          ? "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                          : walletInfo?.walletStatus === "FROZEN"
                          ? "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                          : "bg-[#0F2D5C]/80 text-[#9CA3AF] border-[#0F2D5C]"
                      }`}>
                        {walletInfo?.walletStatus || "ACTIVE"}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#111827]/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[#6B7280] block">User ID</span>
                        <span className="font-mono text-[#E5E7EB] text-[11px]">{userInfo?.userId}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">Wallet ID</span>
                        <span className="font-mono text-[#9CA3AF] text-[11px] font-bold">{walletInfo?.walletId}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">Role</span>
                        <span className="text-[#E5E7EB] font-semibold">{userInfo?.role}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">KYC Tier</span>
                        <span className="text-[#E5E7EB] font-semibold">Level {userInfo?.kycLevel || 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Balance Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-[#0F2D5C]/20 border border-[#0F2D5C]/60 rounded-2xl space-y-1">
                      <span className="text-[11px] text-[#9CA3AF] font-semibold uppercase tracking-wider block">Wallet Balance</span>
                      <div className="text-2xl font-black text-white font-mono">
                        ₦{(walletInfo?.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] block">Total ledger float</span>
                    </div>

                    <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl space-y-1">
                      <span className="text-[11px] text-[#9CA3AF] font-semibold uppercase tracking-wider block">Available Balance</span>
                      <div className="text-xl font-bold text-[#E5E7EB] font-mono">
                        ₦{(walletInfo?.availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#6B7280] block">Unreserved liquid funds</span>
                    </div>

                    <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl space-y-1">
                      <span className="text-[11px] text-[#9CA3AF] font-semibold uppercase tracking-wider block">Pending Escrow</span>
                      <div className="text-xl font-bold text-[#9CA3AF] font-mono">
                        ₦{(walletInfo?.pendingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#6B7280] block">{walletInfo?.pendingTransactionsCount || 0} active holds</span>
                    </div>
                  </div>

                  {/* Funding & Spending Summary */}
                  <div className="p-4 bg-[#111827] border border-[#111827] rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[#6B7280] block">Lifetime Funding</span>
                      <span className="text-[#9CA3AF] font-bold font-mono text-sm">
                        ₦{(walletInfo?.totalFunding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Lifetime Spending</span>
                      <span className="text-[#9CA3AF] font-bold font-mono text-sm">
                        ₦{(walletInfo?.totalSpending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Last Funding</span>
                      <span className="text-[#E5E7EB] font-mono text-[11px]">
                        {walletInfo?.lastFundingDate ? new Date(walletInfo.lastFundingDate).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Last Withdrawal</span>
                      <span className="text-[#E5E7EB] font-mono text-[11px]">
                        {walletInfo?.lastWithdrawalDate ? new Date(walletInfo.lastWithdrawalDate).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </div>

                  {/* Admin Quick Action Bar */}
                  <div className="p-4 bg-[#111827]/80 border border-[#111827] rounded-2xl space-y-3">
                    <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">Administrative Wallet Controls</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={onCredit}
                        className="py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <ArrowDownLeft className="h-4 w-4" /> Credit Float
                      </button>

                      <button
                        type="button"
                        onClick={onDebit}
                        className="py-2.5 px-3 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <ArrowUpRight className="h-4 w-4" /> Debit Float
                      </button>

                      {walletInfo?.walletStatus === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => onStatusChange("FROZEN")}
                          className="py-2.5 px-3 bg-[#0F2D5C]/60 hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Lock className="h-4 w-4" /> Freeze Wallet
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStatusChange("ACTIVE")}
                          className="py-2.5 px-3 bg-[#0F2D5C]/60 hover:bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Unlock className="h-4 w-4" /> Unfreeze Wallet
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={onGenerateStatement}
                        className="py-2.5 px-3 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <FileText className="h-4 w-4 text-[#9CA3AF]" /> Statement
                      </button>
                    </div>
                  </div>

                  {/* Tabs Selector */}
                  <div className="flex border-b border-[#111827] gap-6 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab("TRANSACTIONS")}
                      className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === "TRANSACTIONS" ? "border-[#E5E7EB] text-[#9CA3AF]" : "border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]"
                      }`}
                    >
                      Recent Transactions ({data?.recentTransactions?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("ADJUSTMENTS")}
                      className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === "ADJUSTMENTS" ? "border-[#E5E7EB] text-[#9CA3AF]" : "border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]"
                      }`}
                    >
                      Ledger Adjustments ({data?.walletAdjustments?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("ACTIONS")}
                      className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === "ACTIONS" ? "border-[#E5E7EB] text-[#9CA3AF]" : "border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]"
                      }`}
                    >
                      Admin Audit Log ({data?.walletAdminActions?.length || 0})
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === "TRANSACTIONS" && (
                    <div className="space-y-3">
                      {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
                        <div className="p-8 text-center bg-[#111827]/40 rounded-2xl text-xs text-[#9CA3AF]">
                          No transactions recorded for this wallet yet.
                        </div>
                      ) : (
                        data.recentTransactions.map((tx: any) => {
                          const isCredit = ["FUNDING", "ADMIN_CREDIT", "REFUND"].includes(tx.type);
                          return (
                            <div key={tx.id} className="p-3.5 bg-[#111827] border border-[#111827]/80 rounded-2xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isCredit ? "bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]" : "bg-[#0F2D5C] text-[#9CA3AF] border border-[#0F2D5C]"}`}>
                                  {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                </div>
                                <div>
                                  <div className="font-bold text-[#E5E7EB] flex items-center gap-2">
                                    <span>{tx.type}</span>
                                    <span className="font-mono text-[10px] text-[#6B7280]">#{tx.reference || tx.id}</span>
                                  </div>
                                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{tx.description}</p>
                                  <span className="text-[10px] text-[#6B7280]">{new Date(tx.timestamp).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className={`font-mono font-bold text-sm ${isCredit ? "text-[#9CA3AF]" : "text-[#E5E7EB]"}`}>
                                  {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <span className={`text-[10px] font-bold uppercase ${tx.status === "SUCCESSFUL" ? "text-[#9CA3AF]" : tx.status === "FAILED" ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {activeTab === "ADJUSTMENTS" && (
                    <div className="space-y-3">
                      {!data?.walletAdjustments || data.walletAdjustments.length === 0 ? (
                        <div className="p-8 text-center bg-[#111827]/40 rounded-2xl text-xs text-[#9CA3AF]">
                          No manual admin adjustments recorded.
                        </div>
                      ) : (
                        data.walletAdjustments.map((adj: any) => (
                          <div key={adj.id} className="p-3.5 bg-[#111827] border border-[#111827]/80 rounded-2xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border ${
                                adj.type === "CREDIT" ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]" : "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                              }`}>
                                {adj.type} ADJUSTMENT
                              </span>
                              <span className="text-[#9CA3AF] font-mono text-[10px]">{new Date(adj.timestamp).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[#E5E7EB]">{adj.reason}</span>
                              <span className="font-mono font-bold text-white text-sm">
                                {adj.type === "CREDIT" ? "+" : "-"}₦{adj.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#6B7280] font-mono flex items-center justify-between pt-2 border-t border-[#111827]/60">
                              <span>Admin: {adj.adminEmail}</span>
                              <span>Previous: ₦{adj.previousBalance?.toLocaleString()} → New: ₦{adj.newBalance?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "ACTIONS" && (
                    <div className="space-y-3">
                      {!data?.walletAdminActions || data.walletAdminActions.length === 0 ? (
                        <div className="p-8 text-center bg-[#111827]/40 rounded-2xl text-xs text-[#9CA3AF]">
                          No admin status or security actions logged.
                        </div>
                      ) : (
                        data.walletAdminActions.map((act: any) => (
                          <div key={act.id} className="p-3.5 bg-[#111827] border border-[#111827]/80 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#9CA3AF]">{act.action}</span>
                              <span className="text-[#9CA3AF] font-mono text-[10px]">{new Date(act.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-[#E5E7EB] text-[11px]">Reason: {act.reason || act.details}</p>
                            <span className="text-[10px] text-[#6B7280] block">By: {act.adminEmail}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
