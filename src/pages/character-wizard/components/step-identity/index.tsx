import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Dices, ImagePlus, Images } from "lucide-react";
import { generateCharacterImage } from "@/actions/ai/generate-character-image";
import { uploadCharacterImage } from "@/actions/media/upload-character-image";
import { buildCharacterImagePrompt, effectiveHp, HP_MINIMUM, rollHp, type WizardState } from "../../functions";
import GeneratedImageModal from "./generated-image-modal";
import ExistingImageModal from "./existing-image-modal";

interface StepIdentityProps {
  state: WizardState;
  onChange: Dispatch<SetStateAction<WizardState>>;
}

export default function StepIdentity({ state, onChange }: StepIdentityProps) {
  const hp = effectiveHp(state.hpRoll);
  const [generating, setGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);

  const [showExistingModal, setShowExistingModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  function roll() {
    onChange((current) => ({ ...current, hpRoll: rollHp() }));
  }

  async function generateImage() {
    if (generating || state.imageGenerated || !state.caracteristicasFisicas.trim()) return;
    setGenerating(true);
    setImageError(null);
    setShowGeneratedModal(true);
    try {
      const imageUrl = await generateCharacterImage(buildCharacterImagePrompt(state));
      onChange((current) => ({ ...current, imageUrl, imageGenerated: true }));
    } catch (err) {
      setImageError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function openExistingModal() {
    setUploadError(null);
    setUrlInput("");
    setUrlError(null);
    setShowExistingModal(true);
  }

  async function handleFileSelected(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const imageUrl = await uploadCharacterImage(file);
      onChange((current) => ({ ...current, imageUrl }));
      setShowExistingModal(false);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function useManualUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setUrlError("Informe um link válido começando com http:// ou https://.");
      return;
    }

    setUrlError(null);
    onChange((current) => ({ ...current, imageUrl: trimmed }));
    setUrlInput("");
    setShowExistingModal(false);
  }

  return (
    <div className="wizard-step wizard-step--identity">
      <label className="wizard-step__field">
        <span>Nome do personagem</span>
        <input
          value={state.nome}
          onChange={(event) => onChange((current) => ({ ...current, nome: event.target.value }))}
          placeholder="Como seu personagem se chama?"
        />
      </label>

      <div className="wizard-step__field">
        <span>HP inicial — role 1d20 (mínimo {HP_MINIMUM}), só vale a primeira rolagem</span>
        <div className="wizard-step__hp-roll">
          <button type="button" className="wizard-step__secondary-choice" onClick={roll} disabled={state.hpRoll !== null}>
            <Dices size={14} /> Rolar 1d20
          </button>
          {hp !== null && (
            <span className="wizard-step__hp-result">
              HP: <strong>{hp}</strong>
              {state.hpRoll !== null && state.hpRoll < HP_MINIMUM && ` (tirou ${state.hpRoll}, mínimo ${HP_MINIMUM})`}
            </span>
          )}
        </div>
      </div>

      <label className="wizard-step__field">
        <span>Personalidade</span>
        <textarea
          value={state.personalidade}
          onChange={(event) => onChange((current) => ({ ...current, personalidade: event.target.value }))}
          placeholder="Como seu personagem é? Traços marcantes, jeito de agir..."
        />
      </label>

      <div className="wizard-step__characteristics-row">
        <label className="wizard-step__field wizard-step__characteristics-field">
          <span>Características físicas</span>
          <textarea
            value={state.caracteristicasFisicas}
            onChange={(event) => onChange((current) => ({ ...current, caracteristicasFisicas: event.target.value }))}
            placeholder="Altura, cabelo, olhos, marcas..."
          />
        </label>

        <div className="wizard-step__field wizard-step__character-image">
          <span>Imagem do personagem</span>

          {state.imageUrl && <img className="wizard-step__character-image-preview" src={state.imageUrl} alt="" />}

          <button
            type="button"
            className="wizard-step__secondary-choice"
            onClick={generateImage}
            disabled={generating || state.imageGenerated || !state.caracteristicasFisicas.trim()}
            title={
              !state.caracteristicasFisicas.trim()
                ? "Preencha as características físicas primeiro"
                : state.imageGenerated
                  ? "Só dá pra gerar uma vez"
                  : undefined
            }
          >
            <ImagePlus size={14} />
            {state.imageGenerated ? "Imagem gerada" : "Gerar imagem"}
          </button>

          <button type="button" className="wizard-step__secondary-choice" onClick={openExistingModal}>
            <Images size={14} />
            Usar imagem existente
          </button>
        </div>
      </div>

      <label className="wizard-step__field">
        <span>História</span>
        <textarea
          value={state.historia}
          onChange={(event) => onChange((current) => ({ ...current, historia: event.target.value }))}
          placeholder="De onde seu personagem vem? O que trouxe ele até Hogwarts?"
        />
      </label>

      {showGeneratedModal && (
        <GeneratedImageModal
          imageUrl={state.imageUrl}
          generating={generating}
          error={imageError}
          onClose={() => setShowGeneratedModal(false)}
        />
      )}

      {showExistingModal && (
        <ExistingImageModal
          urlInput={urlInput}
          urlError={urlError}
          uploading={uploading}
          uploadError={uploadError}
          onUrlChange={(value) => {
            setUrlInput(value);
            setUrlError(null);
          }}
          onUrlSubmit={useManualUrl}
          onFileSelected={handleFileSelected}
          onClose={() => setShowExistingModal(false)}
        />
      )}
    </div>
  );
}
