import React, { ComponentType, lazy } from "react";

/**
 * Wraps React.lazy with automatic retry and stale-chunk recovery.
 * Resolves "Failed to fetch dynamically imported module" errors that occur
 * when a new build or bundle update invalidates older chunk hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  componentName: string = "Component"
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = window.sessionStorage.getItem(`smartlink_chunk_retry_${componentName}`);

    try {
      const module = await componentImport();
      // Ensure we extract the default export or handle named export bridges
      if (module && typeof module === "object") {
        if (module.default) {
          return module;
        }
        // If the module itself is a React component or has a known component property
        const keys = Object.keys(module);
        for (const key of keys) {
          if (typeof module[key] === "function" || typeof module[key] === "object") {
            return { default: module[key] };
          }
        }
      }
      return module;
    } catch (error: any) {
      console.warn(`[lazyWithRetry] Initial load failed for ${componentName}:`, error?.message || error);

      const isDynamicImportError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.message?.includes("Loading chunk") ||
        error?.name === "TypeError" ||
        error?.name === "ChunkLoadError";

      if (isDynamicImportError) {
        // Attempt immediate second retry after short delay
        try {
          await new Promise((resolve) => setTimeout(resolve, 600));
          const module = await componentImport();
          if (module && typeof module === "object" && module.default) {
            return module;
          }
          return module;
        } catch (secondError) {
          console.warn(`[lazyWithRetry] Second retry failed for ${componentName}. Triggering fresh asset sync.`);
        }

        // If not already refreshed in this session, trigger a hard reload to fetch new bundle index
        if (!pageHasBeenForceRefreshed) {
          window.sessionStorage.setItem(`smartlink_chunk_retry_${componentName}`, "true");
          window.location.reload();
          // Return a placeholder while reloading
          return {
            default: (() => null) as unknown as T,
          };
        }
      }

      // If already reloaded once and still failing, throw so error boundary displays clean recovery UI
      throw error;
    }
  });
}
