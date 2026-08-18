/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  AGENT_VENDOR = "AGENT_VENDOR",
  STAFF = "STAFF",
  SUPPORT_AGENT = "SUPPORT_AGENT",
  FINANCE_OFFICER = "FINANCE_OFFICER",
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  API_CLIENT = "API_CLIENT"
}

export enum SubAdminPermission {
  MANAGE_USERS = "manage_users",
  MANAGE_PRICES = "manage_prices",
  MANAGE_TRANSACTIONS = "manage_transactions",
  MANAGE_CAC = "manage_cac",
  MANAGE_SUPPORT = "manage_support",
  MANAGE_SERVICES = "manage_services",
  MANAGE_THEME = "manage_theme",
  MANAGE_SUBADMINS = "manage_subadmins"
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  firstName?: string;
  surname?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole;
  walletBalance: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
  isVerified?: boolean;
  permissions?: SubAdminPermission[];
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "BLOCKED" | "FROZEN";
  lastLogin?: string;
}

export interface SiteSettings {
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  themePreset: "indigo" | "emerald" | "navy" | "gold" | "coral";
  announcementText: string;
  showAnnouncement: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  supportPhone: string;
  customCss?: string;
}

export interface DataPlan {
  id: string;
  network: "MTN" | "GLO" | "AIRTEL" | "9MOBILE";
  type: "SME" | "GIFTING" | "CORPORATE";
  planName: string;
  validity: string;
  customerPrice: number;
  agentPrice: number;
  isActive: boolean;
}

export interface PriceMatrix {
  identityRates?: {
    ninFee: number;
    bvnFee: number;
    ipeFee: number;
    phoneToNinFee: number;
  };
  cacRates?: {
    businessNameFee: number;
    companyFee: number;
    ngoFee: number;
    reservationFee: number;
  };
  dataPlans: DataPlan[];
  airtimeDiscountPercent: {
    MTN: number;
    GLO: number;
    AIRTEL: number;
    "9MOBILE": number;
  };
  examPrices: {
    WAEC: number;
    NECO: number;
    JAMB: number;
  };
  utilityProcessingFee: number;
  cableCharges: {
    DSTV: number;
    GOTV: number;
    STARTIMES: number;
  };
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REVERSED = "REVERSED"
}

export enum WalletStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  FROZEN = "FROZEN"
}

export interface Wallet {
  userId: string;
  currentBalance: number;
  heldBalance: number;
  totalCredits: number;
  totalDebits: number;
  walletStatus: WalletStatus | "ACTIVE" | "SUSPENDED" | "FROZEN";
  currency: "NGN" | string;
  lastUpdated: string;
  createdAt: string;
}

export type WalletErrorCode =
  | "INSUFFICIENT_BALANCE"
  | "WALLET_NOT_FOUND"
  | "WALLET_SUSPENDED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface WalletValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: WalletErrorCode;
  wallet?: Wallet;
  availableBalance?: number;
}

export interface WalletTransaction {
  transactionId: string;
  reference: string;
  userId: string;
  serviceName: string;
  amount: number;
  walletBalanceBefore: number;
  walletBalanceAfter: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REVERSED";
  provider: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  fee?: number;
  type?: string;
  recipientDetails?: string;
  userEmail?: string;
}

export enum TransactionType {
  WALLET_FUNDING = "WALLET_FUNDING",
  NIN_VERIFICATION = "NIN_VERIFICATION",
  NIN_REGISTRATION = "NIN_REGISTRATION",
  BVN_VERIFICATION = "BVN_VERIFICATION",
  CAC_REGISTRATION = "CAC_REGISTRATION",
  WAEC_SCRATCH_CARD = "WAEC_SCRATCH_CARD",
  JAMB_EPIN = "JAMB_EPIN",
  NECO_TOKEN = "NECO_TOKEN",
  VTU_AIRTIME = "VTU_AIRTIME",
  VTU_DATA = "VTU_DATA",
  UTILITY_ELECTRICITY = "UTILITY_ELECTRICITY",
  CABLE_TV = "CABLE_TV",
  VENDOR_PAYOUT = "VENDOR_PAYOUT",
  COMMISSION_EARNING = "COMMISSION_EARNING"
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  reference: string;
  recipientDetails?: string;
  description: string;
  createdAt: string;
  commissionEarned?: number;
  gateway?: string;
}

export interface CACApplication {
  id: string;
  userId: string;
  type: "BUSINESS_NAME" | "COMPANY" | "NGO" | "TRUSTEE";
  proposedNames: string[];
  approvedName?: string;
  businessType: string;
  objective: string;
  address: string;
  proprietors: { name: string; email: string; phone: string; address: string }[];
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  comments?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  reply?: string;
  repliedBy?: string;
  createdAt: string;
}

export interface VendorService {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  category: "IDENTITY" | "CAC" | "EDUCATION" | "VTU" | "ICT" | "AI_AUTOMATION";
  price: number;
  commissionPercent: number; // Commission paid to Smart Link (e.g. 10%)
  deliveryTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface OCRAnalysisResult {
  extractedText: string;
  documentType: string;
  confidence: number;
  extractedFields: { [key: string]: string };
}

export interface AIQuote {
  id: string;
  clientName: string;
  services: { desc: string; qty: number; unitPrice: number }[];
  total: number;
  tax: number;
  grandTotal: number;
  validUntil: string;
  notes: string;
  createdAt: string;
}

export interface AIInvoice {
  id: string;
  invoiceNo: string;
  clientName: string;
  clientEmail: string;
  items: { desc: string; qty: number; unitPrice: number }[];
  subtotal: number;
  vat: number;
  total: number;
  dueDate: string;
  status: "PAID" | "UNPAID";
  createdAt: string;
}

export interface ApiHeaderItem {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface ApiParamItem {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface ApiRequestConfig {
  id: string;
  provider: string;
  requestName: string;
  endpoint: string;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  authType: "None" | "API Key" | "Bearer Token" | "Basic Authentication" | "HMAC Signature" | "Custom Header Authentication" | "Custom Auth Method" | string;
  customAuthMethodName?: string;
  contentType: "application/json" | "multipart/form-data" | "application/x-www-form-urlencoded" | "application/xml" | "text/plain" | "Custom" | string;
  acceptHeader?: string;
  authorizationHeader?: string;
  customHeaders: ApiHeaderItem[];
  bodyFormat: "JSON" | "Form Data" | "URL Encoded" | "XML" | "Plain Text" | "Custom Format" | string;
  bodyContent?: string;
  queryParams: ApiParamItem[];
  urlParams: ApiParamItem[];
  timeout: number;
  retryCount: number;
  status: "ENABLED" | "DISABLED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ApiRequestTestLog {
  id: string;
  requestId: string;
  requestName: string;
  provider: string;
  testResult: "Success" | "Failed" | "Unauthorized" | "Timeout";
  httpStatus: number;
  statusText?: string;
  responseTime: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  testedBy: string;
  date: string;
}

export interface ApiResponseMappingConfig {
  id: string;
  provider: string;
  endpoint: string;
  mappingName: string;
  responseStatusPath?: string;
  successValue?: string;
  transactionIdPath?: string;
  transactionRefPath?: string;
  amountPath?: string;
  currencyPath?: string;
  chargesPath?: string;
  walletBalancePath?: string;
  customerNamePath?: string;
  customerEmailPath?: string;
  customerPhonePath?: string;
  accountNumberPath?: string;
  accountNamePath?: string;
  bankNamePath?: string;
  sessionIdPath?: string;
  messagePath?: string;
  errorCodePath?: string;
  errorMessagePath?: string;
  rawJsonPath?: string;
  status: "ENABLED" | "DISABLED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ApiResponseMappingTestLog {
  id: string;
  mappingId?: string;
  mappingName: string;
  provider: string;
  endpoint: string;
  testResult: "SUCCESS" | "PARTIAL" | "FAILED" | "INVALID_JSON";
  testedBy: string;
  date: string;
  time: string;
  sampleInputJson: string;
  parsedOutput?: Record<string, any>;
  missingFields?: string[];
  invalidPaths?: string[];
}


export * from "./types/verification";
export * from "./types/provider";
export * from "./types/auth";
export * from "./types/database";
