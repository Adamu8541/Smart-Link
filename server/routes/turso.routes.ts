/**
 * SMART LINK NG — Turso Administrative & Diagnostic Routes (Phase 5)
 * Allows Super Admin to inspect Turso connection status, verify schema tables,
 * and test libSQL connectivity safely.
 * 
 * ZERO TOLERANCE SECURITY:
 * - Strictly guarded by `requireAdmin` / `requireSuperAdmin`.
 * - Never returns raw database credentials or auth tokens to client.
 */

import express from "express";
import { readDB, writeDB } from "../db";
import { requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { testTursoConnection } from "../turso/client";
import { initializeTursoSchema, TURSO_TABLES } from "../turso/schema";
import { executeTurso } from "../turso/client";
import { TursoMigrator } from "../turso/migrator";
import { StorageToTursoMigrationService } from "../turso/migrationService";
import { AuditLogRepository } from "../turso/repositories";

const router = express.Router();

/**
 * GET /api/admin/turso/status
 * Check Turso database connection and return sanitized connectivity info.
 */
router.get("/api/admin/turso/status", requireAdmin, async (req, res) => {
  try {
    const conn = await testTursoConnection();
    
    // Retrieve table list if connected
    let tables: string[] = [];
    if (conn.ok) {
      const tableRes = await executeTurso(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
      );
      tables = tableRes.rows.map((r: any) => String(r.name));
    }

    res.json({
      success: conn.ok,
      connected: conn.ok,
      isLocal: conn.isLocal,
      databaseEndpoint: conn.url,
      tablesCount: tables.length,
      definedTables: Object.values(TURSO_TABLES),
      activeTables: tables,
      error: conn.error,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: err.message || "Failed to inspect Turso database status",
    });
  }
});

/**
 * GET /api/admin/turso/migrations
 * Inspect version-controlled database migrations status.
 */
router.get("/api/admin/turso/migrations", requireAdmin, async (req, res) => {
  try {
    const status = await TursoMigrator.getMigrationStatus();
    res.json({
      success: true,
      migrations: status,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve migration status",
    });
  }
});

/**
 * POST /api/admin/turso/migrations/run
 * Runs all pending migrations in order.
 */
router.post("/api/admin/turso/migrations/run", requireSuperAdmin, async (req, res) => {
  try {
    const result = await TursoMigrator.runPendingMigrations();
    if (result.errors) {
      return res.status(500).json({
        success: false,
        error: result.errors,
      });
    }

    res.json({
      success: true,
      appliedCount: result.appliedCount,
      appliedMigrations: result.appliedMigrations,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed running migrations",
    });
  }
});

/**
 * POST /api/admin/turso/init-schema
 * Initializes or verifies the normalized relational schema on Turso.
 */
router.post("/api/admin/turso/init-schema", requireSuperAdmin, async (req, res) => {
  try {
    const initResult = await initializeTursoSchema();
    if (!initResult.success) {
      return res.status(500).json({
        success: false,
        error: initResult.error || "Failed to initialize Turso schema",
      });
    }

    res.json({
      success: true,
      message: "Turso relational schema verified and initialized successfully.",
      tablesCreated: initResult.tablesCreated,
      migrationsApplied: initResult.migrationsApplied,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Schema initialization error",
    });
  }
});

/**
 * POST /api/admin/turso/migrate-storage
 * Runs safe, idempotent data migration from Storage to Turso.
 */
router.post("/api/admin/turso/migrate-storage", requireSuperAdmin, async (req, res) => {
  try {
    const result = await StorageToTursoMigrationService.runMigration();
    res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed running Storage to Turso migration",
    });
  }
});

/**
 * GET /api/admin/turso/migration-verification
 * Cross-checks counts, financial balances, relationships, and duplicate detection.
 */
router.get("/api/admin/turso/migration-verification", requireAdmin, async (req, res) => {
  try {
    const report = await StorageToTursoMigrationService.verifyMigration();
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to generate verification report",
    });
  }
});

/**
 * GET /api/admin/activity-logs
 * Retrieves real-time activity and audit logs directly from Turso database.
 */
router.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
  try {
    const { userId, adminEmail, status, resourceType, search, limit, offset } = req.query;

    const result = await AuditLogRepository.listLogs({
      userId: userId as string,
      adminEmail: adminEmail as string,
      status: status as string,
      resourceType: resourceType as string,
      search: search as string,
      limit: limit ? parseInt(String(limit), 10) : 100,
      offset: offset ? parseInt(String(offset), 10) : 0,
    });

    const normalizedLogs = (result.logs || []).map((log: any) => {
      const rawDate = log.created_at || log.createdAt || log.timestamp || new Date().toISOString();
      return {
        ...log,
        id: log.id || log.log_id,
        created_at: rawDate,
      };
    });

    res.json({
      success: true,
      logs: normalizedLogs,
      totalCount: result.total,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve activity logs from Turso",
    });
  }
});

/**
 * DELETE /api/admin/activity-logs/:id or POST /api/admin/activity-logs/delete
 * Permanently deletes a single activity log record by ID from Turso SQL database and db.json memory arrays.
 */
const handleDeleteSingleLogRoute = async (req: express.Request, res: express.Response) => {
  try {
    const id = String(req.params.id || req.body.id || req.body.logId || req.body.log_id || "").trim();
    if (!id) {
      return res.status(400).json({ success: false, error: "Log ID is required." });
    }

    // 1. Delete from Turso audit_logs table
    await AuditLogRepository.deleteLogById(id);

    // 2. Clear from db.json memory DB fallback arrays
    const db = readDB();
    if (db.auditLogs && Array.isArray(db.auditLogs)) {
      db.auditLogs = db.auditLogs.filter((l: any) => l.id !== id && l.log_id !== id && l.logId !== id);
    }
    if (db.activityLogs && Array.isArray(db.activityLogs)) {
      db.activityLogs = db.activityLogs.filter((l: any) => l.id !== id && l.log_id !== id && l.logId !== id && l.activityId !== id);
    }
    if (db.admin_user_actions && Array.isArray(db.admin_user_actions)) {
      db.admin_user_actions = db.admin_user_actions.filter((l: any) => l.id !== id && l.log_id !== id);
    }
    writeDB(db);

    res.json({
      success: true,
      message: `Activity log record '${id}' was deleted successfully from Turso and db.json.`,
      id,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete log entry from Turso database",
    });
  }
};

router.delete("/api/admin/activity-logs/:id", requireAdmin, handleDeleteSingleLogRoute);
router.post("/api/admin/activity-logs/delete", requireAdmin, handleDeleteSingleLogRoute);

/**
 * POST /api/admin/activity-logs/purge
 * Permanently deletes activity logs from Turso based on period retention (Daily, Weekly, Monthly, All Failed, or All).
 */
router.post("/api/admin/activity-logs/purge", requireAdmin, async (req, res) => {
  try {
    const { period } = req.body;
    const admin = (req as any).admin;
    const adminEmail = admin?.email || "admin@smartlink.ng";
    const adminUid = (req as any).authenticatedUid || admin?.uid || "ADMIN";

    if (!period || !["1_DAY", "7_DAYS", "30_DAYS", "ALL_FAILED", "ALL"].includes(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid retention period. Allowed values: '1_DAY', '7_DAYS', '30_DAYS', 'ALL_FAILED', 'ALL'.",
      });
    }

    const purgeResult = await AuditLogRepository.purgeLogs(period);

    // Also purge from memory DB fallback arrays
    const db = readDB();
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const filterMemoryArray = (arr: any[]) => {
      if (!Array.isArray(arr)) return [];
      if (period === "ALL") return [];
      if (period === "ALL_FAILED") {
        return arr.filter((l: any) => l.status !== "FAILURE" && l.status !== "FAILED");
      }
      let days = 1;
      if (period === "7_DAYS") days = 7;
      if (period === "30_DAYS") days = 30;
      const cutoff = nowMs - days * oneDayMs;
      return arr.filter((l: any) => {
        const d = new Date(l.created_at || l.createdAt || l.timestamp || 0).getTime();
        return d >= cutoff;
      });
    };

    db.auditLogs = filterMemoryArray(db.auditLogs);
    db.activityLogs = filterMemoryArray(db.activityLogs);
    db.admin_user_actions = filterMemoryArray(db.admin_user_actions);
    writeDB(db);

    // Record audit entry in Turso documenting the log purge action
    await AuditLogRepository.recordLog({
      admin_uid: adminUid,
      admin_email: adminEmail,
      admin_role: admin?.role || "ADMIN",
      action: "PURGE_ACTIVITY_LOGS",
      resource_type: "SYSTEM_LOGS",
      status: "SUCCESS",
      details: `Admin ${adminEmail} executed log retention purge for period '${period}'. Purged ${purgeResult.purgedCount} log entries from Turso.`,
    });

    res.json({
      success: true,
      message: purgeResult.message,
      purgedCount: purgeResult.purgedCount,
      period,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute log purge on Turso database",
    });
  }
});

export default router;
