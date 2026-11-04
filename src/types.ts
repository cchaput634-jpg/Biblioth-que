export interface Book {
  id: string;
  title: string;
  /** Titre raccourci pour le dos (quand `title` est trop long pour être lisible vertical) */
  spineTitle?: string;
  /** Nom d'auteur ; absent = "Auteur inconnu" */
  author?: string;
  /** Chemin public vers la source HTML du livre */
  source: string;
  /** Court résumé optionnel */
  summary?: string;
  /** Couleur principale du dos (hex) */
  spineColor: string;
  /** Couleur sombre pour le dégradé du dos (côté ombres). Défaut : noircie à partir de spineColor */
  spineColorDeep?: string;
  /** Couleur secondaire pour les filets/ornements */
  accentColor?: string;
  /** Hauteur relative du livre (1 = standard, 0.9 = plus petit, 1.1 = plus grand) */
  heightScale?: number;
  /** Épaisseur relative (1 = standard) */
  thicknessScale?: number;
}
