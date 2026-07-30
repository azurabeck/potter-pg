// src/pages/locais/components/location-detail/index.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Location } from "@/utils/types";
import "./style.scss";

interface LocationDetailProps {
  location: Location | null;
}

function InfoLine({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <p className="location-detail__info-line">
      <span>{label}:</span> {value}
    </p>
  );
}

export default function LocationDetail({ location }: LocationDetailProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  useEffect(() => {
    setIsImageOpen(false);
  }, [location?.id]);

  useEffect(() => {
    if (!isImageOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsImageOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isImageOpen]);

  if (!location) {
    return (
      <aside className="location-detail location-detail--empty">
        <p>Selecione um local.</p>
      </aside>
    );
  }

  return (
    <aside className="location-detail">
      <div className="location-detail__image-wrap">
        {location.image_url ? (
          <button
            type="button"
            className="location-detail__image-button"
            onClick={() => setIsImageOpen(true)}
            aria-label="Ver imagem em tela cheia"
          >
            <img src={location.image_url} alt={location.name || "Local"} className="location-detail__image" />
          </button>
        ) : (
          <div className="location-detail__no-image">Sem imagem</div>
        )}
      </div>

      {isImageOpen && location.image_url && (
        <div className="location-detail__lightbox" role="presentation" onMouseDown={() => setIsImageOpen(false)}>
          <div
            className="location-detail__lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-label={location.name || "Imagem do local"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="location-detail__lightbox-close"
              onClick={() => setIsImageOpen(false)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <img src={location.image_url} alt={location.name || "Local"} />
          </div>
        </div>
      )}

      <div className="location-detail__content">
        <h3 className="location-detail__name">{location.name || "Local sem nome"}</h3>
        <span className="location-detail__type">{location.type || "-"}</span>

        <div className="location-detail__text-block">
          <InfoLine label="Características" value={location.characteristics} />
          <InfoLine label="Importância" value={location.importance} />
        </div>
      </div>
    </aside>
  );
}
