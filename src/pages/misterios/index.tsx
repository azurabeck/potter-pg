// src/pages/misterios/index.tsx
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCharacter } from "@/context/character";
import { getCharacterMysteries } from "@/actions/get/mysteries";
import type { Mystery } from "@/utils/types";
import { CATEGORY_LABEL, CATEGORY_ORDER, groupMysteriesByCategory, mysteryDisplayName, statusModifier } from "./functions";
import "./style.scss";

export default function Misterios() {
  const { activeCharacter } = useCharacter();
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCharacter) {
      setMysteries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCharacterMysteries(activeCharacter.id)
      .then((data) => {
        if (!cancelled) setMysteries(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar mistérios:", err);
        if (!cancelled) setError("Não foi possível carregar os mistérios agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCharacter?.id]);

  const grouped = groupMysteriesByCategory(mysteries);

  return (
    <div className="misterios-page">
      <div className="misterios-page__heading">
        <h1>Mistérios</h1>
        <p>Só leitura por enquanto — quem registra e atualiza é a IA, ao encerrar a sessão.</p>
      </div>

      {loading && <p className="misterios-page__status">Carregando mistérios...</p>}
      {error && <p className="misterios-page__status misterios-page__status--error">{error}</p>}

      {!loading && !error && mysteries.length === 0 && (
        <p className="misterios-page__status">Nenhum registro encontrado.</p>
      )}

      {!loading &&
        !error &&
        mysteries.length > 0 &&
        CATEGORY_ORDER.map((category) => {
          const items = grouped[category];
          if (items.length === 0) return null;

          return (
            <section key={category} className="misterios-page__category">
              <h2>{CATEGORY_LABEL[category]}</h2>

              <ul className="misterios-page__list">
                {items.map((mystery) => {
                  const isOpen = expandedId === mystery.id;

                  return (
                    <li key={mystery.id} className="misterios-page__item">
                      <button
                        type="button"
                        className="misterios-page__item-header"
                        onClick={() => setExpandedId((current) => (current === mystery.id ? null : mystery.id))}
                        aria-expanded={isOpen}
                      >
                        <span className="misterios-page__item-name">{mysteryDisplayName(mystery)}</span>
                        {(category === "mistérios" || category === "projetos") && (
                          <span className={`misterios-page__badge misterios-page__badge--${statusModifier(mystery.status)}`}>
                            {mystery.status}
                          </span>
                        )}
                        <ChevronDown size={14} className={isOpen ? "is-open" : ""} aria-hidden="true" />
                      </button>

                      <div className="misterios-page__item-meta">
                        Ano {mystery.year || "-"}
                        {(category === "mistérios" || category === "projetos") && mystery.last_appearance && (
                          <> • Última aparição: {mystery.last_appearance}</>
                        )}
                      </div>

                      {isOpen && (
                        <div className="misterios-page__item-details">
                          {category === "proxima sessão" && (
                            <>
                              <p>{mystery.details || "Sem detalhes registrados."}</p>
                              <p className="misterios-page__flag">
                                Próxima sessão: {mystery.next_session ? "Sim" : "Não"}
                              </p>
                            </>
                          )}

                          {category === "pendencias narrador" && (
                            <>
                              <p>
                                <strong>Situação atual:</strong> {mystery.current_situation || "-"}
                              </p>
                              <p>
                                <strong>Quem pode responder:</strong> {mystery.responder || "-"}
                              </p>
                            </>
                          )}

                          {(category === "mistérios" || category === "projetos") && (
                            <>
                              {mystery.details && <p>{mystery.details}</p>}
                              {mystery.clues.length === 0 ? (
                                <p className="misterios-page__empty-clues">
                                  {category === "projetos" ? "Nenhum objetivo registrado." : "Nenhuma pista registrada."}
                                </p>
                              ) : (
                                <ol className="misterios-page__clues">
                                  {mystery.clues.map((clue, index) => (
                                    <li key={index}>
                                      <div className="misterios-page__clue-header">
                                        <span>
                                          {clue.order}. {clue.name || "Sem nome"}
                                        </span>
                                        <span className={`misterios-page__badge misterios-page__badge--${statusModifier(clue.status)}`}>
                                          {clue.status}
                                        </span>
                                      </div>
                                      {clue.question && (
                                        <p>
                                          <strong>{category === "projetos" ? "Meta:" : "Pergunta:"}</strong> {clue.question}
                                        </p>
                                      )}
                                      {clue.details && <p>{clue.details}</p>}
                                      {clue.resolution && (
                                        <p>
                                          <strong>{category === "projetos" ? "Resultado:" : "Resolução:"}</strong>{" "}
                                          {clue.resolution}
                                        </p>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
