/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request } from "express";
import { readDB } from "../db";

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogType: string;
  ogImage: string;
  ogImageWidth: number;
  ogImageHeight: number;
  ogImageAlt: string;
  twitterCard: "summary" | "summary_large_image";
  structuredData?: object;
}

const DEFAULT_TITLE = "Smart Link NG | NIN, BVN, CAC, SCUML, Bills, Airtime & Data Portal in Nigeria";
const DEFAULT_DESCRIPTION = "Nigeria's all-in-one digital portal for NIN Verification & Slip/ID Card Printing, BVN Validation, CAC Business Name Registration & Filing, SCUML Certificates, High Court Affidavits, Electricity Disco Meter Tokens, Cheap VTU Airtime & SME Data Bundles (MTN, Airtel, Glo, 9mobile), Cable TV Subscriptions (DSTV, GOtv, StarTimes), Exam Result Scratch Cards (WAEC, NECO, NABTEB), and Developer Verification APIs.";
const DEFAULT_KEYWORDS = "Smart Link NG, SmartLink Nigeria, NIN Verification, BVN Verification, CAC Registration, SCUML Certificate, Airtime VTU, SME Data Bundles, Electricity Bills Nigeria, Identity Verification API, WAEC Result Checker, NECO Token, Fintech Nigeria";
const DEFAULT_DOMAIN = "https://smartlinkng.com.ng";

export function resolveSEOMetadata(req: Request): SEOMetadata {
  let db: any = {};
  try {
    db = readDB();
  } catch (err) {
    // fallback gracefully
  }

  const branding = db?.brandingSettings || db?.branding_settings || {};
  const siteName = branding.siteName || "Smart Link NG";
  const siteDescription = branding.siteDescription || branding.description || DEFAULT_DESCRIPTION;

  // Resolve Host / Base URL
  const host = req.headers["x-forwarded-host"] || req.headers.host || "smartlinkng.com.ng";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const origin = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("ais-")
    ? `${protocol}://${host}`
    : DEFAULT_DOMAIN;

  const rawPath = (req.originalUrl || req.url || "/").split("?")[0];
  const canonicalUrl = `${origin}${rawPath === "/" ? "" : rawPath}`;
  const ogImageUrl = `${origin}/og-image.png`;

  let title = `${siteName} | Enterprise E-Government & Fintech Gateway`;
  let description = siteDescription;
  let keywords = DEFAULT_KEYWORDS;
  const ogType = "website";

  // Route-specific SEO optimization
  if (rawPath.startsWith("/explore-services") || rawPath.startsWith("/services")) {
    title = `Explore Digital Services & Verification Solutions | ${siteName}`;
    description = "Access instant NIN & BVN Slips, CAC Business Registrations, Utility Bill Payments, Airtime & Data VTU, and SCUML processing across Nigeria.";
    keywords = "NIN Slip, BVN card, CAC registration, SCUML certificate, utility bill payments, VTU airtime, Nigeria digital gateway";
  } else if (rawPath.startsWith("/verification") || rawPath.startsWith("/nin") || rawPath.startsWith("/bvn") || rawPath.startsWith("/cac")) {
    title = `Instant Identity Verification Portal (NIN, BVN, CAC) | ${siteName}`;
    description = "Verify National Identity Numbers, Bank Verification Numbers, and CAC Corporate entities in real-time with downloadable digital slips and premium cards.";
    keywords = "NIN verification, BVN validation, CAC business search, identity slip download, corporate affairs commission Nigeria";
  } else if (rawPath.startsWith("/bills") || rawPath.startsWith("/bill-payment") || rawPath.startsWith("/vtu")) {
    title = `Electricity, Airtime & VTU Utility Payments | ${siteName}`;
    description = "Pay electricity Disco prepaid/postpaid tokens, buy cheap data and airtime for MTN, Airtel, Glo & 9mobile, and recharge DSTV/GOtv with instant delivery.";
    keywords = "Electricity payment Nigeria, buy data VTU, MTN cheap data, pay DSTV, buy airtime online, disco token recharge";
  } else if (rawPath.startsWith("/api-docs") || rawPath.startsWith("/developer-api") || rawPath.startsWith("/docs")) {
    title = `Developer API Documentation & Gateway | ${siteName}`;
    description = "Integrate identity verification, virtual accounts, and automated VTU bill payments into your fintech applications with SmartLink high-availability REST APIs.";
    keywords = "Fintech API Nigeria, NIN API, BVN verification API, VTU API documentation, bill payment developer gateway";
  } else if (rawPath.startsWith("/terms") || rawPath.startsWith("/privacy") || rawPath.startsWith("/compliance") || rawPath.startsWith("/legal")) {
    title = `Terms of Service, Privacy & Regulatory Compliance | ${siteName}`;
    description = "Review the legal terms of service, privacy policy, NDPR compliance, and regulatory governance for SmartLink Nigeria Digital Platform.";
    keywords = "SmartLink terms of service, privacy policy, NDPR compliance, data protection Nigeria, regulatory notice";
  } else if (rawPath.startsWith("/auth") || rawPath.startsWith("/login") || rawPath.startsWith("/register")) {
    title = `Secure Agent & Business Portal Login | ${siteName}`;
    description = "Sign in or create your SmartLink Nigeria enterprise account to access identity services, digital wallets, bill payments, and developer API keys.";
  }

  const graph: any[] = [
    {
      "@type": "FinancialService",
      "@id": `${origin}/#organization`,
      "name": siteName,
      "url": origin,
      "logo": `${origin}/logo.png`,
      "image": ogImageUrl,
      "description": siteDescription,
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
        "contactType": "customer support",
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
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      "url": origin,
      "name": siteName,
      "description": siteDescription,
      "publisher": {
        "@id": `${origin}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${origin}/explore-services?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${origin}/#software`,
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
        "bestRating": "5",
        "worstRating": "1"
      },
      "featureList": [
        "Instant National Identity Number (NIN) verification & PDF slip printing",
        "Bank Verification Number (BVN) validation & premium ID card formatting",
        "Corporate Affairs Commission (CAC) business name registration & filing",
        "SCUML Anti-Money Laundering certificate application processing",
        "Automated Electricity Disco token recharge (IKEDC, EKEDC, AEDC, IBEDC, etc.)",
        "VTU Airtime & cheap data bundles across MTN, Airtel, Glo, and 9mobile",
        "DSTV, GOtv & StarTimes cable TV subscription renewal",
        "High-performance REST API gateway for fintechs, agents, and business platforms"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": `${origin}/#faq`,
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
            "text": "You can verify your National Identity Number (NIN) instantly on SmartLink NG by providing your 11-digit NIN or registered phone number. The portal retrieves verified data directly from official databases and generates downloadable standard/premium PDF slips with QR codes in seconds."
          }
        },
        {
          "@type": "Question",
          "name": "How long does BVN verification and plastic card generation take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "BVN verification on SmartLink NG is instantaneous. Once confirmed, you can download a formatted BVN identity slip or print-ready plastic card layout immediately."
          }
        },
        {
          "@type": "Question",
          "name": "Can I register my business with the Corporate Affairs Commission (CAC) through SmartLink?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, SmartLink NG provides CAC business name reservation, full enterprise registration, status report retrieval, and post-incorporation filing support handled by accredited professionals."
          }
        },
        {
          "@type": "Question",
          "name": "Which utility bills and telecom services can I pay on SmartLink NG?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SmartLink NG supports prepaid and postpaid electricity tokens for all Nigerian Discos (IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, etc.), instant VTU data and airtime across MTN, Airtel, Glo, and 9mobile, and cable TV renewals for DSTV, GOtv, and StarTimes."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${origin}/#breadcrumbs`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `${origin}/`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Services Catalog",
          "item": `${origin}/explore-services`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Identity Verification",
          "item": `${origin}/verification`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Utility Bill Payments",
          "item": `${origin}/bills`
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Developer API",
          "item": `${origin}/api-docs`
        }
      ]
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    ogType,
    ogImage: ogImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: `${siteName} - Verification & Fintech Gateway`,
    twitterCard: "summary_large_image",
    structuredData
  };
}

/**
 * Injects dynamic SEO and Social Sharing (OG/Twitter) meta tags into raw index.html.
 */
export function injectSEOTags(html: string, metadata: SEOMetadata): string {
  const metaTags = `
    <!-- Primary SEO Meta Tags -->
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="title" content="${escapeHtml(metadata.title)}" />
    <meta name="description" content="${escapeHtml(metadata.description)}" />
    <meta name="keywords" content="${escapeHtml(metadata.keywords)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="SmartLink Nigeria Technology" />
    <meta http-equiv="content-language" content="en-NG" />
    <meta name="language" content="English" />
    
    <!-- Canonical & Alternate Localization (hreflang) Tags -->
    <link rel="canonical" href="${metadata.canonicalUrl}" />
    <link rel="alternate" hreflang="en-NG" href="${metadata.canonicalUrl}" />
    <link rel="alternate" hreflang="en" href="${metadata.canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${metadata.canonicalUrl}" />

    <!-- Geo & Regional Meta Tags (Nigeria) -->
    <meta name="geo.region" content="NG" />
    <meta name="geo.placename" content="Lagos, Nigeria" />
    <meta name="geo.position" content="9.0820;8.6753" />
    <meta name="ICBM" content="9.0820, 8.6753" />
    <meta name="theme-color" content="#0F2D5C" />

    <!-- Open Graph / Facebook / WhatsApp Social Previews -->
    <meta property="og:type" content="${metadata.ogType}" />
    <meta property="og:site_name" content="Smart Link Nigeria Digital Platform" />
    <meta property="og:url" content="${metadata.canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:image" content="${metadata.ogImage}" />
    <meta property="og:image:secure_url" content="${metadata.ogImage}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="${metadata.ogImageWidth}" />
    <meta property="og:image:height" content="${metadata.ogImageHeight}" />
    <meta property="og:image:alt" content="${escapeHtml(metadata.ogImageAlt)}" />
    <meta property="og:locale" content="en_NG" />

    <!-- Twitter / X Card Meta Tags -->
    <meta name="twitter:card" content="${metadata.twitterCard}" />
    <meta name="twitter:site" content="@smartlinkng" />
    <meta name="twitter:creator" content="@smartlinkng" />
    <meta name="twitter:url" content="${metadata.canonicalUrl}" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />
    <meta name="twitter:image" content="${metadata.ogImage}" />
    <meta name="twitter:image:alt" content="${escapeHtml(metadata.ogImageAlt)}" />

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
      ${JSON.stringify(metadata.structuredData)}
    </script>
  `;

  // Remove existing <title> from HTML if present to prevent duplication
  let updatedHtml = html.replace(/<title>[\s\S]*?<\/title>/gi, "");

  // Remove existing dynamic meta tags if any
  updatedHtml = updatedHtml
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "");

  // Inject right before </head>
  if (updatedHtml.includes("</head>")) {
    return updatedHtml.replace("</head>", `${metaTags}\n  </head>`);
  }

  return `${metaTags}\n${updatedHtml}`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates an XML Sitemap adhering to sitemaps.org standards
 */
export function generateSitemapXml(origin: string = DEFAULT_DOMAIN): string {
  const currentDate = new Date().toISOString().split("T")[0];
  const pages = [
    { path: "", priority: "1.00", changefreq: "daily", image: `${origin}/og-image.png`, title: "SmartLink Nigeria Digital Enterprise Gateway" },
    { path: "/explore-services", priority: "0.90", changefreq: "daily" },
    { path: "/verification", priority: "0.85", changefreq: "weekly" },
    { path: "/bills", priority: "0.85", changefreq: "weekly" },
    { path: "/api-docs", priority: "0.80", changefreq: "weekly" },
    { path: "/developer-api", priority: "0.80", changefreq: "weekly" },
    { path: "/terms", priority: "0.60", changefreq: "monthly" },
    { path: "/privacy", priority: "0.60", changefreq: "monthly" },
    { path: "/compliance", priority: "0.60", changefreq: "monthly" },
    { path: "/refund-policy", priority: "0.50", changefreq: "monthly" },
    { path: "/security", priority: "0.50", changefreq: "monthly" },
    { path: "/sla", priority: "0.50", changefreq: "monthly" },
  ];

  const urls = pages.map((page) => {
    const loc = `${origin}${page.path ? page.path : "/"}`;
    const imageBlock = page.image
      ? `\n    <image:image>\n      <image:loc>${page.image}</image:loc>\n      <image:title>${escapeHtml(page.title || "")}</image:title>\n    </image:image>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>${imageBlock}\n  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`;
}

/**
 * Generates dynamic robots.txt content referencing the correct sitemap location
 */
export function generateRobotsTxt(origin: string = DEFAULT_DOMAIN): string {
  return `# ==============================================================================
# SmartLink Nigeria Digital Platform - Search Engine Robots Directives
# Website: ${origin}
# ==============================================================================

User-agent: *
Allow: /
Allow: /explore-services
Allow: /verification
Allow: /bills
Allow: /api-docs
Allow: /developer-api
Allow: /terms
Allow: /privacy
Allow: /compliance
Allow: /refund-policy
Allow: /security
Allow: /sla
Allow: /og-image.png
Allow: /logo.png
Allow: /favicon.png
Allow: /assets/

# Disallow Private Administration, Authentication & Dashboard Endpoints
Disallow: /admin
Disallow: /admin/
Disallow: /admin/*
Disallow: /api/
Disallow: /api/*
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /dashboard/*
Disallow: /wallet/
Disallow: /wallet/*
Disallow: /reset-password
Disallow: /verify-token

# Crawl Delay & Sitemap Reference
Crawl-delay: 1
Sitemap: ${origin}/sitemap.xml
`;
}

