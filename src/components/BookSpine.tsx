import { motion } from "motion/react";
import { Lock, Pencil } from "lucide-react";
import type { Book } from "@/types";

interface Props {
  book: Book;
  onOpen: () => void;
  /** Rend le livre légèrement incliné contre son voisin (dernier de l'étagère) */
  leaning?: boolean;
  /** Livre protégé par un mot de passe */
  locked?: boolean;
  /** Mode admin actif : montre un petit crayon */
  adminMode?: boolean;
}

/**
 * Dos de livre rangé verticalement sur l'étagère.
 * Les dimensions se calculent par rapport à la hauteur fournie en px via style.
 */
export function BookSpine({ book, onOpen, leaning = false, locked = false, adminMode = false }: Props) {
  const h = book.heightScale ?? 1;
  const t = book.thicknessScale ?? 1;

  const heightPx = Math.round(260 * h);
  const widthPx = Math.round(46 * t);

  const spine = book.spineColor;
  const spineDeep = book.spineColorDeep ?? book.spineColor;
  const accent = book.accentColor ?? "rgba(255,255,255,0.85)";

  const restRotate = leaning ? -4 : 0;
  const hoverRotate = leaning ? -3 : -1;

  // Zone utile pour le titre vertical : 76% de la hauteur du dos (marge de sécurité).
  // Chaque caractère occupe ≈ fontSize * (line-height 0.95 + letter-spacing 0.05em)
  // + petite marge pour les ascendantes/descendantes = ~1.15.
  const usableHeight = heightPx * 0.76;
  const perChar = 1.15;
  const baseFont = widthPx * 0.28;
  const titleFont = Math.max(7, Math.min(baseFont, usableHeight / (book.title.length * perChar)));

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Ouvrir : ${book.title}`}
      className="book-spine relative no-tap"
      style={{
        height: `${heightPx}px`,
        width: `${widthPx}px`,
        background: `
          linear-gradient(90deg,
            rgba(0,0,0,0.45) 0%,
            ${spine} 30%,
            ${spine} 70%,
            ${spineDeep} 100%
          )
        `,
        borderRadius: "3px 3px 2px 2px",
        transformOrigin: "bottom left",
        marginLeft: leaning ? "8px" : undefined,
      }}
      initial={{ y: 20, opacity: 0, rotate: restRotate }}
      animate={{ y: 0, opacity: 1, rotate: restRotate }}
      whileHover={{ y: -14, rotate: hoverRotate }}
      whileTap={{ scale: 0.97, rotate: restRotate }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
    >
      {/* Deux filets d'ornement en haut (au-dessus du titre) */}
      <span
        className="absolute left-[12%] right-[12%] top-[6%] h-px"
        style={{ background: accent, opacity: 0.85 }}
      />
      <span
        className="absolute left-[12%] right-[12%] top-[calc(6%+5px)] h-px"
        style={{ background: accent, opacity: 0.45 }}
      />

      {/* Deux filets symétriques en bas (sous le titre) */}
      <span
        className="absolute left-[12%] right-[12%] bottom-[6%] h-px"
        style={{ background: accent, opacity: 0.85 }}
      />
      <span
        className="absolute left-[12%] right-[12%] bottom-[calc(6%+5px)] h-px"
        style={{ background: accent, opacity: 0.45 }}
      />

      {/* Titre écrit verticalement — centré, taille adaptée pour tenir dans le dos */}
      <span
        className="absolute inset-y-[12%] left-1/2 flex items-center justify-center font-display uppercase overflow-hidden"
        style={{
          writingMode: "vertical-rl",
          transform: "translateX(-50%) rotate(180deg)",
          color: accent,
          fontSize: `${titleFont}px`,
          letterSpacing: "0.05em",
          lineHeight: 0.95,
          textShadow: "0 1px 2px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {book.title}
      </span>

      {/* Cadenas si le livre est verrouillé */}
      {locked && (
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-[6%] grid place-items-center rounded-full"
          style={{
            width: `${Math.max(14, widthPx * 0.42)}px`,
            height: `${Math.max(14, widthPx * 0.42)}px`,
            background: accent,
            color: spineDeep,
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
          aria-label="Verrouillé"
        >
          <Lock style={{ width: "60%", height: "60%" }} strokeWidth={2.5} />
        </span>
      )}

      {/* Indicateur mode admin */}
      {adminMode && (
        <span
          className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-skylis-600 text-white shadow-md ring-2 ring-white"
          aria-label="Éditer le mot de passe"
        >
          <Pencil className="h-3 w-3" />
        </span>
      )}
    </motion.button>
  );
}
