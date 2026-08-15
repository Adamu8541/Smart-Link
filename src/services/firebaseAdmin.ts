import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export const FIRESTORE_DATABASE_ID = "ai-studio-smartlinkdigital-99537f8d-90f9-4901-bec9-4b6844af0ecc";
export const FIRESTORE_PROJECT_ID = "smart-link-a18e9";

let adminDbInstance: Firestore | null = null;
let databaseInitError: string | null = null;

// Startup check to ensure Client SDK config and Admin SDK config match exactly
export function verifyFirebaseConfigAlignment(): { aligned: boolean; message: string } {
  const clientProjectId = firebaseConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "";
  const clientDatabaseId = firebaseConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_DATABASE_ID || "(default)";

  if (clientProjectId && clientProjectId !== FIRESTORE_PROJECT_ID) {
    const msg = `CRITICAL CONFIG MISMATCH: Client Firebase Project ID (${clientProjectId}) does not match Admin SDK Project ID (${FIRESTORE_PROJECT_ID})`;
    console.error(`[FirebaseConfig] ${msg}`);
    throw new Error(msg);
  }

  if (clientDatabaseId && clientDatabaseId !== "(default)" && clientDatabaseId !== FIRESTORE_DATABASE_ID) {
    const msg = `CRITICAL CONFIG MISMATCH: Client Firestore Database ID (${clientDatabaseId}) does not match Admin SDK Database ID (${FIRESTORE_DATABASE_ID})`;
    console.error(`[FirebaseConfig] ${msg}`);
    throw new Error(msg);
  }

  const okMsg = `[FirebaseConfig] Verified: Client and Admin SDKs are aligned to Project=${FIRESTORE_PROJECT_ID}, Database=${FIRESTORE_DATABASE_ID}`;
  console.log(okMsg);
  return { aligned: true, message: okMsg };
}

// Run verification at startup
try {
  verifyFirebaseConfigAlignment();
} catch (e: any) {
  console.error("[FirebaseConfig] Startup verification failed:", e?.message || e);
}

export function isDatabaseConnected(): boolean {
  try {
    getAdminFirestore();
    return true;
  } catch {
    return false;
  }
}

export function getDatabaseHealth(): {
  status: "CONNECTED" | "DISCONNECTED";
  projectId: string;
  databaseId: string;
  error?: string | null;
} {
  try {
    getAdminFirestore();
    return {
      status: "CONNECTED",
      projectId: FIRESTORE_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "DISCONNECTED",
      projectId: FIRESTORE_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
      error: err?.message || "Database Disconnected: FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid",
    };
  }
}

export function getAdminFirestoreSafe(): Firestore | null {
  try {
    return getAdminFirestore();
  } catch (err: any) {
    console.warn(`[firebaseAdmin] Database disconnected health state: ${err?.message || err}`);
    return null;
  }
}

export function getAdminFirestore(): Firestore {
  if (adminDbInstance) {
    return adminDbInstance;
  }

  if (databaseInitError) {
    throw new Error(databaseInitError);
  }

  try {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey || !serviceAccountKey.trim()) {
        databaseInitError = "Database Disconnected: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not configured";
        throw new Error(databaseInitError);
      }

      let serviceAccount: any;
      if (typeof serviceAccountKey === "string") {
        const trimmed = serviceAccountKey.trim();
        if (trimmed.startsWith("{")) {
          serviceAccount = JSON.parse(trimmed);
        } else {
          const decoded = Buffer.from(trimmed, "base64").toString("utf8");
          serviceAccount = JSON.parse(decoded);
        }
      } else {
        serviceAccount = serviceAccountKey;
      }

      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    adminDbInstance = getFirestore(FIRESTORE_DATABASE_ID);
    adminDbInstance.settings({ ignoreUndefinedProperties: true });
    return adminDbInstance;
  } catch (err: any) {
    databaseInitError = `Database Disconnected: ${err?.message || err}`;
    console.error(`[firebaseAdmin] ${databaseInitError}`);
    throw new Error(databaseInitError);
  }
}

