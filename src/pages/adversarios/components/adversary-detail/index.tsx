// src/pages/adversarios/components/adversary-detail/index.tsx
import type { EnemyAttack } from "@/utils/types";
import { getAttributeIcon } from "@/utils";
import { ATTRIBUTE_LABELS, adversaryName, getDistanceLabel, getNpcAno, getNpcCampaignYear, getNpcHouse, type AdversaryItem } from "../../functions";
import "./style.scss";

interface AdversaryDetailProps {
  item: AdversaryItem | null;
}

function InfoLine({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <p className="adversary-detail__info-line">
      <span>{label}:</span> {value}
    </p>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="adversary-detail__pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AttackCard({ title, attack }: { title: string; attack: EnemyAttack | null | undefined }) {
  if (!attack || (!attack.attribute && !attack.effect && !attack.name)) return null;

  return (
    <div className="adversary-detail__attack">
      <div className="adversary-detail__attack-header">
        <span>{title}</span>
        {attack.name && <strong>{attack.name}</strong>}
      </div>
      <div className="adversary-detail__attack-stats">
        <StatPill label="Atributo" value={`${attack.attribute || "-"} +${attack.attribute_value ?? 0}`} />
        <StatPill label="Distância" value={getDistanceLabel(attack.distance)} />
      </div>
      {attack.effect && (
        <p className="adversary-detail__attack-effect">
          <span>Efeito:</span> {attack.effect}
        </p>
      )}
    </div>
  );
}

export default function AdversaryDetail({ item }: AdversaryDetailProps) {
  if (!item) {
    return (
      <aside className="adversary-detail adversary-detail--empty">
        <p>Selecione um adversário.</p>
      </aside>
    );
  }

  if (item.tipo === "enemy") {
    const enemy = item.data;

    return (
      <aside className="adversary-detail">
        <div className="adversary-detail__image-wrap">
          {enemy.image_url ? (
            <img src={enemy.image_url} alt={enemy.name || "Adversário"} className="adversary-detail__image" />
          ) : (
            <div className="adversary-detail__no-image">Sem imagem</div>
          )}
        </div>

        <div className="adversary-detail__content">
          <h3 className="adversary-detail__name">{adversaryName(item)}</h3>

          <div className="adversary-detail__pills">
            <StatPill label="Tipo" value={enemy.type || "-"} />
            <StatPill label="Dificuldade" value={enemy.difficulty || "-"} />
            <StatPill label="HP" value={enemy.hp || 0} />
            <StatPill label="Ano" value={enemy.recommended_year ? `${enemy.recommended_year}º` : "-"} />
            <StatPill label="Defesa" value={`${enemy.defense?.attribute || "-"} +${enemy.defense?.attribute_value ?? 0}`} />
            <StatPill label="Impacto" value={enemy.impact_die || "-"} />
          </div>

          <div className="adversary-detail__text-block">
            <InfoLine label="Local" value={enemy.local} />
            <InfoLine label="Características" value={enemy.caracteristicas} />
          </div>
        </div>

        <div className="adversary-detail__attacks">
          <AttackCard title="Ataque principal" attack={enemy.main_attack} />
          <AttackCard title="Ataque secundário" attack={enemy.secondary_attack} />
        </div>
      </aside>
    );
  }

  const npc = item.data;

  return (
    <aside className="adversary-detail">
      <div className="adversary-detail__image-wrap">
        {npc.image_url ? (
          <img src={npc.image_url} alt={npc.name || "NPC"} className="adversary-detail__image" />
        ) : (
          <div className="adversary-detail__no-image">Sem imagem</div>
        )}
      </div>

      <div className="adversary-detail__content">
        <h3 className="adversary-detail__name">{adversaryName(item)}</h3>
        <div className="adversary-detail__meta">
          <span>{npc.tipo || "-"}</span>
          <span>{getNpcHouse(npc) || "-"}</span>
          <span>Ano {getNpcAno(npc) ?? "-"}</span>
          <span>Campanha ano {getNpcCampaignYear(npc) ?? "-"}</span>
        </div>

        <div className="adversary-detail__text-block">
          <InfoLine label="Relação" value={npc.relacao} />
          <InfoLine label="Amizade" value={npc.amizade ?? 0} />
          <InfoLine label="Confiança" value={npc.confianca ?? 0} />
          <InfoLine label="Características" value={npc.caracteristicas} />
          <InfoLine label="Personalidade" value={npc.personalidade} />
          <InfoLine label="Detalhes" value={npc.detalhes} />
        </div>
      </div>

      <div className="adversary-detail__attributes">
        <p className="adversary-detail__attributes-title">Atributos</p>
        <div className="adversary-detail__attributes-grid">
          {ATTRIBUTE_LABELS.map((label) => {
            const Icon = getAttributeIcon(label);
            return (
              <span key={label} className="adversary-detail__attribute">
                <Icon size={13} strokeWidth={1.7} />
                <span className="adversary-detail__attribute-name">{label}</span>
                <strong>{npc.atributos?.[label] ?? 0}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
