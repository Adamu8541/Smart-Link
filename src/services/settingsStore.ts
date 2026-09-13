import { readDB, writeDB } from "../../server/db";

export interface AdminConfigDoc {
  system_settings?: any;
  branding_settings?: any;
  maintenance_settings?: any;
  platform_configuration?: any;
  apiProviders?: any[];
  api_providers?: any[];
  servicesCatalog?: any[];
  services_catalog?: any[];
  priceMatrix?: any;
  siteSettings?: any;
  settings_audit_logs?: any[];
}

export async function getSettingsDoc(): Promise<AdminConfigDoc | null> {
  try {
    const db = readDB();
    if (db) {
      return {
        system_settings: db.system_settings,
        branding_settings: db.branding_settings,
        maintenance_settings: db.maintenance_settings,
        platform_configuration: db.platform_configuration,
        apiProviders: db.api_providers || db.apiProviders || [],
        api_providers: db.api_providers || db.apiProviders || [],
        servicesCatalog: db.servicesCatalog || [],
        services_catalog: db.servicesCatalog || [],
        priceMatrix: db.priceMatrix,
        siteSettings: db.siteSettings,
        settings_audit_logs: db.settings_audit_logs || [],
      };
    }
  } catch (err) {}
  return null;
}

export async function saveSettingsDoc(data: AdminConfigDoc): Promise<boolean> {
  try {
    const db = readDB();
    if (data.system_settings) db.system_settings = data.system_settings;
    if (data.branding_settings) db.branding_settings = data.branding_settings;
    if (data.maintenance_settings) db.maintenance_settings = data.maintenance_settings;
    if (data.platform_configuration) db.platform_configuration = data.platform_configuration;
    if (data.api_providers || data.apiProviders) {
      db.api_providers = data.api_providers || data.apiProviders;
      db.apiProviders = db.api_providers;
    }
    if (data.servicesCatalog || data.services_catalog) {
      db.servicesCatalog = data.servicesCatalog || data.services_catalog;
    }
    if (data.priceMatrix) db.priceMatrix = data.priceMatrix;
    if (data.siteSettings) db.siteSettings = data.siteSettings;
    if (data.settings_audit_logs) db.settings_audit_logs = data.settings_audit_logs;
    writeDB(db);
    return true;
  } catch (err) {
    console.error("[settingsStore] saveSettingsDoc failed:", err);
    return false;
  }
}

export async function syncFromStorage(dbObj: any): Promise<void> {
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
    if (fsDoc.priceMatrix && Object.keys(fsDoc.priceMatrix).length > 0) {
      dbObj.priceMatrix = fsDoc.priceMatrix;
    }
    if (fsDoc.siteSettings && Object.keys(fsDoc.siteSettings).length > 0) {
      dbObj.siteSettings = fsDoc.siteSettings;
    }
  }
}

export async function syncToStorage(dbObj: any): Promise<void> {
  const providers = (Array.isArray(dbObj.api_providers) && dbObj.api_providers.length > 0)
    ? dbObj.api_providers
    : (Array.isArray(dbObj.apiProviders) && dbObj.apiProviders.length > 0 ? dbObj.apiProviders : []);

  const services = (Array.isArray(dbObj.servicesCatalog) && dbObj.servicesCatalog.length > 0)
    ? dbObj.servicesCatalog
    : [];

  await saveSettingsDoc({
    system_settings: dbObj.system_settings,
    branding_settings: dbObj.branding_settings,
    maintenance_settings: dbObj.maintenance_settings,
    platform_configuration: dbObj.platform_configuration,
    apiProviders: providers,
    api_providers: providers,
    servicesCatalog: services,
    services_catalog: services,
    priceMatrix: dbObj.priceMatrix,
    siteSettings: dbObj.siteSettings,
    settings_audit_logs: dbObj.settings_audit_logs || [],
  });
}
