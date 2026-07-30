import { Loader2, X } from "lucide-react";

interface GeneratedImageModalProps {
  imageUrl: string | null;
  generating: boolean;
  error: string | null;
  onClose: () => void;
}

/** Aberto pelo botão "Gerar imagem do personagem" — mostra o carregamento e, depois, o resultado. */
export default function GeneratedImageModal({ imageUrl, generating, error, onClose }: GeneratedImageModalProps) {
  return (
    <div className="wizard-image-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="wizard-image-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Imagem gerada do personagem"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="wizard-image-modal__close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        {generating ? (
          <div className="wizard-image-modal__status">
            <Loader2 size={28} className="character-wizard-page__spinner" />
            <p>Gerando a imagem do personagem...</p>
          </div>
        ) : error ? (
          <div className="wizard-image-modal__status">
            <p className="character-wizard-page__error">{error}</p>
          </div>
        ) : imageUrl ? (
          <>
            <img className="wizard-image-modal__image" src={imageUrl} alt="Retrato gerado do personagem" />
            <button type="button" className="wizard-step__primary-choice" onClick={onClose}>
              Usar essa imagem
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
