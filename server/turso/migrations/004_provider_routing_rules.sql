-- SMART LINK NG — Migration 004: Provider Routing Rules Table (Turso Database Primary Persistence)

CREATE TABLE IF NOT EXISTS provider_routing_rules (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'PRIORITY_ORDER',
  primary_provider_id TEXT,
  primary_provider_name TEXT,
  secondary_provider_id TEXT,
  secondary_provider_name TEXT,
  tertiary_provider_id TEXT,
  tertiary_provider_name TEXT,
  fallback_provider_id TEXT,
  fallback_provider_name TEXT,
  timeout_ms INTEGER NOT NULL DEFAULT 20000,
  max_retries INTEGER NOT NULL DEFAULT 2,
  auto_failover INTEGER NOT NULL DEFAULT 1,
  circuit_breaker_threshold INTEGER NOT NULL DEFAULT 3,
  circuit_breaker_reset_ms INTEGER NOT NULL DEFAULT 60000,
  enabled INTEGER NOT NULL DEFAULT 1,
  raw_config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_service ON provider_routing_rules(service);
CREATE INDEX IF NOT EXISTS idx_routing_rules_enabled ON provider_routing_rules(enabled);
