-- Schéma D1 — Bibliothèque de Skylis.
-- Le Worker crée cette table à la volée au premier appel (ensureSchema) ;
-- ce fichier sert de référence et permet une initialisation manuelle :
--   wrangler d1 execute bibliotheque-db --local  --file=./worker/schema.sql
--   wrangler d1 execute bibliotheque-db --remote --file=./worker/schema.sql

CREATE TABLE IF NOT EXISTS book_passwords (
  book_id   TEXT PRIMARY KEY,
  password  TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);
