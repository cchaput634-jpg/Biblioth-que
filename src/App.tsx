import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lock, LogOut, Settings } from "lucide-react";
import { BOOKS } from "@/data/books";
import type { Book } from "@/types";
import { BookSpine } from "@/components/BookSpine";
import { Shelf } from "@/components/Shelf";
import { BookReader } from "@/components/BookReader";
import { AdminPanel } from "@/components/AdminPanel";
import {
  fetchLockedBooks,
  fetchMe,
  loginWithDiscord,
  logoutDiscord,
  type DiscordUser,
} from "@/lib/api";

type Modal = { kind: "none" } | { kind: "admin" } | { kind: "denied"; book: Book };

export function App() {
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [restricted, setRestricted] = useState<Set<string>>(new Set());
  const [allowed, setAllowed] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [me, locked] = await Promise.all([fetchMe(), fetchLockedBooks()]);
    setUser(me.user);
    setIsSuper(me.isSuper);
    setPermissions(new Set(me.permissions));
    setRestricted(new Set(locked.restrictedBookIds));
    setAllowed(new Set(locked.allowedBookIds));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const closeModal = useCallback(() => setModal({ kind: "none" }), []);
  const canManage = isSuper || permissions.has("manage_users");

  function canOpen(bookId: string): boolean {
    if (!restricted.has(bookId)) return true;
    return isSuper || allowed.has(bookId);
  }

  function handleBookClick(book: Book) {
    if (canOpen(book.id)) {
      setOpenBook(book);
    } else {
      setModal({ kind: "denied", book });
    }
  }

  async function handleDiscordLogout() {
    await logoutDiscord();
    await refresh();
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-8 pb-16">
      {/* Barre haut : Discord à gauche, Admin à droite (si permission) */}
      <div className="w-full max-w-5xl flex justify-between items-center gap-3 pt-4">
        <div>
          {user ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-skylis-300/70 text-sm">
              {user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=32`}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <span className="h-6 w-6 rounded-full bg-skylis-200 grid place-items-center text-skylis-700 text-xs font-display">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-body text-ink">{user.username}</span>
              {isSuper && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-body">
                  Super Admin
                </span>
              )}
              <button
                type="button"
                onClick={handleDiscordLogout}
                aria-label="Se déconnecter de Discord"
                title="Se déconnecter"
                className="ml-1 text-skylis-700/70 hover:text-skylis-800 no-tap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={loginWithDiscord}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1 }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#5865F2] text-white text-sm font-display tracking-wider hover:bg-[#4752C4] no-tap shadow-[0_4px_14px_-4px_rgba(88,101,242,0.6)]"
            >
              <DiscordIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Se connecter</span>
            </motion.button>
          )}
        </div>

        {canManage && (
          <motion.button
            type="button"
            onClick={() => setModal({ kind: "admin" })}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -2 }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-skylis-400/70 bg-white text-skylis-700 text-sm font-display tracking-wider hover:bg-skylis-50 no-tap"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Administration</span>
          </motion.button>
        )}
      </div>

      <header className="text-center my-6 sm:my-8">
        <p className="font-body italic text-sm sm:text-base text-skylis-700/80 tracking-wide">
          Nation du vent
        </p>
        <h1 className="font-display text-4xl sm:text-6xl tracking-wider text-skylis-gradient title-shimmer mt-1">
          Bibliothèque de Skylis
        </h1>
        <div className="mx-auto mt-4 h-px w-36 bg-gradient-to-r from-transparent via-skylis-500/70 to-transparent" />
        <p className="font-body text-sm sm:text-base text-ink-soft mt-4 max-w-xl mx-auto">
          Effleurez un dos de livre pour l'ouvrir.
        </p>
      </header>

      <section className="relative w-full max-w-5xl">
        <div className="absolute inset-y-0 -left-2 w-3 shelf-side rounded-sm hidden sm:block" />
        <div className="absolute inset-y-0 -right-2 w-3 shelf-side rounded-sm hidden sm:block" />

        <div className="py-6">
          <Shelf>
            {BOOKS.map((book, idx) => (
              <BookSpine
                key={book.id}
                book={book}
                onOpen={() => handleBookClick(book)}
                leaning={idx === BOOKS.length - 1}
                locked={restricted.has(book.id) && !canOpen(book.id)}
              />
            ))}
          </Shelf>
        </div>
      </section>

      <footer className="mt-12 text-center">
        <p className="font-body italic text-xs text-skylis-700/60 tracking-wide">
          « Que le vent porte vos lectures. »
        </p>
      </footer>

      <AnimatePresence>
        {openBook && (
          <BookReader book={openBook} onClose={() => setOpenBook(null)} />
        )}

        {modal.kind === "admin" && (
          <AdminPanel
            onClose={async () => {
              closeModal();
              await refresh();
            }}
          />
        )}

        {modal.kind === "denied" && (
          <AccessDenied
            book={modal.book}
            isLoggedIn={!!user}
            onClose={closeModal}
            onLogin={loginWithDiscord}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function AccessDenied({
  book,
  isLoggedIn,
  onClose,
  onLogin,
}: {
  book: Book;
  isLoggedIn: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-skylis-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white border border-skylis-300/70 rounded-xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-skylis-100 text-skylis-700">
            <Lock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-skylis-gradient tracking-wider truncate">
              {book.title}
            </h2>
            <p className="font-body italic text-sm text-skylis-700/80">
              Livre restreint
            </p>
          </div>
        </div>
        <p className="font-body text-sm text-ink mb-5">
          {isLoggedIn
            ? "Tu n'as pas la permission d'ouvrir ce livre. Demande à un administrateur de te l'accorder via un rôle."
            : "Ce livre est réservé à certains utilisateurs. Connecte-toi via Discord pour voir si tu y as accès."}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm font-body text-ink-soft hover:bg-skylis-50 no-tap"
          >
            Fermer
          </button>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#5865F2] text-white text-sm font-display tracking-wider hover:bg-[#4752C4] no-tap"
            >
              <DiscordIcon className="h-4 w-4" />
              Se connecter
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DiscordIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
