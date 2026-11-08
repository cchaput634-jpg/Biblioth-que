import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Book as BookIcon,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { BOOKS } from "@/data/books";
import {
  createRole,
  deleteRole,
  deleteUser,
  fetchRestrictedBooks,
  fetchRoles,
  fetchUsers,
  restrictBook,
  setUserRoles,
  unrestrictBook,
  updateRole,
  type AdminUser,
  type Role,
} from "@/lib/api";

type Tab = "roles" | "users" | "books";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("roles");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-skylis-300/70 rounded-xl shadow-[0_20px_60px_-10px_rgba(13,148,136,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-skylis-700/70 hover:text-skylis-800 hover:bg-skylis-50 no-tap z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="px-6 pt-6 pb-3">
          <h2 className="font-display text-2xl text-skylis-gradient tracking-wider">
            Administration
          </h2>
        </header>

        <nav className="px-6 border-b border-skylis-200 flex gap-1">
          <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
            <ShieldCheck className="h-4 w-4" /> Rôles
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            <UsersIcon className="h-4 w-4" /> Utilisateurs
          </TabButton>
          <TabButton active={tab === "books"} onClick={() => setTab("books")}>
            <BookIcon className="h-4 w-4" /> Livres
          </TabButton>
        </nav>

        <div className="flex-1 min-h-0 overflow-auto p-6 fancy-scroll">
          {tab === "roles" && <RolesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "books" && <BooksTab />}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-display tracking-wider border-b-2 -mb-px transition-colors no-tap ${
        active
          ? "border-skylis-600 text-skylis-800"
          : "border-transparent text-skylis-700/60 hover:text-skylis-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ================= RÔLES ================= */

function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    setRoles(await fetchRoles());
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete(role: Role) {
    if (role.isSuper) return;
    if (!confirm(`Supprimer le rôle « ${role.name} » ?`)) return;
    await deleteRole(role.id);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-body text-sm text-ink-soft">
          Un rôle regroupe des permissions. Attribue-le à un ou plusieurs utilisateurs dans l'onglet Utilisateurs.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-skylis-600 text-white text-sm font-display tracking-wider hover:bg-skylis-700 no-tap"
        >
          <Plus className="h-4 w-4" /> Nouveau rôle
        </button>
      </div>

      {loading ? (
        <p className="font-body italic text-skylis-700/80">Chargement…</p>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <RoleRow
              key={r.id}
              role={r}
              onEdit={() => setEditing(r)}
              onDelete={() => handleDelete(r)}
            />
          ))}
        </div>
      )}

      {editing && (
        <RoleEditor
          role={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
      {creating && (
        <RoleEditor
          role={null}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function RoleRow({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const permCount = role.isSuper ? "tous les droits" : `${role.permissions.length} permission${role.permissions.length > 1 ? "s" : ""}`;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-skylis-200 bg-white hover:bg-skylis-50/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display tracking-wider text-skylis-800">
            {role.name}
          </span>
          {role.isSuper && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-body">
              Super Admin
            </span>
          )}
        </div>
        <p className="text-xs text-skylis-700/70 font-body mt-0.5">
          {permCount}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={role.isSuper}
        aria-label="Modifier"
        className="p-1.5 text-skylis-700 hover:bg-skylis-100 rounded disabled:opacity-40 no-tap"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={role.isSuper}
        aria-label="Supprimer"
        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-40 no-tap"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function RoleEditor({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [perms, setPerms] = useState<Set<string>>(
    new Set(role?.permissions ?? []),
  );
  const [busy, setBusy] = useState(false);

  function togglePerm(p: string) {
    setPerms((s) => {
      const next = new Set(s);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) return;
    setBusy(true);
    if (role) {
      await updateRole(role.id, { name: name.trim(), permissions: [...perms] });
    } else {
      await createRole(name.trim(), [...perms]);
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-skylis-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl border border-skylis-300 p-5 shadow-xl max-h-[85vh] overflow-auto fancy-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-skylis-gradient tracking-wider">
            {role ? "Modifier le rôle" : "Nouveau rôle"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-skylis-700/70 hover:text-skylis-800 no-tap"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block mb-4">
          <span className="font-body text-sm text-ink-soft">Nom du rôle</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Conteur, Scribe…"
            className="mt-1 w-full rounded-md border border-skylis-300/80 bg-skylis-50/60 px-3 py-2 text-ink outline-none focus:border-skylis-500 focus:bg-white focus:ring-2 focus:ring-skylis-300/50"
          />
        </label>

        <p className="font-body text-sm text-ink-soft mb-2">Permissions</p>

        <PermCheckbox
          label="Administration — gérer rôles, utilisateurs et livres"
          desc="Accès au panneau admin + modification des rôles, utilisateurs et livres restreints."
          checked={perms.has("manage_users")}
          onChange={() => togglePerm("manage_users")}
        />

        <div className="mt-3 border-t border-skylis-100 pt-3">
          <p className="font-body text-xs uppercase tracking-widest text-skylis-700/70 mb-2">
            Ouverture de livres restreints
          </p>
          {BOOKS.map((b) => (
            <PermCheckbox
              key={b.id}
              label={b.title}
              checked={perms.has(`open_book:${b.id}`)}
              onChange={() => togglePerm(`open_book:${b.id}`)}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm font-body text-ink-soft hover:bg-skylis-50 no-tap"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !name.trim()}
            className="px-4 py-2 rounded-md text-sm font-display tracking-wider bg-skylis-600 text-white hover:bg-skylis-700 disabled:opacity-50 no-tap"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function PermCheckbox({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-start gap-2 py-1 cursor-pointer hover:bg-skylis-50/70 rounded px-2 -mx-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-skylis-600"
      />
      <div className="min-w-0">
        <div className="font-body text-sm text-ink">{label}</div>
        {desc && (
          <div className="font-body text-xs text-skylis-700/70">{desc}</div>
        )}
      </div>
    </label>
  );
}

/* ================= UTILISATEURS ================= */

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
    setUsers(u);
    setRoles(r);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggle(userId: string, roleId: string, has: boolean) {
    const user = users.find((u) => u.discord_id === userId);
    if (!user) return;
    const nextRoles = has
      ? user.roles.filter((r) => r !== roleId)
      : [...user.roles, roleId];
    setUsers((us) =>
      us.map((u) =>
        u.discord_id === userId ? { ...u, roles: nextRoles } : u,
      ),
    );
    await setUserRoles(userId, nextRoles);
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Supprimer ${u.username} ?`)) return;
    await deleteUser(u.discord_id);
    await refresh();
  }

  return loading ? (
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
            {roles.map((r) => (
              <th
                key={r.id}
                className="px-2 py-2 font-display text-xs text-skylis-700 whitespace-nowrap"
              >
                {r.name}
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
              {roles.map((r) => {
                const has = u.roles.includes(r.id);
                return (
                  <td key={r.id} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => toggle(u.discord_id, r.id, has)}
                      className="h-4 w-4 accent-skylis-600 cursor-pointer"
                      aria-label={`${u.username} a le rôle ${r.name}`}
                    />
                  </td>
                );
              })}
              <td className="text-center">
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
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
    </div>
  );
}

/* ================= LIVRES ================= */

function BooksTab() {
  const [restricted, setRestricted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setRestricted(await fetchRestrictedBooks());
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggle(bookId: string, isRestricted: boolean) {
    const next = new Set(restricted);
    if (isRestricted) next.delete(bookId);
    else next.add(bookId);
    setRestricted(next);
    if (isRestricted) await unrestrictBook(bookId);
    else await restrictBook(bookId);
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-ink-soft">
        Un livre restreint ne peut être ouvert que par un utilisateur connecté à Discord et possédant la permission correspondante via un rôle.
      </p>
      {loading ? (
        <p className="font-body italic text-skylis-700/80">Chargement…</p>
      ) : (
        <div className="space-y-2">
          {BOOKS.map((b) => {
            const isR = restricted.has(b.id);
            return (
              <label
                key={b.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-skylis-200 bg-white hover:bg-skylis-50/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isR}
                  onChange={() => toggle(b.id, isR)}
                  className="h-4 w-4 accent-skylis-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display tracking-wider text-skylis-800">
                    {b.title}
                  </div>
                  <div className="text-xs text-skylis-700/70 font-body">
                    {isR ? "Restreint" : "Public"}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
