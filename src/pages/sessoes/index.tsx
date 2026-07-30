// src/pages/sessoes/index.tsx
import { useEffect, useState } from "react";
import { getAllCampaigns } from "@/actions/get/campaigns";
import { useCharacter } from "@/context/character";
import type { Campaign } from "@/utils/types";
import { groupCampaignsByYear, yearCoverImage, type YearBook } from "./functions";
import YearDetailModal from "./components/year-detail-modal";
import "./style.scss";

export default function Sessoes() {
  const { activeCharacter } = useCharacter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<YearBook | null>(null);

  useEffect(() => {
    if (!activeCharacter) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAllCampaigns(activeCharacter.id)
      .then((data) => {
        if (!cancelled) setCampaigns(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar sessões:", err);
        if (!cancelled) setError("Não foi possível carregar as sessões agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCharacter?.id]);

  const years = groupCampaignsByYear(campaigns);

  return (
    <div className="sessoes-page">
      <div className="sessoes-page__heading">
        <h1>Sessões</h1>
        <p>O histórico completo da campanha, um livro por ano letivo.</p>
      </div>

      {loading && <p className="sessoes-page__status">Carregando sessões...</p>}
      {error && <p className="sessoes-page__status sessoes-page__status--error">{error}</p>}

      {!loading && !error && years.length === 0 && (
        <p className="sessoes-page__status">Nenhuma sessão registrada ainda.</p>
      )}

      {!loading && !error && years.length > 0 && (
        <div className="sessoes-page__shelf">
          {years.map((yearBook) => {
            const sessionCount = yearBook.campaigns.reduce((total, c) => total + c.sessions.length, 0);

            return (
              <button
                key={yearBook.year}
                type="button"
                className="sessoes-page__book"
                style={{ backgroundImage: `url(${yearCoverImage(yearBook.year)})` }}
                onClick={() => setSelectedYear(yearBook)}
              >
                <span className="sessoes-page__book-shade" aria-hidden="true" />
                <span className="sessoes-page__book-title">{yearBook.year}º Ano</span>
                <span className="sessoes-page__book-subtitle">
                  {yearBook.campaigns.length} {yearBook.campaigns.length === 1 ? "campanha" : "campanhas"} •{" "}
                  {sessionCount} {sessionCount === 1 ? "sessão" : "sessões"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedYear && <YearDetailModal yearBook={selectedYear} onClose={() => setSelectedYear(null)} />}
    </div>
  );
}
