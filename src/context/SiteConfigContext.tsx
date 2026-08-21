/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import defaultLogoImg from "../assets/images/smartlink_logo_1785934050308.jpg";

export interface BrandingConfig {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  lightLogoUrl?: string;
  dashboardLogoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headerAnnouncementText?: string;
  showHeaderAnnouncement?: boolean;
}

export interface GeneralConfig {
  platformName?: string;
  companyName?: string;
  companyAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  websiteUrl?: string;
  currency?: string;
}

export interface MaintenanceConfig {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  allowAdminBypass?: boolean;
  scheduledEndTime?: string | null;
}

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  provider?: string;
  costPrice?: number;
  sellingFee: number;
  serviceCharge?: number;
  commissionRate?: number;
  isActive: boolean;
  displayOrder?: number;
  icon?: string;
  totalVolume?: number;
}

export interface SiteConfig {
  branding: BrandingConfig;
  general: GeneralConfig;
  maintenance: MaintenanceConfig;
  homepage: any;
  navigation: any;
  seo: any;
  social: any;
  servicesCatalog: ServiceCatalogItem[];
  allServices: ServiceCatalogItem[];
  priceMatrix: Record<string, any>;
}

interface SiteConfigContextType {
  config: SiteConfig;
  loading: boolean;
  logoUrl: string;
  primaryColor: string;
  siteName: string;
  maintenanceActive: boolean;
  refreshConfig: () => Promise<void>;
  getServicePrice: (codeOrId: string, defaultPrice?: number) => number;
  getServiceCharge: (codeOrId: string, defaultCharge?: number) => number;
  getServiceItem: (codeOrId: string) => ServiceCatalogItem | undefined;
}

const DEFAULT_CONFIG: SiteConfig = {
  branding: {
    siteName: "Smart Link Nigeria",
    tagline: "Enterprise Identity & Corporate Compliance Platform",
    logoUrl: "",
    primaryColor: "#0F2D5C",
    secondaryColor: "#17407E",
    accentColor: "#2563EB",
    headerAnnouncementText: "Federal NIMC & BVN Database Synchronized • Live SLA: 99.98%",
    showHeaderAnnouncement: true,
  },
  general: {
    platformName: "SmartLink Enterprise",
    companyName: "Smart Link Computer Business Solutions Ltd",
    companyAddress: "Abuja, Nigeria",
    supportEmail: "support@smartlinkng.com.ng",
    supportPhone: "+234 808 549 0982",
    whatsappNumber: "+234 808 549 0982",
    websiteUrl: "https://smartlinkng.com.ng",
    currency: "NGN (₦)",
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: "SmartLink is currently undergoing scheduled infrastructure upgrades. Core services will resume shortly.",
    allowAdminBypass: true,
    scheduledEndTime: null,
  },
  homepage: {},
  navigation: {},
  seo: {},
  social: {},
  servicesCatalog: [],
  allServices: [],
  priceMatrix: {},
};

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_CONFIG,
  loading: true,
  logoUrl: defaultLogoImg,
  primaryColor: "#0F2D5C",
  siteName: "Smart Link Nigeria",
  maintenanceActive: false,
  refreshConfig: async () => {},
  getServicePrice: () => 500,
  getServiceCharge: () => 0,
  getServiceItem: () => undefined,
});

export const SiteConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);

  const applyThemeVariables = useCallback((branding: BrandingConfig, general: GeneralConfig) => {
    const primary = branding.primaryColor || "#0F2D5C";
    const secondary = branding.secondaryColor || "#17407E";
    const accent = branding.accentColor || "#2563EB";

    // Set CSS custom properties
    document.documentElement.style.setProperty("--color-brand-primary", primary);
    document.documentElement.style.setProperty("--color-brand-secondary", secondary);
    document.documentElement.style.setProperty("--color-brand-accent", accent);

    // Update document title
    const name = general.platformName || branding.siteName || "Smart Link Nigeria";
    const tagline = branding.tagline ? ` | ${branding.tagline}` : "";
    document.title = `${name}${tagline}`;

    // Update favicon if set
    if (branding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/public/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const merged: SiteConfig = {
            branding: { ...DEFAULT_CONFIG.branding, ...(data.branding || {}) },
            general: { ...DEFAULT_CONFIG.general, ...(data.general || {}) },
            maintenance: { ...DEFAULT_CONFIG.maintenance, ...(data.maintenance || {}) },
            homepage: data.homepage || {},
            navigation: data.navigation || {},
            seo: data.seo || {},
            social: data.social || {},
            servicesCatalog: data.servicesCatalog || [],
            allServices: data.allServices || data.servicesCatalog || [],
            priceMatrix: data.priceMatrix || {},
          };
          setConfig(merged);
          applyThemeVariables(merged.branding, merged.general);
        }
      }
    } catch (err) {
      console.warn("[SiteConfig] Could not load public settings:", err);
    } finally {
      setLoading(false);
    }
  }, [applyThemeVariables]);

  useEffect(() => {
    fetchConfig();

    const handleConfigUpdated = () => {
      fetchConfig();
    };

    window.addEventListener("site_config_updated", handleConfigUpdated);
    window.addEventListener("services_updated", handleConfigUpdated);
    window.addEventListener("theme_changed", handleConfigUpdated);

    // Polling fallback every 30 seconds for live global updates across tabs
    const interval = setInterval(fetchConfig, 30000);

    return () => {
      window.removeEventListener("site_config_updated", handleConfigUpdated);
      window.removeEventListener("services_updated", handleConfigUpdated);
      window.removeEventListener("theme_changed", handleConfigUpdated);
      clearInterval(interval);
    };
  }, [fetchConfig]);

  const logoUrl = config.branding?.logoUrl?.trim()
    ? config.branding.logoUrl
    : defaultLogoImg;

  const primaryColor = config.branding?.primaryColor || "#0F2D5C";
  const siteName = config.general?.platformName || config.branding?.siteName || "Smart Link Nigeria";
  const maintenanceActive = Boolean(config.maintenance?.maintenanceMode);

  const getServiceItem = useCallback(
    (codeOrId: string): ServiceCatalogItem | undefined => {
      if (!codeOrId) return undefined;
      const needle = codeOrId.toUpperCase();
      return (
        config.allServices.find(
          (s) =>
            s.code?.toUpperCase() === needle ||
            s.id?.toUpperCase() === needle ||
            s.name?.toUpperCase() === needle
        ) ||
        config.servicesCatalog.find(
          (s) =>
            s.code?.toUpperCase() === needle ||
            s.id?.toUpperCase() === needle ||
            s.name?.toUpperCase() === needle
        )
      );
    },
    [config.allServices, config.servicesCatalog]
  );

  const getServicePrice = useCallback(
    (codeOrId: string, defaultPrice: number = 500): number => {
      const item = getServiceItem(codeOrId);
      if (item && typeof item.sellingFee === "number" && !isNaN(item.sellingFee)) {
        return item.sellingFee;
      }
      return defaultPrice;
    },
    [getServiceItem]
  );

  const getServiceCharge = useCallback(
    (codeOrId: string, defaultCharge: number = 0): number => {
      const item = getServiceItem(codeOrId);
      if (item && typeof item.serviceCharge === "number" && !isNaN(item.serviceCharge)) {
        return item.serviceCharge;
      }
      return defaultCharge;
    },
    [getServiceItem]
  );

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        loading,
        logoUrl,
        primaryColor,
        siteName,
        maintenanceActive,
        refreshConfig: fetchConfig,
        getServicePrice,
        getServiceCharge,
        getServiceItem,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
