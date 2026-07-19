import { GripHorizontal, Pin, PinOff, X } from "lucide-react";
import { SCOREBOARD_ROWS } from "../../functions";
import "./style.scss";

type ScoreboardPanelProps = {
  pinned: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  onDragStart?: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export default function ScoreboardPanel({
  pinned,
  onClose,
  onTogglePin,
  onDragStart,
}: ScoreboardPanelProps) {
  return (
    <section
      className={`platform-scoreboard${pinned ? " platform-scoreboard--pinned" : ""}`}
      aria-label="Placar da rodada"
    >
      <div
        className={`platform-scoreboard__header${pinned ? " platform-scoreboard__header--draggable" : ""}`}
        onPointerDown={onDragStart}
      >
        <div className="platform-scoreboard__title">
          {pinned && <GripHorizontal size={14} strokeWidth={1.7} aria-hidden="true" />}
          <div>
            <strong>Placar</strong>
            <span>Rodada 10</span>
          </div>
        </div>

        <div className="platform-scoreboard__actions" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onTogglePin} title={pinned ? "Desafixar placar" : "Fixar placar"}>
            {pinned ? <PinOff size={13} /> : <Pin size={13}  />}
          </button>
          <button type="button" onClick={onClose} title="Fechar placar">
            <X size={13}  />
          </button>
        </div>
      </div>

      <div className="platform-scoreboard__table">
        {SCOREBOARD_ROWS.map((row, index) => (
          <div
            key={row.name}
            className={`platform-scoreboard__row platform-scoreboard__row--${row.tone}${index % 2 ? " platform-scoreboard__row--striped" : ""}`}
          >
            <strong>{row.name}</strong>
            <span>{row.hp}</span>
            <p>{row.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
