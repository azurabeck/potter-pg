// src/pages/locais/components/location-list/index.tsx
import { MapPin } from "lucide-react";
import type { Location } from "@/utils/types";
import { cx } from "@/utils";
import "./style.scss";

interface LocationListProps {
  locations: Location[];
  selectedId: string;
  onSelect: (location: Location) => void;
}

export default function LocationList({ locations, selectedId, onSelect }: LocationListProps) {
  if (locations.length === 0) {
    return <p className="location-list__empty">Nenhum local conhecido ainda.</p>;
  }

  return (
    <ul className="location-list">
      {locations.map((location) => {
        const isSelected = location.id === selectedId;

        return (
          <li key={location.id}>
            <button
              type="button"
              className={cx("location-list__item", isSelected && "location-list__item--selected")}
              onClick={() => onSelect(location)}
            >
              <MapPin size={14} className="location-list__icon" aria-hidden="true" />
              <span className="location-list__name">{location.name || "Local sem nome"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
