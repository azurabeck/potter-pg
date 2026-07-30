// src/pages/inventario/components/item-detail-modal/index.tsx
import { useEffect } from "react";
import { Package, X } from "lucide-react";
import type { CharacterItem } from "@/utils/types";
import "./style.scss";

interface ItemDetailModalProps {
  item: CharacterItem;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="item-detail-modal" onClick={onClose}>
      <div className="item-detail-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="item-detail-modal__close" aria-label="Fechar" onClick={onClose}>
          <X size={18} />
        </button>

        <header className="item-detail-modal__header">
          <span className="item-detail-modal__icon">
            <Package size={20} strokeWidth={1.6} />
          </span>
          <h2>{item.nome || "Item sem nome"}</h2>
        </header>

        <dl className="item-detail-modal__fields">
          <div>
            <dt>Categoria</dt>
            <dd>{item.categoria || "-"}</dd>
          </div>
          <div>
            <dt>Quantidade</dt>
            <dd>{item.quantidade || 1}</dd>
          </div>
          <div>
            <dt>Atributo</dt>
            <dd>{item.atributo || "-"}</dd>
          </div>
          <div>
            <dt>Valor do atributo</dt>
            <dd>{item.valor_atributo || "-"}</dd>
          </div>
          <div>
            <dt>Onde encontrou</dt>
            <dd>{item.onde_encontrou || "-"}</dd>
          </div>
          <div className="item-detail-modal__field--wide">
            <dt>Detalhes</dt>
            <dd>{item.detalhes || item.descricao || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
