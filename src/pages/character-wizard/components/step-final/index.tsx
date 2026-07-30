import type { Dispatch, SetStateAction } from "react";
import CardGroup from "../card-group";
import { ANIMAL_OPTIONS, CORE_OPTIONS, WAND_OPTIONS, type WizardState } from "../../functions";

interface StepFinalProps {
  state: WizardState;
  onChange: Dispatch<SetStateAction<WizardState>>;
}

export default function StepFinal({ state, onChange }: StepFinalProps) {
  return (
    <div className="wizard-step wizard-step--final">
      <div className="wizard-step__section">
        <span className="wizard-step__section-title">Núcleo</span>
        <CardGroup
          name="core"
          options={CORE_OPTIONS}
          selectedId={state.coreId}
          onSelect={(id) => onChange((current) => ({ ...current, coreId: id }))}
        />
      </div>

      <div className="wizard-step__section">
        <span className="wizard-step__section-title">Varinha</span>
        <CardGroup
          name="wand"
          options={WAND_OPTIONS}
          selectedId={state.wandId}
          onSelect={(id) => onChange((current) => ({ ...current, wandId: id }))}
        />
      </div>

      <div className="wizard-step__section">
        <span className="wizard-step__section-title">Animal de estimação</span>
        <CardGroup
          name="animal"
          options={ANIMAL_OPTIONS}
          selectedId={state.animalId}
          onSelect={(id) => onChange((current) => ({ ...current, animalId: id }))}
        />
      </div>
    </div>
  );
}
