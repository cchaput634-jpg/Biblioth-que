import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  submitLabel?: string;
  /** Si true, affiche le mot de passe en clair (utile pour l'édition en mode admin) */
  revealByDefault?: boolean;
  onCancel: () => void;
  /** Retourner true pour fermer, false pour afficher "mot de passe incorrect" */
  onSubmit: (password: string) => boolean | Promise<boolean>;
}

/**
 * Modal générique pour saisir un mot de passe.
 */
export function PasswordDialog({
  title,
  description,
  submitLabel = "Valider",
  revealByDefault = false,
  onCancel,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(revealByDefault);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onSubmit(value);
      if (!ok) {
        setError("Mot de passe incorrect.");
        setValue("");
        inputRef.current?.focus();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-skylis-900/40 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <motion.form
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white border border-skylis-300/70 rounded-xl shadow-[0_20px_60px_-10px_rgba(13,148,136,0.45)] p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-skylis-700/70 hover:text-skylis-800 hover:bg-skylis-50 no-tap"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-skylis-100 text-skylis-700">
            <Lock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-skylis-gradient tracking-wider truncate">
              {title}
            </h2>
            {description && (
              <p className="font-body italic text-sm text-skylis-700/80 truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        <label className="block">
          <span className="font-body text-sm text-ink-soft">Mot de passe</span>
          <div className="relative mt-1">
            <input
              ref={inputRef}
              type={reveal ? "text" : "password"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              autoComplete="off"
              className="w-full rounded-md border border-skylis-300/80 bg-skylis-50/60 pl-3 pr-10 py-2 text-ink outline-none focus:border-skylis-500 focus:bg-white focus:ring-2 focus:ring-skylis-300/50"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={reveal ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-skylis-700/70 hover:text-skylis-800 no-tap"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error && (
          <p className="mt-2 text-sm text-rose-600 font-body">{error}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-md text-sm font-body text-ink-soft hover:bg-skylis-50 no-tap"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-md text-sm font-display tracking-wider bg-skylis-600 text-white hover:bg-skylis-700 disabled:opacity-50 no-tap shadow-[0_4px_12px_-4px_rgba(13,148,136,0.6)]"
          >
            {submitLabel}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
