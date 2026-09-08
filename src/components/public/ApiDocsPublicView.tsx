/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Code2,
  Terminal,
  KeyRound,
  Webhook,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  BookOpen,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";
import SEOHead from "../landing/SEOHead";
import LandingHeader from "../landing/LandingHeader";
import LandingFooter from "../landing/LandingFooter";

interface ApiDocsPublicViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
  onNavigateHome: () => void;
  onNavigateLegal?: (docId?: string) => void;
}

export const ApiDocsPublicView: React.FC<ApiDocsPublicViewProps> = ({
  onLogin,
  onRegister,
  onGetStarted,
  onNavigateHome,
  onNavigateLegal,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "node" | "python">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const curlExample = `curl -X POST https://smartlinkng.com.ng/api/v1/nin/verify \\
  -H "Authorization: Bearer sk_live_9a8b7c6d5e4f3g2h1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nin": "12345678901",
    "generateSlip": true,
    "format": "standard"
  }'`;

  const nodeExample = `import axios from 'axios';

const response = await axios.post(
  'https://smartlinkng.com.ng/api/v1/nin/verify',
  {
    nin: '12345678901',
    generateSlip: true,
    format: 'standard'
  },
  {
    headers: {
      'Authorization': 'Bearer sk_live_9a8b7c6d5e4f3g2h1',
      'Content-Type': 'application/json'
    }
  }
);

console.log('Verification Status:', response.data.status);
console.log('PDF Slip Download URL:', response.data.slipUrl);`;

  const pythonExample = `import requests

url = "https://smartlinkng.com.ng/api/v1/nin/verify"
headers = {
    "Authorization": "Bearer sk_live_9a8b7c6d5e4f3g2h1",
    "Content-Type": "application/json"
}
payload = {
    "nin": "12345678901",
    "generateSlip": True,
    "format": "standard"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Result:", data)`;

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/nin/verify",
      title: "Verify National Identity Number (NIN)",
      desc: "Validates 11-digit NIN or vNIN, returns verified demographics and generates official PDF slip with QR code.",
      sampleResponse: `{
  "status": "success",
  "code": 200,
  "data": {
    "nin": "12345678901",
    "firstname": "ABUBAKAR",
    "surname": "MUHAMMAD",
    "gender": "M",
    "dob": "1994-05-14",
    "slipUrl": "https://smartlinkng.com.ng/slips/nin_72819201.pdf"
  }
}`,
    },
    {
      method: "POST",
      path: "/api/v1/bvn/verify",
      title: "Validate Bank Verification Number (BVN)",
      desc: "Matches BVN against NIBSS interbank rails, confirming identity, registered phone, and account match status.",
      sampleResponse: `{
  "status": "success",
  "code": 200,
  "data": {
    "bvn": "22334455667",
    "accountName": "Abubakar Muhammad",
    "matchStatus": "MATCH_CONFIRMED"
  }
}`,
    },
    {
      method: "POST",
      path: "/api/v1/vtu/data",
      title: "Disburse SME & Direct Telecom Data",
      desc: "Instantly delivers 30-day mobile data bundles across MTN, Airtel, Glo, and 9mobile with sub-5s delivery.",
      sampleResponse: `{
  "status": "success",
  "code": 200,
  "transactionId": "TXN_DATA_92817281",
  "network": "MTN",
  "plan": "1.0 GB SME",
  "recipient": "08085490982",
  "balanceRemaining": 48250.00
}`,
    },
    {
      method: "POST",
      path: "/api/v1/bills/electricity",
      title: "Recharge Electricity Disco Meter Token",
      desc: "Validates prepaid meter numbers and returns a 20-digit electricity recharge token with VAT receipt.",
      sampleResponse: `{
  "status": "success",
  "code": 200,
  "disco": "IKEDC_PREPAID",
  "meterNumber": "01234567891",
  "customerName": "JOHN DOE",
  "token": "4819-2049-1829-0192-3849",
  "units": "42.8 kWh",
  "amount": 5000.00
}`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B132B] font-sans text-gray-100 antialiased selection:bg-[#F59E0B] selection:text-gray-900">
      <SEOHead
        title="Developer REST API Documentation & Fintech Gateway | Smart Link NG"
        description="Integrate identity verification (NIN, BVN), automated VTU airtime/data vending, and electricity meter bill payments into your fintech applications with SmartLink Nigeria's sub-450ms REST API."
        canonicalUrl="https://smartlinkng.com.ng/api-docs"
      />

      {/* Header */}
      <LandingHeader
        onLogin={onLogin}
        onRegister={onRegister}
        onGetStarted={onGetStarted}
        onNavigateSection={() => onNavigateHome()}
      />

      {/* Hero */}
      <header className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-gray-800 bg-[#0F1C3F] relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
            <Terminal className="h-3.5 w-3.5" />
            <span>SmartLink v1.4 REST API &amp; Webhooks</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl leading-tight">
            High-Performance Identity &amp; VTU REST API Gateway
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
            Build on Nigeria's fastest digital rails. Integrate NIN validation, BVN lookups, automated SME data dispatch, and electricity meter recharge with sub-450ms latency.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              <span>Generate API Keys</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("endpoints-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/15"
            >
              Explore Endpoints
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Quickstart Code Box */}
        <div className="bg-[#111C38] rounded-3xl border border-gray-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Code2 className="h-5 w-5 text-[#F59E0B]" />
                <span>Quickstart Request Example</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Pass your Bearer API key in the Authorization header.
              </p>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-[#0A1024] p-1 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedLanguage("curl")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedLanguage === "curl" ? "bg-[#0F2D5C] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("node")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedLanguage === "node" ? "bg-[#0F2D5C] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Node.js
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("python")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedLanguage === "python" ? "bg-[#0F2D5C] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-[#070B18] rounded-2xl p-4 sm:p-6 font-mono text-xs text-gray-200 overflow-x-auto border border-gray-800/80">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  selectedLanguage === "curl" ? curlExample : selectedLanguage === "node" ? nodeExample : pythonExample,
                  "quickstart"
                )
              }
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer"
              title="Copy Code"
            >
              {copiedSnippet === "quickstart" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            <pre className="whitespace-pre">
              {selectedLanguage === "curl" && curlExample}
              {selectedLanguage === "node" && nodeExample}
              {selectedLanguage === "python" && pythonExample}
            </pre>
          </div>
        </div>

        {/* Endpoints Reference */}
        <div id="endpoints-section" className="space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <h2 className="text-2xl font-black text-white">Core API Endpoints</h2>
            <p className="text-xs text-gray-400 mt-1">
              Standard RESTful JSON endpoints returning consistent HTTP status codes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="bg-[#111C38] rounded-2xl border border-gray-800 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/30">
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">{ep.path}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{ep.title}</span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{ep.desc}</p>

                <div className="bg-[#070B18] rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto border border-gray-800/80">
                  <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 font-sans">
                    Sample JSON Response (200 OK)
                  </div>
                  <pre>{ep.sampleResponse}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks & Security Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111C38] rounded-3xl border border-gray-800 p-6 sm:p-8 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Webhook className="h-5 w-5" />
            </div>
            <h3 className="text-base font-black text-white">Webhook Notifications</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Receive real-time HTTPS callbacks for automated virtual account deposits, token generation status, and verification completions. Callbacks are signed with HMAC-SHA512 headers for tampering validation.
            </p>
          </div>

          <div className="bg-[#111C38] rounded-3xl border border-gray-800 p-6 sm:p-8 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-black text-white">Rate Limits &amp; SLA</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Standard tier allows up to 60 requests per minute with auto-scaling to 600+ req/min for enterprise nodes. Supported by a 99.9% uptime SLA and multi-provider failover switching.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0F2D5C] to-[#1E3A8A] rounded-3xl p-8 sm:p-10 border border-blue-500/30 text-center space-y-4">
          <h3 className="text-2xl font-black text-white">Ready to Start Building?</h3>
          <p className="text-xs sm:text-sm text-gray-200 max-w-xl mx-auto">
            Create an agent account to generate sandbox and live API credentials in under 2 minutes.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-8 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xl inline-flex items-center gap-2"
          >
            <span>Create Developer Account</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </main>

      {/* Footer */}
      <LandingFooter
        onNavigateSection={() => onNavigateHome()}
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigateLegal={onNavigateLegal}
        activeInfoTab={null}
        setActiveInfoTab={() => {}}
      />
    </div>
  );
};

export default ApiDocsPublicView;
