// src/actions/get/potions.ts
// Toda leitura da colecao "potions" no Firestore passa por aqui.
// Pages/components nunca devem chamar o Firestore diretamente.

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Potion } from "@/utils/types";

/**
 * Busca todas as poções cadastradas na coleção `potions`.
 * Ordena por ano para acompanhar a progressão mostrada na UI.
 */
export async function getPotions(): Promise<Potion[]> {
  const potionsRef = collection(db, COLLECTIONS.POTIONS);
  const q = query(potionsRef, orderBy("ano", "asc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { ...data, id: data.id ?? doc.id } as Potion;
  });
}
