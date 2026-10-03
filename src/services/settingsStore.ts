import { executeTurso } from "../../server/turso/client";

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
  provider_routing_rules?: any[];
  providerRoutingRules?: any[];
  routing_rules?: any[];
  settings_audit_logs?: any[];
}

export async function getSettingsDoc(): Promise<AdminConfigDoc | null> {
  try {
    const res = await executeTurso("SELECT key, value FROM application_settings;");
    if (!res.rows) return null;

    const doc: Record<string, any> = {};
    for (const row of res.rows) {
      const key = String(row.key);
      const valStr = String(row.value || "{}");
      try {
        doc[key] = JSON.parse(valStr);
      } catch {
        doc[key] = valStr;
      }
    }

    return {
      system_settings: doc.system_settings,
      branding_settings: doc.branding_settings,
      maintenance_settings: doc.maintenance_settings,
      platform_configuration: doc.platform_configuration,
      apiProviders: doc.api_providers || doc.apiProviders || [],
      api_providers: doc.api_providers || doc.apiProviders || [],
      servicesCatalog: doc.servicesCatalog || [],
      services_catalog: doc.servicesCatalog || [],
      priceMatrix: doc.priceMatrix || doc.price_matrix,
      siteSettings: doc.siteSettings || doc.site_settings,
      provider_routing_rules: doc.provider_routing_rules || doc.routing_rules || [],
      providerRoutingRules: doc.provider_routing_rules || doc.routing_rules || [],
      routing_rules: doc.provider_routing_rules || doc.routing_rules || [],
      settings_audit_logs: doc.settings_audit_logs || [],
    };
  } catch (err) {
    console.error("[settingsStore] Turso getSettingsDoc failed:", err);
    return null;
  }
}

export async function saveSettingsDoc(data: AdminConfigDoc): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const entriesToSave: Array<{ key: string; val: any }> = [];

    if (data.system_settings !== undefined) entriesToSave.push({ key: "system_settings", val: data.system_settings });
    if (data.branding_settings !== undefined) entriesToSave.push({ key: "branding_settings", val: data.branding_settings });
    if (data.maintenance_settings !== undefined) entriesToSave.push({ key: "maintenance_settings", val: data.maintenance_settings });
    if (data.platform_configuration !== undefined) entriesToSave.push({ key: "platform_configuration", val: data.platform_configuration });
    if (data.api_providers || data.apiProviders) entriesToSave.push({ key: "api_providers", val: data.api_providers || data.apiProviders });
    if (data.servicesCatalog || data.services_catalog) entriesToSave.push({ key: "servicesCatalog", val: data.servicesCatalog || data.services_catalog });
    if (data.priceMatrix !== undefined) entriesToSave.push({ key: "priceMatrix", val: data.priceMatrix });
    if (data.siteSettings !== undefined) entriesToSave.push({ key: "siteSettings", val: data.siteSettings });
    if (data.provider_routing_rules || data.providerRoutingRules || data.routing_rules) {
      entriesToSave.push({ key: "provider_routing_rules", val: data.provider_routing_rules || data.providerRoutingRules || data.routing_rules });
    }
    if (data.settings_audit_logs !== undefined) entriesToSave.push({ key: "settings_audit_logs", val: data.settings_audit_logs });

    for (const { key, val } of entriesToSave) {
      const jsonVal = typeof val === "string" ? val : JSON.stringify(val);
      const id = `setting_${key}`;
      await executeTurso(
        `INSERT INTO application_settings (id, key, category, value, is_public, updated_at)
         VALUES (?, ?, 'ADMIN_CONFIG', ?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [id, key, jsonVal, now]
      );
    }
    return true;
  } catch (err) {
    console.error("[settingsStore] Turso saveSettingsDoc failed:", err);
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
    if (Array.isArray(fsDoc.api_providers) && fsDoc.api_providers.length > 0) {
      dbObj.api_providers = fsDoc.api_providers;
      dbObj.apiProviders = fsDoc.api_providers;
    } else if (Array.isArray(fsDoc.apiProviders) && fsDoc.apiProviders.length > 0) {
      dbObj.api_providers = fsDoc.apiProviders;
      dbObj.apiProviders = fsDoc.apiProviders;
    }
    if (Array.isArray(fsDoc.provider_routing_rules) && fsDoc.provider_routing_rules.length > 0) {
      dbObj.provider_routing_rules = fsDoc.provider_routing_rules;
      dbObj.providerRoutingRules = fsDoc.provider_routing_rules;
      dbObj.routing_rules = fsDoc.provider_routing_rules;
    }
    if (Array.isArray(fsDoc.servicesCatalog) && fsDoc.servicesCatalog.length > 0) {
      dbObj.servicesCatalog = fsDoc.servicesCatalog;
      dbObj.services_catalog = fsDoc.servicesCatalog;
    }
  }
}

export async function syncToStorage(dbObj: any): Promise<void> {
  const providers = (Array.isArray(dbObj.api_providers) && dbObj.api_providers.length > 0)
    ? dbObj.api_providers
    : (Array.isArray(dbObj.apiProviders) && dbObj.apiProviders.length > 0 ? dbObj.apiProviders : []);

  const routingRules = (Array.isArray(dbObj.provider_routing_rules) && dbObj.provider_routing_rules.length > 0)
    ? dbObj.provider_routing_rules
    : (Array.isArray(dbObj.providerRoutingRules) && dbObj.providerRoutingRules.length > 0
        ? dbObj.providerRoutingRules
        : (Array.isArray(dbObj.routing_rules) ? dbObj.routing_rules : []));

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
    provider_routing_rules: routingRules,
    providerRoutingRules: routingRules,
    routing_rules: routingRules,
    servicesCatalog: services,
    services_catalog: services,
    priceMatrix: dbObj.priceMatrix,
    siteSettings: dbObj.siteSettings,
    settings_audit_logs: dbObj.settings_audit_logs || [],
  });
}
