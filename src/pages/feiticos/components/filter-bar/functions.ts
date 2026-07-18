// src/pages/feiticos/components/filter-bar/functions.ts
import type { Spell } from "@/utils/types";

export interface SpellFilters {
  search: string;
  ano: string;
  nivel: string;
  atributo: string;
  categoria: string;
  status: string;
}

export const EMPTY_FILTERS: SpellFilters = {
  search: "",
  ano: "",
  nivel: "",
  atributo: "",
  categoria: "",
  status: "",
};

/** Extrai as opções únicas presentes nos dados para popular cada dropdown. */
export function buildFilterOptions(spells: Spell[]) {
  const uniq = (values: string[]) => Array.from(new Set(values)).filter(Boolean);

  return {
    ano: uniq(spells.map((s) => String(s.attributes.ano_letivo))),
    nivel: uniq(spells.map((s) => s.attributes.nivel)),
    atributo: uniq(spells.map((s) => s.attributes.attribute ?? "")),
    categoria: uniq(spells.map((s) => s.attributes.category)),
  };
}

export function applyFilters(
  spells: Spell[],
  filters: SpellFilters,
  lockedStatus: (spell: Spell) => boolean
): Spell[] {
  return spells.filter((s) => {
    const a = s.attributes;
    if (filters.search && !a.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.ano && String(a.ano_letivo) !== filters.ano) return false;
    if (filters.nivel && a.nivel !== filters.nivel) return false;
    if (filters.atributo && a.attribute !== filters.atributo) return false;
    if (filters.categoria && a.category !== filters.categoria) return false;
    if (filters.status) {
      const locked = lockedStatus(s);
      if (filters.status === "bloqueado" && !locked) return false;
      if (filters.status === "desbloqueado" && locked) return false;
    }
    return true;
  });
}
