// src/pages/pocoes/functions.ts
import type { Potion } from "@/utils/types";

/** Retorna apenas as poções da pagina atual (1-indexed). */
export function paginatePotions(potions: Potion[], page: number, pageSize: number): Potion[] {
  const start = (page - 1) * pageSize;
  return potions.slice(start, start + pageSize);
}

export function totalPages(potionsCount: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(potionsCount / pageSize));
}

/** Quantos slots vazios faltam para completar a ultima linha da pagina. */
export function emptySlotsCount(potionsOnPage: number, columns: number): number {
  if (columns <= 0 || potionsOnPage === 0) return 0;
  const remainder = potionsOnPage % columns;
  return remainder === 0 ? 0 : columns - remainder;
}

// Estes valores precisam continuar iguais aos usados em style.scss e no
// card (mesmo aspect-ratio de feiticos/spell-card, pra manter o mesmo layout).
const CARD_TARGET_WIDTH = 102.5;
const CARD_ASPECT_RATIO = 100 / 139;
const GRID_GAP = 8.75;

export interface PotionGridMetrics {
  columns: number;
  rows: number;
  pageSize: number;
}

/**
 * Calcula quantas colunas e linhas completas cabem no espaço disponível.
 * Mesma lógica de `calculateGridMetrics` em `pages/feiticos/functions.ts`
 * — duplicada aqui porque cada página deste app é autocontida (ver doc).
 */
export function calculateGridMetrics(containerWidth: number, containerHeight: number): PotionGridMetrics {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { columns: 1, rows: 1, pageSize: 1 };
  }

  const columns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (CARD_TARGET_WIDTH + GRID_GAP)));

  const cardWidth = (containerWidth - (columns - 1) * GRID_GAP) / columns;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const rows = Math.max(1, Math.floor((containerHeight + GRID_GAP) / (cardHeight + GRID_GAP)));

  return { columns, rows, pageSize: columns * rows };
}

/**
 * Maestria atual (0-10) a partir do XP salvo na ficha do personagem pra
 * essa poção (`CharacterPocao.xp`) contra a tabela `xp_maestria` dela
 * (chaves "M1".."M10", valor = XP necessário) — maior tier já alcançado.
 */
export function currentMasteryTier(potion: Potion, currentXp: number): number {
  return Object.entries(potion.xp_maestria).reduce((tier, [key, requiredXp]) => {
    if (currentXp < requiredXp) return tier;
    const numeric = Number(key.replace(/\D/g, ""));
    return Math.max(tier, Number.isNaN(numeric) ? tier : numeric);
  }, 0);
}

/** "1-4" ou "10" — se o tier atual cai dentro da faixa de um `mastery_effect`. */
export function matchesMasteryRange(range: string, tier: number): boolean {
  const [minRaw, maxRaw] = range.split("-");
  const min = Number(minRaw);
  const max = maxRaw !== undefined ? Number(maxRaw) : min;
  if (Number.isNaN(min) || Number.isNaN(max)) return false;
  return tier >= min && tier <= max;
}
