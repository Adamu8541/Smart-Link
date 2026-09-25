/**
 * SmartLink Central Verification Engine Service
 *
 * Centralized service managing all verification flows across SmartLink.
 * Enforces strict workflow:
 * User -> Select Service -> Validate Input -> Check Auth -> Check Wallet -> Call Backend API -> Standardize Response -> Generate Receipt & History.
 */

import {
  VerificationServiceConfig,
  VerificationType,
  StandardizedVerificationResult,
  VerificationHistoryItem,
  VerificationErrorState,
  VerificationProgressStep,
  SlipFormatType,
} from "../types/verification";
import { VerificationValidator } from "./verificationValidator";
import { WalletService } from "./walletService";

export const VERIFICATION_SERVICES: VerificationServiceConfig[] = [
  {
    id: "NIN_DEMOGRAPHY",
    title: "NIN Demography Verification",
    subtitle: "NIMC Demographics Portal",
    description: "Verify identity records via official NIMC demographic details (First Name, Last Name, Gender & Date of Birth).",
    icon: "Users",
    category: "IDENTITY",
    fee: 600,
    providerName: "NIMC Demographic Registry",
    primaryInputLabel: "Demographics Search",
    primaryInputPlaceholder: "Search by Name, Gender & DOB",
    primaryInputName: "demographics",
    primaryInputHelp: "Match demographic details with NIMC database.",
    inputType: "text",
  },
  {
    id: "NIN",
    title: "NIN Identity Verification",
    subtitle: "NIN Portal API",
    description: "Verify NIN profiles via third-party providers using 11-digit NIN.",
    icon: "Fingerprint",
    category: "IDENTITY",
    fee: 500,
    providerName: "NIN Validation Portal",
    primaryInputLabel: "National Identification Number (NIN)",
    primaryInputPlaceholder: "e.g. 12345678901",
    primaryInputName: "nin",
    primaryInputHelp: "Enter the 11-digit NIN.",
    inputType: "text",
    additionalFields: [
      {
        name: "fullName",
        label: "Full Name (Optional Matching)",
        type: "text",
        placeholder: "e.g. Abubakar Muhammad",
        required: false,
      },
    ],
  },
  {
    id: "BVN",
    title: "BVN Banking Verification",
    subtitle: "CBN / BVN Portal",
    description: "Validate Bank Verification Number records with Central Bank of Nigeria database.",
    icon: "ShieldCheck",
    category: "IDENTITY",
    fee: 500,
    providerName: "BVN Portal",
    primaryInputLabel: "Bank Verification Number (BVN)",
    primaryInputPlaceholder: "e.g. 22233344455",
    primaryInputName: "bvn",
    primaryInputHelp: "Enter 11-digit BVN linked to Nigerian commercial bank account.",
    inputType: "text",
    additionalFields: [
      {
        name: "fullName",
        label: "Account Holder Name",
        type: "text",
        placeholder: "e.g. Abubakar Muhammad",
        required: false,
      },
    ],
  },
  {
    id: "NIN_PHONE",
    title: "NIN With Phone Number",
    subtitle: "NIMC Phone Lookup Portal",
    description: "Verify NIN records using candidate's 11-digit registered phone number.",
    icon: "Phone",
    category: "IDENTITY",
    fee: 500,
    providerName: "NIMC Phone Registry Portal",
    primaryInputLabel: "Phone Number",
    primaryInputPlaceholder: "e.g. 08012345678",
    primaryInputName: "phoneNumber",
    primaryInputHelp: "Enter 11-digit phone number starting with 0.",
    inputType: "text",
  },
  {
    id: "PHONE",
    title: "Phone Number Identity Lookup",
    subtitle: "Telco KYC Portal",
    description: "Lookup identity, SIM registration data, and network provider for phone numbers.",
    icon: "Phone",
    category: "IDENTITY",
    fee: 300,
    providerName: "NCC Joint Telco Registry",
    primaryInputLabel: "Phone Number",
    primaryInputPlaceholder: "e.g. 08031234567 or +2348031234567",
    primaryInputName: "phoneNumber",
    primaryInputHelp: "Enter valid Nigerian mobile number.",
    inputType: "text",
  },
  {
    id: "EMAIL",
    title: "Email Deliverability & Fraud Verification",
    subtitle: "SmartLink Security Engine",
    description: "Verify email validity, MX record deliverability, domain risk, and fraud score.",
    icon: "Mail",
    category: "CREDENTIAL",
    fee: 200,
    providerName: "SmartLink Anti-Fraud Portal",
    primaryInputLabel: "Email Address",
    primaryInputPlaceholder: "e.g. user@example.com",
    primaryInputName: "email",
    primaryInputHelp: "Enter email address for domain and deliverability validation.",
    inputType: "email",
  },
  {
    id: "CAC",
    title: "CAC Enterprise Status Verification",
    subtitle: "Corporate Affairs Commission National Portal",
    description: "Verify business status, RC/BN registration, classification, and incorporation date.",
    icon: "Building2",
    category: "CORPORATE",
    fee: 1000,
    providerName: "CAC Enterprise Portal",
    primaryInputLabel: "RC / BN / IT Number or Business Name",
    primaryInputPlaceholder: "e.g. RC 1908234 or SmartLink Ltd",
    primaryInputName: "rcNumber",
    primaryInputHelp: "Enter CAC Registration Number or full Business Name.",
    inputType: "text",
  },
  {
    id: "TIN",
    title: "Tax Identification Number (TIN) Verification",
    subtitle: "FIRS Federal Tax Portal",
    description: "Verify taxpayer identification details, tax office jurisdiction, and compliance status.",
    icon: "FileCheck2",
    category: "TAX",
    fee: 500,
    providerName: "TIN Portal Engine",
    primaryInputLabel: "Tax Identification Number (TIN)",
    primaryInputPlaceholder: "e.g. 12345678-0001",
    primaryInputName: "tin",
    primaryInputHelp: "Enter 10 to 14 digit FIRS TIN for personal or corporate taxpayer.",
    inputType: "text",
  },
  {
    id: "DRIVER_LICENSE",
    title: "FRSC Driver License Verification",
    subtitle: "Federal Road Safety Corps Registry",
    description: "Validate driver license authenticity, class, issuing state, and expiry status.",
    icon: "Car",
    category: "CREDENTIAL",
    fee: 750,
    providerName: "FRSC National Licensing Engine",
    primaryInputLabel: "Driver License Number",
    primaryInputPlaceholder: "e.g. ABC123456789",
    primaryInputName: "licenseNumber",
    primaryInputHelp: "Enter 12-character license number printed on FRSC driver card.",
    inputType: "text",
  },
  {
    id: "PASSPORT",
    title: "International Passport Verification",
    subtitle: "Nigerian Immigration Service Portal",
    description: "Verify NIS e-passport validity, document number, and immigration verification status.",
    icon: "Globe",
    category: "CREDENTIAL",
    fee: 1000,
    providerName: "NIS Immigration Central Portal",
    primaryInputLabel: "Passport Number",
    primaryInputPlaceholder: "e.g. A12345678",
    primaryInputName: "passportNumber",
    primaryInputHelp: "Enter valid Nigerian international passport document number.",
    inputType: "text",
  },
  {
    id: "VOTER_CARD",
    title: "INEC Voter Card (VIN) Verification",
    subtitle: "INEC Electoral Registry",
    description: "Verify Permanent Voter Card (PVC) details, polling unit, and voter registration ID.",
    icon: "Vote",
    category: "CREDENTIAL",
    fee: 500,
    providerName: "INEC Electoral Portal",
    primaryInputLabel: "Voter Identification Number (VIN)",
    primaryInputPlaceholder: "e.g. 90F5B12345678901234",
    primaryInputName: "vin",
    primaryInputHelp: "Enter 19-digit VIN printed on your INEC PVC.",
    inputType: "text",
  },
];

export const VERIFICATION_PROGRESS_STEPS: VerificationProgressStep[] = [
  { id: 1, label: "Checking Wallet Balance...", progress: 15 },
  { id: 2, label: "Connecting Securely to Provider...", progress: 35 },
  { id: 3, label: "Sending Verification Request...", progress: 55 },
  { id: 4, label: "Waiting for Provider Response...", progress: 75 },
  { id: 5, label: "Receiving & Validating Data...", progress: 90 },
  { id: 6, label: "Generating Official Digital Receipt...", progress: 98 },
  { id: 7, label: "Almost Done...", progress: 100 },
];

export class VerificationEngine {
  /**
   * Helper to retrieve service config by ID
   */
  static getServiceConfig(serviceType: VerificationType): VerificationServiceConfig {
    const found = VERIFICATION_SERVICES.find(
      (s) => s.id.toUpperCase() === serviceType.toUpperCase()
    );
    if (found) return found;

    // Fallback config for dynamic or future services
    return {
      id: serviceType,
      title: `${serviceType} Verification Service`,
      subtitle: "SmartLink Verification Portal",
      description: `Perform real-time verification query for ${serviceType}.`,
      icon: "ShieldCheck",
      category: "IDENTITY",
      fee: 500,
      providerName: "SmartLink Federal Portal",
      primaryInputLabel: "Target Identification Number",
      primaryInputPlaceholder: "Enter target ID",
      primaryInputName: "targetId",
      primaryInputHelp: "Provide target identification parameter.",
      inputType: "text",
    };
  }

  /**
   * Main Verification Execution Workflow
   */
  static async executeVerification(params: {
    userId: string;
    serviceType: VerificationType;
    primaryInput: string;
    additionalFields?: Record<string, any>;
    slipType?: SlipFormatType;
    customFee?: number;
    autoEmailToRegistered?: boolean;
    onProgressUpdate?: (step: VerificationProgressStep) => void;
  }): Promise<{
    success: boolean;
    result?: StandardizedVerificationResult;
    errorState?: VerificationErrorState;
  }> {
    const {
      userId,
      serviceType,
      primaryInput,
      additionalFields = {},
      slipType = "NIN_REGULAR",
      customFee,
      autoEmailToRegistered = false,
      onProgressUpdate,
    } = params;

    const config = this.getServiceConfig(serviceType);
    const effectiveFee = typeof customFee === "number" ? customFee : config.fee;

    // Step 1: Validate Input
    const validation = VerificationValidator.validateInput(
      serviceType,
      primaryInput,
      additionalFields
    );

    if (!validation.valid) {
      return {
        success: false,
        errorState: {
          code: "INVALID_INPUT",
          message: validation.error || "Input validation failed.",
          friendlyMessage: "Invalid Identification Format",
          details: validation.error,
        },
      };
    }

    // Step 2: Check Authentication
    if (!userId) {
      return {
        success: false,
        errorState: {
          code: "AUTH_ERROR",
          message: "User authentication required.",
          friendlyMessage: "Authentication Required",
          details: "Please sign in to your Smart Link account to perform verifications.",
        },
      };
    }

    // Progress update: Checking Wallet
    onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[0]);

    // Step 3: Check Wallet Balance with effectiveFee
    const walletRes = await WalletService.validateWallet(userId, effectiveFee);
    if (!walletRes.valid) {
      return {
        success: false,
        errorState: {
          code: "WALLET_ERROR",
          message: walletRes.error || "Insufficient wallet balance.",
          friendlyMessage: walletRes.errorCode === "INSUFFICIENT_BALANCE"
            ? "Insufficient Wallet Balance"
            : "Wallet Account Error",
          details: walletRes.error,
        },
      };
    }

    // Progress updates through connection steps
    onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[1]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[2]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[3]);

    // Step 4: Call Backend API Portal
    try {
      const startTime = Date.now();
      let authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const { getAuthHeaders } = await import("./providerService");
        authHeaders = await getAuthHeaders(userId);
      } catch {}

      // Helper to cleanly sanitize errors and strip any HTML/CSS warmup text
      const cleanErrorString = (val: any): string => {
        if (!val) return "";
        let s = String(val);
        if (
          s.includes("Starting Server") ||
          s.includes("Please wait while your application starts") ||
          s.includes("warmup_start_time") ||
          s.includes("<!doctype") ||
          s.includes("<html")
        ) {
          return "The verification service was briefly warming up. Please click 'Retry Query' to submit again.";
        }
        // Extract human-readable string from Django REST Framework ErrorDetail syntax
        // e.g. {'id_number': [ErrorDetail(string='BVN is required', code='required')]}
        if (s.includes("ErrorDetail") || s.includes("id_number")) {
          s = s.replace(/ErrorDetail\(string=['"]([^'"]+)['"],\s*code=['"][^'"]+['"]\)/g, "$1");
          s = s.replace(/\{'id_number':\s*\[?'([^']+)'\]?\}/g, "$1");
          s = s.replace(/\{['"]?id_number['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1");
          s = s.replace(/\{['"]?(\w+)['"]?:\s*\[?['"]?([^'"\]}]+)['"]?\]?\}/g, "$1: $2");
          s = s.replace(/[\[\]'"{}]/g, "").trim();
        }
        // Remove style & script tags along with their inner contents
        let cleaned = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
        cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
        cleaned = cleaned.replace(/<[^>]+>/g, " ");
        cleaned = cleaned.replace(/\s+/g, " ").trim();
        if (cleaned.includes(":root") || cleaned.includes("color-scheme") || cleaned.length > 250) {
          return "Verification portal temporarily busy. Please retry your query in a few moments.";
        }
        return cleaned;
      };

      // Perform fetch with up to 2 automatic retries for transient container warmup / 502 / 503
      let response: Response | null = null;
      let rawText = "";
      let data: any = {};

      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
          response = await fetch("/api/verify/engine", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              userId,
              service: serviceType,
              targetId: validation.formattedValue || String(primaryInput || "").trim(),
              extraFields: {
                ...additionalFields,
                ...(serviceType === "BVN" ? {
                  bvn: validation.formattedValue || String(primaryInput || "").trim(),
                  id_number: validation.formattedValue || String(primaryInput || "").trim(),
                  idNumber: validation.formattedValue || String(primaryInput || "").trim(),
                } : {}),
              },
              fee: effectiveFee,
              slipType,
              autoEmailToRegistered,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          rawText = await response.text();

          const isHtmlWarmup =
            rawText.includes("Starting Server") ||
            rawText.includes("Please wait while your application starts") ||
            rawText.trim().startsWith("<!DOCTYPE") ||
            rawText.trim().startsWith("<html");

          // Only retry if it was genuinely a proxy/container warmup HTML response
          if (isHtmlWarmup && attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          try {
            data = JSON.parse(rawText);
          } catch {
            if (isHtmlWarmup) {
              data = {
                error: "The verification server was briefly warming up. Please click 'Retry Query' now.",
                errorCode: "SERVER_WARMING_UP",
                friendlyMessage: "Server Initializing",
                details: "The verification server is now ready. Please click 'Retry Query' below to proceed.",
              };
            } else {
              const cleaned = cleanErrorString(rawText);
              data = {
                error: cleaned || `Verification portal responded with status ${response.status}`,
                errorCode: response.status === 502 ? "PORTAL_ERROR" : "SERVER_ERROR",
                friendlyMessage: "Verification Provider Error",
                details: cleaned || `HTTP ${response.status}: Failed to parse portal response`,
              };
            }
          }

          // If we got a valid JSON parse (or handled HTML), break out of retry loop
          break;
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          data = {
            error: fetchErr.message || "Network connection failed",
            errorCode: "NETWORK_ERROR",
            friendlyMessage: "Connection Error",
            details: "Could not reach verification portal. Please check your internet connection.",
          };
          break;
        }
      }

      onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[4]);

      const clientCalculatedTime = Date.now() - startTime;
      const isHttpOk = response ? response.ok : false;

      if (!isHttpOk || !data.success || data.error) {
        const rawErrMsg = String(data.error || data.message || "Verification request rejected by provider server.");
        const cleanErrMsg = cleanErrorString(rawErrMsg) || "Verification request rejected by provider server.";
        const rawDetails = String(data.details || cleanErrMsg || (response ? `HTTP ${response.status}: ${response.statusText}` : "Request failed"));
        const cleanDetails = cleanErrorString(rawDetails) || cleanErrMsg;

        const statusCode = response ? response.status : 500;
        const isNotFound = cleanErrMsg.toLowerCase().includes("not found") || cleanErrMsg.toLowerCase().includes("does not exist");
        const isInsufficientCredits = cleanErrMsg.toLowerCase().includes("insufficient") || cleanErrMsg.toLowerCase().includes("wallet balance");

        return {
          success: false,
          errorState: {
            code: data.errorCode || (isNotFound ? "RECORD_NOT_FOUND" : isInsufficientCredits ? "PROVIDER_CREDITS_EXHAUSTED" : statusCode === 401 || statusCode === 403 ? "AUTH_ERROR" : statusCode === 502 ? "PORTAL_ERROR" : "VERIFICATION_FAILED"),
            message: cleanErrMsg,
            friendlyMessage: data.friendlyMessage || (isNotFound ? "Identity Record Not Found" : isInsufficientCredits ? "Provider Balance Depleted" : data.errorCode === "PORTAL_VERIFICATION_FAILED" ? "Verification Unsuccessful" : "Verification Failed"),
            details: cleanDetails,
          },
        };
      }

      onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[5]);
      await new Promise((resolve) => setTimeout(resolve, 200));

      onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[6]);

      // Step 5: Format and return Standardized Result
      const standardizedResult: StandardizedVerificationResult = {
        status: data.status || "SUCCESS",
        reference: data.reference || `SML-VER-${Math.floor(100000 + Math.random() * 900000)}`,
        message: data.message || `${config.title} completed successfully`,
        data: data.data || null,
        timestamp: data.timestamp || new Date().toISOString(),
        providerName: data.providerName || config.providerName,
        responseTime: data.responseTime || clientCalculatedTime,
        receiptNumber: data.receiptNumber || `REC-${data.reference || "SML-VER-000000"}`,
        service: serviceType,
        serviceTitle: config.title,
        fee: effectiveFee,
        verifiedId: primaryInput,
        maskedId: VerificationValidator.maskID(primaryInput),
        userId,
        slipType: (additionalFields as any)?.slipType || slipType,
        formatId: slipType || (additionalFields as any)?.formatId,
      };

      return {
        success: true,
        result: standardizedResult,
      };
    } catch (err: any) {
      return {
        success: false,
        errorState: {
          code: "NETWORK_ERROR",
          message: err.message || "Failed to communicate with Smart Link Verification server.",
          friendlyMessage: "Network Communication Failure",
          details: "Please check your internet connection and try again.",
        },
      };
    }
  }

  /**
   * Fetch Verification History from Server
   */
  static async getVerificationHistory(userId: string): Promise<VerificationHistoryItem[]> {
    if (!userId) return [];
    try {
      const res = await fetch(`/api/verify/history/${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.error("Error fetching verification history:", err);
      return [];
    }
  }
}
