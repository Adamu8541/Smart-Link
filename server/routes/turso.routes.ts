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
import { requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { testTursoConnection } from "../turso/client";
import { initializeTursoSchema, TURSO_TABLES } from "../turso/schema";
import { executeTurso } from "../turso/client";
import { TursoMigrator } from "../turso/migrator";
import { StorageToTursoMigrationService } from "../turso/migrationService";

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

export default router;
