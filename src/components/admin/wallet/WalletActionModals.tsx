/**
 * SmartLink Admin Panel — Wallet Action Modals (Module 4)
 * Credit Wallet, Debit Wallet, and Wallet Status Control Modals.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Info
} from "lucide-react";
import { AdminSession } from "../../../services/adminAuthTypes";

// ==========================================
// 1. CREDIT WALLET MODAL
// ==========================================
interface CreditWalletModalProps {
  user: any;
  session: AdminSession;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function CreditWalletModal({ user, session, onClose, onSuccess }: CreditWalletModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState(`ADM_CR_${Date.now()}`);
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const currentBal = user?.walletBalance || 0;
  const projectedBal = currentBal + numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmStep) {
      if (numAmount <= 0) {
        setError("Credit amount must be greater than ₦0.00.");
        return;
      }
      if (!reason.trim()) {
        setError("A mandatory audit reason is required.");
        return;
      }
      setError(null);
      setConfirmStep(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/wallets/${user.userId || user.uid}/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          amount: numAmount,
          reason,
          reference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute wallet credit.");
      }

      onSuccess(data.message || `Successfully credited ₦${numAmount.toLocaleString()} to ${user.fullName}.`);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setConfirmStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-[#111827] border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Credit Wallet Float</h3>
              <p className="text-xs text-[#9CA3AF]">Issue direct financial credit to user account</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#0F2D5C]/60 border border-[#0F2D5C] rounded-xl text-[#9CA3AF] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[#111827] border border-[#111827] rounded-2xl text-xs space-y-1">
            <span className="text-[#9CA3AF] block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName}</div>
            <div className="text-[#9CA3AF] font-mono">{user?.email} • Bal: <strong className="text-[#9CA3AF]">₦{currentBal.toLocaleString()}</strong></div>
          </div>

          {!confirmStep ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Credit Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000.00"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0F2D5C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Mandatory Audit Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Compensation for delayed deposit ref #9921"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white text-xs focus:outline-none focus:border-[#0F2D5C] h-20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Audit Reference Code</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111827] border border-[#111827] rounded-xl text-[#E5E7EB] font-mono text-xs focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-[#0F2D5C]/40 border border-[#0F2D5C] rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#9CA3AF] font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirm Credit Execution</span>
              </div>
              <div className="space-y-1 text-[#E5E7EB]">
                <p>Are you sure you want to credit <strong>₦{numAmount.toLocaleString()}</strong> to {user?.fullName}?</p>
                <p className="font-mono text-[11px] text-[#9CA3AF]">Current: ₦{currentBal.toLocaleString()} → New Balance: <strong className="text-[#9CA3AF]">₦{projectedBal.toLocaleString()}</strong></p>
                <p className="italic text-[#9CA3AF] mt-2">"Reason: {reason}"</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={confirmStep ? () => setConfirmStep(false) : onClose}
              className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl cursor-pointer"
            >
              {confirmStep ? "Back to Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmStep ? "Confirm Credit Now" : "Proceed to Confirm"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================
// 2. DEBIT WALLET MODAL
// ==========================================
interface DebitWalletModalProps {
  user: any;
  session: AdminSession;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function DebitWalletModal({ user, session, onClose, onSuccess }: DebitWalletModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState(`ADM_DB_${Date.now()}`);
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const currentBal = user?.walletBalance || 0;
  const projectedBal = currentBal - numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmStep) {
      if (numAmount <= 0) {
        setError("Debit amount must be greater than ₦0.00.");
        return;
      }
      if (numAmount > currentBal) {
        setError(`Overdraft Error: Cannot debit ₦${numAmount.toLocaleString()} from current balance of ₦${currentBal.toLocaleString()}.`);
        return;
      }
      if (!reason.trim()) {
        setError("A mandatory audit reason is required for debits.");
        return;
      }
      setError(null);
      setConfirmStep(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/wallets/${user.userId || user.uid}/debit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
        body: JSON.stringify({
          amount: numAmount,
          reason,
          reference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute wallet debit.");
      }

      onSuccess(data.message || `Successfully debited ₦${numAmount.toLocaleString()} from ${user.fullName}.`);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setConfirmStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-[#111827] border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F2D5C] border border-[#0F2D5C] rounded-2xl text-[#9CA3AF]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Debit Wallet Float</h3>
              <p className="text-xs text-[#9CA3AF]">Deduct funds from user account with ledger audit</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#0F2D5C]/60 border border-[#0F2D5C] rounded-xl text-[#9CA3AF] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[#111827] border border-[#111827] rounded-2xl text-xs space-y-1">
            <span className="text-[#9CA3AF] block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName}</div>
            <div className="text-[#9CA3AF] font-mono">Current Float: <strong className="text-[#9CA3AF]">₦{currentBal.toLocaleString()}</strong></div>
          </div>

          {!confirmStep ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Debit Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0F2D5C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Mandatory Audit Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reversal of duplicate funding transaction #8821"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white text-xs focus:outline-none focus:border-[#0F2D5C] h-20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Audit Reference Code</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111827] border border-[#111827] rounded-xl text-[#E5E7EB] font-mono text-xs focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-[#0F2D5C]/40 border border-[#0F2D5C] rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#9CA3AF] font-bold">
                <AlertTriangle className="h-5 w-5" />
                <span>Confirm Debit Deduction</span>
              </div>
              <div className="space-y-1 text-[#E5E7EB]">
                <p>Are you sure you want to debit <strong>₦{numAmount.toLocaleString()}</strong> from {user?.fullName}?</p>
                <p className="font-mono text-[11px] text-[#9CA3AF]">Current: ₦{currentBal.toLocaleString()} → New Balance: <strong className="text-[#9CA3AF]">₦{projectedBal.toLocaleString()}</strong></p>
                <p className="italic text-[#9CA3AF] mt-2">"Reason: {reason}"</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={confirmStep ? () => setConfirmStep(false) : onClose}
              className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl cursor-pointer"
            >
              {confirmStep ? "Back to Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmStep ? "Confirm Debit Now" : "Proceed to Confirm"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================
// 3. WALLET STATUS MODAL (FREEZE / UNFREEZE / LOCK)
// ==========================================
interface WalletStatusModalProps {
  user: any;
  targetStatus: "ACTIVE" | "FROZEN" | "LOCKED";
  session: AdminSession;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function WalletStatusModal({ user, targetStatus, session, onClose, onSuccess }: WalletStatusModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A mandatory administrative reason must be provided.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/wallets/${user.userId || user.uid}/status`, {
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
        throw new Error(data.message || "Failed to update wallet status.");
      }

      onSuccess(data.message || `Wallet status changed to [${targetStatus}].`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111827] border border-[#111827] rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-[#111827] border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              targetStatus === "ACTIVE"
                ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                : targetStatus === "FROZEN"
                ? "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
                : "bg-[#0F2D5C] text-[#9CA3AF] border-[#0F2D5C]"
            }`}>
              {targetStatus === "ACTIVE" ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {targetStatus === "ACTIVE" ? "Unfreeze Wallet Float" : targetStatus === "FROZEN" ? "Freeze Wallet Float" : "Lock Wallet Account"}
              </h3>
              <p className="text-xs text-[#9CA3AF]">Security state governance control</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#0F2D5C]/60 border border-[#0F2D5C] rounded-xl text-[#9CA3AF] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[#111827] border border-[#111827] rounded-2xl text-xs space-y-1">
            <span className="text-[#9CA3AF] block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName} ({user?.email})</div>
            <div className="text-[#9CA3AF]">Current Status: <strong className="text-[#9CA3AF]">{user?.walletStatus || "ACTIVE"}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#E5E7EB] mb-1">Mandatory Administrative Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Specify exact reason for setting status to ${targetStatus}...`}
              className="w-full px-4 py-2.5 bg-[#111827] border border-[#111827] rounded-xl text-white text-xs focus:outline-none focus:border-[#0F2D5C] h-24 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#111827] hover:bg-[#4B5563] text-[#E5E7EB] text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                targetStatus === "ACTIVE" ? "bg-[#0F2D5C] hover:bg-[#0F2D5C]" : targetStatus === "FROZEN" ? "bg-[#0F2D5C] hover:bg-[#0F2D5C]" : "bg-[#0F2D5C] hover:bg-[#0F2D5C]"
              }`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Set Status to {targetStatus}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
