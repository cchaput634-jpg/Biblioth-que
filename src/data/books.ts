import type { Book } from "@/types";

/**
 * Palette de 5 teintes mi-saturées, toutes à la même luminosité (~45 % L
 * en HSL) pour qu'elles se détachent du fond turquoise clair tout en
 * restant distinctes les unes des autres : terracotta, violet, émeraude,
 * saphir, turquoise profond.
 */
export const BOOKS: Book[] = [
  {
    id: "grimoire-runes",
    title: "Grimoire des Runes",
    author: "Alice Hecalys",
    source: "/bibliotheque/grimoire-rune.html",
    summary: "Traduction et lecture des runes anciennes",
    // Terracotta / cuir brûlé
    spineColor: "#a85a3a",
    spineColorDeep: "#5c2d1c",
    accentColor: "#f6e0b8",
    heightScale: 1.05,
    thicknessScale: 1.1,
  },
  {
    id: "oracle-ombrum",
    title: "Oracle Ombrum",
    author: "Alice Hecalys",
    source: "/bibliotheque/oracle-ombrum.html",
    summary: "Grimoire d'interprétation du jeu Ombrum",
    // Violet royal
    spineColor: "#7a4bb5",
    spineColorDeep: "#3d2370",
    accentColor: "#f0e2ff",
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
    // Vert émeraude
    spineColor: "#3f9a63",
    spineColorDeep: "#1e5234",
    accentColor: "#e4f5e8",
    heightScale: 0.95,
    thicknessScale: 0.95,
  },
  {
    id: "cristallomancie",
    title: "Cristallomancie",
    author: "Alice Hecalys",
    source: "/bibliotheque/cristallomancie.html",
    summary: "Lecture et interprétation de la boule de cristal",
    // Bleu saphir
    spineColor: "#4a6ec4",
    spineColorDeep: "#1f3375",
    accentColor: "#e0eaff",
    heightScale: 1.1,
    thicknessScale: 1.05,
  },
  {
    id: "livre-des-rituels",
    title: "Livre des Rituels de Skylis",
    spineTitle: "Rituels de Skylis",
    source: "/bibliotheque/livre-des-rituels.html",
    summary: "Rituels de la nation du vent",
    // Turquoise profond (Skylis)
    spineColor: "#2e8ba3",
    spineColorDeep: "#124a5c",
    accentColor: "#e0f5fa",
    heightScale: 1.08,
    thicknessScale: 1.15,
  },
];
