// src/pages/atributos/functions.ts
import type { Character } from "@/utils/types";

// Mesma tabela do livro "Hogwarts Vivência" (services/ai_prompt_defaults.ts
// -> FINAL_EXAMS): teto máximo de atributo por ano letivo.
const ATTRIBUTE_MAX_BY_YEAR: Record<number, number> = {
  1: 5,
  2: 7,
  3: 9,
  4: 11,
  5: 12,
  6: 13,
  7: 14,
};
const ADULT_ATTRIBUTE_MAX = 15;

export function attributeMaxForYear(year: number): number {
  if (year >= 8) return ADULT_ATTRIBUTE_MAX;
  return ATTRIBUTE_MAX_BY_YEAR[Math.max(1, year)] ?? ATTRIBUTE_MAX_BY_YEAR[1];
}

export type RowType = "atributo" | "talento" | "titulo";

export const TYPE_LABEL: Record<RowType, string> = {
  atributo: "Atributos",
  talento: "Talentos",
  titulo: "Títulos e Reputações",
};

export interface AttributeRow {
  id: string;
  tipo: RowType;
  nome: string;
  nivel: number;
  maximo: number;
  descricao?: string;
  vantagem?: string;
  conhecidoPor?: string;
  titulo?: string;
}

/**
 * Junta atributos, talentos e títulos do personagem numa lista só.
 *
 * As chaves de `character.atributos` variam por personagem — algumas
 * fichas usam slug em minúsculo ("magia"), outras usam o nome já
 * formatado ("Aprendizado Mágico") — não existe uma lista canônica
 * confiável pra "todos os atributos possíveis" (uma tentativa anterior
 * assumiu as chaves do wizard de criação e ficou mostrando 0 pra
 * personagens antigos, que usam outra convenção). Por isso, ao invés de
 * partir de uma lista fixa, listamos exatamente as chaves que o
 * personagem tem — mesma abordagem, e mesma formatação
 * (`formatAttributeLabel`, `@/utils`), que `CharacterPanel` já usa pra
 * mostrar os atributos certos de qualquer personagem.
 */
export function buildRows(character: Character, formatLabel: (key: string) => string): AttributeRow[] {
  const maximo = attributeMaxForYear(character.ano);

  const attributeRows: AttributeRow[] = Object.entries(character.atributos)
    .filter(([, value]) => typeof value === "number")
    .map(([key, value]) => ({
      id: key,
      tipo: "atributo",
      nome: formatLabel(key),
      nivel: value,
      maximo,
    }));

  const talentRows: AttributeRow[] = character.talentos.map((talento) => ({
    id: talento.id,
    tipo: "talento",
    nome: talento.nome,
    nivel: talento.nivel,
    maximo: talento.maximo,
    descricao: talento.descricao,
    vantagem: talento.vantagem,
    conhecidoPor: talento.conhecidoPor,
    titulo: talento.titulo,
  }));

  const titleRows: AttributeRow[] = character.titulos.map((titulo) => ({
    id: titulo.id,
    tipo: "titulo",
    nome: titulo.nome,
    nivel: titulo.nivel,
    maximo: titulo.maximo,
    descricao: titulo.descricao,
    vantagem: titulo.vantagem,
    conhecidoPor: titulo.conhecidoPor,
    titulo: titulo.titulo,
  }));

  return [...attributeRows, ...talentRows, ...titleRows];
}

export interface RowFilters {
  search: string;
  type: RowType | "";
  orderBy: "default" | "name" | "level";
}

export const EMPTY_FILTERS: RowFilters = { search: "", type: "", orderBy: "default" };

export function applyFilters(rows: AttributeRow[], filters: RowFilters): AttributeRow[] {
  let result = rows;

  if (filters.type) result = result.filter((row) => row.tipo === filters.type);

  if (filters.search.trim()) {
    const search = filters.search.trim().toLowerCase();
    result = result.filter((row) =>
      [row.nome, row.descricao, row.vantagem, row.conhecidoPor, row.titulo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }

  if (filters.orderBy === "name") {
    result = [...result].sort((a, b) => a.nome.localeCompare(b.nome));
  } else if (filters.orderBy === "level") {
    result = [...result].sort((a, b) => b.nivel - a.nivel);
  }

  return result;
}

export function groupRowsByType(rows: AttributeRow[]): Record<RowType, AttributeRow[]> {
  const groups: Record<RowType, AttributeRow[]> = { atributo: [], talento: [], titulo: [] };
  for (const row of rows) groups[row.tipo].push(row);
  return groups;
}
