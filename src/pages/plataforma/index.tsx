import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, PanelTop, Play, Send, Settings, Square } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { getAiPrompts, getAiProviderConfig } from "@/actions/get/settings";
import { getNarrationSession } from "@/actions/get/narration-session";
import { clearNarrationSession, saveNarrationSession } from "@/actions/sets/narration-session";
import { narrate, type NarrateMessage } from "@/actions/ai/narrate";
import { buildCampaignContext } from "@/actions/ai/context";
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
  const { user } = useAuth();
  const { activeCharacter } = useCharacter();
  const playerName = activeCharacter?.name?.trim() || "Tomas Black";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [narrating, setNarrating] = useState(false);
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

  // Retoma a sessão salva do personagem ativo (fica no Firestore por
  // personagem, não por navegador — funciona ao trocar de aparelho).
  useEffect(() => {
    if (!activeCharacter) return;

    let cancelled = false;
    getNarrationSession(activeCharacter.id)
      .then((messages) => {
        if (!cancelled && messages.length > 0) setNarrationMessages(messages);
      })
      .catch((error) => {
        console.error("Erro ao retomar a sessão salva:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCharacter?.id]);

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

  const sessionActive = narrationMessages.length > 0;

  function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (narrating || !sessionActive) return;
    const text = responseText.trim();
    if (!text) return;

    const playerMessage: NarrationMessage = { id: crypto.randomUUID(), user: playerName, text };
    setNarrationMessages((current) => [...current, playerMessage]);
    setResponseText("");

    continueNarration([...narrationMessages, playerMessage]);
  }

  function playSession() {
    if (narrating || sessionActive) return;
    startSession();
  }

  function stopSession() {
    if (narrating || !sessionActive) return;
    setNarrationMessages([]);
    if (activeCharacter) {
      clearNarrationSession(activeCharacter.id).catch((error) => {
        console.error("Erro ao encerrar a sessão:", error);
      });
    }
  }

  function addNarratorMessage(text: string) {
    setNarrationMessages((current) => [...current, { id: crypto.randomUUID(), user: "Narrador", text }]);
  }

  // Busca o prompt/token de IA e chama narrate() — usado tanto pra abrir a
  // sessão quanto pra continuar a narração a cada mensagem do jogador.
  // `historySoFar` é o feed visível *antes* dessa resposta (sem a fala do
  // Narrador que vai ser gerada agora) — serve só pra montar o que vai ser
  // salvo em `narration_sessions` quando a IA terminar; `apiMessages` é o
  // que de fato vai pro provedor de IA.
  async function callAi(historySoFar: NarrationMessage[], apiMessages: NarrateMessage[]) {
    if (!user) return;

    setNarrating(true);
    try {
      const [prompts, providerConfig] = await Promise.all([
        getAiPrompts(user.uid),
        getAiProviderConfig(user.uid),
      ]);

      if (!providerConfig.apiKey) {
        addNarratorMessage(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra narrar."
        );
        setIsSettingsOpen(true);
        return;
      }

      const campaignContext = activeCharacter ? await buildCampaignContext(activeCharacter) : "";
      const systemPrompt = [
        prompts.narration || "Você é o narrador de uma sessão de RPG ambientada no universo de Harry Potter.",
        campaignContext,
      ]
        .filter(Boolean)
        .join("\n\n");

      const narratorMessageId = crypto.randomUUID();
      let hasReceivedText = false;
      let fullText = "";

      await narrate({ systemPrompt, messages: apiMessages }, (chunk) => {
        fullText += chunk;
        if (!hasReceivedText) {
          hasReceivedText = true;
          setNarrationMessages((current) => [
            ...current,
            { id: narratorMessageId, user: "Narrador", text: chunk },
          ]);
        } else {
          setNarrationMessages((current) =>
            current.map((message) =>
              message.id === narratorMessageId ? { ...message, text: message.text + chunk } : message
            )
          );
        }
      });

      if (!hasReceivedText) {
        addNarratorMessage("A IA respondeu vazio.");
      } else if (activeCharacter) {
        // Pausa o jogo: salva o feed no Firestore assim que a IA termina de
        // responder, pra dar pra retomar a sessão de qualquer aparelho.
        const narratorMessage: NarrationMessage = { id: narratorMessageId, user: "Narrador", text: fullText };
        saveNarrationSession(activeCharacter.id, [...historySoFar, narratorMessage]).catch((error) => {
          console.error("Erro ao salvar a sessão:", error);
        });
      }
    } catch (error) {
      addNarratorMessage(`A IA não conseguiu responder: ${(error as Error).message}`);
    } finally {
      setNarrating(false);
    }
  }

  function startSession() {
    return callAi([], [
      { role: "user", content: `Inicie a sessão para ${playerName} com uma cena de abertura envolvente.` },
    ]);
  }

  // Manda o histórico inteiro da conversa a cada rodada, mapeando "Narrador"
  // pro papel assistant e todo o resto pro papel user — em sessões muito
  // longas isso cresce o custo/tamanho da chamada; não há corte por enquanto.
  function continueNarration(messagesSoFar: NarrationMessage[]) {
    return callAi(
      messagesSoFar,
      messagesSoFar.map((message) => ({
        role: message.user === "Narrador" ? "assistant" : "user",
        content: message.text,
      }))
    );
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
        <div className="platform-page__header-actions">
          {sessionActive ? (
            <button
              type="button"
              className="platform-page__session-button platform-page__session-button--stop"
              aria-label="Encerrar sessão"
              title="Encerrar sessão"
              onClick={stopSession}
              disabled={narrating}
            >
              <Square size={16} /> Encerrar
            </button>
          ) : (
            <button
              type="button"
              className="platform-page__session-button platform-page__session-button--play"
              aria-label="Iniciar sessão"
              title="Iniciar sessão"
              onClick={playSession}
              disabled={narrating}
            >
              <Play size={16} /> Iniciar
            </button>
          )}
          <button
            type="button"
            className="platform-page__settings-button"
            aria-label="Abrir configurações da plataforma"
            title="Configurações"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={19} />
          </button>
        </div>
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
              placeholder={
                !sessionActive
                  ? "Aperte iniciar pra começar a sessão..."
                  : narrating
                    ? "O narrador está escrevendo..."
                    : "Escreva sua ação ou narração..."
              }
              aria-label="Mensagem da rodada"
              disabled={narrating || !sessionActive}
            />
            <button
              type="submit"
              disabled={!responseText.trim() || narrating || !sessionActive}
              aria-label="Enviar mensagem"
            >
              {narrating ? <Loader2 size={16} className="platform-page__spinner" /> : <Send size={16} />}
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
        onRequireSetup={() => setIsSettingsOpen(true)}
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
