-- SMART LINK NG — Migration 003: User Passkeys / Biometrics Table

CREATE TABLE IF NOT EXISTS user_passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  transports TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_credential_id ON user_passkeys(credential_id);
