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

interface SlipLivePreviewCardProps {
  slipOption: SlipOptionConfig;
  userBalance: number;
  serviceType?: string;
  onSelectOption?: (option: SlipOptionConfig) => void;
  isSelected?: boolean;
}

export const SlipLivePreviewCard: React.FC<SlipLivePreviewCardProps> = ({
  slipOption,
  userBalance,
  serviceType = "NIN",
  onSelectOption,
  isSelected = true,
}) => {
  const isSufficientBalance = userBalance >= slipOption.price;
  const balanceAfter = Math.max(0, userBalance - slipOption.price);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-left transition-all">
      {/* Header & Price Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-xl text-white shadow-sm"
            style={{ backgroundColor: slipOption.themeColor }}
          >
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Live Slip Preview
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${slipOption.badgeColor}`}
              >
                {slipOption.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {slipOption.dimensions}
            </p>
          </div>
        </div>

        {/* Dynamic Price Display */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
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
      <div className="relative rounded-2xl p-4 overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-950/5 dark:bg-slate-950/40">
        {/* Sample Standard Slip Mock */}
        {slipOption.sampleLayout === "STANDARD_SLIP" && (
          <div className="bg-white text-slate-900 p-3.5 rounded-xl border border-slate-300 shadow-md space-y-2.5 font-sans relative overflow-hidden select-none">
            {/* Top Green Accent & Coat of Arms */}
            <div className="flex items-center justify-between pb-2 border-b border-emerald-600">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[9px] font-black">
                  NG
                </div>
                <div>
                  <div className="text-[9px] font-black text-emerald-900 tracking-tight leading-none">
                    FEDERAL REPUBLIC OF NIGERIA
                  </div>
                  <div className="text-[7.5px] font-bold text-slate-600">
                    NATIONAL IDENTITY MANAGEMENT COMMISSION
                  </div>
                </div>
              </div>
              <div className="text-[8px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                NIN SLIP
              </div>
            </div>

            {/* Content Mock */}
            <div className="grid grid-cols-12 gap-2 text-[8.5px] pt-1">
              {/* Photo Box */}
              <div className="col-span-3 border border-slate-300 rounded bg-slate-100 p-1 flex flex-col items-center justify-center text-center h-20">
                <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                  PHOTO
                </div>
                <span className="text-[6.5px] font-bold text-slate-500 mt-1">VERIFIED</span>
              </div>

              {/* Data Fields */}
              <div className="col-span-6 space-y-1">
                <div>
                  <span className="text-[7px] text-slate-500 font-bold block">SURNAME / GIVEN NAMES</span>
                  <span className="font-extrabold text-slate-900 block text-[9.5px]">MUHAMMAD, ADAMU</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[7.5px]">
                  <div>
                    <span className="text-[6.5px] text-slate-500 block">GENDER</span>
                    <span className="font-bold">MALE</span>
                  </div>
                  <div>
                    <span className="text-[6.5px] text-slate-500 block">DOB</span>
                    <span className="font-bold">14 OCT 1994</span>
                  </div>
                </div>
                <div>
                  <span className="text-[6.5px] text-slate-500 block">TRACKING ID</span>
                  <span className="font-mono font-bold text-[8px]">TRK-749281048</span>
                </div>
              </div>

              {/* Barcode & QR Box */}
              <div className="col-span-3 flex flex-col items-center justify-between text-center border-l border-slate-200 pl-1">
                <div className="h-10 w-10 border border-slate-300 rounded bg-white flex items-center justify-center p-0.5">
                  <QrCode className="h-full w-full text-slate-800" />
                </div>
                <span className="text-[6px] font-mono text-slate-400">AUTHENTICATED</span>
              </div>
            </div>

            {/* Big NIN Banner */}
            <div className="bg-emerald-800 text-white rounded p-1.5 text-center">
              <span className="text-[7px] font-bold tracking-wider uppercase block text-emerald-200">
                NATIONAL IDENTIFICATION NUMBER (NIN)
              </span>
              <span className="font-mono text-xs font-black tracking-widest">
                5128 •••• ••••
              </span>
            </div>
          </div>
        )}

        {/* Sample Premium White Plastic Card Mock */}
        {slipOption.sampleLayout === "PREMIUM_CARD" && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 text-slate-900 p-3.5 rounded-2xl border border-blue-200 shadow-md space-y-2 relative overflow-hidden select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[8px] font-black">
                  NG
                </div>
                <span className="text-[9px] font-black text-blue-900 tracking-tight">
                  FEDERAL REPUBLIC OF NIGERIA - NATIONAL e-ID
                </span>
              </div>
              <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                CR80 CARD
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-16 w-14 rounded-xl border-2 border-blue-400 bg-white p-0.5 shadow-sm flex flex-col items-center justify-center shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px]">
                  PHOTO
                </div>
                <span className="text-[6px] font-bold text-blue-600 mt-1">CHIP EMBED</span>
              </div>

              <div className="space-y-1 flex-1 text-[8.5px]">
                <div className="font-black text-slate-900 text-[10px]">MUHAMMAD ADAMU</div>
                <div className="text-[7.5px] text-slate-600 font-medium">KANO / NASARAWA LGA</div>
                <div className="font-mono font-black text-blue-700 text-[11px] tracking-wider">
                  NIN: 5128 •••• ••••
                </div>
              </div>

              <div className="h-12 w-12 border border-blue-200 bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0">
                <QrCode className="h-full w-full text-blue-900" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 pt-1 border-t border-blue-100">
              <span>ISSUED: OFFICIAL GOVT TRUST</span>
              <span className="text-blue-600 font-bold">2D BARCODE ENCRYPTED</span>
            </div>
          </div>
        )}

        {/* Sample Digital Green e-ID Mock */}
        {slipOption.sampleLayout === "DIGITAL_GREEN" && (
          <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-950 text-white p-3.5 rounded-2xl border border-emerald-500/60 shadow-lg space-y-2 relative overflow-hidden select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-400/40">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-white text-emerald-900 flex items-center justify-center text-[8px] font-black">
                  ★
                </div>
                <span className="text-[9px] font-black tracking-tight text-emerald-100">
                  NIMC DIGITAL e-ID VERIFICATION SLIP
                </span>
              </div>
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/50">
                HIGH SECURITY
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-16 w-14 rounded-xl border border-emerald-400/50 bg-emerald-950/80 p-0.5 flex flex-col items-center justify-center shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-[9px]">
                  PHOTO
                </div>
                <span className="text-[6px] text-emerald-300 mt-1">HOLOGRAM</span>
              </div>

              <div className="space-y-1 flex-1 text-[8.5px]">
                <div className="font-black text-white text-[10.5px]">MUHAMMAD, ADAMU</div>
                <div className="text-[7.5px] text-emerald-200">FEDERAL REPUBLIC OF NIGERIA</div>
                <div className="font-mono font-black text-amber-300 text-[11px] tracking-wider">
                  5128 •••• ••••
                </div>
              </div>

              <div className="h-12 w-12 border border-emerald-400 bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0">
                <QrCode className="h-full w-full text-emerald-950" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[7px] text-emerald-300 pt-1 border-t border-emerald-700/60">
              <span>DIGITAL SIGNATURE ATTESTED</span>
              <span className="font-mono text-emerald-200">PASS: VERIFIED</span>
            </div>
          </div>
        )}

        {/* Sample POS Thermal Receipt Mock */}
        {slipOption.sampleLayout === "THERMAL_RECEIPT" && (
          <div className="bg-amber-50/90 dark:bg-amber-950/50 text-slate-900 dark:text-amber-100 p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 shadow-inner font-mono text-[8px] space-y-1 select-none">
            <div className="text-center border-b border-dashed border-slate-400 pb-1">
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
              <span className="font-bold text-emerald-600 dark:text-emerald-400">PASSED (100%)</span>
            </div>
            <div className="flex justify-center py-1">
              <div className="h-8 w-8 border border-slate-400 bg-white p-0.5">
                <QrCode className="h-full w-full text-black" />
              </div>
            </div>
            <div className="text-center text-[6.5px] text-slate-500 border-t border-dashed border-slate-400 pt-1">
              KEEP RECEIPT FOR YOUR RECORDS
            </div>
          </div>
        )}

        {/* Sample Text Data Lookup Mock */}
        {slipOption.sampleLayout === "TEXT_DATA" && (
          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-700 font-mono text-[8px] space-y-1 select-none">
            <div className="flex items-center justify-between text-emerald-400 border-b border-slate-800 pb-1">
              <span>{">"} API_RESPONSE_JSON</span>
              <span className="text-[7px] bg-emerald-950 text-emerald-300 px-1 rounded">200 OK</span>
            </div>
            <div className="text-slate-400">
              &#123; &quot;status&quot;: &quot;VERIFIED&quot;, &quot;fullName&quot;: &quot;MUHAMMAD, ADAMU&quot;, &quot;nin&quot;: &quot;5128********&quot;, &quot;dob&quot;: &quot;1994-10-14&quot;, &quot;gender&quot;: &quot;M&quot;, &quot;state&quot;: &quot;Kano&quot; &#125;
            </div>
          </div>
        )}

        {/* Instant Turnaround Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-700 dark:text-slate-300 shadow-xs">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>Instant (~0.5s)</span>
        </div>
      </div>

      {/* Description & Recommended For */}
      <div className="space-y-1">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {slipOption.description}
        </p>
        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Best For:
          </span>
          <span>{slipOption.recommendedFor}</span>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Included in this template
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {slipOption.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
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
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Current Wallet Balance:</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            ₦{userBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>Fee for {slipOption.name.split("(")[0].trim()}:</span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            - ₦{slipOption.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
        <div className="flex items-center justify-between font-bold">
          <span>Projected Remaining Balance:</span>
          <span
            className={`font-mono ${
              isSufficientBalance
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            ₦{balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
