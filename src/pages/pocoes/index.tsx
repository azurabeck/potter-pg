// src/pages/pocoes/index.tsx
import { useEffect, useMemo, useState } from "react";
import { getPotions } from "@/actions/get/potions";
import { useCharacter } from "@/context/character";
import { isPotionLocked } from "@/utils";
import type { Potion } from "@/utils/types";
import { POTIONS_PAGE_SIZE_FALLBACK } from "@/services/genene_settings";
import Pagination from "@/components/pagination";
import FilterBar from "./components/filter-bar";
import { EMPTY_FILTERS, applyFilters, type PotionFilters } from "./components/filter-bar/functions";
import PotionCard from "./components/potion-card";
import PotionDetailModal from "./components/potion-detail-modal";
import LockedSlot from "./components/locked-slot";
import { calculateGridMetrics, emptySlotsCount, paginatePotions, totalPages } from "./functions";
import "./style.scss";

export default function Pocoes() {
  const { activeCharacter } = useCharacter();
  const [potions, setPotions] = useState<Potion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PotionFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedPotion, setSelectedPotion] = useState<Potion | null>(null);
  const [pageSize, setPageSize] = useState(POTIONS_PAGE_SIZE_FALLBACK);
  const [columns, setColumns] = useState(5);
  const [gridNode, setGridNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPotions()
      .then((data) => {
        if (!cancelled) setPotions(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar poções:", err);
        if (!cancelled) setError("Não foi possível carregar as poções agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Mede o espaco disponivel na grade e recalcula quantos cards cabem sem
  // cortar nenhum, em vez de usar uma quantidade fixa por pagina — mesma
  // abordagem de pages/feiticos.
  useEffect(() => {
    if (!gridNode) return;

    function measure() {
      const { width, height } = gridNode!.getBoundingClientRect();
      const metrics = calculateGridMetrics(width, height);
      setColumns(metrics.columns);
      setPageSize(metrics.pageSize);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridNode);
    return () => observer.disconnect();
  }, [gridNode]);

  const filteredPotions = useMemo(
    () => applyFilters(potions, filters, (potion) => isPotionLocked(potion, activeCharacter)),
    [potions, filters, activeCharacter]
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const pagePotions = paginatePotions(filteredPotions, page, pageSize);
  const emptySlots = emptySlotsCount(pagePotions.length, columns);

  const selectedPotionXp =
    selectedPotion && activeCharacter ? activeCharacter.pocoes[selectedPotion.id]?.xp ?? 0 : 0;

  return (
    <div className="pocoes-page">
      <div className="pocoes-page__top">
        <div className="pocoes-page__heading">
          <h1>Poções</h1>
        </div>
        <FilterBar potions={potions} filters={filters} onChange={setFilters} />
      </div>

      {loading && <p className="pocoes-page__status">Carregando poções...</p>}
      {error && <p className="pocoes-page__status pocoes-page__status--error">{error}</p>}

      {!loading && !error && (
        <>
          <div
            className="pocoes-page__grid"
            ref={setGridNode}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {pagePotions.map((potion) => (
              <PotionCard
                key={potion.id}
                potion={potion}
                locked={isPotionLocked(potion, activeCharacter)}
                onClick={() => setSelectedPotion(potion)}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <LockedSlot key={`empty-${i}`} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages(filteredPotions.length, pageSize)}
            onChange={setPage}
          />
        </>
      )}

      {selectedPotion && (
        <PotionDetailModal
          potion={selectedPotion}
          locked={isPotionLocked(selectedPotion, activeCharacter)}
          currentXp={selectedPotionXp}
          onClose={() => setSelectedPotion(null)}
        />
      )}
    </div>
  );
}
