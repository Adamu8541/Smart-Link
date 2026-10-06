import React from "react";
import { SlipOptionConfig } from "../../../services/slipOptionsConfig";
import { formatNaira } from "../../../utils/formatUtils";
import { CreditCard, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export interface SlipLivePreviewCardProps {
  slipOption: SlipOptionConfig;
  userBalance?: number;
  serviceType?: string;
  onSelectOption?: (option: SlipOptionConfig) => void;
  isSelected?: boolean;
}

export const SlipLivePreviewCard: React.FC<SlipLivePreviewCardProps> = ({
  slipOption,
  userBalance,
  serviceType = "NIN",
}) => {
  const name = (slipOption?.name || "").trim().toLowerCase();
  const id = (slipOption?.id || "").trim().toUpperCase();

  let imageSrc = "/assets/Regular.webp";
  let altText = "Regular Slip";

  if (
    name === "bvn card" ||
    id === "BVN_CARD" ||
    id === "BVN_PREMIUM_CARD" ||
    name.includes("bvn card") ||
    (serviceType.toUpperCase().includes("BVN") && (id.includes("CARD") || name.includes("card")))
  ) {
    imageSrc = "/assets/BVN%20Card.webp";
    altText = "BVN Card";
  } else if (
    name === "bvn slip" ||
    name === "bvn slip 1" ||
    id === "BVN_SLIP_1" ||
    id === "BVN_SLIP" ||
    name.includes("bvn slip") ||
    (serviceType.toUpperCase().includes("BVN") && (id.includes("slip") || name.includes("slip")))
  ) {
    imageSrc = "/assets/BVN%20Slip%201.webp";
    altText = "BVN Slip";
  } else if (
    name === "premium card" ||
    name === "nin premium card" ||
    name === "premium slip" ||
    id === "PREMIUM" ||
    id === "NIN_PREMIUM_WHITE" ||
    id === "NIN_PREMIUM_CARD" ||
    id === "NIN_PREMIUM_GREEN" ||
    name.includes("premium")
  ) {
    imageSrc = "/assets/premium.webp";
    altText = "Premium Card";
  }

  const isCard = altText.toLowerCase().includes("card");
  const price = typeof slipOption?.price === "number" ? slipOption.price : 0;
  const isAffordable = userBalance !== undefined ? userBalance >= price : true;

  return (
    <div className="w-full flex flex-col rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* Top Preview Header Bar with Price from Turso */}
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F2D5C]/10 dark:bg-blue-900/30 text-[#0F2D5C] dark:text-blue-400 flex items-center justify-center">
            {isCard ? <CreditCard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{slipOption?.name || altText}</span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {slipOption?.dimensions || (isCard ? "CR80 Plastic Card" : "A4 Standard")}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Live layout preview • Official security seals embedded
            </p>
          </div>
        </div>

        {/* Live Price Tag */}
        <div className="text-right shrink-0">
          <div className="text-xs font-extrabold text-[#0F2D5C] dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 shadow-2xs">
            {formatNaira(price)}
          </div>
        </div>
      </div>

      {/* Preview Image Frame */}
      <div className="p-3 sm:p-4 flex items-center justify-center bg-slate-100/60 dark:bg-slate-950/50 min-h-[160px]">
        <img
          src={imageSrc}
          alt={altText}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (imageSrc.includes("premium") && !target.src.includes("Premium.webp")) {
              target.src = "/assets/Premium.webp";
            } else if (imageSrc.includes("Regular") && !target.src.includes("regular.webp")) {
              target.src = "/assets/regular.webp";
            }
          }}
          className="w-full h-auto max-w-md rounded-xl object-contain shadow-md block mx-auto border border-slate-200/60 dark:border-slate-700/60"
        />
      </div>

      {/* Bottom Info Bar with Wallet Status */}
      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Amount to deduct from wallet: <strong className="text-slate-900 dark:text-white font-mono">{formatNaira(price)}</strong></span>
        </span>

        {userBalance !== undefined && (
          <span className={`inline-flex items-center gap-1 font-bold ${isAffordable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isAffordable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Balance OK</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Need {formatNaira(price - userBalance)}</span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
