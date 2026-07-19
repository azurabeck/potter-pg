import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, PanelTop, Send, Settings } from "lucide-react";
import { useCharacter } from "@/context/character";
import ScoreboardPanel from "./components/scoreboard";
import TurnOrder from "./components/turn-order";
import NarrationPanel from "./components/narration-panel";
import HistoryPanel from "./components/history-panel";
import DiceRoller from "./components/dice-roller";
import SettingsModal from "./components/settings-modal";
import ImageShareModal from "./components/image-share-modal";
import ImagePreviewModal from "./components/image-preview-modal";
import { randomDieResult } from "./functions";
import type { Die, HistoryItem, NarrationMessage, RolledDie } from "./functions";
import "./style.scss";

export default function Plataforma() {
  const { activeCharacter } = useCharacter();
  const playerName = activeCharacter?.name?.trim() || "Tomas Black";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rolledDie, setRolledDie] = useState<RolledDie | null>(null);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [responseText, setResponseText] = useState("");
  const [narrationMessages, setNarrationMessages] = useState<NarrationMessage[]>([]);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isScoreboardPinned, setIsScoreboardPinned] = useState(false);
  const [scoreboardPosition, setScoreboardPosition] = useState({ x: 0, y: 0 });
  const scoreboardDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

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
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
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
          <NarrationPanel messages={narrationMessages} />
          <HistoryPanel items={history} onPreview={setPreviewImage} />
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

        <DiceRoller rolledDie={rolledDie} onRoll={rollDie} onCloseResult={() => setRolledDie(null)} />

        <TurnOrder />
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onAddPlayer={(item) => setHistory((current) => [...current, item])}
      />

      <ImageShareModal
        isOpen={isImageFormOpen}
        urlValue={imageUrlInput}
        error={imageError}
        onUrlChange={(value) => {
          setImageUrlInput(value);
          setImageError("");
        }}
        onSubmit={handleImageSubmit}
        onClose={() => setIsImageFormOpen(false)}
      />

      <ImagePreviewModal
        src={previewImage}
        onClose={() => setPreviewImage("")}
        onError={() => {
          setPreviewImage("");
          setImageError("Não foi possível carregar essa imagem.");
          setIsImageFormOpen(true);
        }}
      />
    </section>
  );
}
