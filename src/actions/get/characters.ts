// src/actions/get/characters.ts
// Toda leitura da colecao "characters" no Firestore passa por aqui.
// Pages/components nunca devem chamar o Firestore diretamente.

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Character } from "@/utils/types";

/** Busca um personagem específico pelo id — usado pra montar o avatar de quem está "na mesa". */
export async function getCharacterById(id: string): Promise<Character | null> {
  const characterRef = doc(db, COLLECTIONS.CHARACTERS, id);
  const snapshot = await getDoc(characterRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Character;
}

/** Busca os personagens de tipo "player" pertencentes a um usuario. */
export async function getPlayerCharacters(userId: string): Promise<Character[]> {
  const charactersRef = collection(db, COLLECTIONS.CHARACTERS);
  const q = query(
    charactersRef,
    where("user_id", "==", userId),
    where("character_type", "==", "player")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Character);
}
