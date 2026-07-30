// src/pages/adversarios/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useCharacter } from "@/context/character";
import { getEnemies } from "@/actions/get/enemies";
import { getNpcs } from "@/actions/get/npcs";
import type { Enemy, Npc } from "@/utils/types";
import FilterBar from "./components/filter-bar";
import AdversaryList from "./components/adversary-list";
import AdversaryDetail from "./components/adversary-detail";
import { EMPTY_FILTERS, applyFilters, getKnownAdversaries, type AdversaryFilters, type AdversaryItem } from "./functions";
import "./style.scss";

export default function Adversarios() {
  const { activeCharacter } = useCharacter();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdversaryFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState("");

  const characterId = activeCharacter?.id;

  useEffect(() => {
    if (!characterId) {
      setEnemies([]);
      setNpcs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([getEnemies(), getNpcs()])
      .then(([enemiesData, npcsData]) => {
        if (cancelled) return;
        setEnemies(enemiesData);
        setNpcs(npcsData);
      })
      .catch((err) => {
        console.error("Erro ao carregar adversários:", err);
        if (!cancelled) setError("Não foi possível carregar os adversários agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const knownAdversaries = useMemo(
    () => getKnownAdversaries(enemies, npcs, activeCharacter?.adversarios_conhecidos ?? []),
    [enemies, npcs, activeCharacter]
  );
  const filteredItems = useMemo(() => applyFilters(knownAdversaries, filters), [knownAdversaries, filters]);
  const selectedItem: AdversaryItem | null =
    filteredItems.find((item) => item.data.id === selectedId) ?? filteredItems[0] ?? null;

  if (!loading && !activeCharacter) {
    return (
      <div className="adversarios-page">
        <p className="adversarios-page__status">Nenhum personagem selecionado.</p>
      </div>
    );
  }

  return (
    <div className="adversarios-page">
      <div className="adversarios-page__top">
        <div className="adversarios-page__heading">
          <h1>Adversários</h1>
          <p>Criaturas e NPCs hostis que seu personagem já conheceu ou enfrentou.</p>
        </div>
        <FilterBar items={knownAdversaries} filters={filters} onChange={setFilters} />
      </div>

      {loading && <p className="adversarios-page__status">Carregando adversários...</p>}
      {error && <p className="adversarios-page__status adversarios-page__status--error">{error}</p>}

      {!loading && !error && (
        <div className="adversarios-page__layout">
          <AdversaryList items={filteredItems} selectedId={selectedItem?.data.id ?? ""} onSelect={(item) => setSelectedId(item.data.id)} />
          <AdversaryDetail item={selectedItem} />
        </div>
      )}
    </div>
  );
}
