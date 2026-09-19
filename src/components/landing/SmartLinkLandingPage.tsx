/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense } from "react";
import SEOHead from "./SEOHead";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";
import { lazyWithRetry } from "../../utils/lazyRetry";

// Below-the-fold sections lazy loaded with automatic retry
const LandingTrustSection = lazyWithRetry(() => import("./LandingTrustSection"), "LandingTrustSection");
const LandingServicesPreview = lazyWithRetry(() => import("./LandingServicesPreview"), "LandingServicesPreview");
const LandingHowItWorks = lazyWithRetry(() => import("./LandingHowItWorks"), "LandingHowItWorks");
const LandingFAQSection = lazyWithRetry(() => import("./LandingFAQSection"), "LandingFAQSection");
const LandingContactSection = lazyWithRetry(() => import("./LandingContactSection"), "LandingContactSection");
const LandingCTASection = lazyWithRetry(() => import("./LandingCTASection"), "LandingCTASection");
const LandingFooter = lazyWithRetry(() => import("./LandingFooter"), "LandingFooter");
const UserAnnouncementBanner = lazyWithRetry(() => import("../notification/UserAnnouncementBanner").then(m => ({ default: m.UserAnnouncementBanner })), "UserAnnouncementBanner");

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
        <UserAnnouncementBanner 
          variant="homepage" 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1"
          onNavigate={handleAnnouncementNavigate} 
        />
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

          {/* Contact Section */}
          <div className="content-visibility-auto">
            <LandingContactSection 
              onNavigateFAQ={() => handleNavigateSection("faq-section")}
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

      {/* Footer - blocked completely when user logged in, appears only on homepage */}
      {!currentUser && (
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
      )}
    </div>
  );
};

export default SmartLinkLandingPage;
