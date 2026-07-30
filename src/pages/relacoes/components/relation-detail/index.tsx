// src/pages/relacoes/components/relation-detail/index.tsx
import type { Npc } from "@/utils/types";
import { getAttributeIcon } from "@/utils";
import { ATTRIBUTE_LABELS, getMainAttributes, getNpcAno, getNpcCampaignYear, getNpcHouse } from "../../functions";
import "./style.scss";

interface RelationDetailProps {
  relation: Npc | null;
}

function InfoLine({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <p className="relation-detail__info-line">
      <span>{label}:</span> {value}
    </p>
  );
}

export default function RelationDetail({ relation }: RelationDetailProps) {
  if (!relation) {
    return (
      <aside className="relation-detail relation-detail--empty">
        <p>Selecione um NPC.</p>
      </aside>
    );
  }

  const mainAttributes = getMainAttributes(relation.atributos);

  return (
    <aside className="relation-detail">
      <div className="relation-detail__image-wrap">
        {relation.image_url ? (
          <img src={relation.image_url} alt={relation.name || "NPC"} className="relation-detail__image" />
        ) : (
          <div className="relation-detail__no-image">Sem imagem</div>
        )}
      </div>

      <div className="relation-detail__content">
        <div>
          <h3 className="relation-detail__name">{relation.name || "NPC sem nome"}</h3>
          <div className="relation-detail__meta">
            <span>{relation.tipo || "-"}</span>
            <span>{getNpcHouse(relation) || "-"}</span>
            <span>Ano {getNpcAno(relation) ?? "-"}</span>
            <span>Campanha ano {getNpcCampaignYear(relation) ?? "-"}</span>
          </div>
        </div>

        <div className="relation-detail__stats">
          <InfoLine label="Relação" value={relation.relacao} />
          <InfoLine label="Amizade" value={relation.amizade ?? 0} />
          <InfoLine label="Confiança" value={relation.confianca ?? 0} />
          <InfoLine label="Principais atributos" value={mainAttributes} />
        </div>

        <div className="relation-detail__text-block">
          <InfoLine label="Características" value={relation.caracteristicas} />
          <InfoLine label="Personalidade" value={relation.personalidade} />
          <InfoLine label="Detalhes" value={relation.detalhes} />
        </div>
      </div>

      <div className="relation-detail__attributes">
        <p className="relation-detail__attributes-title">Atributos</p>
        <div className="relation-detail__attributes-grid">
          {ATTRIBUTE_LABELS.map((label) => {
            const Icon = getAttributeIcon(label);
            return (
              <span key={label} className="relation-detail__attribute">
                <Icon size={13} strokeWidth={1.7} />
                <span className="relation-detail__attribute-name">{label}</span>
                <strong>{relation.atributos?.[label] ?? 0}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
