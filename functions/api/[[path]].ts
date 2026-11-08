/**
 * Pages Function catch-all pour /api/* (hors /api/auth/* qui a ses propres
 * fichiers). Gère les rôles, permissions, utilisateurs et livres restreints.
 *
 * Plus de mot de passe par livre ni de master password. L'accès est
 * entièrement basé sur les rôles :
 *   - Les livres sont publics par défaut
 *   - Un livre marqué "restreint" nécessite la permission open_book:<id>
 *   - La permission manage_users donne accès au panneau admin
 *   - Un Super Admin a tous les droits implicitement
 */

import { getSessionUser } from "./auth/me";
import { getUserPermissions } from "./_perms";

interface Env {
  DB: D1Database;
}

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
  if (!env.DB) {
    return json({ error: "Base D1 non liée." }, 503);
  }
  await ensureSchema(env);

  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

  /* ===== Routes publiques ===== */

  // GET /api/locked — liste des livres restreints (côté client pour afficher
  // le cadenas), AVEC la liste des livres que l'utilisateur courant peut
  // néanmoins ouvrir grâce à ses permissions.
  //
  // Un utilisateur Super Admin OU titulaire de manage_users ouvre tous les
  // livres implicitement : s'il gère les accès, il peut lire aussi.
  if (parts[1] === "locked" && !parts[2] && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT book_id FROM restricted_books",
    ).all<{ book_id: string }>();
    const restricted = (rows.results ?? []).map((r) => r.book_id);

    const user = await getSessionUser(env, request);
    let allowed: string[] = [];
    if (user) {
      const { permissions, isSuper } = await getUserPermissions(
        env,
        user.discord_id,
      );
      const bypass = isSuper || permissions.has("manage_users");
      allowed = restricted.filter(
        (b) => bypass || permissions.has(`open_book:${b}`),
      );
    }
    return json({ restrictedBookIds: restricted, allowedBookIds: allowed });
  }

  // GET /api/access/:bookId — dit si l'utilisateur courant peut ouvrir ce livre
  if (parts[1] === "access" && parts[2] && request.method === "GET") {
    const bookId = decodeURIComponent(parts[2]);
    const isRestricted = await env.DB.prepare(
      "SELECT 1 FROM restricted_books WHERE book_id = ?",
    )
      .bind(bookId)
      .first();
    if (!isRestricted) return json({ allowed: true });

    const user = await getSessionUser(env, request);
    if (!user) return json({ allowed: false });
    const { permissions, isSuper } = await getUserPermissions(env, user.discord_id);
    return json({
      allowed:
        isSuper ||
        permissions.has("manage_users") ||
        permissions.has(`open_book:${bookId}`),
    });
  }

  /* ===== Routes admin (requièrent manage_users ou super) ===== */

  if (parts[1] === "admin") {
    const user = await getSessionUser(env, request);
    if (!user) return json({ error: "Non connecté" }, 401);
    const { permissions, isSuper } = await getUserPermissions(env, user.discord_id);
    if (!isSuper && !permissions.has("manage_users")) {
      return json({ error: "Permission insuffisante" }, 403);
    }

    // --- Rôles ---
    if (parts[2] === "roles") {
      // GET /api/admin/roles
      if (!parts[3] && request.method === "GET") {
        const roles = await env.DB.prepare(
          "SELECT id, name, is_super FROM roles ORDER BY is_super DESC, name",
        ).all<{ id: string; name: string; is_super: number }>();
        const perms = await env.DB.prepare(
          "SELECT role_id, permission FROM role_permissions",
        ).all<{ role_id: string; permission: string }>();
        const permsByRole: Record<string, string[]> = {};
        for (const p of perms.results ?? []) {
          (permsByRole[p.role_id] ??= []).push(p.permission);
        }
        return json(
          (roles.results ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            isSuper: r.is_super === 1,
            permissions: permsByRole[r.id] ?? [],
          })),
        );
      }

      // POST /api/admin/roles — crée un rôle (body: { name, permissions? })
      if (!parts[3] && request.method === "POST") {
        const body = await readJsonBody(request);
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        if (!name) return json({ error: "Nom manquant" }, 400);
        const id = crypto.randomUUID();
        try {
          await env.DB.prepare(
            "INSERT INTO roles (id, name, is_super, created_at) VALUES (?, ?, 0, ?)",
          )
            .bind(id, name, Date.now())
            .run();
        } catch {
          return json({ error: "Nom déjà pris" }, 409);
        }
        const perms = Array.isArray(body?.permissions)
          ? (body.permissions as unknown[]).filter(
              (p): p is string => typeof p === "string",
            )
          : [];
        for (const p of perms) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)",
          )
            .bind(id, p)
            .run();
        }
        return json({ id });
      }

      // PATCH /api/admin/roles/:id — rename + replace permissions
      if (parts[3] && request.method === "PATCH") {
        const roleId = decodeURIComponent(parts[3]);
        const role = await env.DB.prepare(
          "SELECT is_super FROM roles WHERE id = ?",
        )
          .bind(roleId)
          .first<{ is_super: number }>();
        if (!role) return json({ error: "Rôle inconnu" }, 404);
        if (role.is_super === 1) {
          return json({ error: "Le rôle Super Admin est verrouillé" }, 403);
        }

        const body = await readJsonBody(request);
        if (typeof body?.name === "string" && body.name.trim()) {
          try {
            await env.DB.prepare("UPDATE roles SET name = ? WHERE id = ?")
              .bind(body.name.trim(), roleId)
              .run();
          } catch {
            return json({ error: "Nom déjà pris" }, 409);
          }
        }
        if (Array.isArray(body?.permissions)) {
          await env.DB.prepare(
            "DELETE FROM role_permissions WHERE role_id = ?",
          )
            .bind(roleId)
            .run();
          for (const p of body.permissions) {
            if (typeof p !== "string") continue;
            await env.DB.prepare(
              "INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)",
            )
              .bind(roleId, p)
              .run();
          }
        }
        return json({ ok: true });
      }

      // DELETE /api/admin/roles/:id
      if (parts[3] && request.method === "DELETE") {
        const roleId = decodeURIComponent(parts[3]);
        const role = await env.DB.prepare(
          "SELECT is_super FROM roles WHERE id = ?",
        )
          .bind(roleId)
          .first<{ is_super: number }>();
        if (!role) return json({ error: "Rôle inconnu" }, 404);
        if (role.is_super === 1) {
          return json({ error: "Le rôle Super Admin ne peut pas être supprimé" }, 403);
        }
        await env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?")
          .bind(roleId)
          .run();
        await env.DB.prepare("DELETE FROM user_roles WHERE role_id = ?")
          .bind(roleId)
          .run();
        await env.DB.prepare("DELETE FROM roles WHERE id = ?")
          .bind(roleId)
          .run();
        return json({ ok: true });
      }
    }

    // --- Utilisateurs ---
    if (parts[2] === "users") {
      // GET /api/admin/users
      if (!parts[3] && request.method === "GET") {
        const users = await env.DB.prepare(
          "SELECT discord_id, username, avatar, last_seen FROM users ORDER BY username",
        ).all<{
          discord_id: string;
          username: string;
          avatar: string | null;
          last_seen: number;
        }>();
        const roleAssign = await env.DB.prepare(
          "SELECT user_id, role_id FROM user_roles",
        ).all<{ user_id: string; role_id: string }>();
        const rolesByUser: Record<string, string[]> = {};
        for (const r of roleAssign.results ?? []) {
          (rolesByUser[r.user_id] ??= []).push(r.role_id);
        }
        return json(
          (users.results ?? []).map((u) => ({
            ...u,
            roles: rolesByUser[u.discord_id] ?? [],
          })),
        );
      }

      // PUT /api/admin/users/:userId/roles — remplace les rôles d'un user
      if (parts[3] && parts[4] === "roles" && request.method === "PUT") {
        const userId = decodeURIComponent(parts[3]);
        const body = await readJsonBody(request);
        if (!Array.isArray(body?.roles)) {
          return json({ error: "body.roles manquant" }, 400);
        }
        // Empêche de retirer son propre rôle super admin (pour pas se bloquer)
        if (userId === user.discord_id && isSuper) {
          const stillSuper = await env.DB.prepare(
            `SELECT 1 FROM roles WHERE is_super = 1 AND id IN (${(body.roles as string[])
              .map(() => "?")
              .join(",") || "''"})`,
          )
            .bind(...(body.roles as string[]))
            .first();
          if (!stillSuper) {
            return json(
              {
                error:
                  "Tu ne peux pas retirer ton propre rôle Super Admin.",
              },
              403,
            );
          }
        }
        await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?")
          .bind(userId)
          .run();
        for (const rid of body.roles as string[]) {
          if (typeof rid !== "string") continue;
          await env.DB.prepare(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_at) VALUES (?, ?, ?)",
          )
            .bind(userId, rid, Date.now())
            .run();
        }
        return json({ ok: true });
      }

      // DELETE /api/admin/users/:userId
      if (parts[3] && !parts[4] && request.method === "DELETE") {
        const userId = decodeURIComponent(parts[3]);
        if (userId === user.discord_id) {
          return json({ error: "Tu ne peux pas te supprimer toi-même." }, 403);
        }
        await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?")
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

    // --- Livres restreints ---
    if (parts[2] === "books") {
      // GET /api/admin/books — renvoie la liste des livres restreints
      if (!parts[3] && request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT book_id FROM restricted_books",
        ).all<{ book_id: string }>();
        return json({
          restrictedBookIds: (rows.results ?? []).map((r) => r.book_id),
        });
      }

      // PUT /api/admin/books/:bookId — marque comme restreint
      if (parts[3] && request.method === "PUT") {
        const bookId = decodeURIComponent(parts[3]);
        await env.DB.prepare(
          "INSERT OR IGNORE INTO restricted_books (book_id, marked_at) VALUES (?, ?)",
        )
          .bind(bookId, Date.now())
          .run();
        return json({ ok: true });
      }

      // DELETE /api/admin/books/:bookId — rend à nouveau public
      if (parts[3] && request.method === "DELETE") {
        const bookId = decodeURIComponent(parts[3]);
        await env.DB.prepare("DELETE FROM restricted_books WHERE book_id = ?")
          .bind(bookId)
          .run();
        return json({ ok: true });
      }
    }
  }

  return json({ error: "Route inconnue" }, 404);
}

async function ensureSchema(env: Env) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
       discord_id TEXT PRIMARY KEY, username TEXT NOT NULL, avatar TEXT,
       created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS sessions (
       session_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS roles (
       id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
       is_super INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
       role_id TEXT NOT NULL, permission TEXT NOT NULL,
       PRIMARY KEY (role_id, permission)
     )`,
    `CREATE TABLE IF NOT EXISTS user_roles (
       user_id TEXT NOT NULL, role_id TEXT NOT NULL, granted_at INTEGER NOT NULL,
       PRIMARY KEY (user_id, role_id)
     )`,
    `CREATE TABLE IF NOT EXISTS restricted_books (
       book_id TEXT PRIMARY KEY, marked_at INTEGER NOT NULL
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
