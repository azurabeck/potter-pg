// src/pages/atributos/index.tsx
import { useMemo, useState } from "react";
import { useCharacter } from "@/context/character";
import { formatAttributeLabel, getAttributeIcon } from "@/utils";
import FilterBar from "./components/filter-bar";
import {
  EMPTY_FILTERS,
  applyFilters,
  attributeMaxForYear,
  buildRows,
  groupRowsByType,
  type AttributeRow,
  type RowFilters,
  type RowType,
} from "./functions";
import "./style.scss";

export default function Atributos() {
  const { activeCharacter, loading } = useCharacter();
  const [filters, setFilters] = useState<RowFilters>(EMPTY_FILTERS);

  const rows = useMemo(
    () => (activeCharacter ? buildRows(activeCharacter, formatAttributeLabel) : []),
    [activeCharacter]
  );
  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const groupedRows = useMemo(() => groupRowsByType(filteredRows), [filteredRows]);

  return (
    <div className="atributos-page">
      <div className="atributos-page__top">
        <div className="atributos-page__heading">
          <h1>Atributos</h1>
          {activeCharacter && (
            <p>
              Limite dos atributos no {activeCharacter.ano}º ano:{" "}
              <strong>{attributeMaxForYear(activeCharacter.ano)}</strong>
            </p>
          )}
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <p className="atributos-page__status">Carregando atributos...</p>}
      {!loading && !activeCharacter && (
        <p className="atributos-page__status">Nenhum personagem selecionado.</p>
      )}

      {!loading && activeCharacter && (
        <div className="atributos-page__content">
          {filteredRows.length === 0 ? (
            <p className="atributos-page__status">Nenhum dado encontrado.</p>
          ) : (
            <>
              {groupedRows.atributo.length > 0 && (
                <section className="atributos-page__section">
                  <h2>
                    Atributos <span>({groupedRows.atributo.length})</span>
                  </h2>
                  <div className="atributos-page__attr-grid">
                    {groupedRows.atributo.map((row) => (
                      <AttributeCard key={row.id} row={row} />
                    ))}
                  </div>
                </section>
              )}

              {(["talento", "titulo"] as RowType[]).map((type) => {
                const items = groupedRows[type];
                if (items.length === 0) return null;

                return (
                  <section key={type} className="atributos-page__section">
                    <h2>
                      {type === "talento" ? "Talentos" : "Títulos e Reputações"}{" "}
                      <span>({items.length})</span>
                    </h2>
                    <div className="atributos-page__extra-list">
                      {items.map((row) => (
                        <ExtraCard key={row.id} row={row} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AttributeCard({ row }: { row: AttributeRow }) {
  const Icon = getAttributeIcon(row.nome);
  const percent = row.maximo > 0 ? Math.max(0, Math.min(100, (row.nivel / row.maximo) * 100)) : 0;

  return (
    <div className="atributos-page__attr-card">
      <span className="atributos-page__attr-icon">
        <Icon size={16} strokeWidth={1.7} />
      </span>
      <div className="atributos-page__attr-info">
        <div className="atributos-page__attr-top">
          <span className="atributos-page__attr-name">{row.nome}</span>
          <span className="atributos-page__attr-value">
            {row.nivel}
            <small>/{row.maximo}</small>
          </span>
        </div>
        <div className="atributos-page__attr-bar">
          <div className="atributos-page__attr-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function ExtraCard({ row }: { row: AttributeRow }) {
  return (
    <div className={`atributos-page__extra-card atributos-page__extra-card--${row.tipo}`}>
      <div className="atributos-page__extra-header">
        <strong>{row.nome}</strong>
        <span className="atributos-page__badge">
          {row.nivel}/{row.maximo}
        </span>
      </div>
      {(row.descricao || row.vantagem || row.conhecidoPor || row.titulo) && (
        <div className="atributos-page__extra-details">
          {row.descricao && <p>{row.descricao}</p>}
          {row.conhecidoPor && <p>{row.conhecidoPor}</p>}
          {row.vantagem && (
            <p>
              <span>Vantagem: </span>
              {row.vantagem}
            </p>
          )}
          {row.titulo && (
            <p>
              <span>Título: </span>
              {row.titulo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
