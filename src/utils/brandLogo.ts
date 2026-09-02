/**
 * SmartLink Nigeria Brand Assets & Fail-Safe Logo Utilities
 * Ensures logo images never blink, flicker, or loop infinitely on production deployments (e.g. Render).
 */

import type React from "react";

export const DEFAULT_LOGO_URL = "/logo.webp";
export const PNG_LOGO_URL = "/logo.png";

/**
 * High-resolution embedded vector SVG Data URI of SmartLink Nigeria brand mark.
 * Serves as an unbreakable offline/network fail-safe if any remote or static image fails to load.
 */
export const FALLBACK_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <defs>
    <linearGradient id="slGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2D5C"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>
    <linearGradient id="slAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
  </defs>
  <!-- Background Container -->
  <rect width="320" height="80" rx="14" fill="#FFFFFF"/>
  <rect x="1" y="1" width="318" height="78" rx="13" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  
  <!-- Modern Tech Node Symbol -->
  <g transform="translate(18, 16)">
    <!-- Outer Shield/Hexagon -->
    <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#slGrad)"/>
    <!-- Interlocking Links -->
    <path d="M18 24C18 20.6863 20.6863 18 24 18H28C31.3137 18 34 20.6863 34 24C34 27.3137 31.3137 30 28 30H24" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M30 24C30 27.3137 27.3137 30 24 30H20C16.6863 30 14 27.3137 14 24C14 20.6863 16.6863 18 20 18H24" stroke="url(#slAccent)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <!-- Core Secure Point -->
    <circle cx="24" cy="24" r="2.5" fill="#FFFFFF"/>
  </g>

  <!-- Typography -->
  <g transform="translate(78, 22)">
    <!-- Primary Brand Name -->
    <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif" font-weight="900" font-size="22" fill="#0F2D5C" letter-spacing="-0.5">
      SMART<tspan fill="#059669">LINK</tspan>
    </text>
    <!-- Country & Tagline Badge -->
    <text x="142" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif" font-weight="800" font-size="10" fill="#1E40AF" letter-spacing="1">
      NG
    </text>
    <!-- Subtitle descriptor -->
    <text x="1" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif" font-weight="600" font-size="8.5" fill="#64748B" letter-spacing="1.2">
      DIGITAL ENTERPRISE
    </text>
  </g>
</svg>
`)}`;

/**
 * Universal safe image error handler.
 * Prevents infinite loop flickering by trying the default static asset first,
 * and falling back to the vector SVG data URI with recursion protection.
 */
export function handleLogoError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  const stage = img.dataset.fallbackStage || "0";

  if (stage === "0") {
    img.dataset.fallbackStage = "1";
    // If original src was not /logo.webp, try /logo.webp then PNG
    if (img.src && !img.src.endsWith("/logo.webp") && !img.src.endsWith("/logo.png")) {
      img.src = DEFAULT_LOGO_URL;
      return;
    }
    if (img.src && img.src.endsWith("/logo.webp")) {
      img.src = PNG_LOGO_URL;
      return;
    }
  }

  // If /logo.png also fails or stage is already >= 1, use embedded SVG Data URI
  img.dataset.fallbackStage = "2";
  img.onerror = null; // Disable handler to strictly prevent any recursive events
  img.src = FALLBACK_LOGO_SVG;
}
