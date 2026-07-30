// src/actions/get/mysteries.ts
// Leitura da colecao "mysteries" — um documento por mistério, pertencente
// a um personagem (ver Mystery em utils/types.ts). Sem action de escrita
// ainda (criar/editar/marcar como resolvido é um próximo passo) — por
// enquanto a colecao só existe pra "pages/misterios" listar.

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Mystery } from "@/utils/types";

/** Busca os mistérios de um personagem. Busca única (não precisa reagir a mudanças — nada escreve na colecao ainda). */
export async function getCharacterMysteries(characterId: string): Promise<Mystery[]> {
  const mysteriesRef = collection(db, COLLECTIONS.MYSTERIES);
  const q = query(mysteriesRef, where("character_id", "==", characterId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Mystery);
}
