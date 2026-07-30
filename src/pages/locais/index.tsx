// src/pages/locais/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useCharacter } from "@/context/character";
import { getLocations } from "@/actions/get/locations";
import type { Location } from "@/utils/types";
import FilterBar from "./components/filter-bar";
import LocationList from "./components/location-list";
import LocationDetail from "./components/location-detail";
import { EMPTY_FILTERS, applyFilters, getKnownLocations, type LocationFilters } from "./functions";
import "./style.scss";

export default function Locais() {
  const { activeCharacter } = useCharacter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState("");

  const characterId = activeCharacter?.id;

  useEffect(() => {
    if (!characterId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getLocations()
      .then((data) => {
        if (!cancelled) setLocations(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar locais:", err);
        if (!cancelled) setError("Não foi possível carregar os locais agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const knownLocations = useMemo(
    () => getKnownLocations(locations, activeCharacter?.locais_conhecidos ?? []),
    [locations, activeCharacter]
  );
  const filteredLocations = useMemo(() => applyFilters(knownLocations, filters), [knownLocations, filters]);
  const selectedLocation = filteredLocations.find((location) => location.id === selectedId) ?? filteredLocations[0] ?? null;

  if (!loading && !activeCharacter) {
    return (
      <div className="locais-page">
        <p className="locais-page__status">Nenhum personagem selecionado.</p>
      </div>
    );
  }

  return (
    <div className="locais-page">
      <div className="locais-page__top">
        <div className="locais-page__heading">
          <h1>Locais</h1>
          <p>Lugares que seu personagem já conheceu ou descobriu.</p>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading && <p className="locais-page__status">Carregando locais...</p>}
      {error && <p className="locais-page__status locais-page__status--error">{error}</p>}

      {!loading && !error && (
        <div className="locais-page__layout">
          <LocationList
            locations={filteredLocations}
            selectedId={selectedLocation?.id ?? ""}
            onSelect={(location) => setSelectedId(location.id)}
          />
          <LocationDetail location={selectedLocation} />
        </div>
      )}
    </div>
  );
}
