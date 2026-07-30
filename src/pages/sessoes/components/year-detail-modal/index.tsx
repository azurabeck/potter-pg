// src/pages/sessoes/components/year-detail-modal/index.tsx
import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cx } from "@/utils";
import type { Campaign } from "@/utils/types";
import { sortedSessions, yearCoverImage, type YearBook } from "../../functions";
import "./style.scss";

interface YearDetailModalProps {
  yearBook: YearBook;
  onClose: () => void;
}

export default function YearDetailModal({ yearBook, onClose }: YearDetailModalProps) {
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(
    yearBook.campaigns[0]?.id ?? null
  );

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="year-detail-modal" onClick={onClose}>
      <div className="year-detail-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div
          className="year-detail-modal__banner"
          style={{ backgroundImage: `url(${yearCoverImage(yearBook.year)})` }}
        >
          <span className="year-detail-modal__banner-shade" aria-hidden="true" />
          <button type="button" className="year-detail-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
          <h2>{yearBook.year}º Ano</h2>
        </div>

        <div className="year-detail-modal__body">
          {yearBook.campaigns.length === 0 ? (
            <p className="year-detail-modal__empty">Nenhuma campanha registrada nesse ano.</p>
          ) : (
            yearBook.campaigns.map((campaign) => (
              <CampaignSection
                key={campaign.id}
                campaign={campaign}
                isOpen={expandedCampaignId === campaign.id}
                onToggle={() =>
                  setExpandedCampaignId((current) => (current === campaign.id ? null : campaign.id))
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignSection({
  campaign,
  isOpen,
  onToggle,
}: {
  campaign: Campaign;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sessions = sortedSessions(campaign);

  return (
    <section className="year-detail-modal__campaign">
      <button
        type="button"
        className="year-detail-modal__campaign-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>
          Campanha {campaign.order} — {campaign.campaign_name}
        </span>
        <ChevronDown size={14} className={cx(isOpen && "is-open")} aria-hidden="true" />
      </button>

      {isOpen && (
        <ol className="year-detail-modal__sessions">
          {sessions.length === 0 ? (
            <li className="year-detail-modal__empty">Nenhuma sessão registrada nessa campanha.</li>
          ) : (
            sessions.map((session, index) => (
              <li key={index} className="year-detail-modal__session">
                <div className="year-detail-modal__session-header">
                  <strong>
                    {session.order}. {session.event}
                  </strong>
                  {session.date && <span>{session.date}</span>}
                </div>
                <p className="year-detail-modal__session-meta">
                  {session.local || "Local não registrado"}
                  {session.characters.length > 0 && <> • {session.characters.join(", ")}</>}
                </p>
              </li>
            ))
          )}
        </ol>
      )}
    </section>
  );
}
