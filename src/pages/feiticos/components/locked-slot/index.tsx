// src/pages/feiticos/components/locked-slot/index.tsx
import { Lock } from "lucide-react";
import "./style.scss";

/**
 * Preenche slots vazios da grade quando ainda não existem feitiços
 * suficientes cadastrados no Firestore para completar a página (ver
 * calculateGridMetrics em pages/feiticos/functions.ts, que calcula
 * quantas colunas/linhas cabem no espaço disponível).
 */
export default function LockedSlot() {
  return (
    <article className="locked-slot" title="Feitiço bloqueado">
      <Lock size={20} />
    </article>
  );
}
