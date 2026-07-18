// src/utils/index.ts
// Funcoes utilitarias puras, sem dependencia de React ou Firebase,
// pensadas para serem reaproveitadas em varias paginas/components.

import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import type { Character, Spell } from "./types";

/** "1" -> "1º ANO" (usado no badge do card de feitico). */
export function formatAno(ano: number): string {
  return `${ano}º`;
}

/**
 * Extrai só a parte curta do alcance. "Médio (até 30 metros)" -> "Médio".
 * A maioria dos feitiços reais não tem `range` cadastrado; "—" nesse caso.
 */
export function shortRange(range: string | undefined): string {
  if (!range) return "—";
  return range.split("(")[0].trim();
}

/** Maior valor de dano/efeito descrito em mastery_effects (ex: card "DANO MÁXIMO"). */
export function highestMasteryValue(spell: Spell): string {
  const effects = spell.attributes.mastery_effects;
  if (effects && effects.length > 0) return effects[effects.length - 1].value.toUpperCase();
  return spell.attributes.effect_value?.toUpperCase() ?? "-";
}

/** Menor valor (mastery inicial), usado no card como "DANO INICIAL". */
export function lowestMasteryValue(spell: Spell): string {
  const effects = spell.attributes.mastery_effects;
  if (effects && effects.length > 0) return effects[0].value.toUpperCase();
  return spell.attributes.effect_value?.toUpperCase() ?? "-";
}

/**
 * Define se um feitico esta bloqueado para o personagem atual: desbloqueado
 * quando o personagem tem uma entrada em `habilidades` cuja chave é o id
 * do feitico (mesmo id do documento na colecao "spells"). Sem personagem
 * ativo, cai na regra antiga (nivel_geral do stub vs `required` do feitico).
 */
export function isSpellLocked(spell: Spell, activeCharacter: Character | null): boolean {
  if (activeCharacter) {
    return !(spell.id in activeCharacter.habilidades);
  }
  return spell.attributes.required > CURRENT_CHARACTER_STUB.nivel_geral;
}

/** Normaliza a categoria do card para exibicao (ex: "ofensivo" -> "Ofensivo"). */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Junta classes CSS condicionalmente, ignorando valores falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "Tomas Black" -> "TB" (usado nos avatares quando não há foto). */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}
