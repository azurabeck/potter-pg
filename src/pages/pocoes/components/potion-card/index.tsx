// src/pages/pocoes/components/potion-card/index.tsx
import { Lock } from "lucide-react";
import type { Potion } from "@/utils/types";
import { cx } from "@/utils";
import { potionImageUrl } from "./functions";
import "./style.scss";

interface PotionCardProps {
  potion: Potion;
  locked: boolean;
  onClick: () => void;
}

export default function PotionCard({ potion, locked, onClick }: PotionCardProps) {
  const imageUrl = potionImageUrl(potion, locked);

  return (
    <button type="button" className={cx("potion-card", locked && "potion-card--locked")} onClick={onClick}>
      <img src={imageUrl} alt={potion.name} className="potion-card__image" loading="lazy" />
      <span className="potion-card__label">{potion.name}</span>
      {locked && (
        <div className="potion-card__lock-overlay">
          <Lock size={20} />
        </div>
      )}
    </button>
  );
}
