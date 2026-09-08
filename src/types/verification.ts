/**
 * SmartLink Central Verification Engine Types
 */

export type VerificationType =
  | "NIN"
  | "BVN"
  | "PHONE"
  | "EMAIL"
  | "CAC"
  | "TIN"
  | "DRIVER_LICENSE"
  | "PASSPORT"
  | "VOTER_CARD"
  | string;

export type VerificationStatus = "SUCCESS" | "FAILED" | "PENDING" | "REVERSED";

export type VerificationErrorCode =
  | "INVALID_INPUT"
  | "NETWORK_ERROR"
  | "PROVIDER_OFFLINE"
  | "TIMEOUT"
  | "AUTH_ERROR"
  | "WALLET_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface VerificationServiceConfig {
  id: VerificationType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: "IDENTITY" | "CORPORATE" | "TAX" | "CREDENTIAL";
  fee: number;
  providerName: string;
  primaryInputLabel: string;
  primaryInputPlaceholder: string;
  primaryInputName: string;
  primaryInputHelp: string;
  inputType: "text" | "number" | "email";
  additionalFields?: {
    name: string;
    label: string;
    type: "text" | "number" | "select" | "date" | "email";
    placeholder: string;
    required?: boolean;
    options?: string[];
  }[];
}

export interface VerificationResponseData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  stateOfOrigin?: string;
  lga?: string;
  photoUrl?: string;

  // Identity specific
  nin?: string;
  bvn?: string;

  // Corporate & Tax specific
  rcNumber?: string;
  companyName?: string;
  registrationDate?: string;
  companyStatus?: string;
  companyType?: string;
  tin?: string;
  taxOffice?: string;

  // Licensing & Credentials
  licenseNumber?: string;
  expiryDate?: string;
  issueDate?: string;
  vin?: string; // Voter Identification Number
  passportNumber?: string;

  // Security / verification flags
  isVerified: boolean;
  verificationsPassed?: string[];
  rawFields?: Record<string, any>;
}

export interface StandardizedVerificationResult {
  status: VerificationStatus;
  reference: string;
  message: string;
  data: VerificationResponseData | null;
  timestamp: string;
  providerName: string;
  responseTime: number; // in milliseconds
  receiptNumber: string;
  service: VerificationType;
  serviceTitle: string;
  fee: number;
  verifiedId: string;
  maskedId: string;
  signedQrContent?: string;
  userId?: string;
}

export interface VerificationHistoryItem {
  id: string;
  userId: string;
  userEmail?: string;
  service: VerificationType;
  serviceTitle: string;
  providerName: string;
  reference: string;
  receiptNumber: string;
  verifiedId: string;
  maskedId: string;
  status: VerificationStatus;
  fee: number;
  responseTime: number;
  createdAt: string;
  signedQrContent?: string;
  data?: VerificationResponseData;
}

export interface VerificationProgressStep {
  id: number;
  label: string; // e.g., "Checking Wallet...", "Connecting Securely...", "Sending Request...", "Waiting for Provider...", "Receiving Data...", "Generating Receipt...", "Almost Done..."
  progress: number; // 0 - 100
}

export interface VerificationErrorState {
  code: VerificationErrorCode;
  message: string;
  friendlyMessage: string;
  details?: string;
}

export type SlipFormatType =
  | "NIN_STANDARD" // Standard NIN Slip (NINS)
  | "NIN_REGULAR" // Regular NIN Slip
  | "NIN_PREMIUM_GREEN" // Digital NIN Slip (Green Guilloche Security Pattern Card)
  | "NIN_PREMIUM_WHITE" // Standard Premium NIN Slip (White Wallet Card)
  | "NIN_THERMAL" // POS Terminal Monochrome Mini Slip
  | "NIN_BASIC_LOOKUP" // Text / Raw Demographics Only (No Watermarked Slip)
  | "BVN_STANDARD" // Standard BVN Verification Slip
  | "BVN_PREMIUM_CARD" // Premium BVN Identity Card
  | "BVN_BASIC_LOOKUP" // Basic BVN Text Lookup
  | "BVN_THERMAL" // POS Terminal BVN Receipt
  | "CAC_CERTIFICATE" // Official CAC Certificate & Status Slip
  | "PHONE_KYC_DOSSIER"; // Phone Telco Dossier & Linked NIN Slip

export interface GeneratedSlipRecord {
  id: string;
  slipId: string;
  userId: string;
  userEmail?: string;
  serviceType: string;
  formatType: SlipFormatType;
  identificationNumber: string;
  maskedId: string;
  trackingId?: string;
  signedQrContent?: string;
  qrVerificationToken: string;
  qrVerificationUrl: string;
  holderData: {
    fullName: string;
    surname?: string;
    firstName?: string;
    middleName?: string;
    gender?: string;
    dateOfBirth?: string;
    issueDate?: string;
    address?: string;
    stateOfOrigin?: string;
    lga?: string;
    phoneNumber?: string;
    email?: string;
    photoUrl?: string;
    trackingId?: string;
    nin?: string;
    bvn?: string;
  };
  reference: string;
  providerName: string;
  createdAt: string;
  status: "ACTIVE" | "REVOKED";
  metadata?: Record<string, any>;
}

export interface SlipValidationPublicResult {
  isValid: boolean;
  token: string;
  slipId: string;
  serviceType: string;
  formatType: SlipFormatType;
  issuedAt: string;
  maskedIdentification: string;
  holderName: string;
  gender?: string;
  stateOfOrigin?: string;
  lga?: string;
  verifiedBy: string;
  verificationCount: number;
}

