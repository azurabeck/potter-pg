import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Settings,
  Sparkles,
  ImagePlus,
  PanelTop,
  X,
  Dices,
  ExternalLink,
  UserPlus,
  Bot,
  Sword,
  Trophy,
  ScrollText,
  Send,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useCharacter } from "@/context/character";
import { getNpcCharacters } from "@/actions/get/characters";
import type { Character } from "@/utils/types";
import ScoreboardPanel from "./components/scoreboard";
import { DICE, TURN_ORDER, randomDieResult } from "./functions";
import type { Die, HistoryItem, RolledDie } from "./functions";
import "./style.scss";

export default function Plataforma() {
  const { activeCharacter } = useCharacter();
  const playerName = activeCharacter?.name?.trim() || "Tomas Black";
  const [narratorMode, setNarratorMode] = useState<"ai" | "human">("ai");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  const [activeTurn, setActiveTurn] = useState(2);
  const [rolledDie, setRolledDie] = useState<RolledDie | null>(null);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [responseText, setResponseText] = useState("");
  const [narrationMessages, setNarrationMessages] = useState<Array<{ id: string; user: string; text: string }>>([]);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isScoreboardPinned, setIsScoreboardPinned] = useState(false);
  const [scoreboardPosition, setScoreboardPosition] = useState({ x: 0, y: 0 });
  const scoreboardDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const narrationScrollRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setRolledDie(null);
      setIsImageFormOpen(false);
      setPreviewImage("");
      setImageError("");
      setIsSettingsOpen(false);
      if (!isScoreboardPinned) setIsScoreboardOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isScoreboardPinned]);

  useEffect(() => {
    if (!isSettingsOpen || narratorMode !== "human" || !aiPlays) return;

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
  }, [isSettingsOpen, narratorMode, aiPlays]);

  useEffect(() => {
    const container = historyScrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [history]);

  useEffect(() => {
    const container = narrationScrollRef.current;
    if (!container) return;

    const scrollToLatest = () => {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    };

    scrollToLatest();
    const observer = new MutationObserver(scrollToLatest);
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!scoreboardDragRef.current || !isScoreboardPinned) return;

      const panelWidth = 450;
      const panelHeight = 470;
      const x = Math.min(Math.max(12, event.clientX - scoreboardDragRef.current.offsetX), window.innerWidth - panelWidth - 12);
      const y = Math.min(Math.max(12, event.clientY - scoreboardDragRef.current.offsetY), window.innerHeight - panelHeight - 12);
      setScoreboardPosition({ x, y });
    }

    function handlePointerUp() {
      scoreboardDragRef.current = null;
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isScoreboardPinned]);

  function toggleScoreboardPin() {
    setIsScoreboardPinned((current) => {
      const next = !current;
      if (next) {
        const width = 450;
        setScoreboardPosition({
          x: Math.max(12, window.innerWidth - width - 34),
          y: 90,
        });
      }
      return next;
    });
  }

  function startScoreboardDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isScoreboardPinned) return;
    scoreboardDragRef.current = {
      offsetX: event.clientX - scoreboardPosition.x,
      offsetY: event.clientY - scoreboardPosition.y,
    };
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function rollDie(sides: Die["sides"]) {
    const result = randomDieResult(sides);
    setRolledDie({ sides, result });
    setHistory((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "dice", user: playerName, sides, result },
    ]);
  }

  function moveTurn(direction: -1 | 1) {
    setActiveTurn((current) => (current + direction + TURN_ORDER.length) % TURN_ORDER.length);
  }

  function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = responseText.trim();
    if (!text) return;

    setNarrationMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), user: playerName, text },
    ]);
    setResponseText("");
  }

  const previousTurn = (activeTurn - 1 + TURN_ORDER.length) % TURN_ORDER.length;
  const nextTurn = (activeTurn + 1) % TURN_ORDER.length;

  function openImageForm() {
    setImageUrlInput("");
    setImageError("");
    setIsImageFormOpen(true);
  }

  function handleImageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = imageUrlInput.trim();

    if (!url) {
      setImageError("Informe o link da imagem.");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      setImageError("Informe um link válido começando com http:// ou https://.");
      return;
    }

    setImageError("");
    setHistory((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "image", user: playerName, imageUrl: url },
    ]);
    setIsImageFormOpen(false);
    setPreviewImage(url);
  }

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = playerInput.trim();
    if (!name || players.some((player) => player.toLowerCase() === name.toLowerCase())) return;

    setPlayers((current) => [...current, name]);
    setHistory((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "join", user: name },
    ]);
    setPlayerInput("");
  }

  return (
    <section className="platform-page">
      <header className="platform-page__header">
        <h1>Plataforma</h1>
        <button
          type="button"
          className="platform-page__settings-button"
          aria-label="Abrir configurações da plataforma"
          title="Configurações"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={19} />
        </button>
      </header>

      <div className="platform-page__workspace">
        <div className="platform-page__story-grid">
          <div className="platform-page__narration" ref={narrationScrollRef}>
            <div className="platform-page__narration-content">
              {narrationMessages.length === 0 ? (
                <div className="platform-page__empty-state">
                  <Sparkles size={22} aria-hidden="true" />
                  <p>
                    A narração é exibida aqui, seja controlada pela IA ou por um narrador humano.
                  </p>
                </div>
              ) : (
                <div className="platform-page__narration-feed">
                  {narrationMessages.map((message) => (
                    <article key={message.id} className="platform-narration-message">
                      <strong>{message.user}</strong>
                      <p>{message.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="platform-page__history" aria-label="Histórico de imagens e rolagens">
            <div className="platform-page__history-header">
              <strong>Histórico</strong>
              <span>imagens e rolagens</span>
            </div>

            <div className="platform-page__history-list" ref={historyScrollRef}>
              {history.length === 0 ? (
                <p className="platform-page__history-empty">As ações da sessão aparecerão aqui.</p>
              ) : (
                history.map((item) => (
                  <article key={item.id} className="platform-history-item">
                    <p>
                      <strong>{item.user}</strong>{" "}
                      {item.type === "image"
                        ? "disparou uma imagem"
                        : item.type === "dice"
                          ? `tirou ${item.result} no d${item.sides}`
                          : "entrou na plataforma"}
                    </p>
                    {item.type === "image" && (
                      <button type="button" onClick={() => setPreviewImage(item.imageUrl)}>
                        <img src={item.imageUrl} alt="Imagem disparada no histórico" />
                        <span><ExternalLink size={12} /> ampliar</span>
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>

        <div className="platform-page__response-row">
          <form className="platform-page__response-box" onSubmit={submitResponse}>
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Escreva sua ação ou narração..."
              aria-label="Mensagem da rodada"
            />
            <button type="submit" disabled={!responseText.trim()} aria-label="Enviar mensagem">
              <Send size={16} />
              <span>Entrar</span>
            </button>
          </form>
          <div className="platform-page__actions">
            <button type="button" onClick={openImageForm}>
              <ImagePlus size={16} /> Disparar imagem
            </button>
            <div className="platform-scoreboard-anchor">
              <button type="button" onClick={() => setIsScoreboardOpen((current) => !current)}>
                <PanelTop size={16} /> Ver placar
              </button>
              {isScoreboardOpen && !isScoreboardPinned && (
                <ScoreboardPanel
                  pinned={false}
                  onClose={() => setIsScoreboardOpen(false)}
                  onTogglePin={toggleScoreboardPin}
                />
              )}
            </div>
          </div>
        </div>

        <div className="platform-page__dice-row">
          <strong>DADOS</strong>
          <div className="platform-page__dice-list">
            {DICE.map((die) => (
              <button
                type="button"
                key={die.sides}
                className={`platform-die platform-die--d${die.sides}`}
                aria-label={`Rolar dado de ${die.sides} lados`}
                title={`Rolar d${die.sides}`}
                onClick={() => rollDie(die.sides)}
              >
                <span>{die.sides}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="platform-page__turn-order">
          <div className="platform-page__turn-heading">
            <span>ORDEM DA RODADA</span>
            <strong>Turno {activeTurn + 1}</strong>
          </div>

          <div className="platform-turn-carousel" aria-label="Carrossel da ordem da rodada">
            <button type="button" className="platform-turn-carousel__arrow" onClick={() => moveTurn(-1)} aria-label="Ir para a rodada anterior">
              <ChevronLeft size={20} />
            </button>

            <button type="button" className="platform-turn-card platform-turn-card--side" onClick={() => setActiveTurn(previousTurn)}>
              <span>Rodada anterior</span>
              <strong>{TURN_ORDER[previousTurn]}</strong>
            </button>

            <div className="platform-turn-card platform-turn-card--active">
              <span><Crown size={13} /> Rodada atual</span>
              <strong>{TURN_ORDER[activeTurn]}</strong>
              <small>é a vez deste personagem</small>
            </div>

            <button type="button" className="platform-turn-card platform-turn-card--side" onClick={() => setActiveTurn(nextTurn)}>
              <span>Próxima rodada</span>
              <strong>{TURN_ORDER[nextTurn]}</strong>
            </button>

            <button type="button" className="platform-turn-carousel__arrow" onClick={() => moveTurn(1)} aria-label="Ir para a próxima rodada">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {isScoreboardOpen && isScoreboardPinned && (
        <div
          className="platform-scoreboard-floating"
          style={{ left: scoreboardPosition.x, top: scoreboardPosition.y }}
        >
          <ScoreboardPanel
            pinned
            onClose={() => {
              setIsScoreboardOpen(false);
              setIsScoreboardPinned(false);
            }}
            onTogglePin={toggleScoreboardPin}
            onDragStart={startScoreboardDrag}
          />
        </div>
      )}

      {isSettingsOpen && (
        <div className="platform-modal" role="presentation" onMouseDown={() => setIsSettingsOpen(false)}>
          <div
            className="platform-modal__panel platform-settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="platform-settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="platform-modal__close" type="button" onClick={() => setIsSettingsOpen(false)} aria-label="Fechar">
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
                  <div><strong>Tipo de narrador</strong><span>Escolha apenas uma opção.</span></div>
                </div>

                <fieldset className="platform-settings__radios">
                  <legend className="sr-only">Tipo de narrador</legend>
                  <label className={narratorMode === "ai" ? "is-active" : ""}>
                    <input type="radio" name="settings-narrator" checked={narratorMode === "ai"} onChange={() => setNarratorMode("ai")} />
                    <span className="platform-settings__radio" />
                    Narrador IA
                  </label>
                  <label className={narratorMode === "human" ? "is-active" : ""}>
                    <input type="radio" name="settings-narrator" checked={narratorMode === "human"} onChange={() => setNarratorMode("human")} />
                    <span className="platform-settings__radio" />
                    Eu sou o narrador
                  </label>
                </fieldset>
              </section>

              {narratorMode === "human" && (
                <section className="platform-settings__section">
                  <div className="platform-settings__section-title">
                    <Sparkles size={16} />
                    <div><strong>IA como jogador</strong><span>A IA deixa de narrar e assume um NPC.</span></div>
                  </div>
                  <label className="platform-settings__toggle-row">
                    <input type="checkbox" checked={aiPlays} onChange={(event) => setAiPlays(event.target.checked)} />
                    <span className="platform-settings__toggle" />
                    IA joga?
                  </label>
                  {aiPlays && (
                    <label className="platform-settings__field">
                      <span>Quem é a IA?</span>
                      <select value={selectedAiCharacter} onChange={(event) => setSelectedAiCharacter(event.target.value)}>
                        <option value="">Selecione um NPC</option>
                        {npcCharacters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
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
                    <div><strong>Prompts da IA</strong><span>Regras usadas em cada tipo de cena.</span></div>
                  </div>
                  <div className="platform-settings__prompt-grid">
                    <label className="platform-settings__field platform-settings__field--textarea">
                      <span><ScrollText size={14} /> Regra de Narração</span>
                      <textarea value={aiPrompts.narration} onChange={(event) => setAiPrompts((current) => ({ ...current, narration: event.target.value }))} placeholder="Escreva a regra de narração..." />
                    </label>
                    <label className="platform-settings__field platform-settings__field--textarea">
                      <span><Sword size={14} /> Regra de Batalha</span>
                      <textarea value={aiPrompts.battle} onChange={(event) => setAiPrompts((current) => ({ ...current, battle: event.target.value }))} placeholder="Escreva a regra de batalha..." />
                    </label>
                    <label className="platform-settings__field platform-settings__field--textarea">
                      <span><Dices size={14} /> Regra de Duelo</span>
                      <textarea value={aiPrompts.duel} onChange={(event) => setAiPrompts((current) => ({ ...current, duel: event.target.value }))} placeholder="Escreva a regra de duelo..." />
                    </label>
                    <label className="platform-settings__field platform-settings__field--textarea">
                      <span><Trophy size={14} /> Regra de Quadribol</span>
                      <textarea value={aiPrompts.quidditch} onChange={(event) => setAiPrompts((current) => ({ ...current, quidditch: event.target.value }))} placeholder="Escreva a regra de quadribol..." />
                    </label>
                  </div>
                </section>
              )}

              <section className="platform-settings__section">
                <div className="platform-settings__section-title">
                  <UserPlus size={16} />
                  <div><strong>Players da sessão</strong><span>Adicione quem poderá entrar nesta plataforma.</span></div>
                </div>
                <form className="platform-settings__add-player" onSubmit={addPlayer}>
                  <input value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} placeholder="Nome ou e-mail do player" />
                  <button type="submit"><UserPlus size={15} /> Adicionar</button>
                </form>
                {players.length > 0 && (
                  <div className="platform-settings__players">
                    {players.map((player) => <span key={player}>{player}</span>)}
                  </div>
                )}
                <p className="platform-settings__hint">Quando um player entrar, a ação será exibida no histórico da sessão.</p>
              </section>
            </div>

            <div className="platform-modal__footer platform-settings__footer">
              <button type="button" className="platform-modal__primary" onClick={() => setIsSettingsOpen(false)}>Salvar configurações</button>
            </div>
          </div>
        </div>
      )}

      {rolledDie && (
        <div className="platform-modal" role="presentation" onMouseDown={() => setRolledDie(null)}>
          <div
            className="platform-modal__panel platform-modal__panel--dice"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dice-result-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="platform-modal__close" type="button" onClick={() => setRolledDie(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <Dices size={25} aria-hidden="true" />
            <span className="platform-modal__eyebrow">Resultado do d{rolledDie.sides}</span>
            <strong id="dice-result-title">{rolledDie.result}</strong>
            <button type="button" className="platform-modal__primary" onClick={() => rollDie(rolledDie.sides)}>
              Rolar novamente
            </button>
          </div>
        </div>
      )}

      {isImageFormOpen && (
        <div className="platform-modal" role="presentation" onMouseDown={() => setIsImageFormOpen(false)}>
          <form
            className="platform-modal__panel platform-modal__panel--form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-form-title"
            onSubmit={handleImageSubmit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="platform-modal__close" type="button" onClick={() => setIsImageFormOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="platform-modal__heading">
              <ImagePlus size={20} aria-hidden="true" />
              <div>
                <h2 id="image-form-title">Disparar imagem</h2>
                <p>Cole o link da imagem que será exibida durante a narração.</p>
              </div>
            </div>
            <label className="platform-modal__field">
              <span>Link da imagem</span>
              <input
                type="url"
                value={imageUrlInput}
                onChange={(event) => {
                  setImageUrlInput(event.target.value);
                  setImageError("");
                }}
                placeholder="https://exemplo.com/imagem.jpg"
                autoFocus
              />
            </label>
            {imageError && <p className="platform-modal__error">{imageError}</p>}
            <div className="platform-modal__footer">
              <button type="button" className="platform-modal__secondary" onClick={() => setIsImageFormOpen(false)}>Cancelar</button>
              <button type="submit" className="platform-modal__primary">Disparar</button>
            </div>
          </form>
        </div>
      )}

      {previewImage && (
        <div className="platform-modal platform-modal--image" role="presentation" onMouseDown={() => setPreviewImage("")}>
          <div
            className="platform-modal__image-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Imagem da narração"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="platform-modal__close platform-modal__close--image" type="button" onClick={() => setPreviewImage("")} aria-label="Fechar">
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Imagem disparada durante a narração em tamanho ampliado"
              onError={() => {
                setPreviewImage("");
                setImageError("Não foi possível carregar essa imagem.");
                setIsImageFormOpen(true);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
