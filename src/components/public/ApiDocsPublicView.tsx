/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SmartLink NG Developer Hub - Complete API Documentation Portal
 * Follows LumiID & Identro Provider Standards with SmartLink NG Navy & Royal Theme
 * API Keys Generation strictly gated to User Dashboard per security & KYC compliance guidelines
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Code,
  Terminal,
  KeyRound,
  Webhook,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Zap,
  Server,
  Sparkles,
  Play,
  RotateCcw,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  Menu,
  X,
  CreditCard,
  Phone,
  Car,
  Plane,
  Home,
  CheckCheck,
  Building2,
  Tv,
  Wifi,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  GraduationCap,
  FileCheck,
  BookOpen,
  ArrowRight,
  Layers,
  Cpu,
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";
import { UserProfile } from "../../types";

interface ApiDocsPublicViewProps {
  currentUser?: UserProfile | null;
  onLogin?: () => void;
  onRegister?: () => void;
  onGetStarted?: () => void;
  onNavigateHome: () => void;
  onNavigateToDashboardApiKeys?: () => void;
  onNavigateLegal?: (docId?: string) => void;
}

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

export interface ResponseField {
  name: string;
  type: string;
  description: string;
}

export interface EndpointDefinition {
  id: string;
  category: "Identity & KYC" | "Telecom & VTU" | "Utility Bills" | "Education Pins" | "Wallet & Banking";
  method: "GET" | "POST";
  path: string;
  title: string;
  shortDesc: string;
  description: string;
  complianceNote?: string;
  parameters: EndpointParameter[];
  responseFields?: ResponseField[];
  defaultPayload?: Record<string, any>;
  sampleResponse: Record<string, any>;
}

export const ApiDocsPublicView: React.FC<ApiDocsPublicViewProps> = ({
  currentUser,
  onLogin,
  onRegister,
  onNavigateHome,
  onNavigateToDashboardApiKeys,
}) => {
  const { config, logoUrl: configuredLogoUrl, siteName } = useSiteConfig();
  const activeLogo =
    config.branding?.logoUrl ||
    config.branding?.lightLogoUrl ||
    configuredLogoUrl ||
    DEFAULT_LOGO_URL;

  // Navigation & Selection state
  const [selectedItem, setSelectedItem] = useState<string>("nin_verify");
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "node" | "python" | "php">("curl");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Environment state (Production vs Sandbox)
  const [activeEnvironment, setActiveEnvironment] = useState<"sandbox" | "production">("sandbox");

  // Upstream Gateway SLA & health state
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [isFetchingProviders, setIsFetchingProviders] = useState<boolean>(false);

  // Interactive Sandbox console state (Trial Demo Key)
  const [sandboxApiKey, setSandboxApiKey] = useState<string>("sk_sandbox_trial_node");
  const [sandboxPayloadText, setSandboxPayloadText] = useState<string>("");
  const [sandboxIsExecuting, setSandboxIsExecuting] = useState<boolean>(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);
  const [sandboxStatusCode, setSandboxStatusCode] = useState<number | null>(null);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  // Fetch provider health on mount
  const fetchProviderHealth = async () => {
    setIsFetchingProviders(true);
    try {
      const res = await fetch("/api/v1/providers/status");
      if (res.ok) {
        const data = await res.json();
        setProviderHealth(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviderHealth();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn("Download error:", e);
    }
  };

  // =========================================================================
  // COMPLETE PRODUCTION ENDPOINTS REGISTRY (28+ Endpoints)
  // =========================================================================
  const endpoints: EndpointDefinition[] = [
    // -----------------------------------------------------------------------
    // 1. IDENTITY & KYC VERIFICATION (LumiID / Identro Standard)
    // -----------------------------------------------------------------------
    {
      id: "nin_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/nin/verify",
      title: "Verify National Identity Number (NIN)",
      shortDesc: "Statutory demographic query & official PDF slip retrieval via NIMC rails",
      description: "Direct statutory verification against the National Identity Database (NIMC). Retrieves full legal demographics, biometric photo verification status, and an official verifiable PDF slip URL with QR code.",
      complianceNote: "Compliant with NIMC Statutory Regulations and Nigeria Data Protection Act (NDPA 2023).",
      parameters: [
        { name: "nin", type: "string", required: true, description: "11-digit National Identity Number to look up", example: "12345678901" },
        { name: "generateSlip", type: "boolean", required: false, description: "Whether to render and return official PDF slip document", example: "true" },
        { name: "format", type: "string", required: false, description: "Slip style: 'standard' or 'premium'", example: "'standard'" },
      ],
      responseFields: [
        { name: "nin", type: "string", description: "11-digit verified National Identity Number" },
        { name: "firstname", type: "string", description: "First name on citizen NIMC record" },
        { name: "surname", type: "string", description: "Surname on citizen NIMC record" },
        { name: "middlename", type: "string", description: "Middle name if registered" },
        { name: "dob", type: "string", description: "Date of birth in YYYY-MM-DD format" },
        { name: "telephoneno", type: "string", description: "Registered mobile telephone number" },
        { name: "state", type: "string", description: "State of origin recorded at enrollment" },
        { name: "slipUrl", type: "string", description: "Direct secure URL to verified PDF document" },
        { name: "matchStatus", type: "string", description: "Identity match validation code" },
      ],
      defaultPayload: {
        nin: "12345678901",
        generateSlip: true,
        format: "standard",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "NIN Verification successful.",
        reference: "SLN_NIN_1712638192",
        data: {
          nin: "12345678901",
          firstname: "ABUBAKAR",
          surname: "MUHAMMAD",
          middlename: "SULEIMAN",
          gender: "M",
          dob: "1994-05-14",
          telephoneno: "08085490982",
          state: "Kano",
          lga: "Nassarawa",
          slipUrl: "https://smartlinkng.com.ng/slips/nin_72819201.pdf",
          matchStatus: "VERIFIED_OFFICIAL",
        },
      },
    },
    {
      id: "vnin_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/vnin/verify",
      title: "Verify Virtual NIN (vNIN)",
      shortDesc: "Privacy-preserving 16-character virtual identity verification",
      description: "Queries the 16-character Virtual NIN generated from the NIMC MWS Mobile ID App or USSD code. Ensures privacy compliance by retrieving verified demographics without exposing raw 11-digit NINs.",
      complianceNote: "Mandatory standard for privacy-compliant Tier-3 customer onboarding under CBN guidelines.",
      parameters: [
        { name: "vnin", type: "string", required: true, description: "16-character vNIN alphanumeric code", example: "AB123456789012CD" },
        { name: "generateSlip", type: "boolean", required: false, description: "Generates official printable document", example: "true" },
      ],
      responseFields: [
        { name: "vnin", type: "string", description: "16-digit verified Virtual NIN" },
        { name: "firstname", type: "string", description: "First name on citizen record" },
        { name: "surname", type: "string", description: "Surname on citizen record" },
        { name: "gender", type: "string", description: "Gender: 'M' or 'F'" },
        { name: "dob", type: "string", description: "Date of birth in YYYY-MM-DD" },
        { name: "slipUrl", type: "string", description: "Direct link to printable verification slip" },
      ],
      defaultPayload: {
        vnin: "AB123456789012CD",
        generateSlip: true,
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Virtual NIN verified successfully.",
        data: {
          vnin: "AB123456789012CD",
          firstname: "FATIMA",
          surname: "BELLO",
          gender: "F",
          dob: "1998-11-04",
          slipUrl: "https://smartlinkng.com.ng/slips/vnin_1712638201.pdf",
        },
      },
    },
    {
      id: "bvn_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/bvn/verify",
      title: "Validate Bank Verification Number (BVN)",
      shortDesc: "Interbank biometric resolution & NIBSS database confirmation",
      description: "Matches 11-digit BVN against NIBSS interbank rails, confirming citizen identity, enrollment bank, verified telephone, and optional NUBAN account name match validation.",
      complianceNote: "Direct connection to Nigeria Inter-Bank Settlement System (NIBSS) portal.",
      parameters: [
        { name: "bvn", type: "string", required: true, description: "11-digit Bank Verification Number", example: "22334455667" },
        { name: "accountNumber", type: "string", required: false, description: "10-digit NUBAN to verify account name match", example: "0123456789" },
        { name: "bankCode", type: "string", required: false, description: "3-digit CBN bank code", example: "058" },
      ],
      responseFields: [
        { name: "bvn", type: "string", description: "11-digit verified Bank Verification Number" },
        { name: "accountName", type: "string", description: "Full customer name registered with BVN" },
        { name: "phoneNumber", type: "string", description: "Phone number tied to banking record" },
        { name: "enrollmentBank", type: "string", description: "Financial institution where BVN was enrolled" },
        { name: "matchStatus", type: "string", description: "Validation match confirmation code" },
      ],
      defaultPayload: {
        bvn: "22334455667",
        accountNumber: "0123456789",
        bankCode: "058",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "BVN query resolved against interbank rails.",
        data: {
          bvn: "22334455667",
          accountName: "Abubakar Muhammad",
          phoneNumber: "08085490982",
          enrollmentBank: "GTBank (058)",
          matchStatus: "MATCH_CONFIRMED",
        },
      },
    },
    {
      id: "bvn_match",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/bvn/match",
      title: "Match BVN with Account Number",
      shortDesc: "Confirms biometric ownership between BVN and bank account",
      description: "Performs strict two-way fuzzy matching between customer BVN and 10-digit NUBAN account records. Returns match confidence score and verified account names.",
      parameters: [
        { name: "bvn", type: "string", required: true, description: "11-digit Bank Verification Number", example: "22334455667" },
        { name: "accountNumber", type: "string", required: true, description: "10-digit bank account number", example: "8085490982" },
        { name: "bankCode", type: "string", required: false, description: "Bank CBN code (e.g. 035)", example: "035" },
      ],
      responseFields: [
        { name: "bvnMatch", type: "boolean", description: "True if biometric BVN matches account record" },
        { name: "matchConfidenceScore", type: "number", description: "Match percentage (0 - 100)" },
      ],
      defaultPayload: {
        bvn: "22334455667",
        accountNumber: "8085490982",
        bankCode: "035",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "BVN matched successfully against NUBAN record.",
        data: {
          bvn: "22334455667",
          accountNumber: "8085490982",
          bankCode: "035",
          accountName: "ABUBAKAR MUHAMMAD",
          bvnMatch: true,
          matchConfidenceScore: 98.5,
          status: "VERIFIED_MATCH",
        },
      },
    },
    {
      id: "bank_resolve",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/bank/resolve",
      title: "Resolve NUBAN Bank Account Name",
      shortDesc: "Sub-second account verification across all commercial banks and MFBs",
      description: "Resolves verified account beneficiary name for any 10-digit Nigerian NUBAN account number across commercial banks, digital banks (Kuda, Moniepoint, OPay, Palmpay), and microfinance institutions.",
      parameters: [
        { name: "accountNumber", type: "string", required: true, description: "10-digit NUBAN account number", example: "8085490982" },
        { name: "bankCode", type: "string", required: false, description: "3-digit or 6-digit CBN Bank code", example: "035" },
      ],
      responseFields: [
        { name: "accountNumber", type: "string", description: "Validated 10-digit account number" },
        { name: "accountName", type: "string", description: "Verified statutory name registered with the bank" },
        { name: "bankName", type: "string", description: "Name of beneficiary institution" },
        { name: "bvnMatched", type: "boolean", description: "Indicates whether BVN links to account" },
      ],
      defaultPayload: {
        accountNumber: "8085490982",
        bankCode: "035",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "NUBAN account name resolved via NIBSS rails.",
        data: {
          accountNumber: "8085490982",
          accountName: "SMARTLINK ENTERPRISE COMMERCE",
          bankCode: "035",
          bankName: "Wema Bank / ALAT",
          bvnMatched: true,
          currency: "NGN",
        },
      },
    },
    {
      id: "bank_list",
      category: "Identity & KYC",
      method: "GET",
      path: "/api/v1/bank/list",
      title: "Supported Nigerian Banks Directory",
      shortDesc: "List all active commercial banks, digital banks, and CBN routing codes",
      description: "Returns the official directory of all Nigerian financial institutions, CBN bank codes, and settlement slugs supported for account name validation and transfers.",
      parameters: [],
      responseFields: [
        { name: "data", type: "array", description: "Array of financial institutions with name, code, and slug" },
      ],
      sampleResponse: {
        status: "success",
        code: 200,
        banksCount: 8,
        data: [
          { name: "Access Bank", code: "044", slug: "access-bank" },
          { name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "gtbank" },
          { name: "United Bank for Africa (UBA)", code: "033", slug: "uba" },
          { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
          { name: "Wema Bank / ALAT", code: "035", slug: "wema-bank" },
          { name: "Moniepoint Microfinance Bank", code: "50515", slug: "moniepoint" },
          { name: "OPay Digital Services", code: "999992", slug: "opay" },
          { name: "Kuda Microfinance Bank", code: "50211", slug: "kuda" },
        ],
      },
    },
    {
      id: "cac_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/cac/verify",
      title: "Verify CAC Corporate Business Entity",
      shortDesc: "Statutory company registration lookup & verified RC number validation",
      description: "Queries verified Corporate Affairs Commission records for registered Nigerian businesses, enterprises, and limited liability companies. Returns official RC/BN number, head office, and active status.",
      parameters: [
        { name: "rcNumber", type: "string", required: true, description: "CAC Registration Number (e.g. 'RC1234567' or 'BN9876543')", example: "RC1234567" },
        { name: "companyType", type: "string", required: false, description: "Entity class: 'BUSINESS_NAME' or 'LIMITED_COMPANY'", example: "LIMITED_COMPANY" },
      ],
      responseFields: [
        { name: "rcNumber", type: "string", description: "Official registration number" },
        { name: "companyName", type: "string", description: "Registered legal business name" },
        { name: "companyType", type: "string", description: "Statutory classification of incorporation" },
        { name: "registrationDate", type: "string", description: "Date of CAC certificate issuance" },
        { name: "status", type: "string", description: "Company operational status: ACTIVE or INACTIVE" },
      ],
      defaultPayload: {
        rcNumber: "RC1234567",
        companyType: "LIMITED_COMPANY",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Corporate Affairs Commission entity resolved.",
        data: {
          rcNumber: "RC1234567",
          companyName: "SMART LINK DIGITAL TECH SOLUTIONS LTD",
          companyType: "PRIVATE_COMPANY_LIMITED_BY_SHARES",
          registrationDate: "2021-08-14",
          status: "ACTIVE",
          headOffice: "Kano Commercial District, Kano State, Nigeria",
          directorsCount: 3,
          shareCapital: 10000000,
        },
      },
    },
    {
      id: "phone_lookup",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/phone/lookup",
      title: "Verify Phone Number & SIM KYC",
      shortDesc: "Telco subscriber verification & statutory NIN-SIM link confirmation",
      description: "Validates 11-digit mobile subscriber phone numbers across Nigerian telecom operators (MTN, Airtel, Glo, 9mobile). Confirms carrier name, subscriber status, and statutory NIN-SIM linkage status.",
      parameters: [
        { name: "phone", type: "string", required: true, description: "11-digit Nigerian mobile number", example: "08085490982" },
      ],
      responseFields: [
        { name: "telephone", type: "string", description: "Verified phone number" },
        { name: "network", type: "string", description: "Telecommunications operator" },
        { name: "ninLinked", type: "boolean", description: "Indicates active NIN-SIM statutory linkage" },
        { name: "registeredName", type: "string", description: "Full name associated with subscriber record" },
        { name: "status", type: "string", description: "Subscriber status code" },
      ],
      defaultPayload: {
        phone: "08085490982",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Phone KYC validation successful.",
        data: {
          telephone: "08085490982",
          network: "MTN Nigeria",
          ninLinked: true,
          registeredName: "ABUBAKAR MUHAMMAD",
          status: "ACTIVE_SUBSCRIBER",
          simRegistrationDate: "2018-03-12",
        },
      },
    },
    {
      id: "drivers_license",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/drivers-license/verify",
      title: "Verify FRSC Driver's License",
      shortDesc: "Federal Road Safety Corps national license document verification",
      description: "Validates Nigerian Driver's License credentials directly against Federal Road Safety Corps (FRSC) records. Confirms license validity, issue and expiration dates, and holder demographics.",
      parameters: [
        { name: "licenseNo", type: "string", required: true, description: "FRSC Driver's License number (e.g. 'ABC12345AA')", example: "ABC12345AA" },
      ],
      responseFields: [
        { name: "licenseNo", type: "string", description: "License serial number" },
        { name: "fullName", type: "string", description: "Full legal name of driver" },
        { name: "issueDate", type: "string", description: "Original date of license issue" },
        { name: "expiryDate", type: "string", description: "License expiration date" },
        { name: "status", type: "string", description: "Validity state: VALID_ACTIVE or EXPIRED" },
      ],
      defaultPayload: {
        licenseNo: "ABC12345AA",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "FRSC Driver's License verified successfully.",
        data: {
          licenseNo: "ABC12345AA",
          fullName: "ABUBAKAR MUHAMMAD",
          gender: "M",
          dob: "1994-05-14",
          issueDate: "2021-08-10",
          expiryDate: "2026-08-09",
          stateOfIssue: "Kano",
          status: "VALID_ACTIVE",
        },
      },
    },
    {
      id: "passport_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/passport/verify",
      title: "Validate NIS International Passport",
      shortDesc: "Nigerian Immigration Service standard e-passport validation",
      description: "Queries the Nigerian Immigration Service (NIS) database to confirm international travel passport validity, issuing authority, bio-data match, and unexpired status.",
      parameters: [
        { name: "passportNo", type: "string", required: true, description: "9-character passport number (e.g. 'A12345678')", example: "A12345678" },
      ],
      responseFields: [
        { name: "passportNo", type: "string", description: "Verified passport number" },
        { name: "surname", type: "string", description: "Surname on passport document" },
        { name: "givenNames", type: "string", description: "Given names on passport document" },
        { name: "nationality", type: "string", description: "Citizen nationality" },
        { name: "expiryDate", type: "string", description: "Passport expiration date" },
        { name: "status", type: "string", description: "Validity: VALID_UNEXPIRED" },
      ],
      defaultPayload: {
        passportNo: "A12345678",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "NIS International Passport validated successfully.",
        data: {
          passportNo: "A12345678",
          surname: "MUHAMMAD",
          givenNames: "ABUBAKAR",
          nationality: "NIGERIAN",
          dob: "1994-05-14",
          gender: "M",
          issueDate: "2022-01-15",
          expiryDate: "2032-01-14",
          issuingAuthority: "NIS ABUJA",
          status: "VALID_UNEXPIRED",
        },
      },
    },
    {
      id: "voters_card",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/voters-card/verify",
      title: "Verify Voter's Card (VIN / INEC)",
      shortDesc: "Independent National Electoral Commission voter registry lookup",
      description: "Validates 19-digit Voter Identification Numbers (VIN) against official INEC polling registers. Confirms voter registration status, polling unit, and resident LGA.",
      parameters: [
        { name: "vin", type: "string", required: true, description: "19-character alphanumeric Voter Identification Number", example: "90F5B12345678901234" },
      ],
      responseFields: [
        { name: "vin", type: "string", description: "Verified Voter Identification Number" },
        { name: "fullName", type: "string", description: "Registered voter full name" },
        { name: "pollingUnit", type: "string", description: "Designated voting unit address" },
        { name: "status", type: "string", description: "Voter status" },
      ],
      defaultPayload: {
        vin: "90F5B12345678901234",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "INEC Voter Card verified.",
        data: {
          vin: "90F5B12345678901234",
          fullName: "ABUBAKAR MUHAMMAD",
          gender: "M",
          dob: "1994-05-14",
          state: "Kano",
          lga: "Nassarawa",
          pollingUnit: "004 Gwagwarwa Primary School",
          status: "REGISTERED_VOTER",
        },
      },
    },
    {
      id: "tin_verify",
      category: "Identity & KYC",
      method: "POST",
      path: "/api/v1/tin/verify",
      title: "Validate Joint Tax Board (JTB) TIN",
      shortDesc: "Official Tax Identification Number validation for individuals & companies",
      description: "Direct lookup against the Joint Tax Board (JTB) National Database. Validates personal and corporate Tax Identification Numbers, tax office assignment, and active taxpayer status.",
      parameters: [
        { name: "tin", type: "string", required: true, description: "10-digit or 12-digit Tax Identification Number", example: "1234567890" },
      ],
      responseFields: [
        { name: "tin", type: "string", description: "Tax Identification Number" },
        { name: "taxpayerName", type: "string", description: "Registered personal or corporate name" },
        { name: "taxOffice", type: "string", description: "Assigned local tax office" },
      ],
      defaultPayload: {
        tin: "1234567890",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Joint Tax Board TIN validated.",
        data: {
          tin: "1234567890",
          taxpayerName: "SMART LINK DIGITAL TECH SOLUTIONS LTD",
          taxOffice: "MSTO Kano",
          taxpayerType: "CORPORATE",
          phone: "08085490982",
          status: "ACTIVE_TAXPAYER",
        },
      },
    },

    // -----------------------------------------------------------------------
    // 2. TELECOMS & VTU AIRTIME / DATA
    // -----------------------------------------------------------------------
    {
      id: "vtu_airtime",
      category: "Telecom & VTU",
      method: "POST",
      path: "/api/v1/vtu/airtime",
      title: "Automated Airtime Top-Up",
      shortDesc: "Sub-second airtime vending across MTN, Airtel, Glo, and 9mobile",
      description: "Executes automated VTU airtime recharge at developer wholesale discount pricing. Integrates automatic fallback across tier-1 telecom gateways with instant delivery confirmation.",
      parameters: [
        { name: "network", type: "string", required: true, description: "Network operator: 'MTN', 'AIRTEL', 'GLO', '9MOBILE'", example: "MTN" },
        { name: "phone", type: "string", required: true, description: "11-digit recipient phone number", example: "08085490982" },
        { name: "amount", type: "number", required: true, description: "Face value amount in NGN (Min: 50, Max: 50000)", example: "1000" },
      ],
      responseFields: [
        { name: "reference", type: "string", description: "Unique transaction reference" },
        { name: "network", type: "string", description: "Recipient telecom operator" },
        { name: "amount", type: "number", description: "Amount credited to phone" },
        { name: "cost", type: "number", description: "Discounted wholesale amount deducted from wallet" },
        { name: "status", type: "string", description: "Delivery status: SUCCESS or PENDING" },
      ],
      defaultPayload: {
        network: "MTN",
        phone: "08085490982",
        amount: 1000,
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Airtime vending successful.",
        reference: "SLN_AIR_1712638255",
        data: {
          network: "MTN",
          phone: "08085490982",
          amount: 1000,
          cost: 975.0,
          discount: "2.5%",
          status: "SUCCESS",
        },
      },
    },
    {
      id: "vtu_data",
      category: "Telecom & VTU",
      method: "POST",
      path: "/api/v1/vtu/data",
      title: "Purchase Mobile SME & Direct Data",
      shortDesc: "Instant SME, corporate gifting, and direct mobile data provisioning",
      description: "Delivers SME, Corporate, or Direct mobile data bundles with real-time telco delivery validation and automatic retry logic across Clubkonnect and telecom provider rails.",
      parameters: [
        { name: "network", type: "string", required: true, description: "Network identifier: 'MTN', 'AIRTEL', 'GLO', '9MOBILE'", example: "MTN" },
        { name: "phone", type: "string", required: true, description: "11-digit recipient phone number", example: "08085490982" },
        { name: "planId", type: "string", required: true, description: "Plan variation ID from the Data Plans catalog", example: "MTN-SME-1GB" },
      ],
      responseFields: [
        { name: "reference", type: "string", description: "Unique data transaction reference" },
        { name: "dataSize", type: "string", description: "Provisioned volume (e.g. '1.0 GB SME Data')" },
        { name: "validity", type: "string", description: "Bundle validity duration (e.g. '30 Days')" },
        { name: "status", type: "string", description: "Delivery status: SUCCESS" },
      ],
      defaultPayload: {
        network: "MTN",
        phone: "08085490982",
        planId: "MTN-SME-1GB",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Data bundle provisioned successfully.",
        reference: "SLN_DAT_1712638290",
        data: {
          network: "MTN",
          phone: "08085490982",
          planId: "MTN-SME-1GB",
          dataSize: "1.0 GB SME Data",
          validity: "30 Days",
          cost: 260.0,
          status: "SUCCESS",
        },
      },
    },
    {
      id: "vtu_data_plans",
      category: "Telecom & VTU",
      method: "GET",
      path: "/api/v1/vtu/data/plans",
      title: "Query Available Data Plans Catalog",
      shortDesc: "Wholesale data plans, variations, sizes, and pricing catalog",
      description: "Retrieves all currently active mobile data plans, variation plan IDs, sizes, validity periods, and developer wholesale costs across MTN, Airtel, Glo, and 9mobile.",
      parameters: [
        { name: "network", type: "string", required: false, description: "Filter by network: 'MTN', 'AIRTEL', 'GLO', '9MOBILE'", example: "MTN" },
      ],
      responseFields: [
        { name: "plans", type: "array", description: "Array of available data variations with planId and wholesale price" },
      ],
      sampleResponse: {
        status: "success",
        code: 200,
        plansCount: 4,
        plans: [
          { planId: "MTN-SME-500MB", network: "MTN", size: "500 MB", validity: "30 Days", price: 135 },
          { planId: "MTN-SME-1GB", network: "MTN", size: "1.0 GB", validity: "30 Days", price: 260 },
          { planId: "MTN-SME-2GB", network: "MTN", size: "2.0 GB", validity: "30 Days", price: 520 },
          { planId: "AIRTEL-CORP-1GB", network: "AIRTEL", size: "1.0 GB", validity: "30 Days", price: 285 },
        ],
      },
    },
    {
      id: "vtu_airtime_to_cash",
      category: "Telecom & VTU",
      method: "POST",
      path: "/api/v1/vtu/airtime-to-cash",
      title: "Airtime-to-Cash Exchange",
      shortDesc: "Automated airtime conversion with direct wallet cash payout",
      description: "Generates destination transfer instructions for converting excess MTN, Airtel, or Glo airtime into cash credited directly to the developer node wallet.",
      parameters: [
        { name: "network", type: "string", required: true, description: "Network operator: 'MTN', 'AIRTEL', 'GLO'", example: "MTN" },
        { name: "amount", type: "number", required: true, description: "Face value airtime amount (Min: 500)", example: "5000" },
        { name: "senderPhone", type: "string", required: true, description: "Phone number sending the airtime", example: "08085490982" },
      ],
      responseFields: [
        { name: "cashPayoutValue", type: "number", description: "Net cash amount credited to wallet" },
        { name: "transferDestinationPhone", type: "string", description: "Dedicated SmartLink receiver phone number" },
      ],
      defaultPayload: {
        network: "MTN",
        amount: 5000,
        senderPhone: "08085490982",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Airtime-to-cash transfer instructions generated.",
        data: {
          exchangeReference: "ATC_1712638330",
          network: "MTN",
          airtimeAmount: 5000,
          cashPayoutValue: 4100,
          discountRate: "18%",
          transferDestinationPhone: "08085490982",
          status: "AWAITING_AIRTIME_TRANSFER",
        },
      },
    },

    // -----------------------------------------------------------------------
    // 3. UTILITIES & BILL PAYMENTS
    // -----------------------------------------------------------------------
    {
      id: "bills_electricity_verify",
      category: "Utility Bills",
      method: "POST",
      path: "/api/v1/bills/electricity/verify",
      title: "Validate Electricity Meter Number",
      shortDesc: "Instant meter query & customer name resolution across all Discos",
      description: "Resolves customer account name, registered address, and meter validity across IKEDC, EKEDC, AEDC, IBEDC, KEDCO, and other electricity distribution companies prior to token purchase.",
      parameters: [
        { name: "disco", type: "string", required: true, description: "Disco provider: 'IKEDC', 'EKEDC', 'AEDC', 'KEDCO'", example: "IKEDC" },
        { name: "meterNumber", type: "string", required: true, description: "Prepaid or Postpaid meter number", example: "01011234567" },
        { name: "meterType", type: "string", required: true, description: "'prepaid' or 'postpaid'", example: "prepaid" },
      ],
      responseFields: [
        { name: "customerName", type: "string", description: "Registered meter owner name" },
        { name: "address", type: "string", description: "Physical property installation address" },
        { name: "disco", type: "string", description: "Electricity distribution company" },
      ],
      defaultPayload: {
        disco: "IKEDC",
        meterNumber: "01011234567",
        meterType: "prepaid",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Meter validated successfully.",
        data: {
          customerName: "ALHAJI IBRAHIM DANLADI",
          address: "Plot 12 Ahmadu Bello Way, Kano",
          meterNumber: "01011234567",
          disco: "IKEDC",
          meterType: "prepaid",
          isValid: true,
        },
      },
    },
    {
      id: "bills_electricity_pay",
      category: "Utility Bills",
      method: "POST",
      path: "/api/v1/bills/electricity/pay",
      title: "Purchase Electricity Token / Pay Bill",
      shortDesc: "Vends 20-digit prepaid power tokens with sub-second generation",
      description: "Purchases prepaid electricity tokens or settles postpaid utility invoices. Returns official 20-digit STS token code, unit volume, and official printable receipt.",
      parameters: [
        { name: "disco", type: "string", required: true, description: "Distribution company code", example: "IKEDC" },
        { name: "meterNumber", type: "string", required: true, description: "Prepaid or postpaid meter number", example: "01011234567" },
        { name: "amount", type: "number", required: true, description: "Purchase value in NGN", example: "5000" },
        { name: "phone", type: "string", required: false, description: "SMS token recipient telephone", example: "08085490982" },
      ],
      responseFields: [
        { name: "token", type: "string", description: "20-digit standard transfer specification (STS) recharge token" },
        { name: "units", type: "string", description: "Electricity units credited (kWh)" },
        { name: "receiptUrl", type: "string", description: "Direct link to printable official transaction slip" },
      ],
      defaultPayload: {
        disco: "IKEDC",
        meterNumber: "01011234567",
        amount: 5000,
        phone: "08085490982",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Electricity token vend successful.",
        reference: "SLN_PWR_1712638312",
        data: {
          token: "4820-1928-3849-1029-4820",
          units: "72.4 kWh",
          amount: 5000,
          disco: "IKEDC",
          meterNumber: "01011234567",
          customerName: "ALHAJI IBRAHIM DANLADI",
          receiptUrl: "https://smartlinkng.com.ng/receipt/pwr_1712638312.pdf",
        },
      },
    },
    {
      id: "bills_cable_verify",
      category: "Utility Bills",
      method: "POST",
      path: "/api/v1/bills/cable/verify",
      title: "Verify Cable TV Smartcard / IUC",
      shortDesc: "Confirm customer name and current bouquet on DStv, GOtv, Startimes",
      description: "Validates decoder smartcard or IUC numbers across MultiChoice DStv, GOtv, and Startimes, retrieving the subscriber account name, current package, and renewal due date.",
      parameters: [
        { name: "provider", type: "string", required: true, description: "'dstv', 'gotv', or 'startimes'", example: "gotv" },
        { name: "smartcardNumber", type: "string", required: true, description: "10-digit Smartcard/IUC number", example: "2020123456" },
      ],
      responseFields: [
        { name: "customerName", type: "string", description: "Registered decoder owner" },
        { name: "currentPackage", type: "string", description: "Current active bouquet plan" },
      ],
      defaultPayload: {
        provider: "gotv",
        smartcardNumber: "2020123456",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Smartcard validated.",
        data: {
          customerName: "BELLO SULAIMAN",
          smartcardNumber: "2020123456",
          provider: "gotv",
          currentPackage: "GOtv Jolli",
          dueDate: "2026-11-01",
        },
      },
    },
    {
      id: "bills_cable_pay",
      category: "Utility Bills",
      method: "POST",
      path: "/api/v1/bills/cable/pay",
      title: "Renew Cable TV Subscription",
      shortDesc: "Instant bouquet activation and renewal across DStv, GOtv, Startimes",
      description: "Submits payment to renew or upgrade cable TV subscriptions. Automatically restores channels within 2 minutes via direct MultiChoice / Startimes API gateways.",
      parameters: [
        { name: "provider", type: "string", required: true, description: "'dstv', 'gotv', 'startimes'", example: "gotv" },
        { name: "smartcardNumber", type: "string", required: true, description: "10-digit Smartcard/IUC number", example: "2020123456" },
        { name: "packageCode", type: "string", required: true, description: "Bouquet package code", example: "gotv-jolli" },
      ],
      responseFields: [
        { name: "status", type: "string", description: "Subscription status: SUCCESS" },
        { name: "renewalReference", type: "string", description: "Official operator transaction reference" },
      ],
      defaultPayload: {
        provider: "gotv",
        smartcardNumber: "2020123456",
        packageCode: "gotv-jolli",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Cable subscription renewed successfully.",
        reference: "SLN_CAB_1712638340",
        data: {
          provider: "gotv",
          smartcardNumber: "2020123456",
          packageName: "GOtv Jolli",
          amount: 4850,
          status: "SUCCESS",
        },
      },
    },

    // -----------------------------------------------------------------------
    // 4. EDUCATION SCRATCH CARDS & EXAM PINS
    // -----------------------------------------------------------------------
    {
      id: "education_waec",
      category: "Education Pins",
      method: "POST",
      path: "/api/v1/education/waec",
      title: "Purchase WAEC Result Checker PIN",
      shortDesc: "Vends official West African Examinations Council scratch cards",
      description: "Automated generation of official WAEC Result Checker PINs and serial numbers for candidate result verification on waecdirect.org.",
      parameters: [
        { name: "quantity", type: "number", required: false, description: "Number of PINs to purchase (Default: 1)", example: "1" },
      ],
      responseFields: [
        { name: "cards", type: "array", description: "Array of serial numbers and PINs" },
      ],
      defaultPayload: {
        quantity: 1,
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "WAEC Scratch Card PIN(s) purchased successfully.",
        data: {
          examType: "WAEC",
          quantity: 1,
          unitCost: 3500,
          cards: [
            { serialNumber: "WAEC1712638350", pin: "482019283849", instructions: "Visit https://www.waecdirect.org to check your result." },
          ],
        },
      },
    },
    {
      id: "education_neco",
      category: "Education Pins",
      method: "POST",
      path: "/api/v1/education/neco",
      title: "Purchase NECO Result Token PIN",
      shortDesc: "National Examinations Council result verification tokens",
      description: "Generates authentic NECO Result Checker tokens for SSCE (Internal & External) result lookup on result.neco.gov.ng.",
      parameters: [
        { name: "quantity", type: "number", required: false, description: "Number of tokens to purchase", example: "1" },
      ],
      responseFields: [
        { name: "tokens", type: "array", description: "Array of generated NECO tokens" },
      ],
      defaultPayload: {
        quantity: 1,
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "NECO Result Token(s) generated.",
        data: {
          examType: "NECO",
          quantity: 1,
          unitCost: 1200,
          tokens: [
            { token: "982019482012", instructions: "Visit https://result.neco.gov.ng to check your result." },
          ],
        },
      },
    },
    {
      id: "education_nabteb",
      category: "Education Pins",
      method: "POST",
      path: "/api/v1/education/nabteb",
      title: "Purchase NABTEB Scratch Card",
      shortDesc: "National Business and Technical Examinations Board result card",
      description: "Generates genuine NABTEB scratch card PIN and serial number for checking NBC/NTC examination results online.",
      parameters: [],
      responseFields: [
        { name: "pin", type: "string", description: "Recharge PIN" },
        { name: "serialNumber", type: "string", description: "Serial number" },
      ],
      sampleResponse: {
        status: "success",
        code: 200,
        message: "NABTEB Scratch Card generated.",
        data: {
          examType: "NABTEB",
          pin: "782910482910",
          serialNumber: "NAB1712638360",
          unitCost: 1500,
        },
      },
    },
    {
      id: "education_jamb",
      category: "Education Pins",
      method: "POST",
      path: "/api/v1/education/jamb",
      title: "Validate JAMB Profile & Vend e-PIN",
      shortDesc: "UTME / Direct Entry registration e-PIN vending via profile code",
      description: "Validates 10-digit JAMB Profile Code, resolves candidate registration name, and vends official UTME or Direct Entry registration e-PIN directly.",
      parameters: [
        { name: "profileCode", type: "string", required: true, description: "10-digit candidate JAMB Profile Code", example: "1234567890" },
      ],
      responseFields: [
        { name: "candidateName", type: "string", description: "Candidate legal name registered with JAMB" },
        { name: "epin", type: "string", description: "Official UTME registration e-PIN" },
      ],
      defaultPayload: {
        profileCode: "1234567890",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "JAMB e-PIN generated successfully.",
        data: {
          profileCode: "1234567890",
          candidateName: "ABUBAKAR MUHAMMAD",
          epin: "849201948201",
          examType: "UTME_WITH_MOCK",
          cost: 7700,
        },
      },
    },

    // -----------------------------------------------------------------------
    // 5. WALLET, VIRTUAL ACCOUNTS & FINANCIAL RAILS
    // -----------------------------------------------------------------------
    {
      id: "wallet_balance",
      category: "Wallet & Banking",
      method: "GET",
      path: "/api/v1/wallet/balance",
      title: "Query Developer Ledger Balance",
      shortDesc: "Real-time ledger balance, currency, and overdraft limit",
      description: "Retrieves the current available spendable balance, reserved balance, and automated auto-credit status of your developer node wallet.",
      parameters: [],
      responseFields: [
        { name: "walletBalance", type: "number", description: "Available spendable balance in NGN" },
        { name: "currency", type: "string", description: "Currency code (NGN)" },
      ],
      sampleResponse: {
        status: "success",
        code: 200,
        walletBalance: 250000.0,
        currency: "NGN",
        tier: "ENTERPRISE_DEVELOPER",
        autoFundingActive: true,
      },
    },
    {
      id: "wallet_virtual_account",
      category: "Wallet & Banking",
      method: "POST",
      path: "/api/v1/wallet/virtual-account",
      title: "Generate Dedicated Virtual Funding Account",
      shortDesc: "Automated instant ledger top-up via permanent Wema / Moniepoint NUBAN",
      description: "Generates or retrieves a permanent dedicated NUBAN virtual bank account tied directly to your developer ledger. Any bank transfer sent to this account credits your developer balance instantly.",
      parameters: [
        { name: "name", type: "string", required: false, description: "Account label name", example: "FINTECH PAYMENTS NODE" },
      ],
      responseFields: [
        { name: "bankName", type: "string", description: "Partner bank institution" },
        { name: "accountNumber", type: "string", description: "10-digit dedicated NUBAN" },
        { name: "accountName", type: "string", description: "Account name registered with NIBSS" },
      ],
      defaultPayload: {
        name: "PRIMARY COMMERCE NODE",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Dedicated virtual account active.",
        virtualAccount: {
          bankName: "Wema Bank / Moniepoint MFB",
          accountNumber: "8085490982",
          accountName: "SMARTLINK / PRIMARY COMMERCE NODE",
          currency: "NGN",
          status: "ACTIVE",
          settlementMode: "INSTANT_AUTO_CREDIT",
        },
      },
    },
    {
      id: "transactions_verify",
      category: "Wallet & Banking",
      method: "GET",
      path: "/api/v1/transactions/verify",
      title: "Query & Verify Transaction Status",
      shortDesc: "Idempotent status lookup using unique SmartLink transaction reference",
      description: "Queries the complete execution lifecycle, telco delivery receipt, and upstream provider confirmation for any transaction using your reference.",
      parameters: [
        { name: "reference", type: "string", required: true, description: "Transaction reference string", example: "SLN_NIN_1712638192" },
      ],
      responseFields: [
        { name: "status", type: "string", description: "Execution state: 'SUCCESS', 'PENDING', or 'FAILED'" },
        { name: "amount", type: "number", description: "Transaction value" },
        { name: "receiptUrl", type: "string", description: "Verifiable transaction receipt URL" },
      ],
      sampleResponse: {
        status: "success",
        code: 200,
        transaction: {
          reference: "SLN_NIN_1712638192",
          status: "SUCCESS",
          type: "NIN_VERIFICATION",
          amount: 150.0,
          completedAt: "2026-10-10T08:15:20Z",
          receiptUrl: "https://smartlinkng.com.ng/slips/nin_72819201.pdf",
        },
      },
    },
    {
      id: "webhooks_test",
      category: "Wallet & Banking",
      method: "POST",
      path: "/api/v1/webhooks/test",
      title: "Webhook Event Delivery Test",
      shortDesc: "Simulates test event dispatch with valid HMAC-SHA512 signature",
      description: "Sends a sample webhook notification payload to your configured server endpoint to verify signature validation and server-side handling.",
      parameters: [
        { name: "event", type: "string", required: false, description: "Event type: 'charge.success', 'identity.verified'", example: "charge.success" },
      ],
      responseFields: [
        { name: "dispatchedEvent", type: "object", description: "Full event payload sent to destination" },
      ],
      defaultPayload: {
        event: "charge.success",
      },
      sampleResponse: {
        status: "success",
        code: 200,
        message: "Mock webhook test payload dispatched successfully.",
        dispatchedEvent: {
          event: "charge.success",
          data: {
            reference: "SLN_EVT_1712638380",
            amount: 5000,
            currency: "NGN",
            status: "SUCCESS",
          },
        },
      },
    },
    {
      id: "providers_status",
      category: "Wallet & Banking",
      method: "GET",
      path: "/api/v1/providers/status",
      title: "Upstream Provider Gateway SLA & Health",
      shortDesc: "Real-time latency, uptime, and operational health of all upstream rails",
      description: "Public real-time SLA health, response latency (ms), and operational status across all upstream telco, identity, and payment rail providers.",
      parameters: [],
      sampleResponse: {
        status: "success",
        code: 200,
        overallStatus: "ALL_SYSTEMS_OPERATIONAL",
        uptimePercentage: 99.98,
        providersCount: 6,
        providers: [
          { id: "prov_aspfiy", name: "Aspfiy Payment & Virtual Accounts", status: "OPERATIONAL", latencyMs: 142, uptime: "99.99%" },
          { id: "prov_clubkonnect", name: "Clubkonnect VTU & SME Telecom", status: "OPERATIONAL", latencyMs: 310, uptime: "99.95%" },
          { id: "prov_vtpass", name: "VTpass Power Discos & Cable TV", status: "OPERATIONAL", latencyMs: 285, uptime: "99.96%" },
          { id: "prov_lumiid", name: "LumiID NIMC Identity Gateway", status: "OPERATIONAL", latencyMs: 380, uptime: "99.92%" },
          { id: "prov_identro", name: "Identro NIBSS BVN Portal", status: "OPERATIONAL", latencyMs: 340, uptime: "99.94%" },
          { id: "prov_prembley", name: "Prembley Multi-KYC & CAC", status: "OPERATIONAL", latencyMs: 295, uptime: "99.97%" },
        ],
      },
    },
  ];

  // Guides definition
  const guides = [
    { id: "guide_overview", label: "Overview & Architecture", icon: Globe },
    { id: "guide_auth", label: "Authentication & Security Protocols", icon: Lock },
    { id: "guide_keys", label: "Dashboard API Keys & Sandbox Access", icon: KeyRound },
    { id: "guide_webhooks", label: "Webhooks & HMAC Signatures", icon: Webhook },
    { id: "guide_sdks", label: "SDKs & Code Libraries", icon: Code },
    { id: "guide_errors", label: "Status Codes & Error Directory", icon: AlertTriangle },
  ];

  // Active endpoint calculation
  const activeEndpoint = useMemo(() => {
    return endpoints.find((ep) => ep.id === selectedItem) || endpoints[0];
  }, [selectedItem, endpoints]);

  const isGuideActive = selectedItem.startsWith("guide_");

  // Keep sandbox payload text in sync when endpoint changes
  useEffect(() => {
    if (!isGuideActive) {
      if (activeEndpoint.defaultPayload) {
        setSandboxPayloadText(JSON.stringify(activeEndpoint.defaultPayload, null, 2));
      } else {
        setSandboxPayloadText("{}");
      }
      setSandboxResponse(null);
      setSandboxStatusCode(null);
      setSandboxLatency(null);
      setJsonValidationError(null);
    }
  }, [selectedItem, isGuideActive]);

  // Execute Sandbox Request against `/api/v1/sandbox/execute`
  const executeSandboxRequest = async () => {
    setSandboxIsExecuting(true);
    setSandboxResponse(null);
    setSandboxStatusCode(null);
    setJsonValidationError(null);
    const start = performance.now();

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(sandboxPayloadText || "{}");
      } catch (err: any) {
        setJsonValidationError("Invalid JSON: " + err.message);
        setSandboxStatusCode(400);
        setSandboxResponse({
          status: "error",
          code: 400,
          error: "Malformed JSON payload: " + err.message,
        });
        setSandboxLatency(Math.round(performance.now() - start));
        setSandboxIsExecuting(false);
        return;
      }

      const res = await fetch("/api/v1/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: activeEndpoint.path,
          method: activeEndpoint.method,
          headers: {
            Authorization: `Bearer ${sandboxApiKey}`,
          },
          payload: parsedPayload,
          mockMode: true,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setSandboxStatusCode(res.status);
      setSandboxLatency(elapsed);
      setSandboxResponse(data);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setSandboxStatusCode(500);
      setSandboxLatency(elapsed);
      setSandboxResponse({
        status: "error",
        code: 500,
        error: "Sandbox execution network error: " + (err?.message || "Failed to contact local server"),
      });
    } finally {
      setSandboxIsExecuting(false);
    }
  };

  // Filtered Endpoints by search query
  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return endpoints;
    const q = searchQuery.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.shortDesc.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q)
    );
  }, [endpoints, searchQuery]);

  // Code snippet generators
  const getDynamicCurl = (ep: EndpointDefinition) => {
    const payloadStr = ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : "{}";
    const baseUrl = activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng";
    const key = activeEnvironment === "production" ? "YOUR_API_KEY_HERE" : sandboxApiKey;

    if (ep.method === "GET") {
      return `curl -X GET "${baseUrl}${ep.path}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Accept: application/json"`;
    }
    return `curl -X POST "${baseUrl}${ep.path}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadStr}'`;
  };

  const getDynamicNode = (ep: EndpointDefinition) => {
    const payloadStr = ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : "{}";
    const baseUrl = activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng";
    const key = activeEnvironment === "production" ? "YOUR_API_KEY_HERE" : sandboxApiKey;

    if (ep.method === "GET") {
      return `import axios from 'axios';

const response = await axios.get('${baseUrl}${ep.path}', {
  headers: {
    'Authorization': 'Bearer ${key}',
    'Accept': 'application/json'
  }
});

console.log('API Status:', response.data.status);
console.log('Result:', response.data);`;
    }
    return `import axios from 'axios';

const payload = ${payloadStr};

const response = await axios.post(
  '${baseUrl}${ep.path}',
  payload,
  {
    headers: {
      'Authorization': 'Bearer ${key}',
      'Content-Type': 'application/json'
    }
  }
);

console.log('API Status:', response.data.status);
console.log('Result:', response.data);`;
  };

  const getDynamicPython = (ep: EndpointDefinition) => {
    const payloadStr = ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : "{}";
    const baseUrl = activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng";
    const key = activeEnvironment === "production" ? "YOUR_API_KEY_HERE" : sandboxApiKey;

    if (ep.method === "GET") {
      return `import requests

url = "${baseUrl}${ep.path}"
headers = {
    "Authorization": "Bearer ${key}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;
    }
    return `import requests

url = "${baseUrl}${ep.path}"
payload = ${payloadStr}
headers = {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
  };

  const getDynamicPhp = (ep: EndpointDefinition) => {
    const payloadStr = ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : "{}";
    const baseUrl = activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng";
    const key = activeEnvironment === "production" ? "YOUR_API_KEY_HERE" : sandboxApiKey;

    if (ep.method === "GET") {
      return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "${baseUrl}${ep.path}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer ${key}",
    "Accept: application/json"
  ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
    }
    return `<?php
$curl = curl_init();
$payload = json_encode(${payloadStr});

curl_setopt_array($curl, [
  CURLOPT_URL => "${baseUrl}${ep.path}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer ${key}",
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
  };

  const currentCodeSnippet = useMemo(() => {
    switch (selectedLanguage) {
      case "node":
        return getDynamicNode(activeEndpoint);
      case "python":
        return getDynamicPython(activeEndpoint);
      case "php":
        return getDynamicPhp(activeEndpoint);
      case "curl":
      default:
        return getDynamicCurl(activeEndpoint);
    }
  }, [activeEndpoint, selectedLanguage, sandboxApiKey, activeEnvironment]);

  const categories = ["Identity & KYC", "Telecom & VTU", "Utility Bills", "Education Pins", "Wallet & Banking"] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0F2D5C] selection:text-white">
      <SEOHead
        title="SmartLink NG Developer Hub | Official Identity Verification & Fintech APIs"
        description="Comprehensive developer REST API documentation with interactive sandbox, live endpoint testing, OpenAPI 3.0 specs, and code snippets for NIN, BVN, VTU airtime, and electricity bills."
        canonicalUrl="https://smartlinkng.com.ng/api-docs"
      />

      {/* =========================================================================
          TOP PERSISTENT DEVELOPER NAV HEADER (High Contrast & SmartLink Navy Theme)
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#CBD5E1] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-[#0F2D5C] hover:bg-[#F1F5F9] cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <img
              src={activeLogo}
              alt={siteName || "Smart Link NG"}
              className="h-8 sm:h-9 w-auto object-contain"
              onError={handleLogoError}
            />
            <div className="hidden sm:block border-l border-[#CBD5E1] pl-3 py-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-[#0F2D5C] group-hover:text-[#17407E] transition-colors">
                  Developer Portal
                </span>
                <span className="text-[10px] font-mono text-[#0F2D5C] bg-[#0F2D5C]/10 border border-[#0F2D5C]/30 px-1.5 py-0.2 rounded font-bold">
                  v1.4.0
                </span>
              </div>
              <p className="text-[10.5px] text-[#475569] font-medium">
                LumiID &amp; Identro Rails Standard
              </p>
            </div>
          </button>
        </div>

        {/* Center: Environment Toggle & Base URL */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setActiveEnvironment("sandbox")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeEnvironment === "sandbox"
                  ? "bg-[#0F2D5C] text-white shadow-xs"
                  : "text-[#475569] hover:text-[#0F2D5C]"
              }`}
            >
              Sandbox Testbed
            </button>
            <button
              type="button"
              onClick={() => setActiveEnvironment("production")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeEnvironment === "production"
                  ? "bg-[#0F2D5C] text-white shadow-xs"
                  : "text-[#475569] hover:text-[#0F2D5C]"
              }`}
            >
              Live Production
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] text-xs text-[#0F172A] font-mono font-medium">
            <span className="text-[#475569] font-bold">Base:</span>
            <span className="text-[#0F2D5C] font-extrabold">
              {activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(
                activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng",
                "base_url"
              )}
              className="text-[#475569] hover:text-[#0F2D5C] cursor-pointer ml-1"
              title="Copy Base URL"
            >
              {copiedField === "base_url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (currentUser && onNavigateToDashboardApiKeys) {
                onNavigateToDashboardApiKeys();
              } else {
                setSelectedItem("guide_keys");
              }
            }}
            className="px-3 sm:px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" />
            <span>{currentUser ? "My Dashboard Keys" : "Get API Keys"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/openapi.json", "smartlink-openapi.json")}
            className="hidden sm:flex px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#0F2D5C] font-bold text-xs rounded-lg border border-[#CBD5E1] transition-all items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>OpenAPI 3.0</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/api/v1/postman.json", "smartlink-postman-collection.json")}
            className="hidden lg:flex px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-lg border border-amber-300 transition-all items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-700" />
            <span>Postman</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="p-1.5 text-[#0F2D5C] hover:bg-[#F1F5F9] rounded-lg cursor-pointer transition-colors"
            title="Return to Main Portal"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          BODY 3-COLUMN WORKSPACE: LEFT NAV | CENTER DOCS | RIGHT CONSOLE
      ========================================================================= */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto relative overflow-hidden">
        
        {/* ========================================================
            COLUMN 1: LEFT SIDEBAR NAVIGATION
        ======================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 top-14 sm:top-16 z-30 w-72 sm:w-80 bg-white border-r border-[#CBD5E1] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 shadow-xs ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-0 max-lg:-translate-x-full"
          }`}
        >
          {/* Search Bar Input */}
          <div className="p-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC]">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NIN, BVN, VTU, Education..."
                className="w-full bg-white text-xs text-[#0F172A] pl-8 pr-3 py-2 rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C] transition-colors placeholder:text-[#64748B] font-sans font-medium"
              />
            </div>
          </div>

          {/* Navigation Items Scroll Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs select-none scrollbar-thin scrollbar-thumb-slate-300">
            {/* Guides Section */}
            <div>
              <div className="px-2.5 pb-1.5 text-[11px] font-black text-[#0F2D5C] tracking-wider uppercase flex items-center justify-between">
                <span>Guides &amp; Architecture</span>
              </div>
              <div className="space-y-0.5">
                {guides.map((g) => {
                  const Icon = g.icon;
                  const isActive = selectedItem === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(g.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left cursor-pointer font-semibold ${
                        isActive
                          ? "bg-[#0F2D5C] text-white shadow-xs"
                          : "text-[#334155] hover:text-[#0F2D5C] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-300" : "text-[#475569]"}`} />
                      <span className="truncate">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Endpoints Grouped by Category */}
            {categories.map((cat) => {
              const catEndpoints = filteredEndpoints.filter((ep) => ep.category === cat);
              if (catEndpoints.length === 0) return null;

              return (
                <div key={cat}>
                  <div className="px-2.5 pb-1.5 text-[11px] font-black text-[#0F2D5C] tracking-wider uppercase flex items-center justify-between">
                    <span>{cat}</span>
                    <span className="text-[10px] text-[#475569] font-mono font-bold">
                      {catEndpoints.length}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {catEndpoints.map((ep) => {
                      const isActive = selectedItem === ep.id;
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => {
                            setSelectedItem(ep.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                            isActive
                              ? "bg-[#0F2D5C] text-white font-bold shadow-xs"
                              : "text-[#334155] hover:text-[#0F2D5C] hover:bg-[#F1F5F9]"
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{ep.title}</span>
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded shrink-0 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : ep.method === "GET"
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                            }`}
                          >
                            {ep.method}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Sidebar Footer: SLA */}
          <div className="p-3 border-t border-[#CBD5E1] bg-[#F8FAFC] text-[11px] text-[#334155] flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[#0F2D5C] font-bold">SLA: 99.98%</span>
            </span>
            <span className="text-[#475569] font-mono">&lt;350ms p95</span>
          </div>
        </aside>

        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-20 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ========================================================
            COLUMN 2 & 3: MAIN DOCUMENTATION CANVAS & CONSOLE
        ======================================================== */}
        <main className="flex-1 overflow-y-auto flex flex-col xl:flex-row bg-[#F8FAFC]">
          
          {/* ========================================================
              IF GUIDE SELECTED: RENDER SPECIFIC ARCHITECTURE GUIDE
          ======================================================== */}
          {isGuideActive ? (
            <div className="flex-1 p-5 sm:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150">
              
              {/* Guide 1: Overview */}
              {selectedItem === "guide_overview" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F2D5C] via-[#17407E] to-[#0F2D5C] text-white shadow-md space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>SmartLink NG Developer Platform</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                      Digital Identity, KYC &amp; Fintech Automation Rails
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-100 max-w-2xl leading-relaxed">
                      Official REST JSON endpoints for instant Nigerian NIN/vNIN identity verification, BVN biometric lookup, corporate CAC entity search, automated VTU airtime &amp; SME data bundles, and electricity STS tokens modeled on LumiID and Identro provider standards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="text-sm font-extrabold text-[#0F2D5C]">Production Rails</span>
                        <span className="text-emerald-800 font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                          Live Active
                        </span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        Execute live customer KYC verification, debit your wholesale ledger balance, and retrieve official verifiable PDF slips.
                      </p>
                      <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#0F2D5C] font-bold select-all">
                        https://smartlinkng.com.ng/api/v1
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="text-sm font-extrabold text-[#0F2D5C]">Sandbox Testbed</span>
                        <span className="text-amber-900 font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-bold">
                          Zero Cost Simulation
                        </span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        Simulate full request and response lifecycles, test mock responses, and verify webhook signatures without debiting your wallet balance.
                      </p>
                      <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#0F2D5C] font-bold select-all">
                        https://sandbox.smartlinkng.com.ng/api/v1
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-[#0F2D5C] flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>5-Step Developer Onboarding Roadmap</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">01. Register</span>
                        <p className="text-[#334155]">Create a free account in the SmartLink NG portal.</p>
                      </div>
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">02. Dashboard Keys</span>
                        <p className="text-[#334155]">Navigate to User Dashboard &gt; Security &gt; Developer API Keys.</p>
                      </div>
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">03. Whitelist IP</span>
                        <p className="text-[#334155]">Add your production server IP address for security.</p>
                      </div>
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">04. Fund Ledger</span>
                        <p className="text-[#334155]">Transfer to your dedicated virtual account NUBAN.</p>
                      </div>
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">05. Go Live</span>
                        <p className="text-[#334155]">Call production endpoints with your secret key.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guide 2: Authentication */}
              {selectedItem === "guide_auth" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Security &amp; Protocols
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">Authentication &amp; Bearer Keys</h1>
                    <p className="text-sm text-[#334155] mt-2 leading-relaxed max-w-3xl">
                      Authenticate all HTTP requests to the SmartLink NG API using HTTP Bearer Tokens sent in the <code className="bg-[#F1F5F9] text-[#0F2D5C] px-1.5 py-0.5 rounded font-mono font-bold border border-[#CBD5E1]">Authorization</code> header.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#475569]">
                      <span className="font-bold text-[#0F2D5C]">Header Specification</span>
                      <button
                        type="button"
                        onClick={() => handleCopy("Authorization: Bearer YOUR_API_KEY_HERE", "auth_header")}
                        className="text-[#0F2D5C] hover:text-[#17407E] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "auth_header" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>Copy Header</span>
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-[#0F2D5C] p-3 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] overflow-x-auto font-bold">
Authorization: Bearer YOUR_API_KEY_HERE
                    </pre>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#0F2D5C]">API Key Types &amp; Security Rules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1.5">
                        <span className="font-mono text-emerald-800 font-extrabold text-sm">sk_live_...</span>
                        <p className="text-[#0F2D5C] font-extrabold">Live Production Secret Key</p>
                        <p className="text-[#334155] leading-relaxed">
                          Used on your backend server only. Never expose this key in client-side applications (React, Android APK, iOS, or frontend websites).
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-1.5">
                        <span className="font-mono text-amber-800 font-extrabold text-sm">sk_sandbox_...</span>
                        <p className="text-[#0F2D5C] font-extrabold">Sandbox Simulation Key</p>
                        <p className="text-[#334155] leading-relaxed">
                          Used during development and automated tests. Returns realistic identity and telecom mock data without debiting your wallet balance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guide 3: Dashboard API Keys Gated Notice */}
              {selectedItem === "guide_keys" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Developer Credentials &amp; KYC Compliance
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">Dashboard API Key Management</h1>
                    <p className="text-sm text-[#334155] mt-2 leading-relaxed max-w-3xl">
                      In compliance with statutory NIMC, NIBSS, and CBN compliance standards, API keys (both Sandbox and Live Production) are issued exclusively within the authenticated User Dashboard. Users must register and log in before accessing credentials.
                    </p>
                  </div>

                  {currentUser ? (
                    /* User IS logged in: show direct portal access */
                    <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-4">
                      <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>You are logged in as <strong className="text-[#0F2D5C]">{currentUser.email}</strong></span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        Your developer keys, IP whitelisting rules, and webhook secrets are securely managed inside your User Security Center.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToDashboardApiKeys) {
                              onNavigateToDashboardApiKeys();
                            }
                          }}
                          className="px-4 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <KeyRound className="h-4 w-4 text-amber-300" />
                          <span>Open Developer API Keys in Dashboard</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* User is NOT logged in: show register / login gate */
                    <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-5">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950">
                        <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-extrabold text-sm text-[#0F2D5C]">Registration Required for API Keys</h3>
                          <p className="text-xs text-[#334155] mt-1 leading-relaxed">
                            To protect statutory citizen identity data and prevent unauthorized automated queries, every developer must register an account and generate their credentials inside their user dashboard.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <button
                          type="button"
                          onClick={onRegister}
                          className="p-4 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-left transition-all cursor-pointer shadow-md shadow-[#0F2D5C]/20 space-y-1 active:scale-98"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm">Register Free Developer Account</span>
                            <ArrowRight className="h-4 w-4 text-amber-300" />
                          </div>
                          <p className="text-xs text-slate-200">
                            Instant onboarding. Generate sandbox &amp; live keys in 60 seconds.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={onLogin}
                          className="p-4 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F2D5C] border border-[#CBD5E1] text-left transition-all cursor-pointer shadow-2xs space-y-1 active:scale-98"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm">Log In to Existing Account</span>
                            <ArrowRight className="h-4 w-4 text-[#0F2D5C]" />
                          </div>
                          <p className="text-xs text-[#475569]">
                            Already registered? Access your existing production keys immediately.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-3">
                    <h3 className="text-sm font-extrabold text-[#0F2D5C]">Why Keys Are Protected Inside User Dashboards:</h3>
                    <ul className="text-xs text-[#334155] space-y-2 list-disc pl-5 leading-relaxed">
                      <li><strong>Statutory NIMC &amp; CBN Compliance:</strong> Mandatory accountability for biometric &amp; identity verifications.</li>
                      <li><strong>Granular IP Whitelisting:</strong> Restrict API calls strictly to your designated production server IPs.</li>
                      <li><strong>Instant Key Rotation:</strong> Rotate compromised keys with zero system downtime.</li>
                      <li><strong>Dedicated Dedicated Webhook Secrets:</strong> Unique HMAC-SHA512 secrets per developer node.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Guide 4: Webhooks */}
              {selectedItem === "guide_webhooks" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Real-Time Callbacks
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">Webhooks &amp; HMAC-SHA512 Signatures</h1>
                    <p className="text-sm text-[#334155] mt-2 leading-relaxed max-w-3xl">
                      Receive real-time HTTP POST notifications on your server when transactions succeed, identity slips are generated, or virtual account credits settle.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">Node.js Signature Verification Example</h3>
                    <pre className="text-xs font-mono text-[#0F2D5C] p-3.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] overflow-x-auto leading-relaxed font-bold">
{`const crypto = require('crypto');

function verifySmartLinkSignature(rawBody, signatureHeader, secret) {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  return hash === signatureHeader;
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Guide 5: SDKs & Libraries */}
              {selectedItem === "guide_sdks" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Official Client Libraries
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">SDKs &amp; Code Libraries</h1>
                    <p className="text-sm text-[#334155] mt-2 leading-relaxed max-w-3xl">
                      Accelerate your integration using ready-to-run code samples and lightweight wrappers for Node.js (TypeScript), Python, and PHP.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">Node.js / TypeScript Wrapper</h3>
                    <pre className="text-xs font-mono text-[#0F2D5C] p-3.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] overflow-x-auto leading-relaxed font-bold">
{`import axios from 'axios';

export class SmartLinkClient {
  constructor(private apiKey: string, private baseUrl = 'https://smartlinkng.com.ng') {}

  async verifyNIN(nin: string) {
    const res = await axios.post(\`\${this.baseUrl}/api/v1/nin/verify\`, { nin }, {
      headers: { Authorization: \`Bearer \${this.apiKey}\` }
    });
    return res.data;
  }

  async verifyBVN(bvn: string) {
    const res = await axios.post(\`\${this.baseUrl}/api/v1/bvn/verify\`, { bvn }, {
      headers: { Authorization: \`Bearer \${this.apiKey}\` }
    });
    return res.data;
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Guide 6: Status Codes & Error Standard */}
              {selectedItem === "guide_errors" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Response Standards
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">HTTP Status Codes &amp; Errors</h1>
                    <p className="text-sm text-[#334155] mt-2 leading-relaxed max-w-3xl">
                      SmartLink NG returns standard HTTP status codes along with a consistent JSON envelope on every response.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EEF2F6] text-[#0F2D5C] font-extrabold border-b border-[#CBD5E1]">
                        <tr>
                          <th className="p-3">HTTP Code</th>
                          <th className="p-3">Status Name</th>
                          <th className="p-3">Meaning &amp; Troubleshooting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CBD5E1] text-[#1E293B]">
                        <tr>
                          <td className="p-3 font-mono text-emerald-700 font-extrabold">200</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">OK / Success</td>
                          <td className="p-3 text-[#334155]">Request completed successfully; response payload populated.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-amber-700 font-extrabold">400</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">Bad Request</td>
                          <td className="p-3 text-[#334155]">Missing required fields or malformed payload JSON.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-700 font-extrabold">401</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">Unauthorized</td>
                          <td className="p-3 text-[#334155]">Missing, invalid, or expired Bearer API token.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-700 font-extrabold">402</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">Payment Required</td>
                          <td className="p-3 text-[#334155]">Developer node ledger balance is insufficient for transaction cost.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-amber-700 font-extrabold">422</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">Unprocessable Entity</td>
                          <td className="p-3 text-[#334155]">Record not found in government database (e.g. invalid NIN or BVN).</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-700 font-extrabold">502</td>
                          <td className="p-3 font-bold text-[#0F2D5C]">Bad Gateway</td>
                          <td className="p-3 text-[#334155]">Upstream statutory NIMC/NIBSS rail downtime or network timeout.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================
               ENDPOINT VIEW: 2-PANE (CENTER SPECS + RIGHT CODE & SANDBOX)
            ======================================================== */
            <>
              {/* CENTER COLUMN: ENDPOINT SPECIFICATION & SCHEMA */}
              <div className="flex-1 p-5 sm:p-8 max-w-3xl space-y-6 animate-in fade-in duration-150">
                {/* Endpoint Header & Breadcrumb */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-2 font-bold">
                    <span>SmartLink Docs</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{activeEndpoint.category}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-[#0F2D5C] font-extrabold">{activeEndpoint.title}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0F2D5C]">{activeEndpoint.title}</h1>
                  <p className="text-xs sm:text-sm text-[#334155] mt-2 leading-relaxed font-medium">
                    {activeEndpoint.description}
                  </p>
                  {activeEndpoint.complianceNote && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#0F2D5C] font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{activeEndpoint.complianceNote}</span>
                    </div>
                  )}
                </div>

                {/* HTTP Method & Route Bar */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono shadow-2xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      activeEndpoint.method === "GET"
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                    }`}
                  >
                    {activeEndpoint.method}
                  </span>
                  <span className="text-[#0F2D5C] font-extrabold select-all break-all">
                    {activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}
                    {activeEndpoint.path}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(
                      `${activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}${activeEndpoint.path}`,
                      "ep_url"
                    )}
                    className="ml-auto text-[#475569] hover:text-[#0F2D5C] cursor-pointer shrink-0"
                    title="Copy Endpoint URL"
                  >
                    {copiedField === "ep_url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Required Headers Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-[#0F2D5C] uppercase tracking-wider">Required Headers</h3>
                  <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EEF2F6] text-[#0F2D5C] font-extrabold border-b border-[#CBD5E1]">
                        <tr>
                          <th className="p-2.5">Header</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CBD5E1] text-[#1E293B]">
                        <tr>
                          <td className="p-2.5 font-mono text-[#0F2D5C] font-bold">Authorization</td>
                          <td className="p-2.5 font-mono text-[#475569] font-semibold">string</td>
                          <td className="p-2.5 text-[#1E293B]">
                            Required. Format: <code className="bg-[#F1F5F9] text-[#0F2D5C] px-1.5 py-0.5 rounded font-mono font-bold border border-[#CBD5E1]">Bearer sk_live_...</code>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-[#0F2D5C] font-bold">Content-Type</td>
                          <td className="p-2.5 font-mono text-[#475569] font-semibold">string</td>
                          <td className="p-2.5 text-[#1E293B]">
                            Required for POST requests: <code className="bg-[#F1F5F9] text-[#0F2D5C] px-1.5 py-0.5 rounded font-mono font-bold border border-[#CBD5E1]">application/json</code>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-[#334155] font-bold">X-Idempotency-Key</td>
                          <td className="p-2.5 font-mono text-[#475569] font-semibold">string</td>
                          <td className="p-2.5 text-[#475569]">Optional UUID string to prevent duplicate billing charges.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parameters & Request Body Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-[#0F2D5C] uppercase tracking-wider">
                    {activeEndpoint.method === "GET" ? "Query Parameters" : "Request Body Schema"}
                  </h3>
                  {activeEndpoint.parameters.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#EEF2F6] text-[#0F2D5C] font-extrabold border-b border-[#CBD5E1]">
                          <tr>
                            <th className="p-2.5">Parameter</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Requirement</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CBD5E1] text-[#1E293B]">
                          {activeEndpoint.parameters.map((param) => (
                            <tr key={param.name}>
                              <td className="p-2.5 font-mono font-extrabold text-[#0F2D5C]">{param.name}</td>
                              <td className="p-2.5 font-mono text-[#475569] font-semibold">{param.type}</td>
                              <td className="p-2.5">
                                {param.required ? (
                                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                                    required
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#475569] font-bold">optional</span>
                                )}
                              </td>
                              <td className="p-2.5 text-[#1E293B]">
                                <div>{param.description}</div>
                                {param.example && (
                                  <div className="text-[11px] text-[#475569] font-mono mt-0.5">
                                    Example: <code className="bg-[#F1F5F9] text-[#0F2D5C] font-bold px-1 rounded">{param.example}</code>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#334155] p-3 rounded-xl bg-white border border-[#CBD5E1]">
                      This endpoint does not require any additional request parameters or payload body.
                    </p>
                  )}
                </div>

                {/* Response Schema Breakdown */}
                {activeEndpoint.responseFields && activeEndpoint.responseFields.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-[#0F2D5C] uppercase tracking-wider">Response Attributes (data object)</h3>
                    <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#EEF2F6] text-[#0F2D5C] font-extrabold border-b border-[#CBD5E1]">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CBD5E1] text-[#1E293B]">
                          {activeEndpoint.responseFields.map((field) => (
                            <tr key={field.name}>
                              <td className="p-2.5 font-mono font-extrabold text-[#0F2D5C]">{field.name}</td>
                              <td className="p-2.5 font-mono text-[#475569] font-semibold">{field.type}</td>
                              <td className="p-2.5 text-[#1E293B] font-medium">{field.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: SMARTLINK NAVY TERMINAL & LIVE TESTBED CONSOLE */}
              <div className="w-full xl:w-[480px] 2xl:w-[540px] bg-[#07152B] border-t xl:border-t-0 xl:border-l border-[#17407E] p-4 sm:p-6 flex flex-col space-y-6 text-slate-100 shadow-xl">
                
                {/* 1. Code Snippets Window */}
                <div className="rounded-2xl border border-[#17407E] bg-[#030B17] overflow-hidden shadow-inner">
                  {/* Language Switcher */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#020710] border-b border-[#17407E] text-xs">
                    <div className="flex items-center gap-1">
                      {(["curl", "node", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                            selectedLanguage === lang
                              ? "bg-[#0F2D5C] text-white shadow-xs"
                              : "text-slate-200 hover:text-white"
                          }`}
                        >
                          {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : lang === "python" ? "Python" : "PHP"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(currentCodeSnippet, "code_snippet")}
                      className="text-slate-100 hover:text-white flex items-center gap-1 cursor-pointer text-xs font-bold"
                      title="Copy Code"
                    >
                      {copiedField === "code_snippet" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedField === "code_snippet" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Code Block */}
                  <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-60 select-all font-semibold">
                    {currentCodeSnippet}
                  </pre>
                </div>

                {/* 2. Embedded Interactive Sandbox ("Try It Out" Console) */}
                <div className="rounded-2xl border border-[#17407E] bg-[#030B17] p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#17407E] pb-3">
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 text-emerald-400" />
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Interactive Testbed (Try It Out)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                      Trial Simulation Mode
                    </span>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-100 font-semibold">
                      <span>Sandbox Authorization Key</span>
                      <span className="text-[10px] text-amber-300">
                        {currentUser ? "Registered Node" : "Trial Mode"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={sandboxApiKey}
                      onChange={(e) => setSandboxApiKey(e.target.value)}
                      placeholder="sk_sandbox_..."
                      className="w-full bg-[#020710] text-xs text-white font-mono px-3 py-2 rounded-lg border border-[#17407E] focus:outline-none focus:border-[#2563EB]"
                    />
                    {!currentUser && (
                      <p className="text-[10.5px] text-slate-300 pt-0.5">
                        Permanent keys are managed in your User Dashboard.{" "}
                        <button
                          type="button"
                          onClick={onRegister}
                          className="text-amber-300 hover:underline font-bold cursor-pointer"
                        >
                          Register Free
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Request Payload Editor (for POST endpoints) */}
                  {activeEndpoint.method === "POST" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-100 font-semibold">
                        <span>Payload JSON</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(sandboxPayloadText);
                                setSandboxPayloadText(JSON.stringify(parsed, null, 2));
                                setJsonValidationError(null);
                              } catch (e: any) {
                                setJsonValidationError("Format error: " + e.message);
                              }
                            }}
                            className="text-[10px] text-blue-300 hover:text-white cursor-pointer font-bold"
                          >
                            Beautify
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeEndpoint.defaultPayload) {
                                setSandboxPayloadText(JSON.stringify(activeEndpoint.defaultPayload, null, 2));
                                setJsonValidationError(null);
                              }
                            }}
                            className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={6}
                        value={sandboxPayloadText}
                        onChange={(e) => {
                          setSandboxPayloadText(e.target.value);
                          if (jsonValidationError) setJsonValidationError(null);
                        }}
                        className="w-full bg-[#020710] text-xs font-mono text-slate-100 p-3 rounded-lg border border-[#17407E] focus:outline-none focus:border-[#2563EB] resize-none leading-relaxed"
                        spellCheck={false}
                      />
                      {jsonValidationError && (
                        <p className="text-[11px] text-rose-400 font-mono font-bold">{jsonValidationError}</p>
                      )}
                    </div>
                  )}

                  {/* Send Request Button */}
                  <button
                    type="button"
                    disabled={sandboxIsExecuting}
                    onClick={executeSandboxRequest}
                    className="w-full py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#0F2D5C]/30 flex items-center justify-center gap-2 active:scale-98 border border-blue-400/20"
                  >
                    {sandboxIsExecuting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Executing Request Against Rails...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>Send Request ({activeEndpoint.method})</span>
                      </>
                    )}
                  </button>

                  {/* Response Execution Output */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-100 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>Response Output</span>
                        {sandboxStatusCode && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              sandboxStatusCode >= 200 && sandboxStatusCode < 300
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            HTTP {sandboxStatusCode}
                          </span>
                        )}
                        {sandboxLatency !== null && (
                          <span className="text-[10px] font-mono text-emerald-300">⚡ {sandboxLatency}ms</span>
                        )}
                      </div>

                      {sandboxResponse && (
                        <div className="flex items-center gap-2">
                          {sandboxResponse?.data?.slipUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(sandboxResponse.data.slipUrl, "official-slip.pdf")}
                              className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-bold"
                            >
                              <Download className="h-3 w-3" />
                              <span>Slip PDF</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(JSON.stringify(sandboxResponse, null, 2), "res_output")}
                            className="text-[11px] text-slate-100 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                          >
                            {copiedField === "res_output" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-52 bg-[#020710] text-xs font-mono p-3 rounded-xl border border-[#17407E] overflow-y-auto leading-relaxed">
                      {sandboxResponse ? (
                        <pre className="text-emerald-300 whitespace-pre-wrap font-medium">
                          {JSON.stringify(sandboxResponse, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-1">
                          <Terminal className="h-6 w-6 text-slate-400" />
                          <p className="text-[11px] text-slate-200 font-medium">Click &quot;Send Request&quot; to test against live engine</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPublicView;
