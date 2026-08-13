// src/actions/get/group-session.ts
// Leitura da colecao "group_sessions" — ver actions/sets/group-session.ts
// pra criar/encerrar, e utils/types.ts (GroupSession) pro formato.

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { GroupSession } from "@/utils/types";

/**
 * Escuta em tempo real se a mesa (`hostUserId`) tem uma sessão em grupo
 * ativa agora — `null` quando não há nenhuma (documento apagado ao
 * encerrar, ver `endGroupSession`). Mesmo `hostUserId` usado por
 * `subscribeToTable`/`tableCharacters` (o próprio, ou o de quem convidou,
 * se for convidado).
 */
export function subscribeToGroupSession(
  hostUserId: string,
  onChange: (groupSession: GroupSession | null) => void
): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.GROUP_SESSIONS, hostUserId),
    (snapshot) => {
      onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as GroupSession) : null);
    },
    (error) => console.error("Erro ao escutar a sessão em grupo:", error)
  );
}
