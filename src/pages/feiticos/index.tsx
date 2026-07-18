// src/pages/feiticos/index.tsx
import { useEffect, useMemo, useState } from "react";
import { getSpells } from "@/actions/get/spells";
import { useCharacter } from "@/context/character";
import { isSpellLocked } from "@/utils";
import type { Spell } from "@/utils/types";
import { SPELLS_PAGE_SIZE_FALLBACK } from "@/services/genene_settings";
import Pagination from "@/components/pagination";
import FilterBar from "./components/filter-bar";
import { EMPTY_FILTERS, applyFilters, type SpellFilters } from "./components/filter-bar/functions";
import SpellCard from "./components/spell-card";
import SpellDetailModal from "./components/spell-detail-modal";
import LockedSlot from "./components/locked-slot";
import { calculateFitCount, emptySlotsCount, paginateSpells, totalPages } from "./functions";
import "./style.scss";

export default function Feiticos() {
  const { activeCharacter } = useCharacter();
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SpellFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [pageSize, setPageSize] = useState(SPELLS_PAGE_SIZE_FALLBACK);
  const [gridNode, setGridNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSpells()
      .then((data) => {
        if (!cancelled) setSpells(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar feitiços:", err);
        if (!cancelled) setError("Não foi possível carregar os feitiços agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Mede o espaco disponivel na grade e recalcula quantos cards cabem sem
  // cortar nenhum, em vez de usar uma quantidade fixa por pagina. Usa um
  // callback ref (gridNode) em vez de useRef porque o <div> só existe no
  // DOM depois que `loading` vira false — um useRef comum ficaria preso
  // ao valor inicial (null) e o ResizeObserver nunca seria criado.
  useEffect(() => {
    if (!gridNode) return;

    function measure() {
      const { width, height } = gridNode!.getBoundingClientRect();
      const fit = calculateFitCount(width, height);
      if (fit > 0) setPageSize(fit);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridNode);
    return () => observer.disconnect();
  }, [gridNode]);

  const filteredSpells = useMemo(
    () => applyFilters(spells, filters, (spell) => isSpellLocked(spell, activeCharacter)),
    [spells, filters, activeCharacter]
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const pageSpells = paginateSpells(filteredSpells, page, pageSize);
  const emptySlots = emptySlotsCount(pageSpells.length, pageSize);

  return (
    <div className="feiticos-page">
      <div className="feiticos-page__heading">
        <h1>FEITIÇOS</h1>
      </div>

      <FilterBar spells={spells} filters={filters} onChange={setFilters} />

      {loading && <p className="feiticos-page__status">Carregando feitiços...</p>}
      {error && <p className="feiticos-page__status feiticos-page__status--error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="feiticos-page__grid" ref={setGridNode}>
            {pageSpells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                locked={isSpellLocked(spell, activeCharacter)}
                onClick={() => setSelectedSpell(spell)}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <LockedSlot key={`empty-${i}`} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages(filteredSpells.length, pageSize)}
            onChange={setPage}
          />
        </>
      )}

      {selectedSpell && (
        <SpellDetailModal
          spell={selectedSpell}
          locked={isSpellLocked(selectedSpell, activeCharacter)}
          onClose={() => setSelectedSpell(null)}
        />
      )}
    </div>
  );
}
