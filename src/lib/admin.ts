/**
 * Mode admin : déverrouillé via le mot de passe maître "Skylis4Ever".
 * L'état est gardé en sessionStorage (persistant sur rechargement, perdu
 * à la fermeture de l'onglet).
 */

const MASTER_PASSWORD = "Skylis4Ever";
const SESSION_KEY = "bibliotheque:admin:v1";

export function isAdminEnabled(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableAdmin(attempt: string): boolean {
  if (attempt !== MASTER_PASSWORD) return false;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  return true;
}

export function disableAdmin() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
