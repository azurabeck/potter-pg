// src/actions/get/narration-session.ts
// Leitura da colecao "narration_sessions" — guarda o estado da sessao de
// narracao em andamento de um personagem (as falas do feed), pra dar pra
// retomar de onde parou ao reabrir o navegador ou trocar de aparelho, em
// vez de perder tudo ao fechar a aba. Um documento por personagem (id do
// documento == character id), nao por usuario nem por navegador — assim
// funciona de qualquer aparelho em que o dono logar.

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { NarrationMessage } from "@/utils/types";

/** Busca as falas salvas da sessao de um personagem. Sem sessao salva, retorna vazio. */
export async function getNarrationSession(characterId: string): Promise<NarrationMessage[]> {
  const sessionRef = doc(db, COLLECTIONS.NARRATION_SESSIONS, characterId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) return [];

  const messages = snapshot.data().messages;
  return Array.isArray(messages) ? messages : [];
}
