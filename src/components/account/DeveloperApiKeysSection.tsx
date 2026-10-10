/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Lock,
  ShieldCheck,
  Webhook,
  AlertTriangle,
  ExternalLink,
  Code2,
  Terminal,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  FileCode,
  Download,
} from "lucide-react";
import { UserProfile } from "../../types";

interface DeveloperApiKeysSectionProps {
  currentUser: UserProfile;
  onRefreshUser?: (uid: string) => void;
  onNavigateDocs?: () => void;
  isDarkMode?: boolean;
}

export const DeveloperApiKeysSection: React.FC<DeveloperApiKeysSectionProps> = ({
  currentUser,
  onRefreshUser,
  onNavigateDocs,
  isDarkMode = false,
}) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [webhookSecret, setWebhookSecret] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [ipWhitelist, setIpWhitelist] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [rotating, setRotating] = useState<boolean>(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const getClientAuthToken = () => {
    return (
      localStorage.getItem("smartlink_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("smartlink_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("smart_link_token") ||
      ""
    );
  };

  const getAuthHeaders = () => {
    const token = getClientAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (currentUser?.uid) headers["x-user-uid"] = currentUser.uid;
    return headers;
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn("Download error:", e);
    }
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const uidParam = currentUser?.uid ? `?uid=${encodeURIComponent(currentUser.uid)}` : "";
      const res = await fetch(`/api/user/developer-keys${uidParam}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(data.apiKey || "");
        setWebhookSecret(data.webhookSecret || "");
        setWebhookUrl(data.webhookUrl || "");
        setIpWhitelist(Array.isArray(data.ipWhitelist) ? data.ipWhitelist.join(", ") : data.ipWhitelist || "");
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [currentUser?.uid]);

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const ips = ipWhitelist
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/user/developer-keys/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uid: currentUser?.uid,
          webhookUrl: webhookUrl.trim(),
          ipWhitelist: ips,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Developer webhook & IP settings saved successfully." });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save settings." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Network error saving developer settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleRotateKey = async () => {
    setRotating(true);
    setShowRotateConfirm(false);
    setFeedback(null);
    try {
      const res = await fetch("/api/user/developer-keys/rotate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uid: currentUser?.uid,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setApiKey(data.apiKey);
        setWebhookSecret(data.webhookSecret || webhookSecret);
        setShowKey(true);
        setFeedback({
          type: "success",
          message: "API Key successfully rotated! Please update your active server integrations immediately.",
        });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to rotate API Key." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Network error rotating API Key." });
    } finally {
      setRotating(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setFeedback({ type: "error", message: "Please enter a valid Webhook URL first." });
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch("/api/user/developer-keys/test-webhook", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ uid: currentUser?.uid, webhookUrl }),
      });
      const data = await res.json();
      setWebhookTestResult({
        ok: data.success,
        message: data.message || (data.success ? "Webhook endpoint accepted ping event." : data.error || "Failed"),
      });
    } catch (err: any) {
      setWebhookTestResult({
        ok: false,
        message: "Webhook test failed: " + (err?.message || "Could not reach endpoint"),
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2D5C] to-[#1E40AF] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold mb-2">
            <Terminal className="h-3.5 w-3.5" />
            <span>Developer Core Rails</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black">Developer API Keys &amp; Webhooks</h2>
          <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
            Integrate NIN/BVN identity validation, instant VTU airtime/data vending, and electricity meter bill recharge directly into your software products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onNavigateDocs) {
                onNavigateDocs();
              } else {
                window.dispatchEvent(new CustomEvent("navigate_view", { detail: "PUBLIC_API_DOCS" }));
              }
            }}
            className="px-3.5 py-2 bg-white text-[#0F2D5C] hover:bg-slate-100 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Code2 className="h-4 w-4" />
            <span>Interactive Docs</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/openapi.json", "smartlink-openapi.json")}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileCode className="h-4 w-4" />
            <span>OpenAPI Spec</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile("/api/v1/postman.json", "smartlink-postman-collection.json")}
            className="px-3.5 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold text-xs rounded-xl border border-amber-400/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-amber-300" />
            <span>Postman</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Live API Key Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F2D5C]/10 text-[#0F2D5C] flex items-center justify-center font-bold">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">Live Secret Key</h3>
              <p className="text-[11px] text-[#64748B]">
                Pass this key in HTTP headers: <code className="text-[#0F2D5C] font-mono">Authorization: Bearer sk_live_...</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRotateConfirm(true)}
            disabled={rotating}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
            <span>Roll API Key</span>
          </button>
        </div>

        {/* API Key Box */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              readOnly
              value={apiKey || (loading ? "Generating your live developer key..." : "")}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#0F172A] px-3.5 py-2.5 pr-24 rounded-xl focus:outline-none select-all font-semibold"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-[#64748B] hover:text-[#0F2D5C] transition-colors rounded-lg cursor-pointer"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(apiKey, "api_key")}
                className="p-1.5 bg-[#0F2D5C] text-white hover:bg-[#17407E] transition-colors rounded-lg flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Copy API key"
              >
                {copiedField === "api_key" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>Keep this key confidential. Never embed your live secret key in client-side HTML or public GitHub repositories.</span>
          </div>
        </div>
      </div>

      {/* 2. Webhooks & Callback Configuration Card */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Webhook className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">Webhook Callbacks</h3>
              <p className="text-[11px] text-[#64748B]">
                Receive instant HTTPS notifications when verifications finish or virtual account deposits land.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Webhook URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
              <span>Webhook Endpoint URL</span>
              <span className="text-[10px] text-[#64748B] font-normal">Must be HTTPS</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourdomain.com/api/webhooks/smartlink"
                className="flex-1 bg-white border border-[#CBD5E1] text-xs px-3.5 py-2.5 rounded-xl font-mono text-[#0F172A] focus:outline-none focus:border-[#0F2D5C]"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook || !webhookUrl}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#334155] font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className={`h-3.5 w-3.5 ${testingWebhook ? "animate-pulse" : ""}`} />
                <span>Test Webhook</span>
              </button>
            </div>

            {webhookTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  webhookTestResult.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                {webhookTestResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>{webhookTestResult.message}</span>
              </div>
            )}
          </div>

          {/* Webhook Secret */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#334155]">
              Webhook Signature Secret (HMAC-SHA512)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={webhookSecret || "whsec_..."}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#0F172A] px-3.5 py-2.5 pr-20 rounded-xl focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookSecret, "wh_secret")}
                className="absolute right-2 p-1.5 bg-slate-200 hover:bg-slate-300 text-[#1E293B] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedField === "wh_secret" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[10px] text-[#64748B]">
              Every callback includes an <code className="text-[#0F2D5C]">X-SmartLink-Signature</code> header. Hash the request body with this secret to verify authenticity.
            </p>
          </div>

          {/* IP Whitelist */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
              <span>Server IP Whitelisting (Optional)</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Recommended for High-Volume Nodes</span>
            </label>
            <input
              type="text"
              value={ipWhitelist}
              onChange={(e) => setIpWhitelist(e.target.value)}
              placeholder="e.g. 102.89.34.12, 197.210.45.67"
              className="w-full bg-white border border-[#CBD5E1] text-xs px-3.5 py-2.5 rounded-xl font-mono text-[#0F172A] focus:outline-none focus:border-[#0F2D5C]"
            />
            <p className="text-[10px] text-[#64748B]">
              Comma-separated IPv4 addresses. When set, requests from any other IP address will be blocked immediately.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#0F2D5C] hover:bg-[#17407E] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>Save Developer Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Key Rotation */}
      {showRotateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Rotate Your API Key?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rolling your API key will immediately invalidate your current active key. Any production servers or automated scripts using the old key will begin failing until updated.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRotateConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRotateKey}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-600/30"
              >
                Confirm &amp; Roll Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperApiKeysSection;
