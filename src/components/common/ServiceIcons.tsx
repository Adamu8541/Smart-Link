import React from "react";

interface IconProps {
  className?: string;
}

// -------------------------------------------------------------
// 1. NIMC & IDENTITY SERVICES (Official Nigerian Green #008751)
// -------------------------------------------------------------

// NIN Demography - White card with NIMC Green text and demographic profile badge
export function NinDemographyIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        {/* Outer subtle circular seal */}
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" strokeDasharray="4 2" />
        
        {/* Demographic ID card miniature layout */}
        <rect x="22" y="24" width="56" height="34" rx="4" fill="#FFFFFF" stroke="#008751" strokeWidth="2.5" />
        <rect x="27" y="30" width="14" height="18" rx="2" fill="#008751" fillOpacity="0.15" stroke="#008751" strokeWidth="1.2" />
        {/* Person silhouette in miniature photo */}
        <circle cx="34" cy="36" r="3.5" fill="#008751" />
        <path d="M29 46 C29 42 39 42 39 46 Z" fill="#008751" />
        {/* Bio-data lines */}
        <line x1="46" y1="32" x2="72" y2="32" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="38" x2="68" y2="38" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="46" y1="44" x2="62" y2="44" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        
        {/* Official NIMC text in exact green typography */}
        <text x="50" y="76" fontSize="14" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIMC
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.4">
          DEMOGRAPHY
        </text>
      </svg>
    </div>
  );
}

// NIN Verification - White card with NIMC Green logo and verified shield checkmark
export function NinVerificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2.5" />
        
        {/* Shield icon */}
        <path d="M50 20 L68 28 V46 C68 58 50 68 50 68 C50 68 32 58 32 46 V28 Z" fill="#008751" fillOpacity="0.12" stroke="#008751" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Checkmark inside shield */}
        <path d="M42 42 L47 47 L58 36" stroke="#008751" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* NIMC Text */}
        <text x="50" y="82" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="91" fontSize="7" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.75" letterSpacing="0.3">
          VERIFIED
        </text>
      </svg>
    </div>
  );
}

// NIN Phone Number Lookup - White card with NIMC Green logo + Smartphone / SIM lookup
export function NinPhoneIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Phone Device */}
        <rect x="36" y="18" width="28" height="42" rx="4" fill="#FFFFFF" stroke="#008751" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="2.5" fill="#008751" />
        <line x1="44" y1="23" x2="56" y2="23" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Signal / lookup waves */}
        <path d="M28 32 C26 36 26 42 28 46" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <path d="M72 32 C74 36 74 42 72 46" stroke="#008751" strokeWidth="2" strokeLinecap="round" />

        {/* NIMC Text */}
        <text x="50" y="76" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.4">
          PHONE LOOKUP
        </text>
      </svg>
    </div>
  );
}

// NIN Validation - White card with NIMC Green logo + Validated seal
export function NinValidationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" />
        
        {/* Validation badge ribbon */}
        <circle cx="50" cy="38" r="18" fill="#008751" fillOpacity="0.12" stroke="#008751" strokeWidth="2.5" />
        <path d="M42 38 L47 43 L58 32" stroke="#008751" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 52 L36 64 L50 58 L64 64 L60 52" fill="#008751" fillOpacity="0.2" stroke="#008751" strokeWidth="2" strokeLinejoin="round" />

        {/* NIMC Text */}
        <text x="50" y="78" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="89" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.3">
          VALIDATION
        </text>
      </svg>
    </div>
  );
}

// NIN Slip Generation - White card with NIMC Green logo + National Slip Document with QR
export function NinSlipGenIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" />
        
        {/* Slip Document */}
        <rect x="26" y="18" width="48" height="42" rx="3" fill="#FFFFFF" stroke="#008751" strokeWidth="2.5" />
        <rect x="30" y="22" width="40" height="6" fill="#008751" rx="1" />
        {/* QR Code symbol */}
        <rect x="32" y="32" width="14" height="14" fill="#008751" fillOpacity="0.2" stroke="#008751" strokeWidth="1.5" />
        <rect x="36" y="36" width="6" height="6" fill="#008751" />
        {/* Barcode lines */}
        <line x1="50" y1="33" x2="68" y2="33" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="50" y1="38" x2="66" y2="38" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="50" y1="43" x2="64" y2="43" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />

        {/* NIMC Text */}
        <text x="50" y="76" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.4">
          SLIP PRINT
        </text>
      </svg>
    </div>
  );
}

// VNIN Slip - White card with NIMC Green logo + Virtual NIN 16-digit Badge
export function VninSlipIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2.5" />
        
        {/* Virtual VNIN Card */}
        <rect x="20" y="24" width="60" height="34" rx="4" fill="#008751" fillOpacity="0.1" stroke="#008751" strokeWidth="2.5" />
        <text x="50" y="40" fontSize="10" fontWeight="900" textAnchor="middle" fill="#008751" letterSpacing="1">
          V - N I N
        </text>
        <rect x="28" y="44" width="44" height="7" rx="2" fill="#008751" />
        <text x="50" y="50" fontSize="5.5" fontWeight="800" textAnchor="middle" fill="#FFFFFF" letterSpacing="1.5">
          •••• •••• ••••
        </text>

        {/* NIMC Text */}
        <text x="50" y="76" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.4">
          VIRTUAL SLIP
        </text>
      </svg>
    </div>
  );
}

// NIN Personalization - White card with NIMC Green logo + Biometric Portrait & Smartchip
export function NinPersonalizationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" />
        
        {/* Smartcard layout */}
        <rect x="22" y="22" width="56" height="38" rx="4" fill="#FFFFFF" stroke="#008751" strokeWidth="2.5" />
        {/* Gold smartchip */}
        <rect x="28" y="32" width="12" height="10" rx="1.5" fill="#D97706" fillOpacity="0.3" stroke="#D97706" strokeWidth="1.2" />
        {/* User Portrait */}
        <circle cx="62" cy="34" r="5" fill="#008751" />
        <path d="M54 48 C54 42 70 42 70 48 Z" fill="#008751" />

        {/* NIMC Text */}
        <text x="50" y="77" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="89" fontSize="7" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.3">
          PERSONALIZATION
        </text>
      </svg>
    </div>
  );
}

// NIN Modification - White card with NIMC Green logo + Modification Edit Pencil
export function NinModificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Document with edit pencil */}
        <rect x="26" y="20" width="34" height="42" rx="3" fill="#FFFFFF" stroke="#008751" strokeWidth="2.2" />
        <line x1="32" y1="28" x2="52" y2="28" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="34" x2="48" y2="34" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="40" x2="44" y2="40" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Pencil */}
        <path d="M52 46 L70 28 C72 26 75 26 77 28 C79 30 79 33 77 35 L59 53 L50 55 Z" fill="#008751" fillOpacity="0.25" stroke="#008751" strokeWidth="2" strokeLinejoin="round" />

        {/* NIMC Text */}
        <text x="50" y="78" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="89" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.3">
          MODIFICATION
        </text>
      </svg>
    </div>
  );
}

// IPE Clearance - White card with NIMC Green logo + Biometric Fingerprint Clearance Stamp
export function NinIpeClearanceIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.06" stroke="#008751" strokeWidth="2.5" />
        
        {/* Fingerprint ridges */}
        <path d="M50 20 C40 20 34 26 34 35 C34 46 40 55 40 60" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 26 C44 26 40 30 40 36 C40 46 46 54 46 60" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 32 C48 32 46 34 46 38 C46 44 50 50 50 58" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 26 C60 28 64 33 64 40 C64 48 58 56 56 60" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
        
        {/* Verified stamp banner */}
        <rect x="22" y="44" width="56" height="16" rx="3" fill="#008751" />
        <text x="50" y="55" fontSize="8.5" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="1">
          IPE CLEAR
        </text>

        {/* NIMC Text */}
        <text x="50" y="78" fontSize="13" fontWeight="900" textAnchor="middle" fill="#008751" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIMC
        </text>
        <text x="50" y="89" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#008751" opacity="0.8" letterSpacing="0.4">
          BIOMETRIC IPE
        </text>
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// 2. NIBSS & BANKING SERVICES (Official NIBSS Blue #00529B & Teal #00A3E0)
// -------------------------------------------------------------

// BVN Verification - White card with NIBSS deep blue logo + verified checkmark
export function BvnVerificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2.5" />
        
        {/* Dynamic NIBSS Swoop */}
        <path d="M22 36 C35 25 65 25 78 36 L70 42 C60 33 40 33 30 42 Z" fill="#00A3E0" />
        
        {/* Shield with check */}
        <circle cx="50" cy="40" r="14" fill="#00529B" fillOpacity="0.12" stroke="#00529B" strokeWidth="2" />
        <path d="M44 40 L48 44 L57 35" stroke="#00529B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Official NIBSS typography */}
        <text x="50" y="76" fontSize="14" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIBSS
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.4">
          BVN VERIFY
        </text>
      </svg>
    </div>
  );
}

// VNIN to NIBSS - White card with dual NIMC Green to NIBSS Blue Bridge
export function VninToNibssIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2" />
        
        {/* Left NIMC Badge */}
        <rect x="18" y="24" width="28" height="22" rx="3" fill="#008751" />
        <text x="32" y="38" fontSize="7" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.5">
          VNIN
        </text>
        
        {/* Sync / Bridge Arrow */}
        <path d="M48 32 L53 35 L48 38" stroke="#00A3E0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="44" y1="35" x2="52" y2="35" stroke="#00A3E0" strokeWidth="3" strokeLinecap="round" />
        
        {/* Right NIBSS Badge */}
        <rect x="54" y="24" width="28" height="22" rx="3" fill="#00529B" />
        <text x="68" y="38" fontSize="7" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.5">
          NIBSS
        </text>

        {/* NIBSS Text */}
        <text x="50" y="74" fontSize="13" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NIBSS
        </text>
        <text x="50" y="86" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.4">
          VNIN ➔ BVN LINK
        </text>
      </svg>
    </div>
  );
}

// BVN User Lookup - White card with NIBSS logo + user bio-data portrait
export function BvnUserIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* User Card Silhouette */}
        <circle cx="50" cy="30" r="10" fill="#00529B" fillOpacity="0.15" stroke="#00529B" strokeWidth="2" />
        <path d="M34 54 C34 44 66 44 66 54" stroke="#00529B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 46 C35 38 65 38 78 46" stroke="#00A3E0" strokeWidth="2" />

        {/* NIBSS Text */}
        <text x="50" y="76" fontSize="14" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIBSS
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.4">
          BVN USER
        </text>
      </svg>
    </div>
  );
}

// BVN Modification - White card with NIBSS logo + Correction Pen
export function BvnModificationIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2" />
        
        {/* Bank card with edit pen */}
        <rect x="24" y="22" width="40" height="28" rx="3" fill="#FFFFFF" stroke="#00529B" strokeWidth="2.2" />
        <line x1="28" y1="30" x2="60" y2="30" stroke="#00529B" strokeWidth="2" />
        <line x1="30" y1="40" x2="48" y2="40" stroke="#00A3E0" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Edit Pen */}
        <path d="M54 38 L72 20 C74 18 77 18 79 20 C81 22 81 25 79 27 L61 45 L52 47 Z" fill="#00529B" fillOpacity="0.25" stroke="#00529B" strokeWidth="2" strokeLinejoin="round" />

        {/* NIBSS Text */}
        <text x="50" y="76" fontSize="14" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIBSS
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.3">
          BVN MODIFICATION
        </text>
      </svg>
    </div>
  );
}

// BVN Slip Print - White card with NIBSS logo + Premium Bank Card / Slip
export function BvnSlipPrintIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2.5" />
        
        {/* Premium Card Print */}
        <rect x="22" y="20" width="56" height="36" rx="4" fill="#00529B" fillOpacity="0.12" stroke="#00529B" strokeWidth="2.5" />
        <rect x="28" y="28" width="12" height="8" rx="1.5" fill="#D97706" fillOpacity="0.4" stroke="#D97706" strokeWidth="1" />
        <text x="64" y="35" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#00529B">
          BVN
        </text>
        <line x1="28" y1="44" x2="68" y2="44" stroke="#00A3E0" strokeWidth="1.8" strokeLinecap="round" />

        {/* NIBSS Text */}
        <text x="50" y="76" fontSize="14" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIBSS
        </text>
        <text x="50" y="88" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.4">
          SLIP PRINT
        </text>
      </svg>
    </div>
  );
}

// BVN Retrieval - White card with NIBSS logo + Search Magnifying Glass
export function BvnRetrievalIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#00529B" fillOpacity="0.06" stroke="#00529B" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Magnifying glass over card */}
        <circle cx="45" cy="35" r="16" fill="#FFFFFF" stroke="#00529B" strokeWidth="3" />
        <line x1="56" y1="46" x2="72" y2="60" stroke="#00529B" strokeWidth="4" strokeLinecap="round" />
        <text x="45" y="39" fontSize="9" fontWeight="900" textAnchor="middle" fill="#00A3E0">
          BVN
        </text>

        {/* NIBSS Text */}
        <text x="50" y="78" fontSize="14" fontWeight="900" textAnchor="middle" fill="#00529B" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">
          NIBSS
        </text>
        <text x="50" y="89" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#00529B" opacity="0.85" letterSpacing="0.4">
          RETRIEVAL
        </text>
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// 3. CORPORATE AFFAIRS & TAX (CAC Forest Green #006837 & NRS Crimson #DC2626)
// -------------------------------------------------------------

// CAC Registration - White card with official CAC Green #006837 & Gold #D97706 Seal
export function CacRegistrationLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" stroke="#006837" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="33" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="24" fill="#006837" />
        <text x="50" y="55" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          CAC
        </text>
        <circle cx="50" cy="18" r="2.5" fill="#D97706" />
      </svg>
    </div>
  );
}

// Tax ID Search NRS / FIRS - White card with official Crimson Red #DC2626
export function TaxIdSearchLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-red-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="38" fill="#DC2626" fillOpacity="0.08" stroke="#DC2626" strokeWidth="2.5" />
        <rect x="25" y="62" width="50" height="4" rx="2" fill="#DC2626" />
        <text x="50" y="53" fontSize="16" fontWeight="900" textAnchor="middle" fill="#DC2626" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">
          NRS
        </text>
        <circle cx="50" cy="22" r="3" fill="#DC2626" />
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// 4. EDUCATION EXAMINATIONS (WAEC Royal Blue, NECO Green, JAMB Forest)
// -------------------------------------------------------------

// WAEC Official Logo - Royal Blue #1E40AF & Golden Yellow #F59E0B
export function WaecLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="38" fill="#1E40AF" fillOpacity="0.08" stroke="#1E40AF" strokeWidth="2.5" />
        <path d="M50,18 L60,26 L72,24 L76,36 L88,40 L84,52 L90,62 L80,70 L80,82 L68,82 L60,90 L50,84 L40,90 L32,82 L20,82 L20,70 L10,62 L16,52 L12,40 L24,36 L28,24 L40,26 Z" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1" />
        <text x="50" y="55" fontSize="13" fontWeight="900" textAnchor="middle" fill="#1E40AF" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.4">
          WAEC
        </text>
      </svg>
    </div>
  );
}

// NECO Official Logo - Emerald Green #059669 & Golden Yellow #EAB308
export function NecoLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="38" fill="#059669" fillOpacity="0.08" stroke="#059669" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="30" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x="50" y="55" fontSize="14" fontWeight="900" textAnchor="middle" fill="#059669" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          NECO
        </text>
        <circle cx="50" cy="22" r="3" fill="#EAB308" />
      </svg>
    </div>
  );
}

// JAMB Official Logo - Forest Green #047857 & Amber Gold #D97706
export function JambLogo({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="38" fill="#047857" fillOpacity="0.08" stroke="#047857" strokeWidth="2.5" />
        <polygon points="50,22 58,38 75,40 62,52 66,70 50,60 34,70 38,52 25,40 42,38" fill="#D97706" fillOpacity="0.2" stroke="#D97706" strokeWidth="1" />
        <text x="50" y="55" fontSize="14" fontWeight="900" textAnchor="middle" fill="#047857" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">
          JAMB
        </text>
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// 5. VTU, UTILITIES & GOVERNMENT SERVICES
// -------------------------------------------------------------

// VTU Airtime - 4 Telecoms Network Emblem (MTN, Airtel, Glo, 9mobile)
export function VtuAirtimeIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-amber-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#FDB913" fillOpacity="0.08" stroke="#FDB913" strokeWidth="2" />
        
        {/* 4 Telecom quadrants */}
        <circle cx="36" cy="36" r="12" fill="#FDB913" /> {/* MTN Yellow */}
        <text x="36" y="39" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#000000">MTN</text>
        
        <circle cx="64" cy="36" r="12" fill="#E60000" /> {/* Airtel Red */}
        <text x="64" y="39" fontSize="6" fontWeight="900" textAnchor="middle" fill="#FFFFFF">AIRTEL</text>
        
        <circle cx="36" cy="64" r="12" fill="#008234" /> {/* Glo Green */}
        <text x="36" y="67" fontSize="7" fontWeight="900" textAnchor="middle" fill="#FFFFFF">GLO</text>
        
        <circle cx="64" cy="64" r="12" fill="#8DC63F" /> {/* 9mobile Lime */}
        <text x="64" y="67" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#000000">9MOB</text>
      </svg>
    </div>
  );
}

// VTU Data Bundles - High Speed Data Streams
export function VtuDataIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-blue-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#2563EB" fillOpacity="0.08" stroke="#2563EB" strokeWidth="2" />
        
        {/* Signal bars */}
        <rect x="26" y="52" width="8" height="16" rx="2" fill="#2563EB" />
        <rect x="38" y="42" width="8" height="26" rx="2" fill="#2563EB" />
        <rect x="50" y="32" width="8" height="36" rx="2" fill="#2563EB" />
        <rect x="62" y="22" width="8" height="46" rx="2" fill="#2563EB" />
        
        <text x="50" y="86" fontSize="8" fontWeight="900" textAnchor="middle" fill="#2563EB" letterSpacing="0.5">
          DATA 4G/5G
        </text>
      </svg>
    </div>
  );
}

// Electricity Power Token - High Voltage Flash
export function VtuElectricityIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-yellow-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#EAB308" fillOpacity="0.1" stroke="#EAB308" strokeWidth="2.5" />
        
        {/* Lightning Bolt */}
        <polygon points="56,18 32,50 48,50 42,82 72,46 54,46" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round" />
        
        <text x="50" y="90" fontSize="7.5" fontWeight="900" textAnchor="middle" fill="#CA8A04" letterSpacing="0.5">
          PREPAID POWER
        </text>
      </svg>
    </div>
  );
}

// Government Passport / Immigration Icon
export function GovPassportIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-emerald-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="2" />
        
        {/* Passport Booklet */}
        <rect x="28" y="20" width="44" height="60" rx="4" fill="#008751" />
        <circle cx="50" cy="45" r="12" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
        <polygon points="50,38 52,43 57,43 53,46 55,51 50,48 45,51 47,46 43,43 48,43" fill="#F59E0B" />
        
        <text x="50" y="32" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#F59E0B" letterSpacing="0.8">
          PASSPORT
        </text>
        <text x="50" y="68" fontSize="5" fontWeight="900" textAnchor="middle" fill="#FFFFFF" letterSpacing="0.5">
          NIGERIA
        </text>
      </svg>
    </div>
  );
}

// Generic / ICT Portal Icon
export function IctPortalIcon({ className = "h-14 w-14" }: IconProps) {
  return (
    <div className={`${className} bg-white border border-indigo-100 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-xs hover:scale-105 transition-transform`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="42" fill="#4F46E5" fillOpacity="0.08" stroke="#4F46E5" strokeWidth="2" />
        
        {/* Browser Window */}
        <rect x="22" y="26" width="56" height="44" rx="4" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
        <rect x="22" y="26" width="56" height="12" rx="4" fill="#4F46E5" />
        <circle cx="28" cy="32" r="2" fill="#FFFFFF" />
        <circle cx="34" cy="32" r="2" fill="#FFFFFF" />
        <circle cx="40" cy="32" r="2" fill="#FFFFFF" />
        
        {/* Code brackets */}
        <path d="M42 46 L36 52 L42 58" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M58 46 L64 52 L58 58" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="52" y1="44" x2="48" y2="60" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// -------------------------------------------------------------
// Centralized Service Icon Resolver
// -------------------------------------------------------------
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

  // 3. CAC Registrations & Tax ID
  if (sid.includes("cac")) return <CacRegistrationLogo className={className} />;
  if (sid.includes("tax") || sid.includes("tin") || sid.includes("nrs")) return <TaxIdSearchLogo className={className} />;

  // 4. Education Examinations
  if (sid.includes("waec")) return <WaecLogo className={className} />;
  if (sid.includes("neco")) return <NecoLogo className={className} />;
  if (sid.includes("jamb")) return <JambLogo className={className} />;

  // 5. VTU & Utilities
  if (sid.includes("airtime")) return <VtuAirtimeIcon className={className} />;
  if (sid.includes("data")) return <VtuDataIcon className={className} />;
  if (sid.includes("electricity") || sid.includes("power")) return <VtuElectricityIcon className={className} />;
  if (sid.includes("passport") || sid.includes("gov")) return <GovPassportIcon className={className} />;
  if (sid.includes("website") || sid.includes("ict")) return <IctPortalIcon className={className} />;

  // Fallback based on keywords
  if (sid.includes("nin")) return <NinDemographyIcon className={className} />;
  if (sid.includes("bvn")) return <BvnVerificationIcon className={className} />;

  return <NinDemographyIcon className={className} />;
}
