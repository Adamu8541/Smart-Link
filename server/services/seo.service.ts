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
  crawlableContentHtml?: string;
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

  const rawPath = (req.originalUrl || req.url || "/").split("?")[0].toLowerCase();
  const canonicalUrl = `${origin}${rawPath === "/" ? "" : rawPath}`;
  const ogImageUrl = `${origin}/og-image.png`;

  let title = `${siteName} | NIN, BVN, CAC, SCUML, Bills, Airtime & Data Portal in Nigeria`;
  let description = siteDescription;
  let keywords = DEFAULT_KEYWORDS;
  const ogType = "website";
  let crawlableContentHtml = "";

  // 1. API Documentation & Developer Gateway
  if (rawPath === "/api-docs" || rawPath === "/developer-api" || rawPath === "/docs" || rawPath.startsWith("/api-docs/")) {
    title = `Developer REST API Documentation & Fintech Gateway | ${siteName}`;
    description = "Integrate identity verification (NIN, BVN), automated VTU airtime/data vending, dedicated virtual accounts, and electricity meter bill payments into your apps with sub-450ms REST APIs.";
    keywords = "Fintech API Nigeria, NIN API, BVN verification API, VTU API documentation, bill payment developer gateway, identity verification REST endpoints, Nigerian developer documentation";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Developer REST API &amp; Webhooks Documentation</h1>
        <p>Integrate Nigeria's fastest digital rails directly into your software applications, agent portals, and fintech backends. Our high-performance RESTful JSON endpoints provide sub-450ms response latency with 99.9% uptime SLA.</p>
        <h2>Available API Endpoints</h2>
        <ul>
          <li><strong>POST /api/v1/nin/verify:</strong> National Identity Number validation and print-ready PDF slip generation with official QR codes.</li>
          <li><strong>POST /api/v1/bvn/verify:</strong> Bank Verification Number check across central NIBSS interbank rails.</li>
          <li><strong>POST /api/v1/vtu/airtime:</strong> Instant automated airtime top-up for MTN, Airtel, Glo, and 9mobile with cash rebates.</li>
          <li><strong>POST /api/v1/vtu/data:</strong> Wholesale SME and Corporate Gifting 30-day internet data bundle disbursement.</li>
          <li><strong>POST /api/v1/bills/electricity:</strong> 20-digit prepaid Disco electricity token recharge and postpaid settlement for all 11 Discos (IKEDC, EKEDC, AEDC, IBEDC, KAEDCO, EEDC, PHED, JED, KEDCO, BEDC, YEDC).</li>
          <li><strong>GET /api/v1/wallet/balance:</strong> Real-time wallet balance and ledger status.</li>
        </ul>
        <h2>Authentication &amp; Security</h2>
        <p>All API requests require Bearer token authentication via the <code>Authorization: Bearer sk_live_...</code> header. Webhook notifications are secured with HMAC-SHA512 cryptographic signatures.</p>
        <p><a href="/register">Sign up for an Agent / Developer Account</a> to generate your API keys instantly.</p>
      </main>
    `;
  }
  // 2. Utility Bills & VTU
  else if (rawPath === "/bills" || rawPath === "/bill-payment" || rawPath === "/electricity" || rawPath === "/data" || rawPath === "/airtime" || rawPath === "/cable-tv" || rawPath === "/exam-pins" || rawPath === "/vtu") {
    title = `Electricity Disco Tokens, Cheap SME Data & Airtime VTU | ${siteName}`;
    description = "Pay electricity prepaid/postpaid meter tokens for all 11 Discos (IKEDC, EKEDC, AEDC, IBEDC, etc.) with zero surcharge, buy cheap SME data from ₦240/GB, and recharge airtime with cashbacks.";
    keywords = "Electricity payment Nigeria, buy data VTU, MTN cheap data, pay DSTV, buy airtime online, disco token recharge, IKEDC prepaid token, EKEDC bill, AEDC token, WAEC scratch card, NECO token";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>Pay Electricity Bills, Buy Cheap SME Data &amp; Airtime VTU in Nigeria</h1>
        <p>SmartLink NG offers zero convenience fees on electricity Disco tokens, wholesale data bundles across all Nigerian networks, and instant cable TV subscriptions.</p>
        <h2>Supported Electricity Distribution Companies (Discos)</h2>
        <p>Ikeja Electric (IKEDC), Eko Electricity (EKEDC), Abuja Electricity (AEDC), Ibadan Electricity (IBEDC), Kaduna Electric (KAEDCO), Enugu Electricity (EEDC), Port Harcourt Electric (PHED), Jos Electricity (JEDC), Kano Electricity (KEDCO), Benin Electricity (BEDC), Yola Electricity (YEDC).</p>
        <h2>Cheap SME &amp; Corporate Internet Data</h2>
        <p>Get 30-day mobile data bundles on MTN, Airtel, Glo, and 9mobile starting from ₦240/GB with instant delivery and 24/7 uptime.</p>
        <h2>Cable TV Renewals &amp; Exam Result Checkers</h2>
        <p>Renew DSTV, GOtv, and StarTimes bouquets with instant signal restoration. Purchase official WAEC Direct scratch card PINs and NECO result checking tokens.</p>
        <p><a href="/register">Get Started and Fund Your Wallet</a></p>
      </main>
    `;
  }
  // 3. Regulatory Compliance
  else if (rawPath === "/compliance" || rawPath === "/legal/compliance") {
    title = `Regulatory Compliance & Governance Framework | ${siteName}`;
    description = "Full disclosure of SmartLink Nigeria regulatory licensing, Nigeria Data Protection Act (NDPA 2023) alignment, Anti-Money Laundering (AML/CFT) frameworks, and accredited corporate filings.";
    keywords = "SmartLink compliance, NDPA 2023 compliance Nigeria, AML CFT policy, SCUML compliance, CAC accredited agent, fintech governance";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Regulatory Compliance &amp; Governance Framework</h1>
        <p>SmartLink NG operates in full adherence to the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 (NDPA), Cybercrimes Act, and Anti-Money Laundering (AML/CFT) guidelines.</p>
        <h2>Data Protection (NDPA &amp; NDPR)</h2>
        <p>All identity verifications (NIN, BVN) are processed on lawful grounds of data subject consent. We enforce cryptographic audit trails and maintain a designated Data Protection Officer.</p>
        <h2>Banking &amp; Settlement Partnerships</h2>
        <p>Dedicated virtual accounts and wallet balances are held in technical partnership with CBN-licensed financial institutions (Wema Bank, Moniepoint MFB, Providus Bank, Sterling Bank) and PCI-DSS Level 1 payment switches.</p>
      </main>
    `;
  }
  // 4. Security Architecture
  else if (rawPath === "/security" || rawPath === "/legal/security") {
    title = `Security Architecture & Data Protection | ${siteName}`;
    description = "Review the cybersecurity measures, TLS 1.3 encryption, AES-256 data protection at rest, dedicated virtual account safeguarding, and role-based access controls protecting SmartLink users.";
    keywords = "SmartLink security, data protection Nigeria, TLS 1.3 encryption, AES-256 encryption, virtual account security, PCI-DSS compliant fintech";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Security &amp; Data Protection Architecture</h1>
        <p>SmartLink NG deploys multi-layer bank-grade security protocols to protect customer identities, financial ledgers, and developer API integrations.</p>
        <h2>Cryptographic Standards</h2>
        <p>All data in transit is encrypted using TLS 1.3 with strict HSTS. Sensitive data at rest is encrypted using Advanced Encryption Standard (AES-256). Passwords and credentials use salted cryptographic hashing.</p>
        <h2>Virtual Account &amp; Financial Vault Security</h2>
        <p>Financial ledgers utilize double-entry bookkeeping to prevent ledger discrepancies. Webhook endpoints enforce HMAC-SHA512 signature verification.</p>
      </main>
    `;
  }
  // 5. Service Level Agreement (SLA)
  else if (rawPath === "/sla" || rawPath === "/legal/sla") {
    title = `Service Level Agreement (SLA) & Uptime Commitments | ${siteName}`;
    description = "Read SmartLink Nigeria's 99.9% core uptime commitment, sub-10s VTU dispatch speed benchmarks, developer API latency targets, and support response matrices.";
    keywords = "SmartLink SLA, uptime commitment, fintech SLA Nigeria, API latency benchmark, customer support response matrix";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Service Level Agreement (SLA)</h1>
        <p>We commit to maintaining a 99.9% core operational uptime across our web portal, mobile access points, and developer REST APIs.</p>
        <h2>Speed Benchmarks</h2>
        <p>Airtime and SME data top-ups complete in under 10 seconds. Electricity Disco tokens generate in under 30 seconds. Identity slip downloads generate in under 15 seconds.</p>
        <h2>Support Escalation Matrix</h2>
        <p>Priority 1 critical incidents are responded to within 1 hour. Standard queries are resolved within 24 hours.</p>
      </main>
    `;
  }
  // 6. Explore Services Catalog
  else if (rawPath === "/explore-services" || rawPath === "/services") {
    title = `Explore All Digital Services & Verification Solutions | ${siteName}`;
    description = "Browse the complete catalog of SmartLink Nigeria digital services: Instant NIN & BVN Slips, CAC Business Registrations, SCUML AML Certificates, Electricity Tokens, Cheap SME Data, WAEC/NECO Scratch Cards, and Developer APIs.";
    keywords = "SmartLink services, NIN slip print, BVN card, CAC business registration, SCUML certificate, electricity token, cheap data bundles, WAEC scratch card, NECO token, developer API Nigeria";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>Explore 25+ Digital Services &amp; Verification Solutions</h1>
        <p>SmartLink NG is Nigeria's all-in-one digital portal for identity lookups, business filings, utility bill settlements, education pins, and developer verification APIs.</p>
        <h2>Featured Digital Services</h2>
        <ul>
          <li><strong>Standard NIN Slip Print:</strong> Printable official PDF slip with QR verification code.</li>
          <li><strong>Premium Plastic NIN Card:</strong> High-resolution CR80 double-sided card format.</li>
          <li><strong>BVN Verification &amp; Card:</strong> Instant central NIBSS validation and verification slip.</li>
          <li><strong>CAC Business Name Registration:</strong> Name reservation, certificate, and status report in 48-72 hours.</li>
          <li><strong>SCUML AML/CFT Certificate:</strong> Compliance documentation for corporate bank accounts.</li>
          <li><strong>Electricity Disco Tokens:</strong> Instant 20-digit prepaid tokens for all 11 Nigerian Discos.</li>
          <li><strong>Cheap SME Mobile Data:</strong> 30-day validity data bundles from ₦240/GB.</li>
          <li><strong>WAEC &amp; NECO Result PINs:</strong> Genuine electronic scratch cards with serial numbers.</li>
        </ul>
        <p><a href="/register">Sign Up to Access Services</a></p>
      </main>
    `;
  }
  // 7. Identity & Verification
  else if (rawPath === "/verification" || rawPath === "/nin" || rawPath === "/bvn" || rawPath === "/cac" || rawPath === "/scuml") {
    title = `National Identity Verification, NIN Slips, BVN & CAC Portal | ${siteName}`;
    description = "Verify National Identity Numbers (NIN), print official standard & premium plastic ID slips, validate BVN records via NIBSS, and incorporate CAC Business Names & SCUML certificates in Nigeria.";
    keywords = "NIN verification, BVN validation, CAC business search, identity slip download, national ID card print, SCUML certificate Nigeria, corporate affairs commission";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>Instant NIN Verification, BVN Validation &amp; CAC Enterprise Registration</h1>
        <p>Verify National Identity Numbers via 11-digit NIN or virtual NIN (vNIN). Generate official PDF slips with tamper-evident QR codes and print-ready plastic card layouts.</p>
        <h2>Identity Services</h2>
        <p>Standard NIN Slips, Premium Plastic Card CR80 Layouts, BVN Digital Certificates, High Court Affidavits, and Police Loss Reports.</p>
        <h2>Corporate Registry Filings</h2>
        <p>CAC Business Name Registration (BN), Private Limited Companies (LTD), CAC Status Reports, and SCUML Anti-Money Laundering certificates.</p>
        <p><a href="/register">Verify / Register Business Now</a></p>
      </main>
    `;
  }
  // 8. Privacy Policy
  else if (rawPath === "/privacy" || rawPath === "/legal/privacy-policy") {
    title = `Privacy Policy & Nigeria Data Protection Notice | ${siteName}`;
    description = "Read our comprehensive Privacy Policy outlining data collection, lawful processing under NDPA 2023, encryption standards, and user rights at SmartLink Nigeria.";
    keywords = "SmartLink privacy policy, NDPA data protection, NDPR compliance Nigeria, data privacy rights, personal data handling";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Privacy Policy</h1>
        <p>In accordance with the Nigeria Data Protection Act 2023 (NDPA) and NDPR, SmartLink NG is committed to safeguarding your personal and financial information.</p>
        <h2>Data Collection &amp; Lawful Processing</h2>
        <p>We process personal data (such as names, phone numbers, NIN, and BVN) strictly for identity verification, utility bill payment, and compliance purposes based on your explicit consent.</p>
        <h2>Your Data Subject Rights</h2>
        <p>You have the right to request access, rectification, erasure, or portability of your data by contacting our compliance desk at Smartlinkcomputerbusiness@gmail.com.</p>
      </main>
    `;
  }
  // 9. Refund Policy
  else if (rawPath === "/refund-policy" || rawPath === "/legal/refund-policy") {
    title = `Refund Policy & Dispute Resolution | ${siteName}`;
    description = "Understand our transparent refund policy, automated wallet reversals for failed transactions, and dispute escalation guidelines.";
    keywords = "SmartLink refund policy, failed transaction reversal, wallet refund, bill payment dispute Nigeria";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Refund Policy</h1>
        <p>SmartLink NG guarantees automated, friction-free wallet refunds for transactions that fail to dispense value.</p>
        <h2>Automated Reversals</h2>
        <p>If an airtime top-up, data bundle, or electricity token recharge fails at the telecom or Disco gateway, your wallet is credited back automatically in real time.</p>
      </main>
    `;
  }
  // 10. Terms of Service
  else if (rawPath === "/terms" || rawPath === "/terms-and-conditions" || rawPath === "/legal/terms-of-service") {
    title = `Terms of Service & User Agreement | ${siteName}`;
    description = "Review the official Terms of Service governing the use of SmartLink Nigeria's digital portal, wallet infrastructure, identity services, and APIs.";
    keywords = "SmartLink terms of service, user agreement, terms and conditions Nigeria fintech, legal contract";
    crawlableContentHtml = `
      <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1>SmartLink Nigeria Terms of Service</h1>
        <p>These Terms of Service govern your access to and use of SmartLink Nigeria digital services, wallet accounts, and developer APIs.</p>
        <h2>Account Responsibility &amp; Prohibited Use</h2>
        <p>Users must provide accurate information and safeguard credentials. Using the portal for unauthorized identity lookups or fraud is strictly prohibited.</p>
      </main>
    `;
  }
  // 11. Additional Legal & Information Pages
  else if (rawPath.startsWith("/legal/") || rawPath === "/wallet-terms" || rawPath === "/payment-terms" || rawPath === "/cookie-policy" || rawPath === "/kyc-notice" || rawPath === "/acceptable-use" || rawPath === "/data-protection" || rawPath === "/disclaimer" || rawPath === "/marketing-policy" || rawPath === "/legal-center" || rawPath === "/legal") {
    title = `Legal Center, Regulatory Policies & Compliance Notices | ${siteName}`;
    description = "Access all official legal documents, data protection notices, wallet terms, payment policies, and governance guidelines for SmartLink Nigeria.";
    keywords = "SmartLink legal center, wallet terms, KYC notice, acceptable use policy, cookie policy, data protection Nigeria";
  }
  // 12. Authentication Pages
  else if (rawPath.startsWith("/auth") || rawPath.startsWith("/login") || rawPath.startsWith("/register")) {
    title = `Secure Agent & Business Portal Login | ${siteName}`;
    description = "Sign in or create your SmartLink Nigeria enterprise account to access identity services, digital wallets, bill payments, and developer API keys.";
  }

  const graph: any[] = [
    {
      "@type": "FinancialService",
      "@id": `${origin}/#organization`,
      "name": siteName,
      "url": origin,
      "logo": `${origin}/logo.webp`,
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
      }
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
          "name": "Explore Services",
          "item": `${origin}/explore-services`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Verification",
          "item": `${origin}/verification`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Bills & VTU",
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
    structuredData,
    crawlableContentHtml
  };
}

/**
 * Injects dynamic SEO and Social Sharing (OG/Twitter) meta tags and crawlable semantic HTML into raw index.html.
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

  // Inject meta tags right before </head>
  if (updatedHtml.includes("</head>")) {
    updatedHtml = updatedHtml.replace("</head>", `${metaTags}\n  </head>`);
  } else {
    updatedHtml = `${metaTags}\n${updatedHtml}`;
  }

  // If crawlable semantic content is provided, inject it inside <div id="root"> or a <noscript> block
  // This allows search engine crawlers (Googlebot Wave 1) to parse 100% of the textual content instantly!
  if (metadata.crawlableContentHtml) {
    if (updatedHtml.includes('<div id="root"></div>')) {
      updatedHtml = updatedHtml.replace(
        '<div id="root"></div>',
        `<div id="root">${metadata.crawlableContentHtml}</div>`
      );
    } else if (updatedHtml.includes('<div id="root">')) {
      // replace root contents if empty or comment
      updatedHtml = updatedHtml.replace(
        /<div id="root">[\s\S]*?<\/div>/,
        `<div id="root">${metadata.crawlableContentHtml}</div>`
      );
    }
  }

  return updatedHtml;
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
 * containing ALL essential routes, priorities, and image references.
 */
export function generateSitemapXml(origin: string = DEFAULT_DOMAIN): string {
  const currentDate = new Date().toISOString().split("T")[0];
  
  const pages = [
    // 1. Homepage & Core Portals
    { path: "", priority: "1.00", changefreq: "daily", image: `${origin}/og-image.png`, title: "SmartLink Nigeria Digital Enterprise Gateway" },
    { path: "/explore-services", priority: "0.95", changefreq: "daily", image: `${origin}/og-image.png`, title: "Explore All Digital Services & Verification Solutions" },
    { path: "/services", priority: "0.95", changefreq: "daily" },
    { path: "/verification", priority: "0.90", changefreq: "weekly" },
    { path: "/nin", priority: "0.90", changefreq: "weekly" },
    { path: "/bvn", priority: "0.90", changefreq: "weekly" },
    { path: "/cac", priority: "0.90", changefreq: "weekly" },
    { path: "/scuml", priority: "0.85", changefreq: "weekly" },
    
    // 2. Utility Bills, VTU & Telecom
    { path: "/bills", priority: "0.90", changefreq: "weekly" },
    { path: "/electricity", priority: "0.90", changefreq: "weekly" },
    { path: "/data", priority: "0.90", changefreq: "weekly" },
    { path: "/airtime", priority: "0.85", changefreq: "weekly" },
    { path: "/cable-tv", priority: "0.85", changefreq: "weekly" },
    { path: "/exam-pins", priority: "0.85", changefreq: "weekly" },
    { path: "/vtu", priority: "0.85", changefreq: "weekly" },

    // 3. Developer & API Documentation
    { path: "/api-docs", priority: "0.85", changefreq: "weekly" },
    { path: "/developer-api", priority: "0.85", changefreq: "weekly" },
    { path: "/docs", priority: "0.80", changefreq: "weekly" },

    // 4. Regulatory, Governance & Compliance
    { path: "/compliance", priority: "0.80", changefreq: "monthly" },
    { path: "/security", priority: "0.80", changefreq: "monthly" },
    { path: "/sla", priority: "0.80", changefreq: "monthly" },
    { path: "/privacy", priority: "0.80", changefreq: "monthly" },
    { path: "/terms", priority: "0.80", changefreq: "monthly" },
    { path: "/refund-policy", priority: "0.75", changefreq: "monthly" },

    // 5. Legal Center & Specific Policies
    { path: "/legal-center", priority: "0.75", changefreq: "monthly" },
    { path: "/legal", priority: "0.75", changefreq: "monthly" },
    { path: "/wallet-terms", priority: "0.70", changefreq: "monthly" },
    { path: "/payment-terms", priority: "0.70", changefreq: "monthly" },
    { path: "/cookie-policy", priority: "0.70", changefreq: "monthly" },
    { path: "/kyc-notice", priority: "0.70", changefreq: "monthly" },
    { path: "/acceptable-use", priority: "0.70", changefreq: "monthly" },
    { path: "/data-protection", priority: "0.70", changefreq: "monthly" },
    { path: "/disclaimer", priority: "0.70", changefreq: "monthly" },
    { path: "/marketing-policy", priority: "0.70", changefreq: "monthly" },

    // 6. Direct Legal Subpaths
    { path: "/legal/terms-of-service", priority: "0.70", changefreq: "monthly" },
    { path: "/legal/privacy-policy", priority: "0.70", changefreq: "monthly" },
    { path: "/legal/compliance", priority: "0.70", changefreq: "monthly" },
    { path: "/legal/security", priority: "0.70", changefreq: "monthly" },
    { path: "/legal/sla", priority: "0.70", changefreq: "monthly" },
    { path: "/legal/refund-policy", priority: "0.70", changefreq: "monthly" },
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
 * Generates dynamic robots.txt content allowing all public routes and referencing the sitemap
 */
export function generateRobotsTxt(origin: string = DEFAULT_DOMAIN): string {
  return `# ==============================================================================
# SmartLink Nigeria Digital Platform - Search Engine Robots Directives
# Website: ${origin}
# ==============================================================================

User-agent: *
Allow: /
Allow: /explore-services
Allow: /services
Allow: /verification
Allow: /nin
Allow: /bvn
Allow: /cac
Allow: /scuml
Allow: /bills
Allow: /electricity
Allow: /data
Allow: /airtime
Allow: /cable-tv
Allow: /exam-pins
Allow: /vtu
Allow: /api-docs
Allow: /developer-api
Allow: /docs
Allow: /terms
Allow: /privacy
Allow: /compliance
Allow: /refund-policy
Allow: /security
Allow: /sla
Allow: /wallet-terms
Allow: /payment-terms
Allow: /cookie-policy
Allow: /kyc-notice
Allow: /acceptable-use
Allow: /data-protection
Allow: /disclaimer
Allow: /marketing-policy
Allow: /legal-center
Allow: /legal
Allow: /legal/*
Allow: /og-image.png
Allow: /logo.webp
Allow: /favicon.webp
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
