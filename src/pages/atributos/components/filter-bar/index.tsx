import { useState } from "react";
import { Filter, Search } from "lucide-react";
import type { RowFilters, RowType } from "../../functions";
import "./style.scss";

interface FilterBarProps {
  filters: RowFilters;
  onChange: (filters: RowFilters) => void;
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
          <select
            value={filters.type}
            onChange={(e) => onChange({ ...filters, type: e.target.value as RowType | "" })}
          >
            <option value="">Tipo</option>
            <option value="atributo">Atributos</option>
            <option value="talento">Talentos</option>
            <option value="titulo">Títulos</option>
          </select>
          <select
            value={filters.orderBy}
            onChange={(e) => onChange({ ...filters, orderBy: e.target.value as RowFilters["orderBy"] })}
          >
            <option value="default">Ordenar</option>
            <option value="name">Nome</option>
            <option value="level">Nível</option>
          </select>
        </div>
      )}
    </div>
  );
}
