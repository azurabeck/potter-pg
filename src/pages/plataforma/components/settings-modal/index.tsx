import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Dices,
  DoorClosed,
  Eye,
  EyeOff,
  KeyRound,
  ScrollText,
  Sparkles,
  Sword,
  Trophy,
  UserPlus,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { getNpcs } from "@/actions/get/npcs";
import { getAiPrompts, getAiProviderConfig } from "@/actions/get/settings";
import { saveAiPrompts, saveAiProviderConfig } from "@/actions/sets/settings";
import { createInvite } from "@/actions/sets/invites";
import { EMPTY_AI_PROMPTS, EMPTY_AI_PROVIDER_CONFIG, type AiProvider, type Npc } from "@/utils/types";
import type { HistoryItem } from "../../functions";
import "./style.scss";

const AI_PROVIDER_LABEL: Record<AiProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  gemini: "Google (Gemini)",
  grok: "xAI (Grok)",
};

export type CompanionMode = "none" | "ai" | "players";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (item: HistoryItem) => void;
  onRequireSetup: () => void;
  // Tipo de narrador e quem mais participa (narração humana) — levantado
  // pro pai (`pages/plataforma/index.tsx`) porque `playSession` precisa
  // saber disso pra decidir se chama a IA pra abrir a cena ou se espera o
  // narrador digitar (ver GroupSession, utils/types.ts). Continuam
  // sobrevivendo a um fechar/abrir do modal do mesmo jeito de sempre,
  // porque agora é o pai que nunca desmonta essa parte do estado.
  narratorMode: "ai" | "human";
  onNarratorModeChange: (mode: "ai" | "human") => void;
  companionMode: CompanionMode;
  onCompanionModeChange: (mode: CompanionMode) => void;
  selectedAiCharacter: string;
  onSelectedAiCharacterChange: (characterId: string) => void;
  selectedParticipantIds: string[];
  onToggleParticipant: (characterId: string) => void;
}

/**
 * Configurações da sessão (narrador, IA, players). Renderizado sempre
 * (o pai não desmonta este componente ao fechar) porque o estado interno
 * — prompts, players adicionados, etc. — precisa sobreviver entre um
 * fechar e um abrir de novo, exatamente como acontecia quando isso era
 * só um bloco de JSX condicional dentro do componente da página.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsModal({
  isOpen,
  onClose,
  onAddPlayer,
  onRequireSetup,
  narratorMode,
  onNarratorModeChange,
  companionMode,
  onCompanionModeChange,
  selectedAiCharacter,
  onSelectedAiCharacterChange,
  selectedParticipantIds,
  onToggleParticipant,
}: SettingsModalProps) {
  const { user } = useAuth();
  // `isTableOwner` (context/character) decide quem pode mudar o tipo de
  // narrador e adicionar novos players (ver comentário de `hostUserId`
  // em `Table`, utils/types.ts) — só ele pode.
  const { activeCharacter, tableCharacters, isTableOwner, isUserOnline } = useCharacter();
  const [npcCharacters, setNpcCharacters] = useState<Npc[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [invitingPlayer, setInvitingPlayer] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState(EMPTY_AI_PROMPTS);
  const [aiProviderConfig, setAiProviderConfig] = useState(EMPTY_AI_PROVIDER_CONFIG);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkedInitialPrompts = useRef(false);
  const onlineTableCharacters = tableCharacters.filter((character) => isUserOnline(character.user_id));

  // Carrega os prompts e o provedor/token salvos (colecao "settings", 1
  // documento por usuario) assim que a Plataforma monta — este componente
  // nunca desmonta, entao roda uma vez so por sessao de login. Sem regra
  // escrita ou sem token, pede pro usuario configurar (uma vez so, por
  // isso o ref em vez de estado).
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    Promise.all([getAiPrompts(user.uid), getAiProviderConfig(user.uid)]).then(([prompts, providerConfig]) => {
      if (cancelled) return;
      setAiPrompts(prompts);
      setAiProviderConfig(providerConfig);
      if (!checkedInitialPrompts.current) {
        checkedInitialPrompts.current = true;
        // As regras narrativas já têm um padrão embutido (ver
        // services/ai_prompt_defaults.ts) — só falta mesmo o token pra
        // narrar, os campos abaixo são só regras adicionais opcionais.
        if (!providerConfig.apiKey) onRequireSetup();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, onRequireSetup]);

  useEffect(() => {
    if (!isOpen || narratorMode !== "human" || companionMode !== "ai") return;

    let cancelled = false;
    getNpcs()
      .then((data) => {
        if (cancelled) return;
        setNpcCharacters(data);
        if (!selectedAiCharacter && data[0]) onSelectedAiCharacterChange(data[0].id);
      })
      .catch((error) => console.error("Erro ao carregar NPCs:", error));

    return () => {
      cancelled = true;
    };
    // Só busca de novo ao entrar em modo "ai" — `selectedAiCharacter` de
    // propósito fora do array de deps, senão refaria a busca a cada troca
    // manual de NPC selecionado.
  }, [isOpen, narratorMode, companionMode]);

  // Nome puro (sem @) só entra na lista visual da sessão, igual sempre
  // funcionou. E-mail vira um convite de verdade (colecao "invites") —
  // o convidado recebe o aviso no header e, ao aceitar, entra na mesa
  // (aparece no roster de `tableCharacters`), mas narra com a própria
  // configuração de IA — precisa configurar o próprio token aqui antes.
  // `hostCharacterId` é o personagem ativo de quem está convidando; sem
  // personagem ativo (não deveria acontecer — Plataforma já exige um pra
  // existir) não dá pra convidar.
  async function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTableOwner) return;
    const value = playerInput.trim();
    if (!value || players.some((player) => player.toLowerCase() === value.toLowerCase())) return;

    setInviteError(null);
    let inviteId: string | undefined;

    if (EMAIL_PATTERN.test(value)) {
      if (!user || !activeCharacter) {
        setInviteError("Não foi possível identificar sua conta/personagem pra montar o convite.");
        return;
      }

      setInvitingPlayer(true);
      try {
        const hostName = activeCharacter.name?.trim() || user.email || "Alguém";
        inviteId = await createInvite(user.uid, activeCharacter.id, hostName, value);
      } catch (error) {
        setInviteError(`Não foi possível enviar o convite: ${(error as Error).message}`);
        return;
      } finally {
        setInvitingPlayer(false);
      }
    }

    setPlayers((current) => [...current, value]);
    onAddPlayer({
      id: crypto.randomUUID(),
      type: "join",
      user: value,
      ...(inviteId ? { inviteId, inviteStatus: "pending" } : {}),
    });
    setPlayerInput("");
  }

  async function saveAndClose() {
    if (!user) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        saveAiPrompts(user.uid, aiPrompts),
        saveAiProviderConfig(user.uid, aiProviderConfig),
      ]);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="platform-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="platform-modal__panel platform-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="platform-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="platform-modal__heading">
          <Settings size={20} aria-hidden="true" />
          <div>
            <h2 id="platform-settings-title">Configurações da plataforma</h2>
            <p>Defina o narrador, o comportamento da IA e quem participa da sessão.</p>
          </div>
        </div>

        <div className="platform-settings__content">
          <section className="platform-settings__section">
            <div className="platform-settings__section-title">
              <Bot size={16} />
              <div>
                <strong>Tipo de narrador</strong>
                <span>{isTableOwner ? "Escolha apenas uma opção." : "Só o dono da mesa pode mudar."}</span>
              </div>
            </div>

            <fieldset className="platform-settings__radios" disabled={!isTableOwner}>
              <legend className="sr-only">Tipo de narrador</legend>
              <label className={narratorMode === "ai" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="settings-narrator"
                  checked={narratorMode === "ai"}
                  onChange={() => onNarratorModeChange("ai")}
                />
                <span className="platform-settings__radio" />
                Narrador IA
              </label>
              <label className={narratorMode === "human" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="settings-narrator"
                  checked={narratorMode === "human"}
                  onChange={() => onNarratorModeChange("human")}
                />
                <span className="platform-settings__radio" />
                Eu sou o narrador
              </label>
            </fieldset>
          </section>

          {narratorMode === "human" && (
            <section className="platform-settings__section">
              <div className="platform-settings__section-title">
                <Sparkles size={16} />
                <div>
                  <strong>Quem mais participa?</strong>
                  <span>
                    A IA só entra de novo no encerramento — durante a sessão, quem narra é você
                    mesmo.
                  </span>
                </div>
              </div>
              <fieldset className="platform-settings__radios platform-settings__radios--column" disabled={!isTableOwner}>
                <legend className="sr-only">Quem mais participa</legend>
                <label className={companionMode === "none" ? "is-active" : ""}>
                  <input
                    type="radio"
                    name="settings-companion"
                    checked={companionMode === "none"}
                    onChange={() => onCompanionModeChange("none")}
                  />
                  <span className="platform-settings__radio" />
                  Ninguém — só eu narrando
                </label>
                <label className={companionMode === "ai" ? "is-active" : ""}>
                  <input
                    type="radio"
                    name="settings-companion"
                    checked={companionMode === "ai"}
                    onChange={() => onCompanionModeChange("ai")}
                  />
                  <span className="platform-settings__radio" />
                  A IA joga um NPC
                </label>
                <label className={companionMode === "players" ? "is-active" : ""}>
                  <input
                    type="radio"
                    name="settings-companion"
                    checked={companionMode === "players"}
                    onChange={() => onCompanionModeChange("players")}
                  />
                  <span className="platform-settings__radio" />
                  Outros jogadores da mesa
                </label>
              </fieldset>

              {companionMode === "ai" && (
                <label className="platform-settings__field">
                  <span>Quem é a IA?</span>
                  <select
                    value={selectedAiCharacter}
                    disabled={!isTableOwner}
                    onChange={(event) => onSelectedAiCharacterChange(event.target.value)}
                  >
                    <option value="">Selecione um NPC</option>
                    {npcCharacters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </select>
                  <small>Apenas personagens do tipo NPC aparecem nesta lista.</small>
                </label>
              )}

              {companionMode === "players" && (
                <div className="platform-settings__field">
                  <span>Jogadores (só quem está online agora)</span>
                  {onlineTableCharacters.length === 0 ? (
                    <small>Nenhum jogador da mesa está online agora.</small>
                  ) : (
                    <div className="platform-settings__participant-list">
                      {onlineTableCharacters.map((character) => (
                        <label
                          key={character.id}
                          className={
                            selectedParticipantIds.includes(character.id)
                              ? "platform-settings__toggle-row is-active"
                              : "platform-settings__toggle-row"
                          }
                        >
                          <input
                            type="checkbox"
                            disabled={!isTableOwner}
                            checked={selectedParticipantIds.includes(character.id)}
                            onChange={() => onToggleParticipant(character.id)}
                          />
                          <span className="platform-settings__toggle" />
                          {character.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {narratorMode === "ai" && (
            <section className="platform-settings__section">
              <div className="platform-settings__section-title">
                <KeyRound size={16} />
                <div>
                  <strong>IA da narração</strong>
                  <span>Qual provedor narra e o token da sua conta nele.</span>
                </div>
              </div>

              <label className="platform-settings__field">
                <span>Provedor</span>
                <select
                  value={aiProviderConfig.provider}
                  onChange={(event) =>
                    setAiProviderConfig((current) => ({
                      ...current,
                      provider: event.target.value as AiProvider,
                    }))
                  }
                >
                  {Object.entries(AI_PROVIDER_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="platform-settings__field platform-settings__field--token">
                <span>Token de API</span>
                <div className="platform-settings__token-input">
                  <input
                    type={tokenVisible ? "text" : "password"}
                    value={aiProviderConfig.apiKey}
                    onChange={(event) =>
                      setAiProviderConfig((current) => ({ ...current, apiKey: event.target.value }))
                    }
                    placeholder="Cole aqui o token da sua conta"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setTokenVisible((current) => !current)}
                    aria-label={tokenVisible ? "Esconder token" : "Mostrar token"}
                  >
                    {tokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <small>
                  Chamado direto do seu navegador com o seu token — nunca passa pelos nossos
                  servidores, mas também fica visível pra quem tiver acesso a este navegador
                  logado.
                </small>
              </label>
            </section>
          )}

          {narratorMode === "ai" && (
            <section className="platform-settings__section">
              <div className="platform-settings__section-title">
                <ScrollText size={16} />
                <div>
                  <strong>Prompts da IA</strong>
                  <span>Um padrão completo já é aplicado — o que você escrever aqui entra como regra adicional, sem substituir nada.</span>
                </div>
              </div>
              <div className="platform-settings__prompt-grid">
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <ScrollText size={14} /> Regra adicional de Narração
                  </span>
                  <textarea
                    value={aiPrompts.narration}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, narration: event.target.value }))
                    }
                    placeholder="Regras extras, além do padrão (opcional)..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Sword size={14} /> Regra adicional de Batalha
                  </span>
                  <textarea
                    value={aiPrompts.battle}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, battle: event.target.value }))
                    }
                    placeholder="Regras extras, além do padrão (opcional)..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Dices size={14} /> Regra adicional de Duelo
                  </span>
                  <textarea
                    value={aiPrompts.duel}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, duel: event.target.value }))
                    }
                    placeholder="Regras extras, além do padrão (opcional)..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Trophy size={14} /> Regra adicional de Quadribol
                  </span>
                  <textarea
                    value={aiPrompts.quidditch}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, quidditch: event.target.value }))
                    }
                    placeholder="Regras extras, além do padrão (opcional)..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <DoorClosed size={14} /> Regra adicional de Encerramento
                  </span>
                  <textarea
                    value={aiPrompts.closing}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, closing: event.target.value }))
                    }
                    placeholder="Regras extras, além do padrão (opcional)..."
                  />
                </label>
              </div>
            </section>
          )}

          <section className="platform-settings__section">
            <div className="platform-settings__section-title">
              <UserPlus size={16} />
              <div>
                <strong>Players da sessão</strong>
                <span>{isTableOwner ? "Adicione quem poderá entrar nesta plataforma." : "Só o dono da mesa pode adicionar players."}</span>
              </div>
            </div>
            <form className="platform-settings__add-player" onSubmit={addPlayer}>
              <input
                value={playerInput}
                onChange={(event) => {
                  setPlayerInput(event.target.value);
                  setInviteError(null);
                }}
                placeholder="Nome ou e-mail do player"
                disabled={invitingPlayer || !isTableOwner}
              />
              <button type="submit" disabled={invitingPlayer || !isTableOwner}>
                <UserPlus size={15} /> {invitingPlayer ? "Convidando..." : "Adicionar"}
              </button>
            </form>
            {inviteError && <p className="platform-modal__error">{inviteError}</p>}
            {players.length > 0 && (
              <div className="platform-settings__players">
                {players.map((player) => (
                  <span key={player}>{player}</span>
                ))}
              </div>
            )}
            <p className="platform-settings__hint">
              Nomes (sem @) só aparecem na lista. E-mails viram um convite de
              verdade: a pessoa recebe o aviso pra aceitar/rejeitar assim que
              logar, e ao aceitar entra na mesa — mas narra com a própria
              configuração de IA, precisa configurar o token dela aqui.
            </p>
          </section>
        </div>

        <div className="platform-modal__footer platform-settings__footer">
          <button
            type="button"
            className="platform-modal__primary"
            onClick={saveAndClose}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
