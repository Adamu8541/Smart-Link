/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Fingerprint,
  FileText,
  GraduationCap,
  Wifi,
  Building,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle,
  Tag,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { useSiteConfig } from "../context/SiteConfigContext";

export interface ServiceItem {
  id: string;
  name: string;
  category: "IDENTITY" | "CAC" | "EDUCATION" | "VTU" | "GOVERNMENT" | "ICT" | "AI_AUTOMATION";
  description: string;
  price?: number;
  priceLabel?: string;
  actionLabel: string;
  fields: { name: string; label: string; type: string; placeholder: string; required: boolean; options?: string[] }[];
}

interface ServicesGridProps {
  onSelectService: (service: ServiceItem) => void;
}

export const SMART_LINK_SERVICES: ServiceItem[] = [
  // 1. IDENTITY & KYC
  {
    id: "id_nin_ver",
    name: "NIN Verification",
    category: "IDENTITY",
    description: "Verify full NIMC government profiles instantly using the candidate's NIN. Secure database lookup.",
    price: 500,
    actionLabel: "Verify NIN Profile",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "fullName", label: "Full Name (as on card)", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_nin_val",
    name: "NIN Validation",
    category: "IDENTITY",
    description: "Verify the legal validation status of a National Identification Number against active federal databases.",
    price: 500,
    actionLabel: "Validate NIN",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "phone", label: "Contact Phone Number", type: "text", placeholder: "e.g. +2348030000000", required: true }
    ]
  },
  {
    id: "id_vnin_slip",
    name: "VNIN Slip",
    category: "IDENTITY",
    description: "Generate a secure Virtual NIN (VNIN) slip for corporate verification and KYC compliance.",
    price: 1000,
    actionLabel: "Generate VNIN Slip",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "enterpriseId", label: "Enterprise ID / Agent Code", type: "text", placeholder: "e.g. AGENT-9347502", required: true }
    ]
  },
  {
    id: "id_nin_pers",
    name: "NIN Personalization",
    category: "IDENTITY",
    description: "Customize and personalize active NIMC profiles with corporate custom parameters and verified photos.",
    price: 2000,
    actionLabel: "Personalize Profile",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "corpCode", label: "Corporate Affiliation Code", type: "text", placeholder: "e.g. SML-CORP-01", required: true }
    ]
  },
  {
    id: "id_nin_mod",
    name: "NIN Modification",
    category: "IDENTITY",
    description: "Submit corrections and modifications of birth dates, name spelling, or phone linkage for federal NIMC approval.",
    price: 15000,
    actionLabel: "Modify Profile",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "fieldToModify", label: "Field to Modify", type: "select", placeholder: "Select field", required: true, options: ["Full Name", "Date of Birth", "Linked Phone Number", "Gender"] },
      { name: "newValue", label: "New Corrected Value", type: "text", placeholder: "Enter new value", required: true }
    ]
  },
  {
    id: "id_slip_gen",
    name: "Slip Generation",
    category: "IDENTITY",
    description: "Generate and download premium full-sized high-fidelity printable NIMC identification slips.",
    price: 1000,
    actionLabel: "Generate Slip",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "slipStyle", label: "Slip Style", type: "select", placeholder: "Select Style", required: true, options: ["Premium Color Full-Size", "Compact Wallet Card", "Standard Black & White"] }
    ]
  },
  {
    id: "id_ipe_clearance",
    name: "IPE Clearance",
    category: "IDENTITY",
    description: "Process official IPE biometric clearance certificates for corporate security audits.",
    price: 5000,
    actionLabel: "Process Clearance",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "fullName", label: "Applicant's Full Legal Name", type: "text", placeholder: "e.g. Yusuf Umar", required: true },
      { name: "auditCode", label: "Audit Verification Code", type: "text", placeholder: "e.g. IPE-AUD-9952", required: true }
    ]
  },
  {
    id: "id_bvn_ver",
    name: "BVN Verification",
    category: "IDENTITY",
    description: "Confirm and validate Central Bank of Nigeria bank verification details against CBN servers.",
    price: 500,
    actionLabel: "Verify BVN",
    fields: [
      { name: "idNumber", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "fullName", label: "Authorized Full Name", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_nin_bvn",
    name: "NIN-BVN Linkage",
    category: "IDENTITY",
    description: "Assistance to link NIMC NIN profiles with CBN Bank Verification records for commercial accounts.",
    price: 1500,
    actionLabel: "Link NIN & BVN",
    fields: [
      { name: "nin", label: "NIN Number", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "bvn", label: "BVN Number", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "phoneNumber", label: "Linked Phone Number", type: "text", placeholder: "e.g. +2348030000000", required: true }
    ]
  },
  {
    id: "id_vnin_to_nibss",
    name: "VNIN to NIBSS",
    category: "IDENTITY",
    description: "Link and resolve VNIN to NIBSS database for banking and financial operations.",
    price: 1000,
    actionLabel: "Resolve VNIN to NIBSS",
    fields: [
      { name: "vnin", label: "Virtual NIN (VNIN)", type: "text", placeholder: "e.g. AB12345678901Z", required: true },
      { name: "bvn", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "fullName", label: "Full Name (as on BVN)", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_bvn_user",
    name: "BVN User",
    category: "IDENTITY",
    description: "Query comprehensive user bio-data and facial profile logs from NIBSS central database.",
    price: 500,
    actionLabel: "Query BVN User Profile",
    fields: [
      { name: "bvn", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "phone", label: "Linked Phone Number", type: "text", placeholder: "e.g. 08031234567", required: true }
    ]
  },
  {
    id: "id_bvn_modification",
    name: "BVN Modification",
    category: "IDENTITY",
    description: "Submit request to correct or modify registered BVN birth dates, name spelling, or phone linkage.",
    price: 15000,
    actionLabel: "Submit Modification Request",
    fields: [
      { name: "bvn", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "fieldToModify", label: "Field to Correct", type: "select", placeholder: "Select field", required: true, options: ["Full Name", "Date of Birth", "Linked Phone Number"] },
      { name: "newValue", label: "New Corrected Value", type: "text", placeholder: "Enter correct details", required: true }
    ]
  },
  {
    id: "id_premium_slip",
    name: "Premium Slip",
    category: "IDENTITY",
    description: "Generate and download premium printable verified banking or identity cards.",
    price: 1000,
    actionLabel: "Generate Premium Slip",
    fields: [
      { name: "bvnOrNin", label: "BVN or NIN", type: "text", placeholder: "Enter BVN or NIN number", required: true },
      { name: "cardFormat", label: "Card/Slip Format", type: "select", placeholder: "Select format", required: true, options: ["Premium Plastic Card Format", "Official Digital Slip", "A4 Hardcopy Certificate Format"] }
    ]
  },
  {
    id: "id_bvn_retrieval",
    name: "BVN Retrieval",
    category: "IDENTITY",
    description: "Retrieve forgotten BVN details securely using phone number and biographical record match.",
    price: 1000,
    actionLabel: "Retrieve BVN Details",
    fields: [
      { name: "fullName", label: "Full Name (First, Middle, Surname)", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true },
      { name: "phone", label: "Registered Phone Number", type: "text", placeholder: "e.g. 08031234567", required: true },
      { name: "dob", label: "Date of Birth", type: "text", placeholder: "DD/MM/YYYY or YYYY-MM-DD", required: true }
    ]
  },
  {
    id: "id_cac_registration",
    name: "CAC Registration",
    category: "CAC",
    description: "Register and incorporate new Business Names, Companies (LTD), or NGOs with the Corporate Affairs Commission.",
    price: 15000,
    actionLabel: "Start Registration",
    fields: [
      { name: "proposedName", label: "Proposed Business Name (Choice 1)", type: "text", placeholder: "e.g. Agri-Allied Ventures", required: true },
      { name: "alternativeName", label: "Alternative Proposed Name (Choice 2)", type: "text", placeholder: "e.g. Agritech Ventures", required: true },
      { name: "type", label: "Filing Type", type: "select", placeholder: "Select type", required: true, options: ["Business Name Registration", "Private Limited Company (LTD)", "Incorporated Trustees (NGO)"] },
      { name: "objective", label: "Main Business Objective", type: "textarea", placeholder: "Provide business goal description...", required: true }
    ]
  },
  {
    id: "id_tin_verification",
    name: "TIN Verification",
    category: "IDENTITY",
    description: "Verify official federal Tax Identification Number (TIN) records from Joint Tax Board / FIRS database.",
    price: 500,
    actionLabel: "Verify TIN Record",
    fields: [
      { name: "tinNumber", label: "Tax Identification Number (TIN)", type: "text", placeholder: "e.g. 23456789-0001", required: true }
    ]
  },
  {
    id: "id_bank_account_verification",
    name: "Bank Account Verification",
    category: "IDENTITY",
    description: "Confirm bank account holder's name and account validity across all Nigerian commercial banks, MFBs, and PSBs via NIBSS gateway.",
    price: 100,
    actionLabel: "Verify Account Name",
    fields: [
      { name: "accountNumber", label: "Account Number (10 Digits)", type: "text", placeholder: "e.g. 0123456789", required: true },
      { name: "bankCode", label: "Select Nigerian Bank", type: "select", placeholder: "Choose Nigerian Bank", required: true }
    ]
  },
  {
    id: "id_tax_id_search",
    name: "Tax ID Search",
    category: "CAC",
    description: "Search, verify, and retrieve official federal Tax Identification Number (TIN) database profiles.",
    price: 500,
    actionLabel: "Search Tax ID",
    fields: [
      { name: "companyName", label: "Company / Business Name", type: "text", placeholder: "e.g. Smart Link Integrated Ltd", required: true },
      { name: "rcNumber", label: "RC or Business Number (Optional)", type: "text", placeholder: "e.g. RC 1908234", required: false }
    ]
  },

  // 2. CAC REGISTRATIONS
  {
    id: "cac_biz_name",
    name: "CAC Business Name Registration",
    category: "CAC",
    description: "Official registration of Business Names with the Corporate Affairs Commission. Filing includes Abuja agency approvals.",
    price: 15000,
    actionLabel: "Start Corporate Filing",
    fields: [
      { name: "proposedName1", label: "Proposed Business Name (Choice 1)", type: "text", placeholder: "e.g. Agro-Allied Ventures", required: true },
      { name: "proposedName2", label: "Proposed Business Name (Choice 2)", type: "text", placeholder: "e.g. Agritech Ventures", required: true },
      { name: "businessType", label: "Business Sector/Type", type: "text", placeholder: "e.g. Agriculture and Trading", required: true },
      { name: "objective", label: "Main Business Objective", type: "textarea", placeholder: "e.g. Food production and fertilizer trading.", required: true },
      { name: "proprietorName", label: "Primary Proprietor Full Name", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true },
      { name: "proprietorPhone", label: "Proprietor Contact Phone", type: "text", placeholder: "e.g. +2348030000000", required: true }
    ]
  },
  {
    id: "cac_ltd_co",
    name: "CAC Limited Liability Company",
    category: "CAC",
    description: "Register a fully-fledged private limited company (LTD) with share capital allocations and TIN with FIRS.",
    price: 25000,
    actionLabel: "Start LTD Filing",
    fields: [
      { name: "proposedName1", label: "Proposed Company Name (Choice 1)", type: "text", placeholder: "e.g. Logistics Ltd", required: true },
      { name: "proposedName2", label: "Proposed Company Name (Choice 2)", type: "text", placeholder: "e.g. Cargo and Logistics Ltd", required: true },
      { name: "shareCapital", label: "Authorized Share Capital (e.g. 1M)", type: "select", placeholder: "Select Share Capital", required: true, options: ["1,000,000 Shares", "2,000,000 Shares", "5,000,000 Shares"] },
      { name: "objective", label: "Company Objectives", type: "textarea", placeholder: "Farming, logistics, civil contracting.", required: true },
      { name: "directorName", label: "First Director Full Name", type: "text", placeholder: "Director Name", required: true }
    ]
  },
  {
    id: "cac_scuml",
    name: "SCUML EFCC Registration Assistance",
    category: "CAC",
    description: "Assistance with obtaining your SCUML anti-money laundering certification from EFCC, vital for corporate accounts.",
    price: 8000,
    actionLabel: "Register SCUML Profile",
    fields: [
      { name: "companyName", label: "Registered Company/Business Name", type: "text", placeholder: "Company Name on CAC", required: true },
      { name: "rcNumber", label: "RC or BN Number", type: "text", placeholder: "e.g. RC 1908234", required: true },
      { name: "address", label: "Business Headquarters Address", type: "text", placeholder: "No. Street, City Center", required: true }
    ]
  },

  // 3. EDUCATION SCRATCH CARDS
  {
    id: "edu_waec",
    name: "WAEC Result Checker e-Pin",
    category: "EDUCATION",
    description: "Official WAEC result checker scratch cards. Token sent instantly via SMS and transaction logs.",
    price: 3200,
    actionLabel: "Buy WAEC PIN",
    fields: [
      { name: "quantity", label: "Quantity", type: "number", placeholder: "e.g. 1", required: true },
      { name: "email", label: "Delivery Email Address", type: "email", placeholder: "e.g. student@gmail.com", required: true }
    ]
  },
  {
    id: "edu_neco",
    name: "NECO Result Token",
    category: "EDUCATION",
    description: "Get official National Examination Council NECO result checker tokens instantly to view results.",
    price: 1500,
    actionLabel: "Buy NECO Token",
    fields: [
      { name: "quantity", label: "Quantity", type: "number", placeholder: "e.g. 1", required: true },
      { name: "phone", label: "SMS Destination Phone Number", type: "text", placeholder: "+23480...", required: true }
    ]
  },
  {
    id: "edu_jamb",
    name: "JAMB ePIN Processing",
    category: "EDUCATION",
    description: "Purchase official JAMB examination registration ePins, result slips, or change of course slips.",
    price: 4500,
    actionLabel: "Buy JAMB ePIN",
    fields: [
      { name: "examNumber", label: "JAMB Registration or Profile Code", type: "text", placeholder: "e.g. 55667788AB", required: true },
      { name: "candidateName", label: "Candidate Full Name", type: "text", placeholder: "e.g. Fatima Yusuf", required: true }
    ]
  },

  // 4. VTU & UTILITIES
  {
    id: "vtu_airtime",
    name: "VTU Instant Airtime Purchase",
    category: "VTU",
    description: "Top-up your phone line instantly with MTN, Airtel, Glo, or 9mobile airtime. Earn 2% referral bonus.",
    priceLabel: "Pay exact amount",
    actionLabel: "Top Up Airtime",
    fields: [
      { name: "provider", label: "Telecom Provider", type: "select", placeholder: "Select Provider", required: true, options: ["MTN Nigeria", "Airtel Nigeria", "Glo Mobile", "9mobile"] },
      { name: "phoneNumber", label: "Recipient Phone Number", type: "text", placeholder: "e.g. 08031234567", required: true },
      { name: "amount", label: "Airtime Amount (₦)", type: "number", placeholder: "e.g. 1000", required: true }
    ]
  },
  {
    id: "vtu_data",
    name: "VTU Telecom Data Bundles",
    category: "VTU",
    description: "Highly discounted MTN SME data, Glo Gifting, and Airtel corporate bundles. Under 10 seconds delivery.",
    priceLabel: "Select plan",
    actionLabel: "Buy Data Bundle",
    fields: [
      { name: "provider", label: "Telecom Provider", type: "select", placeholder: "Select Provider", required: true, options: ["MTN SME Data", "Airtel Corporate Gifting", "Glo Gifting", "9mobile Data"] },
      { name: "extra", label: "Select Data Package", type: "select", placeholder: "Select Package", required: true, options: ["1GB SME (₦350)", "2GB SME (₦700)", "5GB SME (₦1,750)", "10GB SME (₦3,500)"] },
      { name: "phoneNumber", label: "Recipient Phone Number", type: "text", placeholder: "e.g. 08031234567", required: true },
      { name: "amount", label: "Verify Cost (₦)", type: "number", placeholder: "e.g. 350", required: true }
    ]
  },
  {
    id: "vtu_electricity",
    name: "Prepaid Electricity Token",
    category: "VTU",
    description: "Instant energy tokens for Jos (JEDC), Kaduna, Abuja (AEDC), Ikeja, and Eko electricity distribution companies.",
    priceLabel: "Pay bill value",
    actionLabel: "Generate Power Token",
    fields: [
      { name: "provider", label: "Electricity DisCo Office", type: "select", placeholder: "Select Office", required: true, options: ["JEDC - Jos Electricity", "AEDC - Abuja Electricity", "KAEDCO - Kaduna Electricity", "IKEDC - Ikeja Electricity"] },
      { name: "customerId", label: "Meter Number / Account ID", type: "text", placeholder: "e.g. 0130987123", required: true },
      { name: "amount", label: "Token Purchase Amount (₦)", type: "number", placeholder: "e.g. 5000", required: true }
    ]
  },

  // 5. GOVERNMENT SERVICES
  {
    id: "gov_passport",
    name: "Nigerian Passport Application Filing",
    category: "GOVERNMENT",
    description: "Assistance with filling out immigration passport portal forms and booking biometric physical appointments.",
    price: 3500,
    actionLabel: "Initiate Booking",
    fields: [
      { name: "fullName", label: "Applicant's Full Legal Name", type: "text", placeholder: "e.g. Yusuf Umar", required: true },
      { name: "nin", label: "NIN Number (Mandatory)", type: "text", placeholder: "NIN Number", required: true },
      { name: "passportType", label: "Passport Type", type: "select", placeholder: "Select Type", required: true, options: ["Fresh Application (32 Page - 5 Years)", "Renewal / Re-issue", "Fresh Application (64 Page - 10 Years)"] }
    ]
  },

  // 6. ICT DEVELOPMENT & PRINTING
  {
    id: "ict_website",
    name: "Custom Website & Portal Design",
    category: "ICT",
    description: "High-grade premium business websites, school management portals, or mobile applications designed by our core engineers.",
    priceLabel: "Custom Consultation Quote",
    actionLabel: "Request Portal Design",
    fields: [
      { name: "orgName", label: "Business/School/Organization Name", type: "text", placeholder: "e.g. Academy Portal", required: true },
      { name: "description", label: "Required Features & Pages", type: "textarea", placeholder: "e.g. Result management, fees billing, student database.", required: true },
      { name: "contactEmail", label: "Contact Email", type: "email", placeholder: "e.g. manager@gmail.com", required: true }
    ]
  }
];

export default function ServicesGrid({ onSelectService }: ServicesGridProps) {
  const { getServicePrice } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "ALL", label: "All Solutions", icon: HelpCircle },
    { id: "IDENTITY", label: "KYC & NIN Biometrics", icon: Fingerprint },
    { id: "CAC", label: "CAC Registrations", icon: Building },
    { id: "EDUCATION", label: "School Cards (WAEC/JAMB)", icon: GraduationCap },
    { id: "VTU", label: "VTU Airtime & Utilities", icon: Wifi },
    { id: "GOVERNMENT", label: "E-Gov & Passports", icon: FileText },
    { id: "ICT", label: "ICT Portal Building", icon: Sparkles }
  ];

  const filteredServices = SMART_LINK_SERVICES.filter((srv) => {
    const matchesTab = activeTab === "ALL" || srv.category === activeTab;
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="py-12 bg-[#F5F7FA]" id="services-grid-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Block */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0F2D5C] text-xs font-bold tracking-wider uppercase border border-blue-200">
            Product Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Our Elite Digital Enterprise Services
          </h2>
          <p className="text-[#4B5563] font-normal">
            Providing Nigerians and corporations with instantaneous API identity verifications, Corporate CAC filings, VTU top ups, and official government application assistances.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-[#0F2D5C]" />
            </div>
            <input
              type="text"
              id="search-services-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registrations, airtime, scratch cards..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]/20 focus:border-[#0F2D5C] text-sm shadow-xs transition-all bg-white font-medium text-[#111827]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280] hover:text-[#0F2D5C] transition-colors"
                title="Clear Search"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {/* Quick-tap Tag Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-[#6B7280] font-medium">Try searching:</span>
            {[
              { label: "NIN Biometrics", query: "NIN" },
              { label: "CAC Filings", query: "CAC" },
              { label: "WAEC Pins", query: "WAEC" },
              { label: "Airtime Top-up", query: "Airtime" },
              { label: "Prepaid Electricity", query: "Electricity" },
              { label: "Passport Booking", query: "Passport" }
            ].map((tag) => (
              <button
                key={tag.query}
                onClick={() => {
                  setSearchQuery(tag.query);
                  setActiveTab("ALL");
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  searchQuery.toLowerCase() === tag.query.toLowerCase()
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-blue-50 hover:text-[#0F2D5C]"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Matches Counter */}
          {searchQuery && (
            <p className="text-center text-xs font-bold text-[#0F2D5C]">
              Found {filteredServices.length} {filteredServices.length === 1 ? "solution" : "solutions"} matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Category Tab List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin border-b border-[#E5E7EB]">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                id={`tab-service-${cat.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#0F2D5C] text-white shadow-xs border border-[#0F2D5C]"
                    : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:border-[#0F2D5C]"
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Services Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => {
            const livePrice = srv.price !== undefined ? getServicePrice(srv.id, srv.price) : undefined;
            return (
              <motion.div
                layout
                key={srv.id}
                className="group flex flex-col justify-between p-6 rounded-2xl border border-[#E5E7EB] hover:border-[#0F2D5C] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md transition-all bg-white relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Category Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase bg-blue-50 text-[#0F2D5C] px-2.5 py-0.5 rounded font-bold tracking-wider">
                      {srv.category}
                    </span>
                    {livePrice !== undefined && (
                      <span className="text-xs font-bold text-[#0F2D5C] bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono border border-blue-100">
                        <Tag className="h-3 w-3" />
                        ₦{livePrice.toLocaleString()}
                      </span>
                    )}
                    {srv.priceLabel && (
                      <span className="text-[10px] text-[#6B7280] italic bg-[#F5F7FA] px-2 py-0.5 rounded">
                        {srv.priceLabel}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors">
                    {srv.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <CheckCircle className="h-3.5 w-3.5 text-[#0F2D5C]" />
                    Instant processing
                  </span>
                  <button
                    onClick={() => onSelectService({ ...srv, price: livePrice ?? srv.price })}
                    id={`btn-order-${srv.id}`}
                    className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {srv.actionLabel}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="col-span-full py-12 text-center space-y-3">
              <p className="text-[#6B7280] text-sm font-medium">No digital solutions found matching your search criteria.</p>
              <button
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] hover:border-[#0F2D5C] rounded-xl text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
