// src/actions/get/settings.ts
// Leitura da colecao "settings" no Firestore — um documento por usuario
// (id do documento == uid), guardando as configuracoes da sessao de RPG:
// os prompts de narracao da IA e qual provedor/token o usuario usa pra
// chamar essa IA direto do navegador (ver actions/ai/narrate.ts).

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import { EMPTY_AI_PROMPTS, EMPTY_AI_PROVIDER_CONFIG, type AiPrompts, type AiProviderConfig } from "@/utils/types";

/** Busca os prompts de IA salvos do usuario. Sem documento salvo, retorna vazio. */
export async function getAiPrompts(userId: string): Promise<AiPrompts> {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) return EMPTY_AI_PROMPTS;

  const data = snapshot.data();
  return { ...EMPTY_AI_PROMPTS, ...data.aiPrompts };
}

/** Busca o provedor de IA e o token do usuario. Sem documento salvo, retorna vazio. */
export async function getAiProviderConfig(userId: string): Promise<AiProviderConfig> {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) return EMPTY_AI_PROVIDER_CONFIG;

  const data = snapshot.data();
  return { ...EMPTY_AI_PROVIDER_CONFIG, ...data.aiProvider };
}
