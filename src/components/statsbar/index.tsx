// src/components/statsbar/index.tsx
import { Coins, Circle, Gem, X } from "lucide-react";
import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import { useCharacter } from "@/context/character";
import { percent, getAttributeIcon } from "./functions";
import "./style.scss";

// Usado só quando não há personagem real selecionado ainda, para manter os
// nomes de atributo consistentes com os que vêm do Firestore (title case).
const FALLBACK_ATTRIBUTES: Record<string, number> = {
  Magia: CURRENT_CHARACTER_STUB.atributos.magia,
  Ataque: CURRENT_CHARACTER_STUB.atributos.ataque,
  Controle: CURRENT_CHARACTER_STUB.atributos.controle,
  Proteção: CURRENT_CHARACTER_STUB.atributos.defesa,
  Precisão: CURRENT_CHARACTER_STUB.atributos.precisao,
  Agilidade: CURRENT_CHARACTER_STUB.atributos.agilidade,
};

export default function StatsBar() {
  const { activeCharacter, sheetVisible, hideSheet } = useCharacter();
  const c = CURRENT_CHARACTER_STUB;
  const coins = activeCharacter?.dinheiro ?? c.moedas;
  const attributes = activeCharacter?.atributos ?? FALLBACK_ATTRIBUTES;

  if (!sheetVisible) return null;

  return (
    <section className="statsbar">
      <button
        type="button"
        className="statsbar__close"
        aria-label="Fechar ficha"
        onClick={hideSheet}
      >
        <X size={16} />
      </button>

      <div className="statsbar__vitals">
        <div className="statsbar__vital">
          <span className="statsbar__vital-label">HP</span>
          <div className="statsbar__bar">
            <div
              className="statsbar__bar-fill statsbar__bar-fill--hp"
              style={{ width: `${percent(c.hp.atual, c.hp.max)}%` }}
            />
          </div>
          <span className="statsbar__vital-value">
            {c.hp.atual}/{c.hp.max}
          </span>
        </div>
        <div className="statsbar__vital">
          <span className="statsbar__vital-label">MP</span>
          <div className="statsbar__bar">
            <div
              className="statsbar__bar-fill statsbar__bar-fill--mp"
              style={{ width: `${percent(c.mp.atual, c.mp.max)}%` }}
            />
          </div>
          <span className="statsbar__vital-value">
            {c.mp.atual}/{c.mp.max}
          </span>
        </div>
        <div className="statsbar__vital">
          <span className="statsbar__vital-label">XP</span>
          <div className="statsbar__bar">
            <div
              className="statsbar__bar-fill statsbar__bar-fill--xp"
              style={{ width: `${percent(c.xp.atual, c.xp.max)}%` }}
            />
          </div>
          <span className="statsbar__vital-value">
            {c.xp.atual}/{c.xp.max}
          </span>
        </div>
      </div>

      <div className="statsbar__attrs">
        {Object.entries(attributes).slice(0, 6).map(([name, value]) => {
          const Icon = getAttributeIcon(name);
          return (
            <span key={name}>
              <Icon size={16} /> {value}
              <em>{name}</em>
            </span>
          );
        })}
      </div>

      <div className="statsbar__coins">
        <span>
          <Coins size={16} className="statsbar__icon--gold" /> {coins.galeoes}
          <em>Galeões</em>
        </span>
        <span>
          <Circle size={16} className="statsbar__icon--silver" /> {coins.sicles}
          <em>Sicles</em>
        </span>
        <span>
          <Gem size={16} className="statsbar__icon--bronze" /> {coins.nuques}
          <em>Nuques</em>
        </span>
      </div>

    </section>
  );
}
