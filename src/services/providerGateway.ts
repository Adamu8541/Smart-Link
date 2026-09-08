/**
 * Generic Provider Gateway Manager
 * Resolves the correct adapter for a given payment provider ROW (from
 * db.api_providers[]) and calls it with that row's real credentials.
 * Add a new provider by: 1) writing a new adapter class implementing
 * ProviderAdapter, 2) registering it below by a lowercase key. Nothing
 * else in the app needs to change.
 */

import { AspfiyAdapter, ProviderAdapter, PaymentProviderConfig } from "./providers/aspfiyAdapter";
import { LumiIDAdapter } from "./providers/lumiidAdapter";
import { NinBvnPortalAdapter } from "./providers/ninBvnPortalAdapter";
import { VerifyNGAdapter } from "./providers/verifyNgAdapter";

const registeredAdapters: Record<string, ProviderAdapter> = {
  aspfiy: new AspfiyAdapter(),
  lumiid: new LumiIDAdapter(),
  ninbvnportal: new NinBvnPortalAdapter(),
  verifyng: new VerifyNGAdapter(),
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
  db: any
): { provider: PaymentProviderConfig; adapter: ProviderAdapter } | null {
  const providers = (Array.isArray(db.api_providers) && db.api_providers.length > 0)
    ? db.api_providers
    : (Array.isArray(db.apiProviders) ? db.apiProviders : []);

  const active = providers.find(
    (p: any) =>
      (p.status === "Active" || p.status === "ENABLED" || p.isActive === true || p.enabled === true) &&
      p.status !== "Draft" &&
      p.status !== "Inactive" &&
      p.status !== "DISABLED"
  );
  if (!active) return null;

  // Ensure active ASPFIY provider uses the server-side environment secret if available
  const resolvedProvider: PaymentProviderConfig = {
    ...active,
    secretKey:
      ((active.name || "").toLowerCase().includes("aspfiy") && process.env.ASPFIY_SECRET_KEY)
        ? String(process.env.ASPFIY_SECRET_KEY).trim()
        : active.secretKey,
  };

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

export { type ProviderAdapter, type PaymentProviderConfig, AspfiyAdapter };
