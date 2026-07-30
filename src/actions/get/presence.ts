// src/actions/get/presence.ts
// Leitura da colecao "presence" — ver actions/sets/presence.ts pra como
// o heartbeat e escrito.

import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";

// Maior que PRESENCE_HEARTBEAT_INTERVAL_MS (actions/sets/presence.ts) —
// ver o comentário lá pro porquê da folga.
export const PRESENCE_ONLINE_THRESHOLD_MS = 45_000;

/**
 * Escuta se um usuário está online: heartbeat mais recente que
 * `PRESENCE_ONLINE_THRESHOLD_MS`. Como "offline" nunca é um evento (só
 * ausência de evento), reavalia num intervalo próprio além de reagir a
 * cada snapshot novo — senão, quem fechou a aba ficaria "online" pra
 * sempre aos olhos de quem já estava com a página aberta antes disso
 * (nenhum novo `onSnapshot` dispararia pra avisar que o tempo passou).
 */
export function subscribeToUserPresence(userId: string, onChange: (online: boolean) => void): () => void {
  let lastSeenAtMs: number | null = null;

  function evaluate() {
    onChange(lastSeenAtMs !== null && Date.now() - lastSeenAtMs < PRESENCE_ONLINE_THRESHOLD_MS);
  }

  const unsubscribe = onSnapshot(
    doc(db, COLLECTIONS.PRESENCE, userId),
    (snapshot) => {
      const lastSeenAt = snapshot.data()?.lastSeenAt as Timestamp | undefined;
      lastSeenAtMs = lastSeenAt ? lastSeenAt.toMillis() : null;
      evaluate();
    },
    (error) => console.error("Erro ao escutar presença:", error)
  );

  const interval = setInterval(evaluate, 5_000);

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
}
