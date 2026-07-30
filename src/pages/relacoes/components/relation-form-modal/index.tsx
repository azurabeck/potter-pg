// src/pages/relacoes/components/relation-form-modal/index.tsx
import { useState } from "react";
import type { Npc } from "@/utils/types";
import type { NpcInput } from "@/actions/sets/npcs";
import { ATTRIBUTE_LABELS, RELACAO_OPTIONS, TIPO_OPTIONS, getNpcAno, getNpcCampaignYear, getNpcHouse } from "../../functions";
import ModalShell from "../modal-shell";
import "./style.scss";

interface RelationFormModalProps {
  relation: Npc;
  saving: boolean;
  onSubmit: (npc: NpcInput) => void;
  onClose: () => void;
}

type FormState = {
  name: string;
  image_url: string;
  tipo: string;
  relacao: string;
  casa: string;
  ano: string;
  campaign_year: string;
  confianca: string;
  amizade: string;
  caracteristicas: string;
  personalidade: string;
  detalhes: string;
  atributos: Record<string, string>;
};

function buildInitialState(relation: Npc): FormState {
  return {
    name: relation.name ?? "",
    image_url: relation.image_url ?? "",
    tipo: relation.tipo ?? "Aluno",
    relacao: relation.relacao ?? "Conhecido",
    casa: getNpcHouse(relation),
    ano: String(getNpcAno(relation) ?? 1),
    campaign_year: getNpcCampaignYear(relation) === undefined ? "" : String(getNpcCampaignYear(relation)),
    confianca: String(relation.confianca ?? 0),
    amizade: String(relation.amizade ?? 0),
    caracteristicas: relation.caracteristicas ?? "",
    personalidade: relation.personalidade ?? "",
    detalhes: relation.detalhes ?? "",
    atributos: ATTRIBUTE_LABELS.reduce<Record<string, string>>((attributes, label) => {
      attributes[label] = String(relation.atributos?.[label] ?? 0);
      return attributes;
    }, {}),
  };
}

export default function RelationFormModal({ relation, saving, onSubmit, onClose }: RelationFormModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(relation));
  const [imageError, setImageError] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setNumber(key: keyof FormState, value: string, max = 999) {
    if (!/^\d*$/.test(value)) return;
    const numberValue = Number(value || 0);
    if (numberValue < 0 || numberValue > max) return;
    set(key, value);
  }

  function setAttribute(label: string, value: string) {
    if (!/^\d*$/.test(value)) return;
    const numberValue = Number(value || 0);
    if (numberValue < 0 || numberValue > 15) return;
    setForm((current) => ({ ...current, atributos: { ...current.atributos, [label]: value } }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return;

    const atributos = ATTRIBUTE_LABELS.reduce<Record<string, number>>((attributes, label) => {
      attributes[label] = Number(form.atributos[label] || 0);
      return attributes;
    }, {});

    onSubmit({
      name: form.name.trim(),
      image_url: form.image_url,
      tipo: form.tipo,
      relacao: form.relacao,
      casa: form.casa,
      ano: Number(form.ano || 1),
      student_year: form.campaign_year === "" ? undefined : Number(form.campaign_year),
      confianca: Number(form.confianca || 0),
      amizade: Number(form.amizade || 0),
      caracteristicas: form.caracteristicas,
      personalidade: form.personalidade,
      detalhes: form.detalhes,
      atributos,
      user_id: relation.user_id,
      relacionado: relation.relacionado,
      habilidades: relation.habilidades,
      pocoes: relation.pocoes,
    });
  }

  return (
    <ModalShell title="Editar NPC" onClose={onClose}>
      <div className="relation-form">
        <div className="relation-form__top">
          <div className="relation-form__image-preview">
            {form.image_url && !imageError ? (
              <img src={form.image_url} alt="Preview" onError={() => setImageError(true)} />
            ) : (
              <span>{form.image_url ? "Não foi possível carregar essa imagem." : "Preview da imagem"}</span>
            )}
          </div>

          <div className="relation-form__field">
            <label>Nome</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do NPC" />
          </div>

          <div className="relation-form__field">
            <label>URL da imagem</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => {
                setImageError(false);
                set("image_url", e.target.value);
              }}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="relation-form__grid">
          <div className="relation-form__field">
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {TIPO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="relation-form__field">
            <label>Relação</label>
            <select value={form.relacao} onChange={(e) => set("relacao", e.target.value)}>
              {RELACAO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="relation-form__field">
            <label>Casa</label>
            <input type="text" value={form.casa} onChange={(e) => set("casa", e.target.value)} />
          </div>

          <div className="relation-form__field">
            <label>Ano do personagem</label>
            <input type="text" value={form.ano} onChange={(e) => setNumber("ano", e.target.value, 15)} />
          </div>

          <div className="relation-form__field">
            <label>Ano da campanha</label>
            <input
              type="text"
              value={form.campaign_year}
              onChange={(e) => setNumber("campaign_year", e.target.value, 15)}
              placeholder="Ex: 2"
            />
          </div>

          <div className="relation-form__field">
            <label>Confiança</label>
            <input type="text" value={form.confianca} onChange={(e) => setNumber("confianca", e.target.value, 10)} />
          </div>

          <div className="relation-form__field">
            <label>Amizade</label>
            <input type="text" value={form.amizade} onChange={(e) => setNumber("amizade", e.target.value, 10)} />
          </div>
        </div>

        <div>
          <p className="relation-form__section-title">Atributos do NPC</p>
          <div className="relation-form__attributes-grid">
            {ATTRIBUTE_LABELS.map((label) => (
              <label key={label} className="relation-form__attribute">
                <span>{label}</span>
                <input type="text" value={form.atributos[label] ?? ""} onChange={(e) => setAttribute(label, e.target.value)} />
              </label>
            ))}
          </div>
        </div>

        <textarea
          value={form.caracteristicas}
          onChange={(e) => set("caracteristicas", e.target.value)}
          placeholder="Características físicas"
          rows={2}
        />
        <textarea
          value={form.personalidade}
          onChange={(e) => set("personalidade", e.target.value)}
          placeholder="Personalidade"
          rows={2}
        />
        <textarea value={form.detalhes} onChange={(e) => set("detalhes", e.target.value)} placeholder="Detalhes" rows={3} />

        <button type="button" className="relation-form__submit" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
          {saving ? "Salvando..." : "Salvar relação"}
        </button>
      </div>
    </ModalShell>
  );
}
