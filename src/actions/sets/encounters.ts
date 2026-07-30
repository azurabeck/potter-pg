// src/actions/sets/encounters.ts
// Escrita da colecao "encounters" — pedir e responder um encontro entre
// dois personagens que já estão na mesma mesa (ver utils/types.ts).

import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { EncounterStatus } from "@/utils/types";

/**
 * Devolve o id do encontro criado. `sharedCharacterId` é calculado aqui
 * (os dois characterIds ordenados e unidos por "__") — determinístico
 * dos dois lados, então tanto quem pediu quanto quem aceita chegam no
 * mesmo id sem precisar combinar antes.
 */
export async function createEncounter(
  fromUserId: string,
  fromCharacterId: string,
  fromCharacterName: string,
  toUserId: string,
  toCharacterId: string,
  toCharacterName: string,
  location: string
): Promise<string> {
  const encountersRef = collection(db, COLLECTIONS.ENCOUNTERS);
  const sharedCharacterId = [fromCharacterId, toCharacterId].sort().join("__");

  const docRef = await addDoc(encountersRef, {
    fromUserId,
    fromCharacterId,
    fromCharacterName,
    toUserId,
    toCharacterId,
    toCharacterName,
    location: location.trim(),
    status: "pending" satisfies EncounterStatus,
    sharedCharacterId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function respondToEncounter(encounterId: string, status: "accepted" | "rejected"): Promise<void> {
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
  await updateDoc(encounterRef, { status });
}
