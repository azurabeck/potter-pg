// src/actions/sets/npcs.ts
// Escrita da colecao "npcs" — usado por pages/relacoes (edição/
// exclusão manual) e pelo registro de sessão da Plataforma (vincular
// NPC já existente / criar NPC novo a partir de sugestão aprovada, ver
// pages/plataforma/functions.ts e doc do pages/relacoes).

import { addDoc, arrayUnion, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Character, Npc } from "@/utils/types";
import type { NpcCreationSuggestion } from "@/pages/plataforma/functions";

export type NpcInput = Omit<Npc, "id">;

export async function updateNpc(npcId: string, updates: Partial<NpcInput>): Promise<void> {
  const npcRef = doc(db, COLLECTIONS.NPCS, npcId);
  await updateDoc(npcRef, { ...updates });
}

export async function deleteNpc(npcId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.NPCS, npcId));
}

/** Adiciona `characterId` ao array `relacionado` do NPC, sem duplicar (`arrayUnion`) — usado tanto pela sugestão de vínculo do registro de sessão quanto (futuramente) por qualquer outro fluxo manual. */
export async function linkNpcToCharacter(npcId: string, characterId: string): Promise<void> {
  const npcRef = doc(db, COLLECTIONS.NPCS, npcId);
  await updateDoc(npcRef, { relacionado: arrayUnion(characterId) });
}

/** Cria um NPC novo a partir de uma sugestão aprovada pelo jogador — já nasce vinculado ao personagem que aprovou. `year` é uma cópia de `ano` (mesma redundância dos dados reais, ver getNpcAno em pages/relacoes/functions.ts). */
export async function createNpcFromSuggestion(character: Character, suggestion: NpcCreationSuggestion): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.NPCS), {
    ...suggestion,
    year: suggestion.ano,
    user_id: character.user_id,
    relacionado: [character.id],
    habilidades: {},
    pocoes: {},
  });
}
