// src/pages/misterios/functions.ts
import type { Mystery, MysteryCategory } from "@/utils/types";

export const CATEGORY_ORDER: MysteryCategory[] = [
  "mistérios",
  "projetos",
  "pendencias narrador",
  "proxima sessão",
];

export const CATEGORY_LABEL: Record<MysteryCategory, string> = {
  "mistérios": "Mistérios",
  "projetos": "Projetos",
  "pendencias narrador": "Pendências do Narrador",
  "proxima sessão": "Próxima Sessão",
};

/** "Nome" pra exibição — pendências usam `awaited_event` (o campo que o formulário original preenche pra essa categoria) em vez de `name`. */
export function mysteryDisplayName(mystery: Mystery): string {
  if (mystery.category === "pendencias narrador") {
    return mystery.awaited_event || mystery.name || "Pendência sem evento";
  }
  return mystery.name || (mystery.category === "projetos" ? "Projeto sem nome" : "Mistério sem nome");
}

export function groupMysteriesByCategory(mysteries: Mystery[]): Record<MysteryCategory, Mystery[]> {
  const groups = {} as Record<MysteryCategory, Mystery[]>;
  for (const category of CATEGORY_ORDER) {
    groups[category] = mysteries.filter((mystery) => mystery.category === category);
  }
  return groups;
}

/** "em andamento" -> "em-andamento" — status/valores de pista têm espaço, inválido puro num modificador BEM. */
export function statusModifier(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "-");
}
