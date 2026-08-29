/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Lock, ExternalLink, ShieldCheck } from "lucide-react";

export interface PaymentTermsConsentNoticeProps {
  onOpenPolicy: (docId: string) => void;
  compact?: boolean;
}

export function PaymentTermsConsentNotice({
  onOpenPolicy,
  compact = false
}: PaymentTermsConsentNoticeProps) {
  return (
    <div className={`p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left ${compact ? "text-[11px]" : "text-xs"}`}>
      <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-1">
        <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span>Secure Transaction & Settlement Terms</span>
      </div>
      <p className="text-slate-600 leading-relaxed text-[11px]">
        By completing this transaction, you agree to our{" "}
        <button
          type="button"
          onClick={() => onOpenPolicy("payment-terms")}
          className="text-blue-600 font-semibold hover:underline cursor-pointer focus:outline-none"
        >
          Payment Terms
        </button>
        ,{" "}
        <button
          type="button"
          onClick={() => onOpenPolicy("wallet-terms")}
          className="text-blue-600 font-semibold hover:underline cursor-pointer focus:outline-none"
        >
          Wallet Terms
        </button>
        , and{" "}
        <button
          type="button"
          onClick={() => onOpenPolicy("refund-policy")}
          className="text-blue-600 font-semibold hover:underline cursor-pointer focus:outline-none"
        >
          Refund & Cancellation Policy
        </button>
        . Funds are settled via CBN-authorized payment rails.
      </p>
    </div>
  );
}
