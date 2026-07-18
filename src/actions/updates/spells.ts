// src/actions/updates/spells.ts
// Atualizacao de documentos existentes na colecao "spells". Ainda nao usado
// pela tela de Feiticos (somente leitura por enquanto), mas mantido aqui
// para seguir a arquitetura de actions/get, actions/sets, actions/updates.

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Spell } from "@/utils/types";

export async function updateSpell(
  id: string,
  changes: Partial<Spell["attributes"]>
): Promise<void> {
  const spellRef = doc(db, COLLECTIONS.SPELLS, id);
  await updateDoc(spellRef, { attributes: changes });
}
