/**
 * SmartLink Central API Provider Manager Engine
 * Manages external service providers, request standardization, health checks,
 * automatic failover/switching, retry policies, and audit logging.
 */

import {
  APIProviderConfig,
  StandardProviderRequest,
  StandardProviderResponse,
  ProviderAuditLog,
  ProviderHealthStatus,
  ProviderCategory,
} from "../types/provider";

export const DEFAULT_PROVIDERS: APIProviderConfig[] = [
  {
    id: "prembly",
    name: "Prembly Identity & Verification Gateway",
    category: "IDENTITY",
    baseUrl: "https://api.prembly.com/v1",
    apiVersion: "v1.2",
    authMethod: "API_KEY",
    apiKey: process.env.PREMBLY_API_KEY || "PRM_SEC_KEY_892374829374892",
    secretKey: process.env.PREMBLY_SECRET_KEY || "PRM_SECRET_983749283749",
    publicKey: "PRM_PUB_8923748923",
    webhookSecret: "whsec_prm_9832749823",
    timeout: 5000,
    retryAttempts: 2,
    healthStatus: "ONLINE",
    priority: 1,
    environment: "PRODUCTION",
    enabled: true,
    avgResponseTime: 210,
    successRate: 99.4,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: "verifyme",
    name: "VerifyMe Identity Switch",
    category: "IDENTITY",
    baseUrl: "https://vapi.verifyme.ng/v2",
    apiVersion: "v2.0",
    authMethod: "BEARER_TOKEN",
    apiKey: process.env.VERIFYME_API_KEY || "VM_LIVE_KEY_773829102",
    secretKey: process.env.VERIFYME_SECRET_KEY || "VM_SEC_KEY_1109283",
    publicKey: "VM_PUB_9918237",
    webhookSecret: "whsec_vm_339102",
    timeout: 6000,
    retryAttempts: 2,
    healthStatus: "ONLINE",
    priority: 2,
    environment: "PRODUCTION",
    enabled: true,
    avgResponseTime: 245,
    successRate: 98.8,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: "smile_identity",
    name: "Smile Identity KYC Engine",
    category: "IDENTITY",
    baseUrl: "https://api.smileidentity.com/v1",
    apiVersion: "v1.0",
    authMethod: "OAUTH2",
    apiKey: process.env.SMILE_API_KEY || "SMILE_SEC_8829301923",
    secretKey: process.env.SMILE_SECRET_KEY || "SMILE_SECRET_0029312",
    publicKey: "SMILE_PUB_119283",
    webhookSecret: "whsec_smile_449102",
    timeout: 4500,
    retryAttempts: 2,
    healthStatus: "ONLINE",
    priority: 3,
    environment: "PRODUCTION",
    enabled: true,
    avgResponseTime: 185,
    successRate: 99.1,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: "nimc_gateway",
    name: "NIMC NIMC Direct Federal Gateway",
    category: "IDENTITY",
    baseUrl: "https://gateway.nimc.gov.ng/api",
    apiVersion: "v3.1",
    authMethod: "SECRET_KEY",
    apiKey: process.env.NIMC_API_KEY || "NIMC_FED_KEY_100928347",
    secretKey: process.env.NIMC_SECRET_KEY || "NIMC_FED_SECRET_9938472",
    publicKey: "NIMC_FED_PUB_55483",
    webhookSecret: "whsec_nimc_883920",
    timeout: 7000,
    retryAttempts: 3,
    healthStatus: "ONLINE",
    priority: 1,
    environment: "PRODUCTION",
    enabled: true,
    avgResponseTime: 310,
    successRate: 99.7,
    lastHealthCheck: new Date().toISOString(),
  },
];

export class APIProviderManager {
  /**
   * Helper to mask sensitive keys before exposing to admin UI
   */
  static sanitizeConfig(provider: APIProviderConfig): APIProviderConfig {
    return {
      ...provider,
      apiKey: provider.apiKey ? (provider.apiKey.includes("••••") ? provider.apiKey : `${provider.apiKey.substring(0, 4)}••••••••`) : undefined,
      secretKey: provider.secretKey ? (provider.secretKey.includes("••••") ? provider.secretKey : `${provider.secretKey.substring(0, 4)}••••••••`) : undefined,
      privateKey: provider.privateKey ? (provider.privateKey.includes("••••") ? provider.privateKey : `${provider.privateKey.substring(0, 4)}••••••••`) : undefined,
      clientSecret: provider.clientSecret ? (provider.clientSecret.includes("••••") ? provider.clientSecret : `${provider.clientSecret.substring(0, 4)}••••••••`) : undefined,
      webhookSecret: provider.webhookSecret ? (provider.webhookSecret.includes("••••") ? provider.webhookSecret : `${provider.webhookSecret.substring(0, 4)}••••••••`) : undefined,
      encryptionKey: provider.encryptionKey ? (provider.encryptionKey.includes("••••") ? provider.encryptionKey : `${provider.encryptionKey.substring(0, 4)}••••••••`) : undefined,
      signatureKey: provider.signatureKey ? (provider.signatureKey.includes("••••") ? provider.signatureKey : `${provider.signatureKey.substring(0, 4)}••••••••`) : undefined,
      rsaPrivateKey: provider.rsaPrivateKey ? (provider.rsaPrivateKey.includes("••••") ? provider.rsaPrivateKey : `${provider.rsaPrivateKey.substring(0, 4)}••••••••`) : undefined,
      hmacSecret: provider.hmacSecret ? (provider.hmacSecret.includes("••••") ? provider.hmacSecret : `${provider.hmacSecret.substring(0, 4)}••••••••`) : undefined,
      isActive: provider.isActive !== undefined ? provider.isActive : provider.enabled,
    };
  }

  /**
   * Dynamically resolve active default provider.
   * Automatically switches to another active default provider if active one is disabled.
   */
  static getActiveProvider(db: any, options?: { category?: string; feature?: string }): APIProviderConfig | null {
    if (!db || !db.apiProviders || db.apiProviders.length === 0) return null;

    const enabledProviders = db.apiProviders.filter((p: any) => (p.enabled || p.isActive) && p.healthStatus !== "OFFLINE");

    if (enabledProviders.length === 0) {
      const fallbackAny = db.apiProviders.filter((p: any) => p.enabled || p.isActive);
      if (fallbackAny.length === 0) return null;
      return fallbackAny[0];
    }

    let filtered = enabledProviders;
    if (options?.category && options.category !== "ALL") {
      const catUpper = options.category.toUpperCase();
      const matchCat = filtered.filter((p: any) => 
        (p.category && p.category.toUpperCase() === catUpper) || 
        (p.providerType && p.providerType.toUpperCase() === catUpper)
      );
      if (matchCat.length > 0) filtered = matchCat;
    }

    if (options?.feature) {
      const feat = options.feature;
      const matchFeat = filtered.filter((p: any) => {
        if (feat === "wallet_funding") return p.supportsWalletFunding !== false;
        if (feat === "bank_transfer") return p.supportsBankTransfer !== false;
        if (feat === "card_payment") return p.supportsCardPayment !== false;
        if (feat === "virtual_account") return p.supportsVirtualAccount !== false;
        if (feat === "payout") return p.supportsPayout !== false;
        if (feat === "refund") return p.supportsRefund !== false;
        if (feat === "verification") return p.supportsTxVerification !== false;
        return true;
      });
      if (matchFeat.length > 0) filtered = matchFeat;
    }

    // Try finding default provider first
    const defaultProvider = filtered.find((p: any) => p.isDefault);
    if (defaultProvider) return defaultProvider;

    // Otherwise sort by priority (lowest priority number = highest priority)
    return filtered.sort((a: any, b: any) => (a.priority || 1) - (b.priority || 1))[0];
  }

  /**
   * Standardize Outgoing Request
   */
  static buildStandardRequest(params: {
    userId: string;
    serviceName: string;
    requestData: Record<string, any>;
    providerName: string;
    transactionId?: string;
  }): StandardProviderRequest {
    return {
      transactionId: params.transactionId || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: params.userId,
      serviceName: params.serviceName,
      requestTimestamp: new Date().toISOString(),
      requestData: params.requestData,
      providerName: params.providerName,
    };
  }

  /**
   * Standardize Incoming Response
   */
  static buildStandardResponse(params: {
    success: boolean;
    statusCode: number;
    message: string;
    provider: string;
    providerReference?: string;
    smartlinkReference?: string;
    data?: Record<string, any>;
    responseTime: number;
    error?: string;
  }): StandardProviderResponse {
    const ref = params.smartlinkReference || `SML-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: params.success,
      statusCode: params.statusCode,
      message: params.message,
      provider: params.provider,
      providerReference: params.providerReference || `REF-${ref}`,
      smartlinkReference: ref,
      data: params.data || {},
      timestamp: new Date().toISOString(),
      responseTime: params.responseTime,
      error: params.error,
    };
  }
}
