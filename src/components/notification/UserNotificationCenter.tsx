import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Archive,
  Trash2,
  Filter,
  Search,
  Clock,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  X,
  Mail,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { UserProfile } from "../../types";
import { safeFetchJson } from "../../utils/authErrorHandler";
import { getAuthHeaders } from "../../services/providerService";

interface UserNotificationCenterProps {
  currentUser?: UserProfile | null;
  onNavigateHome?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export function UserNotificationCenter({ currentUser, onNavigateHome, isModal = false, onCloseModal }: UserNotificationCenterProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "ARCHIVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  const userEmail = currentUser?.email || "adamuamuhammad8541@gmail.com";

  useEffect(() => {
    fetchNotifications();
  }, [userEmail]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await safeFetchJson<{ success: boolean; notifications?: any[]; unreadCount?: number }>(
        `/api/user/notifications?email=${encodeURIComponent(userEmail)}`,
        { headers }
      );
      if (res.ok && res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("User notifications note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await safeFetchJson("/api/user/notifications/mark-read", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, notificationId: id }),
      });
      fetchNotifications();
    } catch (err) {
      console.warn("Mark read note:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const headers = await getAuthHeaders();
      await safeFetchJson("/api/user/notifications/mark-read", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, markAll: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.warn("Mark all read note:", err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await safeFetchJson("/api/user/notifications/archive", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, notificationId: id }),
      });
      fetchNotifications();
    } catch (err) {
      console.warn("Archive note:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await safeFetchJson(`/api/user/notifications/${id}?email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
        headers,
      });
      fetchNotifications();
      if (selectedNotif?.id === id) setSelectedNotif(null);
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType === "UNREAD" && n.isRead) return false;
    if (filterType === "ARCHIVED" && !n.isArchived) return false;
    if (filterType !== "ARCHIVED" && n.isArchived) return false;
    if (filterCategory !== "ALL" && n.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const getPriorityBadge = (p: string) => {
    if (p === "Critical") return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
    if (p === "High") return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">NORMAL</span>;
  };

  return (
    <div className={`space-y-6 ${isModal ? "p-4" : "p-4 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"}`}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notification Inbox</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-sm">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              System alerts, wallet updates, verification notices, and broadcast messages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterType === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            All Messages ({notifications.length})
          </button>
          <button
            onClick={() => setFilterType("UNREAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterType === "UNREAD"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilterType("ARCHIVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterType === "ARCHIVED"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Archived
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="System Maintenance">System Maintenance</option>
            <option value="Wallet Alert">Wallet Alert</option>
            <option value="Security Alert">Security Alert</option>
            <option value="Verification">Verification</option>
            <option value="Billing">Billing</option>
            <option value="Support">Support</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No notifications found</p>
          <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                setSelectedNotif(n);
                if (!n.isRead) handleMarkAsRead(n.id);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                !n.isRead
                  ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {!n.isRead ? (
                      <span className="h-3 w-3 rounded-full bg-blue-600 inline-block animate-pulse" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm tracking-tight ${!n.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {n.title}
                      </h3>
                      {getPriorityBadge(n.priority)}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.sentAt || n.createdAt).toLocaleString()}
                      </span>
                      {n.createdBy && <span>• From: {n.createdBy}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-600"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {!n.isArchived && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(n.id);
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-amber-500"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Detail Drawer / Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative space-y-4 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedNotif(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedNotif.priority)}
                <span className="text-xs font-mono text-slate-500 uppercase">{selectedNotif.category}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedNotif.title}</h2>
              <p className="text-xs text-slate-400">
                Received: {new Date(selectedNotif.sentAt || selectedNotif.createdAt).toLocaleString()} • Via {selectedNotif.channels?.join(", ")}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {selectedNotif.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDelete(selectedNotif.id)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
