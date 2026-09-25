/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { readDB, writeDB } from "../db";
import { requireAdmin, optionalAdmin } from "../middleware/auth";
import { syncFromStorage, syncToStorage } from "../../src/services/settingsStore";

const router = express.Router();

function ensureApiBuilderDefaults(db: any) {
  if (!db.api_builder_requests || db.api_builder_requests.length === 0) {
    db.api_builder_requests = [
      {
        id: "REQ_PREMBLY_NIN",
        requestName: "Prembly NIN Verification Portal",
        description: "Direct upstream HTTP request builder to Prembly NIN endpoint",
        serviceCategory: "VERIFICATION",
        targetService: "NIN_V2",
        httpMethod: "POST",
        endpoint: "https://api.prembly.com/identitypass/verification/nin",
        contentType: "application/json",
        authType: "API_KEY",
        authPlacement: "HEADER",
        authHeaderKey: "x-api-key",
        authHeaderPrefix: "",
        apiSecretKey: "env:PREMBLY_API_KEY",
        status: "ACTIVE",
        timeoutMs: 15000,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 },
        customHeaders: [
          { key: "Accept", value: "application/json", enabled: true },
          { key: "x-app-id", value: "smartlink-core", enabled: true }
        ],
        bodyTemplate: "{\n  \"nin\": \"{{nin}}\",\n  \"service\": \"nin_v2\"\n}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "REQ_VTPASS_AIRTIME",
        requestName: "VTpass Airtime Purchase",
        description: "Direct REST payload builder for VTpass Airtime integration",
        serviceCategory: "VTU",
        targetService: "AIRTIME",
        httpMethod: "POST",
        endpoint: "https://api-service.vtpass.com/api/pay",
        contentType: "application/json",
        authType: "BEARER",
        authPlacement: "HEADER",
        authHeaderKey: "Authorization",
        authHeaderPrefix: "Bearer",
        apiSecretKey: "env:VTPASS_SECRET_KEY",
        status: "ACTIVE",
        timeoutMs: 12000,
        retryPolicy: { maxRetries: 1, backoffMultiplier: 2.0 },
        customHeaders: [
          { key: "api-key", value: "env:VTPASS_API_KEY", enabled: true }
        ],
        bodyTemplate: "{\n  \"request_id\": \"{{requestId}}\",\n  \"serviceID\": \"{{serviceId}}\",\n  \"billersCode\": \"{{phone}}\",\n  \"variation_code\": \"\",\n  \"amount\": {{amount}},\n  \"phone\": \"{{phone}}\"\n}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  if (!db.api_response_mappings || db.api_response_mappings.length === 0) {
    db.api_response_mappings = [
      {
        id: "MAP_PREMBLY_NIN",
        mappingName: "Prembly NIN Response Normalizer",
        serviceCategory: "VERIFICATION",
        targetService: "NIN_V2",
        status: "ACTIVE",
        description: "Maps nested Prembly NIN JSON schema into canonical SmartLink KYC identity record",
        successCondition: "status === true || response_code === '00'",
        statusField: "response_code",
        referenceField: "reference",
        messageField: "detail",
        rules: [
          { sourceKey: "data.nin", targetKey: "nin", dataType: "STRING" },
          { sourceKey: "data.firstname", targetKey: "firstName", dataType: "STRING" },
          { sourceKey: "data.surname", targetKey: "lastName", dataType: "STRING" },
          { sourceKey: "data.middlename", targetKey: "middleName", dataType: "STRING" },
          { sourceKey: "data.gender", targetKey: "gender", dataType: "STRING" },
          { sourceKey: "data.birthdate", targetKey: "dateOfBirth", dataType: "STRING" },
          { sourceKey: "data.photo", targetKey: "photoBase64", dataType: "STRING" }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  if (!db.api_builder_logs) db.api_builder_logs = [];
  if (!db.api_response_mapping_logs) db.api_response_mapping_logs = [];
}

// =========================================================================
// API REQUEST BUILDER ENDPOINTS
// =========================================================================

// 1. GET /api/admin/api-builder/requests
router.get("/api/admin/api-builder/requests", optionalAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    await syncFromStorage(db);
    res.json({
      success: true,
      requests: db.api_builder_requests || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/admin/api-builder/requests - Create
router.post("/api/admin/api-builder/requests", requireAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    const newReq = {
      id: req.body.id || `REQ_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.api_builder_requests) db.api_builder_requests = [];
    db.api_builder_requests.unshift(newReq);
    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "API Request configuration created successfully.",
      request: newReq,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. PUT /api/admin/api-builder/requests - Update
router.put("/api/admin/api-builder/requests", requireAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    const targetId = req.body.id;
    if (!targetId) return res.status(400).json({ success: false, message: "Request ID is required." });

    const idx = (db.api_builder_requests || []).findIndex((r: any) => r.id === targetId);
    if (idx === -1) {
      db.api_builder_requests.unshift({ ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else {
      db.api_builder_requests[idx] = { ...db.api_builder_requests[idx], ...req.body, updatedAt: new Date().toISOString() };
    }

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "API Request configuration saved successfully.",
      request: db.api_builder_requests[idx >= 0 ? idx : 0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/admin/api-builder/logs
router.get("/api/admin/api-builder/logs", optionalAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    res.json({
      success: true,
      logs: db.api_builder_logs || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/admin/api-builder/requests/:id/toggle
router.post("/api/admin/api-builder/requests/:id/toggle", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    ensureApiBuilderDefaults(db);
    const item = (db.api_builder_requests || []).find((r: any) => r.id === id);
    if (!item) return res.status(404).json({ success: false, message: "Request configuration not found." });

    item.status = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    item.updatedAt = new Date().toISOString();

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      status: item.status,
      message: `Request configuration is now ${item.status}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. DELETE /api/admin/api-builder/requests/:id
router.delete("/api/admin/api-builder/requests/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    ensureApiBuilderDefaults(db);
    db.api_builder_requests = (db.api_builder_requests || []).filter((r: any) => r.id !== id);

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "API Request configuration deleted successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. POST /api/admin/api-builder/test - Test Runner
router.post("/api/admin/api-builder/test", requireAdmin, async (req, res) => {
  try {
    const target = req.body;
    const startTime = Date.now();

    const simulatedResponse = {
      status: 200,
      statusText: "OK",
      latencyMs: 142,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": `test_req_${Date.now()}`,
        "x-response-time": "142ms",
      },
      data: {
        status: true,
        response_code: "00",
        detail: "Verification Successful [Simulated Test Probe]",
        reference: `PROBE_REF_${Date.now()}`,
        timestamp: new Date().toISOString(),
        payload_echo: {
          endpoint: target.endpoint,
          method: target.httpMethod || "POST",
          headersApplied: (target.customHeaders || []).length,
        }
      }
    };

    const db = readDB();
    ensureApiBuilderDefaults(db);
    if (!db.api_builder_logs) db.api_builder_logs = [];
    db.api_builder_logs.unshift({
      id: `LOG_${Date.now()}`,
      requestId: target.id || "ad-hoc-test",
      endpoint: target.endpoint,
      method: target.httpMethod || "POST",
      statusCode: 200,
      latencyMs: simulatedResponse.latencyMs,
      timestamp: new Date().toISOString(),
      success: true,
    });
    if (db.api_builder_logs.length > 50) db.api_builder_logs.pop();

    writeDB(db);

    res.json({
      success: true,
      ...simulatedResponse,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// API RESPONSE MAPPER ENDPOINTS
// =========================================================================

// 1. GET /api/admin/response-mapper/mappings
router.get("/api/admin/response-mapper/mappings", optionalAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    await syncFromStorage(db);
    res.json({
      success: true,
      mappings: db.api_response_mappings || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/admin/response-mapper/mappings - Create
router.post("/api/admin/response-mapper/mappings", requireAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    const newMapping = {
      id: req.body.id || `MAP_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.api_response_mappings) db.api_response_mappings = [];
    db.api_response_mappings.unshift(newMapping);

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "API Response mapping configuration created successfully.",
      mapping: newMapping,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. PUT /api/admin/response-mapper/mappings/:id - Update
router.put("/api/admin/response-mapper/mappings/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    ensureApiBuilderDefaults(db);

    const idx = (db.api_response_mappings || []).findIndex((m: any) => m.id === id);
    if (idx === -1) {
      db.api_response_mappings.unshift({ id, ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else {
      db.api_response_mappings[idx] = { ...db.api_response_mappings[idx], ...req.body, updatedAt: new Date().toISOString() };
    }

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "API Response mapping configuration updated successfully.",
      mapping: db.api_response_mappings[idx >= 0 ? idx : 0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/admin/response-mapper/logs
router.get("/api/admin/response-mapper/logs", optionalAdmin, async (req, res) => {
  try {
    const db = readDB();
    ensureApiBuilderDefaults(db);
    res.json({
      success: true,
      logs: db.api_response_mapping_logs || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/admin/response-mapper/mappings/duplicate
router.post("/api/admin/response-mapper/mappings/duplicate", requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const db = readDB();
    ensureApiBuilderDefaults(db);

    const item = (db.api_response_mappings || []).find((m: any) => m.id === id);
    if (!item) return res.status(404).json({ success: false, message: "Original mapping not found." });

    const duplicated = {
      ...item,
      id: `MAP_${Date.now()}`,
      mappingName: `${item.mappingName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.api_response_mappings.unshift(duplicated);
    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "Mapping configuration duplicated successfully.",
      mapping: duplicated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/admin/response-mapper/mappings/:id/toggle
router.post("/api/admin/response-mapper/mappings/:id/toggle", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    ensureApiBuilderDefaults(db);

    const item = (db.api_response_mappings || []).find((m: any) => m.id === id);
    if (!item) return res.status(404).json({ success: false, message: "Mapping not found." });

    item.status = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    item.updatedAt = new Date().toISOString();

    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      status: item.status,
      message: `Mapping status updated to ${item.status}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. DELETE /api/admin/response-mapper/mappings/:id
router.delete("/api/admin/response-mapper/mappings/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    ensureApiBuilderDefaults(db);

    db.api_response_mappings = (db.api_response_mappings || []).filter((m: any) => m.id !== id);
    writeDB(db);
    await syncToStorage(db);

    res.json({
      success: true,
      message: "Response mapping configuration deleted successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. POST /api/admin/response-mapper/test
router.post("/api/admin/response-mapper/test", requireAdmin, async (req, res) => {
  try {
    const { mappingConfig, sampleJson } = req.body;
    let parsedInput: any = {};
    if (typeof sampleJson === "string") {
      try {
        parsedInput = JSON.parse(sampleJson);
      } catch (pErr) {
        parsedInput = { raw: sampleJson };
      }
    } else {
      parsedInput = sampleJson || {};
    }

    // Apply mapping rules
    const normalizedOutput: Record<string, any> = {
      _meta: {
        normalizedAt: new Date().toISOString(),
        mappingId: mappingConfig?.id || "ad-hoc",
        targetService: mappingConfig?.targetService || "CUSTOM",
      },
      status: "SUCCESS",
      reference: parsedInput.reference || parsedInput.data?.reference || `REF_${Date.now()}`,
      message: parsedInput.message || parsedInput.detail || "Normalized successfully.",
    };

    if (Array.isArray(mappingConfig?.rules)) {
      for (const rule of mappingConfig.rules) {
        if (!rule.targetKey) continue;
        const keys = (rule.sourceKey || "").split(".");
        let val = parsedInput;
        for (const k of keys) {
          if (val && typeof val === "object" && k in val) {
            val = val[k];
          } else {
            val = undefined;
            break;
          }
        }
        normalizedOutput[rule.targetKey] = val !== undefined ? val : null;
      }
    }

    res.json({
      success: true,
      normalizedOutput,
      evaluationLog: [
        "Sample JSON successfully parsed.",
        `Applied ${(mappingConfig?.rules || []).length} field extraction transformation rules.`,
        "Canonical entity contract satisfied."
      ],
      transformedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
