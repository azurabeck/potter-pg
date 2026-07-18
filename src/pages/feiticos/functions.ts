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

/** Quantos slots "bloqueado/vazio" faltam para completar a grade da pagina. */
export function emptySlotsCount(spellsOnPage: number, pageSize: number): number {
  return Math.max(0, pageSize - spellsOnPage);
}

// Precisam bater com o CSS de .feiticos-page__grid / .spell-card
// (style.scss): minmax(<CARD_MIN_WIDTH>px, 1fr), gap <GRID_GAP>px e
// aspect-ratio 3/4 no card.
const CARD_MIN_WIDTH = 130;
const CARD_ASPECT_RATIO = 3 / 4; // largura / altura
const GRID_GAP = 14;

/**
 * Calcula quantos cards de feitiço cabem, sem cortar nenhum, dentro de um
 * container com as dimensoes dadas — replica o mesmo calculo de colunas
 * (auto-fill/minmax) e linhas que o CSS do grid faz, pra saber de antemao
 * quantos itens renderizar por "pagina".
 */
export function calculateFitCount(containerWidth: number, containerHeight: number): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 0;

  const columns = Math.max(
    1,
    Math.floor((containerWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP))
  );
  const itemWidth = (containerWidth - (columns - 1) * GRID_GAP) / columns;
  const itemHeight = itemWidth / CARD_ASPECT_RATIO;
  const rows = Math.max(1, Math.floor((containerHeight + GRID_GAP) / (itemHeight + GRID_GAP)));

  return columns * rows;
}
