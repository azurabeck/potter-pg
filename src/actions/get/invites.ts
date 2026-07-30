// src/actions/get/invites.ts
// Leitura da colecao "invites" — convites pra entrar na mesa de outro
// usuario (ver actions/sets/invites.ts pra criar/responder, e a doc do
// `plataforma` pra como um convite aceito vira uma "mesa" compartilhada).
//
// `subscribeTo*` usam onSnapshot (tempo real) em vez de getDocs — sao os
// primeiros listeners em tempo real deste app; tudo o resto ainda e
// busca unica (getDoc/getDocs). Convite so e util se aparecer/mudar de
// status sem precisar de reload, entao aqui compensa a complexidade a
// mais que um listener tem sobre uma busca unica.

import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { TableInvite } from "@/utils/types";

/**
 * Escuta em tempo real os convites pendentes endereçados a esse e-mail
 * — usado pelo aviso global do app (`InviteBanner`), que precisa saber
 * de um convite novo assim que ele existe, sem esperar um reload.
 * Devolve a função de unsubscribe (chamar no cleanup do efeito).
 */
export function subscribeToPendingInvites(email: string, onChange: (invites: TableInvite[]) => void): () => void {
  const invitesRef = collection(db, COLLECTIONS.INVITES);
  const q = query(invitesRef, where("toEmail", "==", email.trim().toLowerCase()), where("status", "==", "pending"));

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TableInvite));
    },
    (error) => console.error("Erro ao escutar convites pendentes:", error)
  );
}

/**
 * Escuta em tempo real todos os convites criados por um anfitrião —
 * usado pela Plataforma (`pages/plataforma/index.tsx`) pra manter a tag
 * "(usuário convidado)"/"(convidado aceito)" do `HistoryPanel` sempre
 * atual assim que o convidado responder, sem polling.
 */
export function subscribeToHostInvites(hostUserId: string, onChange: (invites: TableInvite[]) => void): () => void {
  const invitesRef = collection(db, COLLECTIONS.INVITES);
  const q = query(invitesRef, where("hostUserId", "==", hostUserId));

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TableInvite));
    },
    (error) => console.error("Erro ao escutar convites enviados:", error)
  );
}

/**
 * Convite aceito mais recente desse e-mail, se houver — é o que decide
 * se o usuário está "sentado" na mesa de outra pessoa (ver
 * `pages/plataforma`). Busca única (não precisa reagir a mudanças depois
 * de montar: aceitar já navega direto pra Plataforma, ver
 * `components/invite-banner`). Simplificação: só uma mesa aceita conta
 * por vez, a mais recente; aceitar convites de mesas diferentes não
 * empilha.
 */
export async function getActiveTableSeat(email: string): Promise<TableInvite | null> {
  const invitesRef = collection(db, COLLECTIONS.INVITES);
  const q = query(
    invitesRef,
    where("toEmail", "==", email.trim().toLowerCase()),
    where("status", "==", "accepted"),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const first = snapshot.docs[0];
  return { id: first.id, ...first.data() } as TableInvite;
}
