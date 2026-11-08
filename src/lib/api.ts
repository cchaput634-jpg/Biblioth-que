/**
 * Client API pour les mots de passe de livres + l'authentification Discord.
 *
 * - Les mots de passe des livres sont stockés en D1 (identiques pour tous).
 * - Un utilisateur Discord connecté peut avoir des accès directs par livre
 *   accordés par l'admin, qui lui permettent d'ouvrir le livre sans mot de passe.
 * - Le master password admin a un fallback client (constante publique de toute façon).
 */

const MASTER_PASSWORD = "Skylis4Ever";
const SESSION_KEY = "bibliotheque:admin-password:v1";

/* -------- Session admin -------- */

function getAdminPassword(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setAdminPasswordSession(pw: string | null) {
  try {
    if (pw) sessionStorage.setItem(SESSION_KEY, pw);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isAdminEnabled(): boolean {
  return getAdminPassword() !== null;
}

export function logoutAdmin() {
  setAdminPasswordSession(null);
}

/* -------- Helpers -------- */

async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* -------- Discord auth -------- */

export interface DiscordUser {
  discord_id: string;
  username: string;
  avatar: string | null;
}

export async function fetchCurrentUser(): Promise<DiscordUser | null> {
  const data = await apiJson<{ user: DiscordUser | null }>("/api/auth/me");
  return data?.user ?? null;
}

export function loginWithDiscord() {
  const returnTo = window.location.pathname + window.location.search;
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logoutDiscord(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/* -------- Routes publiques -------- */

export async function fetchLockedBooks(): Promise<Set<string>> {
  const data = await apiJson<{ lockedBookIds: string[] }>("/api/locked");
  return new Set(data?.lockedBookIds ?? []);
}

/** Vérifie si l'utilisateur connecté a un accès direct au livre (sans mot de passe). */
export async function hasDirectAccess(bookId: string): Promise<boolean> {
  const data = await apiJson<{ allowed: boolean }>(
    `/api/access/${encodeURIComponent(bookId)}`,
  );
  return !!data?.allowed;
}

export async function verifyBookPassword(
  bookId: string,
  password: string,
): Promise<boolean> {
  const data = await apiJson<{ ok: boolean }>(
    `/api/verify/${encodeURIComponent(bookId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
  return !!data?.ok;
}

/* -------- Admin : mot de passe maître -------- */

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const data = await apiJson<{ ok: boolean }>("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const ok = data ? !!data.ok : password === MASTER_PASSWORD;
  if (ok) setAdminPasswordSession(password);
  return ok;
}

function adminHeaders(): HeadersInit {
  const pw = getAdminPassword();
  return pw ? { "X-Admin-Password": pw } : {};
}

/* -------- Admin : mots de passe de livres -------- */

export async function fetchAllPasswords(): Promise<Record<string, string>> {
  const data = await apiJson<Record<string, string>>("/api/admin/passwords", {
    headers: adminHeaders(),
  });
  return data ?? {};
}

export async function setBookPassword(
  bookId: string,
  password: string,
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/passwords/${encodeURIComponent(bookId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ password }),
    },
  );
}

export async function deleteBookPassword(bookId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/passwords/${encodeURIComponent(bookId)}`,
    {
      method: "DELETE",
      headers: adminHeaders(),
    },
  );
}

/* -------- Admin : accès utilisateurs -------- */

export interface AdminUser {
  discord_id: string;
  username: string;
  avatar: string | null;
  last_seen: number;
  books: string[];
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const data = await apiJson<AdminUser[]>("/api/admin/users", {
    headers: adminHeaders(),
  });
  return data ?? [];
}

export async function grantAccess(
  userId: string,
  bookId: string,
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/access/${encodeURIComponent(userId)}/${encodeURIComponent(bookId)}`,
    { method: "PUT", headers: adminHeaders() },
  );
}

export async function revokeAccess(
  userId: string,
  bookId: string,
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/access/${encodeURIComponent(userId)}/${encodeURIComponent(bookId)}`,
    { method: "DELETE", headers: adminHeaders() },
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE", headers: adminHeaders() },
  );
}
