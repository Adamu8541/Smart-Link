/**
 * SmartLink Admin Panel — Responsive Shell Layout
 * Enforcing Homepage Design Aesthetic (#F5F7FA, #0F2D5C, #111827, #E5E7EB)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminFooter from "./AdminFooter";
import AdminNotificationDrawer from "./AdminNotificationDrawer";
import { AdminSession } from "../../../services/adminAuthTypes";
import { adminLayoutService } from "../../../services/adminLayoutService";
import { AdminNotification, AdminBreadcrumb } from "../../../types/adminLayoutTypes";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return adminLayoutService.getPreferences().sidebarCollapsed;
  });

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
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F9FC] text-[#101828]">
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
                className="fixed inset-0 bg-[#0B1F3A]/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-80 max-w-full h-full z-10 bg-white text-[#101828] shadow-2xl"
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
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F7F9FC]">
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

          {/* Breadcrumbs Bar */}
          <div className="px-4 md:px-8 py-2.5 border-b border-[#E5EAF0] bg-white text-[#667085]">
            <AdminBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={onNavigate} />
          </div>

          {/* Main Body View Content */}
          <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Footer */}
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
