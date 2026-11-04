/**
 * Stockage local des mots de passe de livres.
 * N'offre PAS de vraie sécurité — c'est un garde-fou de jeu de rôle :
 * les mots de passe sont lisibles côté client. À ne pas utiliser pour
 * protéger quoi que ce soit de confidentiel dans la vraie vie.
 */

const KEY = "bibliotheque:book-passwords:v1";

type PasswordMap = Record<string, string>;

function read(): PasswordMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as PasswordMap;
  } catch {
    /* ignore */
  }
  return {};
}

function write(map: PasswordMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getAllPasswords(): PasswordMap {
  return read();
}

export function hasPassword(bookId: string): boolean {
  const pw = read()[bookId];
  return typeof pw === "string" && pw.length > 0;
}

export function verifyPassword(bookId: string, attempt: string): boolean {
  const pw = read()[bookId];
  if (!pw) return true;
  return pw === attempt;
}

export function setPassword(bookId: string, password: string) {
  const map = read();
  if (password.length === 0) {
    delete map[bookId];
  } else {
    map[bookId] = password;
  }
  write(map);
}

export function removePassword(bookId: string) {
  const map = read();
  delete map[bookId];
  write(map);
}
