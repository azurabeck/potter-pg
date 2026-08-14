// src/utils/types.ts
// Tipos compartilhados entre actions, pages e components.

import type { Timestamp } from "firebase/firestore";

export interface MasteryEffect {
  from: number;
  to: number;
  label: string;
  value: string;
  description: string;
}

export interface SpecialRule {
  titulo: string;
  descricao: string;
}

// Só ~20 dos 341 documentos reais da colecao "spells" tem a ficha completa
// (range, attribute, concentration, mastery_effects, special_rules, slug,
// description, casting_time, limitation, penalty, effect_value, learned_in,
// card_category). Os demais so tem os campos "basicos" (marcados sem `?`
// abaixo); os outros sao opcionais e a UI precisa degradar graciosamente
// quando faltam.
export interface SpellAttributes {
  name: string;
  incantation: string | null;
  category: string;
  card_category?: string;
  ano_letivo: number;
  learned_in?: string;
  nivel: string;
  attribute?: string;
  required: number;
  maestria_required: number;
  xp_total: number;
  xp_maestria: Record<string, number>;
  range?: string;
  casting_time?: string;
  concentration?: boolean;
  description?: string;
  effect: string;
  limitation?: string;
  penalty?: string;
  effect_value?: string;
  mastery_effects?: MasteryEffect[];
  special_rules?: SpecialRule[];
  card_image_url: string;
  image_url: string;
  image: string;
  light: string;
  slug?: string;
  penalidade_crime_magico: string | number;
}

export interface Spell {
  id: string;
  type?: string;
  attributes: SpellAttributes;
}

export interface PotionIngredient {
  value: string;
  name: string;
  shop: string;
  drop: string;
  note?: string;
}

// "1-4", "5-9", "10" — faixa de maestria (M1-M10, ver `xp_maestria`
// abaixo) que esse efeito cobre.
export interface PotionMasteryEffect {
  mastery: string;
  effect: string;
  recipe: string;
}

// Documento da colecao "potions" — ao contrario de `Spell`, os campos
// ficam direto na raiz do documento (sem wrapper `attributes`).
export interface Potion {
  id: string;
  name: string;
  ano: number;
  ingredientes_info: PotionIngredient[];
  cooking: string;
  nivel: string;
  xp_maestria: Record<string, number>;
  xp_total: number;
  aula: string;
  card_image_url: string;
  image_url: string;
  effect: string;
  mastery_effect: PotionMasteryEffect[];
}

export interface CharacterMoney {
  galeoes: number;
  sicles: number;
  nuques: number;
}

export interface CharacterHabilidade {
  atributo?: string;
  nivel?: string;
  xp: number;
}

export interface CharacterItem {
  id: string;
  nome: string;
  categoria: string;
  atributo?: string;
  onde_encontrou?: string;
  quantidade: number;
  valor_atributo?: number | string;
  descricao?: string;
  detalhes?: string;
}

export interface CharacterInventario {
  goldens?: number;
  nuquens?: number;
  sicles?: number;
  itens: CharacterItem[];
}

export interface PocaoIngrediente {
  name: string;
  drop?: string;
  shop?: string;
  value?: string;
}

export interface CharacterPocao {
  cooking?: string;
  ingredientes_info: PocaoIngrediente[];
  local_ingredientes?: string;
  nivel: string;
  xp: number;
}

export interface CharacterTalento {
  id: string;
  nome: string;
  tipo: string;
  nivel: number;
  maximo: number;
  descricao?: string;
  conhecidoPor?: string;
  titulo?: string;
  vantagem?: string;
}

export interface CharacterVarinha {
  atributo: string;
  madeira: string;
  miolo: string;
}

// Configuracao de narracao por IA da sessao (colecao "settings", um
// documento por usuario, id do documento == uid — ver actions/get|sets/settings.ts).
export interface AiPrompts {
  narration: string;
  battle: string;
  duel: string;
  quidditch: string;
  closing: string;
}

export const EMPTY_AI_PROMPTS: AiPrompts = {
  narration: "",
  battle: "",
  duel: "",
  quidditch: "",
  closing: "",
};

// Qual provedor de IA narra e o token do proprio usuario pra chamar a API
// dele direto do navegador (mesmo documento "settings" dos prompts).
export type AiProvider = "anthropic" | "openai" | "gemini" | "grok";

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
}

export const EMPTY_AI_PROVIDER_CONFIG: AiProviderConfig = {
  provider: "anthropic",
  apiKey: "",
};

// Personagem de jogador vindo da colecao "characters" do Firestore
// (buscados por getPlayerCharacters — ver actions/get/characters.ts).
// NPCs moram numa colecao separada, "npcs" — ver `Npc` abaixo.
export interface Character {
  id: string;
  name: string;
  character_type: string;
  user_id: string;
  casa: string;
  ano: number;
  animal?: string;
  nascimento?: string;
  image_url?: string;
  image_url_ano_1?: string;
  pet_url?: string;
  hp?: number;
  personalidade?: string;
  caracteristicas_fisicas?: string;
  historia?: string;
  atributos: Record<string, number>;
  dinheiro: CharacterMoney;
  habilidades: Record<string, CharacterHabilidade>;
  inventario: CharacterInventario;
  pocoes: Record<string, CharacterPocao>;
  talentos: CharacterTalento[];
  titulos: CharacterTalento[];
  varinha?: CharacterVarinha;
  campaign_ids: string[];
  mystery_ids: string[];
  // Adversários (criaturas da coleção "enemies" ou NPCs hostis) que este
  // personagem já conheceu/enfrentou — popula sozinho no registro de
  // sessão (ver pages/plataforma/functions.ts, `adversary_encounters`),
  // sem aprovação manual (é só um registro de "já vi isso", não uma
  // criação). `tipo` diz em qual coleção procurar o id (ver
  // pages/adversarios).
  adversarios_conhecidos?: KnownAdversary[];
  // Ids da coleção "locations" que este personagem já conhece — mesma
  // mecânica de `adversarios_conhecidos`, mas sem `tipo` porque só existe
  // uma coleção de locais (ver pages/locais). Populado pelo botão de
  // relacionar do potter-spells (dashboard do mestre), não pelo jogador.
  locais_conhecidos?: string[];
}

export interface KnownAdversary {
  id: string;
  tipo: "enemy" | "npc";
}

// Documento da colecao "locations" — global, sem filtro por dono na
// leitura (mesmo padrão de "npcs"/"enemies", ver actions/get/locations.ts).
// `access_character_ids` é "quem tem acesso" (conceito do mestre, no
// dashboard potter-spells) — diferente de `Character.locais_conhecidos`
// ("o que esse personagem já descobriu"), que é o que esta página filtra.
export interface Location {
  id: string;
  name: string;
  type: string;
  characteristics?: string;
  importance?: string;
  image_url?: string;
  access_character_ids?: string[];
  user_id?: string;
}

// Documento da colecao "npcs" (separada de "characters" — confirmado no
// console do Firebase do projeto: campos de atributo usam as mesmas 18
// chaves em português usadas no projeto de referência). Alguns campos
// têm mais de um nome possível (`ano`/`year`, `casa`/`house`,
// `student_year`/`studentYear`) — mesma leniência defensiva do projeto
// de referência (ver getNpcAno/getNpcCampaignYear/getNpcHouse em
// pages/relacoes/functions.ts), porque não dá pra garantir qual nome
// cada NPC já cadastrado usa.
export interface Npc {
  id: string;
  user_id?: string;
  name: string;
  tipo?: string;
  casa?: string;
  house?: string;
  ano?: number;
  year?: number;
  student_year?: number;
  studentYear?: number;
  relacao?: string;
  // Ids de personagens (`player`) que este NPC está relacionado — array
  // ou string única (dado legado, mesma leniência do projeto de
  // referência). Normalizar sempre antes de ler (ver getRelatedNpcs).
  relacionado?: string[] | string;
  amizade?: number;
  confianca?: number;
  caracteristicas?: string;
  personalidade?: string;
  detalhes?: string;
  image_url?: string;
  atributos: Record<string, number>;
  habilidades?: Record<string, unknown>;
  pocoes?: Record<string, unknown>;
}

// Ataque (principal ou secundário) de um adversário — `distance` usa os
// códigos internos do projeto de referência ("short"/"medium"/"long"/
// "short_medium"/"medium_long"), não os rótulos em português.
export interface EnemyAttack {
  name: string;
  attribute: string;
  attribute_value: number;
  distance: string;
  effect: string;
}

export interface EnemyDefense {
  attribute: string;
  attribute_value: number;
}

// Documento da colecao "enemies" — bestiário/adversários, separado de
// "npcs" e "characters". Só leitura no potter-pg por enquanto (ver doc
// de pages/adversarios): cadastro é feito direto no console do
// Firebase, igual a spells/potions.
export interface Enemy {
  id: string;
  name: string;
  type: string;
  hp: number;
  difficulty: string;
  recommended_year: number;
  impact_die: string;
  image_url?: string;
  local?: string;
  caracteristicas?: string;
  main_attack: EnemyAttack | null;
  secondary_attack: EnemyAttack | null;
  defense: EnemyDefense;
}

// "mistérios" cobre mistérios de verdade; as outras 3 categorias são
// outros tipos de registro que o narrador/IA acompanha na mesma aba
// (mesmo modelo usado num projeto irmão deste — ver doc de `pages/misterios`).
export type MysteryCategory = "mistérios" | "projetos" | "pendencias narrador" | "proxima sessão";

export type MysteryStatus = "em andamento" | "resolvido" | "cancelado";

export type MysteryClueStatus = "em aberto" | "resolvido" | "cancelado";

// Uma pista (ou, na categoria "projetos", um objetivo) dentro de um
// mistério — array `clues` do documento, ordenado por `order`.
export interface MysteryClue {
  order: number;
  name: string;
  question: string;
  details: string;
  resolution: string;
  status: MysteryClueStatus;
}

// Documento da colecao "mysteries" — pertence a um personagem
// (`character_id`; `Character.mystery_ids` guarda só os ids, ver acima).
// Nem todo campo se aplica a toda categoria (`awaited_event`/
// `current_situation`/`responder` são só de "pendencias narrador";
// `next_session` só de "proxima sessão"; `clues` só de "mistérios"/
// "projetos") — ver `pages/misterios` pra como cada categoria usa os
// campos. Sem action de escrita ainda: a IA é quem vai criar/atualizar
// esses documentos ao encerrar uma sessão (não implementado) — esta
// página só lê.
export interface Mystery {
  id: string;
  user_id: string;
  character_id: string;
  category: MysteryCategory;
  name: string;
  year: number;
  status: MysteryStatus;
  clues: MysteryClue[];
  details: string;
  last_appearance: string;
  next_session: boolean;
  awaited_event: string;
  current_situation: string;
  responder: string;
}

// Um evento/cena dentro de um documento da colecao "campaigns" — o campo
// `characters` guarda nomes (nao ids), como aparece no Firestore.
export interface CampaignSessionEvent {
  characters: string[];
  date: string;
  event: string;
  local: string;
  order: number;
}

// Documento da colecao "campaigns": um bloco de campanha (ex: "Campanha 22
// - O Reflexo Dourado") pertencente a um personagem (`character_id`),
// contendo varios eventos em `sessions`. Um personagem referencia varios
// desses documentos em `campaign_ids` — ver `linkCampaignToCharacter` em
// actions/sets/campaigns.ts (quem grava esse array) e
// actions/get/campaigns.ts (leitura, hoje ainda por `character_id`, não
// por esse array — ver comentário lá).
export interface Campaign {
  id: string;
  user_id: string;
  campaign_name: string;
  campaign_year: number;
  character_id: string;
  order: number;
  sessions: CampaignSessionEvent[];
  year: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

// Uma fala do feed de narração (jogador ou "Narrador"). Também é a forma
// salva na colecao "narration_sessions" — ver actions/get|sets/narration-session.ts.
export type NarrationMessage = {
  id: string;
  user: string;
  text: string;
};

export type TableInviteStatus = "pending" | "accepted" | "rejected";

// Convite pra um usuário entrar na mesa de outro (colecao "invites",
// actions/get|sets/invites.ts). `toEmail` é a chave de busca — o convite
// existe antes do convidado necessariamente ter feito nada, então não dá
// pra guardar um uid de destino ainda. `hostCharacterId` é o personagem
// do anfitrião, usado só pra saber quem mais está "na mesa" (ver
// `Encounter` abaixo) — NÃO é mais a sessão de narração compartilhada
// por padrão (cada personagem narra sozinho até se encontrar com
// alguém). `guestUserId`/`guestCharacterId`/`guestCharacterName` só
// existem depois que o convidado aceita e chega na Plataforma com um
// personagem pronto (preenchidos por `recordGuestCharacter` — pode
// demorar um pouco a mais que o aceite em si, se ele ainda estava no
// wizard de criação nesse momento).
export interface TableInvite {
  id: string;
  hostUserId: string;
  hostCharacterId: string;
  hostName: string;
  toEmail: string;
  status: TableInviteStatus;
  guestUserId?: string;
  guestCharacterId?: string;
  guestCharacterName?: string;
}

export type EncounterStatus = "pending" | "accepted" | "rejected";

// Pedido de um personagem pra encontrar outro numa mesa (colecao
// "encounters", actions/get|sets/encounters.ts) — os dois já precisam
// estar "na mesa" do mesmo anfitrião (ver TableInvite) pra poderem se
// pedir encontro. `sharedCharacterId` é calculado na criação (os dois
// characterIds ordenados e unidos, ex. "abc__xyz") — vira o id do
// `narration_sessions` compartilhado que os dois passam a usar assim
// que o pedido é aceito, ao invés de cada um narrar na própria sessão.
export interface Encounter {
  id: string;
  fromUserId: string;
  fromCharacterId: string;
  fromCharacterName: string;
  toUserId: string;
  toCharacterId: string;
  toCharacterName: string;
  location: string;
  status: EncounterStatus;
  sharedCharacterId: string;
}

// Sessão narrada por um humano (não pela IA) pra vários jogadores da mesa
// de uma vez — colecao "group_sessions", id do documento == hostUserId
// (mesma mesa, só uma sessão em grupo ativa por vez; ver Table acima).
// Criada por `startGroupSession` (actions/sets/group-session.ts) quando o
// dono da mesa escolhe "Eu sou o narrador" + "jogar com outros jogadores
// da mesa" (SettingsModal) e aperta Iniciar; apagada por
// `endGroupSession` ao encerrar — existência do documento == sessão
// ativa, mesmo espírito de `narration_sessions`/`TablePlayer`.
// `sharedSessionId` é calculado na criação (narratorCharacterId +
// participantCharacterIds, todos ordenados e unidos por "__", mesma
// ideia do `Encounter.sharedCharacterId" acima) — vira o id do
// `narration_sessions` compartilhado que todo mundo (narrador incluso)
// passa a usar em vez de narrar cada um na própria sessão. Diferença
// central pro Encontro: aqui não há streaming de IA por rodada — quem
// narra é o próprio dono da mesa, digitando; a IA só entra de novo no
// encerramento (resumo + registro por participante).
export interface GroupSession {
  id: string;
  narratorUserId: string;
  narratorCharacterId: string;
  participantCharacterIds: string[];
  sharedSessionId: string;
}

// Pontos que este personagem já somou pra própria casa nesta mesa —
// `casa`/`ano` NÃO ficam aqui de propósito (já vivem no documento do
// personagem em "characters"; duplicar arriscaria os dois lugares
// divergirem). Ver Table abaixo.
export interface TablePlayer {
  characterId: string;
  pointsForHouse: number;
}

// Documento da colecao "tables" — id do documento == hostUserId (mesmo
// anfitrião que ancora convites/encontros, ver TableInvite acima). Um só
// documento por mesa, criado sob demanda (nunca por uma tela de criação
// manual) na primeira vez que faz falta: o anfitrião convida o primeiro
// player (`ensureTableExists`, chamado por `createInvite` em
// actions/sets/invites.ts) ou, se isso ainda não tiver acontecido por
// algum motivo, quando alguém ganha o primeiro ponto pra casa
// (`addHousePoints`, actions/sets/table.ts). `hostUserId` repete o `id`
// do documento (nunca diverge — os dois são setados juntos, sempre, e o
// id de um doc não muda depois de criado) só pra ficar explícito/legível
// direto no payload sem precisar saber da convenção; é quem manda na
// mesa: só ele pode adicionar novos membros (convidar players,
// `SettingsModal`) e mudar o tipo de narrador (IA/humano, mesmo modal) —
// ver `isTableOwner` em `pages/plataforma/components/settings-modal`.
// `players` também é mantido em dia com quem está sentado na mesa (com 0
// pontos até ganhar algum) — `syncTableMembers`, chamado por
// `createInvite` (anfitrião) e `recordGuestCharacter` (convidado), e
// também via botão manual em `CharacterPanel` pra consertar mesas
// antigas que ficaram sem alguém. `housePoints` é o placar geral (uma
// chave por casa, sempre as 4 — ver HOUSES em
// pages/character-wizard/functions.ts — iniciadas em 0), mantido em dia
// por `addHousePoints` a cada ponto ganho/perdido (aceita negativo, pra
// descontar) e recalculado do zero a partir de `players` pelo botão de
// atualizar do `CharacterPanel` (`recalculateHousePoints`) pra mesas
// antigas que ficaram sem o campo.
export interface Table {
  id: string;
  hostUserId: string;
  year: number;
  npcs: string[];
  players: TablePlayer[];
  housePoints: Record<string, number>;
}
