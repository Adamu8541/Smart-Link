import React, { useEffect, useState } from "react";
import { AlertTriangle, Info, Bell, ShieldAlert, Sparkles, X, ChevronRight, ExternalLink } from "lucide-react";

export function UserAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await fetch("/api/user/announcements/active");
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error("Failed to load active announcements:", err);
    }
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const getStyleClasses = (style: string, priority: string) => {
    if (priority === "Critical" || style === "rose") {
      return "bg-rose-950/80 border-rose-800 text-rose-200 dark:bg-rose-950/90";
    }
    if (style === "amber" || priority === "High") {
      return "bg-amber-950/80 border-amber-800 text-amber-200 dark:bg-amber-950/90";
    }
    if (style === "emerald") {
      return "bg-emerald-950/80 border-emerald-800 text-emerald-200 dark:bg-emerald-950/90";
    }
    return "bg-blue-950/80 border-blue-800 text-blue-200 dark:bg-blue-950/90";
  };

  const getIcon = (type: string) => {
    if (type === "Security Alert") return <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
    if (type === "System Maintenance" || type === "Service Downtime") return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    if (type === "New Service Available" || type === "Promotional Campaign") return <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />;
    return <Bell className="w-5 h-5 text-blue-400 shrink-0" />;
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className={`p-4 rounded-xl border backdrop-blur-md shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-2 ${getStyleClasses(
            ann.bannerStyle,
            ann.priority
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(ann.type)}</div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm tracking-tight text-white">{ann.title}</h4>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 font-bold">
                  {ann.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ann.content}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            {ann.actionUrl && (
              <a
                href={ann.actionUrl}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1"
              >
                <span>{ann.actionText || "Learn More"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => handleDismiss(ann.id)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
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
