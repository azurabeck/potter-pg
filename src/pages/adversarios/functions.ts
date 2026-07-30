// src/pages/adversarios/functions.ts
import type { Enemy, KnownAdversary, Npc } from "@/utils/types";

// Um adversário "conhecido" é ou uma criatura (coleção "enemies") ou um
// NPC hostil (coleção "npcs") — união discriminada por `tipo` em vez de
// achatar os dois formatos num tipo só, já que as duas fichas têm campos
// bem diferentes (combate vs relação/atributos).
export type AdversaryItem = { tipo: "enemy"; data: Enemy } | { tipo: "npc"; data: Npc };

export function adversaryName(item: AdversaryItem): string {
  return item.data.name || (item.tipo === "enemy" ? "Adversário sem nome" : "NPC sem nome");
}

export function adversaryCategory(item: AdversaryItem): string {
  return item.tipo === "enemy" ? item.data.type || "-" : item.data.tipo || "-";
}

// Mesma leniência de nomes alternativos de pages/relacoes/functions.ts
// (getNpcAno/getNpcCampaignYear/getNpcHouse), duplicada aqui — páginas
// não importam lógica umas das outras.
export const getNpcAno = (npc: Npc): number | undefined => npc.ano ?? npc.year;
export const getNpcCampaignYear = (npc: Npc): number | undefined => npc.student_year ?? npc.studentYear;
export const getNpcHouse = (npc: Npc): string => npc.casa ?? npc.house ?? "";

// As 18 chaves usadas em `atributos` — mesma lista de pages/relacoes/functions.ts.
export const ATTRIBUTE_LABELS = [
  "Coragem",
  "Inteligência",
  "Agilidade",
  "Carisma",
  "Percepção",
  "Sorte",
  "Magia",
  "Resistência",
  "Ataque",
  "Proteção",
  "Precisão",
  "Controle",
  "Magia Antiga",
  "Liderança",
  "Aprendizado Mágico",
  "Persuasão",
  "Astucia",
  "Equilibrio",
];

/** Só os adversários que já estão em `Character.adversarios_conhecidos` — resolve cada id pra ficha completa, ignorando quem não for encontrado (registro apontando pra um doc apagado, por exemplo). */
export function getKnownAdversaries(enemies: Enemy[], npcs: Npc[], known: KnownAdversary[]): AdversaryItem[] {
  const items: AdversaryItem[] = [];

  for (const entry of known) {
    if (entry.tipo === "enemy") {
      const enemy = enemies.find((item) => item.id === entry.id);
      if (enemy) items.push({ tipo: "enemy", data: enemy });
    } else {
      const npc = npcs.find((item) => item.id === entry.id);
      if (npc) items.push({ tipo: "npc", data: npc });
    }
  }

  return items;
}

export interface AdversaryFilters {
  search: string;
  origem: "" | "enemy" | "npc";
  dificuldade: string;
}

export const EMPTY_FILTERS: AdversaryFilters = {
  search: "",
  origem: "",
  dificuldade: "",
};

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function buildFilterOptions(items: AdversaryItem[]) {
  const dificuldades = Array.from(
    new Set(
      items
        .filter((item): item is Extract<AdversaryItem, { tipo: "enemy" }> => item.tipo === "enemy")
        .map((item) => item.data.difficulty)
        .filter(Boolean)
    )
  );

  return { dificuldades };
}

export function applyFilters(items: AdversaryItem[], filters: AdversaryFilters): AdversaryItem[] {
  const search = normalizeText(filters.search);

  const filtered = items.filter((item) => {
    const extraText = item.tipo === "enemy" ? item.data.caracteristicas : item.data.detalhes;
    const searchable = normalizeText([adversaryName(item), adversaryCategory(item), extraText].filter(Boolean).join(" "));

    if (search && !searchable.includes(search)) return false;
    if (filters.origem && item.tipo !== filters.origem) return false;
    if (filters.dificuldade && (item.tipo !== "enemy" || item.data.difficulty !== filters.dificuldade)) return false;
    return true;
  });

  return [...filtered].sort((a, b) => adversaryName(a).localeCompare(adversaryName(b), "pt-BR"));
}

const DISTANCE_LABELS: Record<string, string> = {
  short: "Curta",
  medium: "Média",
  long: "Longa",
  short_medium: "Curta / Média",
  medium_long: "Média / Longa",
};

export function getDistanceLabel(distance: string | undefined): string {
  if (!distance) return "-";
  return DISTANCE_LABELS[distance] ?? distance;
}
