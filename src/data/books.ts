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
    spineColor: "#703a24",
    spineColorDeep: "#3a1c10",
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
    spineColor: "#4d2e82",
    spineColorDeep: "#251548",
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
    // Vert émeraude foncé
    spineColor: "#265a3b",
    spineColorDeep: "#102d1c",
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
    spineColor: "#2d4486",
    spineColorDeep: "#141f48",
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
    spineColor: "#1c5c70",
    spineColorDeep: "#0c2e3a",
    accentColor: "#e0f5fa",
    heightScale: 1.08,
    thicknessScale: 1.15,
  },
];
