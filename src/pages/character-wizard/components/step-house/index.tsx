import { useState, type Dispatch, type SetStateAction } from "react";
import CardGroup from "../card-group";
import SortingStory from "../sorting-story";
import {
  CORE_OPTIONS,
  HOUSE_FLAGS,
  HOUSE_OPTIONS,
  WAND_OPTIONS,
  type SortingStoryMessage,
  type WizardState,
} from "../../functions";

interface StepHouseProps {
  state: WizardState;
  onChange: Dispatch<SetStateAction<WizardState>>;
}

type Mode = "summary" | "menu" | "choose" | "quiz";

/**
 * Casa é a única escolha do wizard com um caminho alternativo: em vez de
 * escolher direto, o jogador pode fazer o teste de seleção — uma
 * história narrada pela IA (`SortingStory`) que termina sugerindo uma
 * casa com base nas atitudes do jogador, aceitável ou não (sempre dá pra
 * escolher outra). `mode` é estado local (não faz parte de
 * `WizardState`): só `casa` final é persistido no wizard.
 */
export default function StepHouse({ state, onChange }: StepHouseProps) {
  const [mode, setMode] = useState<Mode>(state.casa ? "summary" : "menu");

  // `transcript` só vem preenchido quando a casa veio do teste de seleção
  // (`SortingStory.onAccept`) — escolher direto no card (`CardGroup`,
  // chama com só `casa`) sempre zera qualquer transcript de uma tentativa
  // de teste anterior e abandonada, pra `registerFirstSession` nunca
  // registrar uma história que o jogador não aceitou de verdade.
  function pickHouse(casa: string, transcript?: SortingStoryMessage[]) {
    onChange((current) => ({ ...current, casa, sortingStoryTranscript: transcript ?? null }));
    setMode("summary");
  }

  if (mode === "summary" && state.casa) {
    return (
      <div className="wizard-step wizard-step--house">
        <div className="wizard-step__house-result">
          <img src={HOUSE_FLAGS[state.casa]} alt={state.casa} />
          <strong>{state.casa}</strong>
        </div>
        <button type="button" className="wizard-step__text-button" onClick={() => setMode("menu")}>
          Trocar de casa
        </button>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="wizard-step wizard-step--house">
        <span className="wizard-step__section-title">Escolha sua casa</span>
        <CardGroup name="casa" options={HOUSE_OPTIONS} selectedId={state.casa} onSelect={pickHouse} />
      </div>
    );
  }

  if (mode === "quiz") {
    // A varinha (madeira + núcleo) já foi escolhida no step anterior
    // (obrigatória pra chegar até aqui, ver isFinalStepValid) — repassa
    // pro SortingStory pra manter consistência se a história levar o
    // jogador até a Olivaras (ver buildSortingStorySystemPrompt).
    const wandWood = WAND_OPTIONS.find((option) => option.id === state.wandId)?.nome ?? null;
    const wandCore = CORE_OPTIONS.find((option) => option.id === state.coreId)?.nome ?? null;
    return (
      <SortingStory
        playerName={state.nome}
        wandWood={wandWood}
        wandCore={wandCore}
        onAccept={pickHouse}
        onCancel={() => setMode("choose")}
      />
    );
  }

  return (
    <div className="wizard-step wizard-step--house">
      <p className="wizard-step__hint">Escolha sua casa direto, ou faça um pequeno teste pra receber uma sugestão.</p>
      <div className="wizard-step__house-menu">
        <button type="button" className="wizard-step__primary-choice" onClick={() => setMode("quiz")}>
          Fazer teste de seleção
        </button>
        <button type="button" className="wizard-step__secondary-choice" onClick={() => setMode("choose")}>
          Escolher direto
        </button>
      </div>
    </div>
  );
}
