import type { Tool } from "./types.js";

const calculator: Tool = {
  name: "calculator",
  description: "Évalue une expression arithmétique (chiffres et + - * / ( ) seulement).",
  async run(input) {
    if (!/^[0-9+\-*/().\s]+$/.test(input)) return "Erreur : expression non autorisée";
    try {
      const value = Function(`"use strict"; return (${input});`)() as number;
      return Number.isFinite(value) ? String(value) : "Erreur : résultat invalide";
    } catch {
      return "Erreur : expression invalide";
    }
  },
};

const wordCount: Tool = {
  name: "word_count",
  description: "Compte le nombre de mots d'un texte.",
  async run(input) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    return String(words.length);
  },
};

/** Catalogue d'outils disponibles sur la plateforme. */
export const builtinTools: Record<string, Tool> = {
  [calculator.name]: calculator,
  [wordCount.name]: wordCount,
};
