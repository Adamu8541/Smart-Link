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
import { VTpassAdapter } from "./providers/vtpassAdapter";
import { BigisubAdapter } from "./providers/bigisubAdapter";

const registeredAdapters: Record<string, ProviderAdapter> = {
  aspfiy: new AspfiyAdapter(),
  lumiid: new LumiIDAdapter(),
  clubkonnect: new ClubkonnectAdapter(),
  identro: new IdentroAdapter(),
  prembley: new PrembleyAdapter(),
  prembly: new PrembleyAdapter(),
  identitypass: new PrembleyAdapter(),
  vtpass: new VTpassAdapter(),
  bigisub: new BigisubAdapter(),
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
  // Configuration sourced exclusively from server-side environment variables (Turso runtime env)
  const secretKey = String(process.env.ASPFIY_SECRET_KEY || process.env.ASPFIY_API_KEY || "").trim();
  const publicKey = String(process.env.ASPFIY_PUBLIC_KEY || "").trim();
  const baseUrl = String(process.env.ASPFIY_BASE_URL || "https://api-v1.aspfiy.com").trim();

  const provider: PaymentProviderConfig = {
    id: "prov_aspfiy",
    name: "Aspfiy Payment Portal",
    secretKey,
    apiKey: secretKey,
    publicKey,
    baseUrl,
    webhookUrl: "https://smartlinkng.com.ng/api/webhooks/aspfiy",
    status: "Active",
    isActive: true,
  };

  const adapter = getAdapterForProvider(provider);
  if (!adapter) return null;
  return { provider, adapter };
}

/**
 * Compatibility alias for adapter resolution by ID or name string
 */
export function getAdapterById(providerIdOrName?: string): ProviderAdapter | null {
  if (!providerIdOrName) return registeredAdapters["aspfiy"] || null;
  return getAdapterForProvider({ name: providerIdOrName, id: providerIdOrName }) || registeredAdapters["aspfiy"] || null;
}

export { type ProviderAdapter, type PaymentProviderConfig, AspfiyAdapter, PrembleyAdapter, VTpassAdapter, BigisubAdapter };
