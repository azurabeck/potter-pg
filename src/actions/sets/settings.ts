// src/actions/sets/settings.ts
// Escrita da colecao "settings" no Firestore — um documento por usuario
// (id do documento == uid). setDoc com merge cria o documento na primeira
// vez e atualiza nas seguintes, sem precisar checar se ja existe.

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { AiPrompts, AiProviderConfig } from "@/utils/types";

export async function saveAiPrompts(userId: string, aiPrompts: AiPrompts): Promise<void> {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  await setDoc(settingsRef, { aiPrompts }, { merge: true });
}

export async function saveAiProviderConfig(userId: string, aiProvider: AiProviderConfig): Promise<void> {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  await setDoc(settingsRef, { aiProvider }, { merge: true });
}
