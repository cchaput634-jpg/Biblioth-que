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

  // Dos un peu plus épais pour laisser de la place à un titre lisible.
  const heightPx = Math.round(280 * h);
  const widthPx = Math.round(56 * t);

  const spine = book.spineColor;
  const spineDeep = book.spineColorDeep ?? book.spineColor;
  const accent = book.accentColor ?? "rgba(255,255,255,0.95)";

  const restRotate = leaning ? -4 : 0;
  const hoverRotate = leaning ? -3 : -1;

  // Zone utile pour le titre vertical : 90% de la hauteur du dos (plus de filets).
  // En écriture verticale, le navigateur applique la line-height intrinsèque
  // de la police (Cinzel ~1.3) sur l'axe inline (vertical). On est donc large
  // avec perChar = 1.35 pour éviter tout débordement.
  const spineLabel = book.spineTitle ?? book.title;
  const usableHeight = heightPx * 0.9;
  const perChar = 1.35;
  const baseFont = widthPx * 0.32;
  // Minimum 10px pour garder de la lisibilité, maximum = largeur du dos
  const titleFont = Math.max(10, Math.min(baseFont, usableHeight / (spineLabel.length * perChar)));

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
      {/* Titre écrit verticalement — centré, taille adaptée pour tenir dans le dos */}
      <span
        className="absolute inset-y-[5%] left-1/2 flex items-center justify-center font-display uppercase overflow-hidden"
        style={{
          writingMode: "vertical-rl",
          transform: "translateX(-50%) rotate(180deg)",
          color: accent,
          fontSize: `${titleFont}px`,
          fontWeight: 600,
          letterSpacing: "0.03em",
          lineHeight: 1,
          // Double ombre pour un contour discret qui garantit la lisibilité
          // sur n'importe quelle couleur de dos
          textShadow:
            "0 0 2px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
      >
        {spineLabel}
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
