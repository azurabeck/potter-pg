// src/pages/personagens/index.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { updateCharacterPetUrl } from "@/actions/sets/characters";
import { subscribeToTable } from "@/actions/get/table";
import type { Table } from "@/utils/types";
import { cx, initials } from "@/utils";
import HouseCup from "./components/house-cup";
import PetModal from "./components/pet-modal";
import {
  DEFAULT_PET_IMAGE,
  HOUSE_BACKGROUNDS,
  HOUSE_CRESTS,
  buildHouseCupStandings,
  buildWandLabel,
  getAnimalBonusLabel,
  getCarouselWindow,
  getCoreCardImage,
  getWandCardImage,
  portraitOf,
} from "./functions";
import "./style.scss";

function TextBlock({ title, value }: { title: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <section className="personagens-page__text-block">
      <h2>{title}</h2>
      <p>{value}</p>
    </section>
  );
}

export default function Personagens() {
  const { user } = useAuth();
  const { activeCharacter, tableCharacters, guestSeat, loading, refreshCharacters } = useCharacter();
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [table, setTable] = useState<Table | null>(null);

  // Todos os jogadores da mesa (você + quem mais estiver sentado, mesmo
  // offline — ver doc.md) — não é a lista de personagens do usuário, é o
  // roster de quem está jogando junto agora.
  const roster = useMemo(
    () => (activeCharacter ? [activeCharacter, ...tableCharacters] : []),
    [activeCharacter, tableCharacters]
  );

  // Sempre volta pro seu próprio personagem quando ele muda (troca de
  // conta, sessão nova) — navegar pelo carrossel não deve "prender" numa
  // ficha de outro jogador que já saiu da mesa.
  useEffect(() => {
    setViewedId(activeCharacter?.id ?? null);
  }, [activeCharacter?.id]);

  // Documento da mesa (pontos de casa) — mesmo anfitrião usado pra
  // montar `tableCharacters` (ver context/character): o seu, ou o de
  // quem te convidou, se você for convidado.
  useEffect(() => {
    const hostUserId = guestSeat?.hostUserId ?? user?.uid;
    if (!hostUserId) {
      setTable(null);
      return;
    }
    return subscribeToTable(hostUserId, setTable);
  }, [guestSeat?.hostUserId, user?.uid]);

  if (loading) {
    return (
      <div className="personagens-page">
        <p className="personagens-page__status">Carregando personagem...</p>
      </div>
    );
  }

  if (!activeCharacter) {
    return (
      <div className="personagens-page">
        <p className="personagens-page__status">Nenhum personagem selecionado.</p>
      </div>
    );
  }

  const viewedCharacter = roster.find((character) => character.id === viewedId) ?? activeCharacter;
  const isOwnCharacter = viewedCharacter.id === activeCharacter.id;

  const backgroundUrl = HOUSE_BACKGROUNDS[viewedCharacter.casa];
  const crestUrl = HOUSE_CRESTS[viewedCharacter.casa];
  const wandImage = getWandCardImage(viewedCharacter.varinha?.madeira);
  const coreImage = getCoreCardImage(viewedCharacter.varinha?.miolo);
  const wandLabel = buildWandLabel(viewedCharacter.varinha);
  const animalBonus = getAnimalBonusLabel(viewedCharacter.animal);
  const petImage = viewedCharacter.pet_url || DEFAULT_PET_IMAGE;
  const carouselWindow = getCarouselWindow(roster, viewedCharacter.id);
  const activeWindowIndex = carouselWindow.findIndex((character) => character.id === viewedCharacter.id);
  const houseCupStandings = buildHouseCupStandings(table, roster);

  const heroStyle = backgroundUrl
    ? {
        backgroundImage:
          "linear-gradient(to bottom, rgba(43, 37, 73, 0) 0%, rgba(43, 37, 73, 0.55) 62%, #2b2549 100%), " +
          `url(${backgroundUrl})`,
      }
    : undefined;

  async function handleSavePet(url: string) {
    if (!isOwnCharacter) return;
    await updateCharacterPetUrl(viewedCharacter.id, url);
    await refreshCharacters();
  }

  function moveCarousel(direction: -1 | 1) {
    if (roster.length <= 1) return;
    const currentIndex = roster.findIndex((character) => character.id === viewedCharacter.id);
    const nextIndex = (currentIndex + direction + roster.length) % roster.length;
    setViewedId(roster[nextIndex].id);
  }

  return (
    <div className="personagens-page">
      <header className="personagens-page__hero" style={heroStyle}>
        {crestUrl && <img className="personagens-page__crest" src={crestUrl} alt={viewedCharacter.casa} />}

        <div className="personagens-page__identity">
          <h1>{viewedCharacter.name || "Personagem sem nome"}</h1>
          <span className="personagens-page__house-pill">
            {viewedCharacter.casa || "-"} · {viewedCharacter.ano}º ano
          </span>
        </div>
      </header>

      <div className="personagens-page__body">
        <div className="personagens-page__content">
          <TextBlock title="Características" value={viewedCharacter.caracteristicas_fisicas} />
          <TextBlock title="História" value={viewedCharacter.historia} />

          <div className="personagens-page__cards-row">
            <section className="personagens-page__card-block">
              <h2>Animal</h2>
              <p className="personagens-page__card-label">
                {viewedCharacter.animal || "Nenhum"}
                {animalBonus ? ` ${animalBonus}` : ""}
              </p>
              {isOwnCharacter ? (
                <button
                  type="button"
                  className="personagens-page__pet-button"
                  onClick={() => setPetModalOpen(true)}
                  aria-label="Trocar imagem do animal de estimação"
                >
                  <img src={petImage} alt={viewedCharacter.animal || "Animal de estimação"} />
                </button>
              ) : (
                <div className="personagens-page__pet-button personagens-page__pet-button--readonly">
                  <img src={petImage} alt={viewedCharacter.animal || "Animal de estimação"} />
                </div>
              )}
            </section>

            <section className="personagens-page__card-block personagens-page__card-block--wand">
              <h2>Varinha</h2>
              {wandLabel && <p className="personagens-page__card-label">{wandLabel}</p>}
              <div className="personagens-page__wand-images">
                {wandImage ? (
                  <img src={wandImage} alt={viewedCharacter.varinha?.madeira || "Madeira"} />
                ) : (
                  <div className="personagens-page__wand-placeholder">Sem madeira</div>
                )}
                {coreImage ? (
                  <img src={coreImage} alt={viewedCharacter.varinha?.miolo || "Núcleo"} />
                ) : (
                  <div className="personagens-page__wand-placeholder">Sem núcleo</div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="personagens-page__side">
          <HouseCup standings={houseCupStandings} />
        </div>
      </div>

      {roster.length > 0 && (
        <footer className="personagens-page__carousel-wrap">
          <div className="personagens-page__carousel" aria-label="Jogadores na mesa">
            {roster.length > 1 && (
              <button
                type="button"
                className="personagens-page__carousel-arrow"
                onClick={() => moveCarousel(-1)}
                aria-label="Jogador anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div className="personagens-page__carousel-track">
              {carouselWindow.map((character, index) => {
                const isActive = character.id === viewedCharacter.id;
                const distance = Math.min(Math.abs(index - activeWindowIndex), 2);
                const portrait = portraitOf(character);

                return (
                  <button
                    key={character.id}
                    type="button"
                    className={cx(
                      "personagens-page__carousel-item",
                      `personagens-page__carousel-item--d${distance}`,
                      isActive && "personagens-page__carousel-item--active"
                    )}
                    onClick={() => setViewedId(character.id)}
                    aria-current={isActive}
                    aria-label={character.name}
                  >
                    {portrait ? (
                      <img src={portrait} alt="" />
                    ) : (
                      <span className="personagens-page__carousel-fallback" aria-hidden="true">
                        {character.name ? initials(character.name) : <User size={16} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {roster.length > 1 && (
              <button
                type="button"
                className="personagens-page__carousel-arrow"
                onClick={() => moveCarousel(1)}
                aria-label="Próximo jogador"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <p className="personagens-page__carousel-name">{viewedCharacter.name}</p>
        </footer>
      )}

      {petModalOpen && isOwnCharacter && (
        <PetModal
          currentUrl={viewedCharacter.pet_url ?? ""}
          onClose={() => setPetModalOpen(false)}
          onSave={handleSavePet}
        />
      )}
    </div>
  );
}
