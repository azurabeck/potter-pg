// src/pages/feiticos/functions.ts
import type { Spell } from "@/utils/types";

/** Retorna apenas os feitiços da pagina atual (1-indexed). */
export function paginateSpells(spells: Spell[], page: number, pageSize: number): Spell[] {
  const start = (page - 1) * pageSize;
  return spells.slice(start, start + pageSize);
}

export function totalPages(spellsCount: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(spellsCount / pageSize));
}

/** Quantos slots vazios faltam para completar a ultima linha da pagina. */
export function emptySlotsCount(spellsOnPage: number, columns: number): number {
  if (columns <= 0 || spellsOnPage === 0) return 0;
  const remainder = spellsOnPage % columns;
  return remainder === 0 ? 0 : columns - remainder;
}

// Estes valores precisam continuar iguais aos usados em style.scss.
// O objetivo não é impor uma quantidade por página: eles só definem o
// tamanho desejado da carta. A quantidade final é calculada pelo espaço real.
const CARD_TARGET_WIDTH = 102.5;
const CARD_ASPECT_RATIO = 100 / 139; // largura / altura
const GRID_GAP = 8.75;

export interface SpellGridMetrics {
  columns: number;
  rows: number;
  pageSize: number;
}

/**
 * Calcula quantas colunas e linhas completas cabem no espaço disponível.
 * Assim a página sempre renderiza somente cartas inteiras e todas as linhas
 * usam exatamente a mesma quantidade de colunas.
 */
export function calculateGridMetrics(
  containerWidth: number,
  containerHeight: number
): SpellGridMetrics {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { columns: 1, rows: 1, pageSize: 1 };
  }

  const columns = Math.max(
    1,
    Math.floor((containerWidth + GRID_GAP) / (CARD_TARGET_WIDTH + GRID_GAP))
  );

  const cardWidth = (containerWidth - (columns - 1) * GRID_GAP) / columns;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const rows = Math.max(
    1,
    Math.floor((containerHeight + GRID_GAP) / (cardHeight + GRID_GAP))
  );

  return {
    columns,
    rows,
    pageSize: columns * rows,
  };
}

/**
 * Maestria atual (0-10) a partir do XP salvo na ficha do personagem pra
 * esse feitiço (`CharacterHabilidade.xp`) contra a tabela `xp_maestria`
 * dele (chaves "M1".."M10", valor = XP necessário) — maior tier já
 * alcançado. Mesma lógica de `currentMasteryTier` em
 * `pages/pocoes/functions.ts` (duplicada de propósito — ver doc.md).
 */
export function currentMasteryTier(spell: Spell, currentXp: number): number {
  return Object.entries(spell.attributes.xp_maestria).reduce((tier, [key, requiredXp]) => {
    if (currentXp < requiredXp) return tier;
    const numeric = Number(key.replace(/\D/g, ""));
    return Math.max(tier, Number.isNaN(numeric) ? tier : numeric);
  }, 0);
}

/** Se o tier atual cai dentro do intervalo [from, to] de um `MasteryEffect`. */
export function matchesMasteryRange(from: number, to: number, tier: number): boolean {
  return tier >= from && tier <= to;
}

/** "M3" ou "M1-M4" — rótulo legível do intervalo de um `MasteryEffect`. */
export function masteryRangeLabel(from: number, to: number): string {
  return from === to ? `M${from}` : `M${from}-M${to}`;
}
