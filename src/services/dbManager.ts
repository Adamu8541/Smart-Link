/**
 * SmartLink Database Manager
 * Standardized Database Repository Helper for Client & Server.
 */

import { StandardBaseDocument } from "../types/database";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

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
    createdBy: createdBy || "SYSTEM",
    lastModifiedBy: createdBy || "SYSTEM",
    status,
    version: 1,
    isDeleted: false,
  };
}

/**
 * Generic Repository Helper
 */
export class Repository<T extends StandardBaseDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    try {
      const res = await fetch(`/api/db/${this.collectionName}/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.item || null;
    } catch {
      return null;
    }
  }

  async create(id: string, data: Omit<T, keyof StandardBaseDocument> & Partial<StandardBaseDocument>): Promise<T> {
    const metadata = createStandardDocumentMetadata(id, data.createdBy, data.status || "ACTIVE");
    const fullDoc = { ...data, ...metadata, id } as unknown as T;
    try {
      await fetch(`/api/db/${this.collectionName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullDoc),
      });
    } catch {}
    return fullDoc;
  }

  async update(id: string, updates: Partial<T>, modifiedBy?: string): Promise<void> {
    try {
      await fetch(`/api/db/${this.collectionName}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, lastModifiedBy: modifiedBy || "SYSTEM" }),
      });
    } catch {}
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    return this.update(id, { isDeleted: true, status: "DELETED" } as Partial<T>, deletedBy);
  }
}

// Backwards compatibility alias
export const FirestoreRepository = Repository;
export const handleFirestoreError = (err: unknown) => {
  console.error("[DbManager Error]:", err);
  throw err;
};
