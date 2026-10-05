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

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none space-y-2">
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
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs block mx-auto"
      />
    </div>
  );
};
