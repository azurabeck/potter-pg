import { useState } from "react";
import { Loader2, ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { createPlayerCharacter } from "@/actions/sets/characters";
import { APP_NAME } from "@/services/genene_settings";
import StepIdentity from "./components/step-identity";
import StepAttributes from "./components/step-attributes";
import StepFinal from "./components/step-final";
import StepHouse from "./components/step-house";
import {
  buildCharacterPayload,
  createInitialWizardState,
  isAttributesStepValid,
  isFinalStepValid,
  isHouseStepValid,
  isIdentityStepValid,
  type WizardState,
} from "./functions";
import "./style.scss";

const STEP_LABELS = ["Identidade", "Atributos e talento", "Varinha, núcleo e animal", "Casa"];

/**
 * Bloqueia o resto do app (ver `App.tsx`) até o usuário logado ter pelo
 * menos uma ficha de personagem "player" — cobre tanto quem acabou de
 * criar conta quanto um player convidado pra uma sessão que loga pela
 * primeira vez sem ficha nenhuma ainda.
 */
export default function CharacterWizard() {
  const { user } = useAuth();
  const { refreshCharacters } = useCharacter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(createInitialWizardState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEP_LABELS.length - 1;
  const canAdvance =
    step === 0
      ? isIdentityStepValid(state)
      : step === 1
        ? isAttributesStepValid(state)
        : step === 2
          ? isFinalStepValid(state)
          : isHouseStepValid(state);

  function goNext() {
    if (!canAdvance || submitting) return;
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }
    void submit();
  }

  function goBack() {
    if (submitting) return;
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPlayerCharacter(user.uid, buildCharacterPayload(state));
      await refreshCharacters();
    } catch (err) {
      setError(`Não foi possível criar a ficha: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="character-wizard-page">
      <div className="character-wizard-page__card">
        <div className="character-wizard-page__brand">
          <ShieldHalf className="character-wizard-page__brand-icon" />
          <span>{APP_NAME}</span>
        </div>

        <h1 className="character-wizard-page__title">Crie sua ficha</h1>
        <p className="character-wizard-page__subtitle">
          Antes de entrar na mesa, vamos montar seu personagem — leva só alguns passos.
        </p>

        <ol className="character-wizard-page__steps">
          {STEP_LABELS.map((label, index) => (
            <li key={label} className={index === step ? "is-active" : index < step ? "is-done" : ""}>
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="character-wizard-page__content">
          {step === 0 && <StepIdentity state={state} onChange={setState} />}
          {step === 1 && <StepAttributes state={state} onChange={setState} />}
          {step === 2 && <StepFinal state={state} onChange={setState} />}
          {step === 3 && <StepHouse state={state} onChange={setState} />}
        </div>

        {error && <p className="character-wizard-page__error">{error}</p>}

        <div className="character-wizard-page__footer">
          <button type="button" onClick={goBack} disabled={step === 0 || submitting}>
            Voltar
          </button>
          <button
            type="button"
            className="character-wizard-page__primary"
            onClick={goNext}
            disabled={!canAdvance || submitting}
          >
            {submitting && <Loader2 size={15} className="character-wizard-page__spinner" />}
            {isLastStep ? "Concluir" : "Avançar"}
          </button>
        </div>
      </div>
    </div>
  );
}
