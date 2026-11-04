import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lock, Unlock } from "lucide-react";
import { BOOKS } from "@/data/books";
import type { Book } from "@/types";
import { BookSpine } from "@/components/BookSpine";
import { Shelf } from "@/components/Shelf";
import { BookReader } from "@/components/BookReader";
import { PasswordDialog } from "@/components/PasswordDialog";
import { BookPasswordEditor } from "@/components/BookPasswordEditor";
import {
  fetchLockedBooks,
  isAdminEnabled,
  logoutAdmin,
  verifyAdminPassword,
  verifyBookPassword,
} from "@/lib/api";

type Modal =
  | { kind: "none" }
  | { kind: "master" }
  | { kind: "unlock"; book: Book }
  | { kind: "edit"; book: Book };

export function App() {
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [admin, setAdmin] = useState<boolean>(() => isAdminEnabled());
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [locked, setLocked] = useState<Set<string>>(new Set());

  const refreshLocked = useCallback(async () => {
    setLocked(await fetchLockedBooks());
  }, []);

  useEffect(() => {
    void refreshLocked();
  }, [refreshLocked]);

  const closeModal = useCallback(() => setModal({ kind: "none" }), []);

  function handleBookClick(book: Book) {
    if (admin) {
      setModal({ kind: "edit", book });
      return;
    }
    if (locked.has(book.id)) {
      setModal({ kind: "unlock", book });
    } else {
      setOpenBook(book);
    }
  }

  function handlePadlockClick() {
    if (admin) {
      logoutAdmin();
      setAdmin(false);
    } else {
      setModal({ kind: "master" });
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-8 pb-16">
      {/* Bouton cadenas en haut à droite */}
      <div className="w-full max-w-5xl flex justify-end pt-4">
        <motion.button
          type="button"
          onClick={handlePadlockClick}
          whileTap={{ scale: 0.9 }}
          whileHover={{ y: -2 }}
          aria-label={admin ? "Quitter le mode administrateur" : "Mode administrateur"}
          title={admin ? "Quitter le mode administrateur" : "Mode administrateur"}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-display tracking-wider no-tap transition-colors ${
            admin
              ? "bg-skylis-600 text-white border-skylis-700 shadow-[0_6px_20px_-6px_rgba(13,148,136,0.7)]"
              : "bg-white/70 text-skylis-700 border-skylis-300/70 hover:bg-white hover:border-skylis-500"
          }`}
        >
          {admin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {admin ? "Admin actif" : "Admin"}
          </span>
        </motion.button>
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
          {admin
            ? "Mode administrateur — cliquez un livre pour éditer son mot de passe."
            : "Effleurez un dos de livre pour l'ouvrir."}
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
                locked={locked.has(book.id)}
                adminMode={admin}
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

        {modal.kind === "master" && (
          <PasswordDialog
            key="master"
            title="Mode administrateur"
            description="Entrez le mot de passe maître."
            submitLabel="Déverrouiller"
            onCancel={closeModal}
            onSubmit={async (pw) => {
              const ok = await verifyAdminPassword(pw);
              if (ok) {
                setAdmin(true);
                closeModal();
                return true;
              }
              return false;
            }}
          />
        )}

        {modal.kind === "unlock" && (
          <PasswordDialog
            key={`unlock-${modal.book.id}`}
            title={modal.book.title}
            description="Ce livre est verrouillé."
            submitLabel="Ouvrir"
            onCancel={closeModal}
            onSubmit={async (pw) => {
              if (modal.kind !== "unlock") return false;
              const ok = await verifyBookPassword(modal.book.id, pw);
              if (ok) {
                const b = modal.book;
                closeModal();
                setOpenBook(b);
                return true;
              }
              return false;
            }}
          />
        )}

        {modal.kind === "edit" && (
          <BookPasswordEditor
            key={`edit-${modal.book.id}`}
            book={modal.book}
            onSaved={refreshLocked}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
