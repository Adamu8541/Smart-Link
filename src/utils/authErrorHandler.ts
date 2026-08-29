/**
 * Auth Error Handler & Safe API Fetch Utility
 * Converts technical, system, or raw API errors into user-friendly messages.
 */

export interface FriendlyError {
  userMessage: string;
  technicalDetails?: string;
  code?: string;
}

/**
 * Maps technical error codes, messages, and raw exceptions to clean, user-friendly strings.
 */
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "Something went wrong. Please try again.";

  // If error is already a string
  const rawMsg = typeof error === "string" 
    ? error 
    : error.message || error.error || error.toString();

  const code = error?.code || "";

  if (
    rawMsg.includes("email not found or not registered") ||
    rawMsg.includes("not registered, register instead")
  ) {
    return "email not found or not registered, register instead";
  }

  if (
    rawMsg.includes("check email and try again or sign up if not register before") ||
    rawMsg.includes("check email and try again") ||
    rawMsg.includes("sign up if not register before") ||
    code === "auth/user-not-found"
  ) {
    return "check email and try again or sign up if not register before.";
  }

  if (
    rawMsg.includes("incorrect password, try forgot password instead") ||
    rawMsg.includes("try forgot password instead") ||
    rawMsg.includes("Incorrect password") ||
    rawMsg.includes("incorrect password") ||
    code === "auth/wrong-password"
  ) {
    return "incorrect password, try forgot password instead";
  }

  // Maintenance Mode Recognition
  if (
    rawMsg.includes("maintenance") ||
    rawMsg.includes("MAINTENANCE_MODE_ACTIVE") ||
    code === "MAINTENANCE_MODE_ACTIVE"
  ) {
    return "The website is currently undergoing scheduled maintenance. Services and transactions are temporarily restricted.";
  }

  // 1. Firebase Auth Errors
  if (
    code === "auth/invalid-action-code" ||
    code === "auth/invalid-oob-code" ||
    rawMsg.includes("invalid-action-code") ||
    rawMsg.includes("invalid-oob-code")
  ) {
    return "This password reset or verification link is invalid or has already been used. Please request a new link.";
  }

  if (
    code === "auth/expired-action-code" ||
    rawMsg.includes("expired-action-code")
  ) {
    return "This password reset or verification link has expired. Please request a new link.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    rawMsg.includes("invalid-credential") ||
    rawMsg.includes("Authentication failed")
  ) {
    return "incorrect password, try forgot password instead";
  }

  if (
    code === "auth/network-request-failed" ||
    rawMsg.includes("Failed to fetch") ||
    rawMsg.includes("NetworkError") ||
    rawMsg.includes("network-request-failed") ||
    rawMsg.includes("offline")
  ) {
    return "Unable to connect to the internet. Please check your connection and try again.";
  }

  if (
    code === "auth/too-many-requests" ||
    rawMsg.includes("too-many-requests") ||
    rawMsg.includes("Too many unsuccessful attempts")
  ) {
    return "Too many unsuccessful attempts. Please wait a few minutes before trying again.";
  }

  if (
    code === "auth/email-already-in-use" ||
    code === "auth/email-already-exists" ||
    rawMsg.includes("email-already-in-use") ||
    rawMsg.includes("email-already-exists") ||
    rawMsg.includes("User already exists") ||
    rawMsg.includes("email already exists") ||
    rawMsg.includes("email exist") ||
    rawMsg.includes("email exist sign in instead")
  ) {
    return "email exist sign in instead";
  }

  if (
    rawMsg.includes("phone number already linked to another account") ||
    rawMsg.includes("change phone number") ||
    rawMsg.includes("phone number already exists") ||
    rawMsg.includes("phone-already-in-use") ||
    rawMsg.includes("phone already exists")
  ) {
    return '"phone number already linked to another account" change phone number';
  }

  if (
    code === "auth/weak-password" ||
    rawMsg.includes("weak-password")
  ) {
    return "Password is too weak. Please choose a password with at least 6 characters.";
  }

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    rawMsg.includes("popup-closed-by-user")
  ) {
    return "Google Sign-In was cancelled. Please try again when you are ready.";
  }

  if (
    code === "auth/popup-blocked" ||
    rawMsg.includes("popup-blocked")
  ) {
    return "Google Sign-In popup was blocked by your browser. Please allow popups for this site.";
  }

  if (
    code === "auth/unauthorized-domain" ||
    rawMsg.includes("unauthorized-domain") ||
    rawMsg.includes("unauthorized domain")
  ) {
    return "This domain is not authorized for Google Sign-In in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.";
  }

  if (
    code === "auth/operation-not-allowed" ||
    rawMsg.includes("operation-not-allowed") ||
    rawMsg.includes("OPERATION_NOT_ALLOWED")
  ) {
    return "Google Sign-In is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.";
  }

  if (
    code === "auth/invalid-api-key" ||
    code === "auth/api-key-not-valid" ||
    rawMsg.includes("invalid-api-key") ||
    rawMsg.includes("API key not valid")
  ) {
    return "Firebase API Key is invalid or restricted. Please check your Firebase project settings.";
  }

  if (
    rawMsg.includes("invalid_request") ||
    rawMsg.includes("Invalid request") ||
    rawMsg.includes("request is invalid")
  ) {
    return "Google Authentication request was invalid. Please ensure Google Sign-In is enabled in Firebase Console with a valid project support email.";
  }

  if (
    code === "auth/user-disabled" ||
    rawMsg.includes("user-disabled")
  ) {
    return "This account has been suspended. Please contact customer support.";
  }

  if (
    code === "auth/requires-recent-login" ||
    rawMsg.includes("requires-recent-login")
  ) {
    return "For security reasons, please log out and log back in to perform this action.";
  }

  // 2. JSON / Syntax / HTML Response errors (Fix for "Unexpected token 'T', "The page c"...")
  if (
    rawMsg.includes("Unexpected token") ||
    rawMsg.includes("is not valid JSON") ||
    rawMsg.includes("JSON Parse Error") ||
    rawMsg.includes("SyntaxError") ||
    rawMsg.includes("<!DOCTYPE") ||
    rawMsg.includes("<html")
  ) {
    return "Our servers are temporarily unavailable. Please try again in a few minutes.";
  }

  // 3. System / HTTP Server errors (500, 404, TypeError, internal error)
  if (
    rawMsg.includes("Internal Server Error") ||
    rawMsg.includes("500") ||
    rawMsg.includes("TypeError") ||
    rawMsg.includes("Server Error")
  ) {
    return "Our servers are temporarily unavailable. Please try again in a few minutes.";
  }

  if (rawMsg.includes("404") || rawMsg.includes("not found")) {
    return "The requested service endpoint is temporarily unavailable. Please try again.";
  }

  // Log raw error internally for developer debugging
  console.warn("[AuthErrorLog]", error);

  // Default clean fallback
  return "Something went wrong. Please try again.";
}

/**
 * Safe fetch wrapper that validates content-type and HTTP response status
 * before calling `.json()`, avoiding "Unexpected token" JSON parse crashes.
 * Includes automatic retry for transient connection hiccups.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  retries = 2
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      const contentType = res.headers.get("content-type") || "";

      // If server returned non-JSON content (e.g. HTML error page or text)
      if (!contentType.includes("application/json")) {
        const rawText = await res.text().catch(() => "");
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        return {
          ok: false,
          status: res.status,
          error: "Our servers are temporarily unavailable. Please try again in a few minutes.",
        };
      }

      const json = await res.json();

      // Trigger global maintenance event if backend returns 503 or maintenance flag
      if (json?.maintenance === true || json?.code === "MAINTENANCE_MODE_ACTIVE" || (res.status === 503 && String(json?.error || "").toLowerCase().includes("maintenance"))) {
        try {
          window.dispatchEvent(new CustomEvent("maintenance_mode_triggered", { detail: json }));
        } catch {}
      }

      if (!res.ok) {
        const friendlyMsg = getFriendlyErrorMessage(json.error || json.message || res.statusText);
        return {
          ok: false,
          status: res.status,
          data: json,
          error: friendlyMsg,
        };
      }

      return {
        ok: true,
        status: res.status,
        data: json,
      };
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return {
        ok: false,
        status: 0,
        error: getFriendlyErrorMessage(err),
      };
    }
  }

  return {
    ok: false,
    status: 0,
    error: "Network request could not be completed.",
  };
}
