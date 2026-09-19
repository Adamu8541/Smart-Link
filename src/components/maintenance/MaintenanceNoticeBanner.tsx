import React, { useState } from "react";
import { Wrench, Clock, X, Info, AlertTriangle, MessageSquare, ChevronRight, Calendar } from "lucide-react";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { formatSafeDateTime } from "../../utils/formatUtils";

export function MaintenanceNoticeBanner() {
  const { config } = useSiteConfig();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const m = config.maintenance || {};

  const isAnyMaintenanceActive = Boolean(
    m.maintenanceMode ||
    m.loginMaintenanceMode ||
    m.signupMaintenanceMode ||
    m.servicesMaintenanceMode
  );

  if (!isAnyMaintenanceActive || isDismissed) {
    return null;
  }

  // Active scopes summary
  const activeScopes: string[] = [];
  if (m.maintenanceMode) activeScopes.push("Entire System");
  if (m.loginMaintenanceMode) activeScopes.push("User Logins");
  if (m.signupMaintenanceMode) activeScopes.push("Account Registrations");
  if (m.servicesMaintenanceMode) {
    if (m.maintenanceModeAllServices) activeScopes.push("All Digital Services");
    else if (m.maintenanceServices && m.maintenanceServices.length > 0) {
      activeScopes.push(`Services (${m.maintenanceServices.join(", ")})`);
    } else {
      activeScopes.push("Select Services");
    }
  }

  const startDateRaw = m.startDate || (m as any).updatedAt;
  const endDateRaw = m.scheduledEndTime || (m as any).estimatedDowntime;

  const formatDate = (isoOrStr?: any) => {
    if (!isoOrStr) return "TBA";
    return formatSafeDateTime(isoOrStr, typeof isoOrStr === "string" ? isoOrStr : "TBA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formattedStart = formatDate(startDateRaw);
  const formattedEnd = formatDate(endDateRaw);

  return (
    <>
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-[#0F2D5C] text-white px-4 py-2.5 shadow-md relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 bg-black/20 rounded-lg shrink-0">
              <Wrench className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: "10s" }} />
            </span>
            <div className="truncate">
              <span className="font-bold uppercase tracking-wider text-amber-200 mr-2">
                ⚠️ MAINTENANCE ADVISORY:
              </span>
              <span className="font-semibold text-white">
                Under maintenance: <strong className="text-amber-100">{activeScopes.join(" • ")}</strong>.
              </span>
              {m.maintenanceMessage && (
                <span className="hidden md:inline text-amber-100/90 ml-2 italic">
                  "{m.maintenanceMessage}"
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono bg-black/30 px-2.5 py-1 rounded-full text-amber-100 border border-amber-400/20">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>Est. End: {formattedEnd}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer border border-white/20"
            >
              <Info className="w-3 h-3" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Dismiss Maintenance Notice"
              className="p-1 hover:bg-black/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pop Out Maintenance Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-left space-y-4 relative text-slate-100 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">System Maintenance Notification</h3>
                  <p className="text-[11px] text-slate-400">Current platform maintenance status & schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope details */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Affected Scopes & Components
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeScopes.map((scope, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg text-xs font-semibold">
                      • {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Start Date
                  </span>
                  <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                    {formattedStart}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Expected End
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 block">
                    {formattedEnd}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reason for Maintenance
                </span>
                <p className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 leading-relaxed whitespace-pre-line">
                  {m.maintenanceMessage || "Scheduled system upgrade and API integration optimization."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              {m.supportContact && (
                <a
                  href={`https://wa.me/${m.supportContact.replace(/[^0-9]/g, "")}?text=Inquiry%20regarding%20active%20maintenance`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer ml-auto"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
