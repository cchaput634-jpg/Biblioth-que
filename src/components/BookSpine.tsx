import type { CSSProperties } from "react";
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

  // Dos épais pour accueillir un vrai titre lisible.
  const heightPx = Math.round(300 * h);
  const widthPx = Math.round(64 * t);

  const spine = book.spineColor;
  const spineDeep = book.spineColorDeep ?? book.spineColor;
  // Titre toujours crème clair pour un contraste AA/AAA sur n'importe quelle
  // couleur de dos sombre (le per-book accentColor ne sert plus qu'au cadenas).
  const titleColor = "#fef0b8";
  const accent = book.accentColor ?? titleColor;

  const restRotate = leaning ? -4 : 0;
  const hoverRotate = leaning ? -3 : -1;

  // Zone utile pour le titre vertical : 72% de la hauteur du dos (14% en
  // haut et en bas réservés à la décoration). Chaque caractère de Cinzel
  // occupe ≈ fontSize * 0.72 en vertical-rl (mesuré empiriquement), safety 0.78.
  const spineLabel = book.spineTitle ?? book.title;
  const usableHeight = heightPx * 0.72;
  const perChar = 0.78;
  const baseFont = widthPx * 0.42;
  // Minimum 13px pour une vraie lisibilité ; max = largeur du dos
  const titleFont = Math.max(13, Math.min(baseFont, usableHeight / (spineLabel.length * perChar)));

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
      {/* Décoration haut : deux filets + petit losange en l'air */}
      <SpineOrnament accent={accent} position="top" />

      {/* Zone bornée + centrage horizontal/vertical dans les axes NORMAUX,
          qui clip tout ce qui dépasse. L'écriture verticale est gérée par
          le span enfant pour éviter les problèmes d'axes avec writing-mode. */}
      <span
        className="absolute inset-x-0 flex items-center justify-center overflow-hidden"
        style={{ top: "14%", bottom: "14%" }}
      >
        <span
          className="font-display uppercase"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: titleColor,
            fontSize: `${titleFont}px`,
            fontWeight: 700,
            letterSpacing: "0.04em",
            lineHeight: 1,
            WebkitTextStroke: "0.3px rgba(0,0,0,0.85)",
            textShadow:
              "0 0 3px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,1)",
            whiteSpace: "nowrap",
          }}
        >
          {spineLabel}
        </span>
      </span>

      {/* Décoration bas : même ornement en miroir */}
      <SpineOrnament accent={accent} position="bottom" />

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

/**
 * Ornement haut ou bas d'un dos : deux filets horizontaux séparés par
 * un petit losange central. Occupe environ 12 % de la hauteur du dos,
 * dans la zone laissée libre au-dessus/en-dessous du titre.
 */
function SpineOrnament({
  accent,
  position,
}: {
  accent: string;
  position: "top" | "bottom";
}) {
  const edge = position === "top" ? "top" : "bottom";
  return (
    <div
      className="absolute left-[12%] right-[12%] flex flex-col items-center gap-[4px] pointer-events-none"
      style={{ [edge]: "4%" } as CSSProperties}
    >
      {position === "top" ? (
        <>
          <span className="w-full h-[1.5px]" style={{ background: accent, opacity: 0.9 }} />
          <span className="w-[70%] h-px" style={{ background: accent, opacity: 0.55 }} />
          <span
            className="block rotate-45 mt-[2px]"
            style={{
              width: "7px",
              height: "7px",
              border: `1px solid ${accent}`,
              opacity: 0.75,
            }}
          />
        </>
      ) : (
        <>
          <span
            className="block rotate-45 mb-[2px]"
            style={{
              width: "7px",
              height: "7px",
              border: `1px solid ${accent}`,
              opacity: 0.75,
            }}
          />
          <span className="w-[70%] h-px" style={{ background: accent, opacity: 0.55 }} />
          <span className="w-full h-[1.5px]" style={{ background: accent, opacity: 0.9 }} />
        </>
      )}
    </div>
  );
}
