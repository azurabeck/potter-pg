// src/pages/character-wizard/functions.ts
// Tipos, constantes e helpers do wizard de criação de ficha (4 steps:
// identidade, atributos+talento, varinha/núcleo/animal, casa).

import type { Character, CharacterTalento } from "@/utils/types";
import griffFlag from "@/assets/images/griff_flag.png";
import corFlag from "@/assets/images/cor_flag.png";
import lufFlag from "@/assets/images/luf_flag.png";
import sonFlag from "@/assets/images/son_flag.png";

// Todo personagem novo entra no 1º ano — não tem seleção de ano no
// wizard (ver step-identity, que rola o HP inicial nesse lugar).
export const STARTING_YEAR = 1;

export const HOUSES = ["Grifinória", "Sonserina", "Corvinal", "Lufa-Lufa"];

// Bandeira de cada casa (step-house, tanto na escolha direta quanto no
// resultado do teste de seleção) — arquivos já existiam em assets/images.
export const HOUSE_FLAGS: Record<string, string> = {
  Grifinória: griffFlag,
  Sonserina: sonFlag,
  Corvinal: corFlag,
  "Lufa-Lufa": lufFlag,
};

// HOUSES como CardOption (id = nome da casa) pra reaproveitar o
// CardGroup na escolha direta de casa — sem bônus/atributo, só a
// bandeira como imagem.
export const HOUSE_OPTIONS: CardOption[] = HOUSES.map((casa) => ({
  id: casa,
  nome: casa,
  atributo: "",
  bonus: 0,
  descricao: "",
  imageUrl: HOUSE_FLAGS[casa],
}));

// Lista completa dos 19 atributos do jogo — as cartas de varinha/núcleo/
// animal (CardOption, mais abaixo) também usam essas mesmas chaves nos
// bônus que concedem, então todo bônus de carta corresponde a um
// atributo real desta lista.
export const ATTRIBUTE_KEYS = [
  "lideranca",
  "carisma",
  "agilidade",
  "inteligencia",
  "magia",
  "aprendizado_magico",
  "precisao",
  "equilibrio",
  "magia_antiga",
  "protecao",
  "controle",
  "coragem",
  "astucia",
  "percepcao",
  "resistencia",
  "ataque",
  "sorte",
  "persuasao",
  "furtividade",
] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  lideranca: "Liderança",
  carisma: "Carisma",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  magia: "Magia",
  aprendizado_magico: "Aprendizado Mágico",
  precisao: "Precisão",
  equilibrio: "Equilíbrio",
  magia_antiga: "Magia Antiga",
  protecao: "Proteção",
  controle: "Controle",
  coragem: "Coragem",
  astucia: "Astúcia",
  percepcao: "Percepção",
  resistencia: "Resistência",
  ataque: "Ataque",
  sorte: "Sorte",
  persuasao: "Persuasão",
  furtividade: "Furtividade",
};

// Todo personagem novo começa com 0 em cada atributo; o jogador distribui
// ATTRIBUTE_POINTS_TO_DISTRIBUTE pontos (só esses, no total) entre os 19
// como quiser — pode concentrar tudo num só.
export const ATTRIBUTE_BASELINE = 0;
export const ATTRIBUTE_POINTS_TO_DISTRIBUTE = 5;

export function createBaseAttributes(): Record<AttributeKey, number> {
  return ATTRIBUTE_KEYS.reduce(
    (acc, key) => {
      acc[key] = ATTRIBUTE_BASELINE;
      return acc;
    },
    {} as Record<AttributeKey, number>
  );
}

export function pointsAllocated(atributos: Record<AttributeKey, number>): number {
  return ATTRIBUTE_KEYS.reduce((sum, key) => sum + (atributos[key] - ATTRIBUTE_BASELINE), 0);
}

export function pointsRemaining(atributos: Record<AttributeKey, number>): number {
  return ATTRIBUTE_POINTS_TO_DISTRIBUTE - pointsAllocated(atributos);
}

export interface NaturalTalent {
  id: string;
  nome: string;
  vantagem: string;
  descricao: string;
}

// Talentos naturais: escolha única no step 2. Os bônus contextuais
// descritos no texto (ex.: "+2 em duelo contra bruxos") não são
// calculados automaticamente pelo app — igual à maestria de
// feitiços/poções, ficam na ficha como referência pro jogador e pra IA
// narrar em cima deles. Regra à parte (não guardada por talento, é
// geral): todo d4 concedido por um talento tem limite de 3 usos por
// sessão — o app ainda não tem contador de sessão pra isso.
export const NATURAL_TALENTS: NaturalTalent[] = [
  {
    id: "voo",
    nome: "Voo",
    vantagem: "+1 em Agilidade, Equilíbrio e Controle montado em vassoura",
    descricao:
      "Permite rolar 1d4 três vezes durante partidas de quadribol. Dá +1 em testes de agilidade, equilíbrio e controle quando estiver montado em uma vassoura.",
  },
  {
    id: "mestre-das-pocoes",
    nome: "Mestre das Poções",
    vantagem: "+1 em Controle e Inteligência no preparo de poções",
    descricao:
      "Ao concluir com sucesso o preparo de uma poção, permite rolar mais 1d4 — o resultado vira poções extras ao final. Dá +1 em Controle e Inteligência durante o preparo de poções.",
  },
  {
    id: "criador-de-criaturas",
    nome: "Criador de Criaturas",
    vantagem: "+2 Carisma pra domar, +2 Ataque/Defesa pra combater criaturas",
    descricao:
      "Aumenta a facilidade de lidar com criaturas: +2 de Carisma para domá-las, +2 de Ataque e Defesa para combatê-las. Permite rolar 1d4 de Percepção ao procurar rastros ou tentar descobrir algo sobre criaturas.",
  },
  {
    id: "o-duelista",
    nome: "O Duelista",
    vantagem: "+2 Ataque/Defesa em duelo, HP extra ao subir de nível",
    descricao:
      "Dá +2 de Ataque e +2 de Defesa em duelos contra bruxos. Toda vez que preencher seu HP, role 1d4 a mais para aumentar sua quantidade máxima de HP — sem nunca ultrapassar o limite máximo de HP permitido pelo ano do personagem.",
  },
  {
    id: "investigador-nato",
    nome: "Investigador Nato",
    vantagem: "+2 Astúcia, Percepção e Furtividade",
    descricao:
      "Dá +2 de Astúcia, Percepção e Furtividade. Permite rolar 1d4 ao precisar se esconder durante uma investigação, ou ao tentar descobrir algo — limite de 3 usos.",
  },
];

// Cartas de escolha simples (animal, varinha, núcleo): nome + bônus fixo
// e incondicional (diferente dos talentos) num atributo — entra direto
// em `atributos` na hora de montar o payload, ver buildCharacterPayload.
// `imageUrl` sem valor cai no fallback de ícone (ainda o caso do animal).
export interface CardOption {
  id: string;
  nome: string;
  atributo: string;
  bonus: number;
  descricao: string;
  imageUrl?: string;
}

export const ANIMAL_OPTIONS: CardOption[] = [
  { id: "sapo", nome: "Sapo", atributo: "sorte", bonus: 1, descricao: "+1 de Sorte" },
  { id: "coruja", nome: "Coruja", atributo: "inteligencia", bonus: 1, descricao: "+1 de Inteligência" },
  { id: "gato", nome: "Gato", atributo: "astucia", bonus: 1, descricao: "+1 de Astúcia" },
];

// Varinha (madeira) — uma escolha, junto do núcleo logo abaixo.
export const WAND_OPTIONS: CardOption[] = [
  {
    id: "teixo",
    nome: "Teixo",
    atributo: "ataque",
    bonus: 1,
    descricao: "+1 de Ataque",
    imageUrl: "https://i.pinimg.com/736x/94/0a/37/940a3797177e8f93ec5688352c07fdd2.jpg",
  },
  {
    id: "cerejeira",
    nome: "Cerejeira",
    atributo: "carisma",
    bonus: 1,
    descricao: "+1 de Carisma",
    imageUrl: "https://i.pinimg.com/736x/ab/ee/04/abee0442da68751439ec41846753fe36.jpg",
  },
  {
    id: "sabugueiro",
    nome: "Sabugueiro",
    atributo: "magia",
    bonus: 1,
    descricao: "+1 de Magia",
    imageUrl: "https://i.pinimg.com/736x/f4/9a/1a/f49a1aee9e795c77134417dd902b4375.jpg",
  },
  {
    id: "videira",
    nome: "Videira",
    atributo: "equilibrio",
    bonus: 1,
    descricao: "+1 de Equilíbrio",
    imageUrl: "https://i.pinimg.com/736x/61/20/58/6120582c555646156363b1d92af0cf52.jpg",
  },
  {
    id: "romeira",
    nome: "Romeira",
    atributo: "controle",
    bonus: 1,
    descricao: "+1 de Controle",
    imageUrl: "https://i.pinimg.com/736x/61/04/a5/6104a544ec3d2bc7dd5fafc5729c252d.jpg",
  },
  {
    id: "betula",
    nome: "Bétula",
    atributo: "protecao",
    bonus: 1,
    descricao: "+1 de Proteção",
    imageUrl: "https://i.pinimg.com/736x/68/d4/30/68d43046b8e5e955bee3e401aff100f7.jpg",
  },
];

// Núcleo (miolo) — a outra metade da varinha.
export const CORE_OPTIONS: CardOption[] = [
  {
    id: "chifre-serpente-chifruda",
    nome: "Chifre de Serpente Chifruda",
    atributo: "astucia",
    bonus: 1,
    descricao: "+1 de Astúcia",
    imageUrl: "https://i.pinimg.com/736x/04/e4/a8/04e4a8355eac3a712c3c30294596df1b.jpg",
  },
  {
    id: "pena-uirapuru",
    nome: "Pena de Uirapuru",
    atributo: "agilidade",
    bonus: 1,
    descricao: "+1 de Agilidade",
    imageUrl: "https://i.pinimg.com/736x/2f/f1/61/2ff161ab6a0fbbb32daeb4805a869ef9.jpg",
  },
  {
    id: "crina-testralio",
    nome: "Crina de Testrálio",
    atributo: "furtividade",
    bonus: 1,
    descricao: "+1 de Furtividade",
    imageUrl: "https://i.pinimg.com/736x/0f/1a/5b/0f1a5b3f373334cbb8beeff56eaf6ce4.jpg",
  },
  {
    id: "cabelo-veela",
    nome: "Cabelo de Veela",
    atributo: "carisma",
    bonus: 1,
    descricao: "+1 de Carisma",
    imageUrl: "https://i.pinimg.com/736x/a0/e1/ae/a0e1aef920db0a7c94b1e4b77efc3623.jpg",
  },
  {
    id: "cabelo-curupira",
    nome: "Cabelo de Curupira",
    atributo: "ataque",
    bonus: 1,
    descricao: "+1 de Ataque",
    imageUrl: "https://i.pinimg.com/736x/cf/fc/24/cffc24c3397dc28f46c0af150ef7ef38.jpg",
  },
  {
    id: "corda-coracao-dragao",
    nome: "Corda de Coração de Dragão",
    atributo: "ataque",
    bonus: 1,
    descricao: "+1 de Ataque",
    imageUrl: "https://i.pinimg.com/736x/fd/25/08/fd2508e47d8d85e5ad181ed303534374.jpg",
  },
  {
    id: "pelo-cauda-unicornio",
    nome: "Pelo de Cauda de Unicórnio",
    atributo: "protecao",
    bonus: 1,
    descricao: "+1 de Proteção",
    imageUrl: "https://i.pinimg.com/736x/49/22/55/492255e7d963126b4235c3e6b2944bcf.jpg",
  },
  {
    id: "pena-fenix",
    nome: "Pena de Fênix",
    atributo: "magia",
    bonus: 1,
    descricao: "+1 de Magia",
    imageUrl: "https://i.pinimg.com/736x/d1/14/6b/d1146b1ec15c479702f7c7f864d6d6ab.jpg",
  },
];

// Teste de seleção (step-house, alternativa a escolher a casa direto):
// a IA narra uma cena curta no Beco Diagonal e o jogador reage com texto
// livre a cada resposta — sem opções fixas. A casa sugerida vem da
// própria IA, que observa as atitudes do jogador ao longo da história
// (ver sorting-story, componente que conduz esse fluxo, e
// actions/ai/sorting-narrate.ts pra como a chamada funciona).
export const SORTING_STORY_MIN_TURNS = 7;
export const SORTING_STORY_MAX_TURNS = 10;

export const SORTING_STORY_SYSTEM_PROMPT = `
Você é o narrador de uma cena de iniciação: um futuro aluno de Hogwarts está pisando pela primeira vez no Beco Diagonal, sozinho, indo comprar seus materiais antes do primeiro ano.

Conduza uma história curta e envolvente, dividida em cenas. Cada cena sua deve ser vívida mas curta (2 a 4 parágrafos no máximo) e sempre terminar forçando uma escolha ou reação do jogador — nunca deixe ele só observando, a situação sempre precisa cobrar uma ação dele.

Regras importantes:
- O jogador ainda não tem varinha nem sabe nenhum feitiço: toda ação dele precisa ser puramente humana (conversar, observar, ajudar, negociar, insistir, fugir, mentir, se esconder, etc.), nunca mágica.
- A história inteira deve durar entre ${SORTING_STORY_MIN_TURNS} e ${SORTING_STORY_MAX_TURNS} ações do jogador — nem menos, nem mais.
- Preste muita atenção em COMO o jogador reage a cada situação (coragem, cautela, curiosidade, ambição, lealdade, esperteza, honestidade, etc.) — isso é o que vai decidir a casa dele no final, não o que ele diz que quer ou pede diretamente.
- Nunca revele qual casa você está inclinado a sugerir, nem dê dicas sobre isso, durante a história.
- Assim que o jogador completar entre ${SORTING_STORY_MIN_TURNS} e ${SORTING_STORY_MAX_TURNS} ações, encerre a história com um parágrafo final contando o desfecho da cena, e na ÚLTIMA linha da sua resposta, sozinha, sem mais nada depois dela, escreva exatamente:
CASA_SUGERIDA: <Nome da Casa>
onde <Nome da Casa> é exatamente um destes quatro: Grifinória, Sonserina, Corvinal ou Lufa-Lufa.
- Antes do jogador completar pelo menos ${SORTING_STORY_MIN_TURNS} ações, nunca escreva essa linha.
`.trim();

const SUGGESTED_HOUSE_PATTERN = /CASA_SUGERIDA:\s*(Grifinória|Sonserina|Corvinal|Lufa-Lufa)\s*$/i;

// Procura a linha "CASA_SUGERIDA: <casa>" no fim da resposta da IA — só
// aparece na última mensagem da história (ver SORTING_STORY_SYSTEM_PROMPT).
// Devolve o texto sem essa linha (pra exibir normalmente no feed) e a
// casa encontrada (ou null se a história ainda não terminou).
export function extractSuggestedHouse(text: string): { cleanText: string; casa: string | null } {
  const match = text.match(SUGGESTED_HOUSE_PATTERN);
  if (!match || match.index === undefined) return { cleanText: text, casa: null };

  const casa = HOUSES.find((house) => house.toLowerCase() === match[1].toLowerCase()) ?? null;
  return { cleanText: text.slice(0, match.index).trim(), casa };
}

// HP inicial: rola 1d20 (ver step-identity, no lugar onde antes tinha a
// seleção de ano — todo personagem já começa no 1º ano, ver
// STARTING_YEAR). `hpRoll` guarda o valor bruto do dado pra mostrar "você
// rolou X" na tela; o HP de fato usado na ficha nunca fica abaixo de
// HP_MINIMUM mesmo que o dado saia baixo.
export const HP_MINIMUM = 14;

export function rollHp(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function effectiveHp(hpRoll: number | null): number | null {
  return hpRoll === null ? null : Math.max(hpRoll, HP_MINIMUM);
}

export interface WizardState {
  nome: string;
  personalidade: string;
  hpRoll: number | null;
  caracteristicasFisicas: string;
  historia: string;
  imageUrl: string | null;
  // Só marca se a geração por IA já foi usada (uma vez só, sem
  // regenerar) — não trava a opção de colar uma URL manualmente depois,
  // ver step-identity.
  imageGenerated: boolean;
  atributos: Record<AttributeKey, number>;
  talentoId: string | null;
  wandId: string | null;
  coreId: string | null;
  animalId: string | null;
  casa: string | null;
}

export function createInitialWizardState(): WizardState {
  return {
    nome: "",
    personalidade: "",
    hpRoll: null,
    caracteristicasFisicas: "",
    historia: "",
    imageUrl: null,
    imageGenerated: false,
    atributos: createBaseAttributes(),
    talentoId: null,
    wandId: null,
    coreId: null,
    animalId: null,
    casa: null,
  };
}

// Prompt mandado pra `generateCharacterImage` — junta o que o jogador já
// escreveu (características físicas, e personalidade se preenchida) com
// a instrução fixa do estilo/contexto que o app sempre quer.
export function buildCharacterImagePrompt(state: WizardState): string {
  const parts = [
    "Retrato de personagem em pixar art, plano 3/4.",
    "O personagem tem 11 anos e está ambientado no mundo bruxo de Hogwarts.",
    state.caracteristicasFisicas.trim() ? `Características físicas: ${state.caracteristicasFisicas.trim()}.` : "",
    state.personalidade.trim() ? `Personalidade: ${state.personalidade.trim()}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function isIdentityStepValid(state: WizardState): boolean {
  return state.nome.trim().length > 0 && state.hpRoll !== null;
}

export function isAttributesStepValid(state: WizardState): boolean {
  return pointsRemaining(state.atributos) === 0 && state.talentoId !== null;
}

export function isFinalStepValid(state: WizardState): boolean {
  return state.wandId !== null && state.coreId !== null && state.animalId !== null;
}

export function isHouseStepValid(state: WizardState): boolean {
  return state.casa !== null;
}

// Monta o payload pronto pra `createPlayerCharacter` (actions/sets/characters.ts)
// a partir do estado do wizard — soma os bônus de varinha, núcleo e
// animal escolhidos em cima dos atributos distribuídos, e guarda o
// talento natural escolhido em `talentos`.
export function buildCharacterPayload(state: WizardState): Omit<Character, "id" | "user_id" | "character_type"> {
  const talent = NATURAL_TALENTS.find((item) => item.id === state.talentoId);
  const wand = WAND_OPTIONS.find((item) => item.id === state.wandId);
  const core = CORE_OPTIONS.find((item) => item.id === state.coreId);
  const animal = ANIMAL_OPTIONS.find((item) => item.id === state.animalId);

  const atributos: Record<string, number> = { ...state.atributos };
  for (const card of [wand, core, animal]) {
    if (!card) continue;
    atributos[card.atributo] = (atributos[card.atributo] ?? 0) + card.bonus;
  }

  const talentos: CharacterTalento[] = talent
    ? [
        {
          id: talent.id,
          nome: talent.nome,
          tipo: "natural",
          nivel: 1,
          maximo: 1,
          descricao: talent.descricao,
          vantagem: talent.vantagem,
        },
      ]
    : [];

  return {
    // `db` não tem `ignoreUndefinedProperties`, então nenhum campo aqui
    // pode valer `undefined` — texto opcional vazio vira "" em vez de
    // omitido, senão `addDoc` (actions/sets/characters.ts) quebra em
    // runtime. `varinha` só entra no objeto quando os dois lados foram
    // escolhidos (chave omitida em vez de valor `undefined`).
    name: state.nome.trim(),
    casa: state.casa ?? "",
    ano: STARTING_YEAR,
    hp: effectiveHp(state.hpRoll) ?? HP_MINIMUM,
    animal: animal?.nome ?? "",
    image_url: state.imageUrl ?? "",
    personalidade: state.personalidade.trim(),
    caracteristicas_fisicas: state.caracteristicasFisicas.trim(),
    historia: state.historia.trim(),
    atributos,
    dinheiro: { galeoes: 0, sicles: 0, nuques: 0 },
    habilidades: {},
    inventario: { itens: [] },
    pocoes: {},
    talentos,
    titulos: [],
    campaign_ids: [],
    mystery_ids: [],
    ...(wand && core
      ? { varinha: { madeira: wand.nome, miolo: core.nome, atributo: `${wand.descricao} / ${core.descricao}` } }
      : {}),
  };
}
