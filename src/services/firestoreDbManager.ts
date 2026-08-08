/**
 * SmartLink Firestore Database Manager
 * Enterprise Database Layer for Phase 1 Part 5
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { StandardBaseDocument } from "../types/database.js";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false,
      tenantId: currentUser?.tenantId || null,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email
        })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Permission/Runtime Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Creates standardized document metadata fields
 */
export function createStandardDocumentMetadata(
  id: string,
  createdBy?: string,
  status: string = "ACTIVE"
): StandardBaseDocument {
  const nowISO = new Date().toISOString();
  return {
    id,
    createdAt: nowISO,
    updatedAt: nowISO,
    createdBy: createdBy || auth.currentUser?.uid || "SYSTEM",
    lastModifiedBy: createdBy || auth.currentUser?.uid || "SYSTEM",
    status,
    version: 1,
    isDeleted: false
  };
}

/**
 * Generic Firestore Repository Helper
 */
export class FirestoreRepository<T extends StandardBaseDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = snap.data() as T;
      if (data.isDeleted) return null; // Respect Soft Delete
      return { ...data, id: snap.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  async create(id: string, data: Omit<T, keyof StandardBaseDocument> & Partial<StandardBaseDocument>): Promise<T> {
    try {
      const metadata = createStandardDocumentMetadata(id, data.createdBy, data.status || "ACTIVE");
      const fullDoc = {
        ...data,
        ...metadata,
        id
      } as unknown as T;

      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, fullDoc);
      return fullDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${this.collectionName}/${id}`);
    }
  }

  async update(id: string, updates: Partial<T>, modifiedBy?: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const patchData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: modifiedBy || auth.currentUser?.uid || "SYSTEM"
      };
      await updateDoc(docRef, patchData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: deletedBy || auth.currentUser?.uid || "SYSTEM",
        status: "DELETED",
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  async listByUser(userId: string, limitCount = 50): Promise<T[]> {
    try {
      const colRef = collection(db, this.collectionName);
      const q = query(
        colRef,
        where("userId", "==", userId),
        where("isDeleted", "!=", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as T));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.collectionName);
    }
  }
}

// Instantiate database repositories for Phase 1 Part 5 collections
export const UsersRepo = new FirestoreRepository<any>("users");
export const WalletsRepo = new FirestoreRepository<any>("wallets");
export const TransactionsRepo = new FirestoreRepository<any>("transactions");
export const VerificationsRepo = new FirestoreRepository<any>("verifications");
export const ReceiptsRepo = new FirestoreRepository<any>("receipts");
export const NotificationsRepo = new FirestoreRepository<any>("notifications");
export const AuditLogsRepo = new FirestoreRepository<any>("auditLogs");
export const AdminsRepo = new FirestoreRepository<any>("admins");
export const RolesRepo = new FirestoreRepository<any>("roles");
export const PermissionsRepo = new FirestoreRepository<any>("permissions");
export const ApiProvidersRepo = new FirestoreRepository<any>("apiProviders");
export const ProviderLogsRepo = new FirestoreRepository<any>("providerLogs");
export const ServicePricingRepo = new FirestoreRepository<any>("servicePricing");
export const ServiceCategoriesRepo = new FirestoreRepository<any>("serviceCategories");
export const SupportTicketsRepo = new FirestoreRepository<any>("supportTickets");
export const WalletLogsRepo = new FirestoreRepository<any>("walletLogs");
export const WalletFundingRepo = new FirestoreRepository<any>("walletFunding");
export const WithdrawalsRepo = new FirestoreRepository<any>("withdrawals");
export const SystemSettingsRepo = new FirestoreRepository<any>("systemSettings");
export const UserSettingsRepo = new FirestoreRepository<any>("userSettings");
export const ActivityLogsRepo = new FirestoreRepository<any>("activityLogs");
export const LoginHistoryRepo = new FirestoreRepository<any>("loginHistory");
export const VerificationHistoryRepo = new FirestoreRepository<any>("verificationHistory");
