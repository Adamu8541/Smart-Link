/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LegalAcceptanceType =
  | "REGISTRATION_SIGNUP"
  | "WALLET_ACTIVATION"
  | "WALLET_FUNDING"
  | "KYC_VERIFICATION"
  | "PAYMENT_CHECKOUT"
  | "POLICY_UPDATE_REACCEPTANCE"
  | "ACCOUNT_DASHBOARD_REVIEW";

export type LegalWorkflowType =
  | "NEW_USER_REGISTRATION"
  | "WALLET_FIRST_FUNDING"
  | "WALLET_ACTIVATION"
  | "IDENTITY_NIN_LOOKUP"
  | "IDENTITY_BVN_LOOKUP"
  | "IDENTITY_CAC_APPLICATION"
  | "IDENTITY_TIN_LOOKUP"
  | "IDENTITY_BANK_VERIFICATION"
  | "CHECKOUT_PAYMENT"
  | "POLICY_UPDATE_GATE"
  | "MANUAL_AGREEMENT_REVIEW";

export interface LegalAcceptanceRecord {
  id: string;
  userId: string;
  userEmail: string;
  documentId: string;
  documentTitle: string;
  documentVersion: string;
  acceptedAt: string; // ISO-8601 server/client timestamp
  acceptanceType: LegalAcceptanceType;
  workflow: LegalWorkflowType;
  ipAddress?: string;
  userAgent?: string;
  platform?: string;
  metadata?: Record<string, any>;
}

export interface LegalPolicyVersion {
  id: string;
  documentId: string;
  documentName: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  requiresReAcceptance: boolean;
  minimumRequiredVersion: string;
  category: "LEGAL" | "PAYMENTS_WALLET" | "DATA_VERIFICATION" | "SECURITY_USE";
  summary: string;
}

export interface MarketingConsentSettings {
  userId: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  updatedAt: string;
}

export interface LegalComplianceStats {
  totalAcceptances: number;
  uniqueUsersAccepted: number;
  acceptancesByDocument: Record<string, number>;
  acceptancesByVersion: Record<string, Record<string, number>>;
  acceptancesByWorkflow: Record<string, number>;
  recentAcceptances: LegalAcceptanceRecord[];
}
