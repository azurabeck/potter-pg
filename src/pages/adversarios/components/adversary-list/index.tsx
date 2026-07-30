// src/pages/adversarios/components/adversary-list/index.tsx
import { Ghost, Skull } from "lucide-react";
import { adversaryName, type AdversaryItem } from "../../functions";
import { cx } from "@/utils";
import "./style.scss";

interface AdversaryListProps {
  items: AdversaryItem[];
  selectedId: string;
  onSelect: (item: AdversaryItem) => void;
}

export default function AdversaryList({ items, selectedId, onSelect }: AdversaryListProps) {
  if (items.length === 0) {
    return <p className="adversary-list__empty">Nenhum adversário conhecido ainda.</p>;
  }

  return (
    <ul className="adversary-list">
      {items.map((item) => {
        const isSelected = item.data.id === selectedId;
        const Icon = item.tipo === "enemy" ? Skull : Ghost;

        return (
          <li key={`${item.tipo}-${item.data.id}`}>
            <button
              type="button"
              className={cx("adversary-list__item", isSelected && "adversary-list__item--selected")}
              onClick={() => onSelect(item)}
            >
              <Icon size={14} className="adversary-list__icon" aria-hidden="true" />
              <span className="adversary-list__name">{adversaryName(item)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
