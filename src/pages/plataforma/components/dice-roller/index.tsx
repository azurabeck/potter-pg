import { Dices, X } from "lucide-react";
import { DICE } from "../../functions";
import type { Die, RolledDie } from "../../functions";
import "./style.scss";

interface DiceRollerProps {
  rolledDie: RolledDie | null;
  onRoll: (sides: Die["sides"]) => void;
  onCloseResult: () => void;
}

/**
 * Fileira de dados + modal de resultado. `rolledDie` é controlado pelo pai
 * porque o Escape global da página precisa poder fechar o modal de
 * resultado junto com os outros overlays.
 */
export default function DiceRoller({ rolledDie, onRoll, onCloseResult }: DiceRollerProps) {
  return (
    <>
      <div className="platform-page__dice-row">
        <strong>DADOS</strong>
        <div className="platform-page__dice-list">
          {DICE.map((die) => (
            <button
              type="button"
              key={die.sides}
              className={`platform-die platform-die--d${die.sides}`}
              aria-label={`Rolar dado de ${die.sides} lados`}
              title={`Rolar d${die.sides}`}
              onClick={() => onRoll(die.sides)}
            >
              <span>{die.sides}</span>
            </button>
          ))}
        </div>
      </div>

      {rolledDie && (
        <div className="platform-modal" role="presentation" onMouseDown={onCloseResult}>
          <div
            className="platform-modal__panel platform-modal__panel--dice"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dice-result-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="platform-modal__close"
              type="button"
              onClick={onCloseResult}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <Dices size={25} aria-hidden="true" />
            <span className="platform-modal__eyebrow">Resultado do d{rolledDie.sides}</span>
            <strong id="dice-result-title">{rolledDie.result}</strong>
            <button
              type="button"
              className="platform-modal__primary"
              onClick={() => onRoll(rolledDie.sides)}
            >
              Rolar novamente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
