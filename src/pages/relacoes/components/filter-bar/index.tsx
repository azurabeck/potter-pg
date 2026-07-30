// src/pages/relacoes/components/filter-bar/index.tsx
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import type { Npc } from "@/utils/types";
import { RELACAO_OPTIONS, TIPO_OPTIONS, buildFilterOptions, type RelationFilters } from "../../functions";
import "./style.scss";

interface FilterBarProps {
  npcs: Npc[];
  filters: RelationFilters;
  onChange: (filters: RelationFilters) => void;
}

export default function FilterBar({ npcs, filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const options = buildFilterOptions(npcs);

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
          <select value={filters.tipo} onChange={(e) => onChange({ ...filters, tipo: e.target.value })}>
            <option value="">Tipo</option>
            {TIPO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filters.relacao} onChange={(e) => onChange({ ...filters, relacao: e.target.value })}>
            <option value="">Relação</option>
            {RELACAO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filters.ano} onChange={(e) => onChange({ ...filters, ano: e.target.value })}>
            <option value="">Ano</option>
            {options.ano.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filters.campaignYear} onChange={(e) => onChange({ ...filters, campaignYear: e.target.value })}>
            <option value="">Ano campanha</option>
            {options.campaignYear.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
