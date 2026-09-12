/**
 * SMART LINK NG — Turso Migration Engine (Phase 5)
 * Version-controlled, idempotent, and transactional database migration manager.
 * 
 * ZERO TOLERANCE:
 * - Tracks applied migrations in the `_migrations` table.
 * - Executes migrations sequentially in transactional blocks.
 * - Prevents partial or corrupted schema states.
 */

import fs from "fs";
import path from "path";
import { getTursoClient, executeTurso } from "./client";

export interface MigrationStatus {
  name: string;
  applied: boolean;
  batch?: number;
  applied_at?: string;
}

export class TursoMigrator {
  /**
   * Initializes the internal migrations tracking table.
   */
  static async initTrackingTable(): Promise<void> {
    const client = getTursoClient();
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  /**
   * Reads all available SQL migration files from the migrations directory.
   */
  static getMigrationFiles(): { name: string; fullPath: string }[] {
    const migrationsDir = path.join(process.cwd(), "server", "turso", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      return [];
    }

    return fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => ({
        name: file,
        fullPath: path.join(migrationsDir, file),
      }));
  }

  /**
   * Returns the list and status of all migrations.
   */
  static async getMigrationStatus(): Promise<MigrationStatus[]> {
    await this.initTrackingTable();
    const files = this.getMigrationFiles();

    const appliedRes = await executeTurso(`SELECT name, batch, applied_at FROM _migrations ORDER BY id ASC;`);
    const appliedMap = new Map<string, { batch: number; applied_at: string }>();

    for (const row of appliedRes.rows) {
      appliedMap.set(String(row.name), {
        batch: Number(row.batch),
        applied_at: String(row.applied_at),
      });
    }

    return files.map((f) => {
      const appliedInfo = appliedMap.get(f.name);
      return {
        name: f.name,
        applied: !!appliedInfo,
        batch: appliedInfo?.batch,
        applied_at: appliedInfo?.applied_at,
      };
    });
  }

  /**
   * Runs all pending migrations in order.
   */
  static async runPendingMigrations(): Promise<{
    appliedCount: number;
    appliedMigrations: string[];
    errors?: string;
  }> {
    await this.initTrackingTable();
    const client = getTursoClient();
    await client.execute("PRAGMA foreign_keys = ON;");

    const files = this.getMigrationFiles();
    const appliedRes = await executeTurso(`SELECT name FROM _migrations;`);
    const appliedSet = new Set(appliedRes.rows.map((r) => String(r.name)));

    // Get current batch number
    const maxBatchRes = await executeTurso(`SELECT MAX(batch) as max_batch FROM _migrations;`);
    const currentBatch = (Number(maxBatchRes.rows[0]?.max_batch) || 0) + 1;

    const pendingFiles = files.filter((f) => !appliedSet.has(f.name));
    const appliedMigrations: string[] = [];

    for (const fileObj of pendingFiles) {
      const sqlContent = fs.readFileSync(fileObj.fullPath, "utf8");

      // Clean comments
      const cleanedSql = sqlContent
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/--.*$/gm, "")
        .trim();

      const rawStatements = cleanedSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Execute in a transaction block
      const tx = await client.transaction("write");
      try {
        for (const stmt of rawStatements) {
          if (stmt.trim()) {
            await tx.execute(stmt + ";");
          }
        }

        // Record migration
        await tx.execute({
          sql: `INSERT INTO _migrations (name, batch, applied_at) VALUES (?, ?, datetime('now'));`,
          args: [fileObj.name, currentBatch],
        });

        await tx.commit();
        appliedMigrations.push(fileObj.name);
      } catch (err: any) {
        await tx.rollback();
        console.error(`[Migrator] Error running migration ${fileObj.name}:`, err.message);
        return {
          appliedCount: appliedMigrations.length,
          appliedMigrations,
          errors: `Migration failed at ${fileObj.name}: ${err.message}`,
        };
      }
    }

    return {
      appliedCount: appliedMigrations.length,
      appliedMigrations,
    };
  }
}
