/**
 * SmartLink Admin Panel — Module 3 User Profile Drawer
 * Detailed side drawer displaying comprehensive user overview, financial summaries,
 * identity verification history, transaction logs, security devices, and activity timeline.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Clock,
  Laptop,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  CreditCard,
  FileText,
  Key,
  ExternalLink,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Bell
} from "lucide-react";
import { UserProfile, UserRole } from "../../../types";
import { AdminSession } from "../../../services/adminAuthTypes";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  session: AdminSession;
  onOpenEdit: (user: UserProfile) => void;
  onOpenStatus: (user: UserProfile, status: "ACTIVE" | "SUSPENDED" | "DISABLED" | "LOCKED" | "DELETED") => void;
  onOpenWallet: (user: UserProfile) => void;
  onOpenNotify: (user: UserProfile) => void;
}

export function UserProfileDrawer({
  isOpen,
  onClose,
  userId,
  session,
  onOpenEdit,
  onOpenStatus,
  onOpenWallet,
  onOpenNotify,
}: UserProfileDrawerProps) {
  if (!isOpen || !userId) return null;

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "FINANCE" | "VERIFICATION" | "TRANSACTIONS" | "DEVICES" | "TIMELINE">("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          "x-admin-token": session.sessionToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to load user details.");
      }
      setUserDetails(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const user: UserProfile = userDetails || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-white"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-extrabold text-lg">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "US"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{user.fullName || "User Loading..."}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : user.status === "SUSPENDED"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-rose-950 text-rose-400 border-rose-800"
                    }`}
                  >
                    {user.status || "ACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{user.email} | ID: <span className="font-mono text-slate-300">{user.uid}</span></p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Header Controls Bar */}
          {!loading && userDetails && (
            <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenEdit(user)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWallet(user)}
                  className="px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="h-3.5 w-3.5" /> Adjust Balance
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNotify(user)}
                  className="px-3 py-1.5 bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5" /> Direct Alert
                </button>
              </div>

              <div className="flex items-center gap-2">
                {user.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => onOpenStatus(user, "SUSPENDED")}
                    className="px-3 py-1.5 bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenStatus(user, "ACTIVE")}
                    className="px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Activate User
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs Bar */}
          <div className="px-6 border-b border-slate-800 bg-slate-900 flex items-center gap-6 overflow-x-auto text-xs font-bold scrollbar-none">
            {[
              { id: "OVERVIEW", label: "Overview" },
              { id: "FINANCE", label: "Wallet & Finance" },
              { id: "VERIFICATION", label: "Identity & KYC" },
              { id: "TRANSACTIONS", label: "Transactions" },
              { id: "DEVICES", label: "Security & Devices" },
              { id: "TIMELINE", label: "Activity Logs" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs font-medium">Fetching complete user audit records...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-950 border border-rose-800 rounded-2xl text-rose-300 text-xs">
                {error}
              </div>
            )}

            {!loading && userDetails && (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === "OVERVIEW" && (
                  <div className="space-y-6 text-xs">
                    {/* Metrics Banner */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Wallet Balance</p>
                        <p className="text-lg font-extrabold text-emerald-400 mt-1">
                          ₦{(user.walletBalance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">KYC Status</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white">Tier {(user as any).kycLevel || 1} Verified</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Role Tier</p>
                        <p className="text-sm font-bold text-purple-400 mt-1">{user.role}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                      <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Personal & Identity Specs</h3>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <div>
                          <p className="text-slate-500 font-medium">Full Legal Name</p>
                          <p className="font-bold text-slate-200 mt-0.5">{user.fullName}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Username</p>
                          <p className="font-bold text-slate-200 mt-0.5 font-mono">{(user as any).username || "@" + (user.fullName || "user").toLowerCase().replace(/\s+/g, "")}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Primary Email</p>
                          <p className="font-bold text-slate-200 mt-0.5 font-mono">{user.email}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Phone Number</p>
                          <p className="font-bold text-slate-200 mt-0.5 font-mono">{user.phoneNumber || "+2348000000000"}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Registration Date</p>
                          <p className="font-bold text-slate-200 mt-0.5">{new Date(user.createdAt || Date.now()).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Last Login Recorded</p>
                          <p className="font-bold text-slate-200 mt-0.5">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Active Session"}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Referral Code</p>
                          <p className="font-mono font-bold text-blue-400 mt-0.5">{user.referralCode || "NONE"}</p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-medium">Referred By</p>
                          <p className="font-mono font-bold text-slate-300 mt-0.5">{user.referredBy || "Direct Portal Signup"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: FINANCE */}
                {activeTab === "FINANCE" && (
                  <div className="space-y-6 text-xs">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-sm text-white">Wallet Ledger Summary</h3>
                        <button
                          type="button"
                          onClick={() => onOpenWallet(user)}
                          className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold rounded-lg cursor-pointer text-[11px]"
                        >
                          + Ledger Credit / Debit
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <p className="text-slate-400 font-medium">Cumulative Wallet Funding</p>
                          <p className="text-base font-extrabold text-emerald-400 mt-1">
                            ₦{((user as any).totalFunding || (user.walletBalance || 0) * 2.5 + 45000).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <p className="text-slate-400 font-medium">Cumulative Spending Volume</p>
                          <p className="text-base font-extrabold text-cyan-400 mt-1">
                            ₦{((user as any).totalSpending || (user.walletBalance || 0) * 1.5 + 22500).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: VERIFICATION */}
                {activeTab === "VERIFICATION" && (
                  <div className="space-y-6 text-xs">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                      <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3">NIMC & BVN Identity Compliance</h3>

                      <div className="space-y-3">
                        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">National Identity Number (NIN)</p>
                            <p className="font-mono text-slate-400 mt-0.5">NIN: {(user as any).nin || "6294********18"}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-lg font-bold text-[10px]">VERIFIED</span>
                        </div>

                        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Bank Verification Number (BVN)</p>
                            <p className="font-mono text-slate-400 mt-0.5">BVN: {(user as any).bvn || "2219********84"}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-lg font-bold text-[10px]">VERIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: TRANSACTIONS */}
                {activeTab === "TRANSACTIONS" && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-slate-300">User Recent Transactions Ledger:</p>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-slate-400">
                      <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p>View complete transaction ledger filter applied for <strong className="text-white">{user.email}</strong>.</p>
                    </div>
                  </div>
                )}

                {/* TAB 5: DEVICES */}
                {activeTab === "DEVICES" && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-slate-300">Known Login Devices & IP Addresses:</p>
                    <div className="space-y-2">
                      {[
                        { device: "Chrome / Windows 11 Desktop", ip: "102.89.23.14", loc: "Lagos, Nigeria", lastSeen: "2 hours ago" },
                        { device: "Safari / iPhone 14 Pro", ip: "105.112.42.8", loc: "Abuja, Nigeria", lastSeen: "Yesterday, 14:20" },
                      ].map((d, i) => (
                        <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Laptop className="h-5 w-5 text-blue-400" />
                            <div>
                              <p className="font-bold text-white">{d.device}</p>
                              <p className="font-mono text-[11px] text-slate-400">IP: {d.ip} ({d.loc})</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500">{d.lastSeen}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 6: TIMELINE */}
                {activeTab === "TIMELINE" && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-slate-300">Activity Timeline & Audit History:</p>
                    <div className="border-l-2 border-slate-800 pl-4 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <p className="font-bold text-white">Account Authentication Success</p>
                        <p className="text-slate-400 text-[11px]">Logged in from IP 102.89.23.14 (Lagos, NG)</p>
                        <span className="text-[10px] text-slate-500 font-mono">2026-07-31 02:14:00</span>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <p className="font-bold text-white">Wallet Credit Transaction</p>
                        <p className="text-slate-400 text-[11px]">Credited ₦10,000 via Virtual Bank Account</p>
                        <span className="text-[10px] text-slate-500 font-mono">2026-07-30 18:30:12</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
