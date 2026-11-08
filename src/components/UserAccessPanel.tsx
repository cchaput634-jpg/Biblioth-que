import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Trash2, UserRound } from "lucide-react";
import { BOOKS } from "@/data/books";
import {
  deleteUser,
  fetchUsers,
  grantAccess,
  revokeAccess,
  type AdminUser,
} from "@/lib/api";

interface Props {
  onClose: () => void;
}

/** Modal admin : gère les accès par livre pour chaque user Discord connecté. */
export function UserAccessPanel({ onClose }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setUsers(await fetchUsers());
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function toggle(userId: string, bookId: string, currentlyHas: boolean) {
    // Optimistic update
    setUsers((us) =>
      us.map((u) =>
        u.discord_id !== userId
          ? u
          : {
              ...u,
              books: currentlyHas
                ? u.books.filter((b) => b !== bookId)
                : [...u.books, bookId],
            },
      ),
    );
    if (currentlyHas) await revokeAccess(userId, bookId);
    else await grantAccess(userId, bookId);
  }

  async function handleDelete(userId: string, username: string) {
    if (!confirm(`Supprimer ${username} et tous ses accès ?`)) return;
    await deleteUser(userId);
    await refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-skylis-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-auto bg-white border border-skylis-300/70 rounded-xl shadow-[0_20px_60px_-10px_rgba(13,148,136,0.45)] p-6 fancy-scroll"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-skylis-700/70 hover:text-skylis-800 hover:bg-skylis-50 no-tap"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-skylis-100 text-skylis-700">
            <UserRound className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl text-skylis-gradient tracking-wider">
            Accès des utilisateurs
          </h2>
        </div>

        {loading ? (
          <p className="font-body italic text-skylis-700/80">Chargement…</p>
        ) : users.length === 0 ? (
          <p className="font-body italic text-skylis-700/80">
            Aucun utilisateur ne s'est encore connecté via Discord.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-skylis-200">
                  <th className="text-left py-2 pr-3 font-display tracking-wider text-skylis-700">
                    Utilisateur
                  </th>
                  {BOOKS.map((b) => (
                    <th
                      key={b.id}
                      className="px-2 py-2 font-display text-xs text-skylis-700 whitespace-nowrap"
                      title={b.title}
                    >
                      {b.spineTitle ?? b.title}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.discord_id} className="border-b border-skylis-100/70">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {u.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=32`}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <span className="h-8 w-8 rounded-full bg-skylis-200 grid place-items-center text-skylis-700">
                            {u.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-body text-ink truncate">
                          {u.username}
                        </span>
                      </div>
                    </td>
                    {BOOKS.map((b) => {
                      const has = u.books.includes(b.id);
                      return (
                        <td key={b.id} className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={has}
                            onChange={() => toggle(u.discord_id, b.id, has)}
                            className="h-4 w-4 accent-skylis-600 cursor-pointer"
                            aria-label={`Accès ${u.username} à ${b.title}`}
                          />
                        </td>
                      );
                    })}
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(u.discord_id, u.username)}
                        className="text-rose-600 hover:bg-rose-50 rounded p-1 no-tap"
                        aria-label={`Supprimer ${u.username}`}
                        title="Supprimer cet utilisateur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-body italic text-xs text-skylis-700/70 mt-4">
              Une case cochée = l'utilisateur peut ouvrir ce livre sans entrer
              de mot de passe quand il est connecté à Discord.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
