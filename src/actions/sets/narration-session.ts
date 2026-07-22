// src/actions/sets/narration-session.ts
// Escrita da colecao "narration_sessions" — salva o estado da sessao de
// narracao em andamento (as falas do feed) toda vez que a IA termina de
// responder, pra sobreviver a fechar o navegador ou trocar de aparelho.
// setDoc sem merge: a lista de mensagens salva sempre substitui a
// anterior por inteiro, ja que `messages` representa o feed inteiro num
// dado momento, nao um incremento.

import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { NarrationMessage } from "@/utils/types";

export async function saveNarrationSession(characterId: string, messages: NarrationMessage[]): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.NARRATION_SESSIONS, characterId);
  await setDoc(sessionRef, { characterId, messages, updatedAt: serverTimestamp() });
}

/** Encerra a sessão (botão stop): apaga o documento salvo do personagem. */
export async function clearNarrationSession(characterId: string): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.NARRATION_SESSIONS, characterId);
  await deleteDoc(sessionRef);
}
