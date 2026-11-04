import type { ReactNode } from "react";

/**
 * Une étagère en bois clair / turquoise avec planche + ombre.
 * Les livres sont placés DANS la zone au-dessus de la planche, alignés en bas.
 */
export function Shelf({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="relative min-h-[300px] flex items-end justify-center gap-4 sm:gap-5 px-8 pb-2">
        {children}
      </div>

      {/* La planche — en dessous des livres, pleine largeur */}
      <div className="relative h-5 shelf-plank mx-2" />
    </div>
  );
}
