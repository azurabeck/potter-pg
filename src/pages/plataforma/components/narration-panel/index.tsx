import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { NarrationMessage } from "../../functions";
import "./style.scss";

interface NarrationPanelProps {
  messages: NarrationMessage[];
}

/**
 * Feed de narração. Autônomo pro auto-scroll: observa o próprio container
 * via MutationObserver (não depende de `messages` como dependência de
 * efeito) e rola pro fim sempre que o conteúdo muda.
 */
export default function NarrationPanel({ messages }: NarrationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
            <p>A narração é exibida aqui, seja controlada pela IA ou por um narrador humano.</p>
          </div>
        ) : (
          <div className="platform-page__narration-feed">
            {messages.map((message) => (
              <article key={message.id} className="platform-narration-message">
                <strong>{message.user}</strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
