/**
 * Client API pour les mots de passe de livres.
 *
 * Les mots de passe des livres sont STOCKÉS CÔTÉ SERVEUR (D1) : un
 * mot de passe par livre, le même pour tous les lecteurs. Chaque
 * ouverture d'un livre verrouillé redemande le mot de passe (pas de
 * cache local « déjà entré »).
 *
 * Seul le master password admin peut être vérifié côté client en cas
 * de pépin réseau — c'est juste une comparaison avec une constante
 * publique de toute façon.
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

/* -------- Appels API -------- */

async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* -------- Routes publiques -------- */

export async function fetchLockedBooks(): Promise<Set<string>> {
  const data = await apiJson<{ lockedBookIds: string[] }>("/api/locked");
  return new Set(data?.lockedBookIds ?? []);
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

/* -------- Admin -------- */

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const data = await apiJson<{ ok: boolean }>("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  // Si l'API répond, on se fie à sa réponse. Sinon fallback client
  // (la constante est déjà publique dans le worker, donc aucune
  // sécurité en moins).
  const ok = data ? !!data.ok : password === MASTER_PASSWORD;
  if (ok) setAdminPasswordSession(password);
  return ok;
}

function adminHeaders(): HeadersInit {
  const pw = getAdminPassword();
  return pw ? { "X-Admin-Password": pw } : {};
}

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
