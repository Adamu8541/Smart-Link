import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  X,
  ShieldAlert,
  Wallet,
  UserCheck,
  KeyRound,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  AlertTriangle,
  Info,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { NotificationDocument, NotificationSettingsDocument } from "../../types/database";
import { NotificationEngine } from "../../services/notificationEngine";

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "SETTINGS">("ALL");
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Settings State
  const [settings, setSettings] = useState<NotificationSettingsDocument | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await NotificationEngine.getNotifications({
      userId,
      read: activeTab === "UNREAD" ? false : undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
      searchQuery: searchQuery || undefined,
      page,
      pageSize
    });

    setNotifications(res.notifications);
    setTotal(res.total);
    setUnreadCount(res.unreadCount);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const s = await NotificationEngine.getSettings(userId);
    setSettings(s);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchSettings();
    }
  }, [isOpen, userId, activeTab, categoryFilter, page]);

  // Polling for real-time notification updates when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 12000); // Poll every 12s
    return () => clearInterval(interval);
  }, [isOpen, userId, activeTab, categoryFilter, page]);

  if (!isOpen) return null;

  const handleMarkRead = async (notificationId: string) => {
    await NotificationEngine.markAsRead(notificationId, userId);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await NotificationEngine.markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (notificationId: string) => {
    await NotificationEngine.deleteNotification(notificationId, userId);
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    setTotal((t) => Math.max(0, t - 1));
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    const success = await NotificationEngine.updateSettings(userId, settings);
    setSettingsSaving(false);
    if (success) {
      setSettingsMessage("Notification preferences saved successfully!");
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  };

  const getNotificationIcon = (type?: string, category?: string) => {
    switch (type) {
      case "WALLET_CREDIT":
      case "WALLET_DEBIT":
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case "VERIFICATION_SUCCESSFUL":
      case "VERIFICATION_FAILED":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case "LOGIN":
      case "LOGOUT":
      case "PASSWORD_CHANGED":
        return <KeyRound className="w-4 h-4 text-purple-500" />;
      case "SECURITY_ALERT":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "ADMIN_ANNOUNCEMENT":
      case "NEW_FEATURE_ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4 text-amber-500" />;
      case "MAINTENANCE_NOTICE":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "REFUND_COMPLETED":
        return <RotateCcw className="w-4 h-4 text-indigo-500" />;
      default:
        if (category === "TRANSACTION") return <Wallet className="w-4 h-4 text-emerald-500" />;
        if (category === "VERIFICATION") return <UserCheck className="w-4 h-4 text-blue-500" />;
        if (category === "SECURITY") return <ShieldAlert className="w-4 h-4 text-rose-500" />;
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] ${
          isDarkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                Notification Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time updates, alerts, and system activity records.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Actions Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab("ALL");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              All Notifications ({total})
            </button>

            <button
              onClick={() => {
                setActiveTab("UNREAD");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === "UNREAD"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("SETTINGS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "SETTINGS"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Preferences
            </button>
          </div>

          {activeTab !== "SETTINGS" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                Mark All Read
              </button>

              <button
                onClick={() => fetchNotifications()}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Bar (Only when in notification lists) */}
        {activeTab !== "SETTINGS" && (
          <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notification title or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchNotifications()}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="TRANSACTION">Transactions</option>
                <option value="VERIFICATION">Identity Verification</option>
                <option value="SECURITY">Security & Access</option>
                <option value="SYSTEM">System & Updates</option>
                <option value="ACCOUNT">Account Logs</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {activeTab === "SETTINGS" ? (
            /* PREFERENCES TAB */
            <div className="space-y-5 text-left max-w-xl mx-auto py-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Notification Preferences & Alert Channels
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose which alerts and communication channels you want enabled.
                </p>
              </div>

              {settingsMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {settingsMessage}
                </div>
              )}

              {settings ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        In-App Real-Time Notifications
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Show popup alerts & badge updates directly inside SmartLink.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.inAppNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, inAppNotifications: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Email Receipt & Activity Notifications
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Send transaction receipts and verification updates to your email.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, emailNotifications: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Security & Login Alerts
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instant notification when new logins, password changes, or IP shifts occur.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.securityAlerts}
                      onChange={(e) =>
                        setSettings({ ...settings, securityAlerts: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        System Announcements & Maintenance Notices
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Important core platform maintenance windows and downtime notices.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.systemAnnouncements}
                      onChange={(e) =>
                        setSettings({ ...settings, systemAnnouncements: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Marketing Messages & New Features
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Promotions, discounted VTU rates, and new feature highlights.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketingMessages}
                      onChange={(e) =>
                        setSettings({ ...settings, marketingMessages: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {settingsSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Notification Preferences
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Loading notification settings...
                </div>
              )}
            </div>
          ) : /* NOTIFICATIONS LIST */
          loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Fetching notification ledger...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium text-slate-500">
                No notifications found. You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notificationId || n.id}
                className={`p-3.5 rounded-xl border transition-all text-left flex items-start gap-3 relative group ${
                  !n.read
                    ? isDarkMode
                      ? "bg-slate-800/80 border-blue-900/60 shadow-sm"
                      : "bg-blue-50/50 border-blue-200 shadow-sm"
                    : isDarkMode
                    ? "bg-slate-900/50 border-slate-800 opacity-90"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Icon */}
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getNotificationIcon(n.type, n.category)}
                </div>

                {/* Body */}
                <div className="flex-1 space-y-1 pr-12">
                  <div className="flex items-center gap-2">
                    <h5
                      className={`text-xs font-bold leading-snug ${
                        !n.read ? "text-blue-950 dark:text-blue-200" : "text-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {n.title}
                    </h5>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.body}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </span>
                    {n.category && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                        {n.category}
                      </span>
                    )}
                    {n.reference && (
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        Ref: {n.reference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating Actions */}
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.notificationId || n.id)}
                      className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.notificationId || n.id)}
                    className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Pagination */}
        {activeTab !== "SETTINGS" && notifications.length > 0 && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div>
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{notifications.length}</span> of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> alerts
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
