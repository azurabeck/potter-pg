// src/pages/inventario/functions.ts
import type { CharacterItem } from "@/utils/types";

export const CATEGORY_OPTIONS = ["Objetos Mágicos", "Consumíveis", "Mistérios", "Outros"];

export interface InventoryFilters {
  search: string;
  category: string;
}

export const EMPTY_FILTERS: InventoryFilters = { search: "", category: "" };

export function filterItems(items: CharacterItem[], filters: InventoryFilters): CharacterItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !search ||
      [item.nome, item.categoria, item.atributo, item.onde_encontrou, item.detalhes, item.descricao]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);

    const matchesCategory = !filters.category || item.categoria === filters.category;

    return matchesSearch && matchesCategory;
  });
}

/** Agrupa por `categoria`, sem item cadastrado (raro, mas o tipo permite) cai em "Outros". */
export function groupItemsByCategory(items: CharacterItem[]): Record<string, CharacterItem[]> {
  const groups: Record<string, CharacterItem[]> = {};
  for (const item of items) {
    const category = item.categoria || "Outros";
    (groups[category] ??= []).push(item);
  }
  return groups;
}

