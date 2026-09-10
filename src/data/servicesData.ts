export interface ServiceItem {
  id: string;
  name: string;
  category: "IDENTITY" | "CAC" | "EDUCATION" | "VTU" | "GOVERNMENT" | "ICT" | "AI_AUTOMATION";
  description: string;
  price?: number;
  priceLabel?: string;
  actionLabel: string;
  fields: { name: string; label: string; type: string; placeholder?: string; required: boolean; options?: string[] }[];
}

export const SMART_LINK_SERVICES: ServiceItem[] = [
  // 1. IDENTITY & KYC
  {
    id: "id_nin_demography",
    name: "NIN Demography",
    category: "IDENTITY",
    description: "Verify identity records via official NIMC demographic details (First Name, Last Name, Gender & Date of Birth). Choose slip type.",
    price: 600,
    actionLabel: "Verify Demographics",
    fields: [
      { name: "firstName", label: "First Name", type: "text", placeholder: "e.g. Shile", required: true },
      { name: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Ademurewa", required: true },
      { name: "gender", label: "Gender", type: "select", placeholder: "Select Gender", required: true, options: ["MALE", "FEMALE"] },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", placeholder: "YYYY-MM-DD", required: true }
    ]
  },
  {
    id: "id_nin_ver",
    name: "NIN Verification",
    category: "IDENTITY",
    description: "Verify NIN profiles via third-party gateways instantly using the candidate's NIN. Secure database lookup.",
    price: 500,
    actionLabel: "Verify NIN Profile",
    fields: [
      { name: "idNumber", label: "National Identification Number (NIN)", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "fullName", label: "Full Name (as on card)", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_nin_phone",
    name: "NIN With Phone Number",
    category: "IDENTITY",
    description: "Verify NIN records using the candidate's registered 11-digit mobile phone number.",
    price: 500,
    actionLabel: "Verify Phone Number",
    fields: [
      { name: "phoneNumber", label: "Phone Number", type: "text", placeholder: "e.g. 08012345678", required: true }
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
    description: "Customize and personalize active NIN profiles with corporate custom parameters and verified photos.",
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
    description: "Submit corrections and modifications of birth dates, name spelling, or phone linkage for NIN registry updates via authorized gateways.",
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
    description: "Generate and download premium full-sized high-fidelity printable NIN verification slips.",
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
    description: "Assistance to link NIN profiles with BVN records for commercial accounts.",
    price: 1500,
    actionLabel: "Link NIN & BVN",
    fields: [
      { name: "nin", label: "NIN Number", type: "text", placeholder: "e.g. 12345678901", required: true },
      { name: "bvn", label: "BVN Number", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "phoneNumber", label: "Linked Phone Number", type: "text", placeholder: "e.g. +2348030000000", required: true }
    ]
  },
  {
    id: "id_vnin_to_bvn",
    name: "VNIN to BVN",
    category: "IDENTITY",
    description: "Link and resolve VNIN to BVN database for banking and financial operations.",
    price: 1000,
    actionLabel: "Resolve VNIN to BVN",
    fields: [
      { name: "vnin", label: "Virtual NIN (VNIN)", type: "text", placeholder: "e.g. AB12345678901Z", required: true },
      { name: "bvn", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "fullName", label: "Full Name (as on BVN)", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_vnin_to_nibss",
    name: "VNIN to NIBSS",
    category: "IDENTITY",
    description: "Transmit and synchronize Virtual NIN (VNIN) records with official NIBSS banking settlement database.",
    price: 1500,
    actionLabel: "Sync VNIN to NIBSS",
    fields: [
      { name: "vnin", label: "Virtual NIN (VNIN)", type: "text", placeholder: "e.g. AB12345678901Z", required: true },
      { name: "bvn", label: "Bank Verification Number (BVN)", type: "text", placeholder: "e.g. 22233344455", required: true },
      { name: "fullName", label: "Account Holder Full Name", type: "text", placeholder: "e.g. Abubakar Muhammad", required: true }
    ]
  },
  {
    id: "id_bvn_user",
    name: "BVN User",
    category: "IDENTITY",
    description: "Query user bio-data logs via third-party BVN gateways.",
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
    name: "BVN Slip Print",
    category: "IDENTITY",
    description: "Generate and print verified BVN identity slips and cards.",
    price: 1000,
    actionLabel: "Print BVN Slip",
    fields: [
      { name: "bvnOrNin", label: "BVN Number", type: "text", placeholder: "Enter BVN number", required: true },
      { name: "cardFormat", label: "Slip Format", type: "select", placeholder: "Select format", required: true, options: ["Standard BVN Slip", "Premium Plastic Card Format", "A4 Certificate Format"] }
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
    price: 0,
    actionLabel: "Start Registration",
    fields: [
      { name: "proposedName", label: "Proposed Business Name (Choice 1)", type: "text", required: true },
      { name: "alternativeName", label: "Alternative Proposed Name (Choice 2)", type: "text", required: true },
      { name: "type", label: "Filing Type", type: "select", required: true, options: ["Business Name Registration", "Private Limited Company (LTD)", "NGO Registration", "Incorporated Trustees"] },
      { name: "natureOfBusiness", label: "Nature of Business", type: "text", required: true },
      { name: "objectivesOfBusiness", label: "Objectives of the Business", type: "textarea", required: true }
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
    description: "Confirm bank account holder name via third-party bank gateways.",
    price: 100,
    actionLabel: "Verify Account Name",
    fields: [
      { name: "accountNumber", label: "Account Number (10 Digits)", type: "text", placeholder: "e.g. 0123456789", required: true },
      { name: "bankCode", label: "Select Nigerian Bank", type: "select", placeholder: "Choose Nigerian Bank", required: true }
    ]
  },
  {
    id: "id_tax_id_search",
    name: "Tax Identity",
    category: "CAC",
    description: "Official Federal Tax Identification Number (TIN) desk: Tax ID retrieval, Individual & Corporate Tax ID registration, and Tax Identity verification.",
    price: 1500,
    actionLabel: "Open Tax Identity Desk",
    fields: [
      { name: "taxpayerName", label: "Full Legal or Registered Name", type: "text", placeholder: "e.g. Adamu Abubakar Muhammad or Company Name", required: true },
      { name: "taxServiceType", label: "Tax Identity Service", type: "select", placeholder: "Select Tax Identity Service", options: ["Tax ID Number retrieval", "Get Individual Tax Identity Number", "Get Business/corporate ID Number", "Verify Tax Identity Number"], required: true }
    ]
  },

  // 2. CAC REGISTRATIONS
  {
    id: "cac_biz_name",
    name: "CAC Business Name Registration",
    category: "CAC",
    description: "Official registration of Business Names with the Corporate Affairs Commission. Filing includes Certificate of Incorporation & Status Report.",
    price: 0,
    actionLabel: "Start Corporate Filing",
    fields: [
      { name: "proposedName1", label: "Proposed Business Name (Choice 1)", type: "text", required: true },
      { name: "proposedName2", label: "Proposed Business Name (Choice 2)", type: "text", required: true },
      { name: "natureOfBusiness", label: "Nature of Business", type: "text", required: true },
      { name: "objectivesOfBusiness", label: "Objectives of the Business", type: "textarea", required: true },
      { name: "proprietorName", label: "Primary Proprietor Full Name", type: "text", required: true },
      { name: "proprietorPhone", label: "Proprietor Contact Phone", type: "text", required: true }
    ]
  },
  {
    id: "cac_ltd_co",
    name: "CAC Limited Liability Company",
    category: "CAC",
    description: "Register a fully-fledged private limited company (LTD) with share capital allocations and TIN with FIRS.",
    price: 0,
    actionLabel: "Start LTD Filing",
    fields: [
      { name: "proposedName1", label: "Proposed Company Name (Choice 1)", type: "text", required: true },
      { name: "proposedName2", label: "Proposed Company Name (Choice 2)", type: "text", required: true },
      { name: "shareCapital", label: "Authorized Share Capital", type: "select", required: true, options: ["1,000,000 Shares", "2,000,000 Shares", "5,000,000 Shares"] },
      { name: "natureOfBusiness", label: "Nature of Business", type: "text", required: true },
      { name: "objectivesOfBusiness", label: "Objectives of the Business", type: "textarea", required: true },
      { name: "directorName", label: "First Director Full Name", type: "text", required: true }
    ]
  },
  {
    id: "cac_ngo",
    name: "CAC NGO Registration",
    category: "CAC",
    description: "Official non-profit NGO incorporation with the Corporate Affairs Commission (Part F). Discuss requirements, registration fee, and procedure directly on WhatsApp.",
    price: 0,
    priceLabel: "WhatsApp Desk",
    actionLabel: "Chat on WhatsApp",
    fields: []
  },
  {
    id: "cac_incorporated_trustee",
    name: "CAC Incorporated Trustees",
    category: "CAC",
    description: "Official incorporation of Foundations, Charities, Churches, Mosques, and Community Associations. Discuss requirements, registration fee, and procedure directly on WhatsApp.",
    price: 0,
    priceLabel: "WhatsApp Desk",
    actionLabel: "Chat on WhatsApp",
    fields: []
  },
  {
    id: "cac_annual_returns",
    name: "CAC Annual Returns Filing",
    category: "CAC",
    description: "Keep your registered business, company, or NGO active on the CAC portal. Discuss filing assessment, requirements, fee, and procedure directly on WhatsApp.",
    price: 0,
    priceLabel: "WhatsApp Desk",
    actionLabel: "Chat on WhatsApp",
    fields: []
  },
  {
    id: "cac_scuml",
    name: "SCUML Certificate Registration",
    category: "CAC",
    description: "Official SCUML anti-money laundering certification, vital for corporate accounts. Discuss requirements, fee, and procedure directly on WhatsApp.",
    price: 0,
    priceLabel: "WhatsApp Desk",
    actionLabel: "Chat on WhatsApp",
    fields: []
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
  {
    id: "edu_nabteb",
    name: "NABTEB Scratch Card",
    category: "EDUCATION",
    description: "Purchase official NABTEB result checker scratch card PINs for instant result retrieval.",
    price: 1500,
    actionLabel: "Buy NABTEB Card",
    fields: [
      { name: "quantity", label: "Quantity", type: "number", placeholder: "e.g. 1", required: true },
      { name: "email", label: "Delivery Email Address", type: "email", placeholder: "e.g. student@gmail.com", required: true }
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
    description: "Instant energy tokens for Jos (JEDC), Kaduna, Central (AEDC), Ikeja, and Eko electricity distribution companies.",
    priceLabel: "Pay bill value",
    actionLabel: "Generate Power Token",
    fields: [
      { name: "provider", label: "Electricity DisCo Office", type: "select", placeholder: "Select Office", required: true, options: ["JEDC - Jos Electricity", "AEDC - Central Electricity", "KAEDCO - Kaduna Electricity", "IKEDC - Ikeja Electricity"] },
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
