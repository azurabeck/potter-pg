// src/pages/personagens/components/pet-modal/index.tsx
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import "./style.scss";

interface PetModalProps {
  currentUrl: string;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
}

/** Modal simples pra colar/trocar o link do `pet_url` do personagem ativo — aberto ao clicar na imagem do animal na ficha. */
export default function PetModal({ currentUrl, onClose, onSave }: PetModalProps) {
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      onClose();
    } catch {
      setError("Não foi possível salvar a imagem agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pet-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="pet-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Imagem do bichinho"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="pet-modal__close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <h3>Imagem do bichinho</h3>

        <div className="pet-modal__preview-wrap">
          {url.trim() ? (
            <img className="pet-modal__preview" src={url} alt="Prévia" />
          ) : (
            <div className="pet-modal__no-preview">Sem imagem</div>
          )}
        </div>

        <form className="pet-modal__form" onSubmit={handleSave}>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Cole o link da imagem"
            autoFocus
          />
          {error && <p className="pet-modal__error">{error}</p>}
          <div className="pet-modal__actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
