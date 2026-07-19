// src/pages/feiticos/components/spell-card/index.tsx
import { Lock } from "lucide-react";
import type { Spell } from "@/utils/types";
import { cx } from "@/utils";
import { spellImageUrl } from "./functions";
import "./style.scss";

interface SpellCardProps {
  spell: Spell;
  locked: boolean;
  onClick: () => void;
}

export default function SpellCard({ spell, locked, onClick }: SpellCardProps) {
  const { attributes: a } = spell;
  const imageUrl = spellImageUrl(spell, locked);

  return (
    <button
      type="button"
      className={cx("spell-card", locked && "spell-card--locked")}
      onClick={onClick}
    >
      <img src={imageUrl} alt={a.name} className="spell-card__image" loading="lazy" />
      <span className="spell-card__label">{a.name}</span>
      {locked && (
        <div className="spell-card__lock-overlay">
          <Lock size={20} />
        </div>
      )}
    </button>
  );
}
