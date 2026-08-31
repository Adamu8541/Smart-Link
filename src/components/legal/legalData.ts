/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegalSection {
  id: string;
  title: string;
  content: string[];
  subsections?: {
    subtitle: string;
    points: string[];
  }[];
  callout?: {
    type: "info" | "warning" | "success" | "notice";
    text: string;
  };
}

export interface LegalDocument {
  id: string;
  slug: string;
  route: string;
  title: string;
  shortTitle: string;
  category: "LEGAL" | "PAYMENTS_WALLET" | "DATA_VERIFICATION" | "SECURITY_USE";
  categoryLabel: string;
  summary: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  readTime: string;
  iconName: string;
  highlights: string[];
  sections: LegalSection[];
  relatedDocIds: string[];
}

export const LEGAL_CATEGORIES = [
  {
    id: "ALL",
    label: "All Documents",
    description: "Complete repository of SmartLink Nigeria policies and legal disclosures",
  },
  {
    id: "LEGAL",
    label: "Legal & General",
    description: "Core terms governing account registration, general usage, and privacy compliance",
  },
  {
    id: "PAYMENTS_WALLET",
    label: "Payments & Wallet",
    description: "Terms governing stored-value digital wallet, virtual accounts, settlements, and refunds",
  },
  {
    id: "DATA_VERIFICATION",
    label: "Data & Verification",
    description: "Disclosures regarding NDPA compliance, KYC data handling, and identity lookups",
  },
  {
    id: "SECURITY_USE",
    label: "Security & Compliance",
    description: "Acceptable use guidelines, fraud prevention rules, and government disclaimers",
  },
] as const;

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  // 1. PRIVACY POLICY
  {
    id: "privacy-policy",
    slug: "privacy-policy",
    route: "/privacy",
    title: "SmartLink Nigeria Privacy Policy",
    shortTitle: "Privacy Policy",
    category: "LEGAL",
    categoryLabel: "Legal & General",
    summary:
      "Explains how SmartLink Nigeria collects, processes, stores, encrypts, and protects your personal, financial, and identity information in compliance with the Nigeria Data Protection Act (NDPA 2023) and NDPR.",
    version: "2.4.0 (Active)",
    effectiveDate: "June 12, 2024",
    lastUpdated: "April 18, 2026",
    readTime: "8 min read",
    iconName: "ShieldCheck",
    highlights: [
      "Strict compliance with Nigeria Data Protection Act (NDPA 2023) and NDPR",
      "End-to-end encryption for NIN, BVN, phone, and financial identifiers",
      "Zero unauthorized third-party sharing or monetization of personal data",
      "Comprehensive data subject rights including access, rectification, and erasure",
    ],
    relatedDocIds: ["terms-of-service", "data-protection", "cookie-policy", "kyc-notice", "marketing-policy"],
    sections: [
      {
        id: "introduction",
        title: "1. Introduction, Scope & Brand Nomenclature",
        content: [
          "Smart Link Computer Business ('SmartLink NG', 'we', 'us', or 'our', CAC Registration Number: RC 9347502) is a fully registered Nigerian enterprise committed to safeguarding your personal data and upholding the highest standards of data privacy and informational security.",
          "Corporate Nomenclature and Brand Simplification: While our statutory registered name with the Corporate Affairs Commission (CAC) is 'Smart Link Computer Business', we utilize the trade names 'SmartLink NG' and 'Smart Link Nigeria' for public-facing digital services, mobile interfaces, email correspondence, and web domains. This brand simplification is established for crucial accessibility and technical reasons: First, the registered CAC name is structurally too long for standard digital domain names (e.g. 'smartlinkcomputerbusiness.com.ng' is cumbersome, making web navigation and search query recall highly error-prone for users on mobile devices). Utilizing 'smartlinkng.com.ng' provides a punchy, highly memorable, and user-friendly digital address. Second, our historical alignment has evolved from legacy hardware ('Computer Business') into modern, API-driven real-time verification and VTU infrastructure, which is best represented under 'SmartLink NG'. Third, responsive mobile layouts, receipt templates, and SMS alerts require concise trade names to prevent visual formatting overflows. All legal and statutory rights, liabilities, and data protection commitments of Smart Link Computer Business extend fully to these simplified operating brands.",
          "This Privacy Policy describes our practices regarding the collection, use, storage, processing, disclosure, and protection of information obtained through the SmartLink NG web portal, mobile-optimized interfaces, API gateways, and associated digital services.",
          "By accessing our platform, registering an account, funding your wallet, or submitting verification queries, you acknowledge that you have read, understood, and consented to the practices described in this Privacy Policy.",
        ],
        callout: {
          type: "info",
          text: "SmartLink NG operates in full adherence to the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation (NDPR), and relevant Central Bank of Nigeria (CBN) regulatory guidelines.",
        },
      },
      {
        id: "information-we-collect",
        title: "2. Information We Collect",
        content: [
          "To provide reliable e-government assistance, identity verification, financial wallet infrastructure, and utility payment solutions, we collect several categories of information depending on your interaction with the platform:",
        ],
        subsections: [
          {
            subtitle: "A. Personal Contact & Account Information",
            points: [
              "Full legal name, residential/business address, email address, and active Nigerian phone numbers.",
              "Account credentials, including encrypted passwords, PIN security hashes, and role-based permissions.",
              "Profile metadata, registration timestamp, referral codes, and security question indicators.",
            ],
          },
          {
            subtitle: "B. Identity & Verification Data",
            points: [
              "National Identity Numbers (NIN) and Virtual National Identity Numbers (vNIN) for verification.",
              "Bank Verification Numbers (BVN) for identity cross-referencing through authorized interbank rails.",
              "Corporate Affairs Commission (CAC) business name registration details, RC/BN numbers, and director profiles.",
              "Tax Identification Numbers (TIN), date of birth, biometric photograph assets returned from official verification lookups, and generated verification slips.",
            ],
          },
          {
            subtitle: "C. Payment & Wallet Transaction Data",
            points: [
              "Stored-value wallet ledger records, account balances, and transaction histories.",
              "Dedicated virtual bank account numbers assigned through partnering commercial and digital banks (e.g., Monnify, Opay, Wema Bank, Sterling Bank).",
              "Payment gateway transaction references, bank transfer receipts, settlement statuses, and refund records.",
            ],
          },
          {
            subtitle: "D. Technical, Device & Network Information",
            points: [
              "Internet Protocol (IP) addresses, browser type, operating system version, and device identifiers.",
              "Access timestamps, login audit logs, security event trails, and diagnostic error reports.",
              "Session tokens and functional cookies required for secure state persistence.",
            ],
          },
        ],
      },
      {
        id: "how-we-use-information",
        title: "3. How We Use Your Information",
        content: [
          "We process your data exclusively for lawful, legitimate, and clearly defined operational purposes, including:",
          "• Facilitating identity verifications (NIN, BVN, CAC, TIN) through authorized verification channels.",
          "• Maintaining and reconciling your SmartLink stored-value digital wallet and virtual account balances.",
          "• Processing airtime, mobile data bundles, electricity token distributions (DISCOs), cable TV subscriptions, and educational scratch cards (WAEC, NECO, JAMB).",
          "• Preventing fraud, detecting suspicious financial velocities, and complying with Anti-Money Laundering (AML) and Counter-Terrorist Financing (CFT) regulations.",
          "• Providing responsive customer support, resolving transaction disputes, and delivering operational SMS/email notifications.",
          "• Enhancing application performance, monitoring server health, and defending our infrastructure against cyber attacks.",
        ],
      },
      {
        id: "data-storage-protection",
        title: "4. Data Storage, Architecture & Security",
        content: [
          "SmartLink NG implements rigorous multi-layer technical, physical, and organizational security controls to protect your information against unauthorized access, loss, alteration, or disclosure:",
          "• Cloud Infrastructure: Data is stored in secure Google Cloud database environments configured with role-based security rules and granular collection access permissions.",
          "• Cryptographic Protection: All data in transit is encrypted using Transport Layer Security (TLS 1.3/HTTPS). Sensitive tokens and secrets are stored in secure server-side environments.",
          "• Verification Data Masking: Identity lookup results displayed on public screens are masked where appropriate to prevent shoulder surfing and unauthorized interception.",
          "• Access Restrictions: Internal administrative access is strictly governed by Role-Based Access Control (RBAC), multi-factor authentication (MFA), and immutable audit logging.",
        ],
      },
      {
        id: "data-sharing",
        title: "5. Data Sharing and Third-Party Disclosures",
        content: [
          "We do not sell, rent, trade, or monetize your personal data. We only share information with third parties under the following strictly defined conditions:",
          "• Authorized Verification & Utility Providers: Transmitting query payloads (e.g. NIN, meter numbers, decoder numbers) to accredited third-party gateway APIs strictly to fulfill your requested transactions. SmartLink NG is a third-party platform and is not directly connected to primary providers like NIMC, NIBSS, CAC, or FRSC.",
          "• Licensed Payment Processors: Partnering commercial banks and Central Bank of Nigeria (CBN)-licensed payment solution service providers (e.g., Monnify, Opay, Flutterwave) to process virtual account deposits and card settlements.",
          "• Legal & Regulatory Mandates: Disclosing records when formally required by a competent court of law, law enforcement agencies (e.g., EFCC, NPF), or regulatory authorities pursuant to valid legal process.",
        ],
      },
      {
        id: "data-retention",
        title: "6. Data Retention and Archival",
        content: [
          "We retain personal and transactional data only as long as necessary to fulfill the purposes for which it was collected, resolve disputes, maintain accurate financial ledgers, and satisfy statutory record-keeping requirements under Nigerian financial laws.",
          "Financial ledger transactions and audit logs are retained for a minimum period of six (6) years in accordance with applicable Nigerian financial record retention standards.",
        ],
      },
      {
        id: "user-rights",
        title: "7. Your Data Subject Rights (NDPA 2023)",
        content: [
          "Under the Nigeria Data Protection Act (NDPA 2023), you hold enforceable privacy rights regarding your personal information:",
          "• Right to Access: Request a copy of the personal information SmartLink NG maintains regarding your account.",
          "• Right to Rectification: Request correction of inaccurate, incomplete, or outdated personal information.",
          "• Right to Erasure: Request deletion of your personal data where there is no statutory or regulatory ground for continued retention.",
          "• Right to Restrict Processing: Request limitation on how your data is processed under specific contested circumstances.",
          "• Right to Data Portability: Receive your personal transactional data in a structured, commonly used format.",
          "• Right to Withdraw Consent: Withdraw consent at any time for non-mandatory processing activities.",
        ],
        callout: {
          type: "success",
          text: "To exercise any of your data rights, contact our Data Protection Officer at Smartlinkcomputerbusiness@gmail.com. We respond to all verified requests within 14 working days.",
        },
      },
      {
        id: "contact-privacy",
        title: "8. Privacy Inquiries & Contact Details",
        content: [
          "For questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact our Legal & Compliance Desk:",
          "• Organization: Smart Link Computer Business (CAC RC 9347502)",
          "• Privacy & Compliance Email: Smartlinkcomputerbusiness@gmail.com",
          "• Direct Phone: +234 808 549 0982 | WhatsApp Support: +234 904 773 8212",
          "• Address: SmartLink Enterprise Office, Federal Republic of Nigeria",
        ],
      },
    ],
  },

  // 2. TERMS OF SERVICE / TERMS OF USE
  {
    id: "terms-of-service",
    slug: "terms-of-service",
    route: "/terms",
    title: "SmartLink Nigeria Terms of Service",
    shortTitle: "Terms of Service",
    category: "LEGAL",
    categoryLabel: "Legal & General",
    summary:
      "The legally binding contract governing account eligibility, service utilization, digital wallet transactions, identity verification services, acceptable use, liability limitations, and dispute resolution on SmartLink NG.",
    version: "3.1.2 (Active)",
    effectiveDate: "September 10, 2025",
    lastUpdated: "July 05, 2026",
    readTime: "10 min read",
    iconName: "FileText",
    highlights: [
      "Mandatory 18+ age eligibility and accurate account registration requirement",
      "Clear terms for digital wallet management, automated funding, and billing",
      "Explicit user authorization warranties for identity lookups (NIN/BVN/CAC)",
      "Governed by the laws of the Federal Republic of Nigeria with binding arbitration",
    ],
    relatedDocIds: ["privacy-policy", "wallet-terms", "refund-policy", "acceptable-use", "marketing-policy"],
    sections: [
      {
        id: "agreement-to-terms",
        title: "1. Acceptance and Agreement to Terms",
        content: [
          "These Terms of Service ('Terms', 'Agreement') constitute a legally binding agreement between you ('User', 'Customer', 'Agent', or 'Vendor') and Smart Link Computer Business ('SmartLink NG', 'we', 'us', or 'our', CAC RC 9347502).",
          "By creating an account, accessing our portal, funding a digital wallet, or submitting verification or utility purchase requests, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our incorporated Privacy Policy.",
          "If you do not agree with any part of these Terms, you must immediately cease accessing and using SmartLink NG services.",
        ],
      },
      {
        id: "brand-nomenclature",
        title: "2. Corporate Nomenclature, Brand Simplification & Trade Names",
        content: [
          "Smart Link Computer Business is formally registered under the laws of the Federal Republic of Nigeria with the Corporate Affairs Commission (CAC) under Registration Number: RC 9347502. However, for digital service delivery, automated communications, web portals, and marketing, we operate under the trade names 'SmartLink NG' and 'Smart Link Nigeria'.",
          "There are several critical operational, readability, and technical reasons for this deliberate brand shortening:",
          "• Domain Usability & Length Constraint: The formal registered name 'Smart Link Computer Business' consists of 28 characters. Using a primary web domain such as 'smartlinkcomputerbusiness.com.ng' is structurally too long, highly prone to keyboard input errors, difficult for users to memorize, and impractical on mobile device browsers. Adopting 'smartlinkng.com.ng' or using 'SmartLink NG' provides a highly memorable, search-engine-optimized (SEO), and accessible web address.",
          "• Modern Technological Alignment: Historically, the term 'Computer Business' denoted desktop hardware repairs, physical retail, and legacy systems. Since our platform has evolved into an indigenous digital identity engine and high-velocity utility transactions router (bridging NIN, vNIN, BVN, CAC, and TIN APIs), the trading titles 'SmartLink NG' and 'Smart Link Nigeria' more accurately convey our modern cloud-based software offerings.",
          "• Graphical User Interface & Mobile Formatting Constraints: Digital mobile dashboards, thermal paper receipt templates, automated emails, and verification slips have strict layout and width limits. Using our full corporate name causes visual overflow, wrapping breaks, and compromised aesthetics. Trademark aliases ensure visual and typographic design integrity across all screen sizes.",
          "• Notification Limits & SMS Constraints: Outbound alert systems (OTP dispatches, wallet transaction logs, and WhatsApp alerts) contain strict character caps. Using the concise name 'SmartLink NG' optimizes text payloads and guarantees clean, concise alert delivery without split formatting or excessive carrier costs.",
          "• Full Legal Equivalency: In accordance with standard enterprise practices, Smart Link Computer Business retains full corporate liability, statutory compliance duties, and contractual accountability for all transactions, balances, and policies managed under our simplified trade marks."
        ]
      },
      {
        id: "eligibility-account",
        title: "3. Account Eligibility & Responsibilities",
        content: [
          "To register an account and utilize services on SmartLink NG, you must satisfy the following criteria:",
          "• You must be at least eighteen (18) years of age or possess legal business capacity under Nigerian law.",
          "• You must provide truthful, accurate, current, and complete registration information, including your full legal name, verifiable email address, and active Nigerian phone number.",
          "• You are solely responsible for maintaining the confidentiality of your login credentials (email, password, transaction PIN, and 2FA tokens).",
          "• You accept full responsibility for all activities and financial transactions that occur under your account credentials.",
          "• You must immediately notify SmartLink NG customer support if you suspect unauthorized access or any security breach.",
        ],
      },
      {
        id: "services-scope",
        title: "4. Scope of SmartLink NG Services",
        content: [
          "SmartLink NG provides a comprehensive suite of digital facilitation, e-government support, and utility settlement services, including but not limited to:",
          "• Identity & Verification Lookups: NIN verification, vNIN validation, BVN identity lookup, CAC company/business name verification, and TIN confirmation.",
          "• Slip Generation & Printing: Production of standard, digital green, and premium white verification slips, thermal receipts, and barcode assets.",
          "• Corporate Registry Assistance: Business name reservations, company registrations, and post-incorporation document retrieval assistance.",
          "• Bill & Utility Payments: Automated electricity token purchases (IKEDC, EKEDC, AEDC, IBEDC, etc.), cable TV subscriptions (DStv, GOtv, StarTimes), and airtime/data top-ups.",
          "• Educational Scratch Cards: WAEC, NECO, and JAMB e-facility PIN generation and distribution.",
        ],
      },
      {
        id: "wallet-transactions",
        title: "5. Wallet Operations and Financial Transactions",
        content: [
          "• Stored-Value Digital Wallet: SmartLink NG operates a pre-funded digital ledger wallet. You must maintain sufficient cleared funds in your wallet to execute service orders.",
          "• Funding Methods: Wallet deposits may be conducted via automated dedicated virtual accounts, bank transfers, or approved debit card channels.",
          "• Irreversibility of Executed Orders: Because identity verification queries, airtime top-ups, and utility token generations are processed instantaneously with upstream providers, successfully executed transactions are final and cannot be cancelled or refunded once delivered.",
          "• Transaction References: Every transaction is assigned a unique tracking identifier (e.g. SL-TXN-...). Retain this reference for all customer support inquiries.",
        ],
      },
      {
        id: "user-warranties-kyc",
        title: "6. User Warranties for Identity & KYC Verification",
        content: [
          "When submitting verification queries for NIN, BVN, CAC, or TIN data, you represent, warrant, and covenant that:",
          "• You are either verifying your own personal identity records or have obtained express, unambiguous, and lawful consent from the data subject.",
          "• You will not use verification results for illegal profiling, stalking, identity theft, unauthorized credit assessment, or fraudulent activities.",
          "• You indemnify SmartLink NG against any civil, criminal, or regulatory liabilities arising from your unauthorized or unlawful verification queries.",
        ],
      },
      {
        id: "suspension-termination",
        title: "7. Account Suspension and Termination",
        content: [
          "SmartLink NG reserves the right to suspend, restrict, freeze, or terminate your account depending on the severity of the infraction. We categorize account actions under two distinct pathways:",
          "Category A: Immediate Action Without Notice",
          "We will immediately freeze or terminate your account without prior notice or liability under the following circumstances:",
          "• Detection of fraudulent, suspicious, money laundering, or high-velocity abnormal transactions.",
          "• Receipt of formal directives or security mandates from law enforcement agencies, the Central Bank of Nigeria (CBN), or judicial authorities.",
          "• Provision of false, misleading, or stolen identity credentials during registration or verification.",
          "Category B: Notice-and-Cure Period for Non-Security Breaches",
          "For minor, non-security, or first-time breaches of these Terms or Acceptable Use Policies:",
          "• We will provide you with a written notice specifying the nature of the breach.",
          "• You will have a reasonable notice-and-cure period of five (5) business days to remedy the breach. Failure to cure the infraction within this period will result in immediate suspension or termination of your account.",
          "Dispute & Appeal Process:",
          "If you believe your account was suspended or terminated in error, you may submit an appeal or dispute the decision by contacting our Support & Compliance Desk via email at Smartlinkcomputerbusiness@gmail.com. Our team will review your request and provide a formal resolution within seven (7) business days."
        ],
      },
      {
        id: "limitation-liability",
        title: "8. Limitation of Liability & Disclaimers",
        content: [
          "• As-Is Basis: Services are provided on an 'AS IS' and 'AS AVAILABLE' basis without express or implied warranties of any kind.",
          "• Third-Party Dependencies: SmartLink NG relies on upstream infrastructure accessed via third-party gateway APIs connected to government registries (NIMC, NIBSS, CAC, FIRS, FRSC), telecommunication networks, and utility distributors. SmartLink NG is a third-party platform not directly connected to these primary providers. We shall not be liable for system downtime, API latency, network drops, or registry outages originating beyond our control.",
          "• Maximum Liability: In no event shall the total aggregate liability of SmartLink NG exceed the service fee paid by you for the specific disputed transaction giving rise to the claim.",
        ],
      },
      {
        id: "governing-law-disputes",
        title: "9. Governing Law and Dispute Resolution",
        content: [
          "• Governing Law: These Terms shall be governed by and construed in accordance with the substantive laws of the Federal Republic of Nigeria.",
          "• Amicable Negotiation: In the event of any dispute, claim, or controversy, the parties agree to first attempt resolution through good-faith negotiation within fourteen (14) days.",
          "• Arbitration: If unresolved amicably, the dispute shall be referred to and finally resolved by binding arbitration in accordance with the Arbitration and Mediation Act 2023 of Nigeria.",
        ],
      },
    ],
  },

  // 3. REFUND & CANCELLATION POLICY
  {
    id: "refund-policy",
    slug: "refund-policy",
    route: "/refund-policy",
    title: "SmartLink Nigeria Refund & Cancellation Policy",
    shortTitle: "Refund Policy",
    category: "PAYMENTS_WALLET",
    categoryLabel: "Payments & Wallet",
    summary:
      "Defines eligibility criteria, timelines, processing procedures, and explicit non-refundable exclusions for wallet funding, identity lookups, utility bills, and digital product orders.",
    version: "2.0.1 (Active)",
    effectiveDate: "February 15, 2024",
    lastUpdated: "March 22, 2025",
    readTime: "6 min read",
    iconName: "RefreshCw",
    highlights: [
      "Instant automatic wallet refunds for system-detected failed service deliveries",
      "Clear distinction between refundable system errors and non-refundable delivered queries",
      "Standard 24-48 hour resolution window for manual payment reconciliation queries",
      "Full transparency on upstream third-party gateway non-refundable charges",
    ],
    relatedDocIds: ["wallet-terms", "payment-terms", "terms-of-service"],
    sections: [
      {
        id: "refund-overview",
        title: "1. Overview & Policy Objective",
        content: [
          "SmartLink Nigeria is dedicated to transparent, fair, and prompt dispute resolution. This Refund & Cancellation Policy establishes the precise rules governing financial refunds, reversal protocols, and cancellation terms across all digital services provided on our platform.",
          "Due to the real-time, irreversible digital nature of identity verifications, airtime/data recharges, electricity tokens, and exam PINs, refund eligibility is strictly evaluated against upstream delivery statuses.",
        ],
      },
      {
        id: "eligible-refunds",
        title: "2. Circumstances Eligible for Refunds",
        content: [
          "A transaction is eligible for an automatic or customer-requested refund under the following conditions:",
          "• Failed Service Delivery: When your wallet is debited but the upstream provider fails to fulfill the requested service (e.g. meter token not generated, airtime top-up failed at telecom gateway, or registry returned a fatal provider timeout).",
          "• System Deductions on Error: Unintended duplicate wallet debits arising from network glitches or platform concurrency errors.",
          "• Uncredited Wallet Funding: Cleared bank transfers or card payments with confirmed bank transaction references that failed to automatically credit your SmartLink digital wallet due to webhook transmission delays.",
        ],
        callout: {
          type: "success",
          text: "System-detected service failures are credited back to your SmartLink wallet instantly by our automated Transaction Reconciliation Engine.",
        },
      },
      {
        id: "non-refundable-services",
        title: "3. Non-Refundable Services",
        content: [
          "Refunds CANNOT be granted under any of the following circumstances:",
          "• Successful Identity Lookups: Once a NIN, BVN, TIN, or CAC inquiry is submitted and valid data or confirmed 'Not Found' response is retrieved from the official registry, the provider query fee is incurred and is non-refundable.",
          "• Incorrect Customer Input: Services delivered to an incorrect phone number, meter number, smartcard number, or NIN supplied erroneously by the user during order placement.",
          "• Generated & Viewed PINs: Educational scratch card PINs (WAEC, NECO, JAMB) once revealed and displayed on your screen or generated in slip format.",
          "• Disapproved CAC Name Submissions: Rejections by the Corporate Affairs Commission (CAC) due to naming conflicts, restricted terminology, or statutory non-compliance beyond SmartLink NG's control.",
        ],
      },
      {
        id: "refund-timelines",
        title: "4. Processing Timelines & Methods",
        content: [
          "• Wallet Balance Reversals: Eligible failed service transactions are credited back to your SmartLink wallet instantly or within two (2) hours of manual review.",
          "• Bank Account Reversals: In cases where wallet balance withdrawal or direct bank payout is approved by finance officers, processing takes between 1 to 3 business days, subject to interbank clearing protocols.",
          "• Processing Fees: Service convenience fees incurred during payment gateway processing (e.g. card gateway gateway charges) may be non-refundable if the gateway provider does not remit them back.",
        ],
      },
      {
        id: "how-to-request-refund",
        title: "5. How to File a Dispute or Refund Request",
        content: [
          "To request manual review or file a transaction dispute:",
          "1. Locate your Transaction Reference (e.g., SL-TXN-20260828-...) from your Dashboard or Wallet History.",
          "2. Email our Finance & Support Desk at Smartlinkcomputerbusiness@gmail.com or message our official WhatsApp support at +234 904 773 8212.",
          "3. Provide the transaction reference, registered account email, proof of debit (if bank transfer), and a concise description of the issue.",
        ],
      },
    ],
  },

  // 4. WALLET TERMS & CONDITIONS
  {
    id: "wallet-terms",
    slug: "wallet-terms",
    route: "/wallet-terms",
    title: "SmartLink Nigeria Wallet Terms & Conditions",
    shortTitle: "Wallet Terms",
    category: "PAYMENTS_WALLET",
    categoryLabel: "Payments & Wallet",
    summary:
      "Details the operation of your pre-funded SmartLink stored-value digital wallet, virtual accounts, security measures, transaction ledger, limits, and dormancy rules.",
    version: "1.8.5 (Active)",
    effectiveDate: "November 01, 2024",
    lastUpdated: "January 20, 2026",
    readTime: "7 min read",
    iconName: "Wallet",
    highlights: [
      "Pre-funded digital ledger system ensuring real-time instant service settlements",
      "Dynamic dedicated virtual account assignment via CBN-licensed payment partners",
      "Immutable transaction auditing with end-to-end ledger reconciliation",
      "Strict anti-fraud monitoring and velocity controls protecting user balances",
    ],
    relatedDocIds: ["payment-terms", "refund-policy", "terms-of-service"],
    sections: [
      {
        id: "wallet-definition",
        title: "1. Definition & Characterization of the Wallet",
        content: [
          "The SmartLink Wallet is an electronic stored-value digital ledger maintained on our platform. It enables registered users, agents, and vendors to pre-fund balances in Nigerian Naira (NGN) for seamless, instantaneous execution of digital services without entering payment card details for every single purchase.",
          "The SmartLink Wallet is not a bank deposit account, does not earn interest, and is not insured by the Nigeria Deposit Insurance Corporation (NDIC). It functions strictly as a closed-loop and semi-closed digital utility ledger.",
        ],
      },
      {
        id: "wallet-custody-regulatory",
        title: "2. Custody of Wallet Funds & Regulatory Basis",
        content: [
          "All customer funds, wallet balances, and pooled float associated with the SmartLink Wallet are held in dedicated trust or custodial bank accounts opened with our CBN-licensed partner banks and Payment Service Providers (PSPs). SmartLink NG itself does not hold, store, or directly process pooled customer cash or operate as a deposit-taking financial institution.",
          "SmartLink NG's role on the platform is strictly as an authorized agent, digital portal, and technical facilitator operating under the licenses, regulations, and guidelines of its licensed bank/PSP partners. [PENDING LEGAL REVIEW: confirm licensing arrangement - exact partner names and license classifications must be verified by legal/compliance counsel before production deployment].",
        ],
        callout: {
          type: "notice",
          text: "Notice: SmartLink NG is a technology provider, not a licensed bank. Your wallet balances are securely held in trust accounts managed by licensed banking partners.",
        },
      },
      {
        id: "wallet-funding",
        title: "3. Wallet Funding Mechanisms",
        content: [
          "You may fund your SmartLink wallet through any of the approved channels:",
          "• Dedicated Virtual Accounts: Automated bank transfer to your uniquely assigned virtual account numbers (provided via licensed banking partners such as Monnify, Opay, Wema Bank, Sterling Bank). Transfers reflect in your wallet within 10 to 60 seconds upon bank confirmation.",
          "• Online Card Payment: Instant funding via debit cards (Mastercard, Visa, Verve) processed through secure payment gateways.",
          "• Admin/Manual Transfer: Bank payments confirmed through authorized manual reconciliation by SmartLink finance officers.",
        ],
      },
      {
        id: "balances-limits",
        title: "4. Wallet Balances, Ledger Integrity & Limits",
        content: [
          "• Negative Balances Prohibited: Transactions will be rejected automatically if your available wallet balance is insufficient to cover the total service cost and applicable processing fees.",
          "• Ledger Finality: Debits from your wallet balance are logged immutably with timestamped references and cannot be revoked once the corresponding service fulfillment begins.",
          "• Transaction Tiers & Limits: SmartLink NG enforces daily transaction volume limits based on your account verification tier (Tier 1 unverified vs Tier 2 KYC-verified) to prevent fraudulent spikes.",
        ],
      },
      {
        id: "unauthorized-transactions",
        title: "5. Unauthorized Activity & Account Security",
        content: [
          "• You are solely responsible for guarding your wallet credentials, login password, and transaction authorization PIN.",
          "• SmartLink NG staff will NEVER ask for your password, PIN, or OTP under any circumstance.",
          "• In the event of suspected compromise, notify our support desk immediately to initiate a temporary security freeze on your wallet balance.",
        ],
      },
      {
        id: "wallet-freezing-dormancy",
        title: "6. Wallet Freezing, Dormancy & Closure",
        content: [
          "• Security Freezes: We reserve the right to temporarily freeze wallet operations if suspicious activity, chargeback disputes, or potential fraudulent inflows are detected.",
          "• Dormancy: Wallets with no recorded activity for twelve (12) consecutive months may be flagged as dormant. Balances remain safe and can be reactivated upon user re-verification.",
          "• Account Closure: Upon voluntary account closure, any remaining unencumbered wallet funds will be refunded to the user's verified Nigerian bank account after standard reconciliation.",
        ],
      },
    ],
  },

  // 5. PAYMENT TERMS
  {
    id: "payment-terms",
    slug: "payment-terms",
    route: "/payment-terms",
    title: "SmartLink Nigeria Payment Terms",
    shortTitle: "Payment Terms",
    category: "PAYMENTS_WALLET",
    categoryLabel: "Payments & Wallet",
    summary:
      "Outlines payment authorization, processing gateways, merchant fee transparency, transaction settlement timelines, chargeback policies, and dispute workflows.",
    version: "2.1.0 (Active)",
    effectiveDate: "May 20, 2024",
    lastUpdated: "October 14, 2025",
    readTime: "6 min read",
    iconName: "CreditCard",
    highlights: [
      "Full transparency on service pricing and payment processing convenience fees",
      "Integration with CBN-licensed payment gateways featuring 3D-Secure protection",
      "Strict chargeback investigation protocols to prevent fraudulent payment claims",
      "Standardized currency in Nigerian Naira (NGN - ₦) across all transactions",
    ],
    relatedDocIds: ["wallet-terms", "refund-policy", "terms-of-service"],
    sections: [
      {
        id: "payment-authorization",
        title: "1. Payment Authorization & Processing",
        content: [
          "When you initiate a payment or wallet funding request on SmartLink NG, you explicitly authorize SmartLink NG and our integrated payment partners to debit the specified amount from your chosen payment instrument.",
          "All monetary transactions on SmartLink NG are denominated, calculated, and settled in Nigerian Naira (NGN, ₦) unless explicitly designated otherwise.",
        ],
      },
      {
        id: "payment-methods-gateways",
        title: "2. Supported Payment Methods & Gateways",
        content: [
          "SmartLink NG integrates with accredited, PCI-DSS compliant, and Central Bank of Nigeria (CBN)-licensed payment processors, including:",
          "• Monnify (Moniepoint MFB / Wema Bank)",
          "• OPay Digital Services",
          "• Flutterwave",
          "• Aspfiy Financial Rails",
          "• Direct Commercial Interbank Transfers (NIP)",
          "We do not directly store complete debit card numbers, CVVs, or cardholder PINs on our servers.",
        ],
      },
      {
        id: "fees-pricing",
        title: "3. Pricing, Tariffs & Transaction Surcharges",
        content: [
          "• Real-Time Pricing: Service prices for identity lookups, CAC filings, electricity tokens, data plans, and exam scratch cards are displayed clearly before transaction confirmation.",
          "• Gateway Surcharges: Card payments and virtual account transfers may attract modest statutory or payment gateway processing fees (e.g. 1.0% - 1.5% capped at statutory limits) where applicable.",
          "• Price Adjustments: SmartLink NG reserves the right to adjust service rates in response to upstream price alterations by government agencies, DisCos, or telecommunication operators.",
        ],
      },
      {
        id: "chargebacks-disputes",
        title: "4. Chargebacks and Payment Disputes",
        content: [
          "• Unauthorized Chargebacks Prohibited: Filing fraudulent or unjustified chargeback claims with your issuing bank for services successfully delivered on SmartLink NG constitutes a breach of contract.",
          "• Dispute Investigation: In the event of a chargeback claim, SmartLink NG will furnish the acquiring bank with comprehensive audit logs, IP records, timestamped proof of service delivery, and verification receipts.",
          "• Account Sanctions: Accounts associated with fraudulent chargebacks will be subject to immediate suspension, wallet freezing, and possible legal recovery action.",
        ],
      },
    ],
  },

  // 6. COOKIE POLICY
  {
    id: "cookie-policy",
    slug: "cookie-policy",
    route: "/cookie-policy",
    title: "SmartLink Nigeria Cookie Policy",
    shortTitle: "Cookie Policy",
    category: "DATA_VERIFICATION",
    categoryLabel: "Data & Verification",
    summary:
      "Explains how SmartLink NG uses browser cookies, session tokens, and local storage mechanisms to authenticate sessions, remember preferences, enhance platform security, and improve performance.",
    version: "1.2.0 (Active)",
    effectiveDate: "January 15, 2024",
    lastUpdated: "January 15, 2024",
    readTime: "5 min read",
    iconName: "Cookie",
    highlights: [
      "Transparent breakdown of Essential, Security, Preference, and Analytical cookies",
      "No invasive advertising tracking or third-party behavioral profiling cookies",
      "Clear guidance on browser cookie management and permission controls",
    ],
    relatedDocIds: ["privacy-policy", "data-protection"],
    sections: [
      {
        id: "what-are-cookies",
        title: "1. What Are Cookies and Local Storage?",
        content: [
          "Cookies and browser local storage entries are small data files placed on your device (computer, smartphone, or tablet) when you visit the SmartLink NG web portal.",
          "These technologies are essential for keeping you authenticated, securing your account against cross-site attacks, remembering your interface preferences (such as Dark Mode), and ensuring rapid page responsiveness.",
        ],
      },
      {
        id: "cookies-we-use",
        title: "2. Categories of Cookies We Utilize",
        content: [
          "SmartLink NG uses the following types of cookies and local storage tokens:",
        ],
        subsections: [
          {
            subtitle: "A. Strictly Necessary & Authentication Cookies",
            points: [
              "Secure Authentication Tokens: Maintain secure user session state and verify credentials during API requests.",
              "Admin Session Tokens (smart_link_admin_session): Enforce Role-Based Access Controls for administrative dashboards.",
              "Security & CSRF Tokens: Prevent Cross-Site Request Forgery and unauthorized API tampering.",
            ],
          },
          {
            subtitle: "B. Functional & Preference Cookies",
            points: [
              "Dark Mode Preference (smart_link_dark_mode): Remembers whether you selected light or dark interface theme.",
              "Dashboard Tab State: Preserves your active dashboard navigation tab across browser refreshes.",
              "Recent Search Filters: Temporarily caches table filtering preferences for smooth browsing.",
            ],
          },
          {
            subtitle: "C. Performance & Diagnostic Telemetry",
            points: [
              "Server Health & Latency Tokens: Monitor API response latency and platform availability.",
              "Error Logging Identifiers: Assist our technical engineering team in debugging client-side interface anomalies.",
            ],
          },
        ],
      },
      {
        id: "cookie-management",
        title: "3. Managing Your Cookie Preferences",
        content: [
          "Most modern web browsers allow you to manage cookie settings, inspect stored tokens, or block cookies altogether through browser preferences.",
          "Please note that disabling strictly necessary authentication cookies will prevent you from logging into your SmartLink account, funding your wallet, or executing verification transactions.",
        ],
      },
    ],
  },

  // 7. IDENTITY VERIFICATION & KYC NOTICE
  {
    id: "kyc-notice",
    slug: "kyc-notice",
    route: "/kyc-notice",
    title: "SmartLink Nigeria Identity Verification & KYC Notice",
    shortTitle: "KYC & Verification Notice",
    category: "DATA_VERIFICATION",
    categoryLabel: "Data & Verification",
    summary:
      "Important regulatory disclosures governing National Identification Number (NIN), Bank Verification Number (BVN), Corporate Affairs Commission (CAC), and Tax ID (TIN) verification workflows.",
    version: "2.3.4 (Active)",
    effectiveDate: "January 10, 2025",
    lastUpdated: "May 12, 2026",
    readTime: "7 min read",
    iconName: "Fingerprint",
    highlights: [
      "Mandatory requirement for lawful data subject consent before executing lookups",
      "Clear explanation of official registry integrations (NIMC, NIBSS, CAC, FIRS)",
      "Strict data masking and anti-fraud watermarks on generated slips and receipts",
      "Audit trail retention standards supporting law enforcement and regulatory audits",
    ],
    relatedDocIds: ["privacy-policy", "data-protection", "disclaimer", "acceptable-use"],
    sections: [
      {
        id: "kyc-purpose",
        title: "1. Purpose of Identity Verification & KYC",
        content: [
          "SmartLink Nigeria provides authorized verification interfaces to assist individuals, businesses, licensed agents, and corporate entities in confirming identity authenticity, fulfilling Know Your Customer (KYC) obligations, and validating registration credentials.",
          "SmartLink NG is an independent third-party technology platform. We are NOT directly affiliated with, endorsed by, or directly connected to primary government providers such as the National Identity Management Commission (NIMC), Nigeria Inter-Bank Settlement System (NIBSS), Corporate Affairs Commission (CAC), Federal Road Safety Corps (FRSC), or Federal Inland Revenue Service (FIRS). Our verification engine interfaces solely with authorized third-party gateway APIs to facilitate these lookups.",
        ],
      },
      {
        id: "consent-warranties",
        title: "2. User Consent and Legal Warranties",
        content: [
          "Before submitting any identity query (NIN, vNIN, BVN, CAC RC number, or TIN) on SmartLink NG, you expressly warrant that:",
          "• You have obtained explicit, verifiable consent from the data subject to verify their identity details, OR you are conducting verification in direct compliance with an applicable statutory requirement.",
          "• You shall not query identity credentials belonging to third parties for fraudulent purposes, unlawful surveillance, unauthorized credit checks, harassment, or commercial resale of raw citizen datasets.",
          "• You assume full legal liability under Nigerian cybercrime and data protection laws for any unauthorized queries executed through your account.",
        ],
        callout: {
          type: "warning",
          text: "Querying biometric identity databases without legitimate authority or data subject consent is a criminal offense under the Cybercrimes (Prohibition, Prevention, etc.) Act 2015 and the NDPA 2023.",
        },
      },
      {
        id: "slip-watermarking",
        title: "3. Verification Slips, Watermarking & Security Assets",
        content: [
          "• Document Types: SmartLink NG facilitates the generation of NIN slips, BVN Validation Records, and CAC Status Slips.",
          "• Security Watermarks: All generated slips feature digital security barcodes, QR code verification payloads, and anti-tamper timestamps to prevent document forgery.",
          "• Facilitation Status: Generated verification slips are digital representations derived from third-party API lookups. SmartLink NG is an independent third-party technology facilitator, not directly connected to primary providers, and does not issue statutory national identity cards in lieu of government authorities.",
        ],
      },
      {
        id: "verification-results-failures",
        title: "4. Registry Discrepancies and Verification Failures",
        content: [
          "• Registry Authority: Verification results returned by SmartLink NG reflect the exact records stored in the respective government databases at the moment of query.",
          "• Unmatched Records: If an inquiry returns 'Record Not Found', 'Invalid NIN/BVN', or mismatched biometric details, SmartLink NG cannot alter or correct upstream registry records. The user or data subject must visit an official NIMC enrollment center or their banking branch to update their bio-data.",
        ],
      },
    ],
  },

  // 8. ACCEPTABLE USE & FRAUD PREVENTION POLICY
  {
    id: "acceptable-use",
    slug: "acceptable-use",
    route: "/acceptable-use",
    title: "SmartLink Nigeria Acceptable Use & Fraud Prevention Policy",
    shortTitle: "Acceptable Use Policy",
    category: "SECURITY_USE",
    categoryLabel: "Security & Compliance",
    summary:
      "Strict prohibitions against fraudulent transactions, identity theft, unauthorized automated scraping, system tampering, money laundering, and platform misuse.",
    version: "1.9.0 (Active)",
    effectiveDate: "August 15, 2024",
    lastUpdated: "September 01, 2025",
    readTime: "8 min read",
    iconName: "ShieldAlert",
    highlights: [
      "Absolute zero-tolerance policy towards fraud, identity theft, and money laundering",
      "Prohibition against automated bots, vulnerability exploitation, and API scraping",
      "Immediate account freezing and law enforcement reporting for malicious actors",
      "Collaborative fraud detection with banks, EFCC, and security agencies",
    ],
    relatedDocIds: ["terms-of-service", "kyc-notice", "disclaimer"],
    sections: [
      {
        id: "prohibited-activities",
        title: "1. Strictly Prohibited Conduct",
        content: [
          "You agree that you will NOT use SmartLink Nigeria, directly or indirectly, to:",
          "• Engage in fraud, impersonation, identity theft, unauthorized card testing, or deceptive financial practices.",
          "• Submit stolen National Identity Numbers (NIN), Bank Verification Numbers (BVN), or counterfeit CAC documents.",
          "• Attempt to wash illicit funds, structure illegal money transfers, or violate Anti-Money Laundering (AML) laws.",
          "• Forge, falsify, or illegally alter verification slips, government seals, or official transaction receipts.",
          "• Resell or sub-license API access to unauthorized third parties without an explicit enterprise agreement.",
          "• Harass, deceive, or defraud SmartLink NG customer support agents or other platform users.",
        ],
      },
      {
        id: "technical-abuse",
        title: "2. Technical & Infrastructure Prohibitions",
        content: [
          "The following technical actions are strictly forbidden and will trigger immediate IP and device blacklisting:",
          "• Deploying automated web crawlers, scrapers, data harvesters, or bots to extract platform content without written consent.",
          "• Executing Distributed Denial of Service (DDoS) attacks, brute-force credential stuffing, or API flood attacks.",
          "• Probing, scanning, or testing vulnerabilities of our infrastructure or attempting to bypass security firewalls.",
          "• Decompiling, reverse engineering, disassembling, or attempting to derive source code from SmartLink applications.",
        ],
      },
      {
        id: "fraud-monitoring-enforcement",
        title: "3. Fraud Monitoring, Freezing & Enforcement Powers",
        content: [
          "To maintain platform integrity and protect our community, SmartLink NG employs automated velocity monitors, IP reputation analyzers, and fraud detection algorithms.",
          "If fraudulent, abusive, or suspicious activity is detected, SmartLink NG reserves the right to:",
          "• Immediately block or terminate account access and freeze associated wallet balances.",
          "• Quarantine and reverse disputed transactions pending comprehensive investigation.",
          "• Blacklist associated IP addresses, device identifiers, email domains, and phone numbers.",
          "• Submit full audit dossiers, transaction histories, and user records to the Economic and Financial Crimes Commission (EFCC), Nigeria Police Force (NPF), and relevant banking fraud desks.",
        ],
      },
    ],
  },

  // 9. DATA PROTECTION & USER RIGHTS
  {
    id: "data-protection",
    slug: "data-protection",
    route: "/data-protection",
    title: "SmartLink Nigeria Data Protection & User Rights Notice",
    shortTitle: "Data Protection Rights",
    category: "DATA_VERIFICATION",
    categoryLabel: "Data & Verification",
    summary:
      "A dedicated legal charter detailing user privacy rights under the Nigeria Data Protection Act 2023 (NDPA), lawful processing bases, and the step-by-step procedure to submit Data Subject Access Requests (DSAR).",
    version: "2.0.0 (Active)",
    effectiveDate: "June 12, 2024",
    lastUpdated: "November 10, 2024",
    readTime: "7 min read",
    iconName: "Lock",
    highlights: [
      "Clear articulation of the 8 statutory data subject rights under NDPA 2023",
      "Transparent breakdown of lawful processing bases for all platform operations",
      "Structured procedure for filing Data Subject Access Requests (DSAR)",
      "Dedicated Data Protection Officer (DPO) contact with guaranteed 14-day turnaround",
    ],
    relatedDocIds: ["privacy-policy", "cookie-policy", "kyc-notice"],
    sections: [
      {
        id: "ndpa-framework",
        title: "1. The Nigerian Data Protection Framework",
        content: [
          "Smart Link Computer Business processes personal data strictly within the legal framework established by the Nigeria Data Protection Act 2023 (NDPA) and regulations issued by the Nigeria Data Protection Commission (NDPC).",
          "We adhere to fundamental data protection principles: Lawfulness, Fairness, Transparency, Purpose Limitation, Data Minimization, Accuracy, Storage Limitation, Integrity, Confidentiality, and Accountability.",
        ],
      },
      {
        id: "lawful-bases",
        title: "2. Lawful Bases for Processing Your Data",
        content: [
          "SmartLink NG processes personal information under one or more of the following recognized lawful grounds:",
          "• Contractual Necessity: Processing required to open your account, maintain your wallet, and deliver your requested services (e.g. executing an electricity token purchase or identity lookup).",
          "• Legal Obligation: Processing required to satisfy statutory AML/CFT compliance, tax reporting, or formal judicial directives.",
          "• Legitimate Interests: Processing necessary for defending platform security, detecting fraud, and optimizing system reliability.",
          "• Explicit Consent: Where you have granted unambiguous permission for specific verification queries or communications.",
        ],
      },
      {
        id: "how-to-exercise-rights",
        title: "3. How to Submit a Data Subject Access Request (DSAR)",
        content: [
          "You have the right to exercise your data protection rights free of charge by following these steps:",
          "1. Send a formal email to our Data Protection Officer at Smartlinkcomputerbusiness@gmail.com.",
          "2. Specify your full registered name, account email, and the exact right you wish to exercise (e.g. Data Access, Rectification, Account Deletion).",
          "3. Provide reasonable proof of identity to ensure that personal data is not inadvertently disclosed to unauthorized claimants.",
          "4. Our DPO will acknowledge your request within forty-eight (48) hours and provide a full substantive response within fourteen (14) business days.",
        ],
        callout: {
          type: "info",
          text: "Note: Requests for deletion of financial transaction logs may be subject to statutory retention exceptions required under Nigerian banking and anti-money laundering legislation.",
        },
      },
    ],
  },

  // 10. THIRD-PARTY / GOVERNMENT DISCLAIMER
  {
    id: "disclaimer",
    slug: "disclaimer",
    route: "/disclaimer",
    title: "SmartLink Nigeria Third-Party & Government Disclaimer",
    shortTitle: "Government Disclaimer",
    category: "SECURITY_USE",
    categoryLabel: "Security & Compliance",
    summary:
      "Explicit disclosure that SmartLink Nigeria is an independent technology facilitator and is NOT a government ministry, department, or statutory agency unless expressly stated otherwise.",
    version: "1.5.0 (Active)",
    effectiveDate: "January 15, 2024",
    lastUpdated: "February 18, 2024",
    readTime: "5 min read",
    iconName: "AlertTriangle",
    highlights: [
      "Clear independent corporate identity under CAC RC 9347502",
      "Explicit non-affiliation statement regarding NIMC, NIBSS, CAC, and FIRS",
      "Transparent disclosure of third-party dependencies and external pricing updates",
      "No false claims of direct regulatory issuance or government agency status",
    ],
    relatedDocIds: ["terms-of-service", "kyc-notice", "acceptable-use"],
    sections: [
      {
        id: "independent-status",
        title: "1. Independent Enterprise Status",
        content: [
          "Smart Link Computer Business ('SmartLink NG', RC 9347502) is a private, independent technology enterprise registered under the Companies and Allied Matters Act by the Corporate Affairs Commission (CAC) of Nigeria.",
          "Unless explicitly stated pursuant to an official license or authorized partnership agreement, SmartLink NG is NOT an agency, ministry, parastatal, or department of the Federal Government of Nigeria or any State Government.",
        ],
        callout: {
          type: "notice",
          text: "SmartLink NG operates strictly as a digital facilitator, software interface, and authorized service channel bridging users and official service aggregators.",
        },
      },
      {
        id: "third-party-dependencies",
        title: "2. Third-Party Upstream Dependencies",
        content: [
          "SmartLink NG explicitly clarifies that we are a third-party platform and we are NOT directly connected to primary providers. Our platform accesses external systems, statutory databases, financial institutions, and utility providers solely through authorized third-party API gateways, including lookups relating to:",
          "• National Identity Management Commission (NIMC) for NIN validation.",
          "• Nigeria Inter-Bank Settlement System (NIBSS) for BVN confirmation.",
          "• Corporate Affairs Commission (CAC) for business and company registry filings.",
          "• Federal Inland Revenue Service (FIRS) / Joint Tax Board for Tax ID lookups.",
          "• Electricity Distribution Companies (IKEDC, EKEDC, AEDC, IBEDC, etc.) and Telecom Operators (MTN, Airtel, Glo, 9mobile).",
          "• Examination Bodies (WAEC, NECO, JAMB) for scratch card PIN generation.",
        ],
      },
      {
        id: "no-guarantee-decisions",
        title: "3. Non-Guarantee of Upstream Approvals & Service Decisions",
        content: [
          "• Government Approvals: SmartLink NG facilitates the submission of filings (e.g. CAC business name reservations). We do NOT have the authority to approve, guarantee, or expedite statutory government approvals, which remain at the sole discretion of the respective government authorities.",
          "• Registry Availability: We cannot guarantee uninterrupted availability, zero latency, or continuous uptime of external government or utility servers.",
          "• Tariff Alterations: Statutory government levies, official registry search fees, and utility tariffs are determined by the respective agencies and are subject to change without prior notice from SmartLink NG.",
        ],
      },
      {
        id: "trademarks-logos",
        title: "4. Trademarks & Brand Acknowledgements",
        content: [
          "All third-party trademarks, logos, acronyms, and service marks (such as NIMC, BVN, NIBSS, CAC, WAEC, NECO, JAMB, MTN, Airtel, Glo, 9mobile, DStv, GOtv) displayed on the SmartLink NG platform are the property of their respective statutory owners and corporate entities.",
          "Reference to these entities does not imply direct affiliation, endorsement, sponsorship, or partnership unless expressly documented.",
        ],
      },
    ],
  },

  // 11. MARKETING COMMUNICATIONS POLICY
  {
    id: "marketing-policy",
    slug: "marketing-policy",
    route: "/marketing-policy",
    title: "SmartLink Nigeria Marketing Communications Policy",
    shortTitle: "Marketing Policy",
    category: "LEGAL",
    categoryLabel: "Legal & General",
    summary:
      "Outlines how SmartLink Nigeria manages promotional and marketing communications, your consent options, available communication channels, and procedures for updating your preferences or opting out.",
    version: "1.0.0 (Active)",
    effectiveDate: "August 29, 2026",
    lastUpdated: "August 29, 2026",
    readTime: "4 min read",
    iconName: "Megaphone",
    highlights: [
      "Explicitly opt-in for all commercial, promotional, and marketing materials",
      "Support for multiple marketing channels: Email, SMS, and WhatsApp",
      "Separation between transactional/operational alerts and promotional campaigns",
      "Instant, hassle-free consent withdrawal through your account settings panel",
    ],
    relatedDocIds: ["privacy-policy", "terms-of-service"],
    sections: [
      {
        id: "marketing-scope",
        title: "1. Scope and Classification of Communications",
        content: [
          "This Marketing Communications Policy explains how Smart Link Computer Business ('SmartLink NG') delivers non-transactional materials and how you can manage your preferences.",
          "We classify our outbound communications into two distinct categories to ensure transparency and compliance with Nigeria Data Protection guidelines:",
          "• Marketing Communications: Optional updates, including seasonal promo discounts, newly introduced services (such as new verification lookups or scratch cards), utility payment incentives, promotional campaigns, and newsletter updates.",
          "• Transactional & Operational Communications: Essential system-generated notifications necessary for the safe, secure, and complete delivery of services. This includes wallet funding alerts, automated debit transaction receipts, password reset OTPs, verification outcome slips, security alerts, and system maintenance advisories.",
        ],
        callout: {
          type: "notice",
          text: "While you can customize or disable Marketing Communications at any time, Operational Communications are vital for service delivery and account security and cannot be opted out of while using the SmartLink NG platform.",
        },
      },
      {
        id: "marketing-channels",
        title: "2. Marketing Communication Channels",
        content: [
          "Subject to your explicit consent, SmartLink NG utilizes the following channels to deliver promotional updates and announcements:",
          "• Email Communications: Regular email newsletters containing system announcements, service guides, promotional offers, and portal tips.",
          "• SMS Broadcasts: Urgent promotional updates, seasonal coupon codes, and brief product launch announcements delivered directly to your registered mobile number.",
          "• WhatsApp Support/Notifications: Direct-to-app notifications concerning platform updates, premium services, and customer assistance benefits delivered via our verified WhatsApp support lines.",
        ],
      },
      {
        id: "consent-mechanics",
        title: "3. Opt-In Mechanics and Separate Consent",
        content: [
          "In alignment with the Nigeria Data Protection Act (NDPA 2023), SmartLink NG operates on a strict prior-consent model for marketing. By default, your account is opted out of marketing campaigns upon registration.",
          "• Separate Consent: Your consent to receive promotional messages is requested separately from your acceptance of our core Terms of Service and Privacy Policy. You are not required to accept marketing materials as a condition of utilizing SmartLink NG's identity lookup or payment services.",
          "• Channel-Specific Selection: You have granular control over each channel. You can opt to receive emails only, while disabling SMS and WhatsApp promotions, or customize any combination that fits your preference.",
        ],
      },
      {
        id: "withdrawing-consent",
        title: "4. Withdrawal of Consent & Opt-Out Procedures",
        content: [
          "You have the absolute right to withdraw your consent to marketing communications at any time. We make the opt-out process direct and friction-free:",
          "• Self-Service Preferences: To update your options instantly, navigate to the Legal Center on the SmartLink NG dashboard, select the 'MARKETING' tab, and toggle your preferences for Email, SMS, or WhatsApp.",
          "• Direct Unsubscribe: Every marketing email contains an automated 'Unsubscribe' link in the footer. Clicking this link will immediately remove you from that specific email campaign list.",
          "• Help Desk Assistance: If you experience any technical difficulties updating your preferences, you can contact our Support & Compliance Desk at Smartlinkcomputerbusiness@gmail.com with the subject line 'Marketing Preference Update'. We will adjust your database settings within forty-eight (48) hours.",
        ],
        callout: {
          type: "success",
          text: "Opting out of marketing communications does not impact your wallet functionality, access to verification rails, or the receipt of critical transactional receipts and security notifications.",
        },
      },
    ],
  },
];

export const getLegalDocumentById = (idOrSlug: string): LegalDocument | undefined => {
  const normalized = idOrSlug.toLowerCase().trim();
  return LEGAL_DOCUMENTS.find(
    (doc) =>
      doc.id.toLowerCase() === normalized ||
      doc.slug.toLowerCase() === normalized ||
      doc.route.toLowerCase() === normalized ||
      doc.route.replace(/^\//, "").toLowerCase() === normalized
  );
};
