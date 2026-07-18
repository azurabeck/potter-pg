// src/pages/feiticos/components/spell-detail-modal/index.tsx
import { useEffect } from "react";
import { Flame, MapPin, Clock3, ShieldQuestion, Lock, ShieldHalf, X } from "lucide-react";
import type { Spell } from "@/utils/types";
import { cx, formatAno, highestMasteryValue, lowestMasteryValue, shortRange } from "@/utils";
import {
  CATEGORY_LABEL,
  normalizeCategory,
  shortEffectLabel,
  spellDuration,
  spellImageUrl,
} from "../spell-card/functions";
import "./style.scss";

interface SpellDetailModalProps {
  spell: Spell;
  locked: boolean;
  onClose: () => void;
}

export default function SpellDetailModal({ spell, locked, onClose }: SpellDetailModalProps) {
  const { attributes: a } = spell;
  const category = normalizeCategory(spell);
  const categoryLabel = CATEGORY_LABEL[category] ?? a.category ?? a.card_category ?? "—";
  const isOffensive = category === "ataque" || category === "ofensivo";
  const imageUrl = spellImageUrl(spell, locked);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="spell-detail-modal" onClick={onClose}>
      <div className="spell-detail-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div
          className={cx(
            "spell-detail-modal__image-wrap",
            locked && "spell-detail-modal__image-wrap--locked"
          )}
        >
          <img src={imageUrl} alt={a.name} className="spell-detail-modal__image" />
          {locked && (
            <div className="spell-detail-modal__lock-overlay">
              <Lock size={32} />
            </div>
          )}
        </div>

        <div className="spell-detail-modal__content">
          <button
            type="button"
            className="spell-detail-modal__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={18} />
          </button>

          <header className="spell-detail-modal__header">
            <div className="spell-detail-modal__title">
              <ShieldHalf size={18} />
              <h2>{a.name}</h2>
            </div>
            <span
              className={cx(
                "spell-detail-modal__badge",
                `spell-detail-modal__badge--${category}`
              )}
            >
              {categoryLabel}
            </span>
          </header>

          <div className="spell-detail-modal__meta">
            <span className="spell-detail-modal__ano">
              <span className="spell-detail-modal__ano-number">{formatAno(a.ano_letivo)}</span>
              <span>ANO</span>
            </span>
            <span className="spell-detail-modal__meta-item">
              <ShieldQuestion size={14} /> {categoryLabel}
            </span>
            <span className="spell-detail-modal__meta-item">
              <MapPin size={14} /> {shortRange(a.range)}
            </span>
            <span className="spell-detail-modal__meta-item">
              <Clock3 size={14} /> {spellDuration(spell)}
            </span>
          </div>

          <p className="spell-detail-modal__description">{a.effect}</p>
          {a.description && (
            <p className="spell-detail-modal__description spell-detail-modal__description--extra">
              {a.description}
            </p>
          )}

          <footer className="spell-detail-modal__footer">
            {isOffensive ? (
              <>
                <div className="spell-detail-modal__stat">
                  <span>DANO INICIAL</span>
                  <strong>{lowestMasteryValue(spell)}</strong>
                </div>
                <div className="spell-detail-modal__stat">
                  <span>DANO MÁXIMO</span>
                  <strong>{highestMasteryValue(spell)}</strong>
                </div>
                <Flame size={22} className="spell-detail-modal__footer-icon" />
              </>
            ) : (
              <>
                <div className="spell-detail-modal__stat">
                  <span>DIFICULDADE</span>
                  <strong>{a.maestria_required}</strong>
                </div>
                <div className="spell-detail-modal__stat">
                  <span>EFEITO</span>
                  <strong>{shortEffectLabel(spell)}</strong>
                </div>
              </>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
