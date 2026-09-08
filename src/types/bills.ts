/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BillCategoryType =
  | "AIRTIME"
  | "DATA"
  | "ELECTRICITY"
  | "CABLE_TV"
  | "INTERNET"
  | "EDUCATION"
  | "BETTING"
  | "INSURANCE"
  | "WATER"
  | "WASTE"
  | "GOVERNMENT"
  | "FUTURE_SERVICES";

export interface BillCategory {
  id: BillCategoryType;
  name: string;
  description: string;
  icon: string;
  estimatedProcessingTime: string;
  providerStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  requiresValidation: boolean;
  fields: BillFormField[];
}

export interface BillFormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "phone" | "plan_select";
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string; price?: number; extra?: any }[];
  validationRegex?: string;
  helpText?: string;
}

export interface BillProvider {
  id: string;
  code: string;
  name: string;
  category: BillCategoryType;
  logo?: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  supportedMeterTypes?: ("PREPAID" | "POSTPAID")[];
}

export interface BillPlan {
  id: string;
  providerCode: string;
  planName: string;
  dataVolume?: string;
  validity?: string;
  amount: number;
  category: BillCategoryType;
  description?: string;
}

export interface CustomerValidationRequest {
  category: BillCategoryType;
  providerCode: string;
  customerId: string; // Phone number, Meter Number, IUC number, Student ID, User ID
  meterType?: "PREPAID" | "POSTPAID";
}

export interface CustomerValidationResponse {
  valid: boolean;
  customerName?: string;
  customerAddress?: string;
  accountStatus?: string;
  currentPlan?: string;
  outstandingBalance?: number;
  minimumAmount?: number;
  errorMessage?: string;
}

export interface BillPaymentRequest {
  userId: string;
  category: BillCategoryType;
  providerCode: string;
  providerName: string;
  customerId: string;
  customerName?: string;
  amount: number;
  charge?: number;
  meterType?: "PREPAID" | "POSTPAID";
  planId?: string;
  planName?: string;
  phoneNumber?: string;
  network?: string;
  institutionId?: string;
  paymentType?: string;
}

export interface BillPaymentResponse {
  success: boolean;
  transactionId: string;
  smartlinkReference: string;
  providerReference: string;
  receiptId: string;
  serviceName: string;
  category: BillCategoryType;
  providerName: string;
  customerId: string;
  customerName?: string;
  amountPaid: number;
  charge: number;
  totalDeducted: number;
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  token?: string; // Electricity token e.g. 1234-5678-9012-3456
  units?: string; // Electricity kWh units e.g. 45.2 kWh
  pins?: { serial: string; pin: string }[]; // Exam PINs
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  errorMessage?: string;
  errorCode?: string;
}

export interface BillAdminStats {
  totalPayments: number;
  totalVolume: number;
  successRate: number;
  failureRate: number;
  avgProcessingTimeMs: number;
  revenueByCategory: { [category: string]: number };
  revenueByProvider: { [provider: string]: number };
  providerPerformance: {
    provider: string;
    total: number;
    success: number;
    failed: number;
    avgTime: number;
  }[];
}
