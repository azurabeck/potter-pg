// src/pages/feiticos/components/filter-bar/index.tsx
import { Search } from "lucide-react";
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
  const options = buildFilterOptions(spells);

  const optionsFor = (key: keyof SpellFilters): string[] => {
    if (key === "status") return ["desbloqueado", "bloqueado"];
    return (options as Record<string, string[]>)[key] ?? [];
  };

  return (
    <div className="filter-bar">
      <label className="filter-bar__search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar feitiço..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </label>

      {DROPDOWNS.map(({ key, label }) => (
        <select
          key={key}
          className="filter-bar__select"
          value={filters[key]}
          onChange={(e) => onChange({ ...filters, [key]: e.target.value })}
        >
          <option value="">{label.toUpperCase()}</option>
          {optionsFor(key).map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
