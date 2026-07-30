import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { sortingNarrate } from "@/actions/ai/sorting-narrate";
import type { NarrateMessage } from "@/actions/ai/narrate";
import {
  extractSuggestedHouse,
  HOUSE_FLAGS,
  SORTING_STORY_MAX_TURNS,
  SORTING_STORY_SYSTEM_PROMPT,
} from "../../functions";

interface SortingStoryProps {
  playerName: string;
  onAccept: (casa: string) => void;
  onCancel: () => void;
}

interface StoryMessage {
  id: string;
  role: "narrator" | "player";
  text: string;
}

/**
 * Conduz a história do teste de seleção: a IA narra uma cena no Beco
 * Diagonal (`sortingNarrate`, streaming) e o jogador reage com texto
 * livre a cada turno — sem opções fixas. Quando a resposta da IA traz a
 * linha "CASA_SUGERIDA: ..." (`extractSuggestedHouse`), a história acaba
 * e mostra o resultado com aceitar/escolher outra. `turnCount` só serve
 * pra saber quando anexar um pedido explícito de encerramento
 * (SORTING_STORY_MAX_TURNS) — o ritmo real da história é conduzido pela
 * própria IA seguindo o prompt.
 */
export default function SortingStory({ playerName, onAccept, onCancel }: SortingStoryProps) {
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const container = feedRef.current;
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
    if (started.current) return;
    started.current = true;
    void runTurn([{ role: "user", content: `Inicie a história agora. O nome do futuro aluno é ${playerName}.` }]);
    // Só dispara uma vez, ao montar — abrir a história de novo é
    // responsabilidade do componente pai (remonta um SortingStory novo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(apiMessages: NarrateMessage[]) {
    setLoading(true);
    setError(null);

    const messageId = crypto.randomUUID();
    let fullText = "";
    let hasReceivedText = false;

    try {
      await sortingNarrate({ systemPrompt: SORTING_STORY_SYSTEM_PROMPT, messages: apiMessages }, (chunk) => {
        fullText += chunk;
        if (!hasReceivedText) {
          hasReceivedText = true;
          setMessages((current) => [...current, { id: messageId, role: "narrator", text: chunk }]);
        } else {
          setMessages((current) =>
            current.map((message) => (message.id === messageId ? { ...message, text: message.text + chunk } : message))
          );
        }
      });

      const { cleanText, casa } = extractSuggestedHouse(fullText);
      if (casa) {
        setMessages((current) =>
          current.map((message) => (message.id === messageId ? { ...message, text: cleanText } : message))
        );
        setSuggested(casa);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || suggested) return;
    const text = inputText.trim();
    if (!text) return;

    const playerMessage: StoryMessage = { id: crypto.randomUUID(), role: "player", text };
    const historySoFar = [...messages, playerMessage];
    const nextTurnCount = turnCount + 1;

    setMessages(historySoFar);
    setTurnCount(nextTurnCount);
    setInputText("");

    const apiMessages: NarrateMessage[] = historySoFar.map((message) => ({
      role: message.role === "narrator" ? "assistant" : "user",
      content: message.text,
    }));
    if (nextTurnCount >= SORTING_STORY_MAX_TURNS) {
      apiMessages.push({
        role: "user",
        content: "Encerre a história agora com o desfecho e diga a casa sugerida, seguindo o formato indicado.",
      });
    }

    void runTurn(apiMessages);
  }

  return (
    <div className="wizard-step wizard-step--sorting-story">
      <button type="button" className="wizard-step__text-button wizard-step__story-cancel" onClick={onCancel}>
        Cancelar e escolher direto
      </button>

      <div className="wizard-step__story-feed" ref={feedRef}>
        {messages.map((message) => (
          <p key={message.id} className={`wizard-step__story-message wizard-step__story-message--${message.role}`}>
            {message.text}
          </p>
        ))}
        {loading && (
          <p className="wizard-step__story-message wizard-step__story-message--narrator wizard-step__story-message--loading">
            <Loader2 size={13} className="character-wizard-page__spinner" />
          </p>
        )}
      </div>

      {error && <p className="character-wizard-page__error">{error}</p>}

      {suggested ? (
        <div className="wizard-step__house-result">
          <img src={HOUSE_FLAGS[suggested]} alt={suggested} />
          <strong>{suggested}</strong>
          <div className="wizard-step__house-menu">
            <button type="button" className="wizard-step__primary-choice" onClick={() => onAccept(suggested)}>
              Aceitar {suggested}
            </button>
            <button type="button" className="wizard-step__secondary-choice" onClick={onCancel}>
              Escolher outra casa
            </button>
          </div>
        </div>
      ) : (
        <form className="wizard-step__story-form" onSubmit={submitAction}>
          <input
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={loading ? "O narrador está escrevendo..." : "O que você faz?"}
            aria-label="Sua ação"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !inputText.trim()}>
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
