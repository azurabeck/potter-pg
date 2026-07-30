// src/pages/pocoes/components/potion-detail-modal/index.tsx
import { useEffect, useState } from "react";
import { ChevronDown, FlaskConical, Lock, Sparkles, X } from "lucide-react";
import { cx } from "@/utils";
import type { Potion } from "@/utils/types";
import { potionImageUrl } from "../potion-card/functions";
import { currentMasteryTier, matchesMasteryRange } from "../../functions";
import "./style.scss";

interface PotionDetailModalProps {
  potion: Potion;
  locked: boolean;
  currentXp: number;
  onClose: () => void;
}

export default function PotionDetailModal({ potion, locked, currentXp, onClose }: PotionDetailModalProps) {
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);
  const imageUrl = potionImageUrl(potion, locked);
  const tier = currentMasteryTier(potion, currentXp);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="potion-detail-modal" onClick={onClose}>
      <div className="potion-detail-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className={cx("potion-detail-modal__image-wrap", locked && "potion-detail-modal__image-wrap--locked")}>
          <img src={imageUrl} alt={potion.name} className="potion-detail-modal__image" />
          {locked && (
            <div className="potion-detail-modal__lock-overlay">
              <Lock size={32} />
            </div>
          )}
        </div>

        <div className="potion-detail-modal__content">
          <button type="button" className="potion-detail-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>

          <header className="potion-detail-modal__header">
            <div className="potion-detail-modal__title">
              <FlaskConical size={18} />
              <h2>{potion.name}</h2>
            </div>
            <span className="potion-detail-modal__badge">{potion.nivel}</span>
          </header>

          <div className="potion-detail-modal__meta">
            <span className="potion-detail-modal__ano">
              <span className="potion-detail-modal__ano-number">{potion.ano}º</span>
              <span>ANO</span>
            </span>
            <span className="potion-detail-modal__meta-item">
              <Sparkles size={14} /> XP {currentXp}/{potion.xp_total}
            </span>
          </div>

          <p className="potion-detail-modal__description">{potion.effect}</p>

          <section className="potion-detail-modal__section">
            <h3>Preparo</h3>
            <p className="potion-detail-modal__description">{potion.cooking}</p>
          </section>

          <section className="potion-detail-modal__section">
            <h3>Ingredientes</h3>
            <ul className="potion-detail-modal__ingredients">
              {potion.ingredientes_info.map((ingredient, index) => {
                const isOpen = expandedIngredient === index;

                return (
                  <li key={index} className="potion-detail-modal__ingredient">
                    <button
                      type="button"
                      className="potion-detail-modal__ingredient-header"
                      onClick={() => setExpandedIngredient((current) => (current === index ? null : index))}
                      aria-expanded={isOpen}
                    >
                      <span>
                        {ingredient.name} <em>({ingredient.value})</em>
                      </span>
                      <ChevronDown size={13} className={isOpen ? "is-open" : ""} aria-hidden="true" />
                    </button>
                    {isOpen && (
                      <div className="potion-detail-modal__ingredient-details">
                        <p>
                          <strong>Onde comprar:</strong> {ingredient.shop || "-"}
                        </p>
                        <p>
                          <strong>Onde encontrar:</strong> {ingredient.drop || "-"}
                        </p>
                        {ingredient.note && (
                          <p>
                            <strong>Observação:</strong> {ingredient.note}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="potion-detail-modal__section">
            <h3>Efeito por Maestria</h3>
            <ul className="potion-detail-modal__mastery-list">
              {potion.mastery_effect.map((entry, index) => {
                const isCurrent = matchesMasteryRange(entry.mastery, tier);

                return (
                  <li
                    key={index}
                    className={cx(
                      "potion-detail-modal__mastery-item",
                      isCurrent && "potion-detail-modal__mastery-item--current"
                    )}
                  >
                    <div className="potion-detail-modal__mastery-header">
                      <span>Maestria {entry.mastery}</span>
                      {isCurrent && <span className="potion-detail-modal__mastery-current-tag">Atual</span>}
                    </div>
                    <p>{entry.effect}</p>
                    <p className="potion-detail-modal__recipe">{entry.recipe}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
