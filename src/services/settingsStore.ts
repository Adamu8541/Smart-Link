import { getAdminFirestore } from "./firebaseAdmin";

export interface AdminConfigDoc {
  system_settings?: any;
  branding_settings?: any;
  maintenance_settings?: any;
  platform_configuration?: any;
  apiProviders?: any[];
  settings_audit_logs?: any[];
}

export async function getSettingsDoc(): Promise<AdminConfigDoc | null> {
  try {
    const adminDb = getAdminFirestore();
    const docRef = adminDb.collection("system").doc("adminConfig");
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      return snapshot.data() as AdminConfigDoc;
    }
  } catch (err) {
    console.warn("[settingsStore] getSettingsDoc failed:", err);
  }
  return null;
}

export async function saveSettingsDoc(data: AdminConfigDoc): Promise<boolean> {
  try {
    const adminDb = getAdminFirestore();
    const docRef = adminDb.collection("system").doc("adminConfig");
    // Sanitize to remove any undefined values before writing to Firestore
    const sanitized = JSON.parse(
      JSON.stringify({
        system_settings: data.system_settings ?? {},
        branding_settings: data.branding_settings ?? {},
        maintenance_settings: data.maintenance_settings ?? {},
        platform_configuration: data.platform_configuration ?? {},
        apiProviders: data.apiProviders ?? [],
        settings_audit_logs: data.settings_audit_logs ?? [],
      })
    );
    await docRef.set(sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error("[settingsStore] saveSettingsDoc failed:", err);
    return false;
  }
}

/**
 * Hydrates in-memory db object with Firestore settings & providers if available.
 */
export async function syncFromFirestore(dbObj: any): Promise<void> {
  const fsDoc = await getSettingsDoc();
  if (fsDoc) {
    if (fsDoc.system_settings && Object.keys(fsDoc.system_settings).length > 0) {
      dbObj.system_settings = fsDoc.system_settings;
    }
    if (fsDoc.branding_settings && Object.keys(fsDoc.branding_settings).length > 0) {
      dbObj.branding_settings = fsDoc.branding_settings;
    }
    if (fsDoc.maintenance_settings && Object.keys(fsDoc.maintenance_settings).length > 0) {
      dbObj.maintenance_settings = fsDoc.maintenance_settings;
    }
    if (fsDoc.platform_configuration && Object.keys(fsDoc.platform_configuration).length > 0) {
      dbObj.platform_configuration = fsDoc.platform_configuration;
    }
    const fsProviders = (Array.isArray(fsDoc.apiProviders) && fsDoc.apiProviders.length > 0)
      ? fsDoc.apiProviders
      : (Array.isArray((fsDoc as any).api_providers) && (fsDoc as any).api_providers.length > 0 ? (fsDoc as any).api_providers : null);
    if (fsProviders) {
      dbObj.apiProviders = fsProviders;
      dbObj.api_providers = fsProviders;
    }
    if (Array.isArray(fsDoc.settings_audit_logs)) {
      dbObj.settings_audit_logs = fsDoc.settings_audit_logs;
    }
  }
}

/**
 * Persists in-memory settings & providers to Firestore adminConfig document.
 */
export async function syncToFirestore(dbObj: any): Promise<void> {
  const providers = (Array.isArray(dbObj.apiProviders) && dbObj.apiProviders.length > 0)
    ? dbObj.apiProviders
    : (Array.isArray(dbObj.api_providers) && dbObj.api_providers.length > 0 ? dbObj.api_providers : []);

  await saveSettingsDoc({
    system_settings: dbObj.system_settings,
    branding_settings: dbObj.branding_settings,
    maintenance_settings: dbObj.maintenance_settings,
    platform_configuration: dbObj.platform_configuration,
    apiProviders: providers,
    settings_audit_logs: dbObj.settings_audit_logs || [],
  });
}
