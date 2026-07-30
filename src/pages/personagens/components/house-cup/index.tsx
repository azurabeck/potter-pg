// src/pages/personagens/components/house-cup/index.tsx
import type { CSSProperties } from "react";
import { cx } from "@/utils";
import type { HouseCupEntry } from "../../functions";
import { HOUSE_ACCENTS, HOUSE_RIBBONS, HOUSE_SHIELDS } from "../../functions";
import "./style.scss";

interface HouseCupProps {
  standings: HouseCupEntry[];
}

/** Placar da Taça das Casas — `standings` já vem calculado (ver buildHouseCupStandings, functions.ts) a partir do documento real da mesa. Escudo, cor de fundo e o item em destaque seguem sempre a casa em 1º lugar. */
export default function HouseCup({ standings }: HouseCupProps) {
  const leaderHouse = standings[0]?.casa;
  const shieldUrl = leaderHouse ? HOUSE_SHIELDS[leaderHouse] : undefined;
  const accentColor = leaderHouse ? HOUSE_ACCENTS[leaderHouse] : undefined;

  return (
    <aside className="house-cup" aria-label="Taça das Casas">
      <div
        className="house-cup__banner"
        style={accentColor ? ({ "--house-accent": accentColor } as CSSProperties) : undefined}
      >
        <h2 className="house-cup__title">Taça das Casas</h2>

        {shieldUrl && <img className="house-cup__shield" src={shieldUrl} alt={leaderHouse} />}

        <ol className="house-cup__list">
          {standings.map((entry, index) => (
            <li
              key={entry.casa}
              className={cx("house-cup__item", entry.casa === leaderHouse && "house-cup__item--highlighted")}
            >
              <span className="house-cup__rank">{index + 1}º</span>
              <img className="house-cup__ribbon" src={HOUSE_RIBBONS[entry.casa]} alt={entry.casa} />
              <span className="house-cup__points">{entry.pontos}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
