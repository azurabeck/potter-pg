// src/pages/livraria/functions.ts
import { Dices, DoorClosed, GraduationCap, Landmark, ScrollText, Sword, Trophy, type LucideIcon } from "lucide-react";
import { DEFAULT_AI_PROMPTS, FINAL_EXAMS, MASTERY_AND_ATTRIBUTES, MINISTRY_RECORDS } from "@/services/ai_prompt_defaults";

export interface Book {
  id: string;
  title: string;
  author: string;
  /** Texto puro (mesmo formato de `services/ai_prompt_defaults.ts`) mostrado no modal. */
  content: string;
  icon: LucideIcon;
  /** "r, g, b" — usado em `rgba(var(--book-accent-rgb), alpha)` no CSS. */
  accent: string;
  /**
   * "prose" (padrão) usa `promptBlocksFor`. "raw" mostra `content` puro,
   * monoespaçado (só removendo as cercas de código ```) — pra documentos
   * técnicos com listas numeradas/JSON que não seguem o formato de blocos
   * dos outros livros.
   */
  format?: "prose" | "raw";
}

// Os "livros" são só a forma in-universe de mostrar pro jogador as regras
// da mesa — mesmo texto de `services/ai_prompt_defaults.ts`, sem duplicar
// conteúdo. Os 4 primeiros batem cada um com um campo de `AiPrompts` (regra
// realmente usada em toda narração, via `buildNarrationPrompt`). O 5º
// (Flitwick) mostra só `MASTERY_AND_ATTRIBUTES`, que soma dentro do prompt
// de encerramento (`DEFAULT_AI_PROMPTS.closing`) mas não é ele inteiro —
// por isso não usa `DEFAULT_AI_PROMPTS.closing` direto, senão viria
// misturado com o resto do resumo de sessão. O 6º (Macgonagall) mostra
// `FINAL_EXAMS`, e o 7º (Kingsley) mostra `MINISTRY_RECORDS` — nenhum dos
// dois soma em nenhum prompt ativo: exames finais não têm gatilho nenhum
// na Plataforma ainda, e o protocolo do Kingsley pede uma chamada de IA
// totalmente diferente (entrada estruturada, resposta só em JSON, duas
// etapas aguardando rolagem do usuário) que também não existe hoje —
// então os dois livros são só referência de regra por enquanto.
export const BOOKS: Book[] = [
  {
    id: "a-magia-dos-trouxas",
    title: "A Magia dos Trouxas",
    author: "Arthur Weasley",
    content: DEFAULT_AI_PROMPTS.narration,
    icon: ScrollText,
    accent: "102, 85, 199",
  },
  {
    id: "quadribol-para-iniciantes",
    title: "Quadribol para Iniciantes",
    author: "Gina Potter",
    content: DEFAULT_AI_PROMPTS.quidditch,
    icon: Trophy,
    accent: "63, 157, 95",
  },
  {
    id: "duelando-com-reis",
    title: "Duelando com Reis",
    author: "Gilderoy Lockward",
    content: DEFAULT_AI_PROMPTS.duel,
    icon: Dices,
    accent: "161, 63, 79",
  },
  {
    id: "criaturas-hostis",
    title: "Criaturas Hostis",
    author: "Teddy Lupin",
    content: DEFAULT_AI_PROMPTS.battle,
    icon: Sword,
    accent: "211, 139, 63",
  },
  {
    id: "evolucao-e-ligacao-de-feiticos-e-pocoes",
    title: "A Evolução e Ligação de Feitiços e Poções",
    author: "Filius Flitwick",
    content: MASTERY_AND_ATTRIBUTES,
    icon: DoorClosed,
    accent: "151, 220, 255",
  },
  {
    id: "hogwarts-vivencia",
    title: "Hogwarts Vivência",
    author: "Minerva Macgonagall",
    content: FINAL_EXAMS,
    icon: GraduationCap,
    accent: "196, 155, 46",
  },
  {
    id: "registros-magicos",
    title: "Registros Mágicos",
    author: "Kingsley Shacklebolt",
    content: MINISTRY_RECORDS,
    icon: Landmark,
    accent: "138, 122, 88",
    format: "raw",
  },
];

export type PromptPart =
  | { kind: "text"; value: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export interface PromptBlock {
  heading: string;
  parts: PromptPart[];
}

// Linhas "- item" viram uma lista; linhas "| a | b | c |" viram uma tabela
// (primeira linha = cabeçalho); o resto vira parágrafo solto. Linhas
// consecutivas do mesmo tipo agrupam numa única lista/tabela, na ordem em
// que aparecem no texto — importante pro bloco de atributo (descrição em
// prosa, depois os exemplos em lista).
function parsePromptLines(lines: string[]): PromptPart[] {
  const parts: PromptPart[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      parts.push({ kind: "list", items });
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(
          lines[i]
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell !== "")
        );
        i++;
      }
      const [headers, ...body] = rows;
      parts.push({ kind: "table", headers: headers ?? [], rows: body });
      continue;
    }

    parts.push({ kind: "text", value: line });
    i++;
  }

  return parts;
}

// Cada regra padrão (ai_prompt_defaults.ts) é um texto plano com blocos
// separados por linha em branco: uma linha de título, seguida do corpo
// (ver `parsePromptLines`).
export function promptBlocksFor(book: Book): PromptBlock[] {
  return book.content
    .split("\n\n")
    .filter((block) => block.trim() !== "")
    .map((block) => {
      const lines = block.split("\n").filter((line) => line.trim() !== "");
      const [heading, ...rest] = lines;
      return { heading: heading ?? "", parts: parsePromptLines(rest) };
    });
}

// Usado só pelos livros `format: "raw"` (ex. Registros Mágicos): remove as
// linhas de cerca de código (```json, ```text, ```) antes de mostrar o
// texto puro no modal — o marcador de markdown não faz sentido pro
// jogador ler, mas o resto da formatação (indentação, exemplos, JSON)
// é preservado como está.
export function stripCodeFences(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^```/.test(line.trim()))
    .join("\n");
}
