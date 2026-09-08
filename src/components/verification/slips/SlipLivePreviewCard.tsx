import React from "react";
import { SlipOptionConfig } from "../../../services/slipOptionsConfig";

export interface SlipLivePreviewCardProps {
  slipOption: SlipOptionConfig;
  userBalance?: number;
  serviceType?: string;
  onSelectOption?: (option: SlipOptionConfig) => void;
  isSelected?: boolean;
}

export const SlipLivePreviewCard: React.FC<SlipLivePreviewCardProps> = ({
  slipOption,
  serviceType = "NIN",
}) => {
  const name = (slipOption?.name || "").trim().toLowerCase();
  const id = (slipOption?.id || "").trim().toUpperCase();

  // 1. BVN Services / Bank Services
  // Drop down: BVN Card, image: BVN Card.webp
  if (
    name === "bvn card" ||
    id === "BVN_CARD" ||
    id === "BVN_PREMIUM_CARD" ||
    name.includes("bvn card") ||
    (serviceType.toUpperCase().includes("BVN") && (id.includes("CARD") || name.includes("card")))
  ) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/BVN%20Card.webp"
          alt="BVN Card"
          loading="eager"
          referrerPolicy="no-referrer"
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
        />
      </div>
    );
  }

  // Drop down: BVN Slip 1, image: BVN Slip 1.webp
  if (
    name === "bvn slip 1" ||
    id === "BVN_SLIP_1" ||
    name.includes("bvn slip 1") ||
    (serviceType.toUpperCase().includes("BVN") && (id.includes("1") || name.includes("1")))
  ) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/BVN%20Slip%201.webp"
          alt="BVN Slip 1"
          loading="eager"
          referrerPolicy="no-referrer"
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
        />
      </div>
    );
  }

  // Drop down: BVN Slip 2, image: BVN Slip 2.webp
  if (
    name === "bvn slip 2" ||
    id === "BVN_SLIP_2" ||
    name.includes("bvn slip 2") ||
    (serviceType.toUpperCase().includes("BVN") && (id.includes("2") || name.includes("2")))
  ) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/BVN%20Slip%202.webp"
          alt="BVN Slip 2"
          loading="eager"
          referrerPolicy="no-referrer"
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
        />
      </div>
    );
  }

  // 2. Identity Services or NIN Services
  // Drop down: Premium Card -> image: premium.webp
  if (
    name === "premium card" ||
    name === "nin premium card" ||
    name === "premium slip" ||
    id === "PREMIUM" ||
    id === "NIN_PREMIUM_WHITE" ||
    id === "NIN_PREMIUM_CARD" ||
    id === "NIN_PREMIUM_GREEN" ||
    name.includes("premium")
  ) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/premium.webp"
          alt="Premium Card"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("Premium.webp")) {
              target.src = "/assets/Premium.webp";
            }
          }}
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
        />
      </div>
    );
  }

  // Drop down: Standard Slip -> image: standard.webp
  if (
    name === "standard slip" ||
    name === "nin standard slip" ||
    id === "STANDARD" ||
    id === "NIN_STANDARD" ||
    id === "NIN_STANDARD_SLIP" ||
    name.includes("standard")
  ) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/standard.webp"
          alt="Standard Slip"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("Standard.webp")) {
              target.src = "/assets/Standard.webp";
            }
          }}
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
        />
      </div>
    );
  }

  // Drop down: Regular Slip (Official NIMC Enrolment Slip) -> image: Regular.webp / regular.webp
  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src="/assets/Regular.webp"
        alt="Regular Slip"
        loading="eager"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes("regular.webp")) {
            target.src = "/assets/regular.webp";
          }
        }}
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
      />
    </div>
  );
};
