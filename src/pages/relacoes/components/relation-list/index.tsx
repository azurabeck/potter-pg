// src/pages/relacoes/components/relation-list/index.tsx
import { Pencil, Trash2 } from "lucide-react";
import type { Npc } from "@/utils/types";
import { cx } from "@/utils";
import "./style.scss";

interface RelationListProps {
  relations: Npc[];
  selectedId: string;
  onSelect: (npc: Npc) => void;
  onEdit: (npc: Npc) => void;
  onDelete: (npc: Npc) => void;
}

export default function RelationList({ relations, selectedId, onSelect, onEdit, onDelete }: RelationListProps) {
  if (relations.length === 0) {
    return <p className="relation-list__empty">Nenhuma relação encontrada.</p>;
  }

  return (
    <ul className="relation-list">
      {relations.map((npc) => {
        const isSelected = npc.id === selectedId;

        return (
          <li key={npc.id} className={cx("relation-list__item", isSelected && "relation-list__item--selected")}>
            <button type="button" className="relation-list__name" onClick={() => onSelect(npc)}>
              {npc.name || "NPC sem nome"}
            </button>
            <button type="button" className="relation-list__icon" onClick={() => onEdit(npc)} title="Editar NPC">
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="relation-list__icon relation-list__icon--danger"
              onClick={() => onDelete(npc)}
              title="Excluir NPC"
            >
              <Trash2 size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
