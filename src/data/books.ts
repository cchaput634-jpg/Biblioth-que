import type { Book } from "@/types";

/**
 * Chaque livre a sa propre couleur de couverture (reprise de la version
 * historique du projet oracle). La tranche utilise cette couleur.
 */
export const BOOKS: Book[] = [
  {
    id: "grimoire-runes",
    title: "Grimoire des Runes",
    author: "Alice Hecalys",
    source: "/bibliotheque/grimoire-rune.html",
    summary: "Traduction et lecture des runes anciennes",
    spineColor: "#2a1a0a",
    spineColorDeep: "#140a04",
    accentColor: "#c9a25a",
    heightScale: 1.05,
    thicknessScale: 1.1,
  },
  {
    id: "oracle-ombrum",
    title: "Oracle Ombrum",
    author: "Alice Hecalys",
    source: "/bibliotheque/oracle-ombrum.html",
    summary: "Grimoire d'interprétation du jeu Ombrum",
    spineColor: "#1b1848",
    spineColorDeep: "#0a0820",
    accentColor: "#d4b26a",
    heightScale: 1,
    thicknessScale: 1,
  },
  {
    id: "runes-divination",
    title: "Les Runes de Divination",
    spineTitle: "Runes de Divination",
    author: "Alice Hecalys",
    source: "/bibliotheque/runes-divination.html",
    summary: "Interprétation des runes et tirages",
    spineColor: "#132a19",
    spineColorDeep: "#07140a",
    accentColor: "#c9a25a",
    heightScale: 0.95,
    thicknessScale: 0.95,
  },
  {
    id: "cristallomancie",
    title: "Cristallomancie",
    author: "Alice Hecalys",
    source: "/bibliotheque/cristallomancie.html",
    summary: "Lecture et interprétation de la boule de cristal",
    spineColor: "#0e1a33",
    spineColorDeep: "#060c1a",
    accentColor: "#8aa6e0",
    heightScale: 1.1,
    thicknessScale: 1.05,
  },
  {
    id: "livre-des-rituels",
    title: "Livre des Rituels de Skylis",
    spineTitle: "Rituels de Skylis",
    source: "/bibliotheque/livre-des-rituels.html",
    summary: "Rituels de la nation du vent",
    spineColor: "#1f4673",
    spineColorDeep: "#0d2340",
    accentColor: "#e0ecff",
    heightScale: 1.08,
    thicknessScale: 1.15,
  },
];
