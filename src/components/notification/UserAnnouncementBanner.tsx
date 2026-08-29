import React, { useEffect, useState } from "react";
import { AlertTriangle, Info, Bell, ShieldAlert, Sparkles, X, ChevronRight, ExternalLink, Megaphone } from "lucide-react";
import { safeFetchJson } from "../../utils/authErrorHandler";

interface UserAnnouncementBannerProps {
  variant?: "homepage" | "dashboard" | "floating";
  className?: string;
  onNavigate?: (url: string) => void;
}

export function UserAnnouncementBanner({ variant = "dashboard", className = "", onNavigate }: UserAnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_announcement_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; announcements?: any[]; announcementsEnabled?: boolean }>("/api/user/announcements/active");
      if (res.ok && res.data?.success && Array.isArray(res.data.announcements)) {
        setAnnouncements(res.data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.warn("Announcements note:", err);
    }
  };

  useEffect(() => {
    fetchActiveAnnouncements();

    // Re-check periodically or on custom sync event
    const interval = setInterval(fetchActiveAnnouncements, 20000);
    const handleSync = () => fetchActiveAnnouncements();
    window.addEventListener("announcements_updated", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("announcements_updated", handleSync);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, id];
      try {
        sessionStorage.setItem("dismissed_announcement_ids", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const getStyleClasses = (style: string, priority: string) => {
    if (priority === "Critical" || style === "rose") {
      return "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-rose-500/5";
    }
    if (style === "amber" || priority === "High") {
      return "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-amber-500/5";
    }
    if (style === "emerald") {
      return "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/5";
    }
    return "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 shadow-blue-500/5";
  };

  const getIcon = (type: string, priority: string) => {
    if (type === "Security Alert" || priority === "Critical") return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
    if (type === "System Maintenance" || type === "Service Downtime" || priority === "High") return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
    if (type === "New Service Available" || type === "Promotional Campaign") return <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    return <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    if (onNavigate) {
      onNavigate(url);
    } else if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  };

  // Variant 1: Homepage Top Bar / Ticker
  if (variant === "homepage") {
    return (
      <div id="homepage-announcements-container" className={`w-full space-y-2.5 ${className}`}>
        {visibleAnnouncements.map((ann) => (
          <div
            key={ann.id}
            id={`announcement-banner-${ann.id}`}
            className={`w-full py-3 px-4 sm:px-6 rounded-2xl border shadow-sm transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${getStyleClasses(
              ann.bannerStyle,
              ann.priority
            )}`}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-1.5 rounded-xl bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/10 shrink-0">
                {getIcon(ann.type, ann.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/20 shadow-2xs font-mono">
                    {ann.type || "Live Notice"}
                  </span>
                  <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white">
                    {ann.title}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/10">
              {ann.actionText && (
                <button
                  onClick={() => handleActionClick(ann.actionUrl || "/")}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{ann.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDismiss(ann.id)}
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Variant 2: Standard Dashboard Banner
  return (
    <div id="user-dashboard-announcements" className={`space-y-3 mb-6 ${className}`}>
      {visibleAnnouncements.map((ann) => (
        <div
          key={ann.id}
          id={`dashboard-ann-card-${ann.id}`}
          className={`p-4.5 rounded-2xl border backdrop-blur-md shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${getStyleClasses(
            ann.bannerStyle,
            ann.priority
          )}`}
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/10 shrink-0 mt-0.5">
              {getIcon(ann.type, ann.priority)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{ann.title}</h4>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 font-extrabold">
                  {ann.type}
                </span>
                {ann.priority === "Critical" && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-black animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">{ann.content}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {ann.actionText && (
              <button
                onClick={() => handleActionClick(ann.actionUrl || "/")}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{ann.actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDismiss(ann.id)}
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
