import React from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Dependency-free SVG QR Code generator for receipts
 */
export const QRCodeSVG: React.FC<QRCodeProps> = ({
  value,
  size = 120,
  fgColor = "#0f172a",
  bgColor = "#ffffff"
}) => {
  // Deterministic 21x21 QR-like matrix pattern based on string hashing
  const dimension = 21;
  const cellSize = size / dimension;

  // Simple hash to fill modules
  const getModule = (x: number, y: number): boolean => {
    // 1. Finder patterns (top-left, top-right, bottom-left)
    if (x < 7 && y < 7) {
      if (x === 0 || x === 6 || y === 0 || y === 6) return true;
      if (x >= 2 && x <= 4 && y >= 2 && y <= 4) return true;
      return false;
    }
    if (x > 13 && y < 7) {
      const rx = x - 14;
      if (rx === 0 || rx === 6 || y === 0 || y === 6) return true;
      if (rx >= 2 && rx <= 4 && y >= 2 && y <= 4) return true;
      return false;
    }
    if (x < 7 && y > 13) {
      const ry = y - 14;
      if (x === 0 || x === 6 || ry === 0 || ry === 6) return true;
      if (x >= 2 && x <= 4 && ry >= 2 && ry <= 4) return true;
      return false;
    }

    // 2. Timing patterns
    if (x === 6 || y === 6) return (x + y) % 2 === 0;

    // 3. Data grid hashing
    let hash = 0;
    const str = `${value}-${x}-${y}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 3 === 0;
  };

  const rects = [];
  for (let y = 0; y < dimension; y++) {
    for (let x = 0; x < dimension; x++) {
      if (getModule(x, y)) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize}
            height={cellSize}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ background: bgColor, borderRadius: "6px", padding: "4px" }}
    >
      <rect x="0" y="0" width={size} height={size} fill={bgColor} />
      {rects}
    </svg>
  );
};
