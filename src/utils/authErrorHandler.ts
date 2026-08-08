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

  const code = error.code || "";

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
    return "This verification link has expired. Please request a new link.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    rawMsg.includes("invalid-credential") ||
    rawMsg.includes("User not found") ||
    rawMsg.includes("Incorrect password")
  ) {
    return "We couldn't sign you in. Please check your email and password.";
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
    rawMsg.includes("email-already-in-use") ||
    rawMsg.includes("User already exists")
  ) {
    return "An account with this email address already exists. Please sign in instead.";
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
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
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
      console.warn(`[safeFetchJson] Expected JSON but received ${contentType} from ${url}. Raw output sample: ${rawText.substring(0, 100)}`);
      return {
        ok: false,
        status: res.status,
        error: "Our servers are temporarily unavailable. Please try again in a few minutes.",
      };
    }

    const json = await res.json();

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
    console.warn(`[safeFetchJson Note] Request to ${url} failed:`, err?.message || err);
    return {
      ok: false,
      status: 0,
      error: getFriendlyErrorMessage(err),
    };
  }
}
