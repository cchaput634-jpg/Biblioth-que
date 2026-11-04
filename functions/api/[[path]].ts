/**
 * Pages Function catch-all pour /api/*.
 * Reprend exactement la logique de `worker/index.ts` (qui reste pour
 * le dev local via `wrangler dev`), au format attendu par Cloudflare Pages.
 *
 * Bindings à configurer dans le dashboard Cloudflare Pages :
 *   Settings → Functions → D1 database bindings → nom "DB", base "bibliotheque-db"
 */

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

  // Toutes les autres routes ont besoin de la D1 — message clair si manquante.
  if (!env.DB) {
    return json(
      { error: "Base D1 non liée. Dashboard Pages → Settings → Functions → D1 bindings → DB." },
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
  if (parts[1] === "verify" && parts[2] && request.method === "POST") {
    const bookId = decodeURIComponent(parts[2]);
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

  // Routes admin : exigent X-Admin-Password
  if (parts[1] === "admin" && parts[2] === "passwords") {
    const adminPw = request.headers.get("X-Admin-Password") ?? "";
    if (adminPw !== ADMIN_PASSWORD) {
      return json({ error: "Non autorisé" }, 401);
    }

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

  return json({ error: "Route inconnue" }, 404);
}

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
