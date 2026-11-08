/**
 * Pages Function catch-all pour /api/* (hors /api/auth/* qui a ses propres
 * fichiers). Gère les mots de passe de livres + l'accès par utilisateur Discord.
 */

import { getSessionUser } from "./auth/me";

interface Env {
  DB: D1Database;
}

const ADMIN_PASSWORD = "Skylis4Ever";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
  "Access-Control-Max-Age": "86400",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    return await handleApi(request, env, new URL(request.url));
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

async function handleApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

  // POST /api/admin/verify — ne nécessite PAS la D1, répondable même
  // avant que le binding soit configuré.
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

  if (!env.DB) {
    return json(
      { error: "Base D1 non liée. wrangler.jsonc doit avoir pages_build_output_dir." },
      503,
    );
  }
  await ensureSchema(env);

  // GET /api/locked
  if (parts[1] === "locked" && !parts[2] && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT book_id FROM book_passwords",
    ).all<{ book_id: string }>();
    const lockedBookIds = (rows.results ?? []).map((r) => r.book_id);
    return json({ lockedBookIds });
  }

  // POST /api/verify/:bookId
  // Avant de demander le mot de passe, on vérifie si l'utilisateur connecté
  // a été autorisé explicitement pour ce livre.
  if (parts[1] === "verify" && parts[2] && request.method === "POST") {
    const bookId = decodeURIComponent(parts[2]);

    // Access via user Discord connecté : ouvre direct
    const user = await getSessionUser(env, request);
    if (user) {
      const access = await env.DB.prepare(
        "SELECT 1 FROM user_book_access WHERE user_id = ? AND book_id = ?",
      )
        .bind(user.discord_id, bookId)
        .first();
      if (access) return json({ ok: true });
    }

    // Sinon, vérification du mot de passe partagé
    const body = await readJsonBody(request);
    const attempt = typeof body?.password === "string" ? body.password : "";
    const row = await env.DB.prepare(
      "SELECT password FROM book_passwords WHERE book_id = ?",
    )
      .bind(bookId)
      .first<{ password: string }>();
    if (!row) return json({ ok: true });
    return json({ ok: row.password === attempt });
  }

  // GET /api/access/:bookId — dit si l'utilisateur courant peut ouvrir
  // directement ce livre (session + droits), sans demander de mot de passe.
  if (parts[1] === "access" && parts[2] && request.method === "GET") {
    const bookId = decodeURIComponent(parts[2]);
    const user = await getSessionUser(env, request);
    if (!user) return json({ allowed: false });
    const row = await env.DB.prepare(
      "SELECT 1 FROM user_book_access WHERE user_id = ? AND book_id = ?",
    )
      .bind(user.discord_id, bookId)
      .first();
    return json({ allowed: !!row });
  }

  // Routes admin : exigent X-Admin-Password
  if (parts[1] === "admin") {
    const adminPw = request.headers.get("X-Admin-Password") ?? "";
    if (adminPw !== ADMIN_PASSWORD) {
      return json({ error: "Non autorisé" }, 401);
    }

    // /api/admin/passwords[...]
    if (parts[2] === "passwords") {
      if (!parts[3] && request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT book_id, password FROM book_passwords",
        ).all<{ book_id: string; password: string }>();
        const map: Record<string, string> = {};
        for (const r of rows.results ?? []) map[r.book_id] = r.password;
        return json(map);
      }

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

      if (parts[3] && request.method === "DELETE") {
        const bookId = decodeURIComponent(parts[3]);
        await env.DB.prepare("DELETE FROM book_passwords WHERE book_id = ?")
          .bind(bookId)
          .run();
        return json({ ok: true });
      }
    }

    // GET /api/admin/users — liste des users connectés au moins une fois,
    // avec la liste de leurs accès.
    if (parts[2] === "users" && !parts[3] && request.method === "GET") {
      const users = await env.DB.prepare(
        "SELECT discord_id, username, avatar, last_seen FROM users ORDER BY username",
      ).all<{
        discord_id: string;
        username: string;
        avatar: string | null;
        last_seen: number;
      }>();
      const access = await env.DB.prepare(
        "SELECT user_id, book_id FROM user_book_access",
      ).all<{ user_id: string; book_id: string }>();
      const accessByUser: Record<string, string[]> = {};
      for (const a of access.results ?? []) {
        (accessByUser[a.user_id] ??= []).push(a.book_id);
      }
      return json(
        (users.results ?? []).map((u) => ({
          ...u,
          books: accessByUser[u.discord_id] ?? [],
        })),
      );
    }

    // PUT /api/admin/access/:userId/:bookId — accorde l'accès
    // DELETE idem — révoque
    if (parts[2] === "access" && parts[3] && parts[4]) {
      const userId = decodeURIComponent(parts[3]);
      const bookId = decodeURIComponent(parts[4]);
      if (request.method === "PUT") {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO user_book_access (user_id, book_id, granted_at) VALUES (?, ?, ?)",
        )
          .bind(userId, bookId, Date.now())
          .run();
        return json({ ok: true });
      }
      if (request.method === "DELETE") {
        await env.DB.prepare(
          "DELETE FROM user_book_access WHERE user_id = ? AND book_id = ?",
        )
          .bind(userId, bookId)
          .run();
        return json({ ok: true });
      }
    }

    // DELETE /api/admin/users/:userId — supprime un user et tous ses accès
    if (
      parts[2] === "users" &&
      parts[3] &&
      !parts[4] &&
      request.method === "DELETE"
    ) {
      const userId = decodeURIComponent(parts[3]);
      await env.DB.prepare("DELETE FROM user_book_access WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare("DELETE FROM users WHERE discord_id = ?")
        .bind(userId)
        .run();
      return json({ ok: true });
    }
  }

  return json({ error: "Route inconnue" }, 404);
}

async function ensureSchema(env: Env) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS book_passwords (
       book_id   TEXT PRIMARY KEY,
       password  TEXT NOT NULL,
       updatedAt INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS users (
       discord_id TEXT PRIMARY KEY,
       username   TEXT NOT NULL,
       avatar     TEXT,
       created_at INTEGER NOT NULL,
       last_seen  INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS sessions (
       session_id TEXT PRIMARY KEY,
       user_id    TEXT NOT NULL,
       expires_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS user_book_access (
       user_id    TEXT NOT NULL,
       book_id    TEXT NOT NULL,
       granted_at INTEGER NOT NULL,
       PRIMARY KEY (user_id, book_id)
     )`,
  ];
  for (const s of stmts) await env.DB.prepare(s).run();
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
