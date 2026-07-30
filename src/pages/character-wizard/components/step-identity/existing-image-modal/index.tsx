import { useRef, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";

interface ExistingImageModalProps {
  urlInput: string;
  urlError: string | null;
  uploading: boolean;
  uploadError: string | null;
  onUrlChange: (value: string) => void;
  onUrlSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFileSelected: (file: File) => void;
  onClose: () => void;
}

/** Aberto pelo botão "Usar imagem existente" — upload de arquivo ou link, alternativas ao gerar por IA. */
export default function ExistingImageModal({
  urlInput,
  urlError,
  uploading,
  uploadError,
  onUrlChange,
  onUrlSubmit,
  onFileSelected,
  onClose,
}: ExistingImageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = "";
  }

  return (
    <div className="wizard-image-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="wizard-image-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Usar imagem existente"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="wizard-image-modal__close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <h2 className="wizard-image-modal__title">Usar imagem existente</h2>

        <div className="wizard-image-modal__section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            hidden
          />
          <button
            type="button"
            className="wizard-step__secondary-choice"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="character-wizard-page__spinner" /> : <Upload size={14} />}
            {uploading ? "Enviando..." : "Enviar arquivo"}
          </button>
          {uploadError && <p className="character-wizard-page__error">{uploadError}</p>}
        </div>

        <span className="wizard-image-modal__divider">ou</span>

        <form className="wizard-step__image-url-form" onSubmit={onUrlSubmit}>
          <input
            value={urlInput}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="cole o link de uma imagem"
            autoFocus
          />
          <button type="submit" className="wizard-step__secondary-choice" disabled={!urlInput.trim()}>
            Usar
          </button>
        </form>
        {urlError && <p className="character-wizard-page__error">{urlError}</p>}
      </div>
    </div>
  );
}
