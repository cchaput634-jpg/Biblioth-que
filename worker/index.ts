/// <reference types="@cloudflare/workers-types" />
/**
 * Worker Cloudflare — Bibliothèque de Skylis.
 * Gère les mots de passe des livres (table D1 `book_passwords`).
 *
 * Sécurité : garde-fou de jeu de rôle, PAS un vrai système de sécurité.
 * Le mot de passe maître est en clair dans ce fichier et l'authentification
 * admin se fait par simple comparaison de chaîne dans un header.
 *
 * Routes publiques (lecteurs) :
 *   GET  /api/locked                     → { lockedBookIds: string[] }
 *   POST /api/verify/:bookId             → { ok: boolean } (body: { password })
 *
 * Routes admin (header X-Admin-Password requis) :
 *   POST /api/admin/verify               → { ok: boolean } (body: { password })
 *   GET  /api/admin/passwords            → { [bookId]: password }
 *   PUT  /api/admin/passwords/:bookId    → { ok: true } (body: { password })
 *   DELETE /api/admin/passwords/:bookId  → { ok: true }
 */

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const ADMIN_PASSWORD = "Skylis4Ever";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

/* ------------------------------------------------------------------ */
/* Routeur                                                             */
/* ------------------------------------------------------------------ */

async function handleApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  await ensureSchema(env);
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

  // GET /api/locked
  if (parts[1] === "locked" && !parts[2] && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT book_id FROM book_passwords",
    ).all<{ book_id: string }>();
    const lockedBookIds = (rows.results ?? []).map((r) => r.book_id);
    return json({ lockedBookIds });
  }

  // POST /api/verify/:bookId
  if (parts[1] === "verify" && parts[2] && request.method === "POST") {
    const bookId = decodeURIComponent(parts[2]);
    const body = await readJsonBody(request);
    const attempt = typeof body?.password === "string" ? body.password : "";
    const row = await env.DB.prepare(
      "SELECT password FROM book_passwords WHERE book_id = ?",
    )
      .bind(bookId)
      .first<{ password: string }>();
    // Pas de mot de passe stocké = livre ouvert
    if (!row) return json({ ok: true });
    return json({ ok: row.password === attempt });
  }

  // POST /api/admin/verify
  if (
    parts[1] === "admin" &&
    parts[2] === "verify" &&
    !parts[3] &&
    request.method === "POST"
  ) {
    const body = await readJsonBody(request);
    const attempt = typeof body?.password === "string" ? body.password : "";
    return json({ ok: attempt === ADMIN_PASSWORD });
  }

  // Routes admin : exigent X-Admin-Password
  if (parts[1] === "admin" && parts[2] === "passwords") {
    const adminPw = request.headers.get("X-Admin-Password") ?? "";
    if (adminPw !== ADMIN_PASSWORD) {
      return json({ error: "Non autorisé" }, 401);
    }

    // GET /api/admin/passwords
    if (!parts[3] && request.method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT book_id, password FROM book_passwords",
      ).all<{ book_id: string; password: string }>();
      const map: Record<string, string> = {};
      for (const r of rows.results ?? []) map[r.book_id] = r.password;
      return json(map);
    }

    // PUT /api/admin/passwords/:bookId
    if (parts[3] && request.method === "PUT") {
      const bookId = decodeURIComponent(parts[3]);
      const body = await readJsonBody(request);
      const pw = typeof body?.password === "string" ? body.password : "";
      if (pw.length === 0) {
        await env.DB.prepare("DELETE FROM book_passwords WHERE book_id = ?")
          .bind(bookId)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO book_passwords (book_id, password, updatedAt) VALUES (?, ?, ?) " +
            "ON CONFLICT(book_id) DO UPDATE SET password = excluded.password, updatedAt = excluded.updatedAt",
        )
          .bind(bookId, pw, Date.now())
          .run();
      }
      return json({ ok: true });
    }

    // DELETE /api/admin/passwords/:bookId
    if (parts[3] && request.method === "DELETE") {
      const bookId = decodeURIComponent(parts[3]);
      await env.DB.prepare("DELETE FROM book_passwords WHERE book_id = ?")
        .bind(bookId)
        .run();
      return json({ ok: true });
    }
  }

  return json({ error: "Route inconnue" }, 404);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function ensureSchema(env: Env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS book_passwords (
       book_id   TEXT PRIMARY KEY,
       password  TEXT NOT NULL,
       updatedAt INTEGER NOT NULL
     )`,
  ).run();
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });
}
