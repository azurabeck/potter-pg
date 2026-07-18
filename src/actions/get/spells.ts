// src/actions/get/spells.ts
// Toda leitura da colecao "spells" no Firestore passa por aqui.
// Pages/components nunca devem chamar o Firestore diretamente.

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Spell } from "@/utils/types";

/**
 * Busca todos os feiticos cadastrados na colecao `spells`.
 * Ordena por ano_letivo para acompanhar a progressao mostrada na UI.
 */
export async function getSpells(): Promise<Spell[]> {
  const spellsRef = collection(db, COLLECTIONS.SPELLS);
  const q = query(spellsRef, orderBy("attributes.ano_letivo", "asc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id ?? doc.id,
      type: data.type,
      attributes: data.attributes,
    } as Spell;
  });
}

/** Busca um unico feitico pelo id do documento. */
export async function getSpellById(): Promise<Spell | null> {
  // TODO: implementar com getDoc(doc(db, COLLECTIONS.SPELLS, id)) quando
  // a tela de detalhe do feitico for construida.
  return null;
}
