/**
 * SmartLink Fintech Enterprise Firestore Database Schemas & Collection Models
 * Phase 1 Part 5 Architecture
 */

import { UserRole } from "../types";

export interface StandardBaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  status: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// 1. User Document
export interface UserDocument extends StandardBaseDocument {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  emailVerified: boolean;
  accountStatus: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  userRole: UserRole;
  walletId: string;
  referralCode?: string;
  referredBy?: string;
  lastLogin?: string;
}

// 2. Wallet Document
export interface WalletDocument extends StandardBaseDocument {
  walletId: string;
  userId: string;
  availableBalance: number; // in NGN
  heldBalance: number; // in NGN
  currency: string; // e.g., "NGN"
  walletStatus: "ACTIVE" | "FROZEN" | "RESTRICTED";
  totalCredits: number;
  totalDebits: number;
  lastUpdated: string;
}

export type TransactionStatusType =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED"
  | "CANCELLED"
  | "REVERSED"
  | "REFUNDED"
  | "EXPIRED";

// 3. Transaction Document
export interface TransactionDocument extends StandardBaseDocument {
  transactionId: string;
  userId: string;
  walletId: string;
  service: string; // e.g. "VTU_AIRTIME", "NIN_SLIP_PREMIUM"
  amount: number;
  charge: number;
  provider: string; // e.g. "Prembly", "Monnify"
  providerReference: string;
  smartlinkReference: string;
  description: string;
  receiptId?: string;
  status: TransactionStatusType;
  paymentMethod?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  recipient?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

// 4. Verification Document
export interface VerificationDocument extends StandardBaseDocument {
  verificationId: string;
  userId: string;
  serviceType: string;
  provider: string;
  responseTime: number; // ms
  amountCharged: number;
  transactionId: string;
  receiptId: string;
  timestamp: string;
  responseDataMinified?: any;
}

// 5. Receipt Document
export interface ReceiptDocument extends StandardBaseDocument {
  receiptId: string;
  userId: string;
  transactionId: string;
  title: string;
  amount: number;
  charge?: number;
  currency: string;
  recipient: string;
  providerRef: string;
  smartlinkRef: string;
  userName?: string;
  userEmail?: string;
  serviceName?: string;
  paymentMethod?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  status: TransactionStatusType;
  details: Record<string, any>;
  issueTimestamp: string;
  qrCodeData?: string;
}

// 6. Notification Document
export type NotificationType =
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "VERIFICATION_SUCCESSFUL"
  | "VERIFICATION_FAILED"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "EMAIL_VERIFIED"
  | "PROFILE_UPDATED"
  | "REFUND_COMPLETED"
  | "TRANSACTION_COMPLETED"
  | "TRANSACTION_FAILED"
  | "ADMIN_ANNOUNCEMENT"
  | "MAINTENANCE_NOTICE"
  | "SECURITY_ALERT"
  | "NEW_FEATURE_ANNOUNCEMENT";

export interface NotificationDocument extends StandardBaseDocument {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type?: NotificationType | string;
  category?: "TRANSACTION" | "VERIFICATION" | "SECURITY" | "SYSTEM" | "ACCOUNT";
  reference?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

// 7. AuditLog Document
export interface AuditLogDocument extends StandardBaseDocument {
  auditId: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  collectionName?: string;
  documentId?: string;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
}

// 8. Admin Document
export interface AdminDocument extends StandardBaseDocument {
  adminUid: string;
  email: string;
  role: UserRole;
  permissions: string[];
  assignedBy: string;
  active: boolean;
}

// 9. Role Document
export interface RoleDocument extends StandardBaseDocument {
  roleId: string;
  roleName: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
}

// 10. Permission Document
export interface PermissionDocument extends StandardBaseDocument {
  permissionId: string;
  name: string;
  category: string;
  description: string;
}

// 11. ApiProvider Document
export interface ApiProviderDocument extends StandardBaseDocument {
  providerId: string;
  name: string;
  category: "IDENTITY" | "CAC" | "VTU" | "BILL_PAYMENT" | "EXAM_PIN";
  baseUrl: string;
  apiVersion: string;
  authMethod: string;
  enabled: boolean;
  priority: number;
  healthStatus: "ONLINE" | "DEGRADED" | "OFFLINE" | "SLOW_RESPONSE";
  avgResponseTime: number;
  successRate: number;
}

// 12. ProviderLog Document
export interface ProviderLogDocument extends StandardBaseDocument {
  logId: string;
  providerName: string;
  service: string;
  requestTime: string;
  responseTime: number;
  statusCode: number;
  transactionId: string;
  userId: string;
}

// 13. ServicePricing Document
export interface ServicePricingDocument extends StandardBaseDocument {
  pricingId: string;
  category: string;
  rates: Record<string, number>;
  dataPlans?: any[];
  airtimeDiscountPercent?: Record<string, number>;
}

// 14. ServiceCategory Document
export interface ServiceCategoryDocument extends StandardBaseDocument {
  categoryId: string;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
}

// 15. SupportTicket Document
export interface SupportTicketDocument extends StandardBaseDocument {
  ticketId: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  resolutionNotes?: string;
}

// 16. WalletLog Document
export interface WalletLogDocument extends StandardBaseDocument {
  logId: string;
  walletId: string;
  userId: string;
  changeType: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE";
  amount: number;
  previousBalance: number;
  newBalance: number;
  reference: string;
}

// 17. WalletFunding Document
export interface WalletFundingDocument extends StandardBaseDocument {
  fundingId: string;
  userId: string;
  walletId: string;
  amount: number;
  gateway: "OPAY" | "MONNIFY" | "PAYSTACK" | "MANUAL_BANK_TRANSFER";
  gatewayReference: string;
  smartlinkReference: string;
}

// 18. Withdrawal Document
export interface WithdrawalDocument extends StandardBaseDocument {
  withdrawalId: string;
  userId: string;
  walletId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  processedBy?: string;
}

// 19. SystemSettings Document
export interface SystemSettingsDocument extends StandardBaseDocument {
  settingId: string;
  siteName: string;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  requireEmailVerification: boolean;
}

// 20. UserSettings Document
export interface UserSettingsDocument extends StandardBaseDocument {
  userId: string;
  darkMode: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorAuthEnabled: boolean;
}

// 20. Notification & User Preferences Document
export interface NotificationSettingsDocument extends StandardBaseDocument {
  userId: string;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  securityAlerts: boolean;
  marketingMessages: boolean;
  systemAnnouncements: boolean;
}

// 21. ActivityLog Document
export interface ActivityLogDocument extends StandardBaseDocument {
  activityId: string;
  userId: string;
  activityType: string; // LOGIN, LOGOUT, SERVICE_USED, WALLET_ACTIVITY, PROFILE_UPDATE, PASSWORD_CHANGE, VERIFICATION_REQUEST, RECEIPT_DOWNLOAD, SUPPORT_TICKET, SECURITY_EVENT
  action?: string;
  description: string;
  date?: string;
  time?: string;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  metadata?: Record<string, any>;
}

// 21b. Admin Activity Log Document
export interface AdminActivityLogDocument extends StandardBaseDocument {
  logId: string;
  adminUid: string;
  adminEmail: string;
  action: string; // USER_CREATED, USER_SUSPENDED, ROLE_CHANGED, WALLET_ADJUSTED, PROVIDER_UPDATED, SYSTEM_SETTINGS_CHANGED, SERVICE_PRICING_CHANGED, ANNOUNCEMENT_SENT
  details: string;
  targetUserId?: string;
  ipAddress?: string;
  timestamp: string;
}

// 22. LoginHistory Document
export interface LoginHistoryDocument extends StandardBaseDocument {
  historyId: string;
  userId: string;
  email: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  browser: string;
  os: string;
  deviceType: string;
  failureReason?: string;
}

// 23. VerificationHistory Document
export interface VerificationHistoryDocument extends StandardBaseDocument {
  historyId: string;
  userId: string;
  verificationType: string;
  referenceInput: string;
  providerUsed: string;
  cost: number;
  verifiedAt: string;
}
