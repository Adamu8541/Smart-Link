import React from "react";
import { motion } from "motion/react";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";
const logoImg = DEFAULT_LOGO_URL;

export interface SmartLinkLogoMarkProps {
  /** Size in pixels or Tailwind scale ('xs' | 'sm' | 'md' | 'lg' | 'xl' | number) */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** Whether the loading animation is active. Stops automatically when false. */
  animating?: boolean;
  /** Primary color for the logo symbol (defaults to SmartLink Navy #0F2D5C) */
  color?: string;
  /** Additional CSS class names */
  className?: string;
  /** Optional secondary label text beneath or beside icon */
  label?: string;
}

export const SmartLinkLogoMark: React.FC<SmartLinkLogoMarkProps> = ({
  size = "md",
  animating = true,
  className = "",
  label,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo = config.branding?.logoUrl || config.branding?.lightLogoUrl || configuredLogoUrl || logoImg;

  // Map size helper to pixel dimension
  const getPxHeight = () => {
    if (typeof size === "number") return size;
    switch (size) {
      case "xs":
        return 20;
      case "sm":
        return 32;
      case "md":
        return 48;
      case "lg":
        return 64;
      case "xl":
        return 88;
      default:
        return 48;
    }
  };

  const pxHeight = getPxHeight();

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 select-none ${className}`}>
      <motion.div
        className="relative flex items-center justify-center shrink-0"
        style={{ height: pxHeight }}
        animate={
          animating
            ? {
                scale: [1, 1.04, 1],
                opacity: [0.9, 1, 0.9],
              }
            : { scale: 1, opacity: 1 }
        }
        transition={
          animating
            ? {
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.2 }
        }
      >
        <img
          src={activeLogo}
          alt={`${siteName || "SmartLink"} Official Brand Logo`}
          width={180}
          height={pxHeight}
          loading="eager"
          decoding="async"
          className="h-full w-auto object-contain max-w-full"
          referrerPolicy="no-referrer"
          onError={handleLogoError}
        />
      </motion.div>

      {label && (
        <span className="text-xs font-bold tracking-wide text-[#0F2D5C] animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default SmartLinkLogoMark;

