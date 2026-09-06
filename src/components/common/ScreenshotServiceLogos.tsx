import React from "react";

// =====================================================================
// AUTHENTIC HIGH-FIDELITY VECTOR LOGOS MATCHING THE USER'S SCREENSHOTS
// =====================================================================

/**
 * Official NIMC Logo (National Identity Management Commission)
 * Used for all 7 Identity Verification services in Screenshot 1
 */
export const NimcOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stylized Green Head/Human Figures */}
    <g fill="#008751">
      {/* Left head and body arch */}
      <circle cx="38" cy="24" r="5.5" />
      <path d="M30 42 C30 33 46 33 46 42 L46 45 C46 45 30 45 30 45 Z" />
      
      {/* Right head and body arch */}
      <circle cx="62" cy="24" r="5.5" />
      <path d="M54 42 C54 33 70 33 70 42 L70 45 C70 45 54 45 54 45 Z" />
      
      {/* Central connective biometric aura */}
      <path d="M42 22 C46 18 54 18 58 22" stroke="#008751" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Authentic 'nimc' typography in official NIMC green */}
    <text
      x="50"
      y="66"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontWeight="900"
      fontSize="21"
      fill="#008751"
      letterSpacing="-0.8"
    >
      nimc
    </text>

    {/* Yellow/gold dot accent on the 'i' */}
    <circle cx="43" cy="53.5" r="2.2" fill="#EAB308" />

    {/* Triple Nigerian base curves / waves */}
    <path d="M22 74 C34 78 66 78 78 74" stroke="#008751" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M28 80 C38 83 62 83 72 80" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M34 85 C42 87 58 87 66 85" stroke="#008751" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Official NIBSS Logo (Nigeria Inter-Bank Settlement System Plc)
 * Used for all 6 Banking & BVN services in Screenshot 2
 */
export const NibssOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-11 h-9"
}) => (
  <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark Navy / Deep Slate background banner with soft rounded corners */}
    <rect x="2" y="8" width="96" height="64" rx="10" fill="#0A192F" />
    
    {/* Golden yellow central emblem badge */}
    <circle cx="26" cy="38" r="13" fill="#F59E0B" fillOpacity="0.2" />
    <circle cx="26" cy="38" r="9" fill="#F59E0B" />
    
    {/* Dynamic white accent arc */}
    <path d="M21 38 A5 5 0 0 1 31 38" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

    {/* Speed bars representing instant settlement */}
    <rect x="42" y="24" width="48" height="4" rx="2" fill="#38BDF8" opacity="0.85" />
    
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
      fontSize="4.5"
      fill="#94A3B8"
      letterSpacing="0.4"
    >
      SETTLEMENT SYSTEM
    </text>
  </svg>
);

/**
 * Official CAC Logo (Corporate Affairs Commission Nigeria)
 * Used for CAC Registration in Screenshot 2 & 3
 */
export const CacOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Green Circular Seal */}
    <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
    <circle cx="50" cy="50" r="39" stroke="#008751" strokeWidth="1" strokeDasharray="3 2" />

    {/* Nigerian Coat of Arms representation in the center */}
    {/* Red Eagle */}
    <polygon points="50,18 46,24 54,24" fill="#DC2626" />
    <path d="M44 22 C47 20 53 20 56 22" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />

    {/* Central Shield with Silver/White 'Y' (Niger & Benue Rivers) */}
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
);

/**
 * Official NRS Logo (Nigeria Revenue Service / Tax ID Search)
 * Used for Tax ID Search in Screenshot 3
 */
export const NrsOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White / Soft Slate Square Container with rounded borders */}
    <rect x="8" y="8" width="84" height="84" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    
    {/* Deep Blue Header Band */}
    <rect x="14" y="14" width="72" height="26" rx="8" fill="#0F2D5C" />
    
    {/* Red geometric accent line */}
    <rect x="14" y="42" width="72" height="4" fill="#DC2626" />
    
    {/* NRS Wordmark inside header */}
    <text
      x="50"
      y="32"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="16"
      fill="#FFFFFF"
      letterSpacing="2"
    >
      NRS
    </text>

    {/* Tax Search & Verification Icon representation */}
    <circle cx="50" cy="64" r="14" fill="#F1F5F9" stroke="#0F2D5C" strokeWidth="2.5" />
    <path d="M45 64 L48 68 L56 59" stroke="#008751" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="60" y1="74" x2="68" y2="82" stroke="#0F2D5C" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

/**
 * Official JAMB Logo (Joint Admissions and Matriculation Board)
 * Used for JAMB Services in Screenshot 3
 */
export const JambOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Official JAMB Green Circular Seal */}
    <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
    <circle cx="50" cy="50" r="40" stroke="#008751" strokeWidth="1" strokeDasharray="3 2" />

    {/* Central Golden Open Book of Education */}
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
);

/**
 * Official Exam Pins Logo (WAEC / NECO / NABTEB examination seals)
 * Used for Exam Pins in Screenshot 3
 */
export const ExamPinsOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circular emblem with green border */}
    <circle cx="50" cy="50" r="46" fill="#008751" fillOpacity="0.08" stroke="#008751" strokeWidth="3" />
    
    {/* Scratch card / Voucher token graphic */}
    <rect x="22" y="24" width="56" height="34" rx="5" fill="#FFFFFF" stroke="#008751" strokeWidth="2" />
    <rect x="27" y="32" width="46" height="8" rx="2" fill="#E2E8F0" />
    
    {/* PIN Star dots */}
    <text x="50" y="38.5" textAnchor="middle" fontSize="10" fill="#008751" fontWeight="900" letterSpacing="2">
      •••• ••••
    </text>
    
    {/* Padlock / Security token key badge */}
    <circle cx="50" cy="50" r="6" fill="#F59E0B" />
    <path d="M47 48 H53 V53 H47 Z" fill="#FFFFFF" />

    {/* EXAM PINS Text */}
    <text
      x="50"
      y="77"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="14"
      fill="#008751"
      letterSpacing="0.8"
    >
      EXAM
    </text>
    <text
      x="50"
      y="87"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="800"
      fontSize="7"
      fill="#008751"
      opacity="0.85"
      letterSpacing="0.6"
    >
      PINS & CARDS
    </text>
  </svg>
);

/**
 * Official Airtime Logo (Buy Airtime)
 * Used for Buy Airtime in Screenshot 3
 */
export const AirtimeOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rounded Container */}
    <rect x="10" y="10" width="80" height="80" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    
    {/* Signal broadcast antenna waves */}
    <circle cx="50" cy="38" r="4" fill="#DC2626" />
    <path d="M42 34 C39 36 39 40 42 42" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M58 34 C61 36 61 40 58 42" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 30 C31 34 31 42 36 46" stroke="#0A192F" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 30 C69 34 69 42 64 46" stroke="#0A192F" strokeWidth="2" strokeLinecap="round" />

    {/* Authentic Airtime typography */}
    <g transform="translate(18, 62)">
      <text
        x="0"
        y="12"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="17"
        fill="#DC2626"
        letterSpacing="-0.5"
      >
        Air
      </text>
      <text
        x="28"
        y="12"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="17"
        fill="#0A192F"
        letterSpacing="-0.5"
      >
        time
      </text>
    </g>
  </svg>
);

/**
 * Official Data Bundles Logo (⇅ Data Bundles)
 * Used for Data Bundles in Screenshot 3
 */
export const DataBundlesOfficialCardLogo: React.FC<{ className?: string }> = ({
  className = "w-10 h-10"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rounded Container */}
    <rect x="10" y="10" width="80" height="80" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />

    {/* Circular accent behind arrows */}
    <circle cx="50" cy="50" r="30" fill="#F8FAFC" />

    {/* Left Arrow Pointing Up (↑) in Black/Slate */}
    <path
      d="M38 65 L38 35 M38 35 L28 45 M38 35 L48 45"
      stroke="#0A192F"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Right Arrow Pointing Down (↓) in Black/Slate */}
    <path
      d="M62 35 L62 65 M62 65 L52 55 M62 65 L72 55"
      stroke="#0A192F"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Friendly Customer Support Agent Avatar
 * Matching the exact visual in bottom-right of Screenshots 1, 2, & 3
 */
export const SupportAgentAvatarSvg: React.FC<{ className?: string }> = ({
  className = "w-full h-full"
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circular gradient */}
    <circle cx="50" cy="50" r="50" fill="#EEF2F6" />
    
    {/* Soft pink/salmon collar shirt */}
    <path d="M22 100 C22 75 35 68 50 68 C65 68 78 75 78 100 Z" fill="#F472B6" />
    <path d="M42 68 L50 82 L58 68 Z" fill="#FFFFFF" opacity="0.9" />

    {/* Neck */}
    <rect x="44" y="58" width="12" height="14" rx="4" fill="#FCD34D" />

    {/* Head & Face */}
    <ellipse cx="50" cy="46" rx="19" ry="21" fill="#FCD34D" />

    {/* Silver / Blonde Hair */}
    <path
      d="M30 44 C28 26 40 18 50 18 C60 18 72 26 70 44 C72 40 73 34 70 28 C66 18 56 15 50 15 C44 15 34 18 30 28 C27 34 28 40 30 44 Z"
      fill="#CBD5E1"
    />
    <path
      d="M31 36 C35 25 45 23 50 23 C58 23 66 26 69 36 C66 28 58 25 50 25 C42 25 34 28 31 36 Z"
      fill="#E2E8F0"
    />

    {/* Cute glasses */}
    <circle cx="41" cy="45" r="7" stroke="#1E293B" strokeWidth="2.2" fill="none" />
    <circle cx="59" cy="45" r="7" stroke="#1E293B" strokeWidth="2.2" fill="none" />
    <line x1="48" y1="45" x2="52" y2="45" stroke="#1E293B" strokeWidth="2.2" />

    {/* Eyes */}
    <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
    <circle cx="59" cy="45" r="2.5" fill="#1E293B" />
    <circle cx="42" cy="44" r="0.8" fill="#FFFFFF" />
    <circle cx="60" cy="44" r="0.8" fill="#FFFFFF" />

    {/* Friendly Smile */}
    <path d="M44 56 Q50 61 56 56" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Rosy Cheeks */}
    <circle cx="34" cy="51" r="3" fill="#FB7185" opacity="0.4" />
    <circle cx="66" cy="51" r="3" fill="#FB7185" opacity="0.4" />
  </svg>
);

/**
 * Official WhatsApp Vector Icon
 */
export const WhatsAppOfficialLogo: React.FC<{ className?: string }> = ({
  className = "w-full h-full"
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

/**
 * WhatsApp Floating Action Button contacting 08085490982
 */
export const FloatingHelpWidget: React.FC = () => {
  const phoneNumber = "08085490982";
  const internationalNumber = "2348085490982";
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=Hello%20Support%2C%20I%20need%20assistance.`;

  return (
    <aside id="whatsapp-floating-widget" aria-label="WhatsApp Support Help Desk" className="fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-50 flex flex-col items-center select-none pointer-events-auto">
      {/* Speech Bubble Tooltip */}
      <div className="relative mb-2 filter drop-shadow-md animate-bounce" style={{ animationDuration: "2.5s" }} aria-hidden="true">
        <div className="bg-[#111827] text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>Chat on WhatsApp</span>
        </div>
        {/* Downward triangle notch pointing to button */}
        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[5px] border-t-[#111827] mx-auto"></div>
      </div>

      {/* WhatsApp Circular Floating Button */}
      <a
        id="whatsapp-chat-button"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 group touch-manipulation"
        title={`Chat on WhatsApp (${phoneNumber})`}
        aria-label={`Contact support on WhatsApp at ${phoneNumber}`}
      >
        {/* Pulsing ring */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366]/35 animate-ping opacity-75 group-hover:opacity-100"
          style={{ animationDuration: "2.5s" }}
          aria-hidden="true"
        ></span>

        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-[0_6px_24px_rgba(37,211,102,0.5)] ring-4 ring-white transition-all duration-200">
          <WhatsAppOfficialLogo className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
        </div>
      </a>
    </aside>
  );
};
