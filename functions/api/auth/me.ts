/**
 * GET /api/auth/me
 * Retourne l'utilisateur courant, ou null si pas de session valide.
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const user = await getSessionUser(env, request);
  return new Response(JSON.stringify({ user }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

export async function getSessionUser(
  env: Env,
  request: Request,
): Promise<{
  discord_id: string;
  username: string;
  avatar: string | null;
} | null> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));
  if (!sessionCookie) return null;

  const sessionId = sessionCookie.replace(/^session=/, "");
  if (!sessionId) return null;

  const row = await env.DB.prepare(
    `SELECT u.discord_id, u.username, u.avatar
       FROM sessions s
       JOIN users u ON u.discord_id = s.user_id
      WHERE s.session_id = ? AND s.expires_at > ?`,
  )
    .bind(sessionId, Date.now())
    .first<{ discord_id: string; username: string; avatar: string | null }>();

  return row ?? null;
}
