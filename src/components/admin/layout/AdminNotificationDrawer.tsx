/**
 * SmartLink Admin Panel — Right Notification Drawer Component (Module 2)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Check,
  ExternalLink,
  ShieldAlert,
  Trash2
} from "lucide-react";
import { AdminNotification } from "../../../types/adminLayoutTypes";

interface AdminNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (path: string) => void;
}

export default function AdminNotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: AdminNotificationDrawerProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "SECURITY" | "FINANCE">("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "SECURITY") return n.category === "SECURITY";
    if (filter === "FINANCE") return n.category === "FINANCE";
    return true;
  });

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-rose-400 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Slide Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col text-[#111827]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-[#0F2D5C]">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">Admin Notifications</h3>
                    <p className="text-xs text-[#6B7280]">
                      {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="p-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center gap-1.5 overflow-x-auto text-xs">
                {(["ALL", "UNREAD", "SECURITY", "FINANCE"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`py-1 px-3 rounded-xl font-bold font-mono transition-all cursor-pointer whitespace-nowrap text-xs ${
                      filter === tab
                        ? "bg-[#0F2D5C] text-white"
                        : "bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="ml-auto py-1 px-2.5 text-[10px] font-bold rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:bg-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                    Mark All Read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F7FA]">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-[#6B7280] space-y-2">
                    <ShieldAlert className="h-8 w-8 mx-auto text-[#9CA3AF]" />
                    <p className="text-xs font-medium">No notifications in this category.</p>
                  </div>
                ) : (
                  filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 bg-white ${
                        !item.read
                          ? "border-[#0F2D5C]/30 shadow-xs"
                          : "border-[#E5E7EB] opacity-80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getIcon(item.type)}
                          <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-[#0F2D5C] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed pl-6">{item.message}</p>

                      <div className="pt-2 flex items-center justify-between text-[10px] text-[#6B7280] border-t border-[#E5E7EB]">
                        <span className="font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        <div className="flex items-center gap-2">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => onMarkRead(item.id)}
                              className="text-[#0F2D5C] hover:underline font-bold cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                          {item.link && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onNavigate(item.link!);
                              }}
                              className="text-[#0F2D5C] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              View <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
