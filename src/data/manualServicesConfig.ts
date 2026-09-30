export interface ManualFieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date" | "file" | "email" | "tel";
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  accept?: string; // for file uploads e.g. "image/*,application/pdf"
}

export interface ManualServiceConfig {
  id: string;
  name: string;
  category: "CAC" | "IDENTITY" | "GOVERNMENT" | "ICT" | "BUSINESS";
  description: string;
  price: number;
  actionLabel: string;
  processingTime: string;
  recipientEmail?: string; // Fallback or override
  instructions?: string[];
  fields: ManualFieldDefinition[];
}

export const MANUAL_SERVICES_CATALOG: ManualServiceConfig[] = [
  // 1. CAC BUSINESS NAME REGISTRATION
  {
    id: "cac_biz_name",
    name: "CAC Business Name Registration",
    category: "CAC",
    description: "Official registration of Business Names with the Corporate Affairs Commission (CAC Nigeria). Includes Certificate of Incorporation & Status Report.",
    price: 28000,
    actionLabel: "Submit Business Name Filing",
    processingTime: "24 - 48 Hours",
    instructions: [
      "Provide two distinct proposed business names in order of preference.",
      "Ensure passport photograph has a white background.",
      "Valid Government ID includes NIN Slip, International Passport, Driver's License, or Voter's Card."
    ],
    fields: [
      { name: "proposedName1", label: "Proposed Business Name (Option 1)", type: "text", required: true, helpText: "First choice business name for CAC reservation" },
      { name: "proposedName2", label: "Proposed Business Name (Option 2)", type: "text", required: true, helpText: "Alternative name if Option 1 is reserved or rejected" },
      { name: "natureOfBusiness", label: "Nature of Business", type: "text", required: true, helpText: "Primary industry or category (e.g. General Merchandise, Agriculture, ICT, Logistics)" },
      { name: "objectivesOfBusiness", label: "Objectives of the Business", type: "textarea", required: true, helpText: "Detailed principal objects, activities, and commercial aims of the business" },
      { name: "businessAddress", label: "Full Physical Business Address", type: "textarea", required: true },
      { name: "stateAndLga", label: "State & LGA of Operation", type: "text", required: true },
      { name: "proprietorFullName", label: "Proprietor / Owner Full Legal Name", type: "text", required: true, helpText: "Must match your National ID records exactly" },
      { name: "proprietorPhone", label: "Proprietor Contact Phone Number", type: "tel", required: true },
      { name: "proprietorEmail", label: "Proprietor Active Email Address", type: "email", required: true },
      { name: "proprietorNin", label: "Proprietor National Identification Number (NIN)", type: "text", required: true },
      { name: "proprietorDob", label: "Proprietor Date of Birth", type: "date", required: true },
      { name: "proprietorGender", label: "Gender", type: "select", options: ["Male", "Female"], required: true },
      { name: "proprietorResidentialAddress", label: "Proprietor Residential Home Address", type: "textarea", required: true },
      // Files
      { name: "passportPhoto", label: "Proprietor Passport Photograph", type: "file", accept: "image/*", required: true, helpText: "Clear passport photo with white/light background (JPG, PNG)" },
      { name: "validIdCard", label: "Valid Means of ID (NIN / Voter / Passport)", type: "file", accept: "image/*,application/pdf", required: true, helpText: "Clear image or PDF scan of government-issued ID" },
      { name: "signatureSample", label: "Proprietor Signature Sample", type: "file", accept: "image/*", required: true, helpText: "Sign clearly on a white paper and snap/upload" }
    ]
  },

  // 2. CAC LIMITED LIABILITY COMPANY (LTD)
  {
    id: "cac_ltd_co",
    name: "CAC Limited Liability Company (LTD) Incorporation",
    category: "CAC",
    description: "Full private company incorporation (LTD) with 1,000,000+ Authorized Shares, Memorandum & Articles of Association (MEMART), and automatic FIRS Tax ID (TIN).",
    price: 35000,
    actionLabel: "Submit Company Incorporation Filing",
    processingTime: "48 - 72 Hours",
    instructions: [
      "Company must have at least 1 or 2 Directors and at least 1 Shareholder (can be the same person).",
      "Standard share capital defaults to 1,000,000 Ordinary Shares unless otherwise specified."
    ],
    fields: [
      { name: "companyName1", label: "Proposed Company Name (Option 1)", type: "text", required: true },
      { name: "companyName2", label: "Proposed Company Name (Option 2)", type: "text", required: true },
      { name: "shareCapital", label: "Authorized Share Capital", type: "select", options: ["1,000,000 Ordinary Shares (Standard)", "2,000,000 Ordinary Shares", "5,000,000 Ordinary Shares", "10,000,000 Ordinary Shares"], required: true },
      { name: "natureOfBusiness", label: "Nature of Business", type: "text", required: true, helpText: "Principal industry or business sector" },
      { name: "objectivesOfBusiness", label: "Objectives of the Business", type: "textarea", required: true, helpText: "Detailed principal objects, activities, and corporate aims of the company" },
      { name: "registeredOfficeAddress", label: "Registered Company Head Office Address", type: "textarea", required: true },
      { name: "officialCompanyEmail", label: "Official Company Email Address", type: "email", required: true },
      { name: "director1Name", label: "First Director Full Legal Name", type: "text", required: true },
      { name: "director1Phone", label: "First Director Phone Number", type: "tel", required: true },
      { name: "director1Email", label: "First Director Email Address", type: "email", required: true },
      { name: "director1Nin", label: "First Director NIN Number", type: "text", required: true },
      { name: "director1Address", label: "First Director Residential Address", type: "textarea", required: true },
      { name: "director1Shares", label: "First Director Share Allocation (%)", type: "text", required: true },
      { name: "director2Details", label: "Second Director Details (If Applicable)", type: "textarea", required: false },
      // Files
      { name: "director1Passport", label: "First Director Passport Photograph", type: "file", accept: "image/*", required: true, helpText: "White background passport photo" },
      { name: "director1Id", label: "First Director Government ID Card", type: "file", accept: "image/*,application/pdf", required: true, helpText: "NIN Slip / Int'l Passport / Driver's License" },
      { name: "director1Signature", label: "First Director Signature Sample", type: "file", accept: "image/*", required: true, helpText: "Signed on clean white paper" }
    ]
  },

  // 3. CAC NGO REGISTRATION
  {
    id: "cac_ngo",
    name: "CAC NGO Registration",
    category: "CAC",
    description: "Official non-profit NGO incorporation with the Corporate Affairs Commission (CAC Part F). Connect directly with our CAC Registration Officer on WhatsApp for requirements, registration fee, and step-by-step procedure.",
    price: 0,
    actionLabel: "Chat on WhatsApp with Registration Officer",
    processingTime: "WhatsApp Direct Desk",
    fields: []
  },

  // 4. CAC INCORPORATED TRUSTEES REGISTRATION
  {
    id: "cac_incorporated_trustee",
    name: "CAC Incorporated Trustees Registration",
    category: "CAC",
    description: "Official incorporation of Foundations, Charities, Churches, Mosques, Clubs, and Associations with CAC Nigeria. Connect directly with our CAC Registration Officer on WhatsApp for requirements, registration fee, and procedure.",
    price: 0,
    actionLabel: "Chat on WhatsApp with Registration Officer",
    processingTime: "WhatsApp Direct Desk",
    fields: []
  },

  // Backward compatibility alias for cac_ngo_trustee
  {
    id: "cac_ngo_trustee",
    name: "CAC NGO & Incorporated Trustees Registration",
    category: "CAC",
    description: "Official registration of Non-Governmental Organizations (NGOs), Foundations, Charities, and Religious Bodies. Connect directly with our CAC Registration Officer on WhatsApp for requirements, registration fee, and procedure.",
    price: 0,
    actionLabel: "Chat on WhatsApp with Registration Officer",
    processingTime: "WhatsApp Direct Desk",
    fields: []
  },

  // 4. CAC ANNUAL RETURNS FILING
  {
    id: "cac_annual_returns",
    name: "CAC Annual Returns Filing",
    category: "CAC",
    description: "Keep your registered business, company, or NGO active on the CAC portal and avoid status inactivation, default penalties, or bank restrictions. Connect directly with our CAC Compliance Officer on WhatsApp for filing audit, requirements, fee, and step-by-step procedure.",
    price: 0,
    actionLabel: "Chat on WhatsApp with Compliance Officer",
    processingTime: "WhatsApp Direct Desk",
    fields: []
  },

  // 5. SCUML ANTI-MONEY LAUNDERING CERTIFICATE
  {
    id: "cac_scuml",
    name: "SCUML Certificate Registration",
    category: "CAC",
    description: "Official SCUML certification, mandatory for opening and operating corporate bank accounts for Designated Non-Financial Businesses & Professions (DNFBPs) and NGOs. Connect directly with our SCUML Compliance Desk on WhatsApp for requirements, fee, and procedure.",
    price: 0,
    actionLabel: "Chat on WhatsApp with Compliance Officer",
    processingTime: "WhatsApp Direct Desk",
    fields: []
  },

  // 7. NIN MODIFICATION (NAME, DOB, PHONE, ADDRESS)
  {
    id: "id_nin_mod",
    name: "NIN Data Modification Request",
    category: "IDENTITY",
    description: "Submit official modification and correction requests for NIN data (Date of Birth, Name Spelling/Arrangement, Phone Number linkage, or Address change) directly with authorized processing desk.",
    price: 15000,
    actionLabel: "Submit NIN Modification",
    processingTime: "24 - 48 Hours",
    instructions: [
      "For Date of Birth modification, an official NPC Birth Certificate or Age Declaration is mandatory.",
      "For Name correction, an affidavit or newspaper publication is recommended."
    ],
    fields: [
      { name: "ninNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "11-digit NIN to modify", required: true },
      { name: "currentNameOnNin", label: "Current Name as it appears on NIN", type: "text", placeholder: "Current full name", required: true },
      { name: "fieldToModify", label: "Field You Want to Modify / Correct", type: "select", options: ["Date of Birth (DOB)", "Name Arrangement / Spelling", "Linked Phone Number", "Residential Address", "Gender / Title"], required: true },
      { name: "newCorrectValue", label: "New Correct Value / Details", type: "text", placeholder: "Enter exact corrected name, date of birth, or phone", required: true },
      { name: "reasonForChange", label: "Reason for Modification Request", type: "textarea", placeholder: "e.g. Typing error during initial NIMC capture", required: true },
      { name: "applicantPhone", label: "Applicant Reachable Phone Number", type: "tel", placeholder: "e.g. 08031234567", required: true },
      { name: "applicantEmail", label: "Applicant Email Address", type: "email", placeholder: "e.g. applicant@gmail.com", required: true },
      // Files
      { name: "currentNinSlip", label: "Current NIN Slip or Photo", type: "file", accept: "image/*,application/pdf", required: true },
      { name: "supportingDoc", label: "Supporting Document (NPC Birth Cert / Court Affidavit)", type: "file", accept: "image/*,application/pdf", required: true, helpText: "Birth Certificate for DOB, Court Affidavit / Newspaper for Name change" },
      { name: "passportPhoto", label: "Recent Clear Passport Photo", type: "file", accept: "image/*", required: true }
    ]
  },

  // 8. BVN MODIFICATION & CORRECTION
  {
    id: "id_bvn_modification",
    name: "BVN Bio-Data Modification Request",
    category: "IDENTITY",
    description: "Submit request to correct or update BVN details (Name, Date of Birth, Linked Phone Number) for seamless banking compliance.",
    price: 15000,
    actionLabel: "Submit BVN Modification",
    processingTime: "24 - 48 Hours",
    fields: [
      { name: "bvnNumber", label: "Bank Verification Number (BVN)", type: "text", placeholder: "11-digit BVN", required: true },
      { name: "ninNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "11-digit NIN", required: true },
      { name: "fieldToModify", label: "Field to Correct on BVN", type: "select", options: ["Date of Birth", "Full Name", "Phone Number", "Address"], required: true },
      { name: "newCorrectDetails", label: "New Correct Details", type: "text", placeholder: "Exact new value", required: true },
      { name: "enrolledBank", label: "Bank Where BVN Was Originally Enrolled", type: "text", placeholder: "e.g. First Bank, Access Bank, GTBank, Zenith", required: true },
      { name: "contactPhone", label: "Contact Phone Number", type: "tel", placeholder: "e.g. 08031234567", required: true },
      { name: "bvnOrNINSlip", label: "Upload NIN Slip or BVN Printout", type: "file", accept: "image/*,application/pdf", required: true },
      { name: "courtAffidavitOrId", label: "Supporting Document / Valid ID", type: "file", accept: "image/*,application/pdf", required: true }
    ]
  },

  // 9. NIGERIAN PASSPORT APPLICATION ASSISTANCE & BOOKING
  {
    id: "gov_passport",
    name: "Nigerian Immigration Passport Application & Appointment",
    category: "GOVERNMENT",
    description: "Complete Nigerian Standard Passport application, portal enrollment scheduling, payment processing, and interview biometric capture appointment booking.",
    price: 5000,
    actionLabel: "Submit Passport Booking Request",
    processingTime: "24 Hours for Appointment Slip",
    fields: [
      { name: "fullName", label: "Applicant's Full Legal Name", type: "text", placeholder: "First Name, Middle Name, Surname", required: true },
      { name: "ninNumber", label: "NIN Number (Mandatory for Immigration)", type: "text", placeholder: "11-digit NIN", required: true },
      { name: "passportType", label: "Passport Booklet Type & Validity", type: "select", options: ["Fresh Application (32 Pages - 5 Years)", "Fresh Application (64 Pages - 10 Years)", "Renewal / Re-issue (32 Pages - 5 Years)", "Renewal / Re-issue (64 Pages - 10 Years)", "Lost / Damaged Passport Replacement"], required: true },
      { name: "preferredPassportOffice", label: "Preferred Immigration Passport Office / State", type: "text", placeholder: "e.g. NIS Headquarters Abuja, Alausa Lagos, Kaduna Command, Kano Command", required: true },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { name: "placeOfBirth", label: "Place / Town of Birth", type: "text", placeholder: "e.g. Zaria, Kaduna", required: true },
      { name: "stateOfOrigin", label: "State of Origin & LGA", type: "text", placeholder: "e.g. Kano State, Municipal LGA", required: true },
      { name: "residentialAddress", label: "Current Residential Address", type: "textarea", placeholder: "Full residence address", required: true },
      { name: "nextOfKinName", label: "Next of Kin Full Name & Relationship", type: "text", placeholder: "e.g. Zainab Muhammad (Sister)", required: true },
      { name: "nextOfKinPhone", label: "Next of Kin Phone Number", type: "tel", placeholder: "e.g. 08023456789", required: true },
      { name: "applicantPhone", label: "Applicant Phone Number", type: "tel", placeholder: "e.g. 08031234567", required: true },
      { name: "applicantEmail", label: "Applicant Email", type: "email", placeholder: "e.g. applicant@example.com", required: true },
      // Files
      { name: "passportPhoto", label: "Applicant White-Background Passport Photo", type: "file", accept: "image/*", required: true },
      { name: "ninSlip", label: "Applicant NIN Slip Scan", type: "file", accept: "image/*,application/pdf", required: true },
      { name: "indigeneCertificate", label: "State of Origin / Indigene Certificate / Birth Cert", type: "file", accept: "image/*,application/pdf", required: false }
    ]
  },

  // 10. CUSTOM ICT WEBSITE & PORTAL DESIGN CONSULTATION
  {
    id: "ict_website",
    name: "Custom Website, Portal & Mobile App Development",
    category: "ICT",
    description: "Professional development of responsive web applications, fintech VTU systems, school management portals, and e-commerce platforms tailored to your brand.",
    price: 10000,
    actionLabel: "Submit Project Specification",
    processingTime: "Consultation Call within 4 Hours",
    fields: [
      { name: "clientOrOrgName", label: "Client or Business / Organization Name", type: "text", placeholder: "e.g. Apex Digital Solutions", required: true },
      { name: "projectType", label: "Project Category", type: "select", options: ["Fintech / VTU / Bill Payment Platform", "Corporate Business Website", "School / University Portal", "E-Commerce Multi-Vendor Store", "Custom Web Application / SaaS", "Mobile App (Android & iOS)"], required: true },
      { name: "projectScope", label: "Project Description & Required Features", type: "textarea", placeholder: "Describe what you want the website or portal to do in detail...", required: true },
      { name: "targetBudget", label: "Estimated Target Budget Range (₦)", type: "select", options: ["₦100,000 - ₦250,000", "₦250,000 - ₦500,000", "₦500,000 - ₦1,000,000", "₦1,000,000+ Enterprise"], required: true },
      { name: "preferredTimeline", label: "Expected Delivery Timeline", type: "select", options: ["Urgent (Within 1 - 2 Weeks)", "Standard (2 - 4 Weeks)", "Flexible / Phase-by-Phase"], required: true },
      { name: "contactPerson", label: "Contact Person Full Name", type: "text", placeholder: "e.g. Ibrahim Adamu", required: true },
      { name: "contactPhone", label: "Contact Phone / WhatsApp Number", type: "tel", placeholder: "e.g. 08031234567", required: true },
      { name: "contactEmail", label: "Contact Email Address", type: "email", placeholder: "e.g. client@example.com", required: true },
      { name: "referenceDocOrLogo", label: "Upload Brand Logo or Project Spec Document (Optional)", type: "file", accept: "image/*,application/pdf,.doc,.docx", required: false }
    ]
  }
];

export const DEFAULT_MANUAL_ADMIN_EMAIL = "admin@smartlink.ng";

export interface SubServiceOption {
  id: string;
  stepNum: string;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
}

/**
 * Official CAC Registration sub-services list
 */
export const CAC_SERVICES_LIST: SubServiceOption[] = [
  {
    id: "cac_biz_name",
    stepNum: "1",
    title: "CAC Business Name Registration",
    shortTitle: "1. Business Name",
    badge: "₦28,000",
    description: "Register sole proprietorship or enterprise with CAC Nigeria",
  },
  {
    id: "cac_ltd_co",
    stepNum: "2",
    title: "CAC Limited Liability Company (LTD)",
    shortTitle: "2. LTD Company",
    badge: "₦35,000",
    description: "Full private company incorporation with 1M+ shares & MEMART",
  },
  {
    id: "cac_ngo",
    stepNum: "3",
    title: "CAC NGO Registration",
    shortTitle: "3. NGO",
    badge: "WhatsApp Desk",
    description: "Non-Governmental Organization & Civil Society registration",
  },
  {
    id: "cac_incorporated_trustee",
    stepNum: "4",
    title: "CAC Incorporated Trustees",
    shortTitle: "4. Trustees",
    badge: "WhatsApp Desk",
    description: "Foundation, church, mosque, club, or association registration",
  },
  {
    id: "cac_annual_returns",
    stepNum: "5",
    title: "CAC Annual Returns Filing",
    shortTitle: "5. Annual Returns",
    badge: "WhatsApp Desk",
    description: "Maintain active corporate status with annual compliance filing",
  },
  {
    id: "cac_scuml",
    stepNum: "6",
    title: "SCUML Certificate Registration",
    shortTitle: "6. SCUML Certificate",
    badge: "WhatsApp Desk",
    description: "Anti-money laundering compliance certificate for bank accounts",
  },
];

export function isManualService(serviceId: string): boolean {
  if (!serviceId) return false;
  const lower = serviceId.toLowerCase();

  // Specific exclusions (automated lookups)
  if (
    lower.includes("status") ||
    lower.includes("cac_verify") ||
    lower.includes("tax") ||
    lower.includes("tin") ||
    lower.startsWith("id_tax_") ||
    lower === "id_tax_id_search"
  ) {
    return false;
  }

  return (
    MANUAL_SERVICES_CATALOG.some((s) => s.id === serviceId) ||
    lower.startsWith("cac_") ||
    lower === "id_cac_registration" ||
    lower.includes("cac_reg") ||
    lower.includes("scuml") ||
    lower.includes("annual_return") ||
    lower === "gov_passport" ||
    lower === "ict_website" ||
    lower.includes("nin_mod") ||
    lower.includes("bvn_mod")
  );
}

export function getManualServiceConfig(serviceId: string): ManualServiceConfig | undefined {
  if (!serviceId) return undefined;
  const lower = serviceId.toLowerCase();

  // Exclude automated TIN and tax verification from manual configs
  if (
    serviceId === "id_tax_id_search" ||
    serviceId === "tax_identity" ||
    serviceId === "SRV_tax_id_services" ||
    lower.includes("tax") ||
    lower.includes("tin")
  ) {
    return undefined;
  }

  // CAC parent click
  if (serviceId === "cac_ngo" || lower === "cac_ngo" || lower.includes("cac_ngo")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_ngo");
  }

  if (
    serviceId === "cac_incorporated_trustee" ||
    lower.includes("incorporated_trustee") ||
    lower.includes("cac_trustee")
  ) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_incorporated_trustee");
  }

  if (serviceId === "cac_ngo_trustee" || lower.includes("ngo_trustee")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_ngo_trustee") || MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_ngo");
  }

  if (serviceId === "id_cac_registration" || lower === "cac_registration") {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_biz_name");
  }

  if (lower.includes("nin_mod") || lower.includes("nin_correction")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "id_nin_mod");
  }

  if (lower.includes("bvn_mod") || lower.includes("bvn_correction")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "id_bvn_modification");
  }

  if (serviceId === "cac_scuml" || lower.includes("scuml")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_scuml");
  }

  if (serviceId === "cac_annual_returns" || lower.includes("annual_return")) {
    return MANUAL_SERVICES_CATALOG.find((s) => s.id === "cac_annual_returns");
  }

  return MANUAL_SERVICES_CATALOG.find((s) => s.id === serviceId);
}
