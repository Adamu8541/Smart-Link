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
      if (module && typeof module === "object") {
        if (module.default) {
          return { default: module.default };
        }
        if (componentName && module[componentName]) {
          return { default: module[componentName] };
        }
      }
      if (typeof module === "function") {
        return { default: module };
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
