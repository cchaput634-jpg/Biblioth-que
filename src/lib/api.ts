/**
 * Client minimal pour l'API du Worker (base D1).
 * Toutes les routes passent par /api (proxy Vite en dev, même origine en prod).
 */

const SESSION_KEY = "bibliotheque:admin-password:v1";

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

/* -------- Routes publiques -------- */

export async function fetchLockedBooks(): Promise<Set<string>> {
  const res = await fetch("/api/locked");
  if (!res.ok) return new Set();
  const data = (await res.json()) as { lockedBookIds: string[] };
  return new Set(data.lockedBookIds ?? []);
}

export async function verifyBookPassword(
  bookId: string,
  password: string,
): Promise<boolean> {
  const res = await fetch(`/api/verify/${encodeURIComponent(bookId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { ok: boolean };
  return !!data.ok;
}

/* -------- Admin -------- */

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const res = await fetch("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { ok: boolean };
  if (data.ok) setAdminPasswordSession(password);
  return !!data.ok;
}

export function logoutAdmin() {
  setAdminPasswordSession(null);
}

export function isAdminEnabled(): boolean {
  return getAdminPassword() !== null;
}

function adminHeaders(): HeadersInit {
  const pw = getAdminPassword();
  return pw ? { "X-Admin-Password": pw } : {};
}

export async function fetchAllPasswords(): Promise<Record<string, string>> {
  const res = await fetch("/api/admin/passwords", {
    headers: adminHeaders(),
  });
  if (!res.ok) return {};
  return (await res.json()) as Record<string, string>;
}

export async function setBookPassword(
  bookId: string,
  password: string,
): Promise<void> {
  await fetch(`/api/admin/passwords/${encodeURIComponent(bookId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ password }),
  });
}

export async function deleteBookPassword(bookId: string): Promise<void> {
  await fetch(`/api/admin/passwords/${encodeURIComponent(bookId)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
}
