import { useEffect, useRef, useState } from "react";
import { Crown, Footprints, GripHorizontal, Pin, PinOff, RefreshCw, User, UserMinus, X } from "lucide-react";
import { CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import { useCharacter } from "@/context/character";
import { recalculateHousePoints, syncTableMembers } from "@/actions/sets/table";
import { cx, formatAttributeLabel, getAttributeIcon, initials, resolveCharacterMoney } from "@/utils";
import { progressPercent, progressValue, type CharacterWithProgress } from "./functions";
import "./style.scss";

export default function CharacterPanel() {
  const {
    activeCharacter,
    characters,
    selectCharacter,
    sheetVisible,
    showSheet,
    hideSheet,
    tableCharacters,
    hostUserId,
    guestSeat,
    debugOwnerOverride,
    setDebugOwnerOverride,
    setEncounterTarget,
    isUserOnline,
  } = useCharacter();
  // TEMP DEBUG — dono DE VERDADE (ignora `debugOwnerOverride`), só pra
  // decidir quem enxerga o seletor abaixo. Se usasse o `isTableOwner` do
  // contexto (que o override altera), escolher "outra pessoa" no menu
  // faria o próprio botão sumir e travaria o teste sem como voltar.
  const isRealTableOwner = !guestSeat;
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [attributesPinned, setAttributesPinned] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const [syncingTable, setSyncingTable] = useState(false);
  const [syncTableError, setSyncTableError] = useState<string | null>(null);
  // TEMP DEBUG — ver DEBUG_OWNER_OVERRIDE_STORAGE_KEY em context/character.
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!draggingRef.current || !attributesPinned) return;

      const panelWidth = 375;
      const panelHeight = 450;
      const maxX = Math.max(10, window.innerWidth - panelWidth - 10);
      const maxY = Math.max(10, window.innerHeight - panelHeight - 10);

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
        x: Math.max(15, window.innerWidth - 412.5),
        y: Math.max(15, Math.min(window.innerHeight - 487.5, 137.5)),
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

  const resolvedMoney = resolveCharacterMoney(activeCharacter);
  const money = {
    galeoes: resolvedMoney?.galeoes ?? CURRENT_CHARACTER_STUB.moedas.galeoes,
    sicles: resolvedMoney?.sicles ?? CURRENT_CHARACTER_STUB.moedas.sicles,
    nuques: resolvedMoney?.nuques ?? CURRENT_CHARACTER_STUB.moedas.nuques,
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

  // Quem está nesta mesa (você + quem mais estiver sentado) — usado tanto
  // pelo refresh de `players`/`housePoints` abaixo quanto pelo seletor
  // temporário de dono da mesa.
  const tableRoster = [...(activeCharacter ? [activeCharacter] : []), ...tableCharacters];

  // Conserta mesas que ficaram sem `players` populado (bug antigo: só
  // `addHousePoints` inseria alguém lá, então quem nunca ganhou ponto
  // ficava de fora do documento mesmo já estando na mesa) e recalcula
  // `housePoints` (placar geral) do zero a partir de `players` — cobre
  // tanto mesas criadas antes desse campo existir quanto qualquer
  // divergência que apareça por algum motivo.
  async function handleRefreshTable() {
    if (!hostUserId || syncingTable) return;
    setSyncingTable(true);
    setSyncTableError(null);
    try {
      const characterIds = tableRoster.map((character) => character.id);
      const houseByCharacterId = Object.fromEntries(tableRoster.map((character) => [character.id, character.casa]));

      await syncTableMembers(hostUserId, characterIds);
      await recalculateHousePoints(hostUserId, houseByCharacterId);
    } catch (err) {
      setSyncTableError((err as Error).message);
    } finally {
      setSyncingTable(false);
    }
  }

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
        {hostUserId && (
          <button
            type="button"
            className={cx("character-panel__refresh-table", syncTableError && "character-panel__refresh-table--error")}
            onClick={handleRefreshTable}
            disabled={syncingTable}
            aria-label="Atualizar jogadores da mesa"
            title={syncTableError ?? "Atualizar jogadores da mesa (conserta quem ficou de fora)"}
          >
            <RefreshCw size={13} strokeWidth={1.8} className={syncingTable ? "character-panel__refresh-table-spinner" : undefined} />
          </button>
        )}
        {/* TEMP DEBUG — remover junto com debugOwnerOverride/setDebugOwnerOverride
            (context/character) quando não precisar mais simular ser/não-ser o
            dono da mesa sem uma segunda conta de verdade. Só o dono DE VERDADE
            enxerga o botão — um convidado não deveria nem saber que esse
            seletor existe. */}
        {hostUserId && isRealTableOwner && (
          <div className="character-panel__owner-picker">
            <button
              type="button"
              className={cx("character-panel__owner-picker-trigger", debugOwnerOverride && "character-panel__owner-picker-trigger--active")}
              onClick={() => setOwnerPickerOpen((current) => !current)}
              aria-label="Selecionar dono da mesa (temporário, pra teste)"
              title="TEMP: selecionar dono da mesa pra testar permissões"
            >
              <Crown size={13} strokeWidth={1.8} />
            </button>
            {ownerPickerOpen && (
              <div className="character-panel__owner-picker-menu" role="menu">
                <button
                  type="button"
                  className={cx("character-panel__owner-picker-option", debugOwnerOverride === null && "is-active")}
                  onClick={() => {
                    setDebugOwnerOverride(null);
                    setOwnerPickerOpen(false);
                  }}
                >
                  Usar real
                </button>
                {tableRoster
                  .filter((character) => character.user_id)
                  .map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      className={cx(
                        "character-panel__owner-picker-option",
                        debugOwnerOverride === character.user_id && "is-active"
                      )}
                      onClick={() => {
                        setDebugOwnerOverride(character.user_id as string);
                        setOwnerPickerOpen(false);
                      }}
                    >
                      {character.name || "Sem nome"}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
        {tableCharacters.length > 0 ? (
          <ul className="character-panel__roster" aria-label="Personagens na mesa">
            {[...(activeCharacter ? [activeCharacter] : []), ...tableCharacters].map((character) => {
              const isSelf = character.id === activeCharacter?.id;
              const rosterImage = character.image_url ?? character.image_url_ano_1;

              return (
                <li key={character.id} className="character-panel__roster-item">
                  <div className="character-panel__roster-portrait">
                    {rosterImage ? (
                      <img src={rosterImage} alt="" />
                    ) : (
                      <span className="character-panel__roster-fallback" aria-hidden="true">
                        {initials(character.name)}
                      </span>
                    )}
                    <span
                      className={cx(
                        "character-panel__roster-status",
                        isUserOnline(character.user_id) && "character-panel__roster-status--online"
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="character-panel__roster-name">{character.name}</span>
                  {!isSelf && (
                    <div className="character-panel__roster-actions">
                      <button
                        type="button"
                        className="character-panel__roster-remove"
                        aria-label={`Remover ${character.name} da mesa`}
                        title="Remover da mesa"
                      >
                        <UserMinus size={12} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="character-panel__roster-goto"
                        aria-label={`Ir até ${character.name}`}
                        title="Ir até"
                        onClick={() => setEncounterTarget(character)}
                      >
                        <Footprints size={12} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : imageUrl ? (
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
