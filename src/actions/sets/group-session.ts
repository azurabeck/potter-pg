// src/actions/sets/group-session.ts
// Escrita da colecao "group_sessions" — sessão narrada por um humano (o
// dono da mesa) pra vários jogadores da mesa de uma vez, sem IA durante
// (só no encerramento). Ver utils/types.ts (GroupSession) pro formato e
// pages/plataforma/doc.md pro fluxo completo.

import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";

/**
 * Cria a sessão em grupo e devolve o `sharedSessionId` — os ids do
 * narrador + participantes, ordenados e unidos por "__" (determinístico,
 * mesma ideia de `Encounter.sharedCharacterId`), que todo mundo passa a
 * usar em `narration_sessions` em vez da própria sessão individual.
 */
export async function startGroupSession(
  hostUserId: string,
  narratorUserId: string,
  narratorCharacterId: string,
  participantCharacterIds: string[]
): Promise<string> {
  const sharedSessionId = [narratorCharacterId, ...participantCharacterIds].sort().join("__");

  await setDoc(doc(db, COLLECTIONS.GROUP_SESSIONS, hostUserId), {
    narratorUserId,
    narratorCharacterId,
    participantCharacterIds,
    sharedSessionId,
  });

  return sharedSessionId;
}

/** Encerra a sessão em grupo (botão Encerrar, só o narrador): apaga o documento. */
export async function endGroupSession(hostUserId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.GROUP_SESSIONS, hostUserId));
}
