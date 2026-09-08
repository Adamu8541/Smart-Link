/**
 * SmartLink Admin Panel — Responsive Shell Layout
 * Enforcing Homepage Design Aesthetic (#F5F7FA, #0F2D5C, #111827, #E5E7EB)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminNotificationDrawer from "./AdminNotificationDrawer";
import { AdminSession } from "../../../services/adminAuthTypes";
import { adminLayoutService } from "../../../services/adminLayoutService";
import { AdminNotification, AdminBreadcrumb } from "../../../types/adminLayoutTypes";
import { useSiteConfig } from "../../../context/SiteConfigContext";
import { safeFetchJson } from "../../../utils/authErrorHandler";

interface AdminDashboardLayoutProps {
  currentRoute: string;
  session: AdminSession;
  onNavigate: (routePath: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminDashboardLayout({
  currentRoute,
  session,
  onNavigate,
  onLogout,
  children,
}: AdminDashboardLayoutProps) {
  const { maintenanceActive, refreshConfig } = useSiteConfig();
  const [disablingMaintenance, setDisablingMaintenance] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return adminLayoutService.getPreferences().sidebarCollapsed;
  });

  const handleQuickDisableMaintenance = async () => {
    setDisablingMaintenance(true);
    try {
      const res = await safeFetchJson<{ success: boolean; message: string }>("/api/admin/maintenance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken || "",
        },
        body: JSON.stringify({ maintenanceMode: false }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("site_config_updated"));
        await refreshConfig();
      }
    } catch (e) {
      console.error("Failed to disable maintenance mode:", e);
    } finally {
      setDisablingMaintenance(false);
    }
  };

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    return adminLayoutService.getNotifications();
  });

  const breadcrumbs: AdminBreadcrumb[] = adminLayoutService.getBreadcrumbs(currentRoute);

  const toggleSidebarCollapse = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    adminLayoutService.savePreferences({ sidebarCollapsed: nextState });
  };

  const handleMarkRead = (id: string) => {
    const updated = adminLayoutService.markNotificationRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = adminLayoutService.markAllNotificationsRead();
    setNotifications(updated);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0F2D5C] text-[#0F2D5C]">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <AdminSidebar
            currentRoute={currentRoute}
            session={session}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onNavigate={(routePath) => {
              onNavigate(routePath);
            }}
            onLogout={onLogout}
          />
        </div>

        {/* Mobile / Tablet Drawer Overlay */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-[#0F2D5C]/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-80 max-w-full h-full z-10 bg-white text-[#0F2D5C] shadow-2xl"
              >
                <AdminSidebar
                  currentRoute={currentRoute}
                  session={session}
                  collapsed={false}
                  onToggleCollapse={() => {}}
                  onNavigate={(routePath) => {
                    setMobileDrawerOpen(false);
                    onNavigate(routePath);
                  }}
                  onLogout={onLogout}
                  isMobileDrawer
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Right Main Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0F2D5C]">
          {/* Top Sticky Header */}
          <AdminHeader
            session={session}
            theme="light"
            onToggleTheme={() => {}}
            onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
            onToggleNotificationDrawer={() => setNotificationDrawerOpen(true)}
            unreadNotifCount={unreadNotifCount}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />

          {/* Maintenance Active Warning Banner */}
          {maintenanceActive && (
            <div className="bg-[#0F2D5C] text-[#111827] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 font-semibold text-xs shadow-sm border-b border-[#0F2D5C]/40">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F2D5C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F2D5C]"></span>
                </span>
                <span>
                  <strong className="tracking-wide">MAINTENANCE MODE IS CURRENTLY ON:</strong> All user transactions and customer services are restricted. Admins have access.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickDisableMaintenance}
                  disabled={disablingMaintenance}
                  className="px-3 py-1 bg-[#111827] hover:bg-[#111827] text-white font-bold rounded-md text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {disablingMaintenance ? "Disabling..." : "Turn OFF Maintenance Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("/admin/settings")}
                  className="px-2.5 py-1 bg-[#0F2D5C]/20 hover:bg-[#0F2D5C]/40 text-[#111827] font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                >
                  Configure
                </button>
              </div>
            </div>
          )}

          {/* Breadcrumbs Bar */}
          <div className="px-4 md:px-8 py-2.5 border-b border-[#0F2D5C] bg-white text-[#0F2D5C]">
            <AdminBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={onNavigate} />
          </div>

          {/* Main Body View Content */}
          <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
