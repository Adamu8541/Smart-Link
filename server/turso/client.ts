/**
 * SMART LINK NG — Turso Database Client (Phase 5)
 * Centralized, secure database client for libSQL / Turso.
 * 
 * SECURITY:
 * - Credentials are strictly accessed server-side from environment variables.
 * - Enforces PRAGMA foreign_keys = ON on connection.
 * - Employs strictly parameterized queries to guarantee SQL injection immunity.
 * - Supports local file/in-memory fallback when remote URL is not configured.
 */

import { createClient } from "@libsql/client";
import type { Client, InStatement, Transaction } from "@libsql/client";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

let clientInstance: Client | null = null;

export interface TursoConfig {
  url: string;
  authToken?: string;
  isLocal: boolean;
}

/**
 * Resolves the active database configuration.
 * Prioritizes TURSO_DATABASE_URL, falling back to local SQLite file in src/data.
 */
export function getTursoConfig(): TursoConfig {
  const envUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

  if (envUrl && envUrl.length > 0) {
    const isLocal = envUrl.startsWith("file:") || envUrl === ":memory:";
    return {
      url: envUrl,
      authToken: isLocal ? undefined : authToken,
      isLocal,
    };
  }

  // Local fallback: Ensure data directory exists and create file database
  const dbDir = path.join(process.cwd(), "src", "data");
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      // Ignore directory creation error in read-only/tmp environments
    }
  }

  const localDbPath = path.join(dbDir, "smartlink.db");
  return {
    url: `file:${localDbPath}`,
    authToken: undefined,
    isLocal: true,
  };
}

/**
 * Initializes or returns the singleton Turso/libSQL client.
 */
export function getTursoClient(): Client {
  if (!clientInstance) {
    const config = getTursoConfig();
    clientInstance = createClient({
      url: config.url,
      authToken: config.authToken,
    });
  }
  return clientInstance;
}

/**
 * Resets the client instance (primarily used in test suites or environment reloads).
 */
export function resetTursoClient(customUrl?: string, customToken?: string): Client {
  if (customUrl) {
    clientInstance = createClient({
      url: customUrl,
      authToken: customToken,
    });
  } else {
    clientInstance = null;
    return getTursoClient();
  }
  return clientInstance;
}

/**
 * Tests database connectivity and executes foreign keys PRAGMA check.
 */
export async function testTursoConnection(): Promise<{ ok: boolean; url: string; isLocal: boolean; error?: string }> {
  try {
    const client = getTursoClient();
    const config = getTursoConfig();
    
    // Enable foreign keys
    await client.execute("PRAGMA foreign_keys = ON;");
    const result = await client.execute("SELECT 1 AS connected, sqlite_version() AS version;");
    
    if (result.rows && result.rows.length > 0) {
      return {
        ok: true,
        url: config.isLocal ? config.url : config.url.replace(/:[^:]*@/, ":****@"),
        isLocal: config.isLocal,
      };
    }
    return { ok: false, url: config.url, isLocal: config.isLocal, error: "Empty result from probe query" };
  } catch (err: any) {
    const config = getTursoConfig();
    return {
      ok: false,
      url: config.isLocal ? config.url : config.url.replace(/:[^:]*@/, ":****@"),
      isLocal: config.isLocal,
      error: err.message || "Failed to connect to Turso database",
    };
  }
}

/**
 * Safely executes a single parameterized SQL query.
 * ALL parameters MUST be passed in `args` array to prevent SQL injection.
 */
export async function executeTurso(sql: string, args: any[] = []) {
  const client = getTursoClient();
  await client.execute("PRAGMA foreign_keys = ON;");
  return await client.execute({ sql, args });
}

/**
 * Safely executes a batch of parameterized SQL queries in a single round-trip.
 */
export async function batchTurso(statements: InStatement[], mode: "write" | "read" | "deferred" = "write") {
  const client = getTursoClient();
  return await client.batch(statements, mode);
}

/**
 * Executes a callback within a managed libSQL transaction.
 * Automatically commits on successful return or rolls back on throw.
 */
export async function withTursoTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
  const client = getTursoClient();
  const tx = await client.transaction("write");
  try {
    await tx.execute("PRAGMA foreign_keys = ON;");
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (err) {
    try {
      await tx.rollback();
    } catch (rbErr) {
      console.warn("[Turso] Rollback warning:", rbErr);
    }
    throw err;
  }
}
