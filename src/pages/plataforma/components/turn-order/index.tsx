import { useState } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { TURN_ORDER } from "../../functions";
import "./style.scss";

/** Carrossel da ordem da rodada — autônomo, não depende de estado da página. */
export default function TurnOrder() {
  const [activeTurn, setActiveTurn] = useState(2);

  function moveTurn(direction: -1 | 1) {
    setActiveTurn((current) => (current + direction + TURN_ORDER.length) % TURN_ORDER.length);
  }

  const previousTurn = (activeTurn - 1 + TURN_ORDER.length) % TURN_ORDER.length;
  const nextTurn = (activeTurn + 1) % TURN_ORDER.length;

  return (
    <div className="platform-page__turn-order">
      <div className="platform-page__turn-heading">
        <span>ORDEM DA RODADA</span>
        <strong>Turno {activeTurn + 1}</strong>
      </div>

      <div className="platform-turn-carousel" aria-label="Carrossel da ordem da rodada">
        <button
          type="button"
          className="platform-turn-carousel__arrow"
          onClick={() => moveTurn(-1)}
          aria-label="Ir para a rodada anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          className="platform-turn-card platform-turn-card--side"
          onClick={() => setActiveTurn(previousTurn)}
        >
          <span>Rodada anterior</span>
          <strong>{TURN_ORDER[previousTurn]}</strong>
        </button>

        <div className="platform-turn-card platform-turn-card--active">
          <span>
            <Crown size={13} /> Rodada atual
          </span>
          <strong>{TURN_ORDER[activeTurn]}</strong>
          <small>é a vez deste personagem</small>
        </div>

        <button
          type="button"
          className="platform-turn-card platform-turn-card--side"
          onClick={() => setActiveTurn(nextTurn)}
        >
          <span>Próxima rodada</span>
          <strong>{TURN_ORDER[nextTurn]}</strong>
        </button>

        <button
          type="button"
          className="platform-turn-carousel__arrow"
          onClick={() => moveTurn(1)}
          aria-label="Ir para a próxima rodada"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
