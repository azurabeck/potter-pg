// src/actions/sets/spells.ts
// Escrita (criacao) de documentos na colecao "spells". Ainda nao usado pela
// tela de Feiticos (somente leitura por enquanto), mas mantido aqui para
// seguir a arquitetura de actions/get, actions/sets, actions/updates.

import { addDoc, collection } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Spell } from "@/utils/types";

export async function createSpell(spell: Omit<Spell, "id">): Promise<string> {
  const spellsRef = collection(db, COLLECTIONS.SPELLS);
  const docRef = await addDoc(spellsRef, spell);
  return docRef.id;
}
