/**
 * Generic Provider Portal Manager
 * Resolves the correct adapter for a given payment provider ROW (from
 * db.api_providers[]) and calls it with that row's real credentials.
 * Add a new provider by: 1) writing a new adapter class implementing
 * ProviderAdapter, 2) registering it below by a lowercase key. Nothing
 * else in the app needs to change.
 */

import { AspfiyAdapter, ProviderAdapter, PaymentProviderConfig } from "./providers/aspfiyAdapter";
import { LumiIDAdapter } from "./providers/lumiidAdapter";
import { ClubkonnectAdapter } from "./providers/clubkonnectAdapter";
import { IdentroAdapter } from "./providers/identroAdapter";
import { PrembleyAdapter } from "./providers/prembleyAdapter";

const registeredAdapters: Record<string, ProviderAdapter> = {
  aspfiy: new AspfiyAdapter(),
  lumiid: new LumiIDAdapter(),
  clubkonnect: new ClubkonnectAdapter(),
  identro: new IdentroAdapter(),
  prembley: new PrembleyAdapter(),
  prembly: new PrembleyAdapter(),
  identitypass: new PrembleyAdapter(),
};

/**
 * Resolves the adapter class for a provider row, matched by its name.
 */
export function getAdapterForProvider(provider: { name?: string; id?: string }): ProviderAdapter | null {
  if (!provider?.name && !provider?.id) return null;
  const key = (provider.name || provider.id || "").toLowerCase().trim();
  if (registeredAdapters[key]) return registeredAdapters[key];
  for (const adapterKey of Object.keys(registeredAdapters)) {
    if (key.includes(adapterKey)) return registeredAdapters[adapterKey];
  }
  return null;
}

/**
 * Gets the single currently-Active provider row from the canonical collection (db.api_providers)
 * plus its matching adapter, ready to call. Returns null if none configured.
 * ASPFIY or any other provider must be explicitly Enabled/Active and not in Draft status.
 */
export function getActiveProviderAndAdapter(
  db: any,
  preferredCategoryOrService?: string
): { provider: PaymentProviderConfig; adapter: ProviderAdapter } | null {
  const providers = (Array.isArray(db.api_providers) && db.api_providers.length > 0)
    ? db.api_providers
    : (Array.isArray(db.apiProviders) ? db.apiProviders : []);

  const enabled = providers.filter(
    (p: any) =>
      (p.status === "Active" || p.status === "ENABLED" || p.isActive === true || p.enabled === true) &&
      p.status !== "Draft" &&
      p.status !== "Inactive" &&
      p.status !== "DISABLED"
  );
  if (enabled.length === 0) return null;

  let active = enabled[0];
  if (preferredCategoryOrService) {
    const target = preferredCategoryOrService.toUpperCase().trim();
    const rules = Array.isArray(db.provider_routing_rules) ? db.provider_routing_rules : [];
    const matchedRule = rules.find((r: any) => r.service?.toUpperCase().trim() === target && r.enabled !== false);
    if (matchedRule?.primaryProviderId) {
      const ruleId = matchedRule.primaryProviderId.toLowerCase().trim();
      const byRule = enabled.find((p: any) => {
        const pid = (p.id || "").toLowerCase().trim();
        const pname = (p.name || "").toLowerCase().trim();
        return (
          pid === ruleId ||
          pid === `prov_${ruleId}` ||
          pid.replace(/^prov_/, "") === ruleId.replace(/^prov_/, "") ||
          pname.includes(ruleId.replace(/^prov_/, ""))
        );
      });
      if (byRule) active = byRule;
    } else {
      const byCat = enabled.find((p: any) => {
        const cat = (p.category || p.providerType || "").toUpperCase();
        return cat === target;
      });
      if (byCat) active = byCat;
    }
  }

  // Ensure active providers use official base URLs, built-in App IDs, and server environment API keys
  let resolvedSecret = active.secretKey;
  let resolvedBaseUrl = active.baseUrl;
  let resolvedAppId = (active as any).clientId || (active as any).appId;

  const activeNameLower = ((active.name || "") + " " + (active.id || "")).toLowerCase();
  if (activeNameLower.includes("aspfiy")) {
    if (process.env.ASPFIY_SECRET_KEY) resolvedSecret = String(process.env.ASPFIY_SECRET_KEY).trim();
    resolvedBaseUrl = resolvedBaseUrl || "https://api-v1.aspfiy.com";
  } else if (activeNameLower.includes("lumiid")) {
    if (process.env.LUMIID_API_KEY || process.env.LUMIID_SECRET_KEY) {
      resolvedSecret = String(process.env.LUMIID_API_KEY || process.env.LUMIID_SECRET_KEY).trim();
    }
    resolvedBaseUrl = resolvedBaseUrl || "https://api.lumiid.com";
    resolvedAppId = resolvedAppId || "smartlink_identity_app";
  } else if (activeNameLower.includes("identro")) {
    if (process.env.IDENTRO_API_KEY || process.env.IDENTRO_SECRET_KEY) {
      resolvedSecret = String(process.env.IDENTRO_API_KEY || process.env.IDENTRO_SECRET_KEY).trim();
    }
    resolvedBaseUrl = resolvedBaseUrl || "https://api.identro.ng";
    resolvedAppId = resolvedAppId || "smartlink_identro_app";
  } else if (activeNameLower.includes("clubkonnect")) {
    if (process.env.CLUBKONNECT_API_KEY || process.env.CLUBKONNECT_SECRET_KEY) {
      resolvedSecret = String(process.env.CLUBKONNECT_API_KEY || process.env.CLUBKONNECT_SECRET_KEY).trim();
    }
    if (process.env.CLUBKONNECT_USER_ID || process.env.CLUBKONNECT_USERID || process.env.CLUBKONNECT_APP_ID || process.env.CLUBKONNECT_CLIENT_ID) {
      resolvedAppId = String(process.env.CLUBKONNECT_USER_ID || process.env.CLUBKONNECT_USERID || process.env.CLUBKONNECT_APP_ID || process.env.CLUBKONNECT_CLIENT_ID).trim();
    }
    resolvedBaseUrl = resolvedBaseUrl || "https://www.clubkonnect.com/API";
    resolvedAppId = resolvedAppId || "smartlink_vtu";
  } else if (activeNameLower.includes("prembley") || activeNameLower.includes("prembly") || activeNameLower.includes("identitypass")) {
    const pub = process.env.PREMBLEY_PUBLIC_KEY || process.env.PREMBLEY_API_KEY || process.env.IDENTITYPASS_PUBLIC_KEY || process.env.IDENTITYPASS_API_KEY;
    const sec = process.env.PREMBLEY_SECRET_KEY || process.env.IDENTITYPASS_SECRET_KEY;
    if (sec || pub) {
      resolvedSecret = String(sec || pub).trim();
    }
    resolvedBaseUrl = resolvedBaseUrl || "https://api.prembly.com";
  }

  const resolvedProvider: PaymentProviderConfig = {
    ...active,
    secretKey: resolvedSecret,
    apiKey: resolvedSecret,
    baseUrl: resolvedBaseUrl,
    clientId: resolvedAppId,
    appId: resolvedAppId,
  } as any;

  const adapter = getAdapterForProvider(resolvedProvider);
  if (!adapter) return null;
  return { provider: resolvedProvider, adapter };
}

/**
 * Compatibility alias for adapter resolution by ID or name string
 */
export function getAdapterById(providerIdOrName?: string): ProviderAdapter | null {
  if (!providerIdOrName) return registeredAdapters["aspfiy"] || null;
  return getAdapterForProvider({ name: providerIdOrName, id: providerIdOrName }) || registeredAdapters["aspfiy"] || null;
}

export { type ProviderAdapter, type PaymentProviderConfig, AspfiyAdapter, PrembleyAdapter };
