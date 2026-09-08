import React from "react";

export interface IconProps {
  className?: string;
}

// =====================================================================
// 1. NIMC & IDENTITY SERVICES (Official NIMC Green #008751 & Gold #EAB308)
// =====================================================================

/**
 * Authentic NIMC National Identity Management Commission Official Logo
 */
export function NimcOfficialLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100/80 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stylized Human Identity Figures in Official NIMC Green */}
        <g fill="#008751">
          {/* Left head and shoulder silhouette */}
          <circle cx="36" cy="24" r="5.5" />
          <path d="M28 42 C28 32 44 32 44 42 L44 45 C44 45 28 45 28 45 Z" />
          
          {/* Right head and shoulder silhouette */}
          <circle cx="64" cy="24" r="5.5" />
          <path d="M56 42 C56 32 72 32 72 42 L72 45 C72 45 56 45 56 45 Z" />
          
          {/* Central connective biometric aura */}
          <path d="M40 22 C44 18 56 18 60 22" stroke="#008751" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Authentic 'nimc' typography in official NIMC green */}
        <text
          x="50"
          y="65"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="22"
          fill="#008751"
          letterSpacing="-0.8"
        >
          nimc
        </text>

        {/* Yellow/gold dot accent on the 'i' */}
        <circle cx="43" cy="52" r="2.4" fill="#EAB308" />

        {/* Triple Nigerian base curves / waves */}
        <path d="M20 74 C34 78 66 78 80 74" stroke="#008751" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M26 80 C37 83.5 63 83.5 74 80" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 86 C40 88 60 88 68 86" stroke="#008751" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// NIN Demography - NIMC Official Logo with Demographic Profile Indicator
export function NinDemographyIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Subtle circular background watermark */}
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        {/* NIMC Authentic Emblem */}
        <g fill="#008751">
          <circle cx="38" cy="22" r="4.5" />
          <path d="M31 37 C31 29 45 29 45 37 Z" />
          <circle cx="62" cy="22" r="4.5" />
          <path d="M55 37 C55 29 69 29 69 37 Z" />
          <path d="M42 20 C45 17 55 17 58 20" stroke="#008751" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        
        {/* 'nimc' text */}
        <text x="50" y="56" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751" letterSpacing="-0.5">
          nimc
        </text>
        <circle cx="44.2" cy="45.5" r="2" fill="#EAB308" />
        
        {/* Bio-Data Card Mini-Bar */}
        <rect x="22" y="64" width="56" height="15" rx="3" fill="#008751" fillOpacity="0.1" stroke="#008751" strokeWidth="1.2" />
        <line x1="28" y1="71" x2="48" y2="71" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="71" x2="72" y2="71" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        
        {/* Label */}
        <text x="50" y="90" fontSize="7" fontWeight="800" textAnchor="middle" fill="#008751" letterSpacing="0.6">
          DEMOGRAPHY
        </text>
      </svg>
    </div>
  );
}

// NIN Verification - NIMC Official Logo with Verified Shield Badge
export function NinVerificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        {/* NIMC Authentic Head Silhouettes */}
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        {/* 'nimc' text */}
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751" letterSpacing="-0.5">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Shield with verified checkmark */}
        <path d="M50 58 L66 64 V75 C66 84 50 90 50 90 C50 90 34 84 34 75 V64 Z" fill="#008751" stroke="#008751" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M43 74 L48 79 L57 69" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// NIN Phone Number Lookup - NIMC Logo with Telco Link Symbol
export function NinPhoneIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        {/* NIMC Figures */}
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        {/* 'nimc' text */}
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Phone Device with Signal */}
        <rect x="40" y="60" width="20" height="30" rx="3" fill="#008751" />
        <circle cx="50" cy="85" r="1.5" fill="#FFFFFF" />
        <rect x="44" y="64" width="12" height="17" rx="1" fill="#FFFFFF" />
        <path d="M32 72 C30 75 30 79 32 82" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        <path d="M68 72 C70 75 70 79 68 82" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// NIN Validation - NIMC Logo with Validation Ribbon
export function NinValidationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Validation Seal Ribbon */}
        <circle cx="50" cy="74" r="14" fill="#008751" />
        <circle cx="50" cy="74" r="11" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M44 74 L48 78 L56 70" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// VNIN Slip - NIMC Logo with Virtual NIN Badge
export function VninSlipIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Virtual VNIN Badge */}
        <rect x="20" y="62" width="60" height="26" rx="4" fill="#008751" />
        <text x="50" y="74" fontSize="8" fontWeight="900" textAnchor="middle" fill="#EAB308" letterSpacing="1">
          V - N I N
        </text>
        <text x="50" y="83" fontSize="6" fontWeight="800" textAnchor="middle" fill="#FFFFFF" letterSpacing="1.5">
          •••• •••• ••••
        </text>
      </svg>
    </div>
  );
}

// NIN Personalization - NIMC Logo with Smartchip Portrait
export function NinPersonalizationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Smartchip Badge */}
        <rect x="22" y="62" width="56" height="26" rx="4" fill="#FFFFFF" stroke="#008751" strokeWidth="2" />
        <rect x="28" y="68" width="14" height="14" rx="2" fill="#EAB308" fillOpacity="0.3" stroke="#D97706" strokeWidth="1.2" />
        <circle cx="62" cy="71" r="4" fill="#008751" />
        <path d="M54 82 C54 77 70 77 70 82 Z" fill="#008751" />
      </svg>
    </div>
  );
}

// NIN Modification - NIMC Logo with Edit Pen
export function NinModificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Modification Pen and Line */}
        <rect x="26" y="64" width="32" height="24" rx="3" fill="#FFFFFF" stroke="#008751" strokeWidth="1.8" />
        <line x1="32" y1="72" x2="50" y2="72" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="78" x2="44" y2="78" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M54 84 L72 66 C74 64 77 64 79 66 C81 68 81 71 79 73 L61 91 L52 93 Z" fill="#008751" stroke="#008751" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// NIN Slip Print - NIMC Logo with Printable Slip
export function NinSlipGenIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Printable National Slip */}
        <rect x="24" y="60" width="52" height="28" rx="3" fill="#FFFFFF" stroke="#008751" strokeWidth="2" />
        <rect x="28" y="64" width="44" height="4" fill="#008751" />
        <rect x="30" y="72" width="10" height="10" fill="#008751" fillOpacity="0.2" stroke="#008751" strokeWidth="1" />
        <line x1="44" y1="73" x2="68" y2="73" stroke="#008751" strokeWidth="1.5" />
        <line x1="44" y1="78" x2="64" y2="78" stroke="#EAB308" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// IPE Clearance - NIMC Logo with Biometric Fingerprint Clearance Stamp
export function NinIpeClearanceIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#008751" fillOpacity="0.04" />
        
        <g fill="#008751">
          <circle cx="38" cy="20" r="4.5" />
          <path d="M31 35 C31 27 45 27 45 35 Z" />
          <circle cx="62" cy="20" r="4.5" />
          <path d="M55 35 C55 27 69 27 69 35 Z" />
        </g>
        
        <text x="50" y="53" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#008751">
          nimc
        </text>
        <circle cx="44.2" cy="42.5" r="2" fill="#EAB308" />

        {/* Verified IPE Clearance Stamp */}
        <rect x="22" y="64" width="56" height="22" rx="4" fill="#008751" />
        <text x="50" y="78" fontSize="9" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="1">
          IPE CLEAR
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 2. NIBSS & BANKING SERVICES (Official NIBSS Deep Slate #0A192F & Gold #F59E0B)
// =====================================================================

/**
 * Authentic NIBSS Nigeria Inter-Bank Settlement System Official Logo
 */
export function NibssOfficialLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Deep Slate background banner */}
        <rect x="2" y="8" width="96" height="64" rx="12" fill="#0A192F" />
        
        {/* Golden yellow central emblem badge */}
        <circle cx="26" cy="38" r="13" fill="#F59E0B" fillOpacity="0.25" />
        <circle cx="26" cy="38" r="9" fill="#F59E0B" />
        
        {/* Dynamic white accent arc */}
        <path d="M21 38 A5 5 0 0 1 31 38" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

        {/* Speed bars representing instant inter-bank settlement */}
        <rect x="42" y="24" width="48" height="4" rx="2" fill="#38BDF8" opacity="0.9" />
        
        {/* Authentic NIBSS bold typography */}
        <text
          x="66"
          y="48"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="17"
          fill="#FFFFFF"
          letterSpacing="1.2"
        >
          NIBSS
        </text>

        {/* Subtitle bar */}
        <text
          x="66"
          y="58"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="4.8"
          fill="#94A3B8"
          letterSpacing="0.4"
        >
          SETTLEMENT SYSTEM
        </text>
      </svg>
    </div>
  );
}

// BVN Verification - NIBSS Official Logo
export function BvnVerificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="8" width="96" height="64" rx="12" fill="#0A192F" />
        <circle cx="26" cy="38" r="13" fill="#F59E0B" fillOpacity="0.25" />
        <circle cx="26" cy="38" r="9" fill="#F59E0B" />
        <path d="M21 38 A5 5 0 0 1 31 38" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="42" y="24" width="48" height="4" rx="2" fill="#38BDF8" opacity="0.9" />
        <text x="66" y="48" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" fill="#FFFFFF" letterSpacing="1.2">
          NIBSS
        </text>
        <text x="66" y="58" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="5" fill="#38BDF8" letterSpacing="0.5">
          BVN VERIFIED
        </text>
      </svg>
    </div>
  );
}

// VNIN to NIBSS - Dual NIMC to NIBSS Link Bridge
export function VninToNibssIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="#0A192F" fillOpacity="0.04" />
        
        {/* Left NIMC Badge */}
        <rect x="12" y="22" width="34" height="26" rx="4" fill="#008751" />
        <text x="29" y="38" fontSize="8" fontWeight="900" textAnchor="middle" fill="#FFFFFF">
          NIMC
        </text>
        
        {/* Center Sync Arrow */}
        <path d="M48 35 L52 35 M50 31 L54 35 L50 39" stroke="#00A3E0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Right NIBSS Badge */}
        <rect x="54" y="22" width="34" height="26" rx="4" fill="#0A192F" />
        <text x="71" y="38" fontSize="8" fontWeight="900" textAnchor="middle" fill="#F59E0B">
          NIBSS
        </text>

        {/* Bottom Banner */}
        <rect x="18" y="60" width="64" height="22" rx="4" fill="#0F2D5C" />
        <text x="50" y="74" fontSize="8" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.8">
          VNIN ➔ BVN
        </text>
      </svg>
    </div>
  );
}

// BVN User Profile - NIBSS Official Logo
export function BvnUserIcon({ className = "h-14 w-14" }: IconProps) {
  return <BvnVerificationIcon className={className} />;
}

// BVN Modification - NIBSS Official Logo
export function BvnModificationIcon({ className = "h-14 w-14" }: IconProps) {
  return <BvnVerificationIcon className={className} />;
}

// BVN Slip Print - NIBSS Official Logo
export function BvnSlipPrintIcon({ className = "h-14 w-14" }: IconProps) {
  return <BvnVerificationIcon className={className} />;
}

// BVN Retrieval - NIBSS Official Logo
export function BvnRetrievalIcon({ className = "h-14 w-14" }: IconProps) {
  return <BvnVerificationIcon className={className} />;
}

// =====================================================================
// 3. CAC & CORPORATE SERVICES (Official CAC Forest Green #006837 & Gold #D97706)
// =====================================================================

/**
 * Authentic CAC Corporate Affairs Commission Official Logo
 */
export function CacOfficialLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Green Circular Seal */}
        <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
        <circle cx="50" cy="50" r="39" stroke="#008751" strokeWidth="1" strokeDasharray="3 2" />

        {/* Central Nigerian Coat of Arms */}
        {/* Red Eagle */}
        <polygon points="50,18 46,24 54,24" fill="#DC2626" />
        <path d="M44 22 C47 20 53 20 56 22" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />

        {/* Shield with Silver 'Y' */}
        <path d="M42 27 L58 27 L56 46 C56 50 50 54 50 54 C50 54 44 50 44 46 Z" fill="#1E293B" stroke="#008751" strokeWidth="1.5" />
        <path d="M44 29 L50 38 L50 52 M56 29 L50 38" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* Flanking rearing white horses */}
        <path d="M33 34 C35 30 38 28 40 33 C41 38 39 46 36 50" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <path d="M67 34 C65 30 62 28 60 33 C59 38 61 46 64 50" stroke="#008751" strokeWidth="2" strokeLinecap="round" />

        {/* Base Banner */}
        <path d="M28 56 L72 56 L68 62 L32 62 Z" fill="#008751" fillOpacity="0.2" />

        {/* Bold CAC Wordmark */}
        <text
          x="50"
          y="77"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="17"
          fill="#008751"
          letterSpacing="1"
        >
          CAC
        </text>
        
        <text
          x="50"
          y="88"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="6"
          fill="#008751"
          opacity="0.85"
          letterSpacing="0.4"
        >
          NIGERIA
        </text>
      </svg>
    </div>
  );
}

export function CacRegistrationLogo({ className = "h-14 w-14" }: IconProps) {
  return <CacOfficialLogo className={className} />;
}

// SCUML / EFCC Official Anti-Money Laundering Logo
export function ScumlOfficialLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-red-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#DC2626" fillOpacity="0.08" stroke="#DC2626" strokeWidth="3" />
        <circle cx="50" cy="50" r="39" stroke="#DC2626" strokeWidth="1" strokeDasharray="3 2" />
        
        {/* Central Eagle / Shield */}
        <path d="M50 20 L68 28 V46 C68 60 50 68 50 68 C50 68 32 60 32 46 V28 Z" fill="#0A192F" stroke="#DC2626" strokeWidth="2" />
        <path d="M42 42 L48 48 L58 38" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <text x="50" y="80" fontSize="13" fontWeight="900" textAnchor="middle" fill="#DC2626" letterSpacing="1">
          SCUML
        </text>
        <text x="50" y="89" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="#0A192F" letterSpacing="0.5">
          EFCC AML/CFT
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 4. TAX & FIRS SERVICES (Official Federal Inland Revenue / NRS)
// =====================================================================

/**
 * Authentic NRS / FIRS Tax ID Search Logo
 */
export function NrsOfficialLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="14" y="14" width="72" height="26" rx="8" fill="#0F2D5C" />
        <rect x="14" y="42" width="72" height="4" fill="#DC2626" />
        
        <text x="50" y="32" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#FFFFFF" letterSpacing="2">
          NRS
        </text>

        {/* Magnifying glass & Tax check */}
        <circle cx="50" cy="64" r="14" fill="#F1F5F9" stroke="#0F2D5C" strokeWidth="2.5" />
        <path d="M45 64 L48 68 L56 59" stroke="#008751" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="60" y1="74" x2="68" y2="82" stroke="#0F2D5C" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function TaxIdSearchLogo({ className = "h-14 w-14" }: IconProps) {
  return <NrsOfficialLogo className={className} />;
}

// =====================================================================
// 5. EDUCATION BOARDS (Authentic WAEC, NECO, and JAMB Official Logos)
// =====================================================================

/**
 * Authentic WAEC (West African Examinations Council) Official Logo
 */
export function WaecLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Circular Shield */}
        <circle cx="50" cy="50" r="46" fill="#1E3A8A" fillOpacity="0.08" stroke="#1E3A8A" strokeWidth="3" />
        
        {/* 16-Point Sun Star in Golden Yellow */}
        <path
          d="M50,16 L56,26 L68,22 L70,34 L82,34 L80,46 L90,50 L80,54 L82,66 L70,66 L68,78 L56,74 L50,84 L44,74 L32,78 L30,66 L18,66 L20,54 L10,50 L20,46 L18,34 L30,34 L32,22 L44,26 Z"
          fill="#F59E0B"
          stroke="#D97706"
          strokeWidth="1.2"
        />

        {/* Central Royal Blue Crest */}
        <circle cx="50" cy="50" r="22" fill="#1E3A8A" />

        {/* WAEC Inscription */}
        <text
          x="50"
          y="56"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.8"
        >
          WAEC
        </text>
      </svg>
    </div>
  );
}

/**
 * Authentic NECO (National Examinations Council) Official Logo
 */
export function NecoLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Emerald Green Seal */}
        <circle cx="50" cy="50" r="46" fill="#059669" fillOpacity="0.08" stroke="#059669" strokeWidth="3" />
        <circle cx="50" cy="50" r="39" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* Open Book of Knowledge */}
        <path d="M30 38 Q50 34 50 44 Q50 34 70 38 L68 56 Q50 51 50 60 Q50 51 32 56 Z" fill="#EAB308" fillOpacity="0.3" stroke="#EAB308" strokeWidth="2" strokeLinejoin="round" />
        <line x1="50" y1="44" x2="50" y2="60" stroke="#EAB308" strokeWidth="2" />

        {/* Torch Flame of Excellence */}
        <polygon points="50,18 46,26 54,26" fill="#DC2626" />
        <circle cx="50" cy="17" r="2.5" fill="#EAB308" />

        {/* Bold NECO Typography */}
        <text
          x="50"
          y="76"
          fontSize="16"
          fontWeight="900"
          textAnchor="middle"
          fill="#059669"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          NECO
        </text>

        <text
          x="50"
          y="87"
          fontSize="6"
          fontWeight="800"
          textAnchor="middle"
          fill="#059669"
          opacity="0.85"
          letterSpacing="0.4"
        >
          NATIONAL EXAMS
        </text>
      </svg>
    </div>
  );
}

/**
 * Authentic JAMB (Joint Admissions and Matriculation Board) Official Logo
 */
export function JambLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Official JAMB Green Circular Seal */}
        <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
        <circle cx="50" cy="50" r="40" stroke="#008751" strokeWidth="1" strokeDasharray="3 2" />

        {/* Central Golden Open Book */}
        <path d="M30 38 Q50 34 50 44 Q50 34 70 38 L68 56 Q50 51 50 60 Q50 51 32 56 Z" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
        <line x1="50" y1="44" x2="50" y2="60" stroke="#F59E0B" strokeWidth="2" />

        {/* Torch / Flame of Wisdom above */}
        <polygon points="50,20 47,28 53,28" fill="#DC2626" />
        <circle cx="50" cy="19" r="2.5" fill="#F59E0B" />

        {/* JAMB Bold Text */}
        <text
          x="50"
          y="76"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#008751"
          letterSpacing="1"
        >
          JAMB
        </text>

        {/* Subtitle */}
        <text
          x="50"
          y="86"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="6"
          fill="#008751"
          opacity="0.8"
          letterSpacing="0.5"
        >
          SERVICES
        </text>
      </svg>
    </div>
  );
}

// General Exam Pins (Voucher card)
export function ExamPinsLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
        <rect x="22" y="24" width="56" height="34" rx="5" fill="#FFFFFF" stroke="#008751" strokeWidth="2" />
        <rect x="27" y="32" width="46" height="8" rx="2" fill="#E2E8F0" />
        <text x="50" y="38.5" textAnchor="middle" fontSize="10" fill="#008751" fontWeight="900" letterSpacing="2">
          •••• ••••
        </text>
        <circle cx="50" cy="50" r="6" fill="#F59E0B" />
        <path d="M47 48 H53 V53 H47 Z" fill="#FFFFFF" />
        <text x="50" y="77" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#008751" letterSpacing="0.8">
          EXAM
        </text>
        <text x="50" y="87" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7" fill="#008751" opacity="0.85" letterSpacing="0.6">
          PINS & CARDS
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 6. VTU, UTILITIES & TELECOM (MTN, Airtel, Glo, 9mobile, Electricity)
// =====================================================================

/**
 * Authentic 4-Telecoms Airtime Logo (MTN Yellow, Airtel Red, Glo Green, 9mobile)
 */
export function VtuAirtimeIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        
        {/* MTN Yellow Oval */}
        <ellipse cx="36" cy="36" rx="14" ry="11" fill="#FFCC00" />
        <text x="36" y="40" fontSize="7.5" fontWeight="900" textAnchor="middle" fill="#000000" fontFamily="system-ui, sans-serif">
          MTN
        </text>
        
        {/* Airtel Red Circle */}
        <circle cx="64" cy="36" r="12" fill="#E60000" />
        <text x="64" y="40" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
          airtel
        </text>
        
        {/* Glo Green Circle */}
        <circle cx="36" cy="64" r="12" fill="#008234" />
        <text x="36" y="68" fontSize="8" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
          glo
        </text>
        
        {/* 9mobile Lime Circle */}
        <circle cx="64" cy="64" r="12" fill="#8DC63F" />
        <text x="64" y="68" fontSize="7" fontWeight="900" textAnchor="middle" fill="#0A192F" fontFamily="system-ui, sans-serif">
          9mob
        </text>
      </svg>
    </div>
  );
}

/**
 * Authentic High-Speed Data Bundles Logo (⇅ Data Bundles)
 */
export function VtuDataIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" fill="#F8FAFC" />

        {/* Up Arrow ↑ */}
        <path d="M38 65 L38 35 M38 35 L28 45 M38 35 L48 45" stroke="#0A192F" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Down Arrow ↓ */}
        <path d="M62 35 L62 65 M62 65 L52 55 M62 65 L72 55" stroke="#0A192F" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/**
 * Authentic Electricity Power Grid DisCo Logo
 */
export function VtuElectricityIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-yellow-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#FEF08A" fillOpacity="0.25" stroke="#EAB308" strokeWidth="2.5" />
        
        {/* High Voltage Lightning Flash */}
        <polygon points="56,16 32,50 48,50 42,84 74,46 54,46" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round" />
        
        <text x="50" y="92" fontSize="7.5" fontWeight="900" textAnchor="middle" fill="#CA8A04" letterSpacing="0.5">
          POWER DISCO
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 7. GOVERNMENT & IMMIGRATION SERVICES (Nigeria Immigration Service)
// =====================================================================

/**
 * Authentic Nigeria Immigration Service (NIS) Passport Booklet Logo
 */
export function GovPassportIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="2.5" />
        
        {/* Green Passport Booklet */}
        <rect x="28" y="18" width="44" height="64" rx="4" fill="#008751" />
        
        {/* Gold Embossed Emblem */}
        <circle cx="50" cy="48" r="11" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
        <polygon points="50,42 52,47 57,47 53,50 55,55 50,52 45,55 47,50 43,47 48,47" fill="#F59E0B" />
        
        <text x="50" y="32" fontSize="5" fontWeight="900" textAnchor="middle" fill="#F59E0B" letterSpacing="0.8">
          PASSPORT
        </text>
        <text x="50" y="72" fontSize="4.8" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.5">
          NIGERIA
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 8. BANKING & CBN RESOLUTION
// =====================================================================

/**
 * Authentic Central Bank of Nigeria (CBN) / Bank Account Resolution Logo
 */
export function CbnLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#0F2D5C" fillOpacity="0.08" stroke="#0F2D5C" strokeWidth="3" />
        <circle cx="50" cy="50" r="39" stroke="#0F2D5C" strokeWidth="1.2" strokeDasharray="3 2" />
        
        {/* Three Banking Pillars */}
        <rect x="34" y="38" width="7" height="26" rx="1" fill="#0F2D5C" />
        <rect x="46.5" y="32" width="7" height="32" rx="1" fill="#0F2D5C" />
        <rect x="59" y="38" width="7" height="26" rx="1" fill="#0F2D5C" />
        
        {/* Pediment Roof */}
        <polygon points="50,20 28,34 72,34" fill="#0F2D5C" />

        <text x="50" y="80" fontSize="14" fontWeight="900" textAnchor="middle" fill="#0F2D5C" letterSpacing="1">
          CBN
        </text>
        <text x="50" y="89" fontSize="6" fontWeight="800" textAnchor="middle" fill="#0F2D5C" opacity="0.8" letterSpacing="0.4">
          BANK RESOLVE
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 9. ICT & SOFTWARE ARCHITECTURE
// =====================================================================

/**
 * Authentic ICT Portal & Web Architecture Logo
 */
export function IctPortalIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-indigo-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#4F46E5" fillOpacity="0.08" stroke="#4F46E5" strokeWidth="2" />
        
        {/* Browser Window Layout */}
        <rect x="22" y="24" width="56" height="46" rx="4" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
        <rect x="22" y="24" width="56" height="12" rx="4" fill="#4F46E5" />
        <circle cx="28" cy="30" r="2" fill="#FFFFFF" />
        <circle cx="34" cy="30" r="2" fill="#FFFFFF" />
        <circle cx="40" cy="30" r="2" fill="#FFFFFF" />
        
        {/* Code brackets */}
        <path d="M42 46 L36 52 L42 58" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M58 46 L64 52 L58 58" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="52" y1="44" x2="48" y2="60" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />

        <text x="50" y="87" fontSize="7" fontWeight="900" textAnchor="middle" fill="#4F46E5" letterSpacing="0.5">
          ICT & WEB SYSTEMS
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// 10. FRSC & INEC LOGOS
// =====================================================================

/**
 * Authentic Federal Road Safety Corps (FRSC Driver's License) Logo
 */
export function FrscLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-red-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#DC2626" fillOpacity="0.08" stroke="#DC2626" strokeWidth="3" />
        <circle cx="50" cy="50" r="39" stroke="#DC2626" strokeWidth="1" strokeDasharray="3 2" />

        {/* Steering Wheel / Road Safety Star */}
        <circle cx="50" cy="42" r="16" stroke="#DC2626" strokeWidth="3" fill="#FFFFFF" />
        <circle cx="50" cy="42" r="4" fill="#DC2626" />
        <line x1="50" y1="26" x2="50" y2="38" stroke="#DC2626" strokeWidth="3" />
        <line x1="36" y1="50" x2="47" y2="44" stroke="#DC2626" strokeWidth="3" />
        <line x1="64" y1="50" x2="53" y2="44" stroke="#DC2626" strokeWidth="3" />

        <text x="50" y="76" fontSize="15" fontWeight="900" textAnchor="middle" fill="#DC2626" letterSpacing="1">
          FRSC
        </text>
        <text x="50" y="87" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="#0A192F" letterSpacing="0.4">
          DRIVER'S LICENSE
        </text>
      </svg>
    </div>
  );
}

/**
 * Authentic Independent National Electoral Commission (INEC Voter's Card) Logo
 */
export function InecLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
        
        {/* Ballot Box & Ballot */}
        <rect x="30" y="34" width="40" height="30" rx="3" fill="#008751" stroke="#008751" strokeWidth="2" />
        <rect x="38" y="24" width="24" height="14" rx="2" fill="#FFFFFF" stroke="#008751" strokeWidth="2" />
        <path d="M44 30 L48 34 L56 26" stroke="#008751" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <text x="50" y="78" fontSize="15" fontWeight="900" textAnchor="middle" fill="#008751" letterSpacing="1">
          INEC
        </text>
        <text x="50" y="88" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.85" letterSpacing="0.4">
          VOTER'S CARD
        </text>
      </svg>
    </div>
  );
}

// =====================================================================
// Centralized Service Icon Resolver
// =====================================================================
export function getRealServiceIcon(serviceId: string, className = "h-14 w-14") {
  const sid = (serviceId || "").toLowerCase();

  // 1. Specific NIMC & Identity Services
  if (sid === "id_nin_demography") return <NinDemographyIcon className={className} />;
  if (sid === "id_nin_ver") return <NinVerificationIcon className={className} />;
  if (sid === "id_nin_phone") return <NinPhoneIcon className={className} />;
  if (sid === "id_nin_val") return <NinValidationIcon className={className} />;
  if (sid === "id_slip_gen") return <NinSlipGenIcon className={className} />;
  if (sid === "id_vnin_slip") return <VninSlipIcon className={className} />;
  if (sid === "id_nin_pers") return <NinPersonalizationIcon className={className} />;
  if (sid === "id_nin_mod") return <NinModificationIcon className={className} />;
  if (sid === "id_ipe_clearance") return <NinIpeClearanceIcon className={className} />;

  // 2. Specific NIBSS & Banking Services
  if (sid === "id_bvn_ver") return <BvnVerificationIcon className={className} />;
  if (sid === "id_vnin_to_nibss" || sid === "id_vnin_to_bvn" || sid === "id_nin_bvn") {
    return <VninToNibssIcon className={className} />;
  }
  if (sid === "id_bvn_user") return <BvnUserIcon className={className} />;
  if (sid === "id_bvn_modification") return <BvnModificationIcon className={className} />;
  if (sid === "id_premium_slip") return <BvnSlipPrintIcon className={className} />;
  if (sid === "id_bvn_retrieval") return <BvnRetrievalIcon className={className} />;
  if (sid === "id_bank_account_verification" || sid.includes("bank_account") || sid.includes("nuban")) {
    return <CbnLogo className={className} />;
  }

  // 3. CAC Registrations & Tax ID
  if (sid === "cac_scuml" || sid.includes("scuml") || sid.includes("efcc")) return <ScumlOfficialLogo className={className} />;
  if (sid.includes("cac")) return <CacOfficialLogo className={className} />;
  if (sid.includes("tax") || sid.includes("tin") || sid.includes("nrs") || sid.includes("firs")) return <NrsOfficialLogo className={className} />;

  // 4. Education Examinations
  if (sid.includes("waec")) return <WaecLogo className={className} />;
  if (sid.includes("neco")) return <NecoLogo className={className} />;
  if (sid.includes("jamb")) return <JambLogo className={className} />;

  // 5. VTU & Utilities
  if (sid.includes("airtime")) return <VtuAirtimeIcon className={className} />;
  if (sid.includes("data")) return <VtuDataIcon className={className} />;
  if (sid.includes("electricity") || sid.includes("power")) return <VtuElectricityIcon className={className} />;
  if (sid.includes("passport") || sid.includes("gov") || sid.includes("immigrat")) return <GovPassportIcon className={className} />;
  if (sid.includes("website") || sid.includes("ict")) return <IctPortalIcon className={className} />;

  // 6. Driver's License & Voter's Card
  if (sid.includes("driver") || sid.includes("frsc")) return <FrscLogo className={className} />;
  if (sid.includes("voter") || sid.includes("inec") || sid.includes("vin")) return <InecLogo className={className} />;

  // Fallback based on keywords
  if (sid.includes("nin")) return <NimcOfficialLogo className={className} />;
  if (sid.includes("bvn")) return <NibssOfficialLogo className={className} />;

  return <NimcOfficialLogo className={className} />;
}
