/**
 * Client API — modèle rôles & permissions.
 *
 * - Login Discord OAuth
 * - Permissions effectives du user courant (via rôles)
 * - Super Admin = tous les droits implicitement
 * - Un livre est "restreint" ou "public" ; un livre restreint nécessite
 *   la permission open_book:<id> pour être ouvert.
 */

/* -------- Types -------- */

export interface DiscordUser {
  discord_id: string;
  username: string;
  avatar: string | null;
}

export interface MeResponse {
  user: DiscordUser | null;
  permissions: string[];
  isSuper: boolean;
}

export interface Role {
  id: string;
  name: string;
  isSuper: boolean;
  permissions: string[];
}

export interface AdminUser {
  discord_id: string;
  username: string;
  avatar: string | null;
  last_seen: number;
  roles: string[]; // role ids
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

/* -------- Auth Discord -------- */

export async function fetchMe(): Promise<MeResponse> {
  const data = await apiJson<MeResponse>("/api/auth/me");
  return (
    data ?? { user: null, permissions: [], isSuper: false }
  );
}

export function loginWithDiscord() {
  const returnTo = window.location.pathname + window.location.search;
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logoutDiscord(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/* -------- Livres -------- */

export interface LockedResponse {
  restrictedBookIds: string[]; // livres marqués restreints
  allowedBookIds: string[]; // parmi les restreints, ceux que le user peut ouvrir
}

export async function fetchLockedBooks(): Promise<LockedResponse> {
  const data = await apiJson<LockedResponse>("/api/locked");
  return data ?? { restrictedBookIds: [], allowedBookIds: [] };
}

/* -------- Admin : rôles -------- */

export async function fetchRoles(): Promise<Role[]> {
  const data = await apiJson<Role[]>("/api/admin/roles");
  return data ?? [];
}

export async function createRole(
  name: string,
  permissions: string[],
): Promise<string | null> {
  const data = await apiJson<{ id: string }>("/api/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, permissions }),
  });
  return data?.id ?? null;
}

export async function updateRole(
  roleId: string,
  patch: { name?: string; permissions?: string[] },
): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/admin/roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteRole(roleId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/admin/roles/${encodeURIComponent(roleId)}`, {
    method: "DELETE",
  });
}

/* -------- Admin : utilisateurs -------- */

export async function fetchUsers(): Promise<AdminUser[]> {
  const data = await apiJson<AdminUser[]>("/api/admin/users");
  return data ?? [];
}

export async function setUserRoles(
  userId: string,
  roleIds: string[],
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(userId)}/roles`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: roleIds }),
    },
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

/* -------- Admin : livres restreints -------- */

export async function fetchRestrictedBooks(): Promise<Set<string>> {
  const data = await apiJson<{ restrictedBookIds: string[] }>("/api/admin/books");
  return new Set(data?.restrictedBookIds ?? []);
}

export async function restrictBook(bookId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/admin/books/${encodeURIComponent(bookId)}`, {
    method: "PUT",
  });
}

export async function unrestrictBook(bookId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/admin/books/${encodeURIComponent(bookId)}`, {
    method: "DELETE",
  });
}
