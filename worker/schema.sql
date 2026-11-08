-- Schéma D1 — Bibliothèque de Skylis.
-- Les tables sont aussi créées à la volée par le Worker (ensureSchema).
-- Init manuelle : wrangler d1 execute bibliotheque-db --remote --file=./worker/schema.sql

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

-- Rôles : un ensemble nommé de permissions. is_super=1 → tous les droits
-- implicites (ne peut pas être supprimé, ne peut pas voir ses permissions modifiées).
CREATE TABLE IF NOT EXISTS roles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  is_super   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Chaque permission est une chaîne : "manage_users" ou "open_book:<bookId>"
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id    TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    TEXT NOT NULL,
  role_id    TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

-- Livres marqués comme restreints : seuls les users avec open_book:<id>
-- peuvent les ouvrir. Un livre absent de cette table est public.
CREATE TABLE IF NOT EXISTS restricted_books (
  book_id    TEXT PRIMARY KEY,
  marked_at  INTEGER NOT NULL
);

-- Anciennes tables conservées mais inutilisées (sécurité migration)
CREATE TABLE IF NOT EXISTS book_passwords (
  book_id   TEXT PRIMARY KEY,
  password  TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_book_access (
  user_id    TEXT NOT NULL,
  book_id    TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, book_id)
);
