/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import SEOHead from "./SEOHead";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";
import LandingTrustSection from "./LandingTrustSection";
import LandingServicesPreview from "./LandingServicesPreview";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingFAQSection from "./LandingFAQSection";
import LandingContactSection from "./LandingContactSection";
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
  currentUser?: any;
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
  currentUser,
}) => {
  const [activeInfoTab, setActiveInfoTab] = useState<"about" | "contact" | null>(null);

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === "about-section") {
      setActiveInfoTab("about");
      return;
    }
    if (sectionId === "contact-section" || sectionId === "contact") {
      const el = document.getElementById("contact-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        setActiveInfoTab("contact");
      }
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
    <div id="smartlink-public-homepage" className="w-full flex-1 flex flex-col font-sans">
      
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
      <main className="grow">
        
        {/* Hero Section */}
        <LandingHero
          onGetStarted={onGetStarted}
          onExploreServices={onExploreServices}
          onLogin={onLogin}
        />

        {/* Live Homepage Announcement Banner Ticker */}
        <UserAnnouncementBanner 
          variant="homepage" 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"
          onNavigate={handleAnnouncementNavigate} 
        />

        {/* Trust Section */}
        <div>
          <LandingTrustSection />
        </div>

        {/* Services Preview */}
        <div>
          <LandingServicesPreview
            onSelectService={onSelectService}
            onExploreAll={onExploreServices}
          />
        </div>

        {/* How It Works */}
        <div>
          <LandingHowItWorks onGetStarted={onGetStarted} />
        </div>

        {/* FAQs */}
        <div>
          <LandingFAQSection 
            onContactSupport={handleContactSales}
            onGetStarted={onGetStarted}
          />
        </div>

        {/* Contact Section */}
        <div>
          <LandingContactSection 
            onNavigateFAQ={() => handleNavigateSection("faq-section")}
          />
        </div>

        {/* Call To Action */}
        <div>
          <LandingCTASection
            onRegister={onRegister}
            onContactSales={handleContactSales}
          />
        </div>

      </main>

      {/* Footer - blocked completely when user logged in, appears only on homepage */}
      {!currentUser && (
        <LandingFooter
          onNavigateSection={handleNavigateSection}
          onLogin={onLogin}
          onRegister={onRegister}
          onAdminLogin={onAdminLogin}
          onNavigateLegal={onNavigateLegal}
          activeInfoTab={activeInfoTab}
          setActiveInfoTab={setActiveInfoTab}
        />
      )}
    </div>
  );
};

export default SmartLinkLandingPage;
