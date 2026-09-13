/**
 * Safe formatting utilities to ensure no null/undefined or malformed date/number
 * crashes the application during runtime or maintenance mode.
 */

/**
 * Format a number/currency safely with comma separators and optional fraction digits.
 * Defaults to "0" or "0.00" if input is null, undefined, or NaN.
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || value === "") {
    return options?.minimumFractionDigits ? (0).toFixed(options.minimumFractionDigits) : "0";
  }
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  if (isNaN(num)) {
    return options?.minimumFractionDigits ? (0).toFixed(options.minimumFractionDigits) : "0";
  }
  try {
    return num.toLocaleString("en-NG", options);
  } catch {
    return num.toFixed(options?.minimumFractionDigits ?? 0);
  }
}

/**
 * Formats an amount with Naira symbol (e.g. ₦1,500.00 or ₦1,500)
 */
export function formatNaira(
  value: number | string | null | undefined,
  showDecimals = false
): string {
  const formatted = formatNumber(
    value,
    showDecimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined
  );
  return `₦${formatted}`;
}

/**
 * Formats a Date object, ISO string, timestamp or number safely.
 * Returns fallback (e.g. "Recently", "TBA", or current formatted time) if input is invalid.
 */
export function formatSafeDate(
  value: any,
  fallback = "Recently",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-NG", options);
  } catch {
    return fallback;
  }
}

/**
 * Formats a Date object, ISO string, timestamp safely with date and time.
 */
export function formatSafeDateTime(
  value: any,
  fallback = "Recently",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }
): string {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString("en-NG", options);
  } catch {
    return fallback;
  }
}
