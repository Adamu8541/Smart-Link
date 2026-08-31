import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Sparkles,
  Zap,
  Printer,
  CreditCard,
  FileText,
  Clock,
  Eye,
  Check,
  Layers,
} from "lucide-react";
import { SlipOptionConfig } from "../../../services/slipOptionsConfig";
import { SmartLinkLogoMark } from "../../ui/SmartLinkLogoMark";
import { NigerianCoatOfArmsSvg } from "./SlipSecurityAssets";

interface SlipLivePreviewCardProps {
  slipOption: SlipOptionConfig;
  userBalance: number;
  serviceType?: string;
  onSelectOption?: (option: SlipOptionConfig) => void;
  isSelected?: boolean;
}

export const BvnCardPreviewImage: React.FC = () => {
  const sources = [
    "/assets/BVN Card.jpg",
    "/BVN Card.jpg",
    "/assets/bvn_card.jpg",
    "/bvn_card.jpg",
    "/assets/premium.webp",
  ];
  const [srcIdx, setSrcIdx] = React.useState(0);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src={sources[srcIdx]}
        alt="BVN Card"
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
        onError={() => {
          if (srcIdx < sources.length - 1) {
            setSrcIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export const BvnSlip1PreviewImage: React.FC = () => {
  const sources = [
    "/assets/BVN Slip 1.png",
    "/BVN Slip 1.png",
    "/assets/bvn_slip_1.png",
    "/bvn_slip_1.png",
    "/assets/standard.png",
  ];
  const [srcIdx, setSrcIdx] = React.useState(0);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src={sources[srcIdx]}
        alt="BVN Slip 1"
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
        onError={() => {
          if (srcIdx < sources.length - 1) {
            setSrcIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export const BvnSlip2PreviewImage: React.FC = () => {
  const sources = [
    "/assets/BVN Slip 2.png",
    "/BVN Slip 2.png",
    "/assets/bvn_slip_2.png",
    "/bvn_slip_2.png",
    "/assets/regular.png",
  ];
  const [srcIdx, setSrcIdx] = React.useState(0);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src={sources[srcIdx]}
        alt="BVN Slip 2"
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
        onError={() => {
          if (srcIdx < sources.length - 1) {
            setSrcIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export const StandardSlipPreviewImage: React.FC = () => {
  const sources = [
    "/assets/standard.webp",
    "/assets/standard.png",
    "/assets/standard.jpg",
    "/assets/standard_slip.webp",
    "/assets/standard_slip.png",
    "/assets/standard_slip.jpg",
    "/standard.webp",
    "/standard.png",
    "/assets/regular.webp",
    "/assets/regular.png",
  ];
  const [srcIdx, setSrcIdx] = React.useState(0);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src={sources[srcIdx]}
        alt="Standard NIN Slip"
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
        onError={() => {
          if (srcIdx < sources.length - 1) {
            setSrcIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export const RegularSlipPreviewImage: React.FC = () => {
  const sources = [
    "/assets/regular.webp",
    "/assets/regular.png",
    "/assets/regular.jpg",
    "/assets/regular_slip.webp",
    "/assets/regular_slip.png",
    "/assets/regular_slip.jpg",
    "/regular.webp",
    "/regular.png",
    "/assets/standard.webp",
    "/assets/standard.png",
  ];
  const [srcIdx, setSrcIdx] = React.useState(0);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <img
        src={sources[srcIdx]}
        alt="Regular NIN Slip"
        className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
        onError={() => {
          if (srcIdx < sources.length - 1) {
            setSrcIdx((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export const SlipLivePreviewCard: React.FC<SlipLivePreviewCardProps> = ({
  slipOption,
  userBalance,
  serviceType = "NIN",
  onSelectOption,
  isSelected = true,
}) => {
  const isSufficientBalance = userBalance >= slipOption.price;
  const balanceAfter = Math.max(0, userBalance - slipOption.price);

  const isBvnCard =
    slipOption.id === "BVN_CARD" ||
    slipOption.name.toLowerCase().includes("bvn card") ||
    slipOption.name.toLowerCase().includes("bvn_card");

  const isBvnSlip1 =
    slipOption.id === "BVN_SLIP_1" ||
    slipOption.name.toLowerCase().includes("bvn slip 1");

  const isBvnSlip2 =
    slipOption.id === "BVN_SLIP_2" ||
    slipOption.name.toLowerCase().includes("bvn slip 2");

  if (isBvnCard) {
    return <BvnCardPreviewImage />;
  }

  if (isBvnSlip1) {
    return <BvnSlip1PreviewImage />;
  }

  if (isBvnSlip2) {
    return <BvnSlip2PreviewImage />;
  }

  const isPremium =
    slipOption.sampleLayout === "PREMIUM_CARD" ||
    slipOption.id.toUpperCase().includes("PREMIUM") ||
    slipOption.name.toUpperCase().includes("PREMIUM");

  const isRegular =
    slipOption.id.toUpperCase().includes("REGULAR") ||
    slipOption.name.toUpperCase().includes("REGULAR");

  const isStandard =
    slipOption.sampleLayout === "STANDARD_SLIP" ||
    slipOption.id.toUpperCase().includes("STANDARD") ||
    slipOption.name.toUpperCase().includes("STANDARD");

  if (isPremium) {
    return (
      <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
        <img
          src="/assets/premium.webp"
          alt="Premium NIN Slip"
          className="w-full h-auto max-w-lg rounded-xl object-contain shadow-xs"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/assets/premium.png";
          }}
        />
      </div>
    );
  }

  if (isRegular) {
    return <RegularSlipPreviewImage />;
  }

  if (isStandard) {
    return <StandardSlipPreviewImage />;
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-3xl p-5 shadow-sm space-y-4 text-left transition-all">
      {/* Header & Price Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB] dark:border-[#111827]">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-xl text-white shadow-sm"
            style={{ backgroundColor: slipOption.themeColor }}
          >
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#111827] dark:text-white uppercase tracking-wider">
                Live Slip Preview
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${slipOption.badgeColor}`}
              >
                {slipOption.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              {slipOption.dimensions}
            </p>
          </div>
        </div>

        {/* Dynamic Price Display */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
            Service Price
          </span>
          <div className="flex items-baseline gap-1 justify-end">
            <span
              className="text-lg font-black tracking-tight"
              style={{ color: slipOption.themeColor }}
            >
              ₦{slipOption.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Miniature Visual Mock Preview */}
      <div className="relative rounded-2xl p-4 overflow-hidden border border-[#E5E7EB] dark:border-[#4B5563]/80 bg-[#111827]/5 dark:bg-[#111827]/40">
        {/* Sample Standard Slip Mock */}
        {slipOption.sampleLayout === "STANDARD_SLIP" && (
          <div className="bg-white text-[#111827] p-3.5 rounded-xl border border-[#E5E7EB] shadow-md space-y-2.5 font-sans relative overflow-hidden select-none">
            {/* Top Green Accent & Coat of Arms */}
            <div className="flex items-center justify-between pb-2 border-b border-[#0F2D5C]">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-[#0F2D5C] flex items-center justify-center text-white text-[9px] font-black">
                  NG
                </div>
                <div>
                  <div className="text-[9px] font-black text-[#0F2D5C] tracking-tight leading-none">
                    FEDERAL REPUBLIC OF NIGERIA
                  </div>
                  <div className="text-[7.5px] font-bold text-[#4B5563]">
                    NATIONAL IDENTITY MANAGEMENT COMMISSION
                  </div>
                </div>
              </div>
              <div className="text-[8px] font-mono font-bold text-[#0F2D5C] bg-[#F5F7FA] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                NIN SLIP
              </div>
            </div>

            {/* Content Mock */}
            <div className="grid grid-cols-12 gap-2 text-[8.5px] pt-1">
              {/* Photo Box */}
              <div className="col-span-3 border border-[#E5E7EB] rounded bg-[#E5E7EB] p-1 flex flex-col items-center justify-center text-center h-20">
                <div className="h-9 w-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] font-bold text-[10px]">
                  PHOTO
                </div>
                <span className="text-[6.5px] font-bold text-[#6B7280] mt-1">VERIFIED</span>
              </div>

              {/* Data Fields */}
              <div className="col-span-6 space-y-1">
                <div>
                  <span className="text-[7px] text-[#6B7280] font-bold block">SURNAME / GIVEN NAMES</span>
                  <span className="font-extrabold text-[#111827] block text-[9.5px]">MUHAMMAD, ADAMU</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[7.5px]">
                  <div>
                    <span className="text-[6.5px] text-[#6B7280] block">GENDER</span>
                    <span className="font-bold">MALE</span>
                  </div>
                  <div>
                    <span className="text-[6.5px] text-[#6B7280] block">DOB</span>
                    <span className="font-bold">14 OCT 1994</span>
                  </div>
                </div>
                <div>
                  <span className="text-[6.5px] text-[#6B7280] block">TRACKING ID</span>
                  <span className="font-mono font-bold text-[8px]">TRK-749281048</span>
                </div>
              </div>

              {/* Barcode & QR Box */}
              <div className="col-span-3 flex flex-col items-center justify-between text-center border-l border-[#E5E7EB] pl-1">
                <div className="h-10 w-10 border border-[#E5E7EB] rounded bg-white flex items-center justify-center p-0.5">
                  <QrCode className="h-full w-full text-[#111827]" />
                </div>
                <span className="text-[6px] font-mono text-[#9CA3AF]">AUTHENTICATED</span>
              </div>
            </div>

            {/* Big NIN Banner */}
            <div className="bg-[#0F2D5C] text-white rounded p-1.5 text-center">
              <span className="text-[7px] font-bold tracking-wider uppercase block text-[#9CA3AF]">
                NATIONAL IDENTIFICATION NUMBER (NIN)
              </span>
              <span className="font-mono text-xs font-black tracking-widest">
                5128 •••• ••••
              </span>
            </div>
          </div>
        )}

        {/* Sample Premium Digital NIN Slip Mock - EXACT match to user's uploaded premium.webp */}
        {slipOption.sampleLayout === "PREMIUM_CARD" && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#008751]/40 bg-[#f0fdf4] text-slate-900 font-sans p-3.5 sm:p-4 shadow-sm select-none">
            {/* Fine Green Guilloche Security Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="guilloche-premium" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 0 15 Q 7.5 0 15 15 T 30 15" fill="none" stroke="#008751" strokeWidth="0.5" />
                    <path d="M 0 7.5 Q 7.5 22.5 15 7.5 T 30 7.5" fill="none" stroke="#008751" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#guilloche-premium)" />
              </svg>
            </div>

            {/* Background Watermark Coat of Arms */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
              <NigerianCoatOfArmsSvg size={120} />
            </div>

            {/* Top Header */}
            <div className="relative z-10 flex items-start justify-between pb-1">
              <div>
                <div className="text-[#008751] font-black tracking-tight text-xs sm:text-sm uppercase leading-none">
                  FEDERAL REPUBLIC OF NIGERIA
                </div>
                <div className="text-slate-900 font-black tracking-tight text-[11px] sm:text-xs uppercase leading-tight mt-0.5">
                  DIGITAL NIN SLIP
                </div>
              </div>
            </div>

            {/* Middle Grid */}
            <div className="relative z-10 grid grid-cols-12 gap-2 items-center my-2">
              {/* Silhouette Avatar Photo */}
              <div className="col-span-3 flex justify-center">
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-t-full rounded-b-md bg-[#9CA3AF] p-1 flex flex-col items-center justify-end overflow-hidden shadow-inner">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6B7280] mb-0.5" />
                  <div className="w-11 h-7 sm:w-13 sm:h-8 rounded-t-full bg-[#6B7280]" />
                </div>
              </div>

              {/* Details Column */}
              <div className="col-span-6 space-y-1 text-[9px] sm:text-[10px] leading-tight">
                <div>
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    SURNAME/NOM
                  </span>
                  <span className="font-extrabold text-slate-900 uppercase block tracking-wide">
                    RESIDENT
                  </span>
                </div>

                <div>
                  <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    GIVEN NAMES/PRÉNOMS
                  </span>
                  <span className="font-extrabold text-slate-900 uppercase block tracking-wide">
                    PROUD, NIGERIAN
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      DATE OF BIRTH
                    </span>
                    <span className="font-extrabold text-slate-900 uppercase block">
                      01 OCT 1960
                    </span>
                  </div>
                  <div>
                    <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      SEX/SEXE
                    </span>
                    <span className="font-extrabold text-slate-900 uppercase block">
                      F
                    </span>
                  </div>
                </div>
              </div>

              {/* Right QR & NGA & Issue Date */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white p-0.5 rounded border border-slate-300 shadow-xs">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <div className="mt-1">
                  <span className="font-black text-sm sm:text-base text-slate-900 tracking-wider block leading-none">
                    NGA
                  </span>
                  <span className="text-[6.5px] font-extrabold text-slate-500 uppercase block mt-1">
                    ISSUE DATE
                  </span>
                  <span className="text-[7.5px] font-extrabold text-slate-900 font-mono block">
                    01 JAN 2021
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Banner */}
            <div className="relative z-10 text-center pt-1 border-t border-slate-300/80">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-900 uppercase tracking-wider block">
                National Identification Number (NIN)
              </span>
              <div className="font-mono font-black text-base sm:text-lg md:text-xl tracking-[0.2em] text-slate-900 mt-0.5">
                0000 000 0000
              </div>
            </div>
          </div>
        )}

        {/* Sample Digital Green e-ID Mock */}
        {slipOption.sampleLayout === "DIGITAL_GREEN" && (
          <div className="bg-gradient-to-r from-[#0F2D5C] via-[#0F2D5C] to-[#0F2D5C] text-white p-3.5 rounded-2xl border border-[#0F2D5C]/60 shadow-lg space-y-2 relative overflow-hidden select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB]/40">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-white text-[#0F2D5C] flex items-center justify-center text-[8px] font-black">
                  ★
                </div>
                <span className="text-[9px] font-black tracking-tight text-[#9CA3AF]">
                  NIMC DIGITAL e-ID VERIFICATION SLIP
                </span>
              </div>
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-[#0F2D5C]/30 text-[#9CA3AF] border border-[#E5E7EB]/50">
                HIGH SECURITY
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-16 w-14 rounded-xl border border-[#E5E7EB]/50 bg-[#0F2D5C]/80 p-0.5 flex flex-col items-center justify-center shrink-0">
                <div className="h-8 w-8 rounded-full bg-[#0F2D5C] text-[#9CA3AF] flex items-center justify-center font-bold text-[9px]">
                  PHOTO
                </div>
                <span className="text-[6px] text-[#9CA3AF] mt-1">HOLOGRAM</span>
              </div>

              <div className="space-y-1 flex-1 text-[8.5px]">
                <div className="font-black text-white text-[10.5px]">MUHAMMAD, ADAMU</div>
                <div className="text-[7.5px] text-[#9CA3AF]">FEDERAL REPUBLIC OF NIGERIA</div>
                <div className="font-mono font-black text-[#9CA3AF] text-[11px] tracking-wider">
                  5128 •••• ••••
                </div>
              </div>

              <div className="h-12 w-12 border border-[#E5E7EB] bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0">
                <QrCode className="h-full w-full text-[#0F2D5C]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[7px] text-[#9CA3AF] pt-1 border-t border-[#0F2D5C]/60">
              <span>DIGITAL SIGNATURE ATTESTED</span>
              <span className="font-mono text-[#9CA3AF]">PASS: VERIFIED</span>
            </div>
          </div>
        )}

        {/* Sample POS Thermal Receipt Mock */}
        {slipOption.sampleLayout === "THERMAL_RECEIPT" && (
          <div className="bg-[#F5F7FA]/90 dark:bg-[#0F2D5C]/50 text-[#111827] dark:text-[#9CA3AF] p-3 rounded-lg border border-dashed border-[#E5E7EB] dark:border-[#0F2D5C] shadow-inner font-mono text-[8px] space-y-1 select-none">
            <div className="text-center border-b border-dashed border-[#9CA3AF] pb-1">
              <div className="font-bold text-[9px]">*** NIMC VERIFIED SLIP ***</div>
              <div className="text-[7px]">SMARTLINK AGENT TERMINAL</div>
            </div>
            <div className="flex justify-between pt-1">
              <span>NAME:</span>
              <span className="font-bold">MUHAMMAD ADAMU</span>
            </div>
            <div className="flex justify-between">
              <span>NIN:</span>
              <span className="font-bold">5128********</span>
            </div>
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">PASSED (100%)</span>
            </div>
            <div className="flex justify-center py-1">
              <div className="h-8 w-8 border border-[#9CA3AF] bg-white p-0.5">
                <QrCode className="h-full w-full text-black" />
              </div>
            </div>
            <div className="text-center text-[6.5px] text-[#6B7280] border-t border-dashed border-[#9CA3AF] pt-1">
              KEEP RECEIPT FOR YOUR RECORDS
            </div>
          </div>
        )}

        {/* Sample Text Data Lookup Mock */}
        {slipOption.sampleLayout === "TEXT_DATA" && (
          <div className="bg-[#111827] text-[#E5E7EB] p-3 rounded-xl border border-[#4B5563] font-mono text-[8px] space-y-1 select-none">
            <div className="flex items-center justify-between text-[#9CA3AF] border-b border-[#111827] pb-1">
              <span>{">"} API_RESPONSE_JSON</span>
              <span className="text-[7px] bg-[#0F2D5C] text-[#9CA3AF] px-1 rounded">200 OK</span>
            </div>
            <div className="text-[#9CA3AF]">
              &#123; &quot;status&quot;: &quot;VERIFIED&quot;, &quot;fullName&quot;: &quot;MUHAMMAD, ADAMU&quot;, &quot;nin&quot;: &quot;5128********&quot;, &quot;dob&quot;: &quot;1994-10-14&quot;, &quot;gender&quot;: &quot;M&quot;, &quot;state&quot;: &quot;Kano&quot; &#125;
            </div>
          </div>
        )}

        {/* Instant Turnaround Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#4B5563] text-[9px] font-bold text-[#4B5563] dark:text-[#E5E7EB] shadow-xs">
          <Zap className="h-3 w-3 text-[#0F2D5C]" />
          <span>Instant (~0.5s)</span>
        </div>
      </div>

      {/* Description & Recommended For */}
      <div className="space-y-1">
        <p className="text-xs text-[#4B5563] dark:text-[#E5E7EB] leading-relaxed">
          {slipOption.description}
        </p>
        <div className="flex items-start gap-1.5 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pt-1">
          <span className="font-bold text-[#4B5563] dark:text-[#E5E7EB] shrink-0">
            Best For:
          </span>
          <span>{slipOption.recommendedFor}</span>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#111827]">
        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-2">
          Included in this template
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {slipOption.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-xs text-[#4B5563] dark:text-[#E5E7EB]"
            >
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: slipOption.themeColor }}
              />
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Wallet Deduction Math */}
      <div className="p-3 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827]/60 border border-[#E5E7EB] dark:border-[#4B5563] text-xs space-y-1">
        <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Current Wallet Balance:</span>
          <span className="font-mono font-bold text-[#111827] dark:text-[#E5E7EB]">
            ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>Fee for {slipOption.name.split("(")[0].trim()}:</span>
          <span className="font-mono font-bold text-[#0F2D5C] dark:text-[#9CA3AF]">
            - ₦{slipOption.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-px bg-[#E5E7EB] dark:bg-[#4B5563] my-1" />
        <div className="flex items-center justify-between font-bold">
          <span>Projected Remaining Balance:</span>
          <span
            className={`font-mono ${
              isSufficientBalance
                ? "text-[#0F2D5C] dark:text-[#9CA3AF]"
                : "text-[#0F2D5C] dark:text-[#9CA3AF]"
            }`}
          >
            ₦{balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
