import { motion } from "motion/react";
import { X } from "lucide-react";
import type { Book } from "@/types";

export function BookReader({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <motion.div
      key="reader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col bg-skylis-50/95 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 border-b border-skylis-300/60 bg-white/85 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <h3 className="font-display text-lg sm:text-2xl tracking-wider text-skylis-gradient truncate">
            {book.title}
          </h3>
          <p className="font-body italic text-xs sm:text-sm text-skylis-700/80 truncate">
            {book.author ? `écrit par ${book.author}` : "Auteur inconnu"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le livre"
          className="shrink-0 grid h-10 w-10 place-items-center rounded-full border border-skylis-400/60 bg-white text-skylis-700 hover:bg-skylis-100 hover:border-skylis-500 transition-colors no-tap"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.header>

      <div className="flex-1 min-h-0 bg-white" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={book.source}
          title={book.title}
          className="w-full h-full border-0 bg-white"
          allow="fullscreen"
        />
      </div>
    </motion.div>
  );
}
