/**
 * SMART LINK NG — Biometric & WebAuthn Authentication Service
 * Handles native device fingerprint, Touch ID, Face ID, and Windows Hello
 * registration & verification directly using standard WebAuthn API.
 */

import { SupabaseAuthService } from "./supabaseAuth";

// Helper: Base64URL string to Uint8Array
function base64UrlToBuffer(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper: ArrayBuffer to Base64URL string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface BiometricDevice {
  id: string;
  credentialId: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export class BiometricAuthService {
  /**
   * Check if the user's browser & hardware support Platform Biometrics (Fingerprint, Touch ID, Face ID)
   */
  public static async isBiometricSupported(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return false;
    }
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if running in an iframe where browser security policy blocks WebAuthn
   */
  public static isIframeRestricted(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  /**
   * Helper to retrieve active user authentication token across Supabase & Local storage
   */
  public static async getStoredAuthToken(explicitToken?: string): Promise<string> {
    if (explicitToken && typeof explicitToken === "string" && explicitToken.trim()) {
      return explicitToken.trim();
    }
    // 1. Direct tokens
    const directToken =
      localStorage.getItem("smartlink_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("sessionToken");
    if (directToken) return directToken;

    // 2. User profile storage
    try {
      const rawUser = localStorage.getItem("smart_link_user") || localStorage.getItem("smartlink_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.token) return u.token;
        if (u.sessionToken) return u.sessionToken;
        if (u.access_token) return u.access_token;
      }
    } catch {}

    // 3. Supabase active session
    try {
      const supaSess = await SupabaseAuthService.getSession();
      if (supaSess?.access_token) {
        localStorage.setItem("smartlink_token", supaSess.access_token);
        return supaSess.access_token;
      }
    } catch {}

    // 4. Admin session
    try {
      const rawAdmin = localStorage.getItem("admin_session") || localStorage.getItem("smart_link_admin_session");
      if (rawAdmin) {
        const a = JSON.parse(rawAdmin);
        if (a.token) return a.token;
      }
    } catch {}

    return "";
  }

  /**
   * Register and enroll the current device's fingerprint or biometric authenticator
   */
  public static async enrollBiometrics(options?: {
    deviceName?: string;
    token?: string;
  }): Promise<{ success: boolean; message: string; passkey?: any }> {
    const supported = await this.isBiometricSupported();
    if (!supported) {
      throw new Error("Biometric authentication is not supported or not enabled on this device/browser.");
    }

    // 1. Get auth headers
    const storedToken = await this.getStoredAuthToken(options?.token);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (storedToken) {
      headers["Authorization"] = `Bearer ${storedToken}`;
      headers["x-session-token"] = storedToken;
    }

    // 2. Request creation options from backend
    const optRes = await fetch("/api/auth/passkeys/register-options", {
      method: "POST",
      headers,
    });

    if (!optRes.ok) {
      const errJson = await optRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to initialize biometric enrollment");
    }

    const { options: rawOptions } = await optRes.json();
    if (!rawOptions) {
      throw new Error("Invalid biometric options received from server");
    }

    // 3. Format options for navigator.credentials.create
    const publicKeyCreationOptions: PublicKeyCredentialCreationOptions = {
      ...rawOptions,
      challenge: base64UrlToBuffer(rawOptions.challenge),
      user: {
        ...rawOptions.user,
        id: base64UrlToBuffer(rawOptions.user.id),
      },
      excludeCredentials: rawOptions.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: base64UrlToBuffer(cred.id),
      })),
    };

    // 4. Prompt native fingerprint scanner on device
    let credential: PublicKeyCredential | null = null;
    try {
      credential = (await navigator.credentials.create({
        publicKey: publicKeyCreationOptions,
      })) as PublicKeyCredential;
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "SecurityError" ||
        (err.message && (err.message.includes("publickey-credentials") || err.message.includes("Permissions Policy")))
      ) {
        if (this.isIframeRestricted()) {
          throw new Error(
            "Biometric sensor access is restricted inside embedded preview iframes by browser security policies. Please open the app URL in a standalone browser tab/window to enroll your fingerprint."
          );
        }
      }
      throw new Error(err.message || "Biometric enrollment was cancelled or not recognized.");
    }

    if (!credential) {
      throw new Error("Biometric enrollment was cancelled by user.");
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = bufferToBase64Url(credential.rawId);
    const publicKey = response.getPublicKey ? bufferToBase64Url(response.getPublicKey()!) : credentialId;

    // Detect device name
    const defaultDeviceName =
      options?.deviceName ||
      (/iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "Apple Device (Touch ID / Face ID)"
        : /Android/i.test(navigator.userAgent)
        ? "Android Biometric Sensor"
        : /Macintosh/i.test(navigator.userAgent)
        ? "Mac Touch ID"
        : /Windows/i.test(navigator.userAgent)
        ? "Windows Hello Fingerprint"
        : "Biometric Device");

    // 5. Send verification back to backend to save into Turso
    const verifyRes = await fetch("/api/auth/passkeys/register-verify", {
      method: "POST",
      headers,
      body: JSON.stringify({
        credentialId,
        publicKey,
        deviceName: defaultDeviceName,
        challenge: rawOptions.challenge,
        transports: credential.response.getTransports ? credential.response.getTransports() : undefined,
      }),
    });

    if (!verifyRes.ok) {
      const errJson = await verifyRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to verify and save biometric fingerprint");
    }

    const result = await verifyRes.json();
    return result;
  }

  /**
   * Authenticate / Sign In using Device Fingerprint
   */
  public static async authenticateWithBiometrics(
    email?: string
  ): Promise<{ success: boolean; user: any; token: string; message: string }> {
    const supported = await this.isBiometricSupported();
    if (!supported) {
      throw new Error("Biometric sign-in is not supported on this device/browser.");
    }

    // 1. Request login challenge from backend
    const optRes = await fetch("/api/auth/passkeys/login-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email ? email.trim() : undefined }),
    });

    if (!optRes.ok) {
      const errJson = await optRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to initialize biometric challenge");
    }

    const { options: rawOptions } = await optRes.json();
    if (!rawOptions) {
      throw new Error("Invalid biometric login challenge");
    }

    // 2. Format options for navigator.credentials.get
    const publicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: base64UrlToBuffer(rawOptions.challenge),
      timeout: rawOptions.timeout || 60000,
      rpId: rawOptions.rpId || window.location.hostname,
      userVerification: rawOptions.userVerification || "preferred",
      allowCredentials: rawOptions.allowCredentials?.map((cred: any) => ({
        ...cred,
        id: base64UrlToBuffer(cred.id),
      })),
    };

    // 3. Prompt native fingerprint reader
    let assertion: PublicKeyCredential | null = null;
    try {
      assertion = (await navigator.credentials.get({
        publicKey: publicKeyRequestOptions,
      })) as PublicKeyCredential;
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "SecurityError" ||
        (err.message && (err.message.includes("publickey-credentials") || err.message.includes("Permissions Policy")))
      ) {
        if (this.isIframeRestricted()) {
          throw new Error(
            "Biometric sensor access is restricted inside embedded preview iframes by browser security policies. Please open the app in a standalone tab to sign in with fingerprint, or use your email and password."
          );
        }
      }
      throw new Error(err.message || "Biometric sign-in was cancelled or not recognized.");
    }

    if (!assertion) {
      throw new Error("Biometric sign-in was cancelled.");
    }

    const credentialId = bufferToBase64Url(assertion.rawId);

    // 4. Verify signature on backend & log in
    const verifyRes = await fetch("/api/auth/passkeys/login-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        challenge: rawOptions.challenge,
      }),
    });

    if (!verifyRes.ok) {
      const errJson = await verifyRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Biometric authentication failed. Please try password login.");
    }

    const result = await verifyRes.json();

    if (result.token) {
      localStorage.setItem("smartlink_token", result.token);
      localStorage.setItem("token", result.token);
    }
    if (result.user) {
      localStorage.setItem("smartlink_user", JSON.stringify(result.user));
    }

    return result;
  }

  /**
   * List all registered biometric devices for current user
   */
  public static async listRegisteredPasskeys(token?: string): Promise<BiometricDevice[]> {
    try {
      const storedToken = await this.getStoredAuthToken(token);
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
        headers["x-session-token"] = storedToken;
      }

      const res = await fetch("/api/auth/passkeys/list", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      return json.passkeys || [];
    } catch {
      return [];
    }
  }

  /**
   * Delete a registered biometric device
   */
  public static async deletePasskey(id: string, token?: string): Promise<boolean> {
    try {
      const storedToken = await this.getStoredAuthToken(token);
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
        headers["x-session-token"] = storedToken;
      }

      const res = await fetch(`/api/auth/passkeys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
