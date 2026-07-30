// src/pages/pocoes/components/locked-slot/index.tsx
import { Lock } from "lucide-react";
import "./style.scss";

/**
 * Preenche slots vazios da grade quando ainda não existem poções
 * suficientes cadastradas no Firestore para completar a página (ver
 * calculateGridMetrics em pages/pocoes/functions.ts, que calcula
 * quantas colunas/linhas cabem no espaço disponível).
 */
export default function LockedSlot() {
  return (
    <article className="locked-slot" title="Poção bloqueada">
      <Lock size={20} />
    </article>
  );
}
