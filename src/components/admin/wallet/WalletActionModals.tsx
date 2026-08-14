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
import { AdminSession } from "../../../services/adminAuthService";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Credit Wallet Float</h3>
              <p className="text-xs text-slate-400">Issue direct financial credit to user account</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
            <span className="text-slate-400 block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName}</div>
            <div className="text-slate-400 font-mono">{user?.email} • Bal: <strong className="text-emerald-400">₦{currentBal.toLocaleString()}</strong></div>
          </div>

          {!confirmStep ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Credit Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000.00"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Compensation for delayed deposit ref #9921"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 h-20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Audit Reference Code</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirm Credit Execution</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <p>Are you sure you want to credit <strong>₦{numAmount.toLocaleString()}</strong> to {user?.fullName}?</p>
                <p className="font-mono text-[11px] text-slate-400">Current: ₦{currentBal.toLocaleString()} → New Balance: <strong className="text-emerald-400">₦{projectedBal.toLocaleString()}</strong></p>
                <p className="italic text-slate-400 mt-2">"Reason: {reason}"</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={confirmStep ? () => setConfirmStep(false) : onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              {confirmStep ? "Back to Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950 border border-red-800 rounded-2xl text-red-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Debit Wallet Float</h3>
              <p className="text-xs text-slate-400">Deduct funds from user account with ledger audit</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
            <span className="text-slate-400 block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName}</div>
            <div className="text-slate-400 font-mono">Current Float: <strong className="text-emerald-400">₦{currentBal.toLocaleString()}</strong></div>
          </div>

          {!confirmStep ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Debit Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reversal of duplicate funding transaction #8821"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 h-20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Audit Reference Code</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="h-5 w-5" />
                <span>Confirm Debit Deduction</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <p>Are you sure you want to debit <strong>₦{numAmount.toLocaleString()}</strong> from {user?.fullName}?</p>
                <p className="font-mono text-[11px] text-slate-400">Current: ₦{currentBal.toLocaleString()} → New Balance: <strong className="text-red-400">₦{projectedBal.toLocaleString()}</strong></p>
                <p className="italic text-slate-400 mt-2">"Reason: {reason}"</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={confirmStep ? () => setConfirmStep(false) : onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              {confirmStep ? "Back to Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              targetStatus === "ACTIVE"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : targetStatus === "FROZEN"
                ? "bg-amber-950 text-amber-400 border-amber-800"
                : "bg-red-950 text-red-400 border-red-800"
            }`}>
              {targetStatus === "ACTIVE" ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {targetStatus === "ACTIVE" ? "Unfreeze Wallet Float" : targetStatus === "FROZEN" ? "Freeze Wallet Float" : "Lock Wallet Account"}
              </h3>
              <p className="text-xs text-slate-400">Security state governance control</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
            <span className="text-slate-400 block">Target Account</span>
            <div className="font-bold text-white text-sm">{user?.fullName} ({user?.email})</div>
            <div className="text-slate-400">Current Status: <strong className="text-amber-400">{user?.walletStatus || "ACTIVE"}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Mandatory Administrative Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Specify exact reason for setting status to ${targetStatus}...`}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 h-24 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                targetStatus === "ACTIVE" ? "bg-teal-600 hover:bg-teal-500" : targetStatus === "FROZEN" ? "bg-amber-600 hover:bg-amber-500" : "bg-red-600 hover:bg-red-500"
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
