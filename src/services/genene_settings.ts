// src/services/genene_settings.ts
// Configuracoes gerais da aplicacao que nao sao especificas do Firebase
// (nomes de colecoes, paginacao, e o contexto "stub" do personagem ativo
// ate existir autenticacao/selecao real de personagem).

export const COLLECTIONS = {
  SPELLS: "spells",
  CHARACTERS: "characters",
  SETTINGS: "settings",
  CAMPAIGNS: "campaigns",
  NARRATION_SESSIONS: "narration_sessions",
} as const;

export const APP_NAME = "POTTER-PG";

// Estimativa usada como quantidade de cards da grade de feiticos so no
// primeiro render, antes do ResizeObserver medir quantos cabem de verdade
// no espaco disponivel (ver calculateGridMetrics em pages/feiticos/functions.ts).
export const SPELLS_PAGE_SIZE_FALLBACK = 30;

// TODO: substituir por dados reais assim que hp/mp/xp/nivel_geral/meta_atual
// existirem na colecao "characters" do Firestore. Nome/casa/ano/avatar ja
// vem do personagem real selecionado (context/character); o restante (usado
// pelo CharacterPanel e pelo bloqueio de feiticos) ainda usa este stub.
export const CURRENT_CHARACTER_STUB = {
  nome: "Tomas Black",
  casa: "Grifinoria",
  ano: 2,
  nivel_geral: 5,
  hp: { atual: 85, max: 100 },
  mp: { atual: 36, max: 50 },
  xp: { atual: 62, max: 100 },
  moedas: { galeoes: 12, sicles: 5, nuques: 20 },
  atributos: {
    magia: 12,
    ataque: 12,
    controle: 9,
    defesa: 10,
    precisao: 8,
    agilidade: 10,
  },
  meta_atual: {
    titulo: "Completar 3 sessoes de duelos",
    progresso: 1,
    total: 3,
  },
};
