import React from "react";
import { motion } from "motion/react";

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
  color = "#0F2D5C",
  className = "",
  label,
}) => {
  // Map size helper to pixel dimension
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
        return 88;
      default:
        return 48;
    }
  };

  const pxSize = getPxSize();

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 select-none ${className}`}>
      <motion.div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pxSize, height: pxSize }}
        animate={
          animating
            ? {
                scale: [1, 1.05, 1],
              }
            : { scale: 1 }
        }
        transition={
          animating
            ? {
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.2 }
        }
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
          style={{ willChange: "transform" }}
        >
          {/* Central 'S' Ribbon Symbol - smooth subtle counter/inner pulse */}
          <motion.g
            animate={
              animating
                ? {
                    rotate: 360,
                  }
                : { rotate: 0 }
            }
            transition={
              animating
                ? {
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : { duration: 0.3 }
            }
            style={{ transformOrigin: "60px 60px" }}
          >
            {/* Top folded ribbon loop of the 'S' */}
            <path
              d="M 38 42 C 30 30 42 16 62 16 L 80 16 C 92 16 100 24 96 36 C 92 48 76 56 58 64 L 40 72 C 32 76 28 82 30 88 C 32 94 40 98 52 98 L 78 98 C 90 98 98 90 94 80 L 88 80 C 90 86 84 90 74 90 L 52 90 C 44 90 38 88 37 84 C 36 80 40 76 46 73 L 64 65 C 84 57 102 46 105 32 C 108 16 94 8 78 8 L 60 8 C 36 8 20 24 30 40 L 38 42 Z"
              fill={color}
            />

            {/* Bottom folded ribbon loop of the 'S' */}
            <path
              d="M 82 78 C 90 90 78 104 58 104 L 40 104 C 28 104 20 96 24 84 C 28 72 44 64 62 56 L 80 48 C 88 44 92 38 90 32 C 88 26 80 22 68 22 L 42 22 C 30 22 22 30 26 40 L 32 40 C 30 34 36 30 46 30 L 68 30 C 76 30 82 32 83 36 C 84 40 80 44 74 47 L 56 55 C 36 63 18 74 15 88 C 12 104 26 112 42 112 L 60 112 C 84 112 100 96 90 80 L 82 78 Z"
              fill={color}
            />
          </motion.g>

          {/* Orbiting Swoosh Arc - rotating clockwise at 60 FPS (1.2s per 360 rotation) */}
          <motion.g
            animate={
              animating
                ? {
                    rotate: [0, 360],
                  }
                : { rotate: 0 }
            }
            transition={
              animating
                ? {
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : { duration: 0.3 }
            }
            style={{ transformOrigin: "60px 60px" }}
          >
            {/* Tapered orbital swoosh ring wrapping gracefully around logo */}
            <path
              d="M 12 76 C 2 45 28 18 68 12 C 98 8 116 22 114 38 C 112 52 94 62 66 66 C 36 70 14 76 12 76 Z M 19 70 C 25 68 45 62 70 58 C 92 54 106 46 107 36 C 108 26 94 15 67 18 C 34 22 10 44 19 70 Z"
              fill={color}
              opacity={0.9}
            />
          </motion.g>
        </svg>
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
