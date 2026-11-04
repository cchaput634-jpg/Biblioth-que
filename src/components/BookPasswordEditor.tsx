import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Key, Trash2 } from "lucide-react";
import type { Book } from "@/types";
import { getAllPasswords, setPassword, removePassword } from "@/lib/passwords";

interface Props {
  book: Book;
  onClose: () => void;
}

/**
 * Modal d'édition du mot de passe d'un livre (mode admin).
 * Affiche le mot de passe actuel, permet de le changer ou de l'enlever.
 */
export function BookPasswordEditor({ book, onClose }: Props) {
  const current = getAllPasswords()[book.id] ?? "";
  const [value, setValue] = useState(current);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPassword(book.id, value);
    setSaved(true);
    setTimeout(onClose, 650);
  }

  function handleRemove() {
    removePassword(book.id);
    setValue("");
    setSaved(true);
    setTimeout(onClose, 650);
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
      <motion.form
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white border border-skylis-300/70 rounded-xl shadow-[0_20px_60px_-10px_rgba(13,148,136,0.45)] p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-skylis-700/70 hover:text-skylis-800 hover:bg-skylis-50 no-tap"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-skylis-100 text-skylis-700">
            <Key className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-skylis-gradient tracking-wider truncate">
              Verrou du livre
            </h2>
            <p className="font-body italic text-sm text-skylis-700/80 truncate">
              {book.title}
            </p>
          </div>
        </div>

        <label className="block">
          <span className="font-body text-sm text-ink-soft">
            Mot de passe {current ? "(actuel affiché, modifiable)" : "(laisser vide = aucun verrou)"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            placeholder="Aucun mot de passe"
            className="mt-1 w-full rounded-md border border-skylis-300/80 bg-skylis-50/60 px-3 py-2 text-ink outline-none focus:border-skylis-500 focus:bg-white focus:ring-2 focus:ring-skylis-300/50"
          />
        </label>

        {saved && (
          <p className="mt-2 text-sm text-skylis-700 font-body italic">
            Enregistré.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={!current}
            title="Supprimer le mot de passe"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-body text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent no-tap"
          >
            <Trash2 className="h-4 w-4" /> Enlever
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md text-sm font-body text-ink-soft hover:bg-skylis-50 no-tap"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-display tracking-wider bg-skylis-600 text-white hover:bg-skylis-700 no-tap shadow-[0_4px_12px_-4px_rgba(13,148,136,0.6)]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
