import { X } from "lucide-react";
import "./style.scss";

interface ImagePreviewModalProps {
  src: string;
  onClose: () => void;
  onError: () => void;
}

/**
 * Visualização em tela cheia de uma imagem — aberta tanto pelo
 * `ImageShareModal` (depois de disparar uma imagem) quanto pelo
 * `HistoryPanel` (ao clicar numa miniatura do histórico).
 */
export default function ImagePreviewModal({ src, onClose, onError }: ImagePreviewModalProps) {
  if (!src) return null;

  return (
    <div className="platform-modal platform-modal--image" role="presentation" onMouseDown={onClose}>
      <div
        className="platform-modal__image-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Imagem da narração"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="platform-modal__close platform-modal__close--image"
          type="button"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <img
          src={src}
          alt="Imagem disparada durante a narração em tamanho ampliado"
          onError={onError}
        />
      </div>
    </div>
  );
}
