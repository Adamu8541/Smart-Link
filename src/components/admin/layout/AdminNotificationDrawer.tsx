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
        return <AlertTriangle className="h-4 w-4 text-[#0F2D5C] shrink-0" />;
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-[#0F2D5C] shrink-0" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-[#0F2D5C] shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-[#0F2D5C] shrink-0" />;
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
            className="absolute inset-0 bg-[#0F2D5C]/60 backdrop-blur-xs"
          />

          {/* Drawer Slide Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white border-l border-[#0F2D5C] shadow-2xl flex flex-col text-[#0F2D5C]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#0F2D5C] flex items-center justify-between bg-[#0F2D5C]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#0F2D5C] border border-[#0F2D5C] rounded-xl text-[#0F2D5C]">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F2D5C]">Admin Notifications</h3>
                    <p className="text-xs text-[#0F2D5C]">
                      {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white border border-[#0F2D5C] text-[#0F2D5C] hover:text-[#0F2D5C] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="p-3 border-b border-[#0F2D5C] bg-[#0F2D5C] flex items-center gap-1.5 overflow-x-auto text-xs">
                {(["ALL", "UNREAD", "SECURITY", "FINANCE"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`py-1 px-3 rounded-xl font-bold font-mono transition-all cursor-pointer whitespace-nowrap ${
                      filter === tab
                        ? "bg-[#0F2D5C] text-white"
                        : "bg-white text-[#0F2D5C] hover:text-[#0F2D5C] border border-[#0F2D5C]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="ml-auto py-1 px-2.5 bg-white hover:bg-[#0F2D5C] text-[#0F2D5C] text-[10px] font-bold rounded-xl border border-[#0F2D5C] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Check className="h-3 w-3" />
                    Mark All Read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F2D5C]">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-[#0F2D5C] space-y-2">
                    <ShieldAlert className="h-8 w-8 mx-auto text-[#0F2D5C]" />
                    <p className="text-xs font-medium">No notifications in this category.</p>
                  </div>
                ) : (
                  filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 bg-white ${
                        !item.read
                          ? "border-[#0F2D5C]"
                          : "border-[#0F2D5C] opacity-80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getIcon(item.type)}
                          <p className="text-xs font-bold text-[#0F2D5C]">{item.title}</p>
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-[#0F2D5C] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-[#0F2D5C] leading-relaxed pl-6">{item.message}</p>

                      <div className="pt-2 flex items-center justify-between text-[10px] text-[#0F2D5C] border-t border-[#0F2D5C]">
                        <span className="font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        <div className="flex items-center gap-2">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => onMarkRead(item.id)}
                              className="text-[#0F2D5C] hover:underline font-medium cursor-pointer"
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
