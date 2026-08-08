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
import { Sparkles } from "lucide-react";

interface SmartLinkLandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onAdminLogin?: () => void;
  onExploreServices: () => void;
  onSelectService?: (serviceId: string) => void;
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

      {/* Main Content Sections */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <LandingHero
          onGetStarted={onGetStarted}
          onExploreServices={onExploreServices}
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
      />

    </div>
  );
};

export default SmartLinkLandingPage;
