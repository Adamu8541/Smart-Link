/**
 * SmartLink Admin Panel — Module 3 User Management Action Modals
 * Supports Edit Profile, Status Changes, Wallet Adjustments, Password Reset,
 * Direct Notifications, Soft Deletion, and Bulk Operations.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  User,
  Shield,
  Wallet,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Sliders,
  Mail,
  Phone,
  HelpCircle,
  FileText
} from "lucide-react";
import { UserProfile, UserRole } from "../../../types";
import { AdminSession } from "../../../services/adminAuthTypes";

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  session: AdminSession;
  onSuccess: () => void;
}

// ----------------------------------------------------
// 1. Edit User Profile Modal
// ----------------------------------------------------
interface EditProfileModalProps extends ModalBaseProps {
  user: UserProfile | null;
}

export function EditProfileModal({ isOpen, onClose, session, onSuccess, user }: EditProfileModalProps) {
  if (!isOpen || !user) return null;

  const [fullName, setFullName] = useState(user.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState<UserRole>(user.role || UserRole.CUSTOMER);
  const [kycLevel, setKycLevel] = useState<number>((user as any).kycLevel || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email,
          role,
          kycLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update user profile.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-[#111827] text-[#9CA3AF] hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#111827] pb-4 mb-5">
          <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">User Governance</span>
            <h3 className="text-base font-bold text-white">Edit User Profile</h3>
            <p className="text-xs text-[#9CA3AF]">Update identity information for <strong className="text-[#E5E7EB]">{user.email}</strong></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF]">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Full Legal Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9CA3AF] font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
              />
            </div>

            <div>
              <label className="block text-[#9CA3AF] font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2348000000000"
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9CA3AF] font-medium mb-1">User Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium cursor-pointer"
              >
                <option value={UserRole.CUSTOMER}>Customer (Standard Tier)</option>
                <option value={UserRole.AGENT_VENDOR}>Agent Vendor (Discount Tier)</option>
                <option value={UserRole.STAFF}>Staff Member</option>
                <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
                <option value={UserRole.SUB_ADMIN}>Sub Admin</option>
                <option value={UserRole.ADMIN}>Administrator</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9CA3AF] font-medium mb-1">KYC Tier Level</label>
              <select
                value={kycLevel}
                onChange={(e) => setKycLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium cursor-pointer"
              >
                <option value={1}>Tier 1 (Basic Email Verification)</option>
                <option value={2}>Tier 2 (NIN / BVN Verified)</option>
                <option value={3}>Tier 3 (CAC / Enterprise Tier)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#111827] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Save Profile Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Status Change Modal (Active, Suspended, Disabled, Locked, Soft Deleted)
// ----------------------------------------------------
interface StatusChangeModalProps extends ModalBaseProps {
  user: UserProfile | null;
  targetStatus: "ACTIVE" | "SUSPENDED" | "DISABLED" | "LOCKED" | "DELETED";
}

export function StatusChangeModal({ isOpen, onClose, session, onSuccess, user, targetStatus }: StatusChangeModalProps) {
  if (!isOpen || !user) return null;

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusColors = {
    ACTIVE: "text-[#9CA3AF] bg-[#0F2D5C] border-[#0F2D5C]",
    SUSPENDED: "text-[#9CA3AF] bg-[#0F2D5C] border-[#0F2D5C]",
    DISABLED: "text-[#9CA3AF] bg-[#0F2D5C] border-[#0F2D5C]",
    LOCKED: "text-[#9CA3AF] bg-[#0F2D5C] border-[#0F2D5C]",
    DELETED: "text-[#9CA3AF] bg-[#111827] border-[#111827]",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a mandatory administrative reason for this status change.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          status: targetStatus,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update account status.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-[#111827] text-[#9CA3AF] hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#111827] pb-4 mb-5">
          <div className={`p-3 border rounded-2xl ${statusColors[targetStatus]}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Governance Guard</span>
            <h3 className="text-base font-bold text-white">
              {targetStatus === "ACTIVE" ? "Re-Activate User Account" : `Set Status to ${targetStatus}`}
            </h3>
            <p className="text-xs text-[#9CA3AF]">Target user: <strong className="text-[#E5E7EB]">{user.fullName} ({user.email})</strong></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#111827] border border-[#111827] rounded-xl text-[#E5E7EB] space-y-1">
            <p className="font-bold text-white">Impact Assessment:</p>
            {targetStatus === "ACTIVE" && <p>Restores full portal login, wallet funding & service transactions.</p>}
            {targetStatus === "SUSPENDED" && <p>Prevents new logins and service requests. Wallet float remains untouched.</p>}
            {targetStatus === "DISABLED" && <p>Disables account credentials across all web & API channels.</p>}
            {targetStatus === "LOCKED" && <p>Locks account due to security flag or failed login threshold.</p>}
            {targetStatus === "DELETED" && <p>Executes <strong>Soft Delete</strong>. User records are preserved for compliance audit but deactivated.</p>}
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Administrative Reason / Audit Note *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Provide explicit justification for security audit logs..."
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div className="pt-3 border-t border-[#111827] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-2.5 px-5 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 text-white ${
                targetStatus === "ACTIVE" ? "bg-[#0F2D5C] hover:bg-[#0F2D5C]" : targetStatus === "SUSPENDED" ? "bg-[#0F2D5C] hover:bg-[#0F2D5C]" : "bg-[#0F2D5C] hover:bg-[#0F2D5C]"
              }`}
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Confirm Status Change
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// 3. Wallet Adjustment Modal (Credit / Debit)
// ----------------------------------------------------
interface WalletAdjustmentModalProps extends ModalBaseProps {
  user: UserProfile | null;
}

export function WalletAdjustmentModal({ isOpen, onClose, session, onSuccess, user }: WalletAdjustmentModalProps) {
  if (!isOpen || !user) return null;

  const [action, setAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please specify a valid adjustment amount greater than ₦0.00.");
      return;
    }
    if (!reason.trim()) {
      setError("A mandatory ledger reason must be provided for audit tracking.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          action,
          amount: parsedAmount,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Wallet ledger adjustment failed.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-[#111827] text-[#9CA3AF] hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#111827] pb-4 mb-5">
          <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Finance & Accounting</span>
            <h3 className="text-base font-bold text-white">Manual Wallet Adjustment</h3>
            <p className="text-xs text-[#9CA3AF]">User: <strong className="text-[#E5E7EB]">{user.fullName}</strong> | Current Balance: <strong className="text-[#9CA3AF]">₦{(user.walletBalance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF]">
            {error}
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1.5">Adjustment Direction</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction("CREDIT")}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  action === "CREDIT"
                    ? "bg-[#0F2D5C] border-[#0F2D5C] text-[#9CA3AF]"
                    : "bg-[#111827] border-[#111827] text-[#9CA3AF] hover:text-[#E5E7EB]"
                }`}
              >
                <PlusCircle className="h-4 w-4 text-[#9CA3AF]" />
                Credit Float (+)
              </button>

              <button
                type="button"
                onClick={() => setAction("DEBIT")}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  action === "DEBIT"
                    ? "bg-[#0F2D5C] border-[#0F2D5C] text-[#9CA3AF]"
                    : "bg-[#111827] border-[#111827] text-[#9CA3AF] hover:text-[#E5E7EB]"
                }`}
              >
                <MinusCircle className="h-4 w-4 text-[#9CA3AF]" />
                Debit Float (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Adjustment Amount (₦) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#6B7280] font-bold">₦</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="5000.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-mono font-bold focus:outline-hidden focus:border-[#0F2D5C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Mandatory Audit Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="e.g. Approved refund for failed electricity token transaction #SL-9482..."
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div className="pt-3 border-t border-[#111827] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-2.5 px-5 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 text-white ${
                action === "CREDIT" ? "bg-[#0F2D5C] hover:bg-[#0F2D5C]" : "bg-[#0F2D5C] hover:bg-[#0F2D5C]"
              }`}
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Execute {action === "CREDIT" ? "Credit" : "Debit"} Adjustment
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Send Direct Notification Modal
// ----------------------------------------------------
interface SendNotificationModalProps extends ModalBaseProps {
  user: UserProfile | null;
}

export function SendNotificationModal({ isOpen, onClose, session, onSuccess, user }: SendNotificationModalProps) {
  if (!isOpen || !user) return null;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"SYSTEM" | "ACCOUNT" | "FINANCIAL" | "PROMOTION">("ACCOUNT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          title,
          body,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to dispatch notification.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-[#111827] text-[#9CA3AF] hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#111827] pb-4 mb-5">
          <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Communications</span>
            <h3 className="text-base font-bold text-white">Send Direct Notification</h3>
            <p className="text-xs text-[#9CA3AF]">Recipient: <strong className="text-[#E5E7EB]">{user.fullName} ({user.email})</strong></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF]">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Notification Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium cursor-pointer"
            >
              <option value="ACCOUNT">Account Notification</option>
              <option value="FINANCIAL">Financial / Wallet Notification</option>
              <option value="SYSTEM">System Alert</option>
              <option value="PROMOTION">Promotional Announcement</option>
            </select>
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Notification Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Security Notice: Account Verification Confirmed"
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-medium mb-1">Message Content *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              placeholder="Enter the complete message text that will be delivered to the user's bell drawer and email..."
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white focus:outline-hidden focus:border-[#0F2D5C] font-medium"
            />
          </div>

          <div className="pt-3 border-t border-[#111827] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Dispatch Notification
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// 5. Bulk Actions Modal
// ----------------------------------------------------
interface BulkActionModalProps extends ModalBaseProps {
  selectedUserIds: string[];
  actionType: "ACTIVATE" | "SUSPEND" | "BROADCAST" | "DELETE";
}

export function BulkActionModal({ isOpen, onClose, session, onSuccess, selectedUserIds, actionType }: BulkActionModalProps) {
  if (!isOpen || selectedUserIds.length === 0) return null;

  const [reason, setReason] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType !== "BROADCAST" && !reason.trim()) {
      setError("Please specify a reason for this bulk operation.");
      return;
    }
    if (actionType === "BROADCAST" && (!broadcastTitle || !broadcastBody)) {
      setError("Please specify both title and message body for broadcast.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
          action: actionType,
          reason,
          broadcastTitle,
          broadcastBody,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Bulk action execution failed.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-[#111827] text-[#9CA3AF] hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#111827] pb-4 mb-5">
          <div className="p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Batch Administration</span>
            <h3 className="text-base font-bold text-white">
              Bulk {actionType === "ACTIVATE" ? "Activate" : actionType === "SUSPEND" ? "Suspend" : actionType === "BROADCAST" ? "Broadcast Notification" : "Soft Delete"} ({selectedUserIds.length} Users)
            </h3>
            <p className="text-xs text-[#9CA3AF]">Batch targeting <strong className="text-[#E5E7EB]">{selectedUserIds.length} selected accounts</strong>.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-xs text-[#9CA3AF]">
            {error}
          </div>
        )}

        <form onSubmit={handleExecuteBulk} className="space-y-4 text-xs">
          {actionType === "BROADCAST" ? (
            <>
              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">Broadcast Title *</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  placeholder="e.g. System Announcement: Wallet Funding Promotion"
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-medium focus:outline-hidden focus:border-[#0F2D5C]"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] font-medium mb-1">Broadcast Body *</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter message text for all selected users..."
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-medium focus:outline-hidden focus:border-[#0F2D5C]"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[#9CA3AF] font-medium mb-1">Batch Operation Justification *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="State administrative justification for updating selected user accounts..."
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-medium focus:outline-hidden focus:border-[#0F2D5C]"
              />
            </div>
          )}

          <div className="pt-3 border-t border-[#111827] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Execute Bulk Action
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
