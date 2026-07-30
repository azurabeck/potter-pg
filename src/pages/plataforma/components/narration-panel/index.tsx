import { useEffect, useRef } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import type { NarrationMessage } from "../../functions";
import "./style.scss";

interface NarrationPanelProps {
  messages: NarrationMessage[];
  onRegenerateLast?: () => void;
  regenerating?: boolean;
}

/**
 * Feed de narração. Autônomo pro auto-scroll: observa o próprio container
 * via MutationObserver (não depende de `messages` como dependência de
 * efeito) e rola pro fim sempre que o conteúdo muda.
 */
export default function NarrationPanel({ messages, onRegenerateLast, regenerating }: NarrationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = Boolean(onRegenerateLast) && lastMessage?.user === "Narrador";

  useEffect(() => {
    const container = scrollRef.current;
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

  return (
    <div className="platform-page__narration" ref={scrollRef}>
      <div className="platform-page__narration-content">
        {messages.length === 0 ? (
          <div className="platform-page__empty-state">
            <Sparkles size={22} aria-hidden="true" />
            <p>
              Aperte <strong>Iniciar</strong> no topo da página pra começar a sessão.
            </p>
          </div>
        ) : (
          <div className="platform-page__narration-feed">
            {messages.map((message) => (
              <article key={message.id} className="platform-narration-message">
                <strong>{message.user}</strong>
                <p>{message.text}</p>
              </article>
            ))}
            {canRegenerate && (
              <button
                type="button"
                className="platform-page__regenerate-button"
                onClick={onRegenerateLast}
                disabled={regenerating}
                aria-label="Refazer a última resposta do narrador"
                title="Refazer a última resposta do narrador"
              >
                <RefreshCw size={13} className={regenerating ? "platform-page__spinner" : undefined} />
                Refazer última resposta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
