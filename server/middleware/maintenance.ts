import express from "express";
import { readDB } from "../db";
import { adminAuthService } from "../../src/services/adminAuthService";

export function isMaintenanceModeActive(db: any): boolean {
  if (!db) return false;
  return Boolean(
    db.maintenance_settings?.maintenanceMode ||
    db.site_settings?.maintenanceMode ||
    db.siteSettings?.maintenanceMode
  );
}

export function getMaintenanceDetails(db: any) {
  const m = db.maintenance_settings || {};
  const s = db.site_settings || db.siteSettings || {};
  return {
    maintenanceMode: isMaintenanceModeActive(db),
    maintenanceMessage:
      m.maintenanceMessage ||
      s.maintenanceMessage ||
      "SmartLink is currently undergoing scheduled infrastructure upgrades. Core services and transactions will resume shortly.",
    allowAdminBypass: m.allowAdminBypass !== false,
    estimatedDowntime: m.estimatedDowntime || null,
    scheduledEndTime: m.scheduledEndTime || null,
    scope: m.scope || "GLOBAL",
    updatedAt: m.updatedAt || new Date().toISOString(),
  };
}

export function getValueByJsonPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "").split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export function seedModule7SettingsIfEmpty(db: any) {
  if (!db.branding_settings) {
    db.branding_settings = {
      appName: "SmartLink Digital",
      tagline: "Enterprise Digital & Identity Services Platform",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#0284c7",
      secondaryColor: "#0f172a",
      accentColor: "#38bdf8",
      contactEmail: "support@smartlinkdigital.ng",
      contactPhone: "+2348000000000",
      supportEmail: "support@smartlinkdigital.ng",
      whatsappNumber: "+2348000000000",
      footerText: "© 2026 SmartLink Digital Services. All rights reserved.",
      versionNumber: 1,
      updatedAt: new Date().toISOString(),
    };
  }
  if (!db.system_settings) {
    db.system_settings = {
      general: {
        platformName: "SmartLink Digital",
        currency: "NGN",
        currencySymbol: "₦",
        supportEmail: "support@smartlinkdigital.ng",
        supportPhone: "+2348000000000",
        allowRegistration: true,
        requireEmailVerification: false,
        requirePhoneVerification: false,
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeoutMinutes: 60,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        passwordMinLength: 8,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        inAppNotifications: true,
        pushNotifications: true,
        dispatchMode: "REALTIME",
      },
      transactions: {
        walletFundingMinAmount: 100,
        walletFundingMaxAmount: 1000000,
        airtimeDiscountPercent: 2,
        dataDiscountPercent: 2,
        autoRefundOnFailure: true,
      },
    };
  }
  if (!db.maintenance_settings) {
    db.maintenance_settings = {
      maintenanceMode: false,
      maintenanceMessage: "SmartLink is currently undergoing scheduled infrastructure upgrades. Core services will resume shortly.",
      scheduledEndTime: null,
      allowedIps: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

export function sanitizePublicSettings(db: any, maintenanceDetails?: any) {
  const branding = db.branding_settings || {};
  const maintenance = maintenanceDetails || getMaintenanceDetails(db);
  const sysGeneral = db.system_settings?.general || {};
  const rawLogo = branding.logoUrl || branding.lightLogoUrl || "";
  const resolvedLogoUrl = rawLogo || "/logo.png";
  return {
    success: true,
    settings: {
      appName: branding.appName || sysGeneral.platformName || "SmartLink Digital",
      tagline: branding.tagline || "Enterprise Digital & Identity Services Platform",
      logoUrl: resolvedLogoUrl,
      faviconUrl: branding.faviconUrl || "/favicon.ico",
      primaryColor: branding.primaryColor || "#0284c7",
      secondaryColor: branding.secondaryColor || "#0f172a",
      accentColor: branding.accentColor || "#38bdf8",
      contactEmail: branding.contactEmail || sysGeneral.supportEmail || "support@smartlinkdigital.ng",
      contactPhone: branding.contactPhone || sysGeneral.supportPhone || "+2348000000000",
      whatsappNumber: branding.whatsappNumber || "+2348000000000",
      footerText: branding.footerText || "© 2026 SmartLink Digital Services. All rights reserved.",
      maintenanceActive: Boolean(maintenance.maintenanceMode),
      maintenanceMode: Boolean(maintenance.maintenanceMode),
      maintenanceMessage: maintenance.maintenanceMessage,
      estimatedDowntime: maintenance.estimatedDowntime || null,
      currency: sysGeneral.currency || "NGN",
      currencySymbol: sysGeneral.currencySymbol || "₦",
      allowRegistration: sysGeneral.allowRegistration !== false,
    },
  };
}

export async function maintenanceMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.originalUrl || !req.originalUrl.startsWith("/api")) {
    return next();
  }

  const urlPath = (req.path || req.originalUrl.split("?")[0] || "").toLowerCase();

  if (
    urlPath === "/api/health" ||
    urlPath === "/api/public/settings" ||
    urlPath === "/api/site/settings" ||
    urlPath === "/api/maintenance/status" ||
    urlPath === "/api/admin/auth/login" ||
    urlPath === "/api/admin/auth/session" ||
    urlPath === "/api/admin/maintenance/toggle" ||
    urlPath.startsWith("/api/webhooks") ||
    urlPath.startsWith("/api/monnify/webhook") ||
    urlPath.startsWith("/api/paystack/webhook") ||
    urlPath.startsWith("/api/flutterwave/webhook") ||
    urlPath.startsWith("/api/korapay/webhook")
  ) {
    return next();
  }

  const db = readDB();
  const maintenance = getMaintenanceDetails(db);

  if (!maintenance.maintenanceMode) {
    return next();
  }

  const adminSessionToken =
    (req.headers["x-admin-token"] as string) ||
    (req.headers["authorization"] ? (req.headers["authorization"] as string).replace(/^Bearer\s+/i, "").trim() : "");

  if (adminSessionToken && maintenance.allowAdminBypass) {
    try {
      const val = await adminAuthService.validateSession(db, adminSessionToken);
      if (val && val.valid) {
        return next();
      }
    } catch {
      // invalid admin session
    }
  }

  return res.status(503).json({
    success: false,
    maintenanceMode: true,
    error: "Service Temporarily Unavailable",
    message: maintenance.maintenanceMessage,
    estimatedDowntime: maintenance.estimatedDowntime,
    scheduledEndTime: maintenance.scheduledEndTime,
    scope: maintenance.scope,
    retryAfterSeconds: 300,
    timestamp: new Date().toISOString(),
  });
}
