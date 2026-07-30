import type { Dispatch, SetStateAction } from "react";
import { Minus, Plus } from "lucide-react";
import {
  ATTRIBUTE_BASELINE,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  NATURAL_TALENTS,
  pointsRemaining,
  type AttributeKey,
  type WizardState,
} from "../../functions";

interface StepAttributesProps {
  state: WizardState;
  onChange: Dispatch<SetStateAction<WizardState>>;
}

export default function StepAttributes({ state, onChange }: StepAttributesProps) {
  const remaining = pointsRemaining(state.atributos);

  function adjust(key: AttributeKey, delta: number) {
    onChange((current) => {
      const value = current.atributos[key] + delta;
      if (value < ATTRIBUTE_BASELINE) return current;
      if (delta > 0 && pointsRemaining(current.atributos) <= 0) return current;
      return { ...current, atributos: { ...current.atributos, [key]: value } };
    });
  }

  return (
    <div className="wizard-step wizard-step--attributes">
      <div className="wizard-step__points">
        Pontos restantes: <strong>{remaining}</strong>
      </div>

      <div className="wizard-step__attribute-list">
        {ATTRIBUTE_KEYS.map((key) => (
          <div key={key} className="wizard-step__attribute-row">
            <span>{ATTRIBUTE_LABELS[key]}</span>
            <div className="wizard-step__attribute-controls">
              <button
                type="button"
                onClick={() => adjust(key, -1)}
                disabled={state.atributos[key] <= ATTRIBUTE_BASELINE}
                aria-label={`Diminuir ${ATTRIBUTE_LABELS[key]}`}
              >
                <Minus size={13} />
              </button>
              <strong>{state.atributos[key]}</strong>
              <button
                type="button"
                onClick={() => adjust(key, 1)}
                disabled={remaining <= 0}
                aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="wizard-step__section">
        <span className="wizard-step__section-title">Talento natural (escolha 1)</span>
        <p className="wizard-step__hint">Todo d4 concedido por um talento tem limite de 3 usos por sessão.</p>
        <div className="wizard-step__talent-list">
          {NATURAL_TALENTS.map((talent) => (
            <label
              key={talent.id}
              className={`wizard-step__talent-card${state.talentoId === talent.id ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="talento"
                checked={state.talentoId === talent.id}
                onChange={() => onChange((current) => ({ ...current, talentoId: talent.id }))}
              />
              <strong>{talent.nome}</strong>
              <span>{talent.vantagem}</span>
              <p>{talent.descricao}</p>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
