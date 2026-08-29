import React from "react";

/**
 * Official Nigerian Coat of Arms Vector Component
 */
export const NigerianCoatOfArmsSvg: React.FC<{ className?: string; size?: number }> = ({
  className = "w-12 h-12",
  size = 48,
}) => (
  <svg
    viewBox="0 0 200 180"
    width={size}
    height={size * 0.9}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red Eagle at top */}
    <g id="eagle" transform="translate(100, 30)">
      {/* Eagle body */}
      <path
        d="M0 -22 C-6 -22 -14 -12 -12 2 C-10 12 -4 16 0 18 C4 16 10 12 12 2 C14 -12 6 -22 0 -22 Z"
        fill="#C41E3A"
      />
      {/* Eagle Head */}
      <path
        d="M-2 -22 C-2 -28 2 -30 6 -28 C10 -26 10 -22 8 -20 C6 -18 2 -18 -2 -22 Z"
        fill="#C41E3A"
      />
      <path d="M7 -26 L13 -25 L8 -22 Z" fill="#D4AF37" />
      {/* Wings */}
      <path
        d="M-8 -15 C-28 -30 -48 -20 -55 -2 C-45 -2 -32 4 -12 8 Z"
        fill="#B22222"
      />
      <path
        d="M8 -15 C28 -30 48 -20 55 -2 C45 -2 32 4 12 8 Z"
        fill="#B22222"
      />
      {/* Feathers */}
      <path d="M-45 -5 C-35 8 -22 14 -10 15 Z" fill="#8B0000" />
      <path d="M45 -5 C35 8 22 14 10 15 Z" fill="#8B0000" />
      {/* Wreath base under eagle */}
      <rect x="-24" y="16" width="48" height="6" rx="3" fill="#008751" />
      <rect x="-20" y="17" width="10" height="4" fill="#FFFFFF" />
      <rect x="10" y="17" width="10" height="4" fill="#FFFFFF" />
    </g>

    {/* Left Supporting White Horse */}
    <g id="left-horse" transform="translate(42, 85)">
      <path
        d="M10 -40 C-2 -35 -14 -20 -15 0 C-16 20 -10 40 8 50 C2 40 0 20 2 0 C4 -20 8 -30 10 -40 Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Horse Head */}
      <path
        d="M10 -40 C14 -50 4 -58 -6 -52 C-14 -46 -10 -38 0 -36 Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Mane & Legs */}
      <path d="M-8 -54 L-6 -44 L-2 -40" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M-12 15 C-25 25 -20 45 -18 52" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <path d="M-4 25 C-12 35 -10 50 -6 54" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Right Supporting White Horse */}
    <g id="right-horse" transform="translate(158, 85) scale(-1, 1)">
      <path
        d="M10 -40 C-2 -35 -14 -20 -15 0 C-16 20 -10 40 8 50 C2 40 0 20 2 0 C4 -20 8 -30 10 -40 Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Horse Head */}
      <path
        d="M10 -40 C14 -50 4 -58 -6 -52 C-14 -46 -10 -38 0 -36 Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Mane & Legs */}
      <path d="M-8 -54 L-6 -44 L-2 -40" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M-12 15 C-25 25 -20 45 -18 52" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <path d="M-4 25 C-12 35 -10 50 -6 54" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Black Shield with Silver Y Pall */}
    <g id="shield" transform="translate(100, 95)">
      {/* Black Shield base */}
      <path
        d="M-36 -42 L36 -42 C36 -10 32 20 0 45 C-32 20 -36 -10 -36 -42 Z"
        fill="#0F172A"
        stroke="#D4AF37"
        strokeWidth="2.5"
      />
      {/* Silver 'Y' representing Niger and Benue rivers */}
      <path
        d="M-34 -42 L-10 -15 L-10 40 L10 40 L10 -15 L34 -42 L18 -42 L0 -20 L-18 -42 Z"
        fill="#FFFFFF"
      />
      <path
        d="M-26 -42 L-6 -17 L-6 38 L6 38 L6 -17 L26 -42"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
    </g>

    {/* Yellow Flowers / Coctus Spectabilis Floral Base */}
    <g id="floral-base" transform="translate(100, 142)">
      <path d="M-75 0 C-40 -10 40 -10 75 0 C50 12 -50 12 -75 0 Z" fill="#16A34A" />
      {/* Red & Yellow Petals */}
      <circle cx="-50" cy="-2" r="3.5" fill="#EAB308" stroke="#DC2626" strokeWidth="1" />
      <circle cx="-25" cy="-5" r="3.5" fill="#EAB308" stroke="#DC2626" strokeWidth="1" />
      <circle cx="0" cy="-6" r="4" fill="#EAB308" stroke="#DC2626" strokeWidth="1" />
      <circle cx="25" cy="-5" r="3.5" fill="#EAB308" stroke="#DC2626" strokeWidth="1" />
      <circle cx="50" cy="-2" r="3.5" fill="#EAB308" stroke="#DC2626" strokeWidth="1" />
    </g>

    {/* Golden Motto Scroll Banner */}
    <g id="motto-banner" transform="translate(100, 160)">
      <path
        d="M-85 -10 L-65 -4 L-65 6 L-85 0 Z M85 -10 L65 -4 L65 6 L85 0 Z"
        fill="#B45309"
      />
      <path
        d="M-70 -6 C-30 -12 30 -12 70 -6 L65 7 C25 2 -25 2 -65 7 Z"
        fill="#FDE047"
        stroke="#CA8A04"
        strokeWidth="1"
      />
      <text
        x="0"
        y="1"
        textAnchor="middle"
        fontSize="5.2"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="#78350F"
        letterSpacing="0.2"
      >
        UNITY AND FAITH, PEACE AND PROGRESS
      </text>
    </g>
  </svg>
);

/**
 * Official NIMC Logo Vector Component
 */
export const NimcOfficialLogoSvg: React.FC<{ className?: string; size?: number }> = ({
  className = "w-14 h-14",
  size = 56,
}) => (
  <svg
    viewBox="0 0 160 120"
    width={size}
    height={size * 0.75}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Green Swirl Circle Arch */}
    <path
      d="M80 18 C115 18 140 40 140 70 C140 95 118 112 85 112 C50 112 25 90 25 65 C25 45 42 32 60 32 C78 32 90 42 90 55 C90 65 82 72 72 72 C64 72 58 66 58 60"
      stroke="#008751"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="80" cy="18" r="7" fill="#008751" />
    <circle cx="60" cy="60" r="5" fill="#008751" />
    {/* NIMC Wordmark */}
    <text
      x="80"
      y="84"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontWeight="900"
      fontSize="36"
      fill="#008751"
      letterSpacing="-1"
    >
      NIMC
    </text>
  </svg>
);

/**
 * Official NIBSS Logo Vector Component
 */
export const NibssOfficialLogoSvg: React.FC<{ className?: string; size?: number }> = ({
  className = "w-16 h-8",
  size = 64,
}) => (
  <svg
    viewBox="0 0 200 80"
    width={size}
    height={size * 0.4}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="5" y="10" width="190" height="60" rx="8" fill="#0F2D5C" />
    <circle cx="35" cy="40" r="16" fill="#F59E0B" />
    <text
      x="115"
      y="48"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontWeight="900"
      fontSize="28"
      fill="#FFFFFF"
      letterSpacing="2"
    >
      NIBSS
    </text>
    <text
      x="115"
      y="62"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontWeight="bold"
      fontSize="7"
      fill="#93C5FD"
      letterSpacing="0.5"
    >
      NIGERIA INTER-BANK SETTLEMENT SYSTEM
    </text>
  </svg>
);

/**
 * Security Guilloche Fine-Line Background Pattern Component
 */
export const GuillocheSecurityBackground: React.FC<{
  color?: string;
  opacity?: number;
  className?: string;
}> = ({ color = "#15803d", opacity = 0.18, className = "" }) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity }}
  >
    <defs>
      <pattern
        id="guilloche-rosette"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="0.6" />
        <circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1,1" />
        <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="0.6" />
        <circle cx="20" cy="20" r="6" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="20" cy="20" r="2" fill="none" stroke={color} strokeWidth="0.7" />
        <path d="M0 20 Q 10 0, 20 20 T 40 20" fill="none" stroke={color} strokeWidth="0.4" />
        <path d="M20 0 Q 0 10, 20 20 T 20 40" fill="none" stroke={color} strokeWidth="0.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche-rosette)" />
  </svg>
);
