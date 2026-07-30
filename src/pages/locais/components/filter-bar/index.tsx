// src/pages/locais/components/filter-bar/index.tsx
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { TYPE_OPTIONS, type LocationFilters } from "../../functions";
import "./style.scss";

interface FilterBarProps {
  filters: LocationFilters;
  onChange: (filters: LocationFilters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="filter-bar">
      <label className="filter-bar__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="search here"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </label>
      <button type="button" className="filter-bar__toggle" onClick={() => setOpen((v) => !v)} aria-label="Abrir filtros">
        <Filter size={15} />
      </button>
      {open && (
        <div className="filter-bar__options">
          <select value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
            <option value="">Tipo</option>
            {TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
