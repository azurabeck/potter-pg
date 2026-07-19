import { useEffect, useState, type FormEvent } from "react";
import { Bot, Dices, ScrollText, Sparkles, Sword, Trophy, UserPlus, X, Settings } from "lucide-react";
import { getNpcCharacters } from "@/actions/get/characters";
import type { Character } from "@/utils/types";
import type { HistoryItem } from "../../functions";
import "./style.scss";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (item: HistoryItem) => void;
}

/**
 * Configurações da sessão (narrador, IA, players). Renderizado sempre
 * (o pai não desmonta este componente ao fechar) porque o estado interno
 * — prompts, players adicionados, etc. — precisa sobreviver entre um
 * fechar e um abrir de novo, exatamente como acontecia quando isso era
 * só um bloco de JSX condicional dentro do componente da página.
 */
export default function SettingsModal({ isOpen, onClose, onAddPlayer }: SettingsModalProps) {
  const [narratorMode, setNarratorMode] = useState<"ai" | "human">("ai");
  const [aiPlays, setAiPlays] = useState(false);
  const [selectedAiCharacter, setSelectedAiCharacter] = useState("");
  const [npcCharacters, setNpcCharacters] = useState<Character[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [aiPrompts, setAiPrompts] = useState({
    narration: "",
    battle: "",
    duel: "",
    quidditch: "",
  });

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
          <button type="button" className="platform-modal__primary" onClick={onClose}>
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  );
}
