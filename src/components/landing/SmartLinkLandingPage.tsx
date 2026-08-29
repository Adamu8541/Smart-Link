/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import SEOHead from "./SEOHead";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";
import LandingTrustSection from "./LandingTrustSection";
import LandingServicesPreview from "./LandingServicesPreview";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingCTASection from "./LandingCTASection";
import LandingFooter from "./LandingFooter";
import { UserAnnouncementBanner } from "../notification/UserAnnouncementBanner";

interface SmartLinkLandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onAdminLogin?: () => void;
  onExploreServices: () => void;
  onSelectService?: (serviceId: string) => void;
  onNavigateLegal?: (docId?: string) => void;
  siteAnnouncement?: {
    showAnnouncement?: boolean;
    announcementText?: string;
  };
}

export const SmartLinkLandingPage: React.FC<SmartLinkLandingPageProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onAdminLogin,
  onExploreServices,
  onSelectService,
  onNavigateLegal,
  siteAnnouncement,
}) => {
  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSales = () => {
    const contactEl = document.getElementById("contact-section") || document.getElementById("cta-section");
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAnnouncementNavigate = (url: string) => {
    if (url.includes("login") || url.includes("dashboard")) {
      onLogin();
    } else if (url.includes("register") || url.includes("signup")) {
      onRegister();
    } else if (url.includes("service")) {
      onExploreServices();
    } else if (url.startsWith("#")) {
      handleNavigateSection(url.replace("#", ""));
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div id="smartlink-public-homepage" className="min-h-screen flex flex-col bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      
      {/* Dynamic SEO Meta Tags & Schema */}
      <SEOHead />

      {/* Header */}
      <LandingHeader
        onLogin={onLogin}
        onRegister={onRegister}
        onGetStarted={onGetStarted}
        onAdminLogin={onAdminLogin}
        onNavigateSection={handleNavigateSection}
      />

      {/* Live Homepage Announcement Banner Ticker */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <UserAnnouncementBanner 
          variant="homepage" 
          onNavigate={handleAnnouncementNavigate} 
        />
      </div>

      {/* Main Content Sections */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <LandingHero
          onGetStarted={onGetStarted}
          onExploreServices={onExploreServices}
          onLogin={onLogin}
        />

        {/* Trust Section */}
        <LandingTrustSection />

        {/* Services Preview */}
        <LandingServicesPreview
          onSelectService={onSelectService}
          onExploreAll={onExploreServices}
        />

        {/* How It Works */}
        <LandingHowItWorks onGetStarted={onGetStarted} />

        {/* Call To Action */}
        <LandingCTASection
          onRegister={onRegister}
          onContactSales={handleContactSales}
        />

      </main>

      {/* Footer */}
      <LandingFooter
        onNavigateSection={handleNavigateSection}
        onLogin={onLogin}
        onRegister={onRegister}
        onAdminLogin={onAdminLogin}
        onNavigateLegal={onNavigateLegal}
      />
    </div>
  );
};

export default SmartLinkLandingPage;
