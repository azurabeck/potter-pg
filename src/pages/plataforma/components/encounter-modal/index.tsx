import type { FormEvent } from "react";
import { Footprints, X } from "lucide-react";
import "./style.scss";

interface EncounterModalProps {
  isOpen: boolean;
  targetName: string;
  locationValue: string;
  error: string;
  submitting: boolean;
  onLocationChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** Formulário "onde você quer encontrar {personagem}", controlado pelo pai (`pages/plataforma/index.tsx`). */
export default function EncounterModal({
  isOpen,
  targetName,
  locationValue,
  error,
  submitting,
  onLocationChange,
  onSubmit,
  onClose,
}: EncounterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="platform-modal" role="presentation" onMouseDown={onClose}>
      <form
        className="platform-modal__panel platform-modal__panel--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-form-title"
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="platform-modal__close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className="platform-modal__heading">
          <Footprints size={20} aria-hidden="true" />
          <div>
            <h2 id="encounter-form-title">Encontrar {targetName}</h2>
            <p>Onde você quer encontrar {targetName}? A IA narra o encontro pros dois assim que aceitar.</p>
          </div>
        </div>
        <label className="platform-modal__field">
          <span>Local do encontro</span>
          <input
            value={locationValue}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Ex: Salão Principal"
            autoFocus
            disabled={submitting}
          />
        </label>
        {error && <p className="platform-modal__error">{error}</p>}
        <div className="platform-modal__footer">
          <button type="button" className="platform-modal__secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="platform-modal__primary" disabled={submitting || !locationValue.trim()}>
            {submitting ? "Enviando..." : "Pedir encontro"}
          </button>
        </div>
      </form>
    </div>
  );
}
