/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from "react";
import SEOHead from "./SEOHead";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";

const LandingTrustSection = lazy(() => import("./LandingTrustSection"));
const LandingServicesPreview = lazy(() => import("./LandingServicesPreview"));
const LandingHowItWorks = lazy(() => import("./LandingHowItWorks"));
const LandingFAQSection = lazy(() => import("./LandingFAQSection"));
const LandingCTASection = lazy(() => import("./LandingCTASection"));
const LandingFooter = lazy(() => import("./LandingFooter"));
const UserAnnouncementBanner = lazy(() => import("../notification/UserAnnouncementBanner").then(m => ({ default: m.UserAnnouncementBanner })));

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
  const [activeInfoTab, setActiveInfoTab] = useState<"about" | "contact" | null>(null);

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === "about-section") {
      setActiveInfoTab("about");
      return;
    }
    if (sectionId === "contact-section") {
      setActiveInfoTab("contact");
      return;
    }
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
    <div id="smartlink-public-homepage" className="min-h-screen flex flex-col bg-white font-sans text-[#111827] antialiased selection:bg-[#0F2D5C] selection:text-white">
      
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
      <Suspense fallback={null}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
          <UserAnnouncementBanner 
            variant="homepage" 
            onNavigate={handleAnnouncementNavigate} 
          />
        </div>
      </Suspense>

      {/* Main Content Sections */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <LandingHero
          onGetStarted={onGetStarted}
          onExploreServices={onExploreServices}
          onLogin={onLogin}
        />

        <Suspense fallback={null}>
          {/* Trust Section */}
          <div className="content-visibility-auto">
            <LandingTrustSection />
          </div>

          {/* Services Preview */}
          <div className="content-visibility-auto">
            <LandingServicesPreview
              onSelectService={onSelectService}
              onExploreAll={onExploreServices}
            />
          </div>

          {/* How It Works */}
          <div className="content-visibility-auto">
            <LandingHowItWorks onGetStarted={onGetStarted} />
          </div>

          {/* FAQs */}
          <div className="content-visibility-auto">
            <LandingFAQSection 
              onContactSupport={handleContactSales}
              onGetStarted={onGetStarted}
            />
          </div>

          {/* Call To Action */}
          <div className="content-visibility-auto">
            <LandingCTASection
              onRegister={onRegister}
              onContactSales={handleContactSales}
            />
          </div>
        </Suspense>

      </main>

      {/* Footer */}
      <Suspense fallback={null}>
        <LandingFooter
          onNavigateSection={handleNavigateSection}
          onLogin={onLogin}
          onRegister={onRegister}
          onAdminLogin={onAdminLogin}
          onNavigateLegal={onNavigateLegal}
          activeInfoTab={activeInfoTab}
          setActiveInfoTab={setActiveInfoTab}
        />
      </Suspense>
    </div>
  );
};

export default SmartLinkLandingPage;
