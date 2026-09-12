/**
 * Legacy Firestore store bridge — replaced by Turso & Supabase.
 * Retained with no-op functions for smooth zero-downtime execution.
 */

export async function loadFirestoreDb(): Promise<any> {
  return null;
}

export async function syncDbToFirestore(db: any): Promise<void> {
  // No-op: Database sync managed via Turso
}

export async function saveDocToFirestore(collectionName: string, docId: string, data: any): Promise<void> {
  // No-op: Document storage managed via Turso / Supabase
}
