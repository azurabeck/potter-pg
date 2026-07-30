// src/pages/pocoes/components/potion-card/functions.ts
import type { Potion } from "@/utils/types";

/**
 * Imagem usada pra poção: desbloqueada prefere `card_image_url` (arte
 * completa), com fallback pra `image_url` quando não existir (a maioria
 * das poções ainda não tem `card_image_url` cadastrada — mesma situação
 * de `spellImageUrl` em `pages/feiticos/components/spell-card/functions.ts`).
 * Bloqueada usa `image_url`, com fallback pra `card_image_url`.
 */
export function potionImageUrl(potion: Potion, locked: boolean): string {
  if (!locked) return potion.card_image_url || potion.image_url;
  return potion.image_url || potion.card_image_url;
}
