import { Wand2 } from "lucide-react";
import type { CardOption } from "../../functions";

interface CardGroupProps {
  name: string;
  options: CardOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Grid de cartas selecionáveis (rádio por baixo) — usado por step-final
// (núcleo/varinha/animal) e step-house (escolha direta de casa). Cartas
// sem `imageUrl` caem no ícone de varinha como fallback.
export default function CardGroup({ name, options, selectedId, onSelect }: CardGroupProps) {
  return (
    <div className="wizard-step__option-grid">
      {options.map((option) => (
        <label key={option.id} className={`wizard-step__option-card${selectedId === option.id ? " is-selected" : ""}`}>
          <input type="radio" name={name} checked={selectedId === option.id} onChange={() => onSelect(option.id)} />
          {option.imageUrl ? (
            <img className="wizard-step__option-image" src={option.imageUrl} alt="" />
          ) : (
            <Wand2 size={16} className="wizard-step__option-fallback-icon" aria-hidden="true" />
          )}
          <strong>{option.nome}</strong>
          {option.descricao && <span>{option.descricao}</span>}
        </label>
      ))}
    </div>
  );
}
