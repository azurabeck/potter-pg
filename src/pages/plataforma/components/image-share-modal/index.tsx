import type { FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import "./style.scss";

interface ImageShareModalProps {
  isOpen: boolean;
  urlValue: string;
  error: string;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** Formulário "cole o link da imagem", controlado pelo pai (`pages/plataforma/index.tsx`). */
export default function ImageShareModal({
  isOpen,
  urlValue,
  error,
  onUrlChange,
  onSubmit,
  onClose,
}: ImageShareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="platform-modal" role="presentation" onMouseDown={onClose}>
      <form
        className="platform-modal__panel platform-modal__panel--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-form-title"
        onSubmit={onSubmit}
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
            value={urlValue}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            autoFocus
          />
        </label>
        {error && <p className="platform-modal__error">{error}</p>}
        <div className="platform-modal__footer">
          <button type="button" className="platform-modal__secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="platform-modal__primary">
            Disparar
          </button>
        </div>
      </form>
    </div>
  );
}
