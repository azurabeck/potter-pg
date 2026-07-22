// src/utils/types.ts
// Tipos compartilhados entre actions, pages e components.

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
export type AiProvider = "anthropic" | "openai" | "gemini";

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
}

export const EMPTY_AI_PROVIDER_CONFIG: AiProviderConfig = {
  provider: "anthropic",
  apiKey: "",
};

// Personagem vindo da colecao "characters" do Firestore. Contempla tanto
// personagens de jogador ("player", buscados por getPlayerCharacters)
// quanto NPCs ("npc", buscados por getNpcCharacters — ver actions/get/characters.ts).
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
  hp?: number;
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
// desses documentos em `campaign_ids` — ver actions/get/campaigns.ts.
export interface Campaign {
  id: string;
  campaign_name: string;
  campaign_year: number;
  character_id: string;
  order: number;
  sessions: CampaignSessionEvent[];
  year: number;
}

// Uma fala do feed de narração (jogador ou "Narrador"). Também é a forma
// salva na colecao "narration_sessions" — ver actions/get|sets/narration-session.ts.
export type NarrationMessage = {
  id: string;
  user: string;
  text: string;
};
