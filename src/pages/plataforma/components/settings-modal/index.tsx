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
import { getNpcCharacters } from "@/actions/get/characters";
import { getAiPrompts, getAiProviderConfig } from "@/actions/get/settings";
import { saveAiPrompts, saveAiProviderConfig } from "@/actions/sets/settings";
import { EMPTY_AI_PROMPTS, EMPTY_AI_PROVIDER_CONFIG, type AiProvider, type Character } from "@/utils/types";
import { isAiPromptsEmpty } from "../../functions";
import type { HistoryItem } from "../../functions";
import "./style.scss";

const AI_PROVIDER_LABEL: Record<AiProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  gemini: "Google (Gemini)",
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (item: HistoryItem) => void;
  onRequireSetup: () => void;
}

/**
 * Configurações da sessão (narrador, IA, players). Renderizado sempre
 * (o pai não desmonta este componente ao fechar) porque o estado interno
 * — prompts, players adicionados, etc. — precisa sobreviver entre um
 * fechar e um abrir de novo, exatamente como acontecia quando isso era
 * só um bloco de JSX condicional dentro do componente da página.
 */
export default function SettingsModal({ isOpen, onClose, onAddPlayer, onRequireSetup }: SettingsModalProps) {
  const { user } = useAuth();
  const [narratorMode, setNarratorMode] = useState<"ai" | "human">("ai");
  const [aiPlays, setAiPlays] = useState(false);
  const [selectedAiCharacter, setSelectedAiCharacter] = useState("");
  const [npcCharacters, setNpcCharacters] = useState<Character[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [aiPrompts, setAiPrompts] = useState(EMPTY_AI_PROMPTS);
  const [aiProviderConfig, setAiProviderConfig] = useState(EMPTY_AI_PROVIDER_CONFIG);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkedInitialPrompts = useRef(false);

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
        if (isAiPromptsEmpty(prompts) || !providerConfig.apiKey) onRequireSetup();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, onRequireSetup]);

  useEffect(() => {
    if (!isOpen || narratorMode !== "human" || !aiPlays) return;

    let cancelled = false;
    getNpcCharacters()
      .then((data) => {
        if (cancelled) return;
        setNpcCharacters(data);
        setSelectedAiCharacter((current) => current || data[0]?.id || "");
      })
      .catch((error) => console.error("Erro ao carregar NPCs:", error));

    return () => {
      cancelled = true;
    };
  }, [isOpen, narratorMode, aiPlays]);

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = playerInput.trim();
    if (!name || players.some((player) => player.toLowerCase() === name.toLowerCase())) return;

    setPlayers((current) => [...current, name]);
    onAddPlayer({ id: crypto.randomUUID(), type: "join", user: name });
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
                <span>Escolha apenas uma opção.</span>
              </div>
            </div>

            <fieldset className="platform-settings__radios">
              <legend className="sr-only">Tipo de narrador</legend>
              <label className={narratorMode === "ai" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="settings-narrator"
                  checked={narratorMode === "ai"}
                  onChange={() => setNarratorMode("ai")}
                />
                <span className="platform-settings__radio" />
                Narrador IA
              </label>
              <label className={narratorMode === "human" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="settings-narrator"
                  checked={narratorMode === "human"}
                  onChange={() => setNarratorMode("human")}
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
                  <strong>IA como jogador</strong>
                  <span>A IA deixa de narrar e assume um NPC.</span>
                </div>
              </div>
              <label className="platform-settings__toggle-row">
                <input
                  type="checkbox"
                  checked={aiPlays}
                  onChange={(event) => setAiPlays(event.target.checked)}
                />
                <span className="platform-settings__toggle" />
                IA joga?
              </label>
              {aiPlays && (
                <label className="platform-settings__field">
                  <span>Quem é a IA?</span>
                  <select
                    value={selectedAiCharacter}
                    onChange={(event) => setSelectedAiCharacter(event.target.value)}
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
                  <span>Regras usadas em cada tipo de cena.</span>
                </div>
              </div>
              <div className="platform-settings__prompt-grid">
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <ScrollText size={14} /> Regra de Narração
                  </span>
                  <textarea
                    value={aiPrompts.narration}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, narration: event.target.value }))
                    }
                    placeholder="Escreva a regra de narração..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Sword size={14} /> Regra de Batalha
                  </span>
                  <textarea
                    value={aiPrompts.battle}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, battle: event.target.value }))
                    }
                    placeholder="Escreva a regra de batalha..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Dices size={14} /> Regra de Duelo
                  </span>
                  <textarea
                    value={aiPrompts.duel}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, duel: event.target.value }))
                    }
                    placeholder="Escreva a regra de duelo..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <Trophy size={14} /> Regra de Quadribol
                  </span>
                  <textarea
                    value={aiPrompts.quidditch}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, quidditch: event.target.value }))
                    }
                    placeholder="Escreva a regra de quadribol..."
                  />
                </label>
                <label className="platform-settings__field platform-settings__field--textarea">
                  <span>
                    <DoorClosed size={14} /> Regra de Encerramento
                  </span>
                  <textarea
                    value={aiPrompts.closing}
                    onChange={(event) =>
                      setAiPrompts((current) => ({ ...current, closing: event.target.value }))
                    }
                    placeholder="Escreva a regra de encerramento..."
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
                <span>Adicione quem poderá entrar nesta plataforma.</span>
              </div>
            </div>
            <form className="platform-settings__add-player" onSubmit={addPlayer}>
              <input
                value={playerInput}
                onChange={(event) => setPlayerInput(event.target.value)}
                placeholder="Nome ou e-mail do player"
              />
              <button type="submit">
                <UserPlus size={15} /> Adicionar
              </button>
            </form>
            {players.length > 0 && (
              <div className="platform-settings__players">
                {players.map((player) => (
                  <span key={player}>{player}</span>
                ))}
              </div>
            )}
            <p className="platform-settings__hint">
              Quando um player entrar, a ação será exibida no histórico da sessão.
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
