// src/pages/relacoes/functions.ts
import type { Npc } from "@/utils/types";

export const TIPO_OPTIONS = ["Aluno", "Professor", "Criatura", "Visitante", "Mistério", "Outro"];

export const RELACAO_OPTIONS = ["Amigo", "Suspeito", "Inimigo", "Conhecido", "Mistério"];

// As 18 chaves usadas de verdade em `atributos` dos NPCs — confirmado
// no console do Firebase, mesmas chaves do projeto de referência. Como
// a edição aqui sempre parte de um NPC já existente, essa lista serve
// só pra desenhar a grade de atributos (não precisa da normalização de
// formatAttributeLabel em @/utils, que cobre chaves inconsistentes da
// ficha do jogador).
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

export interface RelationFilters {
  search: string;
  tipo: string;
  relacao: string;
  ano: string;
  campaignYear: string;
}

export const EMPTY_FILTERS: RelationFilters = {
  search: "",
  tipo: "",
  relacao: "",
  ano: "",
  campaignYear: "",
};

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Cada um destes campos tem mais de um nome possível nos dados reais —
// mesma leniência defensiva do projeto de referência (getNpcYear/
// getNpcStudentYear em helpers.js de lá).
export const getNpcAno = (npc: Npc): number | undefined => npc.ano ?? npc.year;
export const getNpcCampaignYear = (npc: Npc): number | undefined => npc.student_year ?? npc.studentYear;
export const getNpcHouse = (npc: Npc): string => npc.casa ?? npc.house ?? "";

function normalizeRelatedIds(relacionado: Npc["relacionado"]): string[] {
  if (Array.isArray(relacionado)) return relacionado;
  if (relacionado) return [relacionado];
  return [];
}

/** NPCs relacionados a este personagem — `relacionado` pode ser array ou string única (dado legado), mesma leniência do projeto de referência. */
export function getRelatedNpcs(npcs: Npc[], characterId: string): Npc[] {
  return npcs.filter(
    (npc) => npc.id !== characterId && normalizeRelatedIds(npc.relacionado).includes(characterId)
  );
}

export function buildFilterOptions(npcs: Npc[]) {
  const uniq = (values: Array<number | undefined>) =>
    Array.from(new Set(values.filter((value): value is number => value !== undefined && value !== null)))
      .sort((a, b) => a - b)
      .map(String);

  return {
    ano: uniq(npcs.map(getNpcAno)),
    campaignYear: uniq(npcs.map(getNpcCampaignYear)),
  };
}

export function applyFilters(npcs: Npc[], filters: RelationFilters): Npc[] {
  const search = normalizeText(filters.search);

  const filtered = npcs.filter((npc) => {
    const searchable = normalizeText(
      [npc.name, npc.tipo, getNpcHouse(npc), npc.relacao, npc.detalhes, npc.caracteristicas, npc.personalidade]
        .filter(Boolean)
        .join(" ")
    );

    if (search && !searchable.includes(search)) return false;
    if (filters.tipo && npc.tipo !== filters.tipo) return false;
    if (filters.relacao && npc.relacao !== filters.relacao) return false;
    if (filters.ano && String(getNpcAno(npc) ?? "") !== filters.ano) return false;
    if (filters.campaignYear && String(getNpcCampaignYear(npc) ?? "") !== filters.campaignYear) return false;
    return true;
  });

  return [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
}

/** Os 2 atributos com maior valor — resumo rápido no painel de detalhe. */
export function getMainAttributes(atributos: Record<string, number> | undefined): string {
  return Object.entries(atributos ?? {})
    .filter(([, value]) => Number(value) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2)
    .map(([name]) => name)
    .join(" / ");
}
