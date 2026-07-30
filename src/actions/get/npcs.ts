// src/actions/get/npcs.ts
// Leitura da colecao "npcs" — separada de "characters" (confirmado no
// console do Firebase; diferente do que uma primeira versao desta
// integracao assumiu). Sem filtro nenhum na query, igual ao projeto de
// referência: busca a colecao inteira (todo mundo, de todos os
// usuários) e quem consome filtra o que precisa client-side (ver
// getRelatedNpcs em pages/relacoes/functions.ts).

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Npc } from "@/utils/types";

export async function getNpcs(): Promise<Npc[]> {
  const npcsRef = collection(db, COLLECTIONS.NPCS);
  const snapshot = await getDocs(npcsRef);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Npc)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
}
