// src/actions/sets/characters.ts
// Escrita da colecao "characters" no Firestore. Ate a primeira chamada
// de `updateCharacterAfterSession` (registro de sessao, ver
// pages/plataforma/functions.ts), essa colecao so tinha criacao — feita
// pelo wizard (pages/character-wizard). Editar uma ficha por qualquer
// outro motivo (fora do fluxo de encerrar sessao) ainda e um proximo passo.

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type {
  Character,
  CharacterHabilidade,
  CharacterInventario,
  CharacterMoney,
  CharacterPocao,
  KnownAdversary,
} from "@/utils/types";

export async function createPlayerCharacter(
  userId: string,
  character: Omit<Character, "id" | "user_id" | "character_type">
): Promise<string> {
  const charactersRef = collection(db, COLLECTIONS.CHARACTERS);
  const docRef = await addDoc(charactersRef, {
    ...character,
    user_id: userId,
    character_type: "player",
  });
  return docRef.id;
}

// So os campos que o registro de sessao (maestria de feitico/pocao,
// inventario, dinheiro, adversarios encontrados) pode mudar — nunca
// sobrescreve o resto da ficha (nome, atributos, talentos etc.), por
// isso `updateDoc` com campos especificos em vez de `setDoc`.
export interface CharacterSessionUpdate {
  habilidades: Record<string, CharacterHabilidade>;
  pocoes: Record<string, CharacterPocao>;
  inventario: CharacterInventario;
  dinheiro: CharacterMoney;
  adversarios_conhecidos: KnownAdversary[];
}

export async function updateCharacterAfterSession(
  characterId: string,
  updates: CharacterSessionUpdate
): Promise<void> {
  const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
  await updateDoc(characterRef, { ...updates });
}

/** Salva a foto do bichinho (pages/personagens) — único campo alterado, direto do modal de imagem em tela cheia. */
export async function updateCharacterPetUrl(characterId: string, petUrl: string): Promise<void> {
  const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
  await updateDoc(characterRef, { pet_url: petUrl });
}
