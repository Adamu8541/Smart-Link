/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  FileSearch,
  Receipt,
  FileCheck,
  Send,
  Upload,
  Clock,
  Printer,
  ChevronRight,
  Database,
  Brain
} from "lucide-react";

interface AIAutomationSuiteProps {
  userEmail?: string;
}

export default function AIAutomationSuite({ userEmail }: AIAutomationSuiteProps) {
  const [activeSubTab, setActiveSubTab] = useState<"OCR" | "DOCS" | "ADVISER">("OCR");

  // --- 1. OCR Tool States ---
  const [ocrDocType, setOcrDocType] = useState("National Passport");
  const [dragActive, setDragActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  // --- 2. Quote/Invoice Generator States ---
  const [docType, setDocType] = useState<"QUOTE" | "INVOICE">("QUOTE");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<{ desc: string; qty: number; unitPrice: number }[]>([
    { desc: "CAC Private Limited Company Filing assistance", qty: 1, unitPrice: 25000 },
    { desc: "Biometric NIN Portal Registration & plastic lamination", qty: 5, unitPrice: 3500 },
  ]);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const [docResult, setDocResult] = useState<any | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // --- 3. Business Advisor States ---
  const [bizType, setBizType] = useState("Agro-Allied Grains Supply");
  const [bizCapital, setBizCapital] = useState("150000");
  const [bizQuery, setBizQuery] = useState("What are the FIRS tax compliance filings and corporate CAC procedures required to supply a central ministry?");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<string | null>(null);

  // --- OCR FILE DRAG / BASE64 ENCODING ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setOcrError(null);
    setOcrResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      triggerOcrAnalyze(base64String, file.type);
    };
    reader.onerror = () => {
      setOcrError("Filing read failure on local document.");
    };
    reader.readAsDataURL(file);
  };

  const triggerOcrAnalyze = async (base64Data: string, mimeType: string) => {
    setOcrLoading(true);
    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data,
          mimeType,
          docType: ocrDocType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR extraction failed");
      setOcrResult(data.result);
    } catch (err: any) {
      setOcrError(err.message || "Failed to analyze document.");
    } finally {
      setOcrLoading(false);
    }
  };

  // --- GENERATE QUOTE / INVOICE ---
  const addItem = () => {
    if (!newItemDesc) return;
    setItems((prev) => [...prev, { desc: newItemDesc, qty: newItemQty, unitPrice: newItemPrice }]);
    setNewItemDesc("");
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    setDocLoading(true);
    try {
      const res = await fetch("/api/ai/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          clientName,
          clientEmail,
          items,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDocLoading(false);
    }
  };

  // --- BUSINESS ADVISOR ---
  const handleQueryAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvisorLoading(true);
    setAdvisorResult(null);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: bizType,
          budget: bizCapital,
          location: "Nigeria",
          query: bizQuery,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdvisorResult(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvisorLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen" id="ai-suite-page-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Block */}
        <div className="p-6 bg-slate-900 rounded-xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-500/15 border border-violet-500/20 text-xs font-mono text-violet-400 font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Automated AI Intelligence Node
            </div>
            <h1 className="text-2xl font-black mt-2">Smart Link AI Automation Suite</h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise-grade cognitive services mapped to West-African corporate frameworks</p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            {[
              { id: "OCR", label: "Identity OCR Scanner", icon: FileSearch },
              { id: "DOCS", label: "Smart Document Generator", icon: Receipt },
              { id: "ADVISER", label: "Nigerian Business Adviser", icon: Brain },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id as any)}
                  id={`btn-suite-tab-${sub.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeSubTab === sub.id
                      ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tool Render */}

        {/* --- 1. OCR SCANNER TOOL --- */}
        {activeSubTab === "OCR" && (
          <div className="grid lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-5 bg-white border rounded-xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-950">Intelligent Verification & OCR</h3>
                <p className="text-xs text-slate-500 mt-1">Upload National Passports, Driver Licences, or CAC Certificates to auto-extract structured text profiles instantly.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Document Classification</label>
                <select
                  value={ocrDocType}
                  onChange={(e) => setOcrDocType(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-xs bg-white focus:ring-1 focus:ring-violet-500"
                >
                  <option value="National Passport">Nigerian National Passport (Immigration)</option>
                  <option value="Driver Licence">FRSC Nigerian Driver Licence</option>
                  <option value="CAC Certificate">Corporate Affairs Commission Incorporation Document</option>
                  <option value="WAEC Result Sheet">WAEC/NECO Examination Result Sheet</option>
                </select>
              </div>

              {/* Drag-and-drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center space-y-4 transition-colors cursor-pointer ${
                  dragActive ? "border-violet-500 bg-violet-50/50" : "border-slate-300 hover:border-violet-400 bg-slate-50"
                }`}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-700 font-bold">Drag and drop your scanned copy here</p>
                  <p className="text-[10px] text-slate-400 font-mono">PNG, JPG up to 10MB file allocation size</p>
                </div>
                <div className="relative inline-block">
                  <button className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-violet-500 hover:text-slate-950 rounded text-[11px] font-semibold transition-colors">
                    Browse Local System Files
                  </button>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>

              {fileName && (
                <div className="p-3 bg-violet-50 rounded-lg text-xs font-mono text-violet-800 flex justify-between items-center border border-violet-100">
                  <span>Target File: {fileName}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}

              {ocrError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded font-medium">
                  {ocrError}
                </div>
              )}
            </div>

            {/* Results Extraction Sheet */}
            <div className="lg:col-span-7 bg-white border rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                    <Database className="h-4.5 w-4.5 text-violet-500" />
                    Structured Extraction Metadata Output
                  </h3>
                  <p className="text-xs text-slate-500">Processed cognitive output parsed in real-time by Smart Link OCR AI</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  JSON Model Output
                </span>
              </div>

              {ocrLoading ? (
                <div className="py-20 text-center space-y-3">
                  <span className="inline-block h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs text-slate-500 font-mono">Parsing file packets... matching with government credential matrices...</p>
                </div>
              ) : ocrResult ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs text-slate-800 space-y-2 max-h-48 overflow-y-auto">
                    <strong className="text-slate-400 block border-b pb-1 text-[10px] uppercase">RAW EXTRACTED TEXT LINES</strong>
                    <p className="whitespace-pre-wrap font-sans text-xs">{ocrResult.extractedText}</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b">
                          <th className="py-2 px-3">EXTRACTED IDENTITY FIELDS</th>
                          <th className="py-2 px-3">CONFIDENCE VALUE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {Object.entries(ocrResult.extractedFields).map(([key, val]) => (
                          <tr key={key}>
                            <td className="py-2 px-3 text-slate-600 font-semibold">{key}</td>
                            <td className="py-2 px-3 font-bold text-slate-950">{val as string}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="py-2 px-3 text-slate-600 font-semibold">Verification State Accuracy</td>
                          <td className="py-2 px-3 font-bold text-indigo-600">{(ocrResult.confidence * 100).toFixed(1)}% Approved Match</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-3 text-slate-400 border border-dashed rounded-xl">
                  <FileSearch className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-mono">Upload a document on the left panel to trigger secure optical character extraction.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. QUOTE & INVOICE GENERATOR --- */}
        {activeSubTab === "DOCS" && (
          <div className="grid lg:grid-cols-12 gap-8 text-left">
            {/* Input Specifications */}
            <div className="lg:col-span-5 bg-white border rounded-xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950">Professional Document Builder</h3>
                <p className="text-xs text-slate-500 mt-1">Generate beautifully formatted corporate proposals or customer invoices with 7.5% federal VAT auto-calculations.</p>
              </div>

              <form onSubmit={handleGenerateDoc} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType("QUOTE")}
                    className={`py-2 text-xs font-bold rounded border ${
                      docType === "QUOTE" ? "bg-violet-500 text-slate-950 border-violet-500" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Custom Business Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("INVOICE")}
                    className={`py-2 text-xs font-bold rounded border ${
                      docType === "INVOICE" ? "bg-violet-500 text-slate-950 border-violet-500" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Customer Invoice Receipt
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Client / Institution Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. State Ministry of Commerce"
                    className="w-full px-3 py-2 border rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Client Email Address</label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g. ministry@commerce.gm.gov.ng"
                    className="w-full px-3 py-2 border rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                {/* Items Builder Box */}
                <div className="border rounded-lg p-3.5 space-y-3.5 bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block border-b pb-1 uppercase font-bold">ITEMIZED PRODUCT/SERVICE LINE</span>
                  
                  {/* Item Adder Inputs */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="e.g. 10x plastic biometric cards printing"
                      className="w-full px-3 py-1.5 bg-white border rounded text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                        className="px-2 py-1.5 bg-white border rounded text-xs"
                      />
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Price per unit (₦)"
                        className="px-2 py-1.5 bg-white border rounded text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full py-1.5 bg-slate-900 text-white font-semibold rounded text-xs hover:bg-slate-800 transition-colors"
                    >
                      Add Line Item
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-1.5 divide-y max-h-32 overflow-y-auto pt-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700 pt-1.5 font-mono">
                        <span className="truncate max-w-[150px]">{item.desc}</span>
                        <div className="flex items-center gap-2">
                          <span>{item.qty}x ₦{item.unitPrice.toLocaleString()}</span>
                          <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-600 font-sans">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={docLoading || items.length === 0}
                  className="w-full py-2.5 bg-violet-500 hover:bg-violet-600 text-slate-950 font-black rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-violet-500/15"
                >
                  {docLoading ? "Constructing Smart PDF..." : `Generate Official ${docType}`}
                </button>
              </form>
            </div>

            {/* Structured Generated Document Output */}
            <div className="lg:col-span-7 bg-white border rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Printable Executive Document</h3>
                  <p className="text-xs text-slate-500">Includes real-time corporate compliance FIRS 7.5% VAT and Smart Link legal seals</p>
                </div>
                {docResult && (
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs flex items-center gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                )}
              </div>

              {docResult ? (
                /* Beautiful Printable Document Layout */
                <div className="border rounded-lg p-6 space-y-6 bg-slate-50 text-xs font-mono text-slate-800 relative shadow-sm" id="printable-doc-area">
                  <div className="absolute top-4 right-4 h-12 w-12 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-500 flex items-center justify-center animate-pulse">
                    <Brain className="h-6 w-6" />
                  </div>
                  {/* Corporate Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider">SMART LINK COMPUTER BUSINESS</h2>
                      <p className="text-[10px] text-slate-500 font-sans">Corporate Headquarters: No. 12 Biu Road, City Center</p>
                      <p className="text-[10px] text-slate-500 font-sans">Reg. No: RC 1908234 • TIN: 1234567-0001 • Contact: info@smartlink.com.ng</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-black text-slate-950 uppercase">{docResult.id}</h3>
                      <p className="text-[10px] text-slate-500">Date: {new Date(docResult.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans">CLIENT INSTRUCTIONS</span>
                      <p className="font-extrabold text-slate-950 mt-0.5">{docResult.clientName}</p>
                      <p className="text-slate-500 text-[10px]">{docResult.clientEmail}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-sans">REGULATORY DETAILS</span>
                      <p className="font-extrabold text-indigo-600 mt-0.5">VAT REGISTRATION OK</p>
                      <p className="text-slate-500 text-[10px]">Tax Identifier FIRS Verified</p>
                    </div>
                  </div>

                  {/* Items list table */}
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b text-slate-500 font-bold">
                          <th className="py-2 px-3">LINE DESCRIPTION</th>
                          <th className="py-2 px-3 text-center">QUANTITY</th>
                          <th className="py-2 px-3 text-right">UNIT (₦)</th>
                          <th className="py-2 px-3 text-right">NET COST (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {docResult.items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-slate-900">{it.desc}</td>
                            <td className="py-2 px-3 text-center">{it.qty}</td>
                            <td className="py-2 px-3 text-right">₦{it.unitPrice.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-bold">₦{(it.qty * it.unitPrice).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Allocation */}
                  <div className="space-y-1.5 text-right font-mono text-xs max-w-sm ml-auto border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total net expenditure:</span>
                      <strong>₦{docResult.subtotal.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standard FIRS VAT (7.5%):</span>
                      <strong>₦{docResult.vat.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-950 border-t pt-1.5">
                      <span>Total Invoice Amount:</span>
                      <span className="text-indigo-600">₦{docResult.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* AI Advisor generated notes */}
                  <div className="bg-slate-100 rounded-lg p-3 border text-slate-600 text-[10px] italic leading-relaxed text-left font-sans">
                    <strong>Smart Link Compliance Advisor Note:</strong>
                    <p className="mt-1 font-light leading-relaxed">{docResult.notes}</p>
                  </div>
                </div>
              ) : (
                <div className="py-28 text-center space-y-3 text-slate-400 border border-dashed rounded-xl">
                  <Receipt className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-mono">Fill out the invoice or quote details on the left to generate structured corporate sheets.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 3. NIGERIAN BUSINESS ADVISOR --- */}
        {activeSubTab === "ADVISER" && (
          <div className="grid lg:grid-cols-12 gap-8 text-left">
            {/* Input Consulting Forms */}
            <div className="lg:col-span-5 bg-white border rounded-xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950">AI Corporate Advisor & Consultant</h3>
                <p className="text-xs text-slate-500 mt-1">Get precise answers on Nigerian CAC requirements, FIRS tax compliance filings, and state ministry tenders.</p>
              </div>

              <form onSubmit={handleQueryAdvisor} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Scope of Planned Venture</label>
                  <input
                    type="text"
                    required
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value)}
                    placeholder="e.g. Rice Processing Mill / FinTech VTU retail"
                    className="w-full px-3 py-2 border rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Venture Budget / Capital (₦)</label>
                  <input
                    type="number"
                    required
                    value={bizCapital}
                    onChange={(e) => setBizCapital(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 border rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Consultation Enquiry Topic</label>
                  <textarea
                    required
                    value={bizQuery}
                    onChange={(e) => setBizQuery(e.target.value)}
                    placeholder="What specific legal filings or strategic procedures do you wish to know about?"
                    rows={4}
                    className="w-full px-3 py-2 border rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={advisorLoading}
                  className="w-full py-2.5 bg-violet-500 hover:bg-violet-600 text-slate-950 font-black rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/15"
                >
                  <Brain className="h-4 w-4" />
                  {advisorLoading ? "Synthesizing CAC & FIRS files..." : "Initiate Corporate Consultation"}
                </button>
              </form>
            </div>

            {/* Advisor Feedback Roadmaps */}
            <div className="lg:col-span-7 bg-white border rounded-xl p-6 shadow-2xs space-y-6">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-violet-500" />
                    Custom Strategic Advisory Roadmaps
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">Calculated and mapped based on corporate legal requirements and Abuja FCT</p>
                </div>
              </div>

              {advisorLoading ? (
                <div className="py-28 text-center space-y-3">
                  <span className="inline-block h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs text-slate-500 font-mono">Running strategic advisory model... compiling FIRS tax tables...</p>
                </div>
              ) : advisorResult ? (
                <div className="p-5 rounded-lg bg-slate-50 border text-xs leading-relaxed text-left space-y-4 text-slate-800 max-h-[55vh] overflow-y-auto">
                  {/* Markdown structured response */}
                  <div className="prose prose-slate max-w-none">
                    <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{advisorResult}</p>
                  </div>
                </div>
              ) : (
                <div className="py-28 text-center space-y-3 text-slate-400 border border-dashed rounded-xl">
                  <Brain className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-mono">Input your planned capital and query on the left to receive dynamic, AI-powered regulatory advice.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
