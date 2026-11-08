-- Schéma D1 — Bibliothèque de Skylis.
-- Initialisation manuelle :
--   wrangler d1 execute bibliotheque-db --local  --file=./worker/schema.sql
--   wrangler d1 execute bibliotheque-db --remote --file=./worker/schema.sql
-- Les tables sont aussi créées à la volée par le Worker (ensureSchema).

CREATE TABLE IF NOT EXISTS book_passwords (
  book_id   TEXT PRIMARY KEY,
  password  TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  avatar     TEXT,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_book_access (
  user_id    TEXT NOT NULL,
  book_id    TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, book_id)
);
