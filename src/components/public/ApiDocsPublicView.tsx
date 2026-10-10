/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SmartLink NG Developer Hub - Identity Verification & Fintech Rails
 * Designed following LumiID & Identro API Provider Documentation Standards
 * Styled with Smart Link NG Signature Navy (#0F2D5C), Royal Blue (#17407E), and Fintech Green Theme
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
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { DEFAULT_LOGO_URL, handleLogoError } from "../../utils/brandLogo";

interface ApiDocsPublicViewProps {
  onLogin?: () => void;
  onRegister?: () => void;
  onGetStarted?: () => void;
  onNavigateHome: () => void;
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
  category: "Identity & KYC" | "Telecom & VTU" | "Utility Bills" | "Wallet & Banking";
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
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
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

  // Instant API Key Generator state
  const [generatedLiveKey, setGeneratedLiveKey] = useState<string>("YOUR_API_KEY_HERE");
  const [generatedSandboxKey, setGeneratedSandboxKey] = useState<string>("sk_sandbox_8a0f96b917741156ab5acbc3");
  const [generatedWebhookSecret, setGeneratedWebhookSecret] = useState<string>("whsec_a2d9a1affd071f6fc0779f377b95a42aad48c7d0");
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  // Upstream Gateway SLA & health state
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [isFetchingProviders, setIsFetchingProviders] = useState<boolean>(false);
  const [providerLastRefreshed, setProviderLastRefreshed] = useState<string | null>(null);

  // Interactive Sandbox console state
  const [sandboxApiKey, setSandboxApiKey] = useState<string>("sk_sandbox_8a0f96b917741156ab5acbc3");
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
        setProviderLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch {
      // Fallback silent
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

  const handleGenerateInstantKey = async () => {
    setIsGeneratingKey(true);
    setKeyNotice(null);
    try {
      const res = await fetch("/api/v1/developer/keys/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Production Developer Node" }),
      });
      const data = await res.json();
      if (data?.credentials) {
        setGeneratedLiveKey(data.credentials.liveApiKey);
        setGeneratedSandboxKey(data.credentials.sandboxApiKey);
        setGeneratedWebhookSecret(data.credentials.webhookSecret);
        setSandboxApiKey(data.credentials.sandboxApiKey);
        setKeyNotice("Fresh credentials provisioned! Live and sandbox keys are active.");
      }
    } catch {
      const mockLive = `sk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
      const mockSand = `sk_sandbox_${Math.random().toString(36).slice(2, 10)}`;
      const mockWh = `whsec_${Math.random().toString(36).slice(2, 10)}`;
      setGeneratedLiveKey(mockLive);
      setGeneratedSandboxKey(mockSand);
      setGeneratedWebhookSecret(mockWh);
      setSandboxApiKey(mockSand);
      setKeyNotice("Fresh test developer keys generated.");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // =========================================================================
  // COMPLETE ENDPOINTS REGISTRY (LumiID & Identro Provider Standards)
  // =========================================================================
  const endpoints: EndpointDefinition[] = [
    // -----------------------------------------------------------------------
    // IDENTITY & KYC VERIFICATION (LumiID / Identro Core)
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
      description: "Queries the 16-character Virtual NIN generated from the NIMC MWS Mobile ID App or USSD code. Ensures maximum privacy compliance by retrieving verified demographics without storing or transmitting raw 11-digit NINs.",
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

    // -----------------------------------------------------------------------
    // TELECOMS & VTU AIRTIME / DATA
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
        { name: "dataSize", type: "string", description: "Provisioned volume (e.g. '1.0 GB SME Data')", },
        { name: "validity", type: "string", description: "Bundle validity duration (e.g. '30 Days')", },
        { name: "status", type: "string", description: "Delivery status: SUCCESS", },
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

    // -----------------------------------------------------------------------
    // UTILITIES & BILL PAYMENTS
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

    // -----------------------------------------------------------------------
    // WALLET & BANKING RAILS
    // -----------------------------------------------------------------------
    {
      id: "wallet_balance",
      category: "Wallet & Banking",
      method: "GET",
      path: "/api/v1/wallet/balance",
      title: "Query Developer Ledger Balance",
      shortDesc: "Real-time ledger balance, ledger currency, and wholesale credit limit",
      description: "Retrieves the current ledger balance, reserved balance, currency code, and automated overdraft limit of your developer node wallet.",
      parameters: [],
      responseFields: [
        { name: "walletBalance", type: "number", description: "Available spendable balance in NGN" },
        { name: "currency", type: "string", description: "Three-letter currency code (NGN)" },
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
    { id: "guide_overview", label: "Overview & Base URLs", icon: Globe, section: "GETTING STARTED" },
    { id: "guide_auth", label: "Authentication & Bearer Keys", icon: Lock, section: "GETTING STARTED" },
    { id: "guide_keys", label: "Instant API Key Generator", icon: KeyRound, section: "GETTING STARTED" },
    { id: "guide_webhooks", label: "Webhooks & HMAC Signatures", icon: Webhook, section: "GETTING STARTED" },
    { id: "guide_infrastructure", label: "Upstream Rails SLA (99.98%)", icon: Server, section: "GETTING STARTED" },
    { id: "guide_errors", label: "Status Codes & Error Standard", icon: AlertTriangle, section: "GETTING STARTED" },
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
    const key = activeEnvironment === "production" ? generatedLiveKey : sandboxApiKey;

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
    const key = activeEnvironment === "production" ? generatedLiveKey : sandboxApiKey;

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
    const key = activeEnvironment === "production" ? generatedLiveKey : sandboxApiKey;

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
    const key = activeEnvironment === "production" ? generatedLiveKey : sandboxApiKey;

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
  }, [activeEndpoint, selectedLanguage, sandboxApiKey, generatedLiveKey, activeEnvironment]);

  const categories = ["Identity & KYC", "Telecom & VTU", "Utility Bills", "Wallet & Banking"] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-[#0F2D5C] selection:text-white">
      <SEOHead
        title="SmartLink NG Developer Hub | Official Identity Verification & Fintech APIs"
        description="Statutory Nigerian identity verification (NIN, BVN, CAC, Phone KYC), telecom VTU airtime & data, electricity bills, and developer virtual accounts API documentation modeled on LumiID and Identro provider standards."
        canonicalUrl="https://smartlinkng.com.ng/api-docs"
      />

      {/* =========================================================================
          TOP PERSISTENT DEVELOPER NAV HEADER (Smart Link NG Signature Theme)
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-[#374151] hover:text-[#0F2D5C] hover:bg-[#F3F4F6] cursor-pointer"
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
            <div className="hidden sm:block border-l border-[#E2E8F0] pl-3 py-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-[#0F2D5C] group-hover:text-[#17407E] transition-colors">
                  Developer Portal
                </span>
                <span className="text-[10px] font-mono text-[#0F2D5C] bg-[#0F2D5C]/10 border border-[#0F2D5C]/20 px-1.5 py-0.2 rounded font-bold">
                  v1.4.0
                </span>
              </div>
              <p className="text-[10.5px] text-[#64748B]">
                LumiID &amp; Identro Rails Standard
              </p>
            </div>
          </button>
        </div>

        {/* Center: Environment Toggle & Base URL (SmartLink Navy & Slate) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Environment Selector Switch */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setActiveEnvironment("sandbox")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeEnvironment === "sandbox"
                  ? "bg-[#0F2D5C] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F2D5C]"
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
                  : "text-[#64748B] hover:text-[#0F2D5C]"
              }`}
            >
              Live Production
            </button>
          </div>

          {/* Base URL Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] text-xs text-[#475569] font-mono">
            <span className="text-[#64748B] font-semibold">Base:</span>
            <span className="text-[#0F2D5C] font-bold">
              {activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(
                activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng",
                "base_url"
              )}
              className="text-[#64748B] hover:text-[#0F2D5C] cursor-pointer ml-1"
              title="Copy Base URL"
            >
              {copiedField === "base_url" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Right Action Controls (SmartLink Brand Colors) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedItem("guide_keys")}
            className="px-3 sm:px-3.5 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" />
            <span>Get API Keys</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/openapi.json", "smartlink-openapi.json")}
            className="hidden sm:flex px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-xs rounded-lg border border-[#CBD5E1] transition-all items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-[#0F2D5C]" />
            <span>OpenAPI 3.0</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/api/v1/postman.json", "smartlink-postman-collection.json")}
            className="hidden lg:flex px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-lg border border-amber-300 transition-all items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-600" />
            <span>Postman</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="p-1.5 text-[#4B5563] hover:text-[#0F2D5C] rounded-lg hover:bg-[#F3F4F6] cursor-pointer transition-colors"
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
            COLUMN 1: LEFT SIDEBAR NAVIGATION (SmartLink Clean Sidebar)
        ======================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 top-14 sm:top-16 z-30 w-72 sm:w-80 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 shadow-xs ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-0 max-lg:-translate-x-full"
          }`}
        >
          {/* Search Bar Input */}
          <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NIN, BVN, VTU endpoints..."
                className="w-full bg-white text-xs text-[#0F172A] pl-8 pr-3 py-2 rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0F2D5C] focus:ring-1 focus:ring-[#0F2D5C] transition-colors placeholder:text-[#94A3B8] font-sans"
              />
            </div>
          </div>

          {/* Navigation Items Scroll Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs select-none scrollbar-thin scrollbar-thumb-slate-200">
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left cursor-pointer font-medium ${
                        isActive
                          ? "bg-[#0F2D5C] text-white font-bold shadow-xs"
                          : "text-[#475569] hover:text-[#0F2D5C] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-300" : "text-[#64748B]"}`} />
                      <span className="truncate">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Endpoints Grouped by Category (LumiID / Identro Standard) */}
            {categories.map((cat) => {
              const catEndpoints = filteredEndpoints.filter((ep) => ep.category === cat);
              if (catEndpoints.length === 0) return null;

              return (
                <div key={cat}>
                  <div className="px-2.5 pb-1.5 text-[11px] font-black text-[#0F2D5C] tracking-wider uppercase flex items-center justify-between">
                    <span>{cat}</span>
                    <span className="text-[10px] text-[#64748B] font-mono font-normal">
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
                              : "text-[#475569] hover:text-[#0F2D5C] hover:bg-[#F1F5F9]"
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{ep.title}</span>
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded shrink-0 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : ep.method === "GET"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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

          {/* Left Sidebar Footer: SmartLink SLA commitment */}
          <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#0F2D5C]">SLA: 99.98%</span>
            </span>
            <span className="text-[#64748B] font-mono">&lt;350ms p95</span>
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
                  {/* Hero Banner for Developer Hub */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F2D5C] via-[#17407E] to-[#0F2D5C] text-white shadow-md space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>SmartLink NG Identity &amp; Fintech Developer Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                      Digital Identity, KYC &amp; Fintech Rails Architecture
                    </h1>
                    <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                      Statutory REST JSON endpoints for instant Nigerian NIN/vNIN identity verification, BVN lookups, corporate CAC entity validation, cheap VTU airtime &amp; SME data bundles, and automated virtual account funding modeled after LumiID and Identro provider standards.
                    </p>
                  </div>

                  {/* Environments Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="text-sm font-extrabold">Production Rails</span>
                        <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          Live Active
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        Connect live customer registration flows, instant bill settlements, and official NIMC slip PDF rendering.
                      </p>
                      <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#0F2D5C] font-semibold select-all">
                        https://smartlinkng.com.ng/api/v1
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="text-sm font-extrabold">Sandbox Testbed</span>
                        <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-bold">
                          Zero Cost
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        Execute full request/response lifecycles, test mock responses, and verify webhook signatures without debiting your wallet balance.
                      </p>
                      <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#0F2D5C] font-semibold select-all">
                        https://sandbox.smartlinkng.com.ng/api/v1
                      </div>
                    </div>
                  </div>

                  {/* 3 Steps Integration Plan */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-[#0F2D5C] flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>3-Step Quickstart Integration</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">01. Provision Key</span>
                        <p className="text-[#475569]">Generate your live &amp; test bearer credentials in the Keys tab with 1 click.</p>
                      </div>
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">02. Test in Console</span>
                        <p className="text-[#475569]">Select any endpoint and fire test calls in the right interactive sandbox pane.</p>
                      </div>
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#0F2D5C] font-mono font-extrabold">03. Go Live</span>
                        <p className="text-[#475569]">Switch to your live API key, fund your node virtual account, and subscribe to webhooks.</p>
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
                    <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
                      Authenticate all HTTP requests to the SmartLink NG API using HTTP Bearer Tokens sent in the <code className="text-[#0F2D5C] font-mono font-bold">Authorization</code> header.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span className="font-bold text-[#0F2D5C]">Header Format</span>
                      <button
                        type="button"
                        onClick={() => handleCopy("Authorization: Bearer YOUR_API_KEY_HERE", "auth_header")}
                        className="text-[#0F2D5C] hover:text-[#17407E] font-semibold flex items-center gap-1 cursor-pointer"
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
                    <h3 className="text-sm font-bold text-[#0F2D5C]">API Key Types &amp; Prefixes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                        <span className="font-mono text-emerald-700 font-black">sk_live_...</span>
                        <p className="text-[#0F2D5C] font-bold">Live Production Secret Key</p>
                        <p className="text-[#64748B]">Deducts wholesale transaction cost from developer node ledger balance.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                        <span className="font-mono text-amber-700 font-black">sk_sandbox_...</span>
                        <p className="text-[#0F2D5C] font-bold">Sandbox Simulation Key</p>
                        <p className="text-[#64748B]">Returns realistic test records without debiting your wallet balance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guide 3: Instant API Key Generator */}
              {selectedItem === "guide_keys" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                      Developer Credentials
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">Instant API Key Generator</h1>
                    <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
                      Generate, inspect, and copy live production keys and test keys with a single click. Every key works immediately across all SmartLink NG endpoints without external redirects.
                    </p>
                  </div>

                  {keyNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {keyNotice}
                      </span>
                      <button
                        type="button"
                        onClick={() => setKeyNotice(null)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isGeneratingKey}
                      onClick={handleGenerateInstantKey}
                      className="px-4 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#0F2D5C]/20 flex items-center gap-2 active:scale-95"
                    >
                      {isGeneratingKey ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          <span>Generate Fresh Keys</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const payload = {
                          liveApiKey: generatedLiveKey,
                          sandboxApiKey: generatedSandboxKey,
                          webhookSecret: generatedWebhookSecret,
                          baseUrl: "https://smartlinkng.com.ng",
                          generatedAt: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "smartlink-credentials.json";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3.5 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#0F2D5C] font-bold text-xs rounded-xl border border-[#CBD5E1] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Credentials JSON</span>
                    </button>
                  </div>

                  {/* Credentials Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Live Key */}
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-emerald-600" />
                          <span>Live Production API Key</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          Active
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={generatedLiveKey}
                          className="w-full bg-[#F8FAFC] text-xs text-[#0F2D5C] font-mono font-bold p-3 pr-20 rounded-xl border border-[#CBD5E1] focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedLiveKey, "live_key")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-[#0F2D5C] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedField === "live_key" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedField === "live_key" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Sandbox Key */}
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="flex items-center gap-1.5">
                          <Play className="h-4 w-4 text-amber-600" />
                          <span>Sandbox Simulation Key</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-bold">
                          Zero Cost
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={generatedSandboxKey}
                          className="w-full bg-[#F8FAFC] text-xs text-[#0F2D5C] font-mono font-bold p-3 pr-20 rounded-xl border border-[#CBD5E1] focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedSandboxKey, "sand_key")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-[#0F2D5C] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedField === "sand_key" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedField === "sand_key" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Webhook Secret */}
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                        <span className="flex items-center gap-1.5">
                          <Lock className="h-4 w-4 text-[#17407E]" />
                          <span>Webhook Signature Secret (HMAC-SHA512)</span>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={generatedWebhookSecret}
                          className="w-full bg-[#F8FAFC] text-xs text-[#0F2D5C] font-mono font-bold p-3 pr-20 rounded-xl border border-[#CBD5E1] focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedWebhookSecret, "wh_secret")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-[#0F2D5C] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedField === "wh_secret" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedField === "wh_secret" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
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
                    <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
                      Receive real-time HTTP POST notifications on your server when transactions succeed, identity slips are generated, or virtual account credits settle.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">Node.js Signature Verification Example</h3>
                    <pre className="text-xs font-mono text-[#0F2D5C] p-3.5 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] overflow-x-auto leading-relaxed font-semibold">
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

              {/* Guide 5: Upstream Infrastructure & SLA */}
              {selectedItem === "guide_infrastructure" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider mb-1">
                        High Availability Architecture
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D5C]">Upstream Gateway Rails SLA</h1>
                      <p className="text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">
                        SmartLink NG routes all queries across redundant tier-1 gateways with automated circuit breakers and sub-second failover.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isFetchingProviders}
                      onClick={fetchProviderHealth}
                      className="px-3.5 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetchingProviders ? "animate-spin" : ""}`} />
                      <span>Refresh Live Ping</span>
                    </button>
                  </div>

                  {/* Provider Rails Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(providerHealth?.providers || [
                      { id: "prov_aspfiy", name: "Aspfiy Payment & Virtual Accounts", status: "OPERATIONAL", latencyMs: 142, uptime: "99.99%" },
                      { id: "prov_clubkonnect", name: "Clubkonnect VTU & SME Telecom", status: "OPERATIONAL", latencyMs: 310, uptime: "99.95%" },
                      { id: "prov_vtpass", name: "VTpass Power Discos & Cable TV", status: "OPERATIONAL", latencyMs: 285, uptime: "99.96%" },
                      { id: "prov_lumiid", name: "LumiID NIMC Identity Gateway", status: "OPERATIONAL", latencyMs: 380, uptime: "99.92%" },
                      { id: "prov_identro", name: "Identro NIBSS BVN Portal", status: "OPERATIONAL", latencyMs: 340, uptime: "99.94%" },
                      { id: "prov_prembley", name: "Prembley Multi-KYC & CAC", status: "OPERATIONAL", latencyMs: 295, uptime: "99.97%" },
                    ]).map((prov: any) => (
                      <div key={prov.id} className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0F2D5C]">
                          <span>{prov.name}</span>
                          <span className="flex items-center gap-1 text-emerald-700 text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>{prov.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#64748B] font-mono pt-1">
                          <span>Latency: {prov.latencyMs}ms</span>
                          <span>Uptime: {prov.uptime}</span>
                        </div>
                      </div>
                    ))}
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
                    <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
                      SmartLink NG returns standard HTTP status codes along with a consistent JSON envelope on every response.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#0F2D5C] font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3">HTTP Code</th>
                          <th className="p-3">Status Name</th>
                          <th className="p-3">Meaning &amp; Troubleshooting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                        <tr>
                          <td className="p-3 font-mono text-emerald-600 font-bold">200</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">OK / Success</td>
                          <td className="p-3 text-[#64748B]">Request completed successfully; response payload populated.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-amber-600 font-bold">400</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">Bad Request</td>
                          <td className="p-3 text-[#64748B]">Missing required fields or malformed payload JSON.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-600 font-bold">401</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">Unauthorized</td>
                          <td className="p-3 text-[#64748B]">Missing, invalid, or expired Bearer API token.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-600 font-bold">402</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">Payment Required</td>
                          <td className="p-3 text-[#64748B]">Developer node ledger balance is insufficient for transaction cost.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-amber-600 font-bold">422</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">Unprocessable Entity</td>
                          <td className="p-3 text-[#64748B]">Record not found in government database (e.g. invalid NIN or BVN).</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-rose-600 font-bold">502</td>
                          <td className="p-3 font-semibold text-[#0F2D5C]">Bad Gateway</td>
                          <td className="p-3 text-[#64748B]">Upstream statutory NIMC/NIBSS rail downtime or network timeout.</td>
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
              {/* CENTER COLUMN: ENDPOINT SPECIFICATION & SCHEMA (SmartLink Clean Reading Canvas) */}
              <div className="flex-1 p-5 sm:p-8 max-w-3xl space-y-6 animate-in fade-in duration-150">
                {/* Endpoint Header & Breadcrumb */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
                    <span>SmartLink Docs</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{activeEndpoint.category}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-[#0F2D5C] font-semibold">{activeEndpoint.title}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0F2D5C]">{activeEndpoint.title}</h1>
                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {activeEndpoint.description}
                  </p>
                  {activeEndpoint.complianceNote && (
                    <div className="mt-3 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[11.5px] text-[#0F2D5C] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{activeEndpoint.complianceNote}</span>
                    </div>
                  )}
                </div>

                {/* HTTP Method & Route Bar (SmartLink Theme) */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono shadow-2xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      activeEndpoint.method === "GET"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {activeEndpoint.method}
                  </span>
                  <span className="text-[#0F2D5C] font-bold select-all break-all">
                    {activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}
                    {activeEndpoint.path}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(
                      `${activeEnvironment === "production" ? "https://smartlinkng.com.ng" : "https://sandbox.smartlinkng.com.ng"}${activeEndpoint.path}`,
                      "ep_url"
                    )}
                    className="ml-auto text-[#64748B] hover:text-[#0F2D5C] cursor-pointer shrink-0"
                    title="Copy Endpoint URL"
                  >
                    {copiedField === "ep_url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Required Headers Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">Required Headers</h3>
                  <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#0F2D5C] font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-2.5">Header</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                        <tr>
                          <td className="p-2.5 font-mono text-[#0F2D5C] font-bold">Authorization</td>
                          <td className="p-2.5 font-mono text-[#64748B]">string</td>
                          <td className="p-2.5 text-[#334155]">
                            Required. Format: <code className="text-[#0F2D5C] font-semibold">Bearer sk_live_...</code>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-[#0F2D5C] font-bold">Content-Type</td>
                          <td className="p-2.5 font-mono text-[#64748B]">string</td>
                          <td className="p-2.5 text-[#334155]">
                            Required for POST requests: <code className="text-[#0F2D5C] font-semibold">application/json</code>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-[#475569] font-medium">X-Idempotency-Key</td>
                          <td className="p-2.5 font-mono text-[#64748B]">string</td>
                          <td className="p-2.5 text-[#64748B]">Optional UUID string to prevent duplicate billing charges.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parameters & Request Body Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">
                    {activeEndpoint.method === "GET" ? "Query Parameters" : "Request Body Schema"}
                  </h3>
                  {activeEndpoint.parameters.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] text-[#0F2D5C] font-bold border-b border-[#E2E8F0]">
                          <tr>
                            <th className="p-2.5">Parameter</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Requirement</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                          {activeEndpoint.parameters.map((param) => (
                            <tr key={param.name}>
                              <td className="p-2.5 font-mono font-bold text-[#0F2D5C]">{param.name}</td>
                              <td className="p-2.5 font-mono text-[#64748B]">{param.type}</td>
                              <td className="p-2.5">
                                {param.required ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    required
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-medium">optional</span>
                                )}
                              </td>
                              <td className="p-2.5 text-[#334155]">
                                {param.description}
                                {param.example && (
                                  <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                                    Example: <code className="text-[#0F2D5C] font-semibold">{param.example}</code>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] p-3 rounded-xl bg-white border border-[#E2E8F0]">
                      This endpoint does not require any additional request parameters or payload body.
                    </p>
                  )}
                </div>

                {/* Response Schema Breakdown */}
                {activeEndpoint.responseFields && activeEndpoint.responseFields.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#0F2D5C] uppercase tracking-wider">Response Attributes (data object)</h3>
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] text-[#0F2D5C] font-bold border-b border-[#E2E8F0]">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                          {activeEndpoint.responseFields.map((field) => (
                            <tr key={field.name}>
                              <td className="p-2.5 font-mono font-bold text-[#0F2D5C]">{field.name}</td>
                              <td className="p-2.5 font-mono text-[#64748B]">{field.type}</td>
                              <td className="p-2.5 text-[#334155]">{field.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: SMARTLINK NAVY TERMINAL & EMBEDDED LIVE SANDBOX CONSOLE */}
              <div className="w-full xl:w-[480px] 2xl:w-[540px] bg-[#0A1C38] border-t xl:border-t-0 xl:border-l border-[#0F2D5C] p-4 sm:p-6 flex flex-col space-y-6 text-slate-100 shadow-xl">
                
                {/* 1. Code Snippets Window (SmartLink Deep Navy Terminal) */}
                <div className="rounded-2xl border border-[#0F2D5C] bg-[#07152B] overflow-hidden shadow-inner">
                  {/* Language Tab Switcher */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#051024] border-b border-[#0F2D5C]/60 text-xs">
                    <div className="flex items-center gap-1">
                      {(["curl", "node", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                            selectedLanguage === lang
                              ? "bg-[#0F2D5C] text-white font-bold shadow-xs"
                              : "text-slate-300 hover:text-white"
                          }`}
                        >
                          {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : lang === "python" ? "Python" : "PHP"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(currentCodeSnippet, "code_snippet")}
                      className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer text-xs"
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
                <div className="rounded-2xl border border-[#0F2D5C]/80 bg-[#07152B] p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#0F2D5C]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Interactive Testbed (Try It Out)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                      Zero Cost Simulation
                    </span>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Sandbox Authorization Key</span>
                      <button
                        type="button"
                        onClick={() => setSandboxApiKey(`sk_sandbox_${Math.random().toString(36).slice(2, 10)}`)}
                        className="text-[10px] text-amber-300 hover:underline cursor-pointer font-semibold"
                      >
                        Mock Key
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sandboxApiKey}
                      onChange={(e) => setSandboxApiKey(e.target.value)}
                      placeholder="sk_sandbox_..."
                      className="w-full bg-[#051024] text-xs text-white font-mono px-3 py-2 rounded-lg border border-[#0F2D5C] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Request Payload Editor (for POST endpoints) */}
                  {activeEndpoint.method === "POST" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
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
                            className="text-[10px] text-blue-300 hover:text-white cursor-pointer"
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
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
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
                        className="w-full bg-[#051024] text-xs font-mono text-slate-100 p-3 rounded-lg border border-[#0F2D5C] focus:outline-none focus:border-[#2563EB] resize-none leading-relaxed"
                        spellCheck={false}
                      />
                      {jsonValidationError && (
                        <p className="text-[11px] text-rose-400 font-mono">{jsonValidationError}</p>
                      )}
                    </div>
                  )}

                  {/* Send Request Button (SmartLink Navy CTA) */}
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
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>Response Output</span>
                        {sandboxStatusCode && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              sandboxStatusCode >= 200 && sandboxStatusCode < 300
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            HTTP {sandboxStatusCode}
                          </span>
                        )}
                        {sandboxLatency !== null && (
                          <span className="text-[10px] font-mono text-slate-300">{sandboxLatency}ms</span>
                        )}
                      </div>

                      {sandboxResponse && (
                        <div className="flex items-center gap-2">
                          {sandboxResponse?.data?.slipUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(sandboxResponse.data.slipUrl, "official-slip.pdf")}
                              className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              <span>Slip PDF</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(JSON.stringify(sandboxResponse, null, 2), "res_output")}
                            className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === "res_output" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-52 bg-[#051024] text-xs font-mono p-3 rounded-xl border border-[#0F2D5C] overflow-y-auto leading-relaxed">
                      {sandboxResponse ? (
                        <pre className="text-emerald-300 whitespace-pre-wrap">
                          {JSON.stringify(sandboxResponse, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-1">
                          <Terminal className="h-6 w-6 text-slate-500" />
                          <p className="text-[11px]">Click &quot;Send Request&quot; to test against live engine</p>
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
