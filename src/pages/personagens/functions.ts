// src/pages/personagens/functions.ts
import type { Character, CharacterVarinha, Table } from "@/utils/types";
import { ANIMAL_OPTIONS, CORE_OPTIONS, HOUSES, WAND_OPTIONS } from "@/pages/character-wizard/functions";
import griffFlag from "@/assets/images/griff_flag.png";
import corFlag from "@/assets/images/cor_flag.png";
import lufFlag from "@/assets/images/luf_flag.png";
import sonFlag from "@/assets/images/son_flag.png";
import shieldGrif from "@/assets/images/shield_grif.svg";
import shieldCorv from "@/assets/images/shield_corv.svg";
import shieldLuf from "@/assets/images/shield_luf.svg";
import shieldSons from "@/assets/images/shield_sons.svg";
import ribbonGrif from "@/assets/images/horizontal_flag_grif.svg";
import ribbonCorv from "@/assets/images/horizontal_flag_corv.svg";
import ribbonLuf from "@/assets/images/horizontal_flag_luf.svg";
import ribbonSons from "@/assets/images/horizontal_flag_sons.svg";

// Brasões por casa — mesmos arquivos já usados no wizard (step-house) pra
// bandeira/resultado da seleção, ver pages/character-wizard/functions.ts.
export const HOUSE_CRESTS: Record<string, string> = {
  Grifinória: griffFlag,
  Sonserina: sonFlag,
  Corvinal: corFlag,
  "Lufa-Lufa": lufFlag,
};

// Foto de fundo do cabeçalho por casa — decorativa, sem relação com os
// brasões acima.
export const HOUSE_BACKGROUNDS: Record<string, string> = {
  Sonserina: "https://i.pinimg.com/1200x/9c/1a/be/9c1abe9b8d78ed276d25ecfbec44afaa.jpg",
  Grifinória: "https://i.pinimg.com/736x/b3/c5/47/b3c547569f8f9d36356de3d881efd146.jpg",
  "Lufa-Lufa": "https://i.pinimg.com/1200x/14/7b/e5/147be5b16fda52c7bada27380164e8e6.jpg",
  Corvinal: "https://i.pinimg.com/1200x/d0/68/4f/d0684fc8c178644b59878e00f02832fa.jpg",
};

// Usada quando o personagem ainda não tem `pet_url` salvo.
export const DEFAULT_PET_IMAGE = "https://i.pinimg.com/736x/7f/45/4f/7f454fc5834b707cf4abeba566b11819.jpg";

/** Imagem da carta de varinha (madeira) — mesmas cartas do wizard, casadas pelo nome salvo em `Character.varinha.madeira`. */
export function getWandCardImage(nome: string | undefined): string | undefined {
  return WAND_OPTIONS.find((option) => option.nome === nome)?.imageUrl;
}

/** Imagem da carta de núcleo (miolo) — mesma ideia de getWandCardImage. */
export function getCoreCardImage(nome: string | undefined): string | undefined {
  return CORE_OPTIONS.find((option) => option.nome === nome)?.imageUrl;
}

/** "+1 de Astúcia" etc — bônus do animal escolhido no wizard, casado pelo nome salvo em `Character.animal`. */
export function getAnimalBonusLabel(nome: string | undefined): string | undefined {
  return ANIMAL_OPTIONS.find((option) => option.nome === nome)?.descricao;
}

/** "Teixo com Crina de Testrálio (+1 de Ataque / +1 de Furtividade)" — combina madeira+miolo+bônus num único texto pra seção de Varinha. */
export function buildWandLabel(varinha: CharacterVarinha | undefined): string | undefined {
  if (!varinha?.madeira || !varinha?.miolo) return undefined;
  return `${varinha.madeira} com ${varinha.miolo}${varinha.atributo ? ` (${varinha.atributo})` : ""}`;
}

export function portraitOf(character: Character): string | undefined {
  return character.image_url ?? character.image_url_ano_1;
}

// Brasão "limpo" (só o escudo, sem a bandeira listrada) — usado no topo
// do bloco da Taça das Casas, diferente de HOUSE_CRESTS (que é a bandeira
// completa usada no hero).
export const HOUSE_SHIELDS: Record<string, string> = {
  Grifinória: shieldGrif,
  Sonserina: shieldSons,
  Corvinal: shieldCorv,
  "Lufa-Lufa": shieldLuf,
};

// Faixa horizontal colorida com o nome da casa já desenhado na própria
// arte (sem precisar escrever o nome por cima) — uma linha por casa na
// Taça das Casas.
export const HOUSE_RIBBONS: Record<string, string> = {
  Grifinória: ribbonGrif,
  Sonserina: ribbonSons,
  Corvinal: ribbonCorv,
  "Lufa-Lufa": ribbonLuf,
};

// Tom escuro por casa — última cor do degradê do banner da Taça das
// Casas, trocado pra casa que está em 1º lugar no momento.
export const HOUSE_ACCENTS: Record<string, string> = {
  Grifinória: "#3a1010",
  Sonserina: "#07362a",
  Corvinal: "#0b2540",
  "Lufa-Lufa": "#3a2e08",
};

export interface HouseCupEntry {
  casa: string;
  pontos: number;
}

/**
 * Casas ordenadas por pontuação (maior primeiro) — lida direto de
 * `table.housePoints` (o placar geral, mantido em dia por
 * `addHousePoints`/`recalculateHousePoints`, `actions/sets/table.ts`),
 * nunca recalculada aqui. Sem documento de mesa ainda (`table: null`) ou
 * mesa antiga sem o campo, todas as 4 casas aparecem zeradas.
 */
export function buildHouseCupStandings(table: Table | null): HouseCupEntry[] {
  const source = table?.housePoints ?? {};
  return HOUSES.map((casa) => ({ casa, pontos: source[casa] ?? 0 })).sort((a, b) => b.pontos - a.pontos);
}

/**
 * Janela de até `size` personagens centrada no ativo, pro carrossel do
 * rodapé — com wrap (primeiro depois do último e vice-versa) só quando a
 * lista é maior que `size`, senão mostra todos sem repetir.
 */
export function getCarouselWindow(characters: Character[], activeId: string | undefined, size = 5): Character[] {
  if (characters.length === 0) return [];
  if (characters.length <= size) return characters;

  const activeIndex = Math.max(0, characters.findIndex((character) => character.id === activeId));
  const half = Math.floor(size / 2);

  return Array.from({ length: size }, (_, i) => {
    const index = (activeIndex - half + i + characters.length) % characters.length;
    return characters[index];
  });
}
