// src/pages/pocoes/components/filter-bar/functions.ts
import type { Potion } from "@/utils/types";

export interface PotionFilters {
  search: string;
  ano: string;
  nivel: string;
  status: string;
}

export const EMPTY_FILTERS: PotionFilters = {
  search: "",
  ano: "",
  nivel: "",
  status: "",
};

/** Extrai as opções únicas presentes nos dados para popular cada dropdown. */
export function buildFilterOptions(potions: Potion[]) {
  const uniq = (values: string[]) => Array.from(new Set(values)).filter(Boolean);

  return {
    ano: uniq(potions.map((p) => String(p.ano))),
    nivel: uniq(potions.map((p) => p.nivel)),
  };
}

export function applyFilters(
  potions: Potion[],
  filters: PotionFilters,
  lockedStatus: (potion: Potion) => boolean
): Potion[] {
  return potions.filter((p) => {
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.ano && String(p.ano) !== filters.ano) return false;
    if (filters.nivel && p.nivel !== filters.nivel) return false;
    if (filters.status) {
      const locked = lockedStatus(p);
      if (filters.status === "bloqueado" && !locked) return false;
      if (filters.status === "desbloqueado" && locked) return false;
    }
    return true;
  });
}
