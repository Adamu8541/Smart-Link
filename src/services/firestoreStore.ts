import { getAdminFirestore } from "./firebaseAdmin";

export interface SystemAdminConfigDoc {
  siteSettings?: any;
  priceMatrix?: any;
  systemSettings?: any;
  brandingSettings?: any;
  maintenanceSettings?: any;
  platformConfiguration?: any;
}

const COLLECTION_MAPPING: Record<string, string> = {
  users: "users",
  wallets: "wallets",
  transactions: "transactions",
  cacApplications: "cac_applications",
  vendorServices: "services_catalog",
  servicesCatalog: "services_catalog",
  supportTickets: "support_tickets",
  supportCategories: "support_categories",
  ticketMessages: "ticket_messages",
  auditLogs: "audit_logs",
  activityLogs: "activity_logs",
  admin_activity_logs: "admin_activity_logs",
  apiProviders: "api_providers",
  api_providers: "api_providers",
  webhooks: "webhooks",
  webhookLogs: "webhook_logs",
  webhook_logs: "webhook_logs",
  receipts: "receipts",
  notifications: "notifications",
  notification_templates: "notification_templates",
  announcement_posts: "announcement_posts",
  admin_sessions: "admin_sessions",
  admin_users: "admin_users",
  active_sessions: "active_sessions",
  blocked_devices: "blocked_devices",
  blocked_ips: "blocked_ips",
  security_alerts: "security_alerts",
  account_locks: "account_locks",
  suspicious_activities: "suspicious_activities",
  login_history: "login_history",
  loginHistory: "login_history",
  api_requests: "api_requests",
  api_request_logs: "api_request_logs",
  api_response_mappings: "api_response_mappings",
  api_response_mapping_logs: "api_response_mapping_logs",
  virtualAccounts: "virtual_accounts",
  virtual_accounts: "virtual_accounts",
  reconciliation_records: "reconciliation_records",
  reconciliationRecords: "reconciliation_records",
  payment_records: "payment_records",
  paymentRecords: "payment_records",
  processed_payment_references: "processed_payment_references",
  processed_provider_tx_ids: "processed_provider_tx_ids",
  walletLogs: "wallet_logs",
  wallet_logs: "wallet_logs",
  providerLogs: "provider_logs",
  provider_logs: "provider_logs",
  system_settings: "system_settings",
  branding_settings: "branding_settings",
  maintenance_settings: "maintenance_settings",
  platform_configuration: "platform_configuration",
};

let inMemoryDbCache: any = null;
let lastSyncTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 seconds cache TTL for high performance

export async function loadFirestoreDb(forceRefresh = false): Promise<any> {
  const now = Date.now();
  if (inMemoryDbCache && !forceRefresh && now - lastSyncTimestamp < CACHE_TTL_MS) {
    return inMemoryDbCache;
  }

  const db: any = inMemoryDbCache || {
    users: [],
    transactions: [],
    cacApplications: [],
    vendorServices: [],
    supportTickets: [],
    supportCategories: [],
    ticketMessages: [],
    auditLogs: [],
    activityLogs: [],
    admin_activity_logs: [],
    siteSettings: {},
    priceMatrix: {},
    systemSettings: {},
    apiProviders: [],
    webhooks: [],
    webhookLogs: [],
    receipts: [],
    notifications: [],
    notification_templates: [],
    announcement_posts: [],
    admin_sessions: [],
    admin_users: [],
    active_sessions: [],
    blocked_devices: [],
    blocked_ips: [],
    security_alerts: [],
    account_locks: [],
    suspicious_activities: [],
    login_history: [],
    loginHistory: [],
    api_requests: [],
    api_request_logs: [],
    api_response_mappings: [],
    api_response_mapping_logs: [],
    virtualAccounts: [],
    walletLogs: [],
    providerLogs: [],
  };

  try {
    const fsDb = getAdminFirestore();

    // 1. Fetch system config singleton
    try {
      const configSnap = await fsDb.collection("system").doc("adminConfig").get();
      if (configSnap.exists) {
        const data = configSnap.data() || {};
        if (data.siteSettings) db.siteSettings = data.siteSettings;
        if (data.priceMatrix) db.priceMatrix = data.priceMatrix;
        if (data.systemSettings) db.systemSettings = data.systemSettings;
        if (data.brandingSettings) db.brandingSettings = data.brandingSettings;
        if (data.maintenanceSettings) db.maintenanceSettings = data.maintenanceSettings;
        if (data.platformConfiguration) db.platformConfiguration = data.platformConfiguration;
        if (data.system_settings) db.system_settings = data.system_settings;
        if (data.branding_settings) db.branding_settings = data.branding_settings;
        if (data.maintenance_settings) db.maintenance_settings = data.maintenance_settings;
        if (data.platform_configuration) db.platform_configuration = data.platform_configuration;
      }
    } catch (e) {
      console.warn("[firestoreStore] Failed to load adminConfig singleton:", e);
    }

    // 2. Fetch key collections in parallel
    const collectionKeys = Object.keys(COLLECTION_MAPPING);
    await Promise.all(
      collectionKeys.map(async (key) => {
        const firestoreCollName = COLLECTION_MAPPING[key];
        try {
          const snap = await fsDb.collection(firestoreCollName).limit(500).get();
          if (!snap.empty) {
            db[key] = snap.docs.map((doc) => {
              const data = doc.data();
              return { ...data, id: data.id || doc.id, uid: data.uid || doc.id };
            });
          }
        } catch (err) {
          // Ignore individual collection query errors
        }
      })
    );

    inMemoryDbCache = db;
    lastSyncTimestamp = now;
  } catch (err: any) {
    console.info(`[firestoreStore] Local state active (${err?.message || "fallback mode"})`);
  }

  return db;
}

export async function saveDocToFirestore(
  collectionNameKey: string,
  docId: string,
  docData: any
): Promise<void> {
  if (!docId || !docData) return;
  const targetColl = COLLECTION_MAPPING[collectionNameKey] || collectionNameKey;
  try {
    const fsDb = getAdminFirestore();
    await fsDb.collection(targetColl).doc(String(docId)).set(docData, { merge: true });
  } catch (err) {
    console.error(`[firestoreStore] Error saving doc ${docId} to ${targetColl}:`, err);
  }
}

export async function syncDbToFirestore(db: any, updatedCollections?: string[]): Promise<void> {
  if (!db) return;
  inMemoryDbCache = db;
  lastSyncTimestamp = Date.now();

  try {
    const fsDb = getAdminFirestore();

    // Sync adminConfig singleton if settings changed
    if (
      !updatedCollections ||
      updatedCollections.includes("siteSettings") ||
      updatedCollections.includes("priceMatrix") ||
      updatedCollections.includes("systemSettings") ||
      updatedCollections.includes("brandingSettings") ||
      updatedCollections.includes("maintenanceSettings") ||
      updatedCollections.includes("platformConfiguration") ||
      updatedCollections.includes("system_settings") ||
      updatedCollections.includes("branding_settings") ||
      updatedCollections.includes("maintenance_settings") ||
      updatedCollections.includes("platform_configuration")
    ) {
      await fsDb.collection("system").doc("adminConfig").set(
        {
          siteSettings: db.siteSettings || {},
          priceMatrix: db.priceMatrix || {},
          systemSettings: db.systemSettings || db.system_settings || {},
          brandingSettings: db.brandingSettings || db.branding_settings || {},
          maintenanceSettings: db.maintenanceSettings || db.maintenance_settings || {},
          platformConfiguration: db.platformConfiguration || db.platform_configuration || {},
          system_settings: db.system_settings || db.systemSettings || {},
          branding_settings: db.branding_settings || db.brandingSettings || {},
          maintenance_settings: db.maintenance_settings || db.maintenanceSettings || {},
          platform_configuration: db.platform_configuration || db.platformConfiguration || {},
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // Sync specific collections
    const collectionsToProcess = updatedCollections
      ? updatedCollections.filter((c) => Boolean(COLLECTION_MAPPING[c]))
      : Object.keys(COLLECTION_MAPPING);

    for (const key of collectionsToProcess) {
      const items = db[key];
      if (Array.isArray(items) && items.length > 0) {
        const targetColl = COLLECTION_MAPPING[key];
        await Promise.all(
          items.map(async (item) => {
            const docId = String(
              item.id ||
              item.uid ||
              item.recordId ||
              item.paymentReference ||
              item.providerTransactionId ||
              item.reference ||
              item.accountNumber ||
              item.logId ||
              item.sessionId ||
              item.ticketId ||
              item.txRef ||
              item.code ||
              item.email ||
              item.ip ||
              item.deviceId ||
              item.alertId ||
              item.lockId ||
              item.activityId ||
              item.requestId ||
              item.mappingId ||
              Math.random().toString(36).substring(2, 9)
            );
            if (docId) {
              await fsDb.collection(targetColl).doc(docId).set(item, { merge: true }).catch(() => {});
            }
          })
        );
      }
    }
  } catch (err) {
    console.warn("[firestoreStore] Sync to Firestore warning:", err);
  }
}
