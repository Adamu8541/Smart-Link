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
  title = "Smart Link NG | NIN, BVN, CAC, SCUML, Bills, Airtime & Data Portal in Nigeria",
  description = "Nigeria's all-in-one digital portal for NIN Verification & Slip/ID Card Printing, BVN Validation, CAC Business Name Registration & Filing, SCUML Certificates, High Court Affidavits, Electricity Disco Meter Tokens, Cheap VTU Airtime & SME Data Bundles (MTN, Airtel, Glo, 9mobile), Cable TV Subscriptions (DSTV, GOtv, StarTimes), Exam Result Scratch Cards (WAEC, NECO, NABTEB), and Developer Verification APIs.",
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

    // Helper to update or create link tag
    const setLinkTag = (rel: string, href: string, extraAttributes: Record<string, string> = {}) => {
      let selector = `link[rel="${rel}"]`;
      if (extraAttributes.hreflang) {
        selector += `[hreflang="${extraAttributes.hreflang}"]`;
      }
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        Object.entries(extraAttributes).forEach(([k, v]) => element!.setAttribute(k, v));
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "viewport", "width=device-width, initial-scale=1.0");
    setMetaTag("name", "author", "Smart Link NG Technology");
    setMetaTag("name", "keywords", "Smart Link NG, SmartLink Nigeria, NIN Verification, BVN Verification, CAC Registration, SCUML Certificate, Airtime VTU, SME Data Bundles, Electricity Bills Nigeria, Identity Verification API, WAEC Result Checker, NECO Token, Fintech Nigeria");
    setMetaTag("http-equiv", "content-language", "en-NG");
    setMetaTag("name", "language", "English");

    // Canonical & Localization Links
    setLinkTag("canonical", canonicalUrl);
    setLinkTag("alternate", canonicalUrl, { hreflang: "en-NG" });
    setLinkTag("alternate", canonicalUrl, { hreflang: "en" });
    setLinkTag("alternate", canonicalUrl, { hreflang: "x-default" });

    // Geo & Regional Meta Tags (Nigeria)
    setMetaTag("name", "geo.region", "NG");
    setMetaTag("name", "geo.placename", "Lagos, Nigeria");
    setMetaTag("name", "geo.position", "9.0820;8.6753");
    setMetaTag("name", "ICBM", "9.0820, 8.6753");
    setMetaTag("name", "theme-color", "#0F2D5C");

    // HTML root language
    if (document.documentElement) {
      document.documentElement.lang = "en-NG";
      document.documentElement.dir = "ltr";
    }

    // Open Graph / Facebook Meta Tags
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:site_name", "SmartLink Nigeria Digital Platform");
    setMetaTag("property", "og:image", `${canonicalUrl}/og-image.png`);
    setMetaTag("property", "og:image:secure_url", `${canonicalUrl}/og-image.png`);
    setMetaTag("property", "og:image:type", "image/png");
    setMetaTag("property", "og:image:width", "1200");
    setMetaTag("property", "og:image:height", "630");
    setMetaTag("property", "og:image:alt", `${title} - Verification & Fintech Gateway`);
    setMetaTag("property", "og:locale", "en_NG");

    // Twitter Card Meta Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:site", "@smartlinkng");
    setMetaTag("name", "twitter:creator", "@smartlinkng");
    setMetaTag("name", "twitter:url", canonicalUrl);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", `${canonicalUrl}/og-image.png`);
    setMetaTag("name", "twitter:image:alt", `${title} - Verification & Fintech Gateway`);

    // Rich Structured Data Graph (JSON-LD)
    const schemaId = "smartlink-nigeria-rich-schema";
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.id = schemaId;
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }

    const richSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "FinancialService",
          "@id": `${canonicalUrl}/#organization`,
          "name": "SmartLink Nigeria Digital Platform",
          "url": canonicalUrl,
          "logo": `${canonicalUrl}/logo.png`,
          "image": `${canonicalUrl}/og-image.png`,
          "description": description,
          "telephone": "+234 808 549 0982",
          "email": "Smartlinkcomputerbusiness@gmail.com",
          "priceRange": "₦100 - ₦50,000",
          "currenciesAccepted": "NGN",
          "paymentAccepted": "Bank Transfer, Dedicated Virtual Account, Debit Card, Wallet Balance",
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
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${canonicalUrl}/#software`,
          "name": "SmartLink Nigeria Digital Hub",
          "operatingSystem": "Web, Android, iOS, Windows, macOS",
          "applicationCategory": "BusinessApplication, FinanceApplication",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "NGN",
            "lowPrice": "100",
            "highPrice": "50000",
            "offerCount": "25"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1420",
            "ratingCount": "1580",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "@id": `${canonicalUrl}/#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does wallet funding work on SmartLink NG?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every registered user and agent receives automated dedicated virtual bank account numbers (Wema Bank, Moniepoint, Sterling, Providus). Any bank transfer made to your virtual account is credited to your SmartLink wallet balance in real time with zero manual confirmation. Debit cards and instant online checkouts are also supported."
              }
            },
            {
              "@type": "Question",
              "name": "How do developers integrate SmartLink's identity verification and VTU APIs?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Developers can generate live and sandbox API keys directly from their dashboard. We offer high-performance RESTful JSON endpoints with sub-450ms response latency, complete Postman collections, standardized response codes, and automated webhook notifications for wallet debits, meter tokens, and verification lookups."
              }
            },
            {
              "@type": "Question",
              "name": "What are the requirements for CAC Business Name & Company Registration?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To register a Business Name or Company with CAC, you need: 1) Two proposed business names for reservation, 2) Nature and description of business activities, 3) Valid government-issued ID (NIN, Driver's License, or Intl Passport), 4) Passport photograph and signature image, and 5) Official business address and contact phone/email. Our accredited agents process your filing end-to-end within 48 to 72 hours."
              }
            },
            {
              "@type": "Question",
              "name": "How do I verify and download my NIN Slip in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Verify your National Identity Number (NIN) instantly on SmartLink NG by providing your 11-digit NIN or registered phone number. The portal retrieves verified data directly from official databases and generates downloadable standard/premium PDF slips with QR codes in seconds."
              }
            },
            {
              "@type": "Question",
              "name": "How long does BVN verification and plastic card generation take?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "BVN verification on SmartLink NG is instantaneous. The system matches bank-grade records, validates account holder demography, and allows you to print or download a formatted BVN identity card and slip within seconds."
              }
            },
            {
              "@type": "Question",
              "name": "Can I register my business with CAC through SmartLink?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, SmartLink NG provides CAC business name reservation, full enterprise registration, status report retrieval, and post-incorporation filing support handled by accredited professionals."
              }
            }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}/#breadcrumbs`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${canonicalUrl}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Services",
              "item": `${canonicalUrl}/explore-services`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Verification",
              "item": `${canonicalUrl}/verification`
            }
          ]
        }
      ]
    };

    scriptElement.textContent = JSON.stringify(richSchema);

  }, [title, description, canonicalUrl]);

  return null;
};

export default SEOHead;
