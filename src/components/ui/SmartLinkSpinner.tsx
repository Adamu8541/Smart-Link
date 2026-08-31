import React from "react";
import { SmartLinkLogoMark } from "./SmartLinkLogoMark";

export interface SmartLinkSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  label?: string;
  sublabel?: string;
  animating?: boolean;
  fullScreen?: boolean;
  className?: string;
  color?: string;
}

export const SmartLinkSpinner: React.FC<SmartLinkSpinnerProps> = ({
  size = "md",
  label,
  sublabel,
  animating = true,
  fullScreen = false,
  className = "",
  color = "#0F2D5C",
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 text-center ${className}`}>
      <SmartLinkLogoMark size={size} animating={animating} color={color} />
      {label && (
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#0F2D5C] tracking-tight">{label}</p>
          {sublabel && <p className="text-xs text-[#6B7280] font-normal">{sublabel}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-[#E5E7EB] max-w-sm w-full mx-4 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default SmartLinkSpinner;
