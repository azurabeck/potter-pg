// src/pages/relacoes/components/modal-shell/index.tsx
// Overlay/painel genérico reaproveitado pelos 3 modais desta página
// (form/bulk-json/copy) — cada um só entrega o próprio conteúdo.
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import "./style.scss";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ModalShell({ title, onClose, children }: ModalShellProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="relacoes-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="relacoes-modal__panel"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relacoes-modal__header">
          <h2>{title}</h2>
          <button type="button" className="relacoes-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="relacoes-modal__body">{children}</div>
      </div>
    </div>
  );
}
