// src/pages/adversarios/components/filter-bar/index.tsx
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { buildFilterOptions, type AdversaryFilters, type AdversaryItem } from "../../functions";
import "./style.scss";

interface FilterBarProps {
  items: AdversaryItem[];
  filters: AdversaryFilters;
  onChange: (filters: AdversaryFilters) => void;
}

export default function FilterBar({ items, filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const options = buildFilterOptions(items);

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
          <select
            value={filters.origem}
            onChange={(e) => onChange({ ...filters, origem: e.target.value as AdversaryFilters["origem"] })}
          >
            <option value="">Origem</option>
            <option value="enemy">Adversário</option>
            <option value="npc">NPC</option>
          </select>
          <select value={filters.dificuldade} onChange={(e) => onChange({ ...filters, dificuldade: e.target.value })}>
            <option value="">Dificuldade</option>
            {options.dificuldades.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
