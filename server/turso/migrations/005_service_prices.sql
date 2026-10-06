-- SMART LINK NG — Migration 005: Service Prices Table (Turso Database Primary Persistence)

CREATE TABLE IF NOT EXISTS service_prices (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  service_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  service_charge REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 0,
  price_label TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_service_prices_service_id ON service_prices(service_id);
CREATE INDEX IF NOT EXISTS idx_service_prices_category ON service_prices(category);
CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active);
