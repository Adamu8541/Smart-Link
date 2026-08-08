import React from "react";
import { Wallet as WalletIcon, Plus, Send, History, ShieldCheck, Lock } from "lucide-react";
import { Wallet } from "../../types";
import { WalletBalance } from "./WalletBalance";

interface WalletCardProps {
  wallet?: Wallet | null;
  balance?: number;
  onFundWallet?: () => void;
  onTransfer?: () => void;
  onViewHistory?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  balance,
  onFundWallet,
  onTransfer,
  onViewHistory,
  onRefresh,
  isLoading = false,
}) => {
  const currentBalance = wallet ? wallet.currentBalance : balance ?? 0;
  const heldBalance = wallet ? wallet.heldBalance : 0;
  const status = wallet ? wallet.walletStatus : "ACTIVE";
  const currency = wallet ? wallet.currency : "NGN";

  const formattedLastUpdated = wallet?.lastUpdated
    ? new Date(wallet.lastUpdated).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xl transition-all">
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <WalletBalance
            balance={currentBalance}
            heldBalance={heldBalance}
            currency={currency}
            status={status}
            isLoading={isLoading}
            onRefresh={onRefresh}
            size="lg"
          />
          {formattedLastUpdated && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Last synced: {formattedLastUpdated}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onFundWallet && (
            <button
              type="button"
              onClick={onFundWallet}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Fund Wallet</span>
            </button>
          )}

          {onTransfer && (
            <button
              type="button"
              onClick={onTransfer}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Transfer</span>
            </button>
          )}

          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              title="Transaction History"
            >
              <History className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="font-medium text-[11px]">256-Bit Encrypted Wallet Engine</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <Lock className="h-3 w-3" />
          <span>Centralized Payment System</span>
        </div>
      </div>
    </div>
  );
};
