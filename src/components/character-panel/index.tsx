import { useEffect, useRef, useState } from "react";
import { GripHorizontal, Pin, PinOff, User, X } from "lucide-react";
import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import { useCharacter } from "@/context/character";
import { cx, initials } from "@/utils";
import {
  formatAttributeLabel,
  getAttributeIcon,
  progressPercent,
  progressValue,
  type CharacterWithProgress,
} from "./functions";
import "./style.scss";

export default function CharacterPanel() {
  const { activeCharacter, characters, selectCharacter, sheetVisible, showSheet, hideSheet } = useCharacter();
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [attributesPinned, setAttributesPinned] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!draggingRef.current || !attributesPinned) return;

      const panelWidth = 300;
      const panelHeight = 360;
      const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
      const maxY = Math.max(8, window.innerHeight - panelHeight - 8);

      setPanelPosition({
        x: Math.min(maxX, Math.max(8, event.clientX - dragOffsetRef.current.x)),
        y: Math.min(maxY, Math.max(8, event.clientY - dragOffsetRef.current.y)),
      });
    }

    function stopDragging() {
      draggingRef.current = false;
      document.body.classList.remove("is-dragging-attributes-panel");
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      document.body.classList.remove("is-dragging-attributes-panel");
    };
  }, [attributesPinned]);

  function togglePinned() {
    if (!attributesPinned) {
      setPanelPosition({
        x: Math.max(12, window.innerWidth - 330),
        y: Math.max(12, Math.min(window.innerHeight - 390, 110)),
      });
    }
    setAttributesPinned((current) => !current);
  }

  function startDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (!attributesPinned || (event.target as HTMLElement).closest("button")) return;
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    document.body.classList.add("is-dragging-attributes-panel");
    event.preventDefault();
  }
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
    <>
      <button
        type="button"
        className="character-panel__mobile-trigger"
        onClick={showSheet}
        aria-label="Abrir ficha do personagem"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" />
        ) : (
          <span className="character-panel__mobile-trigger-fallback" aria-hidden="true">
            <User size={20} strokeWidth={1.7} />
          </span>
        )}
      </button>

      {sheetVisible && (
        <div
          className="character-panel__backdrop"
          onClick={hideSheet}
          aria-hidden="true"
        />
      )}

      <aside
        className={cx("character-panel", sheetVisible && "character-panel--open")}
        aria-label="Ficha do personagem ativo"
      >
        <button
          type="button"
          className="character-panel__close"
          onClick={hideSheet}
          aria-label="Fechar ficha do personagem"
        >
          <X size={16} />
        </button>

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
            aria-expanded={attributesOpen}
            aria-controls="character-attributes-panel"
            onClick={() => setAttributesOpen((current) => !current)}
          >
            ver todos os atributos
          </button>

          {attributesOpen && (
            <div
              className={`character-panel__attributes-popover${attributesPinned ? " character-panel__attributes-popover--pinned" : ""}`}
              id="character-attributes-panel"
              role="dialog"
              aria-modal="false"
              aria-label="Todos os atributos do personagem"
              style={attributesPinned ? { left: panelPosition.x, top: panelPosition.y } : undefined}
            >
              <div
                className="character-panel__popover-header"
                onPointerDown={startDragging}
              >
                <div className="character-panel__popover-title">
                  {attributesPinned && <GripHorizontal size={14} strokeWidth={1.7} aria-hidden="true" />}
                  <div>
                    <strong>Atributos</strong>
                    <span>Nível {level}</span>
                  </div>
                </div>

                <div className="character-panel__popover-actions">
                  <button
                    type="button"
                    onClick={togglePinned}
                    aria-label={attributesPinned ? "Desafixar painel" : "Fixar painel na tela"}
                    title={attributesPinned ? "Desafixar" : "Fixar e permitir arrastar"}
                  >
                    {attributesPinned ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttributesOpen(false)}
                    aria-label="Fechar atributos"
                    title="Fechar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="character-panel__popover-grid">
                {allAttributes.map(([key, value]) => {
                  const label = formatAttributeLabel(key);
                  const AttributeIcon = getAttributeIcon(label);

                  return (
                    <div className="character-panel__popover-attribute" key={key}>
                      <AttributeIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </section>
      </aside>
    </>
  );
}
