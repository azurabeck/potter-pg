// src/pages/feiticos/components/spell-card/functions.ts
import type { Spell } from "@/utils/types";

export type CardCategory =
  | "ataque"
  | "ofensivo"
  | "controle"
  | "utilitario"
  | "imobilizacao"
  | "defesa"
  | "movimento"
  | string;

// Chaves sem acento (ver normalizeCategory) para virarem classe CSS
// (spell-card__badge--<chave>) e rótulo de exibição.
export const CATEGORY_LABEL: Record<string, string> = {
  ataque: "Ataque",
  ofensivo: "Ofensivo",
  controle: "Controle",
  utilitario: "Utilitário",
  imobilizacao: "Imobilização",
  defesa: "Defesa",
  movimento: "Movimento",
};

/**
 * Imagem usada pro feitiço: desbloqueado sempre usa `card_image_url`
 * (arte completa). Bloqueado usa `image_url`, com fallback pra `image`
 * quando `image_url` não existir.
 */
export function spellImageUrl(spell: Spell, locked: boolean): string {
  const a = spell.attributes;
  if (!locked) return a.card_image_url;
  return a.image_url || a.image;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Normaliza a categoria do feitiço (campo `category`, com fallback pro
 * legado `card_category`) pra minúsculo sem acento — usado tanto como
 * chave de `CATEGORY_LABEL` quanto como modificador de classe CSS.
 */
export function normalizeCategory(spell: Spell): string {
  const raw = spell.attributes.category ?? spell.attributes.card_category ?? "";
  return raw.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

/** Duração legível a partir do campo `concentration` (fallback simples). */
export function spellDuration(spell: Spell): string {
  return spell.attributes.concentration === true ? "Sustentada" : "Instantâneo";
}

/** Rótulo curto de efeito exibido no rodapé do card para categorias não-ofensivas. */
export function shortEffectLabel(spell: Spell): string {
  const firstSentence = spell.attributes.effect.split(".")[0];
  const firstClause = firstSentence.split(",")[0];
  const words = firstClause.trim().split(" ");
  return words.slice(0, 3).join(" ");
}
