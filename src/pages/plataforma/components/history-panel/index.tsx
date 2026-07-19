import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import type { HistoryItem } from "../../functions";
import "./style.scss";

interface HistoryPanelProps {
  items: HistoryItem[];
  onPreview: (url: string) => void;
}

/** Lista de ações da sessão (rolagens de dado, imagens, entradas de player). */
export default function HistoryPanel({ items, onPreview }: HistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [items]);

  return (
    <aside className="platform-page__history" aria-label="Histórico de imagens e rolagens">
      <div className="platform-page__history-header">
        <strong>Histórico</strong>
        <span>imagens e rolagens</span>
      </div>

      <div className="platform-page__history-list" ref={scrollRef}>
        {items.length === 0 ? (
          <p className="platform-page__history-empty">As ações da sessão aparecerão aqui.</p>
        ) : (
          items.map((item) => (
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
                <button type="button" onClick={() => onPreview(item.imageUrl)}>
                  <img src={item.imageUrl} alt="Imagem disparada no histórico" />
                  <span>
                    <ExternalLink size={12} /> ampliar
                  </span>
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
