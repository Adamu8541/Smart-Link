/**
 * SmartLink Admin Panel — Responsive Shell Layout (Module 2)
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminFooter from "./AdminFooter";
import AdminNotificationDrawer from "./AdminNotificationDrawer";
import { AdminSession } from "../../../services/adminAuthService";
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

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return adminLayoutService.getPreferences().theme;
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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    adminLayoutService.savePreferences({ theme: nextTheme });
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
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-white text-slate-900"}`}>
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
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`relative w-80 max-w-full h-full z-10 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900 shadow-2xl"}`}
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
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Sticky Header */}
          <AdminHeader
            session={session}
            theme={theme}
            onToggleTheme={toggleTheme}
            onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
            onToggleNotificationDrawer={() => setNotificationDrawerOpen(true)}
            unreadNotifCount={unreadNotifCount}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />

          {/* Breadcrumbs Bar */}
          <div className={`px-4 md:px-8 py-2 border-b transition-colors duration-200 ${theme === "dark" ? "bg-slate-950/60 border-slate-800/60 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700 shadow-xs"}`}>
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
