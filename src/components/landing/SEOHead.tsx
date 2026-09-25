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
      document.documentElement.lang = "en";
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
    setMetaTag("property", "og:image:alt", `${title} - Verification & Fintech Portal`);
    setMetaTag("property", "og:locale", "en_NG");

    // Twitter Card Meta Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:site", "@smartlinkng");
    setMetaTag("name", "twitter:creator", "@smartlinkng");
    setMetaTag("name", "twitter:url", canonicalUrl);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", `${canonicalUrl}/og-image.png`);
    setMetaTag("name", "twitter:image:alt", `${title} - Verification & Fintech Portal`);

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
          "logo": `${canonicalUrl}/logo.webp`,
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
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "SmartLink Digital Identity & Utility Services",
            "itemListElement": [
              {
                "@type": "OfferCatalog",
                "name": "Identity & Legal Verification",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "NIN Verification & Plastic Slip Generation",
                      "description": "Instant 11-digit NIN and 16-character Virtual NIN (vNIN) lookup with standard/premium PDF slips and double-sided CR80 plastic card layouts."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "BVN Verification & Digital Card",
                      "description": "Central NIBSS-connected Bank Verification Number validation and printable credential cards."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "CAC Business Name & Company Registration",
                      "description": "Accredited Corporate Affairs Commission Business Name (BN) and Limited Liability Company (LTD) registration in 48-72 hours."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "SCUML AML Compliance Certificate",
                      "description": "EFCC Special Control Unit Against Money Laundering certificate filing for opening corporate bank accounts."
                    }
                  }
                ]
              },
              {
                "@type": "OfferCatalog",
                "name": "Utilities & Telecom Vending",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Prepaid Electricity Disco Meter Tokens",
                      "description": "Instant 20-digit STS meter tokens for IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, EEDC, PHED, JEDC, KEDCO, BEDC, and YEDC with zero convenience fee."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "SME & Corporate Mobile Data Bundles",
                      "description": "30-day validity MTN, Airtel, Glo, and 9mobile data bundles starting from ₦240/GB with automated sub-second disbursement."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Educational Exam Result Tokens",
                      "description": "Official WAEC Direct Scratch Card PINs, NECO Result Tokens, and NABTEB pins delivered instantly on-screen and via SMS."
                    }
                  }
                ]
              }
            ]
          }
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
              "name": "Where can I verify NIN and download standard or premium NIN slips in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SmartLink NG (https://smartlinkng.com.ng/verification) provides instant National Identity Number (NIN) and Virtual NIN (vNIN) verification with instant downloads of official standard PDF slips and high-resolution CR80 plastic card layouts containing scannable QR codes."
              }
            },
            {
              "@type": "Question",
              "name": "Where can I buy cheap MTN, Airtel, Glo, and 9mobile SME data in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SmartLink NG (https://smartlinkng.com.ng/data) offers 30-day SME and Corporate Gifting data bundles across MTN, Airtel, Glo, and 9mobile starting from ₦240 per GB with automated, instant sub-second delivery."
              }
            },
            {
              "@type": "Question",
              "name": "How do I register a business name or company with CAC in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "On SmartLink NG (https://smartlinkng.com.ng/cac), you can reserve business names and complete full CAC Business Name (BN) or Limited Liability Company (LTD) registration within 48 to 72 hours with accredited professionals."
              }
            },
            {
              "@type": "Question",
              "name": "Where can I buy prepaid electricity Disco meter tokens online with zero extra charge?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SmartLink NG (https://smartlinkng.com.ng/bills) generates instant 20-digit STS prepaid meter tokens for all 11 Nigerian electricity Discos (IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, EEDC, PHED, JEDC, KEDCO, BEDC, YEDC) with 0% convenience fees."
              }
            },
            {
              "@type": "Question",
              "name": "How do developers integrate Nigerian NIN verification and bills APIs?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SmartLink NG Developer API (https://smartlinkng.com.ng/api-docs) provides RESTful JSON endpoints with sub-450ms latency for NIN, BVN, electricity meter tokens, SME data, VTU airtime, and dedicated virtual bank accounts."
              }
            },
            {
              "@type": "Question",
              "name": "How does wallet funding work on SmartLink NG?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every registered user and agent receives automated dedicated virtual bank account numbers (Wema Bank, Moniepoint, Sterling, Providus). Any bank transfer made to your virtual account is credited to your SmartLink wallet balance in real time with zero manual confirmation. Debit cards and instant online checkouts are also supported."
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
