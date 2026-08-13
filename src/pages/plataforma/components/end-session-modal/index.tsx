import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  DoorClosed,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { EndSessionSummary, SessionRegistration } from "../../functions";
import "./style.scss";

export type EndSessionPhase = "confirm" | "loading" | "results" | "error" | null;

interface EndSessionModalProps {
  phase: EndSessionPhase;
  summaries: EndSessionSummary[];
  registration: SessionRegistration | null;
  registrationError: string | null;
  onRetryRegistration: () => void;
  endSessionError: string | null;
  onRetry: () => void;
  appliedMysterySuggestions: Set<number>;
  applyingMysteryIndex: number | null;
  onApproveMysterySuggestion: (index: number) => void;
  appliedNpcSuggestions: Set<number>;
  applyingNpcIndex: number | null;
  onApproveNpcSuggestion: (index: number) => void;
  onChooseScope: (scope: "self" | "all") => void;
  onClose: () => void;
  /** Texto pronto da história narrada até agora, pro botão "Baixar história
   * (.txt)" — `null` quando ainda não há nada narrado (botão some). Fica
   * disponível em qualquer fase, inclusive erro/loading, pra sempre dar pra
   * guardar uma cópia mesmo que o resumo da IA falhe. */
  transcript: string | null;
  transcriptFileName: string;
}

/**
 * Fluxo de encerramento de sessão: primeiro pergunta o escopo (só o
 * personagem ativo, ou a mesa inteira), depois mostra um resumo por
 * personagem — o do usuário sempre aberto, os demais em acordeão,
 * controlado inteiramente pelo pai (`pages/plataforma/index.tsx`).
 */
export default function EndSessionModal({
  phase,
  summaries,
  registration,
  registrationError,
  onRetryRegistration,
  endSessionError,
  onRetry,
  appliedMysterySuggestions,
  applyingMysteryIndex,
  onApproveMysterySuggestion,
  appliedNpcSuggestions,
  applyingNpcIndex,
  onApproveNpcSuggestion,
  onChooseScope,
  onClose,
  transcript,
  transcriptFileName,
}: EndSessionModalProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (phase === "results") setExpandedIds(new Set());
  }, [phase, summaries]);

  if (!phase) return null;

  function toggle(characterId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(characterId)) next.delete(characterId);
      else next.add(characterId);
      return next;
    });
  }

  // Baixa a história narrada como .txt direto no navegador — sem passar
  // pelo pai (não mexe em Firestore nem em nenhum outro estado), disponível
  // em qualquer fase enquanto houver `transcript`.
  function downloadTranscript() {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = transcriptFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="platform-modal" role="presentation" onMouseDown={phase === "loading" ? undefined : onClose}>
      <div
        className="platform-modal__panel platform-modal__panel--wide end-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-session-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {phase !== "loading" && (
          <button className="platform-modal__close" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        )}

        {transcript && (
          <div className="end-session-modal__toolbar">
            <button type="button" className="end-session-modal__download" onClick={downloadTranscript}>
              <Download size={14} aria-hidden="true" /> Baixar história (.txt)
            </button>
          </div>
        )}

        {phase === "confirm" && (
          <>
            <div className="platform-modal__heading">
              <DoorClosed size={20} aria-hidden="true" />
              <div>
                <h2 id="end-session-title">Encerrar sessão</h2>
                <p>Encerrar só o seu personagem, ou a mesa inteira? A IA gera um resumo separado pra cada um.</p>
              </div>
            </div>
            <div className="platform-modal__footer">
              <button type="button" className="platform-modal__secondary" onClick={() => onChooseScope("self")}>
                Só o meu personagem
              </button>
              <button type="button" className="platform-modal__primary" onClick={() => onChooseScope("all")}>
                <Users size={14} /> A mesa inteira
              </button>
            </div>
          </>
        )}

        {phase === "loading" && (
          <div className="end-session-modal__loading">
            <Loader2 size={28} className="platform-page__spinner" aria-hidden="true" />
            <p>Gerando o resumo da sessão...</p>
          </div>
        )}

        {phase === "error" && (
          <>
            <div className="platform-modal__heading">
              <AlertTriangle size={20} aria-hidden="true" />
              <div>
                <h2 id="end-session-title">Não foi possível encerrar a sessão</h2>
                <p>{endSessionError}</p>
              </div>
            </div>
            <div className="platform-modal__footer">
              <button type="button" className="platform-modal__secondary" onClick={onClose}>
                Fechar
              </button>
              <button type="button" className="platform-modal__primary" onClick={onRetry}>
                <RefreshCw size={14} /> Tentar novamente
              </button>
            </div>
          </>
        )}

        {phase === "results" && (
          <>
            <div className="platform-modal__heading">
              <DoorClosed size={20} aria-hidden="true" />
              <div>
                <h2 id="end-session-title">Resumo da sessão</h2>
                <p>Sessão encerrada. Veja o que aconteceu com cada personagem.</p>
              </div>
            </div>

            <div className="end-session-modal__list">
              {summaries.map((summary, index) => {
                const isOwn = index === 0;
                const isOpen = isOwn || expandedIds.has(summary.characterId);

                return (
                  <div key={summary.characterId} className="end-session-modal__item">
                    <button
                      type="button"
                      className="end-session-modal__item-header"
                      onClick={() => toggle(summary.characterId)}
                      aria-expanded={isOpen}
                      disabled={isOwn}
                    >
                      <span>{summary.characterName}</span>
                      {!isOwn && <ChevronDown size={14} className={isOpen ? "is-open" : ""} aria-hidden="true" />}
                    </button>
                    {isOpen && (
                      <p className="end-session-modal__item-text">
                        {summary.text ?? `${summary.characterName} não participou da sessão.`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {summaries[0]?.failed && (
              <div className="end-session-modal__registration-error">
                <p>
                  Não foi possível gerar o resumo do seu personagem — a história continua salva e a sessão dele
                  segue ativa. Feche este resumo e clique em "Encerrar" de novo quando quiser tentar mais uma vez
                  (ou use "Baixar história" acima pra guardar uma cópia).
                </p>
              </div>
            )}

            {registrationError && (
              <div className="end-session-modal__registration-error">
                <p>Não foi possível registrar a sessão na sua ficha: {registrationError}</p>
                <button type="button" onClick={onRetryRegistration}>
                  <RefreshCw size={13} /> Tentar novamente
                </button>
              </div>
            )}

            {registration && (
              <div className="end-session-modal__registration">
                <h3>
                  <Sparkles size={14} aria-hidden="true" /> Registro na sua ficha
                </h3>

                {registration.spell_mastery_updates.length === 0 &&
                  registration.potion_mastery_updates.length === 0 &&
                  registration.inventory_updates.length === 0 &&
                  !registration.money_update &&
                  registration.mystery_suggestions.length === 0 &&
                  registration.npc_links.length === 0 &&
                  registration.npc_creation_suggestions.length === 0 &&
                  registration.adversary_encounters.length === 0 &&
                  registration.pending_actions.length === 0 && (
                    <p className="end-session-modal__registration-empty">Nada pra atualizar nesta sessão.</p>
                  )}

                {registration.spell_mastery_updates.length > 0 && (
                  <ul className="end-session-modal__registration-list">
                    {registration.spell_mastery_updates.map((update) => (
                      <li key={update.spell_id}>
                        {update.spell_name}: {update.previous_xp} → {update.new_xp} XP (+{update.xp_gained})
                      </li>
                    ))}
                  </ul>
                )}

                {registration.potion_mastery_updates.length > 0 && (
                  <ul className="end-session-modal__registration-list">
                    {registration.potion_mastery_updates.map((update) => (
                      <li key={update.potion_id}>
                        {update.potion_name}: {update.previous_xp} → {update.new_xp} XP (+{update.xp_gained})
                      </li>
                    ))}
                  </ul>
                )}

                {registration.inventory_updates.length > 0 && (
                  <ul className="end-session-modal__registration-list">
                    {registration.inventory_updates.map((update, index) => (
                      <li key={`${update.item_id || update.item_name}-${index}`}>
                        {update.item_name}: {update.previous_quantity} → {update.new_quantity}
                        {update.reason ? ` (${update.reason})` : ""}
                      </li>
                    ))}
                  </ul>
                )}

                {registration.money_update && (
                  <ul className="end-session-modal__registration-list">
                    <li>
                      G {registration.money_update.previous.goldens} → {registration.money_update.updated.goldens} · S{" "}
                      {registration.money_update.previous.sicles} → {registration.money_update.updated.sicles} · N{" "}
                      {registration.money_update.previous.nuquens} → {registration.money_update.updated.nuquens}
                    </li>
                    {registration.money_update.transactions.map((transaction, index) => (
                      <li key={index}>{transaction}</li>
                    ))}
                  </ul>
                )}

                {registration.mystery_suggestions.length > 0 && (
                  <div className="end-session-modal__mysteries">
                    {registration.mystery_suggestions.map((suggestion, index) => {
                      const isApplied = appliedMysterySuggestions.has(index);
                      const isApplying = applyingMysteryIndex === index;

                      return (
                        <div key={index} className="end-session-modal__mystery-card">
                          <div className="end-session-modal__mystery-info">
                            <strong>{suggestion.mystery_name}</strong>
                            <span>{suggestion.suggested_update}</span>
                          </div>
                          <button
                            type="button"
                            className="end-session-modal__mystery-approve"
                            disabled={isApplied || isApplying}
                            onClick={() => onApproveMysterySuggestion(index)}
                          >
                            {isApplied ? (
                              <>
                                <Check size={13} aria-hidden="true" /> Aplicado
                              </>
                            ) : isApplying ? (
                              <Loader2 size={13} className="platform-page__spinner" aria-hidden="true" />
                            ) : (
                              "Aprovar"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {registration.npc_links.length > 0 && (
                  <ul className="end-session-modal__registration-list">
                    {registration.npc_links.map((link, index) => (
                      <li key={link.npc_id || index}>NPC conhecido: {link.npc_name}</li>
                    ))}
                  </ul>
                )}

                {registration.adversary_encounters.length > 0 && (
                  <ul className="end-session-modal__registration-list">
                    {registration.adversary_encounters.map((encounter, index) => (
                      <li key={`${encounter.tipo}-${encounter.id || index}`}>
                        Adversário registrado: {encounter.name} ({encounter.tipo === "enemy" ? "criatura" : "NPC"})
                      </li>
                    ))}
                  </ul>
                )}

                {registration.npc_creation_suggestions.length > 0 && (
                  <div className="end-session-modal__mysteries">
                    {registration.npc_creation_suggestions.map((suggestion, index) => {
                      const isApplied = appliedNpcSuggestions.has(index);
                      const isApplying = applyingNpcIndex === index;

                      return (
                        <div key={index} className="end-session-modal__mystery-card">
                          <div className="end-session-modal__mystery-info">
                            <strong>{suggestion.name || "NPC sem nome"}</strong>
                            <span>
                              {[suggestion.tipo, suggestion.casa, suggestion.relacao].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="end-session-modal__mystery-approve"
                            disabled={isApplied || isApplying}
                            onClick={() => onApproveNpcSuggestion(index)}
                          >
                            {isApplied ? (
                              <>
                                <Check size={13} aria-hidden="true" /> Criado
                              </>
                            ) : isApplying ? (
                              <Loader2 size={13} className="platform-page__spinner" aria-hidden="true" />
                            ) : (
                              "Aprovar"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {registration.pending_actions.length > 0 && (
                  <ul className="end-session-modal__registration-list end-session-modal__registration-list--pending">
                    {registration.pending_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="platform-modal__footer">
              <button type="button" className="platform-modal__primary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
