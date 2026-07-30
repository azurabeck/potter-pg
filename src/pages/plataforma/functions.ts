import { DEFAULT_AI_PROMPTS, MINISTRY_RECORDS } from "@/services/ai_prompt_defaults";
import type {
  AiPrompts,
  CharacterHabilidade,
  CharacterItem,
  CharacterMoney,
  CharacterPocao,
  KnownAdversary,
  NarrationMessage,
  Npc,
  TableInviteStatus,
} from "@/utils/types";

export type { NarrationMessage };

export type Die = {
  sides: 4 | 6 | 8 | 10 | 12 | 20;
};

export type RolledDie = {
  sides: Die["sides"];
  result: number;
};

// `inviteId`/`inviteStatus` só existem quando o "join" veio de um convite
// por e-mail de verdade (settings-modal) — nome sem `@` não tem nenhum
// dos dois. `inviteStatus` começa "pending" e é atualizado por polling
// (ver pages/plataforma/index.tsx) até virar "accepted"/"rejected".
export type HistoryItem =
  | { id: string; type: "image"; user: string; imageUrl: string }
  | { id: string; type: "dice"; user: string; sides: Die["sides"]; result: number }
  | { id: string; type: "join"; user: string; inviteId?: string; inviteStatus?: TableInviteStatus };

/** Sem nenhuma regra adicional escrita em nenhum dos 5 campos. */
export function isAiPromptsEmpty(prompts: AiPrompts): boolean {
  return Object.values(prompts).every((value) => value.trim() === "");
}

// O ruleset de `DEFAULT_AI_PROMPTS` é sempre aplicado — o que o usuário
// escreve em Configurações > Prompts da IA entra como regra ADICIONAL,
// nunca substitui o padrão (ver services/ai_prompt_defaults.ts).
// Narração/batalha/duelo/quadribol viram um só prompt porque a IA narra
// tudo isso numa única sessão contínua (não há troca de "modo" na UI) —
// o encerramento é o único prompt separado, usado só ao fechar a sessão.
export function buildNarrationPrompt(prompts: AiPrompts): string {
  const additional = [prompts.narration, prompts.battle, prompts.duel, prompts.quidditch]
    .map((text) => text.trim())
    .filter(Boolean)
    .join("\n\n");

  return [
    DEFAULT_AI_PROMPTS.narration,
    DEFAULT_AI_PROMPTS.battle,
    DEFAULT_AI_PROMPTS.duel,
    DEFAULT_AI_PROMPTS.quidditch,
    additional,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildClosingPrompt(prompts: AiPrompts): string {
  return [DEFAULT_AI_PROMPTS.closing, prompts.closing.trim()].filter(Boolean).join("\n\n");
}

// Resumo de encerramento de UM personagem da mesa (EndSessionModal).
// `text: null` quer dizer que não há sessão de narração salva pra ele
// nessa rodada — não participou, então nem chega a chamar a IA.
export type EndSessionSummary = {
  characterId: string;
  characterName: string;
  text: string | null;
};

export type ScoreboardRow = {
  name: string;
  hp: string;
  status: string;
  tone: "warning" | "healthy" | "danger" | "down";
};

export const DICE: Die[] = [
  { sides: 4 },
  { sides: 6 },
  { sides: 8 },
  { sides: 10 },
  { sides: 12 },
  { sides: 20 },
];

export const TURN_ORDER = ["Tomas", "Alya", "Acromantula 1", "Owen"];

export const SCOREBOARD_ROWS: ScoreboardRow[] = [
  { name: "Tomas", hp: "90/100", status: "Petrificado (1 rodada restante)", tone: "warning" },
  { name: "Alya", hp: "100/100", status: "Saudável", tone: "healthy" },
  { name: "Acromantula", hp: "70/100", status: "Incendiando (4 de dano por rodada — 1/2)", tone: "danger" },
  { name: "Owen", hp: "0/100", status: "Desmaiado", tone: "down" },
];

export function randomDieResult(sides: Die["sides"]) {
  return Math.floor(Math.random() * sides) + 1;
}

// ---------------------------------------------------------------------
// Registro de sessão (livro "Registros Mágicos", Kingsley — ver
// pages/livraria e services/ai_prompt_defaults.ts). Diferente do resumo
// em prosa de `buildClosingPrompt`, essa chamada pede uma resposta em
// JSON puro que vira atualização de verdade na ficha do personagem.
//
// Versão reduzida do protocolo original: as seções "Evolução Geral de
// XP" e "Progressão de XP e HP" ficam de fora por enquanto (Character
// ainda não tem campo de xp/nível — ver doc do `plataforma`), o que
// também elimina o fluxo de duas etapas do documento original (só
// existia pra esperar o jogador rolar o dado dessas duas seções). Com
// elas fora, a IA sempre responde de uma vez, sem pedir rolagem.
// ---------------------------------------------------------------------

/**
 * MINISTRY_RECORDS inteiro (a regra completa) + o ajuste de escopo desta
 * versão. Sem MASTERY_AND_ATTRIBUTES aqui — a tabela genérica de XP por
 * dificuldade não faz falta porque cada feitiço/poção manda o próprio
 * `xp_maestria` como parte do contexto da chamada (ver `spells`/`potions`
 * no payload em `chooseEndSessionScope`), e a evolução de atributos em
 * si não faz parte do protocolo do Kingsley (mora só no livro do
 * Flitwick, sem gatilho de IA ainda).
 */
export function buildSessionRegistrationPrompt(): string {
  const scopeOverride = `AJUSTES PARA ESTA IMPLEMENTAÇÃO
- Ignore por completo as seções "6. EVOLUÇÃO GERAL DE XP" e "7. PROGRESSÃO DE XP E HP" do protocolo acima — a ficha do personagem ainda não tem campo de XP geral nem de progressão, só maestria por feitiço/poção.
- Nunca responda com "status": "waiting_for_rolls". Responda sempre de uma vez, no formato final (equivalente à ETAPA 2 do protocolo), sem pedir nenhuma rolagem adicional.
- Não inclua "session_xp", "xp_progression" nem "hp_progression" na resposta.

REGISTRO DE NPCs
O payload traz "known_npcs" (NPCs que este personagem já conhece — já
relacionados a ele) e "other_npcs" (NPCs que já existem no mundo, de
outros personagens, mas este ainda não conhece). Pra cada NPC que
apareceu de fato na sessão (teve fala, foi mencionado com relevância —
não gente citada de passagem), decida:
1. Já está em "known_npcs" → não faça nada com ele, não inclua em nenhum array abaixo.
2. Não está em "known_npcs", mas está em "other_npcs" (mesmo nome/identidade) → inclua em "npc_links" com o id e nome dele. É vinculado direto, sem aprovação.
3. Não está em nenhuma das duas listas (NPC novo de verdade) → inclua em "npc_creation_suggestions" com a ficha completa (nome, tipo, casa, ano do personagem, ano da campanha, relação com este personagem, amizade, confiança, características físicas, personalidade, detalhes, e os 18 atributos: Agilidade, Aprendizado Mágico, Astucia, Ataque, Carisma, Controle, Coragem, Equilibrio, Inteligência, Liderança, Magia, Magia Antiga, Percepção, Persuasão, Precisão, Proteção, Resistência, Sorte — estime valores de 0 a 15 coerentes com o que a cena mostrou). Esse precisa de aprovação do jogador antes de criar.

REGISTRO DE ADVERSÁRIOS
O payload também traz "all_enemies" (toda a coleção "enemies" — criaturas/adversários formais, com id e nome) e "known_adversaries" (nomes dos adversários — criaturas OU NPCs — que este personagem já registrou como conhecidos/enfrentados antes desta sessão). Sempre que um adversário aparecer de forma relevante na cena (luta, confronto direto, ameaça — não apenas citado de passagem), inclua ele em "adversary_encounters" com "tipo": "enemy" se o id veio de "all_enemies", ou "tipo": "npc" se for um NPC hostil (use o id de "known_npcs"/"other_npcs"). Pode incluir mesmo que ele já estivesse em "known_adversaries" — duplicatas são ignoradas automaticamente depois. Isso não precisa de aprovação: é só um registro de "o personagem já viu/enfrentou isso", não cria nada novo.

PONTOS PARA A CASA
Decida quantos pontos o personagem ganha pra própria casa nesta sessão — mesmo espírito da Taça das Casas de Hogwarts: bravura, inteligência, lealdade ou ambição bem aplicadas (e sobretudo ajudar/resolver algo de verdade) rendem pontos; quebrar regras às escondidas, agir com maldade gratuita ou covardia tiram pontos. Use sua avaliação livre da cena, tipicamente entre -20 e 30. "0" é o normal pra uma sessão sem nada de especialmente notável nem condenável. Retorne o valor (inteiro) em "house_points_earned".

Retorne somente este JSON, sem markdown e sem texto fora dele:
{
  "session_history": [{ "order": 1, "date": "", "event": "", "local": "", "characters": [] }],
  "spell_mastery_updates": [{ "spell_id": "", "spell_name": "", "previous_xp": 0, "dice_values": [], "xp_gained": 0, "new_xp": 0 }],
  "potion_mastery_updates": [{ "potion_id": "", "potion_name": "", "previous_xp": 0, "dice_values": [], "xp_gained": 0, "new_xp": 0 }],
  "inventory_updates": [{ "action": "add", "item_id": "", "item_name": "", "previous_quantity": 0, "quantity_change": 0, "new_quantity": 0, "reason": "" }],
  "money_update": { "previous": { "goldens": 0, "sicles": 0, "nuquens": 0 }, "transactions": [], "updated": { "goldens": 0, "sicles": 0, "nuquens": 0 } },
  "mystery_suggestions": [{ "mystery_id": "", "mystery_name": "", "suggested_action": "update", "classification": "", "suggested_update": "", "evidence": [] }],
  "npc_links": [{ "npc_id": "", "npc_name": "" }],
  "npc_creation_suggestions": [{ "name": "", "tipo": "", "casa": "", "ano": 1, "student_year": 1, "relacao": "Conhecido", "amizade": 0, "confianca": 0, "caracteristicas": "", "personalidade": "", "detalhes": "", "image_url": "", "atributos": { "Agilidade": 0, "Aprendizado Mágico": 0, "Astucia": 0, "Ataque": 0, "Carisma": 0, "Controle": 0, "Coragem": 0, "Equilibrio": 0, "Inteligência": 0, "Liderança": 0, "Magia": 0, "Magia Antiga": 0, "Percepção": 0, "Persuasão": 0, "Precisão": 0, "Proteção": 0, "Resistência": 0, "Sorte": 0 } }],
  "adversary_encounters": [{ "id": "", "tipo": "enemy", "name": "" }],
  "house_points_earned": 0,
  "pending_actions": []
}
Todo array pode vir vazio ("[]") quando não houver nada a registrar. "money_update" pode vir "null" se nada mudou.`;

  return [MINISTRY_RECORDS, scopeOverride].join("\n\n");
}

export interface SpellMasteryUpdate {
  spell_id: string;
  spell_name: string;
  previous_xp: number;
  dice_values: number[];
  xp_gained: number;
  new_xp: number;
}

export interface PotionMasteryUpdate {
  potion_id: string;
  potion_name: string;
  previous_xp: number;
  dice_values: number[];
  xp_gained: number;
  new_xp: number;
}

export interface InventoryUpdateEntry {
  action: "add" | "update" | "remove";
  item_id: string;
  item_name: string;
  previous_quantity: number;
  quantity_change: number;
  new_quantity: number;
  reason: string;
}

export interface MoneyUpdateResult {
  previous: { goldens: number; sicles: number; nuquens: number };
  transactions: string[];
  updated: { goldens: number; sicles: number; nuquens: number };
}

export interface SessionHistoryEvent {
  order: number;
  date: string;
  event: string;
  local: string;
  characters: string[];
}

export interface MysterySuggestionEntry {
  mystery_id: string;
  mystery_name: string;
  suggested_action: "create" | "update";
  classification: string;
  suggested_update: string;
  evidence: Array<{ session_order: number; event: string }>;
}

// NPC que o personagem já conhecia mas ainda não tinha vinculado à
// própria ficha (existe na coleção "npcs", de outro personagem/sessão)
// — vinculado direto, sem aprovação (ver applyNpcLinks/linkNpcToCharacter).
export interface NpcLinkEntry {
  npc_id: string;
  npc_name: string;
}

// NPC novo de verdade, sem nenhum documento existente — precisa de
// aprovação do jogador antes de criar (ver EndSessionModal,
// createNpcFromSuggestion em actions/sets/npcs.ts). Mesma forma da
// ficha de NPC (ver pages/relacoes), sem os campos que a criação já
// preenche sozinha (id, user_id, relacionado, habilidades, pocoes).
export interface NpcCreationSuggestion {
  name: string;
  tipo: string;
  casa: string;
  ano: number;
  student_year: number;
  relacao: string;
  amizade: number;
  confianca: number;
  caracteristicas: string;
  personalidade: string;
  detalhes: string;
  image_url: string;
  atributos: Record<string, number>;
}

// Adversário (criatura da coleção "enemies" ou NPC hostil) que apareceu
// de forma relevante na cena — vira uma entrada em
// `Character.adversarios_conhecidos`, sem aprovação (ver
// applyAdversaryEncounters/KnownAdversary em utils/types.ts).
export interface AdversaryEncounter {
  id: string;
  tipo: "enemy" | "npc";
  name: string;
}

export interface SessionRegistration {
  session_history: SessionHistoryEvent[];
  spell_mastery_updates: SpellMasteryUpdate[];
  potion_mastery_updates: PotionMasteryUpdate[];
  inventory_updates: InventoryUpdateEntry[];
  money_update: MoneyUpdateResult | null;
  mystery_suggestions: MysterySuggestionEntry[];
  npc_links: NpcLinkEntry[];
  npc_creation_suggestions: NpcCreationSuggestion[];
  adversary_encounters: AdversaryEncounter[];
  house_points_earned: number;
  pending_actions: string[];
}

const EMPTY_SESSION_REGISTRATION: SessionRegistration = {
  session_history: [],
  spell_mastery_updates: [],
  potion_mastery_updates: [],
  inventory_updates: [],
  money_update: null,
  mystery_suggestions: [],
  npc_links: [],
  npc_creation_suggestions: [],
  adversary_encounters: [],
  house_points_earned: 0,
  pending_actions: [],
};

/**
 * A IA às vezes devolve o JSON envolto em ```json apesar de instruído a
 * não fazer isso — remove a cerca antes de tentar `JSON.parse`. Cada
 * array vem defensivamente validado (`Array.isArray`) e cai em `[]`
 * quando a IA omitir ou errar o formato, pra nunca quebrar a aplicação
 * das outras atualizações por causa de uma seção malformada.
 */
export function parseSessionRegistration(rawText: string): SessionRegistration {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<SessionRegistration>;

  return {
    session_history: Array.isArray(parsed.session_history) ? parsed.session_history : [],
    spell_mastery_updates: Array.isArray(parsed.spell_mastery_updates) ? parsed.spell_mastery_updates : [],
    potion_mastery_updates: Array.isArray(parsed.potion_mastery_updates) ? parsed.potion_mastery_updates : [],
    inventory_updates: Array.isArray(parsed.inventory_updates) ? parsed.inventory_updates : [],
    money_update: parsed.money_update ?? null,
    mystery_suggestions: Array.isArray(parsed.mystery_suggestions) ? parsed.mystery_suggestions : [],
    npc_links: Array.isArray(parsed.npc_links) ? parsed.npc_links : [],
    npc_creation_suggestions: Array.isArray(parsed.npc_creation_suggestions) ? parsed.npc_creation_suggestions : [],
    adversary_encounters: Array.isArray(parsed.adversary_encounters) ? parsed.adversary_encounters : [],
    house_points_earned: typeof parsed.house_points_earned === "number" ? parsed.house_points_earned : 0,
    pending_actions: Array.isArray(parsed.pending_actions) ? parsed.pending_actions : [],
  };
}

export function emptySessionRegistration(): SessionRegistration {
  return { ...EMPTY_SESSION_REGISTRATION };
}

/** `habilidades[spell_id].xp` é onde a maestria de feitiço mora de verdade (ver doc de `pages/atributos`) — preserva os outros campos do registro existente, cria um novo se o feitiço ainda não constava. */
export function applySpellMasteryUpdates(
  habilidades: Record<string, CharacterHabilidade>,
  updates: SpellMasteryUpdate[]
): Record<string, CharacterHabilidade> {
  const next = { ...habilidades };
  for (const update of updates) {
    if (!update.spell_id) continue;
    next[update.spell_id] = { ...next[update.spell_id], xp: update.new_xp };
  }
  return next;
}

export function applyPotionMasteryUpdates(
  pocoes: Record<string, CharacterPocao>,
  updates: PotionMasteryUpdate[]
): Record<string, CharacterPocao> {
  const next = { ...pocoes };
  for (const update of updates) {
    if (!update.potion_id) continue;
    next[update.potion_id] = {
      ...next[update.potion_id],
      nivel: next[update.potion_id]?.nivel ?? "",
      ingredientes_info: next[update.potion_id]?.ingredientes_info ?? [],
      xp: update.new_xp,
    };
  }
  return next;
}

/** Item sem `item_id` (novo) ganha um id gerado agora — o protocolo espera exatamente isso ("sinalize que o backend deve gerar o ID"). */
export function applyInventoryUpdates(items: CharacterItem[], updates: InventoryUpdateEntry[]): CharacterItem[] {
  let result = [...items];

  for (const update of updates) {
    const index = update.item_id ? result.findIndex((item) => item.id === update.item_id) : -1;

    if (update.action === "remove") {
      if (index === -1) continue;
      if (update.new_quantity <= 0) {
        result = result.filter((_, i) => i !== index);
      } else {
        result[index] = { ...result[index], quantidade: update.new_quantity };
      }
      continue;
    }

    if (index === -1) {
      result.push({
        id: update.item_id || crypto.randomUUID(),
        nome: update.item_name || "Item sem nome",
        categoria: "Outros",
        quantidade: Math.max(0, update.new_quantity),
        detalhes: update.reason || undefined,
      });
    } else {
      result[index] = { ...result[index], quantidade: Math.max(0, update.new_quantity) };
    }
  }

  return result;
}

/** Sempre escreve em `dinheiro` (o campo principal, ver `resolveCharacterMoney` em @/utils) — a partir da primeira atualização de IA, o personagem "migra" pra ele mesmo que antes usasse só o legado. */
export function applyMoneyUpdate(current: CharacterMoney, update: MoneyUpdateResult | null): CharacterMoney {
  if (!update) return current;
  return {
    galeoes: update.updated.goldens,
    sicles: update.updated.sicles,
    nuques: update.updated.nuquens,
  };
}

function normalizeNpcRelatedIds(relacionado: Npc["relacionado"]): string[] {
  if (Array.isArray(relacionado)) return relacionado;
  if (relacionado) return [relacionado];
  return [];
}

/**
 * Separa os NPCs (coleção inteira, `getNpcs()`) entre "já conhecidos"
 * (relacionado já inclui este personagem — não precisa fazer nada) e
 * "outros" (existem no Firestore, mas ainda não vinculados a ele — a IA
 * pode sugerir vínculo em vez de criar um NPC duplicado). Mesma
 * normalização de `relacionado` (array ou string única) de
 * `pages/relacoes/functions.ts`, duplicada aqui de propósito — páginas
 * não importam lógica umas das outras.
 */
export function splitKnownNpcs(npcs: Npc[], characterId: string): { known: Npc[]; other: Npc[] } {
  const known: Npc[] = [];
  const other: Npc[] = [];

  for (const npc of npcs) {
    if (normalizeNpcRelatedIds(npc.relacionado).includes(characterId)) known.push(npc);
    else other.push(npc);
  }

  return { known, other };
}

/** Acrescenta os encontros novos a `adversarios_conhecidos`, sem duplicar (mesmo id + tipo já presente é ignorado). */
export function applyAdversaryEncounters(
  current: KnownAdversary[],
  encounters: AdversaryEncounter[]
): KnownAdversary[] {
  const seen = new Set(current.map((adversary) => `${adversary.tipo}:${adversary.id}`));
  const additions: KnownAdversary[] = [];

  for (const encounter of encounters) {
    if (!encounter.id) continue;
    const key = `${encounter.tipo}:${encounter.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    additions.push({ id: encounter.id, tipo: encounter.tipo });
  }

  return [...current, ...additions];
}
