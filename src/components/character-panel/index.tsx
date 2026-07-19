import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import { useCharacter } from "@/context/character";
import { initials } from "@/utils";
import { getAttributeIcon } from "./functions";
import "./style.scss";

type NumericProgress = { atual: number; max: number };

type CharacterWithProgress = {
  hp?: NumericProgress | number;
  xp?: NumericProgress | number;
  nivel_geral?: number;
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  magia: "Magia",
  ataque: "Ataque",
  controle: "Controle",
  defesa: "Proteção",
  protecao: "Proteção",
  precisão: "Precisão",
  precisao: "Precisão",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  percepção: "Percepção",
  percepcao: "Percepção",
  coragem: "Coragem",
  carisma: "Carisma",
  resistencia: "Resistência",
  sorte: "Sorte",
};

function progressValue(
  value: NumericProgress | number | undefined,
  fallback: NumericProgress,
): NumericProgress {
  if (typeof value === "number") return { atual: value, max: fallback.max };
  if (value && typeof value.atual === "number" && typeof value.max === "number") return value;
  return fallback;
}

function progressPercent(progress: NumericProgress) {
  if (progress.max <= 0) return 0;
  return Math.max(0, Math.min(100, (progress.atual / progress.max) * 100));
}

function formatAttributeLabel(key: string) {
  const normalized = key.toLocaleLowerCase("pt-BR");
  return ATTRIBUTE_LABELS[normalized] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export default function CharacterPanel() {
  const { activeCharacter, characters, selectCharacter } = useCharacter();
  const name = activeCharacter?.name ?? CURRENT_CHARACTER_STUB.nome;
  const characterProgress = activeCharacter as (typeof activeCharacter & CharacterWithProgress);
  const hp = progressValue(characterProgress?.hp, CURRENT_CHARACTER_STUB.hp);
  const xp = progressValue(characterProgress?.xp, CURRENT_CHARACTER_STUB.xp);
  const level = characterProgress?.nivel_geral ?? CURRENT_CHARACTER_STUB.nivel_geral;

  const money = {
    galeoes:
      activeCharacter?.dinheiro?.galeoes ??
      activeCharacter?.inventario?.goldens ??
      CURRENT_CHARACTER_STUB.moedas.galeoes,
    sicles:
      activeCharacter?.dinheiro?.sicles ??
      activeCharacter?.inventario?.sicles ??
      CURRENT_CHARACTER_STUB.moedas.sicles,
    nuques:
      activeCharacter?.dinheiro?.nuques ??
      activeCharacter?.inventario?.nuquens ??
      CURRENT_CHARACTER_STUB.moedas.nuques,
  };

  const fallbackAttributes: Record<string, number> = {
    Magia: CURRENT_CHARACTER_STUB.atributos.magia,
    Ataque: CURRENT_CHARACTER_STUB.atributos.ataque,
    Controle: CURRENT_CHARACTER_STUB.atributos.controle,
    Proteção: CURRENT_CHARACTER_STUB.atributos.defesa,
    Precisão: CURRENT_CHARACTER_STUB.atributos.precisao,
    Agilidade: CURRENT_CHARACTER_STUB.atributos.agilidade,
  };

  const allAttributes = Object.entries(activeCharacter?.atributos ?? fallbackAttributes)
    .filter(([, value]) => typeof value === "number");

  const attributes = allAttributes.slice(0, 6);

  const imageUrl = activeCharacter?.image_url ?? activeCharacter?.image_url_ano_1;

  return (
    <aside className="character-panel" aria-label="Ficha do personagem ativo">
      <section className="character-panel__portrait-card">
        {imageUrl ? (
          <img src={imageUrl} alt={name} />
        ) : (
          <div className="character-panel__portrait-fallback" aria-label={name}>
            {initials(name)}
          </div>
        )}
      </section>

      <section className="character-panel__sheet-card">
        <div className="character-panel__identity">
          {characters.length > 1 ? (
            <label className="character-panel__character-select">
              <span className="sr-only">Personagem ativo</span>
              <select
                value={activeCharacter?.id ?? ""}
                onChange={(event) => selectCharacter(event.target.value)}
              >
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="character-panel__name">
              {name.toUpperCase()}
              <span aria-hidden="true">▾</span>
            </div>
          )}
          <p>{activeCharacter?.casa ?? CURRENT_CHARACTER_STUB.casa} - {activeCharacter?.ano ?? CURRENT_CHARACTER_STUB.ano}º ano</p>
        </div>

        <div className="character-panel__money" aria-label="Moedas">
          <span><i className="character-panel__coin character-panel__coin--galleon">G</i>galeão {money.galeoes}</span>
          <span><i className="character-panel__coin character-panel__coin--sickle">S</i>sicles {money.sicles}</span>
          <span><i className="character-panel__coin character-panel__coin--knut">N</i>nuques {money.nuques}</span>
        </div>

        <div className="character-panel__progress-list">
          <div className="character-panel__progress">
            <div className="character-panel__progress-track">
              <div className="character-panel__progress-fill character-panel__progress-fill--hp" style={{ width: `${progressPercent(hp)}%` }} />
              <span>HP</span>
              <strong>{hp.atual}/{hp.max}</strong>
            </div>
          </div>
          <div className="character-panel__progress">
            <div className="character-panel__progress-track">
              <div className="character-panel__progress-fill character-panel__progress-fill--xp" style={{ width: `${progressPercent(xp)}%` }} />
              <span>xp</span>
              <strong>{xp.atual}/{xp.max}</strong>
            </div>
          </div>
        </div>

        <div className="character-panel__attributes">
          {attributes.map(([key, value]) => {
            const label = formatAttributeLabel(key);
            const AttributeIcon = getAttributeIcon(label);

            return (
              <div className="character-panel__attribute" key={key}>
                <span className="character-panel__attribute-icon" aria-hidden="true">
                  <AttributeIcon size={15} strokeWidth={1.7} />
                </span>
                <span className="character-panel__attribute-copy">
                  <small>{label}</small>
                  <strong>{value}</strong>
                </span>
              </div>
            );
          })}
        </div>

        <div className="character-panel__see-all-wrap">
          <button
            className="character-panel__see-all"
            type="button"
            aria-describedby="character-attributes-tooltip"
          >
            ver todos os atributos
          </button>

          <div
            className="character-panel__attributes-tooltip"
            id="character-attributes-tooltip"
            role="tooltip"
          >
            <div className="character-panel__tooltip-heading">
              <strong>Atributos</strong>
              <span>Nível {level}</span>
            </div>
            <div className="character-panel__tooltip-grid">
              {allAttributes.map(([key, value]) => {
                const label = formatAttributeLabel(key);
                const AttributeIcon = getAttributeIcon(label);

                return (
                  <div className="character-panel__tooltip-attribute" key={key}>
                    <AttributeIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
