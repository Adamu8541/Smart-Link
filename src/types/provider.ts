/**
 * SmartLink API Provider Manager Types
 */

export type PaymentProviderStatus = "Active" | "Inactive" | "Draft";

export interface PaymentProvider {
  id: string;
  name: string; // Provider Name (Required)
  secretKey: string; // Secret Key (Required)
  webhookUrl: string; // Webhook URL (Required)
  baseUrl?: string; // Base API URL (Optional)
  publicKey?: string; // Public Key (Optional)
  merchantId?: string; // Merchant ID (Optional)
  clientId?: string; // Client ID (Optional)
  clientSecret?: string; // Client Secret (Optional)
  encryptionKey?: string; // Encryption Key (Optional)
  webhookSecret?: string; // Webhook Secret (Optional)
  callbackUrl?: string; // Callback URL (Optional)
  status: PaymentProviderStatus; // Active | Inactive | Draft
  connectionStatus?: "Connected" | "Disconnected" | "Warning" | "Untested";
  lastTestedAt?: string;
  lastTestResult?: string;
  lastTestError?: string;
  notes?: string; // Notes (Optional)
  createdAt: string;
  updatedAt: string;
}

export type ProviderHealthStatus =
  | "ONLINE"
  | "OFFLINE"
  | "SLOW_RESPONSE"
  | "TIMEOUT"
  | "MAINTENANCE";

export type ProviderCategory =
  | "WALLET_ENGINE"
  | "PAYMENT_GATEWAY"
  | "IDENTITY_API"
  | "TELECOM_VTU"
  | "UTILITY_BILL"
  | "EDUCATION_PIN"
  | "IDENTITY"
  | "PAYMENT"
  | "TELCO"
  | "CORPORATE"
  | "TAX"
  | "CREDENTIAL"
  | "SMS"
  | "EMAIL";

export type AuthMethod =
  | "API_KEY"
  | "BEARER_TOKEN"
  | "BASIC"
  | "OAUTH2"
  | "SECRET_KEY"
  | "HMAC_SHA256"
  | "RSA_KEYPAIR";

export type ProviderEnvironment = "DEVELOPMENT" | "SANDBOX" | "TEST" | "PRODUCTION";

export interface APIProviderConfig {
  id: string;
  name: string;
  category: ProviderCategory;
  providerType?: string;
  description?: string;
  logoUrl?: string;

  // API Credentials & Gateway Config
  baseUrl: string;
  apiVersion?: string;
  authMethod?: AuthMethod;
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  privateKey?: string;
  merchantId?: string;
  clientId?: string;
  clientSecret?: string;
  businessId?: string;

  // Webhook & URLs
  webhookUrl?: string;
  callbackUrl?: string;
  redirectUrl?: string;
  successUrl?: string;
  failedUrl?: string;
  cancelUrl?: string;
  webhookSecret?: string;
  webhookSignatureMethod?: "HMAC-SHA512" | "HMAC-SHA256" | "MD5_OF_SECRET" | "NONE";
  webhookSignatureHeaderName?: string;
  webhookSigningSecret?: string;

  // Security Keys
  encryptionKey?: string;
  signatureKey?: string;
  rsaPublicKey?: string;
  rsaPrivateKey?: string;
  hmacSecret?: string;

  // Feature Toggles
  supportsWalletFunding?: boolean;
  supportsBankTransfer?: boolean;
  supportsCardPayment?: boolean;
  supportsVirtualAccount?: boolean;
  supportsPaymentLink?: boolean;
  supportsPayout?: boolean;
  supportsRefund?: boolean;
  supportsTxVerification?: boolean;

  // Operational & Health Metrics
  timeout: number; // in milliseconds
  retryAttempts: number;
  healthStatus: ProviderHealthStatus;
  priority: number; // 1 = highest priority
  environment: ProviderEnvironment;
  enabled: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  lastHealthCheck?: string;
  avgResponseTime: number; // in milliseconds
  successRate: number; // 0 - 100 percentage
  createdAt?: string;
  updatedAt?: string;
}

export interface StandardProviderRequest {
  transactionId: string;
  userId: string;
  serviceName: string;
  requestTimestamp: string;
  requestData: Record<string, any>;
  providerName: string;
}

export interface StandardProviderResponse {
  success: boolean;
  statusCode: number;
  message: string;
  provider: string;
  providerReference: string;
  smartlinkReference: string;
  data: Record<string, any>;
  timestamp: string;
  responseTime: number;
  error?: string;
}

export interface ProviderAuditLog {
  id: string;
  providerName: string;
  service: string;
  requestTime: string;
  responseTime: number;
  status: "SUCCESS" | "FAILED" | "RETRY" | "FALLBACK";
  transactionId: string;
  userId: string;
  statusCode: number;
  errorMessage?: string;
}

export type WebhookStatus = "Enabled" | "Disabled";

export interface WebhookItem {
  id: string;
  name: string; // Webhook Name (Required)
  provider: string; // Provider (Dropdown / text)
  eventType: string; // Event Type (Required)
  url: string; // Webhook URL (Required)
  secretToken?: string; // Secret Token
  signatureHeader?: string; // Signature Header
  httpMethod?: "POST" | "PUT" | "GET"; // HTTP Method
  retryCount?: number; // Retry Count
  retryInterval?: number; // Retry Interval
  status: WebhookStatus; // Enabled | Disabled
  notes?: string; // Notes
  lastExecutedAt?: string; // Last Executed
  lastTestedAt?: string; // Last Tested
  lastResult?: "Success" | "Failed" | "Timeout" | "Unauthorized" | "Invalid URL"; // Last Result
  lastStatusCode?: number; // Last HTTP Status Code
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLogItem {
  id: string;
  webhookId: string;
  webhookName: string;
  provider: string;
  eventType: string;
  url: string;
  resultStatus: "Success" | "Failed" | "Timeout" | "Unauthorized" | "Invalid URL";
  statusCode?: number;
  responseTimeMs: number;
  responseBody?: string;
  testedBy: string;
  timestamp: string;
}

