// src/pages/relacoes/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useCharacter } from "@/context/character";
import { getNpcs } from "@/actions/get/npcs";
import { deleteNpc, updateNpc, type NpcInput } from "@/actions/sets/npcs";
import type { Npc } from "@/utils/types";
import FilterBar from "./components/filter-bar";
import RelationList from "./components/relation-list";
import RelationDetail from "./components/relation-detail";
import RelationFormModal from "./components/relation-form-modal";
import { EMPTY_FILTERS, applyFilters, getRelatedNpcs, type RelationFilters } from "./functions";
import "./style.scss";

export default function Relacoes() {
  const { activeCharacter } = useCharacter();
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RelationFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState("");
  const [editingRelation, setEditingRelation] = useState<Npc | null>(null);
  const [saving, setSaving] = useState(false);

  const characterId = activeCharacter?.id;

  useEffect(() => {
    if (!characterId) {
      setNpcs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getNpcs()
      .then((data) => {
        if (!cancelled) setNpcs(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar relações:", err);
        if (!cancelled) setError("Não foi possível carregar as relações agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const relatedNpcs = useMemo(() => (characterId ? getRelatedNpcs(npcs, characterId) : []), [npcs, characterId]);
  const filteredRelations = useMemo(() => applyFilters(relatedNpcs, filters), [relatedNpcs, filters]);
  const selectedRelation = filteredRelations.find((npc) => npc.id === selectedId) ?? filteredRelations[0] ?? null;

  async function handleSaveRelation(input: NpcInput) {
    if (!editingRelation) return;
    setSaving(true);
    try {
      await updateNpc(editingRelation.id, input);
      setNpcs((current) =>
        current.map((npc) => (npc.id === editingRelation.id ? { ...npc, ...input } : npc))
      );
      setEditingRelation(null);
    } catch (err) {
      console.error("Erro ao salvar relação:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(npc: Npc) {
    if (!window.confirm(`Excluir ${npc.name || "este NPC"}?`)) return;
    try {
      await deleteNpc(npc.id);
      setNpcs((current) => current.filter((item) => item.id !== npc.id));
      if (selectedId === npc.id) setSelectedId("");
    } catch (err) {
      console.error("Erro ao excluir relação:", err);
    }
  }

  if (!loading && !activeCharacter) {
    return (
      <div className="relacoes-page">
        <p className="relacoes-page__status">Nenhum personagem selecionado.</p>
      </div>
    );
  }

  return (
    <div className="relacoes-page">
      <div className="relacoes-page__top">
        <div className="relacoes-page__heading">
          <h1>Relações</h1>
        </div>
        <FilterBar npcs={relatedNpcs} filters={filters} onChange={setFilters} />
      </div>

      {loading && <p className="relacoes-page__status">Carregando relações...</p>}
      {error && <p className="relacoes-page__status relacoes-page__status--error">{error}</p>}

      {!loading && !error && (
        <div className="relacoes-page__layout">
          <RelationList
            relations={filteredRelations}
            selectedId={selectedRelation?.id ?? ""}
            onSelect={(npc) => setSelectedId(npc.id)}
            onEdit={setEditingRelation}
            onDelete={handleDelete}
          />
          <RelationDetail relation={selectedRelation} />
        </div>
      )}

      {editingRelation && (
        <RelationFormModal
          relation={editingRelation}
          saving={saving}
          onSubmit={handleSaveRelation}
          onClose={() => setEditingRelation(null)}
        />
      )}
    </div>
  );
}
