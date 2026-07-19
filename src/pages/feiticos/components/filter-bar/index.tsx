import { useState } from "react";
import { Filter, Search } from "lucide-react";
import type { Spell } from "@/utils/types";
import { buildFilterOptions, type SpellFilters } from "./functions";
import "./style.scss";

interface FilterBarProps {
  spells: Spell[];
  filters: SpellFilters;
  onChange: (filters: SpellFilters) => void;
}

const DROPDOWNS: { key: keyof SpellFilters; label: string }[] = [
  { key: "ano", label: "Ano" },
  { key: "nivel", label: "Nível" },
  { key: "atributo", label: "Atributo" },
  { key: "categoria", label: "Categoria" },
  { key: "status", label: "Status" },
];

export default function FilterBar({ spells, filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const options = buildFilterOptions(spells);
  const optionsFor = (key: keyof SpellFilters): string[] => {
    if (key === "status") return ["desbloqueado", "bloqueado"];
    return (options as Record<string, string[]>)[key] ?? [];
  };

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
          {DROPDOWNS.map(({ key, label }) => (
            <select key={key} value={filters[key]} onChange={(e) => onChange({ ...filters, [key]: e.target.value })}>
              <option value="">{label}</option>
              {optionsFor(key).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
