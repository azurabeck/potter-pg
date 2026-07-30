// src/pages/locais/functions.ts
import type { Location } from "@/utils/types";

// Mesmas opções do dashboard (potter-spells, Tabs/Locations/constants.js).
export const TYPE_OPTIONS = [
  "Particular",
  "Secreto",
  "Público",
  "Restrito",
  "Escolar",
  "Comercial",
  "Natural",
  "Histórico",
  "Outro",
];

export interface LocationFilters {
  search: string;
  type: string;
}

export const EMPTY_FILTERS: LocationFilters = {
  search: "",
  type: "",
};

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Só os locais que este personagem já conhece (`Character.locais_conhecidos`) — populado pelo botão de relacionar do dashboard (potter-spells), não por esta tela. */
export function getKnownLocations(locations: Location[], knownIds: string[]): Location[] {
  const known = new Set(knownIds);
  return locations.filter((location) => known.has(location.id));
}

export function applyFilters(locations: Location[], filters: LocationFilters): Location[] {
  const search = normalizeText(filters.search);

  const filtered = locations.filter((location) => {
    const searchable = normalizeText(
      [location.name, location.type, location.characteristics, location.importance].filter(Boolean).join(" ")
    );

    if (search && !searchable.includes(search)) return false;
    if (filters.type && location.type !== filters.type) return false;
    return true;
  });

  return [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
}
