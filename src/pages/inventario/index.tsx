// src/pages/inventario/index.tsx
import { useMemo, useState } from "react";
import { Info, Search } from "lucide-react";
import { useCharacter } from "@/context/character";
import { resolveCharacterMoney } from "@/utils";
import type { CharacterItem } from "@/utils/types";
import ItemDetailModal from "./components/item-detail-modal";
import {
  CATEGORY_OPTIONS,
  EMPTY_FILTERS,
  filterItems,
  groupItemsByCategory,
  type InventoryFilters,
} from "./functions";
import "./style.scss";

export default function Inventario() {
  const { activeCharacter, loading } = useCharacter();
  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [selectedItem, setSelectedItem] = useState<CharacterItem | null>(null);

  const items = activeCharacter?.inventario.itens ?? [];
  const filteredItems = useMemo(() => filterItems(items, filters), [items, filters]);
  const groupedItems = useMemo(() => groupItemsByCategory(filteredItems), [filteredItems]);
  const money = resolveCharacterMoney(activeCharacter);

  return (
    <div className="inventario-page">
      <div className="inventario-page__heading">
        <h1>Inventário</h1>
      </div>

      {loading && <p className="inventario-page__status">Carregando inventário...</p>}
      {!loading && !activeCharacter && (
        <p className="inventario-page__status">Nenhum personagem selecionado.</p>
      )}

      {!loading && activeCharacter && (
        <div className="inventario-page__layout">
          <div className="inventario-page__list">
            {filteredItems.length === 0 ? (
              <p className="inventario-page__status">Nenhum item encontrado.</p>
            ) : (
              Object.entries(groupedItems).map(([category, categoryItems]) => (
                <section key={category} className="inventario-page__category">
                  <h2>{category}</h2>
                  <ul>
                    {categoryItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="inventario-page__item"
                          onClick={() => setSelectedItem(item)}
                        >
                          <span className="inventario-page__item-name">{item.nome || "Item sem nome"}</span>
                          <span className="inventario-page__item-line" aria-hidden="true" />
                          <span className="inventario-page__item-quantity">{item.quantidade || 1}</span>
                          <Info size={14} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>

          <aside className="inventario-page__sidebar">
            <div className="inventario-page__filters">
              <h3>Filtrar inventário</h3>
              <label className="inventario-page__search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Buscar item..."
                  value={filters.search}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                />
              </label>
              <select
                value={filters.category}
                onChange={(event) => setFilters({ ...filters, category: event.target.value })}
              >
                <option value="">Todas as categorias</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {money && (
              <div className="inventario-page__money">
                <h3>Moedas</h3>
                <div className="inventario-page__coins">
                  <div className="inventario-page__coin">
                    <span className="inventario-page__coin-icon inventario-page__coin-icon--galleon">G</span>
                    <span>{money.galeoes}</span>
                    <small>Galeões</small>
                  </div>
                  <div className="inventario-page__coin">
                    <span className="inventario-page__coin-icon inventario-page__coin-icon--sickle">S</span>
                    <span>{money.sicles}</span>
                    <small>Sicles</small>
                  </div>
                  <div className="inventario-page__coin">
                    <span className="inventario-page__coin-icon inventario-page__coin-icon--knut">N</span>
                    <span>{money.nuques}</span>
                    <small>Nuques</small>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
