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
} from "../types/verification";
import { VerificationValidator } from "./verificationValidator";
import { WalletService } from "./walletService";

export const VERIFICATION_SERVICES: VerificationServiceConfig[] = [
  {
    id: "NIN",
    title: "NIN Identity Verification",
    subtitle: "NIMC Primary Gateway",
    description: "Verify full official NIMC identification profiles using 11-digit NIN.",
    icon: "Fingerprint",
    category: "IDENTITY",
    fee: 500,
    providerName: "NIMC Federal Gateway",
    primaryInputLabel: "National Identification Number (NIN)",
    primaryInputPlaceholder: "e.g. 12345678901",
    primaryInputName: "nin",
    primaryInputHelp: "Enter the 11-digit NIN displayed on NIMC slip or card.",
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
    subtitle: "CBN / NIBSS Central Switch",
    description: "Validate Bank Verification Number records with Central Bank of Nigeria database.",
    icon: "ShieldCheck",
    category: "IDENTITY",
    fee: 500,
    providerName: "NIBSS Central Switch",
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
    id: "PHONE",
    title: "Phone Number Identity Lookup",
    subtitle: "Telco KYC Gateway",
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
    providerName: "SmartLink Anti-Fraud Gateway",
    primaryInputLabel: "Email Address",
    primaryInputPlaceholder: "e.g. user@example.com",
    primaryInputName: "email",
    primaryInputHelp: "Enter email address for domain and deliverability validation.",
    inputType: "email",
  },
  {
    id: "CAC",
    title: "CAC Enterprise Status Verification",
    subtitle: "Corporate Affairs Commission Abuja",
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
    providerName: "FIRS Tax Portal Engine",
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
    subtitle: "Nigerian Immigration Service Gateway",
    description: "Verify NIS e-passport validity, document number, and immigration verification status.",
    icon: "Globe",
    category: "CREDENTIAL",
    fee: 1000,
    providerName: "NIS Immigration Central Gateway",
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
      subtitle: "SmartLink Verification Gateway",
      description: `Perform real-time verification query for ${serviceType}.`,
      icon: "ShieldCheck",
      category: "IDENTITY",
      fee: 500,
      providerName: "SmartLink Federal Gateway",
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
    additionalFields?: Record<string, string>;
    onProgressUpdate?: (step: VerificationProgressStep) => void;
  }): Promise<{
    success: boolean;
    result?: StandardizedVerificationResult;
    errorState?: VerificationErrorState;
  }> {
    const { userId, serviceType, primaryInput, additionalFields = {}, onProgressUpdate } = params;

    const config = this.getServiceConfig(serviceType);

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

    // Step 3: Check Wallet Balance
    const walletRes = await WalletService.validateWallet(userId, config.fee);
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

    // Step 4: Call Backend API Gateway
    try {
      const startTime = Date.now();
      const response = await fetch("/api/verify/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          service: serviceType,
          targetId: validation.formattedValue || primaryInput.trim(),
          extraFields: additionalFields,
          fee: config.fee,
        }),
      });

      onProgressUpdate?.(VERIFICATION_PROGRESS_STEPS[4]);

      const data = await response.json();
      const clientCalculatedTime = Date.now() - startTime;

      if (!response.ok || data.error) {
        return {
          success: false,
          errorState: {
            code: data.errorCode || "SERVER_ERROR",
            message: data.error || "Verification request rejected by provider server.",
            friendlyMessage: data.friendlyMessage || "Verification Failed",
            details: data.details || data.error,
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
        fee: config.fee,
        verifiedId: primaryInput,
        maskedId: VerificationValidator.maskID(primaryInput),
        userId,
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
