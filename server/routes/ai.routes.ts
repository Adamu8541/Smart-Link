import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { readDB, writeDB, initializeDB, DB_DIR, DB_FILE, UPLOADS_DIR, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, hashPassword, safeCompareHash, generateSalt, isMaskedValue } from "../db";
import { verifyUserOrAdminSession } from "../middleware/auth";
import { isMaintenanceModeActive, getMaintenanceDetails, getValueByJsonPath, seedModule7SettingsIfEmpty, sanitizePublicSettings } from "../middleware/maintenance";
import { getAI } from "../services/ai";
import { 
  DEFAULT_SERVICES_CATALOG, 
  seedDefaultServicesCatalogIfEmpty, 
  seedDefaultUsersIfEmpty, 
  seedDefaultTransactionsIfEmpty, 
  recordAdminUserAction, 
  getOrCreateUserVirtualAccount, 
  resolveVtuPlanAndPricing 
} from "../services/sharedHelpers";
import { ServerWalletEngine } from "../../src/services/serverWalletEngine";
import { APIProviderManager, DEFAULT_PROVIDERS } from "../../src/services/apiProviderManager";
import { ProviderExecutor, verifyWebhookSignature } from "../../src/services/providerExecutor";
import { adminAuthService, ADMIN_ROLES_CONFIG } from "../../src/services/adminAuthService";
import { AutomaticWalletFundingEngine } from "../../src/services/automaticWalletFundingEngine";
import { PaymentVerificationReconciliationEngine } from "../../src/services/paymentVerificationReconciliationEngine";
import { getActiveProviderAndAdapter, getAdapterForProvider } from "../../src/services/providerGateway";
import { AspfiyAdapter } from "../../src/services/providers/aspfiyAdapter";
import { AgentHubAdapter } from "../../src/services/providers/agenthubAdapter";
import { NINTrustAdapter } from "../../src/services/providers/nintrustAdapter";
import { MultiGatewayRoutingEngine } from "../../src/services/multiGatewayRoutingEngine";
import { syncFromFirestore, syncToFirestore } from "../../src/services/settingsStore";
import { loadFirestoreDb, syncDbToFirestore, saveDocToFirestore } from "../../src/services/firestoreStore";
import * as usersStore from "../../src/services/usersStore";
import * as walletsStore from "../../src/services/walletsStore";
import * as securityStore from "../../src/services/securityStore";
import * as notificationsStore from "../../src/services/notificationsStore";
import { getAuth } from "firebase-admin/auth";
import { getAdminFirestore } from "../../src/services/firebaseAdmin";


const router = express.Router();
const app = router;

app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      text: "Hello! I am Smart Link's AI assistant. To enable full real-time automated intelligence, please ensure your GEMINI_API_KEY is configured in your secrets. In the meantime, I am ready to guide you on all things related to NIN, CAC registration, and VTU portal options.",
    });
  }

  try {
    const formattedHistory = (history || [])
      .map((h: any) => {
        const textVal = h.text || h.content || "";
        return {
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: textVal }],
        };
      })
      .filter((h: any) => h.parts[0].text.trim().length > 0);

    // Setup systemic context
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are the Lead Digital Officer & AI Customer Assistant of Smart Link Computer Business based in Nigeria.
        Your brand is Nigeria's premier elite technology hub, offering:
        1. E-government & KYC Identity (NIN Enrollment, NIN Slip printing, BVN Linking, NIMC, biometric validation).
        2. CAC Corporate Business Filing (Business registration, NGO/Church incorporate, SCUML).
        3. Scratch Cards (JAMB, WAEC, NECO tokens) & FinTech VTU systems (Airtime, electricity).
        4. Advanced ICT training, networking, Cybersecurity, and cloud migration.
        5. A multi-vendor digital services marketplace where third-party agents upload services and Smart Link charges automated commissions.
        
        Answer professionally, warmly, and confidently. Speak in Nigerian business context when helpful (mentioning Naira, NIMC, CAC Abuja, Lagos, etc.).`,
      },
    });

    // Feed custom state history if available, else send straight message
    let responseText = "";
    if (formattedHistory.length > 0) {
      // Recreate chat instance if possible
      const lastMsg = message;
      const resVal = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...formattedHistory,
          { role: "user", parts: [{ text: lastMsg }] }
        ],
      });
      responseText = resVal.text || "I apologize, I could not understand the input.";
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
      });
      responseText = response.text || "I apologize, I could not understand the input.";
    }

    res.json({ text: responseText });
  } catch (err: any) {
    console.error("AI Chatbot failure", err);
    res.status(500).json({ error: "AI Assistant failed to generate content." });
  }
});

// AI Advisor Tool
app.post("/api/ai/advisor", async (req, res) => {
  const { businessType, location, budget, query } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      text: "### Smart Link AI Business Advisor\n\nTo get full real-time business modeling and customized Nigerian Corporate Law advice, please configure your Google Gemini API key.\n\n* **Compliance Suggestion**: Register a Limited Liability Company (LLC) rather than just a Business Name if you are planning to deal with government ministries.\n* **Capital**: ₦50,000 to ₦200,000 budget is excellent for initiating a smart agro-allied retail venture.",
    });
  }

  try {
    const prompt = `You are a world-class Business Strategy Expert, Nigeria CAC Corporate Law Advisor, and FinTech product architect at Smart Link Computer Business.
    The client is seeking customized business advice for a venture:
    - **Venture Type**: ${businessType}
    - **Location**: ${location} (primarily Nigeria context)
    - **Budget / Capital**: ₦${budget}
    - **Specific Question**: ${query}

    Provide an elite, detailed, and visually structured roadmap with markdown. Explain the legal CAC filing requirements, tax incentives (TIN registration with FIRS), VTU/telecom micro-sales, local target marketing, and how Smart Link's ICT platform can automate their workflows. Make it look professional and highly encouraging.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error("AI Advisor error", err);
    res.status(500).json({ error: "AI Advisor failed." });
  }
});

// AI Document OCR Analyzer
app.post("/api/ai/ocr", async (req, res) => {
  const { base64Data, mimeType, docType } = req.body;
  const ai = getAI();

  if (!base64Data || typeof base64Data !== "string" || base64Data.trim() === "") {
    return res.status(400).json({ error: "Invalid or empty image file data supplied." });
  }

  if (!ai) {
    return res.json({
      result: {
        extractedText: "OCR Extracted Text: REVENUE MOBILIZATION AND ALLOCATION BOARD, NIGERIA. Serial No: GMB-90812-A.",
        documentType: docType || "National Passport",
        confidence: 0.95,
        extractedFields: {
          "Serial Number": "GMB-90812-A",
          "Issuer": "Federal Republic of Nigeria",
          "Match Status": "Verified Profile",
        },
      },
    });
  }

  try {
    // Process image part for Gemini multimodal
    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const prompt = `You are an elite automated OCR extraction system at Smart Link Computer Business.
    You are verifying a document of type: ${docType || "Government Issued ID / Certification"}.
    Analyze this image and extract all text and structured fields.
    Return exactly a JSON object conforming to this schema (do not wrap in markdown, just return the raw JSON):
    {
      "extractedText": "all continuous extracted lines",
      "documentType": "${docType}",
      "confidence": 0.98,
      "extractedFields": {
        "Full Name": "extracted value",
        "Document Number": "extracted ID",
        "Expiry Date": "extracted date or N/A",
        "Place of Issue": "State/Nigeria or N/A"
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [filePart, { text: prompt }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ result: parsed });
  } catch (err) {
    console.error("OCR API error", err);
    res.status(500).json({ error: "Failed to extract text from document." });
  }
});

// AI Quote & Invoice Generator
app.post("/api/ai/generator", async (req, res) => {
  const { type, clientName, clientEmail, items, notes } = req.body;
  const ai = getAI();

  const id = (type === "QUOTE" ? "QT-" : "INV-") + Math.floor(1000 + Math.random() * 9000);
  const subtotal = items.reduce((sum: number, it: any) => sum + (it.qty * it.unitPrice), 0);
  const vat = Math.round(subtotal * 0.075 * 100) / 100; // 7.5% Nigerian VAT
  const total = subtotal + vat;

  let adviceMessage = "Smart Link Automated Document.";
  if (ai) {
    try {
      const prompt = `Generate a short business advisory note (2 paragraphs max) that should go onto a professional ${type} generated by Smart Link Computer Business for client ${clientName}. 
      The items are: ${JSON.stringify(items)}. The total is ₦${total.toLocaleString()}.
      The note should be written in a professional tone, advising on payment terms (VAT 7.5% included) and thanking them.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      adviceMessage = response.text || adviceMessage;
    } catch (err) {
      console.error("AI Document Advisor note failed", err);
    }
  }

  res.json({
    id,
    clientName,
    clientEmail,
    items,
    subtotal,
    vat,
    total,
    notes: notes || adviceMessage,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 24 * 7).toISOString(), // 7 days expiration
  });
});

// 9. CLOUD STORAGE & BACKEND CLOUD FUNCTIONS ENDPOINTS

// 9.1 Cloud Storage Upload


export default router;
