import React from "react";
import { motion } from "motion/react";

export interface FaviconLoaderProps {
  /** Size in pixels or preset scale ('xs' | 'sm' | 'md' | 'lg' | 'xl' | number) */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** Custom CSS classes */
  className?: string;
  /** Optional loading text label displayed beneath the favicon loader */
  label?: string;
  /** Whether to render as a full-screen backdrop overlay */
  fullScreen?: boolean;
}

/**
  FaviconLoader Component
 * Uses /favicon.webp with continuous clockwise rotation and blinking opacity animation.
 */
export const FaviconLoader: React.FC<FaviconLoaderProps> = ({
  size = "md",
  className = "",
  label,
  fullScreen = false,
}) => {
  const getPxSize = () => {
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
        return 96;
      default:
        return 48;
    }
  };

  const pxSize = getPxSize();

  const loaderContent = (
    <div className={`inline-flex flex-col items-center justify-center gap-2.5 select-none ${className}`}>
      <motion.div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pxSize, height: pxSize }}
        animate={{
          opacity: [0.15, 1, 0.15],
          scale: [0.96, 1.04, 0.96],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src="/favicon.webp"
          alt="Loading..."
          width={pxSize}
          height={pxSize}
          className="w-full h-full object-contain filter drop-shadow-sm"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {label && (
        <span className="text-xs font-semibold tracking-wide text-[#0F2D5C] dark:text-[#9CA3AF] animate-pulse text-center">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default FaviconLoader;
