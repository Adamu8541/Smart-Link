/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "SmartLink Nigeria: Secure Identity Verification & Payment APIs",
  description = "SmartLink Nigeria provides reliable digital identity verification (NIN, BVN, CAC), instant utility payments, and robust APIs for developers and businesses. Verified. Instant. Secure.",
  canonicalUrl = "https://smartlinkng.com.ng",
}) => {
  useEffect(() => {
    // Update Document Title
    document.title = title;

    // Helper to update or create meta tag
    const setMetaTag = (attribute: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "viewport", "width=device-width, initial-scale=1.0");
    setMetaTag("name", "author", "SmartLink Nigeria Technology");
    setMetaTag("name", "keywords", "SmartLink Nigeria, NIN Verification, BVN Verification, CAC Registration, Utility Bills, Airtime VTU, Nigeria Verification API, Fintech Nigeria");

    // Open Graph / Facebook Meta Tags
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:site_name", "SmartLink Nigeria");
    setMetaTag("property", "og:locale", "en_NG");

    // Twitter Card Meta Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:url", canonicalUrl);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    // Organization Structured Data (JSON-LD)
    const schemaId = "smartlink-nigeria-org-schema";
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.id = schemaId;
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "name": "SmartLink Nigeria",
      "url": canonicalUrl,
      "logo": "https://smartlinkng.com.ng/assets/logo.png",
      "description": description,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "NG",
        "addressLocality": "Lagos",
        "addressRegion": "Lagos State"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+234 808 549 0982",
        "contactType": "customer service",
        "email": "Smartlinkcomputerbusiness@gmail.com",
        "availableLanguage": ["English", "Hausa", "Yoruba", "Igbo"]
      },
      "sameAs": [
        "https://facebook.com/smartlinkng",
        "https://twitter.com/smartlinkng",
        "https://instagram.com/smartlinkng",
        "https://linkedin.com/company/smartlinkng"
      ]
    };

    scriptElement.textContent = JSON.stringify(orgSchema);

  }, [title, description, canonicalUrl]);

  return null;
};

export default SEOHead;
